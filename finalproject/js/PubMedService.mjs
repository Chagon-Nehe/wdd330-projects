/**
 * Production PubMed Biomedical Discovery Endpoint Integration Hub
 * Enhanced with CORS Proxying, Defensive Validation, and Structured XML Abstract Parsers
 */
export const PubMedService = {
  // 1. TRY SETTING THIS TO "" TO TEST IF YOUR KEY IS THE PROBLEM
  API_KEY: "bc724ddfe74bd662d6c4036dbb4401f38108",

  // CORS Anywhere proxy modifier to bypass browser origin blocks locally
  PROXY_URL: "https://wdd330-projects-cors-proxy.onrender.com/",

  /**
   * Executes live two-stage queries across biomedical records using structural XML parsers
   * @param {string} rawQuery Terms passed from input fields
   */
  async fetchPublications(rawQuery) {
    // 2. DEFENSIVE CHECK: Ensure we actually have a query string
    if (!rawQuery || rawQuery.trim() === "") {
      console.warn("PubMedService: Search query was empty. Aborting request.");
      return [];
    }

    try {
      const encodedQuery = encodeURIComponent(rawQuery);
      const authParam = this.API_KEY ? `&api_key=${this.API_KEY}` : "";

      // Step 1: Execute E-Search via Proxy to acquire matching PMIDs
      const searchUrl = `${this.PROXY_URL}https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodedQuery}&retmode=json&retmax=10${authParam}`;
      const searchResponse = await fetch(searchUrl);

      // 3. DETECT 400 BAD REQUESTS / PROXY FAILURES HERE
      if (!searchResponse.ok) {
        const errorText = await searchResponse.text();
        console.error(
          `PubMed E-Search Failed (${searchResponse.status}):`,
          errorText,
        );
        throw new Error(
          `PubMed E-Search responded with status ${searchResponse.status}`,
        );
      }

      const searchData = await searchResponse.json();
      const pmidList = searchData.esearchresult?.idlist;
      if (!pmidList || pmidList.length === 0) {
        return [];
      }

      // Process individual matching PMIDs concurrently through your rich XML/JSON extraction routine
      const compilationPromises = pmidList.map((pmid) =>
        this.fetchPubmedMetadata(pmid),
      );
      const enrichedPapers = await Promise.all(compilationPromises);

      // Filter out any missing entries or failed request iterations
      return enrichedPapers.filter((paper) => paper !== null);
    } catch (error) {
      console.error(
        "PubMed Live API Gateway Exception during search phase:",
        error,
      );
      throw error;
    }
  },

  /**
   * Merged Extraction Method: Combines JSON E-Summary variables and full XML E-Fetch payloads
   * @param {string|number} pmid Target unique key matching article records
   */
  async fetchPubmedMetadata(pmid) {
    const authParam = this.API_KEY ? `&api_key=${this.API_KEY}` : "";

    // Initialize your precise, structured object format
    const metadata = {
      pmid: String(pmid),
      pmcid: null,
      doi: null,
      title: null,
      journal: { name: null, iso: null },
      authors: [], // Array of objects containing structured {name, type} matching app.js loops
      pub_date: null,
      mesh_headings: [],
      abstract: null,
    };

    try {
      // Step 2a: Fetch Basic Bibliographic Data from ESummary via Proxy (JSON)
      const summaryUrl = `${this.PROXY_URL}https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${pmid}&retmode=json${authParam}`;
      const summaryResponse = await fetch(summaryUrl);

      // DETECT 400 BAD REQUESTS / PROXY FAILURES HERE TOO
      if (!summaryResponse.ok) {
        const errorText = await summaryResponse.text();
        console.error(
          `PubMed E-Summary Fetch Failed for PMID ${pmid} (${summaryResponse.status}):`,
          errorText,
        );
        return null; // Return null gracefully to let remaining concurrent papers succeed
      }

      const summaryData = await summaryResponse.json();

      if (summaryData.result && summaryData.result[pmid]) {
        const article = summaryData.result[pmid];

        metadata.title = article.title || "Untitled Paper";
        metadata.journal.name = article.source || "Unknown Journal";
        metadata.journal.iso = article.isoabbreviation || null;
        metadata.pub_date = article.pubdate || null;

        // Map Authors array accurately using nested sub-object parameters
        if (article.authors) {
          metadata.authors = article.authors.map((auth) => ({
            name: auth.name,
            type: auth.authtype || "author",
          }));
        } else {
          metadata.authors = [{ name: "Unknown Authors", type: "author" }];
        }

        // Extract DOI and PMCID elements from your specific articleids collection
        if (article.articleids) {
          article.articleids.forEach((idObj) => {
            if (idObj.idtype === "doi") metadata.doi = idObj.idvalue;
            if (idObj.idtype === "pmc") metadata.pmcid = idObj.idvalue;
          });
        }
      }

      // Step 2b: Fetch Long-form Abstracts & MeSH terms from EFetch via Proxy (XML API Route)
      const fetchUrl = `${this.PROXY_URL}https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${pmid}&retmode=xml${authParam}`;
      const fetchResponse = await fetch(fetchUrl);

      if (!fetchResponse.ok) {
        console.warn(
          `PubMed E-Fetch abstract block fallback triggered for PMID ${pmid}.`,
        );
        metadata.abstract =
          "Full abstract text block unavailable from server query parameters.";
        return metadata;
      }

      const xmlText = await fetchResponse.text();

      // Parse the live XML text payload into a navigable browser DOM structure
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, "text/xml");

      // Extract MeSH Headings elements using querySelectorAll descriptors
      const meshElements = xmlDoc.querySelectorAll(
        "MeshHeading DescriptorName",
      );
      metadata.mesh_headings = Array.from(meshElements).map(
        (el) => el.textContent,
      );

      // Extract and format Structured Abstract texts across labeled blocks (e.g. OBJECTIVE:, METHODS:)
      const abstractElements = xmlDoc.querySelectorAll("Abstract AbstractText");
      const abstractParts = Array.from(abstractElements).map((el) => {
        const label = el.getAttribute("Label");
        const text = el.textContent || "";
        return label ? `${label}: ${text}` : text;
      });

      // Reconstruct the structured parts into a clean multi-line block string
      metadata.abstract =
        abstractParts.length > 0
          ? abstractParts.join("\n")
          : "No abstract provided.";

      return metadata;
    } catch (error) {
      console.error(
        `PubMed Live API Gateway Exception processing PMID ${pmid}:`,
        error,
      );
      return null;
    }
  },
};
