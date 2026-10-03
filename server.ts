import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import pg from "pg";
import * as XLSXModule from "xlsx";

const XLSX: any = (XLSXModule as any).readFile 
  ? XLSXModule 
  : ((XLSXModule as any).default?.readFile ? (XLSXModule as any).default : ((XLSXModule as any).default || XLSXModule));

dotenv.config();

const { Pool } = pg;
const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Request logger ring buffer for live latency profiling
export interface ApiRequestLog {
  id: string;
  path: string;
  method: string;
  timestamp: string;
  durationMs: number;
  status: number;
}
const recentRequests: ApiRequestLog[] = [];

app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    const start = Date.now();
    res.on("finish", () => {
      const durationMs = Date.now() - start;
      recentRequests.unshift({
        id: Math.random().toString(36).substring(2, 9),
        path: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString(),
        durationMs,
        status: res.statusCode
      });
      if (recentRequests.length > 50) recentRequests.pop();
    });
  }
  next();
});

// Favicon handler to prevent 404
app.get("/favicon.ico", (_req, res) => {
  const icoPath = path.join(process.cwd(), "public", "favicon.ico");
  if (fs.existsSync(icoPath)) {
    return res.sendFile(icoPath);
  }
  const svgPath = path.join(process.cwd(), "public", "favicon.svg");
  res.sendFile(svgPath);
});
app.get("/favicon.svg", (_req, res) => {
  const svgPath = path.join(process.cwd(), "public", "favicon.svg");
  res.sendFile(svgPath);
});

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
  allTables: string[];
  hasStofnanirTable: boolean;
  hasBirgjarTable: boolean;
  birgiIdCol: string | null;
  stofnunIdCol: string | null;
  birgjarNameCol: string | null;
  birgjarIdCol: string | null;
  stofnanirNameCol: string | null;
  stofnanirIdCol: string | null;
  clientCol: string | null;
  supplierCol: string | null;
  invoiceNrCol: string | null;
  invoiceCols: string[];
  dateCol: string | null;
  amountCol: string | null;
  descCol: string | null;
  yearCol: string | null;
  monthCol: string | null;
}

let cachedMapping: ColumnMapping | null = null;
let lastMappingCheck = 0;

function getInvoiceNumberExpr(tableAlias: string, mapping: ColumnMapping | null): string {
  const prefix = tableAlias ? `${tableAlias}.` : "";
  const existingCols = (mapping?.invoiceCols && mapping.invoiceCols.length > 0)
    ? mapping.invoiceCols
    : (mapping?.invoiceNrCol && mapping.invoiceNrCol !== "id" ? [mapping.invoiceNrCol] : ["numer"]);
  
  const parts = existingCols.map(c => `NULLIF(TRIM(${prefix}"${c}"::text), '')`);
  parts.push(`${prefix}id::text`);
  return `COALESCE(${parts.join(", ")})`;
}

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

    const tableNames: string[] = tableRes.rows.map(r => r.table_name.toLowerCase());
    const hasStofnanirTable = tableNames.includes("stofnanir");
    const hasBirgjarTable = tableNames.includes("birgjar");

    // Prefer tables with names like 'reikningar', 'invoices', 'faerslur', 'opnir_reikningar'
    let preferredTable = tableRes.rows.map(r => r.table_name).find(t => 
      t.toLowerCase().includes("reikning") || 
      t.toLowerCase().includes("faersl") || 
      t.toLowerCase().includes("invoice") ||
      t.toLowerCase().includes("opnir")
    ) || tableRes.rows[0].table_name;

    // Inspect columns for this table
    const colRes = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = $1;
    `, [preferredTable]);

    const cols: string[] = colRes.rows.map(r => r.column_name.toLowerCase());

    const findMatch = (candidates: string[], excludeIds: boolean = false): string | null => {
      // 1. Exact match first
      for (const cand of candidates) {
        const exact = cols.find(c => c === cand);
        if (exact && (!excludeIds || (!exact.endsWith("_id") && exact !== "id"))) return exact;
      }
      // 2. Substring match only for candidate words with length >= 3
      for (const cand of candidates) {
        if (cand.length >= 3) {
          const found = cols.find(c => c.includes(cand) && (!excludeIds || (!c.endsWith("_id") && c !== "id")));
          if (found) return found;
        }
      }
      return null;
    };

    let birgjarNameCol: string | null = null;
    let birgjarIdCol: string | null = null;
    if (hasBirgjarTable) {
      try {
        const bRes = await client.query(`
          SELECT column_name FROM information_schema.columns 
          WHERE table_schema = 'public' AND LOWER(table_name) = 'birgjar';
        `);
        const bCols = bRes.rows.map(r => r.column_name.toLowerCase());
        birgjarNameCol = bCols.find(c => ["nafn", "heiti", "birgir", "name"].includes(c)) || bCols[0] || "nafn";
        birgjarIdCol = bCols.find(c => ["id", "birgi_id", "birgir_id", "kennitala", "kt"].includes(c)) || bCols[0] || "id";
      } catch {
        birgjarNameCol = "nafn";
        birgjarIdCol = "id";
      }
    }

    let stofnanirNameCol: string | null = null;
    let stofnanirIdCol: string | null = null;
    if (hasStofnanirTable) {
      try {
        const sRes = await client.query(`
          SELECT column_name FROM information_schema.columns 
          WHERE table_schema = 'public' AND LOWER(table_name) = 'stofnanir';
        `);
        const sCols = sRes.rows.map(r => r.column_name.toLowerCase());
        stofnanirNameCol = sCols.find(c => ["nafn", "heiti", "stofnun", "name"].includes(c)) || sCols[0] || "nafn";
        stofnanirIdCol = sCols.find(c => ["id", "stofnun_id", "client_id", "kennitala", "kt"].includes(c)) || sCols[0] || "id";
      } catch {
        stofnanirNameCol = "nafn";
        stofnanirIdCol = "id";
      }
    }

    const mapping: ColumnMapping = {
      tableName: preferredTable,
      allTables: tableNames,
      hasStofnanirTable,
      hasBirgjarTable,
      birgiIdCol: findMatch(["birgi_id", "birgir_id", "birgis_id", "birgjar_id", "supplier_id"]),
      stofnunIdCol: findMatch(["stofnun_id", "client_id", "institution_id"]),
      birgjarNameCol,
      birgjarIdCol,
      stofnanirNameCol,
      stofnanirIdCol,
      clientCol: findMatch(["stofnun", "client", "heiti_stofnunar", "stofnun_heiti", "adili", "kaupandi"], true),
      supplierCol: findMatch(["birgir", "supplier", "heiti_birgja", "birgir_heiti", "seljandi"], true),
      invoiceNrCol: findMatch(["numer", "reikningsnumer", "reikningsnr", "fylgiskjal", "reikningur", "nr", "invoice_nr", "invoice_number"]) || (cols.includes("id") ? "id" : cols[0] || "id"),
      invoiceCols: ["numer", "reikningsnumer", "reikningsnr", "fylgiskjal", "reikningur", "nr", "invoice_nr", "invoice_number"].filter(c => cols.includes(c)),
      dateCol: findMatch(["dagsetning", "dags", "date", "bokad_dags", "reikningsdags"]),
      amountCol: findMatch(["upphaed", "amount", "heildarupphaed", "alls_kr", "upphaed_kr"]),
      descCol: findMatch(["tegund", "lysing", "texti", "faerslutexti", "skyring", "skiring"]),
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

// 3.5 Global Portal Settings (shared across all browsers, persisted in PostgreSQL)
let portalSettingsState = {
  broadSearchYears: false,
  broadSearchMonths: false
};

app.get("/api/portal-settings", async (_req, res) => {
  try {
    const { client, release } = await getConnectedClient();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS stjorn_stillingar (
          lykill VARCHAR(100) PRIMARY KEY,
          gildi TEXT NOT NULL,
          uppfaert TIMESTAMP DEFAULT NOW()
        )
      `);
      const dbRes = await client.query("SELECT lykill, gildi FROM stjorn_stillingar");
      for (const row of dbRes.rows) {
        if (row.lykill === "broadSearchYears") portalSettingsState.broadSearchYears = row.gildi === "true";
        if (row.lykill === "broadSearchMonths") portalSettingsState.broadSearchMonths = row.gildi === "true";
      }
    } catch {
      // ignore, fall back to memory
    } finally {
      release();
    }
  } catch {
    // DB offline, fall back to memory
  }
  res.json(portalSettingsState);
});

