# MediPrompt execution plan

**Status:** v0.1 design baseline
**Owner:** Utkarsh Meshram (`utkarsh-senpai`)
**Last updated:** 2026-08-30

## 1. Outcome

Deliver a zero-friction, privacy-first medical speaking practice application that is useful to one
student quickly, can be published at zero recurring infrastructure cost, and has a credible path
to connected Spring Boot and AI capabilities without making them prerequisites for learning.

The execution strategy optimizes for validated learning value in this order:

1. A prompt must lead to a completed spoken attempt.
2. Feedback must cause a better second attempt.
3. Weak topics must return at the right time.
4. The system must work on the learner's actual phone, accent, microphone, and network conditions.
5. Connected and generative capabilities may improve the loop only after the local loop works.

## 2. Evaluation of the updated research memory

### Accepted as design direction

- **Execution-led positioning:** “AI viva examiner” is a crowded category. MediPrompt should win
  through low friction, privacy, feedback quality, and demonstrated learning improvement.
- **Content/delivery separation:** this is both pedagogically clearer and technically testable.
- **Browser-local default:** it gives a defensible zero-cost and privacy story.
- **Transcript correction before scoring:** this prevents speech-recognition errors from silently
  becoming learner errors and is particularly important for medical terminology and varied accents.
- **Coverage rather than correctness in local mode:** semantic similarity can show that a concept
  was expressed; it cannot independently certify medical truth.
- **One prescription followed by a retry:** action is more valuable than a large metrics dashboard.
- **Human-reviewed open topic packs:** reviewed content is the ground truth; models are supporting
  tools.
- **`whisper-base.en` as the leading candidate:** accuracy is more important than saving a modest
  model download once it is cached.
- **Spring Boot as content/connected infrastructure:** Java adds architectural value without
  forcing a server into the free learner path.

### Adjusted before implementation

1. **Do not lock model accuracy from third-party WER figures.** Reported accented-English numbers
   depend on dataset, decoding, quantization, browser runtime, and audio quality. `base.en` remains
   the candidate default, but v0.3 has a go/no-go benchmark on representative Indian-English
   medical speech and low/mid-range phones.
2. **Rename the second-attempt metric.** `attempt2 coverage − attempt1 coverage` measures a
   **Refinement Delta**, not the knowledge-to-speech gap. The latter is a broader construct that
   needs an independent knowledge baseline or educator judgment. “Gap Score” is reserved until it
   is empirically defined.
3. **Treat on-device Web Speech as an enhancement, not a dependable fallback.** Browser support,
   language packs, availability, and behavior may change. Typed/corrected transcripts and local
   Whisper are the contractual paths.
4. **Defer pgvector.** The connected backend does not need a vector database until content scale
   or retrieval evaluation demonstrates a need. PostgreSQL is sufficient initially.
5. **Call the first educator comparison a feasibility/calibration study.** Fifty to one hundred
   attempts can reveal error modes but cannot prove broad educational efficacy. Strong efficacy
   claims require a separately designed study.
6. **Keep regulatory statements conservative.** The product will implement no-emotion and
   no-patient-data constraints now; formal legal review is required before institutional or minor
   use in each target jurisdiction.

## 3. Version roadmap

Versions are sequential. A later feature branch begins only after the preceding version is merged
into `develop`, so it inherits the reviewed decisions and implementation.

### v0.1 — Design foundation (current)

**Branch:** `feature/v0.1-design-foundation`
**Deliverables:** README, execution plan, L1–L4 design.
**Exit gate:** owner approves problem framing, version boundaries, local-first architecture,
content model, safety constraints, and code-level contracts.

No learner code is included. Design review changes stay on this branch until approval.

### v0.2 — First playable

**Planned branch:** `feature/v0.2-first-playable`

Deliver a static TypeScript PWA with:

- Prompt, speaking-timer, and basic review states.
- Recall Sprint mode.
- Subject/topic filtering and non-repeating random draw.
- One hand-authored demonstration topic pack with at least 20 topics.
- Preparation and speaking timers that survive background/foreground transitions.
- No account and no model download.
- Responsive layout, keyboard navigation, reduced motion, and basic offline application shell.

**Exit gate:** a first-time phone user reaches a topic in under five seconds and completes a timed
attempt without instructions. Unit, component, accessibility smoke, and mobile viewport tests pass.

