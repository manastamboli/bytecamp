/**
 * Common Prisma Queries for Multi-Tenant SaaS
 * 
 * Reusable query patterns for typical operations.
 * Import these in your API routes or server actions.
 */

import prisma from './prisma.js'

// ============================================
// USER QUERIES
// ============================================

/**
 * Get user with all their tenants and roles
 */
async function getUserWithTenants(userId) {
  return await prisma.user.findUnique({
    where: { id: userId },
    include: {
      tenantUsers: {
        include: {
          tenant: true,
        },
      },
      ownedTenants: true,
    },
  })
}

/**
 * Get user by email
 */
async function getUserByEmail(email) {
  return await prisma.user.findUnique({
    where: { email },
  })
}

/**
 * Create a new user
 */
async function createUser(email, name, password) {
  return await prisma.user.create({
    data: {
      email,
      name,
      password,
    },
  })
}

// ============================================
// TENANT QUERIES
// ============================================

/**
 * Get tenant with all members and sites
 */
async function getTenantWithDetails(tenantId) {
  return await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      owner: true,
      tenantUsers: {
        include: {
          user: true,
        },
      },
      sites: {
        include: {
          versions: {
            where: { status: 'PUBLISHED' },
            orderBy: { versionNumber: 'desc' },
            take: 1,
          },
        },
      },
    },
  })
}

/**
 * Create a new tenant with owner
 */
async function createTenant(name, slug, ownerId, plan = 'FREE') {
  const tokenLimit = plan === 'FREE' ? 10000 : plan === 'STARTER' ? 50000 : plan === 'PRO' ? 200000 : 1000000

  return await prisma.tenant.create({
    data: {
      name,
      slug,
      ownerId,
      plan,
      tokenLimit,
      tenantUsers: {
        create: {
          userId: ownerId,
          role: 'OWNER',
        },
      },
    },
  })
}

/**
 * Update token usage for a tenant
 */
async function updateTokenUsage(tenantId, tokensUsed) {
  return await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      tokenUsage: {
        increment: tokensUsed,
      },
    },
  })
}

/**
 * Check if tenant has tokens available
 */
async function hasTokensAvailable(tenantId, tokensNeeded) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { tokenUsage: true, tokenLimit: true },
  })

  if (!tenant) return false
  return tenant.tokenUsage + tokensNeeded <= tenant.tokenLimit
}

// ============================================
// TENANT USER (RBAC) QUERIES
// ============================================

/**
 * Add user to tenant with role
 */
async function addUserToTenant(userId, tenantId, role = 'EDITOR') {
  return await prisma.tenantUser.create({
    data: {
      userId,
      tenantId,
      role,
    },
  })
}

/**
 * Remove user from tenant
 */
async function removeUserFromTenant(userId, tenantId) {
  return await prisma.tenantUser.delete({
    where: {
      userId_tenantId: {
        userId,
        tenantId,
      },
    },
  })
}

/**
 * Update user role in tenant
 */
async function updateUserRole(userId, tenantId, role) {
  return await prisma.tenantUser.update({
    where: {
      userId_tenantId: {
        userId,
        tenantId,
      },
    },
    data: {
      role,
    },
  })
}

/**
 * Check if user has access to tenant
 */
async function userHasAccessToTenant(userId, tenantId) {
  const access = await prisma.tenantUser.findUnique({
    where: {
      userId_tenantId: {
        userId,
        tenantId,
      },
    },
  })
  return !!access
}

/**
 * Check if user is owner of tenant
 */
async function userIsOwner(userId, tenantId) {
  const tenantUser = await prisma.tenantUser.findUnique({
    where: {
      userId_tenantId: {
        userId,
        tenantId,
      },
    },
  })
  return tenantUser?.role === 'OWNER'
}

// ============================================
// SITE QUERIES
// ============================================

/**
 * Create a new site
 */
async function createSite(tenantId, name, slug, domain) {
  return await prisma.site.create({
    data: {
      tenantId,
      name,
      slug,
      domain,
    },
  })
}

/**
 * Get site with all versions
 */
async function getSiteWithVersions(siteId) {
  return await prisma.site.findUnique({
    where: { id: siteId },
    include: {
      tenant: true,
      versions: {
        orderBy: { versionNumber: 'desc' },
      },
    },
  })
}

/**
 * Get all sites for a tenant
 */
async function getTenantSites(tenantId) {
  return await prisma.site.findMany({
    where: { tenantId },
    include: {
      versions: {
        where: { status: 'PUBLISHED' },
        orderBy: { versionNumber: 'desc' },
        take: 1,
      },
    },
  })
}

/**
 * Delete a site (with cascade)
 */
async function deleteSite(siteId) {
  return await prisma.site.delete({
    where: { id: siteId },
  })
}