app.post("/api/portal-settings", async (req, res) => {
  const { broadSearchYears, broadSearchMonths } = req.body;
  if (typeof broadSearchYears === "boolean") portalSettingsState.broadSearchYears = broadSearchYears;
  if (typeof broadSearchMonths === "boolean") portalSettingsState.broadSearchMonths = broadSearchMonths;

  try {
    const { client, release } = await getConnectedClient();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS stjorn_stillingar (
          lykill VARCHAR(100) PRIMARY KEY,
          gildi TEXT NOT NULL,
          uppfaert TIMESTAMP DEFAULT NOW()
        )
      `);
      await client.query(`
        INSERT INTO stjorn_stillingar (lykill, gildi, uppfaert)
        VALUES 
          ('broadSearchYears', $1, NOW()),
          ('broadSearchMonths', $2, NOW())
        ON CONFLICT (lykill) DO UPDATE SET gildi = EXCLUDED.gildi, uppfaert = NOW()
      `, [String(portalSettingsState.broadSearchYears), String(portalSettingsState.broadSearchMonths)]);
    } catch {
      // ignore
    } finally {
      release();
    }
  } catch {
    // ignore
  }

  res.json({ success: true, settings: portalSettingsState });
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
      const invoiceExpr = getInvoiceNumberExpr("", mapping);

      // Find min date, max date, total sum and count
      const summaryRes = await client.query(`
        SELECT 
          COUNT(DISTINCT ${invoiceExpr}) AS total_invoices,
          COUNT(*) AS total_lines,
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
        totalLines: parseInt(row.total_lines, 10) || 0,
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
      const { year, month, search, client: clientParam, supplier: supplierParam, line: lineParam } = req.query;
      const conditions: string[] = [];
      const values: any[] = [];

      const mapping = await detectTableAndColumns(client);
      const tableName = mapping?.tableName || "reikningar";
      const hasStofnanirTable = Boolean(mapping?.hasStofnanirTable);
      const hasBirgjarTable = Boolean(mapping?.hasBirgjarTable);
      const dateCol = mapping?.dateCol ? `r."${mapping.dateCol}"` : "r.dags";
      const amountCol = mapping?.amountCol ? `r."${mapping.amountCol}"` : "r.upphaed";
      const invoiceExpr = getInvoiceNumberExpr("r", mapping);
      const stofnanirCol = mapping?.stofnanirNameCol ? `s."${mapping.stofnanirNameCol}"` : "s.nafn";
      const stofnunIdCol = mapping?.stofnunIdCol ? `r."${mapping.stofnunIdCol}"` : "r.stofnun_id";
      const stofnanirIdCol = mapping?.stofnanirIdCol ? `s."${mapping.stofnanirIdCol}"` : "s.id";
      const birgjarCol = mapping?.birgjarNameCol ? `b."${mapping.birgjarNameCol}"` : "b.nafn";
      const birgiIdCol = mapping?.birgiIdCol ? `r."${mapping.birgiIdCol}"` : "r.birgi_id";
      const birgjarIdCol = mapping?.birgjarIdCol ? `b."${mapping.birgjarIdCol}"` : "b.id";

      if (year && year !== "all") {
        values.push(parseInt(year as string, 10));
        conditions.push(`EXTRACT(YEAR FROM ${dateCol}::timestamp) = $${values.length}`);
      }

      if (month && month !== "all") {
        values.push(parseInt(month as string, 10));
        conditions.push(`EXTRACT(MONTH FROM ${dateCol}::timestamp) = $${values.length}`);
      }

      let needBirgjarJoin = false;

      // 1. Direct institution/client filter (Dálkur 1: Stofnun)
      const trimmedClient = typeof clientParam === "string" ? clientParam.trim() : "";
      if (trimmedClient) {
        if (hasStofnanirTable) {
          try {
            const sRes = await client.query(
              `SELECT ${stofnanirIdCol} AS id FROM stofnanir 
               WHERE ${stofnanirCol}::text ILIKE $1 
               LIMIT 200`,
              [`%${trimmedClient.replace(/\s+/g, "%")}%`]
            );
            if (sRes.rows && sRes.rows.length > 0) {
              const sIds = sRes.rows.map(r => r.id);
              values.push(sIds);
              conditions.push(`${stofnunIdCol} = ANY($${values.length}::int[])`);
            } else {
              values.push(`%${trimmedClient}%`);
              conditions.push(`(${stofnanirCol}::text ILIKE $${values.length})`);
            }
          } catch {
            values.push(`%${trimmedClient}%`);
            conditions.push(`(${stofnanirCol}::text ILIKE $${values.length})`);
          }
        }
      }

      // 2. Direct supplier filter (Dálkur 2: Birgir)
      const trimmedSupplier = typeof supplierParam === "string" ? supplierParam.trim() : "";
      if (trimmedSupplier) {
        needBirgjarJoin = hasBirgjarTable;
        if (hasBirgjarTable) {
          try {
            const bRes = await client.query(
              `SELECT ${birgjarIdCol} AS id FROM birgjar 
               WHERE ${birgjarCol}::text ILIKE $1 
               LIMIT 300`,
              [`%${trimmedSupplier.replace(/\s+/g, "%")}%`]
            );
            if (bRes.rows && bRes.rows.length > 0) {
              const bIds = bRes.rows.map(r => r.id);
              values.push(bIds);
              conditions.push(`${birgiIdCol} = ANY($${values.length}::int[])`);
            } else {
              values.push(`%${trimmedSupplier}%`);
              conditions.push(`(${birgjarCol}::text ILIKE $${values.length})`);
            }
          } catch {
            values.push(`%${trimmedSupplier}%`);
            conditions.push(`(${birgjarCol}::text ILIKE $${values.length})`);
          }
        }
      }

      // 3. Direct line / description / tegund filter (Dálkur 3: Lína í reikningi)
      const trimmedLine = typeof lineParam === "string" ? lineParam.trim() : "";
      if (trimmedLine) {
        const linePattern = `%${trimmedLine.replace(/\s+/g, "%")}%`;
        values.push(linePattern);
        const lIdx = values.length;
        const lineConditions: string[] = [];
        if (mapping?.descCol) {
          lineConditions.push(`r."${mapping.descCol}"::text ILIKE $${lIdx}`);
        }
        lineConditions.push(`r.tegund::text ILIKE $${lIdx}`);
        conditions.push(`(${lineConditions.join(" OR ")})`);
      }

      // 4. General search filter
      const trimmedSearch = typeof search === "string" ? search.trim() : "";
      if (trimmedSearch) {
        const words = trimmedSearch.split(/\s+/).filter(Boolean);
        const searchPattern = `%${words.join("%")}%`;
        const searchParts: string[] = [];

        // Fast-resolve supplier IDs from birgjar table
        if (hasBirgjarTable) {
          try {
            const bRes = await client.query(
              `SELECT ${birgjarIdCol} AS id FROM birgjar 
               WHERE ${birgjarCol}::text ILIKE $1 
               LIMIT 300`,
              [searchPattern]
            );
            if (bRes.rows && bRes.rows.length > 0) {
              const bIds = bRes.rows.map(r => r.id);
              values.push(bIds);
              searchParts.push(`${birgiIdCol} = ANY($${values.length}::int[])`);
            }
          } catch {
            // ignore
          }
        }

        // Fast-resolve institution IDs from stofnanir table
        if (hasStofnanirTable) {
          try {
            const sRes = await client.query(
              `SELECT ${stofnanirIdCol} AS id FROM stofnanir 
               WHERE ${stofnanirCol}::text ILIKE $1 
               LIMIT 200`,
              [searchPattern]
            );
            if (sRes.rows && sRes.rows.length > 0) {
              const sIds = sRes.rows.map(r => r.id);
              values.push(sIds);
              searchParts.push(`${stofnunIdCol} = ANY($${values.length}::int[])`);
            }
          } catch {
            // ignore
          }
        }

        // Direct supplier or client columns
        if (mapping?.supplierCol) {
          values.push(searchPattern);
          searchParts.push(`r."${mapping.supplierCol}"::text ILIKE $${values.length}`);
        }
        if (mapping?.clientCol) {
          values.push(searchPattern);
          searchParts.push(`r."${mapping.clientCol}"::text ILIKE $${values.length}`);
        }

        // Fallback search on invoice number or description
        if (searchParts.length === 0) {
          needBirgjarJoin = hasBirgjarTable;
          values.push(searchPattern);
          const pIdx = values.length;
          const fallbackMatches = [
            `${invoiceExpr} ILIKE $${pIdx}`
          ];
          if (hasBirgjarTable) {
            fallbackMatches.push(`${birgjarCol}::text ILIKE $${pIdx}`);
          }
          if (hasStofnanirTable) {
            fallbackMatches.push(`${stofnanirCol}::text ILIKE $${pIdx}`);
          }
          if (mapping?.descCol) {
            fallbackMatches.push(`r."${mapping.descCol}"::text ILIKE $${pIdx}`);
          }
          searchParts.push(`(${fallbackMatches.join(" OR ")})`);
        }

        if (searchParts.length > 0) {
          conditions.push(`(${searchParts.join(" OR ")})`);
        }
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

      let queryStr = "";
      if (hasStofnanirTable) {
        const directClientPart = mapping?.clientCol ? `NULLIF(TRIM(r."${mapping.clientCol}"::text), ''),` : "";
        const birgjarJoinClause = needBirgjarJoin 
          ? `LEFT JOIN birgjar b ON ${birgiIdCol}::text = ${birgjarIdCol}::text` 
          : "";

        queryStr = `
          SELECT 
            COALESCE(
              NULLIF(TRIM(${stofnanirCol}::text), ''),
              ${directClientPart}
              'Óskráð stofnun #' || ${stofnunIdCol}::text
            ) AS client,
            COUNT(DISTINCT (${birgiIdCol}::text || '_' || ${invoiceExpr}))::int AS "invoiceCount",
            COUNT(*)::int AS "lineCount",
            COALESCE(SUM(${amountCol}), 0) AS "totalAmount"
          FROM "${tableName}" r
          LEFT JOIN stofnanir s ON ${stofnunIdCol}::text = ${stofnanirIdCol}::text
          ${birgjarJoinClause}
          ${whereClause}
          GROUP BY 1
          ORDER BY "totalAmount" DESC
          LIMIT 500;
        `;
      } else {
        const directClientExpr = mapping?.clientCol 
          ? `COALESCE(r."${mapping.clientCol}", 'Óskráð stofnun')` 
          : (mapping?.stofnunIdCol ? `'Stofnun #' || r."${mapping.stofnunIdCol}"::text` : "'Óskráð stofnun'");

        queryStr = `
          SELECT 
            ${directClientExpr} AS client,
            COUNT(DISTINCT (${birgiIdCol}::text || '_' || ${invoiceExpr}))::int AS "invoiceCount",
            COUNT(*)::int AS "lineCount",
            COALESCE(SUM(${amountCol}), 0) AS "totalAmount"
          FROM "${tableName}" r
          ${whereClause}
          GROUP BY 1
          ORDER BY "totalAmount" DESC
          LIMIT 500;
        `;
      }

      const result = await client.query(queryStr, values);
      res.json({
        source: "postgres",
        table: tableName,
        search: trimmedSearch || undefined,
        rows: result.rows.map((r, idx) => ({
          id: idx + 1,
          client: r.client,
          invoiceCount: parseInt(r.invoiceCount, 10) || 0,
          lineCount: parseInt(r.lineCount !== undefined ? r.lineCount : r.invoiceCount, 10) || 0,
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

// 5.5 Query Suppliers for a specific Institution (grouped with count and sum)
app.get("/api/institution-suppliers", async (req, res) => {
  try {
    const { client, release } = await getConnectedClient();
    try {
      const { client: rawClientFilter, year, month, search, supplier: rawSupplierFilter, line: rawLineFilter } = req.query;
      const clientFilter = typeof rawClientFilter === "string" ? rawClientFilter.trim() : "";
      if (!clientFilter) {
        return res.json({ source: "postgres", client: "", suppliers: [] });
      }

      const supplierFilter = typeof rawSupplierFilter === "string" ? rawSupplierFilter.trim() : "";
      const lineFilter = typeof rawLineFilter === "string" ? rawLineFilter.trim() : "";

      const mapping = await detectTableAndColumns(client);
      const tableName = mapping?.tableName || "reikningar";
      const dateCol = mapping?.dateCol ? `r."${mapping.dateCol}"` : "r.dags";
      const amountCol = mapping?.amountCol ? `r."${mapping.amountCol}"` : "r.upphaed";

      const birgiIdCol = mapping?.birgiIdCol ? `r."${mapping.birgiIdCol}"` : "r.birgi_id";
      const stofnunIdCol = mapping?.stofnunIdCol ? `r."${mapping.stofnunIdCol}"` : "r.stofnun_id";
      const birgjarCol = mapping?.birgjarNameCol ? `b."${mapping.birgjarNameCol}"` : "b.nafn";
      const stofnanirCol = mapping?.stofnanirNameCol ? `s."${mapping.stofnanirNameCol}"` : "s.nafn";
      const birgjarIdCol = mapping?.birgjarIdCol ? `b."${mapping.birgjarIdCol}"` : "b.id";
      const stofnanirIdCol = mapping?.stofnanirIdCol ? `s."${mapping.stofnanirIdCol}"` : "s.id";
      const invoiceExpr = getInvoiceNumberExpr("r", mapping);

      const hasBirgjar = Boolean(mapping?.hasBirgjarTable);
      const hasStofnanir = Boolean(mapping?.hasStofnanirTable);
      const canUseRelational = hasBirgjar || hasStofnanir;

      let rows: any[] = [];
      let querySuccess = false;

      // Tier 1: Try relational JOIN if stofnanir or birgjar tables exist
      if (canUseRelational) {
        try {
          const values: any[] = [];
          let paramIdx = 1;

          // Fast-resolve institution ID to leverage the b-tree index on reikningar(stofnun_id)
          let resolvedInstId: number | null = null;
          const numMatch = clientFilter.match(/(?:#|^)(\d+)$/);
          if (numMatch) {
            resolvedInstId = parseInt(numMatch[1], 10);
          } else if (hasStofnanir) {
            try {
              const trimmed = clientFilter.trim();
              const prefixMatch = trimmed.replace(/\.*$/, '');
              const instRes = await client.query(
                `SELECT ${stofnanirIdCol} AS id FROM stofnanir 
                 WHERE LOWER(TRIM(${stofnanirCol}::text)) = LOWER(TRIM($1))
                    OR ${stofnanirCol}::text ILIKE $2 || '%'
                 ORDER BY (LOWER(TRIM(${stofnanirCol}::text)) = LOWER(TRIM($1))) DESC
                 LIMIT 1`,
                [trimmed, prefixMatch]
              );
              if (instRes.rows && instRes.rows.length > 0) {
                resolvedInstId = instRes.rows[0].id;
              }
            } catch {
              // ignore
            }
          }

          let clientCond = "";
          if (resolvedInstId !== null) {
            values.push(resolvedInstId);
            clientCond = `${stofnunIdCol} = $${paramIdx++}`;
          } else {
            values.push(clientFilter.trim());
            const trimmedPrefix = clientFilter.trim().replace(/\.*$/, '');
            values.push(trimmedPrefix);
            const pExact = paramIdx++;
            const pPrefix = paramIdx++;
            const clientMatchParts: string[] = [];
            if (hasStofnanir) {
              clientMatchParts.push(`LOWER(TRIM(${stofnanirCol}::text)) = LOWER(TRIM($${pExact}))`);
              clientMatchParts.push(`${stofnanirCol}::text ILIKE $${pPrefix} || '%'`);
            }
            if (mapping?.clientCol) {
              clientMatchParts.push(`LOWER(TRIM(r."${mapping.clientCol}"::text)) = LOWER(TRIM($${pExact}))`);
              clientMatchParts.push(`r."${mapping.clientCol}"::text ILIKE $${pPrefix} || '%'`);
            }
            clientMatchParts.push(`('Óskráð stofnun #' || ${stofnunIdCol}::text) = $${pExact}`);
            clientMatchParts.push(`('Stofnun #' || ${stofnunIdCol}::text) = $${pExact}`);
            clientMatchParts.push(`${stofnunIdCol}::text = $${pExact}`);
            clientCond = `(${clientMatchParts.join(" OR ")})`;
          }

          let dateConditions = "";
          if (year && year !== "all") {
            values.push(parseInt(year as string, 10));
            dateConditions += ` AND EXTRACT(YEAR FROM ${dateCol}::timestamp) = $${paramIdx++}`;
          }

          if (month && month !== "all") {
            values.push(parseInt(month as string, 10));
            dateConditions += ` AND EXTRACT(MONTH FROM ${dateCol}::timestamp) = $${paramIdx++}`;
          }

          let searchCond = "";
          if (supplierFilter) {
            values.push(`%${supplierFilter}%`);
            const sParts: string[] = [];
            if (hasBirgjar) {
              sParts.push(`${birgjarCol}::text ILIKE $${paramIdx}`);
            }
            if (mapping?.supplierCol) {
              sParts.push(`r."${mapping.supplierCol}"::text ILIKE $${paramIdx}`);
            }
            if (sParts.length === 0) {
              sParts.push(`${birgiIdCol}::text ILIKE $${paramIdx}`);
            }
            searchCond += ` AND (${sParts.join(" OR ")})`;
            paramIdx++;
          }

          if (lineFilter) {
            values.push(`%${lineFilter}%`);
            const lParts: string[] = [];
            if (mapping?.descCol) {
              lParts.push(`r."${mapping.descCol}"::text ILIKE $${paramIdx}`);
            }
            lParts.push(`r.tegund::text ILIKE $${paramIdx}`);
            searchCond += ` AND (${lParts.join(" OR ")})`;
            paramIdx++;
          }

          if (search) {
            values.push(`%${search}%`);
            const searchParts: string[] = [];
            if (hasBirgjar) {
              searchParts.push(`${birgjarCol}::text ILIKE $${paramIdx}`);
            }
            if (mapping?.supplierCol) {
              searchParts.push(`r."${mapping.supplierCol}"::text ILIKE $${paramIdx}`);
            }
            if (searchParts.length === 0) {
              searchParts.push(`${birgiIdCol}::text ILIKE $${paramIdx}`);
            }
            searchCond += ` AND (${searchParts.join(" OR ")})`;
            paramIdx++;
          }

          const selectSupplierParts: string[] = [];
          if (hasBirgjar) {
            selectSupplierParts.push(`NULLIF(TRIM(${birgjarCol}::text), '')`);
          }
          if (mapping?.supplierCol) {
            selectSupplierParts.push(`NULLIF(TRIM(r."${mapping.supplierCol}"::text), '')`);
          }
          selectSupplierParts.push(`'Óskráður birgir #' || ${birgiIdCol}::text`);

          let joinClauses = "";
          if (hasBirgjar) {
            joinClauses += ` LEFT JOIN birgjar b ON ${birgiIdCol} = ${birgjarIdCol}`;
          }
          // Only join stofnanir if we didn't resolve the ID directly
          if (hasStofnanir && resolvedInstId === null) {
            joinClauses += ` LEFT JOIN stofnanir s ON ${stofnunIdCol} = ${stofnanirIdCol}`;
          }

          const relationalQuery = `
            SELECT 
              COALESCE(${selectSupplierParts.join(", ")}) AS supplier,
              COUNT(DISTINCT (${birgiIdCol}::text || '_' || ${invoiceExpr}))::int AS "invoiceCount",
              COUNT(*)::int AS "lineCount",
              COALESCE(SUM(${amountCol}), 0)::float AS "totalAmount"
            FROM "${tableName}" r
            ${joinClauses}
            WHERE ${clientCond}
            ${dateConditions}
            ${searchCond}
            GROUP BY 1
            ORDER BY "totalAmount" DESC
            LIMIT 500;
          `;

          const result = await client.query(relationalQuery, values);
          if (result.rows && result.rows.length > 0) {
            rows = result.rows;
            querySuccess = true;
          }
        } catch (relationalErr: any) {
          console.warn("[PostgreSQL] Relational supplier query failed, falling back to flat table:", relationalErr.message);
        }
      }

      // Tier 2: Try direct flat table query if relational yielded no rows or failed
      if (!querySuccess) {
        try {
          const values: any[] = [clientFilter];
          let paramIdx = 2;
          let dateConditions = "";

          if (year && year !== "all") {
            values.push(parseInt(year as string, 10));
            dateConditions += ` AND EXTRACT(YEAR FROM ${dateCol}::timestamp) = $${paramIdx++}`;
          }

          if (month && month !== "all") {
            values.push(parseInt(month as string, 10));
            dateConditions += ` AND EXTRACT(MONTH FROM ${dateCol}::timestamp) = $${paramIdx++}`;
          }

          const flatSupplierExpr = mapping?.supplierCol 
            ? `r."${mapping.supplierCol}"` 
            : (mapping?.birgiIdCol ? `'Birgir #' || r."${mapping.birgiIdCol}"::text` : "'Ótilgreindur birgir'");

          const flatClientCond = mapping?.clientCol
            ? `LOWER(TRIM(r."${mapping.clientCol}"::text)) = LOWER(TRIM($1))`
            : (mapping?.stofnunIdCol ? `('Óskráð stofnun #' || r."${mapping.stofnunIdCol}"::text) = $1 OR r."${mapping.stofnunIdCol}"::text = $1` : "TRUE");

          let searchCond = "";
          if (supplierFilter) {
            values.push(`%${supplierFilter}%`);
            if (mapping?.supplierCol) {
              searchCond += ` AND r."${mapping.supplierCol}"::text ILIKE $${paramIdx++}`;
            } else if (mapping?.birgiIdCol) {
              searchCond += ` AND r."${mapping.birgiIdCol}"::text ILIKE $${paramIdx++}`;
            }
          }

          if (lineFilter) {
            values.push(`%${lineFilter}%`);
            const lParts: string[] = [];
            if (mapping?.descCol) {
              lParts.push(`r."${mapping.descCol}"::text ILIKE $${paramIdx}`);
            }
            lParts.push(`r.tegund::text ILIKE $${paramIdx}`);
            searchCond += ` AND (${lParts.join(" OR ")})`;
            paramIdx++;
          }

          if (search) {
            values.push(`%${search}%`);
            if (mapping?.supplierCol) {
              searchCond += ` AND r."${mapping.supplierCol}"::text ILIKE $${paramIdx++}`;
            } else if (mapping?.birgiIdCol) {
              searchCond += ` AND r."${mapping.birgiIdCol}"::text ILIKE $${paramIdx++}`;
            }
          }

          const flatQuery = `
            SELECT 
              COALESCE(${flatSupplierExpr}, 'Ótilgreindur birgir') AS supplier,
              COUNT(DISTINCT ${invoiceExpr})::int AS "invoiceCount",
              COUNT(*)::int AS "lineCount",
              COALESCE(SUM(${amountCol}), 0)::float AS "totalAmount"
            FROM "${tableName}" r
            WHERE (${flatClientCond})
            ${dateConditions}
            ${searchCond}
            GROUP BY 1
            ORDER BY "totalAmount" DESC
            LIMIT 500;
          `;

          const result = await client.query(flatQuery, values);
          if (result.rows && result.rows.length > 0) {
            rows = result.rows;
            querySuccess = true;
          }
        } catch (flatErr: any) {
          console.error("[PostgreSQL] Flat supplier query failed:", flatErr.message);
        }
      }

      res.json({
        source: "postgres",
        client: clientFilter,
        suppliers: rows.map(r => ({
          supplier: r.supplier || "Ótilgreindur birgir",
          invoiceCount: parseInt(r.invoiceCount, 10) || 0,
          lineCount: parseInt(r.lineCount !== undefined ? r.lineCount : r.invoiceCount, 10) || 0,
          totalAmount: parseFloat(r.totalAmount) || 0
        }))
      });
    } finally {
      release();
    }
  } catch (err: any) {
    console.error("[PostgreSQL] /api/institution-suppliers top-level error:", err.message);
    res.json({
      source: "mock",
      client: req.query.client || "",
      suppliers: [],
      error: err.message
    });
  }
});

// 5.6 Query Top Suppliers across all institutions for a given time period
app.get("/api/top-suppliers", async (req, res) => {
  try {
    const { client, release } = await getConnectedClient();
    try {
      const { year, month, period = "month", limit = "5" } = req.query;
      const numLimit = Math.min(Math.max(parseInt(limit as string, 10) || 5, 1), 50);
      const mapping = await detectTableAndColumns(client);

      // 1. Inspect public tables in the database
      const tablesRes = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
      `);
      const tableNames = tablesRes.rows.map(r => r.table_name.toLowerCase());
      
      // Preferred invoice table
      const tableName = tableNames.find(t => 
        t.includes("reikning") || t.includes("faersl") || t.includes("invoice") || t.includes("opnir")
      ) || tableNames[0] || "reikningar";

      // Inspect columns of invoice table
      const colRes = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = $1;
      `, [tableName]);
      const cols = colRes.rows.map(r => r.column_name.toLowerCase());

      // Check for birgjar table and its columns
      const hasBirgjarTable = tableNames.includes("birgjar");
      let birgjarIdCol = "id";
      let birgjarNameCol = "nafn";
      if (hasBirgjarTable) {
        const bColRes = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_schema = 'public' AND LOWER(table_name) = 'birgjar';
        `);
        const bCols = bColRes.rows.map(r => r.column_name.toLowerCase());
        birgjarIdCol = bCols.find(c => ["id", "birgi_id", "birgir_id", "kennitala", "kt"].includes(c)) || bCols[0] || "id";
        birgjarNameCol = bCols.find(c => ["nafn", "heiti", "birgir", "name"].includes(c)) || bCols.find(c => c !== birgjarIdCol) || bCols[0] || "nafn";
      }

      // Detect column names in invoice table
      const fkCol = cols.find(c => ["birgi_id", "birgir_id", "birgis_id", "birgjar_id", "supplier_id"].includes(c));
      const directSupplierCol = cols.find(c => ["birgir", "supplier", "seljandi", "heiti_birgja", "birgir_heiti"].includes(c));
      const amountCol = cols.find(c => ["upphaed", "amount", "heildarupphaed", "alls_kr", "upphaed_kr"].includes(c)) || "upphaed";
      const dateCol = cols.find(c => ["dags", "dagsetning", "date", "bokad_dags", "reikningsdags"].includes(c));
      const yearCol = cols.find(c => ["ar", "year", "reikningsar"].includes(c));
      const monthCol = cols.find(c => ["manudur", "month", "reikningsmanudur"].includes(c));

      // Safe amount sum expression that supports numeric, text, formatted strings with currency/spaces
      const sumExpr = `COALESCE(SUM(
        CASE 
          WHEN r."${amountCol}"::text ~ '^-?[0-9]' 
          THEN (REGEXP_REPLACE(r."${amountCol}"::text, '[^0-9.-]', '', 'g'))::numeric 
          ELSE 0 
        END
      ), 0)::float`;

      // Helper to build safe date/time conditions
      const buildDateConditions = (yVal?: string, mVal?: string) => {
        const conds: string[] = [];
        const vals: any[] = [];

        if (yVal && yVal !== "all") {
          const yNum = parseInt(yVal, 10);
          if (!isNaN(yNum)) {
            vals.push(yNum);
            if (yearCol) {
              conds.push(`r."${yearCol}"::int = $${vals.length}`);
            } else if (dateCol) {
              conds.push(`(
                CASE 
                  WHEN r."${dateCol}"::text ~ '^\\d{4}' THEN EXTRACT(YEAR FROM r."${dateCol}"::timestamp)
                  WHEN r."${dateCol}"::text ~ '^\\d{1,2}\\.\\d{1,2}\\.\\d{4}' THEN EXTRACT(YEAR FROM TO_DATE(r."${dateCol}"::text, 'DD.MM.YYYY'))
                  WHEN r."${dateCol}"::text ~ '^\\d{1,2}/\\d{1,2}/\\d{4}' THEN EXTRACT(YEAR FROM TO_DATE(r."${dateCol}"::text, 'DD/MM/YYYY'))
                  ELSE NULL 
                END
              ) = $${vals.length}`);
            }
          }
        }

        if (mVal && mVal !== "all") {
          const mNum = parseInt(mVal, 10);
          if (!isNaN(mNum)) {
            vals.push(mNum);
            if (monthCol) {
              conds.push(`r."${monthCol}"::int = $${vals.length}`);
            } else if (dateCol) {
              conds.push(`(
                CASE 
                  WHEN r."${dateCol}"::text ~ '^\\d{4}' THEN EXTRACT(MONTH FROM r."${dateCol}"::timestamp)
                  WHEN r."${dateCol}"::text ~ '^\\d{1,2}\\.\\d{1,2}\\.\\d{4}' THEN EXTRACT(MONTH FROM TO_DATE(r."${dateCol}"::text, 'DD.MM.YYYY'))
                  WHEN r."${dateCol}"::text ~ '^\\d{1,2}/\\d{1,2}/\\d{4}' THEN EXTRACT(MONTH FROM TO_DATE(r."${dateCol}"::text, 'DD/MM/YYYY'))
                  ELSE NULL 
                END
              ) = $${vals.length}`);
            }
          }
        }

        return {
          whereClause: conds.length > 0 ? `WHERE ${conds.join(" AND ")}` : "",
          vals
        };
      };

      // Supplier expression and JOIN clause
      let supplierSelect = directSupplierCol 
        ? `COALESCE(r."${directSupplierCol}", 'Ótilgreindur birgir')` 
        : (fkCol ? `'Birgir #' || r."${fkCol}"::text` : "'Ótilgreindur birgir'");
      let joinClause = "";
      let groupByClause = "1";

      if (hasBirgjarTable && (fkCol || mapping?.birgiIdCol)) {
        const joinFk = fkCol || mapping?.birgiIdCol || "birgi_id";
        supplierSelect = `COALESCE(b."${birgjarNameCol}", 'Óskráður birgir #' || r."${joinFk}"::text)`;
        joinClause = `LEFT JOIN birgjar b ON r."${joinFk}"::text = b."${birgjarIdCol}"::text`;
        groupByClause = `b."${birgjarNameCol}", r."${joinFk}"`;
      } else if (directSupplierCol) {
        supplierSelect = `COALESCE(r."${directSupplierCol}", 'Ótilgreindur birgir')`;
        joinClause = "";
        groupByClause = `r."${directSupplierCol}"`;
      } else if (fkCol) {
        supplierSelect = `'Birgir #' || r."${fkCol}"::text`;
        joinClause = "";
        groupByClause = `r."${fkCol}"`;
      }

      const invoiceExpr = getInvoiceNumberExpr("r", mapping);

      const runQuery = async (whereClause: string, params: any[]) => {
        const sql = `
          SELECT 
            ${supplierSelect} AS supplier,
            COUNT(DISTINCT ${invoiceExpr})::int AS "invoiceCount",
            COUNT(*)::int AS "lineCount",
            ${sumExpr} AS "totalAmount"
          FROM "${tableName}" r
          ${joinClause}
          ${whereClause}
          GROUP BY ${groupByClause}
          ORDER BY 4 DESC
          LIMIT ${numLimit};
        `;
        const res = await client.query(sql, params);
        return res.rows || [];
      };

      let rows: any[] = [];
      const isYearPeriod = period === "year";
      const targetMonth = isYearPeriod ? undefined : (month as string);

      // Tier 1: Try requested period (year + month)
      const t1 = buildDateConditions(year as string, targetMonth);
      try {
        rows = await runQuery(t1.whereClause, t1.vals);
      } catch (err: any) {
        console.warn("[PostgreSQL] Tier 1 top-suppliers query failed:", err.message);
      }

      // Tier 2: If no rows found with month filter, fallback to entire year
      if (rows.length === 0 && targetMonth && targetMonth !== "all") {
        const t2 = buildDateConditions(year as string, undefined);
        try {
          rows = await runQuery(t2.whereClause, t2.vals);
        } catch (err: any) {
          console.warn("[PostgreSQL] Tier 2 top-suppliers query failed:", err.message);
        }
      }

      // Tier 3: If still no rows found, fallback to top suppliers across entire database
      if (rows.length === 0) {
        try {
          rows = await runQuery("", []);
        } catch (err: any) {
          console.warn("[PostgreSQL] Tier 3 top-suppliers query failed:", err.message);
        }
      }

      // Compute period-adjusted values if requested
      const scaleMultiplier = period === "week" ? (1 / 4.33) : period === "day" ? (1 / 30) : 1;

      res.json({
        source: "postgres",
        year: year || "all",
        month: month || "all",
        period,
        suppliers: rows.map(r => ({
          supplier: r.supplier || "Ótilgreindur birgir",
          invoiceCount: parseInt(r.invoiceCount, 10) || 0,
          total: Math.round((parseFloat(r.totalAmount) || 0) * scaleMultiplier)
        }))
      });
    } finally {
      release();
    }
  } catch (err: any) {
    console.error("[PostgreSQL] /api/top-suppliers top-level error:", err.message);
    res.json({
      source: "mock",
      suppliers: [],
      error: err.message
    });
  }
});

// 6. Query Invoices from PostgreSQL with multi-tier relational and flat fallbacks
app.get("/api/invoices", async (req, res) => {
  try {
    const { client, release } = await getConnectedClient();
    try {
      const {
        client: clientFilter,
        supplier,
        search,
        line,
        year,
        month,
        limit = "25",
        offset = "0",
        sort = "asc"
      } = req.query;

      let queryRows: any[] = [];
      let querySuccess = false;

      const limitVal = Math.min(Math.max(parseInt(limit as string, 10) || 25, 1), 1000);
      const offsetVal = Math.max(parseInt(offset as string, 10) || 0, 0);
      const sortOrder = (sort as string)?.toLowerCase() === "desc" ? "DESC" : "ASC";

      // ---------------------------------------------------------
      // TIER 1: Standard Canonical Relational Query (reikningar, birgjar, stofnanir)
      // ---------------------------------------------------------
      try {
        const t1Vals: any[] = [];
        const t1Conds: string[] = [];

        // Fast-resolve client / institution ID to use index scan on r.stofnun_id
        if (clientFilter) {
          const clientNumMatch = (clientFilter as string).match(/(?:#|^)(\d+)$/);
          if (clientNumMatch) {
            t1Vals.push(parseInt(clientNumMatch[1], 10));
            t1Conds.push(`r.stofnun_id = $${t1Vals.length}`);
          } else {
            const trimmed = (clientFilter as string).trim();
            const pattern = `%${trimmed.replace(/\s+/g, "%")}%`;
            try {
              const cRes = await client.query(
                `SELECT id FROM stofnanir 
                 WHERE LOWER(TRIM(nafn::text)) = LOWER(TRIM($1))
                    OR nafn::text ILIKE $2
                 ORDER BY (LOWER(TRIM(nafn::text)) = LOWER(TRIM($1))) DESC
                 LIMIT 100`,
                [trimmed, pattern]
              );
              if (cRes.rows && cRes.rows.length > 0) {
                const cIds = cRes.rows.map(r => r.id);
                t1Vals.push(cIds);
                t1Conds.push(`r.stofnun_id = ANY($${t1Vals.length}::int[])`);
              } else {
                t1Vals.push(pattern);
                const idx1 = t1Vals.length;
                t1Vals.push(trimmed);
                const idx2 = t1Vals.length;
                t1Conds.push(`(
                  s.nafn::text ILIKE $${idx1}
                  OR ('Óskráð stofnun #' || r.stofnun_id::text) ILIKE $${idx1}
                  OR ('Stofnun #' || r.stofnun_id::text) ILIKE $${idx1}
                  OR r.stofnun_id::text = $${idx2}
                )`);
              }
            } catch {
              t1Vals.push(pattern);
              const idx1 = t1Vals.length;
              t1Vals.push(trimmed);
              const idx2 = t1Vals.length;
              t1Conds.push(`(s.nafn::text ILIKE $${idx1} OR r.stofnun_id::text = $${idx2})`);
            }
          }
        }

        // Fast-resolve supplier ID to use index scan on r.birgi_id
        if (supplier) {
          const supplierNumMatch = (supplier as string).match(/(?:#|^)(\d+)$/);
          if (supplierNumMatch) {
            t1Vals.push(parseInt(supplierNumMatch[1], 10));
            t1Conds.push(`r.birgi_id = $${t1Vals.length}`);
          } else {
            const trimmed = (supplier as string).trim();
            const pattern = `%${trimmed.replace(/\s+/g, "%")}%`;
            try {
              const sRes = await client.query(
                `SELECT id FROM birgjar 
                 WHERE LOWER(TRIM(nafn::text)) = LOWER(TRIM($1))
                    OR nafn::text ILIKE $2
                 ORDER BY (LOWER(TRIM(nafn::text)) = LOWER(TRIM($1))) DESC
                 LIMIT 200`,
                [trimmed, pattern]
              );
              if (sRes.rows && sRes.rows.length > 0) {
                const bIds = sRes.rows.map(r => r.id);
                t1Vals.push(bIds);
                t1Conds.push(`r.birgi_id = ANY($${t1Vals.length}::int[])`);
              } else {
                t1Vals.push(pattern);
                const idx1 = t1Vals.length;
                t1Vals.push(trimmed);
                const idx2 = t1Vals.length;
                t1Conds.push(`(
                  b.nafn::text ILIKE $${idx1}
                  OR ('Óskráður birgir #' || r.birgi_id::text) ILIKE $${idx1}
                  OR ('Birgir #' || r.birgi_id::text) ILIKE $${idx1}
                  OR r.birgi_id::text = $${idx2}
                )`);
              }
            } catch {
              t1Vals.push(pattern);
              const idx1 = t1Vals.length;
              t1Vals.push(trimmed);
              const idx2 = t1Vals.length;
              t1Conds.push(`(b.nafn::text ILIKE $${idx1} OR r.birgi_id::text = $${idx2})`);
            }
          }
        }

        if (search) {
          t1Vals.push(`%${search}%`);
          const idx = t1Vals.length;
          t1Conds.push(`(
            b.nafn ILIKE $${idx}
            OR s.nafn ILIKE $${idx}
            OR r.tegund::text ILIKE $${idx}
            OR r.numer::text ILIKE $${idx}
            OR r.id::text ILIKE $${idx}
          )`);
        }

        if (line) {
          t1Vals.push(`%${line}%`);
          const idx = t1Vals.length;
          t1Conds.push(`(r.tegund::text ILIKE $${idx} OR r.id::text ILIKE $${idx})`);
        }

        if (year && year !== "all") {
          t1Vals.push(parseInt(year as string, 10));
          const idx = t1Vals.length;
          t1Conds.push(`EXTRACT(YEAR FROM r.dags::timestamp) = $${idx}`);
        }

        if (month && month !== "all") {
          t1Vals.push(parseInt(month as string, 10));
          const idx = t1Vals.length;
          t1Conds.push(`EXTRACT(MONTH FROM r.dags::timestamp) = $${idx}`);
        }

        const t1Where = t1Conds.length > 0 ? `WHERE ${t1Conds.join(" AND ")}` : "";

        t1Vals.push(limitVal);
        const lIdx = t1Vals.length;
        t1Vals.push(offsetVal);
        const oIdx = t1Vals.length;

        const t1Query = `
          SELECT 
            r.id,
            COALESCE(NULLIF(TRIM(r.numer::text), ''), 'REIKN-' || r.id::text) AS numer,
            COALESCE(NULLIF(TRIM(b.nafn::text), ''), 'Óskráður birgir #' || r.birgi_id::text) AS supplier,
            COALESCE(NULLIF(TRIM(s.nafn::text), ''), 'Óskráð stofnun #' || r.stofnun_id::text) AS client,
            r.upphaed AS amount,
            r.dags AS date,
            COALESCE(r.tegund, 'Almennur rekstur') AS description
          FROM reikningar r
          LEFT JOIN birgjar b ON r.birgi_id = b.id
          LEFT JOIN stofnanir s ON r.stofnun_id = s.id
          ${t1Where}
          ORDER BY r.dags ${sortOrder} NULLS LAST, r.id ${sortOrder}
          LIMIT $${lIdx} OFFSET $${oIdx};
        `;

        const res1 = await client.query(t1Query, t1Vals);
        queryRows = res1.rows;
        querySuccess = true;
      } catch (t1Err: any) {
        console.warn("[PostgreSQL] /api/invoices Tier 1 query failed, trying dynamic relational mapping:", t1Err.message);
      }

      // ---------------------------------------------------------
      // TIER 2: Dynamic Relational Mapping Query
      // ---------------------------------------------------------
      if (!querySuccess) {
        try {
          const mapping = await detectTableAndColumns(client);
          const tableName = mapping?.tableName || "reikningar";
          const hasStofnanir = Boolean(mapping?.hasStofnanirTable);
          const hasBirgjar = Boolean(mapping?.hasBirgjarTable);
          const isRelational = hasStofnanir || hasBirgjar;

          const dateCol = mapping?.dateCol ? `r."${mapping.dateCol}"` : "r.dags";
          const amountCol = mapping?.amountCol ? `r."${mapping.amountCol}"` : "r.upphaed";
          const birgiIdCol = mapping?.birgiIdCol ? `r."${mapping.birgiIdCol}"` : "r.birgi_id";
          const stofnunIdCol = mapping?.stofnunIdCol ? `r."${mapping.stofnunIdCol}"` : "r.stofnun_id";
          const birgjarCol = mapping?.birgjarNameCol ? `b."${mapping.birgjarNameCol}"` : "b.nafn";
          const stofnanirCol = mapping?.stofnanirNameCol ? `s."${mapping.stofnanirNameCol}"` : "s.nafn";
          const birgjarIdCol = mapping?.birgjarIdCol ? `b."${mapping.birgjarIdCol}"` : "b.id";
          const stofnanirIdCol = mapping?.stofnanirIdCol ? `s."${mapping.stofnanirIdCol}"` : "s.id";
          const invoiceExpr = getInvoiceNumberExpr("r", mapping);
          const descExpr = mapping?.descCol ? `COALESCE(r."${mapping.descCol}", 'Almennur rekstur')` : `'Almennur rekstur'`;

          const t2Vals: any[] = [];
          const t2Conds: string[] = [];

          if (clientFilter) {
            const trimmed = (clientFilter as string).trim();
            const prefixMatch = trimmed.replace(/\.*$/, '');
            t2Vals.push(trimmed);
            const pExact = t2Vals.length;
            t2Vals.push(prefixMatch);
            const pPrefix = t2Vals.length;

            const clientOrs: string[] = [];
            if (hasStofnanir) {
              clientOrs.push(`LOWER(TRIM(${stofnanirCol}::text)) = LOWER(TRIM($${pExact}))`);
              clientOrs.push(`${stofnanirCol}::text ILIKE $${pPrefix} || '%'`);
            }
            if (mapping?.clientCol) {
              clientOrs.push(`LOWER(TRIM(r."${mapping.clientCol}"::text)) = LOWER(TRIM($${pExact}))`);
              clientOrs.push(`r."${mapping.clientCol}"::text ILIKE $${pPrefix} || '%'`);
            }
            clientOrs.push(`('Óskráð stofnun #' || ${stofnunIdCol}::text) = $${pExact}`);
            clientOrs.push(`('Stofnun #' || ${stofnunIdCol}::text) = $${pExact}`);
            clientOrs.push(`${stofnunIdCol}::text = $${pExact}`);
            t2Conds.push(`(${clientOrs.join(" OR ")})`);
          }

          if (supplier) {
            const trimmed = (supplier as string).trim();
            const prefixMatch = trimmed.replace(/\.*$/, '');
            t2Vals.push(trimmed);
            const pExact = t2Vals.length;
            t2Vals.push(prefixMatch);
            const pPrefix = t2Vals.length;

            const supplierOrs: string[] = [];
            if (hasBirgjar) {
              supplierOrs.push(`LOWER(TRIM(${birgjarCol}::text)) = LOWER(TRIM($${pExact}))`);
              supplierOrs.push(`${birgjarCol}::text ILIKE $${pPrefix} || '%'`);
            }
            if (mapping?.supplierCol) {
              supplierOrs.push(`LOWER(TRIM(r."${mapping.supplierCol}"::text)) = LOWER(TRIM($${pExact}))`);
              supplierOrs.push(`r."${mapping.supplierCol}"::text ILIKE $${pPrefix} || '%'`);
            }
            supplierOrs.push(`('Óskráður birgir #' || ${birgiIdCol}::text) = $${pExact}`);
            supplierOrs.push(`('Birgir #' || ${birgiIdCol}::text) = $${pExact}`);
            supplierOrs.push(`${birgiIdCol}::text = $${pExact}`);
            t2Conds.push(`(${supplierOrs.join(" OR ")})`);
          }

          if (search) {
            t2Vals.push(`%${search}%`);
            const pIdx = t2Vals.length;
            const searchParts: string[] = [];
            if (hasBirgjar) searchParts.push(`${birgjarCol}::text ILIKE $${pIdx}`);
            if (hasStofnanir) searchParts.push(`${stofnanirCol}::text ILIKE $${pIdx}`);
            if (mapping?.supplierCol) searchParts.push(`r."${mapping.supplierCol}"::text ILIKE $${pIdx}`);
            if (mapping?.clientCol) searchParts.push(`r."${mapping.clientCol}"::text ILIKE $${pIdx}`);
            if (mapping?.descCol) searchParts.push(`r."${mapping.descCol}"::text ILIKE $${pIdx}`);
            searchParts.push(`${invoiceExpr} ILIKE $${pIdx}`);
            searchParts.push(`r.id::text ILIKE $${pIdx}`);
            t2Conds.push(`(${searchParts.join(" OR ")})`);
          }

          if (line) {
            t2Vals.push(`%${line}%`);
            const pIdx = t2Vals.length;
            const lineParts: string[] = [];
            if (mapping?.descCol) lineParts.push(`r."${mapping.descCol}"::text ILIKE $${pIdx}`);
            lineParts.push(`r.tegund::text ILIKE $${pIdx}`);
            lineParts.push(`r.id::text ILIKE $${pIdx}`);
            t2Conds.push(`(${lineParts.join(" OR ")})`);
          }

          if (year && year !== "all") {
            t2Vals.push(parseInt(year as string, 10));
            const pIdx = t2Vals.length;
            t2Conds.push(`EXTRACT(YEAR FROM ${dateCol}::timestamp) = $${pIdx}`);
          }

          if (month && month !== "all") {
            t2Vals.push(parseInt(month as string, 10));
            const pIdx = t2Vals.length;
            t2Conds.push(`EXTRACT(MONTH FROM ${dateCol}::timestamp) = $${pIdx}`);
          }

          const t2Where = t2Conds.length > 0 ? `WHERE ${t2Conds.join(" AND ")}` : "";

          t2Vals.push(limitVal);
          const limitIndex = t2Vals.length;
          t2Vals.push(offsetVal);
          const offsetIndex = t2Vals.length;

          let queryStr = "";
          if (isRelational) {
            let joins = "";
            if (hasBirgjar) {
              joins += ` LEFT JOIN birgjar b ON ${birgiIdCol} = ${birgjarIdCol}`;
            }
            if (hasStofnanir) {
              joins += ` LEFT JOIN stofnanir s ON ${stofnunIdCol} = ${stofnanirIdCol}`;
            }

            const supplierSelectExpr = hasBirgjar 
              ? `COALESCE(${birgjarCol}, ${mapping?.supplierCol ? `r."${mapping.supplierCol}"` : `'Óskráður birgir #' || ${birgiIdCol}::text`})`
              : (mapping?.supplierCol ? `COALESCE(r."${mapping.supplierCol}", 'Óskráður birgir')` : `'Óskráður birgir #' || ${birgiIdCol}::text`);

            const clientSelectExpr = hasStofnanir
              ? `COALESCE(${stofnanirCol}, ${mapping?.clientCol ? `r."${mapping.clientCol}"` : `'Óskráð stofnun #' || ${stofnunIdCol}::text`})`
              : (mapping?.clientCol ? `COALESCE(r."${mapping.clientCol}", 'Óskráð stofnun')` : `'Óskráð stofnun #' || ${stofnunIdCol}::text`);

            queryStr = `
              SELECT 
                r.id,
                ${invoiceExpr} AS numer,
                ${supplierSelectExpr} AS supplier,
                ${clientSelectExpr} AS client,
                ${amountCol} AS amount,
                ${dateCol} AS date,
                ${descExpr} AS description
              FROM "${tableName}" r
              ${joins}
              ${t2Where}
              ORDER BY ${dateCol} ${sortOrder} NULLS LAST, r.id ${sortOrder}
              LIMIT $${limitIndex} OFFSET $${offsetIndex};
            `;
          } else {
            const supplierSelectExpr = mapping?.supplierCol 
              ? `COALESCE(r."${mapping.supplierCol}", 'Óskráður birgir')` 
              : `'Óskráður birgir'`;
            const clientSelectExpr = mapping?.clientCol 
              ? `COALESCE(r."${mapping.clientCol}", 'Óskráð stofnun')` 
              : `'Óskráð stofnun'`;

            queryStr = `
              SELECT 
                r.id,
                ${invoiceExpr} AS numer,
                ${supplierSelectExpr} AS supplier,
                ${clientSelectExpr} AS client,
                ${amountCol} AS amount,
                ${dateCol} AS date,
                ${descExpr} AS description
              FROM "${tableName}" r
              ${t2Where}
              ORDER BY ${dateCol} ${sortOrder} NULLS LAST, r.id ${sortOrder}
              LIMIT $${limitIndex} OFFSET $${offsetIndex};
            `;
          }

          const res2 = await client.query(queryStr, t2Vals);
          queryRows = res2.rows;
          querySuccess = true;
        } catch (t2Err: any) {
          console.error("[PostgreSQL] /api/invoices Tier 2 query failed:", t2Err.message);
        }
      }

      res.json({
        source: "postgres",
        count: queryRows.length,
        rows: queryRows.map(r => ({
          id: String(r.numer || r.id),
          supplier: r.supplier || "Ótilgreindur birgir",
          amount: parseFloat(r.amount) || 0,
          date: formatRowDate(r.date, year as string),
          client: r.client || "Ótilgreind stofnun",
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
    console.error("[PostgreSQL] /api/invoices fatal error:", err);
    res.json({
      source: "mock",
      count: 0,
      rows: [],
      error: err.message,
      message: "Gat ekki sótt reikninga úr PostgreSQL."
    });
  }
});

// 6b. Grants & Subsidies Analysis endpoint (Styrkir, framlög og gefins fé úr ríkissjóði)
app.get("/api/grants", async (req, res) => {
  const startTime = Date.now();
  try {
    const { client, release } = await getConnectedClient();
    try {
      const { year, pattern, limit = "100", minAmount = "0", excludeInternal = "true" } = req.query;

      const mapping = await detectTableAndColumns(client);
      const tableName = mapping?.tableName || "reikningar";
      const dateCol = mapping?.dateCol ? `r."${mapping.dateCol}"` : "r.dags";
      const amountCol = mapping?.amountCol ? `r."${mapping.amountCol}"` : "r.upphaed";
      const descCol = mapping?.descCol ? `r."${mapping.descCol}"` : "r.tegund";
      const stofnunIdCol = mapping?.stofnunIdCol ? `r."${mapping.stofnunIdCol}"` : "r.stofnun_id";
      const birgiIdCol = mapping?.birgiIdCol ? `r."${mapping.birgiIdCol}"` : "r.birgi_id";
      const hasBirgjar = mapping?.hasBirgjarTable ?? false;
      const hasStofnanir = mapping?.hasStofnanirTable ?? false;

      // Default regex matching grants, gifts, subsidies, awards, payouts without direct reciprocal product
      const regexPattern = typeof pattern === "string" && pattern.trim() 
        ? pattern.trim() 
        : "(styrk|framlag|framlög|stuðning|niðurgreiðsl|úthlutun|gjöf|gjafir|verðlaun|endurgreiðsl)";

      const values: any[] = [regexPattern];
      let paramIdx = 2;
      const whereConditions: string[] = [`${descCol} ~* $1`];

      // Útiloka innbyrðis framlög milli A-hluta stofnana (millifærslur milli ríkisstofnana en ekki styrkir til samfélagsins)
      if (excludeInternal !== "false") {
        whereConditions.push(`NOT (${descCol} ~* 'innbyrðis')`);
      }

      if (year && year !== "all") {
        values.push(parseInt(year as string, 10));
        whereConditions.push(`EXTRACT(YEAR FROM ${dateCol}::timestamp) = $${paramIdx++}`);
      }

      const minAmtVal = parseFloat(minAmount as string) || 0;
      if (minAmtVal > 0) {
        values.push(minAmtVal);
        whereConditions.push(`${amountCol} >= $${paramIdx++}`);
      }

      const whereClause = `WHERE ${whereConditions.join(" AND ")}`;

      // OPTIMIZATION FOR 18 MILLION ROWS:
      // Materialize matching rows into a temporary table so PostgreSQL only scans the main table ONCE!
      // This prevents 5 separate full-table sequential scans (which previously took >100 seconds).
      await client.query(`DROP TABLE IF EXISTS _tmp_grants;`).catch(() => {});
      await client.query(`
        CREATE TEMP TABLE _tmp_grants AS
        SELECT 
          r.id,
          COALESCE(r.numer::text, r.id::text) AS "invoiceNumber",
          ${dateCol} AS date,
          ${amountCol}::float AS amount,
          COALESCE(NULLIF(TRIM(${descCol}::text), ''), 'Ótilgreind tegund') AS category,
          ${stofnunIdCol} AS stofnun_id,
          ${birgiIdCol} AS birgi_id
        FROM "${tableName}" r
        ${whereClause};
      `, values);

      // 1. Summary (runs in-memory in < 5ms)
      const summaryRes = await client.query(`
        SELECT 
          COUNT(*)::int AS "invoiceCount",
          COALESCE(SUM(amount), 0)::float AS "totalAmount",
          COUNT(DISTINCT birgi_id)::int AS "supplierCount",
          COUNT(DISTINCT stofnun_id)::int AS "institutionCount"
        FROM _tmp_grants;
      `);
      const summary = summaryRes.rows[0] || { invoiceCount: 0, totalAmount: 0, supplierCount: 0, institutionCount: 0 };

      // 2. By Category (tegund rukkunar - runs in < 5ms)
      const byCatRes = await client.query(`
        SELECT 
          category,
          COUNT(*)::int AS count,
          COALESCE(SUM(amount), 0)::float AS "totalAmount"
        FROM _tmp_grants
        GROUP BY 1
        ORDER BY "totalAmount" DESC
        LIMIT 30;
      `);

      // 3. Top Recipients (Birgjar / Styrkþegar)
      let recipientJoin = "";
      let recipientNameExpr = `'Óskráður aðili #' || t.birgi_id::text`;
      if (hasBirgjar) {
        recipientJoin = `LEFT JOIN birgjar b ON t.birgi_id = b.id`;
        recipientNameExpr = `COALESCE(NULLIF(TRIM(b.nafn::text), ''), 'Óskráður aðili #' || t.birgi_id::text)`;
      }
      const topRecRes = await client.query(`
        SELECT 
          ${recipientNameExpr} AS recipient,
          COUNT(*)::int AS count,
          COALESCE(SUM(t.amount), 0)::float AS "totalAmount"
        FROM _tmp_grants t
        ${recipientJoin}
        GROUP BY 1
        ORDER BY "totalAmount" DESC
        LIMIT 200;
      `);

      // 4. Top Payers (Stofnanir sem veita styrki)
      let payerJoin = "";
      let payerNameExpr = `'Óskráð stofnun #' || t.stofnun_id::text`;
      if (hasStofnanir) {
        payerJoin = `LEFT JOIN stofnanir s ON t.stofnun_id = s.id`;
        payerNameExpr = `COALESCE(NULLIF(TRIM(s.nafn::text), ''), 'Óskráð stofnun #' || t.stofnun_id::text)`;
      }
      const topPayRes = await client.query(`
        SELECT 
          ${payerNameExpr} AS payer,
          COUNT(*)::int AS count,
          COALESCE(SUM(t.amount), 0)::float AS "totalAmount"
        FROM _tmp_grants t
        ${payerJoin}
        GROUP BY 1
        ORDER BY "totalAmount" DESC
        LIMIT 25;
      `);

      // 5. Sample Rows (stakar færslur raðaðar eftir upphæð)
      const limitVal = Math.min(parseInt(limit as string, 10) || 100, 500);
      const sampleRes = await client.query(`
        SELECT 
          t.id,
          t."invoiceNumber",
          t.date,
          ${payerNameExpr} AS institution,
          ${recipientNameExpr} AS supplier,
          t.category,
          t.amount
        FROM _tmp_grants t
        ${recipientJoin}
        ${payerJoin}
        ORDER BY t.amount DESC NULLS LAST
        LIMIT ${limitVal};
      `);

      await client.query(`DROP TABLE IF EXISTS _tmp_grants;`).catch(() => {});

      const latencyMs = Date.now() - startTime;

      res.json({
        source: "postgres",
        latencyMs,
        pattern: regexPattern,
        summary: {
          invoiceCount: parseInt(summary.invoiceCount, 10) || 0,
          totalAmount: parseFloat(summary.totalAmount) || 0,
          supplierCount: parseInt(summary.supplierCount, 10) || 0,
          institutionCount: parseInt(summary.institutionCount, 10) || 0
        },
        byCategory: byCatRes.rows.map(r => ({
          category: r.category,
          count: parseInt(r.count, 10) || 0,
          totalAmount: parseFloat(r.totalAmount) || 0
        })),
        topRecipients: topRecRes.rows.map(r => ({
          recipient: r.recipient,
          count: parseInt(r.count, 10) || 0,
          totalAmount: parseFloat(r.totalAmount) || 0
        })),
        topPayers: topPayRes.rows.map(r => ({
          payer: r.payer,
          count: parseInt(r.count, 10) || 0,
          totalAmount: parseFloat(r.totalAmount) || 0
        })),
        sampleRows: sampleRes.rows.map(r => ({
          id: r.id,
          invoiceNumber: r.invoiceNumber,
          date: r.date,
          institution: r.institution,
          supplier: r.supplier,
          category: r.category,
          amount: parseFloat(r.amount) || 0
        }))
      });
    } finally {
      release();
    }
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    res.json({
      source: "mock",
      latencyMs,
      error: err.message,
      summary: {
        invoiceCount: 142318,
        totalAmount: 245800000000,
        supplierCount: 3412,
        institutionCount: 114
      },
      byCategory: [
        { category: "Styrkir og rekstrarframlög", count: 48920, totalAmount: 92400000000 },
        { category: "Framlög til félagasamtaka og sjálfseignarstofnana", count: 29400, totalAmount: 51200000000 },
        { category: "Rannsóknar- og tækniþróunarstyrkir (Rannís)", count: 18500, totalAmount: 34600000000 },
        { category: "Sérstakur rekstrarstuðningur og viðspyrna", count: 15400, totalAmount: 28900000000 },
        { category: "Listamannalaun og starfsstyrkir", count: 12200, totalAmount: 14100000000 },
        { category: "Niðurgreiðslur og vaxtastyrkir", count: 8600, totalAmount: 11800000000 },
        { category: "Úthlutun úr Opinberum sjóðum", count: 6400, totalAmount: 8900000000 },
        { category: "Kvikmyndaendurgreiðslur og framlög", count: 2100, totalAmount: 3500000000 },
        { category: "Gjafir, heiðurslaun og verðlaun", count: 798, totalAmount: 400000000 }
      ],
      topRecipients: [
        { recipient: "Rannís (Rannsóknamiðstöð Íslands)", count: 8200, totalAmount: 32500000000 },
        { recipient: "Kvikmyndasjóður Íslands", count: 1420, totalAmount: 14800000000 },
        { recipient: "Háskóli Íslands - Rannsóknasjóður", count: 4950, totalAmount: 12400000000 },
        { recipient: "Rauði krossinn á Íslandi", count: 1850, totalAmount: 9800000000 },
        { recipient: "Landsbjörg - Slysavarnafélagið", count: 1620, totalAmount: 7600000000 },
        { recipient: "Bændasamtök Íslands", count: 2100, totalAmount: 6900000000 },
        { recipient: "Íþrótta- og Ólympíusamband Íslands (ÍSÍ)", count: 2400, totalAmount: 5800000000 },
        { recipient: "Þjóðleikhúsið (Rekstrarframlag)", count: 890, totalAmount: 4900000000 },
        // Markaðsstofur landshlutanna & Ferðamál (ses)
        { recipient: "Markaðsstofa Norðurlands ses", count: 320, totalAmount: 1840000000 },
        { recipient: "Markaðsstofa Suðurlands ses", count: 290, totalAmount: 1620000000 },
        { recipient: "Markaðsstofa Reykjaness ses", count: 210, totalAmount: 1150000000 },
        { recipient: "Markaðsstofa Vestfjarða ses", count: 195, totalAmount: 980000000 },
        { recipient: "Markaðsstofa Austurlands ses", count: 180, totalAmount: 890000000 },
        { recipient: "Markaðsstofa Vesturlands ses", count: 175, totalAmount: 840000000 },
        { recipient: "Markaðsstofa Höfuðborgarsvæðisins ses", count: 160, totalAmount: 760000000 },
        { recipient: "Ferðamálasamtök Íslands", count: 85, totalAmount: 420000000 },
        // Sambönd & Samtök sveitarfélaga
        { recipient: "Samband íslenskra sveitarfélaga", count: 640, totalAmount: 4200000000 },
        { recipient: "Samtök sunnlenskra sveitarfélaga (SASS)", count: 280, totalAmount: 1450000000 },
        { recipient: "Samtök sveitarfélaga á Vesturlandi (SSV)", count: 210, totalAmount: 1120000000 },
        { recipient: "Samband sveitarfélaga á Suðurnesjum (SSS)", count: 190, totalAmount: 960000000 },
        { recipient: "Samtök sveitarfélaga á Norðurlandi vestra (SSNV)", count: 170, totalAmount: 880000000 },
        { recipient: "Eyþing - Samband sveitarfélaga í Eyjafirði og Þingeyjarsýslum", count: 150, totalAmount: 790000000 },
        // Einkahlutafélög (ehf)
        { recipient: "Carbfix ehf.", count: 42, totalAmount: 1850000000 },
        { recipient: "Kerecis ehf.", count: 38, totalAmount: 1420000000 },
        { recipient: "Sidekick Health ehf.", count: 35, totalAmount: 980000000 },
        { recipient: "Controlant ehf.", count: 29, totalAmount: 760000000 },
        { recipient: "Carbon Recycling International ehf.", count: 22, totalAmount: 640000000 },
        // Sjálfseignarstofnanir (ses)
        { recipient: "Menntafélag Akureyrar ses", count: 95, totalAmount: 620000000 },
        { recipient: "Leikfélag Akureyrar ses", count: 88, totalAmount: 490000000 }
      ],
      topPayers: [
        { payer: "Menningar- og viðskiptaráðuneytið", count: 24900, totalAmount: 64200000000 },
        { payer: "Háskóla-, iðnaðar- og nýsköpunarráðuneytið", count: 19800, totalAmount: 58100000000 },
        { payer: "Félags- og vinnumarkaðsráðuneytið", count: 31200, totalAmount: 49600000000 },
        { payer: "Matvælaráðuneytið", count: 18400, totalAmount: 36700000000 },
        { payer: "Fjármála- og efnahagsráðuneytið", count: 14200, totalAmount: 22400000000 },
        { payer: "Innviðaráðuneytið", count: 11200, totalAmount: 14800000000 }
      ],
      sampleRows: [
        { id: "1098201", invoiceNumber: "STY-2025-091", date: "2025-11-14", institution: "Menningar- og viðskiptaráðuneytið", supplier: "Kvikmyndasjóður Íslands", category: "Framlag til kvikmyndagerðar", amount: 485000000 },
        { id: "1087412", invoiceNumber: "RAN-2025-442", date: "2025-10-02", institution: "Háskóla-, iðnaðar- og nýsköpunarráðuneytið", supplier: "Rannís (Rannsóknamiðstöð Íslands)", category: "Rannsóknarstyrkur tækniþróunar", amount: 320000000 },
        { id: "1076231", invoiceNumber: "FEL-2025-118", date: "2025-09-18", institution: "Félags- og vinnumarkaðsráðuneytið", supplier: "Rauði krossinn á Íslandi", category: "Rekstrarframlag mannúðarmála", amount: 195000000 },
        { id: "1064998", invoiceNumber: "MAT-2025-882", date: "2025-08-05", institution: "Matvælaráðuneytið", supplier: "Bændasamtök Íslands", category: "Framlög skv. búvörusamningi", amount: 175000000 },
        { id: "1053120", invoiceNumber: "MEN-2025-032", date: "2025-07-22", institution: "Menningar- og viðskiptaráðuneytið", supplier: "Bandalag íslenskra listamanna", category: "Starfsstyrkir og listamannalaun", amount: 140000000 }
      ]
    });
  }
});

// 6c. Check index status on tegund column (Trigram GIN)
app.get("/api/grants-index-status", async (_req, res) => {
  try {
    const { client, release } = await getConnectedClient();
    try {
      const extRes = await client.query(`
        SELECT EXISTS (
          SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm'
        ) AS has_extension;
      `);
      const idxRes = await client.query(`
        SELECT 
          indexname, 
          indexdef 
        FROM pg_indexes 
        WHERE (indexname ILIKE '%tegund%trgm%' OR indexdef ILIKE '%gin%tegund%')
          AND tablename ILIKE '%reikning%';
      `);

      const hasExtension = extRes.rows[0]?.has_extension ?? false;
      const hasIndex = idxRes.rows.length > 0;
      const indexName = idxRes.rows[0]?.indexname || null;

      res.json({
        connected: true,
        hasExtension,
        hasIndex,
        indexName,
        message: hasIndex 
          ? `Trigram GIN vísir er virkur (${indexName})` 
          : "Trigram GIN vísir er ekki til staðar á gagnagrunninum."
      });
    } finally {
      release();
    }
  } catch (err: any) {
    res.json({
      connected: false,
      hasExtension: false,
      hasIndex: false,
      indexName: null,
      error: err.message
    });
  }
});

// 6d. Create Trigram GIN index on tegund column
app.post("/api/create-grants-index", async (_req, res) => {
  try {
    const { client, release } = await getConnectedClient();
    try {
      // 1. Virkja pg_trgm
      await client.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);

      // 2. Finna töflu og dálk
      const mapping = await detectTableAndColumns(client);
      const tableName = mapping?.tableName || "reikningar";
      const descCol = mapping?.descCol || "tegund";

      // Hækka vinnsluminni tímabundið fyrir hraðari vísagerð ef leyft
      await client.query(`SET maintenance_work_mem = '512MB';`).catch(() => {});

      const createStart = Date.now();
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_reikningar_tegund_trgm 
        ON "${tableName}" USING gin ("${descCol}" gin_trgm_ops);
      `);
      const durationMs = Date.now() - createStart;

      res.json({
        success: true,
        durationMs,
        message: `Vísir idx_reikningar_tegund_trgm var búinn til á ${(durationMs / 1000).toFixed(1)} sek!`
      });
    } finally {
      release();
    }
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message,
      message: `Ekki tókst að búa til vísi: ${err.message}`
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
      const dateCol = mapping?.dateCol ? `r."${mapping.dateCol}"` : "r.dags";
      const amountCol = mapping?.amountCol ? `r."${mapping.amountCol}"` : "r.upphaed";
      const stofnunIdCol = mapping?.stofnunIdCol ? `r."${mapping.stofnunIdCol}"` : (mapping?.clientCol ? `r."${mapping.clientCol}"` : "NULL");
      const birgiIdCol = mapping?.birgiIdCol ? `r."${mapping.birgiIdCol}"` : (mapping?.supplierCol ? `r."${mapping.supplierCol}"` : "NULL");

      // 1. Annual distribution from real PostgreSQL database
      const annualQuery = `
        SELECT 
          COALESCE(EXTRACT(YEAR FROM ${dateCol}::timestamp)::int, 0) AS year,
          COUNT(*) AS "recordCount",
          COUNT(DISTINCT ${stofnunIdCol}) AS "institutionCount",
          COUNT(DISTINCT ${birgiIdCol}) AS "supplierCount",
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

// 8. Recent API Request Timings (Live local profiling)
app.get("/api/recent-requests", (_req, res) => {
  res.json({
    count: recentRequests.length,
    requests: recentRequests
  });
});

// 9. Full Localhost Database & API Performance Test Suite (Hraðaprófun & Flöskuhálsagreining)
app.get("/api/performance-test", async (_req, res) => {
  const suiteStart = Date.now();
  try {
    const { client, release } = await getConnectedClient();
    try {
      // 1. Raw Node -> DB Socket Ping (SELECT 1)
      const pingStart = Date.now();
      await client.query("SELECT 1 AS ping;");
      const dbPingMs = Date.now() - pingStart;

      // 2. Detect mapping
      const mapping = await detectTableAndColumns(client);
      const tableName = mapping?.tableName || "reikningar";
      const dateCol = mapping?.dateCol ? `r."${mapping.dateCol}"` : "r.dags";
      const amountCol = mapping?.amountCol ? `r."${mapping.amountCol}"` : "r.upphaed";
      const descCol = mapping?.descCol ? `r."${mapping.descCol}"` : "r.tegund";
      const stofnunIdCol = mapping?.stofnunIdCol ? `r."${mapping.stofnunIdCol}"` : "r.stofnun_id";

      // 3. Test: Paged Invoices (Index/Heap Scan)
      const pagedStart = Date.now();
      const pagedRes = await client.query(`
        SELECT r.id, ${dateCol} AS dags, ${amountCol} AS upphaed 
        FROM "${tableName}" r 
        ORDER BY r.id DESC 
        LIMIT 25;
      `);
      const pagedLookupMs = Date.now() - pagedStart;

      // 4. Test: Date Range Filter (B-Tree friendly: >= and <)
      const rangeStart = Date.now();
      const rangeRes = await client.query(`
        SELECT r.id, ${dateCol} AS dags, ${amountCol} AS upphaed 
        FROM "${tableName}" r 
        WHERE ${dateCol} >= '2024-01-01' AND ${dateCol} < '2024-02-01'
        LIMIT 25;
      `).catch(() => ({ rows: [] }));
      const dateRangeFilterMs = Date.now() - rangeStart;

      // 5. Test: Date Extract Filter (Often forces full table scan unless expression index exists)
      const extractStart = Date.now();
      const extractRes = await client.query(`
        SELECT r.id, ${dateCol} AS dags, ${amountCol} AS upphaed 
        FROM "${tableName}" r 
        WHERE EXTRACT(YEAR FROM ${dateCol}::timestamp) = 2024
        LIMIT 25;
      `).catch(() => ({ rows: [] }));
      const dateExtractFilterMs = Date.now() - extractStart;

      // 6. Test: Regex Search on description (Styrkir / framlög)
      const regexStart = Date.now();
      const regexRes = await client.query(`
        SELECT r.id, ${descCol} AS tegund 
        FROM "${tableName}" r 
        WHERE ${descCol} ~* 'styrk'
        LIMIT 25;
      `).catch(() => ({ rows: [] }));
      const regexSearchMs = Date.now() - regexStart;

      // 7. Test: Group Aggregation across institutions (GROUP BY stofnun_id)
      const groupStart = Date.now();
      const groupRes = await client.query(`
        SELECT ${stofnunIdCol} AS stofnun, COUNT(*)::int AS cnt, SUM(${amountCol}) AS total 
        FROM "${tableName}" r 
        GROUP BY 1 
        LIMIT 25;
      `).catch(() => ({ rows: [] }));
      const groupAggregationMs = Date.now() - groupStart;

      // 8. Inspect Table & Index statistics from PostgreSQL system catalogs
      let tableStats: any = {};
      try {
        const statRes = await client.query(`
          SELECT 
            relname, 
            seq_scan, 
            seq_tup_read, 
            idx_scan, 
            idx_tup_fetch, 
            n_live_tup
          FROM pg_stat_user_tables 
          WHERE relname = $1;
        `, [tableName]);
        if (statRes.rows && statRes.rows.length > 0) {
          tableStats = statRes.rows[0];
        }
      } catch (err: any) {
        console.warn("[PostgreSQL] Failed to read pg_stat_user_tables:", err.message);
      }

      // 9. Inspect table and index disk sizes
      let diskSizes = { tableSize: "Óþekkt", indexesSize: "Óþekkt", totalSize: "Óþekkt" };
      try {
        const sizeRes = await client.query(`
          SELECT 
            pg_size_pretty(pg_relation_size($1::regclass)) AS table_size,
            pg_size_pretty(pg_indexes_size($1::regclass)) AS indexes_size,
            pg_size_pretty(pg_total_relation_size($1::regclass)) AS total_size;
        `, [tableName]);
        if (sizeRes.rows && sizeRes.rows.length > 0) {
          diskSizes = {
            tableSize: sizeRes.rows[0].table_size,
            indexesSize: sizeRes.rows[0].indexes_size,
            totalSize: sizeRes.rows[0].total_size
          };
        }
      } catch (err: any) {
        console.warn("[PostgreSQL] Failed to read relation sizes:", err.message);
      }

      // 10. Inspect Buffer Cache hit ratio
      let cacheHitPct = 99.0;
      try {
        const cacheRes = await client.query(`
          SELECT 
            round(sum(heap_blks_hit) * 100.0 / nullif(sum(heap_blks_hit) + sum(heap_blks_read), 0), 2) AS cache_hit_pct
          FROM pg_statio_user_tables 
          WHERE relname = $1;
        `, [tableName]);
        if (cacheRes.rows && cacheRes.rows.length > 0 && cacheRes.rows[0].cache_hit_pct !== null) {
          cacheHitPct = parseFloat(cacheRes.rows[0].cache_hit_pct);
        }
      } catch (err: any) {
        console.warn("[PostgreSQL] Failed to read cache hit ratio:", err.message);
      }

      // 11. Inspect all Indexes on the table
      let indexes: any[] = [];
      try {
        const idxRes = await client.query(`
          SELECT 
            i.indexname,
            i.indexdef,
            pg_size_pretty(pg_relation_size(i.indexname::regclass)) AS index_size
          FROM pg_indexes i
          WHERE i.tablename = $1;
        `, [tableName]);
        indexes = idxRes.rows.map(r => ({
          name: r.indexname,
          definition: r.indexdef,
          size: r.index_size
        }));
      } catch (err: any) {
        console.warn("[PostgreSQL] Failed to read pg_indexes:", err.message);
      }

      // 12. Automated Bottleneck Diagnostics & Explanations
      const bottlenecks: Array<{
        severity: "critical" | "warning" | "optimal";
        title: string;
        description: string;
        impact: string;
        solutionSql?: string;
      }> = [];

      // Check for Seq Scans vs Index Scans
      const seqScans = parseInt(tableStats.seq_scan, 10) || 0;
      const seqTupRead = parseInt(tableStats.seq_tup_read, 10) || 0;
      const idxScans = parseInt(tableStats.idx_scan, 10) || 0;
      const totalLiveRows = parseInt(tableStats.n_live_tup, 10) || 18000000;

      if (seqTupRead > 20000000 || (seqScans > 5 && seqScans > idxScans)) {
        bottlenecks.push({
          severity: "critical",
          title: "Fullt töfluscan (Sequential Scan) greint á 18 milljón línum",
          description: `PostgreSQL hefur lesið ${Math.round(seqTupRead / 1000000)} milljónir raða með sequential scan (${seqScans} sinnum). Þegar fyrirspurn les alla 18M línur af disknum í stað þess að nota vísi tekur hvert kall 3–10 sekúndur.`,
          impact: "Hægagangur við síun eftir ári, stofnun eða textaleit.",
          solutionSql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reikningar_dags ON "${tableName}" (dags);\nCREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reikningar_stofnun_id ON "${tableName}" (stofnun_id);\nCREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reikningar_birgi_id ON "${tableName}" (birgi_id);`
        });
      }

      // Check Date Extract vs Date Range
      if (dateExtractFilterMs > 500 && dateExtractFilterMs > (dateRangeFilterMs * 2)) {
        bottlenecks.push({
          severity: "warning",
          title: "EXTRACT(YEAR FROM dags) kemur í veg fyrir B-Tree vísi",
          description: `Fyrirspurn með EXTRACT tók ${dateExtractFilterMs}ms en dags >= '2024-01-01' tók ${dateRangeFilterMs}ms. PostgreSQL getur ekki notað hefðbundinn B-Tree vísi á fall eins og EXTRACT() nema sérstakur fallavísir (expression index) sé búinn til.`,
          impact: "Síun á ári tekur 2–8 sekúndur í stað 10–50 millisekúndna.",
          solutionSql: `-- Búa til fallavísi fyrir EXTRACT(YEAR):\nCREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reikningar_ar_extract ON "${tableName}" ((EXTRACT(YEAR FROM dags::timestamp)));`
        });
      }

      // Check Trigram GIN index for text search
      const hasTrgmIndex = indexes.some(idx => 
        idx.name.toLowerCase().includes("trgm") || 
        idx.definition.toLowerCase().includes("gin")
      );
      if (!hasTrgmIndex) {
        bottlenecks.push({
          severity: "warning",
          title: "Vantar Trigram GIN flýtivísi á dálkinn 'tegund'",
          description: `Textaleit með regex (~* 'styrk') tók ${regexSearchMs}ms. Án pg_trgm GIN vísis verður PostgreSQL að skanna alla 18M reikninga einn af öðrum.`,
          impact: "Styrkagreining og leit að framlögum tekur nokkrar sekúndur á localhost.",
          solutionSql: `CREATE EXTENSION IF NOT EXISTS pg_trgm;\nCREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reikningar_tegund_trgm ON "${tableName}" USING gin ("${descCol}" gin_trgm_ops);`
        });
      } else {
        bottlenecks.push({
          severity: "optimal",
          title: "Trigram GIN vísir er virkur",
          description: "Textaleit í tegund nýtir GIN vísi fyrir hröð regex og ILIKE uppflettingar.",
          impact: "Hraðari textaleit."
        });
      }

      // Check Buffer Cache
      if (cacheHitPct < 90) {
        bottlenecks.push({
          severity: "warning",
          title: `Lágt hlutfall í vinnsluminni (${cacheHitPct}%)`,
          description: "PostgreSQL þarf oft að sækja blokkir af líkamlegum diski (HDD/SSD). Ef shared_buffers er lítið eða vinnsluminni takmarkað hægir það verulega á.",
          impact: "Disk I/O tefur fyrirspurnir.",
          solutionSql: `-- Í postgresql.conf á localhost er mælt með:\nshared_buffers = 2GB\nwork_mem = 64MB\neffective_cache_size = 6GB`
        });
      }

      const totalSuiteMs = Date.now() - suiteStart;

      res.json({
        source: "postgres",
        connected: true,
        host: dbConfig.host,
        port: dbConfig.port,
        database: dbConfig.database,
        tableName,
        totalSuiteMs,
        timings: {
          dbPingMs,
          pagedLookupMs,
          dateRangeFilterMs,
          dateExtractFilterMs,
          regexSearchMs,
          groupAggregationMs
        },
        tableStats: {
          estimatedRows: totalLiveRows,
          tableSize: diskSizes.tableSize,
          indexesSize: diskSizes.indexesSize,
          totalSize: diskSizes.totalSize,
          seqScans,
          seqTupRead,
          idxScans,
          cacheHitPct
        },
        indexes,
        bottlenecks,
        recentRequestsCount: recentRequests.length,
        recentAverageMs: recentRequests.length > 0 
          ? Math.round(recentRequests.reduce((acc, r) => acc + r.durationMs, 0) / recentRequests.length) 
          : 0
      });
    } finally {
      release();
    }
  } catch (err: any) {
    const totalSuiteMs = Date.now() - suiteStart;
    res.json({
      source: "mock",
      connected: false,
      error: err.message,
      totalSuiteMs,
      timings: {
        dbPingMs: 0,
        pagedLookupMs: 0,
        dateRangeFilterMs: 0,
        dateExtractFilterMs: 0,
        regexSearchMs: 0,
        groupAggregationMs: 0
      },
      tableStats: {
        estimatedRows: 17919539,
        tableSize: "4,2 GiB",
        indexesSize: "1,1 GiB",
        totalSize: "5,3 GiB",
        seqScans: 0,
        seqTupRead: 0,
        idxScans: 0,
        cacheHitPct: 99.0
      },
      indexes: [],
      bottlenecks: [
        {
          severity: "warning",
          title: "Gagnagrunnur ekki tengdur í bakenda",
          description: `Ekki náðist tenging við PostgreSQL á localhost (${err.message}). Athugaðu .env stillingar (DB_HOST, DB_NAME, DB_USER, DB_PASSWORD).`,
          impact: "Forritið keyrir á hermigögnum (mock fallback)."
        }
      ],
      recentRequestsCount: recentRequests.length,
      recentAverageMs: recentRequests.length > 0 
        ? Math.round(recentRequests.reduce((acc, r) => acc + r.durationMs, 0) / recentRequests.length) 
        : 0
    });
  }
});

// 10. EXPLAIN ANALYZE Runner (Örugg prófun á stökum fyrirspurnum)
app.post("/api/explain-query", async (req, res) => {
  const startTime = Date.now();
  try {
    const { query } = req.body;
    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "Vantar SQL fyrirspurn" });
    }

    // Safety checks: Only allow SELECT or EXPLAIN statements
    const trimmed = query.trim();
    const disallowedKeywords = ["drop", "truncate", "delete", "update", "insert", "alter", "create", "grant", "revoke"];
    const firstWord = trimmed.split(/\s+/)[0]?.toLowerCase();

    if (firstWord !== "select" && firstWord !== "explain" && firstWord !== "with") {
      return res.status(400).json({ 
        error: "Aðeins er leyft að framkvæma SELECT / EXPLAIN fyrirspurnir í hraðaprófunum." 
      });
    }

    for (const kw of disallowedKeywords) {
      const regex = new RegExp(`\\b${kw}\\b`, "i");
      if (regex.test(trimmed) && firstWord !== "explain") {
        return res.status(400).json({ 
          error: `Öryggisvörn: Skipunin inniheldur bannað lykilorð '${kw}'.` 
        });
      }
    }

    const { client, release } = await getConnectedClient();
    try {
      const explainSql = trimmed.toLowerCase().startsWith("explain") 
        ? trimmed 
        : `EXPLAIN (ANALYZE, BUFFERS, TIMING) ${trimmed};`;

      const result = await client.query(explainSql);
      const executionMs = Date.now() - startTime;

      res.json({
        success: true,
        executionMs,
        plan: result.rows.map(r => Object.values(r)[0]).join("\n")
      });
    } finally {
      release();
    }
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message,
      executionMs: Date.now() - startTime
    });
  }
});

// 11. Excel File Scanning, Inspection & Database Import
// ----------------------------------------------------------------------------
const importStofnanirCache = new Map<string, number>();
const importBirgjarCache = new Map<string, number>();
const importBirgjarKtMap = new Map<string, number>();

async function syncPostgresSequences(client: pg.PoolClient) {
  const tables = ["reikningar", "stofnanir", "birgjar"];
  for (const table of tables) {
    try {
      const res = await client.query(`SELECT COALESCE(MAX(id), 0) AS max_id FROM "${table}";`);
      const maxId = parseInt(res.rows[0].max_id, 10);
      if (maxId > 0) {
        try {
          await client.query(`SELECT setval(pg_get_serial_sequence($1, 'id'), $2);`, [table, maxId]);
        } catch {
          await client.query(`SELECT setval('${table}_id_seq', $1);`, [maxId]);
        }
      }
    } catch {
      // ignore
    }
  }
}

function cleanAmountHelper(val: any): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === "number") return val;
  let s = String(val).trim();
  s = s.replace(/\s*kr\.?/gi, "").replace(/\s*ISK/gi, "");
  if (s.includes(",") && s.includes(".")) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (s.includes(",")) {
    s = s.replace(",", ".");
  }
  const parsed = parseFloat(s);
  return isNaN(parsed) ? 0 : parsed;
}

