// Íslensk tölusniðun: Alltaf punktur (.) sem þúsundaskilamerki
export function formaTolu(tala: number | null | undefined): string {
  if (tala === null || tala === undefined || isNaN(Number(tala))) return '0';
  return Math.round(Number(tala))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// Stutt lýsing (t.d. "~25,7 milljarðar kr." eða "~450 milljónir kr.")
export function stuttTala(tala: number): string {
  const n = Number(tala);
  if (n >= 1_000_000_000) {
    return (n / 1_000_000_000).toFixed(1).replace('.', ',') + ' milljarðar kr.';
  } else if (n >= 1_000_000) {
    return (n / 1_000_000).toFixed(1).replace('.', ',') + ' milljónir kr.';
  }
  return formaTolu(n) + ' kr.';
}

// Íslenskt orðareiknirit: Býr til orðin yfir tölurnar
export function talaITexta(tala: number): string {
  const rounded = Math.round(Number(tala));
  if (rounded === 0) return 'núll krónur';
  if (rounded < 0) return 'mínus ' + talaITexta(Math.abs(rounded));

  const einingar = ['', 'eitt', 'tvö', 'þrjú', 'fjögur', 'fimm', 'sex', 'sjö', 'átta', 'níu'];
  const unglings = ['tíu', 'ellefu', 'tólf', 'þrettán', 'fjórtán', 'fimmtán', 'sextán', 'sautján', 'átján', 'nítján'];
  const tugir = ['', 'tíu', 'tuttugu', 'þrjátíu', 'fjörutíu', 'fimmtíu', 'sextíu', 'sjötíu', 'áttatíu', 'níutíu'];

  function lesaThriggja(n: number): string {
    const text: string[] = [];
    const h = Math.floor(n / 100);
    const afg = n % 100;

    if (h > 0) {
      if (h === 1) text.push('eitt hundrað');
      else if (h === 2) text.push('tvö hundruð');
      else if (h === 3) text.push('þrjú hundruð');
      else if (h === 4) text.push('fjögur hundruð');
      else text.push(einingar[h] + ' hundruð');
    }

    if (afg > 0) {
      if (h > 0) text.push('og');
      if (afg < 10) {
        text.push(einingar[afg]);
      } else if (afg < 20) {
        text.push(unglings[afg - 10]);
      } else {
        const t = Math.floor(afg / 10);
        const e = afg % 10;
        if (e === 0) {
          text.push(tugir[t]);
        } else {
          text.push(tugir[t] + ' og ' + einingar[e]);
        }
      }
    }
    return text.join(' ');
  }

  const milljardar = Math.floor(rounded / 1_000_000_000);
  const afg1 = rounded % 1_000_000_000;
  const milljonir = Math.floor(afg1 / 1_000_000);
  const afg2 = afg1 % 1_000_000;
  const thusund = Math.floor(afg2 / 1_000);
  const eitt = afg2 % 1_000;

  const partar: string[] = [];

  if (milljardar > 0) {
    const mTxt = lesaThriggja(milljardar);
    if (milljardar % 10 === 1 && milljardar % 100 !== 11) {
      partar.push(mTxt.replace(/eitt$/, 'einn') + ' milljarður');
    } else {
      partar.push(mTxt.replace(/tvö$/, 'tveir').replace(/þrjú$/, 'þrír').replace(/fjögur$/, 'fjórir') + ' milljarðar');
    }
  }

  if (milljonir > 0) {
    const mTxt = lesaThriggja(milljonir);
    if (milljonir % 10 === 1 && milljonir % 100 !== 11) {
      partar.push(mTxt.replace(/eitt$/, 'ein') + ' milljón');
    } else {
      partar.push(mTxt.replace(/tvö$/, 'tvær').replace(/þrjú$/, 'þrjár').replace(/fjögur$/, 'fjórar') + ' milljónir');
    }
  }

  if (thusund > 0) {
    const thTxt = lesaThriggja(thusund);
    partar.push(thTxt + ' þúsund');
  }

  if (eitt > 0) {
    partar.push(lesaThriggja(eitt));
  }

  const loka = partar.join(', ');
  if (!loka) return 'núll krónur';
  return loka.charAt(0).toUpperCase() + loka.slice(1) + ' krónur';
}

// Býr til orðin yfir heildarfjölda reikninga (t.d. „Fimmtíu og þrjú þúsund, fjögur hundruð og fimmtíu reikningar“)
export function fjoldiITexta(tala: number): string {
  const rounded = Math.round(Number(tala));
  if (rounded === 0) return 'núll reikningar';
  if (rounded === 1) return 'Einn reikningur';

  const einingarKarlkyns = ['', 'einn', 'tveir', 'þrír', 'fjórir', 'fimm', 'sex', 'sjö', 'átta', 'níu'];
  const unglings = ['tíu', 'ellefu', 'tólf', 'þrettán', 'fjórtán', 'fimmtán', 'sextán', 'sautján', 'átján', 'nítján'];
  const tugir = ['', 'tíu', 'tuttugu', 'þrjátíu', 'fjörutíu', 'fimmtíu', 'sextíu', 'sjötíu', 'áttatíu', 'níutíu'];

  function lesaThriggja(n: number, isLastPart = false): string {
    const text: string[] = [];
    const h = Math.floor(n / 100);
    const afg = n % 100;

    if (h > 0) {
      if (h === 1) text.push('eitt hundrað');
      else if (h === 2) text.push('tvö hundruð');
      else if (h === 3) text.push('þrjú hundruð');
      else if (h === 4) text.push('fjögur hundruð');
      else {
        const einingarHundrad = ['', 'eitt', 'tvö', 'þrjú', 'fjögur', 'fimm', 'sex', 'sjö', 'átta', 'níu'];
        text.push(einingarHundrad[h] + ' hundruð');
      }
    }

    if (afg > 0) {
      if (h > 0) text.push('og');
      if (afg < 10) {
        text.push(isLastPart ? einingarKarlkyns[afg] : ['', 'eitt', 'tvö', 'þrjú', 'fjögur', 'fimm', 'sex', 'sjö', 'átta', 'níu'][afg]);
      } else if (afg < 20) {
        text.push(unglings[afg - 10]);
      } else {
        const t = Math.floor(afg / 10);
        const e = afg % 10;
        if (e === 0) {
          text.push(tugir[t]);
        } else {
          const einText = isLastPart ? einingarKarlkyns[e] : ['', 'eitt', 'tvö', 'þrjú', 'fjögur', 'fimm', 'sex', 'sjö', 'átta', 'níu'][e];
          text.push(tugir[t] + ' og ' + einText);
        }
      }
    }
    return text.join(' ');
  }

  const milljonir = Math.floor(rounded / 1_000_000);
  const afg1 = rounded % 1_000_000;
  const thusund = Math.floor(afg1 / 1_000);
  const eitt = afg1 % 1_000;

  const partar: string[] = [];

  if (milljonir > 0) {
    const mTxt = lesaThriggja(milljonir, false);
    if (milljonir % 10 === 1 && milljonir % 100 !== 11) {
      partar.push(mTxt.replace(/eitt$/, 'ein') + ' milljón');
    } else {
      partar.push(mTxt.replace(/tvö$/, 'tvær').replace(/þrjú$/, 'þrjár').replace(/fjögur$/, 'fjórar') + ' milljónir');
    }
  }

  if (thusund > 0) {
    const thTxt = lesaThriggja(thusund, false);
    partar.push(thTxt + ' þúsund');
  }

  if (eitt > 0) {
    partar.push(lesaThriggja(eitt, true));
  }

  const loka = partar.join(', ');
  if (!loka) return 'núll reikningar';
  const suff = (rounded % 10 === 1 && rounded % 100 !== 11) ? 'reikningur' : 'reikningar';
  return loka.charAt(0).toUpperCase() + loka.slice(1) + ' ' + suff;
}

const MONTH_MAP: Record<string, string> = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
  mai: '05', maí: '05', jún: '06', júl: '07', ágú: '08', agu: '08',
  okt: '10', nóv: '11', des: '12'
};

