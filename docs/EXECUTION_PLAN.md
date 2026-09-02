# MediPrompt execution plan

**Status:** v0.8 three-subject curriculum activation in PR #28 and under promotion review
**Owner:** Utkarsh Meshram (`utkarsh-senpai`)
**Last updated:** 2026-09-02

## 1. Outcome

Deliver a zero-friction, privacy-first medical speaking practice application that is useful to one
student quickly, can be published at zero recurring infrastructure cost, and has a credible path
to connected Spring Boot and AI capabilities without making them prerequisites for learning.

The execution strategy optimizes for validated learning value in this order:

1. The Unprompted-format mode/subject → spin → timed-speaking tool must work immediately.
2. A selected medical prompt must lead to a completed spoken attempt without accounts or AI.
3. Feedback should cause a better second attempt when the learner enables the enhancement.
4. Weak topics should return at the right time.
5. The system must work on the learner's actual phone, accent, microphone, and network conditions.
6. Connected and generative capabilities may improve the loop only after the basic tool works.

## 2. Evaluation of the updated research memory

### Accepted as design direction

- **Execution-led positioning:** “AI viva examiner” is a crowded category. MediPrompt should win
  through low friction, privacy, feedback quality, and demonstrated learning improvement.
- **Unprompted behavior as the baseline:** mode selection, category selection, a random topic draw,
  and a focused speaking timer are the smallest complete product. Medical and AI features layer on
  top without replacing or delaying it.
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

### v0.1 — Design foundation (complete)

**Branch:** `feature/v0.1-design-foundation`
**Deliverables:** README, execution plan, L1–L4 design, difficulty/depth contract, and
minimum-context implementation handoff.
**Exit gate:** owner approves problem framing, version boundaries, local-first architecture,
content model, safety constraints, and code-level contracts.

No learner code is included. Design review changes stay on this branch until approval.

### v0.2 — Unprompted-format medical core

**Branch:** `feature/v0.2-first-playable`

**Implementation status:** application complete; automated, accessibility, offline, responsive,
content, and dependency-security gates are part of the promotion review. Medical-content
preparation now includes a validated 20-topic cardiovascular/respiratory candidate with 46
source-linked rubrics and three full challenge trios. The exact candidate is active as a
conspicuously labelled public practice beta while qualified educator attestation remains pending;
the approved non-medical interaction fixture is retained only for regression tests.

Deliver a static TypeScript PWA with:

- A one-screen practice surface with mode switch, challenge selector when reviewed variants exist,
  medical-subject selector, topic stage, and quiet settings access.
- Recall Sprint and Deep Research mode choices with concise descriptions; Deep Research uses a
  configurable research duration.
- A **Spin** action and non-repeating random topic draw, including a visible drawing state and
  **Spin again**.
- A disabled timer action until a topic has been drawn.
- Recall Sprint goes directly from a drawn topic to the speaking timer.
- Deep Research goes from a drawn topic to a research countdown with **Done researching**, then a
  ready-to-speak confirmation and the same speaking timer.
- A settings surface for speech and research durations; settings persist locally when storage is
  available and fall back to defaults when it is not.
- A distraction-free speaking view containing the topic, the **What? → So what? → Now what?**
  answer compass, large circular countdown, current instruction, and close/end action.
- A return path to spin again when the timer completes or is closed.
- One hand-authored demonstration topic pack with at least 20 Guided topics and at least three
  complete Guided/Applied/Viva prompt trios. Applied/Viva examples require educator-reviewed
  fictional cases and distinct rubrics; challenge remains hidden when only Guided is available.
- Speaking and Deep Research timers that survive background/foreground transitions.
- No account and no model download.
- Responsive layout, keyboard navigation, reduced motion, and basic offline application shell.
- A separate medical-candidate lane that validates source links, minimum topic/depth coverage,
  empty pre-review attestation, medical-release-gate rejection, explicit public-beta labelling, and
  exclusion of generic interaction content from the static learner artifact.

**Exit gate:** a first-time phone user can infer the mode/challenge/subject → Spin → Start timer
flow, reaches a topic in under five seconds, and completes or exits a timed attempt without
instructions. Challenge, mode, register, support, and accessibility time remain independent. The
basic tool still works with microphone, storage, model, and network capabilities disabled. Unit,
component, accessibility smoke, and mobile viewport tests pass.