### v0.3 — Private speech intelligence

**Planned branch:** `feature/v0.3-private-speech`

Add:

- Microphone permission and failure handling.
- Local WebM recording and playback.
- Web Audio delivery measurements and voice-activity detection.
- Lazy, cancellable, cached browser-local `whisper-base.en` transcription worker.
- Transcript review and correction before any content evaluation.
- Duration, WPM, filler, repetition, silence, pause, loudness, and clipping observations.
- Explicit unsupported-device and low-memory fallbacks.

**Exit gate:** representative Android, desktop, and low/mid-range device tests complete without UI
freezes; benchmark data is published; no raw audio leaves the browser; speech metrics are
deterministic within documented tolerances.

**Decision gate:** if `base.en` is too slow or large on the target phone, test tiny/base model tiers
or make transcription optional. Do not hide failure behind a fabricated transcript.

### v0.4 — Grounded refinement loop

**Planned branch:** `feature/v0.4-grounded-refinement`

Add:

- Quantized `all-MiniLM-L6-v2` in a worker.
- Rubric concept and synonym matching with visible evidence.
- Coverage feedback explicitly labelled as coverage, not correctness.
- One deterministic improvement prescription.
- Second attempt against the same prompt.
- Refinement Delta and a sentence/rubric evidence view.
- “Not verifiable from this rubric” outcome.

**Exit gate:** golden transcript fixtures produce stable matches; false-positive/false-negative
review is documented; every feedback statement traces to an input metric or rubric item; second
attempt comparison works offline.

### v0.5 — Viva and retention

**Planned branch:** `feature/v0.5-viva-retention`

Add:

- Viva Round with reviewed Recall → Explain → Apply → Differentiate → Defend questions.
- Examiner, junior, and patient teach-back register.
- Exam date and daily queue.
- Simple deterministic 1/3/7/14-day scheduling adjusted by learner self-rating and coverage.
- Local progress, topic history, export, and delete-all controls.
- Two additional hand-authored content packs.

**Exit gate:** the queue is deterministic and timezone-safe; missed days do not punish the learner;
all progress can be exported/deleted; three packs pass schema, source, and content-review gates.

### v0.6 — Java content pipeline

**Planned branch:** `feature/v0.6-content-compiler`

Add a Java 21/Spring Boot command-line content compiler:

- PDFBox extraction for syllabus/topic-name candidates.
- Duplicate normalization and hierarchy suggestions.
- Reject-by-default handling for prose, patient identifiers, and unsupported documents.
- Draft YAML output requiring human review.
- JSON Schema validation and deterministic YAML → runtime JSON compilation.
- Content provenance manifest and pack-version checks.
- CI validation of every topic pack.

**Exit gate:** the supplied exam PDF can produce a reviewable draft without copying source prose;
golden PDF fixtures are reproducible; no extracted content is published without approval.

### v0.7 — Real-user beta hardening

**Planned branch:** `feature/v0.7-beta-hardening`

Add/fix only what is required by observed use:

- Four-to-six-week friend beta workflow.
- Indian-English medical glossary and transcription corrections derived from consented test cases.
- Cross-browser and offline recovery.
- Performance budgets and installability.
- WCAG 2.2 AA audit.
- Privacy notice, educational disclaimer, consent language, and content licences.
- Crash-safe local migrations and versioned pack updates.

**Exit gate:** the target user completes repeated sessions independently; critical usability defects
are closed; no known P0/P1 privacy, accessibility, or data-loss issue remains.

### v1.0 — Public privacy-first release

**Planned branch:** `release/v1.0.0`

Promote the validated PWA to `main`, publish GitHub Pages, tag `v1.0.0`, and include:

- Three reviewed topic packs.
- Complete local prompt → speech → corrected transcript → review → retry → schedule loop.
- Contributor and pack-authoring documentation.
- Security, privacy, threat-model, licence, and data-deletion documentation.
- Public device/model benchmark and known limitations.
- Release checks and rollback instructions.

**Exit gate:** release checklist passes from a clean browser on supported phone and desktop devices.

### v1.1 — Connected platform foundation

**Planned branch:** `feature/v1.1-connected-foundation`

Add an optional Spring Boot modular monolith:

