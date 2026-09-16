import React, { useState } from 'react';
import { 
  FileText, CheckCircle2, Clock, AlertTriangle, Database, Server, 
  Layers, Shield, Share2, Copy, Check, Download, TrendingUp, Cpu, 
  Calendar, ExternalLink, HardDrive, Terminal
} from 'lucide-react';
import { DatabaseStats } from '../types';
import { formaTolu } from '../utils/icelandicFormatters';

interface StatusReportProps {
  stats: DatabaseStats;
}

export const StatusReport: React.FC<StatusReportProps> = ({ stats }) => {
  const [copied, setCopied] = useState(false);

  const reportDate = '13. september 2026';

  const fullMarkdownReport = `# RÍKISGÁT — Tæknileg & Stefnumarkandi Stöðuskýrsla
Dags: ${reportDate} | Útgáfa: 3.2 (Production Release Candidate)
Verkefni: Ríkisgát (Gegnsætt.is) — Gagnsæi & Eftirlit með Opinberum Útgjöldum
Hýsingarvettvangur: Nútímaleg Skýjahýsing (Managed Cloud PostgreSQL & Node.js / Docker)

---

## 1. Framkvæmdasamantekt (Executive Summary)
Verkefnið Ríkisgát hefur náð þeim merka áfanga að vera orðið fullbúið, leifturhraðvirkt upplýsingakerfi sem opnar fyrir almenningi og fréttamiðlum sundurliðaðar greiðslufærslur íslenska ríkisins.

Gagnagrunnurinn inniheldur nú **${formaTolu(stats.ar_2017_2025_fjoldi + stats.ar_2026_fjoldi)} reikningsfærslur** sem spanna tímabilið frá 2017 til miðs árs 2026. Með nýrri v3.0 PostgreSQL gagnagrunnshönnun, composite flýtivísum og straumlínulöguðu flokkunarkerfi hefur tekist að lækka fyrirspurnatíma úr mörgum sekúndum niður í **0,005 sekúndur** að meðaltali.

Vefurinn verður hýstur í nútímalegu **skýjaumhverfi (Cloud Infrastructure)** fremur en á hefðbundinni vefhýsingu (eins og 1984.is / cPanel / FTP). Þessi ákvörðun tryggir ótakmarkaðan sveigjanleika, sjálfvirka CI/CD dreifingu með Git, SSL dulkóðun og rekstraröryggi fyrir 18,17 milljónir færslna.

### Helstu lykiltölur verkefnisins:
- **Heildarfjöldi reikninga í PostgreSQL:** ${formaTolu(stats.ar_2017_2025_fjoldi + stats.ar_2026_fjoldi)}
- **Sögulegir reikningar (2017–2025):** ${formaTolu(stats.ar_2017_2025_fjoldi)} (100% klárað og fryst)
- **Yfirstandandi ár (2026):** ${formaTolu(stats.ar_2026_fjoldi)} færslur (nýjasti reikningur: ${stats.nyrjasta_dags})
- **Ríkisstofnanir:** ${stats.stofnanir_fjoldi} stofnanir
- **Birgjar og þjónustuaðilar:** ${formaTolu(stats.birgjar_fjoldi)} birgjar
- **Bókhaldstegundir & Flokkun:** 607 heiti straumlínulöguð í 12 aðalflokka (95,86% nákvæm flokkun)
- **Gagnagrunnsstærð:** ~4,2 GiB PostgreSQL (með vinnsluminni og flýtivísum)
- **Svarhraði á vef:** ~5–20 millisekúndur
- **Hýsingarstefna:** Skýjalausn (Render / Supabase / VPS Cloud) með sjálfvirkri Git-dreifingu

---

## 2. Gagnagrunnur v3.0 & Relational Architecture
Í eldri útgáfu (v1.0 og v2.0) var notuð ein flöt tafla þar sem nöfn stofnana og birgja voru margendurtekin yfir 18 milljón sinnum. Það leiddi til mikillar disknýtingar (>16 GiB) og hægra fyrirspurna.

Í **v3.0** var grunnurinn staðlaður (Normalized 3NF) í sex tengdar töflur:
1. \`stofnanir\` (172 raðir, 16 KiB)
2. \`birgjar\` (19.303 raðir, 1.8 MiB)
3. \`reikningar\` (18.167.314 raðir, ~4,2 GiB)
4. \`tegundir_flokkun\` (607 tegundir varpaðar í 12 yfirflokka, 64 KiB)
5. \`stjorn_verkefni\` (18 verkefnaraðir í stjórnborði)
6. \`stjorn_vorumerki\` (5 vörumerki og lénaskráningar)

### Afkastafínstilling (Indexing Strategy)
Til að tryggja að síur og topplistar vinni án Full Table Scan voru smíðaðir samsettir flýtivísar (Composite Indexes):
- \`idx_reikningar_dags (dags)\`: Fyrir tímabilssíun og árssamantektir.
- \`idx_reikningar_stofnun_dags (stofnun_id, dags, upphaed)\`: Fyrir mánaðaryfirlit og sundurliðun stofnana á 0,005s.
- \`idx_reikningar_birgir_dags (birgi_id, dags, upphaed)\`: Fyrir topp 5 birgja eftir ári, mánuði og degi.

---

## 3. Arkitektúr: Nútíma Skýjahýsing í stað 1984.is / FTP
Ákvörðun hefur verið tekin um að **hýsa vefinn í skýi** í stað hefðbundinnar deiltrar vefhýsingar (1984.is):
- **Af hverju ekki 1984.is / cPanel / FTP?**
  1. *Takmarkað vinnsluminni (RAM):* Deildar hýsingar bjóða oft aðeins upp á 512 MB – 1 GB RAM sem er ófullnægjandi fyrir 18,17 milljón færslna gagnagrunn með virkum flýtivísum í minni.
  2. *Úrelt vinnuflæði:* Handvirkt FTP flutningsferli er hægfara og villuhætt.
  3. *Skortur á sjálfvirkri skölun:* Þegar mikil aðsókn verður (t.d. við fréttaflutning eða afhjúpandi greiningar) getur deilt umhverfi fallið niður eða fengið „503 Service Unavailable“.
- **Skýjalausn (Cloud Infrastructure: Node.js API + Managed PostgreSQL):**
  - **Git Continuous Deployment (CI/CD):** Hver \`git push\` uppfærir vefinn sjálfkrafa á 60 sekúndum.
  - **Dedicated Resources:** Gagnagrunnurinn hefur tryggt vinnsluminni fyrir flýtivísa og skyndiminni.
  - **Sjálfvirkt SSL/HTTPS:** Vottorð endurnýjast sjálfkrafa án handvirkra inngripa.
  - **Sjálfvirk öryggisafrit:** Skýjaþjónustan tekur daglega afritun óháð staðbundnum tölvum.

---

## 4. Lagalegt Verkfærasett: Upplýsingalög nr. 140/2012
Ríkisgát er ekki aðeins upplýsingatorg, heldur beint lögfræðilegt aðhaldstól.
- Notandi getur valið allt að 5 reikninga með „➕ Senda inn“.
- Kerfið hópar reikninga sjálfkrafa eftir viðkomandi stofnun.
- Myndar lögformlega beiðni skv. 5. og 17. gr. upplýsingalaga nr. 140/2012 um afhendingu frumreiknings og fylgiskjala.
- Afritunarhnappur býr til fullfrágenginn texta tilbúinn til sendingar á viðkomandi stofnun.

---

## 5. Aðkallandi Forgangsverkefni (Næstu 7 dagar)
1. **Festa lén á ISNIC:** Kaupa og festa \`rikisgat.is\` (ásamt \`gegnsaett.is\` ef laust).
2. **Stilla Skýjahýsingu (Cloud Setup):** Tengja Git-geymslu við skýjaþjón (Render / Supabase / Cloud VPS), setja upp \`DATABASE_URL\` og flytja PostgreSQL grunninn yfir með \`pg_restore\`.
3. **Lénatenging við Skýið:** Tengja DNS færslur hjá ISNIC við skýjaþjóninn með sjálfvirku SSL vottorði.
4. **Tímabundin lendingarsíða:** Koma upp lendingarsíðu í skýinu með kynningu og tölvupóstskráningu fyrir opnun.
5. **Styrkjaumsókn:** Klára drög að umsókn í Tækniþróunarsjóð / Nýsköpunarsjóð.

---

## 6. Áhættumat & Tillögur
- **Skýjakostnaður vs. Álag:** Skýjalausnir henta fullkomlega þar sem hægt er að byrja smátt (t.d. á hagkvæmu skýjastigi) og stækka auðveldlega ef heimsóknir margfaldast í kjölfar fjölmiðlaumfjöllunar.
- **Sjálfvirk afritun:** Skýið sér um dagleg afrit, en auk þess er staðbundin \`backup.bat\` skrifta keyrð vikulega á D:\\afrit_rikisgat\\.
- **Gjaldtaka fyrir stórgögn:** Halda vefgáttinni opinni og ókeypis fyrir almenning en bjóða fyrirtækjum, greinendum og ráðgjöfum greiddan aðgang að heildar CSV útdráttum til að standa undir hýsingarkostnaði.
`;

  const copyReportToClipboard = () => {
    navigator.clipboard.writeText(fullMarkdownReport).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Controls */}
      <div className="bg-neutral-900 text-white p-6 rounded-xl shadow-sm border border-neutral-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Stöðuskýrsla v3.2 — Production Ready
            </span>
            <span className="text-neutral-400 text-xs">| {reportDate}</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">RÍKISGÁT: Tæknileg & Stefnumarkandi Stöðuskýrsla</h2>
          <p className="text-neutral-300 text-sm mt-1 max-w-2xl">
            Heildarúttekt á framvindu, PostgreSQL gagnagrunnshönnun v3.0 með 18,17M færslum, 12 aðalflokkum tegunda,
            stefnu um nútímalega skýjahýsingu (Managed Cloud PostgreSQL & Node.js CI/CD) og næstu forgangsskrefum.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={copyReportToClipboard}
            className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-2 border border-neutral-700 cursor-pointer"
            title="Afrita alla skýrsluna á Markdown sniði"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Afritað á klippiborð!' : 'Afrita Markdown'}
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 bg-white text-neutral-900 hover:bg-neutral-100 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Download className="w-4 h-4" />
            Prenta / Vista PDF
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Heildarfjöldi Reikninga</span>
            <Database className="w-4 h-4 text-neutral-700" />
          </div>
          <div className="text-2xl font-black tracking-tight text-neutral-900">
            {formaTolu(stats.ar_2017_2025_fjoldi + stats.ar_2026_fjoldi)}
          </div>
          <div className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> 2017–2026 í PostgreSQL 18
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Stærð Gagnagrunns</span>
            <HardDrive className="w-4 h-4 text-neutral-700" />
          </div>
          <div className="text-2xl font-black tracking-tight text-neutral-900">
            {stats.total_size_gib} GiB
          </div>
          <div className="text-xs text-blue-600 font-semibold mt-1">
            PostgreSQL (~75% plásssparnaður)
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Fyrirspurnahraði</span>
            <Cpu className="w-4 h-4 text-neutral-700" />
          </div>
          <div className="text-2xl font-black tracking-tight text-neutral-900">
            ~0,005 sek
          </div>
          <div className="text-xs text-emerald-600 font-semibold mt-1">
            Með Composite Indexes
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Stofnanir & Birgjar</span>
            <Layers className="w-4 h-4 text-neutral-700" />
          </div>
          <div className="text-2xl font-black tracking-tight text-neutral-900">
            {stats.stofnanir_fjoldi} / {formaTolu(stats.birgjar_fjoldi)}
          </div>
          <div className="text-xs text-neutral-500 font-medium mt-1">
            3NF tengdar töflur
          </div>
        </div>
      </div>

      {/* 1. KAFLI: FRAMKVÆMDASAMANTEKT & TILGANGUR */}
      <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-xs space-y-4">
        <div className="flex items-center gap-3 border-b border-neutral-100 pb-3">
          <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-bold text-sm">
            1
          </div>
          <div>
            <h3 className="text-lg font-bold text-neutral-900 tracking-tight">Framkvæmdasamantekt & Núverandi Staða</h3>
            <p className="text-xs text-neutral-500">Stöðumat verkefnisins við stefnubreytingu yfir á framleiðsluhýsingu í skýi</p>
          </div>
        </div>

        <div className="text-sm text-neutral-700 leading-relaxed space-y-3">
          <p>
            Verkefnið <strong>Ríkisgát</strong> hefur náð þeim merka tæknilega áfanga að vera orðið fullbúið,
            leiftursnöggt greiningarkerfi yfir opinber útgjöld ríkisins. Kerfið dregur saman alla útgefna reikninga
            og bókhaldslínur sem birtar hafa verið á <em>opnirreikningar.is</em> frá árinu 2017 til miðs árs 2026.
          </p>
          <p>
            Gagnagrunnurinn hefur verið hannaður í <strong>v3.0 PostgreSQL</strong> með 6 tengdum töflum og 
            12 aðalflokkum tegunda. Til að mæta 18,17 milljónum færslna hefur verið mörkuð sú stefna að 
            <strong> hýsa vefinn í nútímalegu skýjaumhverfi (Managed Cloud)</strong> í stað deiltrar hefðbundinnar vefhýsingar 
            (eins og 1984.is). Svarhraði á flóknum samantektum er kominn niður í <strong>0,005–0,02 sekúndur</strong>.
          </p>
        </div>

        {/* Highlight box */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-emerald-900 text-sm">
          <div className="font-bold flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            Lykilniðurstaða: Stefna sett á Skýjahýsingu (Cloud Architecture)
          </div>
          <p className="text-xs text-emerald-800 leading-relaxed">
            Ákveðið hefur verið að nýta nútíma skýjahýsingu með Git Continuous Deployment (CI/CD) og stýrðum PostgreSQL gagnagrunni í skýinu.
            Þetta útilokar takmarkanir deildra hýsinga (eins og 1984.is/cPanel) hvað varðar vinnsluminni og handvirkt FTP flæði.
          </p>
        </div>
      </div>

      {/* 2. KAFLI: GAGNAHÖNNUN & GREINING Á 18,1M FÆRSLUM */}
      <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-xs space-y-4">
        <div className="flex items-center gap-3 border-b border-neutral-100 pb-3">
          <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-bold text-sm">
            2
          </div>
          <div>
            <h3 className="text-lg font-bold text-neutral-900 tracking-tight">Gagnagrunnshönnun v3.0 & Rökstuðningur</h3>
            <p className="text-xs text-neutral-500">Úttekt á ~4,2 GiB PostgreSQL gagnagrunni og straumlínulögun í skýi</p>
          </div>
        </div>

        <div className="text-sm text-neutral-700 leading-relaxed space-y-3">
          <p>
            Gagnagrunnurinn er skilgreindur í <strong>PostgreSQL 18</strong> undir nafninu <code>rikisgat</code>.
            Í stað þess að endurtaka nöfn birgja og stofnana yfir 18 milljón sinnum,
            skiptir v3.0 gögnunum í samræmt líkan með 6 tengdum töflum sem henta beint fyrir stýrt skýjaumhverfi:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-3">
            <div className="p-3.5 bg-neutral-50 rounded-lg border border-neutral-200">
              <div className="text-xs font-bold text-neutral-500 uppercase">Tafla: stofnanir</div>
              <div className="text-lg font-bold text-neutral-900 mt-1">{stats.stofnanir_fjoldi} raðir</div>
              <div className="text-xs text-neutral-600 mt-0.5">Stærð: ~{stats.stofnanir_size_kib} KiB</div>
              <div className="text-[11px] text-neutral-500 mt-2 font-mono">id (PK), nafn (VARCHAR 255)</div>
            </div>

            <div className="p-3.5 bg-neutral-50 rounded-lg border border-neutral-200">
              <div className="text-xs font-bold text-neutral-500 uppercase">Tafla: birgjar</div>
              <div className="text-lg font-bold text-neutral-900 mt-1">{formaTolu(stats.birgjar_fjoldi)} raðir</div>
              <div className="text-xs text-neutral-600 mt-0.5">Stærð: ~{stats.birgjar_size_mib} MiB</div>
              <div className="text-[11px] text-neutral-500 mt-2 font-mono">id (PK), nafn (VARCHAR 255)</div>
            </div>

            <div className="p-3.5 bg-neutral-50 rounded-lg border border-neutral-200">
              <div className="text-xs font-bold text-neutral-500 uppercase">Tafla: reikningar</div>
              <div className="text-lg font-bold text-neutral-900 mt-1">~17.919.539 raðir</div>
              <div className="text-xs text-neutral-600 mt-0.5">Stærð: ~{stats.reikningar_size_gib} GiB</div>
              <div className="text-[11px] text-neutral-500 mt-2 font-mono">stofnun_id, birgi_id, dags, upphaed...</div>
            </div>
          </div>

          <h4 className="font-bold text-neutral-900 pt-2">Flýtivísar (Composite Indexes) sem tryggja 0,005s afköst:</h4>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-neutral-600">
            <li>
              <code>idx_dags_stofnun (dags, stofnun_id, upphaed)</code>: Leyfir forsíðunni að hópa saman og reikna heildarupphæðir allra stofnana fyrir tiltekinn mánuð án þess að lesa óskyldar raðir.
            </li>
            <li>
              <code>idx_dags_birgir (dags, birgi_id, upphaed)</code>: Skilar Topp 5 stærstu birgjum ársins, mánaðarins eða hæsta dagsins samstundis.
            </li>
            <li>
              <code>Tveggja fasa leit (Sub-query pattern)</code>: Við textaleit í leitarreit er fyrst leitað í litlu töflunum (<code>birgjar</code> og <code>stofnanir</code>) sem tekur 0,0001 sek. ID tölurnar eru síðan sendar inn í flýtivísana á <code>reikningar</code>.
            </li>
          </ul>
        </div>
      </div>

      {/* 3. KAFLI: ARKITEKTÚR - SKÝJAHÝSING Í STAÐ 1984.IS */}
      <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-xs space-y-4">
        <div className="flex items-center gap-3 border-b border-neutral-100 pb-3">
          <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-bold text-sm">
            3
          </div>
          <div>
            <h3 className="text-lg font-bold text-neutral-900 tracking-tight">Hýsingarstefna: Nútíma Skýjahýsing í stað 1984.is</h3>
            <p className="text-xs text-neutral-500">Rökstuðningur fyrir því að velja stýrt skýjaumhverfi (Managed Cloud) fyrir 18,17M færslur</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-neutral-700">
          <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200">
            <div className="flex items-center gap-2 font-bold text-neutral-900 mb-2">
              <Server className="w-4 h-4 text-emerald-600" />
              <span>Nútíma Skýjahýsing (Valin lausn)</span>
            </div>
            <ul className="space-y-2 text-xs text-neutral-700">
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-600 font-bold">✓</span>
                <span><strong>Öflugt vinnsluminni (RAM):</strong> PostgreSQL þarf tryggt vinnsluminni (Buffer Pool / Work Mem) til að halda 18M reikningum og composite flýtivísum í minni fyrir 0,005s svörun.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-600 font-bold">✓</span>
                <span><strong>Sjálfvirk Git CI/CD dreifing:</strong> Engin handvirk FTP upphleðsla. Sérhvert <code>git push</code> uppfærir vefinn sjálfkrafa á undir 60 sekúndum.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-600 font-bold">✓</span>
                <span><strong>Sjálfvirk skölun & SSL:</strong> Þolir mikil álagstoppa þegar fréttamiðlar fjalla um vefinn, með innbyggðu sjálfvirku HTTPS vottorði og stöðugum bakenda.</span>
              </li>
            </ul>
          </div>

          <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200">
            <div className="flex items-center gap-2 font-bold text-neutral-900 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Takmarkanir 1984.is / Hefðbundins FTP</span>
            </div>
            <ul className="space-y-2 text-xs text-neutral-700">
              <li className="flex items-start gap-1.5">
                <span className="text-amber-700 font-bold">✗</span>
                <span><strong>Deilt vinnsluminni:</strong> Hefðbundnar cPanel/FTP hýsingar skammta oft aðeins 512 MB – 1 GB RAM sem er ófullnægjandi fyrir 4,2 GiB gagnagrunn.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-amber-700 font-bold">✗</span>
                <span><strong>Hægfara handvirkt verklag:</strong> Handvirkur flutningur á skrám með FTP býður upp á mannleg mistök og hægfara útgáfustjórnun.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-amber-700 font-bold">✗</span>
                <span><strong>Áhætta á 503 villum við álag:</strong> Deildar hýsingar loka eða hægja á vefjum sem nota mikinn örgjörva eða keyra þungar gagnagrunnsfyrirspurnir.</span>
              </li>
            </ul>
          </div>
        </div>

        <p className="text-xs text-neutral-500 italic">
          Niðurstaða: Færsla á nútímalega skýjahýsingu (t.d. Render, Supabase eða Cloud VPS) tryggir lágmarks niðritíma, fullt rekstraröryggi og framúrskarandi notendaupplifun.
        </p>
      </div>

      {/* 4. KAFLI: LAGALEG UMGJÖRÐ OG BORGARARÉTTUR */}
      <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-xs space-y-4">
        <div className="flex items-center gap-3 border-b border-neutral-100 pb-3">
          <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-bold text-sm">
            4
          </div>
          <div>
            <h3 className="text-lg font-bold text-neutral-900 tracking-tight">Lagalegt Verkfærasett & Upplýsingalög nr. 140/2012</h3>
            <p className="text-xs text-neutral-500">Hvernig vefgáttin breytir óhlutbundnum tölum í raunverulegt eftirlit almennings</p>
          </div>
        </div>

        <div className="text-sm text-neutral-700 leading-relaxed space-y-3">
          <p>
            Vefgáttin birtir ekki aðeins heildarupphæðir heldur inniheldur hún innbyggt verkfæri fyrir
            <strong> Upplýsingalög nr. 140/2012</strong>. Þegar notandi smellir á <strong>„➕ Senda inn“</strong>
            við reikning í töflunni virkjast sjálfvirkur ferill:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-neutral-600">
            <li>
              <strong>Sjálfvirk stofnanahópun:</strong> Ef notandi velur t.d. 3 reikninga frá Landspítala og 1 frá Vegagerðinni greinir kerfið viðtakendur og skipuleggur beiðnina rétt.
            </li>
            <li>
              <strong>Lögboðin tilvísun:</strong> Textinn vísar formlega í 5. gr. (réttur til aðgangs að gögnum) og 17. gr. (afgreiðslufrestur stjórnvalda) laganna.
            </li>
            <li>
              <strong>Einfalt í notkun:</strong> Með einum smelli á <em>„📋 Afrita texta“</em> fær notandinn tilbúið erindi sem aðeins þarf að senda á netfang viðkomandi ríkisstofnunar.
            </li>
          </ul>
        </div>
      </div>

      {/* 5. KAFLI: AÐKALLANDI FORGANGSVERKEFNI NÆSTU 7 DAGA */}
      <div className="bg-amber-50/70 border-2 border-amber-200 p-6 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-900 font-black uppercase text-sm tracking-wide">
            <AlertTriangle className="w-5 h-5 text-amber-700" />
            <span>Aðkallandi Forgangsverkefni (Klára fyrir þriðjudag)</span>
          </div>
          <span className="bg-amber-500 text-white text-[11px] font-black px-2.5 py-0.5 rounded uppercase">
            Bráðaforgangur
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <div className="bg-white p-4 rounded-lg border border-amber-200">
            <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">1</span>
              ISNIC Lénakaup
            </div>
            <p className="text-xs text-neutral-700 mt-2 leading-relaxed">
              Festa lénið <strong>rikisgat.is</strong> (og kanna <strong>gegnsaett.is</strong>) strax áður en fréttamenn eða samkeppnisaðilar fá veður af verkefninu.
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-amber-200">
            <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">2</span>
              Skýjauppsetning (Cloud Hosting)
            </div>
            <p className="text-xs text-neutral-700 mt-2 leading-relaxed">
              Tengja Git repository við skýjaþjón (Render / Supabase / VPS), setja inn <code>DATABASE_URL</code> og flytja PostgreSQL grunninn með <code>pg_restore</code>.
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-amber-200">
            <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">3</span>
              Lendingarsíða & Lénatenging
            </div>
            <p className="text-xs text-neutral-700 mt-2 leading-relaxed">
              Tengja DNS færslur <strong>rikisgat.is</strong> við skýjaþjóninn með sjálfvirku SSL vottorði og birta kynningu og póstlistaskráningu fyrir opnun.
            </p>
          </div>
        </div>
      </div>

      {/* 6. KAFLI: MARKAÐSSTEFNA & TEKJUMÓDEL */}
      <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-xs space-y-4">
        <div className="flex items-center gap-3 border-b border-neutral-100 pb-3">
          <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-bold text-sm">
            5
          </div>
          <div>
            <h3 className="text-lg font-bold text-neutral-900 tracking-tight">Kynningarstefna, Blaðamenn & Fjármögnun</h3>
            <p className="text-xs text-neutral-500">Hvernig verkefnið mun ná útbreiðslu og tryggja sjálfbæran rekstur</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-neutral-700">
          <div className="p-3.5 bg-neutral-50 rounded-lg border border-neutral-200 space-y-1.5">
            <div className="font-bold text-neutral-900 text-sm flex items-center gap-1.5">
              <Share2 className="w-4 h-4 text-neutral-700" />
              <span>Rannsóknarblaðamenn</span>
            </div>
            <p className="text-neutral-600 leading-relaxed">
              Blaðamenn á <strong>Heimildinni</strong>, <strong>RÚV</strong> og <strong>Vísi</strong> eyða dögum í að vinna úr Excel-skrám ríkisins.
              Að gefa þeim leifturhraðvirkt tól með beinum tilvísunum mun veita verkefninu gríðarlega fjölmiðlaumfjöllun.
            </p>
          </div>

          <div className="p-3.5 bg-neutral-50 rounded-lg border border-neutral-200 space-y-1.5">
            <div className="font-bold text-neutral-900 text-sm flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-neutral-700" />
              <span>Samfélagsmiðlar (X / Twitter)</span>
            </div>
            <p className="text-neutral-600 leading-relaxed">
              Sjálfvirkur bot sem tístir vikulega um forvitnilegar tölur (t.d. „Hverjir voru 5 stærstu birgjar ríkisins í síðustu viku?“).
              Þetta skapar reglulegt líf og veður á samfélagsmiðlum.
            </p>
          </div>

          <div className="p-3.5 bg-neutral-50 rounded-lg border border-neutral-200 space-y-1.5">
            <div className="font-bold text-neutral-900 text-sm flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-neutral-700" />
              <span>Styrkir & Gagnasala</span>
            </div>
            <p className="text-neutral-600 leading-relaxed">
              Sótt verður um nýsköpunarstyrk hjá <strong>Tækniþróunarsjóði</strong>.
              Grunnvefurinn verður alltaf 100% ókeypis fyrir almenning, en fyrirtæki og greiningaraðilar munu geta keypt heildar CSV útdrætti.
            </p>
          </div>
        </div>
      </div>

      {/* 7. KAFLI: ÁHÆTTUGREINING & MÓTVÆGISAÐGERÐIR */}
      <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-xs space-y-3">
        <h3 className="text-base font-bold text-neutral-900">Áhættumat & Tæknilegar Tillögur</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-neutral-100 text-neutral-700 border-b border-neutral-200">
                <th className="p-2.5 font-bold uppercase">Áhættuþáttur</th>
                <th className="p-2.5 font-bold uppercase">Alvarleiki</th>
                <th className="p-2.5 font-bold uppercase">Mótvægisaðgerð</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 text-neutral-600">
              <tr>
                <td className="p-2.5 font-bold text-neutral-900">Gagnamagn & RAM í Skýi (4,2 GiB)</td>
                <td className="p-2.5"><span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">Lág</span></td>
                <td className="p-2.5">Skýjaumhverfi (Managed PostgreSQL) býður upp á nægt vinnsluminni fyrir buffer pool og composite flýtivísa, ólíkt deildum vefhýsingum.</td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold text-neutral-900">Stöðvun á opnirreikningar.is vefþjóni</td>
                <td className="p-2.5"><span className="bg-neutral-100 text-neutral-800 px-2 py-0.5 rounded font-bold">Lág</span></td>
                <td className="p-2.5">Söguleg gögn (2017–2025, 16,8M raðir) eru þegar vistuð á tölvu. Scraper keyrir aðeins mánaðarlega.</td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold text-neutral-900">Álag við fréttaopnun</td>
                <td className="p-2.5"><span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">Lág</span></td>
                <td className="p-2.5">Flýtivísar skila gögnum á 0,005 sek. Hægt að bæta við einföldum JSON skráar-cache fyrir mest sóttu mánuðina.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
