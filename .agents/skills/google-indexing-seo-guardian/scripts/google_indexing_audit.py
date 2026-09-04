#!/usr/bin/env python3
"""Quick local audit for core Google indexing and SEO checks in HTML files."""

from __future__ import annotations

import argparse
import json
import os
import re
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from urllib.parse import urlsplit


GA_ID = "G-8LLESL207Q"
RTL_LANGS = ("ar", "fa", "he", "ur")
ABSOLUTE_URL_RE = re.compile(r"^https?://", re.IGNORECASE)
TAG_ATTR_RE = re.compile(
    r'([:\w-]+)\s*=\s*("([^"]*)"|\'([^\']*)\'|([^\s"\'=<>`]+))',
    re.IGNORECASE,
)


@dataclass
class PageAudit:
    path: Path
    relative_path: str
    title: str = ""
    description: str = ""
    canonical: str = ""
    h1_count: int = 0
    first_h1: str = ""
    ga_status: str = "missing"
    og_status: str = "missing"
    structured_data_status: str = "missing"
    img_total: int = 0
    missing_alt: int = 0
    internal_link_total: int = 0
    broken_internal_links: int = 0
    critical: list[str] = field(default_factory=list)
    high: list[str] = field(default_factory=list)
    medium: list[str] = field(default_factory=list)

    def score(self) -> float:
        value = 10.0
        value -= len(self.critical) * 1.5
        value -= len(self.high) * 0.8
        value -= len(self.medium) * 0.35
        return max(0.0, round(value, 1))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Quick local audit for core Google indexing and SEO checks.",
    )
    parser.add_argument(
        "paths",
        nargs="*",
        default=["."],
        help="HTML files or directories containing HTML files",
    )
    parser.add_argument(
        "--site-root",
        default="",
        help="Site root used to resolve href values that start with /",
    )
    return parser.parse_args()


def collect_html_files(raw_paths: list[str]) -> list[Path]:
    files: list[Path] = []
    seen: set[Path] = set()
    for raw_path in raw_paths:
        path = Path(raw_path).expanduser().resolve()
        if not path.exists():
            continue
        if path.is_file() and path.suffix.lower() == ".html":
            if path not in seen:
                files.append(path)
                seen.add(path)
            continue
        if path.is_dir():
            for html_file in sorted(path.rglob("*.html")):
                if html_file not in seen:
                    files.append(html_file)
                    seen.add(html_file)
    return files


def parse_attrs(tag_html: str) -> dict[str, str]:
    attrs: dict[str, str] = {}
    for match in TAG_ATTR_RE.finditer(tag_html):
        value = match.group(3) or match.group(4) or match.group(5) or ""
        attrs[match.group(1).lower()] = value
    return attrs


