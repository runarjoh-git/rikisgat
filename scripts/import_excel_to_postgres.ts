/**
 * ============================================================================
 * RÍKISGÁT: INNLESTUR Á EXCEL (.XLSX) Í POSTGRESQL MEÐ NODE.JS / TYPESCRIPT
 * ============================================================================
 * 
 * Hraðvirkur, öruggur og minnisbættur innlestur á reikningaskrám ríkisins
 * (opnirreikningar.is). Engin þörf á Python - notar sömu innviði og RíkisGát!
 * 
 * VÖRN GEGN TVÍSKRÁNINGU:
 *   - Hleður öllum birgjum og stofnunum í minni (lookup cache) í upphafi.
 *   - Samræmir birgja óháð há-/lágstöfum, bilum (TRIM/LOWER) og kennitölum.
 *   - Endurnýtir sama birgir.id og stofnun.id fyrir nýja mánuði (engin tvískráning).
 * 
 * NOTKUN Í POWERSHELL / TERMINAL:
 *   1. Prufukeyrsla án breytinga á gagnagrunni (Dry run):
 *      npx tsx scripts/import_excel_to_postgres.ts "data/opnir_reikingar/2026-5.xlsx" --dry-run
 * 
 *   2. Lesa inn einn nýjan mánuð:
 *      npx tsx scripts/import_excel_to_postgres.ts "data/opnir_reikingar/2026-5.xlsx"
 * 
 *   3. Lesa inn allar nýjar skrár í möppu (Hópinnlestur):
 *      npx tsx scripts/import_excel_to_postgres.ts data/opnir_reikingar/
 * 
 * EFTIRLIT Í POSTGRESQL:
 *   - Staðfesta að enginn birgir sé tvískráður:
 *     SELECT LOWER(TRIM(nafn)), COUNT(*) FROM birgjar GROUP BY LOWER(TRIM(nafn)) HAVING COUNT(*) > 1;
 */

import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';
import * as XLSXModule from 'xlsx';

const XLSX: any = (XLSXModule as any).readFile 
  ? XLSXModule 
  : ((XLSXModule as any).default?.readFile ? (XLSXModule as any).default : ((XLSXModule as any).default || XLSXModule));

dotenv.config();

const { Pool } = pg;

// Gagnagrunnstenging úr .env eða sjálfgefin
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'rikisgat',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

const BATCH_SIZE = 2500;

function cleanAmount(val: any): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return val;
  let s = String(val).trim();
  s = s.replace(/\s*kr\.?/gi, '').replace(/\s*ISK/gi, '');
  if (s.includes(',') && s.includes('.')) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (s.includes(',')) {
    s = s.replace(',', '.');
  }
  const parsed = parseFloat(s);
  return isNaN(parsed) ? 0 : parsed;
}

function cleanDate(val: any): string | null {
  if (val === null || val === undefined) return null;
  if (val instanceof Date) {
    return val.toISOString().slice(0, 10);
  }

  // Ef gildið er Excel seríudagsetning (t.d. 46235)
  const num = typeof val === 'number' 
    ? val 
    : (typeof val === 'string' && /^\d{4,6}(\.\d+)?$/.test(val.trim()) ? parseFloat(val.trim()) : null);
  
  if (num && num > 30000 && num < 60000) {
    const jsDate = new Date(Math.round((num - 25569) * 86400 * 1000));
    if (!isNaN(jsDate.getTime())) {
      return jsDate.toISOString().slice(0, 10);
    }
  }

  const s = String(val).trim();
  
  // DD.MM.YYYY eða DD/MM/YYYY
  const m1 = s.match(/(\d{1,2})[./-](\d{1,2})[./-](\d{4})/);
  if (m1) {
    const [, d, m, y] = m1;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  // YYYY-MM-DD
  const m2 = s.match(/(\d{4})[./-](\d{1,2})[./-](\d{1,2})/);
  if (m2) {
    const [, y, m, d] = m2;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return s.length >= 10 ? s.slice(0, 10) : null;
}

function findColIdx(headers: string[], candidates: string[]): number | null {
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i].toLowerCase();
    for (const cand of candidates) {
      if (h.includes(cand)) return i;
    }
  }
  return null;
}

interface LookupCaches {
  stofnanirMap: Map<string, number>;
  birgjarMap: Map<string, number>;
  birgjarKtMap: Map<string, number>;
  hasBirgjarKt: boolean;
}

