/**
 * Google Dorking Query Generator
 * Personal-use web application for constructing valid Google search operator queries.
 */
  
(function () {
  'use strict';

  // --- Predefined Query Templates ---
  const DEFAULT_TEMPLATES = [
    {
      id: 'tpl-open-dirs',
      title: 'Directory Listings & Open Indexes',
      category: 'Information Disclosure',
      description: 'Discover exposed web server folder directories that have directory browsing enabled.',
      pattern: 'site:{domain} intitle:"index of /" "parent directory"',
      fields: {
        site: '{domain}',
        intitle: 'index of /',
        intitleMode: 'intitle',
        exact: 'parent directory'
      }
    },
    {
      id: 'tpl-env-config',
      title: 'Exposed Environment & Config Files',
      category: 'Credentials & Secrets',
      description: 'Find exposed .env, .yaml, or configuration files containing credentials or tokens.',
      pattern: 'site:{domain} (filetype:env OR filetype:yaml OR filetype:conf OR filetype:ini) "DB_PASSWORD" OR "API_KEY"',
      fields: {
        site: '{domain}',
        filetypes: ['env', 'conf'],
        customFiletype: 'yaml, ini',
        orKeywords: '"DB_PASSWORD", "API_KEY"'
      }
    },
    {
      id: 'tpl-database-dumps',
      title: 'Database Backups & SQL Dumps',
      category: 'Data Leaks',
      description: 'Locate accidentally exposed database archives, SQL files, or database backups.',
      pattern: 'site:{domain} (filetype:sql OR filetype:bak OR filetype:dump OR filetype:db)',
      fields: {
        site: '{domain}',
        filetypes: ['sql', 'bak'],
        customFiletype: 'dump, db'
      }
    },
    {
      id: 'tpl-sensitive-docs',
      title: 'Confidential & Internal Documents',
      category: 'Document Discovery',
      description: 'Find internal reports, presentation slides, or spreadsheets tagged confidential.',
      pattern: 'site:{domain} (filetype:pdf OR filetype:docx OR filetype:xlsx) "confidential" OR "internal only" OR "not for public"',
      fields: {
        site: '{domain}',
        filetypes: ['pdf', 'docx', 'xlsx'],
        orKeywords: '"confidential", "internal only", "not for public"'
      }
    },
    {
      id: 'tpl-login-portals',
      title: 'Admin Portals & Management Logins',
      category: 'Authentication',
      description: 'Identify administrative endpoints, user dashboards, and authentication portals.',
      pattern: 'site:{domain} (inurl:admin OR inurl:login OR inurl:portal OR inurl:dashboard)',
      fields: {
        site: '{domain}',
        inurl: 'admin OR login OR portal OR dashboard',
        inurlMode: 'inurl'
      }
    },
    {
      id: 'tpl-exposed-logs',
      title: 'Public Server Logs & Error Traces',
      category: 'Debug & Diagnostics',
      description: 'Detect exposed error logs, access logs, or debugging dumps containing stack traces.',
      pattern: 'site:{domain} (filetype:log OR filetype:txt) intext:"error" OR intext:"password" OR intext:"stack trace"',
      fields: {
        site: '{domain}',
        filetypes: ['log', 'txt'],
        intext: 'error OR password OR "stack trace"',
        intextMode: 'intext'
      }
    },
    {
      id: 'tpl-git-exposed',
      title: 'Exposed Git & VCS Repositories',
      category: 'Source Code',
      description: 'Find exposed .git or version control folder paths accidentally served over HTTP.',
      pattern: 'site:{domain} inurl:".git" OR inurl:".svn" -github.com -gitlab.com',
      fields: {
        site: '{domain}',
        inurl: '".git" OR ".svn"',
        inurlMode: 'inurl',
        exclude: 'github.com gitlab.com'
      }
    },
    {
      id: 'tpl-subdomain-enum',
      title: 'Subdomain Discovery & Assets',
      category: 'Reconnaissance',
      description: 'Discover third-party and auxiliary subdomains by excluding the root www host.',
      pattern: 'site:*.{domain} -www.{domain}',
      fields: {
        site: '*.{domain}',
        exclude: 'www.{domain}'
      }
    },
    {
      id: 'tpl-public-pastes',
      title: 'Pastebin & Public Code Snippet Mentions',
      category: 'External Intelligence',
      description: 'Search popular paste and code hosting sites for leaked mentions of your domain.',
      pattern: 'site:pastebin.com OR site:gist.github.com OR site:ghostbin.com "{domain}"',
      fields: {
        site: 'pastebin.com OR site:gist.github.com OR site:ghostbin.com',
        exact: '{domain}'
      }
    },
    {
      id: 'tpl-api-docs',
      title: 'API Endpoints & Swagger Specifications',
      category: 'APIs & Services',
      description: 'Discover open Swagger UI panels, GraphQL playgrounds, or OpenAPI specifications.',
      pattern: 'site:{domain} (inurl:swagger OR inurl:api-docs OR inurl:graphql OR inurl:"/v1/api")',
      fields: {
        site: '{domain}',
        inurl: 'swagger OR api-docs OR graphql OR "/v1/api"',
        inurlMode: 'inurl'
      }
    },
    {
      id: 'tpl-cloud-buckets',
      title: 'S3 & Cloud Storage Exposure',
      category: 'Cloud Assets',
      description: 'Search AWS S3 and Azure Blob storages for public buckets matching your domain.',
      pattern: 'site:s3.amazonaws.com OR site:blob.core.windows.net "{domain}"',
      fields: {
        site: 's3.amazonaws.com OR site:blob.core.windows.net',
        exact: '{domain}'
      }
    },
    {
      id: 'tpl-research-papers',
      title: 'Academic Research & Survey Papers',
      category: 'Academic Research',
      description: 'Find scholarly research papers and literature reviews in PDF format.',
      pattern: 'filetype:pdf intitle:"research" OR intitle:"survey" "references" after:2022-01-01',
      fields: {
        filetypes: ['pdf'],
        intitle: 'research OR survey',
        intitleMode: 'intitle',
        exact: 'references',
        afterDate: '2022-01-01'
      }
    }
  ];

  // --- Bulk Pattern Presets ---
  const BULK_PRESETS = {
    auth: {
      operator: 'inurl:',
      items: ['admin', 'login', 'portal', 'dashboard', 'auth', 'signin', 'cpanel', 'wp-login.php', 'user/login', 'administrator']
    },
    sensitive_files: {
      operator: 'filetype:',
      items: ['env', 'conf', 'config', 'ini', 'yml', 'yaml', 'json', 'key', 'pem', 'crt', 'id_rsa']
    },
    database: {
      operator: 'filetype:',
      items: ['sql', 'bak', 'dump', 'db', 'sqlite', 'sqlite3', 'mdb', 'backup', 'tar.gz']
    },
    info_disclosure: {
      operator: 'intext:',
      items: ['"phpinfo()"', '"server status"', '"syntax error"', '"fatal error"', '"stack trace"', '"exception in thread"']
    },
    doc_types: {
      operator: 'filetype:',
      items: ['pdf', 'docx', 'xlsx', 'csv', 'pptx', 'rtf', 'odt', 'ods']
    },
    cloud_storage: {
      operator: 'site:',
      items: ['s3.amazonaws.com', 'blob.core.windows.net', 'storage.googleapis.com', 'digitaloceanspaces.com']
    }
  };

  // --- Application State ---
  const state = {
    selectedFiletypes: new Set(),
    isManuallyEdited: false,
    savedQueries: []
  };

  // --- DOM Elements Cache ---
  const DOM = {
    // Navigation
    tabs: document.querySelectorAll('.nav-tab'),
    tabPanes: document.querySelectorAll('.tab-pane'),
    savedCount: document.getElementById('savedCount'),

    // Preview & Buffer Controls
    generatedQuery: document.getElementById('generatedQuery'),
    charCount: document.getElementById('charCount'),
    wordCount: document.getElementById('wordCount'),
    editBadge: document.getElementById('editBadge'),
    btnDeconstruct: document.getElementById('btnDeconstruct'),
    btnResync: document.getElementById('btnResync'),
    btnCopy: document.getElementById('btnCopy'),
    btnGoogle: document.getElementById('btnGoogle'),
    btnPasteDork: document.getElementById('btnPasteDork'),
    btnSaveQuery: document.getElementById('btnSaveQuery'),
    btnResetBuilder: document.getElementById('btnResetBuilder'),

    // Builder Inputs
    builderForm: document.getElementById('builderForm'),
    inputSite: document.getElementById('inputSite'),
    inputKeywords: document.getElementById('inputKeywords'),
    inputExactPhrase: document.getElementById('inputExactPhrase'),
    inputOrKeywords: document.getElementById('inputOrKeywords'),
    inputExclude: document.getElementById('inputExclude'),

    filetypeChips: document.querySelectorAll('#filetypeChips .chip'),
    customFiletype: document.getElementById('customFiletype'),
    btnClearChips: document.getElementById('btnClearChips'),

    selectInUrlMode: document.getElementById('selectInUrlMode'),
    inputInUrl: document.getElementById('inputInUrl'),
    selectInTitleMode: document.getElementById('selectInTitleMode'),
    inputInTitle: document.getElementById('inputInTitle'),
    selectInTextMode: document.getElementById('selectInTextMode'),
    inputInText: document.getElementById('inputInText'),

    inputAfterDate: document.getElementById('inputAfterDate'),
    inputBeforeDate: document.getElementById('inputBeforeDate'),

    // Templates Tab
    templateFilter: document.getElementById('templateFilter'),
    templateTargetDomain: document.getElementById('templateTargetDomain'),
    btnApplyDomainToTemplates: document.getElementById('btnApplyDomainToTemplates'),
    templatesGrid: document.getElementById('templatesGrid'),

    // Bulk Tab
    bulkDomain: document.getElementById('bulkDomain'),
    bulkPreset: document.getElementById('bulkPreset'),
    bulkOperator: document.getElementById('bulkOperator'),
    bulkAdditional: document.getElementById('bulkAdditional'),
    bulkItems: document.getElementById('bulkItems'),
    bulkItemCount: document.getElementById('bulkItemCount'),
    btnGenerateBulk: document.getElementById('btnGenerateBulk'),
    btnClearBulk: document.getElementById('btnClearBulk'),
    bulkResultsSection: document.getElementById('bulkResultsSection'),
    bulkTotalCount: document.getElementById('bulkTotalCount'),
    bulkList: document.getElementById('bulkList'),
    btnCopyAllBulk: document.getElementById('btnCopyAllBulk'),
    btnExportBulkTxt: document.getElementById('btnExportBulkTxt'),

    // History Tab
    savedEmptyState: document.getElementById('savedEmptyState'),
    savedQueriesList: document.getElementById('savedQueriesList'),
    btnClearHistory: document.getElementById('btnClearHistory'),

    // Toast
    toastContainer: document.getElementById('toastContainer')
  };

  // --- Initialization ---
  function init() {
    loadSavedQueries();
    bindEvents();
    renderTemplates();
    updateBulkItemCount();
    generateQuery();
  }

  // --- Event Bindings ---
  function bindEvents() {
    // Tab switching
    DOM.tabs.forEach(tab => {
      tab.addEventListener('click', () => switchTab(tab.getAttribute('data-tab')));
    });

    // Builder Inputs (Real-time generation)
    const builderInputs = [
      DOM.inputSite,
      DOM.inputKeywords,
      DOM.inputExactPhrase,
      DOM.inputOrKeywords,
      DOM.inputExclude,
      DOM.customFiletype,
      DOM.selectInUrlMode,
      DOM.inputInUrl,
      DOM.selectInTitleMode,
      DOM.inputInTitle,
      DOM.selectInTextMode,
      DOM.inputInText,
      DOM.inputAfterDate,
      DOM.inputBeforeDate
    ];

    builderInputs.forEach(input => {
      if (!input) return;
      input.addEventListener('input', () => {
        state.isManuallyEdited = false;
        hideCustomBadge();
        generateQuery();
      });
      input.addEventListener('change', () => {
        state.isManuallyEdited = false;
        hideCustomBadge();
        generateQuery();
      });
    });

    // Filetype chips toggling
    DOM.filetypeChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const ext = chip.getAttribute('data-ext');
        if (state.selectedFiletypes.has(ext)) {
          state.selectedFiletypes.delete(ext);
          chip.classList.remove('active');
        } else {
          state.selectedFiletypes.add(ext);
          chip.classList.add('active');
        }
        state.isManuallyEdited = false;
        hideCustomBadge();
        generateQuery();
      });
    });

    // Deselect filetype chips
    DOM.btnClearChips.addEventListener('click', () => {
      state.selectedFiletypes.clear();
      DOM.filetypeChips.forEach(c => c.classList.remove('active'));
      DOM.customFiletype.value = '';
      state.isManuallyEdited = false;
      hideCustomBadge();
      generateQuery();
    });

    // Manual edit on generated query textarea
    DOM.generatedQuery.addEventListener('input', () => {
      state.isManuallyEdited = true;
      showCustomBadge();
      updateQueryStats(DOM.generatedQuery.value);
    });

    // Direct paste listener on generatedQuery textarea
    DOM.generatedQuery.addEventListener('paste', () => {
      setTimeout(() => {
        const val = DOM.generatedQuery.value.trim();
        if (val && /site:|filetype:|ext:|inurl:|intitle:|intext:|-|"|OR/i.test(val)) {
          showToast('Raw dork detected. Click "Deconstruct to Form" to populate builder fields.', 'info');
        }
      }, 60);
    });

    // Preview Actions
    DOM.btnCopy.addEventListener('click', () => copyToClipboard(DOM.generatedQuery.value.trim()));
    DOM.btnGoogle.addEventListener('click', () => openInGoogle(DOM.generatedQuery.value.trim()));
    DOM.btnSaveQuery.addEventListener('click', saveCurrentQuery);
    DOM.btnResetBuilder.addEventListener('click', resetBuilder);

    // Deconstruct actions
    if (DOM.btnDeconstruct) {
      DOM.btnDeconstruct.addEventListener('click', () => {
        const query = DOM.generatedQuery.value.trim();
        if (!query) {
          showToast('Query buffer is empty. Enter or paste a dork first.', 'info');
          return;
        }
        const parsed = deconstructDorkQuery(query);
        applyDeconstructedQuery(parsed);
      });
    }

    if (DOM.btnPasteDork) {
      DOM.btnPasteDork.addEventListener('click', handlePasteAndDeconstruct);
    }

    if (DOM.btnResync) {
      DOM.btnResync.addEventListener('click', () => {
        state.isManuallyEdited = false;
        hideCustomBadge();
        generateQuery();
        showToast('Re-synced with builder inputs.', 'info');
      });
    }

    // Templates Filter & Domain Sync
    DOM.templateFilter.addEventListener('input', filterTemplates);
    DOM.btnApplyDomainToTemplates.addEventListener('click', applyTargetDomainToTemplates);
    DOM.templateTargetDomain.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') applyTargetDomainToTemplates();
    });

    // Bulk Generator Events
    DOM.bulkPreset.addEventListener('change', handleBulkPresetChange);
    DOM.bulkItems.addEventListener('input', updateBulkItemCount);
    DOM.btnGenerateBulk.addEventListener('click', generateBulkQueries);
    DOM.btnClearBulk.addEventListener('click', clearBulkForm);
    DOM.btnCopyAllBulk.addEventListener('click', copyAllBulkQueries);
    DOM.btnExportBulkTxt.addEventListener('click', exportBulkQueriesAsTxt);

    // Saved Queries Events
    DOM.btnClearHistory.addEventListener('click', clearAllSavedQueries);
  }

  // --- Tab Navigation ---
  function switchTab(tabId) {
    DOM.tabs.forEach(tab => {
      const isTarget = tab.getAttribute('data-tab') === tabId;
      tab.classList.toggle('active', isTarget);
      tab.setAttribute('aria-selected', isTarget ? 'true' : 'false');
    });

    DOM.tabPanes.forEach(pane => {
      pane.classList.toggle('active', pane.id === `tab-${tabId}`);
    });

    // If switching to templates and user had a domain in builder, sync it
    if (tabId === 'templates') {
      const siteVal = cleanDomain(DOM.inputSite.value.trim());
      if (siteVal && !DOM.templateTargetDomain.value) {
        DOM.templateTargetDomain.value = siteVal;
        renderTemplates();
      }
    }

    // If switching to bulk and domain is in builder, populate bulk domain if empty
    if (tabId === 'bulk') {
      const siteVal = cleanDomain(DOM.inputSite.value.trim());
      if (siteVal && !DOM.bulkDomain.value) {
        DOM.bulkDomain.value = siteVal;
      }
    }
  }

  // --- Helper: Domain Sanitization ---
  function cleanDomain(str) {
    if (!str) return '';
    let domain = str.trim();
    // Remove protocol (http:// or https://)
    domain = domain.replace(/^https?:\/\//i, '');
    // Remove trailing slashes
    domain = domain.replace(/\/+$/, '');
    // Remove site: prefix if user typed it
    domain = domain.replace(/^site:/i, '');
    return domain.trim();
  }

  // --- Helper: Quoted and unquoted token extractor ---
  function parseQuotedTokens(str) {
    if (!str) return [];
    const tokens = [];
    const regex = /"([^"]+)"|'([^']+)'|([^\s,]+)/g;
    let match;
    while ((match = regex.exec(str)) !== null) {
      if (match[1] !== undefined) {
        tokens.push(`"${match[1].trim()}"`);
      } else if (match[2] !== undefined) {
        tokens.push(`"${match[2].trim()}"`);
      } else if (match[3] !== undefined) {
        tokens.push(match[3].trim());
      }
    }
    return tokens.filter(Boolean);
  }

  // --- Reverse Query Parser Engine ("Deconstruct Raw Dork") ---
  function deconstructDorkQuery(rawQuery) {
    if (!rawQuery || typeof rawQuery !== 'string') return null;

    let query = rawQuery.trim();
    if (!query) return null;

    const result = {
      site: '',
      filetypes: [],
      customFiletypes: [],
      inurl: '',
      inurlMode: 'inurl',
      intitle: '',
      intitleMode: 'intitle',
      intext: '',
      intextMode: 'intext',
      exact: '',
      keywords: [],
      orKeywords: [],
      exclude: [],
      afterDate: '',
      beforeDate: ''
    };

    const knownChips = new Set(['pdf', 'docx', 'xlsx', 'csv', 'sql', 'env', 'log', 'conf', 'json', 'xml', 'bak', 'txt']);

    function cleanVal(v) {
      if (!v) return '';
      return v.trim().replace(/^["']+|["']+$/g, '');
    }

    // 1. Extract Parenthetical Groups: ( ... )
    query = query.replace(/\(([^)]+)\)/g, (match, inner) => {
      const trimmedInner = inner.trim();

      // Check if it's filetype/ext group: (filetype:pdf OR filetype:docx)
      if (/filetype:|ext:/i.test(trimmedInner)) {
        const ftMatches = [...trimmedInner.matchAll(/(?:filetype|ext):([^\s\)"']+|"[^"]+"|'[^']+')/gi)];
        for (const m of ftMatches) {
          const ext = cleanVal(m[1]).toLowerCase();
          if (knownChips.has(ext)) {
            if (!result.filetypes.includes(ext)) result.filetypes.push(ext);
          } else {
            if (!result.customFiletypes.includes(ext)) result.customFiletypes.push(ext);
          }
        }
        return ' ';
      }

      // Check if it's site group: (site:a.com OR site:b.com)
      if (/site:/i.test(trimmedInner)) {
        const siteMatches = [...trimmedInner.matchAll(/site:([^\s\)"']+|"[^"]+"|'[^']+')/gi)];
        const sites = [];
        for (const m of siteMatches) {
          sites.push(cleanVal(m[1]));
        }
        if (sites.length > 0) {
          result.site = sites.join(' OR ');
        }
        return ' ';
      }

      // Check if it's inurl group: (inurl:admin OR inurl:login)
      if (/inurl:/i.test(trimmedInner)) {
        const matches = [...trimmedInner.matchAll(/inurl:([^\s\)"']+|"[^"]+"|'[^']+')/gi)];
        const terms = [];
        for (const m of matches) terms.push(cleanVal(m[1]));
        result.inurl = terms.join(' OR ');
        result.inurlMode = 'inurl';
        return ' ';
      }

      // Check if it's intitle group: (intitle:foo OR intitle:bar)
      if (/intitle:/i.test(trimmedInner)) {
        const matches = [...trimmedInner.matchAll(/intitle:([^\s\)"']+|"[^"]+"|'[^']+')/gi)];
        const terms = [];
        for (const m of matches) terms.push(cleanVal(m[1]));
        result.intitle = terms.join(' OR ');
        result.intitleMode = 'intitle';
        return ' ';
      }

      // Check if it's intext group: (intext:foo OR intext:bar)
      if (/intext:/i.test(trimmedInner)) {
        const matches = [...trimmedInner.matchAll(/intext:([^\s\)"']+|"[^"]+"|'[^']+')/gi)];
        const terms = [];
        for (const m of matches) terms.push(cleanVal(m[1]));
        result.intext = terms.join(' OR ');
        result.intextMode = 'intext';
        return ' ';
      }

      // Otherwise, general OR group: (term1 OR term2)
      if (/\s+OR\s+/i.test(trimmedInner)) {
        const parts = trimmedInner.split(/\s+OR\s+/i).map(t => cleanVal(t)).filter(Boolean);
        result.orKeywords.push(...parts);
        return ' ';
      }

      return trimmedInner;
    });

    // 2. Extract Individual Operators
    // site:
    query = query.replace(/(?:^|\s)site:([^\s"']+|"[^"]+"|'[^']+')/gi, (m, val) => {
      if (!result.site) result.site = cleanVal(val);
      return ' ';
    });

    // filetype: or ext:
    query = query.replace(/(?:^|\s)(?:filetype|ext):([^\s"']+|"[^"]+"|'[^']+')/gi, (m, val) => {
      const ext = cleanVal(val).toLowerCase();
      if (knownChips.has(ext)) {
        if (!result.filetypes.includes(ext)) result.filetypes.push(ext);
      } else {
        if (!result.customFiletypes.includes(ext)) result.customFiletypes.push(ext);
      }
      return ' ';
    });

    // inurl: / allinurl:
    query = query.replace(/(?:^|\s)(allinurl|inurl):([^\s"']+|"[^"]+"|'[^']+')/gi, (m, mode, val) => {
      result.inurlMode = mode.toLowerCase();
      result.inurl = cleanVal(val);
      return ' ';
    });

    // intitle: / allintitle:
    query = query.replace(/(?:^|\s)(allintitle|intitle):([^\s"']+|"[^"]+"|'[^']+')/gi, (m, mode, val) => {
      result.intitleMode = mode.toLowerCase();
      result.intitle = cleanVal(val);
      return ' ';
    });

    // intext: / allintext:
    query = query.replace(/(?:^|\s)(allintext|intext):([^\s"']+|"[^"]+"|'[^']+')/gi, (m, mode, val) => {
      result.intextMode = mode.toLowerCase();
      result.intext = cleanVal(val);
      return ' ';
    });

    // after: and before:
    query = query.replace(/(?:^|\s)after:([^\s]+)/gi, (m, val) => {
      result.afterDate = cleanVal(val);
      return ' ';
    });

    query = query.replace(/(?:^|\s)before:([^\s]+)/gi, (m, val) => {
      result.beforeDate = cleanVal(val);
      return ' ';
    });

    // 3. Extract Exclusions: -term or -"quoted phrase"
    query = query.replace(/(?:^|\s)-([^\s"']+|"[^"]+"|'[^']+')/gi, (m, val) => {
      const trimmed = val.trim();
      const exc = (trimmed.startsWith('"') || trimmed.startsWith("'")) ? trimmed : cleanVal(trimmed);
      result.exclude.push(exc);
      return ' ';
    });

    // 4. Extract Standalone Quoted Phrases: "..."
    query = query.replace(/"([^"]+)"|'([^']+)'/g, (m, q1, q2) => {
      const val = (q1 !== undefined ? q1 : q2).trim();
      if (!result.exact) {
        result.exact = val;
      } else {
        result.keywords.push(`"${val}"`);
      }
      return ' ';
    });

    // 5. Check remaining string for OR keywords
    if (/\s+OR\s+/i.test(query)) {
      const orParts = query.split(/\s+OR\s+/i).map(t => t.trim()).filter(Boolean);
      result.orKeywords.push(...orParts);
      query = '';
    }

    // 6. Remaining words -> General Keywords
    const remainingTokens = query.split(/\s+/).map(t => t.trim()).filter(Boolean);
    remainingTokens.forEach(t => {
      if (t.toUpperCase() !== 'OR') {
        result.keywords.push(t);
      }
    });

    return result;
  }

  // Populate Builder inputs from parsed query object
  function applyDeconstructedQuery(parsed) {
    if (!parsed) return;

    // Reset current form & chips
    DOM.builderForm.reset();
    state.selectedFiletypes.clear();
    DOM.filetypeChips.forEach(c => c.classList.remove('active'));

    // 1. Target Scope
    if (parsed.site) DOM.inputSite.value = parsed.site;

    // 2. Filetypes & Chips
    if (parsed.filetypes && parsed.filetypes.length > 0) {
      parsed.filetypes.forEach(ext => {
        state.selectedFiletypes.add(ext);
        const chip = document.querySelector(`#filetypeChips .chip[data-ext="${ext}"]`);
        if (chip) chip.classList.add('active');
      });
    }
    if (parsed.customFiletypes && parsed.customFiletypes.length > 0) {
      DOM.customFiletype.value = parsed.customFiletypes.join(', ');
    }

    // 3. InURL
    if (parsed.inurl) {
      DOM.inputInUrl.value = parsed.inurl;
      DOM.selectInUrlMode.value = parsed.inurlMode || 'inurl';
    }

    // 4. InTitle
    if (parsed.intitle) {
      DOM.inputInTitle.value = parsed.intitle;
      DOM.selectInTitleMode.value = parsed.intitleMode || 'intitle';
    }

    // 5. InText
    if (parsed.intext) {
      DOM.inputInText.value = parsed.intext;
      DOM.selectInTextMode.value = parsed.intextMode || 'intext';
    }

    // 6. Exact Phrase
    if (parsed.exact) DOM.inputExactPhrase.value = parsed.exact;

    // 7. General Keywords
    if (parsed.keywords && parsed.keywords.length > 0) {
      DOM.inputKeywords.value = parsed.keywords.join(' ');
    }

    // 8. OR Keywords
    if (parsed.orKeywords && parsed.orKeywords.length > 0) {
      DOM.inputOrKeywords.value = parsed.orKeywords.join(', ');
    }

    // 9. Exclusions
    if (parsed.exclude && parsed.exclude.length > 0) {
      DOM.inputExclude.value = parsed.exclude.join(' ');
    }

    // 10. Date boundaries
    if (parsed.afterDate) DOM.inputAfterDate.value = parsed.afterDate;
    if (parsed.beforeDate) DOM.inputBeforeDate.value = parsed.beforeDate;

    // Re-generate and synchronize
    state.isManuallyEdited = false;
    hideCustomBadge();
    generateQuery();

    let count = 0;
    if (parsed.site) count++;
    if (parsed.filetypes.length + parsed.customFiletypes.length > 0) count++;
    if (parsed.inurl) count++;
    if (parsed.intitle) count++;
    if (parsed.intext) count++;
    if (parsed.exact) count++;
    if (parsed.keywords.length > 0) count++;
    if (parsed.orKeywords.length > 0) count++;
    if (parsed.exclude.length > 0) count++;
    if (parsed.afterDate || parsed.beforeDate) count++;

    switchTab('builder');
    showToast(`Deconstructed ${count} operator groups into builder!`, 'success');
  }

  // Handle clipboard paste & deconstruct
  async function handlePasteAndDeconstruct() {
    let raw = '';
    if (navigator.clipboard && navigator.clipboard.readText) {
      try {
        raw = await navigator.clipboard.readText();
      } catch (err) {
        // Permission denied or blocked in browser context
      }
    }

    if (!raw) {
      raw = window.prompt('Paste raw Google Dork to deconstruct into builder:', DOM.generatedQuery.value.trim());
    }

    if (!raw || !raw.trim()) {
      showToast('No query string provided.', 'info');
      return;
    }

    const parsed = deconstructDorkQuery(raw.trim());
    applyDeconstructedQuery(parsed);
  }

  // --- Query Generation Logic ---
  function generateQuery() {
    if (state.isManuallyEdited) {
      return;
    }

    const parts = [];

    // 1. Site / Domain
    const siteRaw = DOM.inputSite.value.trim();
    if (siteRaw) {
      // If user provided multiple sites separated by OR or comma
      if (siteRaw.includes(' OR ') || siteRaw.includes(',')) {
        const sites = siteRaw.split(/,|\s+OR\s+/i)
          .map(s => cleanDomain(s))
          .filter(Boolean);
        if (sites.length === 1) {
          parts.push(`site:${sites[0]}`);
        } else if (sites.length > 1) {
          parts.push(`(${sites.map(s => `site:${s}`).join(' OR ')})`);
        }
      } else {
        const clean = cleanDomain(siteRaw);
        if (clean) {
          parts.push(`site:${clean}`);
        }
      }
    }

    // 2. File Types
    const filetypes = Array.from(state.selectedFiletypes);
    const customTypes = DOM.customFiletype.value
      .split(/[,\s]+/)
      .map(t => t.replace(/^\./, '').trim())
      .filter(Boolean);

    const allTypes = Array.from(new Set([...filetypes, ...customTypes]));

    if (allTypes.length === 1) {
      parts.push(`filetype:${allTypes[0]}`);
    } else if (allTypes.length > 1) {
      parts.push(`(${allTypes.map(ft => `filetype:${ft}`).join(' OR ')})`);
    }

    // 3. Location Operators (URL, Title, Body Text)
    // URL
    const inUrlVal = DOM.inputInUrl.value.trim();
    if (inUrlVal) {
      const mode = DOM.selectInUrlMode.value; // 'inurl' or 'allinurl'
      if (mode === 'allinurl') {
        parts.push(`allinurl:${inUrlVal}`);
      } else {
        if (inUrlVal.includes(' OR ')) {
          const orTerms = inUrlVal.split(/\s+OR\s+/i).map(t => t.trim()).filter(Boolean);
          parts.push(`(${orTerms.map(t => `inurl:${formatSearchTerm(t)}`).join(' OR ')})`);
        } else {
          parts.push(`inurl:${formatSearchTerm(inUrlVal)}`);
        }
      }
    }

    // Title
    const inTitleVal = DOM.inputInTitle.value.trim();
    if (inTitleVal) {
      const mode = DOM.selectInTitleMode.value; // 'intitle' or 'allintitle'
      if (mode === 'allintitle') {
        parts.push(`allintitle:${inTitleVal}`);
      } else {
        if (inTitleVal.includes(' OR ')) {
          const orTerms = inTitleVal.split(/\s+OR\s+/i).map(t => t.trim()).filter(Boolean);
          parts.push(`(${orTerms.map(t => `intitle:${formatSearchTerm(t)}`).join(' OR ')})`);
        } else {
          parts.push(`intitle:${formatSearchTerm(inTitleVal)}`);
        }
      }
    }

    // Body Text
    const inTextVal = DOM.inputInText.value.trim();
    if (inTextVal) {
      const mode = DOM.selectInTextMode.value; // 'intext' or 'allintext'
      if (mode === 'allintext') {
        parts.push(`allintext:${inTextVal}`);
      } else {
        if (inTextVal.includes(' OR ')) {
          const orTerms = inTextVal.split(/\s+OR\s+/i).map(t => t.trim()).filter(Boolean);
          parts.push(`(${orTerms.map(t => `intext:${formatSearchTerm(t)}`).join(' OR ')})`);
        } else {
          parts.push(`intext:${formatSearchTerm(inTextVal)}`);
        }
      }
    }

    // 4. Exact Phrase
    const exactVal = DOM.inputExactPhrase.value.trim();
    if (exactVal) {
      const cleanExact = exactVal.replace(/^"+|"+$/g, '').trim();
      if (cleanExact) {
        parts.push(`"${cleanExact}"`);
      }
    }

    // 5. General Keywords
    const keywordsVal = DOM.inputKeywords.value.trim();
    if (keywordsVal) {
      parts.push(keywordsVal);
    }

    // 6. Logical OR Combinations
    const orVal = DOM.inputOrKeywords.value.trim();
    if (orVal) {
      let orItems = [];
      if (orVal.includes(' OR ')) {
        orItems = orVal.split(/\s+OR\s+/i).map(t => t.trim()).filter(Boolean);
      } else {
        orItems = parseQuotedTokens(orVal);
      }

      if (orItems.length === 1) {
        parts.push(orItems[0]);
      } else if (orItems.length > 1) {
        const formattedOr = orItems.map(item => {
          if (item.includes(' ') && !item.startsWith('"') && !item.startsWith('(')) {
            return `"${item.replace(/^"+|"+$/g, '')}"`;
          }
          return item;
        });
        parts.push(`(${formattedOr.join(' OR ')})`);
      }
    }

    // 7. Exclusions (-word or -"phrase")
    const excludeVal = DOM.inputExclude.value.trim();
    if (excludeVal) {
      const tokens = parseQuotedTokens(excludeVal);
      tokens.forEach(tok => {
        let clean = tok;
        if (clean.startsWith('-')) {
          clean = clean.substring(1).trim();
        }
        if (clean) {
          parts.push(`-${clean}`);
        }
      });
    }

    // 8. Date Range Filters
    const afterDate = DOM.inputAfterDate.value;
    if (afterDate) {
      parts.push(`after:${afterDate}`);
    }

    const beforeDate = DOM.inputBeforeDate.value;
    if (beforeDate) {
      parts.push(`before:${beforeDate}`);
    }

    const finalQuery = parts.join(' ').trim();
    DOM.generatedQuery.value = finalQuery;
    updateQueryStats(finalQuery);
  }

  // Format terms for operators: adds quotes if phrase contains spaces and isn't already quoted
  function formatSearchTerm(term) {
    term = term.trim();
    if (term.includes(' ') && !term.startsWith('"') && !term.endsWith('"')) {
      return `"${term}"`;
    }
    return term;
  }

  // --- Query Stats & Badge ---
  function updateQueryStats(query) {
    const chars = query.length;
    DOM.charCount.textContent = `${chars} chars`;

    const terms = query ? query.trim().split(/\s+/).filter(Boolean).length : 0;
    DOM.wordCount.textContent = `${terms} term${terms === 1 ? '' : 's'}`;

    // Google query term warning: Google typically truncates search queries beyond ~32 words
    if (terms > 32) {
      DOM.wordCount.style.color = 'var(--status-danger)';
      DOM.wordCount.title = 'Google typically ignores terms past ~32 words';
    } else {
      DOM.wordCount.style.color = '';
      DOM.wordCount.title = '';
    }
  }

  function showCustomBadge() {
    DOM.editBadge.style.display = 'inline-block';
    if (DOM.btnResync) DOM.btnResync.style.display = 'inline-flex';
  }

  function hideCustomBadge() {
    DOM.editBadge.style.display = 'none';
    if (DOM.btnResync) DOM.btnResync.style.display = 'none';
  }

  // --- Clipboard & Actions ---
  function copyToClipboard(text) {
    if (!text) {
      showToast('Nothing to copy. Build or write a query first.', 'info');
      return;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => showToast('Query copied to clipboard!', 'success'))
        .catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);
      if (successful) {
        showToast('Query copied to clipboard!', 'success');
      } else {
        showToast('Failed to copy. Please copy manually.', 'info');
      }
    } catch (err) {
      showToast('Clipboard access unavailable.', 'info');
    }
  }

  function openInGoogle(query) {
    if (!query) {
      showToast('Please enter or generate a search query first.', 'info');
      return;
    }

    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    window.open(searchUrl, '_blank', 'noopener,noreferrer');
  }

  // --- Reset All Builder Fields ---
  function resetBuilder() {
    DOM.builderForm.reset();
    state.selectedFiletypes.clear();
    DOM.filetypeChips.forEach(c => c.classList.remove('active'));
    DOM.customFiletype.value = '';
    state.isManuallyEdited = false;
    hideCustomBadge();
    DOM.generatedQuery.value = '';
    updateQueryStats('');
    showToast('All builder inputs have been cleared.', 'info');
  }

  // --- Predefined Templates Management ---
  function getActiveDomainForTemplates() {
    let domain = DOM.templateTargetDomain.value.trim();
    if (!domain) {
      domain = cleanDomain(DOM.inputSite.value.trim());
    }
    return domain || 'example.com';
  }

  function renderTemplates() {
    const activeDomain = getActiveDomainForTemplates();
    const filterText = DOM.templateFilter.value.toLowerCase().trim();

    DOM.templatesGrid.innerHTML = '';

    const filtered = DEFAULT_TEMPLATES.filter(tpl => {
      if (!filterText) return true;
      const haystack = (tpl.title + ' ' + tpl.category + ' ' + tpl.description + ' ' + tpl.pattern).toLowerCase();
      return haystack.includes(filterText);
    });

    if (filtered.length === 0) {
      DOM.templatesGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 30px; color: var(--text-dim);">
          No templates match your search "${escapeHtml(filterText)}".
        </div>
      `;
      return;
    }

    filtered.forEach(tpl => {
      const renderedPattern = tpl.pattern.replace(/\{domain\}/g, activeDomain);

      const card = document.createElement('div');
      card.className = 'template-card';
      card.innerHTML = `
        <div>
          <div class="template-card-header">
            <div>
              <h5 class="template-title">${escapeHtml(tpl.title)}</h5>
              <p class="template-desc">${escapeHtml(tpl.description)}</p>
            </div>
            <span class="template-category">${escapeHtml(tpl.category)}</span>
          </div>
          <div class="template-query-box" style="margin-top: 10px;">
            ${escapeHtml(renderedPattern)}
          </div>
        </div>
        <div class="template-card-actions">
          <button type="button" class="btn btn-xs btn-outline btn-load-tpl" title="Load into Query Builder">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            Load in Builder
          </button>
          <button type="button" class="btn btn-xs btn-outline btn-copy-tpl" title="Copy to clipboard">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            Copy
          </button>
          <button type="button" class="btn btn-xs btn-secondary btn-google-tpl" title="Open in Google">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            Search
          </button>
        </div>
      `;

      // Event listeners for template card buttons
      const btnLoad = card.querySelector('.btn-load-tpl');
      const btnCopy = card.querySelector('.btn-copy-tpl');
      const btnGoogle = card.querySelector('.btn-google-tpl');

      btnLoad.addEventListener('click', () => loadTemplateIntoBuilder(tpl, activeDomain));
      btnCopy.addEventListener('click', () => copyToClipboard(renderedPattern));
      btnGoogle.addEventListener('click', () => openInGoogle(renderedPattern));

      DOM.templatesGrid.appendChild(card);
    });
  }

  function filterTemplates() {
    renderTemplates();
  }

  function applyTargetDomainToTemplates() {
    const raw = DOM.templateTargetDomain.value.trim();
    const clean = cleanDomain(raw);
    DOM.templateTargetDomain.value = clean;
    renderTemplates();
    showToast(`Templates updated for target: ${clean || 'example.com'}`, 'info');
  }

  function loadTemplateIntoBuilder(tpl, domain) {
    // Reset builder form first
    DOM.builderForm.reset();
    state.selectedFiletypes.clear();
    DOM.filetypeChips.forEach(c => c.classList.remove('active'));

    // Populate fields
    if (tpl.fields) {
      if (tpl.fields.site) {
        DOM.inputSite.value = tpl.fields.site.replace(/\{domain\}/g, domain);
      }
      if (tpl.fields.filetypes) {
        tpl.fields.filetypes.forEach(ext => {
          state.selectedFiletypes.add(ext);
          const chip = document.querySelector(`#filetypeChips .chip[data-ext="${ext}"]`);
          if (chip) chip.classList.add('active');
        });
      }
      if (tpl.fields.customFiletype) {
        DOM.customFiletype.value = tpl.fields.customFiletype;
      }
      if (tpl.fields.keywords) {
        DOM.inputKeywords.value = tpl.fields.keywords;
      }
      if (tpl.fields.exact) {
        DOM.inputExactPhrase.value = tpl.fields.exact.replace(/\{domain\}/g, domain);
      }
      if (tpl.fields.orKeywords) {
        DOM.inputOrKeywords.value = tpl.fields.orKeywords.replace(/\{domain\}/g, domain);
      }
      if (tpl.fields.exclude) {
        DOM.inputExclude.value = tpl.fields.exclude.replace(/\{domain\}/g, domain);
      }
      if (tpl.fields.inurl) {
        DOM.inputInUrl.value = tpl.fields.inurl;
        if (tpl.fields.inurlMode) DOM.selectInUrlMode.value = tpl.fields.inurlMode;
      }
      if (tpl.fields.intitle) {
        DOM.inputInTitle.value = tpl.fields.intitle;
        if (tpl.fields.intitleMode) DOM.selectInTitleMode.value = tpl.fields.intitleMode;
      }
      if (tpl.fields.intext) {
        DOM.inputInText.value = tpl.fields.intext;
        if (tpl.fields.intextMode) DOM.selectInTextMode.value = tpl.fields.intextMode;
      }
      if (tpl.fields.afterDate) {
        DOM.inputAfterDate.value = tpl.fields.afterDate;
      }
      if (tpl.fields.beforeDate) {
        DOM.inputBeforeDate.value = tpl.fields.beforeDate;
      }
    }

    state.isManuallyEdited = false;
    hideCustomBadge();
    generateQuery();

    // Switch to builder tab
    switchTab('builder');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast(`Loaded "${tpl.title}" into builder.`, 'success');
  }

  // --- Bulk Query Generator ---
  function handleBulkPresetChange() {
    const val = DOM.bulkPreset.value;
    if (val === 'custom') {
      DOM.bulkItems.value = '';
      updateBulkItemCount();
      return;
    }

    const preset = BULK_PRESETS[val];
    if (preset) {
      DOM.bulkItems.value = preset.items.join('\n');
      DOM.bulkOperator.value = preset.operator;
      updateBulkItemCount();
    }
  }

  function updateBulkItemCount() {
    const lines = DOM.bulkItems.value
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean);
    DOM.bulkItemCount.textContent = `${lines.length} item${lines.length === 1 ? '' : 's'}`;
  }

  function generateBulkQueries() {
    const targetDomain = cleanDomain(DOM.bulkDomain.value.trim());
    const operator = DOM.bulkOperator.value;
    const additional = DOM.bulkAdditional.value.trim();
    const lines = DOM.bulkItems.value
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      showToast('Please enter at least one item or select a preset.', 'info');
      return;
    }

    const queries = [];

    lines.forEach(item => {
      const parts = [];

      // Site scope
      if (targetDomain) {
        parts.push(`site:${targetDomain}`);
      }

      // Applied operator & item
      if (operator === 'none') {
        parts.push(item);
      } else if (operator === 'exact') {
        const clean = item.replace(/^"+|"+$/g, '').trim();
        parts.push(`"${clean}"`);
      } else {
        // e.g. filetype:, inurl:, intitle:, intext:
        const cleanItem = item.replace(/^"+|"+$/g, '').trim();
        if (cleanItem.includes(' ')) {
          parts.push(`${operator}"${cleanItem}"`);
        } else {
          parts.push(`${operator}${cleanItem}`);
        }
      }

      // Additional search terms
      if (additional) {
        parts.push(additional);
      }

      const q = parts.join(' ').trim();
      if (q) queries.push(q);
    });

    renderBulkResults(queries);
  }

  function renderBulkResults(queries) {
    DOM.bulkList.innerHTML = '';
    DOM.bulkTotalCount.textContent = queries.length;

    if (queries.length === 0) {
      DOM.bulkResultsSection.style.display = 'none';
      return;
    }

    queries.forEach((q, idx) => {
      const row = document.createElement('div');
      row.className = 'bulk-item';
      row.innerHTML = `
        <div class="bulk-item-text">${escapeHtml(q)}</div>
        <div class="bulk-item-actions">
          <button type="button" class="btn btn-xs btn-outline btn-copy-row" title="Copy query">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            Copy
          </button>
          <button type="button" class="btn btn-xs btn-secondary btn-google-row" title="Open in Google">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            Search
          </button>
        </div>
      `;

      row.querySelector('.btn-copy-row').addEventListener('click', () => copyToClipboard(q));
      row.querySelector('.btn-google-row').addEventListener('click', () => openInGoogle(q));

      DOM.bulkList.appendChild(row);
    });

    DOM.bulkResultsSection.style.display = 'block';
    showToast(`Generated ${queries.length} query variations.`, 'success');
  }

  function clearBulkForm() {
    DOM.bulkDomain.value = '';
    DOM.bulkPreset.value = 'custom';
    DOM.bulkAdditional.value = '';
    DOM.bulkItems.value = '';
    updateBulkItemCount();
    DOM.bulkResultsSection.style.display = 'none';
    DOM.bulkList.innerHTML = '';
  }

  function getBulkQueriesList() {
    const items = DOM.bulkList.querySelectorAll('.bulk-item-text');
    return Array.from(items).map(el => el.textContent.trim()).filter(Boolean);
  }

  function copyAllBulkQueries() {
    const list = getBulkQueriesList();
    if (list.length === 0) return;
    const combined = list.join('\n');
    copyToClipboard(combined);
    showToast(`Copied all ${list.length} queries to clipboard!`, 'success');
  }

  function exportBulkQueriesAsTxt() {
    const list = getBulkQueriesList();
    if (list.length === 0) return;
    const content = list.join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `google-dorks-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Exported queries to .txt file.', 'success');
  }

  // --- Saved Queries (Local Storage) ---
  const STORAGE_KEY = 'google_dorking_saved_queries_v1';

  function loadSavedQueries() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      state.savedQueries = data ? JSON.parse(data) : [];
    } catch (e) {
      state.savedQueries = [];
    }
    renderSavedQueries();
  }

  function persistSavedQueries() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.savedQueries));
    } catch (e) {
      console.warn('Unable to persist queries to local storage', e);
    }
    renderSavedQueries();
  }

  function saveCurrentQuery() {
    const query = DOM.generatedQuery.value.trim();
    if (!query) {
      showToast('No query to save.', 'info');
      return;
    }

    // Check duplicate
    if (state.savedQueries.some(item => item.query === query)) {
      showToast('This query is already saved in bookmarks.', 'info');
      return;
    }

    const newItem = {
      id: 'saved-' + Date.now(),
      query: query,
      timestamp: new Date().toLocaleString()
    };

    state.savedQueries.unshift(newItem);
    persistSavedQueries();
    showToast('Query saved to your bookmarks!', 'success');
  }

  function deleteSavedQuery(id) {
    state.savedQueries = state.savedQueries.filter(item => item.id !== id);
    persistSavedQueries();
    showToast('Saved query deleted.', 'info');
  }

  function clearAllSavedQueries() {
    if (state.savedQueries.length === 0) return;
    if (confirm('Are you sure you want to delete all saved queries?')) {
      state.savedQueries = [];
      persistSavedQueries();
      showToast('All saved queries cleared.', 'info');
    }
  }

  function renderSavedQueries() {
    DOM.savedCount.textContent = state.savedQueries.length;
    DOM.savedQueriesList.innerHTML = '';

    if (state.savedQueries.length === 0) {
      DOM.savedEmptyState.style.display = 'block';
      return;
    }

    DOM.savedEmptyState.style.display = 'none';

    state.savedQueries.forEach(item => {
      const el = document.createElement('div');
      el.className = 'saved-item';
      el.innerHTML = `
        <div class="saved-item-info">
          <div class="saved-item-query">${escapeHtml(item.query)}</div>
          <span class="saved-item-time">${escapeHtml(item.timestamp)}</span>
        </div>
        <div class="saved-item-actions">
          <button type="button" class="btn btn-xs btn-outline btn-load-saved" title="Load into editor">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            Load
          </button>
          <button type="button" class="btn btn-xs btn-outline btn-copy-saved" title="Copy query">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            Copy
          </button>
          <button type="button" class="btn btn-xs btn-secondary btn-google-saved" title="Open in Google">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            Search
          </button>
          <button type="button" class="btn btn-xs btn-danger-ghost btn-del-saved" title="Delete bookmark">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
          </button>
        </div>
      `;

      el.querySelector('.btn-load-saved').addEventListener('click', () => {
        DOM.generatedQuery.value = item.query;
        state.isManuallyEdited = true;
        showCustomBadge();
        updateQueryStats(item.query);
        switchTab('builder');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        showToast('Query loaded into preview editor.', 'info');
      });

      el.querySelector('.btn-copy-saved').addEventListener('click', () => copyToClipboard(item.query));
      el.querySelector('.btn-google-saved').addEventListener('click', () => openInGoogle(item.query));
      el.querySelector('.btn-del-saved').addEventListener('click', () => deleteSavedQuery(item.id));

      DOM.savedQueriesList.appendChild(el);
    });
  }

  // --- Toast Notifications ---
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconSvg = '';
    if (type === 'success') {
      iconSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.2"><polyline points="20 6 9 17 4 12"/></svg>';
    } else {
      iconSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
    }

    toast.innerHTML = `${iconSvg}<span>${escapeHtml(message)}</span>`;
    DOM.toastContainer.appendChild(toast);

    // Trigger transition
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentElement) toast.parentElement.removeChild(toast);
      }, 250);
    }, 2800);
  }

  // --- Utility: HTML Escaping ---
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Run on page load
  document.addEventListener('DOMContentLoaded', init);
})();
