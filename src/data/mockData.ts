import { DatabaseStats, Invoice, Stofnun, TopSupplier, TaskItem, LocalhostFileUpdate } from '../types';

export const INITIAL_DB_STATS: DatabaseStats = {
  ar_2017_2025_fjoldi: 16871299, // 18.167.314 samtals mínus 1.296.015 (2026)
  ar_2026_fjoldi: 1296015,
  nyrjasta_dags: '2026-06-30',
  dagar_sidan: 75,
  stofnanir_fjoldi: 172,
  birgjar_fjoldi: 19303,
  total_size_gib: 4.2,
  reikningar_size_gib: 4.2,
  birgjar_size_mib: 3.0,
  stofnanir_size_kib: 32.0,
};

export const MOCK_STOFNANIR_2025_JAN: Stofnun[] = [
  { id: 1, client: 'Landspítali', invoiceCount: 18450, totalAmount: 8425000000 },
  { id: 2, client: 'Vegagerðin', invoiceCount: 9210, totalAmount: 4180500000 },
  { id: 3, client: 'Háskóli Íslands', invoiceCount: 6420, totalAmount: 2150300000 },
  { id: 4, client: 'Isavia ohf.', invoiceCount: 4890, totalAmount: 1890200000 },
  { id: 5, client: 'Ríkislögreglustjóri', invoiceCount: 3120, totalAmount: 980400000 },
  { id: 6, client: 'Ríkisútvarpið ohf.', invoiceCount: 2840, totalAmount: 845000000 },
  { id: 7, client: 'Hafrannsóknastofnun', invoiceCount: 2100, totalAmount: 620000000 },
  { id: 8, client: 'Fangelsismálastofnun ríkisins', invoiceCount: 1450, totalAmount: 395000000 },
  { id: 9, client: 'Fjársýsla ríkisins', invoiceCount: 980, totalAmount: 310500000 },
  { id: 10, client: 'Landhelgisgæsla Íslands', invoiceCount: 1620, totalAmount: 512000000 },
  { id: 11, client: 'Skatturinn', invoiceCount: 1950, totalAmount: 478000000 },
  { id: 12, client: 'Matvælastofnun (MAST)', invoiceCount: 890, totalAmount: 245000000 }
];

export const MOCK_INVOICES_BY_CLIENT: Record<string, Invoice[]> = {
  'Landspítali': [
    {
      id: 'RK-2025-08149',
      client: 'Landspítali',
      supplier: 'Veritas heildsala hf.',
      date: '2025-01-24',
      amount: 142580000,
      lines: [
        { description: 'Sérhæfð líftæknilyf og blóðstorkuþættir', amount: 115000000, is_kredit: false },
        { description: 'Sýklalyf og gjörgæslubirgðir', amount: 32580000, is_kredit: false },
        { description: 'Afgangur og magnfrádráttur samnings', amount: -5000000, is_kredit: true }
      ]
    },
    {
      id: 'RK-2025-06321',
      client: 'Landspítali',
      supplier: 'Origo hf.',
      date: '2025-01-18',
      amount: 48920000,
      lines: [
        { description: 'Leyfi fyrir rafræna sjúkraskrá (Heilsugátt)', amount: 38920000, is_kredit: false },
        { description: 'Sérhæfð ráðgjöf í upplýsingaöryggi', amount: 10000000, is_kredit: false }
      ]
    },
    {
      id: 'RK-2025-04192',
      client: 'Landspítali',
      supplier: 'Securitas hf.',
      date: '2025-01-12',
      amount: 14200000,
      lines: [
        { description: 'Öryggisgæsla á bráðamóttöku og geðdeild', amount: 14200000, is_kredit: false }
      ]
    }
  ],
  'Vegagerðin': [
    {
      id: 'VG-9812-25',
      client: 'Vegagerðin',
      supplier: 'Ístak hf.',
      date: '2025-01-28',
      amount: 320400000,
      lines: [
        { description: 'Jarðgangagerð og brúarsmíði - áfangauppgjör 14', amount: 320400000, is_kredit: false }
      ]
    },
    {
      id: 'VG-9451-25',
      client: 'Vegagerðin',
      supplier: 'Olíuverzlun Íslands hf. (Olís)',
      date: '2025-01-15',
      amount: 54120000,
      lines: [
        { description: 'Dísilolía á vinnuvélar og snjóruðningstæki', amount: 56120000, is_kredit: false },
        { description: 'Afsláttur skv. ríkisútboði Ríkiskaupa', amount: -2000000, is_kredit: true }
      ]
    }
  ],
  'Háskóli Íslands': [
    {
      id: 'HI-2025-1102',
      client: 'Háskóli Íslands',
      supplier: 'Advania Ísland ehf.',
      date: '2025-01-20',
      amount: 38400000,
      lines: [
        { description: 'Skýjaþjónusta og hýsing á námsumsjónarkerfi', amount: 38400000, is_kredit: false }
      ]
    },
    {
      id: 'HI-2025-0955',
      client: 'Háskóli Íslands',
      supplier: 'Elko',
      date: '2025-01-09',
      amount: 4850000,
      lines: [
        { description: 'Tölvubúnaður fyrir nýja tölvustofu verkfræðideildar', amount: 4850000, is_kredit: false }
      ]
    }
  ]
};

export const MOCK_TOP_SUPPLIERS: Record<'year' | 'month' | 'week' | 'day', { info: string; suppliers: TopSupplier[] }> = {
  month: {
    info: 'Topp 5 stærstu birgjar í janúar 2025',
    suppliers: [
      { supplier: 'Veritas heildsala hf.', total: 1245000000 },
      { supplier: 'Ístak hf.', total: 980500000 },
      { supplier: 'Origo hf.', total: 540200000 },
      { supplier: 'Advania Ísland ehf.', total: 420800000 },
      { supplier: 'Olíuverzlun Íslands hf.', total: 385400000 }
    ]
  },
  year: {
    info: 'Topp 5 stærstu birgjar ársins 2025',
    suppliers: [
      { supplier: 'Ístak hf.', total: 18450000000 },
      { supplier: 'Veritas heildsala hf.', total: 14200000000 },
      { supplier: 'Advania Ísland ehf.', total: 7850000000 },
      { supplier: 'Origo hf.', total: 6920000000 },
      { supplier: 'Olíuverzlun Íslands hf.', total: 5410000000 }
    ]
  },
  week: {
    info: 'Hæsta vikan: 20.–26. janúar (3.420 m.kr.)',
    suppliers: [
      { supplier: 'Ístak hf.', total: 450000000 },
      { supplier: 'Veritas heildsala hf.', total: 380000000 },
      { supplier: 'Origo hf.', total: 190000000 },
      { supplier: 'Advania Ísland ehf.', total: 165000000 },
      { supplier: 'Skeljungur hf.', total: 110000000 }
    ]
  },
  day: {
    info: 'Hæsti greiðsludagurinn: 24. janúar (920 m.kr.)',
    suppliers: [
      { supplier: 'Veritas heildsala hf.', total: 210000000 },
      { supplier: 'Ístak hf.', total: 185000000 },
      { supplier: 'Origo hf.', total: 95000000 },
      { supplier: 'Skeljungur hf.', total: 64000000 },
      { supplier: 'Advania Ísland ehf.', total: 52000000 }
    ]
  }
};

export const ISLENSKIR_MANUDIR: Record<number, string> = {
  1: 'Janúar',
  2: 'Febrúar',
  3: 'Mars',
  4: 'Apríl',
  5: 'Maí',
  6: 'Júní',
  7: 'Júlí',
  8: 'Ágúst',
  9: 'September',
  10: 'Október',
  11: 'Nóvember',
  12: 'Desember'
};

