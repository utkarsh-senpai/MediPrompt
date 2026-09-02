# L3 — Component design

**Status:** Accepted v0.1 baseline
**Scope:** Application components, state, storage, topic packs, and service boundaries
**Audience:** Implementers and reviewers

## 1. Learner PWA components

```mermaid
flowchart TB
    Shell[App shell]
    Session[Basic practice controller]
    Enhanced[Enhanced session orchestrator]
    Topics[Topic selector and random draw]
    Timer[Focused speaking timer]
    Audio[Recorder and audio analyzer]
    STT[Transcription worker]
    Editor[Transcript editor]
    Coverage[Coverage worker]
    Feedback[Feedback composer]
    Compare[Retry comparator]
    Schedule[Scheduler]
    Repo[Local repository]
    Packs[Topic-pack repository]
    SW[Service worker]

    Shell --> Session
    Session --> Topics
    Session --> Timer
    Session -.->|capability enabled| Enhanced
    Enhanced --> Audio
    Audio --> STT
    STT --> Editor
    Editor --> Coverage
    Audio --> Feedback
    Coverage --> Feedback
    Feedback --> Compare
    Compare --> Schedule
    Enhanced <--> Repo
    Topics <--> Packs
    SW --> Packs
```

### App shell

Owns routing, the one-screen responsive frame, install/update state, accessibility announcements,
error boundary, and capability detection. It does not implement learning rules. The primary route
restores or starts one practice session; settings, history, data controls, and pack information are
secondary routes or sheets.

### Basic practice controller

This is the non-negotiable product core. It owns mode and subject selection, `Spin`, drawing state,
topic readiness, `Spin again`, timer entry, the medical answer arc, finish/exit, and repeat. It uses
only bundled topic data and the clock. It must run when microphone, workers, IndexedDB, network, and
all review capabilities are missing or disabled.

### Practice session orchestrator

Progressively wraps the basic controller when enhanced attempts are enabled. It coordinates
recording, transcription, correction, review, retry, and save without changing the base
mode/subject → spin → timer contract. Side effects are exposed through ports so reducer transitions
stay deterministic and testable.

### Topic selector and random draw

Filters enabled topic variants by subject, practice mode, challenge preset, register, and due state.
Random draw uses a shuffled bag per full filter fingerprint: each eligible variant appears once
before reshuffle. A recent-topic exclusion prevents immediate repeats across bag resets. Scheduling
may override random selection only when the learner chooses the due queue. When only one challenge
is available, the selector hides the challenge control rather than showing unavailable choices.

### Timer service

Stores `startedAt`, `deadlineAt`, duration, pause policy, and last announced threshold. Remaining
time is derived from the current monotonic clock. `setInterval` only requests a render; it is never
the source of truth. Browser backgrounding cannot grant extra time. The basic timer surface always
shows the topic, a reviewed challenge-specific arc (`Define -> Explain -> Apply`, `Summarize ->
Reason -> Plan`, or `Prioritize -> Defend -> Safety-net`), a large circular countdown, current
instruction, and a close/end control. Accessibility time adjustments do not mutate challenge.

Deep Research first uses the same deadline engine in a research surface. The learner may select
**Done researching** before expiry; both early completion and expiry lead to a separate
ready-to-speak confirmation. The speech countdown begins only after that confirmation.

### Recorder and audio analyzer

Wraps microphone permission, `MediaRecorder`, playback URL lifetime, and Web Audio analysis. It
emits chunks and observable features rather than interpretations. Voice activity supplies speech
segments and silence intervals. Loudness stability and clipping are reported with device-aware
limitations; the component never labels emotion or confidence.

### Transcription worker

Lazy-loads a pinned local model after explicit activation. It supports progress, cancellation,
timeouts, low-memory errors, and deterministic model metadata. Audio and interim text remain in the
worker boundary until the result is returned. The result always records model/version and may carry
uncertain spans. An absent transcript is a valid failure outcome.

### Transcript editor

Shows the raw result, makes corrections explicit, and records only the final learner-approved text
for coverage. It can highlight low-confidence or glossary terms without auto-correcting medical
meaning. Editing never changes delivery metrics derived from audio.

### Coverage engine

