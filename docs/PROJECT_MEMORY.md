# MediPrompt project memory

**Owner:** Utkarsh Meshram (`utkarsh-senpai`)

**Updated:** 2026-09-02

**Current version:** v0.7 private learning plan in PR #24, pending promotion through `develop` to `main`

## Product invariant

MediPrompt is a privacy-first speaking-practice PWA for medical students. Its permanent core is:

```text
choose mode + challenge + subject -> spin -> topic -> timed speech -> finish/exit -> repeat
```

That path must work without an account, microphone, speech model, persistent storage, backend, or
network. Recording, transcription, feedback, scheduling, Spring Boot, and connected providers are
opt-in progressive enhancements. Unprompted is the interaction reference, never a source of code,
content, copy, or visual identity.

## Implemented baseline

- Static React/TypeScript PWA hosted at the GitHub Pages `/MediPrompt/` base path.
- Recall Sprint and Deep Research with independent mode, challenge, subject, support, and time.
- Full-fingerprint shuffled bags, deadline timers, reducer stale-event rejection, accessible
  settings, reduced-motion support, and a tested 320 px layout.
- Strict topic-pack schema and content gates, fixed-manifest service-worker caching, CSP-safe
  validation, no remote scripts/fonts/analytics, and an offline fallback.
- v0.3 optional local recording, playback, deterministic delivery observations, cancellable
  browser-local `whisper-base.en` transcription, transcript correction, and typed self-review.
- v0.4 deterministic coverage over learner-approved text: whole accepted-phrase tokens or nearby
  significant tokens, visible matched-phrase evidence, and exactly one prioritized next action.
  Missing text or a non-scorable rubric produces an explicit unavailable outcome, never zero
  coverage.
- v0.5 bounded same-topic retry history and **Refinement Delta**, computed only for identical topic,
  practice, time, pack/rubric, and scoring identities. Missing/mismatched inputs are explicitly
  unavailable; newly covered and lost concepts remain visible.
- Optional pinned q8 MiniLM meaning matching compares bounded sentence windows with rubric wording.
  The verified model revision is `751bff37182d3f1213fa05d7196b954e230abad9`; malformed output,
  timeout, offline, cancellation, or low memory retains lexical coverage. Until educator-labelled
  calibration, semantic results are “possibly present — not counted” and cannot change coverage or
  Refinement Delta.
- v0.6 opt-in viva defense after review: future prompts remain hidden until their turn; each answer
  has a unique 60-second timer/attempt identity; the microphone, transcript, typed-review, lexical,
  and optional semantic paths reuse the hardened local pipeline. Active exit stops and releases all
  in-flight resources. Ladders are strictly increasing and all-or-nothing for one drawn rubric.
  Numeric summary copy uses only `scoredCount`; unverifiable answers remain visible but excluded.
- v0.7 opt-in private learning plan: reviewed attempts save only bounded topic/practice identity,
  timestamp, aggregate coverage, scoring identity, and schedule. IndexedDB and JSON export never
  contain audio, transcript text, concept-level evidence, semantic transcript excerpts, or
  embeddings. Retention is capped at 500 records; two-step delete-all verifies an empty reload.
- Due dates and the optional exam date use strict learner-local `YYYY-MM-DD` values. Past exams do
  not activate urgency sorting. The idle Learning plan opens the exact revalidated current-pack
  due variant; storage failure never blocks ordinary practice.
- Default timers are 60 seconds for main/viva speaking and 600 seconds (10 minutes) for Deep
  Research. Learner settings may still change the main speaking/research durations within bounds;
  a viva answer remains the fixed 60-second defense contract.
- Microphone consent does not acquire a stream. Permission is requested only when the speaking
  timer starts; recording stops with the timer and every stream/object URL is released.

## v0.3 interaction and identity decisions

- User-facing challenge names are **Explain**, **Apply**, and **Defend**. Internal pack values
  remain `GUIDED`, `APPLIED`, and `VIVA` for schema compatibility. The UI must not display
  easy/medium/hard labels.
