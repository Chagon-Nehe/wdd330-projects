/**
 * Clinical Research Hub - Core Application Controller (ES Module)
 */
import { PubMedService } from "./PubMedService.mjs";
import { AccountManager } from "./AccountManager.mjs";

// IMPORTING YOUR TARGET CODE MODULES SUCCESSFULLY
import { MatrixManager } from "./MatrixManager.mjs";
import { AbstractCompiler } from "./AbstractCompiler.mjs"; // Interacts with structural parser logic
//import { SemanticScholarService } from "./SemanticScholarService.mjs"; // Cross-database search framework

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

  // Spreadsheet Workspace Framework
  spreadsheetBody: document.getElementById("spreadsheet-body"),
};

let currentAuthMode = "signin";

// 3. CORE CONTROLLER INITIALIZATION FLOW
function initApplication() {
  AccountManager.init();
  syncAuthenticationUIElements();
  setupEventPipelines();
  console.log(
    "Modular Clinical Research Hub App Dashboard Orchestrator Online.",
  );
}

// 4. EVENT BINDINGS REGISTRY
function setupEventPipelines() {
  DOM.navDashboard.addEventListener("click", () =>
    switchPrimaryView("dashboard"),
  );
  DOM.navWorkspace.addEventListener("click", () =>
    switchPrimaryView("workspace"),
  );
  DOM.searchForm.addEventListener("submit", handleLiteratureSearch);

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

// MOBILE CONTEXT SAFE CONVERT AND DOWNLOAD DRIVER
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

    // MODULAR UPDATES: Utilizing MatrixManager module to render table grid elements
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

// 6. UTILITY UI PROTECTION INTERFACES
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

// 7. MULTI-SERVICE ENGINE LOOKUP SEARCH PIPELINE
async function handleLiteratureSearch(event) {
  event.preventDefault();
  const query = DOM.searchInput.value.trim();
  DOM.resultsCount.textContent = "Cross-querying database records...";
  DOM.feedContainer.innerHTML =
    '<div class="empty-state">Streaming tracking datasets from integrated providers...</div>';

  try {
    // MODULAR UPDATES: Simultaneously stream query arrays from BOTH PubMed and SemanticScholar systems!
    const [pubmedResults, semanticResults] = await Promise.allSettled([
      PubMedService.fetchPublications(query) /*,
      SemanticScholarService.fetchPublications(query),*/,
    ]);

    let combinedPublications = [];
    if (pubmedResults.status === "fulfilled")
      combinedPublications.push(...pubmedResults.value); /*
    if (semanticResults.status === "fulfilled")
      combinedPublications.push(...semanticResults.value);*/

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

  // MODULAR UPDATES: Offload data construction and structural validation handling to MatrixManager
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
