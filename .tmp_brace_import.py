import zipfile
import xml.etree.ElementTree as ET
from uuid import uuid4
from pathlib import Path

path = Path('/root/brace__1/products_brace.xlsx')
ns = {'main': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}

def read_xlsx(path):
    with zipfile.ZipFile(path) as z:
        shared = []
        if 'xl/sharedStrings.xml' in z.namelist():
            ss = ET.fromstring(z.read('xl/sharedStrings.xml'))
            for si in ss.findall('main:si', ns):
                texts = [t.text or '' for t in si.findall('.//main:t', ns)]
                shared.append(''.join(texts))

        wb = ET.fromstring(z.read('xl/workbook.xml'))
        sheets = []
        for sh in wb.findall('main:sheets/main:sheet', ns):
            name = sh.attrib.get('name')
            sheet_id = sh.attrib.get('sheetId')
            sheets.append((name, sheet_id))

        def col_to_idx(col):
            idx = 0
            for c in col:
                idx = idx * 26 + (ord(c) - 64)
            return idx - 1

        def cell_ref_to_idx(ref):
            col = ''.join([c for c in ref if c.isalpha()])
            row = ''.join([c for c in ref if c.isdigit()])
            return int(row) - 1, col_to_idx(col)

        def read_sheet(sheet_path):
            root = ET.fromstring(z.read(sheet_path))
            rows = []
            max_col = 0
            for row in root.findall('main:sheetData/main:row', ns):
                r_idx = int(row.attrib.get('r', '1')) - 1
                cells = {}
                for c in row.findall('main:c', ns):
                    ref = c.attrib.get('r')
                    if not ref:
                        continue
                    r, c_idx = cell_ref_to_idx(ref)
                    v = c.find('main:v', ns)
                    if v is None:
                        val = ''
                    else:
                        val = v.text or ''
                    if c.attrib.get('t') == 's':
                        try:
                            val = shared[int(val)]
                        except Exception:
                            pass
                    cells[c_idx] = val
                    if c_idx > max_col:
                        max_col = c_idx
                rows.append((r_idx, cells))
            dense = []
            if rows:
                max_row = max(r for r, _ in rows)
                for _ in range(max_row + 1):
                    dense.append([''] * (max_col + 1))
                for r, cells in rows:
                    for c_idx, val in cells.items():
                        dense[r][c_idx] = val
            return dense

        data = {}
        for name, sheet_id in sheets:
            sheet_path = f'xl/worksheets/sheet{sheet_id}.xml'
            data[name] = read_sheet(sheet_path)
        return data

def rows_to_dicts(rows):
    if not rows:
        return []
    header = [h.strip() for h in rows[0]]
    out = []
    for row in rows[1:]:
        if all((c == '' for c in row)):
            continue
        d = {header[i]: (row[i] if i < len(row) else '') for i in range(len(header))}
        out.append(d)
    return out

def sql_str(s):
    return "'" + s.replace("'", "''") + "'"

def sql_nullable(s):
    if s is None:
        return "NULL"
    s = str(s)
    return "NULL" if s == "" else sql_str(s)

def parse_bool(val):
    if val is None:
        return "false"
    s = str(val).strip().lower()
    return "true" if s in ("true", "1", "yes", "y") else "false"

def parse_int(val, default=0):
    try:
        return str(int(float(val)))
    except Exception:
        return str(default)

def parse_array(val):
    if val is None:
        return "ARRAY[]::varchar[]"
    s = str(val).strip()
    if s == "":
        return "ARRAY[]::varchar[]"
    parts = [p.strip() for p in s.split(';') if p.strip()]
    if not parts:
        return "ARRAY[]::varchar[]"
    return "ARRAY[" + ",".join(sql_str(p) for p in parts) + "]::varchar[]"

data = read_xlsx(path)
products = rows_to_dicts(data.get('products', []))
variants = rows_to_dicts(data.get('product_variants', []))
prices = rows_to_dicts(data.get('product_prices', []))
media = rows_to_dicts(data.get('product_media', []))
banners = rows_to_dicts(data.get('banners', []))

prod_id = {p['product_code']: str(uuid4()) for p in products}
var_id = {v['variant_code']: str(uuid4()) for v in variants}

sql = []
sql.append('BEGIN;')
sql.append('TRUNCATE analytics_events, analytics_daily_metrics, analytics_reports RESTART IDENTITY CASCADE;')
sql.append('TRUNCATE product_media, product_prices, product_variants, products, banners RESTART IDENTITY CASCADE;')

for p in products:
    sql.append(
        'INSERT INTO products (id, name, description, hero_media_url, category, is_new, tags, specs, is_deleted) VALUES '
        f"({sql_str(prod_id[p['product_code']])},"
        f"{sql_str(p['name'])},"
        f"{sql_nullable(p.get('description',''))},"
        f"{sql_nullable(p.get('hero_media_url',''))},"
        f"{sql_nullable(p.get('category',''))},"
        f"{parse_bool(p.get('is_new','false'))},"
        f"{parse_array(p.get('tags',''))},"
        f"{parse_array(p.get('specs',''))},"
        'false);'
    )

for v in variants:
    sql.append(
        'INSERT INTO product_variants (id, product_id, size, stock, is_deleted) VALUES '
        f"({sql_str(var_id[v['variant_code']])},"
        f"{sql_str(prod_id[v['product_code']])},"
        f"{sql_str(v['size'])},"
        f"{parse_int(v.get('stock',0))},"
        'false);'
    )

for pr in prices:
    ends = pr.get('ends_at','')
    ends_sql = 'NULL' if ends in (None, '') else sql_str(ends)
    sql.append(
        'INSERT INTO product_prices (id, product_variant_id, price_minor_units, currency_code, starts_at, ends_at) VALUES '
        f"({sql_str(str(uuid4()))},"
        f"{sql_str(var_id[pr['variant_code']])},"
        f"{parse_int(pr.get('price_minor_units',0))},"
        f"{sql_str(pr.get('currency_code','RUB'))},"
        f"{sql_str(pr.get('starts_at'))},"
        f"{ends_sql});"
    )

for m in media:
    sql.append(
        'INSERT INTO product_media (id, product_id, url, sort_order, is_deleted, created_at, updated_at) VALUES '
        f"({sql_str(str(uuid4()))},"
        f"{sql_str(prod_id[m['product_code']])},"
        f"{sql_str(m['url'])},"
        f"{parse_int(m.get('sort_order',0))},"
        'false, now(), now());'
    )

for b in banners:
    sql.append(
        'INSERT INTO banners (id, image_url, video_url, is_active, sort_order, is_deleted, created_at, updated_at) VALUES '
        f"({sql_str(str(uuid4()))},"
        f"{sql_str(b['image_url'])},"
        f"{sql_nullable(b.get('video_url',''))},"
        f"{parse_bool(b.get('is_active','false'))},"
        f"{parse_int(b.get('sort_order',0))},"
        'false, now(), now());'
    )

sql.append('COMMIT;')

out = '/tmp/brace_import.sql'
with open(out, 'w', encoding='utf-8') as f:
    f.write('\n'.join(sql))

print(out)
