// Generates the v0.2 demo interaction fixture (non-medical, owner-approved).
// Run: pnpm --filter @mediprompt/learner-web tsx scripts/generate-demo-pack.ts
//
// Per docs/V0.2_DEVELOPMENT_CONTEXT.md §8: while medical educator review is pending,
// the runnable pack is a NON-MEDICAL interaction fixture that the owner can genuinely
// approve (CONTENT_EDITOR, no medical claims). Medical content replaces this before
// public release. This generator is a build tool; the emitted JSON is the artifact.

import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

interface TopicSeed {
  topicId: string;
  title: string;
  focus: string;
  concepts: [string, string];
  trio?: boolean;
  deepResearch?: boolean;
  caseText?: string;
  evidenceConstraint?: string;
}

interface SubjectSeed {
  subjectId: string;
  title: string;
  topics: TopicSeed[];
}

const subjects: SubjectSeed[] = [
  {
    subjectId: "everyday-explanations",
    title: "Everyday Explanations",
    topics: [
      { topicId: "how-a-zipper-works", title: "How a zipper works", focus: "how a zipper interlocks its teeth to close and open", concepts: ["Names the interlocking mechanism", "Explains the slider role"] },
      { topicId: "how-an-umbrella-folds", title: "How an umbrella folds", focus: "how an umbrella collapses along its ribs", concepts: ["Names the rib and canopy parts", "Explains the folding sequence"] },
      { topicId: "why-bread-rises", title: "Why bread dough rises", focus: "why bread dough rises as it rests", concepts: ["Names yeast as the agent", "Explains gas trapped in gluten"] },
      { topicId: "how-a-bicycle-stays-up", title: "How a bicycle stays upright", focus: "how a moving bicycle stays upright", concepts: ["Mentions forward motion and balance", "Explains steering corrections"] },
      { topicId: "why-ice-melts", title: "Why ice melts at room temperature", focus: "why ice melts at room temperature", concepts: ["Names heat transfer", "Explains the phase change"] },
      { topicId: "how-a-lock-works", title: "How a pin tumbler lock works", focus: "how a pin tumbler lock opens with a key", concepts: ["Names pins and shear line", "Explains the key aligning pins"] },
      { topicId: "why-leaves-fall", title: "Why leaves fall in autumn", focus: "why leaves fall in autumn", concepts: ["Names the abscission layer", "Explains reduced daylight role"] },
      { topicId: "how-a-pencil-works", title: "How a pencil marks paper", focus: "how a pencil leaves a mark on paper", concepts: ["Names graphite as the marking material", "Explains friction transferring graphite"] },
    ],
  },
  {
    subjectId: "science-and-nature",
    title: "Science and Nature",
    topics: [
      { topicId: "water-cycle", title: "The water cycle", focus: "the water cycle and its main stages", concepts: ["Names evaporation and condensation", "Links precipitation to the cycle"] },
      { topicId: "photosynthesis", title: "Photosynthesis", focus: "photosynthesis and why it matters", concepts: ["Names sunlight, water, and carbon dioxide", "Explains glucose and oxygen output"] },
      { topicId: "seasons", title: "Why seasons change", focus: "why seasons change through the year", concepts: ["Names Earth's axial tilt", "Explains sunlight angle variation"] },
      { topicId: "tides", title: "Why tides occur", focus: "why tides occur along coasts", concepts: ["Names the moon's gravity", "Explains the daily cycle"] },
      { topicId: "rainbow-formation", title: "How a rainbow forms", focus: "how a rainbow forms after rain", concepts: ["Names sunlight and water droplets", "Explains refraction and dispersion"] },
      { topicId: "sound-travel", title: "How sound travels", focus: "how sound travels through air", concepts: ["Names vibrations as the source", "Explains pressure waves"] },
      { topicId: "gravity-basics", title: "Gravity basics", focus: "gravity and its everyday effects", concepts: ["Names mass as the cause", "Explains falling and orbiting"] },
    ],
  },
  {
    subjectId: "reasoning-and-tradeoffs",
    title: "Reasoning and Trade-offs",
    topics: [
      {
        topicId: "paper-vs-digital",
        title: "Paper versus digital notes",
        focus: "the trade-off between paper and digital notes",
        concepts: ["Compares retention and recall", "Weighs searchability against distraction"],
        trio: true,
        caseText:
          "A student has four weeks before an oral exam. Handwritten notes aid recall, while searchable digital notes make revision on a daily commute easier; phone notifications are distracting.",
        evidenceConstraint:
          "The commute is no longer available for study, but the learner must find cited facts quickly.",
      },
      {
        topicId: "urban-vs-rural",
        title: "Urban versus rural living",
        focus: "the trade-off between urban and rural living",
        concepts: ["Compares opportunity and cost", "Weighs community against access"],
        trio: true,
        caseText:
          "A graduate is comparing an urban role with close specialist supervision and high rent against a rural role with broad responsibility, lower costs, and limited transport.",
        evidenceConstraint:
          "The rural role adds weekly remote supervision, while the urban rent rises substantially.",
      },
      {
        topicId: "specialist-vs-generalist",
        title: "Specialist versus generalist learning",
        focus: "the trade-off between specialist and generalist learning",
        concepts: ["Compares depth and adaptability", "Weighs expertise against flexibility"],
        trio: true,
        caseText:
          "A learner has one week before a broad viva and must choose between mastering one difficult area deeply or rotating through all major areas with less depth.",
        evidenceConstraint:
          "A practice result shows safe breadth but repeated weak reasoning in the difficult area.",
      },
      { topicId: "speed-vs-quality", title: "Speed versus quality", focus: "the trade-off between speed and quality of work", concepts: ["Compares throughput and error risk", "Weighs deadlines against rework"], deepResearch: true },
      { topicId: "short-term-vs-long-term", title: "Short-term versus long-term goals", focus: "the trade-off between short-term and long-term goals", concepts: ["Compares immediate payoff and delayed reward", "Weighs motivation against patience"], deepResearch: true },
    ],
  },
];