Accepts approved transcript text and one versioned rubric. The v0.4 baseline normalizes a bounded
input, matches whole accepted-phrase token sequences or nearby significant tokens, and returns the
concept identifier plus matched accepted phrase. It rejects partial-word matches, does not combine
distant evidence, and returns an explicit unavailable reason when the transcript or scorable rubric
is absent. It does not invent missing content or claim correctness. v0.5 adds bounded sentence
embeddings and explicit `POSSIBLY_COVERED` evidence while retaining this deterministic fallback.
The uncalibrated beta evidence is not counted; numeric promotion requires a new educator-calibrated,
versioned threshold set.

### Feedback composer

Combines content evidence and delivery observations using deterministic priority rules. It produces:

- a separate content-coverage section;
- a separate delivery-observations section;
- limitations and unverifiable outcomes; and
- exactly one prioritized prescription for the next attempt.

Templates are plain, inspectable copy. A future connected model may phrase an explanation, but it
must consume the same structured evidence and cannot override a failed/unknown result.

### Retry comparator

Compares two attempts for the same topic, prompt, rubric version, mode, and time policy. It reports
newly covered/lost concepts and metric changes. `coverage(attempt2) - coverage(attempt1)` is named
Refinement Delta. If comparison inputs differ, the comparator explains why a delta is unavailable.

### Scheduler

Maintains a bounded due queue using a deterministic SM-2-style recurrence with one- and three-day
starting intervals. Verifiable aggregate coverage maps to recall quality; unverifiable attempts do
not change the schedule. Missed days move an item to due without compounding a penalty. Dates use
strict learner-local calendar semantics.

### Local repository

Provides typed, transaction-based access to IndexedDB. Domain services never call IndexedDB
directly. In v0.7 the repository handles one privacy-minimized schema, export, verified delete-all,
pack references, bounded retention, and explicit quota/corruption failure. Import and broader
migration/recovery workflows remain future scope.

### Topic-pack repository

Loads the allowlisted public-practice pack, verifies schema/version/checksum, and activates a newly
cached pack atomically. Future session records must retain the exact pack/rubric version so later
content updates do not rewrite history.

### Service worker

Uses cache-first for immutable hashed application/model assets, stale-while-revalidate for a pack
index, and network-first with a valid-cache fallback for the HTML entry. It never caches POST
requests or learner data. Updates wait until the session is safe to reload.

## 2. Session state machine

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Drawing: SPIN
    Drawing --> TopicReady: TOPIC_DRAWN
    TopicReady --> Drawing: SPIN_AGAIN
    TopicReady --> Researching: START_RESEARCH (Deep Research)
    Researching --> ReadyToSpeak: RESEARCH_ELAPSED / DONE_RESEARCHING
    ReadyToSpeak --> Speaking: CONFIRM_READY
    TopicReady --> Speaking: START_TIMER (Recall Sprint)
    Speaking --> AttemptComplete: TIMER_ELAPSED / CLOSE_TIMER
    AttemptComplete --> Drawing: SPIN_AGAIN
    AttemptComplete --> Processing: ANALYSE (enhancement enabled)
    Processing --> TranscriptReview: TRANSCRIPT_READY
    Processing --> SelfReview: TRANSCRIPTION_UNAVAILABLE
    TranscriptReview --> Review: APPROVE_TRANSCRIPT
    SelfReview --> Review: COMPLETE_SELF_REVIEW
    Review --> TopicReady: START_RETRY
    Review --> VivaReady: START_VIVA
    VivaReady --> VivaAsking: BEGIN_VIVA_QUESTION
    VivaAsking --> VivaSpeaking: START_VIVA_SPEAKING
    VivaSpeaking --> VivaAttemptComplete: TIMER_ELAPSED / CLOSE_TIMER
    VivaAttemptComplete --> VivaProcessing: RECORDING_READY
    VivaAttemptComplete --> VivaSelfReview: START_TYPED_REVIEW
    VivaProcessing --> VivaTranscriptReview: TRANSCRIPT_READY
    VivaProcessing --> VivaSelfReview: TRANSCRIPTION_UNAVAILABLE
    VivaTranscriptReview --> VivaAnswerReview: APPROVE_VIVA_TRANSCRIPT
    VivaSelfReview --> VivaAnswerReview: COMPLETE_SELF_REVIEW
    VivaAnswerReview --> VivaAsking: NEXT_VIVA_QUESTION
    VivaAnswerReview --> VivaComplete: FINAL_QUESTION
    VivaComplete --> Review: EXIT_VIVA
    Review --> Scheduling: SAVE
    Scheduling --> Complete: SAVED
    Complete --> Drawing: SPIN_AGAIN
    Idle --> [*]
    Complete --> [*]
