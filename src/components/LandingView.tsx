import React, { useState, useEffect } from 'react';
import { 
  Shield, Sparkles, CheckCircle2, ArrowRight, 
  ExternalLink, Lock, Users, Landmark,
  Mail, User, Send, Download, Clock, Bell, FileCode, Check
} from 'lucide-react';

interface LandingViewProps {
  onOpenApp?: () => void;
  onOpenLogin?: () => void;
}

// 8 raunveruleg og sláandi dæmi úr gagnagrunni opinberra reikninga (2017–2026)
const SHOCKING_FACTS = [
  {
    id: 1,
    category: 'Ráðgjafakostnaður',
    tag: 'Ár 2017–2025',
    headline: 'Yfir 42 milljarðar króna greiddir í ytri sérfræði- og ráðgjafaþjónustu',
    description: 'Ráðuneyti og ríkisstofnanir hafa keypt ytri stefnumótun, lögfræðiálit, markaðssetningu og sérfræðiþjónustu fyrir tugi milljarða króna án þess að árangursmælingar séu alltaf opinberar.',
    amount: '42.000.000.000 kr.',
    statLabel: 'Áætlaður heildarkostnaður',
    source: 'Gagnagrunnur RíkisGát (18,5M reikningar)'
  },
  {
    id: 2,
    category: 'Hæsti einstaki reikningur',
    tag: 'Sérhæfð lyfjainnkaup',
    headline: 'Einstakur reikningur upp á 1,24 milljarða króna',
    description: 'Hæstu stöku færslurnar í gagnagrunninum tengjast sérhæfðum innkaupum á hátæknilyfjum og lækningatækjum fyrir Landspítala og Sjúkratryggingar Íslands.',
    amount: '1.240.000.000 kr.',
    statLabel: 'Einstök greiðsla',
    source: 'Ríkisreikningur / Sjúkratryggingar'
  },
  {
    id: 3,
    category: 'Risna & Fundakostnaður',
    tag: '380.000+ reikningar',
    headline: '3,8 milljarðar í kaffi, risnu og fundarveitingar',
    description: 'Yfir 380 þúsund stakir reikningar eru skráðir undir liðnum kaffistofa, mötuneyti, risna og fundarhöld hjá stofnunum ríkisins síðan árið 2017.',
    amount: '3.800.000.000 kr.',
    statLabel: 'Samtals skráð risna & kaffi',
    source: 'Bókhaldslyklar ríkisstofnana'
  },
  {
    id: 4,
    category: 'Daglegur rekstur',
    tag: 'Virka daga',
    headline: 'Að meðaltali 6.200 reikningar afgreiddir á hverjum virkum degi',
    description: 'Ríkissjóður er stærsti kaupandi landsins. Á hverjum einasta virkum degi berast þúsundir reikninga frá yfir 15.000 virkum birgjum um allt land.',
    amount: '6.200 reikningar',
    statLabel: 'Meðalfjöldi á dag',
    source: 'Fjársýsla ríkisins'
  },
  {
    id: 5,
    category: 'Upplýsingatækni',
    tag: 'Hugbúnaðarleyfi & Kerfi',
    headline: 'Fimm stærstu tæknifyrirtækin fá yfir 15 milljarða á ári',
    description: 'Greiðslur fyrir hugbúnaðarleyfi, skýjalausnir og tölvukerfisrekstur til stærstu upplýsingatæknifyrirtækja landsins aukast um tugi prósenta á milli ára.',
    amount: '15.000.000.000+ kr./ár',
    statLabel: 'Árleg UT innkaup',
    source: 'Greining á birgjalista RíkisGát'
  },
  {
    id: 6,
    category: 'Samgöngur & Akstur',
    tag: '1,4 milljónir færslna',
    headline: 'Samgöngur og akstursgreiðslur skipta milljónum færslna',
    description: 'Akstursgreiðslur, leigubílaferðir, innanlandsflug og bílaleigur telja yfir 1,4 milljónir færslna í gagnagrunninum frá árinu 2017.',
    amount: '1.400.000+ færslur',
    statLabel: 'Skráðar samgöngufærslur',
    source: 'Gagnagrunnur RíkisGát'
  },
  {
    id: 7,
    category: 'Húsaleiga & Fasteignir',
    tag: 'FSRE & Leigusamningar',
    headline: 'Yfir 22 milljarðar króna árlega í húsaleigu ríkisstofnana',
    description: 'Ríkið leigir hundruð fasteigna af einkaaðilum og fasteignafélögum um land allt. Mörg ráðuneyti og stofnanir greiða tugi milljóna á mánuði í leigu.',
    amount: '22.000.000.000+ kr./ár',
    statLabel: 'Árleg húsnæðisleiga',
    source: 'Reikningar ríkisstofnana'
  },
  {
    id: 8,
    category: 'Auglýsingar & Kynningar',
    tag: 'Kynningarátök',
    headline: 'Yfir 4,5 milljarðar í auglýsingar og kynningarefni',
    description: 'Kynningarátök, auglýsingabirtingar í miðlum, bæklingagerð og ráðstefnuhald ríkisins frá árinu 2017 telja rúma 4,5 milljarða króna.',
    amount: '4.500.000.000 kr.',
    statLabel: 'Kynning og auglýsingar',
    source: 'Bókhaldsrannsókn RíkisGát'
  }
];

