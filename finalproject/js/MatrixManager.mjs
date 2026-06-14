/**
 * Clinical Research Hub - Data Matrix Spreadsheet Manager (ES Module)
 */
export const MatrixManager = {
  /**
   * Commits a validated data extraction record row directly into the state mapping cache
   * @param {Map} cacheMap - The central StateManager.matrixCache map reference
   * @param {string} pmid - Unique publication tracking ID
   * @param {Object} dataRow - Collected data matrix variables
   */
  saveRowToCache(cacheMap, pmid, dataRow) {
    if (!pmid) return;

    // Ensure structure alignment before saving
    cacheMap.set(pmid, {
      pmid: String(pmid),
      sampleSize: dataRow.sampleSize || "N/A",
      methodology: dataRow.methodology || "Unspecified Study",
      intervention: dataRow.intervention || "Not Specified",
      endpoints: dataRow.endpoints || "No endpoints logged.",
    });
  },

  /**
   * Wipes and rebuilds the spreadsheet table UI grid inside the Abstract Workspace tab
   * @param {HTMLElement} targetTableBody - The DOM node reference for the <tbody> container
   * @param {Map} cacheMap - The central StateManager.matrixCache map reference
   */
  rebuildSpreadsheetGridUI(targetTableBody, cacheMap) {
    if (!targetTableBody) return;

    // Clear existing rows
    targetTableBody.innerHTML = "";

    // Render Empty State if no matrices have been saved yet
    if (!cacheMap || cacheMap.size === 0) {
      targetTableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align:center; color:#64748B; padding: 2rem; font-style: italic;">
                        No records compiled in your matrix spreadsheet yet. Select an article card to begin extraction.
                    </td>
                </tr>`;
      return;
    }

    // Dynamically build and inject table grid row fragments
    cacheMap.forEach((row) => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
                <td><strong>${row.pmid}</strong></td>
                <td><span class="badge-sample-size">${row.sampleSize}</span></td>
                <td><small>${row.methodology}</small></td>
                <td>${row.intervention}</td>
                <td style="max-width:250px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${row.endpoints}">
                    ${row.endpoints}
                </td>
            `;

      targetTableBody.appendChild(tr);
    });
  },
};
