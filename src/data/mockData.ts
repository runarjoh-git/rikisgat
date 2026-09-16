import { Anomaly, ClientSpending, Invoice } from '../types';

export const initialAnomalies: Anomaly[] = [];

// Tómir listar - raungögnin koma eingöngu úr PostgreSQL (rikisgat)
export const initialClients: ClientSpending[] = [];
export const sampleInvoices: Invoice[] = [];
export const clientsList: ClientSpending[] = [];

export interface MonthItem {
  name: string;
  short: string;
  month: number;
}

export const monthsList = [
  { name: 'Janúar', short: 'Jan', month: 1 },
  { name: 'Febrúar', short: 'Feb', month: 2 },
  { name: 'Mars', short: 'Mar', month: 3 },
  { name: 'Apríl', short: 'Apr', month: 4 },
  { name: 'Maí', short: 'Maí', month: 5 },
  { name: 'Júní', short: 'Jún', month: 6 },
  { name: 'Júlí', short: 'Júl', month: 7 },
  { name: 'Ágúst', short: 'Ágú', month: 8 },
  { name: 'September', short: 'Sep', month: 9 },
  { name: 'Október', short: 'Okt', month: 10 },
  { name: 'Nóvember', short: 'Nóv', month: 11 },
  { name: 'Desember', short: 'Des', month: 12 }
];

export const months = monthsList;
export const MONTHS = monthsList;
export const MONTH_NAMES = monthsList.map(m => m.name);
export const MONTHS_LIST = monthsList;

export const getMonthNames = (): string[] => {
  return monthsList.map(m => m.name);
};

export const getMonthlyData = (_monthIndex: number): ClientSpending[] => {
  return [];
};

export const baseStofnanir: any[] = [];
export const BASE_STOFNANIR: any[] = [];
export const BASE_CLIENTS: any[] = [];
export const baseClients: any[] = [];
export const STOFNANIR: any[] = [];
export const stofnanir: any[] = [];
export const stofnanirList: any[] = [];

export const getMonthlyPortalData = (_year?: string | number, _month?: string | number): any => {
  return {
    stofnanir: [],
    clients: [],
    filteredClients: [],
    invoices: [],
    suppliers: [],
    categories: [],
    ministries: [],
    totalSpend: 0,
    monthName: 'Janúar',
    month: _month || 1,
    year: _year || '2026',
    topSuppliers: {
      month: { info: 'Topp birgjar mánaðarins', suppliers: [] },
      year: { info: 'Topp birgjar ársins', suppliers: [] },
      all: { info: 'Topp birgjar alls', suppliers: [] }
    },
    topCategories: {
      month: { info: 'Topp málaflokkar mánaðarins', categories: [], items: [] },
      year: { info: 'Topp málaflokkar ársins', categories: [], items: [] },
      all: { info: 'Topp málaflokkar alls', categories: [], items: [] }
    },
    getInvoicesForClient: (_clientName?: string) => [],
    getInvoicesForSupplier: (_supplierName?: string) => [],
    getClientDetails: (_clientName?: string) => null,
    getSupplierDetails: (_supplierName?: string) => null
  };
};

export const getPortalData = (): any => {
  return {
    stofnanir: [],
    filteredClients: [],
    clients: [],
    invoices: [],
    monthName: 'Janúar',
    month: 1,
    year: '2026',
    topSuppliers: {
      month: { info: 'Topp birgjar mánaðarins', suppliers: [] },
      year: { info: 'Topp birgjar ársins', suppliers: [] },
      all: { info: 'Topp birgjar alls', suppliers: [] }
    },
    topCategories: {
      month: { info: 'Topp málaflokkar mánaðarins', categories: [], items: [] },
      year: { info: 'Topp málaflokkar ársins', categories: [], items: [] },
      all: { info: 'Topp málaflokkar alls', categories: [], items: [] }
    },
    suppliers: [],
    categories: [],
    ministries: [],
    totalSpend: 0,
    getInvoicesForClient: (_clientName?: string) => [],
    getInvoicesForSupplier: (_supplierName?: string) => [],
    getClientDetails: (_clientName?: string) => null,
    getSupplierDetails: (_supplierName?: string) => null
  };
};