// Íslenskt dagsetningarsnið: dags-mán-ár (t.d. 15-06-2024 eða 15.06.2024)
export function formaDags(dags: string | Date | null | undefined, fallbackYear?: string | number): string {
  if (!dags) return '';
  if (dags instanceof Date && !isNaN(dags.getTime())) {
    const day = String(dags.getDate()).padStart(2, '0');
    const month = String(dags.getMonth() + 1).padStart(2, '0');
    const year = dags.getFullYear();
    return `${day}-${month}-${year}`;
  }
  if (typeof dags === 'string') {
    const trimmed = dags.trim();
    // 1. Handles ISO YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss or YYYY.MM.DD or YYYY/MM/DD
    const ymdMatch = trimmed.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
    if (ymdMatch) {
      const [, y, m, d] = ymdMatch;
      const day = d.padStart(2, '0');
      const month = m.padStart(2, '0');
      return `${day}-${month}-${y}`;
    }
    // 2. If already DD-MM-YYYY or DD.MM.YYYY or DD/MM/YYYY
    const dmyMatch = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
    if (dmyMatch) {
      const [, d, m, y] = dmyMatch;
      return `${d.padStart(2, '0')}-${m.padStart(2, '0')}-${y}`;
    }
    // 3. If short 2-digit year DD-MM-YY
    const dmyShort = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2})$/);
    if (dmyShort) {
      const [, d, m, y] = dmyShort;
      const fullYear = parseInt(y, 10) > 50 ? `19${y}` : `20${y}`;
      return `${d.padStart(2, '0')}-${m.padStart(2, '0')}-${fullYear}`;
    }
    // 4. Textual English or Icelandic dates (e.g. "Fri May 29", "May 29", "Fri May 29 2024", "29 May 2024", "29. maí 2024")
    const textMatch = trimmed.match(/(?:(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)[a-z]*,?\s+)?(?:([a-záðéíóúýþæö]+)\s+(\d{1,2})|(\d{1,2})\.?\s+([a-záðéíóúýþæö]+))(?:\s*,?\s*(\d{4}))?/i);
    if (textMatch) {
      const rawMonth = (textMatch[1] || textMatch[4] || '').toLowerCase().slice(0, 3);
      const monthNum = MONTH_MAP[rawMonth];
      if (monthNum) {
        const dayNum = (textMatch[2] || textMatch[3] || '1').padStart(2, '0');
        let yearNum = textMatch[5];
        if (!yearNum && fallbackYear && String(fallbackYear) !== 'all') {
          yearNum = String(fallbackYear);
        }
        if (!yearNum) {
          const foundY = trimmed.match(/\b(19\d\d|20\d\d)\b/);
          if (foundY) yearNum = foundY[1];
        }
        if (!yearNum) {
          yearNum = String(new Date().getFullYear());
        }
        return `${dayNum}-${monthNum}-${yearNum}`;
      }
    }
    // 5. Only attempt generic Date parsing if a 4-digit year is explicitly in the string
    if (/\b(19\d\d|20\d\d)\b/.test(trimmed)) {
      const parsed = new Date(trimmed);
      if (!isNaN(parsed.getTime())) {
        const day = String(parsed.getDate()).padStart(2, '0');
        const month = String(parsed.getMonth() + 1).padStart(2, '0');
        const year = parsed.getFullYear();
        return `${day}-${month}-${year}`;
      }
    }
    return trimmed;
  }
  return String(dags);
}
