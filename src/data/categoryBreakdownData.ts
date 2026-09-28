export interface SubcategoryItem {
  id: string;
  name: string;
  code?: string; // Bókhaldslykill / tegund_heiti í gagnagrunni (t.d. 'spítalamatur')
  lines: number;
  pctOfMacro: number;
  totalAmountKr: number; // Samanlagt áætlað verð (upphæð í kr.)
  averageInvoiceKr: number;
  defaultMacro?: string; // Upprunalegur yfirflokkur
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

export const ALL_MACRO_NAMES = [
  'Húsnæði & Almennur Rekstur',
  'Heilbrigði & Lyf',
  'Matur & Veitingar',
  'Skattar & Fjármagnsliðir',
  'UT & Fjarskipti',
  'Samgöngur & Flutningar',
  'Annað & Sérhæft',
  'Sérfræðiþjónusta & Ráðgjöf',
  'Fræðsla, Menntun & Útgáfa',
  'Auglýsingar, Kynning & Prentun',
  'Styrkir & Framlög',
  'Laun & Starfsmannakostnaður'
] as const;

export type MacroCategoryName = typeof ALL_MACRO_NAMES[number];

export const MACRO_COLORS: Record<string, string> = {
  'Húsnæði & Almennur Rekstur': 'bg-sky-600',
  'Heilbrigði & Lyf': 'bg-emerald-600',
  'Matur & Veitingar': 'bg-amber-600',
  'Skattar & Fjármagnsliðir': 'bg-indigo-600',
  'UT & Fjarskipti': 'bg-purple-600',
  'Samgöngur & Flutningar': 'bg-orange-600',
  'Annað & Sérhæft': 'bg-neutral-600',
  'Sérfræðiþjónusta & Ráðgjöf': 'bg-blue-600',
  'Fræðsla, Menntun & Útgáfa': 'bg-teal-600',
  'Auglýsingar, Kynning & Prentun': 'bg-pink-600',
  'Styrkir & Framlög': 'bg-lime-600',
  'Laun & Starfsmannakostnaður': 'bg-rose-600'
};

export const MACRO_BADGES: Record<string, string> = {
  'Húsnæði & Almennur Rekstur': 'bg-sky-50 text-sky-800 border-sky-200',
  'Heilbrigði & Lyf': 'bg-emerald-50 text-emerald-800 border-emerald-200',
  'Matur & Veitingar': 'bg-amber-50 text-amber-800 border-amber-200',
  'Skattar & Fjármagnsliðir': 'bg-indigo-50 text-indigo-800 border-indigo-200',
  'UT & Fjarskipti': 'bg-purple-50 text-purple-800 border-purple-200',
  'Samgöngur & Flutningar': 'bg-orange-50 text-orange-800 border-orange-200',
  'Annað & Sérhæft': 'bg-neutral-100 text-neutral-800 border-neutral-200',
  'Sérfræðiþjónusta & Ráðgjöf': 'bg-blue-50 text-blue-800 border-blue-200',
  'Fræðsla, Menntun & Útgáfa': 'bg-teal-50 text-teal-800 border-teal-200',
  'Auglýsingar, Kynning & Prentun': 'bg-pink-50 text-pink-800 border-pink-200',
  'Styrkir & Framlög': 'bg-lime-50 text-lime-800 border-lime-200',
  'Laun & Starfsmannakostnaður': 'bg-rose-50 text-rose-800 border-rose-200'
};

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
      { id: 'h-1', code: 'rafmagn', name: 'Rafmagn', lines: 575420, pctOfMacro: 11.7, totalAmountKr: 62500000000, averageInvoiceKr: 108616, defaultMacro: 'Húsnæði & Almennur Rekstur' },
      { id: 'h-2', code: 'einnota_vorur_og_ahold', name: 'Einnota vörur og áhöld', lines: 552140, pctOfMacro: 11.3, totalAmountKr: 28400000000, averageInvoiceKr: 51436, defaultMacro: 'Húsnæði & Almennur Rekstur' },
      { id: 'h-3', code: 'hreinlaetisvorur', name: 'Hreinlætisvörur & ræsting', lines: 245190, pctOfMacro: 5.0, totalAmountKr: 21800000000, averageInvoiceKr: 88910, defaultMacro: 'Húsnæði & Almennur Rekstur' },
      { id: 'h-4', code: 'ritfong_skrifstofuvorur', name: 'Ritföng, pappír og skrifstofuvörur', lines: 224350, pctOfMacro: 4.6, totalAmountKr: 14200000000, averageInvoiceKr: 63293, defaultMacro: 'Húsnæði & Almennur Rekstur' },
      { id: 'h-5', code: 'vidhaldssamningar', name: 'Viðhaldssamningar og eftirlit', lines: 171200, pctOfMacro: 3.5, totalAmountKr: 38900000000, averageInvoiceKr: 227219, defaultMacro: 'Húsnæði & Almennur Rekstur' },
      { id: 'h-6', code: 'brennsluolia_eldsneyti', name: 'Brennsluolía og eldsneyti vélbúnaðar', lines: 163526, pctOfMacro: 3.3, totalAmountKr: 41200000000, averageInvoiceKr: 251947, defaultMacro: 'Húsnæði & Almennur Rekstur' },
      { id: 'h-7', code: 'rafverk_verkstaedi', name: 'Rafverk- og verkstæði', lines: 134082, pctOfMacro: 2.7, totalAmountKr: 24600000000, averageInvoiceKr: 183469, defaultMacro: 'Húsnæði & Almennur Rekstur' },
      { id: 'h-8', code: 'raflagnaefni_ljos', name: 'Raflagnaefni og ljósabúnaður', lines: 128408, pctOfMacro: 2.6, totalAmountKr: 15300000000, averageInvoiceKr: 119151, defaultMacro: 'Húsnæði & Almennur Rekstur' },
      { id: 'h-9', code: 'mannvirkjagerd', name: 'Mannvirkjagerð, ósundurliðuð', lines: 127484, pctOfMacro: 2.6, totalAmountKr: 56400000000, averageInvoiceKr: 442408, defaultMacro: 'Húsnæði & Almennur Rekstur' },
      { id: 'h-10', code: 'heitt_vatn_hitaveita', name: 'Heitt vatn og hitaveita', lines: 120840, pctOfMacro: 2.5, totalAmountKr: 29800000000, averageInvoiceKr: 246607, defaultMacro: 'Húsnæði & Almennur Rekstur' },
      { id: 'h-11', code: 'vinnufatnadur', name: 'Vinnufatnaður og fatapeningar', lines: 108228, pctOfMacro: 2.2, totalAmountKr: 8900000000, averageInvoiceKr: 82233, defaultMacro: 'Húsnæði & Almennur Rekstur' },
      { id: 'h-12', code: 'adrar_byggingarvorur', name: 'Aðrar byggingarvörur', lines: 96448, pctOfMacro: 2.0, totalAmountKr: 12800000000, averageInvoiceKr: 132714, defaultMacro: 'Húsnæði & Almennur Rekstur' },
      { id: 'h-13', code: 'vorur_hita_vatn_holraesi', name: 'Vörur til hita-, vatns- og holræsalagna', lines: 86266, pctOfMacro: 1.8, totalAmountKr: 11400000000, averageInvoiceKr: 132149, defaultMacro: 'Húsnæði & Almennur Rekstur' },
      { id: 'h-14', code: 'treverk_tresmidi', name: 'Tréverk- og trésmíðaverkstæði', lines: 81285, pctOfMacro: 1.7, totalAmountKr: 14700000000, averageInvoiceKr: 180845, defaultMacro: 'Húsnæði & Almennur Rekstur' },
      { id: 'h-15', code: 'thvottahus_efnalaugar', name: 'Þvottahús og efnalaugar', lines: 73635, pctOfMacro: 1.5, totalAmountKr: 6800000000, averageInvoiceKr: 92347, defaultMacro: 'Húsnæði & Almennur Rekstur' },
      { id: 'h-16', code: 'varahlutir_taekja', name: 'Varahlutir vegna tækja og áhalda', lines: 64771, pctOfMacro: 1.3, totalAmountKr: 9200000000, averageInvoiceKr: 142038, defaultMacro: 'Húsnæði & Almennur Rekstur' },
      { id: 'h-17', code: 'oryggisgaesla', name: 'Öryggisgæsla og eftirlitskerfi', lines: 58920, pctOfMacro: 1.2, totalAmountKr: 8400000000, averageInvoiceKr: 142566, defaultMacro: 'Húsnæði & Almennur Rekstur' },
      { id: 'h-18', code: 'jarn_malmur', name: 'Járn og annar málmur', lines: 51667, pctOfMacro: 1.1, totalAmountKr: 6500000000, averageInvoiceKr: 125805, defaultMacro: 'Húsnæði & Almennur Rekstur' },
      { id: 'h-19', code: 'malningarvorur_lakk', name: 'Málningarvörur og lakk', lines: 45393, pctOfMacro: 0.9, totalAmountKr: 4200000000, averageInvoiceKr: 92525, defaultMacro: 'Húsnæði & Almennur Rekstur' },
      { id: 'h-20', code: 'sameiginlegt_husnaedi', name: 'Kostnaðarhlutdeild í sameiginlegu húsnæði', lines: 42818, pctOfMacro: 0.9, totalAmountKr: 9600000000, averageInvoiceKr: 224204, defaultMacro: 'Húsnæði & Almennur Rekstur' },
      { id: 'h-21', code: 'pipulagnir', name: 'Pípulagnir og lagnavinna', lines: 42735, pctOfMacro: 0.9, totalAmountKr: 7900000000, averageInvoiceKr: 184859, defaultMacro: 'Húsnæði & Almennur Rekstur' },
      { id: 'h-22', code: 'orkugjafar_gas', name: 'Aðrir orkugjafar (gas, rafeldsneyti)', lines: 40271, pctOfMacro: 0.8, totalAmountKr: 3800000000, averageInvoiceKr: 94360, defaultMacro: 'Húsnæði & Almennur Rekstur' },
      { id: 'h-23', code: 'blikk_velsmidjur', name: 'Blikk- og vélsmiðjur', lines: 35073, pctOfMacro: 0.7, totalAmountKr: 5600000000, averageInvoiceKr: 159667, defaultMacro: 'Húsnæði & Almennur Rekstur' },
      { id: 'h-24', code: 'innrettingar_husgogn', name: 'Innréttingar og föst húsgögn', lines: 30982, pctOfMacro: 0.6, totalAmountKr: 4900000000, averageInvoiceKr: 158156, defaultMacro: 'Húsnæði & Almennur Rekstur' },
      { id: 'h-25', code: 'sorphirda_forgun', name: 'Sorp, sorphirða og förgunargjöld', lines: 28450, pctOfMacro: 0.6, totalAmountKr: 3200000000, averageInvoiceKr: 112478, defaultMacro: 'Húsnæði & Almennur Rekstur' },
      { id: 'h-26', code: 'husnaedisleiga', name: 'Húsnæðisleiga og fasteignaskuldbindingar', lines: 24890, pctOfMacro: 0.5, totalAmountKr: 15200000000, averageInvoiceKr: 610687, defaultMacro: 'Húsnæði & Almennur Rekstur' },
      { id: 'h-27', code: 'onnur_husnaedis_vidhald', name: 'Önnur húsnæðis- og verkviðhaldsliðir (61 tegund)', lines: 1546780, pctOfMacro: 31.6, totalAmountKr: 78500000000, averageInvoiceKr: 50750, defaultMacro: 'Húsnæði & Almennur Rekstur' }
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
      { id: 'l-1', code: 'sjukrahusvorur_hjukrun', name: 'Einnota sjúkrahúsvörur og hjúkrunargögn', lines: 970400, pctOfMacro: 27.5, totalAmountKr: 68400000000, averageInvoiceKr: 70486, defaultMacro: 'Heilbrigði & Lyf' },
      { id: 'l-2', code: 'lyf_24_vsk', name: 'Lyf með 24% VSK', lines: 778100, pctOfMacro: 22.0, totalAmountKr: 142500000000, averageInvoiceKr: 183138, defaultMacro: 'Heilbrigði & Lyf' },
      { id: 'l-3', code: 'lyf_1_sjukrahuslyf', name: 'Lyf I (sjúkrahúslyf & sérlyf)', lines: 683200, pctOfMacro: 19.4, totalAmountKr: 168000000000, averageInvoiceKr: 245901, defaultMacro: 'Heilbrigði & Lyf' },
      { id: 'l-4', code: 'lyf_2_lyfsedilsskyld', name: 'Lyf II (almenn lyfseðilsskyld)', lines: 297400, pctOfMacro: 8.4, totalAmountKr: 46200000000, averageInvoiceKr: 155346, defaultMacro: 'Heilbrigði & Lyf' },
      { id: 'l-5', code: 'profefni_greiningarefni', name: 'Prófefni og greiningarefni f. rannsóknir', lines: 193200, pctOfMacro: 5.5, totalAmountKr: 31800000000, averageInvoiceKr: 164596, defaultMacro: 'Heilbrigði & Lyf' },
      { id: 'l-6', code: 'laekningataeki_skurdahold', name: 'Lækningatæki og skurðáhöld', lines: 148500, pctOfMacro: 4.2, totalAmountKr: 28900000000, averageInvoiceKr: 194612, defaultMacro: 'Heilbrigði & Lyf' },
      { id: 'l-7', code: 'efni_til_innondunar', name: 'Efni til innöndunar (súrefni, lofttegundir)', lines: 40636, pctOfMacro: 1.2, totalAmountKr: 5800000000, averageInvoiceKr: 142730, defaultMacro: 'Heilbrigði & Lyf' },
      { id: 'l-8', code: 'sotthreinsiefni', name: 'Sótthreinsiefni og sótthreinsibúnaður', lines: 38400, pctOfMacro: 1.1, totalAmountKr: 4200000000, averageInvoiceKr: 109375, defaultMacro: 'Heilbrigði & Lyf' },
      { id: 'l-9', code: 'gervilir_igraedsluefni', name: 'Gerviliðir og ígræðsluefni', lines: 24100, pctOfMacro: 0.7, totalAmountKr: 8700000000, averageInvoiceKr: 360995, defaultMacro: 'Heilbrigði & Lyf' },
      { id: 'l-10', code: 'onnur_lyf_heilbrigdisgogn', name: 'Önnur lyf og sérhæfð heilbrigðisgögn (31 tegund)', lines: 355624, pctOfMacro: 10.1, totalAmountKr: 8000000000, averageInvoiceKr: 22495, defaultMacro: 'Heilbrigði & Lyf' }
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
      { id: 'm-spitalamatur', code: 'spítalamatur', name: 'Spítalamatur (Sjúklingafæði & deildamatur)', lines: 184500, pctOfMacro: 6.6, totalAmountKr: 7200000000, averageInvoiceKr: 39024, defaultMacro: 'Matur & Veitingar' },
      { id: 'm-1', code: 'matvorur_almennar', name: 'Matvörur (almennar innkaupaafurðir)', lines: 978900, pctOfMacro: 35.3, totalAmountKr: 32300000000, averageInvoiceKr: 32996, defaultMacro: 'Matur & Veitingar' },
      { id: 'm-2', code: 'matvaeli_11_vsk', name: 'Matvæli með 11% VSK', lines: 727800, pctOfMacro: 26.2, totalAmountKr: 24800000000, averageInvoiceKr: 34075, defaultMacro: 'Matur & Veitingar' },
      { id: 'm-3', code: 'keyptar_maltidir', name: 'Keyptar tilbúnar máltíðir og kaffiveitingar', lines: 407200, pctOfMacro: 14.7, totalAmountKr: 13900000000, averageInvoiceKr: 34135, defaultMacro: 'Matur & Veitingar' },
      { id: 'm-4', code: 'drykkjarvorur', name: 'Drykkjarvörur, mjólk og safar', lines: 279300, pctOfMacro: 10.1, totalAmountKr: 6200000000, averageInvoiceKr: 22198, defaultMacro: 'Matur & Veitingar' },
      { id: 'm-5', code: 'bokunarvorur', name: 'Bökunarvörur og brauðmeti', lines: 98400, pctOfMacro: 3.5, totalAmountKr: 2800000000, averageInvoiceKr: 28455, defaultMacro: 'Matur & Veitingar' },
      { id: 'm-6', code: 'avextir_graenmeti', name: 'Ávextir og grænmeti', lines: 72400, pctOfMacro: 2.6, totalAmountKr: 1800000000, averageInvoiceKr: 24861, defaultMacro: 'Matur & Veitingar' },
      { id: 'm-7', code: 'adrar_matvorur', name: 'Aðrar matvörur og kaffistofuaðföng (10 tegundir)', lines: 29041, pctOfMacro: 1.0, totalAmountKr: 400000000, averageInvoiceKr: 13773, defaultMacro: 'Matur & Veitingar' }
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
      { id: 's-1', code: 'uppgjor_vsk', name: 'Uppgjörsreikningur virðisaukaskatts (VSK)', lines: 409300, pctOfMacro: 16.3, totalAmountKr: 148000000000, averageInvoiceKr: 361592, defaultMacro: 'Skattar & Fjármagnsliðir' },
      { id: 's-2', code: 'endurgreiddur_vsk', name: 'Endurgreiddur VSK til ríkisstofnana', lines: 343200, pctOfMacro: 13.7, totalAmountKr: -78000000000, averageInvoiceKr: -227272, defaultMacro: 'Skattar & Fjármagnsliðir' },
      { id: 's-3', code: 'innskattur_24', name: 'VSK innskattur efra þrep (24%)', lines: 170400, pctOfMacro: 6.8, totalAmountKr: 62000000000, averageInvoiceKr: 363849, defaultMacro: 'Skattar & Fjármagnsliðir' },
      { id: 's-4', code: 'thjonustugjold_banka', name: 'Þjónustugjöld fjármálastofnana og banka', lines: 166200, pctOfMacro: 6.6, totalAmountKr: 14800000000, averageInvoiceKr: 89049, defaultMacro: 'Skattar & Fjármagnsliðir' },
      { id: 's-5', code: 'drattarvextir', name: 'Dráttarvextir', lines: 82975, pctOfMacro: 3.3, totalAmountKr: 4200000000, averageInvoiceKr: 50617, defaultMacro: 'Skattar & Fjármagnsliðir' },
      { id: 's-6', code: 'afruningur_bokhald', name: 'Afrúningur (sjálfvirkar bókhaldsvinnslur)', lines: 55462, pctOfMacro: 2.2, totalAmountKr: 240000000, averageInvoiceKr: 4327, defaultMacro: 'Skattar & Fjármagnsliðir' },
      { id: 's-7', code: 'tollar_innflutningur', name: 'Tollar og innflutningsgjöld', lines: 48900, pctOfMacro: 2.0, totalAmountKr: 18500000000, averageInvoiceKr: 378323, defaultMacro: 'Skattar & Fjármagnsliðir' },
      { id: 's-8', code: 'adrir_skattar_vextir', name: 'Aðrir skattar, vextir og gjöld (76 tegundir)', lines: 1229622, pctOfMacro: 49.1, totalAmountKr: 175260000000, averageInvoiceKr: 142531, defaultMacro: 'Skattar & Fjármagnsliðir' }
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
      { id: 'u-1', code: 'simagjold_tengingar', name: 'Símagjöld, tengingar og afnotalínur', lines: 742300, pctOfMacro: 45.0, totalAmountKr: 28500000000, averageInvoiceKr: 38394, defaultMacro: 'UT & Fjarskipti' },
      { id: 'u-2', code: 'hugbunadarleyfi_saas', name: 'Hugbúnaðarleyfi og SaaS áskriftir', lines: 189400, pctOfMacro: 11.5, totalAmountKr: 49200000000, averageInvoiceKr: 259767, defaultMacro: 'UT & Fjarskipti' },
      { id: 'u-3', code: 'varahlutir_tolvur', name: 'Auka- og varahlutir fyrir tölvubúnað', lines: 171100, pctOfMacro: 10.4, totalAmountKr: 14200000000, averageInvoiceKr: 82992, defaultMacro: 'UT & Fjarskipti' },
      { id: 'u-4', code: 'tolvur_skjar_vinnustodvar', name: 'Tölvur, skjáir og vinnustöðvar', lines: 112400, pctOfMacro: 6.8, totalAmountKr: 22800000000, averageInvoiceKr: 202846, defaultMacro: 'UT & Fjarskipti' },
      { id: 'u-5', code: 'gagnahysing_tolvusky', name: 'Gagnahýsing og tölvuský', lines: 44896, pctOfMacro: 2.7, totalAmountKr: 16400000000, averageInvoiceKr: 365288, defaultMacro: 'UT & Fjarskipti' },
      { id: 'u-6', code: 'netthjonusta_flutningur', name: 'Netþjónusta og gagnaflutningur', lines: 39800, pctOfMacro: 2.4, totalAmountKr: 4900000000, averageInvoiceKr: 123115, defaultMacro: 'UT & Fjarskipti' },
      { id: 'u-7', code: 'prentarar_skannar', name: 'Prentarar og skannabúnaður', lines: 28400, pctOfMacro: 1.7, totalAmountKr: 3200000000, averageInvoiceKr: 112676, defaultMacro: 'UT & Fjarskipti' },
      { id: 'u-8', code: 'adrir_tolvulidir', name: 'Aðrir tölvuliðir og fylgihlutir (21 tegund)', lines: 320235, pctOfMacro: 19.4, totalAmountKr: 2800000000, averageInvoiceKr: 8743, defaultMacro: 'UT & Fjarskipti' }
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
      { id: 't-1', code: 'voruflutningar_hradflutningar', name: 'Vöru- og hraðflutningar (land og sjór)', lines: 272400, pctOfMacro: 23.0, totalAmountKr: 26800000000, averageInvoiceKr: 98384, defaultMacro: 'Samgöngur & Flutningar' },
      { id: 't-2', code: 'bilaleigubilar', name: 'Bílaleigubifreiðar og skammtímaleiga', lines: 193200, pctOfMacro: 16.3, totalAmountKr: 18200000000, averageInvoiceKr: 94202, defaultMacro: 'Samgöngur & Flutningar' },
      { id: 't-3', code: 'akstur_leigubilar', name: 'Annar akstur, leigubílar og skutlþjónusta', lines: 128421, pctOfMacro: 10.8, totalAmountKr: 8400000000, averageInvoiceKr: 65409, defaultMacro: 'Samgöngur & Flutningar' },
      { id: 't-4', code: 'postthjonusta', name: 'Póstþjónusta og bréfberun', lines: 98500, pctOfMacro: 8.3, totalAmountKr: 4200000000, averageInvoiceKr: 42639, defaultMacro: 'Samgöngur & Flutningar' },
      { id: 't-5', code: 'flugfargjold_innanlands', name: 'Flugfargjöld innanlands', lines: 84100, pctOfMacro: 7.1, totalAmountKr: 11500000000, averageInvoiceKr: 136741, defaultMacro: 'Samgöngur & Flutningar' },
      { id: 't-6', code: 'flugfargjold_utlanda', name: 'Flugfargjöld til útlanda', lines: 62400, pctOfMacro: 5.3, totalAmountKr: 14800000000, averageInvoiceKr: 237179, defaultMacro: 'Samgöngur & Flutningar' },
      { id: 't-7', code: 'bifreidavidgerdir', name: 'Bifreiðaviðgerðir og varahlutir ökutækja', lines: 58900, pctOfMacro: 5.0, totalAmountKr: 7900000000, averageInvoiceKr: 134125, defaultMacro: 'Samgöngur & Flutningar' },
      { id: 't-8', code: 'adrir_flutningar', name: 'Aðrir flutningar og ferðakostnaður (28 tegundir)', lines: 288330, pctOfMacro: 24.3, totalAmountKr: 6200000000, averageInvoiceKr: 21503, defaultMacro: 'Samgöngur & Flutningar' }
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
      { id: 'a-1', code: 'rannsoknarstofur_an_vsk', name: 'Rannsóknarstofur án VSK', lines: 244100, pctOfMacro: 32.4, totalAmountKr: 22400000000, averageInvoiceKr: 91765, defaultMacro: 'Annað & Sérhæft' },
      { id: 'a-2', code: 'adrar_otilgreindar_rekstrarvorur', name: 'Aðrar ótilgreindar rekstrarvörur', lines: 239200, pctOfMacro: 31.8, totalAmountKr: 18500000000, averageInvoiceKr: 77341, defaultMacro: 'Annað & Sérhæft' },
      { id: 'a-3', code: 'onnur_serhaefd_thjonusta', name: 'Önnur sérhæfð þjónusta', lines: 43645, pctOfMacro: 5.8, totalAmountKr: 4900000000, averageInvoiceKr: 112269, defaultMacro: 'Annað & Sérhæft' },
      { id: 'a-4', code: 'adrir_otilgreindir_lidir', name: 'Aðrir ótilgreindir bókhaldsliðir', lines: 51017, pctOfMacro: 6.8, totalAmountKr: 3800000000, averageInvoiceKr: 74485, defaultMacro: 'Annað & Sérhæft' },
      { id: 'a-5', code: 'sjaldgaef_tilvik_profun', name: 'Sjaldgæf stök tilvik og prófunarfærslur (230 tegundir)', lines: 174714, pctOfMacro: 23.2, totalAmountKr: 6400000000, averageInvoiceKr: 36631, defaultMacro: 'Annað & Sérhæft' }
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
      { id: 'sf-1', code: 'serfraedithjonusta_radgjof', name: 'Sérfræðiþjónusta (almenn ráðgjöf)', lines: 98400, pctOfMacro: 29.3, totalAmountKr: 21400000000, averageInvoiceKr: 217479, defaultMacro: 'Sérfræðiþjónusta & Ráðgjöf' },
      { id: 'sf-2', code: 'radgjafarthjonusta_stjornun', name: 'Ráðgjafarþjónusta og stjórnunarstuðningur', lines: 84200, pctOfMacro: 25.0, totalAmountKr: 16900000000, averageInvoiceKr: 200712, defaultMacro: 'Sérfræðiþjónusta & Ráðgjöf' },
      { id: 'sf-3', code: 'verkfraedingar_arkitektar', name: 'Verkfræðingar, tæknifræðingar og arkitektar', lines: 49466, pctOfMacro: 14.7, totalAmountKr: 14500000000, averageInvoiceKr: 293130, defaultMacro: 'Sérfræðiþjónusta & Ráðgjöf' },
      { id: 'sf-4', code: 'endurskodun_bokhald', name: 'Endurskoðun og bókhaldsþjónusta', lines: 38900, pctOfMacro: 11.6, totalAmountKr: 7200000000, averageInvoiceKr: 185089, defaultMacro: 'Sérfræðiþjónusta & Ráðgjöf' },
      { id: 'sf-5', code: 'logfraedithjonusta', name: 'Lögfræðiþjónusta og málflutningur', lines: 34100, pctOfMacro: 10.1, totalAmountKr: 6100000000, averageInvoiceKr: 178885, defaultMacro: 'Sérfræðiþjónusta & Ráðgjöf' },
      { id: 'sf-6', code: 'thyddarar_tulkar', name: 'Þýðingar og túlkaþjónusta', lines: 21253, pctOfMacro: 6.3, totalAmountKr: 1900000000, averageInvoiceKr: 89399, defaultMacro: 'Sérfræðiþjónusta & Ráðgjöf' },
      { id: 'sf-7', code: 'adrir_serfraedingar', name: 'Aðrir sérfræðingar (14 tegundir)', lines: 10000, pctOfMacro: 3.0, totalAmountKr: 500000000, averageInvoiceKr: 50000, defaultMacro: 'Sérfræðiþjónusta & Ráðgjöf' }
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
      { id: 'fr-1', code: 'kennsluefni_skolabækur', name: 'Kennsluefni, skólabækur og kennslugögn', lines: 118400, pctOfMacro: 41.1, totalAmountKr: 14200000000, averageInvoiceKr: 119932, defaultMacro: 'Fræðsla, Menntun & Útgáfa' },
      { id: 'fr-2', code: 'timarit_blod_askrift', name: 'Tímarit, blöð og gagnagrunnar í áskrift', lines: 84200, pctOfMacro: 29.3, totalAmountKr: 7900000000, averageInvoiceKr: 93824, defaultMacro: 'Fræðsla, Menntun & Útgáfa' },
      { id: 'fr-3', code: 'namskeid_starfsmenn', name: 'Námskeið og endurmenntun starfsmanna', lines: 48900, pctOfMacro: 17.0, totalAmountKr: 6200000000, averageInvoiceKr: 126789, defaultMacro: 'Fræðsla, Menntun & Útgáfa' },
      { id: 'fr-4', code: 'radstefnugjold', name: 'Ráðstefnugjöld og þing', lines: 24100, pctOfMacro: 8.4, totalAmountKr: 2800000000, averageInvoiceKr: 116182, defaultMacro: 'Fræðsla, Menntun & Útgáfa' },
      { id: 'fr-5', code: 'onnur_utgafa', name: 'Önnur útgáfa og fræðslugögn (6 tegundir)', lines: 12185, pctOfMacro: 4.2, totalAmountKr: 900000000, averageInvoiceKr: 73861, defaultMacro: 'Fræðsla, Menntun & Útgáfa' }
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
      { id: 'au-1', code: 'ljosritun_prentvorur', name: 'Ljósritunar-, prent- og fjölritunarvörur', lines: 142405, pctOfMacro: 64.3, totalAmountKr: 12400000000, averageInvoiceKr: 87075, defaultMacro: 'Auglýsingar, Kynning & Prentun' },
      { id: 'au-2', code: 'auglysingar_midlar', name: 'Auglýsingar og birtingar í miðlum', lines: 44200, pctOfMacro: 20.0, totalAmountKr: 7800000000, averageInvoiceKr: 176470, defaultMacro: 'Auglýsingar, Kynning & Prentun' },
      { id: 'au-3', code: 'prentun_skyrslna_baeklinga', name: 'Prentun skýrslna, bæklinga og ársskýrslna', lines: 18900, pctOfMacro: 8.5, totalAmountKr: 2600000000, averageInvoiceKr: 137566, defaultMacro: 'Auglýsingar, Kynning & Prentun' },
      { id: 'au-4', code: 'grafisk_honnun_vefkynning', name: 'Grafísk hönnun, ljósmyndun og vefkynning', lines: 11200, pctOfMacro: 5.1, totalAmountKr: 1600000000, averageInvoiceKr: 142857, defaultMacro: 'Auglýsingar, Kynning & Prentun' },
      { id: 'au-5', code: 'onnur_kynningarefni', name: 'Önnur kynningarefni (6 tegundir)', lines: 4586, pctOfMacro: 2.1, totalAmountKr: 400000000, averageInvoiceKr: 87221, defaultMacro: 'Auglýsingar, Kynning & Prentun' }
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
      { id: 'st-1', code: 'rekstrarstyrkir_stofnana', name: 'Rekstrarstyrkir til stofnana og félagasamtaka', lines: 5400, pctOfMacro: 40.6, totalAmountKr: 24500000000, averageInvoiceKr: 4537037, defaultMacro: 'Styrkir & Framlög' },
      { id: 'st-2', code: 'menningar_listastyrkir', name: 'Menningar-, lista- og rannsóknarstyrkir', lines: 4200, pctOfMacro: 31.6, totalAmountKr: 14200000000, averageInvoiceKr: 3380952, defaultMacro: 'Styrkir & Framlög' },
      { id: 'st-3', code: 'samstarfssjodir', name: 'Framlög í sérstaka samstarfssjóði', lines: 2100, pctOfMacro: 15.8, totalAmountKr: 7800000000, averageInvoiceKr: 3714285, defaultMacro: 'Styrkir & Framlög' },
      { id: 'st-4', code: 'adrir_styrkir_botir', name: 'Aðrir styrkir og bótaliðir (25 tegundir)', lines: 1609, pctOfMacro: 12.1, totalAmountKr: 2400000000, averageInvoiceKr: 1491609, defaultMacro: 'Styrkir & Framlög' }
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
      { id: 'la-1', code: 'fjs_laun_lifeyrisidgjald', name: 'FJS-LAUN lífeyrisiðgjald og samtrygging', lines: 3800, pctOfMacro: 41.2, totalAmountKr: 18500000000, averageInvoiceKr: 4868421, defaultMacro: 'Laun & Starfsmannakostnaður' },
      { id: 'la-2', code: 'orlof_skuldbindingar', name: 'Orlof, skuldbindingar og lokafrágangur', lines: 2400, pctOfMacro: 26.0, totalAmountKr: 9200000000, averageInvoiceKr: 3833333, defaultMacro: 'Laun & Starfsmannakostnaður' },
      { id: 'la-3', code: 'slysabaetur_tryggingar', name: 'Slysabætur og starfsmannatryggingar', lines: 1800, pctOfMacro: 19.5, totalAmountKr: 6400000000, averageInvoiceKr: 3555555, defaultMacro: 'Laun & Starfsmannakostnaður' },
      { id: 'la-4', code: 'adrir_launalidir', name: 'Aðrir launaliðir í reikningakerfi (13 tegundir)', lines: 1219, pctOfMacro: 13.2, totalAmountKr: 4400000000, averageInvoiceKr: 3609516, defaultMacro: 'Laun & Starfsmannakostnaður' }
    ]
  }
];
