/**
 * Docker Backend Generators
 *
 * Pure functions that generate file contents for an isolated
 * Express + PostgreSQL backend per site. No side-effects.
 */

// ─── package.json ─────────────────────────────────────────────────────────────

function generatePackageJson(siteId) {
  return JSON.stringify(
    {
      name: `site-backend-${siteId}`,
      version: '1.0.0',
      private: true,
      scripts: {
        start: 'node server.js',
      },
      dependencies: {
        express: '^4.21.2',
        pg: '^8.13.1',
        cors: '^2.8.5',
        morgan: '^1.10.0',
      },
    },
    null,
    2,
  )
}

// ─── server.js ────────────────────────────────────────────────────────────────

function generateServerJs() {
  return `const express = require('express');
const { Client } = require('pg');
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ──────────────────────────────────────────────────────────
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Database ───────────────────────────────────────────────────────────
const db = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function initDatabase() {
  const maxRetries = 10;
  const retryDelay = 3000; // 3 seconds

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await db.connect();
      console.log('[db] Connected to PostgreSQL');
      break;
    } catch (err) {
      console.error(\`[db] Connection attempt \${attempt}/\${maxRetries} failed: \${err.message}\`);
      if (attempt === maxRetries) {
        console.error('[db] All connection attempts failed. Exiting.');
        process.exit(1);
      }
      await new Promise((r) => setTimeout(r, retryDelay));
    }
  }

  // Execute init.sql
  try {
    const initSql = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf-8');
    await db.query(initSql);
    console.log('[db] init.sql executed successfully');
  } catch (err) {
    console.error('[db] Failed to execute init.sql:', err.message);
    process.exit(1);
  }
}

// ── Health check ───────────────────────────────────────────────────────
app.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', uptime: process.uptime() });
  } catch {
    res.status(503).json({ status: 'error', message: 'Database unavailable' });
  }
});

// ── Register routes ────────────────────────────────────────────────────
routes(app, db);

// ── Start ──────────────────────────────────────────────────────────────
initDatabase().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(\`[server] Backend running on port \${PORT}\`);
  });
});
`
}

// ─── init.sql ─────────────────────────────────────────────────────────────────

/**
 * Generate init.sql from an array of table definitions.
 *
 * @param {Array<{name: string, columns: Array<{name: string, type: string, constraints?: string}>}>} tables
 * @returns {string} SQL statements
 */
function generateInitSql(tables) {
  if (!tables || tables.length === 0) {
    // Sensible default — a contacts table
    return `-- Auto-generated schema
-- Run on every startup (idempotent)

CREATE TABLE IF NOT EXISTS contacts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100),
  message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`
  }

  const statements = tables.map((table) => {
    const cols = table.columns
      .map((col) => {
        const constraint = col.constraints ? ` ${col.constraints}` : ''
        return `  ${col.name} ${col.type}${constraint}`
      })
      .join(',\n')
    return `CREATE TABLE IF NOT EXISTS ${table.name} (\n${cols}\n);`
  })

  return `-- Auto-generated schema\n-- Run on every startup (idempotent)\n\n${statements.join('\n\n')}\n`
}

// ─── routes.js ────────────────────────────────────────────────────────────────

/**
 * Generate routes.js from an array of route definitions.
 *
 * @param {Array<{method: string, path: string, table: string, action: string}>} routeDefs
 *   action: "insert" | "select_all" | "select_one" | "update" | "delete"
 * @returns {string}
 */
