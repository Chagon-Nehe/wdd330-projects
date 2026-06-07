/**
 * Production PubMed Biomedical Discovery Endpoint Integration Hub
 */
export const PubMedService = {
  // PASTE YOUR PUBMED API KEY HERE (Optional, but increases rate limits)
  API_KEY: "Ybc724ddfe74bd662d6c4036dbb4401f38108",

  /**
   * Executes live two-stage E-utilities pipeline searches across biomedical records
   * @param {string} rawQuery Terms passed from input fields
   */
  async fetchPublications(rawQuery) {
    try {
      const encodedQuery = encodeURIComponent(rawQuery);
      const authParam = this.API_KEY ? `&api_key=${this.API_KEY}` : "";

      // Step 1: Execute E-Search to acquire a list of matching PMIDs
      const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodedQuery}&retmode=json&retmax=10${authParam}`;
      const searchResponse = await fetch(searchUrl);
      const searchData = await searchResponse.json();

      const pmidList = searchData.esearchresult?.idlist;
      if (!pmidList || pmidList.length === 0) {
        return [];
      }

      // Step 2: Pass PMIDs to E-Summary to retrieve explicit publication metadata
      const idsParam = pmidList.join(",");
      const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${idsParam}&retmode=json${authParam}`;
      const summaryResponse = await fetch(summaryUrl);
      const summaryData = await summaryResponse.json();

      // Step 3: Standardize the distinct JSON schema into your internal model
      const results = [];
      for (const pmid of pmidList) {
        const uidData = summaryData.result?.[pmid];
        if (uidData) {
          results.push({
            pmid: pmid,
            title: uidData.title || "Untitled Paper",
            authors:
              uidData.authors?.map((a) => a.name).join(", ") ||
              "Unknown Authors",
            journal: uidData.source || "Unknown Journal",
            year: uidData.pubdate
              ? parseInt(uidData.pubdate.split(" ")[0])
              : 2026,
            isOpenAccess: uidData.attributes?.includes("Has Abstract") || false, // Proxy fallback
            abstract: uidData.sorttitle || "No abstract snippet parsed.", // Fallback text string
          });
        }
      }
      return results;
    } catch (error) {
      console.error("PubMed Live API Gateway Exception:", error);
      throw error;
    }
  },
};