function cleanDateHelper(val: any): string | null {
  if (val === null || val === undefined) return null;
  if (val instanceof Date) {
    return val.toISOString().slice(0, 10);
  }
  const num = typeof val === "number"
    ? val
    : (typeof val === "string" && /^\d{4,6}(\.\d+)?$/.test(val.trim()) ? parseFloat(val.trim()) : null);

  if (num && num > 30000 && num < 60000) {
    const jsDate = new Date(Math.round((num - 25569) * 86400 * 1000));
    if (!isNaN(jsDate.getTime())) {
      return jsDate.toISOString().slice(0, 10);
    }
  }

  const s = String(val).trim();
  const m1 = s.match(/(\d{1,2})[./-](\d{1,2})[./-](\d{4})/);
  if (m1) {
    const [, d, m, y] = m1;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const m2 = s.match(/(\d{4})[./-](\d{1,2})[./-](\d{1,2})/);
  if (m2) {
    const [, y, m, d] = m2;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return s.length >= 10 ? s.slice(0, 10) : null;
}

// List available Excel and CSV files from local directories
app.get("/api/excel-files", (_req, res) => {
  const candidateDirs = [
    path.join(process.cwd(), "data", "opnir_reikingar"),
    path.join(process.cwd(), "data", "opnir_reikningar"),
    path.join(process.cwd(), "data"),
    path.join(process.cwd(), "opnir_reikingar"),
    path.join(process.cwd(), "opnir_reikningar")
  ];

  if (process.platform === "win32") {
    candidateDirs.push("D:\\minn-vefthjonn\\rikisgat\\data\\opnir_reikingar");
    candidateDirs.push("D:\\minn-vefthjonn\\rikisgat\\data");
  }

  const foundFiles: Array<{ name: string; fullPath: string; relativePath: string; sizeMb: number; modified: string }> = [];
  const scannedDirs: string[] = [];

  for (const dir of candidateDirs) {
    try {
      if (fs.existsSync(dir)) {
        scannedDirs.push(dir);
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isFile()) {
            const ext = path.extname(entry.name).toLowerCase();
            if ([".xlsx", ".xls", ".csv"].includes(ext)) {
              const fullPath = path.join(dir, entry.name);
              const stat = fs.statSync(fullPath);
              foundFiles.push({
                name: entry.name,
                fullPath,
                relativePath: path.relative(process.cwd(), fullPath),
                sizeMb: +(stat.size / (1024 * 1024)).toFixed(2),
                modified: stat.mtime.toISOString()
              });
            }
          }
        }
      }
    } catch {
      // Ignore directory access errors
    }
  }

  // Remove duplicates by name
  const uniqueFiles = Array.from(new Map(foundFiles.map(f => [f.name, f])).values());

  res.json({
    success: true,
    count: uniqueFiles.length,
    files: uniqueFiles,
    scannedDirs
  });
});

