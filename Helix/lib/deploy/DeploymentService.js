/**
 * DeploymentService
 *
 * Orchestrates Docker-based backend deployments per site.
 *
 * Responsibilities:
 *   1. Allocate unique host ports (backend + postgres)
 *   2. Generate project files on disk
 *   3. Run docker-compose up/down
 *   4. Track deployments in the DockerDeployment table
 *   5. Redeploy (tear down → regenerate → build up)
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const {
  generatePackageJson,
  generateServerJs,
  generateInitSql,
  generateRoutesJs,
  generateDockerfile,
  generateDockerCompose,
} = require('./generators')

// ── Base directory for all generated site backends ────────────────────────────
// Each site gets: DEPLOY_ROOT/<siteId>/backend/  + docker-compose.yml
const DEPLOY_ROOT = path.join(process.cwd(), '.docker-deployments')

/**
 * Allocate a port that isn't already used by another DockerDeployment.
 * Scans from `start` upward, skipping any ports present in `usedPorts`.
 */
function allocatePort(usedPorts, start) {
  let port = start
  while (usedPorts.has(port)) {
    port++
  }
  return port
}

/**
 * Get the set of all ports currently in use by docker deployments.
 *
 * @param {import('@prisma/client').PrismaClient} prisma
 * @returns {Promise<Set<number>>}
 */
async function getUsedPorts(prisma) {
  const deployments = await prisma.dockerDeployment.findMany({
    select: { backendPort: true, dbPort: true },
  })
  const used = new Set()
  for (const d of deployments) {
    used.add(d.backendPort)
    used.add(d.dbPort)
  }
  return used
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true })
}

function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content, 'utf-8')
}

function execCommand(cmd, cwd) {
  return execSync(cmd, {
    cwd,
    stdio: 'pipe',
    timeout: 5 * 60 * 1000, // 5 minutes
    env: { ...process.env },
  }).toString()
}

// ── Core Service ──────────────────────────────────────────────────────────────

class DeploymentService {
  /**
   * @param {import('@prisma/client').PrismaClient} prisma
   */
  constructor(prisma) {
    this.prisma = prisma
  }

  /**
   * Full deploy (or redeploy) for a site.
   *
   * @param {Object} opts
   * @param {string} opts.siteId
   * @param {Array}  [opts.tables]     — table definitions for init.sql
   * @param {Array}  [opts.routes]     — route definitions for routes.js
   * @returns {Promise<Object>} DockerDeployment record
   */
  async deploy({ siteId, tables, routes }) {
    const siteDir = path.join(DEPLOY_ROOT, siteId)
    const backendDir = path.join(siteDir, 'backend')

    // ── Check for existing deployment (redeploy flow) ─────────────────────
    const existing = await this.prisma.dockerDeployment.findUnique({
      where: { siteId },
    })

    if (existing) {
      return this._redeploy({ existing, siteDir, backendDir, tables, routes })
    }

    // ── Fresh deploy ──────────────────────────────────────────────────────
    return this._freshDeploy({ siteId, siteDir, backendDir, tables, routes })
  }

  /**
   * Stop and remove containers for a site.
   *
   * @param {string} siteId
   */
  async stop(siteId) {
    const deployment = await this.prisma.dockerDeployment.findUnique({
      where: { siteId },
    })
    if (!deployment) return

    const siteDir = path.join(DEPLOY_ROOT, siteId)

    try {
      this._composeDown(siteDir, deployment.composeProject)
    } catch (err) {
      console.error(`[deploy] Failed to stop ${siteId}:`, err.message)
    }

    await this.prisma.dockerDeployment.update({
      where: { siteId },
      data: { status: 'STOPPED' },
    })
  }

  /**
   * Remove all traces — containers, images, volumes, files, DB record.
   *
   * @param {string} siteId
   */
  async destroy(siteId) {
    const deployment = await this.prisma.dockerDeployment.findUnique({
      where: { siteId },
    })

    const siteDir = path.join(DEPLOY_ROOT, siteId)

    if (deployment) {
      try {
        this._composeDown(siteDir, deployment.composeProject, true)
      } catch {
        // best-effort
      }
      await this.prisma.dockerDeployment.delete({ where: { siteId } })
    }

    // Remove files
    if (fs.existsSync(siteDir)) {
      fs.rmSync(siteDir, { recursive: true, force: true })
    }
  }

