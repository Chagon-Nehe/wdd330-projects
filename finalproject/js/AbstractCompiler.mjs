/**
 * Clinical Research Hub - Natural Language Literature Heuristics & Manuscript Compiler (ES Module)
 */
import { StorageEngine } from "./StorageEngine.mjs";

const ABSTRACT_STORAGE_KEY = "cr_hub_abstract_draft";

export const AbstractCompiler = {
  // Structural specifications mapped across major medical journal rulesets
  journalRulesets: {
    nature: {
      maxWords: 300,
      requireStructure: true,
      displayName: "Nature Medicine",
    },
    lancet: {
      maxWords: 250,
      requireStructure: true,
      displayName: "The Lancet",
    },
    nejm: {
      maxWords: 200,
      requireStructure: false,
      displayName: "NEJM (New England Journal of Medicine)",
    },
  },

  /**
   * Algorithmic heuristic routine scanning abstract text layers to extract clinical trial variables
   * @param {string} text - Combined publication title and abstract string
   * @returns {Object} Structured data parameters template matching expected app schemas
   */
  parseClinicalParametersFromAbstract(text) {
    const fallbackTemplate = {
      sampleSize: "",
      methodology: "Unspecified Study Design",
      intervention: "" || "Type it in from the abstract or add manually.",
      endpoints: "" || "Type it in from the abstract or add manually.",
    };

    if (!text || typeof text !== "string") return fallbackTemplate;

    // Flatten line breaks to facilitate continuous regex sequence matching
    const cleanText = text.replace(/\n/g, " ");
    let derivedSampleSize = "";

    // Multi-tier regular expression patterns analyzing sample sizes
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

    // Structural taxonomy loops grouping trial design types
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
      intervention: "" || "Type it in from the abstract or add manually.",
      endpoints: "" || "Type it in from the abstract or add manually.",
    };
  },

  /** * Saves user abstract composition drafts to browser memory using the unified StorageEngine
   */
  async backupDraftState(
    title,
    intro,
    methods,
    results,
    conclusion,
    activeJournal,
  ) {
    const draftPayload = {
      title: title || "",
      intro: intro || "",
      methods: methods || "",
      results: results || "",
      conclusion: conclusion || "",
      activeJournal: activeJournal || "nature",
      timestamp: Date.now(),
    };
    StorageEngine.set(ABSTRACT_STORAGE_KEY, draftPayload);
  },

  /**
   * Reads the active manuscript draft data array from persistent storage layers
   * @returns {Object|null} Cached structure containing section text arrays
   */
  async getSavedDraft() {
    return StorageEngine.get(ABSTRACT_STORAGE_KEY);
  },

  /** * Evaluates dynamic manuscript lengths against target editorial threshold parameters
   * @param {string} textString - Merged string representation of the active composition components
   * @param {string} targetJournal - Object property path reference matching journal rulesets
   * @returns {Object} Calculated length evaluations and enforcement status flags
   */
  evaluateMetrics(textString, targetJournal) {
    if (!textString || typeof textString !== "string") {
      return { wordCount: 0, limit: 300, isSafeLength: true };
    }

    // Clean out whitespace markers to establish a pure array representation of absolute words
    const cleanWordsArray = textString
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0);

    const currentCount = cleanWordsArray.length;
    const configuration =
      this.journalRulesets[targetJournal] || this.journalRulesets.nature;
    const targetLimit = configuration.maxWords;

    return {
      wordCount: currentCount,
      limit: targetLimit,
      isSafeLength: currentCount <= targetLimit,
      requiresStructure: configuration.requireStructure,
    };
  },
};
