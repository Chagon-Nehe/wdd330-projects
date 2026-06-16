/**
 * Clinical Research Hub - Core Application Controller (ES Module)
 */
import { PubMedService } from "./PubMedService.mjs";
import { AccountManager } from "./AccountManager.mjs";

// IMPORTING YOUR TARGET CODE MODULES SUCCESSFULLY
import { MatrixManager } from "./MatrixManager.mjs";
import { AbstractCompiler } from "./AbstractCompiler.mjs"; // Interacts with structural parser logic
import { SemanticScholarService } from "./SemanticScholarService.mjs"; // Cross-database search framework

// 1. RUNNING STATE CONFIGURATION MODEL
const StateManager = {
  discoveryFeed: [],
  matrixCache: new Map(),
  activeView: "dashboard",
  currentPmid: null,
};

// 2. COMPLETE DOM SELECTORS CACHE
const DOM = {
  // Navigation Nodes
  navDashboard: document.getElementById("nav-dashboard"),
  navWorkspace: document.getElementById("nav-workspace"),
  viewDashboard: document.getElementById("view-dashboard"),
  viewWorkspace: document.getElementById("view-workspace"),

  // Core Engine Input Channels
  searchForm: document.getElementById("search-form"),
  searchInput: document.getElementById("search-input"),
  feedContainer: document.getElementById("feed-container"),
  resultsCount: document.getElementById("results-count"),

  // MOBILE FILTER DRAWER TARGET (Matches your index.html button and aside panel)
  mobileFilterTrigger: document.getElementById("mobile-filter-trigger"),
  panelFilters: document.getElementById("panel-filters"),

  // Matrix Fields
  panelMatrixPane: document.getElementById("panel-matrix-pane"),
  matrixFormContainer: document.getElementById("matrix-form-container"),
  matrixPaperId: document.getElementById("matrix-paper-id"),
  mTitle: document.getElementById("m-title"),
  mSample: document.getElementById("m-sample"),
  mMethod: document.getElementById("m-method"),
  mIntervention: document.getElementById("m-intervention"),
  mEndpoints: document.getElementById("m-endpoints"),
  quickSaveBtn: document.getElementById("quick-save-matrix"),

  // EXPORT ACTION TARGET (Matches your exact index.html ID)
  exportMatrixCsv: document.getElementById("export-matrix-csv"),

  // Reading Preview Overlays
  pubModal: document.getElementById("publication-modal"),
  modalTitle: document.getElementById("modal-title"),
  modalAuthors: document.getElementById("modal-authors"),
  modalPubDate: document.getElementById("modal-pubdate"),
  modalAbstract: document.getElementById("modal-abstract"),
  closeModalBtn: document.getElementById("close-modal-btn"),
  modalConfirmBtn: document.getElementById("modal-confirm-btn"),

  // Identity / Membership Dialog Controls
  authModal: document.getElementById("auth-modal"),
  authForm: document.getElementById("identity-auth-form"),
  authEmail: document.getElementById("auth-email"),
  authPassword: document.getElementById("auth-password"),
  authSubmitBtn: document.getElementById("auth-submit-btn"),
  authToggleLink: document.getElementById("auth-toggle-context-link"),
  authTitleTag: document.getElementById("auth-modal-title-tag"),
  closeAuthModalBtn: document.getElementById("close-auth-modal-btn"),
  headerLoginTriggerBtn: document.getElementById("header-login-trigger-btn"),
  headerLogoutBtn: document.getElementById("header-logout-btn"),

  // Ensure these are inside your DOM object cache:
  journalRuleSelect: document.getElementById("journal-rule-select"),
  abstractTitle: document.getElementById("abstract-title"),
  secIntroduction: document.getElementById("sec-introduction"),
  secMethods: document.getElementById("sec-methods"),
  secResults: document.getElementById("sec-results"),
  secConclusion: document.getElementById("sec-conclusion"),
  wordCountDisplay: document.getElementById("word-count-display"),
  wordLimitDisplay: document.getElementById("word-limit-display"),
  chkHeadings: document.getElementById("chk-headings"),
  chkLength: document.getElementById("chk-length"),

  // Spreadsheet and document Workspace Framework
  spreadsheetBody: document.getElementById("spreadsheet-body"),
  exportAbstractDoc: document.getElementById("export-abstract-doc"),
};

let currentAuthMode = "signin";