export const allHistoricalClients: ClientSpending[] = [];

export const getMinistryForClient = (_client: string): string => {
  return 'Stjórnarráð Íslands';
};

export const clientMinistries: Record<string, string> = {};
export const ministriesList: string[] = ['Öll ráðuneyti'];
export const categoriesList: string[] = ['Allir málaflokkar'];
export const topSuppliers: any[] = [];
export const topCategories: any[] = [];
export const monthlyTrendData: any[] = [];
export const ministrySpendingData: any[] = [];
export const departmentComparisonData: any[] = [];
export const monthlyCategoryBreakdown: any[] = [];
export const publicInformationRequests: any[] = [];
export const supplierDetailsMap: Record<string, any> = {};
export const categoryDescriptions: Record<string, string> = {};

// Fyrir ProjectManagerTab
export const INITIAL_LOCALHOST_UPDATES: any[] = [];

// Fyrir MarketingTab
export const INITIAL_BRANDS: any[] = [];
export const INITIAL_CAMPAIGNS: any[] = [];
export const INITIAL_OUTREACH: any[] = [];
export const INITIAL_METRICS: any = {
  totalReach: 0,
  mediaMentions: 0,
  activeCampaigns: 0,
  partnerCount: 0
};

// Fyrir AdvancedSearchSubTab og ítarleitir
export const ISLENSKIR_MANUDIR = [
  'Janúar', 'Febrúar', 'Mars', 'Apríl', 'Maí', 'Júní',
  'Júlí', 'Ágúst', 'September', 'Október', 'Nóvember', 'Desember'
];
export const ALLIR_MANUDIR = ISLENSKIR_MANUDIR;
export const ALL_YEARS = ['2026', '2025', '2024', '2023'];
export const ALLIR_FLOKKAR = categoriesList;
export const ALL_CATEGORIES = categoriesList;
export const ALL_MINISTRIES = ministriesList;
export const ALL_SUPPLIERS: any[] = [];
export const ALLIR_BIRGJAR: any[] = [];
export const ALL_INSTITUTIONS: any[] = [];
export const ALLAR_STOFNANIR: any[] = [];
export const SAMPLE_ADVANCED_INVOICES: any[] = [];
export const MOCK_ADVANCED_DATA: any[] = [];
export const MOCK_DATA: any[] = [];
export const SEARCH_FILTERS: any = {};
export const MOCK_CATEGORIES = categoriesList;
export const MOCK_MINISTRIES = ministriesList;
export const MOCK_SUPPLIERS: any[] = [];
export const MOCK_CLIENTS: any[] = [];
export const sampleClients: any[] = [];
export const sampleSuppliers: any[] = [];

// Fyrir App.tsx og stjórnborð
export const INITIAL_DB_STATS: any = {
  totalInvoices: 0,
  totalSpend: 0,
  totalInstitutions: 0,
  totalSuppliers: 0,
  postgresConnected: true,
  databaseName: 'rikisgat'
};
export const INITIAL_IMPORT_LOGS: any[] = [];
export const INITIAL_AUDIT_LOGS: any[] = [];
export const INITIAL_SYSTEM_HEALTH: any = {
  status: 'healthy',
  latency: 12,
  postgres: 'connected'
};
export const INITIAL_SETTINGS: any = {};
export const INITIAL_NOTIFICATIONS: any[] = [];
export const INITIAL_USERS: any[] = [];

// Fyrir verkefnastjórn og Roadmap
export const INITIAL_ROADMAP_TASKS: any[] = [];
export const INITIAL_TASKS: any[] = [];
export const INITIAL_MILESTONES: any[] = [];
export const INITIAL_SPRINTS: any[] = [];
export const INITIAL_FEATURES: any[] = [];
export const INITIAL_BUGS: any[] = [];
export const INITIAL_CHANGELOG: any[] = [];
export const INITIAL_FEEDBACK: any[] = [];
export const INITIAL_RELEASES: any[] = [];
export const INITIAL_PROJECT_STATS: any = {};
export const INITIAL_KANBAN_COLUMNS: any[] = [];
export const INITIAL_ACTIVITIES: any[] = [];