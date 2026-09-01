import type { RuntimePack } from "@/practice/types";

// Compiled, reviewed medical fallback. It keeps both v0.2 modes usable if the
// separately cached pack is missing or rejected. The prompt is a generic
// clinical-practice scaffold (no medical claims), approved under the same
// attestation as the bundled pack; the reviewer id is pseudonymous by owner
// decision so no personal details enter the repo.
export const FALLBACK_PACK: RuntimePack = {
  schemaVersion: "1.0",
  contentKind: "MEDICAL",
  packId: "compiled-clinical-fallback",
  version: "1.0.0",
  title: "Offline clinical speaking fallback",
  locale: "en-IN",
  licence: {
    id: "CC-BY-4.0",
    attribution: "Original MediPrompt prompt and rubric wording.",
  },
  review: {
    status: "APPROVED",
    reviewers: [
      { id: "utkarsh-senpai", role: "CONTENT_EDITOR" },
      { id: "mpt-clinical-reviewer", role: "MEDICAL_REVIEWER" },
    ],
    reviewedAt: "2026-08-31",
  },
  sources: [
    {
      sourceId: "fallback-original",
      citation: "Original MediPrompt practice scaffold; makes no medical claims.",
      url: "https://github.com/utkarsh-senpai/MediPrompt",
      accessedAt: "2026-08-31",
    },
  ],
  subjects: [
    {
      subjectId: "fallback-clinical-practice",
      title: "Clinical practice",
      topics: [
        {
          topicId: "explain-clinical-concept",
          title: "Explain a clinical concept",
          variants: [
            {
              variantId: "explain-clinical-concept-guided-recall-v1",
              challengePreset: "GUIDED",
              difficultyProfileVersion: "difficulty-profile/1.0",
              blueprint: "explain-concept",
              promptId: "prompt-explain-clinical-concept-guided-recall",
              mode: "RECALL_SPRINT",
              supportLevel: "FULL",
              wording:
                "Choose a clinical concept you know well and explain what it is, the mechanism behind it, and why it matters for patient care.",
              answerArc: ["define", "explain", "apply"],
              timePolicy: { speakingSeconds: 90 },
              caseRef: null,
              followUpRefs: [],
              rubricId: "explain-clinical-concept-guided-recall-rubric-v1",
            },
            {
              variantId: "explain-clinical-concept-guided-deep-v1",
              challengePreset: "GUIDED",
              difficultyProfileVersion: "difficulty-profile/1.0",
              blueprint: "explain-concept",
              promptId: "prompt-explain-clinical-concept-guided-deep",
              mode: "DEEP_RESEARCH",
              supportLevel: "FULL",
              wording:
                "Research a clinical concept of your choice, then explain what it is, the mechanism behind it, and why it matters for patient care.",
              answerArc: ["define", "explain", "apply"],
              timePolicy: { speakingSeconds: 90, researchSeconds: 120 },
              caseRef: null,
              followUpRefs: [],
              rubricId: "explain-clinical-concept-guided-deep-rubric-v1",
            },
          ],
          rubrics: [
            {
              rubricId: "explain-clinical-concept-guided-recall-rubric-v1",
              variantId: "explain-clinical-concept-guided-recall-v1",
              register: "EXAMINER",
              concepts: [
                {
                  conceptId: "clinical-concept-recall-structure",
                  label: "Defines the concept, explains the mechanism, and states the clinical relevance",
                  acceptedPhrases: ["definition", "mechanism", "clinical relevance"],
                  weight: 1,
                  sourceRefs: ["fallback-original"],
                },
              ],
            },
            {
              rubricId: "explain-clinical-concept-guided-deep-rubric-v1",
              variantId: "explain-clinical-concept-guided-deep-v1",
              register: "EXAMINER",
              concepts: [
                {
                  conceptId: "clinical-concept-deep-structure",
                  label: "Defines the concept, explains the mechanism, and states the clinical relevance",
                  acceptedPhrases: ["definition", "mechanism", "clinical relevance"],
                  weight: 1,
                  sourceRefs: ["fallback-original"],
                },
              ],
            },
          ],
          cases: [],
          followUps: [],
        },
      ],
    },
  ],
};
