import { PubMedService } from "./PubMedService.mjs";
import { SemanticScholarService } from "./SemanticScholarService.mjs";
import { MatrixManager } from "./MatrixManager.mjs";
import { AbstractCompiler } from "./AbstractCompiler.mjs";

// DOM Element Registry Selector Blocks
const navDashboard = document.getElementById("nav-dashboard");
const navWorkspace = document.getElementById("nav-workspace");
const viewDashboard = document.getElementById("view-dashboard");
const viewWorkspace = document.getElementById("view-workspace");

const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const feedContainer = document.getElementById("feed-container");
const resultsCount = document.getElementById("results-count");

const matrixFormContainer = document.getElementById("matrix-form-container");
const activeExtractionForm = document.getElementById("active-extraction-form");
const matrixPaperId = document.getElementById("matrix-paper-id");
const mTitle = document.getElementById("m-title");
const mSample = document.getElementById("m-sample");
const mMethod = document.getElementById("m-method");
const mIntervention = document.getElementById("m-intervention");
const mEndpoints = document.getElementById("m-endpoints");
const quickSaveBtn = document.getElementById("quick-save-matrix");

const spreadsheetBody = document.getElementById("spreadsheet-body");
const exportCsvBtn = document.getElementById("export-matrix-csv");
const exportDocBtn = document.getElementById("export-abstract-doc");

const journalRuleSelect = document.getElementById("journal-rule-select");
const abstractTitle = document.getElementById("abstract-title");
const secIntro = document.getElementById("sec-introduction");
const secMethods = document.getElementById("sec-methods");
const secResults = document.getElementById("sec-results");
const secConclusion = document.getElementById("sec-conclusion");
const wordCountDisplay = document.getElementById("word-count-display");
const wordLimitDisplay = document.getElementById("word-limit-display");
const chkLength = document.getElementById("chk-length");

const mobileFilterTrigger = document.getElementById("mobile-filter-trigger");
const panelFilters = document.getElementById("panel-filters");

let transientDiscoveryFeedMemory = [];

// App Startup Orchestration
document.addEventListener("DOMContentLoaded", async () => {
  await MatrixManager.initializeMatrixState();
  await loadAndHydrateAbstractWorkspace();
  renderSpreadsheetGridData();
  setupEventPipelines();
});

function setupEventPipelines() {
  // Tab View Navigation Mechanics
  navDashboard.addEventListener("click", () => togglePrimaryViews("dashboard"));
  navWorkspace.addEventListener("click", () => togglePrimaryViews("workspace"));

  // Mobile Overlay Filter Control
  mobileFilterTrigger.addEventListener("click", () => {
    panelFilters.classList.toggle("mobile-open");
  });

  // Search Lifecycle Execution
  searchForm.addEventListener("submit", handleSearchExecution);

  // Matrix Modification Tracking Mechanics
  quickSaveBtn.addEventListener("click", processMatrixPaneFormSave);

  // Abstract Real-Time Input Processing Pipeline
  const textBlocks = [
    abstractTitle,
    secIntro,
    secMethods,
    secResults,
    secConclusion,
  ];
  textBlocks.forEach((element) => {
    element.addEventListener("input", processingCompositionUpdateDebounce);
  });
  journalRuleSelect.addEventListener(
    "change",
    processingCompositionUpdateDebounce,
  );

  // Data Export Triggers
  exportCsvBtn.addEventListener("click", () => {
    const rawOutput = MatrixManager.generateCSVBlobString();
    triggerClientFileDownload(rawOutput, "extraction_matrix.csv", "text/csv");
  });

  exportDocBtn.addEventListener(
    "click",
    executeDocumentManuscriptCompilationDownload,
  );
}

function togglePrimaryViews(targetView) {
  if (targetView === "dashboard") {
    navDashboard.classList.add("active");
    navWorkspace.classList.remove("active");
    viewDashboard.classList.add("active-view");
    viewWorkspace.classList.remove("active-view");
  } else {
    navDashboard.classList.remove("active");
    navWorkspace.classList.add("active");
    viewDashboard.classList.remove("active-view");
    viewWorkspace.classList.add("active-view");
    renderSpreadsheetGridData(); // Hydrate the table layout update
  }
}

async function handleSearchExecution(e) {
  e.preventDefault();
  const query = searchInput.value.trim();
  if (!query) return;

  resultsCount.textContent = "Querying databases...";
  feedContainer.innerHTML =
    '<div class="empty-state">Contacting PubMed Gateway Services...</div>';

  try {
    const rawResults = await PubMedService.fetchPublications(query);
    transientDiscoveryFeedMemory = [];

    // Apply programmatic client-side sample filtration metrics if requested
    const minFilterVal =
      parseInt(document.getElementById("filter-sample-size").value) || 0;

    for (let paper of rawResults) {
      const analyticalEnrichment =
        await SemanticScholarService.enrichCitationMetrics(paper.pmid);
      const synthesizedModel = { ...paper, ...analyticalEnrichment };
      transientDiscoveryFeedMemory.push(synthesizedModel);
    }

    renderDiscoveryFeedList();
  } catch (err) {
    feedContainer.innerHTML =
      '<div class="empty-state" style="color:var(--warning-crimson)">Failed to execute external data fetch operations.</div>';
  }
}

