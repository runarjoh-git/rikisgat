/**
 * ============================================================================
 * RÍKISGÁT: EXCEL SKOÐARI OG DÁLKAGREINING Í NODE.JS / TYPESCRIPT
 * ============================================================================
 * 
 * Keyrsla án Python:
 *   npx tsx scripts/inspect_excel.ts <slóð_á_skrá.xlsx>
 */

import fs from 'fs';
import path from 'path';

async function main() {
  const targetFile = process.argv[2];

  if (!targetFile) {
    console.log("❌ Vantar slóð á skrá!");
    console.log("Notkun: npx tsx scripts/inspect_excel.ts <slóð_á_skrá.xlsx>");
    process.exit(1);
  }

  const resolvedPath = path.resolve(process.cwd(), targetFile);
  if (!fs.existsSync(resolvedPath)) {
    console.log(`❌ Skrá fannst ekki á slóðinni: ${resolvedPath}`);
    process.exit(1);
  }

  const stats = fs.statSync(resolvedPath);
  const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);

  console.log("=".repeat(65));
  console.log(`🔍 SKOÐA EXCEL SKRÁ: ${path.basename(resolvedPath)}`);
  console.log(`📁 Full slóð: ${resolvedPath}`);
  console.log(`📦 Stærð: ${sizeMb} MB`);
  console.log("=".repeat(65));

  // Athuga hvort xlsx pakkinn sé til staðar
  let XLSX: any;
  try {
    const rawModule: any = await import('xlsx');
    XLSX = rawModule.readFile ? rawModule : (rawModule.default?.readFile ? rawModule.default : (rawModule.default || rawModule));
  } catch {
    console.log("⏳ Vantar 'xlsx' pakkann í verkefnið. Setjum hann upp með:");
    console.log("   npm install xlsx");
    process.exit(1);
  }

  console.log("\n📖 Les vinnubók...");
  const workbook = XLSX.readFile(resolvedPath, { sheetRows: 10 }); // Lesum bara fyrstu 10 raðirnar til að skoða leifturhratt!
  const sheetName = workbook.SheetNames[0];
  console.log(`📑 Vinnublað: ${sheetName} (af samtals ${workbook.SheetNames.length})`);

  const worksheet = workbook.Sheets[sheetName];
  const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  if (!jsonData || jsonData.length === 0) {
    console.log("❌ Fann engin gögn í skjalinu.");
    process.exit(1);
  }

  // Finna dálkahausana
  let headerIndex = -1;
  let headers: string[] = [];

  for (let i = 0; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (Array.isArray(row) && row.length > 0 && row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '')) {
      headerIndex = i;
      headers = row.map((c, idx) => (c !== null && c !== undefined ? String(c).trim() : `Dálkur_${idx + 1}`));
      break;
    }
  }

  if (headerIndex === -1) {
    console.log("❌ Fann enga dálkahausa.");
    process.exit(1);
  }

  console.log(`\n📋 Dálkar sem fundust (${headers.length}):`);
  headers.forEach((h, idx) => {
    console.log(`   [${idx + 1}] ${h}`);
  });

  console.log("\n🔍 Fyrstu 3 dæmigeraðar raðir úr skjalinu:");
  const sampleRows = jsonData.slice(headerIndex + 1, headerIndex + 4);

  sampleRows.forEach((row, rIdx) => {
    console.log(`\n--- Færsla #${rIdx + 1} ---`);
    headers.forEach((h, cIdx) => {
      const val = row[cIdx] !== undefined ? row[cIdx] : '';
      console.log(`  ${h.padEnd(25)} : ${val}`);
    });
  });

  console.log("\n" + "=".repeat(65));
  console.log("✅ Skrá skoðuð með góðum árangri án Python!");
  console.log("=".repeat(65));
}

main().catch(err => {
  console.error("Villa við að lesa skrá:", err);
});
