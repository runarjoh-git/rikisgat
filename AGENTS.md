# Ríkisgát — Reglur fyrir gervigreind og þróun (AGENTS.md)

Þessi skrá inniheldur mikilvægar leiðbeiningar og reglur fyrir alla gervigreindarþróunaraðila (AI Studio / Antigravity) og þróunarteymið.

---

## 1. Raungögn úr PostgreSQL vs. Mock-gögn
* **Raungögn úr PostgreSQL hafa alltaf forgang:** Kerfið sækir gögn úr raunverulegum gagnagrunni (`rikisgat` / PostgreSQL) gegnum `/api/invoices`, `/api/institutions`, og `/api/overview`.
* **Aldrei yfirskrifa gagnagrunnstengingar með mock-gögnum:** Ef gagnagrunnurinn er tengdur á viðmótið ávallt að sýna rauntölur, raunreikninga og raunstofnanir (sbr. opinber gögn á opnirreikningar.is).
* **MockData er aðeins öryggisnet (fallback):** Skrár eins og `src/data/mockData.ts` eiga aðeins að innihalda rétt týpuform (structures) og tóma lista eða örugga hjálpara, aldrei gervitölur sem villa um fyrir raungögnum.

---

## 2. Verndun á staðværum kóða (Localhost Protection)
* **Aldrei yfirskrifa staðværar stillingar á localhost:**
  - `.env` og gagnagrunnstengingar (DB_HOST, DB_USER, DB_PASSWORD, DB_PORT, DB_NAME).
  - Sérsniðnar staðværar breytingar í skrám eins og `server.ts` eða `src/services/api.ts`.
* **Sjálfstæðar einingar (Modularity):**
  - Allar nýjar aðgerðir og viðmótshlutir skulu vera aðskilin í eigin íhluti (components) í stað þess að breyta kjarnaskrám óþarflega.
* **Samstilling milli AI Studio og Localhost:**
  - Mælt er með að nota Git greinar (branches) eða `git diff` / `git stash` áður en breytingar eru dregnar inn (git pull eða afritun skráa).
  - Skrár sem breytast í AI Studio eru tilgreindar nákvæmlega svo hægt sé að afrita eingöngu viðeigandi viðmótsskrár án þess að snerta bakenda eða grunnstillingar.
