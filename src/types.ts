export interface InvoiceLine {
  description: string;
  amount: number;
  is_kredit: boolean;
}

export interface Invoice {
  id: string;
  client: string;
  supplier: string;
  date: string;
  amount: number;
  lines: InvoiceLine[];
}

export interface Stofnun {
  id?: number;
  client: string;
  invoiceCount: number;
  lineCount?: number;
  totalAmount: number;
}

export interface TopSupplier {
  supplier: string;
  total: number;
}

export interface DatabaseStats {
  ar_2017_2025_fjoldi: number;
  ar_2026_fjoldi: number;
  nyrjasta_dags: string;
  dagar_sidan: number;
  stofnanir_fjoldi: number;
  birgjar_fjoldi: number;
  total_size_gib: number;
  reikningar_size_gib: number;
  birgjar_size_mib: number;
  stofnanir_size_kib: number;
}

export interface SelectedInvoiceItem {
  client: string;
  supplier: string;
  reikningsnr: string;
  dags: string;
  lysing: string;
  amount: number;
  row_id?: string;
}

export interface TaskItem {
  id: string;
  milestone: 'M1' | 'M2' | 'M3' | 'M4';
  title: string;
  desc: string;
  status: 'completed' | 'in_progress' | 'future';
  priority?: 'high' | 'medium' | 'low';
  category: 'Gagnagrunnur' | 'Bakendi' | 'Framendi' | 'Rekstur' | 'Markaðssetning' | 'Lögfræði';
  deadline?: string;
  assignee?: string;
  createdAt?: string;
}

export type BrandStatus = 'adal' | 'i_skodun' | 'fratekid' | 'hugmynd' | 'hafnad';

export interface BrandItem {
  id: string;
  nafn: string;
  len: string;
  slogan: string;
  status: BrandStatus;
  markhopur: string;
  kostir: string[];
  gallar: string[];
  isnicStatus: 'laust' | 'fratekid' | 'athuga';
  athugasemdir?: string;
  einkunn?: number; // 1-5 stjörnur
  createdAt: string;
}

export interface LocalhostFileUpdate {
  id: string;
  filePath: string;
  description: string;
  updatedAt: string;
  versionLabel?: string;
}

export interface StofnunEmailItem {
  id: string;
  name: string;
  kennitala?: string;
  raduneyti?: string;
  email?: string;
  status: 'active' | 'missing' | 'manual_review' | 'verified';
  source?: 'database' | 'csv' | 'manual';
  notes?: string;
  updatedAt?: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface PollItem {
  id: string;
  title: string;
  description: string;
  category: 'vorumerki' | 'gogn' | 'samfelag' | 'almennt';
  options: PollOption[];
  status: 'active' | 'closed';
  createdAt: string;
}

