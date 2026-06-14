"""
report.py — Report generation helpers for Noëta.

Builds a structured payload from session corrections and renders it
as HTML (Jinja2) or PDF (WeasyPrint).
"""

from __future__ import annotations

import re
import uuid
from datetime import date
from pathlib import Path
from typing import Optional

# ---------------------------------------------------------------------------
# Category mapping — first-match-wins, checked in this exact order
# ---------------------------------------------------------------------------

# Each entry: (greek_label, [keyword_fragments_lowercase])
_CATEGORY_RULES: list[tuple[str, list[str]]] = [
    ("Ορθογραφία",          ["ορθογραφ", "γραφ", "-η/-ι", "-ο/-ω", "κατάληξ", "spelling"]),
    ("Τυπογραφικά",         ["τυπογραφ", "χωρισμ", "ενωτικ", "διπλ", "typograph"]),
    ("Στίξη & διαλυτικά",  ["στίξ", "κόμμ", "ερωτημ", "άνω τελ", "τελεί", "διαλυτ", "εισαγωγικ", "παύλ", "punctuat"]),
    ("Σύνταξη",             ["σύνταξ", "γραμματ", "άρθρ", "πτώσ", "ρήμ", "αριθμ", "γένος", "πρόθεσ", "υποκείμεν", "αντικείμεν", "σύνδεσμ", "grammar", "syntax"]),
    ("Τονισμός",            ["τονισμ", "τόνο", "προπαραλήγ", "παραλήγ", "accent"]),
]

_SEVERITY_FALLBACK: dict[str, str] = {
    "critical": "Ορθογραφία",
    "major":    "Σύνταξη",
    "minor":    "Τονισμός",
}


def category_from_correction(corr: dict) -> str:
    reason_low = (corr.get("reason") or "").lower()
    for label, keywords in _CATEGORY_RULES:
        if any(kw in reason_low for kw in keywords):
            return label
    # fallback by severity
    sev = (corr.get("severity") or "major").lower()
    return _SEVERITY_FALLBACK.get(sev, "Σύνταξη")


# ---------------------------------------------------------------------------
# Severity mapping
# ---------------------------------------------------------------------------

_SEV_MAP = {"critical": "high", "major": "mid", "minor": "low"}
_SEV_LABEL = {"high": "Σοβαρό", "mid": "Μέτριο", "low": "Ήσσον"}


def severity_for_report(corr: dict) -> str:
    sev = (corr.get("severity") or "major").lower()
    return _SEV_MAP.get(sev, "mid")


# ---------------------------------------------------------------------------
# Context extraction — uses exact_offset when available
# ---------------------------------------------------------------------------

_MAX_CTX = 140


def _trim(text: str, side: str) -> str:
    """Trim context to _MAX_CTX chars, adding … at the cut edge."""
    if side == "before":
        if len(text) > _MAX_CTX:
            return "…" + text[-_MAX_CTX:]
        return text
    else:
        if len(text) > _MAX_CTX:
            return text[:_MAX_CTX] + "…"
        return text


def extract_context(corr: dict) -> tuple[str, str]:
    """
    Returns (context_before, context_after) strings surrounding the error.
    Uses exact_offset for disambiguation; falls back to anchor-based search.
    """
    para_text: str = corr.get("paragraph_text") or ""
    original: str = corr.get("original") or ""
    exact_offset: int = corr.get("exact_offset", -1)

    if not para_text or not original:
        anchor = corr.get("anchor") or ""
        return anchor, ""

    # -- Primary path: exact_offset is known and valid
    if exact_offset >= 0:
        end = exact_offset + len(original)
        if end <= len(para_text) and para_text[exact_offset:end] == original:
            return (
                _trim(para_text[:exact_offset], "before"),
                _trim(para_text[end:], "after"),
            )

    # -- Fallback: find first occurrence (acceptable for rare edge cases)
    idx = para_text.find(original)
    if idx != -1:
        end = idx + len(original)
        return (
            _trim(para_text[:idx], "before"),
            _trim(para_text[end:], "after"),
        )

    # -- Last resort: use anchor text as context_before
    anchor = corr.get("anchor") or ""
    return _trim(anchor, "before"), ""


# ---------------------------------------------------------------------------
# REF number
# ---------------------------------------------------------------------------

def _make_ref() -> str:
    today = date.today()
    suffix = str(uuid.uuid4().int)[:4].zfill(4)
    return f"REF-{today.year}-{suffix}"


# ---------------------------------------------------------------------------
# Payload builder
# ---------------------------------------------------------------------------

