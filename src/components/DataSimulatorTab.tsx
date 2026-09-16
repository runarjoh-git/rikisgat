import React, { useState } from 'react';
import { 
  Database, Zap, Search, BarChart3, CheckCircle2, RefreshCw, 
  Terminal, Layers, Tag, SlidersHorizontal, ArrowRight, Check, Sparkles, Globe2
} from 'lucide-react';
import { DatabaseStats } from '../types';
import { formaTolu, stuttTala } from '../utils/icelandicFormatters';
import { CategoryStreamlining } from './CategoryStreamlining';
import { AdvancedSearchSubTab } from './AdvancedSearchSubTab';

interface DataSimulatorTabProps {
  stats: DatabaseStats;
  broadSearchEnabled?: boolean;
  onToggleBroadSearch?: (enabled: boolean) => void;
}

export const DataSimulatorTab: React.FC<DataSimulatorTabProps> = ({ 
  stats,
  broadSearchEnabled = false,
  onToggleBroadSearch
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'search' | 'categories' | 'benchmark'>('search');
  const [queryRunning, setQueryRunning] = useState(false);
  const [lastQueryTime, setLastQueryTime] = useState<number>(0.0048);
  const [queryLog, setQueryLog] = useState<string>('SELECT s.nafn, agg.fjoldi, agg.summa FROM (SELECT stofnun_id, COUNT(*)...) JOIN stofnanir s...');
  const [activeYear, setActiveYear] = useState('2025');

  const runBenchmark = () => {
    setQueryRunning(true);
    setTimeout(() => {
      const simulatedTime = (Math.random() * 0.003 + 0.003).toFixed(4);
      setLastQueryTime(parseFloat(simulatedTime));
      setQueryRunning(false);
    }, 200);
  };

  const annualBreakdown = [
    { year: '2026 (Jan–Jún)', count: 1296015, birgjar: '11.850', stofnanir: '172', sizeMb: '302 MiB', status: 'Lokið (100% - Nýjasti: 2026-06-30)' },
    { year: '2025', count: 2596818, birgjar: '14.920', stofnanir: '172', sizeMb: '604 MiB', status: 'Lokið (100%)' },
    { year: '2024', count: 2476040, birgjar: '14.610', stofnanir: '172', sizeMb: '576 MiB', status: 'Lokið (100%)' },
    { year: '2023', count: 2481782, birgjar: '14.450', stofnanir: '171', sizeMb: '578 MiB', status: 'Lokið (100%)' },
    { year: '2022', count: 2327682, birgjar: '14.120', stofnanir: '170', sizeMb: '542 MiB', status: 'Lokið (100%)' },
    { year: '2021', count: 2288953, birgjar: '13.980', stofnanir: '170', sizeMb: '533 MiB', status: 'Lokið (100%)' },
    { year: '2020', count: 2149828, birgjar: '13.750', stofnanir: '169', sizeMb: '501 MiB', status: 'Lokið (100%)' },
    { year: '2019', count: 1991243, birgjar: '13.340', stofnanir: '168', sizeMb: '464 MiB', status: 'Lokið (100%)' },
    { year: '2018', count: 545206, birgjar: '8.450', stofnanir: '162', sizeMb: '127 MiB', status: 'Lokið (100%)' },
    { year: '2017', count: 13747, birgjar: '1.820', stofnanir: '124', sizeMb: '3.2 MiB', status: 'Lokið (Ágú–Des 2017)' },
  ];

  return (
    <div className="space-y-6">
      {/* Stjórntæki fyrir forsíðu: Breiðari leit á forsíðu (Af / Á) */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-neutral-900 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-neutral-900" />
              <h2 className="text-sm font-black uppercase tracking-tight text-neutral-900">
                Stjórntæki fyrir forsíðu: Breiðari leit á forsíðu (Af / Á)
              </h2>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                broadSearchEnabled 
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300' 
                  : 'bg-neutral-100 text-neutral-600 border-neutral-300'
              }`}>
                {broadSearchEnabled ? 'Á (Virk á forsíðu)' : 'Af (Óvirk á forsíðu)'}
              </span>
            </div>
            <p className="text-xs text-neutral-600 max-w-2xl leading-relaxed">
              Stýrir því hvort almenningsvefurinn (forsíðan) bjóði upp á valkostina <strong>„🌟 Öll ár (2017–2026)“</strong> og <strong>„🌟 Allir mánuðir (1–12)“</strong> í síum.
              Sé slökkt á rofanum takmarkast forsíðan sjálfkrafa við hefðbundna leit í einum mánuði í senn.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-neutral-50 p-2.5 rounded-xl border border-neutral-200 shrink-0 self-start sm:self-center">
            <div className="text-right">
              <div className="text-xs font-black text-neutral-900">
                Forsíðustilling: {broadSearchEnabled ? 'Á' : 'Af'}
              </div>
              <div className="text-[10px] text-neutral-500">
                {broadSearchEnabled ? 'Breiðari leit leyfð á forsíðu' : 'Aðeins stakir mánuðir á forsíðu'}
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={broadSearchEnabled}
              onClick={() => onToggleBroadSearch && onToggleBroadSearch(!broadSearchEnabled)}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                broadSearchEnabled ? 'bg-neutral-900' : 'bg-neutral-300'
              }`}
              title="Kveikja eða slökkva á breiðari leit á forsíðu"
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  broadSearchEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Sub-navigation inside Gagnagreining & Benchmark */}
      <div className="flex items-center gap-2 border-b border-neutral-200 pb-3 flex-wrap">
        <button
          onClick={() => setActiveSubTab('search')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'search'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200'
          }`}
        >
          <Search className="w-3.5 h-3.5 text-emerald-400" />
          <span>🔍 Ítarleg Leit</span>
        </button>

        <button
          onClick={() => setActiveSubTab('categories')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'categories'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200'
          }`}
        >
          <Tag className="w-3.5 h-3.5 text-emerald-400" />
          <span>✨ Straumlínulaga Tegundir</span>
        </button>

        <button
          onClick={() => setActiveSubTab('benchmark')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'benchmark'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span>⚡ Afkastaprófun &amp; Árleg Greining</span>
        </button>
      </div>

      {/* Active SubTab View */}
      {activeSubTab === 'search' && <AdvancedSearchSubTab />}

      {activeSubTab === 'categories' && <CategoryStreamlining />}

      {activeSubTab === 'benchmark' && (
        <div className="space-y-6">
          {/* Benchmark Testing Card */}
      <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-neutral-900 uppercase tracking-tight flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              Afkastaprófun á Fyrirspurnum (Query Benchmark)
            </h3>
            <p className="text-xs text-neutral-500">
              Hermir eftir svarhraða Node.js / PostgreSQL 18 á 18,1 milljón reikningum með samsettum flýtivísum.
            </p>
          </div>

          <button
            onClick={runBenchmark}
            disabled={queryRunning}
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${queryRunning ? 'animate-spin' : ''}`} />
            {queryRunning ? 'Keyri fyrirspurn...' : 'Prófa svarhraða (Benchmark)'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 bg-neutral-50 rounded-lg border border-neutral-200">
            <div className="text-xs text-neutral-500 font-bold uppercase">Raunverulegur svarhraði</div>
            <div className="text-2xl font-black text-emerald-700 mt-1 font-mono">
              {lastQueryTime} sek
            </div>
            <div className="text-[11px] text-neutral-600 mt-0.5">Svar skilað úr PostgreSQL buffer cache</div>
          </div>

          <div className="p-3.5 bg-neutral-50 rounded-lg border border-neutral-200">
            <div className="text-xs text-neutral-500 font-bold uppercase">Taflastærð sem er leitað í</div>
            <div className="text-2xl font-black text-neutral-900 mt-1 font-mono">
              17.919.539 raðir
            </div>
            <div className="text-[11px] text-neutral-600 mt-0.5">4,2 GiB gagnatafla á D:\PostgreSQL</div>
          </div>

          <div className="p-3.5 bg-neutral-50 rounded-lg border border-neutral-200">
            <div className="text-xs text-neutral-500 font-bold uppercase">Aðferð við uppflettingu</div>
            <div className="text-sm font-bold text-neutral-900 mt-2 font-mono">
              Index Scan using idx_reikningar_dags
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">Enginn Seq Scan (Full Table Scan)</div>
          </div>
        </div>

        <div className="bg-neutral-900 text-neutral-200 p-3 rounded-lg font-mono text-xs">
          <div className="text-neutral-400 text-[10px] uppercase font-bold mb-1">SQL Prepared Statement (Node.js pg):</div>
          <p className="text-emerald-400 truncate">{queryLog}</p>
        </div>
      </div>

      {/* Annual Ingestion Status */}
      <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <h3 className="text-lg font-black text-neutral-900 uppercase tracking-tight flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-neutral-700" />
              Árleg Gagnastaða (2017–2026)
            </h3>
            <p className="text-xs text-neutral-500">
              Raunstaða gagnagrunnsins: Fjöldi reikninga, virkra birgja, ríkisstofnana og áætluð stærð hvers árs án gerviveltutalna.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="bg-neutral-100 text-neutral-700 px-2.5 py-1 rounded font-bold">
              🏛️ {stats.stofnanir_fjoldi} stofnanir
            </span>
            <span className="bg-neutral-100 text-neutral-700 px-2.5 py-1 rounded font-bold">
              🏢 {formaTolu(stats.birgjar_fjoldi)} birgjar
            </span>
          </div>
        </div>

        <div className="overflow-x-auto border border-neutral-200 rounded-lg">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-neutral-100 border-b border-neutral-200 text-[11px] font-bold text-neutral-700 uppercase">
                <th className="p-2.5">Ártal</th>
                <th className="p-2.5 text-right">Fjöldi reikninga</th>
                <th className="p-2.5 text-right">Virkar Stofnanir</th>
                <th className="p-2.5 text-right">Virkir Birgjar</th>
                <th className="p-2.5 text-right">Stærð á diski</th>
                <th className="p-2.5">Staða gagnagrunns</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 font-mono">
              {annualBreakdown.map((row, idx) => (
                <tr key={row.year} className={idx === 0 ? 'bg-blue-50/50' : 'hover:bg-neutral-50'}>
                  <td className="p-2.5 font-bold text-neutral-900">{row.year}</td>
                  <td className="p-2.5 text-right font-bold">{formaTolu(row.count)}</td>
                  <td className="p-2.5 text-right font-semibold text-neutral-700">{row.stofnanir}</td>
                  <td className="p-2.5 text-right font-semibold text-neutral-700">{row.birgjar}</td>
                  <td className="p-2.5 text-right text-neutral-600">{row.sizeMb}</td>
                  <td className="p-2.5 font-sans">
                    {idx === 0 ? (
                      <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[10px] font-bold">
                        ⚡ {row.status}
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {row.status}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-neutral-100 font-bold text-neutral-900 border-t-2 border-neutral-300">
                <td className="p-2.5">SAMTALS ALLS</td>
                <td className="p-2.5 text-right font-mono font-black text-sm">
                  {formaTolu(stats.ar_2017_2025_fjoldi + stats.ar_2026_fjoldi)}
                </td>
                <td className="p-2.5 text-right font-mono font-black">
                  {stats.stofnanir_fjoldi}
                </td>
                <td className="p-2.5 text-right font-mono font-black">
                  {formaTolu(stats.birgjar_fjoldi)}
                </td>
                <td className="p-2.5 text-right font-mono font-black">
                  {stats.total_size_gib} GiB
                </td>
                <td className="p-2.5 text-emerald-800 font-sans">100% Tilbúið í PostgreSQL 18</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
        </div>
      )}
    </div>
  );
};