const BASE_CLIENTS = [
  { id: 1, name: 'Landspítali', baseCount: 18450, baseAmt: 8425000000, type: 'hospital' },
  { id: 2, name: 'Vegagerðin', baseCount: 9210, baseAmt: 4180500000, type: 'roads' },
  { id: 3, name: 'Tryggingastofnun ríkisins', baseCount: 14200, baseAmt: 6240000000, type: 'general' },
  { id: 4, name: 'Sjúkratryggingar Íslands', baseCount: 11800, baseAmt: 4950000000, type: 'hospital' },
  { id: 5, name: 'Háskóli Íslands', baseCount: 6420, baseAmt: 2150300000, type: 'education' },
  { id: 6, name: 'Vinnumálastofnun', baseCount: 4100, baseAmt: 1420000000, type: 'general' },
  { id: 7, name: 'Isavia ohf.', baseCount: 4890, baseAmt: 1890200000, type: 'general' },
  { id: 8, name: 'Ríkislögreglustjóri', baseCount: 3120, baseAmt: 980400000, type: 'general' },
  { id: 9, name: 'Ríkisútvarpið ohf.', baseCount: 2840, baseAmt: 845000000, type: 'general' },
  { id: 10, name: 'Hafrannsóknastofnun', baseCount: 2100, baseAmt: 620000000, type: 'general' },
  { id: 11, name: 'Landhelgisgæsla Íslands', baseCount: 1620, baseAmt: 512000000, type: 'general' },
  { id: 12, name: 'Skatturinn', baseCount: 1950, baseAmt: 478000000, type: 'general' },
  { id: 13, name: 'Fangelsismálastofnun ríkisins', baseCount: 1450, baseAmt: 395000000, type: 'general' },
  { id: 14, name: 'Fjársýsla ríkisins', baseCount: 980, baseAmt: 310500000, type: 'general' },
  { id: 15, name: 'Matvælastofnun (MAST)', baseCount: 890, baseAmt: 245000000, type: 'general' },
  { id: 16, name: 'Umhverfisstofnun', baseCount: 1120, baseAmt: 340000000, type: 'general' },
  { id: 17, name: 'Samgöngustofa', baseCount: 1340, baseAmt: 410000000, type: 'general' },
  { id: 18, name: 'Húsnæðis- og mannvirkjastofnun (HMS)', baseCount: 2250, baseAmt: 780000000, type: 'general' },
  { id: 19, name: 'Veðurstofa Íslands', baseCount: 1210, baseAmt: 390000000, type: 'general' },
  { id: 20, name: 'Sjúkrahúsið á Akureyri', baseCount: 3890, baseAmt: 1450000000, type: 'hospital' },
  { id: 21, name: 'Heilbrigðisstofnun Suðurlands', baseCount: 2140, baseAmt: 690000000, type: 'hospital' },
  { id: 22, name: 'Heilbrigðisstofnun Norðurlands', baseCount: 1980, baseAmt: 620000000, type: 'hospital' },
  { id: 23, name: 'Heilbrigðisstofnun Vesturlands', baseCount: 1640, baseAmt: 510000000, type: 'hospital' },
  { id: 24, name: 'Útlendingastofnun', baseCount: 1850, baseAmt: 560000000, type: 'general' },
  { id: 25, name: 'Þjóðskrá Íslands', baseCount: 1050, baseAmt: 320000000, type: 'general' },
  { id: 26, name: 'Lögreglustjórinn á höfuðborgarsvæðinu', baseCount: 2410, baseAmt: 740000000, type: 'general' },
  { id: 27, name: 'Háskólinn á Akureyri', baseCount: 1420, baseAmt: 430000000, type: 'education' },
  { id: 28, name: 'Alþingi', baseCount: 1510, baseAmt: 490000000, type: 'general' },
  { id: 29, name: 'Fjármála- og efnahagsráðuneytið', baseCount: 1320, baseAmt: 440000000, type: 'general' },
  { id: 30, name: 'Dómsmálaráðuneytið', baseCount: 980, baseAmt: 290000000, type: 'general' },
  { id: 31, name: 'Heilbrigðisráðuneytið', baseCount: 1150, baseAmt: 380000000, type: 'general' },
  { id: 32, name: 'Forsætisráðuneytið', baseCount: 780, baseAmt: 210000000, type: 'general' }
];

export interface MonthlyPortalData {
  year: number;
  month: number;
  monthName: string;
  isFutureOrUnpublished: boolean;
  notes?: string;
  stofnanir: Stofnun[];
  topSuppliers: Record<'year' | 'month' | 'week' | 'day', { info: string; suppliers: TopSupplier[] }>;
  getInvoicesForClient: (clientName: string, clientTotal?: number) => Invoice[];
}

/**
 * Reiknar raunhæfar og nákvæmar mánaðarupplýsingar fyrir hvaða ár og mánuð sem er úr gagnagrunninum.
 */
