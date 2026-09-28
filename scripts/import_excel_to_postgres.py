#!/usr/bin/env python3
"""
=============================================================================
RÍKISGÁT: INNLESTUR Á EXCEL (.XLSX) OG CSV GÖGNUM Í POSTGRESQL (RIKISGAT)
=============================================================================

Notkun:
    1. Stök skrá:
       python scripts/import_excel_to_postgres.py data/2026_4.xlsx

    2. Öll mappa (t.d. allar skrár 2017_1 til 2026_4 í röð):
       python scripts/import_excel_to_postgres.py data/

    3. Prófun án skráningar í gagnagrunn (Dry Run):
       python scripts/import_excel_to_postgres.py data/2026_4.xlsx --dry-run

Kröfur:
    pip install openpyxl psycopg2-binary python-dotenv
"""

import sys
import os
import glob
import re
from datetime import datetime

# Reyna að hlaða .env ef til er
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

try:
    import openpyxl
except ImportError:
    print("❌ Vantar openpyxl. Keyrðu: pip install openpyxl psycopg2-binary python-dotenv")
    sys.exit(1)

try:
    import psycopg2
    from psycopg2.extras import execute_values, RealDictCursor
except ImportError:
    print("❌ Vantar psycopg2. Keyrðu: pip install psycopg2-binary")
    sys.exit(1)

# Gagnagrunnsstillingar
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "5432"))
DB_NAME = os.getenv("DB_NAME", "rikisgat")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASS = os.getenv("DB_PASSWORD", "")

BATCH_SIZE = 10000

def clean_amount(val):
    """Hreinsar upphæðir (krónur, kommur, punkta) og skilar float/int."""
    if val is None:
        return 0.0
    if isinstance(val, (int, float)):
        return float(val)
    s = str(val).strip()
    s = s.replace(" kr", "").replace(" kr.", "").replace(" ISK", "")
    # Íslenskt snið: 1.234.567,89 -> 1234567.89
    if "," in s and "." in s:
        s = s.replace(".", "").replace(",", ".")
    elif "," in s:
        s = s.replace(",", ".")
    try:
        return float(s)
    except ValueError:
        return 0.0

def clean_date(val):
    """Hreinsar dagsetningu og skilar YYYY-MM-DD streng."""
    if val is None:
        return None
    if isinstance(val, datetime):
        return val.strftime("%Y-%m-%d")
    s = str(val).strip()
    # Snið: DD.MM.YYYY eða DD/MM/YYYY
    match = re.search(r"(\d{1,2})[./-](\d{1,2})[./-](\d{4})", s)
    if match:
        d, m, y = match.groups()
        return f"{y}-{int(m):02d}-{int(d):02d}"
    # Snið: YYYY-MM-DD
    match = re.search(r"(\d{4})[./-](\d{1,2})[./-](\d{1,2})", s)
    if match:
        y, m, d = match.groups()
        return f"{y}-{int(m):02d}-{int(d):02d}"
    return s[:10] if len(s) >= 10 else None

def find_col_idx(header, candidates):
    for i, col in enumerate(header):
        c_clean = str(col).strip().lower()
        for cand in candidates:
            if cand in c_clean:
                return i
    return None

def get_connection():
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASS
        )
        return conn
    except Exception as e:
        # Prófa varagagnagrunn 'opnir_reikningar' ef 'rikisgat' fannst ekki
        if "rikisgat" in str(e):
            try:
                conn = psycopg2.connect(
                    host=DB_HOST,
                    port=DB_PORT,
                    dbname="opnir_reikningar",
                    user=DB_USER,
                    password=DB_PASS
                )
                print(f"ℹ️ Tengdist varagagnagrunni: opnir_reikningar")
                return conn
            except Exception:
                pass
        print(f"❌ Gat ekki tengst PostgreSQL ({DB_NAME} á {DB_HOST}:{DB_PORT}): {e}")
        sys.exit(1)

def load_cache(conn):
    """Hleður stofnanir og birgja í in-memory dict fyrir leifturhraða uppflettingu."""
    print("⏳ Hleð uppflettitöflur (stofnanir og birgja) úr gagnagrunni...")
    with conn.cursor() as cur:
        cur.execute("SELECT id, LOWER(TRIM(nafn)) FROM stofnanir;")
        stofnanir_map = {row[1]: row[0] for row in cur.fetchall() if row[1]}

        cur.execute("SELECT id, LOWER(TRIM(nafn)), COALESCE(kt, '') FROM birgjar;")
        birgjar_map = {}
        birgjar_kt_map = {}
        for r_id, r_nafn, r_kt in cur.fetchall():
            if r_nafn:
                birgjar_map[r_nafn] = r_id
            if r_kt:
                birgjar_kt_map[r_kt.strip()] = r_id

    print(f"   -> {len(stofnanir_map):,} stofnanir í minni")
    print(f"   -> {len(birgjar_map):,} birgjar í minni")
    return stofnanir_map, birgjar_map, birgjar_kt_map

