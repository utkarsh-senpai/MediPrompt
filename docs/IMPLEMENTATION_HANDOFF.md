# MediPrompt implementation handoff

**Purpose:** minimum-context entry point for the next coding or PR-review agent

**Design baseline date:** 2026-09-02

## Start here

Read only these files first:

1. `README.md` - product contract and repository workflow.
2. `docs/EXECUTION_PLAN.md` - version order and exit gates.
3. `docs/DIFFICULTY_AND_DEPTH_DESIGN.md` - normative challenge/depth contract.
4. The relevant L1-L4 section for the task; do not reload all design files unless needed.
5. `docs/curriculum/MPT-CBC-topics.md` only for broad curriculum inventory work.
6. `docs/curriculum/MPT-CARDIORESPIRATORY-SOURCE-REVIEW.md` for the first medical-pack review.

The current repository includes the v0.6 learner app and a complete source-linked medical review
candidate. The exact 20-topic candidate is learner-visible as
a public **practice beta**, but it is still `DRAFT`; do not mistake public availability, the broad
MPT inventory, source linkage, or automated coverage for educator approval.

## Non-negotiable product invariant

The app must always retain the compact Unprompted-style path:

```text
choose mode + challenge + subject -> spin -> see topic -> timed speech -> finish/exit -> repeat
```

It must work without account, microphone, model, storage, or network. Speech intelligence,
feedback, scheduling, Spring Boot, and connected AI are progressive enhancements.

## Settled decisions

- Product name: MediPrompt.
- Hosting baseline: static PWA on GitHub Pages; zero recurring app cost.
- Front end: React + TypeScript; pure reducer/domain logic and browser adapters.
- Java: Java 21/Spring Boot command-line content compiler at v0.7, then an optional modular monolith
  for connected features at v1.1+.
- Medical ground truth: human-reviewed, source-linked rubrics. Local semantic matching reports
  coverage, not correctness.
- Privacy: local-first; no emotion, accent, personality, confidence, or native-speaker scoring.
- Content: curriculum extraction creates a reference-only authoring inventory. It cannot publish
  prompts, answers, rubrics, or cases automatically.
- Challenge presets: `GUIDED`, `APPLIED`, `VIVA`. Challenge is separate from practice mode,
  register, support, and accessibility time.
- Difficulty progression: recall/structure -> bounded application -> prioritized defense under
  uncertainty. Hardness never comes from trivia, time pressure alone, or hostile UI.
- Feedback: separate medical coverage from observable delivery; give one evidence-linked
  prescription and offer an immediate retry.

## Version pickup map

### Current baseline: v0.6 viva defense ladder

The React/TypeScript PWA retains the compact v0.2 two-mode practice loop, strict topic-pack
validation, non-repeating full-fingerprint draws, deadline-based timers, responsive and accessible
surfaces, and an atomic allowlisted offline cache. v0.3 adds opt-in local recording, delivery
observations, transcription, correction, and typed self-review. v0.4 adds bounded lexical coverage
and one prescription after the learner approves or types text. Missing text/rubric evidence is
unavailable rather than zero; matching remains coverage, never correctness.

v0.5 adds the same-topic retry chain, bounded session history, and an identity-checked Refinement
Delta with newly covered/lost concepts. Optional pinned MiniLM evidence uses bounded transcript
segments and displays `POSSIBLY_COVERED` matches without counting them. Whisper and MiniLM share
one bundled model-worker asset. Semantic score promotion remains disabled pending educator-labelled
calibration.

v0.6 adds an opt-in post-review viva ladder. Examiner prompts are disclosed one at a time; every
answer has an independent 60-second timer and attempt identity and reuses the optional local audio,
transcription, typed self-review, lexical, and semantic-evidence paths. Active exit cancels the
deadline and in-flight resources. Ladders must increase strictly and resolve completely to one
drawn rubric. Deep Research defaults to 600 seconds and main speaking defaults to 60 seconds.

The learner artifact contains only the 20-topic public physiotherapy practice beta, with the same
snapshot compiled as its offline fallback; generic interaction subjects are regression-test inputs
only.

