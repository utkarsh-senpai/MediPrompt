# MediPrompt project memory

**Owner:** Utkarsh Meshram (`utkarsh-senpai`)

**Updated:** 2026-09-02

**Current version:** v0.9 Neuro catalog expansion in PR #30, pending promotion through `develop` to `main`

## Product invariant

MediPrompt is a privacy-first speaking-practice PWA for medical students. Its permanent core is:

```text
choose mode + subject -> spin -> topic -> timed speech -> finish/exit -> repeat
```

That path must work without an account, microphone, speech model, persistent storage, backend, or
network. Recording, transcription, feedback, scheduling, Spring Boot, and connected providers are
opt-in progressive enhancements. Unprompted is the interaction reference, never a source of code,
content, copy, or visual identity.

## Implemented baseline

- Static React/TypeScript PWA hosted at the GitHub Pages `/MediPrompt/` base path.
- Recall Sprint and Deep Research with independent mode, subject, and time. The challenge selector
  is paused in v0.9; runtime selection always resolves to the available Guided variant.
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
- v0.6 built an opt-in viva defense after review: future prompts remain hidden until their turn; each answer
  has a unique 60-second timer/attempt identity; the microphone, transcript, typed-review, lexical,
  and optional semantic paths reuse the hardened local pipeline. Active exit stops and releases all
  in-flight resources. Ladders are strictly increasing and all-or-nothing for one drawn rubric.
  Numeric summary copy uses only `scoredCount`; unverifiable answers remain visible but excluded.
- v0.7 built an opt-in private learning plan: reviewed attempts save only bounded topic/practice identity,
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
- v0.8 exposed exactly three fully authored subjects: Neuro (35), combined Cardiovascular &
  Respiratory (26), and Sports (34).
- v0.9 replaces the Neuro set with a validated 365-topic, 22-section catalog. The three active
  subjects now contain 425 topics and the complete seven-subject runtime contains 595. Every Neuro
  topic supports Recall Sprint and Deep Research; topics without sourced criteria report coverage
  unavailable while delivery, transcript, and retry feedback continue normally.
- v0.9 deliberately makes Viva, private learning-plan, and Explain/Apply/Defend entry points
  unreachable. Their internal implementation remains dormant for a later reviewed reactivation.

## v0.3 interaction and identity decisions

- Internal pack values remain `GUIDED`, `APPLIED`, and `VIVA` for schema compatibility. The v0.9 UI
  exposes no challenge control and must not display easy/medium/hard or Explain/Apply/Defend labels.
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

- The runtime catalog contains 595 labels across seven subjects. Neuro's canonical editable source
  is `content/catalogs/neuro-physiotherapy-topics.json`; the earlier 265-topic curriculum extraction
  remains reference history rather than the Neuro source of truth.
- `content/candidates/mpt-cardiorespiratory-review-candidate.json` version `0.9.0` is `MEDICAL`,
  `DRAFT`, `reviewers: []`, and `reviewedAt: null`. Neuro (365), combined Cardiovascular &
  Respiratory (26), and Sports (34) are the only `ACTIVE` subjects. The 365 Neuro labels are simple
  speaking cards; Cardiorespiratory and Sports retain sourced criteria. The remaining four
  subjects are visible, disabled `COMING_SOON` skeletons.
- Cardiorespiratory and Sports answer criteria use sources checked in 2026. The evidence set
  includes 2025-26 publications, official current rules, and older still-current/foundational guidance and measures.
  Never summarize it as “all references are 2025-26.” Currency and provenance support review;
  they do not substitute for qualified educator review.
- Normal development and GitHub Pages load this candidate as a public practice beta. UI, query,
  and session paths limit practice to the three active subjects; generic Everyday/Science/Reasoning
  topics are not shipped.
- The recurring learner-facing draft/attestation banner is removed for these simple topic prompts.
  The pack stays internally `DRAFT`; the footer disclaimer and all fail-closed content gates remain.
  The approved non-medical interaction fixture remains only for schema/regression tests.
