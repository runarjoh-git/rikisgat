import React, { useState, useEffect } from 'react';
import { 
  Share2, Copy, Check, MessageSquare, Send, Sparkles, Building, 
  Newspaper, ExternalLink, Plus, Trash2, Edit3, Star, CheckCircle2, 
  Clock, AlertCircle, Database, Globe, HelpCircle, X, ThumbsUp, ThumbsDown,
  BarChart2, Vote, Filter, RefreshCw
} from 'lucide-react';
import { BrandItem, BrandStatus, PollItem } from '../types';
import { INITIAL_BRANDS, INITIAL_POLLS } from '../data/mockData';

const STORAGE_KEY_POLLS = 'rikisgat_marketing_polls_v1';
const STORAGE_KEY_POLL_VOTES = 'rikisgat_user_poll_votes_v1';

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

  // Polls state with localStorage persistence
  const [polls, setPolls] = useState<PollItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_POLLS);
      if (saved) {
        const parsed: PollItem[] = JSON.parse(saved);
        const existingIds = new Set(parsed.map(p => p.id));
        const missing = INITIAL_POLLS.filter(p => !existingIds.has(p.id));
        return missing.length > 0 ? [...parsed, ...missing] : parsed;
      }
    } catch (e) {
      console.error('Failed to load polls', e);
    }
    return INITIAL_POLLS;
  });

  // User votes tracking { [pollId]: optionId }
  const [userVotes, setUserVotes] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_POLL_VOTES);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {};
  });

  const [pollCategoryFilter, setPollCategoryFilter] = useState<string>('all');
  const [showAddPollModal, setShowAddPollModal] = useState(false);
  const [newPollTitle, setNewPollTitle] = useState('');
  const [newPollDesc, setNewPollDesc] = useState('');
  const [newPollCategory, setNewPollCategory] = useState<'vorumerki' | 'gogn' | 'samfelag' | 'almennt'>('vorumerki');
  const [newPollOptions, setNewPollOptions] = useState<string>('Valkostur 1\nValkostur 2\nValkostur 3');

  // Vista skoðanakannanir í localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_POLLS, JSON.stringify(polls));
    } catch (e) {
      console.error('Failed to save polls', e);
    }
  }, [polls]);

  // Vista atkvæði í localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_POLL_VOTES, JSON.stringify(userVotes));
    } catch (e) {
      console.error('Failed to save user votes', e);
    }
  }, [userVotes]);

  const handleVotePoll = (pollId: string, optionId: string) => {
    const prevVoted = userVotes[pollId];
    if (prevVoted === optionId) return;

    setUserVotes(prev => ({
      ...prev,
      [pollId]: optionId
    }));

    setPolls(prev =>
      prev.map(poll => {
        if (poll.id !== pollId) return poll;
        return {
          ...poll,
          options: poll.options.map(opt => {
            if (opt.id === optionId) {
              return { ...opt, votes: opt.votes + 1 };
            }
            if (prevVoted && opt.id === prevVoted) {
              return { ...opt, votes: Math.max(0, opt.votes - 1) };
            }
            return opt;
          })
        };
      })
    );
  };

  const handleAddPollSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPollTitle.trim()) return;

    const parsedOptions = newPollOptions
      .split('\n')
      .map(o => o.trim())
      .filter(Boolean)
      .map((text, idx) => ({
        id: `opt-${Date.now()}-${idx}`,
        text,
        votes: 0
      }));

    if (parsedOptions.length < 2) {
      alert('Vinsamlegast skráðu að minnsta kosti 2 valkosti (einn á hverja línu).');
      return;
    }

    const newPoll: PollItem = {
      id: `poll-${Date.now()}`,
      title: newPollTitle.trim(),
      description: newPollDesc.trim(),
      category: newPollCategory,
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
      options: parsedOptions
    };

    setPolls(prev => [newPoll, ...prev]);
    setNewPollTitle('');
    setNewPollDesc('');
    setNewPollOptions('Valkostur 1\nValkostur 2\nValkostur 3');
    setShowAddPollModal(false);
  };

  const handleDeletePoll = (pollId: string) => {
    if (confirm('Viltu eyða þessari skoðanakönnun?')) {
      setPolls(prev => prev.filter(p => p.id !== pollId));
      setUserVotes(prev => {
        const copy = { ...prev };
        delete copy[pollId];
        return copy;
      });
    }
  };

  const handleResetPolls = () => {
    if (confirm('Viltu endurstilla allar skoðanakannanir í sjálfgefin gögn?')) {
      setPolls(INITIAL_POLLS);
      setUserVotes({});
    }
  };

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

  // Tilbúnir Facebook / Andlitsbókar póstar sem vekja athygli á tölum úr grunninum
  const facebookPost1 = `🔍 HVERT FARA SKATTPENINGARNIR OKKAR Í RAUN OG VERU?

Íslenska ríkið greiðir milljarða á hverjum einasta mánuði í reikninga til einkafyrirtækja og birgja. En hingað til hefur verið nánast ógerlegt fyrir almenning að fá heildarmynd af þessu án þess að drukkna í þungum Excel-skjölum.

Við höfum tekið saman ALLA reikninga ríkisins frá 2017 til dagsins í dag — samtals yfir 18.100.000 færslur (18 milljónir!) í einn aðgengilegan gagnagrunn.

Hér eru örfáar staðreyndir sem við tókum saman úr grunninum:
📌 Samtals yfir 18,1 milljón reikningsfærslur
📌 172 ríkisstofnanir og ráðuneyti
📌 Yfir 19.300 skráðir birgjar og þjónustuaðilar

Til dæmis: Vissir þú að í einum mánuði (janúar 2025) greiddi ríkið yfir 25 milljarða króna til birgja? Stærstu greiðslurnar renna í heilbrigðisvörur, lyf og upplýsingatækni.

Gegnsæi er grunnurinn að réttlátu samfélagi. 

Skoðaðu þínar uppáhalds stofnanir og hvert peningarnir fara á: https://rikisgat.is
Deildu endilega áfram ef þér finnst að almenningur eigi rétt á að sjá hvernig opinberu fé er varið! 🇮🇸

#Ríkisgát #Gagnsæi #Ísland #Skattgreiðendur #OpinberÚtgjöld`;

  const facebookPost2 = `💡 STYRKIR OG FRAMLÖG RÍKISINS: HVER FÆR HVAÐ?

Mikið er rætt um opinbera styrki, rekstrarframlög og sérstakar greiðslur úr ríkissjóði. En hversu mikið er í raun greitt og til hverra?

Með því að greina 18 milljón reikninga ríkisins eftir tegund færslu er loksins hægt að draga saman:
✅ Alla styrki og verkefnastyrki til félagasamtaka og einkaaðila
✅ Samninga um ráðgjöf og sérfræðiþjónustu
✅ Hvaða ráðuneyti og stofnanir veita hæstu styrkina

Ríkisgát er óháð samfélagsverkefni sem hefur það að markmiði að opna bókhaldið og gera upplýsingarnar skiljanlegar öllum.

Hvaða málaflokk vilt þú að við skoðum næst? Skrifaðu athugasemd hér að neðan! 👇

👉 Prófaðu leitina sjálf/ur: https://rikisgat.is`;

  const facebookPost3 = `⚡ HRAÐARI EN STJÓRNSÝSLAN: 18 MILLJÓNIR REIKNINGA Á 0,005 SEKÚNDUM

Að finna út hvað ríkið greiddi tilteknum birgi árið 2018, 2021 eða í síðasta mánuði tók áður vikur af formlegum bréfaskriftum eða hrun í Excel.

Í nýja gagnagrunninum okkar tekur nákvæm síun á 18 milljón línum innan við 0,01 sekúndu. 

Við erum að vinna að því að birta regluleg yfirlit yfir stærstu útgjaldaflokka ríkisins. Fylgstu með síðunni okkar hér á Facebook til að missa ekki af næstu greiningu!

Hvaða stofnun finnst þér forvitnilegast að skoða?`;

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

      {/* 2. Skoðanakannanir & Samfélagskannanir (Polls) */}
      <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-neutral-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-neutral-900 tracking-tight uppercase flex items-center gap-2">
                <Vote className="w-5 h-5 text-neutral-900" />
                <span>Skoðanakannanir & Samfélagskannanir</span>
              </h2>
              <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                {polls.length} virkar
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Hér eru allar skoðanakannanir verkefnisins (vörumerkjanöfn, stækkun í B-hluta, forgangsröðun gagna og markaðssókn). Hægt er að greiða atkvæði, prófa svör og búa til nýjar kannanir.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowAddPollModal(true)}
              className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Stofna nýja könnun</span>
            </button>

            <button
              onClick={handleResetPolls}
              className="p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition border border-neutral-200 cursor-pointer"
              title="Endurstilla allar kannanir"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Filter by Category */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-neutral-500 uppercase mr-1">Flokkur:</span>
          {[
            { id: 'all', label: 'Allar kannanir' },
            { id: 'vorumerki', label: '🏷️ Vörumerki & Heiti' },
            { id: 'gogn', label: '📊 Gagnamál & B-hluti' },
            { id: 'samfelag', label: '👥 Samfélag' },
            { id: 'almennt', label: '⚙️ Almennt' }
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setPollCategoryFilter(cat.id)}
              className={`px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer ${
                pollCategoryFilter === cat.id
                  ? 'bg-neutral-900 text-white shadow-2xs'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Polls Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {polls
            .filter(p => pollCategoryFilter === 'all' || p.category === pollCategoryFilter)
            .map(poll => {
              const totalVotes = poll.options.reduce((sum, o) => sum + o.votes, 0);
              const userVotedId = userVotes[poll.id];

              return (
                <div
                  key={poll.id}
                  className="bg-neutral-50/80 border border-neutral-200 rounded-xl p-5 flex flex-col justify-between space-y-4 hover:border-neutral-300 transition"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-white px-2 py-0.5 rounded border border-neutral-200 text-neutral-700">
                          {poll.category === 'vorumerki' ? 'Vörumerki' : poll.category === 'gogn' ? 'Gögn & B-hluti' : poll.category === 'samfelag' ? 'Samfélag' : 'Almennt'}
                        </span>
                        <span className="text-[11px] text-neutral-400 font-mono">
                          {totalVotes.toLocaleString('is-IS')} svör
                        </span>
                      </div>

                      <button
                        onClick={() => handleDeletePoll(poll.id)}
                        className="text-neutral-400 hover:text-red-600 p-1 transition cursor-pointer"
                        title="Eyða könnun"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <h3 className="text-sm font-bold text-neutral-900 leading-snug">
                      {poll.title}
                    </h3>
                    {poll.description && (
                      <p className="text-xs text-neutral-600 leading-relaxed">
                        {poll.description}
                      </p>
                    )}
                  </div>

                  {/* Options */}
                  <div className="space-y-2 pt-1">
                    {poll.options.map(opt => {
                      const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                      const isVoted = userVotedId === opt.id;

                      return (
                        <div
                          key={opt.id}
                          onClick={() => handleVotePoll(poll.id, opt.id)}
                          className={`relative p-2.5 sm:p-3 rounded-lg border transition cursor-pointer overflow-hidden ${
                            isVoted
                              ? 'border-neutral-900 bg-neutral-900 text-white shadow-2xs'
                              : 'border-neutral-200 bg-white hover:border-neutral-400 text-neutral-900'
                          }`}
                        >
                          {/* Visual progress bar if voted or active */}
                          {userVotedId && !isVoted && (
                            <div
                              className="absolute inset-y-0 left-0 bg-neutral-100 transition-all duration-300"
                              style={{ width: `${pct}%` }}
                            />
                          )}

                          <div className="relative flex items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                                  isVoted
                                    ? 'border-white bg-white text-neutral-950'
                                    : 'border-neutral-400 bg-white'
                                }`}
                              >
                                {isVoted && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                              </div>
                              <span className={`font-medium ${isVoted ? 'text-white font-bold' : 'text-neutral-800'}`}>
                                {opt.text}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0 font-mono text-[11px]">
                              <span className={`font-bold ${isVoted ? 'text-emerald-300' : 'text-neutral-900'}`}>
                                {pct}%
                              </span>
                              <span className={`${isVoted ? 'text-neutral-300' : 'text-neutral-400'}`}>
                                ({opt.votes})
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
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

      {/* Facebook / Andlitsbók Content & Viral Strategy */}
      <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-neutral-900 tracking-tight flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                Andlitsbókin (Facebook) — Tilbúnar færslur & Athyglisvekjandi Tölur
              </h3>
              <span className="bg-blue-100 text-blue-900 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                Stjórnborð / Samfélagsmiðlar
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Notaðu rauntölur úr 18 milljón reikninga gagnagrunninum til að deila á Facebook, í umræðuhópa og á eigin síðu til að skapa umtal og umferð.
            </p>
          </div>

          <div className="text-xs font-mono bg-blue-50 text-blue-800 px-3 py-1.5 rounded-lg border border-blue-200">
            Markmið: <strong>Veita innsýn & draga að notendur</strong>
          </div>
        </div>

        {/* Facebook Strategy Box */}
        <div className="p-3.5 bg-neutral-50 rounded-lg border border-neutral-200 text-xs text-neutral-600 space-y-1">
          <div className="font-bold text-neutral-900 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Stefna fyrir Facebook-færslur:
          </div>
          <p className="leading-relaxed">
            1. Byrjaðu á stórri, áhugaverðri heildartölu (t.d. 18,1M reikningar eða stærstu birgjar).<br />
            2. Nefndu málaflokka sem fólki er annt um (styrkir, ráðgjöf, heilbrigðiskerfi, samgöngur).<br />
            3. Tengdu alltaf hlekk á <strong>rikisgat.is</strong> svo fólk fari sjálft að leita og deila áfram.
          </p>
        </div>

        {/* Post 1 */}
        <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-neutral-800 flex items-center gap-1.5">
              📘 Færsla 1: Kynning á 18 milljón reikningum (Almenn athygli)
            </span>
            <button
              onClick={() => copyToClipboard(facebookPost1, 'fb1')}
              className="px-3 py-1 bg-neutral-900 hover:bg-neutral-800 text-white rounded text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              {copiedPitch === 'fb1' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedPitch === 'fb1' ? 'Afritað!' : 'Afrita Facebook-færslu'}
            </button>
          </div>
          <div className="bg-white p-3.5 rounded-lg border border-neutral-200 text-xs text-neutral-800 whitespace-pre-wrap font-sans leading-relaxed">
            {facebookPost1}
          </div>
        </div>

        {/* Post 2 */}
        <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-neutral-800 flex items-center gap-1.5">
              💡 Færsla 2: Styrkir og framlög ríkisins (Kveikir í umræðu)
            </span>
            <button
              onClick={() => copyToClipboard(facebookPost2, 'fb2')}
              className="px-3 py-1 bg-neutral-900 hover:bg-neutral-800 text-white rounded text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              {copiedPitch === 'fb2' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedPitch === 'fb2' ? 'Afritað!' : 'Afrita Facebook-færslu'}
            </button>
          </div>
          <div className="bg-white p-3.5 rounded-lg border border-neutral-200 text-xs text-neutral-800 whitespace-pre-wrap font-sans leading-relaxed">
            {facebookPost2}
          </div>
        </div>

        {/* Post 3 */}
        <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-neutral-800 flex items-center gap-1.5">
              ⚡ Færsla 3: Tæknilegt gegnsæi & Leifturhraði
            </span>
            <button
              onClick={() => copyToClipboard(facebookPost3, 'fb3')}
              className="px-3 py-1 bg-neutral-900 hover:bg-neutral-800 text-white rounded text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              {copiedPitch === 'fb3' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedPitch === 'fb3' ? 'Afritað!' : 'Afrita Facebook-færslu'}
            </button>
          </div>
          <div className="bg-white p-3.5 rounded-lg border border-neutral-200 text-xs text-neutral-800 whitespace-pre-wrap font-sans leading-relaxed">
            {facebookPost3}
          </div>
        </div>
      </div>

      {/* Social Media Content Calendar (X / Twitter) */}
      <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-neutral-900 tracking-tight flex items-center gap-2">
          <Share2 className="w-4 h-4 text-neutral-700" />
          Samfélagsmiðlar & Örinnlegg (X / Twitter)
        </h3>
        <p className="text-xs text-neutral-500">
          Hugmyndir að sjálfvirkum stuttum færslum sem keyra má vikulega til að vekja athygli á tölum úr gagnagrunninum.
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

      {/* Add Poll Modal */}
      {showAddPollModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 border border-neutral-200 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
              <h3 className="text-base font-black text-neutral-900 uppercase tracking-tight flex items-center gap-2">
                <Vote className="w-5 h-5 text-neutral-900" />
                Stofna nýja skoðanakönnun
              </h3>
              <button onClick={() => setShowAddPollModal(false)} className="text-neutral-400 hover:text-neutral-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPollSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-neutral-700 block mb-1">Spurning / Titill könnunar:</label>
                <input
                  type="text"
                  required
                  value={newPollTitle}
                  onChange={e => setNewPollTitle(e.target.value)}
                  placeholder="t.d. Hvert á að vera næsta stóra skrefið í Ríkisgát?"
                  className="w-full p-2.5 border border-neutral-300 rounded outline-none focus:border-neutral-900 font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-neutral-700 block mb-1">Flokkur:</label>
                <select
                  value={newPollCategory}
                  onChange={e => setNewPollCategory(e.target.value as any)}
                  className="w-full p-2 border border-neutral-300 rounded font-semibold bg-white"
                >
                  <option value="vorumerki">🏷️ Vörumerki & Heiti</option>
                  <option value="gogn">📊 Gagnamál & B-hluti</option>
                  <option value="samfelag">👥 Samfélag</option>
                  <option value="almennt">⚙️ Almennt</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-neutral-700 block mb-1">Lýsing / Samhengi (valkvætt):</label>
                <textarea
                  rows={2}
                  value={newPollDesc}
                  onChange={e => setNewPollDesc(e.target.value)}
                  placeholder="Útskýrðu í stuttu máli hvers vegna þetta er spurt og hvaða áhrif niðurstöðurnar hafa..."
                  className="w-full p-2 border border-neutral-300 rounded outline-none focus:border-neutral-900"
                />
              </div>

              <div>
                <label className="font-bold text-neutral-700 block mb-1">Valkostir (einn valkostur á hverja línu):</label>
                <textarea
                  rows={4}
                  required
                  value={newPollOptions}
                  onChange={e => setNewPollOptions(e.target.value)}
                  placeholder="Valkostur 1&#10;Valkostur 2&#10;Valkostur 3"
                  className="w-full p-2 border border-neutral-300 rounded outline-none focus:border-neutral-900 font-mono text-xs"
                />
                <span className="text-[10px] text-neutral-500 mt-1 block">
                  Skráðu að minnsta kosti 2 valkosti.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowAddPollModal(false)}
                  className="px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded font-bold cursor-pointer"
                >
                  Hætta við
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded font-bold cursor-pointer"
                >
                  Búa til könnun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
