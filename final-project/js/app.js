/**
 * Clinical Research Hub - Core Application Controller (ES Module)
 */

import { PubMedService } from "./PubMedService.mjs";
// Import your new Account Management module
import { AccountManager } from "./AccountManager.mjs";

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
  AccountManager.init(); // Initialize the account module
  syncAuthenticationUIElements(); // Bind UI constraints based on module response
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

  // Matrix Commit Synchronization Action
  DOM.quickSaveBtn.addEventListener("click", commitFormMetricsToStateCache);
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
  // Utilize module security check
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
    rebuildSpreadsheetGridUI();
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
    syncAuthenticationUIElements(); // Update application layout state variables immediately
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

  // Utilize module security check
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
  const automatedExtraction =
    parseClinicalParametersFromAbstract(textToAnalyze);
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

// 7. REST OF RENDER ENGINE METHODS RE-EXPORTED SAFELY
async function handleLiteratureSearch(event) {
  event.preventDefault();
  const query = DOM.searchInput.value.trim();
  DOM.resultsCount.textContent = "Querying live servers...";
  DOM.feedContainer.innerHTML =
    '<div class="empty-state">Streaming matching clinical trials from PubMed...</div>';

  try {
    const publications = await PubMedService.fetchPublications(query);
    StateManager.discoveryFeed = publications;
    renderDiscoveryFeedList();
  } catch (error) {
    console.error("Discovery Pipeline Failure:", error);
    DOM.resultsCount.textContent = "Error running query";
    DOM.feedContainer.innerHTML =
      '<div class="empty-state" style="color: var(--warning-crimson);">Query failure. Check proxy authentication pass layers.</div>';
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
  const updatedRow = {
    pmid: StateManager.currentPmid,
    sampleSize: DOM.mSample.value,
    methodology: DOM.mMethod.value,
    intervention: DOM.mIntervention.value,
    endpoints: DOM.mEndpoints.value,
  };
  StateManager.matrixCache.set(StateManager.currentPmid, updatedRow);
  const originalText = DOM.quickSaveBtn.textContent;
  DOM.quickSaveBtn.textContent = "Saved! ✓";
  DOM.quickSaveBtn.style.backgroundColor = "#059669";
  setTimeout(() => {
    DOM.quickSaveBtn.textContent = originalText;
    DOM.quickSaveBtn.style.backgroundColor = "";
  }, 1500);
}

function rebuildSpreadsheetGridUI() {
  DOM.spreadsheetBody.innerHTML = "";
  if (StateManager.matrixCache.size === 0) {
    DOM.spreadsheetBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#64748B;">No records compiled in your matrix spreadsheet yet.</td></tr>`;
    return;
  }
  StateManager.matrixCache.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td><strong>${row.pmid}</strong></td><td>${row.sampleSize || "N/A"}</td><td>${row.methodology}</td><td>${row.intervention}</td><td style="max-width:250px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${row.endpoints}</td>`;
    DOM.spreadsheetBody.appendChild(tr);
  });
}

function parseClinicalParametersFromAbstract(text) {
  if (!text)
    return {
      sampleSize: "",
      methodology: "Unspecified Study",
      intervention: "Not Specified",
      endpoints: "No text block.",
    };
  const cleanText = text.replace(/\n/g, " ");
  let derivedSampleSize = null;
  const sampleSizeRegexes = [
    /(?:n\s*=\s*|sample size of\s*|enrolled\s*|cohort of\s*)(\d{1,6})\b/i,
    /(\d{1,6})\s*(?:participants|patients|subjects|healthy volunteers|cases)/i,
  ];
  for (let regex of sampleSizeRegexes) {
    const match = cleanText.match(regex);
    if (match && match[1]) {
      derivedSampleSize = parseInt(match[1]);
      break;
    }
  }
  let derivedMethodology = "Clinical Study (Unspecified)";
  if (
    cleanText.toLowerCase().includes("randomized controlled trial") ||
    cleanText.toLowerCase().includes("randomised controlled trial")
  )
    derivedMethodology = "Randomized Controlled Trial (RCT)";
  else if (cleanText.toLowerCase().includes("meta-analysis"))
    derivedMethodology = "Systematic Review & Meta-Analysis";
  else if (cleanText.toLowerCase().includes("cohort study"))
    derivedMethodology = "Cohort Observational Study";

  return {
    sampleSize: derivedSampleSize,
    methodology: derivedMethodology,
    intervention: "Parsed from abstract contextual parameters.",
    endpoints: "Review structural sections inside reading modal popup windows.",
  };
}

initApplication();
