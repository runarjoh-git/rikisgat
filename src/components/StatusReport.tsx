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

  const reportDate = '2. október 2026';

  const fullMarkdownReport = `# RÍKISGÁT — Tæknileg & Stefnumarkandi Stöðuskýrsla
Dags: ${reportDate} | Útgáfa: 5.0 (Prufuferli, Aðgangsstýring & Almennt Félag)
Verkefni: Ríkisgát (rikisgat.is / test.rikisgat.is) — Gagnsæi & Eftirlit með Opinberum Útgjöldum
Hýsingarvettvangur: Hetzner Cloud (CAX21 ARM64) & Coolify CI/CD í Helsinki/Falkenstein

---

## 1. Framkvæmdasamantekt (Executive Summary)
Verkefnið Ríkisgát hefur náð þeim merka áfanga að vera orðið fullbúið, leifturhraðvirkt upplýsingakerfi sem opnar fyrir almenningi og fréttamiðlum sundurliðaðar greiðslufærslur íslenska ríkisins.

Gagnagrunnurinn inniheldur nú **${formaTolu(stats.ar_2017_2025_fjoldi + stats.ar_2026_fjoldi)} reikningsfærslur** sem spanna tímabilið frá 2017 til 2026. Með samræmdu PostgreSQL gagnagrunnslíkani með **8–10 tengdum töflum**, composite flýtivísum og lokuðum stjórnendaaðgangi hefur tekist að tryggja öryggi, leifturhraða (0,005s) og fullkomna aðhaldsgetu.

### Helstu lykiltölur verkefnisins:
- **Heildarfjöldi reikninga í PostgreSQL:** ${formaTolu(stats.ar_2017_2025_fjoldi + stats.ar_2026_fjoldi)}
- **Sögulegir reikningar (2017–2025):** ${formaTolu(stats.ar_2017_2025_fjoldi)} (100% klárað og fryst)
- **Yfirstandandi ár (2026):** ${formaTolu(stats.ar_2026_fjoldi)} færslur (nýjasti reikningur: ${stats.nyrjasta_dags})
- **Ríkisstofnanir:** ${stats.stofnanir_fjoldi} stofnanir (með sérstakri \`stofnanir_emails\` netfangaskrá fyrir upplýsingabeiðnir)
- **Birgjar og þjónustuaðilar:** ${formaTolu(stats.birgjar_fjoldi)} birgjar
- **Bókhaldstegundir & Flokkun:** 607 heiti straumlínulöguð í 12 aðalflokka (95,86% nákvæm flokkun)
- **Aðgangsstýring & Prufunotendur:** Sérhönnuð \`founders_access\` tafla fyrir stjórnborð og \`beta_signups\` fyrir prufunotendur
- **Styrkja- og aðstoðargreining:** Sérstök greiningareining sem vaktar dulda styrki, rekstrarframlög og „Undir einum hatti“ flokkanir
- **Gagnagrunnsstærð:** ~4,2 GiB PostgreSQL (með vinnsluminni og flýtivísum)
- **Svarhraði á vef:** ~5–20 millisekúndur
- **Hýsingarstefna:** Hetzner Cloud CAX21 (~€6/mán) með Coolify og sjálfvirkri Git-dreifingu

---

## 2. Gagnagrunnur v3.0 & Relational Architecture (8–10 Tengdar Töflur)
Í eldri útgáfu (v1.0 og v2.0) var notuð ein flöt tafla þar sem nöfn stofnana og birgja voru margendurtekin yfir 18 milljón sinnum. Það leiddi til mikillar disknýtingar (>16 GiB) og hægra fyrirspurna.

Í núverandi útgáfu er gagnagrunnurinn staðlaður (Normalized 3NF) í **8–10 samstilltar töflur**:
1. \`stofnanir\` (172 raðir, 16 KiB — ID og nöfn allra ríkisstofnana)
2. \`birgjar\` (19.303 raðir, 1.8 MiB — ID, heiti og kennitölur birgja)
3. \`reikningar\` (18.167.314 raðir, ~4,2 GiB — aðalfærslutaflan með flýtivísum)
4. \`tegundir_flokkun\` (607 tegundir varpaðar í 12 yfirflokka, 64 KiB)
5. \`stjorn_verkefni\` (18 verkefnaraðir í stjórnborði og vegvísi)
6. \`stjorn_vorumerki\` (5 vörumerki og lénaskráningar)
7. \`beta_signups\` (Óskir um prufuaðgang af forsíðu, netföng, tilkynningaóskir og samþykktarferli)
8. \`founders_access\` (Lokaður aðgangur stofnenda félagsins, lykilorðavörn, hlutverk og innskráningarsaga)
9. \`stofnanir_emails\` (Opinber netföng stofnana og ráðuneyta fyrir lögboðnar upplýsingabeiðnir skv. lögum 140/2012)
10. \`portal_settings\` (Miðlægar stillingar, m.a. víðtæk ára- og mánaðaleit)

### Afkastafínstilling (Indexing Strategy)
Til að tryggja að síur og topplistar vinni án Full Table Scan voru smíðaðir samsettir flýtivísar (Composite Indexes):
- \`idx_reikningar_dags (dags)\`: Fyrir tímabilssíun og árssamantektir.
- \`idx_reikningar_stofnun_dags (stofnun_id, dags, upphaed)\`: Fyrir mánaðaryfirlit og sundurliðun stofnana á 0,005s.
- \`idx_reikningar_birgir_dags (birgi_id, dags, upphaed)\`: Fyrir topp 5 birgja eftir ári, mánuði og degi.
- \`idx_beta_signups_email (email)\` & \`idx_founders_email (email)\`: Fyrir leifturhraða auðkenningu og öryggiseftirlit.

---

## 3. Arkitektúr: Hetzner Cloud (CAX21) & Coolify í stað 1984.is / FTP
Ákvörðun hefur verið tekin um að **hýsa vefinn á Hetzner Cloud CAX21 netþjóni með Coolify** í stað hefðbundinnar deiltrar vefhýsingar:
- **Af hverju Hetzner CAX21 (Helsinki / Finnland eða Falkenstein / Þýskaland)?**
  1. *Mikil afköst á lágum kostnaði:* 4 vCPU Ampere Altra ARM64, 8 GB vinnsluminni (RAM) og 80 GB NVMe diskur á aðeins ~€6,00 á mánuði (~1.000 kr./mán).
  2. *Nægt vinnsluminni:* 8 GB RAM gerir kleift að halda allan 4,2 GiB grunninn og alla vísana í virku skyndiminni (shared_buffers=2GB).
  3. *Coolify PaaS sjálfvirkni:* Við sérhvert \`git push\` endurbyggir Coolify vefinn og uppfærir á 45 sekúndum án nokkurs niðritíma.
  4. *Sjálfvirkt SSL/HTTPS:* Let's Encrypt A+ öryggisvottorð endurnýjast sjálfkrafa.
  5. *Sjálfvirk öryggisafrit:* Innbyggð daglega afritataka í skýinu, auk staðbundinna \`backup.bat\` afrita á fartölvu.

### Framtíðarstækkun með Styrkjum (Skjalageymsla & Frumrit Reikninga):
Hetzner CAX21 dugar fullkomlega fyrir núverandi 18,2M tölulegar reikningsfærslur. Með reglulegum styrkjum frá almenningi og samfélaginu verður hins vegar hægt að bæta í vélbúnað og geymslupláss til að styðja við áframhaldandi framþróun verkefnisins.
- **Dæmi um framtíðarverkefni (langtímasýn):** Leyfa borgurum og rannsóknarblaðamönnum að **hlaða upp skönnuðum frumritum reikninga (PDF/myndum)** sem fengist hafa afhentir í kjölfar upplýsingabeiðna skv. lögum nr. 140/2012, og tengja þau beint við viðkomandi færslu í kerfinu.
- Þetta mun í fyllingu tímans krefjast meira gagnageymslupláss (Object Storage / S3 / stærri diska) og meiri vinnsluhraða, sem reglulegir stuðningsstyrkir munu standa straum af.

---

## 4. Lagalegt Verkfærasett & Upplýsingaréttur (Upplýsingalög nr. 140/2012)
Ríkisgát er ekki aðeins upplýsingatorg, heldur beint lögfræðilegt aðhaldstól fyrir borgara og fjölmiðla:
- Notandi velur reikninga með „➕ Senda inn“.
- Kerfið hópar reikninga sjálfkrafa eftir viðkomandi stofnun.
- Myndar lögformlega beiðni skv. 5. og 17. gr. upplýsingalaga nr. 140/2012 um afhendingu frumreiknings og fylgiskjala.
- Einn smellur afritar tilbúinn texta eða býr til tölvupóst beint á viðkomandi stofnun.

---

## 5. Kynningarstefna, Fjölmiðlar & Útbreiðsla
- **Rannsóknarblaðamenn (Heimildin, RÚV, Vísir):** Blaðamenn eyða dögum í Excel-skrár. Ríkisgát gefur þeim leit á 0,005 sekúndum.
- **Samfélagsmiðlar & Facebook/X:** Sjálfvirk vikuleg uppgjör (stærstu birgjar, hæstu stakir reikningar, óvenjuleg útgjöld).
- **Styrkja- og aðstoðargreining:** Opnar nýtt sjónarhorn á hvernig opinberu fé er úthlutað til félaga og einkaaðila.

---

## 6. Greining á Mögulegum Styrkjum: „Viltu styrkja okkur?“
Úttekt á styrktarmöguleikum frá almenningi og notendum:
- **Áætlaður notendahópur við opnun:** 20.000 – 50.000 virkir einstaklingar á mánuði í kjölfar fjölmiðlaumfjöllunar.
- **Hlutfall sem styrkir (Conversion Rate):** Reiknað er með 0,3% – 0,8% meðal áhugasamra borgara (venjulegt hlutfall í samfélagsverkefnum).
- **Áætlaður fjöldi styrktaraðila:** ~100 til 350 einstaklingar sem leggja til mánaðarlega eða staka styrki.
- **Kostnaður á mánuði:** Netþjónn (Hetzner CAX21) kostar aðeins um 900–1.200 kr./mánuði (~€6).
- **Niðurstaða:** Aðeins 2–3 einstaklingar sem gefa 500 kr. á mánuði standa strax undir öllum tæknilegum rekstrarkostnaði síðunnar! Allt umframframlag getur runnið í lögfræðiaðstoð við gagnaöflun og námsreynslu krakkanna.

---

## 7. Félagsstofnun & Stjórnarhættir (Krakkakynning & 1. Aðalfundur)
- **Félagsform:** Almennt félag rekið án hagnaðarmarkmiðs (félagasamtök skráð hjá Skattinum).
- **Stofnendur & Stjórn:** Feðginin Rúnar Þór Jóhannsson (formaður), Viktor Smári Rúnarsson (fundarstjóri & tæknistjóri), Rakel Anna Rúnarsdóttir (ritari & samskiptastjóri) og Óðinn Rúnarsson (gagnarýnir & gjaldkeri).
- **Heiðursfélagi nr. 1:** Fyrsta afabarnið (skírt 20. september 2026) — sem áminning um framtíðina.
- **Heiðursfélagi nr. 2:** **Sigþrúður Guðnadóttir** — samþykkt á 1. aðalfundi fyrir ómetanlegan stuðning, samfylgd og hvatningu.
- **Faglegur bakhjarl:** Dílajörð ehf. veitir sérfræðiráðgjöf og tryggir vettvang fyrir launaða námsreynslu unga fólksins.

---

## 8. Aðkallandi Forgangsverkefni Næstu Daga
1. **Undirritun stofnskjala & 1. Aðalfundur:** Kynna verkefnið fyrir krökkunum, lesa stofnskjöl og fá undirskriftir allra stofnenda.
2. **Skráning hjá Skattinum:** Skila RSK 17.20 (umsókn um kennitölu almenns félags) ásamt samþykktum og stofnfundargerð.
3. **Stofnun bankareiknings:** Opna frjálsan söfnunarreikning á nýrri kennitölu félagsins fyrir „Viltu styrkja okkur“.
4. **Hetzner Cloud & Coolify:** Ræsa CAX21 netþjóninn í Helsinki, flytja PostgreSQL grunninn og kveikja á sjálfvirkri Git-dreifingu.
5. **Lénatenging:** Beina \`rikisgat.is\` og \`gegnsaett.is\` á fasta IP-tölu Hetzner netþjónsins.
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
            Gagnagrunnurinn hefur verið hannaður í <strong>PostgreSQL 18</strong> með <strong>8–10 samstilltum töflum</strong>, 
            12 aðalflokkum bókhaldstegunda og lokaðri aðgangsstýringu. Til að mæta 18,17 milljónum færslna hefur verið mörkuð sú stefna að 
            <strong> hýsa vefinn á Hetzner Cloud (CAX21 ARM64) með Coolify</strong> í Helsinki eða Falkenstein í stað deiltrar hefðbundinnar vefhýsingar 
            (eins og 1984.is). Svarhraði á flóknum samantektum er kominn niður í <strong>0,005–0,02 sekúndur</strong>.
          </p>
        </div>

        {/* Highlight box */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-emerald-900 text-sm">
          <div className="font-bold flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            Lykilniðurstaða: Stefna sett á Hetzner Cloud CAX21 & Coolify (~€6/mán)
          </div>
          <p className="text-xs text-emerald-800 leading-relaxed">
            Ákveðið hefur verið að nýta Hetzner Cloud (4 vCPU, 8 GB RAM, 80 GB NVMe) með Coolify CI/CD og stýrðum PostgreSQL gagnagrunni í skýinu.
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
            <h3 className="text-lg font-bold text-neutral-900 tracking-tight">Gagnagrunnshönnun v3.0 & Rökstuðningur (8–10 Tengdar Töflur)</h3>
            <p className="text-xs text-neutral-500">Úttekt á ~4,2 GiB PostgreSQL gagnagrunni og samræmdu töfluskipulagi</p>
          </div>
        </div>

        <div className="text-sm text-neutral-700 leading-relaxed space-y-3">
          <p>
            Gagnagrunnurinn er skilgreindur í <strong>PostgreSQL 18</strong> undir nafninu <code>rikisgat</code>.
            Í stað þess að endurtaka nöfn birgja og stofnana yfir 18 milljón sinnum,
            skiptir v3.0 líkanið gögnunum í samræmt líkan með <strong>8–10 tengdum töflum</strong> sem henta beint fyrir stýrt skýjaumhverfi:
          </p>

          {/* Grunnur: Kjarnagögn */}
          <div className="pt-1">
            <span className="text-xs font-black uppercase tracking-wider text-neutral-500">1. Kjarnagögn Reikninga (Bókhaldsrýni)</span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-2">
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
                <div className="text-[11px] text-neutral-500 mt-2 font-mono">id (PK), nafn, kt</div>
              </div>

              <div className="p-3.5 bg-neutral-50 rounded-lg border border-neutral-200">
                <div className="text-xs font-bold text-neutral-500 uppercase">Tafla: reikningar</div>
                <div className="text-lg font-bold text-neutral-900 mt-1">~17.919.539 raðir</div>
                <div className="text-xs text-neutral-600 mt-0.5">Stærð: ~{stats.reikningar_size_gib} GiB</div>
                <div className="text-[11px] text-neutral-500 mt-2 font-mono">stofnun_id, birgi_id, dags, upphaed...</div>
              </div>
            </div>
          </div>

          {/* Grunnur: Aðgangsstýring & Prufunotendur */}
          <div className="pt-2">
            <span className="text-xs font-black uppercase tracking-wider text-neutral-500">2. Aðgangsstýring, Prufunotendur & Stjórnun (Nýtt)</span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-2">
              <div className="p-3.5 bg-amber-50/60 rounded-lg border border-amber-200">
                <div className="text-xs font-bold text-amber-800 uppercase flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-amber-700" />
                  <span>Tafla: founders_access</span>
                </div>
                <div className="text-lg font-bold text-neutral-900 mt-1">Lokaður Aðgangur</div>
                <div className="text-xs text-neutral-600 mt-0.5">Stofnendur & Lykilorðavörn</div>
                <div className="text-[11px] text-neutral-500 mt-2 font-mono">id, name, email, password_hash, role</div>
              </div>

              <div className="p-3.5 bg-blue-50/60 rounded-lg border border-blue-200">
                <div className="text-xs font-bold text-blue-800 uppercase flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-700" />
                  <span>Tafla: beta_signups</span>
                </div>
                <div className="text-lg font-bold text-neutral-900 mt-1">Prufuaðgangar</div>
                <div className="text-xs text-neutral-600 mt-0.5">Skráningar & Tilkynningar</div>
                <div className="text-[11px] text-neutral-500 mt-2 font-mono">name, email, role, wants_notifications</div>
              </div>

              <div className="p-3.5 bg-neutral-50 rounded-lg border border-neutral-200">
                <div className="text-xs font-bold text-neutral-500 uppercase">Töflur: stjórn & vörumerki</div>
                <div className="text-lg font-bold text-neutral-900 mt-1">2 Töflur</div>
                <div className="text-xs text-neutral-600 mt-0.5">stjorn_verkefni & stjorn_vorumerki</div>
                <div className="text-[11px] text-neutral-500 mt-2 font-mono">vegvísir, lénamat, stöðuskýrslur</div>
              </div>
            </div>
          </div>

          {/* Grunnur: Flokkun & Stoðgögn */}
          <div className="pt-2">
            <span className="text-xs font-black uppercase tracking-wider text-neutral-500">3. Flokkun, Upplýsingaréttur & Stillingar</span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-2">
              <div className="p-3.5 bg-neutral-50 rounded-lg border border-neutral-200">
                <div className="text-xs font-bold text-neutral-500 uppercase">Tafla: tegundir_flokkun</div>
                <div className="text-lg font-bold text-neutral-900 mt-1">607 tegundir</div>
                <div className="text-xs text-neutral-600 mt-0.5">Varpað í 12 aðalflokka</div>
                <div className="text-[11px] text-neutral-500 mt-2 font-mono">tegund_heiti, yfirflokkur, litur</div>
              </div>

              <div className="p-3.5 bg-neutral-50 rounded-lg border border-neutral-200">
                <div className="text-xs font-bold text-neutral-500 uppercase">Tafla: stofnanir_emails</div>
                <div className="text-lg font-bold text-neutral-900 mt-1">Netföng Stofnana</div>
                <div className="text-xs text-neutral-600 mt-0.5">Fyrir Upplýsingalög 140/2012</div>
                <div className="text-[11px] text-neutral-500 mt-2 font-mono">stofnun_id, email, raduneyti</div>
              </div>

              <div className="p-3.5 bg-neutral-50 rounded-lg border border-neutral-200">
                <div className="text-xs font-bold text-neutral-500 uppercase">Tafla: portal_settings</div>
                <div className="text-lg font-bold text-neutral-900 mt-1">Miðlægar Stillingar</div>
                <div className="text-xs text-neutral-600 mt-0.5">Víðtæk ára- og mánaðaleit</div>
                <div className="text-[11px] text-neutral-500 mt-2 font-mono">broad_search_years, months</div>
              </div>
            </div>
          </div>

          <h4 className="font-bold text-neutral-900 pt-3">Flýtivísar (Composite Indexes) sem tryggja 0,005s afköst:</h4>
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
            <h3 className="text-lg font-bold text-neutral-900 tracking-tight">Hýsingarstefna: Hetzner Cloud (CAX21 ARM64) & Coolify í stað 1984.is</h3>
            <p className="text-xs text-neutral-500">Rökstuðningur fyrir því að velja Hetzner CAX21 í Helsinki og Coolify PaaS fyrir 18,17M færslur</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-neutral-700">
          <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200">
            <div className="flex items-center gap-2 font-bold text-neutral-900 mb-2">
              <Server className="w-4 h-4 text-emerald-600" />
              <span>Hetzner CAX21 & Coolify (Valin lausn — ~€6/mán)</span>
            </div>
            <ul className="space-y-2 text-xs text-neutral-700">
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-600 font-bold">✓</span>
                <span><strong>Öflugur vélbúnaður á lágmarksverði:</strong> 4 vCPU Ampere Altra ARM64, 8 GB RAM og 80 GB NVMe diskur í Helsinki á aðeins ~€6 á mánuði.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-600 font-bold">✓</span>
                <span><strong>Nóg vinnsluminni (RAM):</strong> 8 GB RAM gerir kleift að halda allan 4,2 GiB grunninn og flýtivísana í virku skyndiminni (shared_buffers) fyrir 0,005s svörun.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-600 font-bold">✓</span>
                <span><strong>Coolify sjálfvirk Git CI/CD dreifing:</strong> Engin handvirk FTP upphleðsla. Sérhvert <code>git push</code> endurbyggir vefinn sjálfkrafa á undir 45 sekúndum.</span>
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

        <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2">
          <div className="flex items-center gap-2 font-bold text-indigo-950 text-xs uppercase tracking-wide">
            <TrendingUp className="w-4 h-4 text-indigo-700" />
            <span>Framtíðarsýn: Stækkun vélbúnaðar með styrkjum (Frumritareining & PDF)</span>
          </div>
          <p className="text-xs text-indigo-900 leading-relaxed">
            Hetzner CAX21 (~€6/mán) dugar fullkomlega fyrir núverandi 18,2 milljón reikningsfærslur. Með reglulegum styrkjum frá almenningi og samfélaginu verður hins vegar hægt að bæta í vélbúnað og geymslupláss til að auka áframhaldandi framþróun verkefnisins.
          </p>
          <div className="bg-white/80 p-3 rounded-lg border border-indigo-200 text-xs text-neutral-800 space-y-1">
            <span className="font-bold text-neutral-900">Dæmi um framtíðarverkefni (langtímasýn — ekki á næstunni):</span>
            <p className="text-neutral-700 leading-relaxed">
              Leyfa borgurum og rannsóknarblaðamönnum að <strong>hlaða upp skönnuðum frumritum reikninga (PDF/myndum)</strong> sem fengist hafa afhentir með upplýsingabeiðnum skv. upplýsingalögum nr. 140/2012, og tengja þau beint við viðkomandi línu í gagnagrunninum. Slíkt mun krefjast meira gagnageymslupláss (Object Storage / S3 / stærri diska) og meiri vinnsluhraða, sem reglulegir stuðningsstyrkir munu auðveldlega standa undir í fyllingu tímans.
            </p>
          </div>
        </div>

        <p className="text-xs text-neutral-500 italic">
          Niðurstaða: Færsla á Hetzner Cloud CAX21 með Coolify tryggir lágmarks niðritíma, fullt rekstraröryggi, sjálfvirk SSL vottorð og framúrskarandi notendaupplifun.
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

      {/* 5. KAFLI: KYNNINGARSTEFNA, FJÖLMIÐLAR & ÚTBREIÐSLA */}
      <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-xs space-y-4">
        <div className="flex items-center gap-3 border-b border-neutral-100 pb-3">
          <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-bold text-sm">
            5
          </div>
          <div>
            <h3 className="text-lg font-bold text-neutral-900 tracking-tight">Kynningarstefna, Blaðamenn & Fjölmiðlar</h3>
            <p className="text-xs text-neutral-500">Hvernig verkefnið mun ná gríðarlegri útbreiðslu og skapa umræðu í þjóðfélaginu</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-neutral-700">
          <div className="p-3.5 bg-neutral-50 rounded-lg border border-neutral-200 space-y-1.5">
            <div className="font-bold text-neutral-900 text-sm flex items-center gap-1.5">
              <Share2 className="w-4 h-4 text-neutral-700" />
              <span>Rannsóknarblaðamenn</span>
            </div>
            <p className="text-neutral-600 leading-relaxed">
              Blaðamenn á <strong>Heimildinni</strong>, <strong>RÚV</strong> og <strong>Vísi</strong> eyða dögum í að vinna úr flóknum opinberum gögnum.
              Að gefa þeim leifturhraðvirkt tól með beinum tilvísunum mun veita verkefninu gríðarlega fjölmiðlaumfjöllun og virðingu.
            </p>
          </div>

          <div className="p-3.5 bg-neutral-50 rounded-lg border border-neutral-200 space-y-1.5">
            <div className="font-bold text-neutral-900 text-sm flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-neutral-700" />
              <span>Samfélagsmiðlar & Gagnasjón</span>
            </div>
            <p className="text-neutral-600 leading-relaxed">
              Vikulegar samantektir og myndrænar birtingar (t.d. „Hverjir voru 5 stærstu birgjar ríkisins í mánuðinum?“) munu vekja athygli 
              almennings á Facebook, Instagram, TikTok og X.
            </p>
          </div>

          <div className="p-3.5 bg-neutral-50 rounded-lg border border-neutral-200 space-y-1.5">
            <div className="font-bold text-neutral-900 text-sm flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-neutral-700" />
              <span>Styrkja- og aðstoðargreining</span>
            </div>
            <p className="text-neutral-600 leading-relaxed">
              Með nýju greiningareiningunni er hægt að sjá dulda styrki, rekstrarframlög og félög sem fá milljarða án hefðbundins útboðs.
            </p>
          </div>
        </div>
      </div>

      {/* 6. KAFLI: GREINING Á STYRKJUM: „VILTU STYRKJA OKKUR?“ */}
      <div className="bg-emerald-50/60 border-2 border-emerald-300 p-6 rounded-xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-emerald-950 font-black uppercase text-sm tracking-wide">
            <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">6</span>
            <span>Greining á Mögulegum Styrkjum: „Viltu styrkja okkur?“</span>
          </div>
          <span className="bg-emerald-600 text-white text-[11px] font-black px-2.5 py-0.5 rounded uppercase">
            Sjálfbær Fjármögnun
          </span>
        </div>

        <p className="text-xs text-emerald-900 leading-relaxed">
          Þegar vefurinn fer á flug og vekur athygli landsmanna verður virkjuð aðgerðin <strong>„Viltu styrkja okkur?“</strong>.
          Hér er raunhæf greining á því hvað margir gætu styrkt verkefnið og hversu auðvelt er að gera það sjálfbært:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-1">
          <div className="bg-white p-3.5 rounded-lg border border-emerald-200 space-y-1">
            <div className="text-[11px] font-bold text-neutral-500 uppercase">Mánaðarlegir Notendur</div>
            <div className="text-xl font-black text-neutral-900">20.000 – 50.000</div>
            <p className="text-[11px] text-neutral-600">Áætlaðir heimsækjendur við opnun og umfjöllun fjölmiðla.</p>
          </div>

          <div className="bg-white p-3.5 rounded-lg border border-emerald-200 space-y-1">
            <div className="text-[11px] font-bold text-neutral-500 uppercase">Styrktarhlutfall</div>
            <div className="text-xl font-black text-emerald-700">0,3% – 0,8%</div>
            <p className="text-[11px] text-neutral-600">Hefðbundið hlutfall í lýðræðis- og gagnsæisverkefnum (Wikipedia/Archive).</p>
          </div>

          <div className="bg-white p-3.5 rounded-lg border border-emerald-200 space-y-1">
            <div className="text-[11px] font-bold text-neutral-500 uppercase">Mögulegir Styrktaraðilar</div>
            <div className="text-xl font-black text-neutral-900">100 – 350 manns</div>
            <p className="text-[11px] text-neutral-600">Borgarar sem vilja leggja til 500 – 2.000 kr. á mánuði eða staka upphæð.</p>
          </div>

          <div className="bg-white p-3.5 rounded-lg border border-emerald-200 space-y-1">
            <div className="text-[11px] font-bold text-neutral-500 uppercase">Hýsingarkostnaður á mánuði</div>
            <div className="text-xl font-black text-purple-700">~1.000 kr. (€6)</div>
            <p className="text-[11px] text-neutral-600">Aðeins <strong>2 styrktaraðilar</strong> duga til að reka allan vefinn í skýinu!</p>
          </div>
        </div>

        <div className="p-3.5 bg-white/90 rounded-lg border border-emerald-200 text-xs text-emerald-950 space-y-2">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              <strong>Niðurstaða & Sjálfbærni:</strong> Aðeins ~1.000 kr./mán (€6) heldur öllum vefnum og 18,2M reikningum uppi á Hetzner CAX21. 
              Allt fé umfram lágmarkskostnað nýtist beint til að <strong>bæta í vélbúnað og geymslupláss</strong> fyrir áframhaldandi framþróun.
            </span>
          </div>
          <p className="text-[11px] text-emerald-900/80 pl-6 leading-relaxed">
            💡 <strong>Framtíðarverkefni (ekki á næstunni):</strong> Með auknum styrkjum verður hægt að stækka vélbúnað og diskapláss til að leyfa fólki að hlaða upp skönnuðum <strong>frumritum reikninga (PDF/myndum)</strong> sem óskað hefur verið eftir skv. upplýsingalögum, og tengja þau við reikningsfærslurnar. Einnig nýtast styrkir til lögfræðiaðstoðar við kærur til Úrskurðarnefndar um upplýsingamál og námsreynslu krakkanna.
          </p>
        </div>
      </div>

      {/* 7. KAFLI: FJÖLSKYLDAN, STOFNUN FÉLAGSINS & HEIÐURSFÉLAGAR */}
      <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-xs space-y-4">
        <div className="flex items-center gap-3 border-b border-neutral-100 pb-3">
          <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-bold text-sm">
            7
          </div>
          <div>
            <h3 className="text-lg font-bold text-neutral-900 tracking-tight">Krakkakynning, Stofnskjöl & 1. Aðalfundur</h3>
            <p className="text-xs text-neutral-500">Stofnun almenns félags, verkaskipting krakkanna og útnefning heiðursfélaga</p>
          </div>
        </div>

        <p className="text-xs text-neutral-700 leading-relaxed">
          Verkefnið er byggt upp sem hugsjónaverkefni fjölskyldunnar. Til að vekja áhuga unga fólksins og gefa þeim raunverulega ábyrgð 
          og námsreynslu verður haldinn kynningarfundur, farið yfir stofnskjölin og haldinn formlegur 1. aðalfundur.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3.5 bg-neutral-50 rounded-lg border border-neutral-200 space-y-1">
            <div className="text-[10px] uppercase font-bold text-neutral-500">Formaður</div>
            <div className="font-bold text-xs text-neutral-900">Rúnar Þór Jóhannsson</div>
            <p className="text-[11px] text-neutral-600">Leiðir stefnu, gagnavinnslu og lögfræðilegt aðhald.</p>
          </div>

          <div className="p-3.5 bg-neutral-50 rounded-lg border border-neutral-200 space-y-1">
            <div className="text-[10px] uppercase font-bold text-neutral-500">Tæknistjóri & Fundarstjóri</div>
            <div className="font-bold text-xs text-neutral-900">Viktor Smári Rúnarsson</div>
            <p className="text-[11px] text-neutral-600">Stýrir fundum, hugbúnaðarþróun og tækniumhverfi.</p>
          </div>

          <div className="p-3.5 bg-neutral-50 rounded-lg border border-neutral-200 space-y-1">
            <div className="text-[10px] uppercase font-bold text-neutral-500">Ritari & Samskiptastjóri</div>
            <div className="font-bold text-xs text-neutral-900">Rakel Anna Rúnarsdóttir</div>
            <p className="text-[11px] text-neutral-600">Fundargerðir, skráningar, fræðsla og miðlun.</p>
          </div>

          <div className="p-3.5 bg-neutral-50 rounded-lg border border-neutral-200 space-y-1">
            <div className="text-[10px] uppercase font-bold text-neutral-500">Gagnarýnir & Gjaldkeri</div>
            <div className="font-bold text-xs text-neutral-900">Óðinn Rúnarsson</div>
            <p className="text-[11px] text-neutral-600">Rýnir í talnagögn og tekur að sér embætti gjaldkera.</p>
          </div>
        </div>

        {/* Heiðursfélagar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-xl space-y-1">
            <div className="font-bold text-xs text-rose-950 flex items-center gap-1.5">
              <span>👶</span>
              <span>Heiðursfélagi nr. 1 — Fyrsta afabarnið</span>
            </div>
            <p className="text-[11px] text-neutral-700 leading-relaxed">
              Skírt 20. september 2026. Ævilangur heiðursfélagi án atkvæðisréttar sem táknmynd um að gagnsæi í dag er fyrir komandi kynslóðir.
            </p>
          </div>

          <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1">
            <div className="font-bold text-xs text-amber-950 flex items-center gap-1.5">
              <span>🏅</span>
              <span>Heiðursfélagi nr. 2 — Sigþrúður Guðnadóttir</span>
            </div>
            <p className="text-[11px] text-neutral-700 leading-relaxed">
              Kjörin á 1. aðalfundi félagsins í virðingarskyni fyrir ómetanlegan stuðning, tryggð og hvatningu. Án almenns atkvæðisréttar en fer með <strong>oddaatkvæðisrétt</strong> til að skera úr málum ef atkvæði falla jafnt í stjórn.
            </p>
          </div>
        </div>
      </div>

      {/* 8. KAFLI: AÐKALLANDI FORGANGSVERKEFNI NÆSTU DAGA */}
      <div className="bg-amber-50/70 border-2 border-amber-200 p-6 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-900 font-black uppercase text-sm tracking-wide">
            <AlertTriangle className="w-5 h-5 text-amber-700" />
            <span>Aðkallandi Forgangsverkefni (Klára fyrir næstu viku)</span>
          </div>
          <span className="bg-amber-500 text-white text-[11px] font-black px-2.5 py-0.5 rounded uppercase">
            Bráðaforgangur
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-1">
          <div className="bg-white p-4 rounded-lg border border-emerald-300 bg-emerald-50/20">
            <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center font-bold text-xs">✓</span>
              Töflur & Aðgangsstýring
            </div>
            <p className="text-xs text-neutral-700 mt-2 leading-relaxed">
              Töflur búnar til í pgAdmin 4. Lendingarsíða fyrir rikisgat.is með 24 klst niðurteljara og lokuðu innskráningarkerfi stofnenda tilbúin.
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-amber-200">
            <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">1</span>
              Kynning, Stofnskjöl & Undirskriftir
            </div>
            <p className="text-xs text-neutral-700 mt-2 leading-relaxed">
              Halda kynninguna með krökkunum, lesa stofnskjölin, fá undirskriftir allra fjögurra stofnenda og ganga frá stofnfundargerð.
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-amber-200">
            <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">2</span>
              Skráning hjá Skattinum & Kennitala
            </div>
            <p className="text-xs text-neutral-700 mt-2 leading-relaxed">
              Senda inn eyðublað RSK 17.20 um nýja kennitölu almenns félags (lög 110/2021) og opna söfnunarreikning.
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-amber-200">
            <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">3</span>
              Hetzner Cloud CAX21 & Coolify
            </div>
            <p className="text-xs text-neutral-700 mt-2 leading-relaxed">
              Ræsa CAX21 netþjóninn í Helsinki, tengja Git repository við Coolify og beina <code>rikisgat.is</code> léninu á netþjóninn.
            </p>
          </div>
        </div>
      </div>

      {/* 9. KAFLI: ÁHÆTTUGREINING & MÓTVÆGISAÐGERÐIR */}
      <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-xs space-y-3">
        <h3 className="text-base font-bold text-neutral-900">9. Áhættumat & Tæknilegar Tillögur</h3>
        
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
