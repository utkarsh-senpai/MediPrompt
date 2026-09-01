import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertPublicDraftPracticePack,
  validatePack,
} from "../src/content/packValidator";
import type { Concept, RuntimePack, Source } from "../src/practice/types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const packPath = resolve(
  __dirname,
  "../../../content/candidates/mpt-cardiorespiratory-review-candidate.json",
);
const outputPath = resolve(
  __dirname,
  "../../../docs/curriculum/MPT-ACTIVE-SUBJECTS-ATTESTATION.md",
);

function inline(value: string): string {
  return value.replaceAll("`", "'").replaceAll("\n", " ").trim();
}

function citedCriteria(
  concepts: Concept[],
  sources: Map<string, Source>,
): string[] {
  return concepts.flatMap((concept, index) => {
    const sourceLabels = concept.sourceRefs.map((sourceId) => {
      if (!sources.has(sourceId)) throw new Error(`missing source ${sourceId}`);
      return `\`${sourceId}\``;
    });
    return [
      `${index + 1}. ${concept.label} (${sourceLabels.join(", ")})`,
      `   - Accepted evidence wording: ${concept.acceptedPhrases.map((phrase) => `\`${inline(phrase)}\``).join("; ")}`,
    ];
  });
}

function activeSubjects(pack: RuntimePack) {
  return pack.subjects.filter((subject) => subject.availability === "ACTIVE");
}

function generate(pack: RuntimePack): string {
  const sources = new Map(pack.sources.map((source) => [source.sourceId, source]));
  const active = activeSubjects(pack);
  const activeTopics = active.flatMap((subject) => subject.topics);
  const activeVariants = activeTopics.flatMap((topic) => topic.variants);
  const usedSourceIds = new Set(
    activeTopics.flatMap((topic) =>
      topic.rubrics.flatMap((rubric) =>
        rubric.concepts.flatMap((concept) => concept.sourceRefs),
      ),
    ),
  );
  const lines: string[] = [
    "# MPT active-subject medical-content review worksheet",
    "",
    "> Status: **UNATTESTED DRAFT — educator review required before a public medical release.**",
    "> Completing or signing this worksheet is a human governance action. Its presence in the repository does not constitute approval.",
    "> Reviewers should complete a dated copy tied to the reviewed commit; this generated template remains immutable so automated drift checks stay meaningful.",
    "",
    "## Review scope",
    "",
    `- Pack: \`${pack.packId}\` version \`${pack.version}\``,
    `- Generated from the validated candidate: ${active.length} active subjects, ${activeTopics.length} topics, ${activeVariants.length} prompt variants`,
    "- Active subjects: Neuro Physiotherapy, Respiratory Physiotherapy, and Cardiovascular Physiotherapy",
    "- Evidence status: sources were checked in 2026 and include 2025–26 publications plus older still-current guidelines, measurement standards, and foundational texts",
    "- Curriculum catalog: 265 topics across eight visible subjects; five subjects remain `COMING_SOON` and cannot start practice",
    "- This worksheet reviews educational prompts and answer criteria. It is not patient-specific guidance, a diagnostic protocol, or a substitute for local policy or supervised clinical training.",
    "",
    "## Reviewer record",
    "",
    "- Reviewer name: ________________________________________________",
    "- Professional registration / licence number: ____________________",
    "- Qualification and specialty: ___________________________________",
    "- Institution / role: _____________________________________________",
    "- Conflicts of interest: __________________________________________",
    "- Review date (YYYY-MM-DD): _______________________________________",
    "- Pack commit SHA reviewed: _______________________________________",
    "",
    "For every prompt below, verify factual accuracy, physiotherapy scope, safety boundaries, currency of cited evidence, clarity for an MPT learner, and whether the accepted phrases are broad enough to recognize a correct spoken answer without rewarding a materially wrong claim.",
    "",
    "## Subject and prompt review",
    "",
  ];

  for (const subject of active) {
    lines.push(`## ${subject.title}`, "");
    for (const [topicIndex, topic] of subject.topics.entries()) {
      lines.push(
        `### ${topicIndex + 1}. ${topic.title}`,
        "",
        `Topic ID: \`${topic.topicId}\``,
        "",
      );
      for (const variant of topic.variants) {
        const rubric = topic.rubrics.find(
          (candidate) => candidate.rubricId === variant.rubricId,
        );
        if (!rubric || rubric.concepts.length === 0) {
          throw new Error(`active variant ${variant.variantId} has no answer criteria`);
        }
        lines.push(
          `#### Question — ${variant.challengePreset} / ${variant.mode}`,
          "",
          variant.wording,
          "",
        );
        if (variant.caseRef) {
          const ficCase = topic.cases.find((candidate) => candidate.caseId === variant.caseRef);
          if (!ficCase) throw new Error(`missing case ${variant.caseRef}`);
          lines.push("**Fictional case:** " + ficCase.text, "");
        }
        const followUps = variant.followUpRefs.map((followUpId) => {
          const followUp = topic.followUps.find(
            (candidate) => candidate.followUpId === followUpId,
          );
          if (!followUp) throw new Error(`missing follow-up ${followUpId}`);
          return followUp;
        });
        if (followUps.length > 0) {
          lines.push(
            "**Reviewed follow-up questions:**",
            "",
            ...followUps.map((followUp) => `- ${followUp.kind}: ${followUp.text}`),
            "",
          );
        }
        lines.push(
          "**Expected answer — required evidence criteria:**",
          "",
          ...citedCriteria(rubric.concepts, sources),
          "",
          "Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise",
          "",
          "Reviewer notes: ____________________________________________________________________",
          "",
        );
      }
    }
  }

  lines.push(
    "## Source index used by active answer criteria",
    "",
  );
  for (const source of pack.sources.filter((candidate) => usedSourceIds.has(candidate.sourceId))) {
    lines.push(
      `- \`${source.sourceId}\` — ${source.citation} ${source.url} (accessed ${source.accessedAt})`,
    );
  }
  lines.push(
    "",
    "## Final disposition",
    "",
    "Select exactly one after reviewing every active prompt and criterion:",
    "",
    "- [ ] APPROVE for the stated educational scope",
    "- [ ] APPROVE WITH REQUIRED CHANGES listed below",
    "- [ ] DO NOT APPROVE",
    "",
    "Required changes / exclusions: __________________________________________________________",
    "",
    "Reviewer declaration: I reviewed the commit SHA recorded above and confirm that my disposition applies only to that immutable content revision and the stated educational scope.",
    "",
    "- Signature: __________________________________________",
    "- Date: ______________________________________________",
    "",
    "Repository action after approval: retain the completed dated copy under release governance, record the real reviewer as `MEDICAL_REVIEWER`, set `reviewedAt`, resolve every required change, and rerun all content and application gates. Do not overwrite this generated template with the completed copy.",
    "",
  );
  return lines.join("\n");
}

const pack = validatePack(JSON.parse(readFileSync(packPath, "utf8")) as unknown);
assertPublicDraftPracticePack(pack);
const generated = generate(pack);

if (process.argv.includes("--check")) {
  if (readFileSync(outputPath, "utf8") !== generated) {
    throw new Error(
      "active-subject attestation worksheet is stale; run pnpm attestation:generate",
    );
  }
  console.log(`verified ${outputPath}`);
} else {
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, generated, "utf8");
  console.log(`wrote ${outputPath}`);
}
