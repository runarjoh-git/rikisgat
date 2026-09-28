import React, { useState, useEffect, useMemo } from 'react';
import { 
  Gift, Database, Copy, Check, Search, Filter, RefreshCw, 
  ArrowUpDown, ArrowUp, ArrowDown, ExternalLink, Download, FileText, CheckCircle2,
  Building2, Users, Layers, AlertCircle, Info, Sparkles, Terminal,
  Zap, Clock, ShieldAlert, ChevronDown, ChevronRight, Landmark,
  Building, Compass, GraduationCap, Palette, HeartHandshake, Hourglass
} from 'lucide-react';
import { formaTolu, stuttTala, formaDags } from '../utils/icelandicFormatters';
import { 
  fetchGrantsAnalysisFromDb, 
  GrantsApiResponse, 
  GrantCategoryBreakdown, 
  GrantRecipientBreakdown, 
  GrantPayerBreakdown, 
  GrantSampleRow,
  checkDbStatus,
  DbStatusResponse,
  checkGrantsIndexStatus,
  createGrantsIndex,
  GrantsIndexStatusResponse
} from '../services/api';

interface KeywordTag {
  id: string;
  label: string;
  pattern: string;
  description: string;
  selected: boolean;
}

const DEFAULT_KEYWORD_TAGS: KeywordTag[] = [
  { id: 'styrk', label: 'Styrkir (styrk*)', pattern: 'styrk', description: 'Styrkur, styrkir, rekstrarstyrkir, verkefnastyrkir, ferðastyrkir, starfsstyrkir', selected: true },
  { id: 'framlag', label: 'Framlög (framlag*)', pattern: 'framlag|framlög', description: 'Framlag, framlög, rekstrarframlag, stofnframlag, framlög til félagasamtaka', selected: true },
  { id: 'studning', label: 'Stuðningur (stuðning*)', pattern: 'stuðning', description: 'Sérstakur rekstrarstuðningur, viðspyrna, stuðningur við atvinnulíf', selected: true },
  { id: 'nidurgreidsl', label: 'Niðurgreiðslur (niðurgreiðsl*)', pattern: 'niðurgreiðsl', description: 'Ríkisniðurgreiðslur, flutningsjöfnun, vaxtaniðurgreiðslur', selected: true },
  { id: 'uthlutun', label: 'Úthlutanir (úthlutun*)', pattern: 'úthlutun', description: 'Úthlutun úr opinberum sjóðum, úthlutaðir sjóðir', selected: true },
  { id: 'gjof_verdlaun', label: 'Gjafir & Verðlaun', pattern: 'gjöf|gjafir|verðlaun', description: 'Minningargjafir, heiðurslaun, vísindaverðlaun, styrkgjafir', selected: true },
  { id: 'endurgreidsl', label: 'Endurgreiðslur & Ýmislegt', pattern: 'endurgreiðsl', description: 'Kvikmyndaendurgreiðslur, rannsókna- og þróunarendurgreiðslur (Rannís)', selected: true },
];