// CORE CONTROLLER INITIALIZATION FLOW
function initApplication() {
  AccountManager.init();
  syncAuthenticationUIElements();
  setupEventPipelines();
  console.log(
    "Modular Clinical Research Hub App Dashboard Orchestrator Online.",
  );
}

// EVENT BINDINGS REGISTRY
function setupEventPipelines() {
  DOM.navDashboard.addEventListener("click", () =>
    switchPrimaryView("dashboard"),
  );
  DOM.navWorkspace.addEventListener("click", () =>
    switchPrimaryView("workspace"),
  );
  DOM.searchForm.addEventListener("submit", handleLiteratureSearch);

  if (DOM.exportAbstractDoc) {
    DOM.exportAbstractDoc.addEventListener("click", (e) => {
      e.preventDefault();
      exportAbstractToDocx();
    });
  }
  // MOBILE INTERFACE EVENT TRAFFIC PIPELINES
  if (DOM.mobileFilterTrigger) {
    DOM.mobileFilterTrigger.addEventListener("click", toggleMobileFilterPane);
  }

  if (DOM.exportMatrixCsv) {
    DOM.exportMatrixCsv.addEventListener("click", (e) => {
      e.preventDefault();
      exportToCSV();
    });
  }

  // Publication Lightbox Bindings
  DOM.closeModalBtn.addEventListener("click", () =>
    DOM.pubModal.classList.remove("modal-active"),
  );
  DOM.modalConfirmBtn.addEventListener("click", () =>
    DOM.pubModal.classList.remove("modal-active"),
  );
  DOM.pubModal.addEventListener("click", (e) => {
    if (e.target === DOM.pubModal)
      DOM.pubModal.classList.remove("modal-active");
  });

  

  //  LISTEN FOR TYPING & DROPDOWN CHANGES TO EVALUATE MANUSCRIPT METRICS
  const manuscriptInputs = [
    DOM.abstractTitle,
    DOM.secIntroduction,
    DOM.secMethods,
    DOM.secResults,
    DOM.secConclusion,
  ];

  manuscriptInputs.forEach((inputElement) => {
    if (inputElement) {
      inputElement.addEventListener(
        "input",
        runLiveCompositionCompilerPipeline,
      );
    }
  });

  if (DOM.journalRuleSelect) {
    DOM.journalRuleSelect.addEventListener(
      "change",
      runLiveCompositionCompilerPipeline,
    );
  }

  // RESTORE SAVED DRAFT STATE AUTOMATICALLY ON BOOTUP
  restoreCachedManuscriptDraft();

  // Authentication Dialog Actions
  DOM.headerLoginTriggerBtn.addEventListener("click", openAuthenticationModal);
  DOM.closeAuthModalBtn.addEventListener("click", closeAuthenticationModal);
  DOM.headerLogoutBtn.addEventListener("click", () => {
    AccountManager.terminateSession();
    syncAuthenticationUIElements();
    switchPrimaryView("dashboard");
  });
  DOM.authToggleLink.addEventListener("click", toggleAuthenticationContextMode);
  DOM.authForm.addEventListener("submit", handleAuthenticationFormSubmission);
  DOM.authModal.addEventListener("click", (e) => {
    if (e.target === DOM.authModal) closeAuthenticationModal();
  });

  // Matrix Commit Synchronization Action Delegated to Module
  DOM.quickSaveBtn.addEventListener("click", commitFormMetricsToStateCache);
}

// MOBILE DRAWER DOM UTILITY
function toggleMobileFilterPane() {
    if (DOM.panelFilters) {
        DOM.panelFilters.classList.toggle("filters-visible-mobile");
    }
}


