// Generates the public non-medical interaction fixture.
// Genuine medical curriculum content stays in the explicit local beta lane
// until its exact prompts and rubrics receive educator attestation.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
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
        caseText: "A student has four weeks before an oral exam. Handwritten notes aid recall, while searchable digital notes make revision on a daily commute easier; phone notifications are distracting.",
        evidenceConstraint: "The commute is no longer available for study, but the learner must find cited facts quickly.",
      },
      {
        topicId: "urban-vs-rural",
        title: "Urban versus rural living",
        focus: "the trade-off between urban and rural living",
        concepts: ["Compares opportunity and cost", "Weighs community against access"],
        trio: true,
        caseText: "A graduate is comparing an urban role with close specialist supervision and high rent against a rural role with broad responsibility, lower costs, and limited transport.",
        evidenceConstraint: "The rural role adds weekly remote supervision, while the urban rent rises substantially.",
      },
      {
        topicId: "specialist-vs-generalist",
        title: "Specialist versus generalist learning",
        focus: "the trade-off between specialist and generalist learning",
        concepts: ["Compares depth and adaptability", "Weighs expertise against flexibility"],
        trio: true,
        caseText: "A learner has one week before a broad viva and must choose between mastering one difficult area deeply or rotating through all major areas with less depth.",
        evidenceConstraint: "A practice result shows safe breadth but repeated weak reasoning in the difficult area.",
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

function guidedVariant(topic: TopicSeed, mode: "RECALL_SPRINT" | "DEEP_RESEARCH"): object {
  const suffix = mode === "RECALL_SPRINT" ? "rs" : "dr";
  const wording = mode === "RECALL_SPRINT"
    ? `Explain ${topic.focus}. Organize your answer as definition, key components, and why it matters.`
    : `Research ${topic.focus}, then explain it aloud. Organize your answer as definition, key components, and why it matters.`;
  return {
    variantId: `${topic.topicId}-guided-${suffix}-v1`,
    challengePreset: "GUIDED",
    difficultyProfileVersion: "difficulty-profile/1.0",
    blueprint: "explain-concept",
    promptId: `prompt-${topic.topicId}-guided-${suffix}`,
    mode,
    supportLevel: "FULL",
    wording,
    answerArc: ["define", "explain", "apply"],
    timePolicy: mode === "RECALL_SPRINT"
      ? { speakingSeconds: SPEAKING_GUIDED }
      : { speakingSeconds: SPEAKING_GUIDED, researchSeconds: RESEARCH },
    caseRef: null,
    followUpRefs: [],
    rubricId: `${topic.topicId}-guided-${suffix}-rubric-v1`,
  };
}

function appliedVariant(topic: TopicSeed): object {
  return {
    variantId: `${topic.topicId}-applied-rs-v1`,
    challengePreset: "APPLIED",
    difficultyProfileVersion: "difficulty-profile/1.0",
    blueprint: "manage-case",
    promptId: `prompt-${topic.topicId}-applied-rs`,
    mode: "RECALL_SPRINT",
    supportLevel: "FULL",
    wording: `Use the fictional scenario. Summarize it, reason about the main trade-off in ${topic.focus}, and propose a justified plan.`,
    answerArc: ["summarize", "reason", "plan"],
    timePolicy: { preparationSeconds: 45, speakingSeconds: SPEAKING_APPLIED },
    caseRef: `${topic.topicId}-case-v1`,
    followUpRefs: [`${topic.topicId}-probe-v1`],
    rubricId: `${topic.topicId}-applied-rs-rubric-v1`,
  };
}

function vivaVariant(topic: TopicSeed): object {
  return {
    variantId: `${topic.topicId}-viva-rs-v1`,
    challengePreset: "VIVA",
    difficultyProfileVersion: "difficulty-profile/1.0",
    blueprint: "compare-differentiate",
    promptId: `prompt-${topic.topicId}-viva-rs`,
    mode: "RECALL_SPRINT",
    supportLevel: "FULL",
    wording: `Use the fictional scenario. New constraint: ${topic.evidenceConstraint ?? "one important assumption changes"} Prioritize the options, defend your choice, and state what would change your mind.`,
    answerArc: ["prioritize", "defend", "safety-net"],
    timePolicy: { preparationSeconds: 45, speakingSeconds: SPEAKING_VIVA },
    caseRef: `${topic.topicId}-case-v1`,
    followUpRefs: [`${topic.topicId}-probe-v1`, `${topic.topicId}-evidence-v1`],
    rubricId: `${topic.topicId}-viva-rs-rubric-v1`,
  };
}

function rubric(topic: TopicSeed, variantSuffix: string): object {
  return {
    rubricId: `${topic.topicId}-${variantSuffix}-rubric-v1`,
    variantId: `${topic.topicId}-${variantSuffix}-v1`,
    register: "EXAMINER",
    concepts: topic.concepts.map((label, index) => ({
      conceptId: `${topic.topicId}-${variantSuffix}-c${index + 1}`,
      label,
      acceptedPhrases: [label.toLowerCase()],
      weight: 2,
      sourceRefs: ["src-general"],
    })),
  };
}

function buildTopic(topic: TopicSeed): object {
  const variants: object[] = [guidedVariant(topic, "RECALL_SPRINT")];
  const rubrics: object[] = [rubric(topic, "guided-rs")];
  if (topic.deepResearch || topic.trio) {
    variants.push(guidedVariant(topic, "DEEP_RESEARCH"));
    rubrics.push(rubric(topic, "guided-dr"));
  }
  if (topic.trio) {
    variants.push(appliedVariant(topic), vivaVariant(topic));
    rubrics.push(rubric(topic, "applied-rs"), rubric(topic, "viva-rs"));
  }
  return {
    topicId: topic.topicId,
    title: topic.title,
    variants,
    rubrics,
    cases: topic.trio ? [{ caseId: `${topic.topicId}-case-v1`, text: topic.caseText }] : [],
    followUps: topic.trio ? [
      { followUpId: `${topic.topicId}-probe-v1`, text: `What information would most change your assessment of ${topic.focus}?`, kind: "PROBE" },
      { followUpId: `${topic.topicId}-evidence-v1`, text: `${topic.evidenceConstraint} Does your prioritization change, and why?`, kind: "EVIDENCE_UPDATE" },
    ] : [],
  };
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
    attribution: "Utkarsh Meshram — original non-medical interaction fixture.",
  },
  review: {
    status: "APPROVED",
    reviewers: [{ id: "utkarsh-senpai", role: "CONTENT_EDITOR" }],
    reviewedAt: "2026-08-30",
  },
  sources: [{
    sourceId: "src-general",
    citation: "General-knowledge concepts used only to exercise the speaking interaction; no medical claims.",
    url: "https://en.wikipedia.org/wiki/Main_Page",
    accessedAt: "2026-08-30",
  }],
  subjects: subjects.map((subject) => ({
    subjectId: subject.subjectId,
    title: subject.title,
    topics: subject.topics.map(buildTopic),
  })),
};

const out = resolve(__dirname, "../../../content/packs/demo-interaction-fixture.json");
mkdirSync(dirname(out), { recursive: true });
const serialized = JSON.stringify(pack, null, 2) + "\n";
if (process.argv.includes("--check")) {
  if (readFileSync(out, "utf8") !== serialized) {
    throw new Error("demo pack is stale; run pnpm pack:demo:generate");
  }
} else {
  writeFileSync(out, serialized, "utf8");
}
console.log(
  `${process.argv.includes("--check") ? "verified" : "wrote"} ${out} (${subjects.reduce((sum, subject) => sum + subject.topics.length, 0)} topics)`,
);
