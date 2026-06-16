/**
 * Clinical Research Hub - Semantic Scholar Graph API Integration Module (ES Module)
 * Handles literature searches by passing authorized keys through your Node.js proxy layer.
 */
export const SemanticScholarService = {
  // 1. PLACE YOUR SEMANTIC SCHOLAR API KEY HERE
  // Paste your secret alphanumeric token string inside the quotes below
  API_KEY: "s2k-eQDV14QYimau1awF2nbFBrFXKykLT0WDYflruSvY",

  // 2. RUNNING PROXY BACKEND DOMAIN (Matches your cors-proxy.js architecture)
  PROXY_BASE_URL: "https://wdd330-projects-cors-proxy.onrender.com/",

  // Core Semantic Scholar academic graph gateway
  SEMANTIC_API_URL: "https://api.semanticscholar.org/graph/v1/paper/search",

  /**
   * Executes queries against the Semantic Scholar engine using authenticated headers
   * @param {string} queryTerm - The targeted disease or research topic string (e.g., "HIV")
   * @returns {Promise<Array>} Normalized data payload formatting into your UI data rows
   */
  async fetchPublications(queryTerm) {
    if (!queryTerm) return [];

    try {
      // 3. CONSTRUCT THE TARGET SEARCH URL PARAMETERS
      const targetApiUrl = new URL(this.SEMANTIC_API_URL);
      targetApiUrl.searchParams.append("query", queryTerm);
      targetApiUrl.searchParams.append("limit", "10");
      targetApiUrl.searchParams.append(
        "fields",
        "title,authors,abstract,journal,publicationDate",
      );

      // 4. MAP TARGET DIRECTLY BEHIND THE PROXY ENDPOINT
      // Yields: https://wdd330-projects-06mz.onrender.com/https://api.semanticscholar.org/...
      const routedProxyUrl = `${this.PROXY_BASE_URL}${targetApiUrl.toString()}`;

      // 5. DEFINE REQUEST OBJECT WITH SECURITY HEADERS ATTACHED
      const requestHeaders = {
        Accept: "application/json",
      };

      // Safely verify and inject key header if available to bypass the rate blocks
      if (
        this.API_KEY &&
        this.API_KEY !== "PASTE_YOUR_ACTUAL_SEMANTIC_SCHOLAR_API_KEY_HERE"
      ) {
        requestHeaders["x-api-key"] = this.API_KEY.trim();
      }

      // 6. DISPATCH NETWORK TRAFFIC STREAM
      const response = await fetch(routedProxyUrl, {
        method: "GET",
        headers: requestHeaders,
      });

      // Handle non-200 level execution failures
      if (!response.ok) {
        throw new Error(
          `Semantic Scholar request failed. Status: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();

      if (!data.data || !Array.isArray(data.data)) {
        return [];
      }

      // 7. FORMAT FIELD OBJECT MAPS TO ALIGN WITH MANUSCRIPT SCHEMAS (Matches PubMedService)
      return data.data.map((paper) => ({
        pmid: paper.paperId || `ss_${Math.random().toString(36).substr(2, 9)}`,
        title: paper.title || "Untitled Semantic Scholar Document",
        abstract:
          paper.abstract ||
          "Abstract metadata layers unavailable inside Semantic Scholar index cards.",
        pub_date: paper.publicationDate || "N/A",
        journal: {
          name: paper.journal?.name || "Open Access Source Journal",
        },
        authors: Array.isArray(paper.authors)
          ? paper.authors.map((author) => ({ name: author.name }))
          : [{ name: "Unknown Investigator" }],
      }));
    } catch (error) {
      console.error(
        "Critical Connection Issue within SemanticScholarService Module:",
        error.message,
      );
      // Fallback to empty array to keep other database panels (PubMed) alive in your dashboard view
      return [];
    }
  },
};