  /**
   * Get deployment status for a site.
   *
   * @param {string} siteId
   */
  async getStatus(siteId) {
    const deployment = await this.prisma.dockerDeployment.findUnique({
      where: { siteId },
    })
    if (!deployment) return null

    // Optionally check if containers are actually running
    let containerStatus = 'UNKNOWN'
    try {
      const siteDir = path.join(DEPLOY_ROOT, siteId)
      const output = execCommand(
        `docker compose -p ${deployment.composeProject} ps --format json`,
        siteDir,
      )
      const containers = output
        .trim()
        .split('\n')
        .filter(Boolean)
        .map((line) => {
          try { return JSON.parse(line) } catch { return null }
        })
        .filter(Boolean)

      const allRunning = containers.length > 0 && containers.every((c) => c.State === 'running')
      containerStatus = allRunning ? 'RUNNING' : containers.length === 0 ? 'STOPPED' : 'PARTIAL'
    } catch {
      containerStatus = 'UNKNOWN'
    }

    return {
      ...deployment,
      containerStatus,
      backendUrl: `http://localhost:${deployment.backendPort}`,
    }
  }

  // ────────────────────────────────────────────────────────────────────────
  // Private
  // ────────────────────────────────────────────────────────────────────────

  async _freshDeploy({ siteId, siteDir, backendDir, tables, routes }) {
    // Allocate ports
    const usedPorts = await getUsedPorts(this.prisma)
    const backendPort = allocatePort(usedPorts, 6000)
    usedPorts.add(backendPort)
    const dbPort = allocatePort(usedPorts, 7000)

    const composeProject = `site-${siteId.slice(0, 8)}`

    // Create DB record early so ports are reserved
    let deployment = await this.prisma.dockerDeployment.create({
      data: {
        siteId,
        backendPort,
        dbPort,
        composeProject,
        status: 'BUILDING',
      },
    })

    try {
      // Generate files
      this._writeProjectFiles({ siteId, siteDir, backendDir, backendPort, dbPort, tables, routes })

      // Build & start containers
      const buildLog = this._composeUp(siteDir, composeProject)

      // Update status
      deployment = await this.prisma.dockerDeployment.update({
        where: { siteId },
        data: { status: 'RUNNING', buildLog },
      })

      return deployment
    } catch (err) {
      console.error(`[deploy] Build failed for ${siteId}:`, err.message)

      await this.prisma.dockerDeployment.update({
        where: { siteId },
        data: { status: 'FAILED', buildLog: err.message },
      })

      throw new Error(`Docker build failed: ${err.message}`)
    }
  }

  async _redeploy({ existing, siteDir, backendDir, tables, routes }) {
    const { siteId, backendPort, dbPort, composeProject } = existing

    // Update status to BUILDING
    await this.prisma.dockerDeployment.update({
      where: { siteId },
      data: { status: 'BUILDING', buildLog: null },
    })

    try {
      // Stop old containers
      try {
        this._composeDown(siteDir, composeProject)
      } catch {
        // May not exist yet if previous deploy failed
      }

      // Remove old backend files (keep volumes for postgres data)
      if (fs.existsSync(backendDir)) {
        fs.rmSync(backendDir, { recursive: true, force: true })
      }

      // Regenerate files
      this._writeProjectFiles({ siteId, siteDir, backendDir, backendPort, dbPort, tables, routes })

      // Build from scratch (--build forces image rebuild)
      const buildLog = this._composeUp(siteDir, composeProject)

      const deployment = await this.prisma.dockerDeployment.update({
        where: { siteId },
        data: { status: 'RUNNING', buildLog },
      })

      return deployment
    } catch (err) {
      console.error(`[deploy] Redeploy failed for ${siteId}:`, err.message)

      await this.prisma.dockerDeployment.update({
        where: { siteId },
        data: { status: 'FAILED', buildLog: err.message },
      })

      throw new Error(`Docker redeploy failed: ${err.message}`)
    }
  }

  /**
   * Write all project files to disk.
   */
  _writeProjectFiles({ siteId, siteDir, backendDir, backendPort, dbPort, tables, routes }) {
    ensureDir(backendDir)

    // Backend files
    writeFile(path.join(backendDir, 'package.json'), generatePackageJson(siteId))
    writeFile(path.join(backendDir, 'server.js'), generateServerJs())
    writeFile(path.join(backendDir, 'init.sql'), generateInitSql(tables))
    writeFile(path.join(backendDir, 'routes.js'), generateRoutesJs(routes))
    writeFile(path.join(backendDir, 'Dockerfile'), generateDockerfile())

    // docker-compose at site root
    writeFile(
      path.join(siteDir, 'docker-compose.yml'),
      generateDockerCompose({ siteId, backendPort, dbPort }),
    )
  }

  /**
   * docker compose up -d --build
   */
  _composeUp(siteDir, composeProject) {
    return execCommand(
      `docker compose -p ${composeProject} up -d --build --remove-orphans`,
      siteDir,
    )
  }

  /**
   * docker compose down
   * @param {boolean} removeVolumes — also remove named volumes
   */
  _composeDown(siteDir, composeProject, removeVolumes = false) {
    const volFlag = removeVolumes ? ' -v' : ''
    return execCommand(
      `docker compose -p ${composeProject} down --remove-orphans${volFlag}`,
      siteDir,
    )
  }
}

module.exports = DeploymentService