def get_or_create_stofnun(cur, stofnanir_map, name):
    name_clean = str(name).strip() if name else "Óskráð stofnun"
    key = name_clean.lower()
    if key in stofnanir_map:
        return stofnanir_map[key]

    cur.execute("INSERT INTO stofnanir (nafn) VALUES (%s) RETURNING id;", (name_clean,))
    new_id = cur.fetchone()[0]
    stofnanir_map[key] = new_id
    return new_id

def get_or_create_birgir(cur, birgjar_map, birgjar_kt_map, name, kt=None):
    name_clean = str(name).strip() if name else "Óskráður birgir"
    name_key = name_clean.lower()
    kt_clean = str(kt).strip() if kt else None

    if kt_clean and kt_clean in birgjar_kt_map:
        return birgjar_kt_map[kt_clean]
    if name_key in birgjar_map:
        return birgjar_map[name_key]

    cur.execute("INSERT INTO birgjar (nafn, kt) VALUES (%s, %s) RETURNING id;", (name_clean, kt_clean))
    new_id = cur.fetchone()[0]
    birgjar_map[name_key] = new_id
    if kt_clean:
        birgjar_kt_map[kt_clean] = new_id
    return new_id

def process_file(filepath, conn, stofnanir_map, birgjar_map, birgjar_kt_map, dry_run=False):
    filename = os.path.basename(filepath)
    file_size_mb = os.path.getsize(filepath) / (1024 * 1024)
    print(f"\n=======================================================")
    print(f"📂 VINN ÚR SKRÁ: {filename} ({file_size_mb:.2f} MB)")
    print(f"=======================================================")

    wb = openpyxl.load_workbook(filepath, read_only=True, data_only=True)
    ws = wb[wb.sheetnames[0]]
    rows_iter = ws.iter_rows(values_only=True)

    header = None
    for r in rows_iter:
        if any(c is not None for c in r):
            header = r
            break

    if not header:
        print("❌ Fann enga dálka.")
        wb.close()
        return 0, 0

    idx_numer = find_col_idx(header, ["reikning", "numer", "númer", "fylgiskjal", "nr"])
    idx_dags = find_col_idx(header, ["dags", "dagsetning", "bókunardags", "útgáfudags", "date"])
    idx_upphaed = find_col_idx(header, ["fjárhæð", "upphæð", "upphaed", "heildarupphæð", "amount"])
    idx_stofnun = find_col_idx(header, ["stofnun", "greiðandi", "kaupandi", "aðili", "client"])
    idx_birgir = find_col_idx(header, ["birgir", "nafn birgis", "seljandi", "supplier"])
    idx_kt = find_col_idx(header, ["kt", "kennitala", "kt."])
    idx_tegund = find_col_idx(header, ["tegund", "bókhaldslykill", "lykill", "skýring", "vörulýsing", "deild", "heiti"])

    print("Greining dálka:")
    print(f" - Reikningsnúmer : {header[idx_numer] if idx_numer is not None else '❌ Fannst ekki (sjálfvirkt)'}")
    print(f" - Dagsetning     : {header[idx_dags] if idx_dags is not None else '❌ Vantar dagsetningardálk'}")
    print(f" - Upphæð         : {header[idx_upphaed] if idx_upphaed is not None else '❌ Vantar upphæðardálk'}")
    print(f" - Stofnun        : {header[idx_stofnun] if idx_stofnun is not None else '❌ Vantar stofnanadálk'}")
    print(f" - Birgir         : {header[idx_birgir] if idx_birgir is not None else '❌ Vantar birgjadálk'}")
    print(f" - Tegund/Lykill  : {header[idx_tegund] if idx_tegund is not None else '— (Almennur rekstur)'}")

    if idx_upphaed is None or idx_dags is None:
        print("❌ Ekki hægt að vinna skrá án dagsetningar og upphæðar.")
        wb.close()
        return 0, 0

    cur = conn.cursor()
    batch_records = []
    total_rows = 0
    total_amount = 0.0

    insert_sql = """
        INSERT INTO reikningar (numer, dags, upphaed, stofnun_id, birgi_id, tegund)
        VALUES %s;
    """

    for row in rows_iter:
        if not any(row):
            continue

        raw_upphaed = row[idx_upphaed] if idx_upphaed is not None else 0
        raw_dags = row[idx_dags] if idx_dags is not None else None
        
        amount = clean_amount(raw_upphaed)
        date_str = clean_date(raw_dags)
        if not date_str:
            continue

        inv_num = str(row[idx_numer]).strip() if idx_numer is not None and row[idx_numer] is not None else None
        st_name = row[idx_stofnun] if idx_stofnun is not None else "Óskráð stofnun"
        b_name = row[idx_birgir] if idx_birgir is not None else "Óskráður birgir"
        b_kt = row[idx_kt] if idx_kt is not None else None
        tegund = str(row[idx_tegund]).strip() if idx_tegund is not None and row[idx_tegund] is not None else "Almennur rekstur"

        st_id = get_or_create_stofnun(cur, stofnanir_map, st_name)
        b_id = get_or_create_birgir(cur, birgjar_map, birgjar_kt_map, b_name, b_kt)

        batch_records.append((inv_num, date_str, amount, st_id, b_id, tegund))
        total_rows += 1
        total_amount += amount

        if len(batch_records) >= BATCH_SIZE:
            if not dry_run:
                execute_values(cur, insert_sql, batch_records)
                conn.commit()
            print(f"   -> Skráð {total_rows:,} línur... ({total_amount:,.0f} kr.)", end="\r")
            batch_records = []

    if batch_records:
        if not dry_run:
            execute_values(cur, insert_sql, batch_records)
            conn.commit()
        print(f"   -> Skráð {total_rows:,} línur... ({total_amount:,.0f} kr.)")

    cur.close()
    wb.close()

    status_str = "PRÓFUN (Dry Run - engu breytt)" if dry_run else "LOKIÐ (Skráð í PostgreSQL)"
    print(f"\n✅ {status_str}: {filename}")
    print(f"   - Línufjöldi : {total_rows:,}")
    print(f"   - Samtals    : {total_amount:,.0f} kr.".replace(",", "."))

    return total_rows, total_amount

