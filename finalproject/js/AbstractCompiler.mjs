/**
 * Clinical Research Hub - Natural Language Literature Heuristics Compiler (ES Module)
 */
export const AbstractCompiler = {
  /**
   * Algorithmic routine scanning text layers to parse trial variables and methodologies
   * @param {string} text - Combined publication title and abstract string
   * @returns {Object} Structured data parameters template
   */
  parseClinicalParametersFromAbstract(text) {
    // Fallback structural initialization for blank or invalid records
    const fallbackTemplate = {
      sampleSize: "",
      methodology: "Unspecified Study Design",
      intervention: "Review full abstract parameters.",
      endpoints:
        "Review structured sections inside reading modal popup windows.",
    };

    if (!text || typeof text !== "string") return fallbackTemplate;

    // Sanitize string to flatten line breaks for unhindered regex lookaheads
    const cleanText = text.replace(/\n/g, " ");
    let derivedSampleSize = "";

    // Multi-tier regular expression heuristics checking sample patterns
    const sampleSizeRegexes = [
      /(?:n\s*=\s*|sample size of\s*|enrolled\s*|cohort of\s*|total of\s*)(\d{1,6})\b/i,
      /(\d{1,6})\s*(?:participants|patients|subjects|healthy volunteers|cases|individuals)/i,
    ];

    for (let regex of sampleSizeRegexes) {
      const match = cleanText.match(regex);
      if (match && match[1]) {
        derivedSampleSize = parseInt(match[1], 10);
        break;
      }
    }

    // Taxonomy analysis loop sorting study designs
    let derivedMethodology = "Clinical Study (Unspecified)";
    const lowerText = cleanText.toLowerCase();

    if (
      lowerText.includes("randomized controlled trial") ||
      lowerText.includes("randomised controlled trial")
    ) {
      derivedMethodology = "Randomized Controlled Trial (RCT)";
    } else if (
      lowerText.includes("meta-analysis") ||
      lowerText.includes("systematic review")
    ) {
      derivedMethodology = "Systematic Review & Meta-Analysis";
    } else if (lowerText.includes("case-control study")) {
      derivedMethodology = "Case-Control Observational Study";
    } else if (lowerText.includes("cross-sectional study")) {
      derivedMethodology = "Cross-Sectional Observational Study";
    } else if (
      lowerText.includes("cohort study") ||
      lowerText.includes("retrospective cohort")
    ) {
      derivedMethodology = "Cohort Observational Study";
    } else if (lowerText.includes("longitudinal study")) {
      derivedMethodology = "Longitudinal Study Framework";
    }

    return {
      sampleSize: derivedSampleSize,
      methodology: derivedMethodology,
      intervention: "" ||"type in...",
      endpoints: " " || "type in...",
    };
  },
};
