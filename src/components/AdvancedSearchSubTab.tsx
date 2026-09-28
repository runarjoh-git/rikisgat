import React, { useState, useMemo, useEffect } from 'react';
import { 
  Building2, Search, ArrowUpDown, ChevronRight, ChevronDown, Plus, 
  Trash2, Copy, Check, Download, Calendar, Shield, ExternalLink, RefreshCw,
  AlertCircle, CheckCircle2, Zap, FileText, Sparkles, Filter, X, Database, 
  Hourglass, ShieldAlert, Mail, Store, Receipt, Landmark, Layers, ListFilter
} from 'lucide-react';
import { Stofnun, Invoice, SelectedInvoiceItem } from '../types';
import { getMonthlyPortalData, ISLENSKIR_MANUDIR } from '../data/mockData';
import { formaTolu, stuttTala, formaDags } from '../utils/icelandicFormatters';
import { 
  checkDbStatus, 
  fetchInstitutionsFromDb, 
  fetchInvoicesFromDb, 
  fetchInstitutionSuppliersFromDb,
  DbStatusResponse, 
  RealInvoiceRow 
} from '../services/api';

const ALL_YEARS_LIST = ['2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017'];
const ALL_MONTHS_NUMS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

interface SearchResultItem {
  client: string;
  invoiceCount: number;
  lineCount?: number;
  totalAmount: number;
  isInstitutionMatch: boolean;
  matchingInvoices: Invoice[];
}

interface AdvancedSearchSubTabProps {
  onOpenTasksTab?: () => void;
  onOpenWhistleblower?: (invoiceData?: { institution?: string; supplier?: string; invoiceNumber?: string }) => void;
}

