import React, { useState } from 'react';
import { 
  Share2, Copy, Check, MessageSquare, Send, Sparkles, Building, 
  Newspaper, ExternalLink, Plus, Trash2, Edit3, Star, CheckCircle2, 
  Clock, AlertCircle, Database, Globe, HelpCircle, X, ThumbsUp, ThumbsDown
} from 'lucide-react';
import { BrandItem, BrandStatus } from '../types';
import { INITIAL_BRANDS } from '../data/mockData';

interface MarketingTabProps {
  brands?: BrandItem[];
  onAddBrand?: (newBrand: Omit<BrandItem, 'id' | 'createdAt'>) => void;
  onSetPrimaryBrand?: (brandId: string) => void;
  onDeleteBrand?: (brandId: string) => void;
}

export const MarketingTab: React.FC<MarketingTabProps> = ({
  brands: externalBrands,
  onAddBrand: externalOnAddBrand,
  onSetPrimaryBrand: externalOnSetPrimary,
  onDeleteBrand: externalOnDeleteBrand
}) => {
  // Local state for brands if not provided via props
  const [brands, setBrands] = useState<BrandItem[]>(externalBrands || INITIAL_BRANDS);
  const [copiedPitch, setCopiedPitch] = useState<string | null>(null);
  const [showAddBrandModal, setShowAddBrandModal] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // New Brand Form State
  const [brandName, setBrandName] = useState('');
  const [brandDomain, setBrandDomain] = useState('');
  const [brandSlogan, setBrandSlogan] = useState('');
  const [brandStatus, setBrandStatus] = useState<BrandStatus>('i_skodun');
  const [brandAudience, setBrandAudience] = useState('Borgarar, blaðamenn og greinendur');
  const [brandPros, setBrandPros] = useState('');
  const [brandCons, setBrandCons] = useState('');
  const [brandIsnic, setBrandIsnic] = useState<'laust' | 'fratekid' | 'athuga'>('athuga');
  const [brandRating, setBrandRating] = useState<number>(4);
  const [brandNotes, setBrandNotes] = useState('');

  const currentBrands = externalBrands || brands;

  const handleAddBrandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim()) return;

    const newBrand: BrandItem = {
      id: `brand-${Date.now()}`,
      nafn: brandName.trim(),
      len: brandDomain.trim() || `${brandName.toLowerCase().replace(/\s+/g, '')}.is`,
      slogan: brandSlogan.trim(),
      status: brandStatus,
      markhopur: brandAudience.trim(),
      kostir: brandPros.split('\n').map(s => s.trim()).filter(Boolean),
      gallar: brandCons.split('\n').map(s => s.trim()).filter(Boolean),
      isnicStatus: brandIsnic,
      einkunn: brandRating,
      athugasemdir: brandNotes.trim(),
      createdAt: new Date().toISOString().split('T')[0]
    };

    if (externalOnAddBrand) {
      externalOnAddBrand(newBrand);
    } else {
      setBrands(prev => [newBrand, ...prev]);
    }

    // Reset form
    setBrandName('');
    setBrandDomain('');
    setBrandSlogan('');
    setBrandPros('');
    setBrandCons('');
    setBrandNotes('');
    setShowAddBrandModal(false);
  };

  const handleSetPrimary = (id: string) => {
    if (externalOnSetPrimary) {
      externalOnSetPrimary(id);
    } else {
      setBrands(prev =>
        prev.map(b => ({
          ...b,
          status: b.id === id ? 'adal' : (b.status === 'adal' ? 'i_skodun' : b.status)
        }))
      );
    }
  };

  const handleDeleteBrand = (id: string) => {
    if (externalOnDeleteBrand) {
      externalOnDeleteBrand(id);
    } else {
      setBrands(prev => prev.filter(b => b.id !== id));
    }
  };

  const filteredBrands = currentBrands.filter(b => {
    if (statusFilter !== 'all' && b.status !== statusFilter) return false;
    return true;
  });

  const getStatusBadge = (status: BrandStatus) => {
    switch (status) {
      case 'adal':
        return (
          <span className="bg-emerald-500 text-neutral-900 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-2xs">
            <Sparkles className="w-3 h-3 text-neutral-900" /> Aðalvalkostur
          </span>
        );
      case 'i_skodun':
        return (
          <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded uppercase border border-amber-300">
            Í skoðun
          </span>
        );
      case 'fratekid':
        return (
          <span className="bg-blue-100 text-blue-900 text-[10px] font-bold px-2 py-0.5 rounded uppercase border border-blue-300">
            Frátekið / Keypt
          </span>
        );
      case 'hugmynd':
        return (
          <span className="bg-neutral-100 text-neutral-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
            Hugmynd
          </span>
        );
      case 'hafnad':
        return (
          <span className="bg-red-50 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase line-through">
            Hafnað
          </span>
        );
    }
  };

  const getIsnicBadge = (isnic: BrandItem['isnicStatus']) => {
    switch (isnic) {
      case 'laust':
        return <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">✓ Laust á ISNIC</span>;
      case 'fratekid':
        return <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">🔒 Frátekið</span>;
      case 'athuga':
        return <span className="text-[10px] font-bold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded">❓ Kanna stöðu</span>;
    }
  };

  const journalistPitch = `Efni: RÍKISGÁT — Ný leifturhraðvirk leitarvél í 18,1 milljón reikningsfærslum ríkisins

Sæl(l),

Sem blaðamaður veistu hversu tímafrekt er að fletta upp í Excel-skrám frá opnirreikningar.is eða bíða vikum saman eftir svörum við upplýsingabeiðnum frá ráðuneytum og stofnunum.

Ég hef þróað nýja vefgátt, RÍKISGÁT (rikisgat.is), sem dregur saman ALLA reikninga og bókhaldslínur ríkisins frá 2017 til 2026 (~18,1 milljón færslur) í einn staðlaðan gagnagrunn.

Helstu kostir fyrir rannsóknarblaðamennsku:
1. Leitarhraði: Niðurstöður birtast á 0,005 sekúndum í stað þess að frjósa vélina í Excel.
2. Sundurliðun á birgjum: Hægt að skoða stærstu birgja eftir ári, mánuði, hæstu viku eða stökum degi.
3. Lagalegt tól (Upplýsingalög nr. 140/2012): Kerfið útbýr lögboðna afritunarbeiðni á frumreikningum með einum smelli, sjálfkrafa flokkað eftir stofnun.

Vefurinn opnar bráðlega fyrir almenning en ég vildi bjóða þér forskoðun og aðgang fyrir rannsóknir.

Með vinsemd og virðingu,
[Nafn þitt / Ríkisgát]
[Sími / Netfang]`;

  const tweetIdea1 = `🏛️ Hvert fara skattpeningarnir okkar? 
Í janúar 2025 greiddi ríkið yfir 25 milljarða króna í reikninga til birgja. 
Stærsti einstaki birgirinn var Veritas heildsala með 1,24 milljarða kr.

Skoðaðu alla 18,1M reikninga á 0,005 sek: https://rikisgat.is #Rikisgat #Gagnsaei`;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedPitch(id);
      setTimeout(() => setCopiedPitch(null), 2000);
    });
  };

  const sqlCodeForBrandManager = `-- ============================================================
-- POSTGRESQL 18: VÖRUMERKI OG MARKAÐSSTJÓRN (rikisgat)
-- Keyrt í pgAdmin 4 (D:\\PostgreSQL\\pgAdmin 4) eða psql
-- ============================================================

CREATE TABLE IF NOT EXISTS stjorn_vorumerki (
    id SERIAL PRIMARY KEY,
    nafn VARCHAR(150) NOT NULL UNIQUE,
    len VARCHAR(150) NOT NULL,
    slogan VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'i_skodun',
    markhopur TEXT,
    kostir TEXT,
    gallar TEXT,
    isnic_status VARCHAR(20) NOT NULL DEFAULT 'athuga',
    einkunn SMALLINT DEFAULT 4,
    athugasemdir TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vorumerki_status ON stjorn_vorumerki(status);

-- DÆMI UM NODE.JS / EXPRESS ENDPOINT Í D:\\minn-vefthjonn\\minn-server\\server.ts:
/*
import { Pool } from 'pg';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.get('/api/brands', async (req, res) => {
  const result = await pool.query('SELECT * FROM stjorn_vorumerki ORDER BY status = $1 DESC, einkunn DESC', ['adal']);
  res.json(result.rows);
});
*/`;

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(sqlCodeForBrandManager).then(() => {
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2000);
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Brand Management Card */}
      <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-neutral-900 tracking-tight uppercase">
                🏷️ Vörumerkjastjórnun & Hugmyndasafn
              </h2>
              <span className="bg-neutral-900 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                PostgreSQL 18 & Node.js
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Bættu við nýjum vörumerkjahugmyndum, skráðu lén, kosti og galla, og stilltu hvaða vörumerki er aðalvalkostur verkefnisins.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowSqlModal(true)}
              className="px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-neutral-300"
              title="Skoða PostgreSQL 18 töfluskilgreiningu fyrir vörumerki"
            >
              <Database className="w-3.5 h-3.5 text-neutral-700" />
              <span>Postgres Tafla (SQL)</span>
            </button>

            <button
              onClick={() => setShowAddBrandModal(true)}
              className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" /> Bæta við vörumerki
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-neutral-100">
          <span className="text-xs font-bold text-neutral-500 uppercase mr-1">Sía eftir stöðu:</span>
          {['all', 'adal', 'i_skodun', 'fratekid', 'hugmynd'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer ${
                statusFilter === st ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {st === 'all' ? 'Öll vörumerki' : st === 'adal' ? 'Aðalvalkostur' : st === 'i_skodun' ? 'Í skoðun' : st === 'fratekid' ? 'Frátekið' : 'Hugmynd'}
            </button>
          ))}
        </div>

        {/* Brand Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {filteredBrands.map(b => {
            const isAdal = b.status === 'adal';
            return (
              <div
                key={b.id}
                className={`p-5 rounded-xl border transition flex flex-col justify-between ${
                  isAdal
                    ? 'bg-neutral-900 text-white border-neutral-900 shadow-md ring-2 ring-neutral-900'
                    : 'bg-white text-neutral-900 border-neutral-200 hover:border-neutral-300 shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-black tracking-tight">{b.nafn}</span>
                        {getStatusBadge(b.status)}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <a
                          href={`https://www.isnic.is/is/whois?query=${encodeURIComponent(b.len)}`}
                          target="_blank"
                          rel="noreferrer"
                          className={`text-xs font-mono font-bold flex items-center gap-1 underline ${
                            isAdal ? 'text-sky-300 hover:text-white' : 'text-blue-600 hover:text-blue-800'
                          }`}
                          title="Athuga lén hjá ISNIC"
                        >
                          <Globe className="w-3 h-3" /> {b.len}
                          <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                        </a>
                        {getIsnicBadge(b.isnicStatus)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {!isAdal && (
                        <button
                          onClick={() => handleSetPrimary(b.id)}
                          className="px-2 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded text-[10px] font-bold transition cursor-pointer"
                          title="Gera að aðalvörumerki"
                        >
                          Gera að aðal
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteBrand(b.id)}
                        className={`p-1.5 rounded transition cursor-pointer ${
                          isAdal ? 'text-neutral-500 hover:text-red-400' : 'text-neutral-400 hover:text-red-600'
                        }`}
                        title="Eyða vörumerki"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {b.slogan && (
                    <p className={`text-xs italic mt-2.5 font-medium ${isAdal ? 'text-neutral-300' : 'text-neutral-700'}`}>
                      „{b.slogan}“
                    </p>
                  )}

                  {b.markhopur && (
                    <div className="mt-2.5 text-[11px]">
                      <span className={`font-bold ${isAdal ? 'text-neutral-400' : 'text-neutral-500'}`}>Markhópur: </span>
                      <span className={isAdal ? 'text-neutral-200' : 'text-neutral-700'}>{b.markhopur}</span>
                    </div>
                  )}

                  {/* Pros & Cons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 pt-3 border-t border-neutral-100/20 text-xs">
                    {b.kostir && b.kostir.length > 0 && (
                      <div className="space-y-1">
                        <span className={`text-[10px] font-bold uppercase flex items-center gap-1 ${isAdal ? 'text-emerald-400' : 'text-emerald-700'}`}>
                          <ThumbsUp className="w-3 h-3" /> Kostir:
                        </span>
                        <ul className="space-y-0.5 text-[11px]">
                          {b.kostir.map((k, idx) => (
                            <li key={idx} className={isAdal ? 'text-neutral-300' : 'text-neutral-600'}>• {k}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {b.gallar && b.gallar.length > 0 && (
                      <div className="space-y-1">
                        <span className={`text-[10px] font-bold uppercase flex items-center gap-1 ${isAdal ? 'text-amber-400' : 'text-amber-700'}`}>
                          <ThumbsDown className="w-3 h-3" /> Gallar:
                        </span>
                        <ul className="space-y-0.5 text-[11px]">
                          {b.gallar.map((g, idx) => (
                            <li key={idx} className={isAdal ? 'text-neutral-300' : 'text-neutral-600'}>• {g}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {b.athugasemdir && (
                  <div className={`mt-3 pt-2.5 border-t text-[11px] font-sans ${isAdal ? 'border-neutral-800 text-neutral-400' : 'border-neutral-100 text-neutral-500'}`}>
                    💡 <em>{b.athugasemdir}</em>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Journalist Pitch Generator */}
      <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-neutral-900 tracking-tight flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-neutral-700" />
              Kynningarbréf til Rannsóknarblaðamanna
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Sniðmát til að senda á ritstjórnir (Heimildin, RÚV, Vísir, Morgunblaðið).
            </p>
          </div>

          <button
            onClick={() => copyToClipboard(journalistPitch, 'pitch')}
            className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer self-start md:self-auto"
          >
            {copiedPitch === 'pitch' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedPitch === 'pitch' ? 'Afritað!' : 'Afrita kynningarbréf'}
          </button>
        </div>

        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
          <pre className="text-xs text-neutral-700 whitespace-pre-wrap font-sans leading-relaxed">
            {journalistPitch}
          </pre>
        </div>
      </div>

      {/* Social Media Content Calendar */}
      <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-neutral-900 tracking-tight flex items-center gap-2">
          <Share2 className="w-4 h-4 text-neutral-700" />
          Samfélagsmiðlar & Sjálfvirkni (X / Twitter)
        </h3>
        <p className="text-xs text-neutral-500">
          Hugmyndir að sjálfvirkum færslum sem keyra má vikulega til að vekja athygli á tölum úr gagnagrunninum.
        </p>

        <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-neutral-700">
            <span>📊 Dæmi: Topp útgjöld mánaðarins</span>
            <button
              onClick={() => copyToClipboard(tweetIdea1, 't1')}
              className="text-neutral-500 hover:text-neutral-900 font-normal flex items-center gap-1 cursor-pointer"
            >
              {copiedPitch === 't1' ? '✓ Afritað' : '📋 Afrita'}
            </button>
          </div>
          <p className="text-xs text-neutral-800 bg-white p-3 rounded border border-neutral-200 font-mono">
            {tweetIdea1}
          </p>
        </div>
      </div>

      {/* Add Brand Modal */}
      {showAddBrandModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 border border-neutral-200 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
              <h3 className="text-base font-black text-neutral-900 uppercase tracking-tight">
                Bæta við nýju vörumerki
              </h3>
              <button onClick={() => setShowAddBrandModal(false)} className="text-neutral-400 hover:text-neutral-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddBrandSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Nafn vörumerkis:</label>
                  <input
                    type="text"
                    required
                    value={brandName}
                    onChange={e => setBrandName(e.target.value)}
                    placeholder="t.d. Ríkisgát, Skattgát..."
                    className="w-full p-2 border border-neutral-300 rounded outline-none focus:border-neutral-900 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Lén (.is eða annað):</label>
                  <input
                    type="text"
                    value={brandDomain}
                    onChange={e => setBrandDomain(e.target.value)}
                    placeholder="t.d. rikisgat.is"
                    className="w-full p-2 border border-neutral-300 rounded outline-none focus:border-neutral-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-neutral-700 block mb-1">Slagorð / Slogan:</label>
                <input
                  type="text"
                  value={brandSlogan}
                  onChange={e => setBrandSlogan(e.target.value)}
                  placeholder="t.d. Gegnsæi & Eftirlit með opinberum útgjöldum"
                  className="w-full p-2 border border-neutral-300 rounded outline-none focus:border-neutral-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Staða vörumerkis:</label>
                  <select
                    value={brandStatus}
                    onChange={e => setBrandStatus(e.target.value as BrandStatus)}
                    className="w-full p-2 border border-neutral-300 rounded font-semibold"
                  >
                    <option value="i_skodun">Í skoðun</option>
                    <option value="adal">Aðalvalkostur</option>
                    <option value="fratekid">Frátekið / Keypt</option>
                    <option value="hugmynd">Hugmynd</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">ISNIC staða:</label>
                  <select
                    value={brandIsnic}
                    onChange={e => setBrandIsnic(e.target.value as any)}
                    className="w-full p-2 border border-neutral-300 rounded font-semibold"
                  >
                    <option value="athuga">Kanna stöðu</option>
                    <option value="laust">Laust</option>
                    <option value="fratekid">Frátekið</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-neutral-700 block mb-1">Markhópur:</label>
                <input
                  type="text"
                  value={brandAudience}
                  onChange={e => setBrandAudience(e.target.value)}
                  placeholder="t.d. Borgarar, rannsóknarblaðamenn..."
                  className="w-full p-2 border border-neutral-300 rounded outline-none focus:border-neutral-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Kostir (ein lína per lið):</label>
                  <textarea
                    rows={3}
                    value={brandPros}
                    onChange={e => setBrandPros(e.target.value)}
                    placeholder="Stutt&#10;Gott orðspor&#10;Auðvelt að muna"
                    className="w-full p-2 border border-neutral-300 rounded outline-none focus:border-neutral-900"
                  />
                </div>
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Gallar (ein lína per lið):</label>
                  <textarea
                    rows={3}
                    value={brandCons}
                    onChange={e => setBrandCons(e.target.value)}
                    placeholder="Langt heiti&#10;Gæti valdið ruglingi"
                    className="w-full p-2 border border-neutral-300 rounded outline-none focus:border-neutral-900"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-neutral-700 block mb-1">Athugasemdir:</label>
                <input
                  type="text"
                  value={brandNotes}
                  onChange={e => setBrandNotes(e.target.value)}
                  placeholder="t.d. Kanna á ISNIC á morgun..."
                  className="w-full p-2 border border-neutral-300 rounded outline-none focus:border-neutral-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowAddBrandModal(false)}
                  className="px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded font-bold cursor-pointer"
                >
                  Hætta við
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded font-bold cursor-pointer"
                >
                  Vista vörumerki
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SQL & Backend Modal */}
      {showSqlModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 border border-neutral-200 shadow-xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
              <div>
                <h3 className="text-base font-black text-neutral-900 uppercase tracking-tight flex items-center gap-2">
                  <Database className="w-4 h-4 text-neutral-800" />
                  PostgreSQL 18 Tafla: stjorn_vorumerki
                </h3>
                <p className="text-xs text-neutral-500">
                  Keyrðu þennan SQL kóða í pgAdmin 4 á D:\PostgreSQL til að geyma öll vörumerki í gagnagrunninum.
                </p>
              </div>
              <button onClick={() => setShowSqlModal(false)} className="text-neutral-400 hover:text-neutral-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 bg-neutral-900 p-4 rounded-lg text-neutral-200 font-mono text-xs">
              <pre className="whitespace-pre-wrap">{sqlCodeForBrandManager}</pre>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-neutral-100">
              <span className="text-[11px] text-neutral-500">PostgreSQL 18 | D:\PostgreSQL & D:\minn-vefthjonn\minn-server</span>
              <div className="flex gap-2">
                <button
                  onClick={copySqlToClipboard}
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedSql ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  {copiedSql ? 'Afritað!' : 'Afrita SQL & Node kóða'}
                </button>
                <button
                  onClick={() => setShowSqlModal(false)}
                  className="px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded text-xs font-bold cursor-pointer"
                >
                  Loka
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
