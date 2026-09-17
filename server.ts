import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const { Pool } = pg;
const app = express();
const PORT = 3000;

app.use(express.json());

// Database configuration state (supports DB_* from AGENTS.md, PG* from standard pg, and defaults to 'rikisgat')
let dbConfig = {
  host: process.env.DB_HOST || process.env.PGHOST || "localhost",
  port: parseInt(process.env.DB_PORT || process.env.PGPORT || "5432", 10),
  database: process.env.DB_NAME || process.env.PGDATABASE || "rikisgat",
  user: process.env.DB_USER || process.env.PGUSER || "postgres",
  password: process.env.DB_PASSWORD || process.env.PGPASSWORD || "",
  connectionTimeoutMillis: 3000
};

let pool: pg.Pool | null = null;

function getPool(): pg.Pool {
  if (!pool) {
    pool = new Pool(dbConfig);
    pool.on("error", (err) => {
      console.warn("[PostgreSQL] Background pool error:", err.message);
    });
  }
  return pool;
}

// Resilient connection helper that tries alternate database names ('rikisgat' <-> 'opnir_reikningar') if not found
async function getConnectedClient(): Promise<{ client: pg.PoolClient; release: () => void }> {
  try {
    const currentPool = getPool();
    const client = await currentPool.connect();
    return { client, release: () => client.release() };
  } catch (err: any) {
    if (err.code === '3D000') {
      const alternate = dbConfig.database === 'rikisgat' ? 'opnir_reikningar' : 'rikisgat';
      console.warn(`[PostgreSQL] Gagnagrunnur '${dbConfig.database}' fannst ekki (3D000). Reyni '${alternate}'...`);
      dbConfig.database = alternate;
      if (pool) {
        await pool.end().catch(() => {});
        pool = null;
      }
      const altPool = getPool();
      const client = await altPool.connect();
      return { client, release: () => client.release() };
    }
    throw err;
  }
}

// Column mapping helper for real tables from opnirreikningar.is Excel imports
interface ColumnMapping {
  tableName: string;
  clientCol: string | null;
  supplierCol: string | null;
  invoiceNrCol: string | null;
  dateCol: string | null;
  amountCol: string | null;
  descCol: string | null;
  yearCol: string | null;
  monthCol: string | null;
}

let cachedMapping: ColumnMapping | null = null;
let lastMappingCheck = 0;

async function detectTableAndColumns(client: pg.PoolClient): Promise<ColumnMapping | null> {
  const now = Date.now();
  if (cachedMapping && (now - lastMappingCheck < 30000)) {
    return cachedMapping;
  }

  try {
    // Find all public user tables
    const tableRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      ORDER BY table_name ASC;
    `);

    if (tableRes.rows.length === 0) {
      cachedMapping = null;
      return null;
    }

    const tableNames: string[] = tableRes.rows.map(r => r.table_name);
    // Prefer tables with names like 'reikningar', 'invoices', 'faerslur', 'opnir_reikningar'
    let preferredTable = tableNames.find(t => 
      t.toLowerCase().includes("reikning") || 
      t.toLowerCase().includes("faersl") || 
      t.toLowerCase().includes("invoice") ||
      t.toLowerCase().includes("opnir")
    ) || tableNames[0];

    // Inspect columns for this table
    const colRes = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = $1;
    `, [preferredTable]);

    const cols: string[] = colRes.rows.map(r => r.column_name.toLowerCase());

    const findMatch = (candidates: string[]): string | null => {
      for (const cand of candidates) {
        const found = cols.find(c => c === cand || c.includes(cand));
        if (found) return found;
      }
      return null;
    };

    const mapping: ColumnMapping = {
      tableName: preferredTable,
      clientCol: findMatch(["stofnun", "client", "heiti_stofnunar", "stofnun_heiti", "adili", "kaupandi"]),
      supplierCol: findMatch(["birgir", "supplier", "heiti_birgja", "birgir_heiti", "seljandi"]),
      invoiceNrCol: findMatch(["reikningsnumer", "reikningsnr", "id", "numer", "fylgiskjal", "reikningur"]),
      dateCol: findMatch(["dagsetning", "dags", "date", "bokad_dags", "reikningsdags"]),
      amountCol: findMatch(["upphaed", "amount", "heildarupphaed", "alls_kr", "upphaed_kr"]),
      descCol: findMatch(["lysing", "texti", "tegund", "faerslutexti", "skyring", "skiring"]),
      yearCol: findMatch(["ar", "year"]),
      monthCol: findMatch(["manudur", "month"])
    };

    cachedMapping = mapping;
    lastMappingCheck = now;
    return mapping;
  } catch (err) {
    console.error("[PostgreSQL] Table detection failed:", err);
    return null;
  }
}