```

Permission denial, model failure, cancellation, and low memory are events, not exception-only
paths. They lead to recoverable states with recording/playback, typed transcript, or self-review
where safe. A fatal storage error still permits an unsaved session.

`Idle → Drawing → TopicReady → Speaking → AttemptComplete → Drawing` is the v0.2 Recall Sprint
path. Deep Research inserts `Researching → ReadyToSpeak` before `Speaking`. States after
`AttemptComplete` are optional extensions and must be removable without breaking either basic
path. In v0.6, each viva answer owns a unique attempt/timer identity; exiting an active answer
stops the deadline and microphone before restoring the base review.

## 3. Primary data flow

1. `TopicPackRepository` returns an immutable `TopicSnapshot`.
2. Orchestrator creates `PracticeSession` with mode, timers, capability choices, and versions.
3. Recorder emits an attempt-local `AudioHandle`; analyzer emits `DeliveryMetrics`.
4. Transcriber returns `TranscriptDraft`; learner produces `ApprovedTranscript`.
5. Coverage engine returns `CoverageEvidence` for the immutable rubric snapshot.
6. Feedback composer returns `Review` and one `Prescription`.
7. Retry repeats steps 2–6 with `attemptNumber = 2`.
8. Comparator creates `AttemptComparison`; v0.6 may then run a session-local viva ladder.
9. In v0.7, explicit opt-in saves only the main review's privacy-minimized aggregate metadata and
   schedule. Raw audio, approved transcripts, concept evidence, and viva answers remain
   session-local and are revoked/discarded on exit.

## 4. Topic-pack domain

A source pack is review-oriented YAML; runtime packs are compiled JSON. The conceptual hierarchy is:

```text
TopicPack
 ├─ identity: schemaVersion, contentKind, packId, version, title, locale, licence
 ├─ provenance: maintainers, reviewers, sources, reviewedAt
 └─ subjects[]: subjectId, title, availability (`ACTIVE` or `COMING_SOON`)
     └─ topics[]
         ├─ identity: topicId, title, tags
         ├─ curriculum: program, year, track, paper, module, competencyCodes, sourceLocators
         ├─ classification: primaryDomain, contexts[], promptBlueprints[]
         ├─ variants[]: variantId, mode, challengePreset, difficultyProfileVersion, blueprint,
         │              supportLevel, wording, answerArc, timePolicy, caseRef, followUpRefs
         ├─ rubrics[]: rubricId, variantId, register, concepts[], reasoning/safety criteria
         │   └─ concept: conceptId, label, accepted phrases, importance, sourceRefs
         ├─ vivaQuestions[]?: id, level, prompt, targetConceptIds[]
         ├─ commonErrors[]: reviewed wording and sourceRefs
         └─ contraindications/limitations metadata when applicable