- The topic draw is mandatory before timer start and uses a smooth 650 ms rotating compass state;
  reduced-motion users get a short non-animated transition.
- Long topic expectation/scenario copy lives behind the accessible `?` control.
- A three-beat **What? → So what? → Now what?** speaking compass advances with elapsed time and
  matches the Unprompted interaction reference while retaining MediPrompt's own visual identity.
- The microphone is an icon control with an explicit text state. It can be enabled before speaking
  but becomes active only with the timer; timer-only practice is always equal and available.
- The “clinical aurora” identity uses deep teal `#07171a`, apricot `#ffb86b`, and sea-glass
  `#70d6c4`, self-hosted Fraunces/Outfit, subtle falling light, and no distracting motion when the
  operating system requests reduced motion.

## Medical-content boundary

- The 265 curriculum-derived labels under `docs/curriculum/` are the canonical catalog. The runtime
  candidate mirrors all eight app subjects but uses availability as a safety boundary.
- `content/candidates/mpt-cardiorespiratory-review-candidate.json` version `0.3.0` is `MEDICAL`,
  `DRAFT`, `reviewers: []`, and `reviewedAt: null`. Neuro (35), Respiratory (13), and
  Cardiovascular (13) are the only `ACTIVE` subjects; every one of their 61 topics has sourced
  criteria. The remaining five subjects are visible, disabled `COMING_SOON` skeletons.
- All 35 Neuro topics are authored from the curriculum plus sources checked in 2026. The evidence
  set includes 2025-26 publications and older still-current/foundational guidance and measures.
  Never summarize it as “all references are 2025-26.” Currency and provenance support review;
  they do not substitute for qualified educator review.
- Normal development and GitHub Pages load this candidate as an explicitly labelled **public
  practice beta**. UI, query, session, direct-snapshot, and saved-plan paths limit practice to the
  three active subjects; generic Everyday/Science/Reasoning topics are not shipped.
- Every beta screen displays `Curriculum beta · unreviewed draft` and `not for diagnosis,
  treatment, or clinical decisions`. The approved non-medical interaction fixture remains only for
  schema/regression tests.
- Build and service-worker validation require the exact `MEDICAL`, `DRAFT`, unattested 265-topic
  catalog and its exact 3-active/5-coming-soon split. Structural validation forbids empty rubrics in
  active subjects. The generic interaction fixture and legacy `beta-packs/` path remain excluded.
- `docs/curriculum/MPT-ACTIVE-SUBJECTS-ATTESTATION.md` is generated from the candidate and covers
  every active question and expected answer criterion. It remains unsigned and does not change
  review status; `content:validate` rejects worksheet drift.

## Review and release policy

Automated merge readiness and public medical release readiness are different decisions:

- **Code merge readiness:** lint, typecheck, content validation, unit/component/a11y tests,
  production build and artifact validation, E2E/offline checks, dependency audits, responsive and
  reduced-motion inspection, and clean diff checks may allow a version PR to merge.
- **Public medical release readiness:** additionally requires a release plan, representative-device
  and model benchmarks, and a qualified educator's traceable review of the exact medical prompts,
  fictional cases, rubrics, accepted phrases, curriculum mappings, and source scope.

Per the owner's updated decision, educator attestation is planned after real-user feedback when
preparing v1.x. Until then, genuine medical content may be exposed on GitHub Pages only as the
conspicuously labelled public practice beta; it must stay `DRAFT`, unattested, and separate from a
medical release. A curriculum document or its provenance is not an attestation of derivative app
content. Never use a pseudonym, organization, AI system, repository owner, or placeholder as a
`MEDICAL_REVIEWER`.

For this policy, **real data** means curriculum-grounded draft topics plus consented,
de-identified learner attempts, recordings, and corrected transcripts. It never means patient
data. Learner audio/transcripts remain session-local and export-free. v0.7 exports only the
privacy-minimized learning-plan metadata after learner action.

## Safety, privacy, and feedback

