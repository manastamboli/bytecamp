import {
  CloudFrontClient,
  GetDistributionCommand,
  UpdateDistributionCommand,
  UpdateDistributionTenantCommand,
  GetDistributionTenantCommand,
} from "@aws-sdk/client-cloudfront";

const cloudfront = new CloudFrontClient({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const CF_DISTRIBUTION_ID = process.env.CLOUDFRONT_DISTRIBUTION_ID;
const CF_CONNECTION_GROUP_ID = process.env.CLOUDFRONT_CONNECTION_GROUP_ID;

/**
 * Validate CloudFront configuration
 */
function validateCloudFrontConfig() {
  const errors = [];

  if (!CF_DISTRIBUTION_ID || CF_DISTRIBUTION_ID.trim() === '') {
    errors.push('CLOUDFRONT_DISTRIBUTION_ID is missing or empty');
  }

  if (!CF_CONNECTION_GROUP_ID || CF_CONNECTION_GROUP_ID.trim() === '') {
    errors.push('CLOUDFRONT_CONNECTION_GROUP_ID is missing or empty');
  }

  if (errors.length > 0) {
    console.error('[CloudFront] Configuration errors:', errors);
    throw new Error(`CloudFront configuration is incomplete: ${errors.join(', ')}`);
  }

  console.log('[CloudFront] Config validated:', {
    distributionId: `${CF_DISTRIBUTION_ID.substring(0, 8)}...`,
    connectionGroupId: CF_CONNECTION_GROUP_ID ? `${CF_CONNECTION_GROUP_ID.substring(0, 8)}...` : 'N/A'
  });
}

/**
 * Attach a custom domain to an existing CloudFront tenant.
 * This updates the tenant configuration to include the new domain and certificate.
 * 
 * @param {object} params
 * @param {string} params.cfTenantId - CloudFront tenant Identifier (from Site.cfTenantId)
 * @param {string} params.domain - Custom domain to attach
 * @param {string} params.certificateArn - ACM certificate ARN
 * @returns {Promise<object>} Updated tenant configuration
 */
export async function attachDomainToTenant({ cfTenantId, domain, certificateArn }) {
  console.log(`[CloudFront] Attaching domain to tenant`);
  console.log(`  Tenant Identifier: ${cfTenantId}`);
  console.log(`  Domain: ${domain}`);
  console.log(`  Certificate: ${certificateArn}`);

  try {
    // Validate configuration first
    validateCloudFrontConfig();

    // Validate input parameters
    if (!cfTenantId || cfTenantId.trim() === '') {
      throw new Error('CloudFront tenant ID (cfTenantId) is required');
    }

    if (!domain || domain.trim() === '') {
      throw new Error('Domain is required');
    }

    // Step 1: Get current tenant configuration
    console.log(`[CloudFront] Fetching tenant configuration...`);
    console.log(`[CloudFront] Using Distribution ID: ${CF_DISTRIBUTION_ID}`);
    console.log(`[CloudFront] Tenant Identifier: ${cfTenantId}`);

    const getTenantCmd = new GetDistributionTenantCommand({
      DistributionId: CF_DISTRIBUTION_ID,
      Identifier: cfTenantId, // Use CloudFront Identifier, NOT slug/name
    });

    let tenantConfig;
    let currentETag;

    try {
      const tenantResponse = await cloudfront.send(getTenantCmd);
      tenantConfig = tenantResponse.DistributionTenant;
      currentETag = tenantResponse.ETag;
      console.log(`[CloudFront] ✓ Tenant found: ${tenantConfig.Id}`);
      console.log(`[CloudFront] ETag: ${currentETag}`);

    } catch (error) {
      console.error(`[CloudFront] Error fetching tenant:`, error);
      if (error.name === "NoSuchDistributionTenant" || error.name === "NoSuchResource") {
        throw new Error(`Tenant with Identifier "${cfTenantId}" does not exist. Ensure tenant was created with valid cfTenantId.`);
      }
      throw error;
    }

    // Step 2: Add domain to tenant's domain list
    console.log(`[CloudFront] Updating tenant with new domain...`);

    const existingDomains = tenantConfig.Domains || [];
    const domainExists = existingDomains.some(d => d.Domain === domain);

    if (domainExists) {
      console.log(`[CloudFront] ℹ️  Domain already attached to tenant`);
      return {
        success: true,
        alreadyAttached: true,
        tenantId: tenantConfig.Id,
        domain,
      };
    }

    // Add new domain
    const updatedDomains = [
      ...existingDomains,
      { Domain: domain },
    ];

    // Step 3: Update tenant configuration
    const updateCmd = new UpdateDistributionTenantCommand({
      DistributionId: CF_DISTRIBUTION_ID,
      Identifier: cfTenantId,  // Use CloudFront Identifier
      DistributionTenantConfig: {
        ConnectionGroupId: tenantConfig.ConnectionGroupId,
        Domains: updatedDomains,
        // Attach certificate if provided
        Customizations: certificateArn ? {
          Certificate: {
            Arn: certificateArn,
          },
        } : tenantConfig.Customizations,
      },
      IfMatch: currentETag,
    });

    const updateResponse = await cloudfront.send(updateCmd);

    console.log(`[CloudFront] ✓ Domain attached successfully`);

    // Get connection group endpoint for CNAME instructions
    const cnameTarget = await getConnectionGroupEndpoint();

    return {
      success: true,
      tenantId: updateResponse.DistributionTenant.Id,
      domain,
      cnameTarget,
      certificateAttached: !!certificateArn,
    };

  } catch (error) {
    console.error("[CloudFront] Failed to attach domain:", error);
    throw new Error(`Failed to attach domain to CloudFront: ${error.message}`);
  }
}

/**
 * Get the CloudFront connection group endpoint for CNAME instructions.
 * 
 * @returns {Promise<string>} Connection group endpoint
 */
async function getConnectionGroupEndpoint() {
  try {
    // Validate configuration
    validateCloudFrontConfig();

    // For multi-tenant distributions, the CNAME target is the connection group endpoint
    // This is typically in the format: <connection-group-id>.cloudfront-tenants.net

    // Try to fetch from distribution configuration
    const getDistCmd = new GetDistributionCommand({
      Id: CF_DISTRIBUTION_ID,
    });

    const response = await cloudfront.send(getDistCmd);
    const distribution = response.Distribution;

    // Return the distribution domain name
    const endpoint = distribution.DomainName;

    console.log(`[CloudFront] Connection endpoint: ${endpoint}`);

    return endpoint;

  } catch (error) {
    console.error("[CloudFront] Failed to get connection endpoint:", error);

    // Fallback: construct endpoint from connection group ID
    return `${CF_CONNECTION_GROUP_ID}.cloudfront.net`;
  }
}

/**
 * Remove a custom domain from a CloudFront tenant.
 * 
 * @param {object} params
 * @param {string} params.cfTenantId - CloudFront tenant Identifier
 * @param {string} params.domain - Domain to remove
 * @returns {Promise<object>} Result
 */
export async function removeDomainFromTenant({ cfTenantId, domain }) {
  console.log(`[CloudFront] Removing domain from tenant`);
  console.log(`  Tenant Identifier: ${cfTenantId}`);
  console.log(`  Domain: ${domain}`);

  try {
    // Validate configuration
    validateCloudFrontConfig();

    // Get current tenant configuration
    const getTenantCmd = new GetDistributionTenantCommand({
      DistributionId: CF_DISTRIBUTION_ID,
      Identifier: cfTenantId,  // Use CloudFront Identifier
    });

    const tenantResponse = await cloudfront.send(getTenantCmd);
    const tenantConfig = tenantResponse.DistributionTenant;
    const currentETag = tenantResponse.ETag;

    // Filter out the domain
    const updatedDomains = (tenantConfig.Domains || []).filter(
      d => d.Domain !== domain
    );

    // Update tenant
    const updateCmd = new UpdateDistributionTenantCommand({
      DistributionId: CF_DISTRIBUTION_ID,
      Identifier: cfTenantId,  // Use CloudFront Identifier
      DistributionTenantConfig: {
        ConnectionGroupId: tenantConfig.ConnectionGroupId,
        Domains: updatedDomains,
        Customizations: tenantConfig.Customizations,
      },
      IfMatch: currentETag,
    });

    await cloudfront.send(updateCmd);

    console.log(`[CloudFront] ✓ Domain removed successfully`);

    return {
      success: true,
      tenantId: tenantConfig.Id,
      domain,
    };

  } catch (error) {
    console.error("[CloudFront] Failed to remove domain:", error);
    throw new Error(`Failed to remove domain from CloudFront: ${error.message}`);
  }
}

/**
 * List all domains attached to a tenant.
 * 
 * @param {string} cfTenantId - CloudFront tenant Identifier
 * @returns {Promise<string[]>} List of domain names
 */
export async function listTenantDomains(cfTenantId) {
  try {
    // Validate configuration
    validateCloudFrontConfig();

    const getTenantCmd = new GetDistributionTenantCommand({
      DistributionId: CF_DISTRIBUTION_ID,
      Identifier: cfTenantId,  // Use CloudFront Identifier
    });

    const response = await cloudfront.send(getTenantCmd);
    const tenantConfig = response.DistributionTenant;

    const domains = (tenantConfig.Domains || []).map(d => d.Domain);

    console.log(`[CloudFront] Tenant ${cfTenantId} has ${domains.length} domain(s)`);

    return domains;

  } catch (error) {
    console.error("[CloudFront] Failed to list tenant domains:", error);
    return [];
  }
}