export const GrantsAnalysisSubTab: React.FC = () => {
  // Filters
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [minAmount, setMinAmount] = useState<number>(0);
  const [keywordTags, setKeywordTags] = useState<KeywordTag[]>(DEFAULT_KEYWORD_TAGS);
  const [customSearch, setCustomSearch] = useState<string>('');
  const [excludeInternal, setExcludeInternal] = useState<boolean>(true);
  
  // UI Tabs inside Grants Tab
  const [sqlTab, setSqlTab] = useState<'hats' | 'single' | 'byCategory' | 'recipients' | 'payers' | 'annual' | 'index'>('hats');
  const [dataView, setDataView] = useState<'hats' | 'recipients' | 'categories' | 'rows' | 'payers'>('hats');
  const [copiedSql, setCopiedSql] = useState<boolean>(false);
  const [expandedHats, setExpandedHats] = useState<Set<string>>(new Set(['markadsstofur', 'sveitarfelog']));

  // Sorting state for tables
  const [rowsSortField, setRowsSortField] = useState<'date' | 'institution' | 'supplier' | 'category' | 'invoiceNumber' | 'amount'>('date');
  const [rowsSortDirection, setRowsSortDirection] = useState<'asc' | 'desc'>('desc');

  const [categoriesSortField, setCategoriesSortField] = useState<'category' | 'count' | 'avg' | 'totalAmount' | 'pct'>('totalAmount');
  const [categoriesSortDirection, setCategoriesSortDirection] = useState<'asc' | 'desc'>('desc');

  const [recipientsSortField, setRecipientsSortField] = useState<'recipient' | 'count' | 'avg' | 'totalAmount'>('totalAmount');
  const [recipientsSortDirection, setRecipientsSortDirection] = useState<'asc' | 'desc'>('desc');

  const [payersSortField, setPayersSortField] = useState<'payer' | 'count' | 'avg' | 'totalAmount'>('totalAmount');
  const [payersSortDirection, setPayersSortDirection] = useState<'asc' | 'desc'>('desc');

  const [hatsSortField, setHatsSortField] = useState<'recipient' | 'count' | 'avg' | 'totalAmount' | 'pct'>('totalAmount');
  const [hatsSortDirection, setHatsSortDirection] = useState<'asc' | 'desc'>('desc');

  // Helper toggle functions
  const handleRowsSort = (field: 'date' | 'institution' | 'supplier' | 'category' | 'invoiceNumber' | 'amount') => {
    if (rowsSortField === field) {
      setRowsSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setRowsSortField(field);
      setRowsSortDirection(field === 'amount' || field === 'date' ? 'desc' : 'asc');
    }
  };

  const handleCategoriesSort = (field: 'category' | 'count' | 'avg' | 'totalAmount' | 'pct') => {
    if (categoriesSortField === field) {
      setCategoriesSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setCategoriesSortField(field);
      setCategoriesSortDirection(field === 'category' ? 'asc' : 'desc');
    }
  };

  const handleRecipientsSort = (field: 'recipient' | 'count' | 'avg' | 'totalAmount') => {
    if (recipientsSortField === field) {
      setRecipientsSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setRecipientsSortField(field);
      setRecipientsSortDirection(field === 'recipient' ? 'asc' : 'desc');
    }
  };

  const handlePayersSort = (field: 'payer' | 'count' | 'avg' | 'totalAmount') => {
    if (payersSortField === field) {
      setPayersSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setPayersSortField(field);
      setPayersSortDirection(field === 'payer' ? 'asc' : 'desc');
    }
  };

  const handleHatsSort = (field: 'recipient' | 'count' | 'avg' | 'totalAmount' | 'pct') => {
    if (hatsSortField === field) {
      setHatsSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setHatsSortField(field);
      setHatsSortDirection(field === 'recipient' ? 'asc' : 'desc');
    }
  };

  // Data state
  const [data, setData] = useState<GrantsApiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasGrantsSearched, setHasGrantsSearched] = useState<boolean>(false);
  const [dbStatus, setDbStatus] = useState<DbStatusResponse | null>(null);

  // Index status & optimization state
  const [indexStatus, setIndexStatus] = useState<GrantsIndexStatusResponse | null>(null);
  const [indexLoading, setIndexLoading] = useState<boolean>(false);
  const [indexMessage, setIndexMessage] = useState<string | null>(null);

  // Check DB status and Index status on mount without automatic heavy query
  useEffect(() => {
    checkDbStatus().then(status => setDbStatus(status)).catch(() => {});
    refreshIndexStatus();
  }, []);

  const refreshIndexStatus = async () => {
    try {
      const res = await checkGrantsIndexStatus();
      setIndexStatus(res);
    } catch {
      // ignore
    }
  };

  const handleCreateIndex = async () => {
    setIndexLoading(true);
    setIndexMessage('Byggi Trigram GIN vísi á gagnagrunninum (idx_reikningar_tegund_trgm)... Þetta getur tekið 1-2 mínútur á 18 milljón línum.');
    try {
      const res = await createGrantsIndex();
      if (res.success) {
        setIndexMessage(res.message || 'Vísir var búinn til!');
        await refreshIndexStatus();
        await loadGrantsData();
      } else {
        setIndexMessage(`Villa: ${res.message || res.error}`);
      }
    } catch (err: any) {
      setIndexMessage(`Villa: ${err.message}`);
    } finally {
      setIndexLoading(false);
    }
  };

  // Compute active regex pattern based on selected tags
  const activePattern = useMemo(() => {
    const selected = keywordTags.filter(t => t.selected).map(t => t.pattern);
    if (selected.length === 0) return 'styrk';
    return `(${selected.join('|')})`;
  }, [keywordTags]);

  const toggleKeywordTag = (id: string) => {
    setKeywordTags(prev => prev.map(t => t.id === id ? { ...t, selected: !t.selected } : t));
  };

  const selectAllTags = (select: boolean) => {
    setKeywordTags(prev => prev.map(t => ({ ...t, selected: select })));
  };

  // Fetch grants data from backend ONLY when explicitly requested
  const loadGrantsData = async () => {
    setLoading(true);
    setHasGrantsSearched(true);
    try {
      const res = await fetchGrantsAnalysisFromDb({
        year: selectedYear,
        pattern: activePattern,
        minAmount: minAmount,
        limit: 200,
        excludeInternal: excludeInternal
      });
      setData(res);
    } catch (err) {
      console.error('Failed to load grants data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Prepared SQL Commands for each sub-view
  const sqlCommands = useMemo(() => {
    const yearWhere = selectedYear !== 'all' ? `\n    AND EXTRACT(YEAR FROM r.dags::timestamp) = ${selectedYear}` : '';
    const minAmtWhere = minAmount > 0 ? `\n    AND r.upphaed >= ${minAmount}` : '';
    const excludeInternalWhere = excludeInternal 
      ? `\n    -- Útiloka innbyrðis framlög milli A-hluta stofnana (millifærslur milli ríkisstofnana):\n    AND NOT (r.tegund ~* 'innbyrðis')` 
      : '';
    const patternStr = activePattern.replace(/'/g, "''");

    return {
      hats: `-- ==============================================================================
-- 0. SAMSTARF OG FLOKKUN UNDIR HATTA (Markaðsstofur, Sambönd sveitarfélaga, ehf...)
-- Setur samstarfsaðila, landshlutasamtök og félagaform undir sama hatt með CASE WHEN
-- ==============================================================================
SELECT 
    CASE 
        WHEN b.nafn ~* '(markaðsstof|ferðamál|visit|ferðafélag)' 
            THEN '🏖️ Markaðsstofur landshlutanna & Ferðamál (ses)'
        WHEN b.nafn ~* '(samband.*sveitarfél|samtök.*sveitarfél|landshlutasamtök|byggðasamlag|eyþing)' 
            THEN '🏛️ Sambönd & Samtök sveitarfélaga'
        WHEN b.nafn ~* '(\\mehf\\M|\\mehf\\.)' 
            THEN '🏢 Einkahlutafélög (ehf - Tækniþróun & Nýsköpun)'
        WHEN b.nafn ~* '(\\mses\\M|\\ms\\.e\\.s\\M|sjálfseignarstofnun)' 
            THEN '📜 Aðrar sjálfseignarstofnanir (ses)'
        WHEN b.nafn ~* '(háskól|rannís|rannsókn|vísinda|tilraunastöð)' 
            THEN '🎓 Háskólar, Rannsóknir & Vísindi'
        WHEN b.nafn ~* '(kvikmynd|leikfélag|sinfóníu|listahátíð|leikhús)' 
            THEN '🎭 Menning, Listir & Kvikmyndir'
        WHEN b.nafn ~* '(rauði kross|landsbjörg|ísí|ungmenna|bændasamtök|björgun|hjálp)' 
            THEN '🤝 Félagasamtök, Hjálpar- og Íþróttastarf'
        ELSE '🌐 Aðrir viðtakendur styrkja'
    END AS hattur_heiti,
    COUNT(DISTINCT b.id) AS fjoldi_adila,
    COUNT(*) AS fjoldi_veitinga,
    SUM(r.upphaed)::numeric(18,2) AS heildarupphaed_kr,
    ROUND(AVG(r.upphaed))::numeric(18,2) AS medalupphaed_kr
FROM reikningar r
LEFT JOIN birgjar b ON r.birgi_id = b.id
WHERE 
    r.tegund ~* '${patternStr}'${yearWhere}${minAmtWhere}${excludeInternalWhere}
GROUP BY 1
ORDER BY heildarupphaed_kr DESC;`,

      single: `-- ==============================================================================
-- 1. STAKIR REIKNINGAR / FYRIRSPURNIR ÚR „TEGUND RUKKUNAR“ (reikningar.tegund)
-- Finna allar færslur sem innihalda styrki, framlög eða gefins fé frá ríkinu
-- ==============================================================================
SELECT 
    r.id AS reikningur_id,
    COALESCE(r.numer, r.id::text) AS reikningsnumer,
    r.dags AS dagsetning,
    s.nafn AS greidandi_stofnun,
    b.nafn AS vidtakandi_birgir,
    r.tegund AS tegund_rukkunar,
    r.upphaed AS upphaed_isk
FROM reikningar r
LEFT JOIN stofnanir s ON r.stofnun_id = s.id
LEFT JOIN birgjar b ON r.birgi_id = b.id
WHERE 
    r.tegund ~* '${patternStr}'${yearWhere}${minAmtWhere}${excludeInternalWhere}
ORDER BY r.upphaed DESC NULLS LAST
LIMIT 500;`,

      byCategory: `-- ==============================================================================
-- 2. SKIPTING EFTIR TEGUND RUKKUNAR (GROUP BY r.tegund)
-- Hvaða flokkar / tegundir taka til sín mest af styrkjum og framlögum?
-- ==============================================================================
SELECT 
    COALESCE(NULLIF(TRIM(r.tegund::text), ''), 'Ótilgreind tegund') AS tegund_rukkunar,
    COUNT(*) AS fjoldi_reikninga,
    SUM(r.upphaed)::numeric(18,2) AS heildarupphaed_kr,
    ROUND(AVG(r.upphaed))::numeric(18,2) AS medalupphaed_kr
FROM reikningar r
WHERE 
    r.tegund ~* '${patternStr}'${yearWhere}${minAmtWhere}${excludeInternalWhere}
GROUP BY 1
ORDER BY heildarupphaed_kr DESC;`,

      recipients: `-- ==============================================================================
-- 3. STÆRSTU VIÐTAKENDUR STYRKJA (Styrkþegar / Birgjar)
-- Hvaða aðilar, félög eða fyrirtæki fá mest greitt í styrki og framlög?
-- ==============================================================================
SELECT 
    COALESCE(NULLIF(TRIM(b.nafn::text), ''), 'Óskráður aðili #' || r.birgi_id::text) AS vidtakandi,
    COUNT(*) AS fjoldi_veitinga,
    SUM(r.upphaed)::numeric(18,2) AS heildarupphaed_kr,
    ROUND(AVG(r.upphaed))::numeric(18,2) AS medalupphaed_kr
FROM reikningar r
LEFT JOIN birgjar b ON r.birgi_id = b.id
WHERE 
    r.tegund ~* '${patternStr}'${yearWhere}${minAmtWhere}${excludeInternalWhere}
GROUP BY 1
ORDER BY heildarupphaed_kr DESC
LIMIT 100;`,

      payers: `-- ==============================================================================
-- 4. STÆRSTU GREIÐENDUR STYRKJA (Ráðuneyti og Ríkisstofnanir)
-- Hvaða stofnanir úthluta mestu fé í styrki og framlög?
-- ==============================================================================
SELECT 
    COALESCE(NULLIF(TRIM(s.nafn::text), ''), 'Óskráð stofnun #' || r.stofnun_id::text) AS greidandi_stofnun,
    COUNT(*) AS fjoldi_veitinga,
    SUM(r.upphaed)::numeric(18,2) AS heildarupphaed_kr,
    ROUND(AVG(r.upphaed))::numeric(18,2) AS medalupphaed_kr
FROM reikningar r
LEFT JOIN stofnanir s ON r.stofnun_id = s.id
WHERE 
    r.tegund ~* '${patternStr}'${yearWhere}${minAmtWhere}${excludeInternalWhere}
GROUP BY 1
ORDER BY heildarupphaed_kr DESC
LIMIT 50;`,

      annual: `-- ==============================================================================
-- 5. ÁRLEG ÞRÓUN STYRKJA OG FRAMLAGA (2017–2026)
-- Sýnir hvernig útgjöld ríkisins til styrkja og framlaga hafa þróast milli ára
-- ==============================================================================
SELECT 
    EXTRACT(YEAR FROM r.dags::timestamp)::int AS ar,
    COUNT(*) AS fjoldi_reikninga,
    COUNT(DISTINCT r.birgi_id) AS fjoldi_vidtakenda,
    COUNT(DISTINCT r.stofnun_id) AS fjoldi_stofnana,
    SUM(r.upphaed)::numeric(18,2) AS heildarupphaed_kr,
    ROUND(AVG(r.upphaed))::numeric(18,2) AS medalupphaed_kr
FROM reikningar r
WHERE 
    r.tegund ~* '${patternStr}'${excludeInternalWhere}
GROUP BY 1
ORDER BY ar DESC;`,

      index: `-- ==============================================================================
-- 6. FLÝTIVÍSAR (INDEXES) FYRIR HÁMARKSAFKOST Í POSTGRESQL 18
-- Koma í veg fyrir Full Table Scan (Seq Scan) á 18 milljón línum
-- ==============================================================================

-- A) Trigram vísir fyrir hraðvirka regex og ILIKE leit í tegund:
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_reikningar_tegund_trgm 
ON reikningar USING gin (tegund gin_trgm_ops);

-- B) Samsettur vísir fyrir hraðar tengingar og dagsetningar:
CREATE INDEX IF NOT EXISTS idx_reikningar_dags_stofnun_birgi 
ON reikningar (dags, stofnun_id, birgi_id);

-- C) Prófun á hraða með EXPLAIN ANALYZE:
EXPLAIN ANALYZE
SELECT r.id, r.upphaed, r.tegund 
FROM reikningar r 
WHERE r.tegund ~* '(styrk|framlag|framlög)' 
LIMIT 100;`
    };
  }, [activePattern, selectedYear, minAmount, excludeInternal]);

  const copySqlToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  // Filter sample rows by custom search if specified and internal transfer exclusion, then sort
  const filteredRows = useMemo(() => {
    if (!data?.sampleRows) return [];
    let rows = data.sampleRows;
    if (excludeInternal) {
      rows = rows.filter(r => !r.category.toLowerCase().includes('innbyrðis'));
    }
    if (customSearch.trim()) {
      const q = customSearch.toLowerCase();
      rows = rows.filter(r => 
        r.institution.toLowerCase().includes(q) ||
        r.supplier.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.invoiceNumber.toLowerCase().includes(q)
      );
    }

    return [...rows].sort((a, b) => {
      let comparison = 0;
      if (rowsSortField === 'date') {
        comparison = (a.date || '').localeCompare(b.date || '');
      } else if (rowsSortField === 'institution') {
        comparison = (a.institution || '').localeCompare(b.institution || '', 'is');
      } else if (rowsSortField === 'supplier') {
        comparison = (a.supplier || '').localeCompare(b.supplier || '', 'is');
      } else if (rowsSortField === 'category') {
        comparison = (a.category || '').localeCompare(b.category || '', 'is');
      } else if (rowsSortField === 'invoiceNumber') {
        comparison = (a.invoiceNumber || '').localeCompare(b.invoiceNumber || '');
      } else if (rowsSortField === 'amount') {
        comparison = a.amount - b.amount;
      }
      return rowsSortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data?.sampleRows, customSearch, excludeInternal, rowsSortField, rowsSortDirection]);

  // Categories filtered by internal transfer exclusion and sorted
  const visibleCategories = useMemo(() => {
    if (!data?.byCategory) return [];
    let cats = excludeInternal 
      ? data.byCategory.filter(c => !c.category.toLowerCase().includes('innbyrðis'))
      : data.byCategory;
    
    return [...cats].sort((a, b) => {
      let comparison = 0;
      const total = data?.summary?.totalAmount || 1;
      const aAvg = a.count > 0 ? a.totalAmount / a.count : 0;
      const bAvg = b.count > 0 ? b.totalAmount / b.count : 0;
      const aPct = a.totalAmount / total;
      const bPct = b.totalAmount / total;

      if (categoriesSortField === 'category') {
        comparison = a.category.localeCompare(b.category, 'is');
      } else if (categoriesSortField === 'count') {
        comparison = a.count - b.count;
      } else if (categoriesSortField === 'avg') {
        comparison = aAvg - bAvg;
      } else if (categoriesSortField === 'totalAmount') {
        comparison = a.totalAmount - b.totalAmount;
      } else if (categoriesSortField === 'pct') {
        comparison = aPct - bPct;
      }
      return categoriesSortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data?.byCategory, excludeInternal, data?.summary?.totalAmount, categoriesSortField, categoriesSortDirection]);

  // Sorted Top Recipients
  const sortedRecipients = useMemo(() => {
    if (!data?.topRecipients) return [];
    return [...data.topRecipients].sort((a, b) => {
      let comparison = 0;
      const aAvg = a.count > 0 ? a.totalAmount / a.count : 0;
      const bAvg = b.count > 0 ? b.totalAmount / b.count : 0;

      if (recipientsSortField === 'recipient') {
        comparison = a.recipient.localeCompare(b.recipient, 'is');
      } else if (recipientsSortField === 'count') {
        comparison = a.count - b.count;
      } else if (recipientsSortField === 'avg') {
        comparison = aAvg - bAvg;
      } else if (recipientsSortField === 'totalAmount') {
        comparison = a.totalAmount - b.totalAmount;
      }
      return recipientsSortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data?.topRecipients, recipientsSortField, recipientsSortDirection]);

  // Sorted Top Payers
  const sortedPayers = useMemo(() => {
    if (!data?.topPayers) return [];
    return [...data.topPayers].sort((a, b) => {
      let comparison = 0;
      const aAvg = a.count > 0 ? a.totalAmount / a.count : 0;
      const bAvg = b.count > 0 ? b.totalAmount / b.count : 0;

      if (payersSortField === 'payer') {
        comparison = a.payer.localeCompare(b.payer, 'is');
      } else if (payersSortField === 'count') {
        comparison = a.count - b.count;
      } else if (payersSortField === 'avg') {
        comparison = aAvg - bAvg;
      } else if (payersSortField === 'totalAmount') {
        comparison = a.totalAmount - b.totalAmount;
      }
      return payersSortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data?.topPayers, payersSortField, payersSortDirection]);

  // Export CSV
  const handleExportCsv = () => {
    if (!filteredRows || filteredRows.length === 0) return;
    const headers = ['ID', 'Reikningsnumer', 'Dags', 'Stofnun', 'Vidtakandi', 'Tegund', 'Upphaed_ISK'];
    const csvContent = [
      headers.join(';'),
      ...filteredRows.map(r => [
        r.id,
        `"${r.invoiceNumber}"`,
        r.date ? r.date.substring(0, 10) : '',
        `"${r.institution.replace(/"/g, '""')}"`,
        `"${r.supplier.replace(/"/g, '""')}"`,
        `"${r.category.replace(/"/g, '""')}"`,
        Math.round(r.amount)
      ].join(';'))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `styrkir_rikissjods_${selectedYear}_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Umbrella Grouping Logic ("Setja undir einn hatt")
  const umbrellaGroups = useMemo(() => {
    if (!data?.topRecipients) return [];

    const defs = [
      {
        id: 'markadsstofur',
        title: 'Markaðsstofur landshlutanna & Ferðamál (ses)',
        badge: 'Ferðaiðnaður skilar mestu í skatttekjur',
        iconEmoji: '🏖️',
        colorClass: {
          bg: 'bg-amber-50/70',
          border: 'border-amber-300',
          text: 'text-amber-950',
          badgeBg: 'bg-amber-100',
          badgeText: 'text-amber-900 border border-amber-300'
        },
        description: 'Sjálfseignarstofnanir (ses) reknar í samvinnu ríkis, sveitarfélaga og ferðaþjónustufyrirtækja til kynningar og markaðssetningar í öllum landshlutum.',
        whyImportant: 'Ferðaþjónustan er ein helsta tekjulind þjóðarbúsins í gjaldeyri og sköttum. Samstarf markaðsstofanna tryggir jafnari dreifingu ferðamanna um land allt og styður við atvinnulíf á landsbyggðinni.',
        matcher: (name: string) => {
          const n = name.toLowerCase();
          return (
            n.includes('markaðsstof') ||
            n.includes('visit ') ||
            (n.includes('ferðamál') && !n.includes('ráðuneyti')) ||
            n.includes('ferðafélag') ||
            n.includes('hæfnisetur ferðaþjónustunnar')
          );
        }
      },
      {
        id: 'sveitarfelog',
        title: 'Sambönd & Samtök sveitarfélaga',
        badge: 'Sveitarstjórnarstig & Byggðamál',
        iconEmoji: '🏛️',
        colorClass: {
          bg: 'bg-blue-50/70',
          border: 'border-blue-300',
          text: 'text-blue-950',
          badgeBg: 'bg-blue-100',
          badgeText: 'text-blue-900 border border-blue-300'
        },
        description: 'Samstarfsvettvangur og landshlutasamtök sveitarfélaga (t.d. Samband íslenskra sveitarfélaga, SASS, SSV, SSS, SSNV, Eyþing).',
        whyImportant: 'Samhæfir opinbera þjónustu, skóla-, félags- og skipulagsmál milli ríkis og sveitarfélaga.',
        matcher: (name: string) => {
          const n = name.toLowerCase();
          return (
            n.includes('samband íslenskra sveitarfélaga') ||
            n.includes('samband sveitarfélaga') ||
            n.includes('samtök sveitarfélaga') ||
            n.includes('landshlutasamtök') ||
            n.includes('byggðasamlag') ||
            n.includes('eyþing') ||
            n.includes('héraðsnefnd') ||
            (n.includes('sveitarfélag') && !n.includes('ráðuneyti'))
          );
        }
      },
      {
        id: 'ehf',
        title: 'Einkahlutafélög (ehf) - Nýsköpun & Tækniþróun',
        badge: 'Einkageiri & Tækniþróunarsjóður',
        iconEmoji: '🏢',
        colorClass: {
          bg: 'bg-emerald-50/70',
          border: 'border-emerald-300',
          text: 'text-emerald-950',
          badgeBg: 'bg-emerald-100',
          badgeText: 'text-emerald-900 border border-emerald-300'
        },
        description: 'Einkahlutafélög sem hljóta tækniþróunarstyrki, nýsköpunarframlög eða samkeppnisstyrki úr opinberum sjóðum (t.d. Tækniþróunarsjóði, Rannís).',
        whyImportant: 'Hvetur til nýsköpunar, rannsókna og atvinnuuppbyggingar í íslensku hugvits- og tæknisamfélagi.',
        matcher: (name: string) => {
          return /\b(ehf|ehf\.)\b/i.test(name) || name.trim().endsWith(' ehf') || name.trim().endsWith(' ehf.');
        }
      },
      {
        id: 'ses',
        title: 'Aðrar sjálfseignarstofnanir (ses)',
        badge: 'Sjálfseignarstofnanir (án hagnaðar)',
        iconEmoji: '📜',
        colorClass: {
          bg: 'bg-purple-50/70',
          border: 'border-purple-300',
          text: 'text-purple-950',
          badgeBg: 'bg-purple-100',
          badgeText: 'text-purple-900 border border-purple-300'
        },
        description: 'Sjálfstæðar stofnanir og sjálfseignarstofnanir sem starfa án hagnaðarmarkmiða á sviði menntunar, samfélagsmála og þjónustu.',
        whyImportant: 'Sjálfstæð félagaform sem gæta almannahagsmuna og vinna að mikilvægum samfélagslegum verkefnum.',
        matcher: (name: string) => {
          const n = name.toLowerCase();
          return (
            (/\b(ses|s\.e\.s\.)\b/i.test(name) || n.includes('sjálfseignarstofnun')) &&
            !n.includes('markaðsstof')
          );
        }
      },
      {
        id: 'haskolar',
        title: 'Háskólar, Rannsóknir & Vísindasjóðir',
        badge: 'Vísindi & Háskólastig',
        iconEmoji: '🎓',
        colorClass: {
          bg: 'bg-indigo-50/70',
          border: 'border-indigo-300',
          text: 'text-indigo-950',
          badgeBg: 'bg-indigo-100',
          badgeText: 'text-indigo-900 border border-indigo-300'
        },
        description: 'Rannís (Rannsóknamiðstöð Íslands), Háskóli Íslands, Háskólinn í Reykjavík, Tilraunastöðvar og vísindasjóðir.',
        whyImportant: 'Fjárfesting í rannsóknum, háskólamenntun og tækniþekkingu framtíðarinnar.',
        matcher: (name: string) => {
          const n = name.toLowerCase();
          return (
            n.includes('háskól') ||
            n.includes('rannís') ||
            n.includes('rannsókn') ||
            n.includes('vísinda') ||
            n.includes('tilraunastöð') ||
            n.includes('hafrannsókn')
          );
        }
      },
      {
        id: 'menning',
        title: 'Menning, Leiklist & Kvikmyndir',
        badge: 'Listir & Menningararfur',
        iconEmoji: '🎭',
        colorClass: {
          bg: 'bg-rose-50/70',
          border: 'border-rose-300',
          text: 'text-rose-950',
          badgeBg: 'bg-rose-100',
          badgeText: 'text-rose-900 border border-rose-300'
        },
        description: 'Kvikmyndasjóður Íslands, leikhús, sinfóníuhljómsveitir, listamannalaun og menningarhátíðir.',
        whyImportant: 'Styður við íslenska tungu, listsköpun, menningararf og kvikmyndagerð.',
        matcher: (name: string) => {
          const n = name.toLowerCase();
          return (
            n.includes('kvikmynd') ||
            n.includes('leikfélag') ||
            n.includes('leikhús') ||
            n.includes('sinfóníu') ||
            n.includes('listahátíð') ||
            n.includes('listamann') ||
            n.includes('myndlist') ||
            n.includes('tónlist')
          );
        }
      },
      {
        id: 'felagasamtok',
        title: 'Félagasamtök, Hjálpar- og Íþróttastarf',
        badge: 'Líknar- & Almannavarnir',
        iconEmoji: '🤝',
        colorClass: {
          bg: 'bg-teal-50/70',
          border: 'border-teal-300',
          text: 'text-teal-950',
          badgeBg: 'bg-teal-100',
          badgeText: 'text-teal-900 border border-teal-300'
        },
        description: 'Rauði krossinn, Slysavarnafélagið Landsbjörg, ÍSÍ, Bændasamtökin, björgunarsveitir og líknarfélög.',
        whyImportant: 'Ómetanlegt sjálfboðastarf, björgunarþjónusta, íþróttauppeldi og mannúðaraðstoð um allt land.',
        matcher: (name: string) => {
          const n = name.toLowerCase();
          return (
            n.includes('rauði kross') ||
            n.includes('landsbjörg') ||
            n.includes('ísí') ||
            n.includes('ungmenna') ||
            n.includes('bændasamtök') ||
            n.includes('hjálpræðis') ||
            n.includes('mæðrastyrks') ||
            n.includes('öryrkja') ||
            n.includes('þroskahjálp') ||
            n.includes('blindrafélag') ||
            n.includes('krabbamein') ||
            n.includes('björgun')
          );
        }
      }
    ];

    const groupsMap = new Map<string, {
      def: typeof defs[0];
      entities: GrantRecipientBreakdown[];
      totalAmount: number;
      totalCount: number;
    }>();

    for (const def of defs) {
      groupsMap.set(def.id, {
        def,
        entities: [],
        totalAmount: 0,
        totalCount: 0
      });
    }

    const otherEntities: GrantRecipientBreakdown[] = [];
    let otherAmount = 0;
    let otherCount = 0;

    for (const rec of data.topRecipients) {
      let matched = false;
      for (const def of defs) {
        if (def.matcher(rec.recipient)) {
          const g = groupsMap.get(def.id)!;
          g.entities.push(rec);
          g.totalAmount += rec.totalAmount;
          g.totalCount += rec.count;
          matched = true;
          break;
        }
      }
      if (!matched) {
        otherEntities.push(rec);
        otherAmount += rec.totalAmount;
        otherCount += rec.count;
      }
    }

    const totalGrants = data.summary.totalAmount || 1;

    const result = Array.from(groupsMap.values())
      .filter(g => g.entities.length > 0)
      .map(g => ({
        id: g.def.id,
        title: g.def.title,
        badge: g.def.badge,
        iconEmoji: g.def.iconEmoji,
        colorClass: g.def.colorClass,
        description: g.def.description,
        whyImportant: g.def.whyImportant,
        entities: g.entities.sort((a, b) => b.totalAmount - a.totalAmount),
        totalAmount: g.totalAmount,
        totalCount: g.totalCount,
        pctOfTotal: ((g.totalAmount / totalGrants) * 100).toFixed(1)
      }));

    if (otherEntities.length > 0) {
      result.push({
        id: 'adra',
        title: 'Aðrir viðtakendur styrkja',
        badge: 'Aðrir aðilar og félög',
        iconEmoji: '🌐',
        colorClass: {
          bg: 'bg-neutral-50/70',
          border: 'border-neutral-300',
          text: 'text-neutral-950',
          badgeBg: 'bg-neutral-100',
          badgeText: 'text-neutral-800 border border-neutral-300'
        },
        description: 'Aðrir viðtakendur sem falla ekki undir skilgreinda meginhatta.',
        whyImportant: '',
        entities: otherEntities.sort((a, b) => b.totalAmount - a.totalAmount),
        totalAmount: otherAmount,
        totalCount: otherCount,
        pctOfTotal: ((otherAmount / totalGrants) * 100).toFixed(1)
      });
    }

    return result.sort((a, b) => b.totalAmount - a.totalAmount);
  }, [data?.topRecipients, data?.summary.totalAmount]);

  const toggleHatExpansion = (hatId: string) => {
    setExpandedHats(prev => {
      const next = new Set(prev);
      if (next.has(hatId)) next.delete(hatId);
      else next.add(hatId);
      return next;
    });
  };

  const toggleAllHats = (expand: boolean) => {
    if (expand) {
      setExpandedHats(new Set(umbrellaGroups.map(g => g.id)));
    } else {
      setExpandedHats(new Set());
    }
  };

  const inspectRecipientInRows = (recipientName: string) => {
    setCustomSearch(recipientName);
    setDataView('rows');
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Context */}
      <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-black uppercase tracking-tight text-neutral-900">
                Greining á Styrkjum, Framlögum og Gefins Fé úr Ríkissjóði
              </h2>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                Leitað í dálknum: tegund (tegund rukkunar)
              </span>
            </div>
            <p className="text-xs text-neutral-600 max-w-3xl leading-relaxed">
              Hér eru dregnar fram allar greiðslur úr ríkissjóði þar sem ekki er um hefðbundin vöru- eða þjónustukaup að ræða heldur 
              <strong> styrki, rekstrarframlög, rannsóknarstyrki, niðurgreiðslur, úthlutanir, gjafir og verðlaun</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={loadGrantsData}
              disabled={loading}
              className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Hourglass className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  <span>Sækir gögn úr gagnagrunni með tímaglasi...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Endurnýja gögn</span>
                </>
              )}
            </button>
            {data?.latencyMs !== undefined && (
              <span className="text-[11px] font-mono text-neutral-500 bg-neutral-100 px-2 py-1 rounded border border-neutral-200">
                ⚡ {data.latencyMs} ms
              </span>
            )}
          </div>
        </div>

        {/* Keyword Filter Badges (Tegundar-síur) */}
        <div className="mt-4 pt-4 border-t border-neutral-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-neutral-500" />
              Leitarorð í dálknum „tegund“ (RegEx skilyrði):
            </span>
            <div className="flex items-center gap-2 text-[11px]">
              <button 
                onClick={() => selectAllTags(true)} 
                className="text-blue-600 hover:underline cursor-pointer font-medium"
              >
                Velja öll
              </button>
              <span className="text-neutral-300">•</span>
              <button 
                onClick={() => selectAllTags(false)} 
                className="text-neutral-500 hover:underline cursor-pointer font-medium"
              >
                Hreinsa
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {keywordTags.map(tag => (
              <button
                key={tag.id}
                onClick={() => toggleKeywordTag(tag.id)}
                title={tag.description}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition flex items-center gap-1.5 cursor-pointer border ${
                  tag.selected
                    ? 'bg-amber-50 text-amber-900 border-amber-300 font-bold shadow-xs'
                    : 'bg-neutral-50 text-neutral-400 border-neutral-200 hover:bg-neutral-100'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${tag.selected ? 'bg-amber-500' : 'bg-neutral-300'}`} />
                <span>{tag.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Trigram GIN Index Status & Optimization Banner */}
      {indexStatus?.hasIndex ? (
        <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 text-emerald-950 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 border border-emerald-300 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-emerald-900">
                  ⚡ Trigram GIN vísir er VIRKUR í PostgreSQL ({indexStatus.indexName || 'idx_reikningar_tegund_trgm'})
                </span>
                <span className="bg-emerald-200 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Hámarkshraði
                </span>
              </div>
              <p className="text-xs text-emerald-800 mt-0.5">
                Leit að styrkjum og ríkisframlögum fer beint í GIN vísi í minni. Engin þörf á að skanna 18 milljónir lína af diski.
              </p>
            </div>
          </div>
          <button
            onClick={refreshIndexStatus}
            className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-lg text-xs font-bold transition border border-emerald-300 cursor-pointer shrink-0"
          >
            Endurkanna vísi
          </button>
        </div>
      ) : (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 text-amber-950 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-200 border border-amber-300 flex items-center justify-center shrink-0 mt-0.5">
              <AlertCircle className="w-6 h-6 text-amber-900" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-sm text-amber-950">
                  ⚠️ Trigram GIN vísir er EKKI til staðar á gagnagrunninum (Full Table Scan)
                </span>
                <span className="bg-amber-200 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Þess vegna tekur leitin langan tíma!
                </span>
              </div>
              <p className="text-xs text-amber-900 max-w-3xl leading-relaxed">
                Án vísis þarf PostgreSQL að lesa allar <strong>18 milljónir raðirnar</strong> af harða disknum í hvert sinn sem leitað er í <code>tegund</code>. 
                Með því að búa til GIN vísi með <code>pg_trgm</code> finnur gagnagrunnurinn styrkina á <strong>undir 0,1 sekúndu</strong> í stað 30–60 sekúndna!
              </p>
              {indexMessage && (
                <div className="mt-2 text-xs font-bold px-3 py-2 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-2">
                  <Info className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>{indexMessage}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              onClick={handleCreateIndex}
              disabled={indexLoading}
              className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-black shadow-md flex items-center gap-2 cursor-pointer transition disabled:opacity-50"
            >
              {indexLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                  <span>Byggi vísi á 18M línum...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>⚡ Búa til Trigram vísi núna (One-Click)</span>
                </>
              )}
            </button>
            <button
              onClick={() => setSqlTab('index')}
              className="px-3 py-2 bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300 rounded-lg text-xs font-bold transition cursor-pointer"
            >
              Skoða SQL skipun
            </button>
          </div>
        </div>
      )}

      {/* 2. SQL Query Viewer & Copy Box */}
      <div className="bg-neutral-900 text-neutral-200 p-5 rounded-xl border border-neutral-800 shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
              Gagnagrunnsskipun (PostgreSQL SQL)
            </span>
            <span className="text-[10px] text-neutral-400 font-mono">
              [reikningar.tegund ~* &apos;{activePattern}&apos;]
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => copySqlToClipboard(sqlCommands[sqlTab])}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                copiedSql
                  ? 'bg-emerald-500 text-white'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700'
              }`}
            >
              {copiedSql ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Afritað í klemmuspjald!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Afrita SQL skipun</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Sub-tabs for SQL commands */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs pt-1">
          <button
            onClick={() => setSqlTab('hats')}
            className={`px-2.5 py-1 rounded text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
              sqlTab === 'hats'
                ? 'bg-amber-600 text-white font-black'
                : 'bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            <span>🤝 Hattaflokkun (CASE WHEN)</span>
          </button>
          <button
            onClick={() => setSqlTab('single')}
            className={`px-2.5 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
              sqlTab === 'single'
                ? 'bg-emerald-600 text-white'
                : 'bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            1. Stakir reikningar (Yfirlit)
          </button>
          <button
            onClick={() => setSqlTab('byCategory')}
            className={`px-2.5 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
              sqlTab === 'byCategory'
                ? 'bg-emerald-600 text-white'
                : 'bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            2. Skipting eftir tegund rukkunar
          </button>
          <button
            onClick={() => setSqlTab('recipients')}
            className={`px-2.5 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
              sqlTab === 'recipients'
                ? 'bg-emerald-600 text-white'
                : 'bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            3. Stærstu viðtakendur (Styrkþegar)
          </button>
          <button
            onClick={() => setSqlTab('payers')}
            className={`px-2.5 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
              sqlTab === 'payers'
                ? 'bg-emerald-600 text-white'
                : 'bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            4. Stærstu veitendur (Stofnanir)
          </button>
          <button
            onClick={() => setSqlTab('annual')}
            className={`px-2.5 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
              sqlTab === 'annual'
                ? 'bg-emerald-600 text-white'
                : 'bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            5. Árleg þróun (2017–2026)
          </button>
          <button
            onClick={() => setSqlTab('index')}
            className={`px-2.5 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
              sqlTab === 'index'
                ? 'bg-emerald-600 text-white'
                : 'bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            ⚡ Vísar (GIN / Trigram Index)
          </button>
        </div>

        {/* Code display area */}
        <pre className="p-3.5 bg-neutral-950 rounded-lg text-emerald-400 font-mono text-xs overflow-x-auto max-h-60 leading-relaxed border border-neutral-800 select-all">
          {sqlCommands[sqlTab]}
        </pre>
      </div>

      {/* 3. KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
          <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
            Heildarupphæð í styrkjum &amp; framlögum
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-700 mt-1 font-mono">
            {data ? stuttTala(data.summary.totalAmount) : '—'}
          </div>
          <div className="text-[11px] text-neutral-500 font-mono mt-0.5">
            {data ? `${formaTolu(Math.round(data.summary.totalAmount))} kr.` : 'Sæki gögn...'}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
          <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
            Fjöldi reikninga / færslna
          </div>
          <div className="text-xl sm:text-2xl font-black text-neutral-900 mt-1 font-mono">
            {data ? formaTolu(data.summary.invoiceCount) : '—'}
          </div>
          <div className="text-[11px] text-neutral-500 mt-0.5">
            Færslur með styrkjatengda tegund
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
          <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
            Viðtakendur (Styrkþegar / Birgjar)
          </div>
          <div className="text-xl sm:text-2xl font-black text-neutral-900 mt-1 font-mono">
            {data ? formaTolu(data.summary.supplierCount) : '—'}
          </div>
          <div className="text-[11px] text-neutral-500 mt-0.5">
            Félagasamtök, einstaklingar og fyrirtæki
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
          <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
            Veitendur (Ríkisstofnanir)
          </div>
          <div className="text-xl sm:text-2xl font-black text-neutral-900 mt-1 font-mono">
            {data ? formaTolu(data.summary.institutionCount) : '—'}
          </div>
          <div className="text-[11px] text-neutral-500 mt-0.5">
            Ráðuneyti, sjóðir og ríkisstofnanir
          </div>
        </div>
      </div>

      {/* 4. Filter Toolbar & Subview Toggles */}
      <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Year selector */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-bold text-neutral-700">Ártal:</span>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(e.target.value)}
                className="px-2.5 py-1.5 bg-neutral-50 border border-neutral-300 rounded-lg text-xs font-bold text-neutral-800 cursor-pointer"
              >
                <option value="all">🌟 Öll ár (2017–2026)</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
                <option value="2021">2021</option>
                <option value="2020">2020</option>
                <option value="2019">2019</option>
                <option value="2018">2018</option>
                <option value="2017">2017</option>
              </select>
            </div>

            {/* Minimum amount selector */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-bold text-neutral-700">Lágmarksupphæð:</span>
              <select
                value={minAmount}
                onChange={e => setMinAmount(parseInt(e.target.value, 10))}
                className="px-2.5 py-1.5 bg-neutral-50 border border-neutral-300 rounded-lg text-xs font-bold text-neutral-800 cursor-pointer"
              >
                <option value="0">Allar upphæðir</option>
                <option value="1000000">&gt; 1 milljón kr.</option>
                <option value="10000000">&gt; 10 milljónir kr.</option>
                <option value="50000000">&gt; 50 milljónir kr.</option>
                <option value="100000000">&gt; 100 milljónir kr.</option>
              </select>
            </div>

            {/* Quick text filter */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={customSearch}
                onChange={e => setCustomSearch(e.target.value)}
                placeholder="Sía í niðurstöðum..."
                className="pl-8 pr-3 py-1 bg-neutral-50 border border-neutral-300 rounded-lg text-xs w-44 focus:w-60 transition-all text-neutral-900"
              />
            </div>

            {/* Exclude internal state transfers toggle */}
            <label 
              title="Tekur út 'Innbyrðis framlög milli A-hluta stofnana' þar sem um er að ræða millifærslur milli ríkisstofnana en ekki raunverulega styrki eða framlög til samfélagsins."
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer select-none border ${
                excludeInternal 
                  ? 'bg-amber-50 text-amber-950 border-amber-300' 
                  : 'bg-neutral-50 text-neutral-600 border-neutral-300 hover:bg-neutral-100'
              }`}
            >
              <input
                type="checkbox"
                checked={excludeInternal}
                onChange={e => setExcludeInternal(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer accent-amber-600"
              />
              <span>Útiloka innbyrðis framlög (A-hluti)</span>
            </label>
          </div>

          {/* View Mode Buttons */}
          <div className="flex items-center gap-2">
            <div className="flex items-center p-0.5 bg-neutral-100 rounded-lg border border-neutral-200 text-xs font-bold flex-wrap">
              <button
                onClick={() => setDataView('hats')}
                className={`px-3 py-1.5 rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                  dataView === 'hats'
                    ? 'bg-amber-600 text-white shadow-xs font-black'
                    : 'text-neutral-700 hover:text-neutral-900'
                }`}
              >
                <span>🤝 Samstarf &amp; Hattar</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  dataView === 'hats' ? 'bg-amber-700 text-white' : 'bg-neutral-200 text-neutral-800'
                }`}>
                  {umbrellaGroups.length}
                </span>
              </button>
              <button
                onClick={() => setDataView('recipients')}
                className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                  dataView === 'recipients'
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Stærstu viðtakendur ({data?.topRecipients.length || 0})
              </button>
              <button
                onClick={() => setDataView('categories')}
                className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                  dataView === 'categories'
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Tegundir rukkunar ({data?.byCategory.length || 0})
              </button>
              <button
                onClick={() => setDataView('rows')}
                className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                  dataView === 'rows'
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Stakar færslur ({filteredRows.length})
              </button>
              <button
                onClick={() => setDataView('payers')}
                className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                  dataView === 'payers'
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Stærstu stofnanir ({data?.topPayers.length || 0})
              </button>
            </div>

            <button
              onClick={handleExportCsv}
              title="Flytja út í CSV"
              className="p-1.5 bg-white border border-neutral-200 hover:bg-neutral-50 rounded-lg text-neutral-700 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. Data View Tables */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
        {/* VIEW 0: Umbrella Groups / "Undir einn hatt" (Accordion with Chevron Arrows) */}
        {dataView === 'hats' && (
          <div className="p-4 sm:p-5 space-y-4">
            {/* Top info and bulk expand/collapse controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-200">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-neutral-900 flex items-center gap-1.5">
                    <span>🤝 Samstarf og Hattaflokkun Styrkþega</span>
                  </h3>
                  <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-300">
                    {umbrellaGroups.length} meginflokkar
                  </span>
                </div>
                <p className="text-xs text-neutral-600">
                  Hér eru samstarfsverkefni dregin saman <strong>undir einn hatt</strong> (t.d. Markaðsstofur ses, Sambönd sveitarfélaga og ehf fyrirtæki). Smelltu á örina eða línuna til að opna fellilistann.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => toggleAllHats(true)}
                  className="px-2.5 py-1 text-xs font-bold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-md transition cursor-pointer"
                >
                  Opna alla hatta
                </button>
                <button
                  type="button"
                  onClick={() => toggleAllHats(false)}
                  className="px-2.5 py-1 text-xs font-bold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-md transition cursor-pointer"
                >
                  Loka öllum
                </button>
              </div>
            </div>

            {/* List of Hats (Accordion Cards) */}
            <div className="space-y-3">
              {umbrellaGroups.map((group) => {
                const isExpanded = expandedHats.has(group.id);
                const avgAmount = group.totalCount > 0 ? group.totalAmount / group.totalCount : 0;

                // Filter entities in this group if user is searching, and apply hats sorting
                const rawEntities = customSearch.trim()
                  ? group.entities.filter(e => e.recipient.toLowerCase().includes(customSearch.toLowerCase()))
                  : group.entities;

                const visibleEntities = [...rawEntities].sort((a, b) => {
                  let comparison = 0;
                  const aAvg = a.count > 0 ? a.totalAmount / a.count : 0;
                  const bAvg = b.count > 0 ? b.totalAmount / b.count : 0;
                  const aPct = group.totalAmount > 0 ? a.totalAmount / group.totalAmount : 0;
                  const bPct = group.totalAmount > 0 ? b.totalAmount / group.totalAmount : 0;

                  if (hatsSortField === 'recipient') {
                    comparison = a.recipient.localeCompare(b.recipient, 'is');
                  } else if (hatsSortField === 'count') {
                    comparison = a.count - b.count;
                  } else if (hatsSortField === 'avg') {
                    comparison = aAvg - bAvg;
                  } else if (hatsSortField === 'totalAmount') {
                    comparison = a.totalAmount - b.totalAmount;
                  } else if (hatsSortField === 'pct') {
                    comparison = aPct - bPct;
                  }
                  return hatsSortDirection === 'asc' ? comparison : -comparison;
                });

                if (customSearch.trim() && visibleEntities.length === 0) {
                  return null; // hide groups with 0 matches when searching
                }

                return (
                  <div 
                    key={group.id} 
                    className={`rounded-xl border transition-all duration-200 overflow-hidden shadow-xs ${
                      isExpanded 
                        ? `${group.colorClass.border} bg-white shadow-sm ring-1 ring-neutral-200` 
                        : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50/50'
                    }`}
                  >
                    {/* Header Row (Clickable Accordion) */}
                    <div 
                      onClick={() => toggleHatExpansion(group.id)}
                      className="p-3.5 sm:p-4 cursor-pointer select-none flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          aria-label={isExpanded ? 'Fela lista' : 'Opna lista'}
                          className="w-8 h-8 rounded-lg bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center shrink-0 transition text-neutral-700 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleHatExpansion(group.id);
                          }}
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5 text-neutral-900 transition-transform" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-neutral-500 transition-transform" />
                          )}
                        </button>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-lg">{group.iconEmoji}</span>
                            <span className="font-black text-sm text-neutral-900">
                              {group.title}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${group.colorClass.badgeBg} ${group.colorClass.badgeText}`}>
                              {group.badge}
                            </span>
                            <span className="text-[11px] font-mono font-bold text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded">
                              {group.entities.length} {group.entities.length === 1 ? 'aðili' : 'aðilar'}
                            </span>
                          </div>

                          <p className="text-xs text-neutral-600 line-clamp-1 max-w-2xl">
                            {group.description}
                          </p>
                        </div>
                      </div>

                      {/* Right side stats & toggle button */}
                      <div className="flex items-center gap-4 shrink-0 sm:pl-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-neutral-100 justify-between sm:justify-end">
                        <div className="text-left sm:text-right font-mono">
                          <div className="text-sm font-black text-neutral-900">
                            {stuttTala(group.totalAmount)}
                          </div>
                          <div className="text-[10px] text-neutral-500 font-semibold">
                            {formaTolu(group.totalCount)} færslur • {group.pctOfTotal}%
                          </div>
                        </div>

                        <div className="w-16 hidden md:block">
                          <div className="w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className="bg-amber-600 h-1.5 rounded-full" 
                              style={{ width: `${Math.min(parseFloat(group.pctOfTotal) * 2, 100)}%` }} 
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          className="text-xs font-bold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 px-3 py-1.5 rounded-lg transition shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleHatExpansion(group.id);
                          }}
                        >
                          {isExpanded ? 'Fela lista ▲' : 'Sýna lista ▼'}
                        </button>
                      </div>
                    </div>

                    {/* EXPANDED CONTENT AREA (When user clicks chevron or row) */}
                    {isExpanded && (
                      <div className="border-t border-neutral-200 bg-neutral-50/70 p-3.5 sm:p-5 space-y-4">
                        {/* Explanatory context highlight box (especially for Markaðsstofur / Sveitarfélög / ehf) */}
                        {group.whyImportant && (
                          <div className={`p-3.5 rounded-xl border ${group.colorClass.bg} ${group.colorClass.border} flex items-start gap-3 text-xs leading-relaxed`}>
                            <Info className="w-4 h-4 text-neutral-700 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-neutral-900">Mikilvægi samstarfsins: </span>
                              <span className="text-neutral-800">{group.whyImportant}</span>
                            </div>
                          </div>
                        )}

                        {/* Nested Sub-Table of Entities */}
                        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-xs">
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left border-collapse">
                              <thead>
                                <tr className="bg-neutral-100 border-b border-neutral-200 text-[11px] font-bold text-neutral-700 uppercase">
                                  <th className="p-3 w-8">#</th>
                                  <th 
                                    className="p-3 cursor-pointer hover:bg-neutral-200 transition select-none"
                                    onClick={() => handleHatsSort('recipient')}
                                  >
                                    <div className="flex items-center gap-1.5">
                                      <span>Aðili / Styrkþegi innan þessa hatts</span>
                                      {hatsSortField === 'recipient' ? (
                                        hatsSortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-amber-700 font-bold" /> : <ArrowDown className="w-3.5 h-3.5 text-amber-700 font-bold" />
                                      ) : (
                                        <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
                                      )}
                                    </div>
                                  </th>
                                  <th 
                                    className="p-3 text-right cursor-pointer hover:bg-neutral-200 transition select-none"
                                    onClick={() => handleHatsSort('count')}
                                  >
                                    <div className="flex items-center justify-end gap-1.5">
                                      <span>Fjöldi veitinga</span>
                                      {hatsSortField === 'count' ? (
                                        hatsSortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-amber-700 font-bold" /> : <ArrowDown className="w-3.5 h-3.5 text-amber-700 font-bold" />
                                      ) : (
                                        <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
                                      )}
                                    </div>
                                  </th>
                                  <th 
                                    className="p-3 text-right cursor-pointer hover:bg-neutral-200 transition select-none"
                                    onClick={() => handleHatsSort('avg')}
                                  >
                                    <div className="flex items-center justify-end gap-1.5">
                                      <span>Meðalupphæð</span>
                                      {hatsSortField === 'avg' ? (
                                        hatsSortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-amber-700 font-bold" /> : <ArrowDown className="w-3.5 h-3.5 text-amber-700 font-bold" />
                                      ) : (
                                        <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
                                      )}
                                    </div>
                                  </th>
                                  <th 
                                    className="p-3 text-right cursor-pointer hover:bg-neutral-200 transition select-none"
                                    onClick={() => handleHatsSort('totalAmount')}
                                  >
                                    <div className="flex items-center justify-end gap-1.5">
                                      <span>Heildarupphæð kr.</span>
                                      {hatsSortField === 'totalAmount' ? (
                                        hatsSortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-amber-700 font-bold" /> : <ArrowDown className="w-3.5 h-3.5 text-amber-700 font-bold" />
                                      ) : (
                                        <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
                                      )}
                                    </div>
                                  </th>
                                  <th 
                                    className="p-3 text-right cursor-pointer hover:bg-neutral-200 transition select-none"
                                    onClick={() => handleHatsSort('pct')}
                                  >
                                    <div className="flex items-center justify-end gap-1.5">
                                      <span>Hlutfall af hattinum</span>
                                      {hatsSortField === 'pct' ? (
                                        hatsSortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-amber-700 font-bold" /> : <ArrowDown className="w-3.5 h-3.5 text-amber-700 font-bold" />
                                      ) : (
                                        <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
                                      )}
                                    </div>
                                  </th>
                                  <th className="p-3 text-center">Aðgerð</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-neutral-200">
                                {visibleEntities.map((ent, idx) => {
                                  const entAvg = ent.count > 0 ? ent.totalAmount / ent.count : 0;
                                  const pctOfHat = group.totalAmount > 0 
                                    ? ((ent.totalAmount / group.totalAmount) * 100).toFixed(1) 
                                    : '0';

                                  return (
                                    <tr key={`${ent.recipient}-${idx}`} className="hover:bg-amber-50/40 transition">
                                      <td className="p-3 font-mono text-neutral-400 text-[11px]">
                                        {idx + 1}.
                                      </td>
                                      <td className="p-3 font-black text-neutral-900">
                                        <div className="flex items-center gap-2">
                                          <span>{ent.recipient}</span>
                                          {ent.recipient.toLowerCase().includes('ses') && (
                                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 border border-purple-200">
                                              ses
                                            </span>
                                          )}
                                          {ent.recipient.toLowerCase().includes('ehf') && (
                                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                                              ehf
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="p-3 text-right font-mono font-semibold text-neutral-700">
                                        {formaTolu(ent.count)}
                                      </td>
                                      <td className="p-3 text-right font-mono text-neutral-600">
                                        {formaTolu(Math.round(entAvg))} kr.
                                      </td>
                                      <td className="p-3 text-right font-mono font-black text-neutral-900">
                                        <div className="flex flex-col items-end">
                                          <span>{stuttTala(ent.totalAmount)}</span>
                                          <span className="text-[10px] text-neutral-500 font-normal">
                                            {formaTolu(Math.round(ent.totalAmount))} kr.
                                          </span>
                                        </div>
                                      </td>
                                      <td className="p-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                          <div className="w-16 bg-neutral-100 rounded-full h-1.5 overflow-hidden">
                                            <div 
                                              className="bg-amber-500 h-1.5 rounded-full" 
                                              style={{ width: `${Math.min(parseFloat(pctOfHat), 100)}%` }} 
                                            />
                                          </div>
                                          <span className="font-mono text-[11px] font-bold text-neutral-700 w-10 text-right">
                                            {pctOfHat}%
                                          </span>
                                        </div>
                                      </td>
                                      <td className="p-3 text-center">
                                        <button
                                          type="button"
                                          onClick={() => inspectRecipientInRows(ent.recipient)}
                                          className="text-[11px] font-bold text-neutral-800 hover:text-amber-800 underline flex items-center justify-center gap-1 mx-auto transition"
                                          title={`Skoða stakar færslur fyrir ${ent.recipient}`}
                                        >
                                          <Search className="w-3 h-3" />
                                          <span>Skoða færslur</span>
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                              {/* Sub-table summary footer */}
                              <tfoot className="bg-neutral-100 border-t-2 border-neutral-300 font-bold text-neutral-900 text-[11px]">
                                <tr>
                                  <td colSpan={2} className="p-3">
                                    Samtals {group.title} ({visibleEntities.length} aðilar):
                                  </td>
                                  <td className="p-3 text-right font-mono">
                                    {formaTolu(group.totalCount)}
                                  </td>
                                  <td className="p-3 text-right font-mono">
                                    {formaTolu(Math.round(avgAmount))} kr.
                                  </td>
                                  <td className="p-3 text-right font-mono font-black text-amber-900">
                                    {formaTolu(Math.round(group.totalAmount))} kr. ({stuttTala(group.totalAmount)})
                                  </td>
                                  <td className="p-3 text-right font-mono">
                                    100%
                                  </td>
                                  <td></td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 1: Sample Rows */}
        {dataView === 'rows' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-neutral-100 border-b border-neutral-200 text-[11px] font-bold text-neutral-700 uppercase">
                  <th 
                    className="p-3 cursor-pointer hover:bg-neutral-200 transition select-none"
                    onClick={() => handleRowsSort('date')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Dagsetning</span>
                      {rowsSortField === 'date' ? (
                        rowsSortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-amber-700 font-bold" /> : <ArrowDown className="w-3.5 h-3.5 text-amber-700 font-bold" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="p-3 cursor-pointer hover:bg-neutral-200 transition select-none"
                    onClick={() => handleRowsSort('institution')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Greiðandi Stofnun</span>
                      {rowsSortField === 'institution' ? (
                        rowsSortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-amber-700 font-bold" /> : <ArrowDown className="w-3.5 h-3.5 text-amber-700 font-bold" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="p-3 cursor-pointer hover:bg-neutral-200 transition select-none"
                    onClick={() => handleRowsSort('supplier')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Viðtakandi (Styrkþegi)</span>
                      {rowsSortField === 'supplier' ? (
                        rowsSortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-amber-700 font-bold" /> : <ArrowDown className="w-3.5 h-3.5 text-amber-700 font-bold" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="p-3 cursor-pointer hover:bg-neutral-200 transition select-none"
                    onClick={() => handleRowsSort('category')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Tegund rukkunar</span>
                      {rowsSortField === 'category' ? (
                        rowsSortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-amber-700 font-bold" /> : <ArrowDown className="w-3.5 h-3.5 text-amber-700 font-bold" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="p-3 cursor-pointer hover:bg-neutral-200 transition select-none"
                    onClick={() => handleRowsSort('invoiceNumber')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Reikningsnr.</span>
                      {rowsSortField === 'invoiceNumber' ? (
                        rowsSortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-amber-700 font-bold" /> : <ArrowDown className="w-3.5 h-3.5 text-amber-700 font-bold" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="p-3 text-right cursor-pointer hover:bg-neutral-200 transition select-none"
                    onClick={() => handleRowsSort('amount')}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Upphæð (kr.)</span>
                      {rowsSortField === 'amount' ? (
                        rowsSortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-amber-700 font-bold" /> : <ArrowDown className="w-3.5 h-3.5 text-amber-700 font-bold" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 font-sans">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-10 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-amber-800">
                        <Hourglass className="w-6 h-6 animate-spin text-amber-600" />
                        <p className="text-sm font-bold">Sækir gögn úr gagnagrunni með tímaglasi...</p>
                        <p className="text-xs text-neutral-500 font-mono">Leitar í öllum reikningum í PostgreSQL</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredRows.length > 0 ? (
                  filteredRows.map((row, idx) => (
                    <tr key={`${row.id}-${idx}`} className="hover:bg-amber-50/40 transition-colors">
                      <td className="p-3 font-mono text-neutral-600 whitespace-nowrap">
                        {row.date ? row.date.substring(0, 10) : '—'}
                      </td>
                      <td className="p-3 font-semibold text-neutral-900">
                        {row.institution}
                      </td>
                      <td className="p-3 font-bold text-neutral-900">
                        {row.supplier}
                      </td>
                      <td className="p-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-100 text-amber-900 border border-amber-200">
                          {row.category}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-neutral-500 text-[11px]">
                        {row.invoiceNumber}
                      </td>
                      <td className="p-3 text-right font-mono font-black text-neutral-900 whitespace-nowrap">
                        {formaTolu(Math.round(row.amount))} kr.
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-neutral-500">
                      Engir styrkir fundust sem passa við valið leitarskilyrði.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* VIEW 2: Categories Breakdown */}
        {dataView === 'categories' && (
          <div>
            {excludeInternal && (
              <div className="p-3 bg-neutral-50 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-neutral-700">
                    <strong>„Innbyrðis framlög milli A-hluta stofnana“</strong> eru útilokuð úr töflunni (bókhaldsfærslur milli ríkisstofnana en ekki raunverulegir styrkir til samfélagsins).
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setExcludeInternal(false)}
                  className="text-xs font-bold text-neutral-800 underline hover:text-amber-800 shrink-0 cursor-pointer"
                >
                  Sýna innbyrðis framlög
                </button>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-100 border-b border-neutral-200 text-[11px] font-bold text-neutral-700 uppercase">
                    <th 
                      className="p-3 cursor-pointer hover:bg-neutral-200 transition select-none"
                      onClick={() => handleCategoriesSort('category')}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Tegund rukkunar (dálkurinn: tegund)</span>
                        {categoriesSortField === 'category' ? (
                          categoriesSortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-amber-700 font-bold" /> : <ArrowDown className="w-3.5 h-3.5 text-amber-700 font-bold" />
                        ) : (
                          <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
                        )}
                      </div>
                    </th>
                    <th 
                      className="p-3 text-right cursor-pointer hover:bg-neutral-200 transition select-none"
                      onClick={() => handleCategoriesSort('count')}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <span>Fjöldi reikninga</span>
                        {categoriesSortField === 'count' ? (
                          categoriesSortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-amber-700 font-bold" /> : <ArrowDown className="w-3.5 h-3.5 text-amber-700 font-bold" />
                        ) : (
                          <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
                        )}
                      </div>
                    </th>
                    <th 
                      className="p-3 text-right cursor-pointer hover:bg-neutral-200 transition select-none"
                      onClick={() => handleCategoriesSort('avg')}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <span>Meðalupphæð</span>
                        {categoriesSortField === 'avg' ? (
                          categoriesSortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-amber-700 font-bold" /> : <ArrowDown className="w-3.5 h-3.5 text-amber-700 font-bold" />
                        ) : (
                          <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
                        )}
                      </div>
                    </th>
                    <th 
                      className="p-3 text-right cursor-pointer hover:bg-neutral-200 transition select-none"
                      onClick={() => handleCategoriesSort('totalAmount')}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <span>Heildarupphæð</span>
                        {categoriesSortField === 'totalAmount' ? (
                          categoriesSortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-amber-700 font-bold" /> : <ArrowDown className="w-3.5 h-3.5 text-amber-700 font-bold" />
                        ) : (
                          <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
                        )}
                      </div>
                    </th>
                    <th 
                      className="p-3 text-right cursor-pointer hover:bg-neutral-200 transition select-none"
                      onClick={() => handleCategoriesSort('pct')}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <span>Hlutfall af styrkjum</span>
                        {categoriesSortField === 'pct' ? (
                          categoriesSortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-amber-700 font-bold" /> : <ArrowDown className="w-3.5 h-3.5 text-amber-700 font-bold" />
                        ) : (
                          <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
                        )}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {visibleCategories.map((cat, idx) => {
                    const total = data?.summary.totalAmount || 1;
                    const pct = ((cat.totalAmount / total) * 100).toFixed(1);
                    const avg = cat.count > 0 ? cat.totalAmount / cat.count : 0;
                    return (
                      <tr key={idx} className="hover:bg-neutral-50">
                        <td className="p-3 font-bold text-neutral-900 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          <span>{cat.category}</span>
                        </td>
                        <td className="p-3 text-right font-mono font-semibold text-neutral-700">
                          {formaTolu(cat.count)}
                        </td>
                        <td className="p-3 text-right font-mono text-neutral-600">
                          {formaTolu(Math.round(avg))} kr.
                        </td>
                        <td className="p-3 text-right font-mono font-black text-neutral-900">
                          {stuttTala(cat.totalAmount)}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 bg-neutral-200 rounded-full h-1.5 overflow-hidden">
                              <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${Math.min(parseFloat(pct), 100)}%` }} />
                            </div>
                            <span className="font-mono text-[11px] font-bold text-neutral-600 w-10 text-right">{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW 3: Top Recipients Breakdown */}
        {dataView === 'recipients' && (
          <div>
            <div className="p-3 bg-amber-50/80 border-b border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-800 shrink-0" />
                <span className="text-amber-950">
                  Ábending: Viltu sjá <strong>Markaðsstofur ses</strong>, <strong>Sambönd sveitarfélaga</strong> og <strong>ehf fyrirtæki</strong> dregin saman undir einn hatt með fellilistum?
                </span>
              </div>
              <button
                type="button"
                onClick={() => setDataView('hats')}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition cursor-pointer shrink-0 text-center"
              >
                Opna Hattaflokkun ➔
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-neutral-100 border-b border-neutral-200 text-[11px] font-bold text-neutral-700 uppercase">
                  <th className="p-3 w-8">#</th>
                  <th 
                    className="p-3 cursor-pointer hover:bg-neutral-200 transition select-none"
                    onClick={() => handleRecipientsSort('recipient')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Viðtakandi (Styrkþegi / Birgir)</span>
                      {recipientsSortField === 'recipient' ? (
                        recipientsSortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-amber-700 font-bold" /> : <ArrowDown className="w-3.5 h-3.5 text-amber-700 font-bold" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="p-3 text-right cursor-pointer hover:bg-neutral-200 transition select-none"
                    onClick={() => handleRecipientsSort('count')}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Fjöldi styrkveitinga</span>
                      {recipientsSortField === 'count' ? (
                        recipientsSortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-amber-700 font-bold" /> : <ArrowDown className="w-3.5 h-3.5 text-amber-700 font-bold" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="p-3 text-right cursor-pointer hover:bg-neutral-200 transition select-none"
                    onClick={() => handleRecipientsSort('avg')}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Meðalupphæð</span>
                      {recipientsSortField === 'avg' ? (
                        recipientsSortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-amber-700 font-bold" /> : <ArrowDown className="w-3.5 h-3.5 text-amber-700 font-bold" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="p-3 text-right cursor-pointer hover:bg-neutral-200 transition select-none"
                    onClick={() => handleRecipientsSort('totalAmount')}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Heildarupphæð styrkja</span>
                      {recipientsSortField === 'totalAmount' ? (
                        recipientsSortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-amber-700 font-bold" /> : <ArrowDown className="w-3.5 h-3.5 text-amber-700 font-bold" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {sortedRecipients.map((rec, idx) => {
                  const avg = rec.count > 0 ? rec.totalAmount / rec.count : 0;
                  return (
                    <tr key={idx} className="hover:bg-neutral-50">
                      <td className="p-3 font-mono text-neutral-400 text-[11px] w-8">
                        {idx + 1}.
                      </td>
                      <td className="p-3 font-black text-neutral-900">
                        {rec.recipient}
                      </td>
                      <td className="p-3 text-right font-mono font-semibold text-neutral-700">
                        {formaTolu(rec.count)}
                      </td>
                      <td className="p-3 text-right font-mono text-neutral-600">
                        {formaTolu(Math.round(avg))} kr.
                      </td>
                      <td className="p-3 text-right font-mono font-black text-amber-700">
                        {stuttTala(rec.totalAmount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

        {/* VIEW 4: Top Payers Breakdown */}
        {dataView === 'payers' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-neutral-100 border-b border-neutral-200 text-[11px] font-bold text-neutral-700 uppercase">
                  <th className="p-3 w-8">#</th>
                  <th 
                    className="p-3 cursor-pointer hover:bg-neutral-200 transition select-none"
                    onClick={() => handlePayersSort('payer')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Greiðandi Ríkisstofnun / Ráðuneyti</span>
                      {payersSortField === 'payer' ? (
                        payersSortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-amber-700 font-bold" /> : <ArrowDown className="w-3.5 h-3.5 text-amber-700 font-bold" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="p-3 text-right cursor-pointer hover:bg-neutral-200 transition select-none"
                    onClick={() => handlePayersSort('count')}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Fjöldi styrkveitinga</span>
                      {payersSortField === 'count' ? (
                        payersSortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-amber-700 font-bold" /> : <ArrowDown className="w-3.5 h-3.5 text-amber-700 font-bold" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="p-3 text-right cursor-pointer hover:bg-neutral-200 transition select-none"
                    onClick={() => handlePayersSort('avg')}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Meðalupphæð</span>
                      {payersSortField === 'avg' ? (
                        payersSortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-amber-700 font-bold" /> : <ArrowDown className="w-3.5 h-3.5 text-amber-700 font-bold" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="p-3 text-right cursor-pointer hover:bg-neutral-200 transition select-none"
                    onClick={() => handlePayersSort('totalAmount')}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Heildarupphæð úthlutað</span>
                      {payersSortField === 'totalAmount' ? (
                        payersSortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-amber-700 font-bold" /> : <ArrowDown className="w-3.5 h-3.5 text-amber-700 font-bold" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {sortedPayers.map((payer, idx) => {
                  const avg = payer.count > 0 ? payer.totalAmount / payer.count : 0;
                  return (
                    <tr key={idx} className="hover:bg-neutral-50">
                      <td className="p-3 font-mono text-neutral-400 text-[11px] w-8">
                        {idx + 1}.
                      </td>
                      <td className="p-3 font-black text-neutral-900">
                        {payer.payer}
                      </td>
                      <td className="p-3 text-right font-mono font-semibold text-neutral-700">
                        {formaTolu(payer.count)}
                      </td>
                      <td className="p-3 text-right font-mono text-neutral-600">
                        {formaTolu(Math.round(avg))} kr.
                      </td>
                      <td className="p-3 text-right font-mono font-black text-neutral-900">
                        {stuttTala(payer.totalAmount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
