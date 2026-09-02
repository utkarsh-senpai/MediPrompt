# MediPrompt implementation handoff

**Purpose:** minimum-context entry point for the next coding or PR-review agent

**Design baseline date:** 2026-09-02

## Start here

Read only these files first:

1. `README.md` - product contract and repository workflow.
2. `docs/EXECUTION_PLAN.md` - version order and exit gates.
3. `docs/V0.9_DEVELOPMENT_CONTEXT.md` - current catalog, paused-feature, and release contract.
4. The relevant L1-L4 section for the task; do not reload all design files unless needed.
5. `content/catalogs/neuro-physiotherapy-topics.json` for Neuro additions, deletions, or coverage.
6. `docs/curriculum/MPT-ACTIVE-SUBJECTS-ATTESTATION.md` for the generated current review scope;
   use the cardiorespiratory source review only for the original 20-topic history.

The current repository is the v0.9 learner app. Its 595-topic runtime catalog has 425 active topics:
365 Neuro, 26 combined Cardiovascular & Respiratory, and 34 Sports. The Neuro cards are simple
speaking prompts; most intentionally have no content-scoring rubric. The pack stays internally
`DRAFT`; do not infer educator approval from availability or automated checks.

## Non-negotiable product invariant

The app must always retain the compact Unprompted-style path:

```text
choose mode + subject -> spin -> see topic -> timed speech -> finish/exit -> repeat
```

It must work without account, microphone, model, storage, or network. Speech intelligence,
feedback, scheduling, Spring Boot, and connected AI are progressive enhancements. Viva, private
learning-plan, and challenge-selection entry points are paused in the v0.9 UI.

## Settled decisions

- Product name: MediPrompt.
- Hosting baseline: static PWA on GitHub Pages; zero recurring app cost.
- Front end: React + TypeScript; pure reducer/domain logic and browser adapters.
- Java: a later Java 21/Spring Boot command-line content compiler, then an optional modular monolith
  for connected features at v1.1+.
- Medical ground truth: human-reviewed, source-linked rubrics. Local semantic matching reports
  coverage, not correctness.
- Privacy: local-first; no emotion, accent, personality, confidence, or native-speaker scoring.
- Content: a catalog label creates a simple speaking card; only explicitly authored, source-linked
  concepts enable content coverage. Generation never invents medical answers.
- Challenge presets remain in the schema for compatibility, but the current UI resolves to
  `GUIDED` and does not expose Explain/Apply/Defend.
- Difficulty progression: recall/structure -> bounded application -> prioritized defense under
  uncertainty. Hardness never comes from trivia, time pressure alone, or hostile UI.
- Feedback: separate medical coverage from observable delivery; give one evidence-linked
  prescription and offer an immediate retry.

## Version pickup map

### Current baseline: v0.9 Neuro catalog expansion

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

v0.6 implemented an opt-in post-review viva ladder. Examiner prompts are disclosed one at a time; every
answer has an independent 60-second timer and attempt identity and reuses the optional local audio,
transcription, typed self-review, lexical, and semantic-evidence paths. Active exit cancels the
deadline and in-flight resources. Ladders must increase strictly and resolve completely to one
drawn rubric. Deep Research defaults to 600 seconds and main speaking defaults to 60 seconds.

v0.7 implemented an off-by-default private learning plan. Only topic/practice identity, review timestamp,
aggregate coverage, scoring identity, and schedule are persisted; audio, transcripts, concept
results, and transcript excerpts remain session-local. IndexedDB version 2 has a materialized,
validated topic index and newest-500 record limit. The idle plan opens the exact revalidated due
variant, uses local-calendar schedule/exam dates, exports metadata, and verifies delete-all by
reloading zero records. Unverifiable attempts never alter spacing, past exams never activate cram
sorting, and storage failure never blocks practice.

The learner artifact contains the 595-topic physiotherapy catalog, with the same
snapshot compiled as its offline fallback; generic interaction subjects are regression-test inputs
only. All seven subjects are visible. Neuro, combined Cardiovascular & Respiratory, and Sports are
`ACTIVE`; the four remaining subjects are disabled `COMING_SOON` shells and are rejected below the
UI as well.

`content/candidates/mpt-cardiorespiratory-review-candidate.json` version `0.9.0` has 425 active
topics: 365 Neuro, 26 combined Cardiovascular & Respiratory, and 34 Sports. Cardiorespiratory and
Sports retain source-authored criteria. The Neuro catalog is label-first; a topic without sourced
concepts remains fully usable for timed speaking and delivery feedback, while content coverage is
explicitly unavailable. The candidate remains `DRAFT`, has no reviewer/date attestation, and fails
the medical release gate by design.