function renderDiscoveryFeedList() {
  if (transientDiscoveryFeedMemory.length === 0) {
    resultsCount.textContent = "0 papers found";
    feedContainer.innerHTML =
      '<div class="empty-state">No medical records match your parameters.</div>';
    return;
  }

  resultsCount.textContent = `${transientDiscoveryFeedMemory.length} papers identified`;
  feedContainer.innerHTML = "";

  transientDiscoveryFeedMemory.forEach((paper) => {
    const card = document.createElement("div");
    card.className = "publication-card";
    card.setAttribute("data-pmid", paper.pmid);

    const oaTag = paper.isOpenAccess
      ? '<span class="badge" style="background-color:#CCFBF1;color:#14532D">Open Access</span>'
      : "";

    card.innerHTML = `
            <h4>${paper.title}</h4>
            <div class="pub-metadata"><strong>Authors:</strong> ${paper.authors} | <strong>Journal:</strong> ${paper.journal} (${paper.year}) ${oaTag}</div>
            <p class="pub-snippet">${paper.abstract.substring(0, 140)}...</p>
            <div class="pub-metadata" style="margin-top:0.5rem; margin-bottom:0;">📊 Citations: ${paper.citationCount}</div>
        `;

    card.addEventListener("click", () => loadTargetPaperIntoMatrixPane(paper));
    feedContainer.appendChild(card);
  });
}

function loadTargetPaperIntoMatrixPane(paper) {
  // Clear old visual highlights
  document
    .querySelectorAll(".publication-card")
    .forEach((c) => c.classList.remove("selected-card"));

  const selectedElement = document.querySelector(
    `.publication-card[data-pmid="${paper.pmid}"]`,
  );
  if (selectedElement) selectedElement.classList.add("selected-card");

  matrixFormContainer.classList.remove("disabled-state");

  // Inject parameters safely into structural views
  matrixPaperId.value = paper.pmid;
  mTitle.value = paper.title;

  // Check if an existing extraction configuration is available in client memory
  const history = MatrixManager.getEntry(paper.pmid);
  mSample.value = history ? history.sampleSize : "";
  mMethod.value = history ? history.methodology : "";
  mIntervention.value = history ? history.intervention : "";
  mEndpoints.value = history ? history.endpoints : "";
}

async function processMatrixPaneFormSave() {
  const id = matrixPaperId.value;
  if (!id) return;

  await MatrixManager.updateMatrixEntry(
    id,
    mSample.value,
    mMethod.value,
    mIntervention.value,
    mEndpoints.value,
  );

  alert(`Matrix entry for PMID ${id} updated in Local Storage parameters.`);
  renderSpreadsheetGridData();
}

function renderSpreadsheetGridData() {
  const dataList = MatrixManager.getAllEntries();
  spreadsheetBody.innerHTML = "";

  if (dataList.length === 0) {
    spreadsheetBody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:#64748B;">No compiled matrix points exist. Extract from the main dashboard feed.</td></tr>`;
    return;
  }

  dataList.forEach((item) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
            <td><strong>${item.pmid}</strong></td>
            <td>${item.sampleSize || "N/A"}</td>
            <td>${item.methodology}</td>
            <td>${item.intervention}</td>
            <td>${item.endpoints}</td>
        `;
    spreadsheetBody.appendChild(tr);
  });
}

function processingCompositionUpdateDebounce() {
  const activeJournal = journalRuleSelect.value;
  const pooledText = [
    secIntro.value,
    secMethods.value,
    secResults.value,
    secConclusion.value,
  ].join(" ");

  const evaluation = AbstractCompiler.evaluateMetrics(
    pooledText,
    activeJournal,
  );

  wordCountDisplay.textContent = evaluation.wordCount;
  wordLimitDisplay.textContent = evaluation.limit;

  if (!evaluation.isSafeLength) {
    wordCountDisplay.classList.add("over-limit");
    chkLength.classList.remove("passed");
    chkLength.textContent = "❌ Length Exceeds Target Bounds";
  } else {
    wordCountDisplay.classList.remove("over-limit");
    chkLength.classList.add("passed");
    chkLength.textContent = "✔️ Safe Length Threshold Verified";
  }

  AbstractCompiler.backupDraftState(
    abstractTitle.value,
    secIntro.value,
    secMethods.value,
    secResults.value,
    secConclusion.value,
    activeJournal,
  );
}

async function loadAndHydrateAbstractWorkspace() {
  const backup = await AbstractCompiler.getSavedDraft();
  if (!backup) return;

  abstractTitle.value = backup.title || "";
  secIntro.value = backup.intro || "";
  secMethods.value = backup.methods || "";
  secResults.value = backup.results || "";
  secConclusion.value = backup.conclusion || "";
  journalRuleSelect.value = backup.activeJournal || "nature";

  processingCompositionUpdateDebounce();
}

function executeDocumentManuscriptCompilationDownload() {
  const cleanOutputString = `
===================================================================
MANUSCRIPT MANIFEST DRAFT GENERATED VIA CLINICAL RESEARCH HUB
===================================================================
TITLE: ${abstractTitle.value.toUpperCase()}
TARGET RULESET: ${journalRuleSelect.value.toUpperCase()}
-------------------------------------------------------------------
INTRODUCTION & BACKGROUND:
${secIntro.value}

METHODS:
${secMethods.value}

RESULTS:
${secResults.value}

CONCLUSION:
${secConclusion.value}
===================================================================
    `;

  triggerClientFileDownload(
    cleanOutputString,
    "manuscript_abstract_draft.txt",
    "text/plain",
  );
}

function triggerClientFileDownload(contentBuffer, filename, contentType) {
  const linkElement = document.createElement("a");
  const blobFileObj = new Blob([contentBuffer], { type: contentType });
  linkElement.href = URL.createObjectURL(blobFileObj);
  linkElement.download = filename;
  document.body.appendChild(linkElement);
  linkElement.click();
  document.body.removeChild(linkElement);
}