const SPEAKING_GUIDED = 90;
const SPEAKING_APPLIED = 120;
const SPEAKING_VIVA = 150;
const RESEARCH = 120;

function guidedVariant(t: TopicSeed, mode: "RECALL_SPRINT" | "DEEP_RESEARCH"): object {
  const suffix = mode === "RECALL_SPRINT" ? "rs" : "dr";
  const wording =
    mode === "RECALL_SPRINT"
      ? `Explain ${t.focus}. Organize your answer as definition, key components, and why it matters.`
      : `Research ${t.focus}, then explain it aloud. Organize your answer as definition, key components, and why it matters.`;
  const timePolicy =
    mode === "RECALL_SPRINT"
      ? { speakingSeconds: SPEAKING_GUIDED }
      : { speakingSeconds: SPEAKING_GUIDED, researchSeconds: RESEARCH };
  return {
    variantId: `${t.topicId}-guided-${suffix}-v1`,
    challengePreset: "GUIDED",
    difficultyProfileVersion: "difficulty-profile/1.0",
    blueprint: "explain-concept",
    promptId: `prompt-${t.topicId}-guided-${suffix}`,
    mode,
    supportLevel: "FULL",
    wording,
    answerArc: ["define", "explain", "apply"],
    timePolicy,
    caseRef: null,
    followUpRefs: [],
    rubricId: `${t.topicId}-guided-${suffix}-rubric-v1`,
  };
}

function appliedVariant(t: TopicSeed): object {
  return {
    variantId: `${t.topicId}-applied-rs-v1`,
    challengePreset: "APPLIED",
    difficultyProfileVersion: "difficulty-profile/1.0",
    blueprint: "manage-case",
    promptId: `prompt-${t.topicId}-applied-rs`,
    mode: "RECALL_SPRINT",
    supportLevel: "FULL",
    wording: `Use the fictional scenario below. Summarize it, reason about the main trade-off in ${t.focus}, and propose a justified plan.`,
    answerArc: ["summarize", "reason", "plan"],
    timePolicy: { preparationSeconds: 45, speakingSeconds: SPEAKING_APPLIED },
    caseRef: `${t.topicId}-case-v1`,
    followUpRefs: [`${t.topicId}-probe-v1`],
    rubricId: `${t.topicId}-applied-rs-rubric-v1`,
  };
}

