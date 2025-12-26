from __future__ import annotations

import uuid
import zipfile
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import psycopg

from brace_backend.core.config import settings
from brace_backend.core.database import ensure_sync_dsn


NS = {"main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
NAMESPACE = uuid.NAMESPACE_URL


@dataclass(frozen=True)
class ReviewRow:
    external_id: str
    product_id: uuid.UUID
    order_item_id: uuid.UUID | None
    user_id: uuid.UUID | None
    external_order_ref: str | None
    external_user_id: str | None
    rating: int
    text: str
    is_anonymous: bool
    status: str
    created_at: datetime
    updated_at: datetime


@dataclass(frozen=True)
class MediaRow:
    external_id: str
    review_external_id: str
    url: str
    sort_order: int
    created_at: datetime
    updated_at: datetime


@dataclass(frozen=True)
class VoteRow:
    external_id: str
    review_external_id: str
    user_id: uuid.UUID | None
    external_user_id: str | None
    vote: int
    created_at: datetime
    updated_at: datetime


def load_shared_strings(z: zipfile.ZipFile) -> list[str]:
    if "xl/sharedStrings.xml" not in z.namelist():
        return []
    ss = ET.fromstring(z.read("xl/sharedStrings.xml"))
    shared: list[str] = []
    for si in ss.findall("main:si", NS):
        texts = [t.text or "" for t in si.findall(".//main:t", NS)]
        shared.append("".join(texts))
    return shared


def col_to_idx(col: str) -> int:
    idx = 0
    for c in col:
        idx = idx * 26 + (ord(c) - 64)
    return idx - 1


def cell_ref_to_idx(ref: str) -> tuple[int, int]:
    col = "".join([c for c in ref if c.isalpha()])
    row = "".join([c for c in ref if c.isdigit()])
    return int(row) - 1, col_to_idx(col)


def read_sheet(z: zipfile.ZipFile, sheet_path: str, shared: list[str]) -> list[list[str]]:
    root = ET.fromstring(z.read(sheet_path))
    rows: list[tuple[int, dict[int, str]]] = []
    max_col = 0
    for row in root.findall("main:sheetData/main:row", NS):
        r_idx = int(row.attrib.get("r", "1")) - 1
        cells: dict[int, str] = {}
        for c in row.findall("main:c", NS):
            ref = c.attrib.get("r")
            if not ref:
                continue
            _, c_idx = cell_ref_to_idx(ref)
            v = c.find("main:v", NS)
            if v is None:
                val = ""
            else:
                val = v.text or ""
            if c.attrib.get("t") == "s":
                try:
                    val = shared[int(val)]
                except Exception:
                    pass
            cells[c_idx] = val
            max_col = max(max_col, c_idx)
        rows.append((r_idx, cells))
    if not rows:
        return []
    max_row = max(r for r, _ in rows)
    dense = [[""] * (max_col + 1) for _ in range(max_row + 1)]
    for r_idx, cells in rows:
        for c_idx, val in cells.items():
            dense[r_idx][c_idx] = val
    return dense


def load_workbook(path: Path) -> dict[str, list[list[str]]]:
    with zipfile.ZipFile(path) as z:
        shared = load_shared_strings(z)
        wb = ET.fromstring(z.read("xl/workbook.xml"))
        sheets = []
        for sh in wb.findall("main:sheets/main:sheet", NS):
            name = sh.attrib.get("name")
            sheet_id = sh.attrib.get("sheetId")
            sheets.append((name, sheet_id))
        data: dict[str, list[list[str]]] = {}
        for name, sheet_id in sheets:
            sheet_path = f"xl/worksheets/sheet{sheet_id}.xml"
            data[name] = read_sheet(z, sheet_path, shared)
        return data


def rows_to_dicts(rows: list[list[str]]) -> list[dict[str, str]]:
    if not rows:
        return []
    header = [h.strip() for h in rows[0]]
    out: list[dict[str, str]] = []
    for row in rows[1:]:
        if all((c == "" for c in row)):
            continue
        d = {header[i]: (row[i] if i < len(row) else "") for i in range(len(header))}
        out.append(d)
    return out


def parse_uuid(value: Any) -> uuid.UUID | None:
    if value is None:
        return None
    s = str(value).strip()
    if not s:
        return None
    try:
        return uuid.UUID(s)
    except Exception:
        return None


def parse_int(value: Any, default: int = 0) -> int:
    try:
        return int(float(str(value).strip()))
    except Exception:
        return default


def parse_bool(value: Any) -> bool:
    if value is None:
        return False
    s = str(value).strip().lower()
    return s in {"1", "true", "yes", "y"}


def parse_datetime(value: Any) -> datetime | None:
    if value is None:
        return None
    s = str(value).strip()
    if not s:
        return None
    try:
        dt = datetime.fromisoformat(s.replace("Z", "+00:00"))
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
    except Exception:
        pass
    try:
        days = float(s)
        base = datetime(1899, 12, 30, tzinfo=timezone.utc)
        return base + timedelta(days=days)
    except Exception:
        return None


def normalize_review_key(value: str) -> str:
    s = value.strip()
    if s.lower().startswith("r") and s[1:].isdigit():
        return s[1:]
    return s


def to_uuid(namespace_prefix: str, external_id: str) -> uuid.UUID:
    return uuid.uuid5(NAMESPACE, f"{namespace_prefix}:{external_id}")


def build_rows(data: dict[str, list[list[str]]]) -> tuple[list[ReviewRow], list[MediaRow], list[VoteRow]]:
    now = datetime.now(timezone.utc)

    review_rows = []
    for row in rows_to_dicts(data.get("product_reviews", [])):
        external_id = str(row.get("id", "")).strip()
        product_id = parse_uuid(row.get("product_id"))
        if not product_id:
            raise ValueError(f"Invalid product_id: {row.get('product_id')}")
        order_item_raw = row.get("order_item_id")
        user_raw = row.get("user_id")
        order_item_id = parse_uuid(order_item_raw)
        user_id = parse_uuid(user_raw)
        external_order_ref = None if order_item_id else str(order_item_raw).strip() or None
        external_user_id = None if user_id else str(user_raw).strip() or None
        created_at = parse_datetime(row.get("created_at")) or now
        updated_at = parse_datetime(row.get("updated_at")) or created_at
        review_rows.append(
            ReviewRow(
                external_id=external_id,
                product_id=product_id,
                order_item_id=order_item_id,
                user_id=user_id,
                external_order_ref=external_order_ref,
                external_user_id=external_user_id,
                rating=parse_int(row.get("rating"), 0),
                text=str(row.get("text", "")),
                is_anonymous=parse_bool(row.get("is_anonymous")),
                status=str(row.get("status") or "published"),
                created_at=created_at,
                updated_at=updated_at,
            )
        )

    media_rows = []
    for row in rows_to_dicts(data.get("product_review_media", [])):
        url = str(row.get("url", "")).strip()
        if not url:
            continue
        created_at = parse_datetime(row.get("created_at")) or now
        media_rows.append(
            MediaRow(
                external_id=str(row.get("id", "")).strip(),
                review_external_id=normalize_review_key(str(row.get("review_id", ""))),
                url=url,
                sort_order=parse_int(row.get("sort_order"), 0),
                created_at=created_at,
                updated_at=created_at,
            )
        )

    vote_rows = []
    for row in rows_to_dicts(data.get("product_review_votes", [])):
        user_raw = row.get("user_id")
        user_id = parse_uuid(user_raw)
        external_user_id = None if user_id else str(user_raw).strip() or None
        created_at = parse_datetime(row.get("created_at")) or now
        vote_rows.append(
            VoteRow(
                external_id=str(row.get("id", "")).strip(),
                review_external_id=normalize_review_key(str(row.get("review_id", ""))),
                user_id=user_id,
                external_user_id=external_user_id,
                vote=parse_int(row.get("vote"), 0),
                created_at=created_at,
                updated_at=created_at,
            )
        )

    return review_rows, media_rows, vote_rows


def main() -> None:
    data = load_workbook(Path("/tmp/review_brace.xlsx"))
    reviews, media, votes = build_rows(data)

    review_id_map = {r.external_id: to_uuid("review", r.external_id) for r in reviews}

    def map_review_id(external_id: str) -> uuid.UUID:
        ext = normalize_review_key(external_id)
        if ext in review_id_map:
            return review_id_map[ext]
        return to_uuid("review", ext)

    dsn = ensure_sync_dsn(settings.database_url)
    if dsn.startswith("postgresql+psycopg://"):
        dsn = dsn.replace("postgresql+psycopg://", "postgresql://", 1)

    with psycopg.connect(dsn) as conn:
        with conn.cursor() as cur:
            cur.execute(
                "TRUNCATE product_review_votes, product_review_media, product_reviews RESTART IDENTITY CASCADE;"
            )
            for r in reviews:
                cur.execute(
                    """
                    INSERT INTO product_reviews (
                        id, product_id, order_item_id, user_id,
                        external_review_id, external_user_id, external_order_ref,
                        rating, text, is_anonymous, status, created_at, updated_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        review_id_map[r.external_id],
                        r.product_id,
                        r.order_item_id,
                        r.user_id,
                        r.external_id,
                        r.external_user_id,
                        r.external_order_ref,
                        r.rating,
                        r.text,
                        r.is_anonymous,
                        r.status,
                        r.created_at,
                        r.updated_at,
                    ),
                )
            for m in media:
                cur.execute(
                    """
                    INSERT INTO product_review_media (
                        id, review_id, url, sort_order, created_at, updated_at
                    ) VALUES (%s, %s, %s, %s, %s, %s)
                    """,
                    (
                        uuid.uuid5(
                            NAMESPACE,
                            f"review_media:{m.external_id}:{m.review_external_id}:{m.sort_order}:{m.url}",
                        ),
                        map_review_id(m.review_external_id),
                        m.url,
                        m.sort_order,
                        m.created_at,
                        m.updated_at,
                    ),
                )
            for v in votes:
                cur.execute(
                    """
                    INSERT INTO product_review_votes (
                        id, review_id, user_id, external_user_id, vote, created_at, updated_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        uuid.uuid5(
                            NAMESPACE,
                            f"review_vote:{v.external_id}:{v.review_external_id}:{v.vote}",
                        ),
                        map_review_id(v.review_external_id),
                        v.user_id,
                        v.external_user_id,
                        v.vote,
                        v.created_at,
                        v.updated_at,
                    ),
                )
    print("import ok")


if __name__ == "__main__":
    main()
