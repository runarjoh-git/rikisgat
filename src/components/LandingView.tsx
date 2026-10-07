import React, { useState } from 'react';
import { 
  Shield, Landmark, Download, FileCode, Check, Info
} from 'lucide-react';

interface LandingViewProps {
  onOpenApp?: () => void;
  onOpenLogin?: () => void;
  onOpenWhistleblower?: (data?: { institution?: string; supplier?: string }) => void;
  onOpenSupport?: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onOpenApp,
  onOpenLogin,
  onOpenWhistleblower,
  onOpenSupport
}) => {
  // Coat of arms image state
  const [imgLoadError, setImgLoadError] = useState(false);

  // Standalone HTML download notification
  const [downloadedHtml, setDownloadedHtml] = useState(false);

  // Generate and download a self-contained index.html file for rikisgat.is
  const handleDownloadStandaloneHtml = () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="is">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>RíkisGát — Forsíða & Prufuferli</title>
  <meta name="description" content="Gegnsæi & Eftirlit með opinberum reikingum ríkisstjórna Íslands. 18,5 milljónir reikninga frá 2017 til 2026." />
  <link rel="icon" href="/favicon.ico" sizes="any" />
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-neutral-100 text-neutral-900 font-sans selection:bg-neutral-900 selection:text-white">

  <!-- Top Announcement Bar -->
  <div class="bg-neutral-900 text-white border-b border-neutral-800 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-center flex items-center justify-center gap-2">
    <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
    <span>Vefurinn er í undirbúningi — Gögn lögð fram til stofnunar Almenns félags um rekstur RíkisGát</span>
  </div>

  <div class="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">

    <!-- Top Header / Brand Presentation -->
    <header class="bg-white border-2 border-neutral-900 px-6 py-4 rounded-xl flex items-center justify-between shadow-xs">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-black text-sm">
          R
        </div>
        <div>
          <span class="font-black text-lg tracking-tight uppercase text-neutral-900 block leading-tight">RÍKISGÁT</span>
          <span class="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">Ísland • Gagnasöfnun & Eftirlit</span>
        </div>
      </div>
      <div class="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-neutral-100 text-neutral-800 border border-neutral-300">
        Í vinnslu
      </div>
    </header>

    <!-- Hero Announcement — Skjaldamerki RíkisGát -->
    <section class="bg-white border-2 border-neutral-900 rounded-2xl p-6 sm:p-10 text-center space-y-6 shadow-xs">
      <div class="max-w-md mx-auto flex flex-col items-center">
        <img 
          src="/rikisgat_codeArms.png" 
          alt="Skjaldamerki RíkisGát — Landvættir Íslands í rannsóknarhlutverki" 
          class="max-h-80 sm:max-h-96 w-auto object-contain mx-auto drop-shadow-sm"
          onerror="if(!this.dataset.retry){this.dataset.retry='1';this.src='/skjaldamerki.png';}else{this.style.display='none';document.getElementById('coatFallback')?.classList.remove('hidden');}"
        />
        <div id="coatFallback" class="hidden p-6 rounded-2xl bg-neutral-50 border-2 border-neutral-900 text-center max-w-md w-full space-y-2 mt-4">
          <div class="w-14 h-14 rounded-2xl bg-neutral-900 text-white flex items-center justify-center text-2xl mx-auto">🛡️</div>
          <h3 class="font-black text-lg text-neutral-900 uppercase">Skjaldamerki RíkisGát</h3>
          <p class="text-xs text-neutral-600">Landvættirnar fjórar í rannsóknar- og eftirlitshlutverki: Griðungur, Gammur, Dreki og Bergrisi.</p>
        </div>
      </div>

      <div class="space-y-3 max-w-2xl mx-auto">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-300 bg-neutral-100 text-neutral-800 text-xs font-bold">
          <span>🛡️ Óháð eftirlit og gagnsæi með opinberum fjármunum</span>
        </div>

        <h1 class="text-3xl sm:text-5xl font-black uppercase tracking-tight text-neutral-900">
          RÍKISGÁT
        </h1>

        <p class="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-500 max-w-xl mx-auto">
          Gegnsæi & Eftirlit með opinberum reikningum ríkisstjórna Íslands
        </p>

        <p class="text-sm sm:text-base text-neutral-700 leading-relaxed font-sans max-w-2xl mx-auto pt-2">
          Ríkisgát er nýr almenningsvefur í þróun sem opnar aðgengi að öllum reikningum ríkisins frá 2017 til 2026.
          Alls eru yfir <strong>18,5 milljónir færslna</strong> vistaðar í PostgreSQL gagnagrunni kerfisins.
          Aðalvefurinn verður opnaður samhliða stofnun <strong>Almenns félags</strong> til að tryggja óháðan rekstur í þágu allra borgara.
        </p>
      </div>
    </section>

    <!-- Skjaldamerki RíkisGát — Landvættirnar -->
    <section class="bg-white border-2 border-neutral-900 rounded-xl p-6 sm:p-8 space-y-4 shadow-xs">
      <div class="flex items-center gap-2">
        <span class="text-xl">🛡️</span>
        <h3 class="text-base sm:text-lg font-black uppercase tracking-tight text-neutral-900">
          Skjaldamerki RíkisGát — Landvættirnar í nýju eftirlitshlutverki
        </h3>
      </div>

      <p class="text-xs sm:text-sm text-neutral-600 leading-relaxed">
        Í stað hefðbundins valdamerkis snýr merki RíkisGát hlutverkunum við: Hér eru hinir fornu verndarvættir Íslands settir í hlutverk rannsakenda, endurskoðenda og blaðamanna til að verja almannafé og tryggja gagnsæi gagnvart almenningi:
      </p>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
        <div class="p-4 rounded-xl border border-neutral-200 bg-neutral-50/60 space-y-1.5">
          <div class="flex items-center gap-2">
            <span class="text-lg">🐂</span>
            <h4 class="font-black text-xs uppercase text-neutral-900">Griðungurinn</h4>
          </div>
          <p class="text-[11px] text-neutral-500 font-bold uppercase">Vesturland & Vestfirðir</p>
          <p class="text-xs text-neutral-700 leading-relaxed">
            Rannsóknarlögreglumaðurinn með stækkunarglerið og rannsóknargögnin sem rýnir í smáa letrið og kafar ofan í bókhaldsfærslur.
          </p>
        </div>

        <div class="p-4 rounded-xl border border-neutral-200 bg-neutral-50/60 space-y-1.5">
          <div class="flex items-center gap-2">
            <span class="text-lg">🦅</span>
            <h4 class="font-black text-xs uppercase text-neutral-900">Gammurinn</h4>
          </div>
          <p class="text-[11px] text-neutral-500 font-bold uppercase">Norðurland</p>
          <p class="text-xs text-neutral-700 leading-relaxed">
            Rannsóknarblaðamaðurinn með fréttamannshattinn, myndavélina og minnisbókina sem skráir staðreyndir og upplýsir almenning.
          </p>
        </div>

        <div class="p-4 rounded-xl border border-neutral-200 bg-neutral-50/60 space-y-1.5">
          <div class="flex items-center gap-2">
            <span class="text-lg">🐉</span>
            <h4 class="font-black text-xs uppercase text-neutral-900">Drekinn</h4>
          </div>
          <p class="text-[11px] text-neutral-500 font-bold uppercase">Austurland</p>
          <p class="text-xs text-neutral-700 leading-relaxed">
            Eftirlitsaðilinn í frakkanum með sönnunargagnamöppuna („Evidence File“) sem gætir þess að engum frumgögnum sé leynt.
          </p>
        </div>

        <div class="p-4 rounded-xl border border-neutral-200 bg-neutral-50/60 space-y-1.5">
          <div class="flex items-center gap-2">
            <span class="text-lg">🗿</span>
            <h4 class="font-black text-xs uppercase text-neutral-900">Bergrisinn</h4>
          </div>
          <p class="text-[11px] text-neutral-500 font-bold uppercase">Suðurland</p>
          <p class="text-xs text-neutral-700 leading-relaxed">
            Yfirbókarinn og endurskoðandinn með gleraugun, fjaðurstafinn, talnagrindina, reiknivélarnar og bækurnar sem tryggir að hver einasta króna stemmi.
          </p>
        </div>
      </div>
    </section>

    <!-- Um verkefnið og tilgang þess: HVERT FARA SKATTPENINGARNIR OKKAR? -->
    <section class="bg-white border-2 border-neutral-900 rounded-xl p-6 sm:p-8 space-y-5 shadow-xs">
      <div>
        <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-neutral-300 bg-neutral-100 text-neutral-800 text-[11px] font-bold tracking-wider uppercase">
          <span>ⓘ UM VERKEFNIÐ OG TILGANG ÞESS</span>
        </div>
      </div>

      <h3 class="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight text-neutral-900">
        HVERT FARA SKATTPENINGARNIR OKKAR?
      </h3>

      <p class="text-sm sm:text-base text-neutral-700 leading-relaxed font-sans max-w-4xl">
        <strong>Ríkisgát</strong> er óháð, opið borgaraverkefni hannað til að veita almenningi, blaðamönnum, fræðafólki og kjósendum einfalt, aðgengilegt og leifturhraðvirkt yfirlit yfir öll opinber útgjöld og greidda reikninga íslenska ríkisins.
      </p>

      <div class="pt-4 border-t border-neutral-200 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="flex items-start gap-3">
          <div class="w-7 h-7 rounded bg-neutral-100 border border-neutral-300 text-neutral-900 font-black flex items-center justify-center text-xs shrink-0 mt-0.5">
            1
          </div>
          <div class="space-y-0.5">
            <h4 class="font-black text-xs uppercase tracking-wide text-neutral-900">
              GEGNSÆI
            </h4>
            <p class="text-xs text-neutral-600 leading-relaxed">
              Opinber gögn eiga að vera aðgengileg öllum án hindrana eða tæknilegra tálma.
            </p>
          </div>
        </div>

        <div class="flex items-start gap-3">
          <div class="w-7 h-7 rounded bg-neutral-100 border border-neutral-300 text-neutral-900 font-black flex items-center justify-center text-xs shrink-0 mt-0.5">
            2
          </div>
          <div class="space-y-0.5">
            <h4 class="font-black text-xs uppercase tracking-wide text-neutral-900">
              AÐHALD
            </h4>
            <p class="text-xs text-neutral-600 leading-relaxed">
              Borgaralegt eftirlit styrkir lýðræðislega stjórnsýslu og vandaða meðferð almannafjár.
            </p>
          </div>
        </div>

        <div class="flex items-start gap-3">
          <div class="w-7 h-7 rounded bg-neutral-100 border border-neutral-300 text-neutral-900 font-black flex items-center justify-center text-xs shrink-0 mt-0.5">
            3
          </div>
          <div class="space-y-0.5">
            <h4 class="font-black text-xs uppercase tracking-wide text-neutral-900">
              RÉTTUR TIL GAGNA
            </h4>
            <p class="text-xs text-neutral-600 leading-relaxed">
              Upplýsingalög 140/2012 tryggja rétt allra borgara til aðgangs að fylgiskjölum og frumgögnum.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Stofnun Almenns félags & Hugmyndafræði -->
    <section class="bg-white border-2 border-neutral-900 rounded-xl p-6 sm:p-7 shadow-xs space-y-3">
      <h3 class="text-base font-black uppercase text-neutral-900">Stofnun Almenns félags</h3>
      <p class="text-xs sm:text-sm text-neutral-600 leading-relaxed">
        RíkisGát verður rekið af <strong>almennu félagi</strong> (óhagnýtt almannaheillafélag samkvæmt lögum nr. 110/2021) til að tryggja almenningi ókeypis og óheftan aðgang að opinberum reikningum óháð stjórnmálaflokkum eða hagsmunaöflum.
      </p>
      <div class="pt-2">
        <span class="text-[11px] font-mono font-bold text-neutral-800 bg-neutral-100 px-2.5 py-1 rounded border border-neutral-300 inline-block">
          Lög nr. 140/2012 um upplýsingarétt
        </span>
      </div>
    </section>

    <!-- Footer -->
    <footer class="text-center text-xs text-neutral-500 py-6 border-t border-neutral-300 flex flex-col sm:flex-row items-center justify-between gap-3">
      <div>
        &copy; 2026 RÍKISGÁT — Félag um gagnsæi og eftirlit með opinberum reikningum.
      </div>
      <div class="flex items-center gap-4">
        <a href="?stjornbord=1" class="text-neutral-500 hover:text-neutral-900 underline font-semibold">Innra stjórnborð</a>
      </div>
    </footer>
  </div>

  <script>
    function handleSignup(e) {
      e.preventDefault();
      const name = document.getElementById('nameInput').value;
      const email = document.getElementById('emailInput').value;
      const role = document.getElementById('roleInput').value;
      const wants_notifications = document.getElementById('notifyCheckbox').checked;

      fetch('/api/beta-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, role, wants_notifications })
      }).catch(() => {});

      document.getElementById('signupForm').classList.add('hidden');
      document.getElementById('signupSuccess').classList.remove('hidden');
    }
  </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'index.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadedHtml(true);
    setTimeout(() => setDownloadedHtml(false), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      <div className="bg-neutral-900 text-white border-b border-neutral-800 -mx-4 sm:-mx-6 -mt-6 sm:-mt-8 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-center flex items-center justify-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>Vefurinn er í prufuferli — Gögn lögð fram til stofnunar Almenns félags um rekstur RíkisGát</span>
      </div>

      {/* Clean Top Navigation Bar */}
      <nav className="bg-white border-2 border-neutral-900 px-4 sm:px-6 py-3 rounded-xl flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-neutral-900 text-white flex items-center justify-center font-black text-sm">
            R
          </div>
          <span className="font-black text-lg tracking-tight uppercase text-neutral-900">RÍKISGÁT</span>
        </div>

        <div className="flex items-center gap-2">
          {onOpenSupport && (
            <button
              type="button"
              onClick={onOpenSupport}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-neutral-900 hover:bg-neutral-800 text-white transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>Viltu styrkja okkur?</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleDownloadStandaloneHtml}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-300 transition flex items-center gap-1.5 cursor-pointer"
            title="Sækja tilbúna index.html skrá fyrir vefþjón"
          >
            {downloadedHtml ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Sótt!</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sækja index.html</span>
              </>
            )}
          </button>
        </div>
      </nav>

      {/* HERO SECTION — SKJALDAMERKI RÍKISGÁT SEM ÞUNGPUNKTUR */}
      <section className="bg-white border-2 border-neutral-900 rounded-2xl p-6 sm:p-10 text-center shadow-xs space-y-6">
        
        {/* Skjaldamerki RíkisGát (Coat of Arms) */}
        <div className="max-w-xl mx-auto flex flex-col items-center">
          {!imgLoadError ? (
            <img
              src="/rikisgat_codeArms.png"
              alt="Skjaldamerki RíkisGát — Landvættir Íslands í rannsóknarhlutverki"
              onError={() => setImgLoadError(true)}
              className="max-h-80 sm:max-h-96 w-auto object-contain mx-auto transition-transform duration-300 hover:scale-[1.02] drop-shadow-sm"
            />
          ) : (
            <div className="p-6 rounded-2xl bg-neutral-50 border-2 border-neutral-900 text-center max-w-md w-full space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-neutral-900 text-white flex items-center justify-center text-3xl mx-auto">
                🛡️
              </div>
              <h3 className="font-black text-xl text-neutral-900 uppercase">Skjaldamerki RíkisGát</h3>
              <p className="text-xs text-neutral-600">
                Landvættirnar fjórar í rannsóknar- og eftirlitshlutverki: Griðungur, Gammur, Dreki og Bergrisi gæta opinberra fjármuna.
              </p>
              <span className="text-[10px] font-mono bg-neutral-200 text-neutral-700 px-2 py-0.5 rounded">
                /public/rikisgat_codeArms.png
              </span>
            </div>
          )}
        </div>

        {/* Titill og Yfirlit */}
        <div className="space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-300 bg-neutral-100 text-neutral-800 text-xs font-bold">
            <Shield className="w-3.5 h-3.5 text-neutral-900" />
            <span>Óháð eftirlit og gagnsæi með opinberum fjármunum</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-neutral-900">
            RÍKISGÁT
          </h1>

          <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-500 max-w-xl mx-auto">
            Gegnsæi & Eftirlit með opinberum reikningum ríkisstjórna Íslands
          </p>

          <p className="text-sm sm:text-base text-neutral-700 leading-relaxed font-sans max-w-2xl mx-auto pt-2">
            Ríkisgát er nýr almenningsvefur í þróun sem opnar aðgengi að öllum reikningum ríkisins frá 2017 til 2026.
            Alls eru yfir <strong>18,5 milljónir færslna</strong> vistaðar í PostgreSQL gagnagrunni kerfisins.
            Aðalvefurinn verður opnaður samhliða stofnun <strong>Almenns félags</strong> til að tryggja óháðan rekstur í þágu allra borgara.
          </p>

          {onOpenSupport && (
            <div className="pt-3 flex items-center justify-center">
              <button
                type="button"
                onClick={onOpenSupport}
                className="px-6 py-2.5 rounded-lg text-sm font-black uppercase tracking-wider bg-neutral-900 hover:bg-neutral-800 text-white transition flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <span>Viltu styrkja okkur?</span>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* SKÝRING Á MERKINU: LANDVÆTTIRNAR Í RANNSÓKNARHLUTVERKI */}
      <section className="bg-white border-2 border-neutral-900 rounded-xl p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-neutral-900" />
          <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-neutral-900">
            Skjaldamerki RíkisGát — Landvættirnar í nýju eftirlitshlutverki
          </h3>
        </div>

        <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
          Í stað hefðbundins valdamerkis snýr merki RíkisGát hlutverkunum við: Hér eru hinir fornu verndarvættir Íslands settir í hlutverk rannsakenda, endurskoðenda og blaðamanna til að verja almannafé og tryggja gagnsæi gagnvart almenningi:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/60 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-lg">🐂</span>
              <h4 className="font-black text-xs uppercase text-neutral-900">Griðungurinn</h4>
            </div>
            <p className="text-[11px] text-neutral-500 font-bold uppercase">Vesturland & Vestfirðir</p>
            <p className="text-xs text-neutral-700 leading-relaxed">
              Rannsóknarlögreglumaðurinn með stækkunarglerið og rannsóknargögnin sem rýnir í smáa letrið og kafar ofan í einstaka bókhaldsfærslur.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/60 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-lg">🦅</span>
              <h4 className="font-black text-xs uppercase text-neutral-900">Gammurinn</h4>
            </div>
            <p className="text-[11px] text-neutral-500 font-bold uppercase">Norðurland</p>
            <p className="text-xs text-neutral-700 leading-relaxed">
              Rannsóknarblaðamaðurinn með fréttamannshattinn, myndavélina og minnisbókina sem skráir staðreyndir og upplýsir almenning.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/60 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-lg">🐉</span>
              <h4 className="font-black text-xs uppercase text-neutral-900">Drekinn</h4>
            </div>
            <p className="text-[11px] text-neutral-500 font-bold uppercase">Austurland</p>
            <p className="text-xs text-neutral-700 leading-relaxed">
              Eftirlitsaðilinn í frakkanum með sönnunargagnamöppuna („Evidence File“) sem gætir þess að engum frumgögnum sé leynt.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/60 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-lg">🗿</span>
              <h4 className="font-black text-xs uppercase text-neutral-900">Bergrisinn</h4>
            </div>
            <p className="text-[11px] text-neutral-500 font-bold uppercase">Suðurland</p>
            <p className="text-xs text-neutral-700 leading-relaxed">
              Yfirbókarinn og endurskoðandinn með gleraugun, fjaðurstafinn, talnagrindina, reiknivélarnar og bækurnar sem tryggir að hver einasta króna stemmi.
            </p>
          </div>
        </div>
      </section>

      {/* UM VERKEFNIÐ OG TILGANG ÞESS: HVERT FARA SKATTPENINGARNIR OKKAR? */}
      <section className="bg-white border-2 border-neutral-900 rounded-xl p-6 sm:p-8 space-y-5 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-neutral-300 bg-neutral-100 text-neutral-800 text-[11px] font-bold tracking-wider uppercase">
            <Info className="w-3.5 h-3.5 text-neutral-700" />
            <span>UM VERKEFNIÐ OG TILGANG ÞESS</span>
          </div>
        </div>

        <h3 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight text-neutral-900">
          HVERT FARA SKATTPENINGARNIR OKKAR?
        </h3>

        <p className="text-sm sm:text-base text-neutral-700 leading-relaxed font-sans max-w-4xl">
          <strong>Ríkisgát</strong> er óháð, opið borgaraverkefni hannað til að veita almenningi, blaðamönnum, fræðafólki og kjósendum einfalt, aðgengilegt og leifturhraðvirkt yfirlit yfir öll opinber útgjöld og greidda reikninga íslenska ríkisins.
        </p>

        <div className="pt-4 border-t border-neutral-200 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded bg-neutral-100 border border-neutral-300 text-neutral-900 font-black flex items-center justify-center text-xs shrink-0 mt-0.5">
              1
            </div>
            <div className="space-y-0.5">
              <h4 className="font-black text-xs uppercase tracking-wide text-neutral-900">
                GEGNSÆI
              </h4>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Opinber gögn eiga að vera aðgengileg öllum án hindrana eða tæknilegra tálma.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded bg-neutral-100 border border-neutral-300 text-neutral-900 font-black flex items-center justify-center text-xs shrink-0 mt-0.5">
              2
            </div>
            <div className="space-y-0.5">
              <h4 className="font-black text-xs uppercase tracking-wide text-neutral-900">
                AÐHALD
              </h4>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Borgaralegt eftirlit styrkir lýðræðislega stjórnsýslu og vandaða meðferð almannafjár.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded bg-neutral-100 border border-neutral-300 text-neutral-900 font-black flex items-center justify-center text-xs shrink-0 mt-0.5">
              3
            </div>
            <div className="space-y-0.5">
              <h4 className="font-black text-xs uppercase tracking-wide text-neutral-900">
                RÉTTUR TIL GAGNA
              </h4>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Upplýsingalög 140/2012 tryggja rétt allra borgara til aðgangs að fylgiskjölum og frumgögnum.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: STOFNUN ALMENNS FÉLAGS & INNVIÐIR */}
      <section className="bg-white border-2 border-neutral-900 rounded-xl p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Landmark className="w-5 h-5 text-neutral-900" />
          <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-neutral-900">
            Stofnun Almenns félags
          </h3>
        </div>
        <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed max-w-4xl">
          RíkisGát verður rekið af <strong>almennu félagi</strong> (óhagnýtt almannaheillafélag samkvæmt lögum nr. 110/2021). 
          Tilgangur félagsins er að tryggja almenningi ókeypis og óheftan aðgang að opinberum gögnum um ráðstöfun skattfjár, óháð stjórnmálaflokkum eða hagsmunaöflum.
        </p>
        <div className="pt-2 flex items-center gap-3 flex-wrap">
          <span className="text-[11px] font-mono font-bold text-neutral-800 bg-neutral-100 px-2.5 py-1 rounded border border-neutral-300 inline-block">
            Lög nr. 140/2012 um upplýsingarétt
          </span>
          <span className="text-[11px] font-mono font-bold text-neutral-800 bg-neutral-100 px-2.5 py-1 rounded border border-neutral-300 inline-block">
            Lög nr. 110/2021 um félög til almannaheilla
          </span>
        </div>
      </section>

      {/* SECTION 4: 3 KEY BENEFIT PILLARS (Black & White style) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <div className="bg-white p-5 rounded-xl border border-neutral-300 shadow-xs space-y-2">
          <div className="w-7 h-7 rounded bg-neutral-900 text-white flex items-center justify-center font-black text-sm">
            1
          </div>
          <h4 className="font-bold text-sm text-neutral-900 uppercase">18,5 Milljónir Reikninga</h4>
          <p className="text-xs text-neutral-600 leading-relaxed">
            Allir reikningar ráðuneyta og undirstofnana frá 2017 til 2026 í einum ofurhröðum PostgreSQL gagnagrunni.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-neutral-300 shadow-xs space-y-2">
          <div className="w-7 h-7 rounded bg-neutral-900 text-white flex items-center justify-center font-black text-sm">
            2
          </div>
          <h4 className="font-bold text-sm text-neutral-900 uppercase">Sjálfvirkt Eftirlit</h4>
          <p className="text-xs text-neutral-600 leading-relaxed">
            Sjálfvirk greining á stærstu birgjum, óvenjulegum hækkunum og ráðgjafagreiðslum ríkisins.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-neutral-300 shadow-xs space-y-2">
          <div className="w-7 h-7 rounded bg-neutral-900 text-white flex items-center justify-center font-black text-sm">
            3
          </div>
          <h4 className="font-bold text-sm text-neutral-900 uppercase">Óháð Almannaheill</h4>
          <p className="text-xs text-neutral-600 leading-relaxed">
            Engar auglýsingar, engin pólitísk afskipti. Opið öllum borgurum, blaðamönnum og þingmönnum án endurgjalds.
          </p>
        </div>
      </section>

      {/* Standalone HTML File Notification Bar */}
      <div className="bg-white border border-neutral-300 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex items-center gap-2.5">
          <FileCode className="w-4 h-4 text-neutral-700 shrink-0" />
          <span className="text-neutral-700">
            Vantar þig að setja upp tímabundna forsíðu á <strong>rikisgat.is</strong>? Þú getur sótt sjálfstæða <strong>index.html</strong> skrá hér.
          </span>
        </div>
        <button
          type="button"
          onClick={handleDownloadStandaloneHtml}
          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-neutral-900 hover:bg-neutral-800 text-white flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Sækja index.html</span>
        </button>
      </div>
    </div>
  );
};
