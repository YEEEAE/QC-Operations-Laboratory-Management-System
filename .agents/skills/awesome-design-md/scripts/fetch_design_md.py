#!/usr/bin/env python3
"""Fetch a curated DESIGN.md from getdesign.md.

Supports listing, fetching, searching, and comparing design references.
Source: https://github.com/VoltAgent/awesome-design-md
"""

from __future__ import annotations

import argparse
import json
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path


# ---------------------------------------------------------------------------
# Full catalog — 69 brands from VoltAgent/awesome-design-md (April 2026)
# ---------------------------------------------------------------------------

CATALOG: dict[str, dict[str, str]] = {
    # AI & LLM Platforms
    "claude":       {"category": "AI & LLM Platforms", "desc": "Warm terracotta accent, clean editorial layout"},
    "cohere":       {"category": "AI & LLM Platforms", "desc": "Enterprise AI platform, vibrant gradients, data-rich dashboard"},
    "elevenlabs":   {"category": "AI & LLM Platforms", "desc": "Dark cinematic UI, audio-waveform aesthetics"},
    "minimax":      {"category": "AI & LLM Platforms", "desc": "Bold dark interface with neon accents"},
    "mistral.ai":   {"category": "AI & LLM Platforms", "desc": "French-engineered minimalism, purple-toned"},
    "ollama":       {"category": "AI & LLM Platforms", "desc": "Terminal-first, monochrome simplicity"},
    "opencode.ai":  {"category": "AI & LLM Platforms", "desc": "Developer-centric dark theme"},
    "replicate":    {"category": "AI & LLM Platforms", "desc": "Clean white canvas, code-forward ML platform"},
    "runwayml":     {"category": "AI & LLM Platforms", "desc": "Cinematic dark UI, media-rich layout"},
    "together.ai":  {"category": "AI & LLM Platforms", "desc": "Technical, blueprint-style AI infrastructure"},
    "voltagent":    {"category": "AI & LLM Platforms", "desc": "Void-black canvas, emerald accent, terminal-native"},
    "x.ai":         {"category": "AI & LLM Platforms", "desc": "Stark monochrome, futuristic minimalism"},

    # Developer Tools & IDEs
    "cursor":       {"category": "Developer Tools & IDEs", "desc": "AI-first code editor, sleek dark interface, gradient accents"},
    "expo":         {"category": "Developer Tools & IDEs", "desc": "React Native platform, dark theme, tight letter-spacing"},
    "lovable":      {"category": "Developer Tools & IDEs", "desc": "AI full-stack builder, playful gradients, friendly dev aesthetic"},
    "raycast":      {"category": "Developer Tools & IDEs", "desc": "Productivity launcher, sleek dark chrome, vibrant gradient accents"},
    "superhuman":   {"category": "Developer Tools & IDEs", "desc": "Fast email client, premium dark UI, keyboard-first, purple glow"},
    "vercel":       {"category": "Developer Tools & IDEs", "desc": "Frontend deployment, black and white precision, Geist font"},
    "warp":         {"category": "Developer Tools & IDEs", "desc": "Modern terminal, dark IDE-like interface, block-based command UI"},

    # Backend, Database & DevOps
    "clickhouse":   {"category": "Backend, Database & DevOps", "desc": "Fast analytics database, yellow-accented, technical docs style"},
    "composio":     {"category": "Backend, Database & DevOps", "desc": "Tool integration platform, modern dark, colorful icons"},
    "hashicorp":    {"category": "Backend, Database & DevOps", "desc": "Infrastructure automation, enterprise-clean, black and white"},
    "mongodb":      {"category": "Backend, Database & DevOps", "desc": "Document database, green leaf branding, dev docs focus"},
    "posthog":      {"category": "Backend, Database & DevOps", "desc": "Product analytics, playful hedgehog, developer-friendly dark UI"},
    "sanity":       {"category": "Backend, Database & DevOps", "desc": "Headless CMS, red accent, content-first editorial layout"},
    "sentry":       {"category": "Backend, Database & DevOps", "desc": "Error monitoring, dark dashboard, data-dense, pink-purple accent"},
    "supabase":     {"category": "Backend, Database & DevOps", "desc": "Open-source Firebase, dark emerald theme, code-first"},

    # Productivity & SaaS
    "cal":          {"category": "Productivity & SaaS", "desc": "Open-source scheduling, clean neutral UI"},
    "intercom":     {"category": "Productivity & SaaS", "desc": "Customer messaging, friendly blue palette, conversational UI"},
    "linear.app":   {"category": "Productivity & SaaS", "desc": "Project management, ultra-minimal, precise, purple accent"},
    "mintlify":     {"category": "Productivity & SaaS", "desc": "Documentation platform, clean, green-accented, reading-optimized"},
    "notion":       {"category": "Productivity & SaaS", "desc": "All-in-one workspace, warm minimalism, serif headings, soft surfaces"},
    "resend":       {"category": "Productivity & SaaS", "desc": "Email API, minimal dark theme, monospace accents"},
    "semrush":      {"category": "Productivity & SaaS", "desc": "SEO & marketing platform, data-rich dashboard aesthetic"},
    "zapier":       {"category": "Productivity & SaaS", "desc": "Automation platform, warm orange, friendly illustration-driven"},

    # Design & Creative Tools
    "airtable":     {"category": "Design & Creative Tools", "desc": "Spreadsheet-database hybrid, colorful, friendly, structured data"},
    "clay":         {"category": "Design & Creative Tools", "desc": "Creative agency, organic shapes, soft gradients, art-directed"},
    "figma":        {"category": "Design & Creative Tools", "desc": "Collaborative design tool, vibrant multi-color, playful yet professional"},
    "framer":       {"category": "Design & Creative Tools", "desc": "Website builder, bold black and blue, motion-first, design-forward"},
    "miro":         {"category": "Design & Creative Tools", "desc": "Visual collaboration, bright yellow accent, infinite canvas aesthetic"},
    "webflow":      {"category": "Design & Creative Tools", "desc": "Visual web builder, blue-accented, polished marketing site aesthetic"},

    # Fintech & Crypto
    "binance":      {"category": "Fintech & Crypto", "desc": "Crypto exchange, bold Binance Yellow on monochrome, trading-floor urgency"},
    "coinbase":     {"category": "Fintech & Crypto", "desc": "Crypto exchange, clean blue identity, trust-focused, institutional feel"},
    "kraken":       {"category": "Fintech & Crypto", "desc": "Crypto trading platform, purple-accented dark UI, data-dense dashboards"},
    "mastercard":   {"category": "Fintech & Crypto", "desc": "Global payments, warm cream canvas, orbital pill shapes, editorial warmth"},
    "revolut":      {"category": "Fintech & Crypto", "desc": "Digital banking, sleek dark interface, gradient cards, fintech precision"},
    "stripe":       {"category": "Fintech & Crypto", "desc": "Payment infrastructure, signature purple gradients, weight-300 elegance"},
    "wise":         {"category": "Fintech & Crypto", "desc": "International money transfer, bright green accent, friendly and clear"},

    # E-commerce & Retail
    "airbnb":       {"category": "E-commerce & Retail", "desc": "Travel marketplace, warm coral accent, photography-driven, rounded UI"},
    "meta":         {"category": "E-commerce & Retail", "desc": "Tech retail store, photography-first, binary light/dark, Meta Blue CTAs"},
    "nike":         {"category": "E-commerce & Retail", "desc": "Athletic retail, monochrome UI, massive uppercase Futura, full-bleed photos"},
    "shopify":      {"category": "E-commerce & Retail", "desc": "E-commerce platform, dark-first cinematic, neon green accent"},
    "starbucks":    {"category": "E-commerce & Retail", "desc": "Coffee retail, four-tier earth-green system, warm cream canvas, SoDoSans"},

    # Media & Consumer Tech
    "apple":        {"category": "Media & Consumer Tech", "desc": "Consumer electronics, premium white space, SF Pro, cinematic imagery"},
    "ibm":          {"category": "Media & Consumer Tech", "desc": "Enterprise technology, Carbon design system, structured blue palette"},
    "nvidia":       {"category": "Media & Consumer Tech", "desc": "GPU computing, green-black energy, technical power aesthetic"},
    "pinterest":    {"category": "Media & Consumer Tech", "desc": "Visual discovery platform, red accent, masonry grid, image-first"},
    "playstation":  {"category": "Media & Consumer Tech", "desc": "Gaming console retail, three-surface layout, cyan hover-scale interaction"},
    "spacex":       {"category": "Media & Consumer Tech", "desc": "Space technology, stark black and white, full-bleed imagery, futuristic"},
    "spotify":      {"category": "Media & Consumer Tech", "desc": "Music streaming, vibrant green on dark, bold type, album-art-driven"},
    "theverge":     {"category": "Media & Consumer Tech", "desc": "Tech editorial, acid-mint and ultraviolet accents, Manuka display type"},
    "uber":         {"category": "Media & Consumer Tech", "desc": "Mobility platform, bold black and white, tight type, urban energy"},
    "vodafone":     {"category": "Media & Consumer Tech", "desc": "Global telecom, monumental uppercase display, Vodafone Red chapter bands"},
    "wired":        {"category": "Media & Consumer Tech", "desc": "Tech magazine, paper-white broadsheet density, custom serif, ink-blue links"},

    # Automotive & Luxury
    "bmw":          {"category": "Automotive & Luxury", "desc": "Luxury automotive, dark premium surfaces, precise German engineering aesthetic"},
    "bugatti":      {"category": "Automotive & Luxury", "desc": "Luxury hypercar, cinema-black canvas, monochrome austerity, monumental display"},
    "ferrari":      {"category": "Automotive & Luxury", "desc": "Luxury automotive, chiaroscuro black-white editorial, Ferrari Red extreme sparseness"},
    "lamborghini":  {"category": "Automotive & Luxury", "desc": "Luxury automotive, true black cathedral, gold accent, LamboType Neo-Grotesk"},
    "renault":      {"category": "Automotive & Luxury", "desc": "French automotive, vivid aurora gradients, NouvelR typeface, zero-radius buttons"},
    "tesla":        {"category": "Automotive & Luxury", "desc": "Electric vehicles, radical subtraction, cinematic full-viewport photography"},
}


