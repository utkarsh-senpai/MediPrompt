# MediPrompt implementation handoff

**Purpose:** minimum-context entry point for the next coding or PR-review agent

**Design baseline date:** 2026-08-30

## Start here

Read only these files first:

1. `README.md` - product contract and repository workflow.
2. `docs/EXECUTION_PLAN.md` - version order and exit gates.
3. `docs/DIFFICULTY_AND_DEPTH_DESIGN.md` - normative challenge/depth contract.
4. The relevant L1-L4 section for the task; do not reload all design files unless needed.
5. `docs/curriculum/MPT-CBC-topics.md` only for curriculum/content work.

The current repository includes the reviewed v0.2 first-playable implementation. Do not mistake
the MPT authoring inventory for a runtime topic pack.

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
- Java: Java 21/Spring Boot command-line content compiler at v0.6, then an optional modular monolith
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

### Current baseline: v0.2 first playable

The React/TypeScript PWA now implements the compact two-mode practice loop, strict topic-pack
validation, non-repeating full-fingerprint draws, deadline-based timers, responsive and accessible
surfaces, and an atomic allowlisted offline cache. It uses a reviewed non-medical interaction pack
until medical content has an identified medical reviewer. A compiled two-mode non-medical fallback
keeps the practice loop usable when the full pack is missing or rejected.

The frozen toolchain is Node 22.23.2 in CI, pnpm 9.15.0, React 18.3.1, TypeScript 5.9.3, Vite
6.4.3, Vitest 3.2.6, and Playwright 1.62.1. The required checks are listed under **PR review
checklist** below and in the root README.

### Next implementation branch: `feature/v0.3-private-speech`

Add only the private speech-intelligence slice:

1. Preserve the complete v0.2 no-microphone path as the default and regression baseline.
2. Add explicit microphone permission, denial, unsupported-device, cancellation, and recovery
   paths.
3. Record locally with playback and deterministic Web Audio delivery measurements.
4. Benchmark a lazy, cancellable browser-local transcription worker on representative
   Indian-English medical speech and low/mid-range devices before selecting a default model tier.
5. Let the learner correct the transcript before later content evaluation; keep audio and text
   private to the browser.
6. Report only observable delivery features—duration, pace, fillers, repetition, silence, pause
   placement, loudness stability, and clipping—with documented limitations.
7. Add deterministic audio fixtures, worker failure tests, UI-freeze/performance evidence, and
   proof that no raw audio request leaves the browser.

Do not add embeddings/rubric scoring, prescriptions, scheduling, login, a database, provider API
calls, or Spring Boot to v0.3; those belong to later exit gates.

### Later versions

- v0.3: local recording/transcription and observable delivery metrics.
- v0.4: reviewed rubric coverage, one prescription, same-variant retry, Refinement Delta.
- v0.5: Viva follow-ups/evidence updates, scheduling, local history/export/delete.
- v0.6: Spring Boot content compiler and authoring/publication validation.
- v0.7: target-user beta hardening.
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

## Curriculum status

- 7 subjects and 265 candidate practice-topic labels are stored under `docs/curriculum/`.
- IDs are unique lowercase kebab-case; normalized titles are unique.
- Every candidate maps once to a paper/page-range index.
- The inventory is `DRAFT`, `REFERENCE_ONLY`, and `runtimeCompatible: false`.
- Exact per-candidate competency/module mapping, source-use/licence decision, prompt/rubric/case
  authoring, and educator approval remain outstanding.
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

- Final demo topic content and named medical educator reviewer.
- Software/content licences before public contribution.
- Target phone/browser benchmark and exam date/preferences.
- Whether the challenge selector uses text tabs, segmented control, or select at narrow widths.

Use a small implementation spike or inspect repository/user context before escalating these. Do not
invent a licence, reviewer, target device, or medical rubric.