function exportToCSV() {
    if (!StateManager.matrixCache || StateManager.matrixCache.size === 0) {
        alert("Your spreadsheet matrix cache is empty. Please log parameters first.");
        return;
    }

    let csvString = "PMID,Sample Size,Methodology,Intervention,Endpoints\n";
    
    StateManager.matrixCache.forEach((row) => {
        const cleanSample = String(row.sampleSize || "N/A").replace(/"/g, '""');
        const cleanMethod = String(row.methodology || "N/A").replace(/"/g, '""');
        const cleanIntervention = String(row.intervention || "N/A").replace(/"/g, '""');
        const cleanEndpoints = String(row.endpoints || "N/A").replace(/"/g, '""');
        
        csvString += `${row.pmid},"${cleanSample}","${cleanMethod}","${cleanIntervention}","${cleanEndpoints}"\n`;
    });

    const csvBlob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const virtualLink = document.createElement("a");
    
    // Fallback layer resolving native sandbox container limits on mobile web views
    const fileBlobUrl = URL.createObjectURL(csvBlob);
    virtualLink.href = fileBlobUrl;
    virtualLink.setAttribute("download", "clinical_matrix_synthesis.csv");
    
    document.body.appendChild(virtualLink);
    virtualLink.click();
    
    document.body.removeChild(virtualLink);
    URL.revokeObjectURL(fileBlobUrl);
}

// 5. SECURITY SWITCH SHIELDS & UI MIRRORING
function syncAuthenticationUIElements() {
  const loginBtn = DOM.headerLoginTriggerBtn;
  const logoutZone = document.getElementById("user-logged-in-zone");
  const userEmailDisplay = document.getElementById("user-display-email");
  const workspaceTab = DOM.navWorkspace;
  const matrixPane = DOM.panelMatrixPane;

  if (AccountManager.isAuthenticated()) {
    const user = AccountManager.getCurrentUser();
    if (loginBtn) loginBtn.style.display = "none";
    if (logoutZone) logoutZone.style.display = "block";
    if (userEmailDisplay) userEmailDisplay.textContent = user.email;
    if (workspaceTab) {
      workspaceTab.classList.remove("locked-view-tab");
      workspaceTab.textContent = "Abstract Workspace";
    }
    const existingShield = matrixPane.querySelector(".pane-blur-shield");
    if (existingShield) existingShield.remove();
  } else {
    if (loginBtn) loginBtn.style.display = "block";
    if (logoutZone) logoutZone.style.display = "none";
    if (workspaceTab) {
      workspaceTab.classList.add("locked-view-tab");
      workspaceTab.textContent = "Abstract Workspace 🔒";
    }
    injectBlurredShieldOverElement(
      matrixPane,
      "Data-Extraction Spreadsheet Matrix",
      "Register an account to log variables, extract parameters, and track literature synthesis tables.",
    );
  }
}

function switchPrimaryView(targetView) {
  if (targetView === "workspace" && !AccountManager.isAuthenticated()) {
    openAuthenticationModal();
    alert(
      "Access Restriction: Abstract Workspaces and Active Spreadsheet Extractions are strictly reserved for registered users.",
    );
    return;
  }

  StateManager.activeView = targetView;
  if (targetView === "dashboard") {
    DOM.navDashboard.classList.add("active");
    DOM.navWorkspace.classList.remove("active");
    DOM.viewDashboard.classList.add("active-view");
    DOM.viewWorkspace.classList.remove("active-view");
  } else {
    DOM.navWorkspace.classList.add("active");
    DOM.navDashboard.classList.remove("active");
    DOM.viewWorkspace.classList.add("active-view");
    DOM.viewDashboard.classList.remove("active-view");

    // MODULAR Utilizing MatrixManager module to render table grid elements
    MatrixManager.rebuildSpreadsheetGridUI(
      DOM.spreadsheetBody,
      StateManager.matrixCache,
    );
  }
}

function handleAuthenticationFormSubmission(e) {
  e.preventDefault();
  const email = DOM.authEmail.value.trim();
  const password = DOM.authPassword.value;
  let successfulAction = false;

  if (currentAuthMode === "signin") {
    successfulAction = AccountManager.verifyCredentialsAndLogin(
      email,
      password,
    );
  } else {
    successfulAction = AccountManager.registerNewAccount(email, password);
  }

  if (successfulAction) {
    DOM.authForm.reset();
    closeAuthenticationModal();
    syncAuthenticationUIElements();
  }
}

function loadTargetPaperIntoMatrixPane(paper) {
  document
    .querySelectorAll(".publication-card")
    .forEach((c) => c.classList.remove("selected-card"));
  const selectedElement = document.querySelector(
    `.publication-card[data-pmid="${paper.pmid}"]`,
  );
  if (selectedElement) selectedElement.classList.add("selected-card");

  const formattedAuthors =
    paper.authors.map((a) => a.name).join(", ") || "Unknown Authors";
  DOM.modalTitle.textContent = paper.title || "Untitled Literature Piece";
  DOM.modalAuthors.textContent = `By: ${formattedAuthors}`;
  DOM.modalPubDate.textContent = `📅 Publication Date: ${paper.pub_date || "Not Specified"}`;
  DOM.modalAbstract.textContent =
    paper.abstract || "Full abstract text block unavailable.";
  DOM.pubModal.classList.add("modal-active");

  if (!AccountManager.isAuthenticated()) {
    console.log(
      "Anonymous Reader Pipeline tracking triggered. Extraction Matrix form write skipped.",
    );
    return;
  }

  StateManager.currentPmid = paper.pmid;
  DOM.matrixFormContainer.classList.remove("disabled-state");
  DOM.matrixPaperId.value = paper.pmid;
  DOM.mTitle.value = paper.title || "Untitled Document";

  const textToAnalyze = `${paper.title} ${paper.abstract || ""}`;

  // MODULAR Offload regex parameters parsing to AbstractCompiler
  const automatedExtraction =
    AbstractCompiler.parseClinicalParametersFromAbstract(textToAnalyze);
  const existingCache = StateManager.matrixCache.get(paper.pmid);

  DOM.mSample.value = existingCache
    ? existingCache.sampleSize
    : automatedExtraction.sampleSize || "";
  DOM.mMethod.value = existingCache
    ? existingCache.methodology
    : automatedExtraction.methodology;
  DOM.mIntervention.value = existingCache
    ? existingCache.intervention
    : automatedExtraction.intervention;
  DOM.mEndpoints.value = existingCache
    ? existingCache.endpoints
    : automatedExtraction.endpoints;
}

// UTILITY UI PROTECTION INTERFACES
function injectBlurredShieldOverElement(
  parentElement,
  titleString,
  descString,
) {
  if (parentElement.querySelector(".pane-blur-shield")) return;

  const shield = document.createElement("div");
  shield.className = "pane-blur-shield";
  shield.innerHTML = `
        <div class="shield-prompt-box">
            <h3>🔒 ${titleString}</h3>
            <p>${descString}</p>
            <button class="btn-accent launch-shield-login-btn" style="padding:0.5rem 1rem; font-size:0.8rem; border-radius:4px; border:none; cursor:pointer;">Authenticate Now</button>
        </div>
    `;

  shield
    .querySelector(".launch-shield-login-btn")
    .addEventListener("click", openAuthenticationModal);
  parentElement.style.position = "relative";
  parentElement.appendChild(shield);
}

function openAuthenticationModal() {
  DOM.authModal.classList.add("modal-active");
}
function closeAuthenticationModal() {
  DOM.authModal.classList.remove("modal-active");
}

function toggleAuthenticationContextMode(e) {
  e.preventDefault();
  if (currentAuthMode === "signin") {
    currentAuthMode = "signup";
    DOM.authTitleTag.textContent = "Create Academic Account";
    DOM.authSubmitBtn.textContent = "Register & Connect Account";
    DOM.authToggleLink.textContent = "Already registered? Sign In instead";
  } else {
    currentAuthMode = "signin";
    DOM.authTitleTag.textContent = "Account Authentication";
    DOM.authSubmitBtn.textContent = "Sign In";
    DOM.authToggleLink.textContent = "Need an account? Sign Up here";
  }
}

// MULTI-SERVICE ENGINE LOOKUP SEARCH PIPELINE
async function handleLiteratureSearch(event) {
  event.preventDefault();
  const query = DOM.searchInput.value.trim();
  DOM.resultsCount.textContent = "Cross-querying database records...";
  DOM.feedContainer.innerHTML =
    '<div class="empty-state">Streaming tracking datasets from integrated providers...</div>';

  try {
    // MODULAR UPDATES: Simultaneously stream query arrays from BOTH PubMed and SemanticScholar systems!
    const [pubmedResults, semanticResults] = await Promise.allSettled([
      PubMedService.fetchPublications(query) ,
      SemanticScholarService.fetchPublications(query),
    ]);

    let combinedPublications = [];
    if (pubmedResults.status === "fulfilled")
      combinedPublications.push(...pubmedResults.value); 
    if (semanticResults.status === "fulfilled")
      combinedPublications.push(...semanticResults.value);

    // Filter duplicates based on unique PMIDs or titles if cross-listed
    const uniqueMap = new Map();
    combinedPublications.forEach((paper) =>
      uniqueMap.set(paper.pmid || paper.title.toLowerCase(), paper),
    );

    StateManager.discoveryFeed = Array.from(uniqueMap.values());
    renderDiscoveryFeedList();

    // Close mobile side drawer automatically when executing query search
    if (DOM.panelFilters) {
      DOM.panelFilters.classList.remove("filters-visible-mobile");
    }
  } catch (error) {
    console.error("Discovery Pipeline Failure:", error);
    DOM.resultsCount.textContent = "Error running multi-service query";
    DOM.feedContainer.innerHTML =
      '<div class="empty-state" style="color: var(--warning-crimson);">Query failure inside search aggregation layers.</div>';
  }
}

function renderDiscoveryFeedList() {
  if (StateManager.discoveryFeed.length === 0) {
    DOM.resultsCount.textContent = "0 papers found";
    DOM.feedContainer.innerHTML =
      '<div class="empty-state">No medical records match your criteria.</div>';
    return;
  }
  DOM.resultsCount.textContent = `${StateManager.discoveryFeed.length} papers identified`;
  DOM.feedContainer.innerHTML = "";

  StateManager.discoveryFeed.forEach((paper) => {
    const card = document.createElement("div");
    card.className = "publication-card";
    card.setAttribute("data-pmid", paper.pmid);
    const authorNamesList =
      paper.authors.map((a) => a.name).join(", ") || "Unknown Authors";

    card.innerHTML = `
            <h4>${paper.title || "Untitled Document"}</h4>
            <div class="pub-metadata"><strong>Authors:</strong> ${authorNamesList}</div>
            <div class="pub-metadata"><strong>Journal:</strong> ${paper.journal?.name || "Unknown"} | <strong>Published:</strong> ${paper.pub_date || "N/A"}</div>
            <p class="pub-snippet">${paper.abstract ? paper.abstract.substring(0, 130) + "..." : "No abstract parsed."}</p>
        `;
    card.addEventListener("click", () => loadTargetPaperIntoMatrixPane(paper));
    DOM.feedContainer.appendChild(card);
  });
}

function commitFormMetricsToStateCache() {
  if (!StateManager.currentPmid) return;

  // MODULAR Offload data construction and structural validation handling to MatrixManager
  const updatedRow = {
    pmid: StateManager.currentPmid,
    sampleSize: DOM.mSample.value,
    methodology: DOM.mMethod.value,
    intervention: DOM.mIntervention.value,
    endpoints: DOM.mEndpoints.value,
  };

  MatrixManager.saveRowToCache(
    StateManager.matrixCache,
    StateManager.currentPmid,
    updatedRow,
  );

  const originalText = DOM.quickSaveBtn.textContent;
  DOM.quickSaveBtn.textContent = "Saved! ✓";
  DOM.quickSaveBtn.style.backgroundColor = "#059669";
  setTimeout(() => {
    DOM.quickSaveBtn.textContent = originalText;
    DOM.quickSaveBtn.style.backgroundColor = "";
  }, 1500);
}

// Trigger Application Launch
initApplication();




/**
 * Compiles structured abstract text inputs into an XML-wrapped document blob
 * and triggers a native file download formatted for Microsoft Word (.docx)
 */
function exportAbstractToDocx() {
    // Fetch values from fields or assign clean fallbacks if empty
    const docTitle = DOM.abstractTitle?.value.trim() || "Untitled Manuscript Abstract Draft";
    const introText = DOM.secIntroduction?.value.trim() || "No background text provided.";
    const methodsText = DOM.secMethods?.value.trim() || "No methodology text provided.";
    const resultsText = DOM.secResults?.value.trim() || "No statistical results provided.";
    const conclusionText = DOM.secConclusion?.value.trim() || "No final deductions provided.";
    
    const selectedJournalValue = DOM.journalRuleSelect?.value || "nature";
    const journalNameMap = {
        nature: "Nature Medicine Guidelines Ruleset",
        lancet: "The Lancet Guidelines Ruleset",
        nejm: "NEJM Ruleset"
    };
    const activeRulesetName = journalNameMap[selectedJournalValue];

    // Construct a Word-compatible HTML string with basic inline styles
    const docHtmlBody = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>${docTitle}</title>
        <style>
          body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #111827; padding: 1in; }
          h1 { color: #1E3A8A; font-size: 22pt; margin-bottom: 6pt; font-weight: bold; }
          .metadata-tag { color: #4B5563; font-size: 10pt; font-style: italic; margin-bottom: 24pt; border-bottom: 1px solid #E5E7EB; padding-bottom: 6pt; }
          h2 { color: #0D9488; font-size: 14pt; margin-top: 16pt; margin-bottom: 4pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; }
          p { font-size: 11pt; margin-bottom: 12pt; text-align: justify; }
        </style>
      </head>
      <body>
        <h1>${docTitle}</h1>
        <div class="metadata-tag">Compiled via Clinical Research Hub Framework &bull; Target: ${activeRulesetName}</div>
        
        <h2>Introduction / Background</h2>
        <p>${introText}</p>
        
        <h2>Methods</h2>
        <p>${methodsText}</p>
        
        <h2>Results</h2>
        <p>${resultsText}</p>
        
        <h2>Conclusion</h2>
        <p>${conclusionText}</p>
      </body>
      </html>
    `;

    // Convert content to a true application/msword binary blob object
    const docBlob = new Blob(['\ufeff' + docHtmlBody], {
        type: 'application/msword;charset=utf-8;'
    });

    // Trigger safe download pipeline matching mobile and desktop environments
    const downloadAnchor = document.createElement("a");
    const filename = `${docTitle.toLowerCase().replace(/[^a-z0-9]/g, "_")}_abstract_draft.doc`;
    
    const docUrl = URL.createObjectURL(docBlob);
    downloadAnchor.href = docUrl;
    downloadAnchor.setAttribute("download", filename);
    
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    
    //  Instantly clear structural footprint from background environment
    document.body.removeChild(downloadAnchor);
    URL.revokeObjectURL(docUrl);
}

/**
 * Compiles active text layers, runs compliance evaluations, and updates the editor UI metrics
 */
async function runLiveCompositionCompilerPipeline() {
    //  Combine all active section fields to evaluate absolute word usage
    const combinedContentText = [
        DOM.secIntroduction.value,
        DOM.secMethods.value,
        DOM.secResults.value,
        DOM.secConclusion.value
    ].join(" ");

    const selectedJournal = DOM.journalRuleSelect.value;

    // Run computational metrics via the unified compiler module
    const metrics = AbstractCompiler.evaluateMetrics(combinedContentText, selectedJournal);

    // Update Text Word-Counters
    if (DOM.wordCountDisplay) DOM.wordCountDisplay.textContent = metrics.wordCount;
    if (DOM.wordLimitDisplay) DOM.wordLimitDisplay.textContent = metrics.limit;

    // Update UI Checklist Badges
    if (DOM.chkLength) {
        if (metrics.isSafeLength) {
            DOM.chkLength.textContent = "✔️ Safe Length Threshold";
            DOM.chkLength.style.color = "#059669"; // Green
        } else {
            DOM.chkLength.textContent = "❌ Word Count Exceeded Target";
            DOM.chkLength.style.color = "#DC2626"; // Crimson Warning
        }
    }

    if (DOM.chkHeadings) {
        const hasTextInSections = DOM.secIntroduction.value.trim() && DOM.secMethods.value.trim();
        if (metrics.requiresStructure && !hasTextInSections) {
            DOM.chkHeadings.textContent = "⚠️ Structural Sections Incomplete";
            DOM.chkHeadings.style.color = "#D97706"; // Amber Warning
        } else {
            DOM.chkHeadings.textContent = "✔️ Structural Headings Active";
            DOM.chkHeadings.style.color = "#059669";
        }
    }

    // Fire off silent persistent asynchronous background save
    AbstractCompiler.backupDraftState(
        DOM.abstractTitle.value,
        DOM.secIntroduction.value,
        DOM.secMethods.value,
        DOM.secResults.value,
        DOM.secConclusion.value,
        selectedJournal
    );
}

/**
 * Checks for previous browser backup profiles upon login or page initialization
 */
async function restoreCachedManuscriptDraft() {
    const savedDraft = await AbstractCompiler.getSavedDraft();
    if (!savedDraft) return;

    // Repopulate user workspace inputs with recovered data payload objects
    if (DOM.abstractTitle) DOM.abstractTitle.value = savedDraft.title || "";
    if (DOM.secIntroduction) DOM.secIntroduction.value = savedDraft.intro || "";
    if (DOM.secMethods) DOM.secMethods.value = savedDraft.methods || "";
    if (DOM.secResults) DOM.secResults.value = savedDraft.results || "";
    if (DOM.secConclusion) DOM.secConclusion.value = savedDraft.conclusion || "";
    if (DOM.journalRuleSelect) DOM.journalRuleSelect.value = savedDraft.activeJournal || "nature";

    // Re-evaluate word counts immediately upon data population loading paths
    runLiveCompositionCompilerPipeline();
}