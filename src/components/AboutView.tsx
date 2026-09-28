import React, { useState } from 'react';
import { 
  Shield, 
  FileText, 
  Scale, 
  Search, 
  Users, 
  MessageSquare, 
  Server, 
  Mail, 
  ArrowLeft, 
  CheckCircle2, 
  ExternalLink, 
  Lock, 
  Database,
  Send,
  Sparkles,
  Info,
  Heart
} from 'lucide-react';
import { ThoughtProvokingSection } from './ThoughtProvokingSection';

interface AboutViewProps {
  onBackToPortal: () => void;
  onOpenDashboard?: () => void;
  onOpenSupport?: () => void;
}

export const AboutView: React.FC<AboutViewProps> = ({ onBackToPortal, onOpenDashboard, onOpenSupport }) => {
  const [feedbackCategory, setFeedbackCategory] = useState<'spjallbord' | 'abending' | 'hugmynd'>('spjallbord');
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackEmail, setFeedbackEmail] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    setFeedbackSubmitted(true);
    setTimeout(() => {
      setFeedbackText('');
      setFeedbackEmail('');
    }, 3000);
  };

  return (
    <div id="about-page-container" className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Top Breadcrumb / Return Action */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <button
          id="about-back-btn"
          onClick={onBackToPortal}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-neutral-100 text-neutral-900 border border-neutral-300 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Aftur á forsíðu (Reikningar)</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-mono text-neutral-500">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Ríkisgát: Borgaralegt gagnsæistól</span>
        </div>
      </div>

      {/* Hero Section */}
      <section 
        id="about-hero-section"
        className="bg-white border-2 border-neutral-900 rounded-2xl p-6 sm:p-10 shadow-xs relative overflow-hidden"
      >
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 border border-neutral-300 text-neutral-800 text-xs font-bold uppercase tracking-wider">
            <Info className="w-3.5 h-3.5 text-neutral-600" />
            <span>Um verkefnið og tilgang þess</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-neutral-900 leading-tight">
            Hvert fara skattpeningarnir okkar?
          </h1>

          <p className="text-base sm:text-lg text-neutral-700 leading-relaxed font-normal">
            <strong>Ríkisgát</strong> er óháð, opið borgaraverkefni hannað til að veita almenningi, blaðamönnum, 
            fræðafólki og kjósendum einfalt, aðgengilegt og leifturhraðvirkt yfirlit yfir öll opinber 
            útgjöld og greidda reikninga íslenska ríkisins.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-8 border-t border-neutral-200">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0 border border-neutral-200 text-neutral-900 font-bold">
              1
            </div>
            <div>
              <h2 className="text-xs font-bold text-neutral-900 uppercase">Gegnsæi</h2>
              <p className="text-xs text-neutral-600 mt-0.5">Opinber gögn eiga að vera aðgengileg öllum án hindrana.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0 border border-neutral-200 text-neutral-900 font-bold">
              2
            </div>
            <div>
              <h2 className="text-xs font-bold text-neutral-900 uppercase">Aðhald</h2>
              <p className="text-xs text-neutral-600 mt-0.5">Borgaralegt eftirlit styrkir lýðræðislega stjórnsýslu.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0 border border-neutral-200 text-neutral-900 font-bold">
              3
            </div>
            <div>
              <h2 className="text-xs font-bold text-neutral-900 uppercase">Réttur til gagna</h2>
              <p className="text-xs text-neutral-600 mt-0.5">Upplýsingalög 140/2012 tryggja rétt þinn til fylgiskjala.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Mission & Why It Exists */}
      <section id="about-mission-section" className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-neutral-300 rounded-xl p-6 shadow-2xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-900 flex items-center justify-center border border-neutral-200">
            <Search className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-neutral-900">Af hverju Ríkisgát?</h2>
          <p className="text-sm text-neutral-600 leading-relaxed">
            Á vefnum <em>opnirreikningar.is</em> birtir ríkið mánaðarlega lista yfir greidda reikninga. 
            Hins vegar hefur reynst erfitt fyrir almenning að bera saman útgjöld milli ára, skoða heildarviðskipti 
            stakra birgja við margar stofnanir samtímis eða finna mynstur í opinberum innkaupum.
          </p>
          <p className="text-sm text-neutral-600 leading-relaxed">
            Ríkisgát safnar þessum gögnum saman í einn samræmdan, leitarhæfan grunn þar sem hægt er að kafa 
            ofan í tölurnar á sekúndubroti.
          </p>
        </div>

        <div className="bg-white border border-neutral-300 rounded-xl p-6 shadow-2xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-900 flex items-center justify-center border border-neutral-200">
            <Scale className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-neutral-900">Upplýsingaréttur almennings</h2>
          <p className="text-sm text-neutral-600 leading-relaxed">
            Samkvæmt <strong>upplýsingalögum nr. 140/2012</strong> á hver einasti einstaklingur rétt á að krefjast 
            þess að fá afrit af einstökum reikningum, verksamningum og fylgiskjölum frá öllum ráðuneytum 
            og ríkisstofnunum.
          </p>
          <p className="text-sm text-neutral-600 leading-relaxed">
            Ríkisgát býr sjálfkrafa til <strong>tilbúna lögfræðilega kröfugerð</strong> með réttum tilvísunum 
            í lögin sem þú getur afritað eða opnað beint í tölvupóstforritinu þínu með einum smelli.
          </p>
        </div>
      </section>

      {/* Thought Provoking: Accounting codes, hidden grants & B-entity rules */}
      <ThoughtProvokingSection defaultExpanded={true} onOpenSupport={onOpenSupport} />

      {/* Data Source & Privacy */}
      <section id="about-data-section" className="bg-white border border-neutral-300 rounded-xl p-6 sm:p-8 shadow-2xs space-y-6">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-neutral-700" />
            Hvaðan koma gögnin?
          </h2>
          <p className="text-sm text-neutral-600 mt-1">
            Öll gögn sem birtast á Ríkisgát eru fengin úr opinberum, lögformlegum gagnabönkum íslenska ríkisins.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-200">
            <h3 className="text-xs font-bold text-neutral-900 uppercase">Fjársýsla ríkisins / Opnir reikningar</h3>
            <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
              Mánaðarlegar útgjaldaskýrslur ríkisstofnana yfir árin 2017 til 2026. Gögnin innihalda heiti stofnunar, 
              heiti birgja, dagsetningu, reikningsnúmer og heildarupphæð.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-200">
            <h3 className="text-xs font-bold text-neutral-900 uppercase">Persónuvernd og lögmæti</h3>
            <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
              Ríkisgát skráir eingöngu opinber gögn ríkisstofnana og lögaðila. Kerfið hýsir engin persónugreinanleg 
              einkagögn né upplýsingar um notendur vefsins.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-neutral-900 text-white flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Server className="w-5 h-5 text-neutral-300 shrink-0" />
            <div className="text-xs">
              <span className="font-bold">Örugg skýjahýsing í Evrópu:</span>{' '}
              <span className="text-neutral-300">Netþjónar Ríkisgát eru staðsettir í Finnlandi og Þýskalandi (Hetzner Cloud) og lúta evrópskum GDPR persónuverndarstöðlum.</span>
            </div>
          </div>
        </div>
      </section>

      {/* Community & Future Ideas (Spjallborð / Umræðuvettvangur) */}
      <section id="about-community-section" className="bg-white border-2 border-neutral-900 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-700 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Framtíðarsýn & Samfélag</span>
          </div>
          <h2 className="text-2xl font-black uppercase text-neutral-900">
            Viltu taka þátt í samfélaginu eða spjallborði?
          </h2>
          <p className="text-sm text-neutral-600 leading-relaxed">
            Við erum að kanna áhuga á að opna <strong>málefnalegt spjallborð og ábendingavettvang</strong> fyrir 
            Ríkisgát. Hugmyndin er að notendur, rannsakendur og almenningur geti:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-neutral-900">
              <MessageSquare className="w-4 h-4 text-neutral-700" />
              <span>Deilt niðurstöðum</span>
            </div>
            <p className="text-xs text-neutral-600">
              Bent á óvenjulegar greiðslur, athyglisverða reikninga eða þróun sem vert er að skoða betur.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-neutral-900">
              <Users className="w-4 h-4 text-neutral-700" />
              <span>Samvinnurannsóknir</span>
            </div>
            <p className="text-xs text-neutral-600">
              Borgarar og blaðamenn geta unnið saman að því að óska eftir gögnum og rýna í verkefni.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-neutral-900">
              <Shield className="w-4 h-4 text-neutral-700" />
              <span>Öruggar ábendingar</span>
            </div>
            <p className="text-xs text-neutral-600">
              Send inn ábendingar um útgjöld sem þarfnast sérstakrar athugunar hjá eftirlitsaðilum.
            </p>
          </div>
        </div>

        {/* Feedback / Interest Form */}
        <div className="bg-neutral-50 p-5 rounded-xl border border-neutral-300">
          <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider mb-2">
            Hvað finnst þér? Sendu okkur línu eða hugmynd:
          </h3>

          {feedbackSubmitted ? (
            <div className="p-4 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-lg text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Takk kærlega fyrir skilaboðin! Við tökum þetta með í hönnun samfélagsvettvangsins.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmitFeedback} className="space-y-3">
              <div className="flex gap-2 flex-wrap text-xs">
                <button
                  type="button"
                  onClick={() => setFeedbackCategory('spjallbord')}
                  className={`px-3 py-1 rounded font-bold cursor-pointer transition ${
                    feedbackCategory === 'spjallbord'
                      ? 'bg-neutral-900 text-white'
                      : 'bg-white text-neutral-700 border border-neutral-300'
                  }`}
                >
                  💬 Áhugi á spjallborði
                </button>
                <button
                  type="button"
                  onClick={() => setFeedbackCategory('abending')}
                  className={`px-3 py-1 rounded font-bold cursor-pointer transition ${
                    feedbackCategory === 'abending'
                      ? 'bg-neutral-900 text-white'
                      : 'bg-white text-neutral-700 border border-neutral-300'
                  }`}
                >
                  🔍 Ábending um reikning
                </button>
                <button
                  type="button"
                  onClick={() => setFeedbackCategory('hugmynd')}
                  className={`px-3 py-1 rounded font-bold cursor-pointer transition ${
                    feedbackCategory === 'hugmynd'
                      ? 'bg-neutral-900 text-white'
                      : 'bg-white text-neutral-700 border border-neutral-300'
                  }`}
                >
                  💡 Hugmynd að virkni
                </button>
              </div>

              <textarea
                value={feedbackText}
                onChange={e => setFeedbackText(e.target.value)}
                rows={3}
                placeholder="Hvaða virkni eða umræðuform myndi gagnast þér best á Ríkisgát?"
                className="w-full p-2.5 bg-white border border-neutral-300 rounded-lg text-xs text-neutral-900 focus:ring-2 focus:ring-neutral-900 outline-none resize-y"
                required
              />

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <input
                  type="email"
                  value={feedbackEmail}
                  onChange={e => setFeedbackEmail(e.target.value)}
                  placeholder="Netfang (valfrjálst, ef þú vilt fá svar eða prófa spjallið)"
                  className="w-full sm:w-80 p-2 bg-white border border-neutral-300 rounded-lg text-xs text-neutral-900 focus:ring-2 focus:ring-neutral-900 outline-none"
                />

                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Senda inn hugmynd</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* Founders, Story & Support Section */}
      <section id="about-founders-support-section" className="bg-gradient-to-br from-neutral-900 to-neutral-800 text-white rounded-2xl p-6 sm:p-8 space-y-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase bg-rose-500/20 text-rose-300 font-bold px-2 py-0.5 rounded border border-rose-500/30">
                Stofnskrá 18. september 2026
              </span>
              <span className="text-xs text-neutral-400">Kópavogi</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
              Almenna félagið Ríkisgát — Fjölskylduverkefni
            </h2>
          </div>

          {onOpenSupport && (
            <button
              onClick={onOpenSupport}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-xs cursor-pointer self-start sm:self-auto shrink-0"
            >
              <Heart className="w-4 h-4 fill-current" />
              <span>Viltu styrkja okkur? (Sagan & Stofngögn)</span>
            </button>
          )}
        </div>

        <p className="text-xs text-neutral-300 leading-relaxed max-w-3xl">
          Félagið <strong>Ríkisgát</strong> er almennt félag (félagasamtök) stofnað heima í Kópavogi af feðginum með það að 
          markmiði að auka gagnsæi í ríkisfjármálum og færa opinber gögn um eyðslu ríkissjóðs í hendur almennings á skýran hátt. 
          Verkefnið er rekið <strong>án fjárhagslegs ávinnings (ekki í hagnaðarskyni)</strong> og samtímis nýtt til að kenna 
          ungu fólki félagsstarf, fundarstjórn, bókfærslu og rekstur.
        </p>

        {/* Founders Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          <div className="bg-neutral-800/80 p-3.5 rounded-xl border border-neutral-700/60 space-y-1">
            <div className="text-[10px] text-neutral-400 font-mono">Formaður & Hugmynd</div>
            <div className="font-bold text-white text-xs">Rúnar Þór Jóhannsson</div>
            <div className="text-[10px] text-neutral-400 font-mono">kt. 190873-3669</div>
          </div>

          <div className="bg-neutral-800/80 p-3.5 rounded-xl border border-neutral-700/60 space-y-1">
            <div className="text-[10px] text-neutral-400 font-mono">Fundarstjóri & Tæknistjóri</div>
            <div className="font-bold text-white text-xs">Viktor Smári Rúnarsson</div>
            <div className="text-[10px] text-neutral-400 font-mono">kt. 020300-3290</div>
          </div>

          <div className="bg-neutral-800/80 p-3.5 rounded-xl border border-neutral-700/60 space-y-1">
            <div className="text-[10px] text-neutral-400 font-mono">Fundarritari & Samskiptastjóri</div>
            <div className="font-bold text-white text-xs">Rakel Anna Rúnarsdóttir</div>
            <div className="text-[10px] text-neutral-400 font-mono">kt. 190804-3720</div>
          </div>

          <div className="bg-neutral-800/80 p-3.5 rounded-xl border border-neutral-700/60 space-y-1">
            <div className="text-[10px] text-amber-300 font-mono">Gagnarýnir & Verðandi gjaldkeri</div>
            <div className="font-bold text-white text-xs">Óðinn Rúnarsson</div>
            <div className="text-[10px] text-neutral-400 font-mono">kt. 190907-3680</div>
          </div>
        </div>

        {/* Bank transfer box (Reserved status) */}
        <div className="bg-neutral-950/60 border border-neutral-800 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <div className="font-bold text-amber-400 flex items-center gap-1.5">
              <span>⏳ Bankaupplýsingar — Frátekið svæði:</span>
              <span className="text-neutral-300 font-normal">Stofnun félagsins í vinnslu hjá Skattinum (RSK 5.03)</span>
            </div>
            <div className="text-[11px] text-neutral-400">
              Bankareikningur verður birtur um leið og félaginu Ríkisgát hefur verið úthlutað sjálfstæðri kennitölu.
            </div>
          </div>

          {onOpenSupport && (
            <button
              onClick={onOpenSupport}
              className="text-xs font-bold text-rose-400 hover:text-rose-300 underline cursor-pointer self-start sm:self-auto shrink-0"
            >
              Lesa alla söguna & skoða stofnskrá →
            </button>
          )}
        </div>
      </section>

      {/* Legal Disclaimer & Footer */}
      <section id="about-disclaimer-section" className="bg-neutral-100 border border-neutral-300 rounded-xl p-5 text-xs text-neutral-600 space-y-2">
        <h3 className="font-bold text-neutral-800 uppercase tracking-wider">
          Fyrirvari og ábyrgð
        </h3>
        <p className="leading-relaxed">
          Ríkisgát er sjálfstætt borgaraverkefni og hefur engin tengsl við stjórnmálaflokka, ráðuneyti eða ríkisstofnanir. 
          Upplýsingar á vefnum eru byggðar á opinberum skrám eins og þær eru birtar af opinberum aðilum. 
          Greiðslur geta innihaldið leiðréttingar, endurgreiðslur eða bókhaldsfærslur sem skýrast betur í fylgiskjölum 
          hverrar stofnunar. Ríkisgát hvetur notendur til að óska eftir gögnum beint frá viðeigandi stofnun til staðfestingar.
        </p>
      </section>

      {/* Bottom Back Button */}
      <div className="flex justify-center pt-4">
        <button
          onClick={onBackToPortal}
          className="px-6 py-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Fara aftur í reikningaleit Ríkisgát</span>
        </button>
      </div>
    </div>
  );
};