- No identifiable patient information; fictional cases only.
- No audio or transcript upload in the zero-cost path.
- The public beta may report lexical coverage against its source-linked draft rubric only while the
  unreviewed-draft warning remains conspicuous. It must never claim correctness or medical approval.
- Semantic evidence must remain non-counting until a qualified educator-labelled calibration set
  establishes and versions promotion/rejection thresholds.
- Never score emotion, anxiety, confidence, personality, intelligence, competence, accent, or
  native-speaker likeness.
- Do not ship user/provider API keys in the static client. Future connected/BYOK integrations need
  an explicit threat model and server-side secret handling where appropriate.
- Transcript uncertainty ranges render as escaped text highlights; pack and transcript strings are
  always untrusted content.
- Practice-history persistence is off by default. Pausing saves does not imply deletion; export and
  verified delete-all remain reachable. The unreleased IndexedDB v1 store is purged on migration
  because it could contain transcript text and had a broken topic index.

## Toolchain and verification

- Node 22.23.2 in CI; pnpm 9.15.0; frozen lockfile.
- React 18.3.1, TypeScript 5.9.3, Vite 6.4.3, Vitest 3.2.6, Playwright 1.62.1.
- `sharp` is overridden to 0.35.4 to remove the advisory affecting the PR's dependency graph.
- CI actions are SHA-pinned and run with read-only repository permissions.
- Required gates: lint, typecheck, content validation, unit/component/content tests,
  accessibility smoke, build/artifact validation, offline/responsive E2E, production and full
  dependency audits, visual desktop/320 px/reduced-motion checks, and `git diff --check`.

## Current pickup state

v0.7 contains the private learning plan and spaced-resurfacing outcome plus the 265-topic catalog
and three-subject activation gate. It includes explicit consent, transcript-free records, working
IndexedDB v2 indexing, strict validation, bounded retention, local-calendar scheduling, exam
triage, exact due-topic launch, export, and verified deletion. The Java 21/Spring Boot content
compiler is now v0.8; target-user hardening is v0.9. Extra registers, challenge suggestions, and
additional packs remain unplanned. Whisper and MiniLM still use one shared bundled worker asset,
while model instances and activation paths remain separate. GitHub operations must use
`utkarsh-senpai`; release changes flow through `develop` before `main` and Pages.

The beta may be publicly testable, but medical approval remains blocked pending educator
attestation. Use the generated active-subject worksheet for that review after target-user feedback;
the next release work is target-device/model benchmarking and a v1.x educator-review/release plan.

## Source of truth

- `README.md`: product contract and commands.
- `docs/EXECUTION_PLAN.md`: version scope and exit gates.
- `docs/DIFFICULTY_AND_DEPTH_DESIGN.md`: challenge-depth contract.
- `docs/V0.3_DEVELOPMENT_CONTEXT.md`: v0.3 implementation and review decisions.
- `docs/V0.4_DEVELOPMENT_CONTEXT.md`: v0.4 lexical-coverage contract and v0.5 deferrals.
- `docs/V0.5_DEVELOPMENT_CONTEXT.md`: reviewed retry, delta, semantic, and safety contract.
- `docs/V0.6_DEVELOPMENT_CONTEXT.md`: reviewed viva ladder, cleanup, content, and timer contract.
- `docs/V0.7_DEVELOPMENT_CONTEXT.md`: private learning-plan privacy, storage, scheduling, and UI contract.
- `docs/curriculum/MPT-CARDIORESPIRATORY-SOURCE-REVIEW.md`: evidence register and educator-review
  checklist.
- `docs/curriculum/MPT-ACTIVE-SUBJECTS-ATTESTATION.md`: generated review worksheet for all 61 active
  topics; never hand-edit or treat the unsigned file as approval.
- `docs/L1_PRODUCT_AND_SYSTEM_CONTEXT.md` through `docs/L4_CODE_DESIGN.md`: architecture.

If memory conflicts with a normative design or an exit gate, the execution plan and L1-L4 design
win; update this file in the same PR that changes those decisions.
