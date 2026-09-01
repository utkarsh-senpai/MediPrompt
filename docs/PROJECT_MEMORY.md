# MediPrompt project memory

**Owner:** Utkarsh Meshram (`utkarsh-senpai`)

**Updated:** 2026-09-01

**Current version:** v0.5 grounded refinement from PR #20, promoted through `develop` to `main`

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

- The 265 labels under `docs/curriculum/` are `DRAFT`, `REFERENCE_ONLY`, and never runtime learner
  content.
- The genuine curriculum-grounded first subset is
  `content/candidates/mpt-cardiorespiratory-review-candidate.json`: 20 cardiovascular/respiratory
  topics with three challenge variants. It remains `MEDICAL`, `DRAFT`, `reviewers: []`, and
  `reviewedAt: null`.
- Source research includes the supplied curriculum and current primary sources such as GOLD 2026,
  GINA 2026, the 2025 ERS bronchiectasis guideline, 2025 SCCM PADIS focused update, 2025 ACC/AHA
  ACS guideline, and 2025 AHA adult BLS guideline. Currency and provenance support review; they do
  not substitute for review.
- Normal development and GitHub Pages load that exact 20-topic candidate as an explicitly labelled
  **public practice beta**. The only selectable subjects are Respiratory Physiotherapy and
  Cardiovascular Physiotherapy; generic Everyday/Science/Reasoning topics are not copied into the
  learner artifact.
- Every beta screen displays `Curriculum beta · unreviewed draft` and `not for diagnosis,
  treatment, or clinical decisions`. The approved non-medical interaction fixture remains only for
  schema/regression tests.
- Build and service-worker validation require the exact `MEDICAL`, `DRAFT`, unattested 20-topic
  snapshot, reject fabricated reviewer identifiers and legacy `beta-packs/`, and reject the generic
  interaction fixture from the public artifact.

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
data. v0.3 keeps learner audio/transcripts session-local and export-free.

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

## Toolchain and verification

- Node 22.23.2 in CI; pnpm 9.15.0; frozen lockfile.
- React 18.3.1, TypeScript 5.9.3, Vite 6.4.3, Vitest 3.2.6, Playwright 1.62.1.
- `sharp` is overridden to 0.35.4 to remove the advisory affecting the PR's dependency graph.
- CI actions are SHA-pinned and run with read-only repository permissions.
- Required gates: lint, typecheck, content validation, unit/component/content tests,
  accessibility smoke, build/artifact validation, offline/responsive E2E, production and full
  dependency audits, visual desktop/320 px/reduced-motion checks, and `git diff --check`.

## Current pickup state

The v0.5 release line adds bounded retry history, identity-checked Refinement Delta, and optional
non-counting semantic evidence. Whisper and MiniLM use one shared bundled worker asset, while their
model instances and explicit activation paths remain separate. GitHub operations must use
`utkarsh-senpai`; release changes flow through `develop` before `main` and Pages.

The beta may be publicly testable, but medical approval remains blocked pending educator
attestation. The next release work is target-device/model benchmarking and a v1.x
educator-review/release plan.

## Source of truth

- `README.md`: product contract and commands.
- `docs/EXECUTION_PLAN.md`: version scope and exit gates.
- `docs/DIFFICULTY_AND_DEPTH_DESIGN.md`: challenge-depth contract.
- `docs/V0.3_DEVELOPMENT_CONTEXT.md`: v0.3 implementation and review decisions.
- `docs/V0.4_DEVELOPMENT_CONTEXT.md`: v0.4 lexical-coverage contract and v0.5 deferrals.
- `docs/V0.5_DEVELOPMENT_CONTEXT.md`: reviewed retry, delta, semantic, and safety contract.
- `docs/curriculum/MPT-CARDIORESPIRATORY-SOURCE-REVIEW.md`: evidence register and educator-review
  checklist.
- `docs/L1_PRODUCT_AND_SYSTEM_CONTEXT.md` through `docs/L4_CODE_DESIGN.md`: architecture.

If memory conflicts with a normative design or an exit gate, the execution plan and L1-L4 design
win; update this file in the same PR that changes those decisions.
