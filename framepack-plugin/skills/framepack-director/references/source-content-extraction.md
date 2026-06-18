# Source Content Extraction

When a user says "make a video based on this link," the first task is to
extract the source content before Phase 1 can begin. Standard tools
(web_extract / web_search via Firecrawl, browser_navigate) can fail —
exhausted credits, timeouts on JS-heavy social platforms. These fallbacks
retrieve text content reliably without API keys.

## Priority order

1. web_extract (Firecrawl) — first choice, returns clean markdown
2. Platform oEmbed API (curl) — zero-auth fallback for social media
3. TinyFish fetch.get_contents(["url"], format="markdown") — alternative scraper
4. browser_navigate + browser_snapshot — last resort, slow but works on most pages

## Twitter / X oEmbed API (proven reliable)

X/Twitter pages are JS-heavy SPAs that time out in browser automation and
consume Firecrawl credits. The oEmbed endpoint returns the full tweet text
in JSON with zero authentication:

```bash
curl -sL "https://publish.twitter.com/oembed?url=https://x.com/<user>/status/<id>"
```

Returns JSON with:
- `html` — tweet text in a `<blockquote>` (HTML-encoded, unescape with `python -m json.tool` or `jq -r .html`)
- `author_name` — display name (e.g. "墓碑科技")
- `author_url` — profile URL

Works for threads, replies, and quoted tweets. Handles CJK text correctly.
Rate-limited only under extreme volume (hundreds per minute).

## YouTube oEmbed

```bash
curl -sL "https://www.youtube.com/oembed?url=<watch_url>&format=json"
```

Returns title, author, thumbnail URL. For full transcripts use
`npx hyperframes transcribe` or the youtube-content skill.

## Vimeo oEmbed

```bash
curl -sL "https://vimeo.com/api/oembed.json?url=<vimeo_url>"
```

## Extraction → Phase 1 handoff

Once you have the source text:
1. Summarize the core message in 1-2 sentences
2. Identify the narrative type (announcement, opinion, data, promo)
3. Proceed to Phase 1 Step 1 (Understand intent) using the extracted content
   as the "What" seed
