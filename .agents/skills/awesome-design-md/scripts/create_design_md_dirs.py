#!/usr/bin/env python3
"""Create all design-md/{slug}/README.md directories matching the VoltAgent repo structure."""

from pathlib import Path

BRANDS = {
    "airbnb":       ("Airbnb", "airbnb"),
    "airtable":     ("Airtable", "airtable"),
    "apple":        ("Apple", "apple"),
    "binance":      ("Binance", "binance"),
    "bmw":          ("BMW", "bmw"),
    "bugatti":      ("Bugatti", "bugatti"),
    "cal":          ("Cal.com", "cal"),
    "claude":       ("Claude", "claude"),
    "clay":         ("Clay", "clay"),
    "clickhouse":   ("ClickHouse", "clickhouse"),
    "cohere":       ("Cohere", "cohere"),
    "coinbase":     ("Coinbase", "coinbase"),
    "composio":     ("Composio", "composio"),
    "cursor":       ("Cursor", "cursor"),
    "elevenlabs":   ("ElevenLabs", "elevenlabs"),
    "expo":         ("Expo", "expo"),
    "ferrari":      ("Ferrari", "ferrari"),
    "figma":        ("Figma", "figma"),
    "framer":       ("Framer", "framer"),
    "hashicorp":    ("HashiCorp", "hashicorp"),
    "ibm":          ("IBM", "ibm"),
    "intercom":     ("Intercom", "intercom"),
    "kraken":       ("Kraken", "kraken"),
    "lamborghini":  ("Lamborghini", "lamborghini"),
    "linear.app":   ("Linear", "linear.app"),
    "lovable":      ("Lovable", "lovable"),
    "mastercard":   ("Mastercard", "mastercard"),
    "meta":         ("Meta", "meta"),
    "minimax":      ("Minimax", "minimax"),
    "mintlify":     ("Mintlify", "mintlify"),
    "miro":         ("Miro", "miro"),
    "mistral.ai":   ("Mistral AI", "mistral.ai"),
    "mongodb":      ("MongoDB", "mongodb"),
    "nike":         ("Nike", "nike"),
    "notion":       ("Notion", "notion"),
    "nvidia":       ("NVIDIA", "nvidia"),
    "ollama":       ("Ollama", "ollama"),
    "opencode.ai":  ("OpenCode AI", "opencode.ai"),
    "pinterest":    ("Pinterest", "pinterest"),
    "playstation":  ("PlayStation", "playstation"),
    "posthog":      ("PostHog", "posthog"),
    "raycast":      ("Raycast", "raycast"),
    "renault":      ("Renault", "renault"),
    "replicate":    ("Replicate", "replicate"),
    "resend":       ("Resend", "resend"),
    "revolut":      ("Revolut", "revolut"),
    "runwayml":     ("RunwayML", "runwayml"),
    "sanity":       ("Sanity", "sanity"),
    "semrush":      ("Semrush", "semrush"),
    "sentry":       ("Sentry", "sentry"),
    "shopify":      ("Shopify", "shopify"),
    "spacex":       ("SpaceX", "spacex"),
    "spotify":      ("Spotify", "spotify"),
    "starbucks":    ("Starbucks", "starbucks"),
    "stripe":       ("Stripe", "stripe"),
    "supabase":     ("Supabase", "supabase"),
    "superhuman":   ("Superhuman", "superhuman"),
    "tesla":        ("Tesla", "tesla"),
    "theverge":     ("The Verge", "theverge"),
    "together.ai":  ("Together AI", "together.ai"),
    "uber":         ("Uber", "uber"),
    "vercel":       ("Vercel", "vercel"),
    "vodafone":     ("Vodafone", "vodafone"),
    "voltagent":    ("VoltAgent", "voltagent"),
    "warp":         ("Warp", "warp"),
    "webflow":      ("Webflow", "webflow"),
    "wired":        ("WIRED", "wired"),
    "wise":         ("Wise", "wise"),
    "x.ai":         ("xAI", "x.ai"),
    "zapier":       ("Zapier", "zapier"),
}

BASE = Path(__file__).resolve().parent.parent / "design-md"

created = 0
for slug, (display, url_slug) in sorted(BRANDS.items()):
    folder = BASE / slug
    folder.mkdir(parents=True, exist_ok=True)
    readme = folder / "README.md"
    if not readme.exists():
        readme.write_text(
            f"# {display} Inspired Design System\n\n"
            f"Design system details have been moved to: https://getdesign.md/{url_slug}/design-md\n",
            encoding="utf-8",
        )
        created += 1
        print(f"  ✓ {slug}/README.md")
    else:
        print(f"  · {slug}/README.md (exists)")

print(f"\nDone. Created {created} new README files. Total brands: {len(BRANDS)}")
