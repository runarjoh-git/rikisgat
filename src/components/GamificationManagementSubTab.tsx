import React, { useState } from 'react';
import { 
  Flame, Award, Calculator, Search, Building2, CheckCircle2, 
  Lock, Unlock, Clock, AlertTriangle, ShieldCheck, HelpCircle, 
  Sparkles, RefreshCw, ThumbsDown, ThumbsUp, ArrowRight
} from 'lucide-react';
import { formaTolu } from '../utils/icelandicFormatters';

interface GamificationIdea {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  status: 'active' | 'in_development' | 'planned';
  statusLabel: string;
  description: string;
  userImpact: string;
  targetDate: string;
}

const GAMIFICATION_IDEAS: GamificationIdea[] = [
  {
    id: 'idea-citizen-lock',
    title: 'Borgaravalið: Fyrstur kemur, fyrstur fær',
    subtitle: '24 klst niðurteljari & handahófskennd opnun (2–6 klst)',
    icon: '🔒',
    status: 'active',
    statusLabel: 'Virkt á forsíðu',
    description: 'Fyrsti borgarinn sem kemur á svæðið læsir rannsóknarefni dagsins (flokki, ári og mánuði). Valið er læst þangað til 24 tíma klukkan slær núll, og opnast svo á tilviljanakenndum tíma á næstu 2–6 tímum til að koma í veg fyrir að sami aðili mæti alltaf á slaginu á miðnætti.',
    userImpact: 'Skapar mikla spennu og hvetur fólk til að koma daglega til að ná að velja næsta rannsóknarefni.',
    targetDate: 'Október 2026'
  },
  {
    id: 'idea-quiz',
    title: 'Gettu upphæðina! (The Price Is Right)',
    subtitle: 'Gagnvirkur spurningaleikur um rauntölur ríkisútgjalda',
    icon: '🎯',
    status: 'active',
    statusLabel: 'Virkt á forsíðu',
    description: 'Notandi giskar á heildarupphæð í völdum útgjaldaflokki úr 3 valkostum. Fær samstundis endurgjöf um hvort giskið hafi verið rétt og fræðslu um hversu mikið fé fór í raun úr ríkissjóði.',
    userImpact: 'Opnar augu fólks fyrir raunverulegri stærðargráðu ríkisútgjalda á lifandi og skemmtilegan hátt.',
    targetDate: 'Október 2026'
  },
  {
    id: 'idea-poll',
    title: 'Borgardómur: Eðlilegt eða Sóun?',
    subtitle: 'Lýðræðislegt mat á útgjaldaliðum',
    icon: '⚖️',
    status: 'active',
    statusLabel: 'Virkt á forsíðu',
    description: 'Almenningur greiðir atkvæði: 🔴 „Sóun á skattfé“ eða 🟢 „Eðlilegur rekstur“. Niðurstöður sýna lifandi skoðun skattgreiðenda á ráðgjöf, risnu, bílaleigum og PR-átökum.',
    userImpact: 'Gefur kjósendum og borgurum rödd og sýnir samfélagslega samstöðu um aðhald.',
    targetDate: 'Október 2026'
  },
  {
    id: 'idea-my-taxes',
    title: 'Mínir skattpeningar (Persónuleg reiknivél)',
    subtitle: 'Sláðu inn mánaðarlaun og sjáðu hvert þínir skattar fóru',
    icon: '💰',
    status: 'in_development',
    statusLabel: 'Í hönnun',
    description: 'Borgari slær inn sín mánaðarlaun (t.d. 750.000 kr.) og fær nákvæma sundurliðun á því hve margar krónur af hans skattgreiðslum fóru í ráðgjafafyrirtæki, kaffistofur ráðuneyta, bílaleigur ráðherra og einkahúsaleigu.',
    userImpact: 'Tengir skattgreiðandann beint tilfinningalega við ríkisbókhaldið: tölurnar verða persónulegar en ekki bara óhlutbundnir milljarðar.',
    targetDate: 'Nóvember 2026'
  },
  {
    id: 'idea-whistleblower-bounty',
    title: 'Borgaravaktin: Leitaðu að skrýtnasta reikningnum',
    subtitle: 'Samfélagslegur rannsóknarvettvangur & Upplýsingalög 140/2012',
    icon: '🕵️‍♂️',
    status: 'planned',
    statusLabel: 'Framtíðaráætlun',
    description: 'Prufunotendur á test.rikisgat.is geta tilnefnt grunsamlegar eða óvenjulegar færslur. Ef færsla fær t.d. 100 atkvæði setur félagið saman sjálfvirka upplýsingabeiðni skv. 140/2012 lögum og birtir frumgögnin á vefnum.',
    userImpact: 'Breytt í virkt borgaraeftirlit þar sem almenningur vinnur saman eins og rannsóknarblaðamenn.',
    targetDate: 'Desember 2026'
  },
  {
    id: 'idea-ministry-of-month',
    title: 'Ráðuneyti mánaðarins (Kastljósið)',
    subtitle: 'Mánaðarleg dýpkun á einu ráðuneyti í senn',
    icon: '🏛️',
    status: 'planned',
    statusLabel: 'Framtíðaráætlun',
    description: 'Í hverjum mánuði er eitt ráðuneyti tekið fyrir í samstarfi við samfélagið. Í október: Utanríkisráðuneytið (ferðalög, sendiráð, risna). Í nóvember: Fjármálaráðuneytið (ráðgjöf, UT).',
    userImpact: 'Kemur í veg fyrir upplýsingaóreiðu með því að einbeita umræðu og fjölmiðlaumfjöllun að einum stað í einu.',
    targetDate: 'Byrjun 2027'
  }
];

