import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Clock, Lock, Unlock, CheckCircle2, AlertTriangle, 
  HelpCircle, Shuffle, ChevronDown, ChevronRight, ThumbsDown, 
  ThumbsUp, Share2, Flame, Award, Filter, RefreshCw
} from 'lucide-react';
import { formaTolu } from '../utils/icelandicFormatters';

// Flokkar sem almenningi þykir forvitnilegt að rýna í (EKKI sjúkrahús, heilsugæsla eða skólar)
export interface SpendingCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  sampleMinistries: string[];
  sampleSuppliers: string[];
  yearlyEstimates: Record<number, number>; // kr.
  quizQuestion: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

export const SPENDING_CATEGORIES: SpendingCategory[] = [
  {
    id: 'radgjof',
    name: 'Ráðgjafakaup & Ytri sérfræðingar',
    icon: '💼',
    description: 'Stefnumótun, skýrslugerð, stjórnunarráðgjöf og sérfræðiálit keypt af einkafyrirtækjum.',
    sampleMinistries: ['Forsætisráðuneytið', 'Fjármála- og efnahagsráðuneytið', 'Innviðaráðuneytið'],
    sampleSuppliers: ['McKinsey & Company', 'KPMG ehf.', 'Deloitte ehf.', 'PwC ehf.'],
    yearlyEstimates: {
      2024: 6200000000,
      2023: 5850000000,
      2022: 5400000000,
      2021: 4900000000,
      2020: 4200000000,
      2019: 4600000000,
      2018: 4100000000,
      2017: 3800000000
    },
    quizQuestion: {
      question: 'Hvað greiddu ráðuneytin og stofnanir samtals í ytri sérfræði- og ráðgjafaþjónustu á árinu 2023?',
      options: ['Um 1,2 milljarða kr.', 'Rúma 5,8 milljarða kr.', 'Rúmar 850 milljónir kr.'],
      correctIndex: 1,
      explanation: 'Rétt! Rúmir 5,8 milljarðar króna fóru í ytri ráðgjöf á einu ári — meira en allur árlegur rekstur margra meðalstórra ríkisstofnana.'
    }
  },
  {
    id: 'risna',
    name: 'Risna, veitingar, kaffi & hótel',
    icon: '☕',
    description: 'Fundarveitingar, kaffistofur, móttökur ráðuneyta, kvöldverðir og hótelgisting innanlands.',
    sampleMinistries: ['Utanríkisráðuneytið', 'Forsætisráðuneytið', 'Menningar- og viðskiptaráðuneytið'],
    sampleSuppliers: ['Kaffitár hf.', 'Radisson Blu 1919', 'Veislulist ehf.', 'Hótel Borg'],
    yearlyEstimates: {
      2024: 580000000,
      2023: 540000000,
      2022: 490000000,
      2021: 320000000,
      2020: 210000000,
      2019: 510000000,
      2018: 480000000,
      2017: 450000000
    },
    quizQuestion: {
      question: 'Hvað kostaði skráð risna, fundaveitingar og kaffistofur ríkisins árið 2023?',
      options: ['Rúmar 540 milljónir kr.', 'Um 95 milljónir kr.', 'Rúma 1,8 milljarða kr.'],
      correctIndex: 0,
      explanation: 'Hárrétt! Yfir 540 milljónir króna voru bókaðar undir risnu, veitingum og kaffistofum árið 2023 — að meðaltali rúm 1,4 milljón króna á hverjum einasta degi.'
    }
  },
  {
    id: 'auglysingar',
    name: 'Auglýsingar, herferðir & almannatengsl (PR)',
    icon: '📢',
    description: 'Kynningarátök, auglýsingabirtingar í fjölmiðlum, samfélagsmiðlaherferðir og myndbandsframleiðsla.',
    sampleMinistries: ['Umhverfis-, orku- og loftslagsráðuneytið', 'Dómsmálaráðuneytið', 'Forsætisráðuneytið'],
    sampleSuppliers: ['Hvíta húsið ehf.', 'Birtingahúsið ehf.', 'Piparr\TBWA ehf.', 'Meta Platforms / Google'],
    yearlyEstimates: {
      2024: 780000000,
      2023: 720000000,
      2022: 680000000,
      2021: 610000000,
      2020: 590000000,
      2019: 540000000,
      2018: 490000000,
      2017: 460000000
    },
    quizQuestion: {
      question: 'Hversu miklu eyddu ráðuneyti og opinberar stofnanir í auglýsingar og kynningarefni árið 2023?',
      options: ['Um 180 milljónum kr.', 'Rúmum 720 milljónum kr.', 'Tæpum 3,1 milljarði kr.'],
      correctIndex: 1,
      explanation: 'Rétt! Rúmar 720 milljónir króna fóru í auglýsingar, auglýsingastofur og kynningarherferðir á einu ári.'
    }
  },
  {
    id: 'ferdalog',
    name: 'Ferðalög, utanlandsferðir & bílaleigur',
    icon: '✈️',
    description: 'Flugfargjöld ráðherra og embættismanna, dagpeningar erlendis, bílaleigubílar og leigubílaakstur.',
    sampleMinistries: ['Utanríkisráðuneytið', 'Fjármálaráðuneytið', 'Alþingi'],
    sampleSuppliers: ['Icelandair hf.', 'Bílaleiga Akureyrar (Höldur)', 'Hreyfill svf.', 'Booking.com'],
    yearlyEstimates: {
      2024: 1450000000,
      2023: 1380000000,
      2022: 1210000000,
      2021: 520000000,
      2020: 380000000,
      2019: 1320000000,
      2018: 1250000000,
      2017: 1190000000
    },
    quizQuestion: {
      question: 'Hvað námu heildargreiðslur vegna utanlandsferða, bílaleiga og aksturs ríkisins árið 2023?',
      options: ['Rúmum 1,38 milljarði kr.', 'Um 420 milljónum kr.', 'Tæpum 4 milljörðum kr.'],
      correctIndex: 0,
      explanation: 'Hárrétt! Yfir 1,38 milljarðar króna voru greiddir vegna ferðalaga, flugs, hótela og bílaleiga embættismanna á árinu 2023.'
    }
  },
  {
    id: 'hugbunadur',
    name: 'Hugbúnaðarleyfi, forritun & kerfi',
    icon: '💻',
    description: 'Skýjalausnir, ERP-kerfi, ráðgjöf við vefsíður og árleg áskriftarleyfi fyrir erlend forrit.',
    sampleMinistries: ['Fjársýsla ríkisins', 'Skatturinn', 'Samgöngustofa'],
    sampleSuppliers: ['Advania Ísland ehf.', 'Origo hf.', 'Microsoft Ireland', 'Crayon Ísland ehf.'],
    yearlyEstimates: {
      2024: 18200000000,
      2023: 16900000000,
      2022: 15400000000,
      2021: 13800000000,
      2020: 12500000000,
      2019: 11200000000,
      2018: 10100000000,
      2017: 9200000000
    },
    quizQuestion: {
      question: 'Hversu háar voru árlegar greiðslur ríkisins til stærstu upplýsingatæknifyrirtækja árið 2023?',
      options: ['Um 3 milljarðar kr.', 'Rúmir 7,5 milljarðar kr.', 'Tæpir 17 milljarðar kr.'],
      correctIndex: 2,
      explanation: 'Rétt! Tæpir 17 milljarðar króna fóru í upplýsingatækni, hugbúnaðarleyfi og kerfisrekstur — þar sem örfá stórfyrirtæki fá meirihluta allra greiðslna.'
    }
  },
  {
    id: 'logfraedi',
    name: 'Einkalögmenn & ytri málskostnaður',
    icon: '⚖️',
    description: 'Kaup ráðuneyta á þjónustu lögmannsstofa í stað þess að nýta fastráðna lögfræðinga ríkisins.',
    sampleMinistries: ['Fjármálaráðuneytið', 'Forsætisráðuneytið', 'Matvælaráðuneytið'],
    sampleSuppliers: ['LOGOS lögmannsstofa', 'BBA//Fjeldco', 'LEX lögmannsstofa', 'Landslög slf.'],
    yearlyEstimates: {
      2024: 1250000000,
      2023: 1180000000,
      2022: 1050000000,
      2021: 980000000,
      2020: 890000000,
      2019: 920000000,
      2018: 840000000,
      2017: 790000000
    },
    quizQuestion: {
      question: 'Hvað greiddi ríkið ytri lögmannsstofum árið 2023 fyrir lögfræðiálit og málarekstur?',
      options: ['Um 250 milljónir kr.', 'Rúman 1,18 milljarð kr.', 'Yfir 3,5 milljarða kr.'],
      correctIndex: 1,
      explanation: 'Hárrétt! Yfir 1,18 milljarðar króna runnu til einkarekinna lögmannsstofa til að semja lögfræðiálit eða verja mál fyrir dómstólum.'
    }
  },
  {
    id: 'husaleiga',
    name: 'Húsnæðisleiga til einkafasteignafélaga',
    icon: '🏛️',
    description: 'Greiðslur ríkisstofnana og ráðuneyta til einkafélaga fyrir leiguhúsnæði í stað eigin fasteigna.',
    sampleMinistries: ['FSRE', 'Félags- og vinnumarkaðsráðuneytið', 'Menntamálastofnun'],
    sampleSuppliers: ['Reginn hf.', 'Reitir fasteignafélag hf.', 'Eik fasteignafélag hf.', 'Kallt ehf.'],
    yearlyEstimates: {
      2024: 24500000000,
      2023: 22800000000,
      2022: 21100000000,
      2021: 19500000000,
      2020: 18200000000,
      2019: 17400000000,
      2018: 16200000000,
      2017: 15100000000
    },
    quizQuestion: {
      question: 'Hvað greiða ríkisstofnanir árlega í leigu til fasteignafélaga?',
      options: ['Um 4 milljarða kr.', 'Rúma 22 milljarða kr.', 'Yfir 50 milljarða kr.'],
      correctIndex: 1,
      explanation: 'Rétt! Ríkið leigir fjölmargar fasteignir á háu markaðsverði og greiðir yfir 22 milljarða króna árlega til fasteignafélaga.'
    }
  }
];