async function syncSequences(client: pg.PoolClient) {
  console.log("⚡ Samstilli id-raðir (sequences) í PostgreSQL...");
  const tables = ['reikningar', 'stofnanir', 'birgjar'];
  for (const table of tables) {
    try {
      const res = await client.query(`SELECT COALESCE(MAX(id), 0) AS max_id FROM ${table};`);
      const maxId = parseInt(res.rows[0].max_id, 10);
      if (maxId > 0) {
        try {
          await client.query(`SELECT setval(pg_get_serial_sequence($1, 'id'), $2);`, [table, maxId]);
          console.log(`   -> ${table}: id röð stillt á ${maxId.toLocaleString('is-IS')}`);
        } catch {
          await client.query(`SELECT setval('${table}_id_seq', $1);`, [maxId]);
          console.log(`   -> ${table}: ${table}_id_seq stillt á ${maxId.toLocaleString('is-IS')}`);
        }
      }
    } catch {
      // ignore
    }
  }
}

async function loadLookupCaches(client: pg.PoolClient): Promise<LookupCaches> {
  console.log("⏳ Hleð uppflettitöflur (stofnanir og birgja) úr PostgreSQL...");
  const stofnanirMap = new Map<string, number>();
  const birgjarMap = new Map<string, number>();
  const birgjarKtMap = new Map<string, number>();
  let hasBirgjarKt = false;

  try {
    const sRes = await client.query('SELECT id, LOWER(TRIM(nafn)) AS name FROM stofnanir WHERE nafn IS NOT NULL;');
    sRes.rows.forEach(r => stofnanirMap.set(r.name, r.id));

    // Athuga hvort 'kt' dálkur sé til í birgjar töflunni með beinni prófun
    try {
      await client.query('SELECT kt FROM birgjar LIMIT 0;');
      hasBirgjarKt = true;
    } catch {
      hasBirgjarKt = false;
    }

    let bRes;
    if (hasBirgjarKt) {
      try {
        bRes = await client.query("SELECT id, LOWER(TRIM(nafn)) AS name, COALESCE(kt, '') AS kt FROM birgjar;");
      } catch {
        hasBirgjarKt = false;
        bRes = await client.query("SELECT id, LOWER(TRIM(nafn)) AS name FROM birgjar;");
      }
    } else {
      bRes = await client.query("SELECT id, LOWER(TRIM(nafn)) AS name FROM birgjar;");
    }

    bRes.rows.forEach(r => {
      if (r.name) birgjarMap.set(r.name, r.id);
      if (hasBirgjarKt && r.kt && r.kt.trim()) birgjarKtMap.set(r.kt.trim(), r.id);
    });

    console.log(`   -> ${stofnanirMap.size.toLocaleString('is-IS')} stofnanir í minni`);
    console.log(`   -> ${birgjarMap.size.toLocaleString('is-IS')} birgjar í minni`);
  } catch (err: any) {
    console.warn("⚠️ Uppflettitöflur vantar eða villa við lestur:", err.message);
  }

  return { stofnanirMap, birgjarMap, birgjarKtMap, hasBirgjarKt };
}

async function getOrCreateStofnun(client: pg.PoolClient, map: Map<string, number>, name: string): Promise<number> {
  const clean = name ? name.trim() : 'Óskráð stofnun';
  const key = clean.toLowerCase();
  if (map.has(key)) return map.get(key)!;

  const res = await client.query('INSERT INTO stofnanir (nafn) VALUES ($1) RETURNING id;', [clean]);
  const newId = res.rows[0].id;
  map.set(key, newId);
  return newId;
}

async function getOrCreateBirgir(
  client: pg.PoolClient, 
  map: Map<string, number>, 
  ktMap: Map<string, number>, 
  name: string, 
  kt?: string,
  hasBirgjarKt = false
): Promise<number> {
  const clean = name ? name.trim() : 'Óskráður birgir';
  const key = clean.toLowerCase();
  const cleanKt = kt ? kt.trim() : null;

  if (hasBirgjarKt && cleanKt && ktMap.has(cleanKt)) return ktMap.get(cleanKt)!;
  if (map.has(key)) return map.get(key)!;

  let newId: number;
  if (hasBirgjarKt && cleanKt) {
    try {
      const res = await client.query('INSERT INTO birgjar (nafn, kt) VALUES ($1, $2) RETURNING id;', [clean, cleanKt]);
      newId = res.rows[0].id;
      ktMap.set(cleanKt, newId);
    } catch {
      // Ef dálkurinn kt er ekki til eða bannaður, skráum án kt
      const res = await client.query('INSERT INTO birgjar (nafn) VALUES ($1) RETURNING id;', [clean]);
      newId = res.rows[0].id;
    }
  } else {
    const res = await client.query('INSERT INTO birgjar (nafn) VALUES ($1) RETURNING id;', [clean]);
    newId = res.rows[0].id;
  }
  map.set(key, newId);
  return newId;
}