const SERVER_MONTH_MAP: Record<string, string> = {
  jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
  jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12"
};

function formatRowDate(val: any, fallbackYear?: string | number): string {
  if (!val) return "";
  if (val instanceof Date && !isNaN(val.getTime())) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, "0");
    const d = String(val.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const s = String(val).trim();
  const m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (m) {
    return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  }
  const dmy = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (dmy) {
    return `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
  }
  const textMatch = s.match(/(?:(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)[a-z]*,?\s+)?(?:([a-z]+)\s+(\d{1,2})|(\d{1,2})\.?\s+([a-z]+))(?:\s*,?\s*(\d{4}))?/i);
  if (textMatch) {
    const rawMonth = (textMatch[1] || textMatch[4] || "").toLowerCase().slice(0, 3);
    const monthNum = SERVER_MONTH_MAP[rawMonth];
    if (monthNum) {
      const dayNum = (textMatch[2] || textMatch[3] || "1").padStart(2, "0");
      let yearNum = textMatch[5];
      if (!yearNum && fallbackYear && String(fallbackYear) !== "all") {
        yearNum = String(fallbackYear);
      }
      if (!yearNum) {
        const foundY = s.match(/\b(19\d\d|20\d\d)\b/);
        if (foundY) yearNum = foundY[1];
      }
      if (!yearNum) yearNum = "2024";
      return `${yearNum}-${monthNum}-${dayNum}`;
    }
  }
  if (/\b(19\d\d|20\d\d)\b/.test(s)) {
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear();
      const mo = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${mo}-${day}`;
    }
  }
  return s;
}

// -------------------------------------------------------------
// API Endpoints
// -------------------------------------------------------------

