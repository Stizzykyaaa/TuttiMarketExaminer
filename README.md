# TuttiMarketExaminer 🔍

A TypeScript utility built on Deno to monitor, scrape, and evaluate listing data on [tutti.ch](https://www.tutti.ch/). Built to run on scheduled cron intervals, spot underpriced second-hand gear, and log market metrics over time.

> **Engineering Note:**  
> This project was **fully vibe-coded** with AI tooling — but the underlying domain logic, filtering heuristics, architectural decisions, and error-handling flows are **100% human-directed and reasoned**.

---

## ⚡ Features

- **Automated Cron Polling:** Uses Deno's native `Deno.cron` (or scheduled task runners) to periodically pull fresh listings hands-free.
- **Listing Scraping & Normalization:** Ingests active listings, parsing titles, prices, descriptions, locations, and timestamps into strongly-typed interfaces.
- **Deal & Outlier Filtering:** Human-crafted heuristics to separate real bargains from overpriced junk, identify missing info, and target specific cantons.
- **Zero-Config TypeScript:** Runs directly on Deno with native TypeScript execution—no Node modules, bundlers, or transpile steps required.
- **Data Persistence:** Outputs structured data to local files (`JSON`, `CSV`), SQLite, or external webhook notifications.

---

## 🛠️ Stack

- **Runtime:** [Deno](https://deno.land/) (native TypeScript, built-in standard library, secure sandbox)
- **Scheduling:** `Deno.cron` (for automated background runs without third-party schedulers)
- **Networking:** Native `fetch` with custom headers / anti-bot handling
- **Parsing:** Lightweight DOM parser (e.g. `@b-fuze/deno-dom`) or direct JSON payload parsing
- **Configuration:** `deno.json` / `deno.jsonc` and environment variables (`.env`)

---

## 🚀 Setup & Execution

### Prerequisites

Ensure [Deno](https://deno.land/) is installed:
```bash
# macOS / Linux
curl -fsSL [https://deno.land/install.sh](https://deno.land/install.sh) | sh

# Windows (PowerShell)
irm [https://deno.land/install.ps1](https://deno.land/install.ps1) | iex

```

### 1. Clone the repository

```bash
git clone [https://github.com/Stizzykyaaa/TuttiMarketExaminer.git](https://github.com/Stizzykyaaa/TuttiMarketExaminer.git)
cd TuttiMarketExaminer

```

### 2. Run the Examiner

Deno runs TypeScript out of the box without prior compilation.

**Single Run (Fetch & Inspect once):**

```bash
deno run --allow-net --allow-read --allow-write src/main.ts

```

**Scheduled Cron Mode:**
If you are using `Deno.cron` to automate periodic checks:

```bash
deno run --allow-net --allow-read --allow-write --unstable-cron src/main.ts

```

*(Adjust `--allow-*` permission flags based on your script's needs, e.g., `--allow-env` if loading `.env` variables).*

---

## ⚙️ Configuration

Set your filters and intervals in `config.json` or pass them via environment variables:

```json
{
  "query": "ThinkPad",
  "category": "all",
  "minPrice": 50,
  "maxPrice": 500,
  "canton": "BE",
  "cronSchedule": "*/15 * * * *",
  "exportPath": "./data/listings.json"
}

```

---

## 📁 Repository Structure

```text
TuttiMarketExaminer/
├── deno.json            # Tasks, imports, and Deno compiler options
├── src/
│   ├── main.ts          # Entry point and Deno.cron scheduling
│   ├── scraper.ts       # Network requests, pagination, and rate-limiting
│   ├── parser.ts        # DOM / JSON response parsing
│   ├── analyzer.ts      # Core business heuristics & deal evaluation
│   ├── storage.ts       # Persistence logic (JSON/CSV/DB)
│   └── types.ts         # TypeScript types & data interfaces
└── data/                # Exported results and run logs

```

---

## ⚠️ Notes & Disclaimer

* **Terms of Service:** This tool was created strictly for personal data research and educational purposes. Configure your cron intervals reasonably to avoid hammering tutti.ch servers.
* **Vibe-Coding Maintenance:** Because implementation details were generated iteratively via LLM prompts, inspect `src/` whenever tutti.ch updates its frontend markup or API endpoints. The human logic stays intact; selectors and parsing logic just need minor adjustments over time.

---

## 📄 License

Mägi License, for private use only

```
yessir
```