// ============================================
// SITE VERSION QUERIES
// ============================================

/**
 * Create a new version
 */
async function createSiteVersion(siteId, builderData, name, status = 'DRAFT') {
  // Get the latest version number
  const latestVersion = await prisma.siteVersion.findFirst({
    where: { siteId },
    orderBy: { versionNumber: 'desc' },
    select: { versionNumber: true },
  })

  const versionNumber = (latestVersion?.versionNumber ?? 0) + 1

  return await prisma.siteVersion.create({
    data: {
      siteId,
      versionNumber,
      status,
      name,
      builderData,
      publishedAt: status === 'PUBLISHED' ? new Date() : null,
    },
  })
}

/**
 * Get published version of a site
 */
async function getPublishedVersion(siteId) {
  return await prisma.siteVersion.findFirst({
    where: {
      siteId,
      status: 'PUBLISHED',
    },
    orderBy: { versionNumber: 'desc' },
  })
}

/**
 * Get draft versions of a site
 */
async function getDraftVersions(siteId) {
  return await prisma.siteVersion.findMany({
    where: {
      siteId,
      status: 'DRAFT',
    },
    orderBy: { versionNumber: 'desc' },
  })
}

/**
 * Publish a version (and unpublish others)
 */
async function publishVersion(versionId) {
  const version = await prisma.siteVersion.findUnique({
    where: { id: versionId },
    select: { siteId: true },
  })

  if (!version) throw new Error('Version not found')

  // Use transaction to ensure atomic operation
  return await prisma.$transaction([
    // Unpublish all other versions
    prisma.siteVersion.updateMany({
      where: {
        siteId: version.siteId,
        status: 'PUBLISHED',
      },
      data: {
        status: 'DRAFT',
      },
    }),
    // Publish this version
    prisma.siteVersion.update({
      where: { id: versionId },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    }),
  ])
}

/**
 * Update version builder data
 */
async function updateVersionBuilderData(versionId, builderData) {
  return await prisma.siteVersion.update({
    where: { id: versionId },
    data: {
      builderData,
      updatedAt: new Date(),
    },
  })
}

/**
 * Duplicate a version
 */
async function duplicateVersion(versionId, newName) {
  const original = await prisma.siteVersion.findUnique({
    where: { id: versionId },
  })

  if (!original) throw new Error('Version not found')

  const latestVersion = await prisma.siteVersion.findFirst({
    where: { siteId: original.siteId },
    orderBy: { versionNumber: 'desc' },
    select: { versionNumber: true },
  })

  const versionNumber = (latestVersion?.versionNumber ?? 0) + 1

  return await prisma.siteVersion.create({
    data: {
      siteId: original.siteId,
      versionNumber,
      status: 'DRAFT',
      name: newName ?? `${original.name} (Copy)`,
      builderData: original.builderData,
    },
  })
}

/**
 * Delete a version
 */
async function deleteVersion(versionId) {
  return await prisma.siteVersion.delete({
    where: { id: versionId },
  })
}

// ============================================
// UTILITY QUERIES
// ============================================

/**
 * Get tenant stats
 */
async function getTenantStats(tenantId) {
  const [tenant, sitesCount, versionsCount, membersCount] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        tokenUsage: true,
        tokenLimit: true,
        plan: true,
      },
    }),
    prisma.site.count({
      where: { tenantId },
    }),
    prisma.siteVersion.count({
      where: {
        site: {
          tenantId,
        },
      },
    }),
    prisma.tenantUser.count({
      where: { tenantId },
    }),
  ])

  return {
    tokenUsage: tenant?.tokenUsage ?? 0,
    tokenLimit: tenant?.tokenLimit ?? 0,
    tokenPercentage: tenant ? (tenant.tokenUsage / tenant.tokenLimit) * 100 : 0,
    plan: tenant?.plan,
    sitesCount,
    versionsCount,
    membersCount,
  }
}

// ============================================
// EXPORTS
// ============================================

export {
  // User queries
  getUserWithTenants,
  getUserByEmail,
  createUser,
  
  // Tenant queries
  getTenantWithDetails,
  createTenant,
  updateTokenUsage,
  hasTokensAvailable,
  
  // Tenant User (RBAC) queries
  addUserToTenant,
  removeUserFromTenant,
  updateUserRole,
  userHasAccessToTenant,
  userIsOwner,
  
  // Site queries
  createSite,
  getSiteWithVersions,
  getTenantSites,
  deleteSite,
  
  // Site Version queries
  createSiteVersion,
  getPublishedVersion,
  getDraftVersions,
  publishVersion,
  updateVersionBuilderData,
  duplicateVersion,
  deleteVersion,
  
  // Utility queries
  getTenantStats,
}