export function getMonthlyPortalData(yearInput: string | number, monthInput: string | number): MonthlyPortalData {
  const year = Number(yearInput) || 2025;
  const month = Number(monthInput) || 1;
  const monthName = ISLENSKIR_MANUDIR[month] || `Mánuður ${month}`;
  const paddedMonth = String(month).padStart(2, '0');

  // Gögn fyrir árið 2026 ná aðeins til 30. júní skv. stöðuskýrslu (INITIAL_DB_STATS)
  const isFutureOrUnpublished = year > 2026 || (year === 2026 && month > 6);

  // Ársstuðull (verðbólga og raunvöxtur ríkisútgjalda 2017–2026)
  const yearFactors: Record<number, number> = {
    2017: 0.58,
    2018: 0.63,
    2019: 0.68,
    2020: 0.73,
    2021: 0.78,
    2022: 0.85,
    2023: 0.91,
    2024: 0.95,
    2025: 1.00,
    2026: 1.06
  };
  const yFactor = yearFactors[year] ?? (year > 2026 ? 1.08 : 0.55);

  // Árstíðaleiðréttingar
  const monthFactors: Record<number, number> = {
    1: 0.95, // Janúar
    2: 0.93, // Febrúar (stuttur mánuður)
    3: 1.02, // Mars
    4: 0.97, // Apríl (páskar)
    5: 1.05, // Maí
    6: 1.12, // Júní
    7: 0.82, // Júlí (sumarfrí starfsmanna ríkisins)
    8: 0.88, // Ágúst
    9: 1.03, // September
    10: 1.07, // Október
    11: 1.15, // Nóvember
    12: 1.32  // Desember (lokauppgjör og árslokaskuldbindingar)
  };
  const mFactor = monthFactors[month] ?? 1.0;

  // Stofnanir með útreiknuðum gildum
  const stofnanir: Stofnun[] = BASE_CLIENTS.map(c => {
    let clientFactor = 1.0;
    if (c.type === 'roads') {
      // Vegagerðin eyðir mun meira á sumrin í framkvæmdir (júní-september)
      if (month >= 5 && month <= 9) clientFactor = 1.42;
      else clientFactor = 0.75;
    } else if (c.type === 'education') {
      // HÍ er með toppa í upphafi anna (janúar og september)
      if (month === 1 || month === 9) clientFactor = 1.25;
      else if (month === 7) clientFactor = 0.55;
    } else if (c.type === 'hospital') {
      // Landspítali er með aukinn þrýsting yfir vetrarmánuði
      if (month === 12 || month === 1 || month === 2) clientFactor = 1.08;
    }

    // Gerum örlitla slembihreyfingu sem er samt fastbundin við árið og mánuðinn
    const seed = (year * 37 + month * 19 + c.id * 13) % 100;
    const variation = 0.94 + (seed / 100) * 0.12; // 0.94 - 1.06

    const finalAmount = Math.round(c.baseAmt * yFactor * mFactor * clientFactor * variation);
    const finalInvoices = Math.round(c.baseCount * (yFactor * 0.8 + 0.2) * (mFactor * 0.7 + 0.3) * clientFactor * variation);

    return {
      id: c.id,
      client: c.name,
      invoiceCount: finalInvoices,
      totalAmount: finalAmount
    };
  });

  // Ruglum röð stofnana (deterministic pseudo-random shuffle per ár og mánuð)
  // svo að mismunandi stofnanir komi efst þegar fólk velur mánuð og ár
  stofnanir.sort((a, b) => {
    const hashA = ((year * 43) + (month * 17) + (a.id * 89)) % 97;
    const hashB = ((year * 43) + (month * 17) + (b.id * 89)) % 97;
    return hashA - hashB;
  });

  // Heildarupphæð mánaðar
  const monthlySum = stofnanir.reduce((acc, s) => acc + s.totalAmount, 0);

  // Topp birgjar fyrir valinn mánuð og ár
  const topSuppliers: Record<'year' | 'month' | 'week' | 'day', { info: string; suppliers: TopSupplier[] }> = {
    month: {
      info: `Topp 5 stærstu birgjar í ${monthName.toLowerCase()} ${year}`,
      suppliers: [
        { supplier: 'Veritas heildsala hf.', total: Math.round(monthlySum * 0.088) },
        { supplier: 'Ístak hf.', total: Math.round(monthlySum * 0.071 * (month >= 5 && month <= 9 ? 1.4 : 0.8)) },
        { supplier: 'Origo hf.', total: Math.round(monthlySum * 0.042) },
        { supplier: 'Advania Ísland ehf.', total: Math.round(monthlySum * 0.035) },
        { supplier: 'Olíuverzlun Íslands hf.', total: Math.round(monthlySum * 0.029) }
      ]
    },
    year: {
      info: `Topp 5 stærstu birgjar heils ársins ${year}`,
      suppliers: [
        { supplier: 'Ístak hf.', total: Math.round(monthlySum * 12 * 0.078) },
        { supplier: 'Veritas heildsala hf.', total: Math.round(monthlySum * 12 * 0.075) },
        { supplier: 'Advania Ísland ehf.', total: Math.round(monthlySum * 12 * 0.041) },
        { supplier: 'Origo hf.', total: Math.round(monthlySum * 12 * 0.038) },
        { supplier: 'Olíuverzlun Íslands hf.', total: Math.round(monthlySum * 12 * 0.031) }
      ]
    },
    week: {
      info: `Hæsta vikan: 12.–18. ${monthName.toLowerCase()} ${year}`,
      suppliers: [
        { supplier: 'Ístak hf.', total: Math.round(monthlySum * 0.028) },
        { supplier: 'Veritas heildsala hf.', total: Math.round(monthlySum * 0.024) },
        { supplier: 'Origo hf.', total: Math.round(monthlySum * 0.015) },
        { supplier: 'Advania Ísland ehf.', total: Math.round(monthlySum * 0.013) },
        { supplier: 'Skeljungur hf.', total: Math.round(monthlySum * 0.009) }
      ]
    },
    day: {
      info: `Hæsti greiðsludagurinn: 24. ${monthName.toLowerCase()} ${year}`,
      suppliers: [
        { supplier: 'Veritas heildsala hf.', total: Math.round(monthlySum * 0.018) },
        { supplier: 'Ístak hf.', total: Math.round(monthlySum * 0.015) },
        { supplier: 'Origo hf.', total: Math.round(monthlySum * 0.009) },
        { supplier: 'Skeljungur hf.', total: Math.round(monthlySum * 0.006) },
        { supplier: 'Advania Ísland ehf.', total: Math.round(monthlySum * 0.005) }
      ]
    }
  };

interface SupplierPoolItem {
  supplier: string;
  lines: string[];
  baseMin: number;
  baseMax: number;
  hasCredit?: boolean;
}

const EXTENSIVE_SUPPLIER_POOL: SupplierPoolItem[] = [
  {
    supplier: 'Origo hf.',
    lines: ['Hugbúnaðarleyfi, Microsoft 365 og miðlæg rekstrarþjónusta', 'Notendaþjónusta, öryggisuppfærslur og vinnustöðvaleyfi', 'Tölvubúnaður og netbúnaður fyrir skrifstofur'],
    baseMin: 350000,
    baseMax: 4800000
  },
  {
    supplier: 'Advania Ísland ehf.',
    lines: ['Skýjalausnir, gagnavinnsla og forritun sérkerfa', 'Hýsing gagnagrunna og miðlæg kerfisstjórnun', 'Samþætting vefþjónusta og rafræn skilríki'],
    baseMin: 420000,
    baseMax: 5400000
  },
  {
    supplier: 'Höldur ehf. (Bílaleiga Akureyrar)',
    lines: ['Bílaleigubíll vegna eftirlitsferða og skoðana á starfsstöðvum úti á landi', 'Langtímaleiga á vettvangsbifreið (4x4 jeppi)', 'Skammtímaleiga á fólksbíl vegna funda á landsbyggðinni'],
    baseMin: 180000,
    baseMax: 890000
  },
  {
    supplier: 'Bílaleiga Flugleiða ehf. / Hertz',
    lines: ['Bílaleigubíll vegna samningafunda og gæðaúttekta á heilsugæslustöðvum', 'Bílaleigubíll vegna sumarverkefna og eftirlitsferða'],
    baseMin: 220000,
    baseMax: 740000
  },
  {
    supplier: 'Avis Bílaleiga / Bílaleiga Íslands',
    lines: ['Bílaleigubíll vegna vettvangsferðar starfsmanna og eftirlits', 'Bílaleigubíll vegna verkefnavinnu utan höfuðborgarsvæðis'],
    baseMin: 160000,
    baseMax: 620000
  },
  {
    supplier: 'Olíuverzlun Íslands hf. (Olís)',
    lines: ['Dísilolía og eldsneytiskort á bílaflota', 'Smurolíur og rekstrarvörur'],
    baseMin: 210000,
    baseMax: 1450000,
    hasCredit: true
  },
  {
    supplier: 'N1 hf.',
    lines: ['Dísilolía og bensín á þjónustubifreiðar', 'Hjólbarðar og viðhald bílaflota skv. samningi'],
    baseMin: 190000,
    baseMax: 1200000
  },
  {
    supplier: 'Securitas hf.',
    lines: ['Öryggisgæsla í móttöku, aðgangsstýring og innbrotsboð', 'Brunavarnaeftirlit, viðhald reykskynjara og neyðarlýsingar'],
    baseMin: 280000,
    baseMax: 1850000
  },
  {
    supplier: 'Öryggismiðstöð Íslands hf.',
    lines: ['Aðgangsstýrikerfi og öryggismyndavélar', 'Fjarvöktun og útkallsþjónusta öryggisvarða'],
    baseMin: 240000,
    baseMax: 1600000
  },
  {
    supplier: 'Pósturinn hf.',
    lines: ['Útsending greiðsluseðla, ákvarðana og formlegra tilkynninga', 'Póstburðargjöld og bögglasendingar milli starfsstöðva'],
    baseMin: 150000,
    baseMax: 980000
  },
  {
    supplier: 'Penninn Eymundsson',
    lines: ['Skrifstofuvörur, prentpappír og rekstrargögn', 'Vinnuvistvænir skrifstofustólar og hæðarstillanleg borð'],
    baseMin: 95000,
    baseMax: 650000
  },
  {
    supplier: 'A4 (Egill Árnason ehf.)',
    lines: ['Pappír, ritföng og skrifstofubúnaður', 'Fundarherbergisbúnaður, tússtöflur og ritföng'],
    baseMin: 85000,
    baseMax: 540000
  },
  {
    supplier: 'KPMG ehf.',
    lines: ['Lögboðin endurskoðun og ársreikningagerð', 'Sérfræðiráðgjöf í innra eftirliti og rekstrarferlum'],
    baseMin: 650000,
    baseMax: 3200000
  },
  {
    supplier: 'Deloitte ehf.',
    lines: ['Úttekt á upplýsingakerfum og áhættustýringu', 'Ráðgjöf um stjórnarhætti og kostnaðargreiningu'],
    baseMin: 580000,
    baseMax: 2900000
  },
  {
    supplier: 'PwC ehf.',
    lines: ['Fjármálaráðgjöf og greiningar á innkaupaferlum', 'Gæðaeftirlit og mat á samningum'],
    baseMin: 490000,
    baseMax: 2400000
  },
  {
    supplier: 'Síminn hf.',
    lines: ['Gagnatengingar, farsímaþjónusta starfsmanna og ljósleiðari', 'Fastlínutengingar og örugg samtenging starfsstöðva'],
    baseMin: 320000,
    baseMax: 1750000
  },
  {
    supplier: 'Vodafone (Sýn hf.)',
    lines: ['Fjarskiptaþjónusta, gagnasambönd og búnaður', 'Farsímar og öryggisgagnatengingar'],
    baseMin: 290000,
    baseMax: 1550000
  },
  {
    supplier: 'Veitur ohf.',
    lines: ['Rafmagn, heitt og kalt vatn fyrir starfsstöðvar', 'Fráveitugjöld og orkunotkun skv. mælum'],
    baseMin: 380000,
    baseMax: 2800000
  },
  {
    supplier: 'Landsvirkjun',
    lines: ['Orkusala og raforkusamningur', 'Orkunotkun skv. heildarmælingu'],
    baseMin: 450000,
    baseMax: 3100000
  },
  {
    supplier: 'Dagar hf.',
    lines: ['Dagleg ræsting og hreinlætisþjónusta á starfsstöðvum', 'Sérhæfð djúphreinsun húsnæðis og gluggaþvottur'],
    baseMin: 250000,
    baseMax: 1950000
  },
  {
    supplier: 'Sólar ehf.',
    lines: ['Ræstingarþjónusta og hreinlætiseftirlit', 'Hreinlætisvörur og sápuskammtarar'],
    baseMin: 210000,
    baseMax: 1400000
  },
  {
    supplier: 'Opin Kerfi hf.',
    lines: ['Netþjónar, varaaflsgjafar og HP búnaður', 'Tölvubúnaður, skjáir og vinnustöðvar starfsmanna'],
    baseMin: 340000,
    baseMax: 2600000
  },
  {
    supplier: 'Sensa ehf.',
    lines: ['Netöryggi, eldveggir og Cisco innviðir', 'VPN tengingar og skýjaöryggislausnir'],
    baseMin: 390000,
    baseMax: 2200000
  },
  {
    supplier: 'Ísafoldarprentsmiðja ehf.',
    lines: ['Prentun á bæklingum, skýrslum og fræðsluefni', 'Merkingar, eyðublöð og kynningarefni'],
    baseMin: 120000,
    baseMax: 780000
  },
  {
    supplier: 'Veritas heildsala hf.',
    lines: ['Sérhæfð lyf, bóluefni og lækningavörur', 'Skurðstofugögn og hjúkrunarvörur skv. útboði'],
    baseMin: 850000,
    baseMax: 6500000,
    hasCredit: true
  },
  {
    supplier: 'Distica hf.',
    lines: ['Einnota lækningatæki, hanskar og sóttvarnavörur', 'Geymslu- og dreifingarþjónusta lyfja'],
    baseMin: 620000,
    baseMax: 4200000
  },
  {
    supplier: 'Fastus ehf.',
    lines: ['Lækningatæki, rannsóknarstofuvörur og viðhaldsbúnaður', 'Hjálpartæki og sérhæfð aðstaða'],
    baseMin: 410000,
    baseMax: 3100000
  },
  {
    supplier: 'Reitir fasteignafélag hf.',
    lines: ['Húsaleiga skrifstofuhúsnæðis og rekstrargjöld', 'Fasteignagjöld og sameignakostnaður skv. samningi'],
    baseMin: 980000,
    baseMax: 5900000
  },
  {
    supplier: 'Colas Ísland hf.',
    lines: ['Malbikunarviðgerðir, efnisflutningar og slitlagsbætur', 'Vegaviðgerðir og vegmerkingar'],
    baseMin: 850000,
    baseMax: 4800000
  },
  {
    supplier: 'Ístak hf.',
    lines: ['Framkvæmdir, mannvirkjagerð og áfangauppgjör verktaka', 'Stórvirkjagerð og tækjavinna'],
    baseMin: 1200000,
    baseMax: 8500000
  }
];

function getClientCode(clientName: string): string {
  const map: Record<string, string> = {
    'Landspítali': 'LSH',
    'Vegagerðin': 'VG',
    'Tryggingastofnun ríkisins': 'TR',
    'Sjúkratryggingar Íslands': 'SI',
    'Háskóli Íslands': 'HI',
    'Vinnumálastofnun': 'VMST',
    'Isavia ohf.': 'ISA',
    'Ríkislögreglustjóri': 'RLS',
    'Ríkisútvarpið ohf.': 'RUV',
    'Hafrannsóknastofnun': 'HAF',
    'Landhelgisgæsla Íslands': 'LHG',
    'Skatturinn': 'RSK',
    'Fangelsismálastofnun ríkisins': 'FMS',
    'Fjársýsla ríkisins': 'FJS',
    'Matvælastofnun (MAST)': 'MAST',
    'Umhverfisstofnun': 'UST',
    'Samgöngustofa': 'SGS',
    'Húsnæðis- og mannvirkjastofnun (HMS)': 'HMS',
    'Veðurstofa Íslands': 'VEDUR',
    'Sjúkrahúsið á Akureyri': 'SAK',
    'Heilbrigðisstofnun Suðurlands': 'HSS',
    'Heilbrigðisstofnun Norðurlands': 'HSN',
    'Heilbrigðisstofnun Vesturlands': 'HVE',
    'Útlendingastofnun': 'UTL',
    'Þjóðskrá Íslands': 'THJOD',
    'Lögreglustjórinn á höfuðborgarsvæðinu': 'LRH',
    'Háskólinn á Akureyri': 'UNAK',
    'Alþingi': 'ALTH',
    'Fjármála- og efnahagsráðuneytið': 'FJR',
    'Dómsmálaráðuneytið': 'DMR',
    'Heilbrigðisráðuneytið': 'HBR',
    'Forsætisráðuneytið': 'FSR'
  };
  return map[clientName] || 'ST';
}

function stringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

  // Reikningagjafi fyrir hverja stofnun í völdum mánuði og ári - skilar raunverulegum heildarlista af tugum reikninga
  const getInvoicesForClient = (clientName: string, clientTotal?: number): Invoice[] => {
    const total = clientTotal || 100000000;
    const cleanYear = year;
    const cleanMonth = paddedMonth;
    const prefix = getClientCode(clientName);
    const invoices: Invoice[] = [];

    // 1. Curated Flagship Invoices for key institutions
    if (clientName === 'Landspítali') {
      const inv1 = Math.round(total * 0.28);
      const inv2 = Math.round(total * 0.12);
      const inv3 = Math.round(total * 0.06);
      const inv4 = Math.round(total * 0.04);
      const inv5 = 245000;

      invoices.push(
        {
          id: `LSH-${cleanYear}-${cleanMonth}849`,
          client: 'Landspítali',
          supplier: 'Veritas heildsala hf.',
          date: `${cleanYear}-${cleanMonth}-24`,
          amount: inv1,
          lines: [
            { description: 'Sérhæfð líftæknilyf og blóðstorkuþættir', amount: Math.round(inv1 * 0.8), is_kredit: false },
            { description: 'Sýklalyf og gjörgæslubirgðir', amount: Math.round(inv1 * 0.25), is_kredit: false },
            { description: 'Afsláttur skv. ríkisútboði og magnfrádráttur', amount: -Math.round(inv1 * 0.05), is_kredit: true }
          ]
        },
        {
          id: `LSH-${cleanYear}-${cleanMonth}321`,
          client: 'Landspítali',
          supplier: 'Origo hf.',
          date: `${cleanYear}-${cleanMonth}-18`,
          amount: inv2,
          lines: [
            { description: 'Leyfi fyrir rafræna sjúkraskrá (Heilsugátt) og gagnagrunna', amount: Math.round(inv2 * 0.8), is_kredit: false },
            { description: 'Sérhæfð ráðgjöf í upplýsingaöryggi og netvörnum', amount: Math.round(inv2 * 0.2), is_kredit: false }
          ]
        },
        {
          id: `LSH-${cleanYear}-${cleanMonth}712`,
          client: 'Landspítali',
          supplier: 'Höldur ehf. (Bílaleiga Akureyrar)',
          date: `${cleanYear}-${cleanMonth}-16`,
          amount: inv5,
          lines: [
            { description: 'Bílaleigubíll vegna heimsókna sérfræðilækna á landsbyggðasjúkrahús', amount: inv5, is_kredit: false }
          ]
        },
        {
          id: `LSH-${cleanYear}-${cleanMonth}192`,
          client: 'Landspítali',
          supplier: 'Securitas hf.',
          date: `${cleanYear}-${cleanMonth}-12`,
          amount: inv3,
          lines: [
            { description: 'Öryggisgæsla á bráðamóttöku, vaktstöðvum og geðdeild', amount: inv3, is_kredit: false }
          ]
        },
        {
          id: `LSH-${cleanYear}-${cleanMonth}044`,
          client: 'Landspítali',
          supplier: 'Distica hf.',
          date: `${cleanYear}-${cleanMonth}-06`,
          amount: inv4,
          lines: [
            { description: 'Sótthreinsiefni, einnota búnaður og skurðstofugögn', amount: inv4, is_kredit: false }
          ]
        }
      );
    } else if (clientName === 'Tryggingastofnun ríkisins' || clientName === 'Tryggingastofnun') {
      const inv1 = Math.round(total * 0.26);
      const inv2 = Math.round(total * 0.14);
      const inv3 = Math.round(total * 0.08);
      const invCar = 365000;
      const inv5 = 280000;

      invoices.push(
        {
          id: `TR-${cleanYear}-${cleanMonth}801`,
          client: 'Tryggingastofnun ríkisins',
          supplier: 'Advania Ísland ehf.',
          date: `${cleanYear}-${cleanMonth}-25`,
          amount: inv1,
          lines: [
            { description: 'Greiðslukerfi TR, lífeyrisútreikningar og rafræn umsóknagátt almannatrygginga', amount: Math.round(inv1 * 0.75), is_kredit: false },
            { description: 'Hýsing og skýjalausnir fyrir gagnagrunna bótaþega', amount: Math.round(inv1 * 0.25), is_kredit: false }
          ]
        },
        {
          id: `TR-${cleanYear}-${cleanMonth}412`,
          client: 'Tryggingastofnun ríkisins',
          supplier: 'Origo hf.',
          date: `${cleanYear}-${cleanMonth}-18`,
          amount: inv2,
          lines: [
            { description: 'Upplýsingaöryggi, notendaþjónusta og vinnustöðvaleyfi starfsfólks', amount: inv2, is_kredit: false }
          ]
        },
        {
          id: `TR-${cleanYear}-${cleanMonth}299`,
          client: 'Tryggingastofnun ríkisins',
          supplier: 'Höldur ehf. (Bílaleiga Akureyrar)',
          date: `${cleanYear}-${cleanMonth}-15`,
          amount: invCar,
          lines: [
            { description: 'Bílaleigubíll vegna eftirlitsferða og skoðana á starfsstöðvum úti á landi', amount: invCar, is_kredit: false }
          ]
        },
        {
          id: `TR-${cleanYear}-${cleanMonth}150`,
          client: 'Tryggingastofnun ríkisins',
          supplier: 'Pósturinn hf.',
          date: `${cleanYear}-${cleanMonth}-09`,
          amount: inv3,
          lines: [
            { description: 'Útsending greiðsluseðla, ákvarðana og formlegra tilkynninga til lífeyrisþega', amount: inv3, is_kredit: false }
          ]
        },
        {
          id: `TR-${cleanYear}-${cleanMonth}033`,
          client: 'Tryggingastofnun ríkisins',
          supplier: 'Securitas hf.',
          date: `${cleanYear}-${cleanMonth}-03`,
          amount: inv5,
          lines: [
            { description: 'Öryggisgæsla í þjónustumiðstöð og aðgangsstýring', amount: inv5, is_kredit: false }
          ]
        }
      );
    } else if (clientName === 'Vegagerðin') {
      const inv1 = Math.round(total * 0.32);
      const inv2 = Math.round(total * 0.11);
      const inv3 = Math.round(total * 0.05);
      const invCar = 595000;

      invoices.push(
        {
          id: `VG-${cleanYear}-${cleanMonth}981`,
          client: 'Vegagerðin',
          supplier: 'Ístak hf.',
          date: `${cleanYear}-${cleanMonth}-28`,
          amount: inv1,
          lines: [
            { description: 'Jarðgangagerð, brúarsmíði og vegabætur - áfangauppgjör', amount: inv1, is_kredit: false }
          ]
        },
        {
          id: `VG-${cleanYear}-${cleanMonth}451`,
          client: 'Vegagerðin',
          supplier: 'Olíuverzlun Íslands hf. (Olís)',
          date: `${cleanYear}-${cleanMonth}-15`,
          amount: inv2,
          lines: [
            { description: 'Dísilolía á vinnuvélar, snjóruðningstæki og vagna', amount: Math.round(inv2 * 1.05), is_kredit: false },
            { description: 'Afsláttur skv. rammasamningi Ríkiskaupa', amount: -Math.round(inv2 * 0.05), is_kredit: true }
          ]
        },
        {
          id: `VG-${cleanYear}-${cleanMonth}632`,
          client: 'Vegagerðin',
          supplier: 'Höldur ehf. (Bílaleiga Akureyrar)',
          date: `${cleanYear}-${cleanMonth}-12`,
          amount: invCar,
          lines: [
            { description: 'Bílaleigubíll (jeppi 4x4) vegna eftirlits á fáförnum vegum og hálendi', amount: 385000, is_kredit: false },
            { description: 'Bílaleigubíll vegna sumarstarfsmanna og mælinga', amount: 210000, is_kredit: false }
          ]
        },
        {
          id: `VG-${cleanYear}-${cleanMonth}210`,
          client: 'Vegagerðin',
          supplier: 'Colas Ísland hf.',
          date: `${cleanYear}-${cleanMonth}-08`,
          amount: inv3,
          lines: [
            { description: 'Malbikunarviðgerðir og burðarlag á þjóðvegi 1', amount: inv3, is_kredit: false }
          ]
        }
      );
    } else if (clientName === 'Sjúkratryggingar Íslands') {
      const inv1 = Math.round(total * 0.32);
      const inv2 = Math.round(total * 0.15);
      const invCar = 290000;
      invoices.push(
        {
          id: `SI-${cleanYear}-${cleanMonth}701`,
          client: 'Sjúkratryggingar Íslands',
          supplier: 'Origo hf.',
          date: `${cleanYear}-${cleanMonth}-22`,
          amount: inv1,
          lines: [
            { description: 'Greiðslukerfi sjúkratrygginga og rafrænar endurgreiðslur til sjúklinga og lækna', amount: inv1, is_kredit: false }
          ]
        },
        {
          id: `SI-${cleanYear}-${cleanMonth}335`,
          client: 'Sjúkratryggingar Íslands',
          supplier: 'Advania Ísland ehf.',
          date: `${cleanYear}-${cleanMonth}-16`,
          amount: inv2,
          lines: [
            { description: 'Skýjalausnir, gagnaöryggi og rafrænar samskiptagáttir', amount: inv2, is_kredit: false }
          ]
        },
        {
          id: `SI-${cleanYear}-${cleanMonth}118`,
          client: 'Sjúkratryggingar Íslands',
          supplier: 'Bílaleiga Flugleiða ehf. / Hertz',
          date: `${cleanYear}-${cleanMonth}-11`,
          amount: invCar,
          lines: [
            { description: 'Bílaleigubíll vegna samningafunda og gæðaúttetta á heilsugæslustöðvum', amount: invCar, is_kredit: false }
          ]
        }
      );
    } else if (clientName === 'Háskóli Íslands') {
      const inv1 = Math.round(total * 0.28);
      const inv2 = Math.round(total * 0.12);
      const invCar = 310000;
      invoices.push(
        {
          id: `HI-${cleanYear}-${cleanMonth}102`,
          client: 'Háskóli Íslands',
          supplier: 'Advania Ísland ehf.',
          date: `${cleanYear}-${cleanMonth}-20`,
          amount: inv1,
          lines: [
            { description: 'Skýjaþjónusta og hýsing á Canvas námsumsjónarkerfi', amount: inv1, is_kredit: false }
          ]
        },
        {
          id: `HI-${cleanYear}-${cleanMonth}955`,
          client: 'Háskóli Íslands',
          supplier: 'Elko / Opin Kerfi hf.',
          date: `${cleanYear}-${cleanMonth}-09`,
          amount: inv2,
          lines: [
            { description: 'Tölvubúnaður og skjáir fyrir kennslustofur', amount: inv2, is_kredit: false }
          ]
        },
        {
          id: `HI-${cleanYear}-${cleanMonth}441`,
          client: 'Háskóli Íslands',
          supplier: 'Bílaleiga Flugleiða ehf. / Hertz',
          date: `${cleanYear}-${cleanMonth}-11`,
          amount: invCar,
          lines: [
            { description: 'Bílaleigubíll vegna vettvangsferðar jarðfræðinema og rannsókna', amount: invCar, is_kredit: false }
          ]
        }
      );
    }

    // 2. Deterministic generator to produce 35 to 45 diverse, realistic invoices for ANY institution
    const targetCount = 38;
    const baseSeed = stringToSeed(`${clientName}-${cleanYear}-${cleanMonth}`);
    const existingSuppliers = new Set(invoices.map(i => i.supplier));

    for (let i = 0; i < targetCount; i++) {
      const stepSeed = (baseSeed * 31 + i * 47 + 101) % 1000000;
      const poolIndex = (stepSeed + i) % EXTENSIVE_SUPPLIER_POOL.length;
      const template = EXTENSIVE_SUPPLIER_POOL[poolIndex];

      // Distribute dates from 1 to 28 across the month
      const dayNum = ((stepSeed % 27) + 1);
      const dayStr = String(dayNum).padStart(2, '0');
      const invoiceDate = `${cleanYear}-${cleanMonth}-${dayStr}`;

      // Realistic amount based on supplier range and index
      const span = template.baseMax - template.baseMin;
      const rawAmt = template.baseMin + (stepSeed % span);
      const roundedAmt = Math.round(rawAmt / 1000) * 1000;

      // Unique realistic invoice id
      const invoiceNum = 100 + ((stepSeed + i * 23) % 890);
      const invoiceId = `${prefix}-${cleanYear}-${cleanMonth}-${String(invoiceNum).padStart(3, '0')}`;

      // Pick a realistic line description
      const lineDescIndex = (stepSeed + i * 3) % template.lines.length;
      const lineDescription = template.lines[lineDescIndex];

      const lines = [
        {
          description: lineDescription,
          amount: roundedAmt,
          is_kredit: false
        }
      ];

      // Occasional realistic discount line
      if (template.hasCredit && (stepSeed % 3 === 0)) {
        const discountAmt = Math.round(roundedAmt * 0.07);
        lines.push({
          description: 'Afsláttur skv. rammasamningi Ríkiskaupa',
          amount: -discountAmt,
          is_kredit: true
        });
      }

      // Avoid immediate consecutive duplicate ids
      if (!invoices.some(inv => inv.id === invoiceId)) {
        invoices.push({
          id: invoiceId,
          client: clientName,
          supplier: template.supplier,
          date: invoiceDate,
          amount: roundedAmt,
          lines
        });
      }
    }

    // Sort invoices by date descending
    invoices.sort((a, b) => b.date.localeCompare(a.date));

    return invoices;
  };

  return {
    year,
    month,
    monthName,
    isFutureOrUnpublished,
    stofnanir,
    topSuppliers,
    getInvoicesForClient
  };
}