```

Rules:

- Identifiers are stable, lowercase, and pack-scoped; display titles may change.
- Missing subject availability means `ACTIVE` only for backward compatibility. The curriculum beta
  declares every subject explicitly. `COMING_SOON` entries remain visible but cannot contribute
  presets, eligible variants, direct launches, learning-plan queues, scoring, or spacing.
- `contentKind` distinguishes medical material from an explicitly non-medical interaction fixture.
  An `APPROVED` medical pack requires a `MEDICAL_REVIEWER`; a content editor cannot promote
  medical claims. A learner-visible `DRAFT` is a practice beta, never an approval state.
- `DRAFT` review candidates carry an empty `reviewers` array and `reviewedAt: null`. This is valid
  authoring state, not malformed approval. `APPROVED` still requires at least one reviewer and a
  real ISO review date; the medical production gate additionally requires `MEDICAL_REVIEWER`.
- Curriculum coordinates preserve source navigation and are never inferred from display order.
- Classification is orthogonal to curriculum coordinates: it supports discovery but never replaces
  year, track, paper, module, competency code, or page evidence.
- Every medical assertion or expected concept in an `ACTIVE` subject links to a pack source entry.
  Empty concepts are allowed only in non-playable `COMING_SOON` authoring shells.
- Accepted phrases are curated equivalents, not model-generated at runtime.
- Common errors are optional and never shown as if detected unless transcript evidence supports it.
- Mode, challenge, and register are independent; every medical-release combination points to a
  reviewed variant-specific rubric. Public-beta rubrics remain explicitly unreviewed.
- `GUIDED`, `APPLIED`, and `VIVA` are versioned difficulty vectors. A scalar difficulty label is not
  sufficient authoring metadata.
- Applied variants require a bounded fictional case. Viva variants additionally require plausible
  alternatives and a reviewed follow-up/evidence update. Real patient details are prohibited.
- A viva ladder has unique IDs, strictly increasing levels, and targets that all resolve to one
  complete variant rubric. Runtime resolution is all-or-nothing for the drawn rubric.
- Additional time and visible rescue scaffolds are accessibility/support choices, not lower
  challenge levels.
- A breaking semantic change increments the pack major version; history keeps its snapshot reference.
- Published packs contain original wording and licence metadata, not copied textbook prose.

Extracted curriculum inventories are a separate authoring input, not a weak form of `TopicPack`.
Each candidate moves through `candidate -> normalized -> prompt-ready-beta -> educator-reviewed ->
published`. Only the last state may be compiled into an approved medical release pack. A
source-grounded `prompt-ready-beta` snapshot may run only through the explicit public-draft gate,
with empty attestation and a persistent non-clinical warning. Earlier incomplete states remain
invalid learner content.

The source-grounded candidate is stored in `content/candidates/`, not `content/packs/`.
Candidate validation applies the runtime schema and demo depth minimums, then asserts that the
medical release gate fails. Build copying allowlists that exact candidate for the public practice
beta and rejects the generic regression fixture from the learner artifact. As of v0.7 the
allowlisted candidate contains the full 265-topic catalog. v0.8 exposes exactly 95 active authored
topics across Neuro (35), combined Cardiovascular & Respiratory (26), and Sports (34), with four
disabled subject shells; its public gate fixes the subject IDs, counts, and availability split.

The recommended primary-domain taxonomy is foundations/science, condition/pathophysiology,
assessment/investigation, clinical reasoning, intervention/rehabilitation,
procedure/perioperative/critical care, population/community/participation,
research/ethics/evidence/professional practice, and sport/performance. Context tags such as age
group, population, body region, and system are multi-valued secondary facets.

## 5. Local persistence and migrations

Settings use `localStorage` from v0.2 because they are small and synchronous, with in-memory
defaults when storage is unavailable. The value is a versioned, schema-validated JSON object;
invalid or newer unsupported data falls back safely instead of blocking practice. v0.7 adds an
off-by-default IndexedDB learning plan with one privacy-minimized store. The broader stores below
remain future architecture, not shipped behavior.

| Store | Key | Purpose | Sensitive content |
| --- | --- | --- | --- |
| `packMetadata` | pack id + version | Checksums, activation and provenance | None |
| `records` (v0.7) | attempt UUID | Topic/practice identity, date, aggregate coverage and schedule only | Bounded learning metadata; no transcript/audio |
| `sessions` (future) | session UUID | Mode/topic/version and completion metadata | Learning record |
| `attempts` (future connected) | attempt UUID | Consent-scoped review artifacts | Personal data |
| `schedule` (future sync) | topic identity | Due date, interval and self-rating | Learning record |
| `modelMetadata` | model id + version | Cache/readiness/benchmark information | None |

Raw audio is not a normal store. If local recording retention is later added, it requires a
separate opt-in store, visible storage use, individual deletion, and migration policy.

The v0.7 database is version 2. It deletes the unreleased v1 object store instead of migrating it
because v1 could contain transcript text and lacked the indexed field it declared. Future
migrations are forward-only, fixture-tested, and transaction-scoped. The v0.7 learning-plan
delete-all clears its IndexedDB records and exam-date key, then verifies a zero-record reload; it
does not misleadingly claim to clear public application/model caches or ordinary accessibility
settings. A future account-wide deletion control must enumerate every additional store explicitly.

## 6. Java content compiler components

```mermaid
flowchart LR
    CLI[Compiler CLI]
    Ingest[Document ingestor]
    Detect[Safety and licence gate]
    Extract[Heading extractor]
    Locate[Curriculum coordinate mapper]
    Normalize[Topic normalizer]
    Draft[Draft writer]
    Validate[Pack validator]
    Compile[Runtime compiler]
    Manifest[Manifest writer]

    CLI --> Ingest --> Detect --> Extract --> Locate --> Normalize --> Draft
    CLI --> Validate --> Compile --> Manifest