- Build and service-worker validation require the seven known subjects, exactly three active
  subjects, non-empty subject catalogs, `MEDICAL`/`DRAFT`, and empty attestation. They intentionally
  do not hardcode 595 or 365, so a reviewed catalog addition/deletion does not require validator
  code changes. Approved medical packs still reject empty rubrics.
- Loader, service worker, and PWA precache share a bounded 2 MiB pack ceiling. The current 1.10 MB
  candidate remains outside initial-entry JavaScript and works offline; subject sharding is the
  next scale step before this bounded ceiling is reached.
- `docs/curriculum/MPT-ACTIVE-SUBJECTS-ATTESTATION.md` is generated from the candidate and covers
  every active topic, explicitly marking cards without answer criteria as scaffolded. It remains
  unsigned and does not change review status; `content:validate` rejects worksheet drift.

## Topic catalog workflow

- Add or delete a Neuro topic only in `content/catalogs/neuro-physiotherapy-topics.json`, update
  `expectedTopicCount`, then run the medical-candidate and worksheet generators.
- IDs and rendered titles must be unique. The generator rejects malformed sections, duplicate IDs,
  duplicate titles, and count drift before producing learner content.
- A label-only entry automatically receives both Guided Recall Sprint and Deep Research variants.
  It uses no API or LLM token at runtime.
- To enable source-linked content coverage later, add an optional `prompt` and `concepts` array to
  the same catalog item. Each concept carries `label`, `acceptedPhrases`, and `sourceRefs`; referenced
  sources must already exist in the generated pack. No generator-code change is required.

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
- The app may report lexical coverage only when a source-linked rubric exists. Label-only cards
  must report coverage unavailable and must never claim correctness or medical approval.
- Semantic evidence must remain non-counting until a qualified educator-labelled calibration set
  establishes and versions promotion/rejection thresholds.
- Never score emotion, anxiety, confidence, personality, intelligence, competence, accent, or
  native-speaker likeness.
- Do not ship user/provider API keys in the static client. Future connected/BYOK integrations need
  an explicit threat model and server-side secret handling where appropriate.
- Transcript uncertainty ranges render as escaped text highlights; pack and transcript strings are
  always untrusted content.
- Practice-history persistence, export, and delete controls are unreachable in v0.9. The dormant
  implementation must retain its privacy properties for any later reactivation.

## Toolchain and verification

- Node 22.23.2 in CI; pnpm 9.15.0; frozen lockfile.
- React 18.3.1, TypeScript 5.9.3, Vite 6.4.3, Vitest 3.2.6, Playwright 1.62.1.
- `sharp` is overridden to 0.35.4 to remove the advisory affecting the PR's dependency graph.
- CI actions are SHA-pinned and run with read-only repository permissions.
- Required gates: lint, typecheck, content validation, unit/component/content tests,
  accessibility smoke, build/artifact validation, offline/responsive E2E, production and full
  dependency audits, visual desktop/320 px/reduced-motion checks, and `git diff --check`.

## Current pickup state

v0.9 retains the focused spin/speak/review/retry loop and expands Neuro to 365 topics through a
standalone catalog. Viva, private learning-plan, and challenge-selection surfaces are paused; do not
reactivate them incidentally. The Java 21/Spring Boot content compiler and target-user hardening
remain later work. Whisper and MiniLM still use one shared bundled worker asset, while model
instances and activation paths remain separate. GitHub operations must use
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
- `docs/V0.8_DEVELOPMENT_CONTEXT.md`: merged-subject identity, active content, evidence, budgets, and release checks.
- `docs/V0.9_DEVELOPMENT_CONTEXT.md`: Neuro catalog, paused features, scale limits, and release checks.
- `docs/curriculum/MPT-CARDIORESPIRATORY-SOURCE-REVIEW.md`: evidence register and educator-review
  checklist.
- `docs/curriculum/MPT-ACTIVE-SUBJECTS-ATTESTATION.md`: generated review worksheet for all 425 active
  topics; never hand-edit or treat the unsigned file as approval.
- `docs/L1_PRODUCT_AND_SYSTEM_CONTEXT.md` through `docs/L4_CODE_DESIGN.md`: architecture.

If memory conflicts with a normative design or an exit gate, the execution plan and L1-L4 design
win; update this file in the same PR that changes those decisions.