function generateRoutesJs(routeDefs) {
  if (!routeDefs || routeDefs.length === 0) {
    // Default CRUD for contacts table
    return `/**
 * Routes — auto-generated
 */
module.exports = (app, db) => {

  // Create a contact
  app.post('/api/contacts', async (req, res) => {
    try {
      const { name, email, message } = req.body;
      const result = await db.query(
        'INSERT INTO contacts (name, email, message) VALUES ($1, $2, $3) RETURNING *',
        [name, email, message]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to create contact' });
    }
  });

  // List all contacts
  app.get('/api/contacts', async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM contacts ORDER BY created_at DESC');
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch contacts' });
    }
  });

  // Get single contact
  app.get('/api/contacts/:id', async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM contacts WHERE id = $1', [req.params.id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch contact' });
    }
  });

  // Delete a contact
  app.delete('/api/contacts/:id', async (req, res) => {
    try {
      const result = await db.query('DELETE FROM contacts WHERE id = $1 RETURNING *', [req.params.id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      res.json({ deleted: result.rows[0] });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to delete contact' });
    }
  });

};
`
  }

  // ── Dynamic route generation from AI-provided definitions ───────────────
  const handlers = routeDefs.map((r) => {
    const method = (r.method || 'get').toLowerCase()
    const routePath = r.path || `/api/${r.table}`

    switch (r.action) {
      case 'insert':
        return `  // Create ${r.table}
  app.${method}('${routePath}', async (req, res) => {
    try {
      const keys = Object.keys(req.body);
      const values = Object.values(req.body);
      const placeholders = keys.map((_, i) => '$' + (i + 1)).join(', ');
      const columns = keys.join(', ');
      const result = await db.query(
        \`INSERT INTO ${r.table} (\${columns}) VALUES (\${placeholders}) RETURNING *\`,
        values
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to create ${r.table}' });
    }
  });`

      case 'select_all':
        return `  // List all ${r.table}
  app.${method}('${routePath}', async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM ${r.table} ORDER BY id DESC');
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch ${r.table}' });
    }
  });`

      case 'select_one':
        return `  // Get single ${r.table}
  app.${method}('${routePath}/:id', async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM ${r.table} WHERE id = $1', [req.params.id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch ${r.table}' });
    }
  });`

      case 'update':
        return `  // Update ${r.table}
  app.${method}('${routePath}/:id', async (req, res) => {
    try {
      const keys = Object.keys(req.body);
      const values = Object.values(req.body);
      const setClause = keys.map((k, i) => \`\${k} = $\${i + 1}\`).join(', ');
      values.push(req.params.id);
      const result = await db.query(
        \`UPDATE ${r.table} SET \${setClause} WHERE id = $\${values.length} RETURNING *\`,
        values
      );
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to update ${r.table}' });
    }
  });`

      case 'delete':
        return `  // Delete ${r.table}
  app.${method}('${routePath}/:id', async (req, res) => {
    try {
      const result = await db.query('DELETE FROM ${r.table} WHERE id = $1 RETURNING *', [req.params.id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      res.json({ deleted: result.rows[0] });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to delete ${r.table}' });
    }
  });`

      default:
        return `  // Custom: ${r.action} on ${r.table}
  app.${method}('${routePath}', async (req, res) => {
    res.json({ message: 'TODO: implement ${r.action}' });
  });`
    }
  })

  return `/**\n * Routes — auto-generated\n */\nmodule.exports = (app, db) => {\n\n${handlers.join('\n\n')}\n\n};\n`
}

// ─── Dockerfile ───────────────────────────────────────────────────────────────

function generateDockerfile() {
  return `FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --production

COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
`
}

// ─── docker-compose.yml ───────────────────────────────────────────────────────

/**
 * @param {Object} opts
 * @param {string} opts.siteId        — site UUID
 * @param {number} opts.backendPort   — host port for the backend
 * @param {number} opts.dbPort        — host port for postgres
 */
function generateDockerCompose({ siteId, backendPort, dbPort }) {
  // Clean siteId for use as DB name (replace dashes)
  const dbName = `site_${siteId.replace(/-/g, '_')}`

  return `version: '3.9'

services:
  postgres:
    image: postgres:15-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: password
      POSTGRES_DB: ${dbName}
    ports:
      - "${dbPort}:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U admin -d ${dbName}"]
      interval: 5s
      timeout: 5s
      retries: 10

  backend:
    build: ./backend
    restart: unless-stopped
    ports:
      - "${backendPort}:5000"
    environment:
      DATABASE_URL: postgresql://admin:password@postgres:5432/${dbName}
      NODE_ENV: production
    depends_on:
      postgres:
        condition: service_healthy

volumes:
  pgdata:
`
}

module.exports = {
  generatePackageJson,
  generateServerJs,
  generateInitSql,
  generateRoutesJs,
  generateDockerfile,
  generateDockerCompose,
}
