import type { RuntimePack } from "@/practice/types";

// Compiled, owner-reviewed non-medical fallback. It keeps both modes usable if
// the separately cached pack is missing or rejected; it makes no medical claim.
export const FALLBACK_PACK: RuntimePack = {
  schemaVersion: "1.0",
  contentKind: "NON_MEDICAL_INTERACTION",
  packId: "compiled-interaction-fallback",
  version: "1.0.0",
  title: "Offline speaking fallback",
  locale: "en-IN",
  licence: {
    id: "CC-BY-4.0",
    attribution: "Utkarsh Meshram — original non-medical interaction fixture.",
  },
  review: {
    status: "APPROVED",
    reviewers: [{ id: "utkarsh-senpai", role: "CONTENT_EDITOR" }],
    reviewedAt: "2026-08-30",
  },
  sources: [
    {
      sourceId: "fallback-original",
      citation: "Original non-medical interaction fixture.",
      url: "https://github.com/utkarsh-senpai/MediPrompt",
      accessedAt: "2026-08-30",
    },
  ],
  subjects: [
    {
      subjectId: "fallback-practice",
      title: "Fallback practice",
      topics: [
        {
          topicId: "explain-familiar-process",
          title: "Explain a familiar process",
          variants: [
            {
              variantId: "explain-familiar-process-guided-rs-v1",
              challengePreset: "GUIDED",
              difficultyProfileVersion: "difficulty-profile/1.0",
              blueprint: "explain-concept",
              promptId: "prompt-explain-familiar-process-guided-rs",
              mode: "RECALL_SPRINT",
              supportLevel: "FULL",
              wording:
                "Choose a familiar everyday process and explain what it does, how it works, and why each step matters.",
              answerArc: ["identify", "sequence", "connect"],
              timePolicy: { speakingSeconds: 90 },
              caseRef: null,
              followUpRefs: [],
              rubricId: "explain-familiar-process-guided-rs-rubric-v1",
            },
            {
              variantId: "explain-familiar-process-guided-dr-v1",
              challengePreset: "GUIDED",
              difficultyProfileVersion: "difficulty-profile/1.0",
              blueprint: "explain-concept",
              promptId: "prompt-explain-familiar-process-guided-dr",
              mode: "DEEP_RESEARCH",
              supportLevel: "FULL",
              wording:
                "Research a familiar everyday process, then explain what it does, how it works, and why each step matters.",
              answerArc: ["identify", "sequence", "connect"],
              timePolicy: { speakingSeconds: 90, researchSeconds: 120 },
              caseRef: null,
              followUpRefs: [],
              rubricId: "explain-familiar-process-guided-dr-rubric-v1",
            },
          ],
          rubrics: [
            {
              rubricId: "explain-familiar-process-guided-rs-rubric-v1",
              variantId: "explain-familiar-process-guided-rs-v1",
              register: "EXAMINER",
              concepts: [
                {
                  conceptId: "familiar-process-rs-structure",
                  label: "States the purpose and explains the sequence",
                  acceptedPhrases: ["purpose", "sequence"],
                  weight: 1,
                  sourceRefs: ["fallback-original"],
                },
              ],
            },
            {
              rubricId: "explain-familiar-process-guided-dr-rubric-v1",
              variantId: "explain-familiar-process-guided-dr-v1",
              register: "EXAMINER",
              concepts: [
                {
                  conceptId: "familiar-process-dr-structure",
                  label: "States the purpose and explains the sequence",
                  acceptedPhrases: ["purpose", "sequence"],
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