def build_report_payload(
    corrections: list[dict],
    paragraphs: list[dict],
    filename: str = "",
    teaser_enabled: bool = False,
    teaser_show_first: int = 3,
) -> dict:
    """
    Build the full template context dict from session data.

    corrections  — session.corrections (raw editor shape)
    paragraphs   — session.paragraphs  (list of {number, text, segments})
    filename     — original upload filename (used as document title)
    """
    # Only reportable corrections: pending or accepted fixes (not rejections, not suggestions)
    reportable = [
        c for c in corrections
        if c.get("type") == "fix" and c.get("status") != "rejected"
    ]

    # Document metadata
    word_count = sum(len(p["text"].split()) for p in paragraphs if p.get("text"))
    para_count = len(paragraphs)
    title = filename.rsplit(".", 1)[0].replace("_", " ").replace("-", " ") if filename else "Κείμενο προς έλεγχο"
    today_gr = _format_date_greek(date.today())
    ref = _make_ref()

    total = len(reportable)
    density = round(total / word_count * 1000, 1) if word_count else 0.0

    # Category breakdown
    from collections import Counter
    cat_counts: Counter = Counter(category_from_correction(c) for c in reportable)
    max_count = max(cat_counts.values()) if cat_counts else 1
    # Fixed display order
    cat_order = ["Τονισμός", "Σύνταξη", "Ορθογραφία", "Στίξη & διαλυτικά", "Τυπογραφικά"]
    categories = [
        {
            "name": cat,
            "count": cat_counts[cat],
            "bar_pct": round(cat_counts[cat] / max_count * 100) if max_count else 0,
        }
        for cat in cat_order
        if cat_counts.get(cat, 0) > 0
    ]

    # Build correction entries
    entries = []
    for i, corr in enumerate(reportable, 1):
        ctx_before, ctx_after = extract_context(corr)
        sev = severity_for_report(corr)
        entries.append({
            "num": str(i).zfill(2),
            "paragraph": corr.get("paragraph_number", 0),
            "category": category_from_correction(corr),
            "severity": sev,
            "severity_label": _SEV_LABEL[sev],
            "context_before": ctx_before,
            "original": corr.get("original", ""),
            "corrected": corr.get("suggested", ""),
            "context_after": ctx_after,
            "note": corr.get("reason", ""),
        })

    # Teaser mode
    if teaser_enabled and total > teaser_show_first:
        visible = entries[:teaser_show_first]
        hidden_count = total - teaser_show_first
    else:
        visible = entries
        hidden_count = 0

    return {
        "document": {
            "title": title,
            "subtitle": "Αναφορά γλωσσικού ελέγχου",
            "word_count": f"{word_count:,}".replace(",", "."),
            "word_count_raw": word_count,
            "paragraph_count": para_count,
            "total_corrections": total,
            "density": str(density).replace(".", ","),
            "issued_date": today_gr,
            "ref": ref,
        },
        "categories": categories,
        "entries": visible,
        "hidden_count": hidden_count,
        "teaser_enabled": teaser_enabled,
        "sev_labels": _SEV_LABEL,
    }


# ---------------------------------------------------------------------------
# Greek date formatter
# ---------------------------------------------------------------------------

_MONTHS_GR = [
    "", "Ιανουαρίου", "Φεβρουαρίου", "Μαρτίου", "Απριλίου",
    "Μαΐου", "Ιουνίου", "Ιουλίου", "Αυγούστου",
    "Σεπτεμβρίου", "Οκτωβρίου", "Νοεμβρίου", "Δεκεμβρίου",
]


def _format_date_greek(d: date) -> str:
    return f"{d.day} {_MONTHS_GR[d.month]} {d.year}"


# ---------------------------------------------------------------------------
# HTML rendering (Jinja2)
# ---------------------------------------------------------------------------

_TEMPLATES_DIR = Path(__file__).parent / "templates"


def render_html(payload: dict) -> str:
    try:
        from jinja2 import Environment, FileSystemLoader, select_autoescape
    except ImportError as e:
        raise RuntimeError("jinja2 is not installed — run: pip install jinja2") from e

    env = Environment(
        loader=FileSystemLoader(str(_TEMPLATES_DIR)),
        autoescape=select_autoescape(["html"]),
    )
    template = env.get_template("report.html.j2")
    return template.render(**payload)


# ---------------------------------------------------------------------------
# PDF rendering (WeasyPrint)
# ---------------------------------------------------------------------------

def render_pdf(html: str) -> bytes:
    try:
        from weasyprint import HTML as WP_HTML
    except ImportError as e:
        raise RuntimeError("weasyprint is not installed — run: pip install weasyprint") from e

    return WP_HTML(string=html, base_url=str(_TEMPLATES_DIR)).write_pdf()
