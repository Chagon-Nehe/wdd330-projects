/**
 * Production Cross-Referenced Citation Integration & Payload Adapter Layer
 */
export const SemanticScholarService = {
  // PASTE YOUR SEMANTIC SCHOLAR API KEY HERE
  API_KEY: "s2k-eQDV14QYimau1awF2nbFBrFXKykLT0WDYflruSvY",

  /**
   * Fetches live open-access source links and citation values using your API key
   * @param {string} title Target cross-reference key
   */
  async enrichCitationMetrics(title) {
    try {
      const url = `https://api.semanticscholar.org/graph/v1/paper/${title}?fields=citationCount,isOpenAccess,openAccessPdf`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "x-api-key": this.API_KEY,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Semantic Scholar API Error: ${response.status}`);
      }

      const data = await response.json();

      // Standardize into clean UI-compatible properties with strict safe defaults
      return {
        citationCount: data.citationCount || 0,
        isOpenAccess: data.isOpenAccess || false,
        openAccessLink: data.openAccessPdf?.url || null,
      };
    } catch (error) {
      if (error.status !== 400) {
        console.warn(
          `Semantic Scholar resolution variance on title ${title}:`,
          error,
        );
        // Dynamic fallback path ensures missing elements do not crash the user interface
        return {
          citationCount: 0,
          isOpenAccess: false,
          openAccessLink: null,
        };
      }
    }
  },
};
