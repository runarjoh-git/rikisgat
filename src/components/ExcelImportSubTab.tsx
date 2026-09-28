import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  FileSpreadsheet, Upload, CheckCircle2, AlertCircle, Clock, Database, 
  Search, ArrowRight, Play, Eye, RefreshCw, HardDrive, FileText, 
  Calendar, Building2, Store, DollarSign, Filter, ChevronLeft, ChevronRight,
  Copy, Check, ShieldCheck, HelpCircle, Layers, ArrowUpDown, Zap,
  Terminal, BookOpen, Sparkles, CheckCheck, FolderDown, Code, Info, ExternalLink
} from 'lucide-react';
import * as XLSXModule from 'xlsx';
import { 
  fetchExcelFiles, 
  inspectServerFile, 
  importInvoiceBatch, 
  importServerFile, 
  checkDbStatus,
  ServerExcelFile, 
  DbStatusResponse 
} from '../services/api';

const XLSX: any = (XLSXModule as any).readFile 
  ? XLSXModule 
  : ((XLSXModule as any).default?.readFile ? (XLSXModule as any).default : ((XLSXModule as any).default || XLSXModule));

interface ParsedRow {
  rowIndex: number;
  dags: string;
  stofnun: string;
  birgir: string;
  upphaed: number;
  numer?: string;
  kt?: string;
  tegund?: string;
  rawDate?: any;
  hasValidDate: boolean;
  hasValidAmount: boolean;
}

