import React, { useState } from 'react';
import { 
  X, Heart, Copy, Check, Building2, Users, FileText, 
  ShieldCheck, Sparkles, Award, ExternalLink, Calendar, MapPin
} from 'lucide-react';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'bank' | 'story' | 'team' | 'documents'>('bank');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-neutral-950/70 backdrop-blur-xs transition-opacity" 
      />

      {/* Modal Dialog */}
      <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden z-10 animate-in zoom-in-95 duration-200 my-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-800 text-white p-5 flex items-center justify-between border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30 shrink-0">
              <Heart className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base tracking-tight">Viltu styrkja okkur?</h3>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                  Stofnun í gangi ⏳
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Sjálfstætt borgaraverkefni fjölskyldu í Kópavogi — rekið án hagnaðarmarkmiðs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-neutral-200 bg-neutral-50 px-5 pt-2 gap-2 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('bank')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'bank'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <span>💳 Millifærsla (Frátekið)</span>
          </button>
          <button
            onClick={() => setActiveTab('story')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'story'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <span>📖 Sagan okkar</span>
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'team'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <span>👨‍👧‍👦 Fjölskyldan & Teymið</span>
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'documents'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <span>📜 Stofngögn</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 max-h-[75vh] overflow-y-auto space-y-6">
          
          {/* TAB 1: BANKAUFFLÝSINGAR (FRÁTEKIÐ SVÆÐI) */}
          {activeTab === 'bank' && (
            <div className="space-y-5">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-950 leading-relaxed">
                <div className="flex items-center gap-2 font-bold mb-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-amber-900 uppercase tracking-wider text-[11px]">
                    Frátekið svæði — Stofnun félagsins í vinnslu hjá Skattinum (RSK 5.03)
                  </span>
                </div>
                <p className="text-neutral-700 text-[11px] leading-relaxed">
                  Til að tryggja 100% fagmennsku og gagnsæi verða bankaupplýsingar aðeins birtar hér 
                  þegar félagið <strong>Ríkisgát</strong> hefur fengið úthlutað opinberri kennitölu sem 
                  almennt félag (félagasamtök) og opnað eigin bankareikning í nafni félagsins. 
                  Engum persónulegum bankareikningum er beitt hér.
                </p>
              </div>

              {/* Status Box */}
              <div className="bg-neutral-900 text-white rounded-2xl p-5 shadow-md space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-widest text-neutral-400">
                      Framtíðar bankareikningur félagsins
                    </span>
                    <h4 className="text-base font-bold text-white mt-0.5">
                      Ríkisgát — Almennt félag (félagasamtök)
                    </h4>
                  </div>
                  <span className="text-xs bg-amber-500/20 text-amber-300 font-bold px-2.5 py-1 rounded-full border border-amber-500/30">
                    Væntanlegt
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-neutral-800/80 p-3.5 rounded-xl border border-neutral-700/60">
                    <div className="text-[10px] text-neutral-400 uppercase font-mono">Reikningsnúmer</div>
                    <div className="text-xs font-mono font-bold text-neutral-300 mt-1">
                      [Birtist við úthlutun kennitölu]
                    </div>
                  </div>

                  <div className="bg-neutral-800/80 p-3.5 rounded-xl border border-neutral-700/60">
                    <div className="text-[10px] text-neutral-400 uppercase font-mono">Kennitala félagsins</div>
                    <div className="text-xs font-mono font-bold text-neutral-300 mt-1">
                      [RSK 5.03 umsókn í ferli]
                    </div>
                  </div>
                </div>

                {/* Progress Steps */}
                <div className="pt-2 border-t border-neutral-800 text-[11px] space-y-1.5 text-neutral-300">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>Stofnfundur haldinn og lög samþykkt (18. september 2026)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 font-bold">⏳</span>
                    <span>Skráning hjá Skattinum (eyðublað RSK 5.03)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-500 font-bold">🔜</span>
                    <span className="text-neutral-400">Stofnun bankareiknings í nafni Ríkisgát og opnun fyrir frjáls framlög</span>
                  </div>
                </div>
              </div>

              {/* What support will cover */}
              <div className="border border-neutral-200 rounded-xl p-4 space-y-2 bg-neutral-50/50">
                <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                  Hvað mun stuðningurinn gera þegar opnað verður?
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-neutral-700">
                  <div className="bg-white p-3 rounded-lg border border-neutral-200">
                    <div className="font-bold text-rose-600 text-sm">500 kr.</div>
                    <div className="font-semibold text-neutral-900 mt-0.5">Einn kaffibolli</div>
                    <p className="text-[11px] text-neutral-500 mt-1">
                      Mætir dagslegum kostnaði við sjálfvirka vinnslu og innlestur nýrra reikninga.
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-neutral-200">
                    <div className="font-bold text-rose-600 text-sm">1.500 kr.</div>
                    <div className="font-semibold text-neutral-900 mt-0.5">Hálfur mánuður</div>
                    <p className="text-[11px] text-neutral-500 mt-1">
                      Mætir hýsingarkostnaði á öruggum PostgreSQL gagnagrunni.
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-neutral-200">
                    <div className="font-bold text-rose-600 text-sm">3.000 kr.+</div>
                    <div className="font-semibold text-neutral-900 mt-0.5">Heill mánuður</div>
                    <p className="text-[11px] text-neutral-500 mt-1">
                      Heldur öllum netþjónum gangandi í heilan mánuð án persónulegs útlagðs kostnaðar.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SAGAN OKKAR */}
          {activeTab === 'story' && (
            <div className="space-y-4 text-xs text-neutral-700 leading-relaxed">
              <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 space-y-2">
                <span className="text-[10px] font-mono uppercase bg-neutral-200 px-2 py-0.5 rounded font-bold text-neutral-800">
                  18. september 2026 • Kópavogi
                </span>
                <h4 className="text-sm font-bold text-neutral-900">
                  Hvernig hugmyndin varð að veruleika við eldhúsborðið
                </h4>
                <p>
                  Hugmyndin að Ríkisgát kviknaði heima í Kópavogi. Rúnar Þór hafði fylgst með umræðu 
                  um opinber fjármál og hversu erfitt var fyrir venjulegt fólk að átta sig á því 
                  hvert skattpeningarnir fara í raun og veru.
                </p>
                <p>
                  Í stað þess að búa bara til venjulegan vef ákváðu Rúnar og börnin hans þrjú — 
                  <strong> Viktor Smári, Rakel Anna og Óðinn</strong> — að gera þetta að sameiginlegu 
                  fjölskyldu- og menntunarverkefni.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                  Tvöföld hugsjón verkefnisins:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-white border border-neutral-200 rounded-xl space-y-1">
                    <div className="font-bold text-neutral-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-neutral-700" />
                      <span>1. Raunverulegt gagnsæi</span>
                    </div>
                    <p className="text-[11px] text-neutral-600">
                      Gera opinber gögn um reikninga ríkisins aðgengileg, leitarbær og skiljanleg — 
                      ekki bara fyrir stærstu tölurnar, heldur líka til að sjá hvar restin af peningunum liggur.
                    </p>
                  </div>

                  <div className="p-3 bg-white border border-neutral-200 rounded-xl space-y-1">
                    <div className="font-bold text-neutral-900 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-neutral-700" />
                      <span>2. Lærdómur fyrir unga fólkið</span>
                    </div>
                    <p className="text-[11px] text-neutral-600">
                      Kenna krökkunum að stofna almennt félag, halda lögmætan stofnfund, stýra fundum, 
                      rita fundargerðir, skrá hjá Skattinum og halda utan um raunverulegt bókhald.
                    </p>
                  </div>
                </div>
              </div>

              {/* Skírn og Heiðursfélagar */}
              <div className="space-y-3">
                <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-xl space-y-2 text-rose-950">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">👶</span>
                      <h4 className="font-bold text-xs text-rose-950 uppercase tracking-wider">
                        Heiðursfélagi nr. 1 — Fyrsta afabarnið
                      </h4>
                    </div>
                    <span className="text-[10px] bg-rose-200/80 text-rose-900 font-bold px-2 py-0.5 rounded-full">
                      Skírnardagur 20. sept 2026
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-700 leading-relaxed">
                    Á stofnári Ríkisgát fæddist fyrsta afabarnið í fjölskyldunni. Í tilefni skírnardagsins 
                    hefur stjórnin sammælst um að bjóða því stöðu <strong>Heiðursfélaga nr. 1</strong> í félaginu. 
                    Heiðursfélagar fara ekki með atkvæðisrétt á fundum en njóta ævilangrar viðurkenningar 
                    og boðs á öllum viðburðum félagsins — sem lifandi áminning um að við vinnum að gagnsæi fyrir komandi kynslóðir!
                  </p>
                </div>

                <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2 text-amber-950">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🏅</span>
                      <h4 className="font-bold text-xs text-amber-950 uppercase tracking-wider">
                        Heiðursfélagi nr. 2 — Sigþrúður Guðnadóttir
                      </h4>
                    </div>
                    <span className="text-[10px] bg-amber-200/80 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                      Samþykkt á 1. aðalfundi
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-700 leading-relaxed">
                    Stjórn og stofnendur félagsins hafa einróma samþykkt að útnefna <strong>Sigþrúði Guðnadóttur</strong> sem 
                    <strong> Heiðursfélaga nr. 2</strong> í Ríkisgát. Útnefningin er veitt í mikilli þakkarskuld og virðingu fyrir ómetanlegan 
                    stuðning, hvatningu, samveru og traust við uppbyggingu þessa fjölskylduverkefnis og samfélagshugsjónar.
                  </p>
                </div>
              </div>

              {/* Bakhjarl: Dílajörð ehf */}
              <div className="p-3 bg-neutral-100 border border-neutral-300 rounded-xl text-neutral-800 text-[11px] space-y-1">
                <strong>Bakhjarl og sérfræðiþjónusta — Dílajörð ehf:</strong>
                <p className="text-neutral-600 leading-relaxed">
                  Fyrirtækið <strong>Dílajörð ehf.</strong> veitir félaginu sérfræðilega ráðgjöf og tækniaðstoð. 
                  Með því getur unga fólkið einnig öðlast launaða starfsreynslu við rannsóknir, hugbúnaðarprófanir 
                  og gagnagreiningu samhliða námi.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: FJÖLSKYLDAN & TEYMIÐ */}
          {activeTab === 'team' && (
            <div className="space-y-4 text-xs">
              <p className="text-neutral-600 leading-relaxed">
                Stjórn og stofnendur Ríkisgát eru feðgin úr Kópavogi. Hér er hlutverkaskiptingin samkvæmt stofnskrá:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Rúnar */}
                <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-neutral-900 text-sm">Rúnar Þór Jóhannsson</h5>
                    <span className="text-[10px] bg-neutral-900 text-white font-bold px-2 py-0.5 rounded">
                      Formaður
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-500 font-mono">kt. 190873-3669</div>
                  <p className="text-[11px] text-neutral-600 leading-snug">
                    Hugmyndasmiður verkefnisins og verkefnastjóri. Fer með formennsku til að fylgja 
                    umsókn félagsins eftir hjá Skattinum og stýra þróun vefsins.
                  </p>
                </div>

                {/* Viktor Smári */}
                <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-neutral-900 text-sm">Viktor Smári Rúnarsson</h5>
                    <span className="text-[10px] bg-neutral-200 text-neutral-800 font-bold px-2 py-0.5 rounded">
                      Fundarstjóri & Tæknistjóri
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-500 font-mono">kt. 020300-3290</div>
                  <p className="text-[11px] text-neutral-600 leading-snug">
                    Stýrði stofnfundinum af öryggi og fylgir eftir tæknilegum lausnum, prófunum og innleiðingu gagnagrunna.
                  </p>
                </div>

                {/* Rakel Anna */}
                <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-neutral-900 text-sm">Rakel Anna Rúnarsdóttir</h5>
                    <span className="text-[10px] bg-neutral-200 text-neutral-800 font-bold px-2 py-0.5 rounded">
                      Fundarritari & Samskiptastjóri
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-500 font-mono">kt. 190804-3720</div>
                  <p className="text-[11px] text-neutral-600 leading-snug">
                    Sá um ritun fundargerðar á stofnfundi og heldur utan um skráningu, textagerð og samskipti við notendur.
                  </p>
                </div>

                {/* Óðinn */}
                <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-neutral-900 text-sm">Óðinn Rúnarsson</h5>
                    <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded border border-amber-200">
                      Gagnarýnir & Verðandi gjaldkeri
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-500 font-mono">kt. 190907-3680</div>
                  <p className="text-[11px] text-neutral-600 leading-snug">
                    Meðstjórnandi í stjórn félagsins. Rýnir í reikninga og talnagögn með augum nýrrar kynslóðar og 
                    undirbýr sig undir embætti gjaldkera á komandi aðalfundi.
                  </p>
                </div>
              </div>

              {/* Honorary Members and Company Partner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3.5 bg-rose-50/50 border border-rose-200 rounded-xl space-y-1">
                  <div className="font-bold text-neutral-900 flex items-center gap-1.5">
                    <span>👶</span>
                    <span>Heiðursfélagi nr. 1</span>
                  </div>
                  <div className="text-[11px] font-semibold text-rose-900">Afabarnið (Skírn 20.09.2026)</div>
                  <p className="text-[11px] text-neutral-600">
                    Fyrsta afabarn stofnanda. Heiðrað með ævilöngu heiðursfélagaskírteini án atkvæðisréttar sem tákn um framtíðina.
                  </p>
                </div>

                <div className="p-3.5 bg-amber-50/50 border border-amber-200 rounded-xl space-y-1">
                  <div className="font-bold text-neutral-900 flex items-center gap-1.5">
                    <span>🏅</span>
                    <span>Heiðursfélagi nr. 2</span>
                  </div>
                  <div className="text-[11px] font-semibold text-amber-900">Sigþrúður Guðnadóttir</div>
                  <p className="text-[11px] text-neutral-600">
                    Kjörin á 1. aðalfundi fyrir ómetanlegan stuðning, tryggð og hvatningu. Án almenns atkvæðisréttar en fer með <strong>oddaatkvæðisrétt</strong> komi upp atkvæðajafnræði í stjórn.
                  </p>
                </div>

                <div className="p-3.5 bg-neutral-100 border border-neutral-300 rounded-xl space-y-1">
                  <div className="font-bold text-neutral-900 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-neutral-700" />
                    <span>Dílajörð ehf.</span>
                  </div>
                  <div className="text-[11px] font-semibold text-neutral-800">Faglegur Bakhjarl</div>
                  <p className="text-[11px] text-neutral-600">
                    Sérfræðiráðgjöf sem tryggir um leið vettvang fyrir launaða námsreynslu krakkanna.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: STOFNGÖGN */}
          {activeTab === 'documents' && (
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-neutral-900">Opinber lög og stofnskrá Ríkisgát</div>
                  <div className="text-[11px] text-neutral-500">Samþykkt á stofnfundi 18. september 2026</div>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                  Lögmætt félag
                </span>
              </div>

              <div className="space-y-3 font-serif bg-neutral-50/50 p-4 rounded-xl border border-neutral-300 text-neutral-800 leading-relaxed text-[11px]">
                <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-neutral-900">
                  Útdráttur úr 2. grein (Markmið og tilgangur):
                </h4>
                <blockquote className="border-l-2 border-neutral-400 pl-3 italic text-neutral-700">
                  „Tilgangur félagsins er að auka gagnsæi í ríkisfjármálum og gera opinber gögn um bókhald og eyðslu ríkissjóðs aðgengilegri og skiljanlegri fyrir almenning. Félagið mun reka heimasíðuna rikisgat.is til þess að safna saman, greina og birta ríkisreikninga og tengd gögn á skýran og notendavænan máta. Samhliða því er markmið félagsins að auka hæfni ungs fólks í félagsstarfi, ákvörðunartöku og eigin fyrirtækjarekstri með hagnýtri þátttöku í verkefnum félagsins. Félagið er rekið án fjárhagslegs ávinnings (ekki í hagnaðarskyni).“
                </blockquote>

                <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-neutral-900 pt-2">
                  Útdráttur úr 5. lið fundargerðar (Fjármögnun):
                </h4>
                <blockquote className="border-l-2 border-neutral-400 pl-3 italic text-neutral-700">
                  „Samþykkt var að söfnun fyrir rekstrarkostnaði muni fara fram á heimasíðunni sjálfri. Reksturinn mun byggjast á frjálsum sjálfboðaframlögum og styrkjum frá almenningi og þeim sem hafa áhuga á starfsemi félagsins. Félagið mun ekki krefjast endurgjalds eða selja þjónustu fyrir þessi framlög.“
                </blockquote>

                <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-neutral-900 pt-2">
                  Útdráttur úr 7. lið fundargerðar (Heiðursfélagar):
                </h4>
                <blockquote className="border-l-2 border-neutral-400 pl-3 italic text-neutral-700">
                  „Samþykkt var einróma að bjóða fyrsta afabarni stofnanda stöðu Heiðursfélaga nr. 1 í tilefni skírnardags þess 20. september 2026. Þá var samþykkt að gera Sigþrúði Guðnadóttur að Heiðursfélaga nr. 2 í félaginu í þakklætisskyni fyrir ómetanlegan stuðning og traust við stofnunina. Heiðursfélagar njóta sérstakrar viðurkenningar og boðs á alla opna fundi og viðburði félagsins án almenns atkvæðisréttar, að því undanskildu að Heiðursfélagi nr. 2 (Sigþrúður Guðnadóttir) fær oddaatkvæðisrétt til að skera úr málum komi upp jafntefli við atkvæðagreiðslur í stjórn félagsins.“
                </blockquote>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-neutral-100 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-neutral-500 text-[11px] text-center sm:text-left">
            Takk fyrir að sýna Ríkisgát áhuga og stuðning! ❤️
          </div>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-xl transition cursor-pointer"
          >
            Loka glugga
          </button>
        </div>
      </div>
    </div>
  );
};