def main():
    if len(sys.argv) < 2:
        print("Notkun:")
        print("  python scripts/import_excel_to_postgres.py <skrá.xlsx_eða_mappa> [--dry-run]")
        sys.exit(1)

    target_path = sys.argv[1]
    dry_run = "--dry-run" in sys.argv

    files_to_process = []
    if os.path.isdir(target_path):
        # Finna allar .xlsx skrár í möppunni og raða þeim (t.d. 2017_1, 2017_2, ... 2026_4)
        files = glob.glob(os.path.join(target_path, "*.xlsx")) + glob.glob(os.path.join(target_path, "*.XLSX"))
        
        # Snjöll röðun eftir ári og númeri (2017_1 kemur á undan 2017_2)
        def sort_key(f):
            base = os.path.basename(f)
            nums = re.findall(r"\d+", base)
            return [int(n) for n in nums] if nums else [base]
        
        files_to_process = sorted(files, key=sort_key)
        print(f"Fann {len(files_to_process)} Excel skrár í möppunni: {target_path}")
    elif os.path.isfile(target_path):
        files_to_process = [target_path]
    else:
        print(f"❌ Slóð fannst ekki: {target_path}")
        sys.exit(1)

    if not files_to_process:
        print("Engar .xlsx skrár fundust til að vinna úr.")
        sys.exit(0)

    conn = get_connection()
    stofnanir_map, birgjar_map, birgjar_kt_map = load_cache(conn)

    grand_total_rows = 0
    grand_total_amount = 0.0

    start_time = datetime.now()

    for idx, filepath in enumerate(files_to_process, 1):
        print(f"\n[{idx}/{len(files_to_process)}] Byrja á {os.path.basename(filepath)}")
        rows, amt = process_file(filepath, conn, stofnanir_map, birgjar_map, birgjar_kt_map, dry_run=dry_run)
        grand_total_rows += rows
        grand_total_amount += amt

    conn.close()
    duration = (datetime.now() - start_time).total_seconds()

    print("\n" + "=" * 65)
    print("🏆 HEILDARNIÐURSTAÐA INNLESTURS")
    print("=" * 65)
    print(f"Skrár unnar     : {len(files_to_process):,}")
    print(f"Heildarlínur    : {grand_total_rows:,}")
    print(f"Heildarupphæð   : {grand_total_amount:,.0f} kr.".replace(",", "."))
    print(f"Tími            : {duration:.1f} sekúndur ({grand_total_rows / max(duration, 0.1):,.0f} línur/sek)")
    print("=" * 65)

if __name__ == "__main__":
    main()