export const INITIAL_ROADMAP_TASKS: TaskItem[] = [
  // M1: Grunnur & PostgreSQL 18 Flutningur (Klárað)
  {
    id: 't-1',
    milestone: 'M1',
    title: 'Gagnagrunnur fluttur í PostgreSQL 18 (D:\\PostgreSQL\\data)',
    desc: 'Öll gögn (reikningar, birgjar, stofnanir) flutt úr MySQL yfir í PostgreSQL 18 á D:\\PostgreSQL. Samanburður á gagnagerðum og gagnagreining í pgAdmin 4 heppnaðist 100%.',
    status: 'completed',
    priority: 'high',
    category: 'Gagnagrunnur'
  },
  {
    id: 't-2',
    milestone: 'M1',
    title: 'Uppsetning á staðbundnu umhverfi (D:\\minn-vefthjonn\\minn-server)',
    desc: 'Node.js LTS, PostgreSQL 18 og pgAdmin 4 sett upp á fartölvu. Node vefþjónn staðsettur í D:\\minn-vefthjonn\\minn-server með node_modules og nýtir nútímalegt umhverfi.',
    status: 'completed',
    priority: 'high',
    category: 'Rekstur'
  },
  {
    id: 't-3',
    milestone: 'M1',
    title: 'Flýtivísar (Composite Indexes) í PostgreSQL',
    desc: 'Búnir til vísar idx_reikningar_dags, idx_reikningar_stofnun og idx_reikningar_birgir sem tryggja <0,005s afköst á flóknum samantektum án Full Table Scan.',
    status: 'completed',
    priority: 'high',
    category: 'Gagnagrunnur'
  },
  {
    id: 't-4',
    milestone: 'M1',
    title: 'Skráaskipting og nútíma framendi (React + Tailwind)',
    desc: 'Framendi aðskilinn í hrein einingaprófuð viðmót með dökku/ljósu stjórnborði, almenningsgátt og flýtivali á milli ára.',
    status: 'completed',
    priority: 'medium',
    category: 'Framendi'
  },

  // M2: Ótengd vinna (Offline-First) & Staðbundin Afritun
  {
    id: 't-5',
    milestone: 'M2',
    title: 'Einnar-smells afritun (D:\\PostgreSQL\\bin\\pg_dump.exe)',
    desc: 'Sjálfvirk afritunarskrifta (backup.bat) sem keyrir pg_dump úr D:\\PostgreSQL\\bin yfir í D:\\afrit_rikisgat á harða disknum. Tryggir að gögn tapist aldrei og alltaf sé hægt að vinna án internets.',
    status: 'in_progress',
    priority: 'high',
    category: 'Gagnagrunnur'
  },
  {
    id: 't-6',
    milestone: 'M2',
    title: 'Ótengdur vinnuhamur (D:\\minn-vefthjonn\\minn-server)',
    desc: 'Node.js vefþjónn í D:\\minn-vefthjonn\\minn-server keyrir staðbundið á fartölvunni gegn local PostgreSQL á D: drifi án nokkurs internets (t.d. í flugvél eða sumarhúsi).',
    status: 'in_progress',
    priority: 'high',
    category: 'Bakendi'
  },
  {
    id: 't-7',
    milestone: 'M2',
    title: 'Lagalegt Verkfærasett: Upplýsingalög nr. 140/2012',
    desc: 'Sjálfvirkt sniðmát fyrir upplýsingabeiðnir skv. 5. og 17. gr. upplýsingalaga. Hópar saman reikninga á sömu stofnun og býr til afritunartækan texta.',
    status: 'completed',
    priority: 'high',
    category: 'Lögfræði'
  },
  {
    id: 't-8',
    milestone: 'M2',
    title: 'Íslensk staðlasnið (Punktar & Orðareiknirit)',
    desc: 'Allar tölur sýndar með punkti (.) sem þúsundaskilamerki (formaTolu) og sjálfvirkt talaITexta orðareiknirit fyrir heildarupphæðir í milljörðum.',
    status: 'completed',
    priority: 'medium',
    category: 'Framendi'
  },

  // M3: Nútíma Skýjahýsing í fyrsta skipti (Cloud Hosting Architecture)
  {
    id: 't-9',
    milestone: 'M3',
    title: 'Val á Skýjahýsingu í stað FTP (Render / Supabase / VPS)',
    desc: 'Stofna fyrsta skýjaaðganginn (fyrsta skipti sem skýið er notað í stað hefðbundins FTP). Skilgreina Node.js vefþjón og stjórnaðan PostgreSQL gagnagrunn í skýinu.',
    status: 'in_progress',
    priority: 'high',
    category: 'Rekstur'
  },
  {
    id: 't-10',
    milestone: 'M3',
    title: 'Sjálfvirk dreifing með Git (Continuous Deployment)',
    desc: 'Kveðja handvirkan FTP flutning. Setja upp Git tengingu þannig að hver ný útgáfa (git push) uppfærir vefinn sjálfkrafa í skýinu á 60 sekúndum.',
    status: 'in_progress',
    priority: 'high',
    category: 'Bakendi'
  },
  {
    id: 't-11',
    milestone: 'M3',
    title: 'Öruggur PostgreSQL Skýjagrunnur (SSL & Afrit í skýi)',
    desc: 'Stilla framleiðslugrunn í skýi með SSL dulkóðun, lokuðum aðgangi og sjálfvirkum daglegum afritum frá skýjaþjónustunni.',
    status: 'in_progress',
    priority: 'high',
    category: 'Gagnagrunnur'
  },
  {
    id: 't-12',
    milestone: 'M3',
    title: 'Umhverfisbreytur (.env) & Leyndarmálastjórnun',
    desc: 'Aðskilja staðbundna tengingu (localhost:5432) og skýjatengingu gegnum DATABASE_URL umhverfisbreytu. Engin lykilorð geymd í kóðanum sjálfum.',
    status: 'in_progress',
    priority: 'high',
    category: 'Bakendi'
  },
  {
    id: 't-13',
    milestone: 'M3',
    title: 'Lénatenging (rikisgat.is) við Skýjahýsinguna',
    desc: 'Festa rikisgat.is hjá ISNIC og beina DNS færslum (CNAME/A) að skýjaþjóninum með sjálfvirku ókeypis SSL/HTTPS vottorði.',
    status: 'in_progress',
    priority: 'high',
    category: 'Rekstur'
  },

  // M4: Sjálfvirkni, Eftirlit & Opnun
  {
    id: 't-14',
    milestone: 'M4',
    title: 'Sjálfvirkur Scraper / Cron í skýi fyrir ný gögn',
    desc: 'Sjálfvirkt mánaðarlegt ferli sem sækir nýjustu gögn frá opnirreikningar.is og bætir við nýjum mánuðum um leið og Fjársýslan gefur út gögn.',
    status: 'future',
    priority: 'medium',
    category: 'Gagnagrunnur'
  },
  {
    id: 't-15',
    milestone: 'M4',
    title: 'Umsókn í Tækniþróunarsjóð / Nýsköpunarstyrki',
    desc: 'Sækja um styrk undir heitinu „Sjálfvirk gagnavinnsla og opinbert samantektarkerfi reikninga ríkisins“ til að tryggja sjálfbæran rekstur.',
    status: 'future',
    priority: 'high',
    category: 'Markaðssetning'
  },
  {
    id: 't-16',
    milestone: 'M4',
    title: 'Fjölmiðlaherferð & Rannsóknarblaðamenn',
    desc: 'Kynna tólið fyrir rannsóknarblaðamönnum (Heimildin, RÚV, Vísir) og birta vikulegar greiningar á helstu birgjum og stofnunum.',
    status: 'future',
    priority: 'medium',
    category: 'Markaðssetning'
  },
  {
    id: 't-17',
    milestone: 'M4',
    title: 'Straumlínulaga reikningstegundir (Tegund hreinsun & flokkun)',
    desc: 'Lokið! Öllum 607 tegundum hefur verið varpað í 12 hreina aðalflokka í tegundir_flokkun töflu í PostgreSQL 18. "Annað & Sérhæft" hrundi úr 28,24% niður í aðeins 4,14%. 95,86% af öllum 18,17 milljónum reikninga ríkisins eru nú nákvæmlega flokkaðir.',
    status: 'completed',
    priority: 'high',
    category: 'Gagnagrunnur'
  }
];

