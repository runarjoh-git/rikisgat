#!/usr/bin/env python3
"""
Skoðari fyrir Excel (.xlsx) og CSV skrár frá opnirreikningar.is.
Notkun:
    python scripts/inspect_excel.py <slóð_á_skrá.xlsx_eða_csv>

Þessi skrifta greinir dálkana, sýnir fyrstu 3 færslurnar og samtölur
án þess að hlaða öllu í einu ef skráin er mjög stór.
"""

import sys
import os

def inspect_file(filepath):
    if not os.path.exists(filepath):
        print(f"❌ Skrá fannst ekki: {filepath}")
        return

    print("=" * 65)
    print(f"🔍 SKOÐA SKRÁ: {os.path.basename(filepath)}")
    print(f"📁 Slóð: {filepath}")
    file_size_mb = os.path.getsize(filepath) / (1024 * 1024)
    print(f"📦 Stærð á diski: {file_size_mb:.2f} MB")
    print("=" * 65)

    if filepath.endswith('.xlsx') or filepath.endswith('.xls'):
        inspect_xlsx(filepath)
    elif filepath.endswith('.csv'):
        inspect_csv(filepath)
    else:
        print("Óþekkt skráarsnið (ekki .xlsx eða .csv).")

def inspect_xlsx(filepath):
    try:
        import openpyxl
    except ImportError:
        print("Vantar openpyxl. Keyrðu: pip install openpyxl")
        return

    print("Hleð Excel vinnubók í léttri lesstillingu (read_only=True)...")
    wb = openpyxl.load_workbook(filepath, read_only=True, data_only=True)
    sheet_names = wb.sheetnames
    print(f"📑 Blöð í vinnubók ({len(sheet_names)}): {', '.join(sheet_names)}")

    ws = wb[sheet_names[0]]
    rows_iter = ws.iter_rows(values_only=True)
    
    header = None
    for row in rows_iter:
        if any(cell is not None for cell in row):
            header = [str(cell).strip() if cell is not None else f"Col_{i}" for i, cell in enumerate(row)]
            break

    if not header:
        print("❌ Fann enga dálkahausa í skjalinu.")
        return

    print(f"\n📋 Dálkar sem fundust ({len(header)}):")
    for i, col in enumerate(header, 1):
        print(f"  [{i:2d}] {col}")

    print("\n🔍 Fyrstu 3 dæmigeraðar raðir:")
    sample_rows = []
    for _ in range(3):
        try:
            r = next(rows_iter)
            sample_rows.append(r)
        except StopIteration:
            break

    for idx, row in enumerate(sample_rows, 1):
        print(f"\n--- Færsla #{idx} ---")
        for col_name, val in zip(header, row):
            print(f"  {col_name:25s} : {val}")

    wb.close()
    print("\n" + "=" * 65)
    print("✅ Skrá lesin með góðum árangri.")

def inspect_csv(filepath):
    import csv
    print("Les CSV skrá...")
    with open(filepath, mode='r', encoding='utf-8-sig', errors='replace') as f:
        # Greina hvort sé kommu- eða semíkommu-skipt (semíkomma algeng í íslensku Excel)
        sample = f.read(4096)
        delimiter = ';' if sample.count(';') > sample.count(',') else ','
        f.seek(0)

        reader = csv.reader(f, delimiter=delimiter)
        header = next(reader, None)
        if not header:
            print("❌ Fann enga dálkahausa í CSV.")
            return

        print(f"\n📋 Dálkar sem fundust (afmörkun: '{delimiter}'):")
        for i, col in enumerate(header, 1):
            print(f"  [{i:2d}] {col}")

        print("\n🔍 Fyrstu 3 dæmigeraðar raðir:")
        for idx in range(1, 4):
            try:
                row = next(reader)
                print(f"\n--- Færsla #{idx} ---")
                for col_name, val in zip(header, row):
                    print(f"  {col_name:25s} : {val}")
            except StopIteration:
                break

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Notkun: python scripts/inspect_excel.py <slóð_á_skrá.xlsx_eða_csv>")
        sys.exit(1)
    inspect_file(sys.argv[1])