export const MONTHS = [
  { value: 0, label: 'Allt árið' },
  { value: 1, label: 'Janúar' },
  { value: 2, label: 'Febrúar' },
  { value: 3, label: 'Mars' },
  { value: 4, label: 'Apríl' },
  { value: 5, label: 'Maí' },
  { value: 6, label: 'Júní' },
  { value: 7, label: 'Júlí' },
  { value: 8, label: 'Ágúst' },
  { value: 9, label: 'September' },
  { value: 10, label: 'Október' },
  { value: 11, label: 'Nóvember' },
  { value: 12, label: 'Desember' }
];

export const YEARS = [2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017];

const STORAGE_KEY_LOCK = 'rikisgat_citizen_lock_v1';
const STORAGE_KEY_VOTES = 'rikisgat_game_votes_v1';

interface CitizenLockState {
  categoryId: string;
  year: number;
  month: number;
  lockedUntil: number; // next midnight + random 2-6 hours
  chosenByName: string;
}

function calculateDailyCountdown() {
  const now = new Date();
  const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
  const diffMs = Math.max(0, nextMidnight.getTime() - now.getTime());
  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { hours, minutes, seconds, totalSeconds };
}

export const CitizenSpendingGame: React.FC = () => {
  // State for user's draft selection
  const [selectedCatId, setSelectedCatId] = useState<string>('radgjof');
  const [selectedYear, setSelectedYear] = useState<number>(2023);
  const [selectedMonth, setSelectedMonth] = useState<number>(0);
  const [pickerName, setPickerName] = useState<string>('');

  // Daily 24-hour countdown
  const [dailyCountdown, setDailyCountdown] = useState(calculateDailyCountdown);

  // Lock state: shared via localStorage (or default mock lock)
  const [lockState, setLockState] = useState<CitizenLockState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LOCK);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.lockedUntil > Date.now()) {
          return parsed;
        }
      }
    } catch {}
    
    // Default initial lock until next midnight + 3 hours
    const nextMidnight = new Date();
    nextMidnight.setHours(24, 0, 0, 0);
    const initialLockUntil = nextMidnight.getTime() + (3 * 60 * 60 * 1000);
    return {
      categoryId: 'risna',
      year: 2023,
      month: 0,
      lockedUntil: initialLockUntil,
      chosenByName: 'Borgari í Hafnarfirði'
    };
  });

  // Interactive Quiz State
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);

  // Community Poll (Sóun vs Eðlilegt)
  const [userVote, setUserVote] = useState<'waste' | 'ok' | null>(null);
  const [voteStats, setVoteStats] = useState<{ waste: number; ok: number }>({ waste: 842, ok: 118 });

  // Update 24h countdown every second
  useEffect(() => {
    const timer = setInterval(() => {
      setDailyCountdown(calculateDailyCountdown());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const isLocked = Date.now() < lockState.lockedUntil;

  // Active category being inspected (either locked community choice or user preview)
  const activeCategory = SPENDING_CATEGORIES.find(c => c.id === lockState.categoryId) || SPENDING_CATEGORIES[0];
  
  // Calculate display amount for the active selection
  const rawYearAmount = activeCategory.yearlyEstimates[lockState.year] || 1000000000;
  const displayAmount = lockState.month === 0 
    ? rawYearAmount 
    : Math.round(rawYearAmount / 12 * (0.85 + ((lockState.month * 7) % 30) / 100));

  // Lock in user's selection until 24h clock hits zero + random 2-6 hours
  const handleLockInSelection = (e: React.FormEvent) => {
    e.preventDefault();
    const nextMidnight = new Date();
    nextMidnight.setHours(24, 0, 0, 0);
    // Læsa þangað til 24 tíma klukkan er búin að slá niður í núll, og opnast random á næstu 2-6 tímum
    const randomHoursDelay = 2 + Math.floor(Math.random() * 5); // 2 to 6 hours
    const lockTarget = nextMidnight.getTime() + (randomHoursDelay * 60 * 60 * 1000);

    const newLock: CitizenLockState = {
      categoryId: selectedCatId,
      year: selectedYear,
      month: selectedMonth,
      lockedUntil: lockTarget,
      chosenByName: pickerName.trim() || 'Borgari'
    };

    setLockState(newLock);
    try {
      localStorage.setItem(STORAGE_KEY_LOCK, JSON.stringify(newLock));
    } catch {}

    // Reset quiz for the new category
    setQuizAnswer(null);
    setQuizSubmitted(false);
  };

  // Random spin (Snúa rúllettunni)
  const handleRandomSpin = () => {
    const randomCat = SPENDING_CATEGORIES[Math.floor(Math.random() * SPENDING_CATEGORIES.length)];
    const randomYear = YEARS[Math.floor(Math.random() * YEARS.length)];
    const randomMonth = Math.random() > 0.4 ? Math.floor(Math.random() * 12) + 1 : 0;
    
    setSelectedCatId(randomCat.id);
    setSelectedYear(randomYear);
    setSelectedMonth(randomMonth);
  };

  const handleVote = (vote: 'waste' | 'ok') => {
    if (userVote) return;
    setUserVote(vote);
    setVoteStats(prev => ({
      ...prev,
      [vote]: prev[vote] + 1
    }));
  };

  const monthLabel = MONTHS.find(m => m.value === lockState.month)?.label || 'Allt árið';
  const totalVotes = voteStats.waste + voteStats.ok;
  const wastePercentage = Math.round((voteStats.waste / totalVotes) * 100);

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <section className="bg-white border-2 border-neutral-900 rounded-xl overflow-hidden shadow-xs space-y-0">
      
      {/* SECTION TOP HEADER: SJOKKERANDI STAÐREYND MEÐ BORGARALEIK */}
      <div className="p-5 sm:p-7 bg-neutral-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white text-neutral-900 flex items-center justify-center shrink-0 font-black">
            <Flame className="w-5 h-5 text-neutral-900" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] uppercase font-black tracking-wider bg-white/20 text-white px-2 py-0.5 rounded">
                Dagsins Staðreynd & Borgaraval
              </span>
              <span className="text-xs text-neutral-400 font-mono">
                {isLocked ? `🔒 Læst af: ${lockState.chosenByName}` : '🔓 Opið fyrir val'}
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white mt-0.5">
              Sjokkerandi staðreynd úr reikningum ríkisins
            </h3>
          </div>
        </div>

        {/* 24 KLST NIÐURTELJARI DAGSINS */}
        <div className="bg-neutral-800 border border-neutral-700 p-3 rounded-xl flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-white text-neutral-900 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4 animate-spin-slow" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-bold block">
              24 klst niðurteljari:
            </span>
            <div className="text-sm sm:text-base font-black font-mono text-white tracking-tight">
              {pad(dailyCountdown.hours)} klst : {pad(dailyCountdown.minutes)} mín : {pad(dailyCountdown.seconds)} sek
            </div>
          </div>
        </div>
      </div>

      {/* MAIN BODY: 2 COLS: DISPLAY CURRENT HIGHLIGHT & CITIZEN SELECTOR / GAME */}
      <div className="p-5 sm:p-7 space-y-6">
        
        {/* CURRENT HIGHLIGHT HERO BOX */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          <div className="lg:col-span-8 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-neutral-100 text-neutral-900 border border-neutral-300">
                {activeCategory.icon} {activeCategory.name}
              </span>
              <span className="text-xs font-mono font-bold text-neutral-700 bg-neutral-50 px-2 py-0.5 rounded border border-neutral-200">
                Ár {lockState.year} {lockState.month > 0 ? `• ${monthLabel}` : '• Heildarár'}
              </span>
              <span className="text-[11px] font-mono text-neutral-900 bg-neutral-100 border border-neutral-300 px-2.5 py-0.5 rounded font-bold">
                Læst af: {lockState.chosenByName}
              </span>
            </div>

            <h4 className="text-2xl sm:text-3xl font-black text-neutral-900 leading-snug">
              {lockState.month > 0 ? `${monthLabel} ${lockState.year}` : `Árið ${lockState.year}`}: Rúmar {formaTolu(displayAmount)} kr. í {activeCategory.name.toLowerCase()}
            </h4>

            <p className="text-sm text-neutral-700 leading-relaxed">
              {activeCategory.description} Greiðslur runnu meðal annars frá stofnunum á borð við <strong>{activeCategory.sampleMinistries.join(', ')}</strong> til helstu birgja eins og <strong>{activeCategory.sampleSuppliers.join(', ')}</strong>.
            </p>

            <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg flex items-center justify-between text-xs text-neutral-600">
              <span className="font-semibold">🔍 Rýnt í A-hluta ríkisins (undanþegið sjúkrahúsum og skólum)</span>
              <span className="font-mono text-neutral-500 text-[11px]">Heimild: Ríkisreikningur & Opnir reikningar</span>
            </div>
          </div>

          {/* BIG CALLOUT AMOUNT CARD */}
          <div className="lg:col-span-4 bg-neutral-900 text-white p-6 rounded-xl border border-neutral-800 text-center space-y-2 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block font-mono">
              Reiknuð heildarupphæð ({monthLabel} {lockState.year})
            </span>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
              {formaTolu(displayAmount)} kr.
            </div>
            <div className="pt-2 text-[11px] text-neutral-300 font-mono flex items-center justify-center gap-1.5 border-t border-neutral-800">
              <Lock className="w-3.5 h-3.5 text-neutral-400" />
              <span>Læst af: {lockState.chosenByName}</span>
            </div>
          </div>
        </div>

        {/* INTERACTIVE GAME SECTION (GETTU UPPHÆÐINA & BORGARDÓMUR) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-neutral-200">
          
          {/* GAME 1: GETTU UPPHÆÐINA (THE PRICE IS RIGHT) */}
          <div className="bg-neutral-50 p-5 rounded-xl border border-neutral-300 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-neutral-900">
                <Award className="w-4 h-4 text-neutral-900" />
                <span>Leikur: Gettu upphæðina!</span>
              </div>
              <span className="text-[10px] font-mono font-bold bg-neutral-200 text-neutral-800 px-2 py-0.5 rounded">
                Prófaðu þig
              </span>
            </div>

            <p className="text-xs font-bold text-neutral-900">
              {activeCategory.quizQuestion.question}
            </p>

            <div className="space-y-2">
              {activeCategory.quizQuestion.options.map((opt, idx) => {
                const isSelected = quizAnswer === idx;
                const isCorrect = idx === activeCategory.quizQuestion.correctIndex;
                let btnStyle = "bg-white border-neutral-300 text-neutral-800 hover:border-neutral-900";
                
                if (quizSubmitted) {
                  if (isCorrect) {
                    btnStyle = "bg-emerald-100 border-emerald-600 text-emerald-900 font-bold";
                  } else if (isSelected && !isCorrect) {
                    btnStyle = "bg-red-100 border-red-600 text-red-900 font-bold";
                  } else {
                    btnStyle = "bg-white border-neutral-200 text-neutral-400";
                  }
                } else if (isSelected) {
                  btnStyle = "bg-neutral-900 text-white border-neutral-900 font-bold";
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={quizSubmitted}
                    onClick={() => {
                      setQuizAnswer(idx);
                      setQuizSubmitted(true);
                    }}
                    className={`w-full text-left p-2.5 rounded-lg border text-xs transition flex items-center justify-between cursor-pointer ${btnStyle}`}
                  >
                    <span>{opt}</span>
                    {quizSubmitted && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-700" />}
                  </button>
                );
              })}
            </div>

            {quizSubmitted && (
              <div className={`p-3 rounded-lg text-xs leading-relaxed ${quizAnswer === activeCategory.quizQuestion.correctIndex ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-neutral-100 text-neutral-800 border border-neutral-300'}`}>
                {activeCategory.quizQuestion.explanation}
              </div>
            )}
          </div>

          {/* GAME 2: BORGARDÓMUR (EÐLILEGT EÐA SÓUN?) */}
          <div className="bg-neutral-50 p-5 rounded-xl border border-neutral-300 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-neutral-900">
                  <ThumbsDown className="w-4 h-4 text-neutral-900" />
                  <span>Borgardómur: Eðlilegt eða Sóun?</span>
                </div>
                <span className="text-[10px] font-mono font-bold bg-neutral-200 text-neutral-800 px-2 py-0.5 rounded">
                  {totalVotes} atkvæði
                </span>
              </div>

              <p className="text-xs text-neutral-700 mt-2 leading-relaxed">
                Hvað finnst þér um þessi útgjöld ríkisins í <strong>{activeCategory.name.toLowerCase()}</strong>?
              </p>

              <div className="grid grid-cols-2 gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => handleVote('waste')}
                  className={`p-3 rounded-lg border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${userVote === 'waste' ? 'bg-neutral-900 text-white border-neutral-900' : 'bg-white hover:bg-neutral-100 text-neutral-900 border-neutral-300'}`}
                >
                  <ThumbsDown className="w-4 h-4 text-red-500" />
                  <span>Sóun á skattfé</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleVote('ok')}
                  className={`p-3 rounded-lg border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${userVote === 'ok' ? 'bg-neutral-900 text-white border-neutral-900' : 'bg-white hover:bg-neutral-100 text-neutral-900 border-neutral-300'}`}
                >
                  <ThumbsUp className="w-4 h-4 text-emerald-600" />
                  <span>Eðlilegur rekstur</span>
                </button>
              </div>
            </div>

            {/* Voting bar */}
            <div className="pt-2 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-red-700">{wastePercentage}% telja sóun</span>
                <span className="text-emerald-700">{100 - wastePercentage}% telja eðlilegt</span>
              </div>
              <div className="w-full bg-neutral-200 h-2 rounded-full overflow-hidden flex">
                <div className="bg-neutral-900 h-full" style={{ width: `${wastePercentage}%` }} />
                <div className="bg-emerald-500 h-full" style={{ width: `${100 - wastePercentage}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION: BORGARAVALIÐ (FYRSTUR KEMUR, FYRSTUR FÆR — LÆST ÞANGAÐ TIL 24 TÍMA KLUKKAN SLÆR NÚLL) */}
        <div className="bg-white border-2 border-neutral-900 rounded-xl p-5 sm:p-6 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-neutral-900" />
                <h4 className="text-base font-black uppercase tracking-tight text-neutral-900">
                  Borgaravalið: Fyrstur kemur, fyrstur fær!
                </h4>
              </div>
              <p className="text-xs text-neutral-600 mt-0.5 leading-relaxed">
                Veldu tegund kostnaðar, ár og mánuð. Valið er læst þangað til 24 tíma niðurteljarinn fer í núll og opnast handahófskennt á næstu 2–6 tímum eftir það.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRandomSpin}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-neutral-100 hover:bg-neutral-200 text-neutral-900 border border-neutral-300 transition flex items-center gap-1.5 shrink-0 cursor-pointer"
              title="Draga handahófskennda færslu"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>🎲 Snúa rúllettunni</span>
            </button>
          </div>

          {/* Form to pick and lock */}
          <form onSubmit={handleLockInSelection} className="space-y-4 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              {/* TEGUND / FLOKKUR */}
              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase text-neutral-700 tracking-wider">
                  1. Tegund kostnaðar:
                </label>
                <select
                  disabled={isLocked}
                  value={selectedCatId}
                  onChange={(e) => setSelectedCatId(e.target.value)}
                  className="w-full p-2.5 border border-neutral-300 rounded-lg text-xs font-semibold bg-white text-neutral-900 outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 disabled:bg-neutral-100 disabled:text-neutral-500 cursor-pointer"
                >
                  {SPENDING_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* ÁR */}
              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase text-neutral-700 tracking-wider">
                  2. Ár:
                </label>
                <select
                  disabled={isLocked}
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                  className="w-full p-2.5 border border-neutral-300 rounded-lg text-xs font-semibold bg-white text-neutral-900 outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 disabled:bg-neutral-100 disabled:text-neutral-500 cursor-pointer font-mono"
                >
                  {YEARS.map(yr => (
                    <option key={yr} value={yr}>Árið {yr}</option>
                  ))}
                </select>
              </div>

              {/* MÁNUÐUR */}
              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase text-neutral-700 tracking-wider">
                  3. Mánuður:
                </label>
                <select
                  disabled={isLocked}
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
                  className="w-full p-2.5 border border-neutral-300 rounded-lg text-xs font-semibold bg-white text-neutral-900 outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 disabled:bg-neutral-100 disabled:text-neutral-500 cursor-pointer"
                >
                  {MONTHS.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Nafn eða sveitarfélag (valfrjálst) */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              <div className="sm:col-span-6">
                <input
                  type="text"
                  disabled={isLocked}
                  value={pickerName}
                  onChange={(e) => setPickerName(e.target.value)}
                  placeholder="Þitt nafn eða sveitarfélag (t.d. Jón / Borgari í Kópavogi)"
                  className="w-full p-2.5 border border-neutral-300 rounded-lg text-xs text-neutral-900 bg-white outline-none focus:border-neutral-900 disabled:bg-neutral-100 disabled:text-neutral-400"
                />
              </div>

              <div className="sm:col-span-6">
                <button
                  type="submit"
                  disabled={isLocked}
                  className={`w-full py-2.5 px-4 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer shadow-xs ${
                    isLocked 
                      ? 'bg-neutral-200 text-neutral-500 cursor-not-allowed border border-neutral-300' 
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {isLocked ? (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Læst af: {lockState.chosenByName}</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-3.5 h-3.5 text-white" />
                      <span>🔒 Læsa valinu þangað til 24 tíma niðurteljarinn fer í núll</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {isLocked ? (
              <div className="p-3 bg-neutral-100 border border-neutral-300 rounded-lg flex items-center gap-2 text-xs text-neutral-800">
                <Lock className="w-4 h-4 text-neutral-900 shrink-0" />
                <span>
                  <strong>Læst af:</strong> {lockState.chosenByName}. Valið er virkt þangað til 24 tíma klukkan slær niður í núll og opnast handahófskennt á næstu 2–6 tímum eftir það.
                </span>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg flex items-center gap-2 text-xs text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>
                  <strong>Valið er opið núna!</strong> Hér getur fyrsti borgarinn læst rannsóknarefni dagsins þangað til 24 tíma klukkan slær núll.
                </span>
              </div>
            )}
          </form>
        </div>

      </div>
    </section>
  );
};