// 1. Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 2. Database status & diagnostics
app.get("/api/db-status", async (_req, res) => {
  try {
    const { client, release } = await getConnectedClient();
    try {
      const tableRes = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
        ORDER BY table_name ASC;
      `);

      const tables = tableRes.rows.map(r => r.table_name);
      const mapping = await detectTableAndColumns(client);

      let totalRows = 0;
      if (mapping && mapping.tableName) {
        const countRes = await client.query(`SELECT COUNT(*) AS total FROM "${mapping.tableName}";`);
        totalRows = parseInt(countRes.rows[0].total, 10) || 0;
      }

      res.json({
        connected: true,
        database: dbConfig.database,
        host: dbConfig.host,
        port: dbConfig.port,
        user: dbConfig.user,
        tables,
        activeTable: mapping?.tableName || null,
        detectedMapping: mapping,
        totalRows,
        message: `Tengt við PostgreSQL á ${dbConfig.host}:${dbConfig.port}. Fann ${totalRows.toLocaleString('is-IS')} færslur í töflunni '${mapping?.tableName || ''}'.`
      });
    } finally {
      release();
    }
  } catch (error: any) {
    res.json({
      connected: false,
      database: dbConfig.database,
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      error: error.message,
      code: error.code,
      message: `Ekki náðist samband við PostgreSQL (${error.message}). Viðmótið notar 'mockData' sem varaáætlun.`
    });
  }
});

// 3. Update / Test connection parameters dynamically
app.post("/api/db-config", async (req, res) => {
  const { host, port, database, user, password } = req.body;
  if (host) dbConfig.host = host;
  if (port) dbConfig.port = parseInt(port, 10);
  if (database) dbConfig.database = database;
  if (user) dbConfig.user = user;
  if (password !== undefined) dbConfig.password = password;

  // Re-create pool with new settings
  if (pool) {
    try {
      await pool.end();
    } catch {
      // ignore
    }
    pool = null;
  }
  cachedMapping = null;

  try {
    const { release } = await getConnectedClient();
    release();
    res.json({ success: true, message: "Tenging tókst með nýjum stillingum!" });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 4. Query Overview & Available Years from PostgreSQL
app.get("/api/overview", async (_req, res) => {
  try {
    const { client, release } = await getConnectedClient();
    try {
      const mapping = await detectTableAndColumns(client);
      const tableName = mapping?.tableName || "reikningar";
      const dateCol = mapping?.dateCol ? `"${mapping.dateCol}"` : "dags";
      const amountCol = mapping?.amountCol ? `"${mapping.amountCol}"` : "upphaed";

      // Find min date, max date, total sum and count
      const summaryRes = await client.query(`
        SELECT 
          COUNT(*) AS total_invoices,
          COALESCE(SUM(${amountCol}), 0) AS total_amount,
          MIN(${dateCol}) AS min_date,
          MAX(${dateCol}) AS max_date
        FROM "${tableName}";
      `);

      const yearsRes = await client.query(`
        SELECT DISTINCT EXTRACT(YEAR FROM ${dateCol}::timestamp)::int AS ar
        FROM "${tableName}"
        WHERE ${dateCol} IS NOT NULL
        ORDER BY ar DESC;
      `);

      const row = summaryRes.rows[0];
      const years = yearsRes.rows.map(r => String(r.ar));

      res.json({
        source: "postgres",
        totalInvoices: parseInt(row.total_invoices, 10) || 0,
        totalAmount: parseFloat(row.total_amount) || 0,
        minDate: formatRowDate(row.min_date),
        maxDate: formatRowDate(row.max_date),
        availableYears: years
      });
    } finally {
      release();
    }
  } catch (err: any) {
    res.json({
      source: "mock",
      error: err.message
    });
  }
});

// 5. Query Institutions from PostgreSQL with real JOIN or flat table
app.get("/api/institutions", async (req, res) => {
  try {
    const { client, release } = await getConnectedClient();
    try {
      const { year, month } = req.query;
      const conditions: string[] = [];
      const values: any[] = [];

      const mapping = await detectTableAndColumns(client);
      const tableName = mapping?.tableName || "reikningar";
      const hasStofnanirTable = mapping?.tableName === "reikningar";
      const dateCol = mapping?.dateCol ? `r."${mapping.dateCol}"` : "r.dags";
      const amountCol = mapping?.amountCol ? `r."${mapping.amountCol}"` : "r.upphaed";
      const clientCol = mapping?.clientCol ? `r."${mapping.clientCol}"` : 'r."stofnun"';

      if (year && year !== "all") {
        values.push(parseInt(year as string, 10));
        conditions.push(`EXTRACT(YEAR FROM ${dateCol}::timestamp) = $${values.length}`);
      }

      if (month && month !== "all") {
        values.push(parseInt(month as string, 10));
        conditions.push(`EXTRACT(MONTH FROM ${dateCol}::timestamp) = $${values.length}`);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

      let queryStr = "";
      if (hasStofnanirTable) {
        queryStr = `
          SELECT 
            COALESCE(s.nafn, 'Óskráð stofnun #' || r.stofnun_id) AS client,
            COUNT(*) AS "invoiceCount",
            COALESCE(SUM(${amountCol}), 0) AS "totalAmount"
          FROM reikningar r
          LEFT JOIN stofnanir s ON r.stofnun_id = s.id
          ${whereClause}
          GROUP BY s.nafn, r.stofnun_id
          ORDER BY RANDOM()
          LIMIT 250;
        `;
      } else {
        queryStr = `
          SELECT 
            COALESCE(${clientCol}, 'Óskráð stofnun') AS client,
            COUNT(*) AS "invoiceCount",
            COALESCE(SUM(${amountCol}), 0) AS "totalAmount"
          FROM "${tableName}" r
          ${whereClause}
          GROUP BY ${clientCol}
          ORDER BY RANDOM()
          LIMIT 250;
        `;
      }

      const result = await client.query(queryStr, values);
      res.json({
        source: "postgres",
        table: tableName,
        rows: result.rows.map((r, idx) => ({
          id: idx + 1,
          client: r.client,
          invoiceCount: parseInt(r.invoiceCount, 10) || 0,
          totalAmount: parseFloat(r.totalAmount) || 0
        }))
      });
    } finally {
      release();
    }
  } catch (err: any) {
    res.json({
      source: "mock",
      error: err.message,
      message: "Gat ekki sótt úr PostgreSQL, notar gervigögn."
    });
  }
});

// 6. Query Invoices from PostgreSQL with real JOIN and search
app.get("/api/invoices", async (req, res) => {
  try {
    const { client, release } = await getConnectedClient();
    try {
      const {
        client: clientFilter,
        supplier,
        search,
        year,
        month,
        limit = "100",
        offset = "0"
      } = req.query;

      const mapping = await detectTableAndColumns(client);
      const tableName = mapping?.tableName || "reikningar";
      const hasStofnanirTable = mapping?.tableName === "reikningar";
      const dateCol = mapping?.dateCol ? `r."${mapping.dateCol}"` : "r.dags";
      const amountCol = mapping?.amountCol ? `r."${mapping.amountCol}"` : "r.upphaed";
      const clientCol = mapping?.clientCol ? `r."${mapping.clientCol}"` : 'r."stofnun"';
      const supplierCol = mapping?.supplierCol ? `r."${mapping.supplierCol}"` : 'r."birgir"';

      const conditions: string[] = [];
      const values: any[] = [];

      if (clientFilter) {
        values.push(`%${clientFilter}%`);
        if (hasStofnanirTable) {
          conditions.push(`s.nafn ILIKE $${values.length}`);
        } else {
          conditions.push(`${clientCol} ILIKE $${values.length}`);
        }
      }

      if (supplier) {
        values.push(`%${supplier}%`);
        if (hasStofnanirTable) {
          conditions.push(`b.nafn ILIKE $${values.length}`);
        } else {
          conditions.push(`${supplierCol} ILIKE $${values.length}`);
        }
      }

      if (search) {
        const searchPattern = `%${search}%`;
        values.push(searchPattern);
        const pIdx = values.length;
        if (hasStofnanirTable) {
          conditions.push(`(
            b.nafn ILIKE $${pIdx} OR 
            s.nafn ILIKE $${pIdx} OR 
            r.numer ILIKE $${pIdx} OR 
            r.tegund ILIKE $${pIdx}
          )`);
        } else {
          conditions.push(`(
            ${supplierCol} ILIKE $${pIdx} OR 
            ${clientCol} ILIKE $${pIdx}
          )`);
        }
      }

      if (year && year !== "all") {
        values.push(parseInt(year as string, 10));
        conditions.push(`EXTRACT(YEAR FROM ${dateCol}::timestamp) = $${values.length}`);
      }

      if (month && month !== "all") {
        values.push(parseInt(month as string, 10));
        conditions.push(`EXTRACT(MONTH FROM ${dateCol}::timestamp) = $${values.length}`);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
      const limitVal = Math.min(Math.max(parseInt(limit as string, 10) || 50, 1), 500);
      const offsetVal = Math.max(parseInt(offset as string, 10) || 0, 0);

      values.push(limitVal);
      const limitIndex = values.length;
      values.push(offsetVal);
      const offsetIndex = values.length;

      let queryStr = "";
      if (hasStofnanirTable) {
        queryStr = `
          SELECT 
            r.id,
            COALESCE(r.numer, 'REIKN-' || r.id) AS numer,
            COALESCE(b.nafn, 'Óskráður birgir #' || r.birgi_id) AS supplier,
            COALESCE(s.nafn, 'Óskráð stofnun #' || r.stofnun_id) AS client,
            ${amountCol} AS amount,
            ${dateCol} AS date,
            r.tegund AS description
          FROM reikningar r
          LEFT JOIN birgjar b ON r.birgi_id = b.id
          LEFT JOIN stofnanir s ON r.stofnun_id = s.id
          ${whereClause}
          ORDER BY ${dateCol} DESC NULLS LAST, r.id DESC
          LIMIT $${limitIndex} OFFSET $${offsetIndex};
        `;
      } else {
        queryStr = `
          SELECT 
            r.id,
            'REIKN-' || r.id AS numer,
            COALESCE(${supplierCol}, 'Óskráður birgir') AS supplier,
            COALESCE(${clientCol}, 'Óskráð stofnun') AS client,
            ${amountCol} AS amount,
            ${dateCol} AS date,
            'Almennur rekstur' AS description
          FROM "${tableName}" r
          ${whereClause}
          ORDER BY ${dateCol} DESC NULLS LAST, r.id DESC
          LIMIT $${limitIndex} OFFSET $${offsetIndex};
        `;
      }

      const result = await client.query(queryStr, values);

      res.json({
        source: "postgres",
        count: result.rows.length,
        rows: result.rows.map(r => ({
          id: String(r.numer || r.id),
          supplier: r.supplier,
          amount: parseFloat(r.amount) || 0,
          date: formatRowDate(r.date, year as string),
          client: r.client,
          lines: [
            {
              description: r.description || "Gjafir og almennur rekstur",
              amount: parseFloat(r.amount) || 0,
              is_kredit: (parseFloat(r.amount) || 0) < 0
            }
          ]
        }))
      });
    } finally {
      release();
    }
  } catch (err: any) {
    res.json({
      source: "mock",
      error: err.message,
      message: "Gat ekki sótt reikninga úr PostgreSQL."
    });
  }
});

// 7. Benchmark & Annual breakdown endpoint
app.get("/api/benchmark", async (req, res) => {
  const startTime = Date.now();
  try {
    const { client, release } = await getConnectedClient();
    try {
      const { testYear } = req.query;

      const mapping = await detectTableAndColumns(client);
      const tableName = mapping?.tableName || "reikningar";
      const hasStofnanirTable = mapping?.tableName === "reikningar";
      const dateCol = mapping?.dateCol ? `r."${mapping.dateCol}"` : "r.dags";
      const amountCol = mapping?.amountCol ? `r."${mapping.amountCol}"` : "r.upphaed";

      // 1. Annual distribution from real PostgreSQL database
      const annualQuery = hasStofnanirTable ? `
        SELECT 
          COALESCE(EXTRACT(YEAR FROM r.dags::timestamp)::int, 0) AS year,
          COUNT(*) AS "recordCount",
          COUNT(DISTINCT r.stofnun_id) AS "institutionCount",
          COUNT(DISTINCT r.birgi_id) AS "supplierCount",
          COALESCE(SUM(r.upphaed), 0) AS "totalAmount"
        FROM reikningar r
        GROUP BY 1
        ORDER BY year DESC;
      ` : `
        SELECT 
          COALESCE(EXTRACT(YEAR FROM ${dateCol}::timestamp)::int, 0) AS year,
          COUNT(*) AS "recordCount",
          0 AS "institutionCount",
          0 AS "supplierCount",
          COALESCE(SUM(${amountCol}), 0) AS "totalAmount"
        FROM "${tableName}" r
        GROUP BY 1
        ORDER BY year DESC;
      `;
      const annualRes = await client.query(annualQuery);

      // 2. If testYear requested, measure targeted query latency
      let testLatencyMs = 0;
      let testRowsCount = 0;
      if (testYear && testYear !== "all") {
        const testStart = Date.now();
        const testRes = await client.query(`
          SELECT r.id, ${amountCol} AS upphaed, ${dateCol} AS dags
          FROM "${tableName}" r
          WHERE EXTRACT(YEAR FROM ${dateCol}::timestamp) = $1
          LIMIT 1000;
        `, [parseInt(testYear as string, 10)]);
        testLatencyMs = Date.now() - testStart;
        testRowsCount = testRes.rows.length;
      }

      const totalLatency = Date.now() - startTime;

      res.json({
        source: "postgres",
        latencyMs: totalLatency,
        testLatencyMs: testLatencyMs || totalLatency,
        testRowsCount,
        years: annualRes.rows
          .filter(r => r.year > 2000 && r.year < 2050)
          .map(r => ({
            year: r.year,
            recordCount: parseInt(r.recordCount, 10) || 0,
            institutionCount: parseInt(r.institutionCount, 10) || 0,
            supplierCount: parseInt(r.supplierCount, 10) || 0,
            totalAmount: parseFloat(r.totalAmount) || 0,
            // Estimated index size based on real records
            dataSizeMb: Math.round((parseInt(r.recordCount, 10) || 0) * 0.00028 * 10) / 10
          }))
      });
    } finally {
      release();
    }
  } catch (err: any) {
    res.json({
      source: "mock",
      error: err.message,
      latencyMs: Date.now() - startTime,
      years: []
    });
  }
});

// -------------------------------------------------------------
// Vite middleware integration
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Ríkisgát Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
