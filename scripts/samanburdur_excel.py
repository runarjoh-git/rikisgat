#!/usr/bin/env python3
"""
Samanburður á Excel skrá frá opnirreikningar.is og PostgreSQL gagnagrunni (rikisgat).

Notkun:
    python scripts/samanburdur_excel.py <slóð_á_excel_skrá.xlsx>

Kröfur:
    pip install pandas openpyxl psycopg2-binary python-dotenv
"""

import sys
import os
import re
from datetime import datetime

try:
    import pandas as pd
except ImportError:
    print("Vantar pandas og openpyxl. Keyrðu:")
    print("  pip install pandas openpyxl psycopg2-binary python-dotenv")
    sys.exit(1)

try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
except ImportError:
    print("Vantar psycopg2. Keyrðu:")
    print("  pip install psycopg2-binary")
    sys.exit(1)

# Lesa stillingar úr umhverfisbreytum eða nota sjálfgefin gildi
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "5432"))
DB_NAME = os.getenv("DB_NAME", "rikisgat")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASS = os.getenv("DB_PASSWORD", "")

def find_column(df, candidates):
    for c in df.columns:
        norm = str(c).strip().lower()
        for cand in candidates:
            if cand in norm:
                return c
    return None

def main():
    if len(sys.argv) < 2:
        print("Notkun: python scripts/samanburdur_excel.py <skrá.xlsx>")
        sys.exit(1)

    file_path = sys.argv[1]
    if not os.path.exists(file_path):
        print(f"Skrá fannst ekki: {file_path}")
        sys.exit(1)

    print(f"\n=======================================================")
    print(f" 🔍 LES EXCEL SKRÁ: {os.path.basename(file_path)}")
    print(f"=======================================================")

    df = pd.read_excel(file_path)
    print(f"Fjöldi raða í Excel: {len(df):,}")
    print(f"Dálkar í Excel: {list(df.columns)}")

    # Greina dálka í Excel
    nr_col = find_column(df, ["reikning", "numer", "númer", "fylgiskjal"])
    upphaed_col = find_column(df, ["fjárhæð", "upphæð", "heildarupphæð", "upphaed", "amount"])
    dags_col = find_column(df, ["dagsetning", "dags", "bókunardags", "útgáfudags", "date"])
    stofnun_col = find_column(df, ["stofnun", "greiðandi", "kaupandi", "aðili", "client"])

    print(f"\nGreindir dálkar:")
    print(f" - Reikningsnúmer : {nr_col}")
    print(f" - Upphæð         : {upphaed_col}")
    print(f" - Dagsetning     : {dags_col}")
    print(f" - Stofnun        : {stofnun_col}")

    if not upphaed_col:
        print("Villa: Fann ekki upphæðardálk í Excel!")
        sys.exit(1)

    # Hreinsa upphæðir í Excel
    if df[upphaed_col].dtype == object:
        df["_clean_upphaed"] = (
            df[upphaed_col]
            .astype(str)
            .str.replace(".", "", regex=False)
            .str.replace(",", ".", regex=False)
            .str.replace(" kr", "", regex=False)
            .str.strip()
        )
        df["_clean_upphaed"] = pd.to_numeric(df["_clean_upphaed"], errors="coerce").fillna(0)
    else:
        df["_clean_upphaed"] = pd.to_numeric(df[upphaed_col], errors="coerce").fillna(0)

    excel_total_sum = int(round(df["_clean_upphaed"].sum()))
    excel_total_count = len(df)

    print(f"\n--- SAMTÖLUR Í EXCEL ---")
    print(f"Fjöldi reikninga : {excel_total_count:,}")
    print(f"Heildarupphæð    : {excel_total_sum:,.0f} kr.".replace(",", "."))

    # Tengjast PostgreSQL
    print(f"\n=======================================================")
    print(f" 🔌 TENGIST POSTGRESQL ({DB_NAME} á {DB_HOST}:{DB_PORT})...")
    print(f"=======================================================")

    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASS
        )
    except Exception as e:
        print(f"Gat ekki tengst gagnagrunni: {e}")
        print("Athugaðu DB_USER, DB_PASSWORD og hvort postgres þjónustan sé í gangi.")
        sys.exit(1)

    cursor = conn.cursor(cursor_factory=RealDictCursor)

    # Sækja gögn úr PostgreSQL
    query = """
        SELECT 
            r.id,
            COALESCE(r.numer, '') AS numer,
            r.dags,
            r.upphaed,
            s.nafn AS stofnun,
            b.nafn AS birgir
        FROM reikningar r
        JOIN birgjar b ON r.birgi_id = b.id
        LEFT JOIN stofnanir s ON r.stofnun_id = s.id
        WHERE b.nafn ILIKE '%wise%'
          AND r.dags >= '2017-01-01'
          AND r.dags <= '2026-07-31'
        ORDER BY r.dags ASC;
    """

    cursor.execute(query)
    db_rows = cursor.fetchall()
    conn.close()

    db_total_count = len(db_rows)
    db_total_sum = sum(int(round(r["upphaed"])) for r in db_rows)

    print(f"\n--- SAMTÖLUR Í POSTGRESQL (Wise, 2017 - 31.07.2026) ---")
    print(f"Fjöldi reikninga : {db_total_count:,}")
    print(f"Heildarupphæð    : {db_total_sum:,.0f} kr.".replace(",", "."))

    print(f"\n=======================================================")
    print(f" ⚖️  SAMANBURÐUR (EXCEL vs POSTGRESQL)")
    print(f"=======================================================")

    diff_count = db_total_count - excel_total_count
    diff_sum = db_total_sum - excel_total_sum

    print(f"Fjöldamismunur : {diff_count:+d} reikningar")
    print(f"Upphæðamismunur: {diff_sum:+,.0f} kr.".replace(",", "."))

    if diff_count == 0 and diff_sum == 0:
        print("\n🎉 GAGNASÖFNIN ERU 100% EINS! Enginn mismunur fannst.")
    else:
        print(f"\n⚠️ Mismunur fannst!")
        if diff_count > 0:
            print(f" -> Það eru {diff_count} fleiri reikningar í PostgreSQL en í Excel.")
        elif diff_count < 0:
            print(f" -> Það vantar {abs(diff_count)} reikninga í PostgreSQL sem eru í Excel.")

if __name__ == "__main__":
    main()
