import {
  ACMClient,
  RequestCertificateCommand,
  DescribeCertificateCommand,
  ListCertificatesCommand,
  DeleteCertificateCommand,
} from "@aws-sdk/client-acm";

// ACM must be in us-east-1 for CloudFront
const acm = new ACMClient({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Request an SSL certificate from AWS ACM for a custom domain.
 * Uses DNS validation method.
 * 
 * @param {string} domain - Primary domain (e.g., "example.com" or "www.example.com")
 * @param {string[]} alternativeNames - Additional SANs (e.g., ["www.example.com"])
 * @returns {Promise<object>} Certificate ARN and validation records
 */
export async function requestCertificate(domain, alternativeNames = []) {
  console.log(`[ACM] Requesting certificate for: ${domain}`);

  try {
    // Build domain list (primary + alternatives, deduplicated)
    const allDomains = [domain, ...alternativeNames].filter((v, i, a) => a.indexOf(v) === i);

    console.log(`[ACM] Total domains: ${allDomains.join(", ")}`);

    const command = new RequestCertificateCommand({
      DomainName: domain,
      SubjectAlternativeNames: allDomains,
      ValidationMethod: "DNS",
      Tags: [
        {
          Key: "ManagedBy",
          Value: "SitePilot",
        },
        {
          Key: "Domain",
          Value: domain,
        },
      ],
    });

    const response = await acm.send(command);
    const certificateArn = response.CertificateArn;

    console.log(`[ACM] Certificate requested: ${certificateArn}`);

    // Wait a moment for AWS to populate validation records
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Fetch validation records
    const details = await describeCertificate(certificateArn);

    return {
      certificateArn,
      status: details.status,
      validationRecords: details.validationRecords,
    };

  } catch (error) {
    console.error("[ACM] Failed to request certificate:", error);
    throw new Error(`Certificate request failed: ${error.message}`);
  }
}

/**
 * Get details about a certificate including validation status.
 * 
 * @param {string} certificateArn - ACM certificate ARN
 * @returns {Promise<object>} Certificate details
 */
export async function describeCertificate(certificateArn) {
  try {
    const command = new DescribeCertificateCommand({
      CertificateArn: certificateArn,
    });

    const response = await acm.send(command);
    const cert = response.Certificate;

    // Extract validation records for DNS
    const validationRecords = [];

    if (cert.DomainValidationOptions) {
      for (const option of cert.DomainValidationOptions) {
        if (option.ValidationMethod === "DNS" && option.ResourceRecord) {
          validationRecords.push({
            domain: option.DomainName,
            name: option.ResourceRecord.Name,
            type: option.ResourceRecord.Type,
            value: option.ResourceRecord.Value,
            status: option.ValidationStatus,
          });
        }
      }
    }

    return {
      certificateArn: cert.CertificateArn,
      domain: cert.DomainName,
      status: cert.Status,
      validationRecords,
      issuedAt: cert.IssuedAt,
      notBefore: cert.NotBefore,
      notAfter: cert.NotAfter,
      inUseBy: cert.InUseBy || [],
    };

  } catch (error) {
    console.error("[ACM] Failed to describe certificate:", error);
    throw new Error(`Failed to fetch certificate details: ${error.message}`);
  }
}

/**
 * Check if a certificate is fully issued.
 * 
 * @param {string} certificateArn - ACM certificate ARN
 * @returns {Promise<boolean>} True if issued
 */
export async function isCertificateIssued(certificateArn) {
  try {
    const details = await describeCertificate(certificateArn);
    return details.status === "ISSUED";
  } catch (error) {
    console.error("[ACM] Failed to check certificate status:", error);
    return false;
  }
}

/**
 * Poll certificate status until it's issued or timeout.
 * Returns true if issued, false if timeout.
 * 
 * @param {string} certificateArn - ACM certificate ARN
 * @param {number} maxAttempts - Maximum polling attempts (default: 60)
 * @param {number} intervalMs - Polling interval in ms (default: 5000)
 * @returns {Promise<boolean>} True if issued within timeout
 */
export async function waitForCertificateIssued(
  certificateArn,
  maxAttempts = 60,
  intervalMs = 5000
) {
  console.log(`[ACM] Polling certificate status: ${certificateArn}`);
  console.log(`[ACM] Max attempts: ${maxAttempts}, interval: ${intervalMs}ms`);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const issued = await isCertificateIssued(certificateArn);

      if (issued) {
        console.log(`[ACM] ✓ Certificate issued after ${attempt} attempt(s)`);
        return true;
      }

      console.log(`[ACM] Attempt ${attempt}/${maxAttempts}: Still pending validation...`);

      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      }

    } catch (error) {
      console.error(`[ACM] Error during polling attempt ${attempt}:`, error);
      // Continue polling despite errors
    }
  }

  console.warn(`[ACM] Certificate not issued within timeout`);
  return false;
}

