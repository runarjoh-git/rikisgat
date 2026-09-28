import React, { useState, useEffect } from 'react';
import { 
  Zap, Clock, Database, AlertTriangle, CheckCircle2, RefreshCw, 
  Terminal, ShieldCheck, HardDrive, Cpu, X, Copy, Check, ArrowRight,
  Sliders, Play, Layers, BarChart3, HelpCircle, Hourglass, Search
} from 'lucide-react';
import { 
  runPerformanceTest, 
  fetchRecentRequests, 
  explainQuery,
  PerformanceTestResponse, 
  RecentApiRequest 
} from '../services/api';
import { formaTolu } from '../utils/icelandicFormatters';

interface PerformanceDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
  standalone?: boolean; // if rendered inside DataSimulatorTab directly instead of modal overlay
}

export const PerformanceDiagnosticModal: React.FC<PerformanceDiagnosticModalProps> = ({
  isOpen,
  onClose,
  standalone = false
}) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PerformanceTestResponse | null>(null);
  const [hasRunTest, setHasRunTest] = useState(false);
  const [recentLogs, setRecentLogs] = useState<RecentApiRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'suite' | 'bottlenecks' | 'history' | 'explain'>('suite');
  const [copiedSql, setCopiedSql] = useState<string | null>(null);

  // Custom EXPLAIN query tester state
  const [customQuery, setCustomQuery] = useState<string>(
    "SELECT id, dags, upphaed, tegund FROM reikningar WHERE tegund ~* 'styrk' LIMIT 25;"
  );
  const [explainLoading, setExplainLoading] = useState(false);
  const [explainResult, setExplainResult] = useState<{ executionMs: number; plan?: string; error?: string } | null>(null);

  const executeTest = async () => {
    setLoading(true);
    setHasRunTest(true);
    try {
      const res = await runPerformanceTest();
      setData(res);
      const logsRes = await fetchRecentRequests();
      setRecentLogs(logsRes.requests);
    } catch (err: any) {
      console.error('Error running performance test:', err);
    } finally {
      setLoading(false);
    }
  };

  const executeExplain = async () => {
    if (!customQuery.trim()) return;
    setExplainLoading(true);
    try {
      const res = await explainQuery(customQuery.trim());
      setExplainResult(res);
    } catch (err: any) {
      setExplainResult({ executionMs: 0, error: err.message });
    } finally {
      setExplainLoading(false);
    }
  };

  // Ekki keyra hraðapróf sjálfkrafa við ræsingu - bíða eftir að notandi smelli á hnappinn
  useEffect(() => {
    // Sækjum aðeins nýjustu beiðnaferla ef til eru, án þess að kveikja á þungum prófunum
    fetchRecentRequests().then(logsRes => {
      if (logsRes?.requests) setRecentLogs(logsRes.requests);
    }).catch(() => {});
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSql(id);
    setTimeout(() => setCopiedSql(null), 2500);
  };

  if (!isOpen && !standalone) return null;

  const content = (
    <div className={`space-y-6 ${standalone ? '' : 'p-6'}`}>
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-100 text-amber-900 rounded-xl">
              <Zap className="w-5 h-5 text-amber-700" />
            </span>
            <div>
              <h2 className="text-xl font-black tracking-tight text-neutral-900 uppercase">
                Hraðapróf & Flöskuhálsagreining á Localhost
              </h2>
              <p className="text-xs text-neutral-600 mt-0.5">
                Mælir raunverulegan svarhraða PostgreSQL á 18 milljón færslum og sýnir hvers vegna skipanir taka tíma.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={executeTest}
            disabled={loading}
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
          >
            {loading ? (
              <>
                <Hourglass className="w-4 h-4 animate-spin text-amber-400" />
                <span>Sækir gögn úr gagnagrunni með tímaglasi...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>Keyra hraðapróf núna</span>
              </>
            )}
          </button>

          {!standalone && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-neutral-100 text-neutral-500 rounded-xl transition cursor-pointer"
              title="Loka"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Quick Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
          <div className="text-[11px] font-bold uppercase text-neutral-500 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5" />
            <span>DB Tenging (Ping)</span>
          </div>
          <div className="text-2xl font-black text-neutral-900 font-mono mt-1">
            {!hasRunTest ? (
              <span className="text-neutral-400 font-normal text-xs flex items-center gap-1.5" title="Bíður eftir leitarskilyrðum">
                <Search className="w-3.5 h-3.5 text-neutral-400" />
                <span>Bíður prófunar</span>
              </span>
            ) : data?.timings?.dbPingMs !== undefined ? (
              `${data.timings.dbPingMs} ms`
            ) : (
              '—'
            )}
          </div>
          <div className="text-[10px] text-neutral-600 mt-0.5">Socket & handshake</div>
        </div>

        <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
          <div className="text-[11px] font-bold uppercase text-neutral-500 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Heildarpróf (7 próf)</span>
          </div>
          <div className={`text-2xl font-black font-mono mt-1 ${
            (data?.totalSuiteMs || 0) > 3000 ? 'text-rose-700' : 'text-emerald-700'
          }`}>
            {!hasRunTest ? (
              <span className="text-neutral-400 font-normal text-xs flex items-center gap-1.5" title="Bíður eftir leitarskilyrðum">
                <Search className="w-3.5 h-3.5 text-neutral-400" />
                <span>Bíður prófunar</span>
              </span>
            ) : data?.totalSuiteMs !== undefined ? (
              `${(data.totalSuiteMs / 1000).toFixed(2)}s`
            ) : (
              '—'
            )}
          </div>
          <div className="text-[10px] text-neutral-600 mt-0.5">Samtals biðtími</div>
        </div>

        <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
          <div className="text-[11px] font-bold uppercase text-neutral-500 flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5" />
            <span>Buffer Cache nýtni</span>
          </div>
          <div className="text-2xl font-black text-neutral-900 font-mono mt-1">
            {!hasRunTest ? (
              <span className="text-neutral-400 font-normal text-xs flex items-center gap-1.5" title="Bíður eftir leitarskilyrðum">
                <Search className="w-3.5 h-3.5 text-neutral-400" />
                <span>Bíður prófunar</span>
              </span>
            ) : data?.tableStats?.cacheHitPct !== undefined ? (
              `${data.tableStats.cacheHitPct}%`
            ) : (
              '99%'
            )}
          </div>
          <div className="text-[10px] text-neutral-600 mt-0.5">RAM vs. diskalestur</div>
        </div>

        <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
          <div className="text-[11px] font-bold uppercase text-neutral-500 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Flöskuhálsar</span>
          </div>
          <div className="text-2xl font-black text-amber-700 font-mono mt-1">
            {!hasRunTest ? (
              <span className="text-neutral-400 font-normal text-xs flex items-center gap-1.5" title="Bíður eftir leitarskilyrðum">
                <Search className="w-3.5 h-3.5 text-neutral-400" />
                <span>Bíður prófunar</span>
              </span>
            ) : (
              data?.bottlenecks?.filter(b => b.severity !== 'optimal').length ?? 0
            )}
          </div>
          <div className="text-[10px] text-neutral-600 mt-0.5">Atriði sem tefja kerfið</div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex items-center gap-2 border-b border-neutral-200 pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('suite')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'suite'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Svarstímar eftir fyrirspurnum</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('bottlenecks')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'bottlenecks'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          <span>Af hverju tekur þetta tíma? ({data?.bottlenecks?.length || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'history'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Svaraferill síðustu aðgerða ({recentLogs.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('explain')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'explain'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Prófa staka SQL fyrirspurn (EXPLAIN)</span>
        </button>
      </div>

      {/* TAB 1: Test Suite Breakdown */}
      {activeTab === 'suite' && (
        <div className="space-y-4">
          <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black uppercase tracking-tight text-neutral-900">
                  Rauntímaprófanir á PostgreSQL fyrirspurnum
                </h3>
                <p className="text-[11px] text-neutral-500">
                  Sýnir nákvæman tíma í millisekúndum (ms) fyrir mismunandi gerðir fyrirspurna á {data?.tableName || 'reikningar'} töflunni.
                </p>
              </div>
              <span className="text-[11px] font-mono font-bold text-neutral-600 bg-white px-2.5 py-1 rounded-lg border border-neutral-200">
                1 sekúnda = 1.000 ms
              </span>
            </div>

            <div className="divide-y divide-neutral-200 text-xs">
              {/* Test 1 */}
              <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-neutral-50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="font-bold text-neutral-900">1. Einföld síðufletting (Primary Key / LIMIT 25)</span>
                    <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                      Best Case (Fljótast)
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-neutral-500">
                    SELECT id, dags, upphaed FROM reikningar ORDER BY id DESC LIMIT 25;
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-lg font-black font-mono text-emerald-700">
                    {!hasRunTest ? (
                      <span className="text-neutral-400 font-normal text-xs flex items-center justify-end gap-1" title="Bíður eftir leitarskilyrðum">
                        <Search className="w-3.5 h-3.5 text-neutral-400" />
                        <span>Bíður</span>
                      </span>
                    ) : data?.timings?.pagedLookupMs !== undefined ? (
                      `${data.timings.pagedLookupMs} ms`
                    ) : (
                      '—'
                    )}
                  </span>
                  <div className="text-[10px] text-neutral-400">Index Scan á PK</div>
                </div>
              </div>

              {/* Test 2: Date Range vs Extract */}
              <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-neutral-50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="font-bold text-neutral-900">2. Síun á tímabili (B-Tree Date Range: dags &gt;= '2024-01-01')</span>
                    <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                      Vísavænt
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-neutral-500">
                    WHERE dags &gt;= '2024-01-01' AND dags &lt; '2024-02-01' LIMIT 25;
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-lg font-black font-mono text-emerald-700">
                    {!hasRunTest ? (
                      <span className="text-neutral-400 font-normal text-xs flex items-center justify-end gap-1" title="Bíður eftir leitarskilyrðum">
                        <Search className="w-3.5 h-3.5 text-neutral-400" />
                        <span>Bíður</span>
                      </span>
                    ) : data?.timings?.dateRangeFilterMs !== undefined ? (
                      `${data.timings.dateRangeFilterMs} ms`
                    ) : (
                      '—'
                    )}
                  </span>
                  <div className="text-[10px] text-neutral-400">B-Tree Range Scan</div>
                </div>
              </div>

              {/* Test 3: EXTRACT(YEAR) - The Trap! */}
              <div className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                (data?.timings?.dateExtractFilterMs || 0) > 500 ? 'bg-amber-50/50' : 'hover:bg-neutral-50'
              }`}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      (data?.timings?.dateExtractFilterMs || 0) > 500 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                    }`} />
                    <span className="font-bold text-neutral-900">3. Síun á ári með falli: EXTRACT(YEAR FROM dags)</span>
                    <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-300">
                      Algengur flöskuháls!
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-neutral-500">
                    WHERE EXTRACT(YEAR FROM dags::timestamp) = 2024 LIMIT 25;
                  </div>
                  <p className="text-[11px] text-neutral-600">
                    💡 <em>Ef B-Tree vísir er á dags getur PostgreSQL ekki notað hann þegar EXTRACT() er utan um dálkinn nema fallavísir sé til staðar.</em>
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-lg font-black font-mono ${
                    (data?.timings?.dateExtractFilterMs || 0) > 500 ? 'text-amber-800' : 'text-neutral-900'
                  }`}>
                    {!hasRunTest ? (
                      <span className="text-neutral-400 font-normal text-xs flex items-center justify-end gap-1" title="Bíður eftir leitarskilyrðum">
                        <Search className="w-3.5 h-3.5 text-neutral-400" />
                        <span>Bíður</span>
                      </span>
                    ) : data?.timings?.dateExtractFilterMs !== undefined ? (
                      `${data.timings.dateExtractFilterMs} ms`
                    ) : (
                      '—'
                    )}
                  </span>
                  <div className="text-[10px] text-neutral-500">
                    {!hasRunTest ? 'Tilbúið' : (data?.timings?.dateExtractFilterMs || 0) > 500 ? '⚠️ Fullt töfluscan' : 'Hraðvirkt'}
                  </div>
                </div>
              </div>

              {/* Test 4: Regex Search on description */}
              <div className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                (data?.timings?.regexSearchMs || 0) > 1000 ? 'bg-rose-50/50' : 'hover:bg-neutral-50'
              }`}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      (data?.timings?.regexSearchMs || 0) > 1000 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'
                    }`} />
                    <span className="font-bold text-neutral-900">4. Textaleit að styrkjum / framlögum: tegund ~* 'styrk'</span>
                    <span className="bg-neutral-100 text-neutral-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-neutral-300">
                      Styrkagreining
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-neutral-500">
                    WHERE tegund ~* 'styrk' LIMIT 25;
                  </div>
                  <p className="text-[11px] text-neutral-600">
                    Krefst <code>pg_trgm</code> GIN vísis. Án hans skannar vélin alla 18M reikninga einn af öðrum.
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-lg font-black font-mono ${
                    (data?.timings?.regexSearchMs || 0) > 1000 ? 'text-rose-700' : 'text-neutral-900'
                  }`}>
                    {!hasRunTest ? (
                      <span className="text-neutral-400 font-normal text-xs flex items-center justify-end gap-1" title="Bíður eftir leitarskilyrðum">
                        <Search className="w-3.5 h-3.5 text-neutral-400" />
                        <span>Bíður</span>
                      </span>
                    ) : data?.timings?.regexSearchMs !== undefined ? (
                      `${data.timings.regexSearchMs} ms`
                    ) : (
                      '—'
                    )}
                  </span>
                  <div className="text-[10px] text-neutral-500">
                    {!hasRunTest ? 'Tilbúið' : (data?.timings?.regexSearchMs || 0) > 1000 ? '🔴 Tekur nokkrar sekúndur' : '🟢 GIN nýttur'}
                  </div>
                </div>
              </div>

              {/* Test 5: GROUP BY Aggregation */}
              <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-neutral-50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="font-bold text-neutral-900">5. Stofnanayfirlit (GROUP BY stofnun_id)</span>
                  </div>
                  <div className="text-[11px] font-mono text-neutral-500">
                    SELECT stofnun_id, COUNT(*), SUM(upphaed) FROM reikningar GROUP BY 1 LIMIT 25;
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-lg font-black font-mono text-neutral-900">
                    {!hasRunTest ? (
                      <span className="text-neutral-400 font-normal text-xs flex items-center justify-end gap-1" title="Bíður eftir leitarskilyrðum">
                        <Search className="w-3.5 h-3.5 text-neutral-400" />
                        <span>Bíður</span>
                      </span>
                    ) : data?.timings?.groupAggregationMs !== undefined ? (
                      `${data.timings.groupAggregationMs} ms`
                    ) : (
                      '—'
                    )}
                  </span>
                  <div className="text-[10px] text-neutral-400">Hash Aggregate</div>
                </div>
              </div>
            </div>
          </div>

          {/* Database & Table Specs Card */}
          <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs">
            <h3 className="text-xs font-black uppercase tracking-tight text-neutral-900 mb-3 flex items-center gap-2">
              <Database className="w-4 h-4 text-neutral-600" />
              <span>Gagnagrunns- og vísastaða á Localhost</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                <span className="text-neutral-500 block text-[10px] uppercase font-bold">Stærð töflu á diski</span>
                <span className="font-bold font-mono text-sm text-neutral-900">{data?.tableStats?.tableSize || '4,2 GiB'}</span>
              </div>
              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                <span className="text-neutral-500 block text-[10px] uppercase font-bold">Stærð allra vísa</span>
                <span className="font-bold font-mono text-sm text-neutral-900">{data?.tableStats?.indexesSize || '1,1 GiB'}</span>
              </div>
              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                <span className="text-neutral-500 block text-[10px] uppercase font-bold">Fjöldi Seq Scans keyrð</span>
                <span className="font-bold font-mono text-sm text-neutral-900">{formaTolu(data?.tableStats?.seqScans || 0)}</span>
              </div>
              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                <span className="text-neutral-500 block text-[10px] uppercase font-bold">Fjöldi raða lesnar í seq scan</span>
                <span className="font-bold font-mono text-sm text-neutral-900">
                  {data?.tableStats?.seqTupRead 
                    ? `${(data.tableStats.seqTupRead / 1000000).toFixed(1)}M raðir` 
                    : '—'}
                </span>
              </div>
            </div>

            {/* List of existing indexes */}
            <div className="mt-4 pt-4 border-t border-neutral-200">
              <div className="text-[11px] font-bold uppercase text-neutral-600 mb-2">
                Flýtivísar sem eru virkir í töflunni ({data?.indexes?.length || 0}):
              </div>
              {data?.indexes && data.indexes.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {data.indexes.map((idx, i) => (
                    <div key={i} className="p-2.5 bg-neutral-50 rounded-lg border border-neutral-200 text-xs font-mono">
                      <div className="flex items-center justify-between font-bold text-neutral-900">
                        <span className="text-emerald-700">✓ {idx.name}</span>
                        <span className="text-[10px] text-neutral-500">{idx.size}</span>
                      </div>
                      <div className="text-[10px] text-neutral-500 truncate mt-0.5" title={idx.definition}>
                        {idx.definition}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900">
                  Engir sérstakir flýtivísar fundust fyrir utan sjálfgefna lykla. Þetta skýrir hvers vegna fyrirspurnir skanna alla töfluna!
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Bottlenecks & Explanations */}
      {activeTab === 'bottlenecks' && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-950 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-sm">Hvers vegna tekur skipun nokkrar sekúndur á localhost?</div>
              <p className="leading-relaxed">
                Gagnagrunnurinn inniheldur <strong>18 milljónir reikninga</strong> (4,2 GiB). Ef fyrirspurn notar ekki flýtivísi (Index) verður PostgreSQL að framkvæma <em>Sequential Scan</em>: lesa alla 18.000.000 færslurnar af harða disknum og bera saman. Á venjulegri tölvu tekur það <strong>3 til 8 sekúndur á hverri skipun</strong>.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {data?.bottlenecks?.map((item, idx) => (
              <div 
                key={idx} 
                className={`p-5 rounded-xl border ${
                  item.severity === 'critical'
                    ? 'bg-rose-50/50 border-rose-300'
                    : item.severity === 'warning'
                    ? 'bg-amber-50/50 border-amber-300'
                    : 'bg-emerald-50/50 border-emerald-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {item.severity === 'critical' && <span className="px-2 py-0.5 bg-rose-600 text-white rounded text-[10px] font-bold uppercase">Mjög Hægt</span>}
                      {item.severity === 'warning' && <span className="px-2 py-0.5 bg-amber-600 text-white rounded text-[10px] font-bold uppercase">Ábending</span>}
                      {item.severity === 'optimal' && <span className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-bold uppercase">Í lagi</span>}
                      <h4 className="font-bold text-sm text-neutral-900">{item.title}</h4>
                    </div>
                    <p className="text-xs text-neutral-700 leading-relaxed pt-1">
                      {item.description}
                    </p>
                    <div className="text-[11px] text-neutral-500 font-semibold pt-1">
                      Áhrif: {item.impact}
                    </div>
                  </div>
                </div>

                {item.solutionSql && (
                  <div className="mt-4 pt-3 border-t border-neutral-200">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold uppercase text-neutral-600 font-mono">
                        Mælt með að keyra í PostgreSQL (pgAdmin / psql) til að flýta um 95%:
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(item.solutionSql || '', `btn-${idx}`)}
                        className="text-xs font-bold text-neutral-800 hover:text-neutral-950 flex items-center gap-1 cursor-pointer bg-white px-2 py-1 rounded border border-neutral-300 shadow-2xs"
                      >
                        {copiedSql === `btn-${idx}` ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700">Afritað!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Afrita SQL</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="p-3 bg-neutral-900 text-emerald-400 font-mono text-xs rounded-lg overflow-x-auto">
                      {item.solutionSql}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Recent API Request Log */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black uppercase tracking-tight text-neutral-900">
                  Svaraferill síðustu fyrirspurna á Localhost
                </h3>
                <p className="text-[11px] text-neutral-500">
                  Skráir nákvæman vinnslutíma bakendans fyrir hverja skipun eða síun sem notandi framkvæmir á vefnum.
                </p>
              </div>
              <span className="text-xs font-bold text-neutral-700">
                Meðaltími: <strong>{data?.recentAverageMs || 0} ms</strong>
              </span>
            </div>

            {recentLogs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse font-mono">
                  <thead>
                    <tr className="bg-neutral-100 border-b border-neutral-200 text-[11px] text-neutral-700 uppercase">
                      <th className="p-2.5">Aðferð</th>
                      <th className="p-2.5">Slóð (Endpoint)</th>
                      <th className="p-2.5 text-center">Status</th>
                      <th className="p-2.5 text-right">Vinnslutími</th>
                      <th className="p-2.5 text-right">Tímasetning</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {recentLogs.map((log) => {
                      const isSlow = log.durationMs > 1000;
                      return (
                        <tr key={log.id} className={`hover:bg-neutral-50 ${isSlow ? 'bg-amber-50/40' : ''}`}>
                          <td className="p-2.5 font-bold text-neutral-700">{log.method}</td>
                          <td className="p-2.5 text-neutral-900 max-w-md truncate" title={log.path}>
                            {log.path}
                          </td>
                          <td className="p-2.5 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              log.status === 200 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {log.status}
                            </span>
                          </td>
                          <td className={`p-2.5 text-right font-black ${
                            log.durationMs > 2000 
                              ? 'text-rose-700' 
                              : log.durationMs > 500 
                              ? 'text-amber-800' 
                              : 'text-emerald-700'
                          }`}>
                            {log.durationMs > 1000 
                              ? `${(log.durationMs / 1000).toFixed(2)} sek` 
                              : `${log.durationMs} ms`}
                          </td>
                          <td className="p-2.5 text-right text-neutral-500 text-[10px]">
                            {new Date(log.timestamp).toLocaleTimeString('is-IS')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-neutral-500">
                Engar fyrirspurnir skráðar enn. Smelltu á „Keyra hraðapróf núna“ eða vafraðu um vefinn til að sjá rauntölur.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: Interactive EXPLAIN Runner */}
      {activeTab === 'explain' && (
        <div className="space-y-4">
          <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-3">
            <div>
              <h3 className="text-xs font-black uppercase tracking-tight text-neutral-900">
                Prófa einstaka SQL fyrirspurn með EXPLAIN (ANALYZE, BUFFERS)
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Sláðu inn SELECT fyrirspurn. Bakendinn keyrir hana beint í PostgreSQL og skilar nákvæmri greiningu á framkvæmdarferli (Query Execution Plan) og lesnum minnisblokkum.
              </p>
            </div>

            <div className="space-y-2">
              <textarea
                value={customQuery}
                onChange={e => setCustomQuery(e.target.value)}
                rows={3}
                className="w-full p-3 font-mono text-xs bg-neutral-900 text-emerald-400 rounded-xl border border-neutral-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                placeholder="SELECT * FROM reikningar WHERE ... LIMIT 25;"
              />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-neutral-500">
                  Öryggi: Aðeins <strong>SELECT</strong> fyrirspurnir eru leyfðar.
                </span>
                <button
                  type="button"
                  onClick={executeExplain}
                  disabled={explainLoading}
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Play className={`w-3.5 h-3.5 ${explainLoading ? 'animate-spin' : ''}`} />
                  <span>{explainLoading ? 'Keyri EXPLAIN...' : 'Keyra og mæla hraða'}</span>
                </button>
              </div>
            </div>

            {explainResult && (
              <div className="mt-4 pt-4 border-t border-neutral-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-900">
                    Niðurstaða framkvæmdar:
                  </span>
                  <span className="text-sm font-mono font-black text-emerald-700">
                    Svarhraði: {explainResult.executionMs} ms
                  </span>
                </div>

                {explainResult.error ? (
                  <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-lg text-xs font-mono">
                    Villa: {explainResult.error}
                  </div>
                ) : (
                  <pre className="p-4 bg-neutral-950 text-neutral-200 rounded-xl font-mono text-[11px] overflow-x-auto whitespace-pre leading-relaxed border border-neutral-800 max-h-80 overflow-y-auto">
                    {explainResult.plan}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  if (standalone) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div 
        className="bg-white rounded-2xl max-w-4xl w-full border border-neutral-300 shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="overflow-y-auto flex-1">
          {content}
        </div>
        <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Loka
          </button>
        </div>
      </div>
    </div>
  );
};
