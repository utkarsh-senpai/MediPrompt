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

The current repository is a design baseline. Do not mistake the MPT authoring inventory for a
runtime topic pack.

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

### Next implementation branch: `feature/v0.2-first-playable`

Build only the first-playable PWA plus the minimum challenge contract:

1. Scaffold workspace/tooling described in L4.
2. Implement pure session reducer and monotonic deadline timer.
3. Implement mode, challenge, and subject controls; shuffled-bag topic draw; spin-again.
4. Ship one hand-authored demo pack with at least 20 topics.
5. Give every published demo topic a Guided variant; include at least three educator-reviewed
   Guided/Applied/Viva trios to validate the selector and schema.
6. Hide the challenge selector when the selected content has only one eligible preset.
7. Implement focused speaking surface, answer arc, completion/exit, settings, responsive layout,
   keyboard access, reduced motion, and offline shell.
8. Add unit, component, accessibility-smoke, mobile-viewport, background-timer, and no-capability
   tests.

Do not add microphone/STT, embeddings, LLM calls, login, database, or Spring Boot to v0.2.

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

Persist `variantId`, `profileVersion`, `ChallengePreset`, support level, time policy, prompt/rubric
identity, pack/version, and mode in attempt identity. Retry comparison must reject mismatched
identities. Accessibility time adjustments must not change challenge.

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

- Exact package manager and scaffold versions when v0.2 starts.
- Final demo topic content and named medical educator reviewer.
- Software/content licences before public contribution.
- Target phone/browser benchmark and exam date/preferences.
- Whether the challenge selector uses text tabs, segmented control, or select at narrow widths.

Use a small implementation spike or inspect repository/user context before escalating these. Do not
invent a licence, reviewer, target device, branch name, or medical rubric.
