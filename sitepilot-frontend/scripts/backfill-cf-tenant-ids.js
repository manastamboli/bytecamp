/**
 * Migration Script: Backfill CloudFront Tenant IDs
 * 
 * This script backfills the `cfTenantId` field for existing sites
 * that were created before we started properly storing CloudFront Identifiers.
 * 
 * It fetches all tenants from CloudFront, matches them by name (slug),
 * and updates the database with the correct Identifier.
 * 
 * Usage:
 *   node scripts/backfill-cf-tenant-ids.js
 * 
 * Prerequisites:
 *   - Ensure .env file exists in project root with AWS credentials
 *   - Environment variables needed:
 *     - DATABASE_URL
 *     - AWS_ACCESS_KEY_ID
 *     - AWS_SECRET_ACCESS_KEY
 *     - CLOUDFRONT_DISTRIBUTION_ID
 *     - CLOUDFRONT_CONNECTION_GROUP_ID
 */

// Load environment variables from .env file
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from project root
config({ path: join(__dirname, '..', '.env') });

// Verify required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'CLOUDFRONT_DISTRIBUTION_ID',
  'CLOUDFRONT_CONNECTION_GROUP_ID',
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingEnvVars.forEach(varName => console.error(`   - ${varName}`));
  console.error('\nPlease ensure your .env file contains all required variables.\n');
  process.exit(1);
}

import { PrismaClient } from '@prisma/client';
import { listAllCloudFrontTenants } from '../lib/aws/cf-tenants.js';

const prisma = new PrismaClient();

async function backfillCfTenantIds() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║  CloudFront Tenant ID Backfill Migration                      ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  try {
    // Step 1: Fetch all CloudFront tenants
    console.log('[1/4] Fetching all CloudFront tenants...');
    const cloudFrontTenants = await listAllCloudFrontTenants();
    console.log(`✓ Found ${cloudFrontTenants.length} CloudFront tenant(s)\n`);

    // Create a map: tenantName -> cfTenantId
    const tenantMap = new Map();
    cloudFrontTenants.forEach(tenant => {
      if (tenant.name) {
        tenantMap.set(tenant.name, {
          id: tenant.identifier || tenant.id,
          arn: tenant.arn,
        });
        console.log(`  - ${tenant.name} -> ${tenant.identifier || tenant.id}`);
      }
    });

    console.log('');

    // Step 2: Fetch all sites from database
    console.log('[2/4] Fetching all sites from database...');
    const sites = await prisma.site.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        cfTenantId: true,
        cfTenantArn: true,
      },
    });
    console.log(`✓ Found ${sites.length} site(s) in database\n`);

    // Step 3: Identify sites missing cfTenantId
    console.log('[3/4] Identifying sites needing backfill...');
    const sitesNeedingBackfill = sites.filter(site => {
      // Need backfill if:
      // 1. cfTenantId is missing/null
      // 2. cfTenantId starts with "PLACEHOLDER-" (old placeholder format)
      // 3. cfTenantId starts with "tenant-" (old fallback format)
      return !site.cfTenantId ||
        site.cfTenantId.startsWith('PLACEHOLDER-') ||
        site.cfTenantId.startsWith('tenant-');
    });

    console.log(`✓ Found ${sitesNeedingBackfill.length} site(s) needing backfill:\n`);

    if (sitesNeedingBackfill.length === 0) {
      console.log('  No sites need backfill. All done! ✨\n');
      return;
    }

    sitesNeedingBackfill.forEach(site => {
      console.log(`  - ${site.name} (${site.slug})`);
      console.log(`    Current cfTenantId: ${site.cfTenantId || 'null'}`);
    });

    console.log('');

    // Step 4: Update sites with correct cfTenantId
    console.log('[4/4] Backfilling cfTenantId values...\n');

    let updated = 0;
    let skipped = 0;
    let failed = 0;

    for (const site of sitesNeedingBackfill) {
      const cfTenant = tenantMap.get(site.slug);

      if (cfTenant) {
        try {
          await prisma.site.update({
            where: { id: site.id },
            data: {
              cfTenantId: cfTenant.id,
              cfTenantArn: cfTenant.arn,
            },
          });
          console.log(`  ✓ Updated: ${site.name} (${site.slug})`);
          console.log(`    New cfTenantId: ${cfTenant.id}`);
          updated++;
        } catch (error) {
          console.error(`  ✗ Failed to update: ${site.name} (${site.slug})`);
          console.error(`    Error: ${error.message}`);
          failed++;
        }
      } else {
        console.warn(`  ⚠ Skipped: ${site.name} (${site.slug})`);
        console.warn(`    Reason: No matching CloudFront tenant found`);
        console.warn(`    Action: Tenant may need to be created manually`);
        skipped++;
      }
      console.log('');
    }

    // Summary
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║  Migration Complete                                            ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
    console.log(`  ✓ Updated:  ${updated}`);
    console.log(`  ⚠ Skipped:  ${skipped}`);
    console.log(`  ✗ Failed:   ${failed}`);
    console.log(`  Total:      ${sitesNeedingBackfill.length}\n`);

    if (skipped > 0) {
      console.log('⚠️  Some sites were skipped because no matching CloudFront tenant was found.');
      console.log('   These sites may need to have their CloudFront tenants created manually.\n');
    }

    if (failed > 0) {
      console.log('❌ Some updates failed. Please check the error messages above.\n');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
backfillCfTenantIds()
  .then(() => {
    console.log('Done! ✨\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