BASE_URL = "https://getdesign.md/design-md"


def build_url(source: str) -> str:
    """Turn a slug or full URL into a fetchable getdesign.md URL."""
    if source.startswith("http://") or source.startswith("https://"):
        return source
    slug = source.strip().strip("/")
    if not slug:
        raise ValueError("empty slug")
    return f"{BASE_URL}/{urllib.parse.quote(slug, safe='.')}/DESIGN.md"


def fetch(url: str) -> str:
    """Fetch content from a URL with proper headers."""
    request = urllib.request.Request(
        url,
        headers={
            "Accept": "text/markdown,text/plain,*/*",
            "User-Agent": "BrightAI awesome-design-md skill",
        },
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        charset = response.headers.get_content_charset() or "utf-8"
        return response.read().decode(charset)


def list_slugs(by_category: bool = False) -> None:
    """Print all known slugs, optionally grouped by category."""
    if not by_category:
        print("\n".join(sorted(CATALOG.keys())))
        return

    categories: dict[str, list[str]] = {}
    for slug, info in sorted(CATALOG.items()):
        cat = info["category"]
        categories.setdefault(cat, []).append(f"  {slug:20s} — {info['desc']}")

    for cat in sorted(categories):
        print(f"\n## {cat}")
        print("\n".join(categories[cat]))


def search_catalog(query: str) -> None:
    """Search the catalog by keyword across slugs, categories, and descriptions."""
    query_lower = query.lower()
    results = []
    for slug, info in sorted(CATALOG.items()):
        combined = f"{slug} {info['category']} {info['desc']}".lower()
        if query_lower in combined:
            results.append(f"  {slug:20s} [{info['category']}] — {info['desc']}")

    if results:
        print(f"Found {len(results)} match(es) for '{query}':\n")
        print("\n".join(results))
    else:
        print(f"No matches found for '{query}'.")


def compare_designs(slugs: list[str]) -> None:
    """Fetch and display multiple DESIGN.md files side-by-side."""
    for slug in slugs:
        info = CATALOG.get(slug)
        url = build_url(slug)
        header = f"{'=' * 60}\n{slug.upper()}"
        if info:
            header += f"  [{info['category']}]"
            header += f"\n{info['desc']}"
        header += f"\nURL: {url}\n{'=' * 60}"
        print(header)

        try:
            content = fetch(url)
            # Print first 80 lines as preview
            lines = content.split("\n")
            preview = "\n".join(lines[:80])
            print(preview)
            if len(lines) > 80:
                print(f"\n... ({len(lines) - 80} more lines)")
        except (urllib.error.URLError, TimeoutError, ValueError) as exc:
            print(f"  ⚠ Failed to fetch: {exc}")
        print()


def export_catalog_json(output_path: str | None = None) -> None:
    """Export the catalog as JSON."""
    data = {slug: info for slug, info in sorted(CATALOG.items())}
    result = json.dumps(data, indent=2, ensure_ascii=False)
    if output_path:
        Path(output_path).write_text(result, encoding="utf-8")
        print(f"Catalog exported to {output_path}")
    else:
        print(result)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Fetch, search, compare, and list DESIGN.md references from getdesign.md",
        epilog="Source: https://github.com/VoltAgent/awesome-design-md",
    )
    parser.add_argument("source", nargs="?", help="Catalog slug or full getdesign.md URL")
    parser.add_argument("--output", "-o", help="Output file path. Defaults to stdout.")
    parser.add_argument("--list", action="store_true", help="List known slugs")
    parser.add_argument("--list-full", action="store_true", help="List slugs grouped by category with descriptions")
    parser.add_argument("--search", metavar="QUERY", help="Search catalog by keyword")
    parser.add_argument("--compare", nargs="+", metavar="SLUG", help="Compare multiple DESIGN.md files")
    parser.add_argument("--export-json", nargs="?", const="-", metavar="PATH", help="Export catalog as JSON")
    parser.add_argument("--info", metavar="SLUG", help="Show info about a specific slug")
    args = parser.parse_args()

    # Handle --list
    if args.list:
        list_slugs(by_category=False)
        return 0

    # Handle --list-full
    if args.list_full:
        list_slugs(by_category=True)
        return 0

    # Handle --search
    if args.search:
        search_catalog(args.search)
        return 0

    # Handle --compare
    if args.compare:
        compare_designs(args.compare)
        return 0

    # Handle --export-json
    if args.export_json:
        output = None if args.export_json == "-" else args.export_json
        export_catalog_json(output)
        return 0

    # Handle --info
    if args.info:
        slug = args.info.strip()
        info = CATALOG.get(slug)
        if info:
            print(f"Slug:     {slug}")
            print(f"Category: {info['category']}")
            print(f"Style:    {info['desc']}")
            print(f"URL:      {build_url(slug)}")
        else:
            print(f"Unknown slug: {slug}")
            print(f"Run with --list to see all available slugs.")
            return 1
        return 0

    # Default: fetch a single DESIGN.md
    if not args.source:
        parser.error("source is required unless --list, --search, --compare, or --export-json is used")

    url = build_url(args.source)
    try:
        content = fetch(url)
    except (urllib.error.URLError, TimeoutError, ValueError) as exc:
        print(f"Failed to fetch {url}: {exc}", file=sys.stderr)
        return 1

    if args.output:
        path = Path(args.output).expanduser()
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")
        print(f"✓ Saved to {path}")
    else:
        print(content, end="" if content.endswith("\n") else "\n")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
