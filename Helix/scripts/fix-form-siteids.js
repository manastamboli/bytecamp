/**
 * FIX FORM SITE IDS
 * Updates forms with null siteId to have a valid siteId or deletes them
 */

// Load environment variables
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixFormSiteIds() {
  console.log('🔍 Checking for forms with null siteId...\n');

  // Find all forms with null siteId
  const formsWithNullSiteId = await prisma.form.findMany({
    where: {
      siteId: null
    },
    include: {
      tenant: true
    }
  });

  console.log(`Found ${formsWithNullSiteId.length} forms with null siteId\n`);

  if (formsWithNullSiteId.length === 0) {
    console.log('✅ No forms to fix!');
    return;
  }

  for (const form of formsWithNullSiteId) {
    console.log(`\n📝 Form: ${form.name} (ID: ${form.id})`);
    
    if (form.tenantId) {
      // Try to find a site for this tenant
      const site = await prisma.site.findFirst({
        where: {
          tenantId: form.tenantId
        }
      });

      if (site) {
        console.log(`   ✅ Found site: ${site.name} (ID: ${site.id})`);
        console.log(`   🔄 Updating form to use this site...`);
        
        await prisma.form.update({
          where: { id: form.id },
          data: { siteId: site.id }
        });
        
        console.log(`   ✅ Updated successfully!`);
      } else {
        console.log(`   ⚠️  No site found for tenant: ${form.tenant?.name || form.tenantId}`);
        console.log(`   🗑️  Deleting form...`);
        
        // Delete related data first
        await prisma.formSubmission.deleteMany({
          where: { formId: form.id }
        });
        
        await prisma.formVersion.deleteMany({
          where: { formId: form.id }
        });
        
        await prisma.form.delete({
          where: { id: form.id }
        });
        
        console.log(`   ✅ Deleted successfully!`);
      }
    } else {
      console.log(`   ⚠️  Form has no tenant association`);
      console.log(`   🗑️  Deleting form...`);
      
      // Delete related data first
      await prisma.formSubmission.deleteMany({
        where: { formId: form.id }
      });
      
      await prisma.formVersion.deleteMany({
        where: { formId: form.id }
      });
      
      await prisma.form.delete({
        where: { id: form.id }
      });
      
      console.log(`   ✅ Deleted successfully!`);
    }
  }

  console.log('\n✅ All forms fixed!');
}

fixFormSiteIds()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