def normalize_space(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def strip_html(value: str) -> str:
    return normalize_space(re.sub(r"<[^>]+>", " ", value))


def get_tag_content(text: str, tag_name: str) -> str:
    match = re.search(
        rf"<{tag_name}\b[^>]*>(.*?)</{tag_name}>",
        text,
        re.IGNORECASE | re.DOTALL,
    )
    return match.group(1) if match else ""


def get_title(head_html: str) -> str:
    match = re.search(r"<title\b[^>]*>(.*?)</title>", head_html, re.IGNORECASE | re.DOTALL)
    return normalize_space(match.group(1)) if match else ""


def get_meta_tags(head_html: str) -> list[dict[str, str]]:
    tags = re.findall(r"<meta\b[^>]*>", head_html, re.IGNORECASE)
    return [parse_attrs(tag) for tag in tags]


def get_link_tags(head_html: str) -> list[dict[str, str]]:
    tags = re.findall(r"<link\b[^>]*>", head_html, re.IGNORECASE)
    return [parse_attrs(tag) for tag in tags]


def get_script_tags(head_html: str) -> list[str]:
    return re.findall(r"<script\b[^>]*>.*?</script>", head_html, re.IGNORECASE | re.DOTALL)


def get_json_ld_blocks(head_html: str) -> list[str]:
    return re.findall(
        r'<script\b[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',
        head_html,
        re.IGNORECASE | re.DOTALL,
    )


def first_significant_head_tag(head_html: str) -> str:
    cleaned = re.sub(r"<!--.*?-->", "", head_html, flags=re.DOTALL)
    match = re.search(r"<([a-zA-Z][\w:-]*)\b[^>]*>", cleaned)
    return match.group(0) if match else ""


def is_rtl_lang(lang_value: str) -> bool:
    lowered = lang_value.lower()
    return any(lowered == rtl or lowered.startswith(f"{rtl}-") for rtl in RTL_LANGS)


def find_meta_content(meta_tags: list[dict[str, str]], key: str, value: str) -> str:
    for attrs in meta_tags:
        if attrs.get(key, "").lower() == value.lower():
            return attrs.get("content", "")
    return ""


def find_link_href(link_tags: list[dict[str, str]], rel_value: str) -> str:
    for attrs in link_tags:
        rel = attrs.get("rel", "").lower()
        rel_parts = {part.strip() for part in rel.split()}
        if rel_value.lower() in rel_parts:
            return attrs.get("href", "")
    return ""


def resolve_internal_href(href: str, current_file: Path, site_root: Path) -> Path | None:
    if not href:
        return None
    if href.startswith(("#", "mailto:", "tel:", "javascript:", "data:")):
        return None
    parsed = urlsplit(href)
    if parsed.scheme or parsed.netloc:
        return None

    clean_path = parsed.path
    if not clean_path:
        return None

    if clean_path.startswith("/"):
        return (site_root / clean_path.lstrip("/")).resolve()
    return (current_file.parent / clean_path).resolve()


def path_exists_for_link(candidate: Path) -> bool:
    if candidate.exists():
        if candidate.is_dir():
            return (candidate / "index.html").exists()
        return True
    if candidate.suffix:
        return False
    if candidate.with_suffix(".html").exists():
        return True
    return (candidate / "index.html").exists()


def summarize_tag_state(values: list[str], required_count: int) -> str:
    present = sum(1 for value in values if value)
    if present == 0:
        return "missing"
    if present < required_count:
        return "partial"
    return "complete"


def analyze_page(file_path: Path, site_root: Path) -> PageAudit:
    text = file_path.read_text(encoding="utf-8", errors="ignore")
    audit = PageAudit(
        path=file_path,
        relative_path=os.path.relpath(file_path, site_root),
    )

    if not text.startswith("<!DOCTYPE html>"):
        audit.critical.append("DOCTYPE is missing or not on the first line")

    html_match = re.search(r"<html\b([^>]*)>", text, re.IGNORECASE)
    if not html_match:
        audit.critical.append("html tag is missing")
    else:
        html_attrs = parse_attrs(html_match.group(0))
        lang_value = html_attrs.get("lang", "")
        dir_value = html_attrs.get("dir", "")
        if not lang_value:
            audit.critical.append("html lang is missing")
        if lang_value and is_rtl_lang(lang_value) and dir_value.lower() != "rtl":
            audit.medium.append("RTL page is missing dir=rtl")

    head_html = get_tag_content(text, "head")
    if not head_html:
        audit.critical.append("head section is missing")
        return audit

    body_html = get_tag_content(text, "body")
    if not body_html or not strip_html(body_html):
        audit.critical.append("body is missing or empty")

    meta_tags = get_meta_tags(head_html)
    link_tags = get_link_tags(head_html)
    script_tags = get_script_tags(head_html)
    json_ld_blocks = get_json_ld_blocks(head_html)

    first_head_tag = first_significant_head_tag(head_html).lower()
    charset_ok = False
    for attrs in meta_tags:
        charset_value = attrs.get("charset", "")
        if charset_value.lower() == "utf-8":
            charset_ok = True
            break
    if not charset_ok:
        audit.critical.append("meta charset=UTF-8 is missing")
    elif "charset" not in first_head_tag:
        audit.critical.append("meta charset is not the first significant head element")

    viewport = find_meta_content(meta_tags, "name", "viewport")
    if not viewport:
        audit.critical.append("meta viewport is missing")
    else:
        lowered_viewport = viewport.lower()
        if "user-scalable=no" in lowered_viewport or "maximum-scale=1" in lowered_viewport:
            audit.high.append("viewport contains disallowed accessibility restrictions")

    audit.title = get_title(head_html)
    if not audit.title:
        audit.critical.append("title is missing")
    elif len(audit.title) < 30 or len(audit.title) > 60:
        audit.medium.append(f"title length is outside the recommended range ({len(audit.title)})")

    audit.description = find_meta_content(meta_tags, "name", "description")
    if not audit.description:
        audit.high.append("meta description is missing")
    elif len(audit.description) < 120 or len(audit.description) > 160:
        audit.medium.append(
            f"meta description length is outside the recommended range ({len(audit.description)})"
        )

    audit.canonical = find_link_href(link_tags, "canonical")
    if not audit.canonical:
        audit.critical.append("canonical is missing")
    elif not ABSOLUTE_URL_RE.match(audit.canonical):
        audit.critical.append("canonical is not an absolute URL")

    robots = find_meta_content(meta_tags, "name", "robots")
    if robots and "noindex" in robots.lower():
        audit.high.append("robots contains noindex")

    ga_src_pattern = re.compile(r"googletagmanager\.com/gtag/js\?id=([A-Z0-9-]+)", re.IGNORECASE)
    ga_config_pattern = re.compile(r"gtag\(\s*['\"]config['\"]\s*,\s*['\"]([^'\"]+)['\"]", re.IGNORECASE)

    src_ids: list[str] = []
    config_ids: list[str] = []
    for script in script_tags:
        src_match = ga_src_pattern.search(script)
        if src_match:
            src_ids.append(src_match.group(1))
        config_ids.extend(ga_config_pattern.findall(script))

    correct_src_count = sum(1 for value in src_ids if value == GA_ID)
    correct_config_count = sum(1 for value in config_ids if value == GA_ID)
    if correct_src_count == 0 or correct_config_count == 0:
        audit.critical.append("Google Analytics is missing or incomplete")
        audit.ga_status = "missing"
    else:
        audit.ga_status = "present"
        if correct_src_count > 1 or correct_config_count > 1:
            audit.critical.append("Google Analytics is duplicated")
            audit.ga_status = "duplicate"

        other_ids = sorted({value for value in src_ids + config_ids if value != GA_ID})
        if other_ids:
            audit.high.append(f"Additional Google Analytics IDs need review: {', '.join(other_ids)}")
            if audit.ga_status == "present":
                audit.ga_status = "conflict"

        if len(script_tags) < 2:
            audit.high.append("Google Analytics is not the first two scripts in head")
        else:
            first_script = script_tags[0]
            second_script = script_tags[1]
            if not ga_src_pattern.search(first_script) or GA_ID not in first_script:
                audit.high.append("External GA script is not the first script in head")
                if audit.ga_status == "present":
                    audit.ga_status = "misplaced"
            if GA_ID not in second_script or not ga_config_pattern.search(second_script):
                audit.high.append("GA config script is not the second script in head")
                if audit.ga_status == "present":
                    audit.ga_status = "misplaced"
            if ga_src_pattern.search(first_script) and "async" not in first_script.lower():
                audit.high.append("gtag.js is missing async")

    og_values = [
        find_meta_content(meta_tags, "property", "og:type"),
        find_meta_content(meta_tags, "property", "og:title"),
        find_meta_content(meta_tags, "property", "og:description"),
        find_meta_content(meta_tags, "property", "og:url"),
        find_meta_content(meta_tags, "property", "og:image"),
    ]
    audit.og_status = summarize_tag_state(og_values, 5)
    if audit.og_status == "missing":
        audit.high.append("Open Graph tags are missing")
    elif audit.og_status == "partial":
        audit.high.append("Open Graph tags are incomplete")

    twitter_values = [
        find_meta_content(meta_tags, "name", "twitter:card"),
        find_meta_content(meta_tags, "name", "twitter:title"),
        find_meta_content(meta_tags, "name", "twitter:description"),
        find_meta_content(meta_tags, "name", "twitter:image"),
    ]
    twitter_status = summarize_tag_state(twitter_values, 4)
    if twitter_status == "missing":
        audit.high.append("Twitter card tags are missing")
    elif twitter_status == "partial":
        audit.high.append("Twitter card tags are incomplete")

    if json_ld_blocks:
        invalid_json = False
        wrong_context = False
        missing_type = False
        for block in json_ld_blocks:
            try:
                parsed = json.loads(block)
            except json.JSONDecodeError:
                invalid_json = True
                continue
            items = parsed if isinstance(parsed, list) else [parsed]
            for item in items:
                if isinstance(item, dict):
                    if item.get("@context") != "https://schema.org":
                        wrong_context = True
                    if not item.get("@type"):
                        missing_type = True
        if invalid_json:
            audit.high.append("JSON-LD is invalid")
            audit.structured_data_status = "invalid"
        elif wrong_context or missing_type:
            audit.high.append("JSON-LD needs context or schema type review")
            audit.structured_data_status = "partial"
        else:
            audit.structured_data_status = "valid"
    else:
        audit.structured_data_status = "missing"
        audit.high.append("Structured data is missing")

    h1_matches = re.findall(r"<h1\b[^>]*>(.*?)</h1>", body_html, re.IGNORECASE | re.DOTALL)
    audit.h1_count = len(h1_matches)
    audit.first_h1 = strip_html(h1_matches[0]) if h1_matches else ""
    if audit.h1_count == 0:
        audit.critical.append("h1 is missing")
    elif audit.h1_count > 1:
        audit.high.append("More than one h1 exists")

    image_tags = re.findall(r"<img\b[^>]*>", text, re.IGNORECASE)
    audit.img_total = len(image_tags)
    for tag in image_tags:
        attrs = parse_attrs(tag)
        if "alt" not in attrs:
            audit.missing_alt += 1
    if audit.missing_alt:
        audit.high.append(f"Images without alt: {audit.missing_alt}")

    for match in re.finditer(r"<a\b[^>]*href\s*=\s*(['\"])(.*?)\1[^>]*>(.*?)</a>", text, re.IGNORECASE | re.DOTALL):
        href = match.group(2).strip()
        link_text = strip_html(match.group(3))
        if href.startswith(("http://", "https://", "mailto:", "tel:", "#", "javascript:", "data:")):
            continue
        audit.internal_link_total += 1
        candidate = resolve_internal_href(href, file_path, site_root)
        if candidate and not path_exists_for_link(candidate):
            audit.broken_internal_links += 1
        if link_text.lower() in {"click here", "read more", "link"}:
            audit.medium.append(f"Generic anchor text: {link_text}")
    if audit.broken_internal_links:
        audit.critical.append(f"Broken internal links: {audit.broken_internal_links}")

    return audit


def add_duplicate_issues(audits: list[PageAudit]) -> None:
    title_map: dict[str, list[PageAudit]] = {}
    description_map: dict[str, list[PageAudit]] = {}

    for audit in audits:
        if audit.title:
            title_map.setdefault(audit.title, []).append(audit)
        if audit.description:
            description_map.setdefault(audit.description, []).append(audit)

    for pages in title_map.values():
        if len(pages) > 1:
            locations = ", ".join(page.relative_path for page in pages)
            message = f"Duplicate title across pages: {locations}"
            for page in pages:
                if message not in page.critical:
                    page.critical.append(message)

    for pages in description_map.values():
        if len(pages) > 1:
            locations = ", ".join(page.relative_path for page in pages)
            message = f"Duplicate meta description across pages: {locations}"
            for page in pages:
                if message not in page.high:
                    page.high.append(message)


def overall_score(audits: list[PageAudit]) -> float:
    if not audits:
        return 0.0
    return round(sum(audit.score() for audit in audits) / len(audits), 1)


def bucket_score(base: float, weight: float) -> float:
    return max(0.0, round(min(10.0, base - weight), 1))


def print_bucket(title: str, audits: list[PageAudit], bucket_name: str) -> None:
    print(title)
    has_items = False
    for audit in audits:
        issues = getattr(audit, bucket_name)
        for issue in issues:
            has_items = True
            print(f"- [{audit.relative_path}] {issue}")
    if not has_items:
        print("- None")
    print()


def print_report(audits: list[PageAudit]) -> None:
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    ga_ok = sum(1 for audit in audits if audit.ga_status == "present")
    ga_missing = sum(1 for audit in audits if audit.ga_status == "missing")
    ga_wrong = sum(1 for audit in audits if audit.ga_status in {"duplicate", "conflict", "misplaced"})

    print("=== GOOGLE INDEXING AUDIT REPORT ===")
    print("Trigger: manual tool run")
    print(f"Files Audited: {len(audits)}")
    print(f"Date: {timestamp}")
    print()
    print("--- GOOGLE ANALYTICS STATUS ---")
    print(f"Files WITH GA code: {ga_ok}")
    print(f"Files WITHOUT GA code: {ga_missing}")
    print(f"Files with WRONG GA code: {ga_wrong}")
    print(f"GA ID verified: {GA_ID}")
    print()

    print_bucket("--- CRITICAL ISSUES ---", audits, "critical")
    print_bucket("--- HIGH ISSUES ---", audits, "high")
    print_bucket("--- MEDIUM ISSUES ---", audits, "medium")

    print("--- PAGE-BY-PAGE SUMMARY ---")
    for audit in audits:
        title_state = "present" if audit.title else "missing"
        description_state = "present" if audit.description else "missing"
        canonical_state = "present" if audit.canonical else "missing"
        print(f"[{audit.relative_path}]")
        print(f"  Title: {title_state} [{len(audit.title)}]")
        print(f"  Description: {description_state} [{len(audit.description)}]")
        print(f"  Canonical: {canonical_state} [{audit.canonical or '-'}]")
        print(f"  H1: [{audit.h1_count}] [{audit.first_h1 or '-'}]")
        print(f"  GA Code: [{audit.ga_status}]")
        print(f"  OG Tags: [{audit.og_status}]")
        print(f"  Structured Data: [{audit.structured_data_status}]")
        print(f"  Images: [{audit.img_total}] [without alt: {audit.missing_alt}]")
        print(f"  Internal Links: [{audit.internal_link_total}] [broken: {audit.broken_internal_links}]")
        print(f"  Score: [{audit.score()}/10]")
        print()

    critical_total = sum(len(audit.critical) for audit in audits)
    high_total = sum(len(audit.high) for audit in audits)
    medium_total = sum(len(audit.medium) for audit in audits)
    average = overall_score(audits)
    indexability = bucket_score(10.0, critical_total * 0.3 + high_total * 0.08)
    seo_completeness = bucket_score(10.0, high_total * 0.22 + medium_total * 0.06)
    technical_health = bucket_score(10.0, critical_total * 0.18 + high_total * 0.12 + medium_total * 0.04)
    mobile_readiness = bucket_score(10.0, medium_total * 0.08 + high_total * 0.04)

    print("--- OVERALL PROJECT SCORE ---")
    print(f"Indexability: {indexability}/10")
    print(f"SEO Completeness: {seo_completeness}/10")
    print(f"Technical Health: {technical_health}/10")
    print(f"Mobile Readiness: {mobile_readiness}/10")
    print(f"Overall: {average}/10")
    print("=== END REPORT ===")


def main() -> int:
    args = parse_args()
    html_files = collect_html_files(args.paths)
    if not html_files:
        print("No HTML files were found.")
        return 1

    if args.site_root:
        site_root = Path(args.site_root).expanduser().resolve()
    else:
        dir_candidates: list[Path] = []
        file_candidates: list[Path] = []
        for raw_path in args.paths:
            path = Path(raw_path).expanduser().resolve()
            if not path.exists():
                continue
            if path.is_dir():
                dir_candidates.append(path)
            else:
                file_candidates.append(path.parent)

        if dir_candidates:
            site_root = Path(os.path.commonpath([str(path) for path in dir_candidates]))
        elif file_candidates:
            site_root = Path.cwd().resolve()
        else:
            site_root = html_files[0].parent

    audits = [analyze_page(path, site_root) for path in html_files]
    add_duplicate_issues(audits)
    print_report(audits)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
