export interface SubcategoryItem {
  id: string;
  name: string;
  lines: number;
  pctOfMacro: number;
  totalAmountKr: number; // Samanlagt áætlað verð (upphæð í kr.)
  averageInvoiceKr: number;
}

export interface DetailedMacroCategory {
  name: string;
  count: number;
  lines: number;
  pct: number;
  totalAmountKr: number;
  color: string;
  badgeBg: string;
  description: string;
  subcategories: SubcategoryItem[];
}

export const DETAILED_MACRO_CATEGORIES: DetailedMacroCategory[] = [
  {
    name: 'Húsnæði & Almennur Rekstur',
    count: 87,
    lines: 4898773,
    pct: 26.96,
    totalAmountKr: 428500000000,
    color: 'bg-sky-600',
    badgeBg: 'bg-sky-50 text-sky-800 border-sky-200',
    description: 'Rafmagn, hiti, vatn, mannvirki, lagnir, viðhaldssamningar, ræsting, skrifstofuáhöld og öryggisgæsla.',
    subcategories: [
      { id: 'h-1', name: 'Rafmagn', lines: 575420, pctOfMacro: 11.7, totalAmountKr: 62500000000, averageInvoiceKr: 108616 },
      { id: 'h-2', name: 'Einnota vörur og áhöld', lines: 552140, pctOfMacro: 11.3, totalAmountKr: 28400000000, averageInvoiceKr: 51436 },
      { id: 'h-3', name: 'Hreinlætisvörur & ræsting', lines: 245190, pctOfMacro: 5.0, totalAmountKr: 21800000000, averageInvoiceKr: 88910 },
      { id: 'h-4', name: 'Ritföng, pappír og skrifstofuvörur', lines: 224350, pctOfMacro: 4.6, totalAmountKr: 14200000000, averageInvoiceKr: 63293 },
      { id: 'h-5', name: 'Viðhaldssamningar og eftirlit', lines: 171200, pctOfMacro: 3.5, totalAmountKr: 38900000000, averageInvoiceKr: 227219 },
      { id: 'h-6', name: 'Brennsluolía og eldsneyti vélbúnaðar', lines: 163526, pctOfMacro: 3.3, totalAmountKr: 41200000000, averageInvoiceKr: 251947 },
      { id: 'h-7', name: 'Rafverk- og verkstæði', lines: 134082, pctOfMacro: 2.7, totalAmountKr: 24600000000, averageInvoiceKr: 183469 },
      { id: 'h-8', name: 'Raflagnaefni og ljósabúnaður', lines: 128408, pctOfMacro: 2.6, totalAmountKr: 15300000000, averageInvoiceKr: 119151 },
      { id: 'h-9', name: 'Mannvirkjagerð, ósundurliðuð', lines: 127484, pctOfMacro: 2.6, totalAmountKr: 56400000000, averageInvoiceKr: 442408 },
      { id: 'h-10', name: 'Heitt vatn og hitaveita', lines: 120840, pctOfMacro: 2.5, totalAmountKr: 29800000000, averageInvoiceKr: 246607 },
      { id: 'h-11', name: 'Vinnufatnaður og fatapeningar', lines: 108228, pctOfMacro: 2.2, totalAmountKr: 8900000000, averageInvoiceKr: 82233 },
      { id: 'h-12', name: 'Aðrar byggingarvörur', lines: 96448, pctOfMacro: 2.0, totalAmountKr: 12800000000, averageInvoiceKr: 132714 },
      { id: 'h-13', name: 'Vörur til hita-, vatns- og holræsalagna', lines: 86266, pctOfMacro: 1.8, totalAmountKr: 11400000000, averageInvoiceKr: 132149 },
      { id: 'h-14', name: 'Tréverk- og trésmíðaverkstæði', lines: 81285, pctOfMacro: 1.7, totalAmountKr: 14700000000, averageInvoiceKr: 180845 },
      { id: 'h-15', name: 'Þvottahús og efnalaugar', lines: 73635, pctOfMacro: 1.5, totalAmountKr: 6800000000, averageInvoiceKr: 92347 },
      { id: 'h-16', name: 'Varahlutir vegna tækja og áhalda', lines: 64771, pctOfMacro: 1.3, totalAmountKr: 9200000000, averageInvoiceKr: 142038 },
      { id: 'h-17', name: 'Öryggisgæsla og eftirlitskerfi', lines: 58920, pctOfMacro: 1.2, totalAmountKr: 8400000000, averageInvoiceKr: 142566 },
      { id: 'h-18', name: 'Járn og annar málmur', lines: 51667, pctOfMacro: 1.1, totalAmountKr: 6500000000, averageInvoiceKr: 125805 },
      { id: 'h-19', name: 'Málningarvörur og lakk', lines: 45393, pctOfMacro: 0.9, totalAmountKr: 4200000000, averageInvoiceKr: 92525 },
      { id: 'h-20', name: 'Kostnaðarhlutdeild í sameiginlegu húsnæði', lines: 42818, pctOfMacro: 0.9, totalAmountKr: 9600000000, averageInvoiceKr: 224204 },
      { id: 'h-21', name: 'Pípulagnir og lagnavinna', lines: 42735, pctOfMacro: 0.9, totalAmountKr: 7900000000, averageInvoiceKr: 184859 },
      { id: 'h-22', name: 'Aðrir orkugjafar (gas, rafeldsneyti)', lines: 40271, pctOfMacro: 0.8, totalAmountKr: 3800000000, averageInvoiceKr: 94360 },
      { id: 'h-23', name: 'Blikk- og vélsmiðjur', lines: 35073, pctOfMacro: 0.7, totalAmountKr: 5600000000, averageInvoiceKr: 159667 },
      { id: 'h-24', name: 'Innréttingar og föst húsgögn', lines: 30982, pctOfMacro: 0.6, totalAmountKr: 4900000000, averageInvoiceKr: 158156 },
      { id: 'h-25', name: 'Sorp, sorphirða og förgunargjöld', lines: 28450, pctOfMacro: 0.6, totalAmountKr: 3200000000, averageInvoiceKr: 112478 },
      { id: 'h-26', name: 'Húsnæðisleiga og fasteignaskuldbindingar', lines: 24890, pctOfMacro: 0.5, totalAmountKr: 15200000000, averageInvoiceKr: 610687 },
      { id: 'h-27', name: 'Önnur húsnæðis- og verkviðhaldsliðir (61 tegund)', lines: 1546780, pctOfMacro: 31.6, totalAmountKr: 78500000000, averageInvoiceKr: 50750 }
    ]
  },
  {
    name: 'Heilbrigði & Lyf',
    count: 40,
    lines: 3529560,
    pct: 19.43,
    totalAmountKr: 512000000000,
    color: 'bg-emerald-600',
    badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    description: 'Öll lyfjakaup ríkisins, spítalavörur, lækningatæki, sýklalyf, prófefni og súrefni/innöndunarlyf.',
    subcategories: [
      { id: 'l-1', name: 'Einnota sjúkrahúsvörur og hjúkrunargögn', lines: 970400, pctOfMacro: 27.5, totalAmountKr: 68400000000, averageInvoiceKr: 70486 },
      { id: 'l-2', name: 'Lyf með 24% VSK', lines: 778100, pctOfMacro: 22.0, totalAmountKr: 142500000000, averageInvoiceKr: 183138 },
      { id: 'l-3', name: 'Lyf I (sjúkrahúslyf & sérlyf)', lines: 683200, pctOfMacro: 19.4, totalAmountKr: 168000000000, averageInvoiceKr: 245901 },
      { id: 'l-4', name: 'Lyf II (almenn lyfseðilsskyld)', lines: 297400, pctOfMacro: 8.4, totalAmountKr: 46200000000, averageInvoiceKr: 155346 },
      { id: 'l-5', name: 'Prófefni og greiningarefni f. rannsóknir', lines: 193200, pctOfMacro: 5.5, totalAmountKr: 31800000000, averageInvoiceKr: 164596 },
      { id: 'l-6', name: 'Lækningatæki og skurðáhöld', lines: 148500, pctOfMacro: 4.2, totalAmountKr: 28900000000, averageInvoiceKr: 194612 },
      { id: 'l-7', name: 'Efni til innöndunar (súrefni, lofttegundir)', lines: 40636, pctOfMacro: 1.2, totalAmountKr: 5800000000, averageInvoiceKr: 142730 },
      { id: 'l-8', name: 'Sótthreinsiefni og sótthreinsibúnaður', lines: 38400, pctOfMacro: 1.1, totalAmountKr: 4200000000, averageInvoiceKr: 109375 },
      { id: 'l-9', name: 'Gerviliðir og ígræðsluefni', lines: 24100, pctOfMacro: 0.7, totalAmountKr: 8700000000, averageInvoiceKr: 360995 },
      { id: 'l-10', name: 'Önnur lyf og sérhæfð heilbrigðisgögn (31 tegund)', lines: 355624, pctOfMacro: 10.1, totalAmountKr: 8000000000, averageInvoiceKr: 22495 }
    ]
  },
  {
    name: 'Matur & Veitingar',
    count: 16,
    lines: 2777541,
    pct: 15.29,
    totalAmountKr: 89400000000,
    color: 'bg-amber-600',
    badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
    description: 'Mötuneyti ríkisins, spítalamatur, vistheimili, veitingar og kaffistofur.',
    subcategories: [
      { id: 'm-1', name: 'Matvörur (almennar innkaupaafurðir)', lines: 1163400, pctOfMacro: 41.9, totalAmountKr: 39500000000, averageInvoiceKr: 33952 },
      { id: 'm-2', name: 'Matvæli með 11% VSK', lines: 727800, pctOfMacro: 26.2, totalAmountKr: 24800000000, averageInvoiceKr: 34075 },
      { id: 'm-3', name: 'Keyptar tilbúnar máltíðir og kaffiveitingar', lines: 407200, pctOfMacro: 14.7, totalAmountKr: 13900000000, averageInvoiceKr: 34135 },
      { id: 'm-4', name: 'Drykkjarvörur, mjólk og safar', lines: 279300, pctOfMacro: 10.1, totalAmountKr: 6200000000, averageInvoiceKr: 22198 },
      { id: 'm-5', name: 'Bökunarvörur og brauðmeti', lines: 98400, pctOfMacro: 3.5, totalAmountKr: 2800000000, averageInvoiceKr: 28455 },
      { id: 'm-6', name: 'Ávextir og grænmeti', lines: 72400, pctOfMacro: 2.6, totalAmountKr: 1800000000, averageInvoiceKr: 24861 },
      { id: 'm-7', name: 'Aðrar matvörur og kaffistofuaðföng (10 tegundir)', lines: 29041, pctOfMacro: 1.0, totalAmountKr: 400000000, averageInvoiceKr: 13773 }
    ]
  },
  {
    name: 'Skattar & Fjármagnsliðir',
    count: 83,
    lines: 2506059,
    pct: 13.79,
    totalAmountKr: 345000000000,
    color: 'bg-indigo-600',
    badgeBg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    description: 'Virðisaukaskattur (VSK), innskattur, tollar, bankagjöld, dráttarvextir og afrúningur vinnslna.',
    subcategories: [
      { id: 's-1', name: 'Uppgjörsreikningur virðisaukaskatts (VSK)', lines: 409300, pctOfMacro: 16.3, totalAmountKr: 148000000000, averageInvoiceKr: 361592 },
      { id: 's-2', name: 'Endurgreiddur VSK til ríkisstofnana', lines: 343200, pctOfMacro: 13.7, totalAmountKr: -78000000000, averageInvoiceKr: -227272 },
      { id: 's-3', name: 'VSK innskattur efra þrep (24%)', lines: 170400, pctOfMacro: 6.8, totalAmountKr: 62000000000, averageInvoiceKr: 363849 },
      { id: 's-4', name: 'Þjónustugjöld fjármálastofnana og banka', lines: 166200, pctOfMacro: 6.6, totalAmountKr: 14800000000, averageInvoiceKr: 89049 },
      { id: 's-5', name: 'Dráttarvextir', lines: 82975, pctOfMacro: 3.3, totalAmountKr: 4200000000, averageInvoiceKr: 50617 },
      { id: 's-6', name: 'Afrúningur (sjálfvirkar bókhaldsvinnslur)', lines: 55462, pctOfMacro: 2.2, totalAmountKr: 240000000, averageInvoiceKr: 4327 },
      { id: 's-7', name: 'Tollar og innflutningsgjöld', lines: 48900, pctOfMacro: 2.0, totalAmountKr: 18500000000, averageInvoiceKr: 378323 },
      { id: 's-8', name: 'Aðrir skattar, vextir og gjöld (76 tegundir)', lines: 1229622, pctOfMacro: 49.1, totalAmountKr: 175260000000, averageInvoiceKr: 142531 }
    ]
  },
  {
    name: 'UT & Fjarskipti',
    count: 28,
    lines: 1648531,
    pct: 9.07,
    totalAmountKr: 142000000000,
    color: 'bg-purple-600',
    badgeBg: 'bg-purple-50 text-purple-800 border-purple-200',
    description: 'Hugbúnaðarleyfi, hýsing, tölvubúnaður, símar, netáskriftir og tæknihýsing ríkisins.',
    subcategories: [
      { id: 'u-1', name: 'Símagjöld, tengingar og afnotalínur', lines: 742300, pctOfMacro: 45.0, totalAmountKr: 28500000000, averageInvoiceKr: 38394 },
      { id: 'u-2', name: 'Hugbúnaðarleyfi og SaaS áskriftir', lines: 189400, pctOfMacro: 11.5, totalAmountKr: 49200000000, averageInvoiceKr: 259767 },
      { id: 'u-3', name: 'Auka- og varahlutir fyrir tölvubúnað', lines: 171100, pctOfMacro: 10.4, totalAmountKr: 14200000000, averageInvoiceKr: 82992 },
      { id: 'u-4', name: 'Tölvur, skjáir og vinnustöðvar', lines: 112400, pctOfMacro: 6.8, totalAmountKr: 22800000000, averageInvoiceKr: 202846 },
      { id: 'u-5', name: 'Gagnahýsing og tölvuský', lines: 44896, pctOfMacro: 2.7, totalAmountKr: 16400000000, averageInvoiceKr: 365288 },
      { id: 'u-6', name: 'Netþjónusta og gagnaflutningur', lines: 39800, pctOfMacro: 2.4, totalAmountKr: 4900000000, averageInvoiceKr: 123115 },
      { id: 'u-7', name: 'Prentarar og skannabúnaður', lines: 28400, pctOfMacro: 1.7, totalAmountKr: 3200000000, averageInvoiceKr: 112676 },
      { id: 'u-8', name: 'Aðrir tölvuliðir og fylgihlutir (21 tegund)', lines: 320235, pctOfMacro: 19.4, totalAmountKr: 2800000000, averageInvoiceKr: 8743 }
    ]
  },
  {
    name: 'Samgöngur & Flutningar',
    count: 35,
    lines: 1186251,
    pct: 6.53,
    totalAmountKr: 98000000000,
    color: 'bg-orange-600',
    badgeBg: 'bg-orange-50 text-orange-800 border-orange-200',
    description: 'Vöruflutningar, hraðflutningar, bílaleigur, leigubílar, annar akstur og flugfargjöld.',
    subcategories: [
      { id: 't-1', name: 'Vöru- og hraðflutningar (land og sjór)', lines: 272400, pctOfMacro: 23.0, totalAmountKr: 26800000000, averageInvoiceKr: 98384 },
      { id: 't-2', name: 'Bílaleigubifreiðar og skammtímaleiga', lines: 193200, pctOfMacro: 16.3, totalAmountKr: 18200000000, averageInvoiceKr: 94202 },
      { id: 't-3', name: 'Annar akstur, leigubílar og skutlþjónusta', lines: 128421, pctOfMacro: 10.8, totalAmountKr: 8400000000, averageInvoiceKr: 65409 },
      { id: 't-4', name: 'Póstþjónusta og bréfberun', lines: 98500, pctOfMacro: 8.3, totalAmountKr: 4200000000, averageInvoiceKr: 42639 },
      { id: 't-5', name: 'Flugfargjöld innanlands', lines: 84100, pctOfMacro: 7.1, totalAmountKr: 11500000000, averageInvoiceKr: 136741 },
      { id: 't-6', name: 'Flugfargjöld til útlanda', lines: 62400, pctOfMacro: 5.3, totalAmountKr: 14800000000, averageInvoiceKr: 237179 },
      { id: 't-7', name: 'Bifreiðaviðgerðir og varahlutir ökutækja', lines: 58900, pctOfMacro: 5.0, totalAmountKr: 7900000000, averageInvoiceKr: 134125 },
      { id: 't-8', name: 'Aðrir flutningar og ferðakostnaður (28 tegundir)', lines: 288330, pctOfMacro: 24.3, totalAmountKr: 6200000000, averageInvoiceKr: 21503 }
    ]
  },
  {
    name: 'Annað & Sérhæft',
    count: 234,
    lines: 752676,
    pct: 4.14,
    totalAmountKr: 56000000000,
    color: 'bg-neutral-600',
    badgeBg: 'bg-neutral-100 text-neutral-800 border-neutral-200',
    description: 'Rannsóknarstofur, smærri ótilgreind aðföng og örsmáu stök prófunargildin (1–9 færslur).',
    subcategories: [
      { id: 'a-1', name: 'Rannsóknarstofur án VSK', lines: 244100, pctOfMacro: 32.4, totalAmountKr: 22400000000, averageInvoiceKr: 91765 },
      { id: 'a-2', name: 'Aðrar ótilgreindar rekstrarvörur', lines: 239200, pctOfMacro: 31.8, totalAmountKr: 18500000000, averageInvoiceKr: 77341 },
      { id: 'a-3', name: 'Önnur sérhæfð þjónusta', lines: 43645, pctOfMacro: 5.8, totalAmountKr: 4900000000, averageInvoiceKr: 112269 },
      { id: 'a-4', name: 'Aðrir ótilgreindir bókhaldsliðir', lines: 51017, pctOfMacro: 6.8, totalAmountKr: 3800000000, averageInvoiceKr: 74485 },
      { id: 'a-5', name: 'Sjaldgæf stök tilvik og prófunarfærslur (230 tegundir)', lines: 174714, pctOfMacro: 23.2, totalAmountKr: 6400000000, averageInvoiceKr: 36631 }
    ]
  },
  {
    name: 'Sérfræðiþjónusta & Ráðgjöf',
    count: 20,
    lines: 336319,
    pct: 1.85,
    totalAmountKr: 68500000000,
    color: 'bg-blue-600',
    badgeBg: 'bg-blue-50 text-blue-800 border-blue-200',
    description: 'Lögfræðiþjónusta, endurskoðun, verkfræðingar, arkitektar, tæknifræðingar og rannsóknir.',
    subcategories: [
      { id: 'sf-1', name: 'Sérfræðiþjónusta (almenn ráðgjöf)', lines: 98400, pctOfMacro: 29.3, totalAmountKr: 21400000000, averageInvoiceKr: 217479 },
      { id: 'sf-2', name: 'Ráðgjafarþjónusta og stjórnunarstuðningur', lines: 84200, pctOfMacro: 25.0, totalAmountKr: 16900000000, averageInvoiceKr: 200712 },
      { id: 'sf-3', name: 'Verkfræðingar, tæknifræðingar og arkitektar', lines: 49466, pctOfMacro: 14.7, totalAmountKr: 14500000000, averageInvoiceKr: 293130 },
      { id: 'sf-4', name: 'Endurskoðun og bókhaldsþjónusta', lines: 38900, pctOfMacro: 11.6, totalAmountKr: 7200000000, averageInvoiceKr: 185089 },
      { id: 'sf-5', name: 'Lögfræðiþjónusta og málflutningur', lines: 34100, pctOfMacro: 10.1, totalAmountKr: 6100000000, averageInvoiceKr: 178885 },
      { id: 'sf-6', name: 'Þýðingar og túlkaþjónusta', lines: 21253, pctOfMacro: 6.3, totalAmountKr: 1900000000, averageInvoiceKr: 89399 },
      { id: 'sf-7', name: 'Aðrir sérfræðingar (14 tegundir)', lines: 10000, pctOfMacro: 3.0, totalAmountKr: 500000000, averageInvoiceKr: 50000 }
    ]
  },
  {
    name: 'Fræðsla, Menntun & Útgáfa',
    count: 10,
    lines: 287785,
    pct: 1.58,
    totalAmountKr: 32000000000,
    color: 'bg-teal-600',
    badgeBg: 'bg-teal-50 text-teal-800 border-teal-200',
    description: 'Kennsluefni, skólabækur, tímarit, fræðirit, fagblöð í áskrift og námskeiðahald.',
    subcategories: [
      { id: 'fr-1', name: 'Kennsluefni, skólabækur og kennslugögn', lines: 118400, pctOfMacro: 41.1, totalAmountKr: 14200000000, averageInvoiceKr: 119932 },
      { id: 'fr-2', name: 'Tímarit, blöð og gagnagrunnar í áskrift', lines: 84200, pctOfMacro: 29.3, totalAmountKr: 7900000000, averageInvoiceKr: 93824 },
      { id: 'fr-3', name: 'Námskeið og endurmenntun starfsmanna', lines: 48900, pctOfMacro: 17.0, totalAmountKr: 6200000000, averageInvoiceKr: 126789 },
      { id: 'fr-4', name: 'Ráðstefnugjöld og þing', lines: 24100, pctOfMacro: 8.4, totalAmountKr: 2800000000, averageInvoiceKr: 116182 },
      { id: 'fr-5', name: 'Önnur útgáfa og fræðslugögn (6 tegundir)', lines: 12185, pctOfMacro: 4.2, totalAmountKr: 900000000, averageInvoiceKr: 73861 }
    ]
  },
  {
    name: 'Auglýsingar, Kynning & Prentun',
    count: 10,
    lines: 221291,
    pct: 1.22,
    totalAmountKr: 24800000000,
    color: 'bg-pink-600',
    badgeBg: 'bg-pink-50 text-pink-800 border-pink-200',
    description: 'Ljósritun, prentvörur, auglýsingabirtingar í miðlum, vefauglýsingar og grafísk hönnun.',
    subcategories: [
      { id: 'au-1', name: 'Ljósritunar-, prent- og fjölritunarvörur', lines: 142405, pctOfMacro: 64.3, totalAmountKr: 12400000000, averageInvoiceKr: 87075 },
      { id: 'au-2', name: 'Auglýsingar og birtingar í miðlum', lines: 44200, pctOfMacro: 20.0, totalAmountKr: 7800000000, averageInvoiceKr: 176470 },
      { id: 'au-3', name: 'Prentun skýrslna, bæklinga og ársskýrslna', lines: 18900, pctOfMacro: 8.5, totalAmountKr: 2600000000, averageInvoiceKr: 137566 },
      { id: 'au-4', name: 'Grafísk hönnun, ljósmyndun og vefkynning', lines: 11200, pctOfMacro: 5.1, totalAmountKr: 1600000000, averageInvoiceKr: 142857 },
      { id: 'au-5', name: 'Önnur kynningarefni (6 tegundir)', lines: 4586, pctOfMacro: 2.1, totalAmountKr: 400000000, averageInvoiceKr: 87221 }
    ]
  },
  {
    name: 'Styrkir & Framlög',
    count: 28,
    lines: 13309,
    pct: 0.07,
    totalAmountKr: 48900000000,
    color: 'bg-lime-600',
    badgeBg: 'bg-lime-50 text-lime-800 border-lime-200',
    description: 'Styrkir til félagasamtaka, menningarmála, rekstrarframlög og opinberir styrkir.',
    subcategories: [
      { id: 'st-1', name: 'Rekstrarstyrkir til stofnana og félagasamtaka', lines: 5400, pctOfMacro: 40.6, totalAmountKr: 24500000000, averageInvoiceKr: 4537037 },
      { id: 'st-2', name: 'Menningar-, lista- og rannsóknarstyrkir', lines: 4200, pctOfMacro: 31.6, totalAmountKr: 14200000000, averageInvoiceKr: 3380952 },
      { id: 'st-3', name: 'Framlög í sérstaka samstarfssjóði', lines: 2100, pctOfMacro: 15.8, totalAmountKr: 7800000000, averageInvoiceKr: 3714285 },
      { id: 'st-4', name: 'Aðrir styrkir og bótaliðir (25 tegundir)', lines: 1609, pctOfMacro: 12.1, totalAmountKr: 2400000000, averageInvoiceKr: 1491609 }
    ]
  },
  {
    name: 'Laun & Starfsmannakostnaður',
    count: 16,
    lines: 9219,
    pct: 0.05,
    totalAmountKr: 38500000000,
    color: 'bg-rose-600',
    badgeBg: 'bg-rose-50 text-rose-800 border-rose-200',
    description: 'Lífeyrisiðgjöld, orlofsreikningar og sérstakar greiðslur í gegnum FJS-Launakerfið.',
    subcategories: [
      { id: 'la-1', name: 'FJS-LAUN lífeyrisiðgjald og samtrygging', lines: 3800, pctOfMacro: 41.2, totalAmountKr: 18500000000, averageInvoiceKr: 4868421 },
      { id: 'la-2', name: 'Orlof, skuldbindingar og lokafrágangur', lines: 2400, pctOfMacro: 26.0, totalAmountKr: 9200000000, averageInvoiceKr: 3833333 },
      { id: 'la-3', name: 'Slysabætur og starfsmannatryggingar', lines: 1800, pctOfMacro: 19.5, totalAmountKr: 6400000000, averageInvoiceKr: 3555555 },
      { id: 'la-4', name: 'Aðrir launaliðir í reikningakerfi (13 tegundir)', lines: 1219, pctOfMacro: 13.2, totalAmountKr: 4400000000, averageInvoiceKr: 3609516 }
    ]
  }
];
