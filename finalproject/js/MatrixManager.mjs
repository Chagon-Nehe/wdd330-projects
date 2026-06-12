import { StorageEngine } from "./StorageEngine.mjs";

const MATRIX_STORAGE_KEY = "cr_hub_matrix_data";

export const MatrixManager = {
  // In-memory application tracking cache
  activeMatrixMemory: {},

  /** Load operational memory blocks from localized file persistence layers */
  async initializeMatrixState() {
    const cached = await StorageEngine.get(MATRIX_STORAGE_KEY);
    if (cached) {
      this.activeMatrixMemory = cached;
    }
  },

  /** Extract data fields safely from text fields and save into global matrices */
  async updateMatrixEntry(
    pmid,
    sampleSize,
    methodology,
    intervention,
    endpoints,
  ) {
    // Mitigate disruptive external string formatting variances using standard default fallbacks
    this.activeMatrixMemory[pmid] = {
      pmid,
      sampleSize: parseInt(sampleSize) || 0,
      methodology: methodology.trim() || "Unspecified",
      intervention: intervention.trim() || "Not Documented",
      endpoints: endpoints.trim() || "N/A",
    };

    await StorageEngine.set(MATRIX_STORAGE_KEY, this.activeMatrixMemory);
  },

  /** Fetch operational data rows targeting individual paper IDs */
  getEntry(pmid) {
    return this.activeMatrixMemory[pmid] || null;
  },

  getAllEntries() {
    return Object.values(this.activeMatrixMemory);
  },

  /**
   * Transform in-memory structured JSON records straight into a downloadable CSV string asset
   */
  generateCSVBlobString() {
    const entries = this.getAllEntries();
    if (entries.length === 0)
      return "PMID,SampleSize,Methodology,Intervention,PrimaryEndpoints\n";

    const csvHeaders = [
      "PMID",
      "Sample Size",
      "Methodology",
      "Intervention",
      "Primary Endpoints",
    ];
    const csvRows = entries.map((e) =>
      [
        `"${e.pmid}"`,
        `"${e.sampleSize}"`,
        `"${e.methodology.replace(/"/g, '""')}"`,
        `"${e.intervention.replace(/"/g, '""')}"`,
        `"${e.endpoints.replace(/"/g, '""')}"`,
      ].join(","),
    );

    return [csvHeaders.join(","), ...csvRows].join("\n");
  },
};
