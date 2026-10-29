# Personal Google Dorking Query Generator

A responsive, client-side web application designed to construct and deconstruct precise, valid Google search operator queries for security research, OSINT audits, and document discovery.

Runs 100% in the web browser with **zero external dependencies, no backend, no APIs, and no telemetry**. Designed with the **Geist / Swiss Industrial Minimalist** design system.

---

## Key Features

### 1. Reverse Query Parser ("Deconstruct Raw Dork")
* **Two-Way Synchronization**: Paste any pre-existing raw Google Dork (from Google Hacking Database / Exploit-DB, GitHub, or bug bounty writeups), and the parser extracts operators back into individual interactive builder fields.
* **Auto-Extracts**:
  * Target domain & subdomains (`site:`)
  * Grouped file extensions `(filetype:... OR filetype:...)` mapped to active UI chips + custom extensions
  * URL path rules (`inurl:`, `allinurl:`, and grouped `OR` paths)
  * Title parameters (`intitle:`, `allintitle:`)
  * Body copy strings (`intext:`, `allintext:`)
  * Standalone exact phrases (`"..."`)
  * Exclusions (`-keyword` and `-"quoted phrase"`)
  * Disjunctions (`OR`)
  * Date boundaries (`after:YYYY-MM-DD`, `before:YYYY-MM-DD`)
* **Trigger Methods**:
  * Click **"Deconstruct to Form"** in the live buffer header.
  * Click **"Paste & Deconstruct"** in the action toolbar to import directly from clipboard or prompt.
  * Direct paste listener detects dork strings pasted into the buffer and offers 1-click unpacking.

### 2. Interactive Query Builder
* **Target Scope**: Filter by domain, subdomains, or top-level domains (`site:`). Automatically sanitizes URLs and trims protocols (`https://`) while preserving specific directory paths.
* **Search Term Modifiers**:
  * Keywords / Search terms (standard all-words search).
  * Exact phrase matching (`"..."`) with automatic quotation wrapping.
  * Logical combinations with capitalized `OR` (e.g. `(secret OR token OR key)`).
  * Exclusions (`-keyword` and `-"phrase with spaces"`).
* **Advanced Operators**:
  * Multi-select file extension chips (`pdf`, `docx`, `xlsx`, `sql`, `env`, `log`, etc.) combined logically with `OR`.
  * Custom filetype input.
  * Title search (`intitle:` and `allintitle:`).
  * URL search (`inurl:` and `allinurl:`).
  * Body text search (`intext:` and `allintext:`).
  * Time range filters (`after:YYYY-MM-DD` and `before:YYYY-MM-DD`).

### 3. Live Editable Terminal Buffer & Synchronization
* Real-time query assembly as you adjust fields and chips.
* Editable preview textarea: modify query strings directly without losing sync.
* "MODIFIED" status badge appears on manual edits, with a 1-click **Sync Builder** button to re-sync with form inputs.
* Character counter and term counter with Google term truncation threshold warning (>32 terms).

### 4. Quick Actions
* **Copy Query**: Instant clipboard copy with visual toast notifications and fallback for older environments.
* **Open in Google**: Safely URL-encodes queries and opens search results in a new tab with `noopener,noreferrer`.
* **Save Bookmarks**: Save favorite dork queries to browser local storage.
* **Clear All**: Reset all builder inputs and query states in one click.

### 5. Predefined Dorking Templates
* Built-in library of structured security and research dorks:
  * Directory Listings & Open Indexes (`intitle:"index of /"`)
  * Exposed Environment & Config Files (`filetype:env`, `filetype:yaml`, etc.)
  * Database Backups & SQL Dumps (`filetype:sql`, `filetype:bak`, etc.)
  * Sensitive & Confidential Documents
  * Admin & Authentication Portals
  * Public Server Logs & Error Traces
  * Exposed Version Control Repositories (`.git`, `.svn`)
  * Subdomain & Asset Discovery
  * Cloud Storage Buckets (AWS S3, Azure Blob)
  * Public Code Snippets & Pastes (Pastebin, GitHub Gist)
  * API Specifications & Swagger UI
  * Academic & Research Papers
* Global domain variable replacement: enter a target domain once and all templates update instantaneously.
* 1-click "Load in Builder" to customize any template.

### 6. Bulk Variation Generator
* Generate a batch of queries across multiple variations (file extensions, directory paths, or custom keyword lists).
* Pre-packaged presets for Auth Portals, Sensitive Files, Database Dumps, Information Disclosures, Document Types, and Cloud Storage.
* Individual "Copy" and "Open in Google" buttons for each variation.
* "Copy All" and "Export .TXT" batch export.

### 7. Search Operators Cheat Sheet
* Complete quick-reference table for standard Google search operators, examples, and syntax guidelines (e.g. no spaces after colons).

---

## Scope & Safety Notice

This application strictly operates as an input-to-query string formatter and launcher. 
* It does **not** execute automated background searches or web scraping.
* It does **not** scan websites or exploit vulnerabilities.
* All Google searches are opened manually by the user in their own web browser.

---

## How to Run

No build step, package manager, or server setup is required.

### Method 1: Direct File Opening
Double-click `index.html` or open it directly in any modern browser:
```bash
# Windows
start index.html

# macOS
open index.html

# Linux
xdg-open index.html
```

### Method 2: Local HTTP Server (Optional)
```bash
# Using Python 3
python -m http.server 8080

# Using Node.js (npx)
npx serve .
```
Then navigate to `http://localhost:8080`.

---

## Deploying to Render (render.com)

This repository is pre-configured for **Render**. You can deploy it using either method:

### Option A: Static Site via Render Blueprint (Recommended — 100% Free Tier)
1. Push this repository to GitHub or GitLab.
2. In the [Render Dashboard](https://dashboard.render.com), click **New +** $\rightarrow$ **Blueprint**.
3. Connect your repository. Render will automatically detect the [render.yaml](file:///c:/Users/DELL/Desktop/simple%20query%20generator/render.yaml) file and configure:
   * **Runtime**: `Static`
   * **Build Command**: `npm run build`
   * **Publish Directory**: `.`
   * **Security Headers**: `X-Frame-Options`, `X-Content-Type-Options`, and `Referrer-Policy`.
4. Click **Apply**. Your app is immediately live on Render's global CDN with automated HTTPS.

### Option B: Node.js Web Service
If you prefer deploying as a web service rather than a static site:
1. In the Render Dashboard, click **New +** $\rightarrow$ **Web Service**.
2. Connect your repository.
3. Configure settings:
   * **Environment**: `Node`
   * **Build Command**: `npm run build`
   * **Start Command**: `npm start`
4. Render will assign a `PORT` environment variable, which [server.js](file:///c:/Users/DELL/Desktop/simple%20query%20generator/server.js) automatically binds to `0.0.0.0`.

---

## File Structure

```
simple query generator/
├── index.html       # Single-page layout, controls, and preview elements
├── style.css        # Geist / Swiss Industrial minimalist dark design system
├── app.js           # Core state, forward/reverse parsers, and actions
├── server.js        # Zero-dependency Node.js HTTP server for Render Web Service
├── render.yaml      # Native Render Blueprint specification
├── package.json     # Node script definitions (build, start, test)
├── .gitignore       # Git exclusions
├── test-app.js      # Comprehensive automated unit tests (parser & DOM)
└── README.md        # Documentation and deployment guide
```