```

- **Compiler CLI:** explicit `extract`, `validate`, and `compile` commands; non-zero failure codes.
- **Document ingestor:** PDFBox text/page metadata adapter with encrypted/scanned/empty detection.
- **Safety and licence gate:** detects likely patient identifiers and rejects unsupported or
  unauthorized input; false positives require an explicit reviewed override outside CI.
- **Heading extractor:** proposes headings with page references and confidence, never medical
  rubrics.
- **Curriculum coordinate mapper:** preserves program/year/track/paper/module, exact competency
  code candidates, one-based PDF page locators, and source anomalies. Ambiguous row associations
  remain unresolved review items instead of being guessed.
- **Topic normalizer:** Unicode/case/punctuation normalization, conservative duplicate grouping,
  hierarchy and classification suggestions while retaining source evidence. Suggestions never
  advance lifecycle state.
- **Draft writer:** emits reviewable YAML with `DRAFT` status and unresolved fields.
- **Pack validator:** JSON Schema plus policy checks for sources, licences, stable IDs, reviewers,
  dangling refs, duplicates, and prohibited content.
- **Runtime compiler:** sorts deterministically and strips author-only notes while preserving
  provenance required by the learner.
- **Manifest writer:** records compiler version, input/output checksums, pack identity, and time in
  a reproducible form (timestamps supplied or omitted for byte stability).

## 7. Future connected modules

The Spring Boot service is organized by domain, not controller/service/repository layers spanning
the whole system:

- `identity`: account, session, role and deletion lifecycle;
- `consent`: versioned purposes and withdrawal;
- `progress`: opt-in synchronization and conflict resolution;
- `content`: pack/reviewer workflow and publication records;
- `coaching`: grounded feedback orchestration;
- `speech`: provider-neutral transcription operations;
- `governance`: quotas, audit events, retention and export;
- `admin`: server-rendered Thymeleaf/HTMX reviewer experience.

Each module exposes application ports. Provider, database, HTTP, object storage, and clock code are
adapters. Modules communicate through typed application calls/domain events within the monolith;
there is no internal HTTP. Provider outputs use strict schemas and are rejected if evidence or
required uncertainty fields are missing.

## 8. Error and fallback matrix

| Failure | Learner-visible behavior | Data behavior |
| --- | --- | --- |
| Microphone denied | Continue with timer and self/typed review; link to retry permission | No audio created |
| Unsupported codec | Offer timer-only path and supported-browser guidance | No partial blob retained |
| Model download offline | Continue without transcription; allow retry when online | Valid cached model unchanged |
| Model low memory/timeout | Cancel cleanly; typed transcript or playback remains available | Worker state released |
| Uncertain transcript | Highlight for correction; do not score until approved | Raw and approved text distinguished in memory |
| Coverage unavailable | Delivery/self-review still works; show `NOT_VERIFIABLE` | No fabricated coverage |
| Pack update invalid | Continue previous valid pack | Invalid pack never activated |
| IndexedDB quota/corruption | Continue current session unsaved; offer export/recovery | No silent overwrite |
| Connected provider failure | Fall back to local review or retry later | Idempotency prevents duplicate operation |

## 9. Component-level test responsibilities

- Pure domain services: property and golden-fixture tests.
- State reducer: every allowed/forbidden transition and recovery event.
- Audio: synthetic PCM fixtures for VAD, pause, clipping, and loudness calculations.
- Workers: protocol, cancellation, stale-response, memory failure, and pinned-version tests.
- Coverage: educator-labelled positive, ambiguous, negated, and irrelevant transcript fixtures.
- Challenge: educator-ordered prompt trios, vector/preset validation, scaffold independence,
  evidence-update paths, and rejection of timer-only fake escalation.
- Repository: real IndexedDB adapter/index tests, migrations, quota errors, export and verified
  delete-all. Import remains deferred after v0.7.
- Service worker: offline shell, update activation, old-pack fallback and cache isolation.
- Compiler: synthetic golden PDFs, deterministic output, policy rejection and schema compatibility.
- Connected modules: port contract, authorization, consent, retention and provider-schema tests.

## 10. L3 decisions deferred to implementation spikes

- Exact VAD algorithm and thresholds after representative audio fixtures exist.
- Sentence segmentation behavior for abbreviations and medical units.
- Embedding quantization/threshold per device and rubric dataset.
- Cross-device synchronization conflict policy before v1.1.
- Whether saved local recordings provide enough learning value to justify their privacy/storage cost.