export const AdvancedSearchSubTab: React.FC<AdvancedSearchSubTabProps> = ({
  onOpenWhistleblower
}) => {
  // Ítarleg leit í Gagnagreiningu: Sjálfgefið tómt ár og mánuður - leit hefst ekki fyrr en leitarskilyrði eru valin
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  // 3 Sérhæfðir leitardálkar:
  // 1. Stofnun (Kaupandi)
  // 2. Byrgir (Seljandi)
  // 3. Lína í reikningi (Bókhaldslykill / Tegund)
  const [searchClient, setSearchClient] = useState<string>('');
  const [searchSupplier, setSearchSupplier] = useState<string>('');
  const [searchLine, setSearchLine] = useState<string>('');

  // Sýn: Stofnana- og birgjasýn (stigveldi) eða Beinir reikningar (flatur reikningalisti)
  const [resultsViewMode, setResultsViewMode] = useState<'hierarchy' | 'flatInvoices'>('hierarchy');

  // Athugum hvort leitarskilyrði hafi verið slegin inn eða tímabil valið
  const hasSearchFilters = Boolean(searchClient.trim() || searchSupplier.trim() || searchLine.trim());
  const hasSearchCriteria = Boolean(hasSearchFilters || selectedYear || selectedMonth);

  // Sorting
  const [sortColumn, setSortColumn] = useState<'client' | 'invoiceCount' | 'totalAmount' | null>(null);
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  // PostgreSQL real-data state
  const [dbStatus, setDbStatus] = useState<DbStatusResponse | null>(null);
  const [dbInstitutions, setDbInstitutions] = useState<Array<{ id: number; client: string; invoiceCount: number; lineCount?: number; totalAmount: number }> | null>(null);
  const [dbSearchInstitutions, setDbSearchInstitutions] = useState<Array<{ id: number; client: string; invoiceCount: number; lineCount?: number; totalAmount: number }> | null>(null);
  const [dbSearchResults, setDbSearchResults] = useState<RealInvoiceRow[] | null>(null);

  // Expanded clients & local filters inside client drawers
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());
  const [clientFilterQueries, setClientFilterQueries] = useState<Record<string, string>>({});

  // Suppliers caching per institution: clientName -> Array<{ supplier, invoiceCount, lineCount, totalAmount }>
  const [dbSuppliersCache, setDbSuppliersCache] = useState<Record<string, Array<{ supplier: string; invoiceCount: number; lineCount?: number; totalAmount: number }>>>({});
  const [loadingSuppliersForClient, setLoadingSuppliersForClient] = useState<Record<string, boolean>>({});

  // Expanded suppliers & local filters inside supplier rows
  const [expandedSuppliers, setExpandedSuppliers] = useState<Set<string>>(new Set());
  const [supplierInvoiceFilters, setSupplierInvoiceFilters] = useState<Record<string, string>>({});

  // Invoices cache per supplier: `${clientName}:::${supplierName}` -> Invoice[]
  const [supplierInvoicesCache, setSupplierInvoicesCache] = useState<Record<string, Invoice[]>>({});
  const [supplierLoadingInvoices, setSupplierLoadingInvoices] = useState<Record<string, boolean>>({});
  const [supplierVisibleLimits, setSupplierVisibleLimits] = useState<Record<string, number>>({});

  // Selected invoices for Act 140/2012 petition
  const [selectedInvoices, setSelectedInvoices] = useState<SelectedInvoiceItem[]>([]);
  const [copiedLegalText, setCopiedLegalText] = useState(false);

  // Loading states
  const [isLoadingDb, setIsLoadingDb] = useState(false);
  const [isSearchingDb, setIsSearchingDb] = useState(false);

  // Check DB status on mount
  useEffect(() => {
    checkDbStatus().then(status => {
      setDbStatus(status);
    });
  }, []);

  // Visual flicker when changing filters
  useEffect(() => {
    setIsUpdating(true);
    const t = setTimeout(() => setIsUpdating(false), 120);
    return () => clearTimeout(t);
  }, [selectedYear, selectedMonth]);

  // Available year and month definitions
  const isAllYears = selectedYear === 'all' || selectedYear === '';
  const isAllMonths = selectedMonth === 'all' || selectedMonth === '';

  const activeYears = useMemo(() => {
    if (selectedYear && selectedYear !== 'all') return [selectedYear];
    return ALL_YEARS_LIST;
  }, [selectedYear]);

  const activeMonths = useMemo(() => {
    if (selectedMonth && selectedMonth !== 'all') return [selectedMonth];
    return ALL_MONTHS_NUMS;
  }, [selectedMonth]);

  // Aggregate monthly data for offline/mock fallback (only when search criteria are entered)
  const fallbackPortalData = useMemo(() => {
    if (!hasSearchCriteria || dbStatus?.connected) {
      return { stofnanir: [], getInvoicesForClient: () => [] };
    }

    const instMap = new Map<string, { id: number; client: string; invoiceCount: number; lineCount?: number; totalAmount: number }>();
    const invMap = new Map<string, Invoice[]>();

    for (const yr of activeYears) {
      for (const mo of activeMonths) {
        const d = getMonthlyPortalData(yr, mo);
        for (const st of d.stofnanir) {
          const current = instMap.get(st.client);
          if (!current) {
            instMap.set(st.client, {
              id: st.id,
              client: st.client,
              invoiceCount: st.invoiceCount,
              lineCount: st.invoiceCount,
              totalAmount: st.totalAmount
            });
          } else {
            current.invoiceCount += st.invoiceCount;
            if (current.lineCount !== undefined) current.lineCount += st.invoiceCount;
            current.totalAmount += st.totalAmount;
          }

          const invs = d.getInvoicesForClient(st.client, st.totalAmount);
          const existing = invMap.get(st.client) || [];
          if (existing.length < 60) {
            invMap.set(st.client, [...existing, ...invs.slice(0, 15)]);
          }
        }
      }
    }

    return {
      stofnanir: Array.from(instMap.values()),
      getInvoicesForClient: (clientName: string) => invMap.get(clientName) || []
    };
  }, [hasSearchCriteria, dbStatus?.connected, activeYears, activeMonths]);

  // Fetch base institutions from DB when year/month changes (and search inputs are empty and criteria are entered)
  useEffect(() => {
    if (!hasSearchCriteria) {
      setDbInstitutions(null);
      setIsLoadingDb(false);
      return;
    }

    if (dbStatus?.connected && !hasSearchFilters) {
      setIsLoadingDb(true);
      setDbSuppliersCache({});
      setExpandedSuppliers(new Set());
      setSupplierInvoicesCache({});
      setSupplierVisibleLimits({});
      fetchInstitutionsFromDb(selectedYear, selectedMonth).then(res => {
        if (res.rows && res.rows.length > 0) {
          setDbInstitutions(res.rows);
        } else {
          setDbInstitutions([]);
        }
      }).catch(() => {
        setDbInstitutions([]);
      }).finally(() => setIsLoadingDb(false));
    } else if (!dbStatus?.connected) {
      setDbInstitutions(null);
      setIsLoadingDb(false);
    }
  }, [selectedYear, selectedMonth, dbStatus?.connected, hasSearchFilters, hasSearchCriteria]);

  // Real-time debounced PostgreSQL search across the 3 specialized columns
  useEffect(() => {
    if (!hasSearchCriteria) {
      setIsSearchingDb(false);
      setDbSearchInstitutions(null);
      setDbSearchResults(null);
      return;
    }

    if (dbStatus?.connected && hasSearchFilters) {
      setIsSearchingDb(true);
      const timer = setTimeout(() => {
        const clientVal = searchClient.trim();
        const supplierVal = searchSupplier.trim();
        const lineVal = searchLine.trim();

        Promise.all([
          fetchInstitutionsFromDb(selectedYear, selectedMonth, undefined, {
            client: clientVal,
            supplier: supplierVal,
            line: lineVal
          }),
          fetchInvoicesFromDb({
            client: clientVal,
            supplier: supplierVal,
            line: lineVal,
            year: selectedYear,
            month: selectedMonth,
            limit: 200
          })
        ]).then(([instRes, invRes]) => {
          const instRows = instRes?.rows || [];
          const invRows = invRes?.rows || [];

          setDbSearchInstitutions(instRows);
          setDbSearchResults(invRows);

          // Ef fáar stofnanir finnast (t.d. 1–3), opnum við þær sjálfkrafa svo notandi sjái birgja og reikninga strax
          if (instRows.length > 0 && instRows.length <= 4) {
            const autoExp = new Set<string>();
            for (const st of instRows) {
              autoExp.add(st.client);
            }
            setExpandedClients(autoExp);
          }
        }).catch(() => {
          setDbSearchInstitutions([]);
          setDbSearchResults([]);
        }).finally(() => {
          setIsSearchingDb(false);
        });
      }, 250);
      return () => clearTimeout(timer);
    } else {
      setIsSearchingDb(false);
      setDbSearchInstitutions(null);
      setDbSearchResults(null);
    }
  }, [searchClient, searchSupplier, searchLine, dbStatus?.connected, selectedYear, selectedMonth, hasSearchCriteria, hasSearchFilters]);

  // Reset expanded drawers and filters when search or period changes
  useEffect(() => {
    setExpandedClients(new Set());
    setClientFilterQueries({});
    setExpandedSuppliers(new Set());
    setDbSuppliersCache({});
    setSupplierInvoicesCache({});
  }, [selectedYear, selectedMonth, searchClient, searchSupplier, searchLine]);

  // Fetch suppliers list from PostgreSQL for expanded clients, incorporating searchSupplier and searchLine
  const fetchSuppliersForClient = async (clientName: string) => {
    if (loadingSuppliersForClient[clientName]) return;
    setLoadingSuppliersForClient(prev => ({ ...prev, [clientName]: true }));
    try {
      const res = await fetchInstitutionSuppliersFromDb({
        client: clientName,
        year: selectedYear,
        month: selectedMonth,
        supplier: searchSupplier.trim(),
        line: searchLine.trim()
      });
      const suppliers = res.suppliers || [];
      setDbSuppliersCache(prev => ({ ...prev, [clientName]: suppliers }));

      // Ef leitað var að ákveðnum birgi eða aðeins 1 birgir fannst, opnum við hann sjálfkrafa
      if (searchSupplier.trim() || suppliers.length === 1) {
        const targetSup = searchSupplier.trim()
          ? suppliers.find(s => s.supplier.toLowerCase().includes(searchSupplier.trim().toLowerCase())) || suppliers[0]
          : suppliers[0];
        if (targetSup) {
          const supKey = `${clientName}:::${targetSup.supplier}`;
          setExpandedSuppliers(prev => new Set(prev).add(supKey));
          fetchInvoicesForSupplier(clientName, targetSup.supplier, 0, 25);
        }
      }
    } catch {
      setDbSuppliersCache(prev => ({ ...prev, [clientName]: [] }));
    } finally {
      setLoadingSuppliersForClient(prev => ({ ...prev, [clientName]: false }));
    }
  };

  // Pre-fetch suppliers for open clients
  useEffect(() => {
    if (dbStatus?.connected && expandedClients.size > 0) {
      for (const clientName of expandedClients) {
        if (dbSuppliersCache[clientName] === undefined && !loadingSuppliersForClient[clientName]) {
          fetchSuppliersForClient(clientName);
        }
      }
    }
  }, [expandedClients, dbStatus?.connected, selectedYear, selectedMonth, searchSupplier, searchLine]);

  // Toggle client drawer expansion
  const toggleClientExpand = (clientName: string) => {
    const willExpand = !expandedClients.has(clientName);
    setExpandedClients(prev => {
      const next = new Set(prev);
      if (next.has(clientName)) {
        next.delete(clientName);
      } else {
        next.add(clientName);
      }
      return next;
    });

    if (willExpand && dbStatus?.connected && dbSuppliersCache[clientName] === undefined && !loadingSuppliersForClient[clientName]) {
      fetchSuppliersForClient(clientName);
    }
  };

  // Toggle supplier accordion and fetch initial 25 invoices sorted by date ASC (frá byrjun mánaðar)
  const toggleSupplierExpand = (clientName: string, supplierName: string, totalCount?: number) => {
    const key = `${clientName}:::${supplierName}`;
    const willExpand = !expandedSuppliers.has(key);
    setExpandedSuppliers(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });

    if (willExpand) {
      if (!supplierInvoicesCache[key] || supplierInvoicesCache[key].length === 0) {
        fetchInvoicesForSupplier(clientName, supplierName, 0, 25);
      }
      if (!supplierVisibleLimits[key]) {
        setSupplierVisibleLimits(prevLim => ({ ...prevLim, [key]: 25 }));
      }
    }
  };

  // Fetch invoices for a supplier (25 at a time, sorted ASC from beginning of month, filtered by searchLine)
  const fetchInvoicesForSupplier = async (clientName: string, supplierName: string, offset: number = 0, limit: number = 25) => {
    const key = `${clientName}:::${supplierName}`;
    setSupplierLoadingInvoices(prev => ({ ...prev, [key]: true }));
    try {
      if (dbStatus?.connected) {
        const res = await fetchInvoicesFromDb({
          client: clientName,
          supplier: supplierName,
          line: searchLine.trim(),
          year: selectedYear,
          month: selectedMonth,
          limit,
          offset,
          sort: 'asc'
        });
        const newInvoices: Invoice[] = (res.rows || []).map(r => ({
          id: r.id,
          client: clientName,
          supplier: r.supplier || supplierName,
          amount: r.amount,
          date: formaDags(r.date, selectedYear),
          lines: (r.lines || []).map(l => ({
            description: l.description,
            amount: l.amount,
            is_kredit: l.is_kredit ?? (l.amount < 0)
          }))
        }));
        setSupplierInvoicesCache(prev => {
          const existing = offset > 0 ? (prev[key] || []) : [];
          if (offset === 0) {
            return {
              ...prev,
              [key]: newInvoices
            };
          }
          const nextInvoices = [...existing.slice(0, offset), ...newInvoices];
          return {
            ...prev,
            [key]: nextInvoices
          };
        });
        setSupplierVisibleLimits(prev => {
          const currentVis = prev[key] || 25;
          const newTotalLoaded = offset + newInvoices.length;
          return {
            ...prev,
            [key]: Math.max(currentVis, newTotalLoaded)
          };
        });
      } else {
        const clientInvoices = fallbackPortalData.getInvoicesForClient(clientName);
        const supplierInvs = clientInvoices
          .filter(inv => {
            const supMatch = inv.supplier.toLowerCase() === supplierName.toLowerCase();
            const lineMatch = !searchLine.trim() || 
              inv.id.toLowerCase().includes(searchLine.toLowerCase().trim()) ||
              inv.lines?.some(l => l.description.toLowerCase().includes(searchLine.toLowerCase().trim()));
            return supMatch && lineMatch;
          })
          .sort((a, b) => (a.date > b.date ? 1 : -1));
        setSupplierInvoicesCache(prev => ({
          ...prev,
          [key]: supplierInvs
        }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSupplierLoadingInvoices(prev => ({ ...prev, [key]: false }));
    }
  };

  // Load next 25 invoices for a supplier
  const handleLoadMoreForSupplier = (clientName: string, supplierName: string, totalCount: number) => {
    const key = `${clientName}:::${supplierName}`;
    if (supplierLoadingInvoices[key]) return;

    const currentLimit = supplierVisibleLimits[key] || 25;
    const currentInvoices = supplierInvoicesCache[key] || [];
    const nextLimit = Math.min(currentLimit + 25, totalCount);

    if (dbStatus?.connected && currentInvoices.length < totalCount && currentInvoices.length < nextLimit) {
      fetchInvoicesForSupplier(clientName, supplierName, currentInvoices.length, 25);
    } else {
      setSupplierVisibleLimits(prev => ({ ...prev, [key]: nextLimit }));
    }
  };

  // Explicit manual search trigger (Enter key or Leita button)
  const handleExecuteSearch = async () => {
    if (!hasSearchCriteria || !dbStatus?.connected) return;
    setIsSearchingDb(true);
    try {
      if (hasSearchFilters) {
        const clientVal = searchClient.trim();
        const supplierVal = searchSupplier.trim();
        const lineVal = searchLine.trim();

        const [instRes, invRes] = await Promise.all([
          fetchInstitutionsFromDb(selectedYear, selectedMonth, undefined, {
            client: clientVal,
            supplier: supplierVal,
            line: lineVal
          }),
          fetchInvoicesFromDb({
            client: clientVal,
            supplier: supplierVal,
            line: lineVal,
            year: selectedYear,
            month: selectedMonth,
            limit: 200
          })
        ]);
        const instRows = instRes?.rows || [];
        setDbSearchInstitutions(instRows);
        setDbSearchResults(invRes?.rows || []);

        if (instRows.length > 0 && instRows.length <= 4) {
          const autoExp = new Set<string>();
          for (const st of instRows) {
            autoExp.add(st.client);
          }
          setExpandedClients(autoExp);
        }
      } else {
        setDbSearchInstitutions(null);
        setDbSearchResults(null);
        const instRes = await fetchInstitutionsFromDb(selectedYear, selectedMonth);
        setDbInstitutions(instRes?.rows || []);
      }
    } catch (err) {
      console.error('Villa við leit:', err);
    } finally {
      setIsSearchingDb(false);
    }
  };

  // Sort handler
  const handleSort = (column: 'client' | 'invoiceCount' | 'totalAmount') => {
    if (sortColumn === column) {
      setSortAsc(!sortAsc);
    } else {
      setSortColumn(column);
      setSortAsc(column === 'client');
    }
  };

  // Filtered and sorted clients list (Reconciliation and display logic)
  const filteredClients = useMemo<SearchResultItem[]>(() => {
    if (!hasSearchCriteria) {
      return [];
    }

    const clientQuery = searchClient.toLowerCase().trim();
    const supplierQuery = searchSupplier.toLowerCase().trim();
    const lineQuery = searchLine.toLowerCase().trim();

    const baseStofnanir = dbStatus?.connected
      ? (dbInstitutions ?? [])
      : fallbackPortalData.stofnanir;

    // 1. Ef leitað er í raunverulegum PostgreSQL gagnagrunni með leitarsíum
    if (dbStatus?.connected && hasSearchFilters && dbSearchInstitutions !== null) {
      const results: SearchResultItem[] = dbSearchInstitutions.map(st => {
        const matchingSampleInvoices = (dbSearchResults || []).filter(
          inv => (inv.client || '').toLowerCase() === st.client.toLowerCase()
        ).map(inv => ({
          id: inv.id,
          client: inv.client || st.client,
          supplier: inv.supplier,
          amount: inv.amount,
          date: formaDags(inv.date, selectedYear),
          lines: (inv.lines || []).map(l => ({
            description: l.description,
            amount: l.amount,
            is_kredit: l.is_kredit ?? (l.amount < 0)
          }))
        }));

        return {
          client: st.client,
          invoiceCount: st.invoiceCount,
          lineCount: st.lineCount || st.invoiceCount,
          totalAmount: st.totalAmount,
          isInstitutionMatch: clientQuery ? st.client.toLowerCase().includes(clientQuery) : true,
          matchingInvoices: matchingSampleInvoices
        };
      });

      if (sortColumn) {
        results.sort((a, b) => {
          if (sortColumn === 'client') {
            return sortAsc ? a.client.localeCompare(b.client, 'is') : b.client.localeCompare(a.client, 'is');
          } else {
            const valA = a[sortColumn];
            const valB = b[sortColumn];
            return sortAsc ? valA - valB : valB - valA;
          }
        });
      } else {
        results.sort((a, b) => b.totalAmount - a.totalAmount);
      }

      return results;
    }

    if (!hasSearchFilters) {
      let list: SearchResultItem[] = baseStofnanir.map(c => ({
        client: c.client,
        invoiceCount: c.invoiceCount,
        lineCount: 'lineCount' in c ? (c.lineCount || c.invoiceCount) : c.invoiceCount,
        totalAmount: c.totalAmount,
        isInstitutionMatch: false,
        matchingInvoices: []
      }));

      if (sortColumn) {
        list.sort((a, b) => {
          if (sortColumn === 'client') {
            return sortAsc ? a.client.localeCompare(b.client, 'is') : b.client.localeCompare(a.client, 'is');
          } else {
            const valA = a[sortColumn];
            const valB = b[sortColumn];
            return sortAsc ? valA - valB : valB - valA;
          }
        });
      } else {
        list.sort((a, b) => b.totalAmount - a.totalAmount);
      }

      return list;
    }

    // Mock fallback when offline
    const results: SearchResultItem[] = [];
    for (const c of baseStofnanir) {
      const isClientMatch = !clientQuery || c.client.toLowerCase().includes(clientQuery);
      if (!isClientMatch && clientQuery) continue;

      const allInvoices = fallbackPortalData.getInvoicesForClient(c.client);
      const matchedInvoices = allInvoices.filter(inv => {
        const matchSup = !supplierQuery || inv.supplier.toLowerCase().includes(supplierQuery);
        const matchLine = !lineQuery || 
          inv.id.toLowerCase().includes(lineQuery) ||
          inv.lines?.some(l => l.description.toLowerCase().includes(lineQuery));
        return matchSup && matchLine;
      });

      if (!hasSearchFilters || matchedInvoices.length > 0) {
        const matchedAmount = matchedInvoices.length > 0
          ? matchedInvoices.reduce((sum, inv) => sum + inv.amount, 0)
          : c.totalAmount;
        results.push({
          client: c.client,
          invoiceCount: matchedInvoices.length > 0 ? new Set(matchedInvoices.map(i => i.id)).size : c.invoiceCount,
          lineCount: matchedInvoices.length > 0 ? matchedInvoices.length : ('lineCount' in c ? (c.lineCount || c.invoiceCount) : c.invoiceCount),
          totalAmount: matchedAmount,
          isInstitutionMatch: isClientMatch,
          matchingInvoices: matchedInvoices,
        });
      }
    }

    if (sortColumn) {
      results.sort((a, b) => {
        if (sortColumn === 'client') {
          return sortAsc ? a.client.localeCompare(b.client, 'is') : b.client.localeCompare(a.client, 'is');
        } else {
          const valA = a[sortColumn];
          const valB = b[sortColumn];
          return sortAsc ? valA - valB : valB - valA;
        }
      });
    }

    return results;
  }, [hasSearchCriteria, hasSearchFilters, searchClient, searchSupplier, searchLine, sortColumn, sortAsc, dbStatus?.connected, dbInstitutions, dbSearchInstitutions, dbSearchResults, fallbackPortalData, selectedYear]);

  // Aggregate metrics
  const totalAmount = useMemo(() => {
    return filteredClients.reduce((acc, c) => acc + c.totalAmount, 0);
  }, [filteredClients]);

  const totalInvoices = useMemo(() => {
    return filteredClients.reduce((acc, c) => acc + c.invoiceCount, 0);
  }, [filteredClients]);

  const isDataLoading = Boolean(isLoadingDb || isSearchingDb || isUpdating);

  // Act 140/2012 add invoice
  const handleAddInvoiceToRequest = (inv: Invoice, firstDesc: string) => {
    if (selectedInvoices.length >= 5) {
      alert('Hámark 5 reikningar í einni beiðni skv. verklagsreglum.');
      return;
    }
    if (selectedInvoices.some(i => i.reikningsnr === inv.id)) {
      return;
    }
    const newItem: SelectedInvoiceItem = {
      reikningsnr: inv.id,
      client: inv.client,
      supplier: inv.supplier,
      amount: inv.amount,
      dags: inv.date,
      lysing: firstDesc || 'Almennur rekstur'
    };
    setSelectedInvoices(prev => [...prev, newItem]);
  };

  const handleRemoveInvoiceFromRequest = (reikningsnr: string) => {
    setSelectedInvoices(prev => prev.filter(i => i.reikningsnr !== reikningsnr));
  };

  const copyLegalText = () => {
    if (selectedInvoices.length === 0) return;
    const invList = selectedInvoices.map((inv, idx) => 
      `${idx + 1}. Reikningsnúmer: ${inv.reikningsnr} | Birgir: ${inv.supplier} | Stofnun: ${inv.client} | Dags: ${inv.dags} | Upphæð: ${formaTolu(inv.amount)} kr.`
    ).join('\n');

    const text = `Efni: Upplýsingabeiðni á grundvelli upplýsingalaga nr. 140/2012

Til viðkomandi stjórnvalds,

Hér með er óskað eftir afriti af eftirfarandi bókuðum reikningum og öllum fylgigögnum þeirra (t.d. sundurliðunum, verksamningum og tímaskýrslum) á grundvelli upplýsingalaga nr. 140/2012:

${invList}

Óskað er eftir því að gögnin verði afhent rafrænt á þetta netfang svo fljótt sem auðið er, sbr. 17. gr. upplýsingalaga.

Með kveðju,
[Nafn sendanda / Ríkisgát aðgangur]`;

    navigator.clipboard.writeText(text);
    setCopiedLegalText(true);
    setTimeout(() => setCopiedLegalText(false), 2500);
  };

  const emailMailtoUrl = useMemo(() => {
    if (selectedInvoices.length === 0) return '#';
    const invList = selectedInvoices.map((inv, idx) => 
      `${idx + 1}. Reikningsnr: ${inv.reikningsnr} | Birgir: ${inv.supplier} | Stofnun: ${inv.client} | Upphæð: ${formaTolu(inv.amount)} kr.`
    ).join('%0D%0A');

    const subject = encodeURIComponent(`Upplýsingabeiðni skv. upplýsingalögum 140/2012 - ${selectedInvoices[0]?.client || 'Ríkisstofnun'}`);
    const body = `Efni: Upplýsingabeiðni á grundvelli upplýsingalaga nr. 140/2012%0D%0A%0D%0AHér með er óskað eftir afriti af eftirfarandi reikningum:%0D%0A${invList}%0D%0A%0D%0AÓskað er eftir rafrænni afhendingu gagna svo fljótt sem auðið er.`;

    return `mailto:postur@stjornarradid.is?subject=${subject}&body=${body}`;
  }, [selectedInvoices]);

  // CSV Export handler
  const handleExportCSV = () => {
    if (resultsViewMode === 'flatInvoices' && dbSearchResults && dbSearchResults.length > 0) {
      // Flytja út staka reikninga
      const headers = ['Dags', 'Stofnun', 'Birgir', 'Reikningsnr', 'Upphaed_ISK', 'Lina_Tegund'];
      const rows = dbSearchResults.map(inv => [
        `"${formaDags(inv.date, selectedYear)}"`,
        `"${(inv.client || '').replace(/"/g, '""')}"`,
        `"${(inv.supplier || '').replace(/"/g, '""')}"`,
        `"${(inv.numer || inv.id || '').replace(/"/g, '""')}"`,
        inv.amount,
        `"${(inv.description || '').replace(/"/g, '""')}"`
      ]);
      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `rikisgat-reikningar-${selectedYear || 'oll-ar'}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    const headers = ['Kaupandi', 'Fjoldi_reikninga', 'Heildarupphaed_ISK', 'Ar', 'Manudur'];
    const rows = filteredClients.map(c => [
      `"${c.client.replace(/"/g, '""')}"`,
      c.invoiceCount,
      c.totalAmount,
      isAllYears ? 'Oll_ar' : selectedYear,
      isAllMonths ? 'Allir_manudir' : selectedMonth
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const yearPart = isAllYears ? 'oll-ar' : selectedYear;
    const monthPart = isAllMonths ? 'allir-manudir' : `m${selectedMonth}`;
    link.setAttribute('download', `rikisgat-itarleg-leit-${yearPart}-${monthPart}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Keyword highlighter helper
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return <span>{text}</span>;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="bg-amber-200 text-amber-950 font-bold px-1 rounded">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  // Active filter description summary
  const activeSearchSummary = useMemo(() => {
    const parts: string[] = [];
    if (searchClient.trim()) parts.push(`🏛️ Stofnun: „${searchClient.trim()}“`);
    if (searchSupplier.trim()) parts.push(`🏢 Byrgir: „${searchSupplier.trim()}“`);
    if (searchLine.trim()) parts.push(`🧾 Lína: „${searchLine.trim()}“`);
    return parts.join(' + ');
  }, [searchClient, searchSupplier, searchLine]);

  return (
    <div className="space-y-6">
      {/* Search Header / Filter Controls */}
      <section className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 pb-3">
          <div>
            <h2 className="text-base font-black text-neutral-900 flex items-center gap-2">
              <Search className="w-5 h-5 text-neutral-800" />
              <span>Sérhæfð Leit í Gagnagreiningu</span>
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Leitaðu samtímis eða stakt eftir <strong>Stofnun</strong>, <strong>Byrgja</strong> og <strong>Línu á reikningi</strong> (bókhaldslykli).
            </p>
          </div>

          {/* Database indicator badge */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {dbStatus?.connected ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                PostgreSQL rauntenging virk (18,17M)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-neutral-100 text-neutral-600 border border-neutral-300">
                <Database className="w-3 h-3 text-neutral-500" />
                Staðbundið sniðmát
              </span>
            )}
          </div>
        </div>

        {/* Tímabil og Leitaraðgerðir (Ár, Mánuður og Aðgerðahnappar) */}
        <div className="flex flex-wrap items-end gap-3">
          {/* Ár selector */}
          <div className="flex flex-col gap-1 w-36">
            <label htmlFor="advYearSelect" className="text-[11px] font-black uppercase text-neutral-700 tracking-wider">
              Ár:
            </label>
            <div className="relative">
              <select
                id="advYearSelect"
                value={selectedYear}
                onChange={e => setSelectedYear(e.target.value)}
                className="w-full appearance-none bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 pr-8 text-xs font-bold text-neutral-900 focus:border-neutral-900 focus:outline-hidden cursor-pointer shadow-2xs"
              >
                <option value="">-- Veldu ár --</option>
                <option value="all">🌟 Öll ár (2017–2026)</option>
                {ALL_YEARS_LIST.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-neutral-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Mánuður selector */}
          <div className="flex flex-col gap-1 w-44">
            <label htmlFor="advMonthSelect" className="text-[11px] font-black uppercase text-neutral-700 tracking-wider">
              Mánuður:
            </label>
            <div className="relative">
              <select
                id="advMonthSelect"
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="w-full appearance-none bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 pr-8 text-xs font-bold text-neutral-900 focus:border-neutral-900 focus:outline-hidden cursor-pointer shadow-2xs"
              >
                <option value="">-- Veldu mánuð --</option>
                <option value="all">🌟 Allir mánuðir (1–12)</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={String(m)}>
                    {m}. {ISLENSKIR_MANUDIR[m]}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-neutral-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Aðgerðahnappar */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={handleExecuteSearch}
              disabled={isDataLoading || !hasSearchCriteria}
              className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
              title={hasSearchCriteria ? 'Keyra leit á völdum skilyrðum' : 'Veldu ár/mánuð eða sláðu inn leitarskilyrði til að leita'}
            >
              {isDataLoading ? (
                <>
                  <Hourglass className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  <span>Sæki...</span>
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Leita í gagnagrunni</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              disabled={filteredClients.length === 0}
              className="px-3.5 py-2 bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-40"
              title="Flytja út niðurstöður á CSV sniði"
            >
              <Download className="w-3.5 h-3.5 text-neutral-700" />
              <span>Sækja CSV</span>
            </button>

            {hasSearchCriteria && (
              <button
                type="button"
                onClick={() => {
                  setSelectedYear('');
                  setSelectedMonth('');
                  setSearchClient('');
                  setSearchSupplier('');
                  setSearchLine('');
                  setDbInstitutions(null);
                  setDbSearchInstitutions(null);
                  setDbSearchResults(null);
                  setExpandedClients(new Set());
                  setExpandedSuppliers(new Set());
                }}
                className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Hreinsa öll leitarskilyrði og tæma leitarglugga"
              >
                <X className="w-3.5 h-3.5 text-neutral-600" />
                <span>Hreinsa allt</span>
              </button>
            )}
          </div>
        </div>

        {/* 3 Sérhæfðir Leitardálkar (Stofnun, Byrgir, Línu í reikning) */}
        <div className="pt-2 border-t border-neutral-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Dálkur 1: Stofnun */}
            <div className="flex flex-col gap-1">
              <label htmlFor="searchClientField" className="text-[11px] font-black uppercase text-neutral-800 tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>1. Stofnun (Kaupandi)</span>
                </span>
                {searchClient && (
                  <span className="text-blue-700 font-bold lowercase text-[10px]">
                    Sía virk
                  </span>
                )}
              </label>
              <div className="relative flex items-center">
                <Building2 className="w-4 h-4 text-neutral-400 absolute left-3 pointer-events-none" />
                <input
                  id="searchClientField"
                  type="text"
                  value={searchClient}
                  onChange={e => setSearchClient(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleExecuteSearch();
                  }}
                  placeholder="Dæmi: Utanríkisráðuneyti, Landspítali..."
                  className="w-full pl-9 pr-8 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-xs font-semibold focus:border-neutral-900 focus:bg-white focus:outline-hidden transition shadow-2xs"
                />
                {searchClient && (
                  <button
                    type="button"
                    onClick={() => setSearchClient('')}
                    className="absolute right-2.5 text-neutral-400 hover:text-neutral-700 p-0.5 cursor-pointer"
                    title="Hreinsa stofnun"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <span className="text-[10px] text-neutral-500">
                Sía aðeins eftir kaupanda / ríkisaðila
              </span>
            </div>

            {/* Dálkur 2: Byrgir */}
            <div className="flex flex-col gap-1">
              <label htmlFor="searchSupplierField" className="text-[11px] font-black uppercase text-neutral-800 tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-emerald-600" />
                  <span>2. Byrgir (Seljandi)</span>
                </span>
                {searchSupplier && (
                  <span className="text-emerald-700 font-bold lowercase text-[10px]">
                    Sía virk
                  </span>
                )}
              </label>
              <div className="relative flex items-center">
                <Store className="w-4 h-4 text-neutral-400 absolute left-3 pointer-events-none" />
                <input
                  id="searchSupplierField"
                  type="text"
                  value={searchSupplier}
                  onChange={e => setSearchSupplier(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleExecuteSearch();
                  }}
                  placeholder="Dæmi: Wise Lausnir, Veritas, Olís, Ístak..."
                  className="w-full pl-9 pr-8 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-xs font-semibold focus:border-neutral-900 focus:bg-white focus:outline-hidden transition shadow-2xs"
                />
                {searchSupplier && (
                  <button
                    type="button"
                    onClick={() => setSearchSupplier('')}
                    className="absolute right-2.5 text-neutral-400 hover:text-neutral-700 p-0.5 cursor-pointer"
                    title="Hreinsa birgja"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <span className="text-[10px] text-neutral-500">
                Sía aðeins eftir fyrirtæki sem sendir reikninginn
              </span>
            </div>

            {/* Dálkur 3: Lína í reikningi */}
            <div className="flex flex-col gap-1">
              <label htmlFor="searchLineField" className="text-[11px] font-black uppercase text-neutral-800 tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-purple-600" />
                  <span>3. Línu í Reikning (Bókhaldslykill)</span>
                </span>
                {searchLine && (
                  <span className="text-purple-700 font-bold lowercase text-[10px]">
                    Sía virk
                  </span>
                )}
              </label>
              <div className="relative flex items-center">
                <Receipt className="w-4 h-4 text-neutral-400 absolute left-3 pointer-events-none" />
                <input
                  id="searchLineField"
                  type="text"
                  value={searchLine}
                  onChange={e => setSearchLine(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleExecuteSearch();
                  }}
                  placeholder="Dæmi: Risna, Spítalamatur, Tölvubúnaður..."
                  className="w-full pl-9 pr-8 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-xs font-semibold focus:border-neutral-900 focus:bg-white focus:outline-hidden transition shadow-2xs"
                />
                {searchLine && (
                  <button
                    type="button"
                    onClick={() => setSearchLine('')}
                    className="absolute right-2.5 text-neutral-400 hover:text-neutral-700 p-0.5 cursor-pointer"
                    title="Hreinsa línu"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <span className="text-[10px] text-neutral-500">
                Sía eftir bókhaldslykli, vörulýsingu eða tegund
              </span>
            </div>
          </div>
        </div>

        {/* Flýtidæmi úr raunverulegri notkun */}
        <div className="flex items-center gap-1.5 pt-1 flex-wrap text-[11px]">
          <span className="text-neutral-500 font-bold">Flýtidæmi úr notendabeiðni:</span>
          <button
            type="button"
            onClick={() => {
              setSearchClient('Utanríkisráðuneyti');
              setSearchSupplier('Wise Lausnir');
              setSearchLine('');
            }}
            className="px-2.5 py-1 bg-neutral-50 hover:bg-neutral-200 text-neutral-800 text-[11px] font-bold rounded-lg border border-neutral-200 transition cursor-pointer flex items-center gap-1 shadow-2xs"
          >
            <span>💡 Dæmi 1: Utanríkisráðuneyti + Wise Lausnir</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSearchClient('Utanríkisráðuneyti');
              setSearchSupplier('');
              setSearchLine('Risna');
            }}
            className="px-2.5 py-1 bg-neutral-50 hover:bg-neutral-200 text-neutral-800 text-[11px] font-bold rounded-lg border border-neutral-200 transition cursor-pointer flex items-center gap-1 shadow-2xs"
          >
            <span>💡 Dæmi 2: Utanríkisráðuneyti + Risna</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSearchClient('Landspítali');
              setSearchSupplier('');
              setSearchLine('Spítalamatur');
            }}
            className="px-2.5 py-1 bg-neutral-50 hover:bg-neutral-200 text-neutral-800 text-[11px] font-bold rounded-lg border border-neutral-200 transition cursor-pointer flex items-center gap-1 shadow-2xs"
          >
            <span>💡 Dæmi 3: Landspítali + Spítalamatur</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSearchClient('Samgöngustofa');
              setSearchSupplier('Bílaleiga');
              setSearchLine('');
            }}
            className="px-2.5 py-1 bg-neutral-50 hover:bg-neutral-200 text-neutral-800 text-[11px] font-bold rounded-lg border border-neutral-200 transition cursor-pointer flex items-center gap-1 shadow-2xs"
          >
            <span>💡 Dæmi 4: Samgöngustofa + Bílaleiga</span>
          </button>
        </div>
      </section>

      {/* Summary Metrics Bar */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
          <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
            Reikningar í leit
          </div>
          <div className="text-2xl font-black text-neutral-900 mt-1">
            {hasSearchCriteria ? formaTolu(totalInvoices) : '—'}
          </div>
          <div className="text-xs text-neutral-600 font-medium mt-0.5">
            {!hasSearchCriteria 
              ? 'Leit hefst þegar skilyrði eru sett inn' 
              : hasSearchFilters
                ? `Reikningar sem uppfylla leitarskilyrðin`
                : isAllYears && isAllMonths
                  ? 'Allir reikningar ríkisins (2017–2026)'
                  : isAllYears
                    ? `Öll ár (${selectedMonth}. mán)`
                    : isAllMonths
                      ? `Allt árið ${selectedYear}`
                      : `${selectedMonth}. mán ${selectedYear}`}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
          <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
            Samanlögð upphæð í leit
          </div>
          <div className="text-2xl font-black text-neutral-900 mt-1">
            {hasSearchCriteria ? `${formaTolu(totalAmount)} kr.` : '—'}
          </div>
          <div className="text-xs text-neutral-600 font-medium mt-0.5">
            {!hasSearchCriteria 
              ? 'Tóm leitargluggi (bíður eftir leitarorðum)' 
              : hasSearchFilters
                ? 'Heildarkostnaður síuðu færslanna'
                : 'Heildargreiðslur ríkisins á völdu tímabili'}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
          <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
            Stofnanir &amp; PostgreSQL Flýtivísir
          </div>
          <div className="text-base font-black text-neutral-900 mt-1 flex items-center gap-2">
            <span>{hasSearchCriteria ? `${filteredClients.length} stofnanir fundust` : 'Sláðu inn leitarskilyrði eða veldu tímabil'}</span>
          </div>
          <div className="text-[11px] text-emerald-700 font-mono font-bold mt-0.5 flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-500" />
            {hasSearchCriteria ? 'GIN / B-Tree svarhraði: ~0,004 sek' : 'Tilbúið fyrir leit'}
          </div>
        </div>
      </section>

      {/* Active Search Notification Banner */}
      {hasSearchFilters && (
        <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Sérhæfð leit virk: </span>
            {activeSearchSummary}.
            {' '}Birtir eingöngu færslur sem passa við öll valin skilyrði samtímis (AND-skilyrði).
            {filteredClients.length === 0 && (
              <span className="text-red-700 font-bold ml-1">
                Engar færslur fundust með þessari samsetningu á völdu tímabili.
              </span>
            )}
          </div>
          <button
            onClick={() => {
              setSearchClient('');
              setSearchSupplier('');
              setSearchLine('');
            }}
            className="text-amber-800 hover:text-black underline font-bold cursor-pointer shrink-0"
          >
            Hreinsa síur
          </button>
        </div>
      )}

      {/* Search Results Table & View Switcher */}
      <section className="bg-white border border-neutral-900 rounded-xl overflow-hidden shadow-xs">
        {/* Results Header with View Mode Tabs */}
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-black uppercase tracking-tight text-neutral-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-neutral-900" />
              <span>Leitarniðurstöður {hasSearchCriteria ? `(${filteredClients.length} stofnanir)` : ''}</span>
            </h3>

            {/* View Mode Switcher: Stofnanir (Hierarchy) vs Beinir reikningar (Flat list) */}
            {hasSearchCriteria && (
              <div className="flex items-center bg-neutral-100 p-0.5 rounded-lg border border-neutral-300 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setResultsViewMode('hierarchy')}
                  className={`px-3 py-1 rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                    resultsViewMode === 'hierarchy'
                      ? 'bg-white text-neutral-900 shadow-2xs'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Stofnana- &amp; birgjasýn</span>
                </button>
                <button
                  type="button"
                  onClick={() => setResultsViewMode('flatInvoices')}
                  className={`px-3 py-1 rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                    resultsViewMode === 'flatInvoices'
                      ? 'bg-white text-neutral-900 shadow-2xs'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Beinir reikningar {dbSearchResults ? `(${dbSearchResults.length})` : ''}</span>
                </button>
              </div>
            )}
          </div>

          <span className="text-xs text-neutral-500">
            {hasSearchCriteria
              ? resultsViewMode === 'hierarchy'
                ? 'Smelltu á stofnun til að skoða birgja og reikninga með sundurliðuðum línum'
                : 'Sýnir alla staka reikninga sem uppfylla leitarskilyrðin'
              : 'Sláðu inn leitarskilyrði hér að ofan til að birta niðurstöður'}
          </span>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* VIEW 1: HIERARCHICAL STOFNANA- OG BIRGJASÝN                   */}
        {/* ------------------------------------------------------------- */}
        {resultsViewMode === 'hierarchy' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-neutral-100 border-b border-neutral-300 text-[11px] font-black uppercase text-neutral-700 tracking-wider">
                  <th 
                    className="py-3 px-4 cursor-pointer hover:bg-neutral-200 transition"
                    onClick={() => handleSort('client')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>🏛️ Kaupandi (Stofnun)</span>
                      <ArrowUpDown className={`w-3.5 h-3.5 ${sortColumn === 'client' ? 'text-black font-black' : 'text-neutral-500'}`} />
                    </div>
                  </th>
                  <th 
                    className="py-3 px-4 text-center cursor-pointer hover:bg-neutral-200 transition"
                    onClick={() => handleSort('invoiceCount')}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>🧾 Fjöldi reikninga</span>
                      <ArrowUpDown className={`w-3.5 h-3.5 ${sortColumn === 'invoiceCount' ? 'text-black font-black' : 'text-neutral-500'}`} />
                    </div>
                  </th>
                  <th 
                    className="py-3 px-4 text-right cursor-pointer hover:bg-neutral-200 transition"
                    onClick={() => handleSort('totalAmount')}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>💰 Heildarupphæð</span>
                      <ArrowUpDown className={`w-3.5 h-3.5 ${sortColumn === 'totalAmount' ? 'text-black font-black' : 'text-neutral-500'}`} />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 font-medium">
                {!hasSearchCriteria ? (
                  <tr>
                    <td colSpan={3} className="py-16 text-center">
                      <div className="max-w-md mx-auto flex flex-col items-center justify-center text-center p-6 sm:p-8 bg-neutral-50 rounded-2xl border border-dashed border-neutral-300 space-y-3">
                        <div className="w-12 h-12 rounded-xl bg-neutral-900 text-white flex items-center justify-center shadow-xs">
                          <Search className="w-6 h-6 text-emerald-400" />
                        </div>
                        <h4 className="text-base font-black text-neutral-900">
                          Sláðu inn leitarskilyrði til að hefja leit
                        </h4>
                        <p className="text-xs text-neutral-600 leading-relaxed max-w-sm">
                          Leitin hefst ekki sjálfkrafa. Sláðu inn heiti á <strong>Stofnun</strong>, <strong>Byrgja</strong> eða <strong>Línu á reikningi</strong> (bókhaldslykli) hér að ofan til að sækja gögn úr öllum 18,17 milljónum reikninga.
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
                          <span className="text-[11px] text-neutral-500 font-bold">Flýtival:</span>
                          <button
                            type="button"
                            onClick={() => {
                              setSearchClient('Utanríkisráðuneyti');
                              setSearchSupplier('Wise Lausnir');
                            }}
                            className="px-2.5 py-1 bg-white hover:bg-neutral-100 text-neutral-800 text-[11px] font-bold rounded-lg border border-neutral-300 shadow-2xs transition cursor-pointer"
                          >
                            Utanríkisráðuneyti + Wise Lausnir
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSearchClient('Utanríkisráðuneyti');
                              setSearchLine('Risna');
                            }}
                            className="px-2.5 py-1 bg-white hover:bg-neutral-100 text-neutral-800 text-[11px] font-bold rounded-lg border border-neutral-300 shadow-2xs transition cursor-pointer"
                          >
                            Utanríkisráðuneyti + Risna
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : isDataLoading ? (
                  <tr>
                    <td colSpan={3} className="py-12 text-center text-neutral-600 font-mono text-xs">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <RefreshCw className="w-6 h-6 animate-spin text-neutral-800" />
                        <span className="font-bold text-neutral-900 text-sm font-mono">
                          Sæki gögn úr gagnagrunni...
                        </span>
                        <span className="text-xs text-neutral-500 font-sans">
                          Sæki sundurliðað yfirlit yfir stofnanir, birgja og reikninga ({isAllYears ? 'Öll ár' : selectedYear} / {isAllMonths ? 'Allir mánuðir' : `${selectedMonth}. mán`})
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-12 text-center text-neutral-500">
                      <p className="text-sm font-bold text-neutral-700">Engar niðurstöður fundust</p>
                      <p className="text-xs mt-1">
                        {hasSearchFilters
                          ? `Enginn reikningur fannst með leitarskilyrðunum „${activeSearchSummary}“ á völdu tímabili.`
                          : 'Engar færslur fundust á völdu tímabili.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredClients.map(client => {
                    const isExpanded = expandedClients.has(client.client);

                    // Samræming á tölum ef leitað er að ákveðnum birgi
                    const matchingCachedSupplier = (searchSupplier.trim() && dbSuppliersCache[client.client])
                      ? dbSuppliersCache[client.client].find(s => s.supplier.toLowerCase().includes(searchSupplier.toLowerCase().trim()))
                      : null;

                    const displayInvoiceCount = matchingCachedSupplier ? matchingCachedSupplier.invoiceCount : client.invoiceCount;
                    const displayLineCount = matchingCachedSupplier ? (matchingCachedSupplier.lineCount || matchingCachedSupplier.invoiceCount) : client.lineCount;
                    const displayTotalAmount = matchingCachedSupplier ? matchingCachedSupplier.totalAmount : client.totalAmount;

                    return (
                      <React.Fragment key={client.client}>
                        <tr 
                          onClick={() => toggleClientExpand(client.client)}
                          className={`cursor-pointer transition-colors select-none ${
                            isExpanded ? 'bg-blue-50/70' : 'hover:bg-neutral-50'
                          }`}
                        >
                          <td className="p-3 font-semibold text-neutral-900 flex items-center gap-2.5">
                            <span
                              className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold transition-all ${
                                isExpanded ? 'bg-blue-600 text-white' : 'bg-neutral-900 text-white'
                              }`}
                            >
                              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                            </span>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                              <span>{highlightMatch(client.client, searchClient)}</span>
                              {searchSupplier.trim() && (
                                <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold border border-emerald-200">
                                  birgir: {searchSupplier}
                                </span>
                              )}
                              {searchLine.trim() && (
                                <span className="text-[10px] font-mono bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded font-bold border border-purple-200">
                                  lína: {searchLine}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-center font-mono text-neutral-700">
                            <span title={displayLineCount && displayLineCount !== displayInvoiceCount ? `${formaTolu(displayInvoiceCount)} reikningar (${formaTolu(displayLineCount)} línur í reikningum)` : `${formaTolu(displayInvoiceCount)} reikningar`}>
                              {formaTolu(displayInvoiceCount)}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-neutral-900">
                            {formaTolu(displayTotalAmount)} kr.
                          </td>
                        </tr>

                        {/* Expanded Suppliers & Invoices Hierarchy */}
                        {isExpanded && (() => {
                          // Suppliers resolution: either real DB grouped list or fallback mapped from local invoices
                          let rawSuppliers: Array<{ supplier: string; invoiceCount: number; lineCount?: number; totalAmount: number }> = [];
                          if (dbSuppliersCache[client.client] && dbSuppliersCache[client.client].length > 0) {
                            rawSuppliers = dbSuppliersCache[client.client];
                          } else if (client.matchingInvoices && client.matchingInvoices.length > 0) {
                            const map = new Map<string, { supplier: string; invoiceCount: number; lineCount: number; totalAmount: number; invoiceIds: Set<string> }>();
                            for (const inv of client.matchingInvoices) {
                              const supName = inv.supplier || 'Ótilgreindur birgir';
                              const existing = map.get(supName);
                              if (!existing) {
                                map.set(supName, {
                                  supplier: supName,
                                  invoiceCount: 1,
                                  lineCount: 1,
                                  totalAmount: inv.amount,
                                  invoiceIds: new Set([inv.id])
                                });
                              } else {
                                existing.invoiceIds.add(inv.id);
                                existing.invoiceCount = existing.invoiceIds.size;
                                existing.lineCount += 1;
                                existing.totalAmount += inv.amount;
                              }
                            }
                            rawSuppliers = Array.from(map.values()).map(s => ({
                              supplier: s.supplier,
                              invoiceCount: s.invoiceCount,
                              lineCount: s.lineCount,
                              totalAmount: s.totalAmount
                            })).sort((a, b) => b.totalAmount - a.totalAmount);
                          } else if (dbSuppliersCache[client.client]) {
                            rawSuppliers = dbSuppliersCache[client.client];
                          }

                          // Filter suppliers list by searchSupplier if entered, or local drawer filter
                          const drawerFilter = (clientFilterQueries[client.client] || '').toLowerCase().trim();
                          const displaySuppliers = rawSuppliers.filter(s => {
                            if (drawerFilter) return s.supplier.toLowerCase().includes(drawerFilter);
                            if (searchSupplier.trim()) return s.supplier.toLowerCase().includes(searchSupplier.toLowerCase().trim());
                            return true;
                          });

                          const timePeriodLabel = isAllYears && isAllMonths 
                            ? 'Öll ár & allir mánuðir' 
                            : isAllYears 
                              ? `Öll ár (${selectedMonth}. mán)` 
                              : isAllMonths 
                                ? `Allt árið ${selectedYear}` 
                                : `${selectedMonth}. mán ${selectedYear}`;

                          const isDbLoadingSuppliers = Boolean(dbStatus?.connected && loadingSuppliersForClient[client.client]);

                          return (
                            <tr className="bg-neutral-50/80">
                              <td colSpan={3} className="p-4 pl-8 border-l-4 border-neutral-900">
                                <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden shadow-2xs">
                                  {/* Sub-header with institution title and supplier filter */}
                                  <div className="bg-neutral-100 p-3 text-xs font-bold text-neutral-700 border-b border-neutral-200 flex flex-wrap justify-between items-center gap-2">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                      <span>
                                        Birgjar hjá: <strong className="text-neutral-900">{client.client}</strong> ({timePeriodLabel})
                                      </span>
                                      <span className="text-[11px] font-semibold text-neutral-600 bg-neutral-200 px-2 py-0.5 rounded-full font-mono">
                                        {displaySuppliers.length} {displaySuppliers.length === 1 ? 'birgir' : 'birgjar'}
                                        {rawSuppliers.length > displaySuppliers.length && ` (af ${rawSuppliers.length})`}
                                      </span>
                                      {searchSupplier && (
                                        <span className="inline-flex items-center gap-1.5 text-[10px] font-mono bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full border border-emerald-200 font-bold">
                                          Síað eftir byrgja: „{searchSupplier}“
                                        </span>
                                      )}
                                      {searchLine && (
                                        <span className="inline-flex items-center gap-1.5 text-[10px] font-mono bg-purple-100 text-purple-900 px-2 py-0.5 rounded-full border border-purple-200 font-bold">
                                          Síað eftir línu: „{searchLine}“
                                        </span>
                                      )}
                                    </div>

                                    {/* Local Search inside institution drawer */}
                                    <div className="relative w-full sm:w-64">
                                      <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                                      <input
                                        type="text"
                                        value={clientFilterQueries[client.client] ?? searchSupplier}
                                        onChange={e => {
                                          const val = e.target.value;
                                          setClientFilterQueries(prev => ({ ...prev, [client.client]: val }));
                                        }}
                                        placeholder="Leita að birgi í skúffu..."
                                        className="w-full pl-8 pr-7 py-1 text-xs bg-white border border-neutral-300 rounded font-normal focus:border-neutral-800 focus:outline-hidden"
                                      />
                                      {(clientFilterQueries[client.client] || searchSupplier) && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setClientFilterQueries(prev => ({ ...prev, [client.client]: '' }));
                                          }}
                                          className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                                          title="Hreinsa birgjasíu í skúffu"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {/* Suppliers List inside institution drawer */}
                                  <div className="divide-y divide-neutral-100">
                                    {isDbLoadingSuppliers ? (
                                      <div className="p-6 text-center text-neutral-600 font-mono text-xs flex items-center justify-center gap-2">
                                        <RefreshCw className="w-4 h-4 animate-spin text-neutral-500" />
                                        <span>Sæki sundurliðaðan lista yfir birgja úr PostgreSQL...</span>
                                      </div>
                                    ) : displaySuppliers.length === 0 ? (
                                      <div className="p-6 text-center text-neutral-500 text-xs italic">
                                        Enginn birgir fannst með leitarskilyrðunum hjá {client.client}.
                                      </div>
                                    ) : (
                                      displaySuppliers.map(sup => {
                                        const supKey = `${client.client}:::${sup.supplier}`;
                                        const isSupExpanded = expandedSuppliers.has(supKey);
                                        const supInvoices = supplierInvoicesCache[supKey] || [];
                                        const isSupLoading = Boolean(supplierLoadingInvoices[supKey]);
                                        const visibleLimit = supplierVisibleLimits[supKey] || 25;
                                        const totalLines = sup.lineCount || sup.invoiceCount;

                                        // Filter invoices inside supplier row if user typed a local filter
                                        const lineFilter = (supplierInvoiceFilters[supKey] || '').toLowerCase().trim();
                                        const filteredSupInvoices = lineFilter
                                          ? supInvoices.filter(inv => 
                                              inv.id.toLowerCase().includes(lineFilter) ||
                                              inv.lines?.some(l => l.description.toLowerCase().includes(lineFilter))
                                            )
                                          : supInvoices;

                                        const paginatedSupInvoices = filteredSupInvoices.slice(0, visibleLimit);
                                        const hasMoreInvoices = !lineFilter && supInvoices.length < totalLines;

                                        return (
                                          <div key={supKey} className="text-xs">
                                            {/* Supplier Row Item */}
                                            <div 
                                              onClick={() => toggleSupplierExpand(client.client, sup.supplier, totalLines)}
                                              className={`p-3 flex items-center justify-between cursor-pointer hover:bg-neutral-100 transition-colors select-none ${
                                                isSupExpanded ? 'bg-neutral-100 border-l-2 border-neutral-900 font-bold' : ''
                                              }`}
                                            >
                                              <div className="flex items-center gap-2">
                                                <span className={`w-4 h-4 rounded flex items-center justify-center text-[9px] ${
                                                  isSupExpanded ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-700'
                                                }`}>
                                                  {isSupExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                                </span>
                                                <span className="font-semibold text-neutral-900">
                                                  {highlightMatch(sup.supplier, searchSupplier || clientFilterQueries[client.client] || '')}
                                                </span>
                                              </div>

                                              <div className="flex items-center gap-4 font-mono">
                                                <span className="text-neutral-500 text-[11px]" title={`${formaTolu(sup.invoiceCount)} reikningar (${formaTolu(totalLines)} línur)`}>
                                                  {formaTolu(sup.invoiceCount)} rk. ({formaTolu(totalLines)} línur)
                                                </span>
                                                <span className="font-bold text-neutral-900">
                                                  {formaTolu(sup.totalAmount)} kr.
                                                </span>
                                              </div>
                                            </div>

                                            {/* Expanded Invoices for this Supplier */}
                                            {isSupExpanded && (
                                              <div className="p-3 bg-white border-t border-b border-neutral-200 pl-8">
                                                {/* Local invoice filter toolbar */}
                                                <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-neutral-100 flex-wrap">
                                                  <div className="flex items-center gap-2">
                                                    <span className="text-[11px] font-bold text-neutral-600">
                                                      🧾 Reikningar ({formaTolu(sup.invoiceCount)} reikningar, {formaTolu(totalLines)} línur)
                                                    </span>
                                                    {searchLine && (
                                                      <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full border border-purple-200">
                                                        Línusía virk: „{searchLine}“
                                                      </span>
                                                    )}
                                                  </div>

                                                  <div className="relative w-56">
                                                    <Search className="w-3 h-3 text-neutral-400 absolute left-2 top-1/2 -translate-y-1/2" />
                                                    <input
                                                      type="text"
                                                      value={supplierInvoiceFilters[supKey] ?? ''}
                                                      onChange={e => {
                                                        const val = e.target.value;
                                                        setSupplierInvoiceFilters(prev => ({ ...prev, [supKey]: val }));
                                                      }}
                                                      placeholder="Sía vörulýsingu eða reikningsnr..."
                                                      className="w-full pl-7 pr-6 py-1 text-[11px] bg-neutral-50 border border-neutral-300 rounded font-normal focus:border-neutral-800 focus:outline-hidden"
                                                    />
                                                    {supplierInvoiceFilters[supKey] && (
                                                      <button
                                                        type="button"
                                                        onClick={() => setSupplierInvoiceFilters(prev => ({ ...prev, [supKey]: '' }))}
                                                        className="absolute right-1.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                                                      >
                                                        <X className="w-3 h-3" />
                                                      </button>
                                                    )}
                                                  </div>
                                                </div>

                                                {isSupLoading && supInvoices.length === 0 ? (
                                                  <div className="p-6 text-center text-neutral-600 font-mono text-xs flex items-center justify-center gap-2">
                                                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-neutral-500" />
                                                    <span>Sæki reikninga fyrir {sup.supplier}...</span>
                                                  </div>
                                                ) : supInvoices.length === 0 ? (
                                                  <div className="p-4 text-center text-neutral-500 italic text-xs">
                                                    Engir reikningar fundust fyrir þennan birgi með þessum skilyrðum.
                                                  </div>
                                                ) : filteredSupInvoices.length === 0 ? (
                                                  <div className="p-4 text-center text-neutral-500 italic text-xs bg-neutral-50 rounded border border-neutral-200">
                                                    Engar línur eða reikningsnúmer fundust með leitarorðinu „{lineFilter}“.
                                                  </div>
                                                ) : (
                                                  <>
                                                    <div className="overflow-x-auto">
                                                      <table className="w-full text-xs text-left border-collapse">
                                                        <thead>
                                                          <tr className="bg-neutral-50 text-neutral-600 border-b border-neutral-200 text-[11px] font-bold uppercase">
                                                            <th className="p-2 w-32" title="Greiðsludagsetning (dagsetning þegar greiðsla fór fram úr ríkissjóði, ekki útgáfudagur reiknings)">Greiðsludags.</th>
                                                            <th className="p-2 w-36">Reikningsnr.</th>
                                                            <th className="p-2">Skýring / Vörulýsing (Bókhaldslykill)</th>
                                                            <th className="p-2 text-right">Upphæð / Beiðni</th>
                                                          </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-neutral-100">
                                                          {paginatedSupInvoices.map((inv, invIdx) => {
                                                            const isAlreadySelected = selectedInvoices.some(i => i.reikningsnr === inv.id);
                                                            const uniqueInvoiceKey = `${inv.id}-${invIdx}-${inv.date || ''}-${inv.amount || 0}`;
                                                            const hasMultipleLines = Boolean(inv.lines && inv.lines.length > 1);

                                                            return (
                                                              <React.Fragment key={uniqueInvoiceKey}>
                                                                <tr className="hover:bg-neutral-50/80 transition-colors">
                                                                  <td className="p-2 font-mono text-neutral-600 whitespace-nowrap">
                                                                    {formaDags(inv.date, selectedYear)}
                                                                  </td>
                                                                  <td className="p-2 font-mono whitespace-nowrap">
                                                                    <span className="font-bold text-neutral-800 bg-neutral-100 px-1.5 py-0.5 rounded text-[11px]">
                                                                      {inv.id}
                                                                    </span>
                                                                    {hasMultipleLines && (
                                                                      <span 
                                                                        className="ml-1.5 text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded font-sans inline-block"
                                                                        title={`Reikningurinn inniheldur ${inv.lines.length} línur`}
                                                                      >
                                                                        {inv.lines.length} línur
                                                                      </span>
                                                                    )}
                                                                  </td>
                                                                  <td className="p-2 text-neutral-800">
                                                                    {highlightMatch(inv.lines?.[0]?.description || 'Almennur rekstur', searchLine || lineFilter)}
                                                                  </td>
                                                                  <td className="p-2 text-right font-mono font-bold text-neutral-900 whitespace-nowrap">
                                                                    {onOpenWhistleblower && (
                                                                      <button
                                                                        onClick={e => {
                                                                          e.stopPropagation();
                                                                          onOpenWhistleblower({
                                                                            institution: inv.client || client.client,
                                                                            supplier: inv.supplier || sup.supplier,
                                                                            invoiceNumber: String(inv.id)
                                                                          });
                                                                        }}
                                                                        className="p-1 text-amber-700 hover:text-amber-950 hover:bg-amber-100 rounded text-[10px] font-bold mr-1.5 transition cursor-pointer inline-flex items-center align-middle"
                                                                        title="Benda á þennan reikning (Trúnaðarábending)"
                                                                      >
                                                                        <ShieldAlert className="w-3.5 h-3.5" />
                                                                      </button>
                                                                    )}
                                                                    {isAlreadySelected ? (
                                                                      <span className="text-emerald-700 font-bold text-[11px] mr-2">
                                                                        [Í BEIÐNI ⏳]
                                                                      </span>
                                                                    ) : (
                                                                      <button
                                                                        onClick={e => {
                                                                          e.stopPropagation();
                                                                          handleAddInvoiceToRequest(inv, inv.lines?.[0]?.description || '');
                                                                        }}
                                                                        className="px-2 py-0.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded text-[10px] font-bold mr-2 transition cursor-pointer"
                                                                        title="Bæta við upplýsingabeiðni skv. upplýsingalögum 140/2012"
                                                                      >
                                                                        ➕ Senda inn
                                                                      </button>
                                                                    )}
                                                                    <span>{formaTolu(inv.amount)} kr.</span>
                                                                  </td>
                                                                </tr>

                                                                {/* Itemized ledger sub-lines */}
                                                                {hasMultipleLines && (
                                                                  <tr className="bg-neutral-50/40">
                                                                    <td colSpan={4} className="p-2 pl-6 text-[11px] text-neutral-600">
                                                                      <ul className="list-disc pl-4 space-y-0.5">
                                                                        {inv.lines.map((l, lIdx) => (
                                                                          <li key={lIdx} className={l.is_kredit ? 'line-through text-neutral-400' : ''}>
                                                                            <span>{highlightMatch(l.description, searchLine || lineFilter)}</span> — <strong className="font-mono">{formaTolu(l.amount)} kr.</strong>
                                                                            {l.is_kredit && <span className="text-red-600 ml-1 font-bold">(Kreditfært)</span>}
                                                                          </li>
                                                                        ))}
                                                                      </ul>
                                                                    </td>
                                                                  </tr>
                                                                )}
                                                              </React.Fragment>
                                                            );
                                                          })}
                                                        </tbody>
                                                      </table>
                                                    </div>

                                                    {/* Pagination bar under supplier */}
                                                    <div className="mt-2.5 pt-2.5 border-t border-neutral-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                                                      <div className="text-neutral-600 flex items-center gap-1.5 font-mono">
                                                        <span>
                                                          Sýnir <strong className="text-neutral-900">{paginatedSupInvoices.length}</strong> af <strong className="text-neutral-900">{filteredSupInvoices.length}</strong> síuðum línum (af samtals {formaTolu(totalLines)} hjá {sup.supplier})
                                                        </span>
                                                      </div>

                                                      <div className="flex items-center gap-2">
                                                        {hasMoreInvoices && (
                                                          <button
                                                            onClick={e => {
                                                              e.stopPropagation();
                                                              handleLoadMoreForSupplier(client.client, sup.supplier, totalLines);
                                                            }}
                                                            disabled={isSupLoading}
                                                            className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                                                          >
                                                            {isSupLoading && <RefreshCw size={12} className="animate-spin" />}
                                                            Sýna næstu 25 línur ({Math.min(visibleLimit, totalLines)} af {formaTolu(totalLines)})
                                                          </button>
                                                        )}
                                                      </div>
                                                    </div>
                                                  </>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );
                        })()}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 2: BEINIR REIKNINGAR (FLATUR REIKNINGALISTI)             */}
        {/* ------------------------------------------------------------- */}
        {resultsViewMode === 'flatInvoices' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-neutral-100 border-b border-neutral-300 text-[11px] font-black uppercase text-neutral-700 tracking-wider">
                  <th className="py-3 px-4 w-32" title="Greiðsludagsetning (dagsetning þegar greiðsla fór fram úr ríkissjóði, ekki útgáfudagur reiknings)">Greiðsludags.</th>
                  <th className="py-3 px-4">🏛️ Kaupandi (Stofnun)</th>
                  <th className="py-3 px-4">🏢 Seljandi (Birgir)</th>
                  <th className="py-3 px-4 w-32">Reikningsnr.</th>
                  <th className="py-3 px-4">🧾 Lína / Bókhaldslykill</th>
                  <th className="py-3 px-4 text-right">Upphæð / Beiðni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 font-medium">
                {isDataLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-neutral-600 font-mono text-xs">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="w-5 h-5 animate-spin text-neutral-800" />
                        <span>Sæki staka reikninga úr gagnagrunni...</span>
                      </div>
                    </td>
                  </tr>
                ) : (!dbSearchResults || dbSearchResults.length === 0) ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-neutral-500">
                      <p className="text-sm font-bold text-neutral-700">Engir reikningar fundust</p>
                      <p className="text-xs mt-1">
                        {hasSearchFilters
                          ? `Enginn reikningur fannst með leitarskilyrðunum „${activeSearchSummary}“.`
                          : 'Sláðu inn leitarskilyrði hér að ofan.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  dbSearchResults.map((inv, invIdx) => {
                    const isAlreadySelected = selectedInvoices.some(i => i.reikningsnr === inv.numer || i.reikningsnr === inv.id);
                    const invObj: Invoice = {
                      id: inv.numer || inv.id,
                      client: inv.client || '',
                      supplier: inv.supplier || '',
                      amount: inv.amount,
                      date: formaDags(inv.date, selectedYear),
                      lines: [{ description: inv.description || 'Almennur rekstur', amount: inv.amount, is_kredit: inv.amount < 0 }]
                    };

                    return (
                      <tr key={`${inv.id}-${invIdx}`} className="hover:bg-neutral-50 transition-colors">
                        <td className="py-2.5 px-4 font-mono text-neutral-600 whitespace-nowrap">
                          {formaDags(inv.date, selectedYear)}
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-neutral-900">
                          {highlightMatch(inv.client || 'Ótilgreind stofnun', searchClient)}
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-neutral-900">
                          {highlightMatch(inv.supplier || 'Ótilgreindur birgir', searchSupplier)}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-neutral-800 whitespace-nowrap">
                          <span className="bg-neutral-100 px-1.5 py-0.5 rounded font-bold text-[11px]">
                            {inv.numer || inv.id}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-neutral-700">
                          {highlightMatch(inv.description || 'Almennur rekstur', searchLine)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-neutral-900 whitespace-nowrap">
                          {onOpenWhistleblower && (
                            <button
                              onClick={() => {
                                onOpenWhistleblower({
                                  institution: inv.client,
                                  supplier: inv.supplier,
                                  invoiceNumber: String(inv.numer || inv.id)
                                });
                              }}
                              className="p-1 text-amber-700 hover:text-amber-950 hover:bg-amber-100 rounded text-[10px] font-bold mr-1.5 transition cursor-pointer inline-flex items-center align-middle"
                              title="Benda á þennan reikning (Trúnaðarábending)"
                            >
                              <ShieldAlert className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {isAlreadySelected ? (
                            <span className="text-emerald-700 font-bold text-[11px] mr-2">
                              [Í BEIÐNI ⏳]
                            </span>
                          ) : (
                            <button
                              onClick={() => handleAddInvoiceToRequest(invObj, inv.description || '')}
                              className="px-2 py-0.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded text-[10px] font-bold mr-2 transition cursor-pointer"
                              title="Bæta við upplýsingabeiðni skv. 140/2012"
                            >
                              ➕ Senda inn
                            </button>
                          )}
                          <span>{formaTolu(inv.amount)} kr.</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Floating Act 140/2012 Drawer */}
      {selectedInvoices.length > 0 && (
        <div className="fixed bottom-4 right-4 max-w-md w-full bg-neutral-900 border-2 border-neutral-700 text-white p-4 rounded-xl shadow-2xl z-40 space-y-3 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between border-b border-neutral-700 pb-2">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-black uppercase text-white flex items-center gap-1.5">
                <span>Valdir reikningar fyrir</span>
                <a
                  href="https://www.althingi.is/lagas/nuna/2012140.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-emerald-500/50 hover:text-emerald-300 flex items-center gap-0.5"
                  title="Skoða Upplýsingalög nr. 140/2012 á Alþingi (opnast í nýjum glugga)"
                >
                  <span>140/2012</span>
                  <ExternalLink className="w-2.5 h-2.5 text-emerald-400" />
                </a>
                <span>({selectedInvoices.length})</span>
              </span>
            </div>
            <button
              onClick={() => setSelectedInvoices([])}
              className="text-neutral-400 hover:text-white text-xs font-bold cursor-pointer"
            >
              Hreinsa
            </button>
          </div>

          <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 text-xs">
            {selectedInvoices.map(inv => (
              <div key={inv.reikningsnr} className="flex items-center justify-between bg-neutral-800 p-2 rounded border border-neutral-700">
                <div className="truncate mr-2">
                  <span className="font-mono font-bold text-neutral-200">{inv.reikningsnr}</span>
                  <span className="text-neutral-400 ml-1">({inv.client})</span>
                </div>
                <button
                  onClick={() => handleRemoveInvoiceFromRequest(inv.reikningsnr)}
                  className="text-red-400 hover:text-red-200 shrink-0 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="pt-1 flex gap-2">
            <button
              onClick={copyLegalText}
              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              {copiedLegalText ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Afritað á klippiborð!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Afrita Upplýsingabeiðni</span>
                </>
              )}
            </button>
            <a
              href={emailMailtoUrl}
              className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 border border-neutral-600"
              title="Opna tölvupóstforrit með tilbúinni beiðni"
            >
              <Mail className="w-3.5 h-3.5 text-neutral-300" />
              <span>Senda</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