// Inspect a server-side Excel or CSV file
app.post("/api/inspect-server-file", (req, res) => {
  const { filePath } = req.body || {};
  if (!filePath) {
    return res.status(400).json({ success: false, error: "Slóð á skrá vantar (filePath required)" });
  }

  try {
    let resolved = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
    if (!fs.existsSync(resolved)) {
      // Also test candidates
      const candidates = [
        path.join(process.cwd(), "data", "opnir_reikingar", path.basename(filePath)),
        path.join(process.cwd(), "data", path.basename(filePath)),
        path.join("D:\\minn-vefthjonn\\rikisgat\\data\\opnir_reikingar", path.basename(filePath))
      ];
      const match = candidates.find(c => fs.existsSync(c));
      if (match) resolved = match;
    }

    if (!fs.existsSync(resolved)) {
      return res.status(404).json({ success: false, error: `Skrá fannst ekki: ${filePath}` });
    }

    const stats = fs.statSync(resolved);
    const sizeMb = +(stats.size / (1024 * 1024)).toFixed(2);

    const workbook = XLSX.readFile(resolved, { sheetRows: 50, cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (!rows || rows.length === 0) {
      return res.json({ success: false, error: "Skrá er tóm" });
    }

    // Find headers
    let headerIdx = 0;
    for (let i = 0; i < Math.min(rows.length, 10); i++) {
      if (rows[i] && rows[i].some((c: any) => c !== null && c !== undefined && String(c).trim() !== "")) {
        headerIdx = i;
        break;
      }
    }

    const headers = rows[headerIdx].map((c: any, idx: number) => String(c || `Dálkur_${idx + 1}`).trim());
    const sampleRows = rows.slice(headerIdx + 1, headerIdx + 30).map(r => {
      const obj: Record<string, any> = {};
      headers.forEach((h: string, idx: number) => {
        obj[h] = r[idx] !== undefined ? r[idx] : "";
      });
      return obj;
    });

    res.json({
      success: true,
      filename: path.basename(resolved),
      filePath: resolved,
      sizeMb,
      sheetNames: workbook.SheetNames,
      activeSheet: sheetName,
      headers,
      sampleRows,
      previewRowCount: sampleRows.length
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Batch import invoices from client-parsed rows
app.post("/api/import-invoices", async (req, res) => {
  const { batch, dryRun = false } = req.body || {};
  if (!Array.isArray(batch) || batch.length === 0) {
    return res.status(400).json({ success: false, error: "Engar reikningsraðir bárust (batch is empty)" });
  }

  const startTime = Date.now();
  try {
    const { client, release } = await getConnectedClient();
    try {
      if (!dryRun) {
        await syncPostgresSequences(client);
      }

      // Check if 'kt' column exists in birgjar safely
      let hasBirgjarKt = false;
      try {
        await client.query("SELECT kt FROM birgjar LIMIT 0;");
        hasBirgjarKt = true;
      } catch {
        hasBirgjarKt = false;
      }

      // Preload lookup caches if empty
      if (importStofnanirCache.size === 0) {
        try {
          const sRes = await client.query("SELECT id, LOWER(TRIM(nafn)) AS name FROM stofnanir WHERE nafn IS NOT NULL;");
          sRes.rows.forEach(r => importStofnanirCache.set(r.name, r.id));
        } catch {
          // ignore
        }
      }

      if (importBirgjarCache.size === 0) {
        try {
          const bQuery = hasBirgjarKt
            ? "SELECT id, LOWER(TRIM(nafn)) AS name, COALESCE(kt, '') AS kt FROM birgjar WHERE nafn IS NOT NULL;"
            : "SELECT id, LOWER(TRIM(nafn)) AS name FROM birgjar WHERE nafn IS NOT NULL;";
          const bRes = await client.query(bQuery);
          bRes.rows.forEach(r => {
            if (r.name) importBirgjarCache.set(r.name, r.id);
            if (hasBirgjarKt && r.kt && r.kt.trim()) importBirgjarKtMap.set(r.kt.trim(), r.id);
          });
        } catch {
          // ignore
        }
      }

      let newStofnanirCount = 0;
      let newBirgjarCount = 0;
      let totalAmount = 0;
      let validRowCount = 0;

      // Prepare batch rows
      const rowsToInsert: Array<[string | null, string, number, number, number, string]> = [];

      for (const item of batch) {
        const dags = cleanDateHelper(item.dags || item.date);
        const upphaed = cleanAmountHelper(item.upphaed !== undefined ? item.upphaed : item.amount);
        if (!dags) continue;

        const stName = (item.stofnun || item.client || "Óskráð stofnun").trim();
        const stKey = stName.toLowerCase();
        let stId = importStofnanirCache.get(stKey);

        if (!stId) {
          if (!dryRun) {
            const ins = await client.query("INSERT INTO stofnanir (nafn) VALUES ($1) RETURNING id;", [stName]);
            stId = ins.rows[0].id;
          } else {
            stId = 1;
          }
          importStofnanirCache.set(stKey, stId!);
          newStofnanirCount++;
        }

        const bName = (item.birgir || item.supplier || "Óskráður birgir").trim();
        const bKey = bName.toLowerCase();
        const bKt = item.kt ? String(item.kt).trim() : null;
        let bId = (hasBirgjarKt && bKt ? importBirgjarKtMap.get(bKt) : null) || importBirgjarCache.get(bKey);

        if (!bId) {
          if (!dryRun) {
            if (hasBirgjarKt && bKt) {
              try {
                const ins = await client.query("INSERT INTO birgjar (nafn, kt) VALUES ($1, $2) RETURNING id;", [bName, bKt]);
                bId = ins.rows[0].id;
                importBirgjarKtMap.set(bKt, bId!);
              } catch {
                const ins = await client.query("INSERT INTO birgjar (nafn) VALUES ($1) RETURNING id;", [bName]);
                bId = ins.rows[0].id;
              }
            } else {
              const ins = await client.query("INSERT INTO birgjar (nafn) VALUES ($1) RETURNING id;", [bName]);
              bId = ins.rows[0].id;
            }
          } else {
            bId = 1;
          }
          importBirgjarCache.set(bKey, bId!);
          newBirgjarCount++;
        }

        const invNum = item.numer || item.reikningsnr || item.id ? String(item.numer || item.reikningsnr || item.id).trim() : null;
        const tegund = item.tegund || item.description || item.lysing ? String(item.tegund || item.description || item.lysing).trim() : "Almennur rekstur";

        rowsToInsert.push([invNum, dags, upphaed, stId!, bId!, tegund]);
        validRowCount++;
        totalAmount += upphaed;
      }

      // Execute multi-row insert into reikningar if not dry run
      if (!dryRun && rowsToInsert.length > 0) {
        const valPlaceholders: string[] = [];
        const flatVals: any[] = [];
        let pIdx = 1;

        for (const row of rowsToInsert) {
          valPlaceholders.push(`($${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++})`);
          flatVals.push(...row);
        }

        const insertQuery = `
          INSERT INTO reikningar (numer, dags, upphaed, stofnun_id, birgi_id, tegund)
          VALUES ${valPlaceholders.join(", ")};
        `;
        await client.query(insertQuery, flatVals);
      }

      res.json({
        success: true,
        dryRun,
        insertedCount: validRowCount,
        totalAmount,
        newStofnanirCount,
        newBirgjarCount,
        durationMs: Date.now() - startTime
      });
    } finally {
      release();
    }
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message,
      durationMs: Date.now() - startTime
    });
  }
});

// Import entire server-side Excel file in streaming batches
app.post("/api/import-server-file", async (req, res) => {
  const { filePath, dryRun = false } = req.body || {};
  if (!filePath) {
    return res.status(400).json({ success: false, error: "Slóð á skrá vantar" });
  }

  const startTime = Date.now();
  try {
    let resolved = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
    if (!fs.existsSync(resolved)) {
      const candidates = [
        path.join(process.cwd(), "data", "opnir_reikingar", path.basename(filePath)),
        path.join(process.cwd(), "data", path.basename(filePath)),
        path.join("D:\\minn-vefthjonn\\rikisgat\\data\\opnir_reikingar", path.basename(filePath))
      ];
      const match = candidates.find(c => fs.existsSync(c));
      if (match) resolved = match;
    }

    if (!fs.existsSync(resolved)) {
      return res.status(404).json({ success: false, error: `Skrá fannst ekki: ${filePath}` });
    }

    const workbook = XLSX.readFile(resolved, { cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (!rows || rows.length < 2) {
      return res.json({ success: false, error: "Engin gögn fundust í skránni" });
    }

    // Find headers
    let headerRowIndex = 0;
    for (let i = 0; i < Math.min(rows.length, 10); i++) {
      if (rows[i] && rows[i].some((c: any) => c !== null && c !== undefined && String(c).trim() !== "")) {
        headerRowIndex = i;
        break;
      }
    }

    const rawHeaders = rows[headerRowIndex].map((c: any) => String(c || "").trim());

    function findCol(candidates: string[]): number | null {
      for (let i = 0; i < rawHeaders.length; i++) {
        const h = rawHeaders[i].toLowerCase();
        for (const cand of candidates) {
          if (h.includes(cand)) return i;
        }
      }
      return null;
    }

    const idxNumer = findCol(["reikning", "numer", "númer", "fylgiskjal", "nr"]);
    const idxDags = findCol(["dags", "dagsetning", "bókunardags", "útgáfudags", "date"]);
    const idxUpphaed = findCol(["fjárhæð", "upphæð", "upphaed", "heildarupphæð", "amount"]);
    const idxStofnun = findCol(["stofnun", "greiðandi", "kaupandi", "aðili", "client"]);
    const idxBirgir = findCol(["birgi", "birgir", "nafn birgis", "seljandi", "supplier"]);
    const idxKt = findCol(["kt", "kennitala", "kt."]);
    const idxTegund = findCol(["tegund", "bókhaldslykill", "lykill", "skýring", "vörulýsing", "heiti"]);

    if (idxDags === null || idxUpphaed === null) {
      return res.status(400).json({
        success: false,
        error: "Vantar nauðsynlega dálka (dagsetningu eða upphæð)",
        headers: rawHeaders
      });
    }

    const { client, release } = await getConnectedClient();
    try {
      if (!dryRun) {
        await syncPostgresSequences(client);
      }

      let hasBirgjarKt = false;
      try {
        await client.query("SELECT kt FROM birgjar LIMIT 0;");
        hasBirgjarKt = true;
      } catch {
        hasBirgjarKt = false;
      }

      // Preload maps
      const sMap = new Map<string, number>();
      const bMap = new Map<string, number>();
      const bKtMap = new Map<string, number>();

      try {
        const sRes = await client.query("SELECT id, LOWER(TRIM(nafn)) AS name FROM stofnanir WHERE nafn IS NOT NULL;");
        sRes.rows.forEach(r => sMap.set(r.name, r.id));
      } catch {
        // ignore
      }

      try {
        const bRes = await client.query(
          hasBirgjarKt
            ? "SELECT id, LOWER(TRIM(nafn)) AS name, COALESCE(kt, '') AS kt FROM birgjar WHERE nafn IS NOT NULL;"
            : "SELECT id, LOWER(TRIM(nafn)) AS name FROM birgjar WHERE nafn IS NOT NULL;"
        );
        bRes.rows.forEach(r => {
          if (r.name) bMap.set(r.name, r.id);
          if (hasBirgjarKt && r.kt && r.kt.trim()) bKtMap.set(r.kt.trim(), r.id);
        });
      } catch {
        // ignore
      }

      let totalRows = 0;
      let totalAmount = 0;
      let newStofnanir = 0;
      let newBirgjar = 0;
      let batch: any[] = [];
      const BATCH_SIZE = 2000;

      for (let i = headerRowIndex + 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0 || !row.some((c: any) => c !== null && c !== undefined)) continue;

        const dateStr = cleanDateHelper(row[idxDags]);
        const amount = cleanAmountHelper(row[idxUpphaed]);
        if (!dateStr) continue;

        const invNum = idxNumer !== null && row[idxNumer] ? String(row[idxNumer]).trim() : null;
        const stName = idxStofnun !== null && row[idxStofnun] ? String(row[idxStofnun]).trim() : "Óskráð stofnun";
        const bName = idxBirgir !== null && row[idxBirgir] ? String(row[idxBirgir]).trim() : "Óskráður birgir";
        const bKt = idxKt !== null && row[idxKt] ? String(row[idxKt]).trim() : null;
        const tegund = idxTegund !== null && row[idxTegund] ? String(row[idxTegund]).trim() : "Almennur rekstur";

        let stId = sMap.get(stName.toLowerCase());
        if (!stId) {
          if (!dryRun) {
            const ins = await client.query("INSERT INTO stofnanir (nafn) VALUES ($1) RETURNING id;", [stName]);
            stId = ins.rows[0].id;
          } else {
            stId = 1;
          }
          sMap.set(stName.toLowerCase(), stId!);
          newStofnanir++;
        }

        let bId = (hasBirgjarKt && bKt ? bKtMap.get(bKt) : null) || bMap.get(bName.toLowerCase());
        if (!bId) {
          if (!dryRun) {
            if (hasBirgjarKt && bKt) {
              try {
                const ins = await client.query("INSERT INTO birgjar (nafn, kt) VALUES ($1, $2) RETURNING id;", [bName, bKt]);
                bId = ins.rows[0].id;
                bKtMap.set(bKt, bId!);
              } catch {
                const ins = await client.query("INSERT INTO birgjar (nafn) VALUES ($1) RETURNING id;", [bName]);
                bId = ins.rows[0].id;
              }
            } else {
              const ins = await client.query("INSERT INTO birgjar (nafn) VALUES ($1) RETURNING id;", [bName]);
              bId = ins.rows[0].id;
            }
          } else {
            bId = 1;
          }
          bMap.set(bName.toLowerCase(), bId!);
          newBirgjar++;
        }

        batch.push([invNum, dateStr, amount, stId!, bId!, tegund]);
        totalRows++;
        totalAmount += amount;

        if (batch.length >= BATCH_SIZE) {
          if (!dryRun) {
            const valPlaceholders: string[] = [];
            const flatVals: any[] = [];
            let pIdx = 1;
            for (const bRow of batch) {
              valPlaceholders.push(`($${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++})`);
              flatVals.push(...bRow);
            }
            await client.query(
              `INSERT INTO reikningar (numer, dags, upphaed, stofnun_id, birgi_id, tegund) VALUES ${valPlaceholders.join(", ")};`,
              flatVals
            );
          }
          batch = [];
        }
      }

      if (batch.length > 0 && !dryRun) {
        const valPlaceholders: string[] = [];
        const flatVals: any[] = [];
        let pIdx = 1;
        for (const bRow of batch) {
          valPlaceholders.push(`($${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++})`);
          flatVals.push(...bRow);
        }
        await client.query(
          `INSERT INTO reikningar (numer, dags, upphaed, stofnun_id, birgi_id, tegund) VALUES ${valPlaceholders.join(", ")};`,
          flatVals
        );
      }

      res.json({
        success: true,
        filename: path.basename(resolved),
        dryRun,
        totalRows,
        totalAmount,
        newStofnanir,
        newBirgjar,
        durationMs: Date.now() - startTime
      });
    } finally {
      release();
    }
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message,
      durationMs: Date.now() - startTime
    });
  }
});

// -------------------------------------------------------------
// Beta Signup & Founder Access Control Endpoints
// -------------------------------------------------------------
const BETA_SIGNUPS_FILE = path.join(process.cwd(), "beta_signups.json");
const FOUNDERS_FILE = path.join(process.cwd(), "founders.json");

// Default initial founders backup if database is not reachable
const DEFAULT_FOUNDERS = [
  {
    id: 1,
    name: "Rúnar Jóhannesson",
    email: "runarjoh@gmail.com",
    role: "Aðalstofnandi",
    access_code: "ViktorSmari2000",
    is_active: true,
    created_at: new Date().toISOString()
  }
];

// Helper to ensure tables exist in PostgreSQL
async function ensureAccessTablesExist() {
  try {
    const { client, release } = await getConnectedClient();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS beta_signups (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          role VARCHAR(100),
          note TEXT,
          wants_notifications BOOLEAN DEFAULT true,
          status VARCHAR(50) DEFAULT 'pending',
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        ALTER TABLE beta_signups ADD COLUMN IF NOT EXISTS wants_notifications BOOLEAN DEFAULT true;
        ALTER TABLE beta_signups ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';

        CREATE TABLE IF NOT EXISTS founders_access (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL UNIQUE,
          role VARCHAR(100) DEFAULT 'Stofnandi',
          access_code VARCHAR(255) NOT NULL,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          last_login TIMESTAMPTZ
        );

        INSERT INTO founders_access (name, email, role, access_code)
        VALUES ('Rúnar Jóhannesson', 'runarjoh@gmail.com', 'Aðalstofnandi', 'ViktorSmari2000')
        ON CONFLICT (email) DO NOTHING;

        DO $$ 
        BEGIN 
          IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'prufunotendur_skraningar') THEN
            INSERT INTO beta_signups (name, email, role, note, wants_notifications, status, created_at)
            SELECT nafn, netfang, COALESCE(hlutverk, 'Almennur borgari'), COALESCE(athugasemd, ''), true, 'pending', COALESCE(skrad_dags, NOW())
            FROM prufunotendur_skraningar
            WHERE netfang NOT IN (SELECT email FROM beta_signups);
          END IF;
        END $$;
      `);
    } finally {
      release();
    }
  } catch (err: any) {
    console.warn("[AccessControl] Could not verify DB tables, using fallback files:", err.message);
  }
}

// Ensure tables on startup
ensureAccessTablesExist().catch(() => {});

// Rate limiting map for signups: IP -> { count: number, resetAt: number }
const signupRateLimitMap = new Map<string, { count: number; resetAt: number }>();

const isSignupRateLimited = (ip: string): boolean => {
  const now = Date.now();
  const entry = signupRateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    signupRateLimitMap.set(ip, { count: 1, resetAt: now + 10 * 60 * 1000 }); // 10 min window
    return false;
  }
  if (entry.count >= 5) {
    return true; // max 5 submissions per 10 minutes per IP
  }
  entry.count++;
  return false;
};

// Route handlers supporting both /api/beta-signup and /api/beta-signups
const handleBetaSignupPost = async (req: any, res: any) => {
  const { name, email, role, note, wants_notifications = true, website_url_hp, rendered_at } = req.body;

  // 1. Anti-Bot: Honeypot field trap (bots fill all fields; humans don't see this)
  if (website_url_hp && String(website_url_hp).trim().length > 0) {
    console.warn(`[AntiBot] Honeypot trap triggered by bot (IP: ${req.ip || 'unknown'})`);
    // Return silent success so bot doesn't retry
    return res.json({ success: true, message: "Skráning móttekin" });
  }

  // 2. Anti-Bot: Fast-submission check (humans take at least 1.2s to fill out the form)
  if (rendered_at && typeof rendered_at === 'number') {
    const elapsed = Date.now() - rendered_at;
    if (elapsed > 0 && elapsed < 1200) {
      console.warn(`[AntiBot] Form submitted too quickly (${elapsed}ms) by bot (IP: ${req.ip || 'unknown'})`);
      return res.json({ success: true, message: "Skráning móttekin" });
    }
  }

  // 3. Anti-Bot: IP Rate Limiting (max 5 signups per 10 minutes)
  const clientIp = String(req.ip || req.headers['x-forwarded-for'] || 'unknown');
  if (isSignupRateLimited(clientIp)) {
    return res.status(429).json({ 
      success: false, 
      error: "Of margar beiðnir hafa borist frá þessari IP-tölu. Vinsamlegast bíddu í smástund áður en þú reynir aftur." 
    });
  }

  // 4. Basic validation & sanitization
  if (!name || !email) {
    return res.status(400).json({ success: false, error: "Nafn og netfang eru nauðsynleg" });
  }

  const cleanName = String(name).trim();
  const cleanEmail = String(email).trim().toLowerCase();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!emailRegex.test(cleanEmail)) {
    return res.status(400).json({ success: false, error: "Ógilt snið á netfangi" });
  }

  const record = {
    id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
    name: cleanName,
    email: cleanEmail,
    role: String(role || "Almennur borgari").trim(),
    note: String(note || "").trim(),
    wants_notifications: Boolean(wants_notifications),
    status: "pending",
    created_at: new Date().toISOString()
  };

  // Try saving to PostgreSQL if available
  try {
    const { client, release } = await getConnectedClient();
    try {
      await ensureAccessTablesExist();
      const ins = await client.query(`
        INSERT INTO beta_signups (name, email, role, note, wants_notifications, status)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, created_at;
      `, [record.name, record.email, record.role, record.note, record.wants_notifications, record.status]);
      if (ins.rows && ins.rows[0]) {
        record.id = String(ins.rows[0].id);
        record.created_at = ins.rows[0].created_at;
      }
    } finally {
      release();
    }
  } catch (dbErr: any) {
    console.warn("[BetaSignup] Could not persist to DB, falling back to local file:", dbErr.message);
  }

  // Also write to local backup JSON file
  try {
    let list: any[] = [];
    if (fs.existsSync(BETA_SIGNUPS_FILE)) {
      list = JSON.parse(fs.readFileSync(BETA_SIGNUPS_FILE, "utf-8"));
    }
    list.push(record);
    fs.writeFileSync(BETA_SIGNUPS_FILE, JSON.stringify(list, null, 2), "utf-8");
  } catch (fsErr) {
    console.error("[BetaSignup] Could not write backup file:", fsErr);
  }

  res.json({ success: true, message: "Skráning móttekin", record });
};

app.post("/api/beta-signup", handleBetaSignupPost);
app.post("/api/beta-signups", handleBetaSignupPost);

const handleBetaSignupGet = async (_req: any, res: any) => {
  try {
    const { client, release } = await getConnectedClient();
    try {
      await ensureAccessTablesExist();
      const q = await client.query(`
        SELECT id, name, email, role, note, wants_notifications, status, created_at 
        FROM beta_signups 
        ORDER BY created_at DESC;
      `);
      return res.json({ success: true, signups: q.rows, rows: q.rows, count: q.rows.length });
    } finally {
      release();
    }
  } catch {
    let list: any[] = [];
    if (fs.existsSync(BETA_SIGNUPS_FILE)) {
      try {
        list = JSON.parse(fs.readFileSync(BETA_SIGNUPS_FILE, "utf-8"));
      } catch {}
    }
    return res.json({ success: true, signups: list, rows: list, count: list.length });
  }
};

app.get("/api/beta-signup", handleBetaSignupGet);
app.get("/api/beta-signups", handleBetaSignupGet);

app.patch("/api/beta-signup/:id", async (req, res) => {
  const { id } = req.params;
  const { status, wants_notifications } = req.body;

  try {
    const { client, release } = await getConnectedClient();
    try {
      await ensureAccessTablesExist();
      await client.query(`
        UPDATE beta_signups 
        SET status = COALESCE($1, status),
            wants_notifications = COALESCE($2, wants_notifications)
        WHERE id = $3 OR id::text = $3;
      `, [status || null, wants_notifications !== undefined ? wants_notifications : null, id]);
    } finally {
      release();
    }
  } catch (dbErr: any) {
    console.warn("[BetaSignup] Update in DB failed, updating file:", dbErr.message);
  }

  try {
    if (fs.existsSync(BETA_SIGNUPS_FILE)) {
      const list = JSON.parse(fs.readFileSync(BETA_SIGNUPS_FILE, "utf-8"));
      const item = list.find((s: any) => String(s.id) === String(id));
      if (item) {
        if (status) item.status = status;
        if (wants_notifications !== undefined) item.wants_notifications = wants_notifications;
        fs.writeFileSync(BETA_SIGNUPS_FILE, JSON.stringify(list, null, 2), "utf-8");
      }
    }
  } catch {}

  res.json({ success: true, message: "Staða uppfærð" });
});

// -------------------------------------------------------------
// Founders Access Control Endpoints
// -------------------------------------------------------------
app.post("/api/founders/login", async (req, res) => {
  const { access_code, email } = req.body;
  const cleanCode = String(access_code || "").trim();
  const cleanEmail = String(email || "").trim().toLowerCase();

  if (!cleanCode) {
    return res.status(400).json({ success: false, error: "Aðgangskóða vantar" });
  }

  // Master override codes for initial setup
  if (cleanCode === "ViktorSmari2000" || cleanCode === "prufa2026") {
    return res.json({
      success: true,
      founder: {
        id: 1,
        name: cleanEmail ? cleanEmail.split("@")[0] : "Rúnar Jóhannesson",
        email: cleanEmail || "runarjoh@gmail.com",
        role: "Aðalstofnandi",
        is_active: true
      },
      token: "founder_" + Date.now()
    });
  }

  // Check database
  try {
    const { client, release } = await getConnectedClient();
    try {
      await ensureAccessTablesExist();
      let query = `SELECT id, name, email, role, is_active FROM founders_access WHERE access_code = $1 AND is_active = true`;
      let params = [cleanCode];
      if (cleanEmail) {
        query += ` AND LOWER(email) = $2`;
        params.push(cleanEmail);
      }
      const result = await client.query(query, params);
      if (result.rows && result.rows.length > 0) {
        const founder = result.rows[0];
        await client.query(`UPDATE founders_access SET last_login = NOW() WHERE id = $1`, [founder.id]);
        return res.json({
          success: true,
          founder,
          token: "founder_" + founder.id + "_" + Date.now()
        });
      }
    } finally {
      release();
    }
  } catch (err: any) {
    console.warn("[FoundersLogin] Database query failed, checking file:", err.message);
  }

  // Check file backup
  try {
    let founders = DEFAULT_FOUNDERS;
    if (fs.existsSync(FOUNDERS_FILE)) {
      founders = JSON.parse(fs.readFileSync(FOUNDERS_FILE, "utf-8"));
    }
    const match = founders.find(f => 
      f.access_code === cleanCode && 
      f.is_active &&
      (!cleanEmail || f.email.toLowerCase() === cleanEmail)
    );
    if (match) {
      return res.json({
        success: true,
        founder: { id: match.id, name: match.name, email: match.email, role: match.role },
        token: "founder_" + match.id + "_" + Date.now()
      });
    }
  } catch {}

  res.status(401).json({ success: false, error: "Ógildur aðgangskóði eða notandi finnst ekki" });
});

app.get("/api/founders/list", async (_req, res) => {
  try {
    const { client, release } = await getConnectedClient();
    try {
      await ensureAccessTablesExist();
      const q = await client.query(`
        SELECT id, name, email, role, is_active, created_at, last_login 
        FROM founders_access 
        ORDER BY id ASC;
      `);
      return res.json({ success: true, founders: q.rows });
    } finally {
      release();
    }
  } catch {
    let founders = DEFAULT_FOUNDERS;
    if (fs.existsSync(FOUNDERS_FILE)) {
      try {
        founders = JSON.parse(fs.readFileSync(FOUNDERS_FILE, "utf-8"));
      } catch {}
    }
    const safeFounders = founders.map(({ access_code, ...rest }) => rest);
    return res.json({ success: true, founders: safeFounders });
  }
});

app.post("/api/founders/add", async (req, res) => {
  const { name, email, role = "Stofnandi", access_code } = req.body;
  if (!name || !email || !access_code) {
    return res.status(400).json({ success: false, error: "Nafn, netfang og aðgangskóði eru nauðsynleg" });
  }

  const newFounder = {
    name: String(name).trim(),
    email: String(email).trim().toLowerCase(),
    role: String(role).trim(),
    access_code: String(access_code).trim(),
    is_active: true,
    created_at: new Date().toISOString()
  };

  try {
    const { client, release } = await getConnectedClient();
    try {
      await ensureAccessTablesExist();
      await client.query(`
        INSERT INTO founders_access (name, email, role, access_code, is_active)
        VALUES ($1, $2, $3, $4, true)
        ON CONFLICT (email) DO UPDATE 
        SET name = EXCLUDED.name, role = EXCLUDED.role, access_code = EXCLUDED.access_code, is_active = true;
      `, [newFounder.name, newFounder.email, newFounder.role, newFounder.access_code]);
    } finally {
      release();
    }
  } catch (err: any) {
    console.warn("[FoundersAdd] DB insert failed, writing to file:", err.message);
  }

  try {
    let list = DEFAULT_FOUNDERS;
    if (fs.existsSync(FOUNDERS_FILE)) {
      list = JSON.parse(fs.readFileSync(FOUNDERS_FILE, "utf-8"));
    }
    const existingIdx = list.findIndex(f => f.email.toLowerCase() === newFounder.email);
    if (existingIdx >= 0) {
      list[existingIdx] = { ...list[existingIdx], ...newFounder };
    } else {
      list.push({ id: Date.now(), ...newFounder });
    }
    fs.writeFileSync(FOUNDERS_FILE, JSON.stringify(list, null, 2), "utf-8");
  } catch {}

  res.json({ success: true, message: "Stofnandi skráður" });
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
