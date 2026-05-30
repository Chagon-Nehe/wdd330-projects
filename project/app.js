let currentStudies = []; // Local cache store for active batch query

document.getElementById("searchBtn").addEventListener("click", fetchTrials);
document.getElementById("closeModalBtn").addEventListener("click", closeModal);

// Close modal if user clicks outside the modal window box
document.getElementById("detailModal").addEventListener("click", (e) => {
  if (e.target.classList.contains("modal-overlay")) closeModal();
});

async function fetchTrials() {
  const queryCondition = document.getElementById("conditionInput").value.trim();
  const grid = document.getElementById("trialsGrid");
  const status = document.getElementById("statusMessage");

  if (!queryCondition) return;

  grid.innerHTML = "";
  status.textContent = "Querying clinical registry records...";

  const url = `https://clinicaltrials.gov/api/v2/studies?query.cond=${encodeURIComponent(queryCondition)}&query.term=pediatric&filter.overallStatus=RECRUITING&pageSize=6`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Data processing error.");

    const data = await response.json();
    currentStudies = data.studies || [];

    if (currentStudies.length === 0) {
      status.textContent = "No active matching clinical trials located.";
      return;
    }

    status.textContent = "";

    currentStudies.forEach((study, index) => {
      const protocol = study.protocolSection;
      const nctId = protocol.identificationModule?.nctId || "NCT Unknown";
      const title =
        protocol.identificationModule?.briefTitle || "No Title Available";
      const currentStatus = protocol.statusModule?.overallStatus || "Unknown";

      const card = document.createElement("div");
      card.className = "trial-card";
      // Pass the index to easily capture item fields on click selection
      card.setAttribute("onclick", `openTrialDetails(${index})`);
      card.innerHTML = `
        <div>
          <div class="trial-id">${nctId}</div>
          <h3 class="trial-title">${title}</h3>
        </div>
        <div class="trial-meta">
          <span class="status-badge">${currentStatus.replace("_", " ")}</span>
        </div>
      `;
      grid.appendChild(card);
    });
  } catch (error) {
    console.error(error);
    status.textContent = "An error occurred while fetching study cohorts.";
  }
}

// Map parameters out of local memory stack and display them in the modal DOM layout
function openTrialDetails(index) {
  const study = currentStudies[index];
  if (!study) return;

  const protocol = study.protocolSection;
  const contentArea = document.getElementById("modalContent");

  // Extract variables safely using optional chaining rules
  const title =
    protocol.identificationModule?.officialTitle ||
    protocol.identificationModule?.briefTitle ||
    "N/A";
  const nctId = protocol.identificationModule?.nctId || "N/A";
  const description =
    protocol.descriptionModule?.briefSummary ||
    "No abstract overview provided.";
  const sponsor =
    protocol.sponsorCollaboratorsModule?.leadSponsor?.name || "N/A";
  const sampleSize = protocol.designModule?.enrollmentInfo?.count || "N/A";

  // Extract Dates and map duration
  const start = protocol.statusModule?.startDateStruct?.date || "N/A";
  const end = protocol.statusModule?.completionDateStruct?.date || "N/A";
  const durationText = `${start} to ${end}`;

  // Safely extract Principal Investigator (PI) from officials array or general contact block
  const piName =
    protocol.contactsLocationsModule?.overallOfficials?.[0]?.name ||
    protocol.contactsLocationsModule?.centralContacts?.[0]?.name ||
    "Contact Registry for Details";

  // Process unique site locations array count or list primary region
  const locations = protocol.contactsLocationsModule?.locations || [];
  const siteSummaryText =
    locations.length > 0
      ? `${locations.length} Active Operational Clinical Site(s)`
      : "Multi-center data or specific site configurations undisclosed.";

  // Build structure directly into window canvas
  contentArea.innerHTML = `
    <div class="trial-id" style="margin-bottom: 0.5rem;">${nctId}</div>
    <h2 class="primary-color" style="font-size: 1.4rem; line-height:1.3; margin-bottom: 1rem;">${title}</h2>
    
    <div class="detail-grid">
      <div class="detail-item">
        <h4>Lead Sponsor</h4>
        <p>${sponsor}</p>
      </div>
      <div class="detail-item">
        <h4>Target Enrollment</h4>
        <p>${sampleSize} participants</p>
      </div>
      <div class="detail-item">
        <h4>Principal Investigator</h4>
        <p>${piName}</p>
      </div>
      <div class="detail-item">
        <h4>Timeline/Duration</h4>
        <p>${durationText}</p>
      </div>
      <div class="detail-item" style="grid-column: span 2;">
        <h4>Facility Locations</h4>
        <p>${siteSummaryText}</p>
      </div>
    </div>

    <div class="detail-description">
      <h4>Brief Protocol Overview</h4>
      <p style="font-size:0.95rem; color:#4a5568; text-align:justify;">${description}</p>
    </div>
  `;

  // Trigger modal visibility transition rule
  document.getElementById("detailModal").classList.add("active");
}

function closeModal() {
  document.getElementById("detailModal").classList.remove("active");
}

// Initial fire on application load
fetchTrials();
