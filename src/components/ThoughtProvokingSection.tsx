import React, { useState, useEffect } from 'react';
import { 
  Scale, AlertTriangle, Building2, HelpCircle, Check, 
  ChevronDown, ChevronUp, BarChart2, Heart, ShieldCheck, Sparkles 
} from 'lucide-react';

interface ThoughtProvokingSectionProps {
  onOpenWhistleblower?: (data?: { institution?: string; supplier?: string }) => void;
  onOpenSupport?: () => void;
  className?: string;
  defaultExpanded?: boolean;
}

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

const INITIAL_POLL_DATA: PollOption[] = [
  {
    id: 'styrkir',
    text: 'Já, klárlega! Sérstaklega styrkveitingar og samfélagssjóði',
    votes: 412
  },
  {
    id: 'risna_radgjof',
    text: 'Já, vil líka sjá risnu, ráðgjafakaup og stjórnendakostnað',
    votes: 218
  },
  {
    id: 'bara_a_hluti',
    text: 'Nei, nóg er að fylgjast vel með A-hluta ríkisins',
    votes: 27
  }
];

export const ThoughtProvokingSection: React.FC<ThoughtProvokingSectionProps> = ({
  onOpenWhistleblower,
  onOpenSupport,
  className = '',
  defaultExpanded = true
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  
  // Interactive poll state with localStorage persistence
  const [pollOptions, setPollOptions] = useState<PollOption[]>(() => {
    try {
      const saved = localStorage.getItem('rikisgat_b_poll_counts');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_POLL_DATA;
  });

  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('rikisgat_b_poll_user_choice');
    } catch {
      return null;
    }
  });

  const [hasVoted, setHasVoted] = useState<boolean>(() => {
    try {
      return !!localStorage.getItem('rikisgat_b_poll_user_choice');
    } catch {
      return false;
    }
  });

  const totalVotes = pollOptions.reduce((acc, curr) => acc + curr.votes, 0);

  const handleVote = (optionId: string) => {
    const prevOption = selectedOptionId;
    setSelectedOptionId(optionId);
    setHasVoted(true);

    setPollOptions(prev => {
      const updated = prev.map(opt => {
        if (opt.id === optionId) {
          return { ...opt, votes: opt.votes + 1 };
        }
        if (prevOption && opt.id === prevOption) {
          return { ...opt, votes: Math.max(0, opt.votes - 1) };
        }
        return opt;
      });

      try {
        localStorage.setItem('rikisgat_b_poll_counts', JSON.stringify(updated));
        localStorage.setItem('rikisgat_b_poll_user_choice', optionId);
      } catch {
        // storage disabled or full
      }

      return updated;
    });
  };

  const handleResetVote = () => {
    if (!selectedOptionId) return;
    const currentOption = selectedOptionId;
    setSelectedOptionId(null);
    setHasVoted(false);

    setPollOptions(prev => {
      const updated = prev.map(opt => {
        if (opt.id === currentOption) {
          return { ...opt, votes: Math.max(0, opt.votes - 1) };
        }
        return opt;
      });

      try {
        localStorage.setItem('rikisgat_b_poll_counts', JSON.stringify(updated));
        localStorage.removeItem('rikisgat_b_poll_user_choice');
      } catch {
        // ignore
      }

      return updated;
    });
  };

  return (
    <section 
      id="til-umhugsunar-section"
      className={`bg-white border-2 border-neutral-900 rounded-xl overflow-hidden shadow-xs ${className}`}
    >
      {/* Header bar */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-5 sm:p-6 bg-neutral-900 text-white flex items-center justify-between gap-4 cursor-pointer select-none transition hover:bg-neutral-800"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white text-neutral-900 flex items-center justify-center shrink-0 font-black">
            <Scale className="w-5 h-5 text-neutral-900" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] uppercase font-black tracking-wider bg-white/20 text-white px-2 py-0.5 rounded">
                Gagnrýnin rýni
              </span>
              <span className="text-xs text-neutral-400 font-mono">Upplýsingalög & Ríkisbókhald</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight text-white mt-0.5">
              Til umhugsunar: Bókhaldslyklar, duldar styrkveitingar og B-hlutinn
            </h2>
          </div>
        </div>

        <button 
          type="button"
          className="text-neutral-300 hover:text-white flex items-center gap-1 text-xs font-bold shrink-0 bg-neutral-800 px-3 py-1.5 rounded-lg border border-neutral-700 cursor-pointer"
          aria-label={isExpanded ? 'Fela kafla' : 'Opna kafla'}
        >
          <span className="hidden sm:inline">{isExpanded ? 'Loka' : 'Lesa'}</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isExpanded && (
        <div className="p-5 sm:p-7 space-y-8 bg-neutral-50/50">
          {/* Scope notice banner: This portal is A-hluti; B-hluti is planned as a separate module */}
          <div className="bg-neutral-900 text-white rounded-xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-neutral-800">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-white text-neutral-950 px-2 py-0.5 rounded">
                  Afmörkun verkefnis
                </span>
                <span className="text-xs font-bold text-neutral-300">
                  Ríkisgát er eingöngu A-hluti ríkisins
                </span>
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed max-w-3xl">
                Þetta viðmót og reikningagáttin ná <strong>eingöngu yfir A-hluta ríkisins</strong> (ráðuneyti og A-hluta stofnanir). 
                B-hlutinn — opinber hlutafélög og ríkisfyrirtæki á borð við <em>Landsvirkjun</em>, <em>Isavia</em> og <em>RARIK</em> — 
                er nú í sérstöku undirbúningsferli sem opin gátt og hluti af Ríkisgát samfélaginu.
              </p>
            </div>

            {onOpenSupport && (
              <button
                type="button"
                onClick={onOpenSupport}
                className="px-3.5 py-2 bg-white hover:bg-neutral-100 text-neutral-950 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
              >
                <Heart className="w-3.5 h-3.5 text-neutral-900 fill-current" />
                <span>Viltu styrkja okkur?</span>
              </button>
            )}
          </div>

          <p className="text-sm text-neutral-700 leading-relaxed font-medium">
            Þegar rýnt er í opinber útgjöld á Íslandi er mikilvægt að átta sig á því hvernig fjármunir 
            eiga lögum samkvæmt að bókast og hvaða rétt borgarar hafa til að krefjast gagna, 
            einnig frá opinberum hlutafélögum og fyrirtækjum í B-hluta ríkisins.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 1. Spurning */}
            <div className="bg-white border border-neutral-300 rounded-xl p-5 shadow-2xs flex flex-col justify-between space-y-3">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-neutral-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    1
                  </span>
                  <h3 className="text-sm font-bold text-neutral-900 leading-snug">
                    Er hægt að bóka styrk á eitthvað annað en styrktarveitingu?
                  </h3>
                </div>

                <div className="text-xs text-neutral-700 space-y-2 leading-relaxed">
                  <p>
                    <strong>Tæknilega séð</strong> er hægt að bóka fjármuni á rangan lykil í bókhaldskerfinu 
                    (t.d. sem <em>„aðkeypta þjónustu“</em>, <em>„sérfræðiaðstoð“</em> eða <em>„rekstrarkostnað“</em>), 
                    en samkvæmt reglum um bókhald ríkisins er það <strong>algerlega óheimilt</strong>.
                  </p>
                  <p>
                    Öll útgjöld ríkisins eiga að bókast á svokallaðan <strong>viðskiptalykil</strong> sem lýsir 
                    raunverulegu eðli útgjaldanna.
                  </p>
                  <p className="bg-neutral-100 p-2.5 rounded border border-neutral-200 text-neutral-900 font-medium">
                    Ef um er að ræða framlag sem veitt er án þess að ríkið fái beina vöru eða þjónustu á móti 
                    (sem er skilgreiningin á styrk), <strong>verður það að bókast sem styrkur eða tilfærsla</strong>.
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Spurning */}
            <div className="bg-white border border-neutral-300 rounded-xl p-5 shadow-2xs flex flex-col justify-between space-y-3">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-neutral-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    2
                  </span>
                  <h3 className="text-sm font-bold text-neutral-900 leading-snug">
                    Er það lögbrot ef bókað er á vitlausum lykli?
                  </h3>
                </div>

                <div className="text-xs text-neutral-700 space-y-2 leading-relaxed">
                  <div className="p-2 bg-neutral-900 text-white rounded font-bold text-xs flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Já, það brýtur gegn lögum.</span>
                  </div>
                  <p>
                    Ef ríkisstofnun eða ráðuneyti bókar styrk viljandi á annan lykil til að fela útgjöldin eða 
                    láta þau líta út eins og eitthvað annað, brýtur það í bága við <strong>lög um fjárreiður ríkisins</strong> og 
                    <strong> lög um Ríkisendurskoðun</strong>.
                  </p>
                  <div className="border-t border-neutral-200 pt-2">
                    <p className="font-bold text-neutral-900 mb-1">Afleiðingar:</p>
                    <p>
                      Ríkisendurskoðun gerir alvarlegar athugasemdir við slíkt í endurskoðunarskýrslum sínum. 
                      Ef um er að ræða ásetning til að leyna fjármunum eða blekkja Alþingi getur það varðað 
                      <strong> embættisglöp eða refsingu samkvæmt almennum hegningarlögum</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Spurning */}
            <div className="bg-white border border-neutral-300 rounded-xl p-5 shadow-2xs flex flex-col justify-between space-y-3">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-neutral-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    3
                  </span>
                  <h3 className="text-sm font-bold text-neutral-900 leading-snug">
                    Hvað með B-hlutann og Upplýsingalög?
                  </h3>
                </div>

                <div className="text-xs text-neutral-700 space-y-2 leading-relaxed">
                  <p>
                    Samkvæmt íslenskum upplýsingalögum er <strong>B-hlutinn almennt ekki undanþeginn upplýsingarbeiðnum</strong>. 
                    Lögin ná yfir alla lögaðila sem eru að <strong>51% hluta eða meira</strong> í eigu hins opinbera.
                  </p>
                  <p>
                    Hins vegar gilda ákveðnar undantekningar og takmarkanir um B-hluta fyrirtæki 
                    (eins og <em>Landsvirkjun</em>, <em>Isavia</em> eða <em>opinber hlutafélög</em>) sem gott er að hafa í huga.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed B-Hluti Breakdown Table */}
          <div className="bg-white border border-neutral-300 rounded-xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-neutral-800" />
                <h3 className="text-sm font-black uppercase text-neutral-900 tracking-tight">
                  B-Hluti ríkisins: Hvað má fá og hvað má undanþiggja?
                </h3>
              </div>
              <span className="text-[11px] font-mono text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">
                Upplýsingalög nr. 140/2012
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Hvað má fá */}
              <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-300 space-y-2">
                <div className="font-bold text-neutral-900 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-neutral-900" />
                  Hvað á almenningur rétt á að fá?
                </div>
                <ul className="space-y-2 text-neutral-700 leading-relaxed list-disc list-inside">
                  <li>
                    <strong>Almennar styrkveitingar:</strong> Styrkir til samfélagsverkefna, menningarmála eða 
                    íþróttafélaga eiga að vera opnir og aðgengilegir öllum.
                  </li>
                  <li>
                    <strong>Stjórnsýslugögn:</strong> Upplýsingar um fundargerðir stjórna, laun stjórnenda og 
                    opinberar stjórnvaldsákvarðanir.
                  </li>
                </ul>
              </div>

              {/* Hvað má fela/undanþiggja */}
              <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-300 space-y-2">
                <div className="font-bold text-neutral-900 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-neutral-400" />
                  Hvað má undanþiggja eða fela?
                </div>
                <ul className="space-y-2 text-neutral-700 leading-relaxed list-disc list-inside">
                  <li>
                    <strong>Samkeppnishagsmunir:</strong> Gögn um viðskipti eða samninga sem gætu skaðað 
                    stöðu fyrirtækisins í virkri samkeppni á markaði.
                  </li>
                  <li>
                    <strong>Fyrirtæki í kauphöll:</strong> Lögin gilda ekki um opinber hlutafélög sem hafa verið 
                    skráð á almennan hlutabréfamarkað (eins og t.d. Landsbankann).
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Interactive Poll Section: Public Interest in B-hluti */}
          <div 
            id="b-hluti-skodanakonnun" 
            className="bg-white border-2 border-neutral-900 rounded-xl p-5 sm:p-6 shadow-xs space-y-5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-neutral-900" />
                  <span className="text-[10px] font-black uppercase tracking-wider bg-neutral-100 text-neutral-800 px-2 py-0.5 rounded border border-neutral-300">
                    Skoðunarkönnun
                  </span>
                  <span className="text-xs font-mono text-neutral-500">
                    {totalVotes.toLocaleString('is-IS')} svör
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black uppercase text-neutral-900 tracking-tight mt-1">
                  Hefðir þú áhuga á að B-hluti ríkisins verði rýndur og opnaður líka?
                </h3>
              </div>

              {onOpenSupport && (
                <button
                  type="button"
                  onClick={onOpenSupport}
                  className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs self-start sm:self-center"
                  title="Styðja áframhaldandi þróun og opnun B-hlutans"
                >
                  <Heart className="w-3.5 h-3.5 fill-current text-white" />
                  <span>Viltu styðja okkur?</span>
                </button>
              )}
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              Við erum að meta áhuga samfélagsins á að stækka Ríkisgát yfir í opna gátt fyrir 
              B-hluta ríkisfyrirtækja (opinber hlutafélög, samfélagsstyrki og rekstrarkostnað). 
              Hver er þín afstaða?
            </p>

            {/* Poll options list */}
            <div className="space-y-3">
              {pollOptions.map((opt) => {
                const percentage = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                const isSelected = selectedOptionId === opt.id;

                return (
                  <div
                    key={opt.id}
                    onClick={() => handleVote(opt.id)}
                    className={`relative p-3.5 sm:p-4 rounded-xl border transition cursor-pointer overflow-hidden ${
                      isSelected 
                        ? 'border-neutral-900 bg-neutral-100/90 shadow-2xs ring-1 ring-neutral-900' 
                        : 'border-neutral-300 bg-white hover:border-neutral-500 hover:bg-neutral-50'
                    }`}
                  >
                    {/* Visual Progress fill if voted */}
                    {hasVoted && (
                      <div 
                        className={`absolute inset-y-0 left-0 transition-all duration-500 ${
                          isSelected ? 'bg-neutral-900/10' : 'bg-neutral-200/50'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    )}

                    <div className="relative flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition ${
                          isSelected 
                            ? 'border-neutral-900 bg-neutral-900 text-white' 
                            : 'border-neutral-400 bg-white'
                        }`}>
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                        <span className={`font-semibold ${isSelected ? 'text-neutral-950 font-bold' : 'text-neutral-800'}`}>
                          {opt.text}
                        </span>
                      </div>

                      {hasVoted && (
                        <div className="flex items-center gap-2 shrink-0 font-mono text-xs">
                          <span className="font-bold text-neutral-900">{percentage}%</span>
                          <span className="text-[11px] text-neutral-500 hidden sm:inline">({opt.votes})</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom status and support prompt */}
            <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-neutral-600">
              <div className="flex items-center gap-2 flex-wrap">
                {hasVoted ? (
                  <>
                    <span className="font-bold text-neutral-900 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-neutral-900" /> Þitt atkvæði er skráð.
                    </span>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={handleResetVote}
                      className="text-neutral-500 hover:text-neutral-900 underline cursor-pointer"
                    >
                      Breyta atkvæði
                    </button>
                  </>
                ) : (
                  <span className="text-neutral-500 italic">
                    Smelltu á einn valkost hér að ofan til að greiða atkvæði.
                  </span>
                )}
                <span>•</span>
                <span className="text-neutral-500">
                  Allar skoðanakannanir verkefnisins eru einnig aðgengilegar undir <strong>Markaðsstjórn & Vörumerki</strong>.
                </span>
              </div>

              {onOpenWhistleblower && (
                <button
                  type="button"
                  onClick={() => onOpenWhistleblower()}
                  className="text-neutral-600 hover:text-neutral-900 underline cursor-pointer shrink-0"
                >
                  Lumar þú á ábendingu um B-hlutann? Senda ábendingu →
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
