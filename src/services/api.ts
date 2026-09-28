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
    lineCount?: number;
    totalAmount: number;
  }>;
  error?: string;
}

export interface InstitutionSuppliersApiResponse {
  source: 'postgres' | 'mock';
  client: string;
  suppliers: Array<{
    supplier: string;
    invoiceCount: number;
    lineCount?: number;
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
  line?: string;
  year?: string;
  month?: string;
  limit?: number;
  offset?: number;
  sort?: 'asc' | 'desc';
}): Promise<InvoicesApiResponse> {
  const query = new URLSearchParams();
  if (params.client) query.set('client', params.client);
  if (params.supplier) query.set('supplier', params.supplier);
  if (params.search) query.set('search', params.search);
  if (params.line) query.set('line', params.line);
  if (params.year && params.year !== 'all') query.set('year', params.year);
  if (params.month && params.month !== 'all') query.set('month', params.month);
  if (params.limit) query.set('limit', String(params.limit));
  if (params.offset) query.set('offset', String(params.offset));
  if (params.sort) query.set('sort', params.sort);

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

export async function fetchInstitutionSuppliersFromDb(params: {
  client: string;
  year?: string;
  month?: string;
  search?: string;
  supplier?: string;
  line?: string;
}): Promise<InstitutionSuppliersApiResponse> {
  const query = new URLSearchParams();
  query.set('client', params.client);
  if (params.year && params.year !== 'all') query.set('year', params.year);
  if (params.month && params.month !== 'all') query.set('month', params.month);
  if (params.search) query.set('search', params.search);
  if (params.supplier) query.set('supplier', params.supplier);
  if (params.line) query.set('line', params.line);

  try {
    const res = await fetch(`/api/institution-suppliers?${query.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err: any) {
    return {
      source: 'mock',
      client: params.client,
      suppliers: [],
      error: err.message
    };
  }
}

export async function fetchInstitutionsFromDb(
  year?: string, 
  month?: string, 
  search?: string,
  extra?: { client?: string; supplier?: string; line?: string }
): Promise<InstitutionsApiResponse> {
  const query = new URLSearchParams();
  if (year && year !== 'all') query.set('year', year);
  if (month && month !== 'all') query.set('month', month);
  if (search && search.trim()) query.set('search', search.trim());
  if (extra?.client && extra.client.trim()) query.set('client', extra.client.trim());
  if (extra?.supplier && extra.supplier.trim()) query.set('supplier', extra.supplier.trim());
  if (extra?.line && extra.line.trim()) query.set('line', extra.line.trim());

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

export interface TopSuppliersApiResponse {
  source: 'postgres' | 'mock';
  year?: string;
  month?: string;
  period?: 'month' | 'year' | 'week' | 'day';
  suppliers: Array<{
    supplier: string;
    invoiceCount: number;
    total: number;
  }>;
  error?: string;
}

export async function fetchTopSuppliersFromDb(params: {
  year?: string;
  month?: string;
  period?: 'month' | 'year' | 'week' | 'day';
  limit?: number;
}): Promise<TopSuppliersApiResponse> {
  const query = new URLSearchParams();
  if (params.year && params.year !== 'all') query.set('year', params.year);
  if (params.month && params.month !== 'all') query.set('month', params.month);
  if (params.period) query.set('period', params.period);
  if (params.limit) query.set('limit', String(params.limit));

  try {
    const res = await fetch(`/api/top-suppliers?${query.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err: any) {
    return {
      source: 'mock',
      suppliers: [],
      error: err.message
    };
  }
}

export interface GrantsSummary {
  invoiceCount: number;
  totalAmount: number;
  supplierCount: number;
  institutionCount: number;
}

export interface GrantCategoryBreakdown {
  category: string;
  count: number;
  totalAmount: number;
}

export interface GrantRecipientBreakdown {
  recipient: string;
  count: number;
  totalAmount: number;
}

export interface GrantPayerBreakdown {
  payer: string;
  count: number;
  totalAmount: number;
}

export interface GrantSampleRow {
  id: string;
  invoiceNumber: string;
  date: string;
  institution: string;
  supplier: string;
  category: string;
  amount: number;
}

export interface GrantsApiResponse {
  source: 'postgres' | 'mock';
  latencyMs: number;
  pattern: string;
  summary: GrantsSummary;
  byCategory: GrantCategoryBreakdown[];
  topRecipients: GrantRecipientBreakdown[];
  topPayers: GrantPayerBreakdown[];
  sampleRows: GrantSampleRow[];
  error?: string;
}

export async function fetchGrantsAnalysisFromDb(params?: {
  year?: string;
  pattern?: string;
  limit?: number;
  minAmount?: number;
  excludeInternal?: boolean;
}): Promise<GrantsApiResponse> {
  const query = new URLSearchParams();
  if (params?.year && params.year !== 'all') query.set('year', params.year);
  if (params?.pattern) query.set('pattern', params.pattern);
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.minAmount) query.set('minAmount', String(params.minAmount));
  if (params?.excludeInternal !== undefined) query.set('excludeInternal', String(params.excludeInternal));

  try {
    const res = await fetch(`/api/grants?${query.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err: any) {
    return {
      source: 'mock',
      latencyMs: 0,
      pattern: '(styrk|framlag|framlög|stuðning|niðurgreiðsl|úthlutun|gjöf|gjafir|verðlaun|endurgreiðsl)',
      summary: {
        invoiceCount: 0,
        totalAmount: 0,
        supplierCount: 0,
        institutionCount: 0
      },
      byCategory: [],
      topRecipients: [],
      topPayers: [],
      sampleRows: [],
      error: err.message
    };
  }
}

export interface GrantsIndexStatusResponse {
  connected: boolean;
  hasExtension: boolean;
  hasIndex: boolean;
  indexName: string | null;
  message?: string;
  error?: string;
}

export async function checkGrantsIndexStatus(): Promise<GrantsIndexStatusResponse> {
  try {
    const res = await fetch('/api/grants-index-status');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err: any) {
    return {
      connected: false,
      hasExtension: false,
      hasIndex: false,
      indexName: null,
      error: err.message
    };
  }
}

export async function createGrantsIndex(): Promise<{ success: boolean; message: string; durationMs?: number; error?: string }> {
  try {
    const res = await fetch('/api/create-grants-index', { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.error || `HTTP ${res.status}`);
    return data;
  } catch (err: any) {
    return {
      success: false,
      message: err.message,
      error: err.message
    };
  }
}

// ---------------------------------------------------------------------------
// Performance Test & Local Diagnostics API
// ---------------------------------------------------------------------------

export interface RecentApiRequest {
  id: string;
  path: string;
  method: string;
  timestamp: string;
  durationMs: number;
  status: number;
}

export interface PerformanceTestTimings {
  dbPingMs: number;
  pagedLookupMs: number;
  dateRangeFilterMs: number;
  dateExtractFilterMs: number;
  regexSearchMs: number;
  groupAggregationMs: number;
}

export interface PerformanceTableStats {
  estimatedRows: number;
  tableSize: string;
  indexesSize: string;
  totalSize: string;
  seqScans: number;
  seqTupRead: number;
  idxScans: number;
  cacheHitPct: number;
}

export interface PerformanceIndexItem {
  name: string;
  definition: string;
  size: string;
}

export interface PerformanceBottleneck {
  severity: 'critical' | 'warning' | 'optimal';
  title: string;
  description: string;
  impact: string;
  solutionSql?: string;
}

export interface PerformanceTestResponse {
  source: 'postgres' | 'mock';
  connected: boolean;
  host?: string;
  port?: number;
  database?: string;
  tableName?: string;
  totalSuiteMs: number;
  timings: PerformanceTestTimings;
  tableStats: PerformanceTableStats;
  indexes: PerformanceIndexItem[];
  bottlenecks: PerformanceBottleneck[];
  recentRequestsCount: number;
  recentAverageMs: number;
  error?: string;
}

export async function fetchRecentRequests(): Promise<{ count: number; requests: RecentApiRequest[] }> {
  try {
    const res = await fetch('/api/recent-requests');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return { count: 0, requests: [] };
  }
}

export async function runPerformanceTest(): Promise<PerformanceTestResponse> {
  const start = Date.now();
  try {
    const res = await fetch('/api/performance-test');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err: any) {
    return {
      source: 'mock',
      connected: false,
      totalSuiteMs: Date.now() - start,
      error: err.message,
      timings: {
        dbPingMs: 0,
        pagedLookupMs: 0,
        dateRangeFilterMs: 0,
        dateExtractFilterMs: 0,
        regexSearchMs: 0,
        groupAggregationMs: 0
      },
      tableStats: {
        estimatedRows: 17919539,
        tableSize: '4,2 GiB',
        indexesSize: '1,1 GiB',
        totalSize: '5,3 GiB',
        seqScans: 0,
        seqTupRead: 0,
        idxScans: 0,
        cacheHitPct: 99.0
      },
      indexes: [],
      bottlenecks: [
        {
          severity: 'warning',
          title: 'Gat ekki tengst bakenda',
          description: err.message,
          impact: 'Athugaðu hvort Node.js bakendinn á localhost sé í gangi.'
        }
      ],
      recentRequestsCount: 0,
      recentAverageMs: 0
    };
  }
}

export async function explainQuery(sql: string): Promise<{ success: boolean; executionMs: number; plan?: string; error?: string }> {
  try {
    const res = await fetch('/api/explain-query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: sql })
    });
    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      executionMs: 0,
      error: err.message
    };
  }
}

export interface ServerExcelFile {
  name: string;
  fullPath: string;
  relativePath: string;
  sizeMb: number;
  modified: string;
}

export interface ExcelFilesResponse {
  success: boolean;
  count: number;
  files: ServerExcelFile[];
  scannedDirs: string[];
}

export async function fetchExcelFiles(): Promise<ExcelFilesResponse> {
  try {
    const res = await fetch('/api/excel-files');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      count: 0,
      files: [],
      scannedDirs: []
    };
  }
}

export async function inspectServerFile(filePath: string): Promise<any> {
  try {
    const res = await fetch('/api/inspect-server-file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath })
    });
    const cType = res.headers.get('content-type') || '';
    if (!cType.includes('application/json')) {
      const text = await res.text();
      if (text.includes('<!DOCTYPE') || res.status === 404) {
        return {
          success: false,
          error: 'Bakendinn á localhost svarar ekki á /api/inspect-server-file. Vantar að uppfæra server.ts á localhost og endurræsa Node.js þjóninn.'
        };
      }
      return { success: false, error: `Óvænt svar (HTTP ${res.status}): ${text.slice(0, 150)}` };
    }
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function importInvoiceBatch(batch: any[], dryRun = false): Promise<any> {
  try {
    const res = await fetch('/api/import-invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ batch, dryRun })
    });
    const cType = res.headers.get('content-type') || '';
    if (!cType.includes('application/json')) {
      const text = await res.text();
      if (text.includes('<!DOCTYPE') || res.status === 404) {
        return {
          success: false,
          error: 'Bakendinn á localhost vantar nýja endapunktinn /api/import-invoices. Vantar að uppfæra server.ts á localhost og endurræsa Node.js þjóninn.'
        };
      }
      return { success: false, error: `Óvænt svar frá bakenda (HTTP ${res.status}): ${text.slice(0, 150)}` };
    }
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function importServerFile(filePath: string, dryRun = false): Promise<any> {
  try {
    const res = await fetch('/api/import-server-file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath, dryRun })
    });
    const cType = res.headers.get('content-type') || '';
    if (!cType.includes('application/json')) {
      const text = await res.text();
      if (text.includes('<!DOCTYPE') || res.status === 404) {
        return {
          success: false,
          error: 'Bakendinn á localhost vantar nýja endapunktinn /api/import-server-file. Vantar að uppfæra server.ts á localhost og endurræsa Node.js þjóninn.'
        };
      }
      return { success: false, error: `Óvænt svar frá bakenda (HTTP ${res.status}): ${text.slice(0, 150)}` };
    }
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export default {
  checkDbStatus,
  updateDbConfig,
  fetchInstitutionsFromDb,
  fetchInvoicesFromDb,
  fetchInstitutionSuppliersFromDb,
  fetchTopSuppliersFromDb,
  fetchOverviewFromDb,
  fetchBenchmarkFromDb,
  fetchGrantsAnalysisFromDb,
  checkGrantsIndexStatus,
  createGrantsIndex,
  fetchRecentRequests,
  runPerformanceTest,
  explainQuery,
  fetchExcelFiles,
  inspectServerFile,
  importInvoiceBatch,
  importServerFile
};