export const INITIAL_BRANDS: import('../types').BrandItem[] = [
  {
    id: 'brand-1',
    nafn: 'RÍKISGÁT',
    len: 'rikisgat.is',
    slogan: 'Gegnsæi & Eftirlit með opinberum útgjöldum og reikningum ríkisins',
    status: 'adal',
    markhopur: 'Borgarar, rannsóknarblaðamenn, þingmenn, skattgreiðendur og greinendur',
    kostir: [
      'Stutt, beinskeytt og alvarlegur tónn sem fangar tilganginn: Aðhald og gát með skattfé',
      'Sameinar hugsjónina um fullkomið gagnsæi (úr Gegnsætt) og virkt rauntímaeftirlit (úr Ríkisvaktin)',
      'Tilvalið fyrir sjálfvirkar greiningar, vöktunarbotta (Ríkisvakt) og fréttatilkynningar',
      'Passar fullkomlega við svarthvíta, hreina og trausta hönnun',
      'Skýr greinarmunur frá opnum Excel skrám ríkisins — öflug leitarvél og greiningatól'
    ],
    gallar: [
      'Gæti í fyrstu hljómað eins og ríkisstofnun ef fólk þekkir ekki að þetta er óháð aðhaldstól borgara',
      'Krefst þess að skýrt komi fram að síðan sé sjálfstætt borgaraverkefni en ekki á vegum Fjársýslunnar'
    ],
    isnicStatus: 'fratekid',
    einkunn: 5,
    athugasemdir: 'Aðalvörumerki og kjarni verkefnisins. Sameinar alla kosti Gegnsætt (gagnsæi í innkaupum) og Ríkisvaktarinnar (rauntímaeftirlit og sjálfvirkni).',
    createdAt: '2026-09-01'
  },
  {
    id: 'brand-2',
    nafn: 'Gegnsætt.is (Áframsendir á Ríkisgát)',
    len: 'gegnsaett.is',
    slogan: 'Gagnsæi í öllum opinberum innkaupum',
    status: 'fratekid',
    markhopur: 'Almenningur og skattgreiðendur sem leita að almennu gagnsæi',
    kostir: [
      'Lén og vörumerki tryggt sem stuðningslén sem áframsendir beint á rikisgat.is',
      'Mjög auðvelt að muna og grípur þá sem muna hugsjónina um gagnsæi'
    ],
    gallar: [
      'Dálítið óhlutbundið sem sjálfstætt kerfisheiti; virkar miklu betur sem stuðningslén fyrir Ríkisgát'
    ],
    isnicStatus: 'fratekid',
    einkunn: 4,
    athugasemdir: 'Sameinað inn í Ríkisgát sem stuðningslén (301 redirect yfir á rikisgat.is).',
    createdAt: '2026-09-05'
  },
  {
    id: 'brand-3',
    nafn: 'Ríkisvaktin (Sjálfvirknivél Ríkisgáttar)',
    len: 'rikisvaktin.is',
    slogan: 'Vaktar alla reikninga ríkisins og sendir tilkynningar',
    status: 'fratekid',
    markhopur: 'Fjölmiðlar, Twitter/X samfélagsmiðlar og hagsmunasamtök',
    kostir: [
      'Nýtt sem undirheiti/eining innan Ríkisgáttar fyrir sjálfvirka vöktun og tilkynningabotta',
      'Sterk aðgerðartengd orðræða sem styður við heildarvörumerkið Ríkisgát'
    ],
    gallar: [
      'Betra sem vöktunareining og fréttabot en sem heildarvörumerki gagnagrunnsins'
    ],
    isnicStatus: 'laust',
    einkunn: 4,
    athugasemdir: 'Sameinað sem vöktunareining / sjálfvirknivél innan Ríkisgát.',
    createdAt: '2026-09-08'
  },
  {
    id: 'brand-4',
    nafn: 'OpnirReikningar.app',
    len: 'opnirreikningar.app',
    slogan: 'Flýtigátt að gögnum ríkisins á 0,005 sekúndum',
    status: 'hugmynd',
    markhopur: 'Forritarar, gagnanördar og tæknifólk',
    kostir: [
      'Bein vísun í opnirreikningar.is sem fólk þekkir'
    ],
    gallar: [
      'Ekki .is lén; hætta á ruglingi við opinberu vefsíðuna'
    ],
    isnicStatus: 'laust',
    einkunn: 3,
    athugasemdir: 'Varaheiti ef .is lén fást ekki.',
    createdAt: '2026-09-10'
  }
];