- Authentication, consent versioning, and account deletion.
- Encrypted transport and server-side session controls.
- Opt-in progress synchronization.
- PostgreSQL/Flyway persistence.
- Quotas, audit events, retention jobs, and provider-neutral ports.
- Thymeleaf/HTMX educator/content administration.

Local guest mode remains first-class and does not require the server.

### v1.2 — Source-grounded connected coaching

**Planned branch:** `feature/v1.2-connected-coaching`

Add opt-in provider adapters for higher-quality transcription and medical feedback. Responses must
use reviewed source excerpts, structured output, claim-level evidence, uncertainty, and a
`NOT_VERIFIABLE` path. Raw audio is deleted by default after processing. Keys stay server-side;
self-hosted deployments use environment secrets.

### v1.3 — Realtime viva

**Planned branch:** `feature/v1.3-realtime-viva`

Add low-latency examiner conversation with ephemeral client credentials, reviewed examiner policy,
time/turn limits, graceful fallback to non-realtime mode, and transcript/audio consent controls.
Realtime output remains coaching, never an official grade.

### v2.0 — Evidence and community release

**Planned branch:** `feature/v2.0-evidence-community`

- Educator-reviewed calibration dataset with consent and de-identification.
- Automated-versus-educator agreement, subgroup error analysis, and model-card reporting.
- Topic-pack contribution workflow and maintainer governance.
- Institution-ready deployment assessment only after legal/security review.
- A study protocol appropriate to the strength of any efficacy claim.

## 4. Branch and release workflow

```text
develop
  └── feature/v0.1-design-foundation ── PR ──► develop
        (merge and review)
      └── feature/v0.2-first-playable ── PR ──► develop
            ...sequential versions...
develop ── release/v1.0.0 ── PR ──► main ── tag v1.0.0
```

Rules:

1. Branch from the latest `develop` only.
2. One coherent version outcome per branch and PR.
3. Do not create future branches early.
4. Rebase or merge `develop` before final review if the base moves.
5. Version acceptance criteria and evidence belong in the PR.
6. No direct pushes to `main` after it is created.
7. Release fixes merge to `main` and are immediately reconciled back into `develop`.

## 5. Delivery cadence

The four-to-six-week beta target assumes focused solo development after v0.1 approval:

| Week | Target |
| --- | --- |
| 1 | v0.2 first playable |
| 2 | v0.3 recording, deterministic delivery metrics, initial STT benchmark |
| 3 | v0.4 coverage and retry loop |
| 4 | v0.5 viva ladder, scheduling, three draft packs |
| 5 | v0.6 PDF/content compiler and first real syllabus pack |
| 6 | v0.7 friend beta fixes, accessibility, performance, and privacy hardening |

Dates may move; exit gates do not. If the local model blocks phone usability, ship a useful typed or
self-reviewed transcript path rather than delaying the entire learning loop.

## 6. Definition of done for every version

- Scope and exclusions are reflected in code and documentation.
- Acceptance tests cover the version's primary user journey.
- Unit and integration tests pass in CI.
- Accessibility and privacy impacts are reviewed.
- Failure and fallback behavior are visible to the learner.
- No secret, raw private audio, or identifiable patient information is committed or logged.
- Performance changes are measured on representative devices.
- Documentation and architecture decisions match the shipped behavior.
- The version PR contains validation evidence and known limitations.

## 7. Product measures

Early measures avoid vanity metrics:

- Time from landing to first topic.
- Prompt-to-completed-attempt conversion.
- Percentage of attempts followed by a retry.
- Refinement Delta distribution.
- Due-topic completion and return rate.
- Learner-rated usefulness of the single prescription.
- Transcription correction rate by medical term and device—not an accent grade.
- Coverage-match disagreement against human review.
- Crash, model-load failure, and offline recovery rates.

The v2.0 evidence work may introduce educator agreement and learning-retention outcomes, but those
must not be claimed before the study design supports them.

## 8. Current blockers and inputs

- Owner review of v0.1 design.
- Initial syllabus/topic PDF and its reuse constraints.
- Friend's course/year, exam format, date, target subjects, devices, and preferred language.
- At least one educator review route for rubrics and later calibration.
- Final software/content licence decision before public contributions.
- MediPrompt name/domain/trademark clearance or explicit acceptance of publication risk.
