// API service for interacting with the backend server and PostgreSQL database

export interface DbStatusResponse {
  connected: boolean;
  database: string;
  host: string;
  port: number;
  user: string;
  tables?: string[];
  activeTable?: string | null;
  detectedMapping?: {
    tableName: string;
    clientCol: string | null;
    supplierCol: string | null;
    invoiceNrCol: string | null;
    dateCol: string | null;
    amountCol: string | null;
    descCol: string | null;
  } | null;
  totalRows?: number;
  message?: string;
  error?: string;
  code?: string;
}

export interface RealInvoiceRow {
  id: string;
  supplier: string;
  amount: number;
  date: string;
  client: string;
  lines?: Array<{
    description: string;
    amount: number;
    is_kredit?: boolean;
  }>;
}

export interface InvoicesApiResponse {
  source: 'postgres' | 'mock';
  totalCount?: number;
  count: number;
  rows: RealInvoiceRow[];
  message?: string;
  error?: string;
}

export interface InstitutionsApiResponse {
  source: 'postgres' | 'mock';
  table?: string;
  rows: Array<{
    id: number;
    client: string;
    invoiceCount: number;
    totalAmount: number;
  }>;
  error?: string;
}

export interface OverviewApiResponse {
  source: 'postgres' | 'mock';
  totalInvoices: number;
  totalAmount: number;
  minDate?: string;
  maxDate?: string;
  availableYears: string[];
  error?: string;
}

export async function fetchOverviewFromDb(): Promise<OverviewApiResponse> {
  try {
    const res = await fetch('/api/overview');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err: any) {
    return {
      source: 'mock',
      totalInvoices: 18167314,
      totalAmount: 1420500000000,
      availableYears: ['2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017'],
      error: err.message
    };
  }
}

export async function checkDbStatus(): Promise<DbStatusResponse> {
  try {
    const res = await fetch('/api/db-status');
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err: any) {
    return {
      connected: false,
      database: 'opnir_reikningar',
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      message: `Ekki náðist samband við vefþjón (${err.message}). Viðmótið notar 'mockData'.`
    };
  }
}

export async function updateDbConfig(config: {
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
}): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch('/api/db-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function fetchInvoicesFromDb(params: {
  client?: string;
  supplier?: string;
  search?: string;
  year?: string;
  month?: string;
  limit?: number;
  offset?: number;
}): Promise<InvoicesApiResponse> {
  const query = new URLSearchParams();
  if (params.client) query.set('client', params.client);
  if (params.supplier) query.set('supplier', params.supplier);
  if (params.search) query.set('search', params.search);
  if (params.year && params.year !== 'all') query.set('year', params.year);
  if (params.month && params.month !== 'all') query.set('month', params.month);
  if (params.limit) query.set('limit', String(params.limit));
  if (params.offset) query.set('offset', String(params.offset));

  try {
    const res = await fetch(`/api/invoices?${query.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err: any) {
    return {
      source: 'mock',
      count: 0,
      rows: [],
      error: err.message
    };
  }
}

export async function fetchInstitutionsFromDb(year?: string, month?: string): Promise<InstitutionsApiResponse> {
  const query = new URLSearchParams();
  if (year && year !== 'all') query.set('year', year);
  if (month && month !== 'all') query.set('month', month);

  try {
    const res = await fetch(`/api/institutions?${query.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err: any) {
    return {
      source: 'mock',
      rows: [],
      error: err.message
    };
  }
}

export interface BenchmarkYearRow {
  year: number;
  recordCount: number;
  institutionCount: number;
  supplierCount: number;
  totalAmount: number;
  dataSizeMb: number;
}

export interface BenchmarkApiResponse {
  source: 'postgres' | 'mock';
  latencyMs: number;
  testLatencyMs?: number;
  testRowsCount?: number;
  years: BenchmarkYearRow[];
  error?: string;
}

export async function fetchBenchmarkFromDb(testYear?: string): Promise<BenchmarkApiResponse> {
  const query = new URLSearchParams();
  if (testYear && testYear !== 'all') query.set('testYear', testYear);

  try {
    const res = await fetch(`/api/benchmark?${query.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err: any) {
    return {
      source: 'mock',
      latencyMs: 0,
      years: [],
      error: err.message
    };
  }
}