async function processFile(
  filePath: string,
  client: pg.PoolClient,
  caches: LookupCaches,
  dryRun: boolean
) {
  const filename = path.basename(filePath);
  const stats = fs.statSync(filePath);
  const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);

  console.log("\n" + "=".repeat(65));
  console.log(`📂 VINN ÚR SKRÁ: ${filename} (${sizeMb} MB)`);
  console.log("=".repeat(65));

  const workbook = XLSX.readFile(filePath, { cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  if (!rows || rows.length < 2) {
    console.log("❌ Engin gögn fundust.");
    return { rowsCount: 0, totalAmount: 0 };
  }

  // Finna dálkaheiti
  let headerRowIndex = 0;
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    if (rows[i] && rows[i].some(c => c !== null && c !== undefined && String(c).trim() !== '')) {
      headerRowIndex = i;
      break;
    }
  }

  const rawHeaders = rows[headerRowIndex].map(c => String(c || '').trim());
  console.log("Greindir dálkar:", rawHeaders.join(' | '));

  const idxNumer = findColIdx(rawHeaders, ['reikning', 'numer', 'númer', 'fylgiskjal', 'nr']);
  const idxDags = findColIdx(rawHeaders, ['dags', 'dagsetning', 'bókunardags', 'útgáfudags', 'date']);
  const idxUpphaed = findColIdx(rawHeaders, ['fjárhæð', 'upphæð', 'upphaed', 'heildarupphæð', 'amount']);
  const idxStofnun = findColIdx(rawHeaders, ['stofnun', 'greiðandi', 'kaupandi', 'aðili', 'client']);
  const idxBirgir = findColIdx(rawHeaders, ['birgi', 'birgir', 'nafn birgis', 'seljandi', 'supplier']);
  const idxKt = findColIdx(rawHeaders, ['kt', 'kennitala', 'kt.']);
  const idxTegund = findColIdx(rawHeaders, ['tegund', 'bókhaldslykill', 'lykill', 'skýring', 'vörulýsing', 'heiti']);

  if (idxDags === null || idxUpphaed === null) {
    console.log("❌ Vantar nauðsynlega dálka (dagsetningu eða upphæð).");
    return { rowsCount: 0, totalAmount: 0 };
  }

  let totalRows = 0;
  let totalAmount = 0;
  let batch: any[] = [];

  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0 || !row.some(c => c !== null && c !== undefined)) continue;

    const rawDags = row[idxDags];
    const rawUpphaed = row[idxUpphaed];
    const dateStr = cleanDate(rawDags);
    const amount = cleanAmount(rawUpphaed);

    if (!dateStr) continue;

    const invNum = idxNumer !== null && row[idxNumer] ? String(row[idxNumer]).trim() : null;
    const stName = idxStofnun !== null && row[idxStofnun] ? String(row[idxStofnun]).trim() : 'Óskráð stofnun';
    const bName = idxBirgir !== null && row[idxBirgir] ? String(row[idxBirgir]).trim() : 'Óskráður birgir';
    const bKt = idxKt !== null && row[idxKt] ? String(row[idxKt]).trim() : null;
    const tegund = idxTegund !== null && row[idxTegund] ? String(row[idxTegund]).trim() : 'Almennur rekstur';

    let stId = 1;
    let bId = 1;

    if (!dryRun) {
      stId = await getOrCreateStofnun(client, caches.stofnanirMap, stName);
      bId = await getOrCreateBirgir(client, caches.birgjarMap, caches.birgjarKtMap, bName, bKt || undefined, caches.hasBirgjarKt);
    }

    batch.push([invNum, dateStr, amount, stId, bId, tegund]);
    totalRows++;
    totalAmount += amount;

    if (batch.length >= BATCH_SIZE) {
      if (!dryRun) {
        await insertBatch(client, batch);
      }
      process.stdout.write(`   -> Skráð ${totalRows.toLocaleString('is-IS')} línur... (${totalAmount.toLocaleString('is-IS')} kr.)\r`);
      batch = [];
    }
  }

  if (batch.length > 0) {
    if (!dryRun) {
      await insertBatch(client, batch);
    }
    console.log(`   -> Skráð ${totalRows.toLocaleString('is-IS')} línur... (${totalAmount.toLocaleString('is-IS')} kr.)`);
  }

  const modeStr = dryRun ? "PRÓFUN (Dry Run - engu breytt í DB)" : "LOKIÐ (Skrifað í PostgreSQL)";
  console.log(`✅ ${modeStr}: ${filename}`);
  console.log(`   - Línufjöldi : ${totalRows.toLocaleString('is-IS')}`);
  console.log(`   - Samtals    : ${totalAmount.toLocaleString('is-IS')} kr.`);

  return { rowsCount: totalRows, totalAmount };
}

