<div align="center">

# 🔍 Google Dorking Query Generator & Reverse Dork Parser
### Professional OSINT Reconnaissance, Bug Bounty Asset Discovery & Advanced Search Operator Builder

[![Live Demo](https://img.shields.io/badge/Demo-Live%20on%20Render-10b981.svg)](https://google-dorking-helper-tool.onrender.com)
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com)
[![Platform: Web / Browser](https://img.shields.io/badge/Platform-Web%20%7C%20Browser-black.svg)]()
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero-success.svg)]()
[![Theme: Geist / Swiss Dark](https://img.shields.io/badge/Design-Geist%20%2F%20Swiss-000000.svg)]()

<p align="center">
  <strong>Construct, optimize, and deconstruct complex Google Search dorking queries in real time.</strong><br>
  Built for Bug Bounty Hunters, Penetration Testers, OSINT Researchers, and Security Engineers.<br>
  <em>100% Client-Side • Zero Tracking • Zero API Keys • Instant Render Deployment</em>
</p>

[🌐 Open Live App](https://google-dorking-helper-tool.onrender.com) • [Features](#key-features) • [Deploy to Render](#deploy-to-render-rendercom) • [Dork Cheatsheet](#google-dorking-operators-quick-reference) • [Use Cases](#who-is-this-for)

---

</div>

## 📌 Overview

**Google Dorking** (also known as **Google Hacking**) uses specialized Google search operators to uncover security misconfigurations, publicly exposed credentials, open server indexes, leaked database dumps, and sensitive document caches.

The **Google Dorking Query Generator & Reverse Dork Parser** is a fast, privacy-focused developer utility designed with the **Geist / Swiss Industrial Minimalist** design system. Unlike typical online tools, it provides **two-way query synchronization**: construct precision queries using interactive filters and chips, or paste any raw dork from the **Google Hacking Database (GHDB)** to instantly deconstruct it into editable parameters.

---

## 📑 Table of Contents

- [Key Features](#-key-features)
  - [1. Reverse Query Parser (Deconstruct Raw Dorks)](#1-reverse-query-parser-deconstruct-raw-dork)
  - [2. Interactive Query Builder](#2-interactive-query-builder)
  - [3. Live Terminal Output & Syntax Synchronization](#3-live-terminal-output--syntax-synchronization)
  - [4. Curated Security Audit Templates](#4-curated-security-audit-templates)
  - [5. Bulk Dork Variations Generator](#5-bulk-dork-variations-generator)
- [Why Choose This Tool?](#-why-choose-this-tool-vs-alternatives)
- [Who Is This For?](#-who-is-this-for)
- [Google Dorking Operators Quick Reference](#-google-dorking-operators-quick-reference)
- [Popular Dork Patterns Included](#-popular-dork-patterns-included)
- [Deploy to Render (render.com)](#-deploy-to-render-rendercom)
- [Local Installation & Development](#-local-installation--development)
- [Recommended GitHub Repository Topics](#-recommended-github-repository-topics)
- [Ethics, Scope & Responsible Disclosure](#-ethics-scope--responsible-disclosure)
- [License](#-license)

---

## ⚡ Key Features

### 1. Reverse Query Parser ("Deconstruct Raw Dork")
* **Two-Way Synchronization**: Found a query on Exploit-DB, GHDB, or Twitter? Paste any raw Google dork string, and the intelligent parsing engine immediately maps operators into their respective input fields and interactive chips.
* **Intelligent Operator Unpacking**:
  * Extracts target domain & subdomains from `site:` and parenthetical groups.
  * Maps grouped extensions `(filetype:pdf OR filetype:docx)` directly to active UI toggle chips.
  * Separates URL path parameters (`inurl:`, `allinurl:`), page titles (`intitle:`, `allintitle:`), and body copy (`intext:`, `allintext:`).
  * Distinguishes exact phrase matches (`"..."`) from operator arguments.
  * Isolates negative exclusions (`-term` and `-"quoted phrase"`).
  * Automatically handles date constraints (`after:YYYY-MM-DD`, `before:YYYY-MM-DD`).

### 2. Interactive Query Builder
* **Domain & Scope Filter (`site:`)**: Restricts searches to a target domain, top-level domain (`.gov`, `.edu`), or specific URI path. Automatically trims `http/https` protocols and trailing slashes.
* **Tactile Filetype Selector**: Clickable hardware-style toggle chips for common sensitive file types (`pdf`, `docx`, `xlsx`, `csv`, `sql`, `env`, `log`, `conf`, `json`, `xml`, `bak`, `txt`), plus a custom extension field for `yaml`, `ini`, `pem`, `key`, and `db`.
* **Logic Operators**: Combines terms with capitalized `OR`, quotes multi-word phrases automatically, and formats hyphenated exclusions (`-word`).
* **Time Range Boundaries**: Restrict discoveries to documents indexed before or after specific calendar dates.

### 3. Live Terminal Output & Syntax Synchronization
* **Developer Terminal Buffer**: High-contrast, monospaced live preview formatted like an IDE/CLI buffer.
* **Bidirectional State**: Edit query strings directly in the textarea without breaking form synchronization.
* **Google Truncation Warning**: Real-time character and term counter with visual alerts when exceeding Google’s ~32-word query threshold.
* **1-Click Quick Actions**: Instant clipboard copy with toast feedback, direct tab launch on Google, and local bookmark saving.

### 4. Curated Security Audit Templates
Pre-configured with industry-standard search archetypes for rapid reconnaissance:
* **Directory Listings & Open Indexes**: `site:{domain} intitle:"index of /" "parent directory"`
* **Exposed Environment & Config Files**: `site:{domain} (filetype:env OR filetype:yaml OR filetype:conf) "DB_PASSWORD"`
* **Database Backups & SQL Dumps**: `site:{domain} (filetype:sql OR filetype:bak OR filetype:dump OR filetype:db)`
* **Sensitive & Confidential Documents**: `site:{domain} (filetype:pdf OR filetype:docx) "confidential" OR "internal only"`
* **Admin Portals & Management Logins**: `site:{domain} (inurl:admin OR inurl:login OR inurl:portal OR inurl:dashboard)`
* **Public Server Logs & Error Traces**: `site:{domain} (filetype:log OR filetype:txt) intext:"error" OR intext:"stack trace"`
* **Exposed VCS Repositories**: `site:{domain} inurl:".git" OR inurl:".svn" -github.com -gitlab.com`
* **Subdomain Enumeration**: `site:*.{domain} -www.{domain}`
* **Cloud Storage Exposure**: `site:s3.amazonaws.com OR site:blob.core.windows.net "{domain}"`
* **Pastebin & Code Snippet Leaks**: `site:pastebin.com OR site:gist.github.com "{domain}"`
* *Global Variable Replacement*: Enter your target domain once to recompute all templates instantaneously.

### 5. Bulk Dork Variations Generator
* Generate large multi-query variation matrices from keyword lists, URL directories, or file extensions.
* Built-in security presets: **Auth Endpoints**, **Sensitive Files**, **Database Dumps**, **Information Disclosures**, **Document Types**, and **Cloud Buckets**.
* Batch actions: Individual copy/launch buttons, **Copy All**, and **Export .TXT** for downstream tools (e.g. bash scripts, recon pipelines).

---

## 🏆 Why Choose This Tool vs Alternatives?

| Feature | This Tool (`dorkgen`) | Traditional Dork Lists | Automated Scraper Bots |
| :--- | :---: | :---: | :---: |
| **Reverse Dork Parsing** | ✅ Yes (Deconstruct raw dorks) | ❌ No | ❌ No |
| **Zero CAPTCHA Triggering** | ✅ Yes (Manual user launch) | ⚠️ Manual | ❌ Triggers IP bans/CAPTCHAs |
| **Privacy & Data Security** | ✅ 100% In-Browser (Zero Logs) | ⚠️ Variable | ❌ Third-party servers |
| **Custom Bulk Matrix Generator** | ✅ Built-in with .TXT export | ❌ No | ⚠️ Requires code setup |
| **Aesthetic & UX** | ✅ Geist / Swiss Minimalist | ❌ Plain text / Ad-heavy | ❌ Terminal only |
| **Setup Complexity** | ✅ Zero build / 1-click Render | ⚠️ Manual copy-paste | ❌ Heavy Python/API setup |

---

## 🎯 Who Is This For?

* 🛡️ **Bug Bounty Hunters**: Accelerate target reconnaissance and discover low-hanging vulnerabilities (exposed `.env`, unlinked admin panels, API keys).
* 🕵️ **OSINT Investigators & Journalists**: Find unindexed PDF reports, public archives, and leaked mentions on paste sites.
* 💻 **Penetration Testers & Red Teams**: Map external organizational attack surfaces and exposed assets during Blackbox assessments.
* 👨‍💻 **DevSecOps & System Administrators**: Audit your own company domains to remediate publicly indexed internal documents and backup dumps.
* 🎓 **Cybersecurity Students**: Learn Google search operator syntax through an interactive visual builder and cheat sheet.

---

## 📖 Google Dorking Operators Quick Reference

| Operator | Syntax | Description | Real-World Example |
| :--- | :--- | :--- | :--- |
| `site:` | `site:domain.com` | Restricts results to a specific domain or path | `site:target.com/admin` |
| `filetype:` | `filetype:extension` | Filters files by extension (`pdf`, `env`, `sql`, `docx`) | `filetype:env "DB_HOST"` |
| `intitle:` | `intitle:"phrase"` | Matches words strictly inside HTML `<title>` tag | `intitle:"index of /"` |
| `allintitle:` | `allintitle:word1 word2` | Requires all words to appear in page title | `allintitle:dashboard login` |
| `inurl:` | `inurl:path` | Searches for specified string inside the URL address | `inurl:wp-content/plugins` |
| `allinurl:` | `allinurl:part1 part2` | Requires all terms to appear inside the URL | `allinurl:api v1 auth` |
| `intext:` | `intext:"phrase"` | Searches strictly within the visible page body text | `intext:"BEGIN RSA PRIVATE KEY"` |
| `" "` | `"exact phrase"` | Enforces exact word order without stemming or synonyms | `"confidential internal use only"` |
| `-` | `-keyword` | Excludes results matching the negative term | `site:example.com -www` |
| `OR` | `term1 OR term2` | Logical disjunction (must be uppercase) | `filetype:sql OR filetype:bak` |
| `after:` | `after:YYYY-MM-DD` | Filters pages indexed on or after this date | `after:2024-01-01` |
| `before:` | `before:YYYY-MM-DD` | Filters pages indexed on or before this date | `before:2023-12-31` |

> **⚠️ Syntax Tip:** Never insert a space after the colon. `site: example.com` is invalid; `site:example.com` is valid.

---

## 🚀 Popular Dork Patterns Included

```bash
# 1. Exposed Environment & API Configuration Files
site:target.com (filetype:env OR filetype:yaml OR filetype:conf) "DB_PASSWORD" OR "API_KEY"

# 2. Open Directory Indexing (Apache / NGINX / IIS)
site:target.com intitle:"index of /" "parent directory"

# 3. Accidental Database Backups & SQL Dumps
site:target.com (filetype:sql OR filetype:bak OR filetype:dump OR filetype:tar.gz)

# 4. Hidden Admin & Authentication Portals
site:target.com (inurl:admin OR inurl:login OR inurl:portal OR inurl:dashboard)

# 5. Sensitive Internal Documents & Audits
site:target.com (filetype:pdf OR filetype:docx OR filetype:xlsx) "confidential" OR "strictly private"

# 6. Subdomain Asset Discovery
site:*.target.com -www.target.com
```

---

## ☁️ Deploy to Render (render.com)

This repository includes native **[render.yaml](render.yaml)** Blueprint and **[server.js](server.js)** configurations.

### Option 1: 1-Click Static Site (100% Free CDN)
1. Fork or push this repository to GitHub/GitLab.
2. In the [Render Dashboard](https://dashboard.render.com), click **New +** $\rightarrow$ **Blueprint**.
3. Select this repo. Render will automatically configure:
   * **Runtime**: `Static`
   * **Build Command**: `npm run build`
   * **Publish Directory**: `.`
   * **Security Headers**: HSTS, `X-Frame-Options`, `X-Content-Type-Options`.
4. Click **Apply** to deploy your live instance with automatic SSL.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

### Option 2: Node.js Web Service
1. In the Render Dashboard, select **New +** $\rightarrow$ **Web Service**.
2. Select your repository.
3. Render automatically detects Node.js (`npm run build` & `npm start`).
4. The built-in zero-dependency `server.js` binds to Render's dynamic `PORT` on `0.0.0.0`.

### ⏱️ 24/7 Anti-Sleep Configuration (UptimeRobot)
Render's free-tier Web Services spin down after **15 minutes** of inactivity, causing a ~30–50 second cold start on the next request. A free **UptimeRobot** monitor keeps your instance permanently warm:

1. In your [UptimeRobot Dashboard](https://uptimerobot.com), click **+ Add New Monitor**:
   * **Monitor Type**: `HTTP(s)`
   * **Friendly Name**: `Google Dork Generator (Render)`
   * **URL (or IP)**: `https://google-dorking-helper-tool.onrender.com/health` *(or `https://google-dorking-helper-tool.onrender.com/`)*
   * **Monitoring Interval**: `Every 5 minutes` *(Render spins down after 15m; 5m guarantees it never sleeps)*
   * **HTTP Method**: `HEAD` or `GET` *(the app includes a dedicated lightweight `/health` endpoint returning instant `200 OK`)*
2. Save monitor. Your deployment will now respond with instant zero-second load times 24/7.

---

## 💻 Local Installation & Development

No complex toolchains, bundlers, or package installations are required.

### Quick Run
Simply open `index.html` in your web browser:
```bash
# Windows
start index.html

# macOS
open index.html

# Linux
xdg-open index.html
```

### Local Development Server (Optional)
```bash
# Using Node.js
npm start

# Using Python 3
python -m http.server 8080
```
Navigate to `http://localhost:10000` or `http://localhost:8080`.

### Running Verification Tests
```bash
npm test
```

---

## 🏷️ Recommended GitHub Repository Topics

When publishing this repository on GitHub, add these topics in your repository settings under **"About"** to maximize GitHub discoverability:

```
google-dorking, google-dorks, ghdb, osint, reconnaissance, bug-bounty, bugbounty, security-tools, dork-generator, search-operators, cybersecurity, infosec, ethical-hacking, recon-tools, web-security
```

---

## ⚖️ Ethics, Scope & Responsible Disclosure

* **Defensive Utility**: This project is developed strictly for authorized security assessments, OSINT research, defensive auditing, and academic learning.
* **No Automated Scraping**: This tool does not make automated HTTP requests to Google, does not bypass CAPTCHAs, does not scrape search results, and does not exploit vulnerabilities.
* **Manual User Actions**: All search operations are manually executed by the user in their own web browser. Always obtain written authorization before conducting security testing on third-party targets.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for details. Free for personal, commercial, and educational use.

<div align="center">
  <sub>Engineered with precision for cybersecurity professionals and researchers.</sub>
</div>
