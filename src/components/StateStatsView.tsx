import React from 'react';
import { 
  Landmark, Users, Coins, FileText, ArrowLeft, TrendingUp, Building2, 
  HelpCircle, Calendar, ShieldCheck, CheckCircle2 
} from 'lucide-react';
import { formaTolu } from '../utils/icelandicFormatters';

interface StateStatsViewProps {
  onBackToPortal: () => void;
  onOpenDiscussions: () => void;
}

export const StateStatsView: React.FC<StateStatsViewProps> = ({
  onBackToPortal,
  onOpenDiscussions
}) => {
  // Samantektartölur úr opinberum gögnum (Fjársýslan, Hagstofa og ríkisreikningur)
  const stats = [
    {
      title: 'Starfsmannafjöldi ríkisins',
      value: '26.850',
      unit: 'stöðugildi / starfsmenn',
      desc: 'Áætlaður fjöldi stöðugilda hjá A-hluta stofnunum ríkisins.',
      icon: Users,
      trend: '+1,2% frá fyrra ári',
      color: 'bg-blue-50 text-blue-800 border-blue-200'
    },
    {
      title: 'Heildarlaunakostnaður ríkisins',
      value: '318.400.000.000',
      unit: 'kr. á ári (~26,5 ma. kr./mán)',
      desc: 'Heildargreiðslur launa og launatengdra gjalda ríkisstarfsmanna.',
      icon: Coins,
      trend: 'Stærsti einstaki rekstrarliðurinn',
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200'
    },
    {
      title: 'Heildarútgjöld ríkissjóðs',
      value: '1.450.000.000.000',
      unit: 'kr. á ársgrundvelli',
      desc: 'Heildargjöld ríkissjóðs samkvæmt fjárlögum (rekstur, tilfærslur, fjárfestingar).',
      icon: Landmark,
      trend: '~120 milljarðar kr. á mánuði',
      color: 'bg-neutral-50 text-neutral-800 border-neutral-200'
    },
    {
      title: 'Opinberar nefndir og starfshópar',
      value: '280+',
      unit: 'virkar nefndir og ráð',
      desc: 'Fastanefndir, starfshópar og nefndarsetur á vegum ráðuneyta.',
      icon: Building2,
      trend: 'Sérstök rýni í undirbúningi',
      color: 'bg-purple-50 text-purple-800 border-purple-200'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner with Icelandic flag and title */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
        {/* Subtle decorative flag bar at top */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#02529C] via-white to-[#DC1E35]"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            {/* Icelandic flag badge */}
            <div className="w-14 h-10 rounded-lg overflow-hidden border border-neutral-300 shadow-xs relative flex-shrink-0">
              <div className="absolute inset-0 bg-[#02529C]"></div>
              <div className="absolute top-0 bottom-0 left-[30%] w-[18%] bg-white"></div>
              <div className="absolute left-0 right-0 top-[35%] h-[28%] bg-white"></div>
              <div className="absolute top-0 bottom-0 left-[34%] w-[10%] bg-[#DC1E35]"></div>
              <div className="absolute left-0 right-0 top-[40%] h-[18%] bg-[#DC1E35]"></div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900">
                  Ríkið í tölum
                </h1>
                <span className="bg-blue-100 text-blue-900 text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-200">
                  Lykilstærðir
                </span>
              </div>
              <p className="text-xs sm:text-sm text-neutral-500 mt-1 max-w-2xl">
                Yfirlit yfir stærstu tölur íslenska ríkisins: laun, starfsmannafjölda, mánaðarútgjöld og nefndir.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onBackToPortal}
              className="px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer border border-neutral-300"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Aftur í reikninga</span>
            </button>

            <button
              onClick={onOpenDiscussions}
              className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>Ræða þessar tölur</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Key Mega-Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div 
              key={idx}
              className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between hover:border-neutral-300 transition"
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                    {s.title}
                  </span>
                  <div className={`p-2 rounded-xl border ${s.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                <div className="text-2xl sm:text-3xl font-black font-mono text-neutral-900 tracking-tight">
                  {s.value}
                </div>
                <div className="text-xs font-bold text-neutral-600 mt-0.5">
                  {s.unit}
                </div>

                <p className="text-xs text-neutral-500 mt-3 leading-relaxed">
                  {s.desc}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
                <span className="font-semibold text-neutral-700">{s.trend}</span>
                <span className="text-[11px] font-mono text-neutral-400">Opinber gögn</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info card regarding official heraldry & data sources */}
      <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-5 text-xs text-neutral-600 space-y-2">
        <div className="flex items-center gap-2 font-bold text-neutral-900">
          <ShieldCheck className="w-4 h-4 text-neutral-700" />
          <span>Gagnauppsprettur og merki</span>
        </div>
        <p className="leading-relaxed">
          Tölur eru unnar upp úr opinberum gögnum Fjársýslu ríkisins (opnirreikningar.is), Ríkisreikningi, Fjárlögum og Hagstofu Íslands.
          Vefurinn notar lögmætan íslenskan fána og táknmyndir í samræmi við lög um þjóðfána og ríkisheiti.
        </p>
      </div>
    </div>
  );
};