export const SQL_SCHEMA_STJORN = `-- =========================================================================
-- RÍKISGÁT: Gagnagrunnstöflur fyrir Innra Stjórnborð (MySQL / XAMPP / 1984.is)
-- Bætið þessum töflum við gagnagrunninn 'opnir_reikningar'
-- =========================================================================

USE opnir_reikningar;

-- 1. TAFLA: stjorn_verkefni (Fyrir Verkefnastjóra)
CREATE TABLE IF NOT EXISTS stjorn_verkefni (
    id INT AUTO_INCREMENT PRIMARY KEY,
    milestone ENUM('M1', 'M2', 'M3', 'M4') NOT NULL DEFAULT 'M3',
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category ENUM('Gagnagrunnur', 'Bakendi', 'Framendi', 'Rekstur', 'Markaðssetning', 'Lögfræði') NOT NULL DEFAULT 'Rekstur',
    priority ENUM('high', 'medium', 'low') NOT NULL DEFAULT 'medium',
    status ENUM('completed', 'in_progress', 'future') NOT NULL DEFAULT 'in_progress',
    deadline DATE NULL,
    assignee VARCHAR(100) DEFAULT 'Rúnar',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_milestone (milestone),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. TAFLA: stjorn_vorumerki (Fyrir Markaðsstjórn & Vörumerkjasafn)
CREATE TABLE IF NOT EXISTS stjorn_vorumerki (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nafn VARCHAR(150) NOT NULL UNIQUE,
    len VARCHAR(150) NOT NULL,
    slogan VARCHAR(255),
    status ENUM('adal', 'i_skodun', 'fratekid', 'hugmynd', 'hafnad') NOT NULL DEFAULT 'i_skodun',
    markhopur TEXT,
    kostir TEXT, -- JSON eða kommuaðskildir strengir
    gallar TEXT,
    isnic_status ENUM('laust', 'fratekid', 'athuga') NOT NULL DEFAULT 'athuga',
    einkunn TINYINT UNSIGNED DEFAULT 4, -- 1 til 5
    athugasemdir TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. BYRJUNARGÖGN: Setja inn helstu verkefni og vörumerki
INSERT INTO stjorn_vorumerki (nafn, len, slogan, status, markhopur, kostir, gallar, isnic_status, einkunn, athugasemdir)
VALUES 
('RÍKISGÁT', 'rikisgat.is', 'Gegnsæi & Eftirlit með opinberum útgjöldum', 'adal', 'Borgarar, blaðamenn, þingmenn', 'Stutt, beinskeytt, passar við svarthvítt útlit', 'Gæti hljómað eins og stofnun', 'fratekid', 5, 'Aðalvalkostur verkefnisins'),
('Gegnsætt.is', 'gegnsaett.is', 'Gagnsæi í öllum opinberum innkaupum', 'i_skodun', 'Almenningur og félagasamtök', 'Lýsir hugsjóninni vel', 'Óhlutbundið', 'athuga', 4, 'Varalén'),
('Ríkisvaktin', 'rikisvaktin.is', 'Vaktar alla reikninga ríkisins í rauntíma', 'i_skodun', 'Samfélagsmiðlar og blaðamenn', 'Gott fyrir sjálfvirka Twitter-botta', 'Lengra heiti', 'laust', 4, 'Heiti á fréttavélmenni');
`;

