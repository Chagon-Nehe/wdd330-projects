import { StorageEngine } from "./StorageEngine.mjs";

const ABSTRACT_STORAGE_KEY = "cr_hub_abstract_draft";

export const AbstractCompiler = {
  // Structural requirements map across major global health journal rulesets
  journalRulesets: {
    nature: { maxWords: 300, requireStructure: true },
    lancet: { maxWords: 250, requireStructure: true },
    nejm: { maxWords: 200, requireStructure: false },
  },

  /** Save abstract drafts in real time to prevent loss from browser refreshes */
  async backupDraftState(
    title,
    intro,
    methods,
    results,
    conclusion,
    activeJournal,
  ) {
    const draftPayload = {
      title,
      intro,
      methods,
      results,
      conclusion,
      activeJournal,
    };
    await StorageEngine.set(ABSTRACT_STORAGE_KEY, draftPayload);
  },

  async getSavedDraft() {
    return await StorageEngine.get(ABSTRACT_STORAGE_KEY);
  },

  /** Evaluate length targets and count metrics within string arrays */
  evaluateMetrics(textString, targetJournal) {
    const cleanArr = textString
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0);
    const currentCount = cleanArr.length;
    const targetLimit = this.journalRulesets[targetJournal]?.maxWords || 300;

    return {
      wordCount: currentCount,
      limit: targetLimit,
      isSafeLength: currentCount <= targetLimit,
    };
  },
};