`content/candidates/mpt-cardiorespiratory-review-candidate.json` version `0.2.0` is the first medical publication
candidate: 20 curriculum-mapped topics, Recall Sprint and Deep Research coverage, 46 source-linked
rubrics, and three full challenge trios. Its generator, evidence matrix, source-currency decisions,
and educator checklist are committed. It is `DRAFT`, has no reviewer/date attestation, and fails
the medical release gate by design. Public build and service-worker gates permit only that exact
unattested snapshot and keep its warning visible.

The frozen toolchain is Node 22.23.2 in CI, pnpm 9.15.0, React 18.3.1, TypeScript 5.9.3, Vite
6.4.3, Vitest 3.2.6, and Playwright 1.62.1. The required checks are listed under **PR review
checklist** below and in the root README.

### v0.6 release source: `feature/v0.6-viva-round`

PR #22 carries v0.6. The release includes the viva ladder only; it does not implement scheduling,
persistent history, export/delete, extra registers, challenge suggestions, or extra packs. Those
items were removed from the v0.6 gate and require a future replan after v0.7.

### Later versions

- v0.3: local recording/transcription and observable delivery metrics (deployed).
- v0.4: deterministic lexical rubric coverage, visible accepted-phrase evidence, one prescription.
- v0.5: same-identity retry, Refinement Delta, and non-counting semantic evidence.
- v0.6: opt-in, source-grounded viva defense ladder with lifecycle hardening (current).
- v0.7: Spring Boot content compiler and authoring/publication validation.
- v0.8: target-user beta hardening.
- v1.1+: optional connected service and provider-backed coaching.

The detailed exit gate for each version is authoritative in `docs/EXECUTION_PLAN.md`.

## Required v0.2 challenge contracts

Use these identifiers:

```ts
type PracticeMode = "RECALL_SPRINT" | "VIVA_ROUND" | "DEEP_RESEARCH" | "TEACH_BACK";
type ChallengePreset = "GUIDED" | "APPLIED" | "VIVA";
type Register = "EXAMINER" | "JUNIOR" | "PATIENT";
```

Carry `variantId`, `difficultyProfileVersion`, `ChallengePreset`, support level, time policy,
prompt/rubric identity, pack/version, and mode in attempt identity. Persistence begins only in the
version that introduces attempt history. Retry comparison must reject mismatched identities.
Accessibility time adjustments must not change challenge.

See `docs/DIFFICULTY_AND_DEPTH_DESIGN.md` for runtime YAML, UI, progression, and tests.

## Curriculum and medical-content status

- 7 subjects and 265 candidate practice-topic labels are stored under `docs/curriculum/`.
- IDs are unique lowercase kebab-case; normalized titles are unique.
- Every candidate maps once to a paper/page-range index.
- The inventory is `DRAFT`, `REFERENCE_ONLY`, and `runtimeCompatible: false`.
- One 20-topic cardiovascular/respiratory subset has exact competency/page mapping, current source
  research, original prompt/rubric/case wording, and an explicit reuse boundary. Its automated
  candidate checks are complete.
- Qualified educator review of that exact candidate remains outstanding. Do not infer approval from
  source authority, GitHub Pages availability, or put a placeholder in the reviewer fields.
- Do not use the candidate count as an official curriculum competency count.

## PR review checklist

For every implementation PR:

1. Confirm base branch and scope match the version plan.
2. Inspect for unrelated/user-owned changes before editing.
3. Trace each behavior to the version exit gate and tests.
4. Verify core use with network, microphone, model, storage, and account unavailable.
5. Verify challenge, mode, register, support, and time remain separate dimensions.
6. Reject generated or unsourced medical ground truth.
7. Reject correctness/pass/fail claims from embeddings or LLM output.
8. Check privacy, accessibility, responsive behavior, performance budget, failure states, and
   deterministic tests.
9. Run repository checks plus `git diff --check`.
10. Update L1-L4 only when implementation decisions materially change them.

Do not merge merely because checks pass. Review correctness, scope, safety, and user-visible
behavior first. Merge feature PRs to `develop`; promote an approved release from `develop` to
`main`, then reconcile any release fixes back into `develop`.

## Open decisions - discover before asking

- Named medical educator reviewer and their attestation for the committed medical candidate.
- Software/content licences before public contribution.
- Target phone/browser benchmark and exam date/preferences.
- Whether the challenge selector uses text tabs, segmented control, or select at narrow widths.

Use a small implementation spike or inspect repository/user context before escalating these. Do not
invent a licence, reviewer, target device, or medical rubric.