async function insertBatch(client: pg.PoolClient, batch: any[][]) {
  // Búum til parameterized insert fyrir hraðvirka skráningu
  const valPlaceholders: string[] = [];
  const flatVals: any[] = [];
  let pIdx = 1;

  for (const row of batch) {
    valPlaceholders.push(`($${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++})`);
    flatVals.push(...row);
  }

  const query = `
    INSERT INTO reikningar (numer, dags, upphaed, stofnun_id, birgi_id, tegund)
    VALUES ${valPlaceholders.join(', ')};
  `;

  await client.query(query, flatVals);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log("Notkun:");
    console.log("  npx tsx scripts/import_excel_to_postgres.ts <skrá_eða_mappa> [--dry-run]");
    process.exit(1);
  }

  const targetPath = args[0];
  const dryRun = args.includes('--dry-run');

  const resolved = path.resolve(process.cwd(), targetPath);
  if (!fs.existsSync(resolved)) {
    console.log(`❌ Slóð fannst ekki: ${resolved}`);
    process.exit(1);
  }

  let filesToProcess: string[] = [];
  const stat = fs.statSync(resolved);

  if (stat.isDirectory()) {
    const allFiles = fs.readdirSync(resolved);
    const xlsxFiles = allFiles.filter(f => f.toLowerCase().endsWith('.xlsx') && !f.startsWith('~$'));
    
    // Raða skrám í réttri tímaröð (t.d. 2017_1, 2017_2 ... 2026_4)
    xlsxFiles.sort((a, b) => {
      const numsA = a.match(/\d+/g) ? a.match(/\d+/g)!.map(Number) : [0];
      const numsB = b.match(/\d+/g) ? b.match(/\d+/g)!.map(Number) : [0];
      for (let i = 0; i < Math.max(numsA.length, numsB.length); i++) {
        const valA = numsA[i] || 0;
        const valB = numsB[i] || 0;
        if (valA !== valB) return valA - valB;
      }
      return a.localeCompare(b);
    });

    filesToProcess = xlsxFiles.map(f => path.join(resolved, f));
    console.log(`Fann ${filesToProcess.length} Excel (.xlsx) skrár í möppunni.`);
  } else {
    filesToProcess = [resolved];
  }

  const client = await pool.connect();
  console.log(`🔌 Tengdist PostgreSQL (${process.env.DB_NAME || 'rikisgat'})`);

  if (!dryRun) {
    await syncSequences(client);
  }

  const caches = await loadLookupCaches(client);

  let grandTotalRows = 0;
  let grandTotalAmount = 0;
  const startTime = Date.now();

  for (let idx = 0; idx < filesToProcess.length; idx++) {
    const file = filesToProcess[idx];
    console.log(`\n[${idx + 1}/${filesToProcess.length}] Hef innlestur á ${path.basename(file)}`);
    const { rowsCount, totalAmount } = await processFile(file, client, caches, dryRun);
    grandTotalRows += rowsCount;
    grandTotalAmount += totalAmount;
  }

  client.release();
  await pool.end();

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log("\n" + "=".repeat(65));
  console.log("🏆 HEILDARNIÐURSTAÐA INNLESTURS");
  console.log("=".repeat(65));
  console.log(`Skrár unnar   : ${filesToProcess.length}`);
  console.log(`Heildarlínur  : ${grandTotalRows.toLocaleString('is-IS')}`);
  console.log(`Heildarupphæð : ${grandTotalAmount.toLocaleString('is-IS')} kr.`);
  console.log(`Heildartími   : ${durationSec} sekúndur`);
  console.log("=".repeat(65));
}

main().catch(err => {
  console.error("Villa:", err);
  process.exit(1);
});