function vivaVariant(t: TopicSeed): object {
  return {
    variantId: `${t.topicId}-viva-rs-v1`,
    challengePreset: "VIVA",
    difficultyProfileVersion: "difficulty-profile/1.0",
    blueprint: "compare-differentiate",
    promptId: `prompt-${t.topicId}-viva-rs`,
    mode: "RECALL_SPRINT",
    supportLevel: "FULL",
    wording: `Use the fictional scenario below. New constraint: ${t.evidenceConstraint ?? "one important assumption changes"} Prioritize the competing options, defend your choice, and state what would change your mind.`,
    answerArc: ["prioritize", "defend", "safety-net"],
    timePolicy: { preparationSeconds: 45, speakingSeconds: SPEAKING_VIVA },
    caseRef: `${t.topicId}-case-v1`,
    followUpRefs: [`${t.topicId}-probe-v1`, `${t.topicId}-evidence-v1`],
    rubricId: `${t.topicId}-viva-rs-rubric-v1`,
  };
}

function rubric(t: TopicSeed, variantSuffix: string): object {
  return {
    rubricId: `${t.topicId}-${variantSuffix}-rubric-v1`,
    variantId: `${t.topicId}-${variantSuffix}-v1`,
    register: "EXAMINER",
    concepts: t.concepts.map((label, i) => ({
      conceptId: `${t.topicId}-${variantSuffix}-c${i + 1}`,
      label,
      acceptedPhrases: [label.toLowerCase()],
      weight: 2,
      sourceRefs: ["src-general"],
    })),
  };
}

function buildTopic(t: TopicSeed): object {
  const variants: object[] = [];
  const rubrics: object[] = [];

  variants.push(guidedVariant(t, "RECALL_SPRINT"));
  rubrics.push(rubric(t, "guided-rs"));

  if (t.deepResearch) {
    variants.push(guidedVariant(t, "DEEP_RESEARCH"));
    rubrics.push(rubric(t, "guided-dr"));
  }

  if (t.trio) {
    variants.push(appliedVariant(t));
    variants.push(vivaVariant(t));
    variants.push(guidedVariant(t, "DEEP_RESEARCH"));
    rubrics.push(rubric(t, "applied-rs"));
    rubrics.push(rubric(t, "viva-rs"));
    rubrics.push(rubric(t, "guided-dr"));
  }

  const cases = t.trio
    ? [
        {
          caseId: `${t.topicId}-case-v1`,
          text:
            t.caseText ??
            `A learner is deciding how to approach ${t.focus}; there is no single obviously correct answer.`,
        },
      ]
    : [];

  const followUps = t.trio
    ? [
        {
          followUpId: `${t.topicId}-probe-v1`,
          text: `What additional information would most change your assessment of ${t.focus}?`,
          kind: "PROBE",
        },
        {
          followUpId: `${t.topicId}-evidence-v1`,
          text: `${t.evidenceConstraint ?? `New information changes one assumption about ${t.focus}.`} Does your prioritization change, and why?`,
          kind: "EVIDENCE_UPDATE",
        },
      ]
    : [];

  return { topicId: t.topicId, title: t.title, variants, rubrics, cases, followUps };
}

const pack = {
  schemaVersion: "1.0",
  contentKind: "NON_MEDICAL_INTERACTION",
  packId: "demo-interaction-fixture",
  version: "1.0.0",
  title: "Speaking Practice Demo (non-medical interaction fixture)",
  locale: "en-IN",
  licence: {
    id: "CC-BY-4.0",
    attribution:
      "Utkarsh Meshram — non-medical interaction fixture. Medical content is pending educator review and is not included in v0.2.",
  },
  review: {
    status: "APPROVED",
    reviewers: [
      {
        id: "utkarsh-senpai",
        role: "CONTENT_EDITOR",
      },
    ],
    reviewedAt: "2026-08-30",
  },
  sources: [
    {
      sourceId: "src-general",
      citation: "General-knowledge concepts (public domain); no medical claims.",
      url: "https://en.wikipedia.org/wiki/Main_Page",
      accessedAt: "2026-08-30",
    },
  ],
  subjects: subjects.map((s) => ({
    subjectId: s.subjectId,
    title: s.title,
    topics: s.topics.map(buildTopic),
  })),
};

const out = resolve(__dirname, "../../../content/packs/demo-interaction-fixture.json");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(pack, null, 2) + "\n", "utf8");

const topicCount = subjects.reduce((n, s) => n + s.topics.length, 0);
const trioCount = subjects.reduce(
  (n, s) => n + s.topics.filter((t) => t.trio).length,
  0,
);
console.log(`wrote ${out}`);
console.log(`topics: ${topicCount}, trios: ${trioCount}`);
