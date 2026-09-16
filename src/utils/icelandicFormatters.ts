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