All later versions are additive. Their failure, configuration, or removal must not break this v0.2
behavioral contract.

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

### v0.4 — Trustworthy lexical coverage

**Branch:** `feature/v0.4-content-coverage`

Add:

- A deterministic on-device baseline that matches whole accepted phrases or nearby significant
  tokens; partial-word substrings and evidence spread across an answer do not count.
- Rubric-concept coverage with the matched accepted phrase visible as evidence.
- Coverage feedback explicitly labelled as coverage, not correctness.
- One deterministic improvement prescription.
- Distinct “not verifiable” outcomes for a missing transcript and a rubric with no scorable
  accepted phrases.
- A bounded synchronous input and a schema requirement that every concept has at least one
  accepted phrase.

**Exit gate:** golden transcript fixtures produce stable matches; false-positive/false-negative
review is documented; every coverage statement traces to a rubric item and matched phrase; an empty
typed review never becomes zero coverage; the full typed-review and coverage path works offline.

### v0.5 — Grounded refinement loop

**Branch:** `feature/v0.5-gap-score-and-semantic` (historical branch name; the product term is
Refinement Delta)

Add:

- Optional pinned q8 `all-MiniLM-L6-v2` in a shared model-worker asset, layered over the v0.4
  lexical baseline.
- Versioned sentence/rubric evidence and explicit `POSSIBLY_COVERED` results. Until educator
  calibration, semantic evidence is visible but cannot alter numeric coverage.
- Second attempt against the same prompt variant and complete attempt identity.
- Refinement Delta plus newly covered/lost concepts.

**Exit gate:** the public model revision and q8 runtime are verified; malformed/model-failure paths
retain lexical coverage; uncalibrated semantic evidence is not counted; second-attempt comparison
works offline and rejects mismatched variant, difficulty, register, support, rubric, mode, pack,
time, or scoring identities. Educator-labelled calibration remains mandatory before semantic
evidence may change numeric coverage.

### v0.6 — Viva defense ladder

**Branch:** `feature/v0.6-viva-round`

Add:

- An opt-in, progressive viva ladder after attempt review, with one 60-second answer per question.
- A distinct attempt/timer identity for every answer and complete recorder, transcript, exit, and
  stale-result cleanup.
- Lexical target-concept coverage per answer, optional non-counting semantic evidence, and an
  aggregate that excludes unverifiable answers honestly.
- Strictly increasing, one-rubric, all-or-nothing authored ladders that reveal each examiner prompt
  only when it becomes current.
- A source-linked `0.2.0` medical candidate with four draft viva ladders; its educator-review gate
  remains unchanged.

**Exit gate:** the original v0.2-v0.5 loop remains available without microphone/model/network;
typed and recorded vivas complete offline; every active exit releases deadline, stream, clip, and
worker state; stale timers/results cannot advance another answer; coverage names only scored
answers; schema/content/a11y/E2E/bundle/audit gates pass.

**Rebaseline note (2026-09-02):** scheduling, exam countdown, persistent history, export/delete,
additional registers, challenge suggestions, and two extra packs were previously grouped into
v0.6. v0.7 accepts only the first four as one privacy-reviewed local learning-plan outcome.
Registers, suggestions, and additional packs remain unplanned. The v0.8 product priority is the
third complete active subject; the Java content pipeline moves to v0.9.

### v0.7 — Private learning plan and spaced resurfacing

**Branch:** `feature/v0.7-spaced-resurfacing`

Add:

- Off-by-default, explicit consent for local practice history.
- IndexedDB version 2 with an exact topic index, strict untrusted-data parsing, deep-copy
  boundaries, a newest-500-attempt limit, and an in-memory no-storage fallback.
- Transcript-free attempt summaries: only topic/practice identity, review date, aggregate coverage,
  scoring identity, and schedule. Audio, transcript text, concept results, transcript excerpts, and
  embeddings remain session-local.
- A deterministic SM-2-style queue using learner-local calendar dates; unverifiable attempts do
  not change scheduling.
- A compact Learning plan surface that opens the exact next due current-pack topic.
- An optional strict calendar exam date; only a future/today date within 14 days activates
  weakest-coverage triage. Past exams never activate urgency sorting.