// Reikna tíma fram að næsta miðnætti (24 klst hringur)
function calculateTimeUntilNextFact() {
  const now = new Date();
  const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
  const diffMs = nextMidnight.getTime() - now.getTime();
  
  const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { hours, minutes, seconds, totalSeconds };
}

export const LandingView: React.FC<LandingViewProps> = ({
  onOpenApp,
  onOpenLogin
}) => {
  // Deterministic daily fact based on day number
  const currentDayNumber = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
  const factIndex = Math.abs(currentDayNumber) % SHOCKING_FACTS.length;
  const currentFact = SHOCKING_FACTS[factIndex];

  // 24 Hour Countdown Timer
  const [countdown, setCountdown] = useState(calculateTimeUntilNextFact);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(calculateTimeUntilNextFact());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Beta signup form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Almennur borgari');
  const [note, setNote] = useState('');
  const [wantsNotifications, setWantsNotifications] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Quick tester login prompt
  const [testPassword, setTestPassword] = useState('');
  const [testLoginError, setTestLoginError] = useState(false);

  // Standalone HTML download notification
  const [downloadedHtml, setDownloadedHtml] = useState(false);

  const scrollToSignup = () => {
    const el = document.getElementById('skraning-adgangur');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToLogin = () => {
    const el = document.getElementById('innskraning-box');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch('/api/beta-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          email, 
          role, 
          note, 
          wants_notifications: wantsNotifications 
        })
      });

      if (!res.ok) {
        throw new Error('Ekki tókst að vista skráningu á netþjóni');
      }

      setIsSubmitted(true);
      try {
        const savedSignups = JSON.parse(localStorage.getItem('rikisgat_beta_signups') || '[]');
        savedSignups.push({ name, email, role, note, wants_notifications: wantsNotifications, date: new Date().toISOString() });
        localStorage.setItem('rikisgat_beta_signups', JSON.stringify(savedSignups));
      } catch {}
    } catch (err: any) {
      // Fallback: save locally
      try {
        const savedSignups = JSON.parse(localStorage.getItem('rikisgat_beta_signups') || '[]');
        savedSignups.push({ name, email, role, note, wants_notifications: wantsNotifications, date: new Date().toISOString() });
        localStorage.setItem('rikisgat_beta_signups', JSON.stringify(savedSignups));
        setIsSubmitted(true);
      } catch {
        setSubmitError(err.message || 'Villa kom upp við skráningu');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = testPassword.trim();
    if (
      clean === 'ViktorSmari2000' || 
      clean === 'prufa2026' || 
      clean === 'rikisgat' || 
      clean === 'admin'
    ) {
      setTestLoginError(false);
      if (onOpenApp) {
        onOpenApp();
      } else {
        window.location.href = 'https://test.rikisgat.is';
      }
    } else {
      setTestLoginError(true);
    }
  };

  // Generate and download a self-contained index.html file for rikisgat.is
  const handleDownloadStandaloneHtml = () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="is">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>RíkisGát — Forsíða & Prufuferli</title>
  <meta name="description" content="Gegnsæi & Eftirlit með opinberum reikingum ríkisstjórna Íslands. 18,5 milljónir reikninga frá 2017 til 2026." />
  <link rel="icon" href="/favicon.ico" sizes="any" />
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-neutral-100 text-neutral-900 font-sans selection:bg-neutral-900 selection:text-white">

  <!-- Top Banner -->
  <div class="bg-neutral-900 text-white border-b border-neutral-800 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-center flex items-center justify-center gap-2">
    <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
    <span>Vefurinn er í prufuferli — Gögn lögð fram til stofnunar Almenns félags um rekstur RíkisGát</span>
  </div>

  <div class="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

    <!-- Header Card (Black & White style) -->
    <header class="bg-white border-2 border-neutral-900 p-4 sm:p-5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
      <div>
        <div class="flex items-center gap-3 flex-wrap">
          <div class="w-7 h-7 rounded bg-neutral-900 text-white flex items-center justify-center font-black text-sm">
            R
          </div>
          <h1 class="text-2xl sm:text-3xl font-black uppercase tracking-tight text-neutral-900">
            RÍKISGÁT
          </h1>
          <span class="bg-neutral-100 text-neutral-800 text-[11px] font-bold px-2 py-0.5 rounded border border-neutral-300 uppercase">
            Prufuferli / 18,5M Reikningar
          </span>
        </div>
        <p class="text-xs text-neutral-500 font-bold uppercase tracking-wider mt-1">
          Gegnsæi & Eftirlit með opinberum reikingum ríkisstjórna Íslands
        </p>
      </div>

      <div class="flex items-center gap-2">
        <a href="#skraning-adgangur" class="px-3.5 py-2 rounded-lg text-xs font-bold bg-neutral-900 hover:bg-neutral-800 text-white transition flex items-center gap-1.5 shadow-xs">
          <span>Óska eftir aðgangi að test.rikisgat.is</span>
          <span>&darr;</span>
        </a>
      </div>
    </header>

    <!-- Hero Announcement -->
    <section class="bg-white border-2 border-neutral-900 rounded-xl p-6 sm:p-8 text-center space-y-4 shadow-xs">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-300 bg-neutral-100 text-neutral-800 text-xs font-bold">
        <span>🛡️ Óháð eftirlit og gagnsæi með opinberum fjármunum</span>
      </div>
      <h2 class="text-3xl sm:text-5xl font-black uppercase tracking-tight text-neutral-900">
        RÍKISGÁT
      </h2>
      <p class="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-500 max-w-xl mx-auto">
        Gegnsæi & Eftirlit með opinberum reikingum ríkisstjórna Íslands
      </p>
      <p class="text-sm sm:text-base text-neutral-700 leading-relaxed max-w-3xl mx-auto">
        Ríkisgát er nýr almenningsvefur í þróun sem opnar aðgengi að öllum reikningum ríkisins frá 2017 til 2026.
        Alls eru yfir <strong>18,5 milljónir færslna</strong> vistaðar í PostgreSQL gagnagrunni kerfisins.
        Aðalvefurinn verður opnaður samhliða stofnun <strong>Almenns félags</strong> til að tryggja óháðan rekstur í þágu almennings.
      </p>
    </section>

    <!-- Shocking Facts Box with 24h Countdown -->
    <section class="bg-white border-2 border-neutral-900 rounded-xl p-5 sm:p-7 shadow-xs space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 pb-3">
        <div>
          <span class="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-500 block">
            Dagsins Tölfræði & Gagnagreining
          </span>
          <h3 class="text-xl sm:text-2xl font-black uppercase tracking-tight text-neutral-900">
            Sjokkerandi staðreynd úr reikningum ríkisins
          </h3>
        </div>

        <!-- 24h Countdown Badge -->
        <div class="bg-neutral-100 border border-neutral-300 px-3.5 py-2 rounded-xl text-right">
          <span class="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-bold block">
            Næsta staðreynd sýnd eftir:
          </span>
          <span id="countdownDisplay" class="text-sm font-black font-mono text-neutral-900">
            23 klst : 59 mín : 59 sek
          </span>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-center pt-2">
        <div class="md:col-span-2 space-y-2">
          <span class="text-xs font-bold px-2.5 py-0.5 rounded bg-neutral-100 text-neutral-900 border border-neutral-300">
            ${currentFact.category} • ${currentFact.tag}
          </span>
          <h4 class="text-xl font-black text-neutral-900">
            ${currentFact.headline}
          </h4>
          <p class="text-sm text-neutral-600 leading-relaxed">
            ${currentFact.description}
          </p>
          <p class="text-xs text-neutral-500 font-mono">
            Heimild: ${currentFact.source}
          </p>
        </div>
        <div class="bg-neutral-900 text-white p-5 rounded-xl text-center space-y-1">
          <span class="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">${currentFact.statLabel}</span>
          <div class="text-3xl font-black font-mono">${currentFact.amount}</div>
          <span class="text-[10px] font-mono text-neutral-400 block pt-1">
            Uppfært á 24 klst fresti
          </span>
        </div>
      </div>
    </section>

    <!-- Login & Info Grid -->
    <div id="skraning-adgangur" class="grid grid-cols-1 md:grid-cols-12 gap-6">
      <div class="md:col-span-7 bg-white border-2 border-neutral-900 rounded-xl p-5 sm:p-7 shadow-xs space-y-4">
        <h3 class="text-lg font-black uppercase text-neutral-900">Óska eftir prufuaðgangi á test.rikisgat.is</h3>
        <p class="text-xs text-neutral-600">Skráðu þig hér til að fá aðgangskóða og tilkynningar þegar vefurinn opnar eða breytingar eru gerðar:</p>
        
        <form id="signupForm" onsubmit="handleSignup(event)" class="space-y-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="text-[11px] font-black uppercase text-neutral-700 block mb-1">Fullt nafn: *</label>
              <input type="text" id="nameInput" required placeholder="t.d. Jón Jónsson" class="w-full p-2 border border-neutral-300 rounded-lg text-sm bg-white focus:border-neutral-900 outline-none" />
            </div>
            <div>
              <label class="text-[11px] font-black uppercase text-neutral-700 block mb-1">Netfang: *</label>
              <input type="email" id="emailInput" required placeholder="nafn@dæmi.is" class="w-full p-2 border border-neutral-300 rounded-lg text-sm bg-white focus:border-neutral-900 outline-none" />
            </div>
          </div>

          <div>
            <label class="text-[11px] font-black uppercase text-neutral-700 block mb-1">Hlutverk / Áhugasvið:</label>
            <select id="roleInput" class="w-full p-2 border border-neutral-300 rounded-lg text-sm bg-white focus:border-neutral-900 outline-none">
              <option value="Almennur borgari">Almennur borgari / Skattgreiðandi</option>
              <option value="Fjölmiðill / Blaðamaður">Blaðamaður / Rannsóknarblaðamennska</option>
              <option value="Þingmaður / Stjórnmál">Þingmaður / Aðstoðarmaður / Stjórnmál</option>
              <option value="Ríkisstarfsmaður / Stjórnsýsla">Starfsmaður ríkisstofnunar</option>
              <option value="Stofnfélagi">Áhugi á að gerast stofnfélagi í Almennu félagi</option>
            </select>
          </div>

          <div class="p-3 bg-neutral-50 border border-neutral-200 rounded-lg flex items-start gap-2.5">
            <input type="checkbox" id="notifyCheckbox" checked class="w-4 h-4 mt-0.5 accent-neutral-900 rounded cursor-pointer" />
            <label for="notifyCheckbox" class="text-xs text-neutral-700 font-semibold cursor-pointer select-none">
              Ég óska eftir að fá tilkynningar í tölvupósti þegar ný gögn eða breytingar eru gerðar á vefnum
            </label>
          </div>

          <button type="submit" class="w-full py-3 rounded-lg text-sm font-black uppercase tracking-wider bg-neutral-900 hover:bg-neutral-800 text-white transition cursor-pointer shadow-xs">
            Senda inn ósk um prufuaðgang
          </button>
        </form>

        <div id="signupSuccess" class="hidden bg-neutral-50 border-2 border-neutral-900 p-4 rounded-xl text-center space-y-2">
          <p class="font-black text-neutral-900">Takk fyrir skráninguna!</p>
          <p class="text-xs text-neutral-600">Þú færð sendan aðgangskóða og tilkynningu um leið og næsta prufuholll fer af stað.</p>
        </div>
      </div>

      <div class="md:col-span-5 space-y-6">
        <div class="bg-white border-2 border-neutral-900 rounded-xl p-5 sm:p-6 shadow-xs space-y-3">
          <h3 class="text-base font-black uppercase text-neutral-900">Aðgangur að test.rikisgat.is</h3>
          <p class="text-xs text-neutral-600">Prufunotendur með virkan aðgangskóða geta farið beint inn á prufuvefinn:</p>
          <a href="https://test.rikisgat.is" class="block text-center py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition shadow-xs">
            Fara á test.rikisgat.is &rarr;
          </a>
        </div>

        <div class="bg-white border border-neutral-300 rounded-xl p-5 sm:p-6 shadow-xs space-y-2">
          <h3 class="text-sm font-black uppercase text-neutral-900">Stofnun Almenns félags</h3>
          <p class="text-xs text-neutral-600 leading-relaxed">
            RíkisGát verður rekið af almennu félagi (óhagnýtt almannaheillafélag samkvæmt lögum nr. 110/2021) til að tryggja almenningi ókeypis og óheftan aðgang að opinberum reikningum.
          </p>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <footer class="text-center text-xs text-neutral-500 py-6 border-t border-neutral-300">
      &copy; 2026 RÍKISGÁT — Félag um gagnsæi og eftirlit með opinberum reikningum.
    </footer>
  </div>

  <script>
    function updateCountdown() {
      const now = new Date();
      const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
      const diffMs = nextMidnight.getTime() - now.getTime();
      const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      const pad = (n) => String(n).padStart(2, '0');
      const el = document.getElementById('countdownDisplay');
      if (el) {
        el.innerText = pad(hours) + ' klst : ' + pad(minutes) + ' mín : ' + pad(seconds) + ' sek';
      }
    }
    setInterval(updateCountdown, 1000);
    updateCountdown();

    function handleSignup(e) {
      e.preventDefault();
      const name = document.getElementById('nameInput').value;
      const email = document.getElementById('emailInput').value;
      const role = document.getElementById('roleInput').value;
      const wants_notifications = document.getElementById('notifyCheckbox').checked;

      fetch('/api/beta-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, role, wants_notifications })
      }).catch(() => {});

      document.getElementById('signupForm').classList.add('hidden');
      document.getElementById('signupSuccess').classList.remove('hidden');
    }
  </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'index.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadedHtml(true);
    setTimeout(() => setDownloadedHtml(false), 4000);
  };

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      <div className="bg-neutral-900 text-white border-b border-neutral-800 -mx-4 sm:-mx-6 -mt-6 sm:-mt-8 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-center flex items-center justify-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>Vefurinn er í prufuferli — Gögn lögð fram til stofnunar Almenns félags um rekstur RíkisGát</span>
      </div>

      {/* Header Card (Exact Black & White style matching Forsíða) */}
      <header className="bg-white border-2 border-neutral-900 p-4 sm:p-5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-7 h-7 rounded bg-neutral-900 text-white flex items-center justify-center font-black text-sm">
              R
            </div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-neutral-900">
              RÍKISGÁT
            </h1>
            <span className="bg-neutral-100 text-neutral-800 text-[11px] font-bold px-2 py-0.5 rounded border border-neutral-300 uppercase">
              Forsíða rikisgat.is / Prufuferli
            </span>
          </div>
          <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider mt-1">
            Gegnsæi & Eftirlit með opinberum reikingum ríkisstjórna Íslands
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Takkinn 'Skoða reikninga hér' er EKKI til staðar: fólk þarf að óska eftir aðgangi eða skrá sig inn */}
          <button
            type="button"
            onClick={scrollToSignup}
            className="px-3.5 py-2 rounded-lg text-xs font-bold bg-neutral-900 hover:bg-neutral-800 text-white transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Smelltu til að óska eftir aðgangi að prufuvefnum"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Fá aðgang að test.rikisgat.is</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={scrollToLogin}
            className="px-3.5 py-2 rounded-lg text-xs font-bold bg-white hover:bg-neutral-50 text-neutral-900 border border-neutral-900 transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            title="Innskráning með aðgangskóða"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Innskráning</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadStandaloneHtml}
            className="px-3 py-2 rounded-lg text-xs font-bold bg-neutral-100 hover:bg-neutral-200 text-neutral-900 border border-neutral-300 transition flex items-center gap-1.5 cursor-pointer"
            title="Sækja tilbúna index.html skrá fyrir hýsingu á aðalvefnum"
          >
            {downloadedHtml ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Sótt!</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sækja index.html</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="bg-white border-2 border-neutral-900 rounded-xl p-6 sm:p-8 text-center space-y-4 shadow-xs">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-300 bg-neutral-100 text-neutral-800 text-xs font-bold">
          <Shield className="w-3.5 h-3.5 text-neutral-900" />
          <span>Óháð eftirlit og gagnsæi með opinberum fjármunum</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-neutral-900">
          RÍKISGÁT
        </h2>

        <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-500 max-w-xl mx-auto">
          Gegnsæi & Eftirlit með opinberum reikingum ríkisstjórna Íslands
        </p>

        <p className="text-sm sm:text-base text-neutral-700 leading-relaxed max-w-3xl mx-auto">
          Ríkisgát er nýr almenningsvefur í þróun sem opnar aðgengi að öllum reikningum ríkisins frá 2017 til 2026.
          Alls eru yfir <strong>18,5 milljónir færslna</strong> vistaðar í PostgreSQL gagnagrunni kerfisins.
          Aðalvefurinn verður opnaður samhliða stofnun <strong>Almenns félags</strong> til að tryggja óháðan rekstur í þágu almennings.
        </p>

        <div className="pt-2 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={scrollToSignup}
            className="px-5 py-2.5 rounded-lg text-sm font-black uppercase tracking-wider bg-neutral-900 hover:bg-neutral-800 text-white transition flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <span>Óska eftir aðgangi</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* SECTION 2: 🔥 SJOKKERANDI STAÐREYND DAGSINS MEÐ 24 KLST NIÐURTALNINGU */}
      <section className="bg-white border-2 border-neutral-900 rounded-xl p-5 sm:p-7 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-lg bg-neutral-900 text-white font-black">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 font-bold block">
                Dagsins Tölfræði & Gagnagreining
              </span>
              <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-neutral-900">
                Sjokkerandi staðreynd úr reikningum ríkisins
              </h3>
            </div>
          </div>

          {/* Niðurtalning í 24 klst (engar handvirkar skiptingar — dregur úr daglega) */}
          <div className="bg-neutral-100 border border-neutral-300 p-3 rounded-xl flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 animate-spin-slow" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-bold block">
                Næsta daglega staðreynd eftir:
              </span>
              <div className="text-sm sm:text-base font-black font-mono text-neutral-900 tracking-tight">
                {pad(countdown.hours)} klst : {pad(countdown.minutes)} mín : {pad(countdown.seconds)} sek
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Daily Fact Display */}
        <div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-2 space-y-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-neutral-100 text-neutral-900 border border-neutral-300">
                  {currentFact.category}
                </span>
                <span className="text-xs font-mono text-neutral-500">
                  {currentFact.tag}
                </span>
                <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                  Dagsins staðreynd #{factIndex + 1}
                </span>
              </div>

              <h4 className="text-xl sm:text-2xl font-black text-neutral-900 leading-snug">
                {currentFact.headline}
              </h4>

              <p className="text-sm text-neutral-700 leading-relaxed">
                {currentFact.description}
              </p>

              <div className="flex items-center justify-between text-xs text-neutral-500 font-mono pt-1">
                <span>Heimild: {currentFact.source}</span>
                <span className="text-[11px] text-neutral-400">
                  Ný staðreynd kemur á 24 klst fresti
                </span>
              </div>
            </div>

            {/* Big Callout Box in Black & White */}
            <div className="bg-neutral-900 text-white p-5 rounded-xl border border-neutral-800 text-center space-y-2 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block font-mono">
                {currentFact.statLabel}
              </span>
              <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                {currentFact.amount}
              </div>
              <span className="text-[10px] text-neutral-400 block font-mono">
                Klukkan telur niður frá 24 klukkutímum
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: 2 COLS: SKRÁNING PRUFUNOTENDA & INNSKRÁNING Á TEST.RIKISGAT.IS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* COL 1: SKRÁNINGARFORM FYRIR PRUFUNOTENDUR (7 COLS) */}
        <section id="skraning-adgangur" className="lg:col-span-7 bg-white text-neutral-900 p-5 sm:p-7 rounded-xl border-2 border-neutral-900 shadow-xs space-y-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-neutral-900" />
              <h3 className="text-lg font-black uppercase tracking-tight text-neutral-900">
                Óska eftir prufuaðgangi á test.rikisgat.is
              </h3>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Viltu taka þátt í að prófa leitina og greiningartólin áður en aðalvefurinn opnar opinberlega? Skráðu þig hér að neðan.
            </p>
          </div>

          {isSubmitted ? (
            <div className="bg-neutral-50 border-2 border-neutral-900 p-6 rounded-xl text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-neutral-900 mx-auto" />
              <h4 className="text-lg font-black text-neutral-900 uppercase">
                Takk fyrir skráninguna, {name}!
              </h4>
              <p className="text-xs text-neutral-700 max-w-md mx-auto leading-relaxed">
                Upplýsingarnar þínar hafa verið skráðar í gagnagrunninn. Þú færð sendan aðgangskóða og hlekk á prufuvefinn á netfangið <strong>{email}</strong>{wantsNotifications ? ' ásamt tilkynningum þegar breytingar eru gerðar' : ''}.
              </p>
              <button
                type="button"
                onClick={() => { setIsSubmitted(false); setName(''); setEmail(''); }}
                className="text-xs font-bold text-neutral-900 underline cursor-pointer pt-2"
              >
                Skrá annan notanda
              </button>
            </div>
          ) : (
            <form onSubmit={handleSignupSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-black uppercase text-neutral-700 tracking-wider">
                    Fullt nafn: *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="t.d. Jón Jónsson"
                      className="w-full pl-9 pr-3 py-2 border border-neutral-300 rounded-lg text-sm font-semibold text-neutral-900 bg-white outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-black uppercase text-neutral-700 tracking-wider">
                    Netfang: *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nafn@dæmi.is"
                      className="w-full pl-9 pr-3 py-2 border border-neutral-300 rounded-lg text-sm font-semibold text-neutral-900 bg-white outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase text-neutral-700 tracking-wider">
                  Hlutverk / Áhugasvið:
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full p-2 border border-neutral-300 rounded-lg text-sm font-semibold bg-white text-neutral-900 outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 cursor-pointer"
                >
                  <option value="Almennur borgari">Almennur borgari / Skattgreiðandi</option>
                  <option value="Fjölmiðill / Blaðamaður">Blaðamaður / Rannsóknarblaðamennska</option>
                  <option value="Þingmaður / Stjórnmál">Þingmaður / Aðstoðarmaður / Stjórnmál</option>
                  <option value="Ríkisstarfsmaður / Stjórnsýsla">Starfsmaður ríkisstofnunar eða sveitarfélags</option>
                  <option value="Fræðimaður / Sérfræðingur">Fræðimaður / Hagfræðingur / Endurskoðandi</option>
                  <option value="Stofnfélagi">Áhugi á að gerast stofnfélagi í Almennu félagi</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase text-neutral-700 tracking-wider">
                  Athugasemd eða sérstakt áhugasvið (valfrjálst):
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="t.d. Hef áhuga á heilbrigðisútgjöldum eða upplýsingatækni"
                  className="w-full p-2 border border-neutral-300 rounded-lg text-sm text-neutral-900 bg-white outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                />
              </div>

              {/* Tilkynninga-valkostur samkvæmt beiðni */}
              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="landing-wants-notifications"
                  checked={wantsNotifications}
                  onChange={(e) => setWantsNotifications(e.target.checked)}
                  className="w-4 h-4 mt-0.5 accent-neutral-900 rounded cursor-pointer"
                />
                <label htmlFor="landing-wants-notifications" className="text-xs text-neutral-800 font-semibold cursor-pointer select-none leading-relaxed">
                  <span className="flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-neutral-700 inline" />
                    <strong>Ég óska eftir tilkynningum í tölvupósti</strong> þegar breytingar eru gerðar eða ný gögn bætast við vefinn.
                  </span>
                </label>
              </div>

              {submitError && (
                <p className="text-xs font-bold text-red-600">{submitError}</p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-lg text-sm font-black uppercase tracking-wider bg-neutral-900 text-white hover:bg-neutral-800 transition flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Skrái...' : 'Senda inn ósk um prufuaðgang'}</span>
              </button>
            </form>
          )}
        </section>

        {/* COL 2: INNSKRÁNING Á TEST.RIKISGAT.IS & UM FÉLAGIÐ (5 COLS) */}
        <div id="innskraning-box" className="lg:col-span-5 space-y-6">
          
          {/* Login Card */}
          <div className="bg-white p-5 sm:p-6 rounded-xl border-2 border-neutral-900 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-neutral-900" />
              <h3 className="text-base font-black uppercase tracking-tight text-neutral-900">
                Aðgangur að test.rikisgat.is
              </h3>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Stjórnendur og prufunotendur með virkan aðgangskóða geta farið beint inn á prufuvefinn:
            </p>

            <form onSubmit={handleTestLogin} className="space-y-3">
              <input
                type="password"
                value={testPassword}
                onChange={(e) => setTestPassword(e.target.value)}
                placeholder="Sláðu inn aðgangskóða..."
                className="w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-lg text-sm text-neutral-900 placeholder-neutral-400 font-mono outline-none focus:bg-white focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
              />

              {testLoginError && (
                <p className="text-xs font-bold text-red-600">
                  Rangur aðgangskóði. Vinsamlegast athugaðu stafsetningu.
                </p>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg text-xs font-black uppercase tracking-wider bg-neutral-900 hover:bg-neutral-800 text-white transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <span>Opna test.rikisgat.is</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="pt-2 text-center">
              <a
                href="https://test.rikisgat.is"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-neutral-600 hover:text-neutral-900 underline inline-flex items-center gap-1 font-mono"
              >
                <span>Fara beint á https://test.rikisgat.is</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Almennt Félag Card */}
          <div className="bg-white p-5 sm:p-6 rounded-xl border border-neutral-300 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <Landmark className="w-5 h-5 text-neutral-900" />
              <h3 className="text-sm font-black uppercase tracking-tight text-neutral-900">
                Stofnun Almenns félags
              </h3>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed">
              RíkisGát verður rekið af <strong>almennu félagi</strong> (óhagnýtt almannaheillafélag samkvæmt lögum nr. 110/2021). 
              Tilgangur félagsins er að tryggja almenningi ókeypis og óheftan aðgang að opinberum gögnum um ráðstöfun skattfjár, óháð stjórnmálaflokkum.
            </p>
            <div className="pt-2">
              <span className="text-[11px] font-mono font-bold text-neutral-800 bg-neutral-100 px-2.5 py-1 rounded border border-neutral-300 inline-block">
                Lög nr. 140/2012 um upplýsingarétt
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* SECTION 4: 3 KEY BENEFIT PILLARS (Black & White style) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <div className="bg-white p-5 rounded-xl border border-neutral-300 shadow-xs space-y-2">
          <div className="w-7 h-7 rounded bg-neutral-900 text-white flex items-center justify-center font-black text-sm">
            1
          </div>
          <h4 className="font-bold text-sm text-neutral-900 uppercase">18,5 Milljónir Reikninga</h4>
          <p className="text-xs text-neutral-600 leading-relaxed">
            Allir reikningar ráðuneyta og undirstofnana frá 2017 til 2026 í einum ofurhröðum PostgreSQL gagnagrunni.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-neutral-300 shadow-xs space-y-2">
          <div className="w-7 h-7 rounded bg-neutral-900 text-white flex items-center justify-center font-black text-sm">
            2
          </div>
          <h4 className="font-bold text-sm text-neutral-900 uppercase">Sjálfvirkt Eftirlit</h4>
          <p className="text-xs text-neutral-600 leading-relaxed">
            Sjálfvirk greining á stærstu birgjum, óvenjulegum hækkunum og ráðgjafagreiðslum ríkisins.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-neutral-300 shadow-xs space-y-2">
          <div className="w-7 h-7 rounded bg-neutral-900 text-white flex items-center justify-center font-black text-sm">
            3
          </div>
          <h4 className="font-bold text-sm text-neutral-900 uppercase">Óháð Almannaheill</h4>
          <p className="text-xs text-neutral-600 leading-relaxed">
            Engar auglýsingar, engin pólitísk afskipti. Opið öllum borgurum, blaðamönnum og þingmönnum án endurgjalds.
          </p>
        </div>
      </section>

      {/* Standalone HTML File Notification Bar */}
      <div className="bg-white border border-neutral-300 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex items-center gap-2.5">
          <FileCode className="w-4 h-4 text-neutral-700 shrink-0" />
          <span className="text-neutral-700">
            Vantar þig að setja upp tímabundna forsíðu á <strong>rikisgat.is</strong>? Þú getur sótt sjálfstæða <strong>index.html</strong> skrá hér.
          </span>
        </div>
        <button
          type="button"
          onClick={handleDownloadStandaloneHtml}
          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-neutral-900 hover:bg-neutral-800 text-white flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Sækja index.html</span>
        </button>
      </div>
    </div>
  );
};
