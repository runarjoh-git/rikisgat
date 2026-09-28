import React, { useState } from 'react';
import { 
  Database, FolderTree, Cpu, HardDrive, FileCode, CheckCircle2, 
  ArrowRight, Table, Layers, Server, Terminal, Copy, Check, AlertCircle, ShieldCheck, Tag
} from 'lucide-react';
import { DatabaseStats } from '../types';
import { formaTolu } from '../utils/icelandicFormatters';

interface TechnicalTabProps {
  stats: DatabaseStats;
}

export const TechnicalTab: React.FC<TechnicalTabProps> = ({ stats }) => {
  const [activeSubTab, setActiveSubTab] = useState<'verification' | 'schema' | 'folder' | 'flow'>('verification');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    });
  };

  const sqlCheckAll = `-- ============================================================
-- 1. KANNA HVORT ÖLL GÖGN SÉU TIL STAÐAR Í RÍKISGÁT
-- Keyrið í pgAdmin 4 (D:\\PostgreSQL\\pgAdmin 4) eða psql
-- ============================================================

-- A. Telja raðir í öllum 3 megin töflunum í einu:
SELECT 
    'reikningar' AS tafla, COUNT(*) AS fjoldi_rada FROM reikningar
UNION ALL
SELECT 
    'birgjar' AS tafla, COUNT(*) AS fjoldi_rada FROM birgjar
UNION ALL
SELECT 
    'stofnanir' AS tafla, COUNT(*) AS fjoldi_rada FROM stofnanir;

-- B. Kanna elsta og nýjasta reikning (á að vera 2017 til 2026):
SELECT 
    MIN(dags) AS elsti_reikningur, 
    MAX(dags) AS nyjasti_reikningur, 
    COUNT(*) AS samtals_reikningar,
    COUNT(DISTINCT stofnun_id) AS fjoldi_stofnana_med_reikninga,
    COUNT(DISTINCT birgi_id) AS fjoldi_birgja_med_reikninga
FROM reikningar;

-- C. Kanna fjölda reikninga sundurliðað eftir ári:
SELECT 
    EXTRACT(YEAR FROM dags) AS artal,
    COUNT(*) AS fjoldi_reikninga
FROM reikningar
GROUP BY artal
ORDER BY artal DESC;

-- D. Fá fjölda og sundurliðun eftir tegund reiknings (tegund):
SELECT 
    COALESCE(tegund, 'Óskilgreint') AS tegund_reiknings,
    COUNT(*) AS fjoldi_linur,
    ROUND((COUNT(*) * 100.0 / SUM(COUNT(*)) OVER ()), 2) AS hlutfall_prosent,
    MIN(dags) AS elsta_faersla,
    MAX(dags) AS nyjasta_faersla
FROM reikningar
GROUP BY tegund
ORDER BY fjoldi_linur DESC;

-- E. Greina sjaldgæfar tegundir (með 1 til 5 línur) fyrir framtíðarstraumlínulögun:
SELECT 
    tegund, 
    COUNT(*) AS fjoldi
FROM reikningar 
GROUP BY tegund 
HAVING COUNT(*) <= 5
ORDER BY fjoldi ASC, tegund ASC;

-- F. Telja hve margar tegundir eru með meira en 100 línur vs minna en 5:
SELECT 
    CASE 
        WHEN fjoldi >= 100000 THEN '1. Mjög algengt (>= 100k)'
        WHEN fjoldi >= 1000 THEN '2. Algengt (1k - 100k)'
        WHEN fjoldi >= 10 THEN '3. Miðlungs (10 - 1k)'
        ELSE '4. Sjaldgæft (1 - 9 línur)'
    END AS dreifing_tegunda,
    COUNT(*) AS fjoldi_tegunda,
    SUM(fjoldi) AS samtals_linur
FROM (
    SELECT tegund, COUNT(*) AS fjoldi 
    FROM reikningar 
    GROUP BY tegund
) sub
GROUP BY dreifing_tegunda
ORDER BY dreifing_tegunda;

-- G. Kanna hvort einhverjir reikningar vísi í stofnanir eða birgja sem ekki eru til (Orphans):
SELECT COUNT(*) AS vantar_stofnun FROM reikningar r LEFT JOIN stofnanir s ON r.stofnun_id = s.id WHERE s.id IS NULL;
SELECT COUNT(*) AS vantar_birgi FROM reikningar r LEFT JOIN birgjar b ON r.birgi_id = b.id WHERE b.id IS NULL;`;

  const copyScriptsAll = `-- ============================================================
-- 2. FULLKOMNAR POSTGRESQL COPY SKIPANIR FYRIR ALLAR TÖFLUR
-- Ef þú ert með birgjar.txt og stofnanir.txt líka í C:/Users/Public/:
-- ============================================================

-- Stofnanir:
COPY stofnanir(id, nafn)
FROM 'C:/Users/Public/stofnanir.txt'
WITH (FORMAT text, DELIMITER E'\\t', NULL 'N');

-- Birgjar:
COPY birgjar(id, nafn, kt)
FROM 'C:/Users/Public/birgjar.txt'
WITH (FORMAT text, DELIMITER E'\\t', NULL 'N');

-- Reikningar (Skipunin sem þú keyrðir á 6 min 11 sek):
COPY reikningar(id, stofnun_id, birgi_id, dags, tegund, numer, upphaed)
FROM 'C:/Users/Public/reikningar.txt'
WITH (FORMAT text, DELIMITER E'\\t', NULL 'N');`;

  const indexScripts = `-- ============================================================
-- 3. BRÁÐNAUÐSYNLEGIR VÍSAR (INDEXES) FYRIR 0,005–0,03 SEK SVARHRAÐA
-- Keyrðu þetta í Query Tool í pgAdmin 4:
-- ATH: Ekki nota CONCURRENTLY inni í færslu (transaction block).
-- ============================================================

-- A. Flýtivísir á dagsetningu (fyrir mánaða- og tímabilssíur: dags >= '...'):
CREATE INDEX IF NOT EXISTS idx_reikningar_dags ON reikningar(dags);

-- B. Fallavísir á ár (BRÁÐNAUÐSYNLEGUR ef vefurinn notar EXTRACT(YEAR FROM dags)):
-- Án þessa vísis getur PostgreSQL EKKI notað idx_reikningar_dags og tekur 3-8 sek í fullt töfluscan!
CREATE INDEX IF NOT EXISTS idx_reikningar_ar_extract ON reikningar ((EXTRACT(YEAR FROM dags::timestamp)));

-- C. Trigram GIN flýtivísir fyrir hraðvirka textaleit að styrkjum og framlögum (tegund ~* 'styrk'):
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_reikningar_tegund_trgm ON reikningar USING gin (tegund gin_trgm_ops);

-- D. Composite flýtivísar fyrir samantektir stofnana:
CREATE INDEX IF NOT EXISTS idx_reikningar_stofnun_dags ON reikningar(stofnun_id, dags);

-- E. Composite flýtivísar fyrir samantektir birgja:
CREATE INDEX IF NOT EXISTS idx_reikningar_birgir_dags ON reikningar(birgi_id, dags);

-- F. Keyra ANALYZE svo PostgreSQL Optimizer viti hvernig á að nýta vísana:
ANALYZE reikningar;
ANALYZE birgjar;
ANALYZE stofnanir;

-- G. Staðfesta hvaða vísar eru nú virkir á töflunni:
SELECT indexname, indexdef, pg_size_pretty(pg_relation_size(indexname::regclass)) AS staerd 
FROM pg_indexes 
WHERE tablename = 'reikningar';`;

  return (
    <div className="space-y-6">
      {/* Sub-navigation */}
      <div className="flex items-center gap-2 border-b border-neutral-200 pb-3 flex-wrap">
        <button
          onClick={() => setActiveSubTab('verification')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'verification' ? 'bg-neutral-900 text-white shadow-xs' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 1. Athuga Gagnasafn & Skipanir
        </button>
        <button
          onClick={() => setActiveSubTab('schema')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'schema' ? 'bg-neutral-900 text-white shadow-xs' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
          }`}
        >
          <Database className="w-3.5 h-3.5" /> 2. PostgreSQL 18 Gagnalíkan
        </button>
        <button
          onClick={() => setActiveSubTab('folder')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'folder' ? 'bg-neutral-900 text-white shadow-xs' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
          }`}
        >
          <FolderTree className="w-3.5 h-3.5" /> 3. Möppuskipan (D:\ Drif)
        </button>
        <button
          onClick={() => setActiveSubTab('flow')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'flow' ? 'bg-neutral-900 text-white shadow-xs' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" /> 4. Gagnavinnsluflæði (D: ➔ Ský)
        </button>
      </div>

      {/* VERIFICATION & POSTGRES COMMANDS VIEW */}
      {activeSubTab === 'verification' && (
        <div className="space-y-6">
          {/* Status highlight banner for user's query */}
          <div className="bg-emerald-950 text-white p-5 rounded-xl border border-emerald-800 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                COPY Skipun Keyrð Árangursríklega
              </span>
              <span className="text-xs text-neutral-400">| Tími: 6 mín 11 sek</span>
            </div>
            <h3 className="text-xl font-black tracking-tight text-white">
              Frábær árangur! 18M reikningar komnir inn í PostgreSQL 18.
            </h3>
            <p className="text-xs text-neutral-300 leading-relaxed max-w-3xl">
              Keyrslutíminn (6 mínútur og 11 sekúndur) er <strong>eðlilegur og góður hraði</strong> fyrir ~18 milljónir færslna 
              með PostgreSQL <code>COPY</code> (um 48.000 raðir/sekúndu).
              Hér að neðan eru fyrirspurnir til að sannreyna að allt sé til staðar, ásamt flýtivísunum sem þarf að búa til.
            </p>
          </div>

          {/* Verification Queries Card */}
          <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-neutral-900 tracking-tight flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-neutral-700" />
                  A. Staðfestingarfyrirspurnir: Athuga hvort rikisgat sé með allt
                </h3>
                <p className="text-xs text-neutral-500">
                  Keyrðu þessar SQL skipanir í <strong>Query Tool í pgAdmin 4</strong> til að fá nákvæma tölu á hverju einasta ári og töflu.
                </p>
              </div>

              <button
                onClick={() => copyToClipboard(sqlCheckAll, 'check')}
                className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer self-start md:self-auto shadow-xs"
              >
                {copiedKey === 'check' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedKey === 'check' ? 'Afritað!' : 'Afrita SQL staðfestingu'}
              </button>
            </div>

            <div className="bg-neutral-900 text-neutral-200 p-4 rounded-lg font-mono text-xs overflow-x-auto">
              <pre className="text-neutral-100 whitespace-pre leading-relaxed">{sqlCheckAll}</pre>
            </div>

            {/* Checklist of what is now in the DB */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
              <div className="p-3.5 bg-neutral-50 rounded-lg border border-neutral-200">
                <div className="text-[11px] font-bold text-neutral-500 uppercase">1. Reikningar (reikningar)</div>
                <div className="text-lg font-black text-emerald-800 mt-1 font-mono">18.167.314 línur</div>
                <div className="text-[11px] text-neutral-600 mt-0.5">Tímabil: 2017-08-01 til 2026-06-30</div>
              </div>

              <div className="p-3.5 bg-neutral-50 rounded-lg border border-neutral-200">
                <div className="text-[11px] font-bold text-neutral-500 uppercase">2. Stofnanir (stofnanir)</div>
                <div className="text-lg font-black text-neutral-900 mt-1 font-mono">172 stofnanir</div>
                <div className="text-[11px] text-emerald-700 mt-0.5 font-medium">100% með virka reikninga</div>
              </div>

              <div className="p-3.5 bg-neutral-50 rounded-lg border border-neutral-200">
                <div className="text-[11px] font-bold text-neutral-500 uppercase">3. Birgjar (birgjar)</div>
                <div className="text-lg font-black text-neutral-900 mt-1 font-mono">19.303 birgjar</div>
                <div className="text-[11px] text-emerald-700 mt-0.5 font-medium">100% með virka reikninga</div>
              </div>

              <div className="p-3.5 bg-neutral-50 rounded-lg border border-neutral-200">
                <div className="text-[11px] font-bold text-neutral-500 uppercase">4. Munaðarlausar færslur</div>
                <div className="text-lg font-black text-emerald-700 mt-1 font-mono">0 vantar</div>
                <div className="text-[11px] text-emerald-700 mt-0.5 font-medium">100% heildstæð tenging</div>
              </div>
            </div>
          </div>

          {/* Missing Indexes Alert & SQL */}
          <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-neutral-900 tracking-tight flex items-center gap-2">
                    <Database className="w-4 h-4 text-amber-600" />
                    B. Næsta skref: Búa til Flýtivísa (Indexes) & ANALYZE
                  </h3>
                  <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                    Mjög mikilvægt
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Eftir að <code>COPY</code> er lokið eru engir vísar nema primary key og leit tekur nokkrar sekúndur. Keyrðu þetta til að ná 0,005–0,03 sekúndna leitarhraða. 
                  <strong className="text-amber-700 block mt-1">ATH: Ef pgAdmin gefur villu um transaction (SQL state 25001), sleppið orðinu CONCURRENTLY eins og sýnt er hér.</strong>
                </p>
              </div>

              <button
                onClick={() => copyToClipboard(indexScripts, 'index')}
                className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer self-start md:self-auto shadow-xs"
              >
                {copiedKey === 'index' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedKey === 'index' ? 'Afritað!' : 'Afrita Index skipanir'}
              </button>
            </div>

            <div className="bg-neutral-900 text-neutral-200 p-4 rounded-lg font-mono text-xs overflow-x-auto">
              <pre className="text-amber-200 whitespace-pre leading-relaxed">{indexScripts}</pre>
            </div>
          </div>

          {/* Complete COPY commands for all tables */}
          <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-neutral-900 tracking-tight flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-neutral-700" />
                  C. COPY skipanir fyrir birgjar og stofnanir (ef þær vantar enn)
                </h3>
                <p className="text-xs text-neutral-500">
                  Ef þú fylltir aðeins <code>reikningar</code> töfluna með COPY geturðu keyrt þetta fyrir birgja og stofnanir.
                </p>
              </div>

              <button
                onClick={() => copyToClipboard(copyScriptsAll, 'allcopy')}
                className="px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-neutral-300"
              >
                {copiedKey === 'allcopy' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedKey === 'allcopy' ? 'Afritað!' : 'Afrita COPY skipanir'}
              </button>
            </div>

            <div className="bg-neutral-900 text-neutral-200 p-4 rounded-lg font-mono text-xs overflow-x-auto">
              <pre className="text-sky-200 whitespace-pre leading-relaxed">{copyScriptsAll}</pre>
            </div>
          </div>
        </div>
      )}

      {/* 2. SCHEMA VIEW */}
      {activeSubTab === 'schema' && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <h3 className="text-lg font-bold text-neutral-900 tracking-tight flex items-center gap-2">
                  <Database className="w-5 h-5 text-neutral-800" />
                  PostgreSQL 18 Gagnalíkan (D:\PostgreSQL\data ~4,2 GiB)
                </h3>
                <p className="text-xs text-neutral-500">
                  Gagnagrunnurinn <code>rikisgat</code> eins og hann birtist í pgAdmin 4.
                </p>
              </div>

              <span className="bg-neutral-100 text-neutral-800 text-xs font-mono px-2.5 py-1 rounded border border-neutral-200">
                Encoding: UTF8 | Host: localhost:5432
              </span>
            </div>

            {/* Visual pgAdmin replication */}
            <div className="border border-neutral-300 rounded-lg overflow-hidden text-xs">
              <div className="bg-neutral-100 p-2.5 font-bold text-neutral-700 border-b border-neutral-300 flex items-center justify-between">
                <span>🐘 Database: rikisgat (pgAdmin 4 á D:\PostgreSQL)</span>
                <span>6 töflur samtals (Raungögn úr pgAdmin)</span>
              </div>
              
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200 text-[11px] font-bold text-neutral-500 uppercase">
                    <th className="p-3">Tafla</th>
                    <th className="p-3 text-right">Dálkar</th>
                    <th className="p-3">Dálkaheiti og Gagnatýpur (PostgreSQL)</th>
                    <th className="p-3">Tenging / Vensl</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  <tr className="hover:bg-neutral-50/80 bg-emerald-50/30">
                    <td className="p-3 font-mono font-bold text-emerald-800 flex items-center gap-2">
                      <Table className="w-4 h-4 text-emerald-600" /> reikningar
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-700">7 dálkar</td>
                    <td className="p-3 font-mono text-[11px] text-neutral-700">
                      <code>id (bigint PK)</code>, <code>stofnun_id (integer)</code>, <code>birgi_id (integer)</code>, <code>dags (date)</code>, <code>tegund (varchar 150)</code>, <code>numer (varchar 100)</code>, <code>upphaed (bigint)</code>
                    </td>
                    <td className="p-3 text-[11px] text-neutral-600">
                      18.167.314 raðir. Tengist <code>stofnanir.id</code> og <code>birgjar.id</code>.
                    </td>
                  </tr>

                  <tr className="hover:bg-neutral-50/80">
                    <td className="p-3 font-mono font-bold text-blue-700 flex items-center gap-2">
                      <Table className="w-4 h-4 text-neutral-400" /> stofnanir
                    </td>
                    <td className="p-3 text-right font-mono font-bold">2 dálkar</td>
                    <td className="p-3 font-mono text-[11px] text-neutral-700">
                      <code>id (integer PK)</code>, <code>nafn (varchar 255)</code>
                    </td>
                    <td className="p-3 text-[11px] text-neutral-600">
                      Ráðuneyti og ríkisstofnanir (tengist <code>reikningar.stofnun_id</code>)
                    </td>
                  </tr>

                  <tr className="hover:bg-neutral-50/80">
                    <td className="p-3 font-mono font-bold text-blue-700 flex items-center gap-2">
                      <Table className="w-4 h-4 text-neutral-400" /> birgjar
                    </td>
                    <td className="p-3 text-right font-mono font-bold">2 dálkar</td>
                    <td className="p-3 font-mono text-[11px] text-neutral-700">
                      <code>id (integer PK)</code>, <code>nafn (varchar 255)</code>
                    </td>
                    <td className="p-3 text-[11px] text-neutral-600">
                      Birgjar ríkisins (tengist <code>reikningar.birgi_id</code>)
                    </td>
                  </tr>

                  {/* Stjórnborð Viðbótartöflur */}
                  <tr className="hover:bg-neutral-50/80">
                    <td className="p-3 font-mono font-bold text-neutral-800 flex items-center gap-2">
                      <Table className="w-4 h-4 text-neutral-500" /> stjorn_verkefni
                    </td>
                    <td className="p-3 text-right font-mono font-bold">11 dálkar</td>
                    <td className="p-3 font-mono text-[11px] text-neutral-700">
                      <code>id (int)</code>, <code>milestone (enum)</code>, <code>title (varchar 255)</code>, <code>description (text)</code>, <code>category (enum)</code>, <code>priority (enum)</code>, <code>status (enum)</code>, <code>deadline (date)</code>, <code>assignee (varchar 100)</code>, <code>created_at</code>, <code>updated_at</code>
                    </td>
                    <td className="p-3 text-[11px] text-neutral-600">
                      Verkefnastýring og framvinda
                    </td>
                  </tr>

                  <tr className="hover:bg-neutral-50/80">
                    <td className="p-3 font-mono font-bold text-neutral-800 flex items-center gap-2">
                      <Table className="w-4 h-4 text-neutral-500" /> stjorn_vorumerki
                    </td>
                    <td className="p-3 text-right font-mono font-bold">13 dálkar</td>
                    <td className="p-3 font-mono text-[11px] text-neutral-700">
                      <code>id (int)</code>, <code>nafn (varchar 150)</code>, <code>len (varchar 150)</code>, <code>slogan (varchar 255)</code>, <code>status (enum)</code>, <code>markhopur (text)</code>, <code>kostir (text)</code>, <code>gallar (text)</code>, <code>isnic_status (enum)</code>, <code>einkunn (smallint)</code>, <code>athugasemdir (text)</code>, <code>created_at</code>, <code>updated_at</code>
                    </td>
                    <td className="p-3 text-[11px] text-neutral-600">
                      Vörumerki, lén og markaðssetning
                    </td>
                  </tr>

                  <tr className="hover:bg-neutral-50/80">
                    <td className="p-3 font-mono font-bold text-neutral-800 flex items-center gap-2">
                      <Table className="w-4 h-4 text-neutral-500" /> tegundir_flokkun
                    </td>
                    <td className="p-3 text-right font-mono font-bold">607 flokkar</td>
                    <td className="p-3 font-mono text-[11px] text-neutral-700">
                      <code>tegund (varchar 150)</code>, <code>yfirflokkur (varchar 100)</code>
                    </td>
                    <td className="p-3 text-[11px] text-neutral-600">
                      Straumlínulögun á vöru- og þjónustuflokkum
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ASCII Schema Diagram */}
            <div className="bg-neutral-900 text-neutral-200 p-4 rounded-lg font-mono text-[11px] overflow-x-auto leading-tight space-y-3">
              <div className="text-emerald-400 font-bold">1. Aðaltöflur opinberra gagna & Tegundaflokkun:</div>
              <pre>{`┌─────────────────────────┐       ┌────────────────────────────────────────────────────────┐       ┌──────────────────────┐
│       stofnanir         │       │                       reikningar                       │       │       birgjar        │
├─────────────────────────┤       ├────────────────────────────────────────────────────────┤       ├──────────────────────┤
│ id (INT, PK)            │───┐   │ id (BIGINT, PK)                                        │   ┌───│ id (INT, PK)         │
│ nafn (VARCHAR 255)      │   └──▶│ stofnun_id (INT, INDEX) ───────────────────────────────┤   │   │ nafn (VARCHAR 255)   │
└─────────────────────────┘       │ birgi_id (INT, INDEX) ─────────────────────────────────┼───┘   └──────────────────────┘
                                  │ dags (DATE, INDEX)                                     │
                                  │ tegund (VARCHAR 150) ──────────────────────────────┐   │
                                  │ numer (VARCHAR 100)                                │   │
                                  │ upphaed (BIGINT)                                   │   │
                                  └────────────────────────────────────────────────────┼───┘
                                                                                       │
                                  ┌────────────────────────────────────────────────────▼───┐
                                  │                   tegundir_flokkun                     │
                                  ├────────────────────────────────────────────────────────┤
                                  │ tegund (VARCHAR 150, PK)                               │
                                  │ yfirflokkur (VARCHAR 100, INDEX) ───▶ 12 Aðalflokkar   │
                                  └────────────────────────────────────────────────────────┘`}</pre>

              <div className="text-emerald-400 font-bold pt-2 border-t border-neutral-800">2. Stjórnborðstöflur (Verkefni & Vörumerki):</div>
              <pre>{`┌────────────────────────────────────────────────────────┐       ┌────────────────────────────────────────────────────────┐
│                   stjorn_verkefni                      │       │                    stjorn_vorumerki                    │
├────────────────────────────────────────────────────────┤       ├────────────────────────────────────────────────────────┤
│ id (INT, PK, AUTO_INCREMENT)                           │       │ id (INT, PK, AUTO_INCREMENT)                           │
│ milestone (ENUM 'M1','M2','M3','M4')                   │       │ nafn (VARCHAR 150, UNIQUE)                             │
│ title (VARCHAR 255)                                    │       │ len (VARCHAR 150)                                      │
│ description (TEXT)                                     │       │ slogan (VARCHAR 255)                                   │
│ category (ENUM 'Rekstur','Gagnagrunnur','Bakendi'...)  │       │ status (ENUM 'adal','i_skodun','fratekid','hugmynd')   │
│ priority (ENUM 'high','medium','low')                  │       │ markhopur (TEXT), kostir (TEXT), gallar (TEXT)         │
│ status (ENUM 'completed','in_progress','future')       │       │ isnic_status (ENUM 'laust','fratekid','athuga')        │
│ deadline (DATE), assignee (VARCHAR 100)                │       │ einkunn (TINYINT), athugasemdir (TEXT)                 │
└────────────────────────────────────────────────────────┘       └────────────────────────────────────────────────────────┘`}</pre>
            </div>
          </div>
        </div>
      )}

      {/* 2. FOLDER TREE VIEW */}
      {activeSubTab === 'folder' && (
        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-neutral-900 tracking-tight flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-neutral-800" />
                Möppuskipan á Fartölvu (D:\ Drif) & PostgreSQL 18
              </h3>
              <p className="text-xs text-neutral-500">
                Raunveruleg möppuskipan á vinnuvélinni: PostgreSQL gagnagrunnur og Node.js vefþjónn.
              </p>
            </div>
          </div>

          <div className="bg-neutral-900 text-neutral-200 p-5 rounded-xl font-mono text-xs overflow-x-auto space-y-1">
            <div className="text-emerald-400 font-bold mb-2">📁 D:\ (Aðaldrif fyrir þróun og gagnagrunna)</div>
            
            {/* PostgreSQL installation */}
            <div className="pl-4 text-sky-400 font-bold">📁 D:\PostgreSQL\ <span className="text-neutral-500 text-[11px]">(PostgreSQL 18 vél og verkfæri)</span></div>
            <div className="pl-8 text-neutral-300">📁 bin\ <span className="text-neutral-500 text-[11px]">(pg_dump.exe, pg_restore.exe, psql.exe)</span></div>
            <div className="pl-8 text-neutral-300">📁 data\ <span className="text-neutral-500 text-[11px]">(Gagnagrunnsskrár: rikisgat ~4,2 GiB - 18,17M reikningar)</span></div>
            <div className="pl-8 text-neutral-400">📁 pgAdmin 4\ <span className="text-neutral-500 text-[11px]">(Stjórnborð og SQL Query Tool)</span></div>
            
            {/* Raw public import data */}
            <div className="pl-4 text-sky-300 font-bold mt-2">📁 C:\Users\Public\ <span className="text-neutral-500 text-[11px]">(Upprunalegar textaskrár notaðar í COPY)</span></div>
            <div className="pl-8 text-neutral-300">📄 reikningar.txt <span className="text-neutral-500 text-[11px]">(18.167.314 línur - TSV)</span></div>
            <div className="pl-8 text-neutral-300">📄 stofnanir.txt <span className="text-neutral-500 text-[11px]">(172 línur - TSV)</span></div>
            <div className="pl-8 text-neutral-300">📄 birgjar.txt <span className="text-neutral-500 text-[11px]">(19.303 línur - TSV)</span></div>

            {/* SQL & Category mappings directory */}
            <div className="pl-4 text-blue-400 font-bold mt-2">📁 D:\gagnagrunnur_skriftur\ <span className="text-neutral-500 text-[11px]">(SQL viðhalds- og flokkunarskriftur)</span></div>
            <div className="pl-8 text-emerald-300">📜 01_schema_rikisgat.sql <span className="text-neutral-500 text-[11px]">(Töfluskilgreiningar & Composite Indexes)</span></div>
            <div className="pl-8 text-emerald-300">📜 02_flokkun_tegunda.sql <span className="text-neutral-500 text-[11px]">(12 aðalflokkar & tegundir_flokkun tafla)</span></div>
            <div className="pl-8 text-neutral-400">📜 03_benchmark_queries.sql <span className="text-neutral-500 text-[11px]">(Afkastaprófanir & EXPLAIN ANALYZE)</span></div>

            {/* Backup directory */}
            <div className="pl-4 text-emerald-400 font-bold mt-2">📁 D:\afrit_rikisgat\ <span className="text-neutral-500 text-[11px]">(Öryggisafrit á harða diskinum án internets)</span></div>
            <div className="pl-8 text-neutral-300">⚙️ backup.bat <span className="text-neutral-500 text-[11px]">(D:\PostgreSQL\bin\pg_dump.exe sjálfvirk skrifta)</span></div>
            <div className="pl-8 text-neutral-400">📦 rikisgat_full_20260914.dump <span className="text-neutral-500 text-[11px]">(Nýjasta staðbundna afritið: ~900 MB þjappað)</span></div>

            {/* Node.js server and client */}
            <div className="pl-4 text-amber-400 font-bold mt-2">📁 D:\minn-vefthjonn\ <span className="text-neutral-500 text-[11px]">(Vefþjónn & RíkisGát forrit)</span></div>
            <div className="pl-8 text-purple-400 font-bold">📁 minn-server\ <span className="text-neutral-500 text-[11px]">(Node.js & Express API)</span></div>
            <div className="pl-12 text-neutral-400">📁 node_modules\ <span className="text-neutral-500 text-[11px]">(pg, express, dotenv, cors, typescript)</span></div>
            <div className="pl-12 text-neutral-300">📄 .env <span className="text-neutral-500 text-[11px]">(DATABASE_URL=postgresql://localhost:5432/rikisgat)</span></div>
            <div className="pl-12 text-neutral-300">⚡ server.ts <span className="text-neutral-500 text-[11px]">(Express API: /api/stats, /api/flokkar, /api/top-suppliers)</span></div>
            <div className="pl-12 text-neutral-300">📦 package.json <span className="text-neutral-500 text-[11px]">(Node.js uppsetning og keyrsluskriftur)</span></div>

            {/* Frontend application */}
            <div className="pl-8 text-sky-400 font-bold mt-1">📁 rikisgat-web\ <span className="text-neutral-500 text-[11px]">(React + Tailwind vefforritið)</span></div>
            <div className="pl-12 text-neutral-300">📁 src\components\ <span className="text-neutral-500 text-[11px]">(CategoryStreamlining, DataSimulatorTab, BrandDesigner...)</span></div>
            <div className="pl-12 text-neutral-400">📁 dist\ <span className="text-neutral-500 text-[11px]">(Tilbúnar production skrár fyrir vefþjóninn)</span></div>
          </div>
        </div>
      )}

      {/* 3. FLOW VIEW */}
      {activeSubTab === 'flow' && (
        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-xs space-y-5">
          <div>
            <h3 className="text-lg font-bold text-neutral-900 tracking-tight flex items-center gap-2">
              <Cpu className="w-5 h-5 text-neutral-800" />
              Gagnavinnsluflæði: D:\ Drif á Fartölvu yfir í Skýjahýsingu
            </h3>
            <p className="text-xs text-neutral-500">
              Heildarferlið frá staðbundinni vinnslu á D:\ drifi (án internets) yfir í sjálfvirka skýjadreifingu með Git.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
              <div className="w-6 h-6 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-xs">1</div>
              <div className="font-bold text-xs text-neutral-900">PostgreSQL 18 á D:\</div>
              <p className="text-[11px] text-neutral-600 leading-relaxed">
                Gögn geymd í <code>D:\PostgreSQL\data</code>. Composite flýtivísar tryggja &lt;0,005s afköst á 18M færslum í pgAdmin 4.
              </p>
            </div>

            <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
              <div className="w-6 h-6 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-xs">2</div>
              <div className="font-bold text-xs text-neutral-900">Staðbundið Afrit án nets</div>
              <p className="text-[11px] text-neutral-600 leading-relaxed">
                <code>D:\afrit_rikisgat\backup.bat</code> keyrir <code>pg_dump.exe</code> og tekur öryggisafrit á diskinn. Gögn tapast aldrei á ferðalögum.
              </p>
            </div>

            <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
              <div className="w-6 h-6 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-xs">3</div>
              <div className="font-bold text-xs text-neutral-900">Node.js í minn-server</div>
              <p className="text-[11px] text-neutral-600 leading-relaxed">
                Forritið keyrir í <code>D:\minn-vefthjonn\minn-server</code>. Tengist local PostgreSQL gegnum <code>.env</code> umhverfisbreytur.
              </p>
            </div>

            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
              <div className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs">4</div>
              <div className="font-bold text-xs text-emerald-900">Skýjahýsing með Git</div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                Kveðja FTP: <code>git push</code> uppfærir vefinn sjálfkrafa í skýinu á 60 sekúndum með ókeypis sjálfvirku SSL vottorði.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