- Metadata export, pause-without-delete, and two-step delete-all whose success is verified by a
  zero-record reload.
- Real IndexedDB adapter tests in addition to memory-fallback tests.

**Exit gate:** no persistence occurs without opt-in; no saved/exported record contains transcript
or audio-derived content; due-topic launch revalidates complete pack identity; storage errors never
block practice; retention, migration, strict dates, export/delete, unit, accessibility, content,
build, E2E, bundle, and dependency-audit gates pass.

### v0.8 — Three active curriculum subjects

**Branch:** `feature/v0.8-active-subjects`

Add:

- Merge the separate Respiratory and Cardiovascular app subjects into the curriculum-aligned
  `cardiovascular-and-respiratory-physiotherapy` subject without changing their authored meaning.
- Activate exactly Neuro (35), combined Cardiovascular & Respiratory (26), and Sports (34).
- Author all 34 Sports curriculum candidates with original prompts and non-empty sourced criteria,
  using current 2025-26 guidance where available and identifying older still-current or
  foundational evidence by its actual date.
- Keep the other four subjects visible, disabled, and inaccessible to drawing and saved-plan paths.
- Generate one unsigned educator worksheet for all 95 active topics while preserving `DRAFT`,
  empty reviewers, and a null review date.
- Keep loader, service-worker, schema-source, shell, and artifact limits bounded and synchronized.

**Exit gate:** the catalog remains exactly 265 topics across seven subjects; active counts are
35/26/34 with no empty active rubric; all v0.2-v0.7 behavior works for each active subject; random
draw E2E tests are deterministically bounded; content, unit, accessibility, build, offline,
responsive, audit, and diff checks pass. Software may be promoted as an unreviewed practice beta,
but medical release remains blocked pending educator review.

### v0.9 — Java content pipeline

**Planned branch:** `feature/v0.9-content-compiler`

Add a Java 21/Spring Boot command-line content compiler:

- PDFBox extraction for syllabus candidate labels and source coordinates.
- Preservation of program, year, track, paper, module, exact competency-code candidates, and
  one-based PDF page locators through normalization.
- Duplicate normalization, hierarchy suggestions, primary-domain/context classification
  suggestions, and explicit unresolved-mapping reports.
- Reject-by-default handling for prose, patient identifiers, and unsupported documents.
- A versioned authoring-inventory YAML distinct from the runtime-pack schema.
- Enforced candidate → normalized → educator-reviewed → prompt-ready → published lifecycle gates.
- JSON Schema validation and deterministic YAML → runtime JSON compilation.
- Content provenance manifest and pack-version checks.
- CI validation of every topic pack.
- Difficulty-vector validation, blueprint/preset coverage reporting, and rejection of timer-only
  fake escalation; the compiler never generates cases, prompts, rubrics, or safety ground truth.

**Exit gate:** the supplied exam PDF can produce a reviewable draft without copying source prose;
golden PDF fixtures are reproducible; every educator-reviewed candidate has an exact competency
mapping and page evidence; no extracted content is published without educator, source-use, licence,
and runtime-schema approval.

### v0.10 — Real-user beta hardening

**Planned branch:** `feature/v0.10-beta-hardening`

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
| 3 | v0.4 deterministic lexical coverage and one prescription |
| 4 | v0.5 semantic enhancement, same-identity retry, and Refinement Delta |
| 5 | v0.6 hardened viva defense ladder |
| 6 | v0.7 private learning plan; v0.8 completes three active subjects |
| Next | v0.9 content compiler follows promotion |
| Beta | v0.10 hardening follows observed use on the target learner's devices |

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
- Initial syllabus/topic PDF and its reuse constraints. (2026-08-30: the MPT curriculum has been
  reviewed into 265 candidate practice-topic labels under `docs/curriculum/`; page-level section
  provenance is recorded, while exact per-candidate competency mapping, licence decision, prompts,
  rubrics, and educator approval remain pending.)
- Friend's course/year, exam format, date, target subjects, devices, and preferred language.
- At least one educator review route for rubrics and later calibration.
- Final software/content licence decision before public contributions.
- MediPrompt name/domain/trademark clearance or explicit acceptance of publication risk.