export const GamificationManagementSubTab: React.FC = () => {
  // Demo calculator for "Mínir skattpeningar"
  const [testSalary, setTestSalary] = useState<number>(750000);
  
  // Calculate breakdown for demo
  const estTaxPaid = Math.round(testSalary * 0.3148 * 12); // ~31.48% meðalskattprósenta á ári
  const consultingShare = Math.round(estTaxPaid * (5850000000 / 1200000000000)); // ~0.49% af skattfé
  const hospitalityShare = Math.round(estTaxPaid * (540000000 / 1200000000000)); // ~0.045%
  const travelShare = Math.round(estTaxPaid * (1380000000 / 1200000000000)); // ~0.115%
  const rentShare = Math.round(estTaxPaid * (22800000000 / 1200000000000)); // ~1.9%
  const prShare = Math.round(estTaxPaid * (720000000 / 1200000000000)); // ~0.06%

  const resetLockInLocal = () => {
    try {
      localStorage.removeItem('rikisgat_citizen_lock_v1');
      alert('Lásinn hefur verið endurstilltur! Næst þegar lendingarsíðan er opnuð verður valið opið á ný.');
    } catch {}
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER BANNER */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-neutral-900 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🎮</span>
            <h2 className="text-xl font-black uppercase tracking-tight text-neutral-900">
              Leikjavæðing & Borgaravitund (Gamification)
            </h2>
            <span className="bg-neutral-900 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
              Stjórnborð RíkisGát
            </span>
          </div>
          <p className="text-xs text-neutral-600 mt-1 max-w-3xl leading-relaxed">
            Hér eru samankomnar allar aðgerðir og hugmyndir sem skapa leik, virkja forvitni almennings og gera ríkisútgjöld aðgengileg og grípandi.
          </p>
        </div>

        <button
          type="button"
          onClick={resetLockInLocal}
          className="px-3 py-2 rounded-lg text-xs font-bold bg-neutral-100 hover:bg-neutral-200 text-neutral-900 border border-neutral-300 transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
          title="Prófa að opna lásinn á ný"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Endurstilla lás á lendingarsíðu</span>
        </button>
      </div>

      {/* CORE PRINCIPLE: 100% EXCLUSION OF HOSPITALS & SCHOOLS */}
      <div className="bg-emerald-50/70 border-2 border-emerald-300 rounded-xl p-5 sm:p-6 space-y-2">
        <div className="flex items-center gap-2 text-emerald-950 font-black text-sm uppercase">
          <ShieldCheck className="w-5 h-5 text-emerald-700" />
          <span>Meginregla RíkisGát: Sjúkrahús, heilsugæsla og skólar eru 100% undanskilin</span>
        </div>
        <p className="text-xs text-emerald-900 leading-relaxed max-w-4xl">
          Skattgreiðendur vilja og eru stoltir af því að kosta Landspítalann, heilsugæslur og menntun barna sinna. Allir leikir, sjokkerandi tölur og borgaraval snúa <strong>eingöngu að stjórnsýslunni, ytri ráðgjöf, risnu, auglýsingaherferðum, utanlandsferðum, einkalögmönnum og einkahúsaleigu</strong>.
        </p>
      </div>

      {/* OVERVIEW OF IDEAS (CARDS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {GAMIFICATION_IDEAS.map(idea => (
          <div key={idea.id} className="bg-white p-5 rounded-xl border border-neutral-300 shadow-xs space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-2xl">{idea.icon}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  idea.status === 'active'
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                    : idea.status === 'in_development'
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-neutral-100 text-neutral-700 border-neutral-300'
                }`}>
                  {idea.statusLabel}
                </span>
              </div>

              <h3 className="font-black text-sm text-neutral-900 leading-snug">
                {idea.title}
              </h3>
              
              <p className="text-[11px] text-neutral-500 font-semibold">
                {idea.subtitle}
              </p>

              <p className="text-xs text-neutral-700 leading-relaxed pt-1">
                {idea.description}
              </p>
            </div>

            <div className="pt-3 border-t border-neutral-200 space-y-1 text-[11px]">
              <div className="text-neutral-600">
                <strong>Áhrif á notendur:</strong> {idea.userImpact}
              </div>
              <div className="text-neutral-400 font-mono text-[10px]">
                Áætluð opnun: {idea.targetDate}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* INTERACTIVE PROTOTYPE: "MÍNIR SKATTPENINGAR" */}
      <div className="bg-white border-2 border-neutral-900 rounded-xl p-5 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-neutral-900" />
          <h3 className="text-base font-black uppercase tracking-tight text-neutral-900">
            Prufutól í Stjórnborði: „Mínir skattpeningar“ (Skattareiknivél)
          </h3>
        </div>
        <p className="text-xs text-neutral-600 max-w-3xl leading-relaxed">
          Hér getur stjórnandi prófað reiknivélina sem verður sett á vefinn. Sláðu inn mánaðarlaun til að sjá hvernig skattfé einstaklingsins skiptist í forvitnilegustu liði ríkisins:
        </p>

        <div className="bg-neutral-50 p-4 sm:p-5 rounded-xl border border-neutral-300 space-y-4 max-w-2xl">
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase text-neutral-700 tracking-wider">
              Prófa mánaðarlaun (fyrir skatt): {formaTolu(testSalary)} kr.
            </label>
            <input 
              type="range"
              min="400000"
              max="2500000"
              step="50000"
              value={testSalary}
              onChange={(e) => setTestSalary(parseInt(e.target.value, 10))}
              className="w-full accent-neutral-900 cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="bg-white p-3 rounded-lg border border-neutral-200 space-y-1">
              <span className="text-[10px] text-neutral-500 font-bold block uppercase">💼 Ytri ráðgjöf</span>
              <span className="text-sm font-black font-mono text-neutral-900">{formaTolu(consultingShare)} kr./ár</span>
            </div>
            <div className="bg-white p-3 rounded-lg border border-neutral-200 space-y-1">
              <span className="text-[10px] text-neutral-500 font-bold block uppercase">☕ Kaffi & risna</span>
              <span className="text-sm font-black font-mono text-neutral-900">{formaTolu(hospitalityShare)} kr./ár</span>
            </div>
            <div className="bg-white p-3 rounded-lg border border-neutral-200 space-y-1">
              <span className="text-[10px] text-neutral-500 font-bold block uppercase">✈️ Flug & bílaleigur</span>
              <span className="text-sm font-black font-mono text-neutral-900">{formaTolu(travelShare)} kr./ár</span>
            </div>
            <div className="bg-white p-3 rounded-lg border border-neutral-200 space-y-1">
              <span className="text-[10px] text-neutral-500 font-bold block uppercase">🏛️ Einkahúsaleiga</span>
              <span className="text-sm font-black font-mono text-neutral-900">{formaTolu(rentShare)} kr./ár</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