The frozen toolchain is Node 22.23.2 in CI, pnpm 9.15.0, React 18.3.1, TypeScript 5.9.3, Vite
6.4.3, Vitest 3.2.6, and Playwright 1.62.1. The required checks are listed under **PR review
checklist** below and in the root README.

### v0.9 release source: `feature/v0.9-neuro-365`

PR #30 carries v0.9. It replaces the old 35-topic Neuro set with the 365-topic master catalog and
pauses Viva, private learning-plan, and challenge controls. It does not add accounts,
synchronization, transcript/audio persistence, or the Java compiler.

### Neuro catalog workflow

1. Edit only `content/catalogs/neuro-physiotherapy-topics.json` for topic additions/deletions and
   update `expectedTopicCount`.
2. A label-only topic gets Guided Recall Sprint and Deep Research variants automatically.
3. Optional `prompt` and `concepts` fields enable source-linked content coverage without generator
   changes. Each concept needs `label`, `acceptedPhrases`, and valid `sourceRefs`.
4. Run `pnpm --filter @mediprompt/learner-web candidate:medical:generate`, then
   `pnpm --filter @mediprompt/learner-web attestation:generate`.
5. Run `pnpm content:validate`; never hand-edit generated candidate or worksheet files.

Catalog generation is local and deterministic. It does not call ChatGPT or any hosted model and
therefore uses zero API tokens. A 2 MiB pack ceiling and a 1,000-topic per-subject schema bound keep
untrusted input bounded; introduce per-subject runtime shards before those limits are reached.

### Later versions

- v0.3: local recording/transcription and observable delivery metrics (deployed).
- v0.4: deterministic lexical rubric coverage, visible accepted-phrase evidence, one prescription.
- v0.5: same-identity retry, Refinement Delta, and non-counting semantic evidence.
- v0.6: opt-in, source-grounded viva defense ladder with lifecycle hardening.
- v0.7: private learning plan, local spaced resurfacing, exam triage, and data controls.
- v0.8: three complete active subjects and combined cardiorespiratory identity.
- v0.9: 365-topic Neuro catalog and focused learner surface (current).
- Later: Spring Boot content compiler, subject sharding, and target-user beta hardening.
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
prompt/rubric identity, pack/version, and mode in attempt identity. v0.7 persistence is explicit
opt-in and metadata-only; full transcripts and audio remain session-local. Retry comparison must
reject mismatched identities.
Accessibility time adjustments must not change challenge.

See `docs/DIFFICULTY_AND_DEPTH_DESIGN.md` for runtime YAML, UI, progression, and tests.

## Curriculum and medical-content status

- Seven curriculum-aligned app subjects and 595 runtime labels are compiled into the candidate;
  Cardiovascular and Respiratory use one combined app subject.
- IDs are unique lowercase kebab-case; normalized titles are unique.
- Curriculum-derived entries retain their paper/page-range mapping; Neuro master-list entries
  retain section and source-document identity.
- The reference extraction remains `DRAFT`/`REFERENCE_ONLY`; the generated runtime candidate has an
  independently validated activation boundary.
- Neuro (365), combined Cardiovascular & Respiratory (26), and Sports (34) are active. Label-only
  Neuro cards have empty rubrics and cannot receive a content score. Four other subjects remain
  `COMING_SOON` entries rejected by every practice entry path.
- Qualified educator review of the exact active candidate remains outstanding. Complete
  `docs/curriculum/MPT-ACTIVE-SUBJECTS-ATTESTATION.md`; do not infer approval from
  source authority, GitHub Pages availability, or put a placeholder in the reviewer fields.
- Do not use the candidate count as an official curriculum competency count.

## PR review checklist

For every implementation PR:

1. Confirm base branch and scope match the version plan.
2. Inspect for unrelated/user-owned changes before editing.
3. Trace each behavior to the version exit gate and tests.
4. Verify core use with network, microphone, model, storage, and account unavailable.
5. Verify Recall Sprint and Deep Research work while challenge, Viva, and learning-plan controls
   remain absent.
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

- Named medical educator reviewer and their completed active-subject worksheet for an immutable
  candidate commit.
- Software/content licences before public contribution.
- Target phone/browser benchmark and exam date/preferences.
- Criteria and release decision for deliberately reactivating challenge, Viva, or learning-plan UI.

Use a small implementation spike or inspect repository/user context before escalating these. Do not
invent a licence, reviewer, target device, or medical rubric.
