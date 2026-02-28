/**
 * Prisma Seed Script
 * 
 * Populate the database with sample data for development.
 * 
 * Run this script with:
 * npx prisma db seed
 */

import { PrismaClient } from '@prisma/client'
import { randomUUID } from 'crypto'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...\n')

  // Clean existing data (optional - use with caution)
  // await prisma.siteVersion.deleteMany()
  // await prisma.site.deleteMany()
  // await prisma.tenantUser.deleteMany()
  // await prisma.tenant.deleteMany()
  // await prisma.user.deleteMany()

  // ============================================
  // Create Users
  // ============================================
  
  console.log('Creating users...')
  
  const user1 = await prisma.user.upsert({
    where: { email: 'john@example.com' },
    update: {},
    create: {
      id: randomUUID(),
      email: 'john@example.com',
      name: 'John Doe',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  })

  const user2 = await prisma.user.upsert({
    where: { email: 'jane@example.com' },
    update: {},
    create: {
      id: randomUUID(),
      email: 'jane@example.com',
      name: 'Jane Smith',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  })

  const user3 = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      id: randomUUID(),
      email: 'bob@example.com',
      name: 'Bob Johnson',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  })

  console.log(`✅ Created ${3} users\n`)

  // ============================================
  // Create Tenants
  // ============================================
  
  console.log('Creating tenants...')

  const tenant1 = await prisma.tenant.create({
    data: {
      name: 'Acme Corporation',
      slug: 'acme-corp',
      plan: 'PRO',
      tokenUsage: 5000,
      tokenLimit: 50000,
      ownerId: user1.id,
    },
  })

  const tenant2 = await prisma.tenant.create({
    data: {
      name: 'Startup Inc',
      slug: 'startup-inc',
      plan: 'STARTER',
      tokenUsage: 1000,
      tokenLimit: 20000,
      ownerId: user2.id,
    },
  })

  console.log(`✅ Created ${2} tenants\n`)

  // ============================================
  // Create Tenant Users (RBAC)
  // ============================================
  
  console.log('Creating tenant users...')

  // John owns Acme Corporation
  await prisma.tenantUser.create({
    data: {
      userId: user1.id,
      tenantId: tenant1.id,
      role: 'OWNER',
    },
  })

  // Jane is an editor at Acme Corporation
  await prisma.tenantUser.create({
    data: {
      userId: user2.id,
      tenantId: tenant1.id,
      role: 'EDITOR',
    },
  })

  // Jane owns Startup Inc
  await prisma.tenantUser.create({
    data: {
      userId: user2.id,
      tenantId: tenant2.id,
      role: 'OWNER',
    },
  })

  // Bob is an editor at Startup Inc
  await prisma.tenantUser.create({
    data: {
      userId: user3.id,
      tenantId: tenant2.id,
      role: 'EDITOR',
    },
  })

  console.log(`✅ Created ${4} tenant user relationships\n`)

  // ============================================
  // Create Sites
  // ============================================
  
  console.log('Creating sites...')

  const site1 = await prisma.site.create({
    data: {
      name: 'Acme Homepage',
      slug: 'homepage',
      description: 'Official Acme Corporation website',
      domain: 'acme.com',
      tenantId: tenant1.id,
    },
  })

  const site2 = await prisma.site.create({
    data: {
      name: 'Acme Blog',
      slug: 'blog',
      description: 'Acme Corporation blog',
      tenantId: tenant1.id,
    },
  })

  const site3 = await prisma.site.create({
    data: {
      name: 'Startup Landing',
      slug: 'landing',
      description: 'Startup Inc landing page',
      domain: 'startupinc.com',
      tenantId: tenant2.id,
    },
  })

  console.log(`✅ Created ${3} sites\n`)

  // ============================================
  // Create Site Versions
  // ============================================
  
  console.log('Creating site versions...')

  // Acme Homepage - Published version
  await prisma.siteVersion.create({
    data: {
      siteId: site1.id,
      versionNumber: 1,
      status: 'PUBLISHED',
      name: 'Initial Launch',
      publishedAt: new Date(),
      builderData: {
        pages: [
          {
            id: 'home',
            name: 'Home',
            path: '/',
            title: 'Welcome to Acme',
            sections: [
              {
                id: 'hero',
                type: 'hero',
                props: {
                  title: 'Welcome to Acme Corporation',
                  subtitle: 'Building the future',
                  ctaText: 'Get Started',
                  ctaLink: '/contact',
                },
                components: [],
              },
            ],
          },
        ],
        theme: {
          colors: {
            primary: '#007AFF',
            secondary: '#5856D6',
            accent: '#FF9500',
            background: '#FFFFFF',
            text: '#000000',
          },
          fonts: {
            heading: 'Inter',
            body: 'System UI',
          },
          spacing: {},
        },
        settings: {
          title: 'Acme Corporation',
          description: 'Official website',
        },
      },
    },
  })

  // Acme Homepage - Draft version
  await prisma.siteVersion.create({
    data: {
      siteId: site1.id,
      versionNumber: 2,
      status: 'DRAFT',
      name: 'Homepage Redesign',
      builderData: {
        pages: [],
        theme: {
          colors: {
            primary: '#007AFF',
            secondary: '#5856D6',
            accent: '#FF9500',
            background: '#FFFFFF',
            text: '#000000',
          },
          fonts: {
            heading: 'Inter',
            body: 'System UI',
          },
          spacing: {},
        },
        settings: {
          title: 'Acme Corporation - New Design',
          description: 'Redesigned website',
        },
      },
    },
  })

  // Startup Landing - Published version
  await prisma.siteVersion.create({
    data: {
      siteId: site3.id,
      versionNumber: 1,
      status: 'PUBLISHED',
      name: 'MVP Launch',
      publishedAt: new Date(),
      builderData: {
        pages: [
          {
            id: 'landing',
            name: 'Landing',
            path: '/',
            title: 'Startup Inc - Innovative Solutions',
            sections: [],
          },
        ],
        theme: {
          colors: {
            primary: '#FF6B6B',
            secondary: '#4ECDC4',
            accent: '#FFE66D',
            background: '#F7FFF7',
            text: '#1A1A1A',
          },
          fonts: {
            heading: 'Poppins',
            body: 'Roboto',
          },
          spacing: {},
        },
        settings: {
          title: 'Startup Inc',
          description: 'Innovative solutions for modern problems',
        },
      },
    },
  })

  console.log(`✅ Created ${3} site versions\n`)

  // ============================================
  // Summary
  // ============================================
  
  console.log('📊 Seed Summary:')
  console.log('================')
  console.log(`Users: ${await prisma.user.count()}`)
  console.log(`Tenants: ${await prisma.tenant.count()}`)
  console.log(`Tenant Users: ${await prisma.tenantUser.count()}`)
  console.log(`Sites: ${await prisma.site.count()}`)
  console.log(`Site Versions: ${await prisma.siteVersion.count()}`)
  console.log('\n✅ Seed completed successfully!\n')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