export const ExcelImportSubTab: React.FC = () => {
  // DB status state
  const [dbStatus, setDbStatus] = useState<DbStatusResponse | null>(null);
  const [isCheckingDb, setIsCheckingDb] = useState(false);

  // Server files state
  const [serverFiles, setServerFiles] = useState<ServerExcelFile[]>([]);
  const [scannedDirs, setScannedDirs] = useState<string[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [selectedServerFile, setSelectedServerFile] = useState<string>('');

  // Active source mode: 'local' (file upload / drag & drop), 'server' (files on disk), or 'guide' (PowerShell & Deduplication Guide)
  const [sourceMode, setSourceMode] = useState<'local' | 'server' | 'guide'>('local');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Loaded file details
  const [fileName, setFileName] = useState<string>('');
  const [fileSizeMb, setFileSizeMb] = useState<number | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [activeSheet, setActiveSheet] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>([]);

  // Column mappings
  const [colStofnun, setColStofnun] = useState<string>('');
  const [colBirgir, setColBirgir] = useState<string>('');
  const [colDags, setColDags] = useState<string>('');
  const [colUpphaed, setColUpphaed] = useState<string>('');
  const [colNumer, setColNumer] = useState<string>('');
  const [colKt, setColKt] = useState<string>('');
  const [colTegund, setColTegund] = useState<string>('');

  // Parsed rows
  const [allRows, setAllRows] = useState<ParsedRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [parseProgress, setParseProgress] = useState<string>('');

  // Table filter & pagination
  const [tableSearch, setTableSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortField, setSortField] = useState<'dags' | 'stofnun' | 'birgir' | 'upphaed'>('dags');
  const [sortAsc, setSortAsc] = useState(false);

  // Import state
  const [cliTab, setCliTab] = useState<'single' | 'dryrun' | 'folder' | 'sql'>('single');
  const [isImporting, setIsImporting] = useState(false);
  const [importMode, setImportMode] = useState<'dryRun' | 'real' | null>(null);
  const [importProgressPct, setImportProgressPct] = useState(0);
  const [importStatusText, setImportStatusText] = useState('');
  const [importResult, setImportResult] = useState<{
    success: boolean;
    dryRun: boolean;
    totalRows: number;
    totalAmount: number;
    newStofnanir: number;
    newBirgjar: number;
    durationMs: number;
    error?: string;
  } | null>(null);

  // Copy state
  const [copiedCli, setCopiedCli] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const rawRowsRef = useRef<{ rawRows: any[][]; headerIdx: number; rawHeaders: string[] } | null>(null);

  // Initial load: check DB & list server files
  useEffect(() => {
    loadDbStatus();
    loadServerFiles();
  }, []);

  const loadDbStatus = async () => {
    setIsCheckingDb(true);
    try {
      const res = await checkDbStatus();
      setDbStatus(res);
    } catch {
      setDbStatus(null);
    } finally {
      setIsCheckingDb(false);
    }
  };

  const loadServerFiles = async () => {
    setIsLoadingFiles(true);
    try {
      const res = await fetchExcelFiles();
      if (res.success && res.files) {
        setServerFiles(res.files);
        setScannedDirs(res.scannedDirs || []);
        if (res.files.length > 0 && !selectedServerFile) {
          setSelectedServerFile(res.files[0].fullPath);
        }
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingFiles(false);
    }
  };

  // Helper function to clean amounts
  const parseAmount = (val: any): number => {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    let s = String(val).trim();
    if (!s) return 0;
    s = s.replace(/\s*kr\.?/gi, '').replace(/\s*ISK/gi, '').replace(/\s/g, '');
    const isParenNeg = s.startsWith('(') && s.endsWith(')');
    if (isParenNeg) s = s.slice(1, -1);
    if (s.includes(',') && s.includes('.')) {
      s = s.replace(/\./g, '').replace(',', '.');
    } else if (s.includes(',')) {
      s = s.replace(',', '.');
    }
    const parsed = parseFloat(s);
    if (isNaN(parsed)) return 0;
    return isParenNeg ? -parsed : parsed;
  };

  // Helper function to clean dates
  const parseDate = (val: any): string | null => {
    if (val === null || val === undefined) return null;
    if (val instanceof Date) {
      return !isNaN(val.getTime()) ? val.toISOString().slice(0, 10) : null;
    }
    const num = typeof val === 'number' 
      ? val 
      : (typeof val === 'string' && /^\d{4,6}(\.\d+)?$/.test(val.trim()) ? parseFloat(val.trim()) : null);
    
    if (num && num > 20000 && num < 70000) {
      const jsDate = new Date(Math.round((num - 25569) * 86400 * 1000));
      if (!isNaN(jsDate.getTime())) {
        return jsDate.toISOString().slice(0, 10);
      }
    }

    const s = String(val).trim();
    const m1 = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})/);
    if (m1) {
      const [, d, m, y] = m1;
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    const m2 = s.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})/);
    if (m2) {
      const [, y, m, d] = m2;
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    const m3 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
    if (m3) {
      const [, m, d, y] = m3;
      const fullYear = y.length === 2 ? `20${y}` : y;
      return `${fullYear}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    if (s.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(s)) {
      return s.slice(0, 10);
    }
    return null;
  };

  // Auto-detect columns based on common header names
  const autoDetectColumns = (headerList: string[]) => {
    const findMatch = (candidates: string[]) => {
      for (const h of headerList) {
        const lower = h.toLowerCase().trim();
        for (const cand of candidates) {
          if (lower.includes(cand)) return h;
        }
      }
      return '';
    };

    const detected = {
      dags: findMatch(['dags', 'dagsetning', 'bókunardags', 'útgáfudags', 'date']),
      upphaed: findMatch(['fjárhæð', 'upphæð', 'upphaed', 'heildarupphæð', 'amount']),
      stofnun: findMatch(['stofnun', 'greiðandi', 'kaupandi', 'aðili', 'client']),
      birgir: findMatch(['birgi', 'birgir', 'nafn birgis', 'seljandi', 'supplier']),
      kt: findMatch(['kt', 'kennitala', 'kt.']),
      numer: findMatch(['reikning', 'numer', 'númer', 'fylgiskjal', 'nr']),
      tegund: findMatch(['tegund', 'bókhaldslykill', 'lykill', 'skýring', 'vörulýsing', 'heiti'])
    };

    setColDags(detected.dags);
    setColUpphaed(detected.upphaed);
    setColStofnun(detected.stofnun);
    setColBirgir(detected.birgir);
    setColKt(detected.kt);
    setColNumer(detected.numer);
    setColTegund(detected.tegund);

    return detected;
  };

  // Handle local file selection
  const handleLocalFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processLocalFile(file);
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processLocalFile(file);
    }
  };

  const processLocalFile = async (file: File) => {
    setIsParsing(true);
    setParseProgress('Les skrá í minni...');
    setFileName(file.name);
    setFileSizeMb(+(file.size / (1024 * 1024)).toFixed(2));
    setImportResult(null);

    try {
      const buffer = await file.arrayBuffer();
      setParseProgress('Greini vinnublað og dálka...');
      const workbook = XLSX.read(buffer, { cellDates: true });
      const sheets = workbook.SheetNames;
      setSheetNames(sheets);

      const firstSheet = sheets[0];
      setActiveSheet(firstSheet);
      const worksheet = workbook.Sheets[firstSheet];
      const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (!rawRows || rawRows.length < 2) {
        alert('Skrá virðist tóm eða inniheldur engar gagnaraðir.');
        setIsParsing(false);
        return;
      }

      // Find header row
      let headerIdx = 0;
      for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
        if (rawRows[i] && rawRows[i].some(c => c !== null && c !== undefined && String(c).trim() !== '')) {
          headerIdx = i;
          break;
        }
      }

      const rawHeaders = rawRows[headerIdx].map((c, i) => String(c || `Dálkur_${i + 1}`).trim());
      setHeaders(rawHeaders);
      const detected = autoDetectColumns(rawHeaders);

      setParseProgress(`Vinn úr línum...`);

      // Store in ref for instant recalculation when dropdowns change
      rawRowsRef.current = { rawRows, headerIdx, rawHeaders };
      buildParsedRows(rawRows, headerIdx, rawHeaders, detected);
    } catch (err: any) {
      alert(`Villa við lestur Excel skráar: ${err.message}`);
    } finally {
      setIsParsing(false);
      setParseProgress('');
    }
  };

  // Build structured rows
  const buildParsedRows = (
    rawRows: any[][], 
    headerIdx: number, 
    rawHeaders: string[],
    mappingOverride?: {
      dags?: string;
      upphaed?: string;
      stofnun?: string;
      birgir?: string;
      kt?: string;
      numer?: string;
      tegund?: string;
    }
  ) => {
    const dagsCol = mappingOverride?.dags !== undefined ? mappingOverride.dags : colDags;
    const upphaedCol = mappingOverride?.upphaed !== undefined ? mappingOverride.upphaed : colUpphaed;
    const stofnunCol = mappingOverride?.stofnun !== undefined ? mappingOverride.stofnun : colStofnun;
    const birgirCol = mappingOverride?.birgir !== undefined ? mappingOverride.birgir : colBirgir;
    const ktCol = mappingOverride?.kt !== undefined ? mappingOverride.kt : colKt;
    const numerCol = mappingOverride?.numer !== undefined ? mappingOverride.numer : colNumer;
    const tegundCol = mappingOverride?.tegund !== undefined ? mappingOverride.tegund : colTegund;

    const idxDags = dagsCol ? rawHeaders.indexOf(dagsCol) : -1;
    const idxUpphaed = upphaedCol ? rawHeaders.indexOf(upphaedCol) : -1;
    const idxStofnun = stofnunCol ? rawHeaders.indexOf(stofnunCol) : -1;
    const idxBirgir = birgirCol ? rawHeaders.indexOf(birgirCol) : -1;
    const idxKt = ktCol ? rawHeaders.indexOf(ktCol) : -1;
    const idxNumer = numerCol ? rawHeaders.indexOf(numerCol) : -1;
    const idxTegund = tegundCol ? rawHeaders.indexOf(tegundCol) : -1;

    const parsed: ParsedRow[] = [];

    for (let i = headerIdx + 1; i < rawRows.length; i++) {
      const row = rawRows[i];
      if (!row || row.length === 0) continue;

      const rawDate = idxDags !== -1 ? row[idxDags] : null;
      const cleanDags = parseDate(rawDate);
      const rawAmount = idxUpphaed !== -1 ? row[idxUpphaed] : null;
      const amount = parseAmount(rawAmount);

      const stName = idxStofnun !== -1 && row[idxStofnun] !== undefined && row[idxStofnun] !== null 
        ? String(row[idxStofnun]).trim() 
        : '';
      const bName = idxBirgir !== -1 && row[idxBirgir] !== undefined && row[idxBirgir] !== null 
        ? String(row[idxBirgir]).trim() 
        : '';
      const bKt = idxKt !== -1 && row[idxKt] !== undefined && row[idxKt] !== null 
        ? String(row[idxKt]).trim() 
        : undefined;
      const invNr = idxNumer !== -1 && row[idxNumer] !== undefined && row[idxNumer] !== null 
        ? String(row[idxNumer]).trim() 
        : undefined;
      const tegund = idxTegund !== -1 && row[idxTegund] !== undefined && row[idxTegund] !== null 
        ? String(row[idxTegund]).trim() 
        : 'Almennur rekstur';

      // Skip completely empty trailing rows from Excel sheet
      const hasMeaningfulData = cleanDags || amount !== 0 || (stName && stName.length > 0) || (bName && bName.length > 0) || invNr;
      if (!hasMeaningfulData) continue;

      parsed.push({
        rowIndex: i + 1,
        dags: cleanDags || 'Ógild dags',
        rawDate,
        stofnun: stName || 'Óskráð stofnun',
        birgir: bName || 'Óskráður birgir',
        kt: bKt,
        numer: invNr,
        tegund: tegund || 'Almennur rekstur',
        upphaed: amount,
        hasValidDate: !!cleanDags,
        hasValidAmount: !isNaN(amount)
      });
    }

    setAllRows(parsed);
    setCurrentPage(1);
  };

  // Immediate reactive change handler for column dropdowns
  const handleColumnChange = (
    field: 'dags' | 'upphaed' | 'stofnun' | 'birgir' | 'kt' | 'numer' | 'tegund', 
    val: string
  ) => {
    const updatedMapping = {
      dags: field === 'dags' ? val : colDags,
      upphaed: field === 'upphaed' ? val : colUpphaed,
      stofnun: field === 'stofnun' ? val : colStofnun,
      birgir: field === 'birgir' ? val : colBirgir,
      kt: field === 'kt' ? val : colKt,
      numer: field === 'numer' ? val : colNumer,
      tegund: field === 'tegund' ? val : colTegund
    };

    if (field === 'dags') setColDags(val);
    if (field === 'upphaed') setColUpphaed(val);
    if (field === 'stofnun') setColStofnun(val);
    if (field === 'birgir') setColBirgir(val);
    if (field === 'kt') setColKt(val);
    if (field === 'numer') setColNumer(val);
    if (field === 'tegund') setColTegund(val);

    if (rawRowsRef.current) {
      const { rawRows, headerIdx, rawHeaders } = rawRowsRef.current;
      buildParsedRows(rawRows, headerIdx, rawHeaders, updatedMapping);
    }
  };

  // Manual re-run button
  const handleApplyMapping = () => {
    if (rawRowsRef.current) {
      const { rawRows, headerIdx, rawHeaders } = rawRowsRef.current;
      buildParsedRows(rawRows, headerIdx, rawHeaders, {
        dags: colDags,
        upphaed: colUpphaed,
        stofnun: colStofnun,
        birgir: colBirgir,
        kt: colKt,
        numer: colNumer,
        tegund: colTegund
      });
    }
  };

  // Inspect server-side file
  const handleInspectServerFile = async (filePath: string) => {
    setIsParsing(true);
    setParseProgress('Sæki upplýsingar um skrá af netþjóni...');
    setImportResult(null);

    try {
      const res = await inspectServerFile(filePath);
      if (!res.success) {
        alert(res.error || 'Gat ekki lesið skrá af netþjóni');
        return;
      }

      setFileName(res.filename);
      setFileSizeMb(res.sizeMb);
      setSheetNames(res.sheetNames || []);
      setActiveSheet(res.activeSheet || '');
      setHeaders(res.headers || []);
      const detected = autoDetectColumns(res.headers || []);

      // Convert sample rows to parsed
      const samples: ParsedRow[] = (res.sampleRows || []).map((r: any, idx: number) => {
        const dCol = detected.dags || 'Dags.greiðslu';
        const uCol = detected.upphaed || 'Upphæð línu';
        const sCol = detected.stofnun || 'Kaupandi';
        const bCol = detected.birgir || 'Birgi';
        const kCol = detected.kt || 'Kennitala';
        const nCol = detected.numer || 'Númer reiknings';
        const tCol = detected.tegund || 'Tegund';

        const rawDags = r[dCol] || r['Dags.greiðslu'] || r['Dagsetning'] || r['dags'];
        const cleanDags = parseDate(rawDags);
        const rawAmount = r[uCol] || r['Upphæð línu'] || r['Upphæð'] || r['upphaed'];
        const amount = parseAmount(rawAmount);

        return {
          rowIndex: idx + 1,
          dags: cleanDags || 'Ógild dags',
          stofnun: r[sCol] || r['Kaupandi'] || r['Stofnun'] || 'Óskráð stofnun',
          birgir: r[bCol] || r['Birgi'] || r['Birgir'] || 'Óskráður birgir',
          kt: r[kCol] || r['Kennitala'] || undefined,
          numer: r[nCol] || r['Númer reiknings'] || r['Reikningur'] || undefined,
          tegund: r[tCol] || r['Tegund'] || 'Almennur rekstur',
          upphaed: amount,
          hasValidDate: !!cleanDags,
          hasValidAmount: !isNaN(amount)
        };
      });

      setAllRows(samples);
      setCurrentPage(1);
    } catch (err: any) {
      alert(`Villa við að skoða skrá á netþjóni: ${err.message}`);
    } finally {
      setIsParsing(false);
      setParseProgress('');
    }
  };

  // Run Import (either Dry Run or Real Import)
  const handleStartImport = async (dryRun: boolean) => {
    if (!allRows || allRows.length === 0) {
      alert('Engar línur eru tilbúnar til innlestrar.');
      return;
    }

    setIsImporting(true);
    setImportMode(dryRun ? 'dryRun' : 'real');
    setImportProgressPct(0);
    setImportResult(null);

    const modeName = dryRun ? 'Prófun (Dry Run)' : 'Rauninnlestur';
    setImportStatusText(`Hef ${modeName}...`);

    const startTime = Date.now();

    // Ef DRY RUN: Við getum prófað allar línur leifturhratt án þess að senda hundruð HTTP beiðna!
    if (dryRun) {
      try {
        setImportStatusText('Athuga gæði gagna og dagsetningar í línum...');
        setImportProgressPct(50);

        let validCount = 0;
        let invalidDateCount = 0;
        let totalAmt = 0;
        const stSet = new Set<string>();
        const bSet = new Set<string>();

        for (const r of allRows) {
          if (r.hasValidDate) validCount++;
          else invalidDateCount++;
          totalAmt += r.upphaed;
          if (r.stofnun && r.stofnun !== 'Óskráð stofnun') stSet.add(r.stofnun);
          if (r.birgir && r.birgir !== 'Óskráður birgir') bSet.add(r.birgir);
        }

        setImportStatusText('Prófa tengingu við PostgreSQL bakenda...');
        setImportProgressPct(80);

        // Prófa lítinn bút við bakenda til að staðfesta SQL tengingu
        const testSlice = allRows.slice(0, 50);
        const testRes = await importInvoiceBatch(testSlice, true);

        if (!testRes.success) {
          throw new Error(testRes.error || 'Gat ekki tengst /api/import-invoices á bakenda.');
        }

        setImportProgressPct(100);
        setImportResult({
          success: true,
          dryRun: true,
          totalRows: allRows.length,
          totalAmount: totalAmt,
          newStofnanir: stSet.size,
          newBirgjar: bSet.size,
          durationMs: Date.now() - startTime
        });
        setImportStatusText(`✅ Prófun lokið með góðum árangri! (${allRows.length.toLocaleString('is-IS')} línur tilbúnar)`);
      } catch (err: any) {
        setImportResult({
          success: false,
          dryRun: true,
          totalRows: allRows.length,
          totalAmount: 0,
          newStofnanir: 0,
          newBirgjar: 0,
          durationMs: Date.now() - startTime,
          error: err.message
        });
        setImportStatusText(`❌ Villa í prófun: ${err.message}`);
      } finally {
        setIsImporting(false);
      }
      return;
    }

    // RAUNINNLESTUR (Raunveruleg skráning í PostgreSQL)
    const isLargeDataset = allRows.length > 50000;
    const ok = window.confirm(
      `Ertu viss um að vilja hlaða ${allRows.length.toLocaleString('is-IS')} línum inn í PostgreSQL gagnagrunninn?\n\n` +
      (isLargeDataset ? `⚠️ Ábending: Fyrir risastór gagnasöfn (${allRows.length.toLocaleString('is-IS')} línur) er líka hægt að nota CLI skipunina hér að neðan sem les beint af disknum á nokkrum sekúndum.\n\nSmelltu á Í lagi til að halda áfram gegnum vefinn.` : '')
    );
    if (!ok) {
      setIsImporting(false);
      return;
    }

    const BATCH_SIZE = 2500;
    const totalBatches = Math.ceil(allRows.length / BATCH_SIZE);

    let totalInserted = 0;
    let totalAmt = 0;
    let totalNewStofnanir = 0;
    let totalNewBirgjar = 0;

    try {
      for (let b = 0; b < totalBatches; b++) {
        const startIdx = b * BATCH_SIZE;
        const endIdx = Math.min(startIdx + BATCH_SIZE, allRows.length);
        const batchSlice = allRows.slice(startIdx, endIdx);

        setImportStatusText(
          `Rauninnlestur: Vinn úr línum ${startIdx.toLocaleString('is-IS')} – ${endIdx.toLocaleString('is-IS')} af ${allRows.length.toLocaleString('is-IS')}...`
        );

        const res = await importInvoiceBatch(batchSlice, false);
        if (!res.success) {
          throw new Error(res.error || `Villa við innlestur í bút ${b + 1}`);
        }

        totalInserted += res.insertedCount || batchSlice.length;
        totalAmt += res.totalAmount || 0;
        totalNewStofnanir += res.newStofnanirCount || 0;
        totalNewBirgjar += res.newBirgjarCount || 0;

        const pct = Math.round(((b + 1) / totalBatches) * 100);
        setImportProgressPct(pct);
      }

      setImportResult({
        success: true,
        dryRun: false,
        totalRows: totalInserted,
        totalAmount: totalAmt,
        newStofnanir: totalNewStofnanir,
        newBirgjar: totalNewBirgjar,
        durationMs: Date.now() - startTime
      });
      setImportStatusText(`✅ Innlestri á ${totalInserted.toLocaleString('is-IS')} línum lokið!`);
    } catch (err: any) {
      setImportResult({
        success: false,
        dryRun: false,
        totalRows: totalInserted,
        totalAmount: totalAmt,
        newStofnanir: totalNewStofnanir,
        newBirgjar: totalNewBirgjar,
        durationMs: Date.now() - startTime,
        error: err.message
      });
      setImportStatusText(`❌ Villa kom upp við innlestur: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  // Direct server-side import (ideal for massive files)
  const handleServerFileImport = async (dryRun: boolean) => {
    if (!selectedServerFile) {
      alert('Vinsamlegast veldu skrá af netþjóni.');
      return;
    }

    setIsImporting(true);
    setImportMode(dryRun ? 'dryRun' : 'real');
    setImportProgressPct(25);
    setImportStatusText(dryRun ? 'Keyri prófun á netþjóni...' : 'Hleð inn skrá beint á netþjóni...');
    setImportResult(null);

    try {
      const res = await importServerFile(selectedServerFile, dryRun);
      if (!res.success) {
        throw new Error(res.error || 'Innlestur á netþjóni mistókst');
      }

      setImportProgressPct(100);
      setImportResult({
        success: true,
        dryRun,
        totalRows: res.totalRows,
        totalAmount: res.totalAmount,
        newStofnanir: res.newStofnanir || 0,
        newBirgjar: res.newBirgjar || 0,
        durationMs: res.durationMs || 0
      });
      setImportStatusText(`✅ Innlestri lokið á netþjóni!`);
    } catch (err: any) {
      setImportResult({
        success: false,
        dryRun,
        totalRows: 0,
        totalAmount: 0,
        newStofnanir: 0,
        newBirgjar: 0,
        durationMs: 0,
        error: err.message
      });
      setImportStatusText(`❌ Villa við innlestur á netþjóni: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  // Copy CLI command & clipboard helper
  const copyCliCommand = () => {
    const cmd = `npx tsx scripts/import_excel_to_postgres.ts "${fileName || 'data/opnir_reikingar/2026-4.xlsx'}"`;
    navigator.clipboard.writeText(cmd).then(() => {
      setCopiedCli(true);
      setTimeout(() => setCopiedCli(false), 2000);
    });
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    });
  };

  // Derived KPI calculations
  const stats = useMemo(() => {
    if (allRows.length === 0) {
      return { totalRows: 0, totalAmount: 0, minDate: '', maxDate: '', uniqueStofnanir: 0, uniqueBirgjar: 0 };
    }

    let sum = 0;
    const stSet = new Set<string>();
    const bSet = new Set<string>();
    let minD = '9999-99-99';
    let maxD = '0000-00-00';

    for (const r of allRows) {
      sum += r.upphaed;
      if (r.stofnun) stSet.add(r.stofnun);
      if (r.birgir) bSet.add(r.birgir);
      if (r.hasValidDate && r.dags !== 'Ógild dags') {
        if (r.dags < minD) minD = r.dags;
        if (r.dags > maxD) maxD = r.dags;
      }
    }

    return {
      totalRows: allRows.length,
      totalAmount: sum,
      minDate: minD === '9999-99-99' ? '-' : minD,
      maxDate: maxD === '0000-00-00' ? '-' : maxD,
      uniqueStofnanir: stSet.size,
      uniqueBirgjar: bSet.size
    };
  }, [allRows]);

  // Filtered and sorted rows for preview
  const filteredRows = useMemo(() => {
    if (!tableSearch.trim()) return allRows;
    const q = tableSearch.toLowerCase().trim();
    return allRows.filter(r => 
      r.stofnun.toLowerCase().includes(q) ||
      r.birgir.toLowerCase().includes(q) ||
      r.dags.includes(q) ||
      (r.numer && r.numer.toLowerCase().includes(q)) ||
      (r.tegund && r.tegund.toLowerCase().includes(q))
    );
  }, [allRows, tableSearch]);

  const sortedRows = useMemo(() => {
    const list = [...filteredRows];
    list.sort((a, b) => {
      let vA = a[sortField];
      let vB = b[sortField];
      if (typeof vA === 'string') {
        return sortAsc ? (vA as string).localeCompare(vB as string) : (vB as string).localeCompare(vA as string);
      }
      return sortAsc ? (vA as number) - (vB as number) : (vB as number) - (vA as number);
    });
    return list;
  }, [filteredRows, sortField, sortAsc]);

  const totalPages = Math.ceil(sortedRows.length / pageSize) || 1;
  const pagedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, currentPage, pageSize]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-neutral-900 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-neutral-900">
                Gagnainnlestur & Skráaskoðun (Excel / CSV)
              </h2>
              <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded">
                Node.js & PostgreSQL
              </span>
            </div>
            <p className="text-xs text-neutral-600 max-w-3xl leading-relaxed">
              Veldu reikningaskjal úr tölvunni þinni eða af netþjóninum til að skoða línur, staðfesta dálkagreiningu (stofnanir, birgja, upphæðir) og hlaða örugglega inn í PostgreSQL með prufukeyrslu (Dry Run).
            </p>
          </div>

          {/* Database Connection Status Badge */}
          <div className="flex items-center gap-2.5 bg-neutral-50 px-3.5 py-2 rounded-xl border border-neutral-200 self-start md:self-center shrink-0">
            <Database className="w-4 h-4 text-neutral-700" />
            <div className="text-xs">
              <div className="flex items-center gap-1.5 font-bold text-neutral-900">
                <span className={`w-2 h-2 rounded-full ${dbStatus?.connected ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                <span>{dbStatus?.connected ? 'PostgreSQL Tengt' : 'Gagnagrunnur ótengdur'}</span>
              </div>
              <div className="text-[10px] text-neutral-500 font-mono">
                {dbStatus?.database ? `${dbStatus.database} @ ${dbStatus.host}:${dbStatus.port}` : 'localhost:5432'}
              </div>
            </div>
            <button 
              onClick={loadDbStatus}
              disabled={isCheckingDb}
              className="p-1 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200 rounded transition cursor-pointer"
              title="Endurhlaða stöðu tengingar"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCheckingDb ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Source Switcher */}
        <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-neutral-100">
          <button
            onClick={() => setSourceMode('local')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              sourceMode === 'local'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Hlaða upp skrá úr tölvu (.xlsx / .csv)</span>
          </button>

          <button
            onClick={() => setSourceMode('server')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              sourceMode === 'server'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Skrár á netþjóni / gagnamöppu ({serverFiles.length})</span>
          </button>

          <button
            onClick={() => setSourceMode('guide')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              sourceMode === 'guide'
                ? 'bg-emerald-900 text-white shadow-xs ring-2 ring-emerald-600'
                : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-300'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-700" />
            <span>📘 PowerShell & Nýir mánuðir (Handbók)</span>
            <span className="bg-emerald-200/80 text-emerald-950 text-[10px] px-1.5 py-0.5 rounded font-bold">Vörn birgja</span>
          </button>
        </div>
      </div>

      {/* Mode 1: Local File Upload & Drag and Drop */}
      {sourceMode === 'local' && (
        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-xs space-y-4">
          <div
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-neutral-300 hover:border-neutral-900 rounded-xl p-8 text-center bg-neutral-50 hover:bg-neutral-100/50 transition cursor-pointer flex flex-col items-center justify-center gap-2.5"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleLocalFileChange}
              accept=".xlsx,.xls,.csv"
              className="hidden"
            />
            <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-xs">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-bold text-neutral-900">
                Smelltu hér eða dragðu Excel eða CSV skrá hingað
              </div>
              <div className="text-xs text-neutral-500 mt-0.5">
                Styður .xlsx, .xls og .csv (t.d. <code>2026-4.xlsx</code>, <code>2025_1.xlsx</code> o.s.frv.)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mode 2: Server Files (data/opnir_reikingar) */}
      {sourceMode === 'server' && (
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-wider text-neutral-700 flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-neutral-800" />
              <span>Tilbúnar skrár í gagnamöppum verkefnisins</span>
            </div>
            <button
              onClick={loadServerFiles}
              disabled={isLoadingFiles}
              className="text-xs text-neutral-600 hover:text-neutral-900 font-bold flex items-center gap-1 transition"
            >
              <RefreshCw className={`w-3 h-3 ${isLoadingFiles ? 'animate-spin' : ''}`} />
              <span>Endurlesa möppu</span>
            </button>
          </div>

          {serverFiles.length === 0 ? (
            <div className="p-6 text-center bg-neutral-50 rounded-lg border border-neutral-200 text-xs text-neutral-600 space-y-2">
              <AlertCircle className="w-6 h-6 text-amber-600 mx-auto" />
              <div className="font-bold text-neutral-800">Engar Excel skrár fundust í sjálfgefnum möppum.</div>
              <p className="text-[11px] text-neutral-500 max-w-md mx-auto">
                Setturðu skrárnar í <code>data/opnir_reikingar/</code> eða á D:\ drifið? 
                Þú getur líka notað <strong>„Hlaða upp skrá úr tölvu“</strong> flipann hér að ofan til að velja hvaða skrá sem er beint.
              </p>
              {scannedDirs.length > 0 && (
                <div className="text-[10px] text-neutral-400 font-mono pt-1">
                  Leitað í: {scannedDirs.join(', ')}
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {serverFiles.map(file => {
                const isSelected = selectedServerFile === file.fullPath;
                return (
                  <div
                    key={file.fullPath}
                    onClick={() => setSelectedServerFile(file.fullPath)}
                    className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                      isSelected 
                        ? 'border-neutral-900 bg-neutral-900 text-white shadow-md' 
                        : 'border-neutral-200 bg-neutral-50 hover:bg-white hover:border-neutral-400'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                          isSelected ? 'bg-neutral-800 text-emerald-400' : 'bg-neutral-200 text-neutral-700'
                        }`}>
                          {file.sizeMb} MB
                        </span>
                        <span className={`text-[10px] ${isSelected ? 'text-neutral-300' : 'text-neutral-500'}`}>
                          {file.modified.slice(0, 10)}
                        </span>
                      </div>
                      <div className="font-bold text-xs truncate" title={file.name}>
                        {file.name}
                      </div>
                      <div className={`text-[10px] truncate mt-0.5 ${isSelected ? 'text-neutral-300 font-mono' : 'text-neutral-400 font-mono'}`}>
                        {file.relativePath}
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedServerFile(file.fullPath);
                          handleInspectServerFile(file.fullPath);
                        }}
                        className={`px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition ${
                          isSelected ? 'bg-white text-neutral-900 hover:bg-neutral-100' : 'bg-neutral-200 hover:bg-neutral-300 text-neutral-800'
                        }`}
                      >
                        <Eye className="w-3 h-3" />
                        <span>Skoða línur</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedServerFile(file.fullPath);
                          handleServerFileImport(false);
                        }}
                        className={`px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition ${
                          isSelected ? 'bg-emerald-500 text-white hover:bg-emerald-400' : 'bg-neutral-900 text-white hover:bg-neutral-800'
                        }`}
                        title="Hlaða inn beint á bakenda"
                      >
                        <Play className="w-3 h-3" />
                        <span>Hlaða inn</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Parsing state indicator */}
      {isParsing && (
        <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-300 flex items-center gap-3 animate-pulse">
          <RefreshCw className="w-5 h-5 text-neutral-700 animate-spin" />
          <div className="text-xs font-bold text-neutral-800">
            {parseProgress || 'Vinn úr skrá...'}
          </div>
        </div>
      )}

      {/* Quick PowerShell guide banner when in upload or server mode */}
      {sourceMode !== 'guide' && !fileName && (
        <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-950 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-emerald-900 text-xs">
                Að hlaða inn nýjum mánuði úr opnirreikningar.is með PowerShell?
              </div>
              <div className="text-[11px] text-emerald-700 mt-0.5">
                Full vörn gegn tvískráningu birgja (endirnýtir sömu auðkenni) og tekur aðeins ~15–30 sekúndur fyrir 400.000 línur.
              </div>
            </div>
          </div>
          <button
            onClick={() => setSourceMode('guide')}
            className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-lg text-xs shrink-0 transition flex items-center gap-1.5 cursor-pointer self-start sm:self-center"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Skoða PowerShell handbók & vörn</span>
          </button>
        </div>
      )}

      {/* Mode 3: Complete Guide View (PowerShell & Supplier Deduplication Architecture) */}
      {sourceMode === 'guide' && (
        <div className="space-y-6">
          {/* Hero Banner */}
          <div className="bg-gradient-to-br from-neutral-900 via-neutral-900 to-emerald-950 text-white p-6 rounded-2xl border border-neutral-800 shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>PowerShell & Gagnainnlestur</span>
                </div>
                <h3 className="text-xl font-black tracking-tight text-white">
                  Hvernig á að hlaða inn nýjum mánuðum frá opnirreikningar.is
                </h3>
                <p className="text-xs text-neutral-300 max-w-2xl leading-relaxed">
                  Þegar opnirreikningar.is gefa út nýja mánuði (t.d. <code>2026-5.xlsx</code>) er einfaldast og hraðvirkast að nota PowerShell í tölvunni þinni. Skriftan sér sjálfkrafa um að tengja reikninga við rétta birgja og stofnanir án þess að búa til tvítekningar.
                </p>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <button
                  onClick={() => copyToClipboard('npx tsx scripts/import_excel_to_postgres.ts "data/opnir_reikingar/2026-5.xlsx"', 'guide_quick')}
                  className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {copiedKey === 'guide_quick' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedKey === 'guide_quick' ? 'Afritað!' : 'Afrita dæmaskipun'}</span>
                </button>
                <div className="text-[10px] text-neutral-400 font-mono text-center">
                  Tekur ~15-30 sek á 400.000 línur
                </div>
              </div>
            </div>
          </div>

          {/* Step-by-Step PowerShell Guide */}
          <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-xs space-y-6">
            <div className="flex items-center gap-2.5 border-b border-neutral-100 pb-3">
              <Zap className="w-5 h-5 text-amber-500" />
              <h4 className="text-sm font-black uppercase text-neutral-900 tracking-tight">
                Skref fyrir skref: Innlestur á nýjum mánuði í PowerShell
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Step 1 */}
              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-neutral-900">
                  <span className="w-6 h-6 rounded-full bg-neutral-900 text-white flex items-center justify-center text-[11px] font-mono">1</span>
                  <span>Sækja Excel skrá af opnirreikningar.is</span>
                </div>
                <p className="text-xs text-neutral-600 pl-8 leading-relaxed">
                  Farðu á vef Fjársýslunnar / opnirreikningar.is og sæktu nýjasta mánuðinn sem Excel-skrá (t.d. <code>2026-5.xlsx</code> eða <code>2026-05.xlsx</code>).
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-neutral-900">
                  <span className="w-6 h-6 rounded-full bg-neutral-900 text-white flex items-center justify-center text-[11px] font-mono">2</span>
                  <span>Vista skrána í gagnamöppu verkefnisins</span>
                </div>
                <p className="text-xs text-neutral-600 pl-8 leading-relaxed">
                  Settu skrána í möppuna <code>data/opnir_reikingar/</code> (eða hvar sem þú geymir Excel-skrárnar þínar, t.d. á D:\ drifinu).
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-neutral-900">
                  <span className="w-6 h-6 rounded-full bg-neutral-900 text-white flex items-center justify-center text-[11px] font-mono">3</span>
                  <span>Opna PowerShell í rót verkefnisins</span>
                </div>
                <p className="text-xs text-neutral-600 pl-8 leading-relaxed">
                  Opnaðu PowerShell (t.d. í VS Code eða Windows Terminal) og vertu viss um að vera í möppu verkefnisins (þar sem <code>package.json</code> er).
                </p>
              </div>

              {/* Step 4 */}
              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-neutral-900">
                  <span className="w-6 h-6 rounded-full bg-neutral-900 text-white flex items-center justify-center text-[11px] font-mono">4</span>
                  <span>Prufukeyrsla án breytinga (--dry-run)</span>
                </div>
                <p className="text-xs text-neutral-600 pl-8 leading-relaxed">
                  Valfrjálst en mjög öruggt: Keyrðu prufukeyrslu til að ganga úr skugga um að skráin lesist rétt og allir dálkar greinist án þess að snerta gagnagrunninn.
                </p>
              </div>
            </div>

            {/* PowerShell Commands Box */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs font-bold text-neutral-700">
                <span>PowerShell skipanir til að afrita og keyra:</span>
              </div>

              {/* Command 1: Single file Dry run */}
              <div className="p-3.5 bg-neutral-900 text-neutral-200 rounded-xl space-y-1.5 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-amber-400 font-sans font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Prufukeyrsla á einum mánuði (Dry run - engin skrif í gagnagrunn):
                  </span>
                  <button
                    onClick={() => copyToClipboard('npx tsx scripts/import_excel_to_postgres.ts "data/opnir_reikingar/2026-5.xlsx" --dry-run', 'dry_run_btn')}
                    className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-[11px] font-sans font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'dry_run_btn' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'dry_run_btn' ? 'Afritað!' : 'Afrita'}</span>
                  </button>
                </div>
                <div className="bg-neutral-950 p-2.5 rounded text-amber-300 overflow-x-auto select-all">
                  npx tsx scripts/import_excel_to_postgres.ts "data/opnir_reikingar/2026-5.xlsx" --dry-run
                </div>
              </div>

              {/* Command 2: Single file Real import */}
              <div className="p-3.5 bg-neutral-900 text-neutral-200 rounded-xl space-y-1.5 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-emerald-400 font-sans font-bold flex items-center gap-1.5">
                    <Play className="w-3.5 h-3.5" />
                    Rauninnlestur á einum nýjum mánuði (skrifar beint í PostgreSQL):
                  </span>
                  <button
                    onClick={() => copyToClipboard('npx tsx scripts/import_excel_to_postgres.ts "data/opnir_reikingar/2026-5.xlsx"', 'single_btn')}
                    className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-[11px] font-sans font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'single_btn' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'single_btn' ? 'Afritað!' : 'Afrita'}</span>
                  </button>
                </div>
                <div className="bg-neutral-950 p-2.5 rounded text-emerald-400 overflow-x-auto select-all">
                  npx tsx scripts/import_excel_to_postgres.ts "data/opnir_reikingar/2026-5.xlsx"
                </div>
              </div>

              {/* Command 3: Full folder import */}
              <div className="p-3.5 bg-neutral-900 text-neutral-200 rounded-xl space-y-1.5 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-sky-400 font-sans font-bold flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    Hópinnlestur: Lesa inn allar nýjar skrár í heilli möppu samtímis:
                  </span>
                  <button
                    onClick={() => copyToClipboard('npx tsx scripts/import_excel_to_postgres.ts data/opnir_reikingar/', 'folder_btn')}
                    className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-[11px] font-sans font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'folder_btn' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'folder_btn' ? 'Afritað!' : 'Afrita'}</span>
                  </button>
                </div>
                <div className="bg-neutral-950 p-2.5 rounded text-sky-300 overflow-x-auto select-all">
                  npx tsx scripts/import_excel_to_postgres.ts data/opnir_reikingar/
                </div>
                <div className="text-[10px] text-neutral-400 font-sans pt-1">
                  Skriftan fer í gegnum allar .xlsx skrár í möppunni í réttri tímaröð og birtir samantekt fyrir hverja skrá.
                </div>
              </div>
            </div>
          </div>

          {/* Supplier Deduplication Architecture Card */}
          <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 border-b border-neutral-100 pb-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <div>
                <h4 className="text-sm font-black uppercase text-neutral-900 tracking-tight">
                  Vörn gegn tvískráningu birgja og stofnana (Hvernig forritið tryggir gæði)
                </h4>
                <p className="text-xs text-neutral-500">
                  Hvernig kerfið tryggir að sami birgir (t.d. Marel hf.) sé ekki margskráður milli mánaða
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/80 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs text-emerald-950">
                  <Database className="w-4 h-4 text-emerald-700" />
                  <span>1. Uppflettitafla í minni (Lookup Cache)</span>
                </div>
                <p className="text-xs text-neutral-700 leading-relaxed">
                  Áður en farið er yfir línurnar hleður forritið öllum birgjum og stofnunum sem þegar eru til í PostgreSQL í hraðvirka minnistöflu (<code>Map</code>).
                </p>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/80 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs text-emerald-950">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>2. Samræming óháð stafsetningu og bilum</span>
                </div>
                <p className="text-xs text-neutral-700 leading-relaxed">
                  Birgjanafn er sjálfkrafa hreinsað (<code>TRIM</code>), breytt í lágstafi (<code>LOWER</code>) og borið saman við kennitölu (<code>kt</code>). Ef birgirinn finnst er hans <code>id</code> endurnýtt án þess að búa til nýja færslu.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/80 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs text-emerald-950">
                  <Sparkles className="w-4 h-4 text-emerald-700" />
                  <span>3. Tafarlaus skráning nýrra aðila</span>
                </div>
                <p className="text-xs text-neutral-700 leading-relaxed">
                  Ef alveg nýr birgir birtist er hann skráður einu sinni og nýja <code>id</code>-inu er samstundis bætt í minnistöfluna. Allar næstu línur í skjalinu nota sama <code>id</code>.
                </p>
              </div>
            </div>

            {/* SQL Verification Queries */}
            <div className="mt-4 pt-4 border-t border-neutral-100 space-y-3">
              <div className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                <Code className="w-4 h-4 text-neutral-700" />
                <span>Gagnlegt eftirlit í pgAdmin eða psql:</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Query 1: Verify deduplication */}
                <div className="bg-neutral-900 p-3.5 rounded-xl text-neutral-200 font-mono text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-400 font-bold font-sans text-[11px]">
                      Kanna hvort einhver birgir sé tvískráður:
                    </span>
                    <button
                      onClick={() => copyToClipboard(`SELECT LOWER(TRIM(nafn)) AS birgir_nafn, COUNT(*) AS fjoldi\nFROM birgjar\nGROUP BY LOWER(TRIM(nafn))\nHAVING COUNT(*) > 1;`, 'sql_verify')}
                      className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-[10px] font-sans font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'sql_verify' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'sql_verify' ? 'Afritað!' : 'Afrita SQL'}</span>
                    </button>
                  </div>
                  <pre className="text-[11px] text-neutral-300 overflow-x-auto bg-neutral-950 p-2.5 rounded border border-neutral-800 select-all leading-relaxed">
{`SELECT LOWER(TRIM(nafn)) AS birgir_nafn, COUNT(*) AS fjoldi
FROM birgjar
GROUP BY LOWER(TRIM(nafn))
HAVING COUNT(*) > 1;`}
                  </pre>
                  <div className="text-[10px] text-neutral-400 font-sans">
                    Skilar 0 röðum ef allir birgjar eru einstakir og engin tvískráning til staðar.
                  </div>
                </div>

                {/* Query 2: Optional Unique Index */}
                <div className="bg-neutral-900 p-3.5 rounded-xl text-neutral-200 font-mono text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sky-400 font-bold font-sans text-[11px]">
                      Valfrjáls kerfisvörn (PostgreSQL Unique Index):
                    </span>
                    <button
                      onClick={() => copyToClipboard(`CREATE UNIQUE INDEX IF NOT EXISTS birgjar_nafn_unique_idx ON birgjar (LOWER(TRIM(nafn)));`, 'sql_idx')}
                      className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-[10px] font-sans font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'sql_idx' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'sql_idx' ? 'Afritað!' : 'Afrita SQL'}</span>
                    </button>
                  </div>
                  <pre className="text-[11px] text-neutral-300 overflow-x-auto bg-neutral-950 p-2.5 rounded border border-neutral-800 select-all leading-relaxed">
{`CREATE UNIQUE INDEX IF NOT EXISTS birgjar_nafn_unique_idx 
ON birgjar (LOWER(TRIM(nafn)));`}
                  </pre>
                  <div className="text-[10px] text-neutral-400 font-sans">
                    Gerir það ómögulegt fyrir PostgreSQL að taka við tvískráðu nafni í framtíðinni.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Format changes note */}
          <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs flex items-start gap-3">
            <Info className="w-5 h-5 text-neutral-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h5 className="text-xs font-bold text-neutral-900 uppercase">
                Hvað ef opnirreikningar.is breyta uppsetningu skráa í framtíðinni?
              </h5>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Skriftan <code>scripts/import_excel_to_postgres.ts</code> notar sjálfvirka dálkaleit (fuzzy column matching) sem þekkir bæði gömul og ný dálkaheiti (t.d. <code>stofnun</code>, <code>kaupandi</code>, <code>birgir</code>, <code>seljandi</code>, <code>kennitala</code>, <code>kt</code>, <code>dags</code>, <code>upphæð</code>). Ef ríkið bætir við nýjum dálkum eða breytir formi tekur aðeins örfáar mínútur að aðlaga dálkagreininguna í skriftunni.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* File Details & Detected Columns Banner */}
      {sourceMode !== 'guide' && fileName && (
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-3">
            <div className="flex items-center gap-2.5">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="text-sm font-black text-neutral-900 uppercase">
                  {fileName}
                </h3>
                <div className="text-[11px] text-neutral-500 flex items-center gap-2">
                  <span>{fileSizeMb} MB</span>
                  <span>•</span>
                  <span>Blað: <strong>{activeSheet}</strong> (af {sheetNames.length})</span>
                  <span>•</span>
                  <span>Samtals {allRows.length.toLocaleString('is-IS')} færslur greindar</span>
                </div>
              </div>
            </div>

            {/* Quick action buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => handleStartImport(true)}
                disabled={isImporting || allRows.length === 0}
                className="px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border border-neutral-300 cursor-pointer disabled:opacity-50"
                title="Athuga hvort allar línur passi án þess að breyta gagnagrunni"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-neutral-700" />
                <span>Prófun (Dry Run)</span>
              </button>

              <button
                onClick={() => handleStartImport(false)}
                disabled={isImporting || allRows.length === 0}
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                title="Skrifa allar línur í PostgreSQL töfluna reikningar"
              >
                <Play className="w-3.5 h-3.5 text-emerald-400" />
                <span>Hlaða inn í PostgreSQL ({allRows.length.toLocaleString('is-IS')})</span>
              </button>

              <button
                onClick={copyCliCommand}
                className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg text-xs font-bold transition flex items-center gap-1 border border-neutral-300 cursor-pointer"
                title="Afrita skipun til að keyra í PowerShell eða Terminal"
              >
                {copiedCli ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCli ? 'Afritað!' : 'CLI skipun'}</span>
              </button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
              <div className="text-[10px] font-bold text-neutral-500 uppercase flex items-center gap-1">
                <FileText className="w-3 h-3 text-neutral-400" /> Línufjöldi
              </div>
              <div className="text-base font-black text-neutral-900 mt-0.5">
                {stats.totalRows.toLocaleString('is-IS')}
              </div>
            </div>

            <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
              <div className="text-[10px] font-bold text-neutral-500 uppercase flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-neutral-400" /> Samtals Krónur
              </div>
              <div className="text-base font-black text-neutral-900 mt-0.5">
                {stats.totalAmount.toLocaleString('is-IS')} kr.
              </div>
            </div>

            <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
              <div className="text-[10px] font-bold text-neutral-500 uppercase flex items-center gap-1">
                <Calendar className="w-3 h-3 text-neutral-400" /> Tímabil
              </div>
              <div className="text-xs font-mono font-bold text-neutral-800 mt-1">
                {stats.minDate} <br /> {stats.maxDate}
              </div>
            </div>

            <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
              <div className="text-[10px] font-bold text-neutral-500 uppercase flex items-center gap-1">
                <Building2 className="w-3 h-3 text-neutral-400" /> Stofnanir
              </div>
              <div className="text-base font-black text-neutral-900 mt-0.5">
                {stats.uniqueStofnanir}
              </div>
            </div>

            <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
              <div className="text-[10px] font-bold text-neutral-500 uppercase flex items-center gap-1">
                <Store className="w-3 h-3 text-neutral-400" /> Birgjar
              </div>
              <div className="text-base font-black text-neutral-900 mt-0.5">
                {stats.uniqueBirgjar.toLocaleString('is-IS')}
              </div>
            </div>
          </div>

          {/* Column Mapping Selector Grid */}
          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-neutral-600" />
                <span>Greining dálka í skjalinu (Sjálfvirkt pörun):</span>
              </div>
              <button
                onClick={handleApplyMapping}
                className="text-[11px] text-neutral-800 hover:text-neutral-950 font-bold underline cursor-pointer"
              >
                Endurreikna með völdum dálkum
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 text-xs">
              <div>
                <label className="text-[10px] font-bold text-neutral-500 block mb-0.5">Dagsetning *</label>
                <select
                  value={colDags}
                  onChange={e => handleColumnChange('dags', e.target.value)}
                  className="w-full p-1.5 bg-white border border-neutral-300 rounded font-semibold text-xs"
                >
                  <option value="">-- Veldu dálk --</option>
                  {headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-neutral-500 block mb-0.5">Fjárhæð / Upphæð *</label>
                <select
                  value={colUpphaed}
                  onChange={e => handleColumnChange('upphaed', e.target.value)}
                  className="w-full p-1.5 bg-white border border-neutral-300 rounded font-semibold text-xs"
                >
                  <option value="">-- Veldu dálk --</option>
                  {headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-neutral-500 block mb-0.5">Kaupandi / Stofnun</label>
                <select
                  value={colStofnun}
                  onChange={e => handleColumnChange('stofnun', e.target.value)}
                  className="w-full p-1.5 bg-white border border-neutral-300 rounded font-semibold text-xs"
                >
                  <option value="">-- Veldu dálk --</option>
                  {headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-neutral-500 block mb-0.5">Birgir / Seljandi</label>
                <select
                  value={colBirgir}
                  onChange={e => handleColumnChange('birgir', e.target.value)}
                  className="w-full p-1.5 bg-white border border-neutral-300 rounded font-semibold text-xs"
                >
                  <option value="">-- Veldu dálk --</option>
                  {headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-neutral-500 block mb-0.5">Kennitala birgis</label>
                <select
                  value={colKt}
                  onChange={e => handleColumnChange('kt', e.target.value)}
                  className="w-full p-1.5 bg-white border border-neutral-300 rounded font-semibold text-xs"
                >
                  <option value="">-- Engin kennitala --</option>
                  {headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-neutral-500 block mb-0.5">Reikningsnr.</label>
                <select
                  value={colNumer}
                  onChange={e => handleColumnChange('numer', e.target.value)}
                  className="w-full p-1.5 bg-white border border-neutral-300 rounded font-semibold text-xs"
                >
                  <option value="">-- Ekkert nr --</option>
                  {headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-neutral-500 block mb-0.5">Tegund / Vörulýsing</label>
                <select
                  value={colTegund}
                  onChange={e => handleColumnChange('tegund', e.target.value)}
                  className="w-full p-1.5 bg-white border border-neutral-300 rounded font-semibold text-xs"
                >
                  <option value="">-- Sjálfgefið --</option>
                  {headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Bar & Status for Active Import */}
      {isImporting && (
        <div className="bg-white p-5 rounded-xl border border-neutral-900 shadow-md space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-neutral-900 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-neutral-900 animate-spin" />
              {importStatusText}
            </span>
            <span className="font-mono font-bold text-neutral-700">{importProgressPct}%</span>
          </div>

          <div className="w-full bg-neutral-100 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-neutral-900 h-full rounded-full transition-all duration-300"
              style={{ width: `${importProgressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Import Result Banner */}
      {importResult && (
        <div className={`p-4 rounded-xl border shadow-xs ${
          importResult.success ? 'bg-emerald-50 border-emerald-300 text-emerald-950' : 'bg-rose-50 border-rose-300 text-rose-950'
        }`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              {importResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <div>
                <h4 className="font-black text-sm">
                  {importResult.dryRun ? 'Prófun lokið (Dry Run)' : 'Innlestri í PostgreSQL lokið!'}
                </h4>
                <p className="text-xs mt-0.5 leading-relaxed">
                  {importResult.success ? (
                    <>
                      Skráðar voru <strong>{importResult.totalRows.toLocaleString('is-IS')}</strong> línur 
                      að heildarupphæð <strong>{importResult.totalAmount.toLocaleString('is-IS')} kr.</strong> 
                      {importResult.dryRun ? ' (Prufukeyrsla: Engu var breytt í raunverulegum gagnagrunni).' : ' inn í PostgreSQL töfluna reikningar.'} 
                      (Nýjar stofnanir: {importResult.newStofnanir}, Nýir birgjar: {importResult.newBirgjar}).
                    </>
                  ) : (
                    <>Villa: {importResult.error}</>
                  )}
                </p>
              </div>
            </div>

            <div className="text-[11px] font-mono text-neutral-500 shrink-0">
              {(importResult.durationMs / 1000).toFixed(1)}s
            </div>
          </div>
        </div>
      )}

      {/* Interactive Rows Preview Table (Skoða línur úr skjali) */}
      {allRows.length > 0 && (
        <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden space-y-0">
          {/* Table Header Controls */}
          <div className="p-4 bg-neutral-50 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-neutral-700" />
              <h3 className="text-xs font-black uppercase tracking-tight text-neutral-900">
                Skoða línur úr skjali ({filteredRows.length.toLocaleString('is-IS')} af {allRows.length.toLocaleString('is-IS')})
              </h3>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={tableSearch}
                  onChange={e => {
                    setTableSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Sía í línum skráar..."
                  className="pl-8 pr-3 py-1 bg-white border border-neutral-300 rounded text-xs outline-none focus:border-neutral-900 w-48 sm:w-56"
                />
              </div>

              <select
                value={pageSize}
                onChange={e => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="p-1 bg-white border border-neutral-300 rounded text-xs font-semibold"
              >
                <option value={25}>25 á síðu</option>
                <option value={50}>50 á síðu</option>
                <option value={100}>100 á síðu</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-neutral-100 text-neutral-700 font-bold uppercase text-[10px] sticky top-0 z-10 border-b border-neutral-200">
                <tr>
                  <th className="py-2.5 px-3 w-14">#</th>
                  <th 
                    onClick={() => {
                      if (sortField === 'dags') setSortAsc(!sortAsc);
                      else { setSortField('dags'); setSortAsc(false); }
                    }}
                    className="py-2.5 px-3 cursor-pointer hover:bg-neutral-200/70"
                  >
                    <div className="flex items-center gap-1">
                      <span>Dagsetning</span>
                      <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                    </div>
                  </th>
                  <th 
                    onClick={() => {
                      if (sortField === 'stofnun') setSortAsc(!sortAsc);
                      else { setSortField('stofnun'); setSortAsc(true); }
                    }}
                    className="py-2.5 px-3 cursor-pointer hover:bg-neutral-200/70"
                  >
                    <div className="flex items-center gap-1">
                      <span>Kaupandi (Stofnun)</span>
                      <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                    </div>
                  </th>
                  <th 
                    onClick={() => {
                      if (sortField === 'birgir') setSortAsc(!sortAsc);
                      else { setSortField('birgir'); setSortAsc(true); }
                    }}
                    className="py-2.5 px-3 cursor-pointer hover:bg-neutral-200/70"
                  >
                    <div className="flex items-center gap-1">
                      <span>Birgir / Seljandi</span>
                      <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                    </div>
                  </th>
                  <th className="py-2.5 px-3">Reikningsnr.</th>
                  <th className="py-2.5 px-3">Tegund / Lýsing</th>
                  <th 
                    onClick={() => {
                      if (sortField === 'upphaed') setSortAsc(!sortAsc);
                      else { setSortField('upphaed'); setSortAsc(false); }
                    }}
                    className="py-2.5 px-3 text-right cursor-pointer hover:bg-neutral-200/70"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Fjárhæð</span>
                      <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {pagedRows.map((r, idx) => {
                  const isNegative = r.upphaed < 0;
                  return (
                    <tr key={`${r.rowIndex}-${idx}`} className="hover:bg-neutral-50 transition">
                      <td className="py-2 px-3 text-neutral-400 font-mono text-[11px]">
                        {r.rowIndex}
                      </td>
                      <td className="py-2 px-3 font-mono text-[11px]">
                        <span className={r.hasValidDate ? 'text-neutral-900' : 'text-rose-600 font-bold'}>
                          {r.dags}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-medium text-neutral-900">
                        {r.stofnun}
                      </td>
                      <td className="py-2 px-3 text-neutral-800">
                        <div>{r.birgir}</div>
                        {r.kt && <span className="text-[10px] text-neutral-400 font-mono">kt. {r.kt}</span>}
                      </td>
                      <td className="py-2 px-3 font-mono text-[11px] text-neutral-600">
                        {r.numer || '-'}
                      </td>
                      <td className="py-2 px-3 text-neutral-600 truncate max-w-[200px]" title={r.tegund}>
                        {r.tegund}
                      </td>
                      <td className={`py-2 px-3 text-right font-mono font-bold ${
                        isNegative ? 'text-rose-700' : 'text-neutral-900'
                      }`}>
                        {r.upphaed.toLocaleString('is-IS')} kr.
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="p-3 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-600">
            <div>
              Sýni línur <strong>{((currentPage - 1) * pageSize) + 1}</strong> til <strong>{Math.min(currentPage * pageSize, sortedRows.length)}</strong> af <strong>{sortedRows.length.toLocaleString('is-IS')}</strong>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="p-1 rounded border border-neutral-300 hover:bg-neutral-200 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono text-xs px-2">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                disabled={currentPage >= totalPages}
                className="p-1 rounded border border-neutral-300 hover:bg-neutral-200 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CLI Documentation Guide Box (when not in full guide view) */}
      {sourceMode !== 'guide' && (
        <div className="p-5 bg-neutral-900 text-neutral-200 rounded-xl space-y-3 font-mono text-xs shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-neutral-800">
            <span className="text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-2 font-sans">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>Flýtiskipanir fyrir PowerShell (CLI innlestur)</span>
            </span>
            <button
              onClick={() => setSourceMode('guide')}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-neutral-950 rounded-lg text-xs font-sans font-bold transition flex items-center gap-1.5 cursor-pointer self-start sm:self-center"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Opna heildarhandbók & vörn birgja</span>
            </button>
          </div>

          {/* Quick Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 font-sans">
            <button
              onClick={() => setCliTab('single')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                cliTab === 'single' ? 'bg-neutral-800 text-emerald-400 border border-emerald-500/40' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Einn mánuður
            </button>
            <button
              onClick={() => setCliTab('dryrun')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                cliTab === 'dryrun' ? 'bg-neutral-800 text-amber-400 border border-amber-500/40' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Prufukeyrsla (--dry-run)
            </button>
            <button
              onClick={() => setCliTab('folder')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                cliTab === 'folder' ? 'bg-neutral-800 text-sky-400 border border-sky-500/40' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Heil mappa (Margar skrár)
            </button>
            <button
              onClick={() => setCliTab('sql')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                cliTab === 'sql' ? 'bg-neutral-800 text-purple-400 border border-purple-500/40' : 'text-neutral-400 hover:text-white'
              }`}
            >
              SQL Birgjaathugun
            </button>
          </div>

          {/* Tab 1: Single file */}
          {cliTab === 'single' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-neutral-400 text-[11px] font-sans">
                <span>Hlaða inn nýjum mánuði beint í PostgreSQL (samræmir birgja sjálfkrafa):</span>
                <button
                  onClick={() => copyToClipboard(`npx tsx scripts/import_excel_to_postgres.ts "${fileName || 'data/opnir_reikingar/2026-5.xlsx'}"`, 'bottom_single')}
                  className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-[11px] font-sans font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === 'bottom_single' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'bottom_single' ? 'Afritað!' : 'Afrita skipun'}</span>
                </button>
              </div>
              <div className="bg-neutral-950 p-2.5 rounded border border-neutral-800 text-emerald-400 select-all overflow-x-auto">
                npx tsx scripts/import_excel_to_postgres.ts "{fileName || 'data/opnir_reikingar/2026-5.xlsx'}"
              </div>
            </div>
          )}

          {/* Tab 2: Dry Run */}
          {cliTab === 'dryrun' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-neutral-400 text-[11px] font-sans">
                <span>Prufa lestur án þess að breyta gagnagrunninum:</span>
                <button
                  onClick={() => copyToClipboard(`npx tsx scripts/import_excel_to_postgres.ts "${fileName || 'data/opnir_reikingar/2026-5.xlsx'}" --dry-run`, 'bottom_dryrun')}
                  className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-[11px] font-sans font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === 'bottom_dryrun' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'bottom_dryrun' ? 'Afritað!' : 'Afrita skipun'}</span>
                </button>
              </div>
              <div className="bg-neutral-950 p-2.5 rounded border border-neutral-800 text-amber-300 select-all overflow-x-auto">
                npx tsx scripts/import_excel_to_postgres.ts "{fileName || 'data/opnir_reikingar/2026-5.xlsx'}" --dry-run
              </div>
            </div>
          )}

          {/* Tab 3: Folder */}
          {cliTab === 'folder' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-neutral-400 text-[11px] font-sans">
                <span>Lesa inn allar nýjar skrár í möppu (t.d. ef sóttir eru margir mánuðir samtímis):</span>
                <button
                  onClick={() => copyToClipboard('npx tsx scripts/import_excel_to_postgres.ts data/opnir_reikingar/', 'bottom_folder')}
                  className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-[11px] font-sans font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === 'bottom_folder' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'bottom_folder' ? 'Afritað!' : 'Afrita skipun'}</span>
                </button>
              </div>
              <div className="bg-neutral-950 p-2.5 rounded border border-neutral-800 text-sky-400 select-all overflow-x-auto">
                npx tsx scripts/import_excel_to_postgres.ts data/opnir_reikingar/
              </div>
            </div>
          )}

          {/* Tab 4: SQL verify */}
          {cliTab === 'sql' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-neutral-400 text-[11px] font-sans">
                <span>Staðfesta að enginn birgir sé tvískráður í PostgreSQL:</span>
                <button
                  onClick={() => copyToClipboard('SELECT LOWER(TRIM(nafn)) AS birgir_nafn, COUNT(*) AS fjoldi FROM birgjar GROUP BY LOWER(TRIM(nafn)) HAVING COUNT(*) > 1;', 'bottom_sql')}
                  className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-[11px] font-sans font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === 'bottom_sql' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'bottom_sql' ? 'Afritað!' : 'Afrita SQL'}</span>
                </button>
              </div>
              <div className="bg-neutral-950 p-2.5 rounded border border-neutral-800 text-purple-300 select-all overflow-x-auto font-mono text-[11px]">
                SELECT LOWER(TRIM(nafn)) AS birgir_nafn, COUNT(*) AS fjoldi FROM birgjar GROUP BY LOWER(TRIM(nafn)) HAVING COUNT(*) &gt; 1;
              </div>
            </div>
          )}

          <div className="text-[10px] text-neutral-500 font-sans flex items-center gap-1 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
            <span>Skriftan notar sjálfvirka dálkagreiningu, samræmir birgja og stofnanir sjálfkrafa og samstillir PostgreSQL sequence-raðir.</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExcelImportSubTab;