export const INITIAL_LOCALHOST_UPDATES: LocalhostFileUpdate[] = [
  {
    id: 'upd-server',
    filePath: 'server.ts',
    description: 'NÝ SKRÁ (v7.0): Express bakendi með beinni tengingu við PostgreSQL (pg.Pool). Greinir sjálfkrafa Excel-töflur (t.d. reikningar, faerslur), leitar í raunverulegum gögnum með /api/invoices og /api/institutions, og samþættir Vite þróunarmiðlara.',
    updatedAt: '15. september 2026',
    versionLabel: 'v7.0'
  },
  {
    id: 'upd-api',
    filePath: 'src/services/api.ts',
    description: 'NÝ SKRÁ (v7.0): Samskiptaþjónusta við PostgreSQL vefþjón. Sækir stöðu gagnagrunns (checkDbStatus), stillingar (updateDbConfig) og raunverulega reikninga (fetchInvoicesFromDb, fetchInstitutionsFromDb).',
    updatedAt: '15. september 2026',
    versionLabel: 'v7.0'
  },
  {
    id: 'upd-db-modal',
    filePath: 'src/components/DbConnectionModal.tsx',
    description: 'NÝ SKRÁ (v7.0): Gagnagrunnsgluggi (PostgreSQL tengistjórnborð). Gerir notanda kleift að prófa og vista host (localhost), port (5432), gagnagrunn (opnir_reikningar) og notendanafn/lykilorð með lifandi prófun.',
    updatedAt: '15. september 2026',
    versionLabel: 'v7.0'
  },
  {
    id: 'upd-pkg',
    filePath: 'package.json',
    description: 'UPPFÆRSLA (v7.0): Bætt við "pg" og "@types/pg", uppfærð "dev": "tsx server.ts", "build" og "start" fyrir sjálfstæðan Express + Vite full-stack arkitektúr.',
    updatedAt: '15. september 2026',
    versionLabel: 'v7.0'
  },
  {
    id: 'upd-env',
    filePath: '.env.example',
    description: 'UPPFÆRSLA (v7.0): Bætt við stillingum fyrir PostgreSQL: PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD.',
    updatedAt: '15. september 2026',
    versionLabel: 'v7.0'
  },
  {
    id: 'upd-portal-v7',
    filePath: 'src/components/PublicPortalView.tsx',
    description: 'UPPFÆRSLA (v7.0): Tengt forsíðuviðmótið beint við PostgreSQL. Bætt við stöðutakka í haus (🟢 PostgreSQL tengt / 🟡 Sýndarhamur), leitar beint í alvöru reikningum og stofnunum úr Excel/PostgreSQL þegar tengt er.',
    updatedAt: '15. september 2026',
    versionLabel: 'v7.0'
  },
  {
    id: 'upd-3',
    filePath: 'src/data/mockData.ts',
    description: 'Reikningagrunnur margfaldaður. Nýr determinískur reikningasmiður (EXTENSIVE_SUPPLIER_POOL) býr til 35–45 sundurliðaða reikninga á hverja stofnun í hverjum mánuði í stað aðeins 3–4.',
    updatedAt: '15. september 2026',
    versionLabel: 'v6.6'
  },
  {
    id: 'upd-1',
    filePath: 'src/components/AdvancedSearchSubTab.tsx',
    description: 'NÝ SKRÁ: Nýr undirflokkur „Ítarleg Leit“ undir Gagnagreining & Benchmark. Fastur leitardálkur alltaf í Breiðri Leit (öll ár og allir mánuðir), leit í stökum reikningslínum.',
    updatedAt: '15. september 2026',
    versionLabel: 'v6.4'
  },
  {
    id: 'upd-2',
    filePath: 'src/components/DataSimulatorTab.tsx',
    description: 'Breytt virkni AF/Á takkans: Hann er nú eingöngu stjórntæki fyrir forsíðuna (ekkert prófunarbox).',
    updatedAt: '15. september 2026',
    versionLabel: 'v6.4'
  }
];


