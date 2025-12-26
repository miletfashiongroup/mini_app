# Импорт отзывов в БД (VPS)

Ниже команды для переноса `review_brace.xlsx`, применения миграции и импорта данных в `brace_tg`.

## 1) Залить файл на VPS (с macOS)

```bash
scp -i ~/.ssh/braceTG /Users/shmnn/brace__1/brace__1/review_brace.xlsx root@79.174.93.119:/root/brace__1/review_brace.xlsx
```

## 2) Перенести миграцию на VPS (если ещё не на месте)

```bash
scp -i ~/.ssh/braceTG /Users/shmnn/brace__1/brace__1/packages/backend/alembic/versions/202502250002_add_product_reviews.py root@79.174.93.119:/root/brace__1/packages/backend/alembic/versions/202502250002_add_product_reviews.py
```

## 3) Применить миграции (на VPS)

```bash
ssh -i ~/.ssh/braceTG root@79.174.93.119 "docker exec infra-backend-1 alembic upgrade head"
```

## 4) Сгенерировать SQL из review_brace.xlsx и импортировать

Запусти **две** команды по очереди. Они не используют вложенные кавычки и работают стабильно.

### 4.1 Сгенерировать SQL на VPS

```bash
ssh -i ~/.ssh/braceTG root@79.174.93.119 "cat > /tmp/review_import.py <<'PY'
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

path = Path('/root/brace__1/review_brace.xlsx')
ns = {'main': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}

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


def parse_ts(val):
    if val is None:
        return "NULL"
    s = str(val).strip()
    return "NULL" if s == "" else sql_str(s)


data_reviews = rows_to_dicts(data.get('product_reviews', []))
data_media = rows_to_dicts(data.get('product_review_media', []))
data_votes = rows_to_dicts(data.get('product_review_votes', []))

sql = []
sql.append("BEGIN;")
sql.append("TRUNCATE product_review_votes, product_review_media, product_reviews RESTART IDENTITY CASCADE;")

for r in data_reviews:
    sql.append(
        "INSERT INTO product_reviews (id, product_id, order_item_id, user_id, rating, text, is_anonymous, status, created_at, updated_at) VALUES "
        f"({sql_str(r['id'])},"
        f"{sql_str(r['product_id'].strip())},"
        f"{sql_nullable(r.get('order_item_id',''))},"
        f"{sql_nullable(r.get('user_id',''))},"
        f"{parse_int(r.get('rating',0))},"
        f"{sql_str(r.get('text',''))},"
        f"{parse_bool(r.get('is_anonymous','false'))},"
        f"{sql_str(r.get('status','published'))},"
        f"{parse_ts(r.get('created_at',''))},"
        f"{parse_ts(r.get('updated_at',''))});"
    )

for m in data_media:
    sql.append(
        "INSERT INTO product_review_media (id, review_id, url, sort_order, created_at) VALUES "
        f"({sql_str(m['id'])},"
        f"{sql_str(m['review_id'])},"
        f"{sql_str(m['url'])},"
        f"{parse_int(m.get('sort_order',0))},"
        f"{parse_ts(m.get('created_at',''))});"
    )

for v in data_votes:
    sql.append(
        "INSERT INTO product_review_votes (id, review_id, user_id, vote, created_at) VALUES "
        f"({sql_str(v['id'])},"
        f"{sql_str(v['review_id'])},"
        f"{sql_nullable(v.get('user_id',''))},"
        f"{parse_int(v.get('vote',0))},"
        f"{parse_ts(v.get('created_at',''))});"
    )

sql.append("COMMIT;")

out = "/tmp/review_import.sql"
with open(out, "w", encoding="utf-8") as f:
    f.write("\n".join(sql))

print(out)
PY
python3 /tmp/review_import.py"
```

### 4.2 Импортировать SQL в БД

```bash
ssh -i ~/.ssh/braceTG root@79.174.93.119 "psql -v ON_ERROR_STOP=1 -h 79.174.88.146 -p 18279 -U brace_user -d brace_tg -f /tmp/review_import.sql"
```

## 5) Проверка (на VPS)

```bash
ssh -i ~/.ssh/braceTG root@79.174.93.119 "psql -h 79.174.88.146 -p 18279 -U brace_user -d brace_tg -c 'SELECT count(*) FROM product_reviews; SELECT count(*) FROM product_review_media; SELECT count(*) FROM product_review_votes;'"
```