/**
 * List all certificates for the account.
 * 
 * @returns {Promise<Array>} List of certificates
 */
export async function listCertificates() {
  try {
    const command = new ListCertificatesCommand({
      CertificateStatuses: ["PENDING_VALIDATION", "ISSUED", "INACTIVE"],
    });

    const response = await acm.send(command);
    return response.CertificateSummaryList || [];

  } catch (error) {
    console.error("[ACM] Failed to list certificates:", error);
    return [];
  }
}

/**
 * Find an existing certificate for a domain.
 * Returns null if not found.
 * 
 * @param {string} domain - Domain to search for
 * @returns {Promise<object|null>} Certificate details or null
 */
export async function findCertificateByDomain(domain) {
  try {
    const certificates = await listCertificates();

    for (const cert of certificates) {
      if (cert.DomainName === domain) {
        return await describeCertificate(cert.CertificateArn);
      }
    }

    return null;

  } catch (error) {
    console.error("[ACM] Failed to find certificate:", error);
    return null;
  }
}

/**
 * Delete an SSL certificate from AWS ACM.
 * Note: Certificate must not be in use by any CloudFront distribution.
 * 
 * @param {string} certificateArn - ACM certificate ARN to delete
 * @returns {Promise<object>} Deletion result
 */
export async function deleteCertificate(certificateArn) {
  console.log(`[ACM] Deleting certificate: ${certificateArn}`);

  try {
    // First check if certificate is in use
    const details = await describeCertificate(certificateArn);

    if (details.inUseBy && details.inUseBy.length > 0) {
      console.warn(`[ACM] Certificate is in use by: ${details.inUseBy.join(", ")}`);
      throw new Error("Certificate is currently in use and cannot be deleted. Remove from CloudFront first.");
    }

    const command = new DeleteCertificateCommand({
      CertificateArn: certificateArn,
    });

    await acm.send(command);

    console.log(`[ACM] ✓ Certificate deleted successfully`);

    return {
      success: true,
      certificateArn,
      deleted: true,
    };

  } catch (error) {
    console.error("[ACM] Failed to delete certificate:", error);

    // If certificate is in use, that's expected - return a more helpful message
    if (error.message.includes("in use") || error.name === "ResourceInUseException") {
      return {
        success: false,
        certificateArn,
        deleted: false,
        reason: "Certificate is attached to CloudFront distribution",
        error: error.message,
      };
    }

    // If access denied, return gracefully - domain can still be deleted
    if (error.name === "AccessDeniedException" || error.message.includes("not authorized")) {
      console.warn("[ACM] ⚠️  Missing ACM delete permission - certificate will remain in AWS");
      return {
        success: false,
        certificateArn,
        deleted: false,
        reason: "Missing ACM delete permission (non-critical)",
        error: error.message,
      };
    }

    throw new Error(`Failed to delete certificate: ${error.message}`);
  }
}
