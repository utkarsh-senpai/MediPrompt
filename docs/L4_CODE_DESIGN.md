# L4 — Code design

**Status:** Accepted v0.1 baseline
**Scope:** Repository layout, contracts, algorithms, schemas, tests, and acceptance mapping
**Audience:** Implementers and code reviewers

This document fixes boundaries and contracts needed to begin implementation. Names may change in a
reviewed refactor; privacy, evidence, deterministic behavior, and fallback semantics may not drift
silently.

## 1. Proposed monorepo

```text
MediPrompt/
├── apps/
│   └── learner-web/
│       ├── public/
│       ├── src/
│       │   ├── app/                 # shell, routes, capability detection
│       │   ├── practice/            # state machine and session UI
│       │   ├── audio/               # recorder, analysis, worker protocols
│       │   ├── transcript/          # worker adapter and correction UI
│       │   ├── coverage/            # embeddings, evidence, thresholds
│       │   ├── feedback/            # deterministic review/prescription
│       │   ├── scheduling/          # due queue and local-date rules
│       │   ├── content/             # runtime schema and pack repository
│       │   ├── settings/            # localStorage preferences + memory fallback
│       │   ├── platform/            # local settings, IndexedDB and exam-date adapters
│       │   └── test/                # shared fixtures and test helpers
│       └── e2e/
├── tools/
│   └── content-compiler/
│       ├── src/main/java/io/mediprompt/content/
│       └── src/test/
├── content/
│   ├── schema/
│   ├── source-packs/                 # reviewed YAML
│   ├── runtime-packs/                # generated JSON
│   └── fixtures/
├── packages/
│   └── contracts/                    # generated/shared JSON Schemas
├── docs/
├── .github/workflows/
├── package.json
├── pnpm-lock.yaml
├── pom.xml                            # Java aggregator when compiler starts
└── README.md
```

Generated files carry a header and are checked for drift in CI. TypeScript never imports Java
classes; JSON Schema and golden fixtures are the language boundary.

## 2. Core TypeScript contracts

```ts
type PracticeMode = "RECALL_SPRINT" | "VIVA_ROUND" | "DEEP_RESEARCH" | "TEACH_BACK";
type ChallengePreset = "GUIDED" | "APPLIED" | "VIVA";
type Register = "EXAMINER" | "JUNIOR" | "PATIENT";
type SupportLevel = "FULL" | "FADING" | "MINIMAL";

interface TopicRef {
  packId: string;
  packVersion: string;
  subjectId: string;
  topicId: string;
  variantId: string;
  difficultyProfileVersion: string;
  promptId: string;
  rubricId: string;
}

interface TimePolicy {
  preparationSeconds?: number;
  speakingSeconds: number;
  researchSeconds?: number;
}

interface SpeechArcStep {
  id: string;
  label: string;
}

interface UserSettings {
  schemaVersion: 1;
  speakingSeconds: number;
  researchSeconds: number;
}

interface PracticeSelection {
  mode: PracticeMode;
  challenge: ChallengePreset;
  subjectId: string;
  register?: Register;
}

interface SettingsStore {
  load(): UserSettings;
  save(settings: UserSettings): void;
  clear(): void;
}

interface PracticeSession {
  id: string;
  topic: TopicRef;
  mode: PracticeMode;
  challenge: ChallengePreset;
  supportLevel: SupportLevel;
  register?: Register;
  timePolicy: TimePolicy;
  attemptIds: string[];
  createdAt: string;
  completedAt?: string;
}

interface TranscriptDraft {
  text: string;
  source: "LOCAL_WHISPER" | "WEB_SPEECH" | "TYPED";
  model?: { id: string; version: string; quantization: string };
  uncertainRanges: Array<{ start: number; end: number }>;
}

interface ApprovedTranscript {
  rawText?: string;
  text: string;
  approvedAt: string;
  wasEdited: boolean;
}

interface DeliveryMetrics {
  durationMs: number;
  spokenMs?: number;
  wordsPerMinute?: number;
  fillerCount?: number;
  repeatedPhraseCount?: number;
  pauses: Array<{ startMs: number; durationMs: number; kind: "MID_CLAUSE" | "BOUNDARY" | "UNKNOWN" }>;
  clippingRatio?: number;
  loudnessVariationDb?: number;
  limitations: string[];
}

interface ConceptEvidence {
  conceptId: string;
  status: "COVERED" | "POSSIBLY_COVERED" | "NOT_FOUND";
  transcriptSentence?: string;
  similarity?: number;
  threshold?: number;
  sourceRefs: string[];
}

interface CoverageResult {
  status: "AVAILABLE" | "NOT_VERIFIABLE";
  rubricId: string;
  model?: { id: string; version: string; quantization: string };
  evidence: ConceptEvidence[];
  coveredWeight?: number;
  totalWeight?: number;
  limitations: string[];
}

interface Prescription {
  id: string;
  kind: "CONTENT" | "STRUCTURE" | "PAUSE" | "PACE" | "FILLER" | "TIME" | "SELF_REVIEW";
  message: string;
  evidenceIds: string[];
}
```

Scores are internal numeric evidence, not a learner grade. Persisted records include algorithm,
pack, threshold, and model versions needed to reproduce a result.

`LocalStorageSettingsStore` owns one namespaced, schema-validated JSON value and falls back to an
in-memory default store when browser storage is unavailable or throws. It contains no transcript,
audio, attempt, account, or medical-learning data. `clear()` participates in the user-facing
delete-all workflow.

`IndexedDbHistoryStore` is opt-in at the orchestration boundary. Its exact v0.7 record contains
topic/practice identity, review timestamp, aggregate coverage/scoring identity, and nullable
schedule only. The materialized topic index must equal the canonical topic fingerprint. Audio,
transcripts, concept results, semantic transcript excerpts, and embeddings are prohibited.

## 3. Session reducer

```ts
type SessionState =
  | { name: "IDLE"; selection: PracticeSelection }
  | { name: "DRAWING"; selection: PracticeSelection; requestId: string }
  | { name: "TOPIC_READY"; topic: TopicSnapshot; speechArc: SpeechArcStep[] }
  | { name: "RESEARCHING"; attempt: AttemptDraft; deadlineAt: number }
  | { name: "READY_TO_SPEAK"; attempt: AttemptDraft }
  | { name: "SPEAKING"; attempt: AttemptDraft; deadlineAt: number }
  | { name: "ATTEMPT_COMPLETE"; attempt: AttemptDraft }
  | { name: "PROCESSING"; attempt: AttemptDraft; audio?: AudioHandle }
  | { name: "TRANSCRIPT_REVIEW"; attempt: AttemptDraft; draft: TranscriptDraft }
  | { name: "SELF_REVIEW"; attempt: AttemptDraft; reason: FallbackReason }
  | { name: "REVIEW"; attempt: CompletedAttempt; review: Review }
  | { name: "SCHEDULING"; attempts: CompletedAttempt[] }
  | { name: "COMPLETE"; summary: SessionSummary };

type SessionEvent =
  | { type: "CHANGE_SELECTION"; selection: PracticeSelection }
  | { type: "SPIN"; requestId: string }
  | { type: "TOPIC_DRAWN"; requestId: string; topic: TopicSnapshot }
  | { type: "START_RESEARCH"; now: number }
  | { type: "RESEARCH_ELAPSED"; now: number }
  | { type: "DONE_RESEARCHING"; now: number }
  | { type: "CONFIRM_READY"; now: number }
  | { type: "START_TIMER"; now: number }
  | { type: "TIMER_ELAPSED"; now: number }
  | { type: "CLOSE_TIMER"; now: number }
  | { type: "SPIN_AGAIN"; requestId: string }
  | { type: "ANALYSE" }
  | { type: "TRANSCRIPT_READY"; draft: TranscriptDraft }
  | { type: "TRANSCRIPTION_UNAVAILABLE"; reason: FallbackReason }
  | { type: "APPROVE_TRANSCRIPT"; transcript: ApprovedTranscript }
  | { type: "COMPLETE_SELF_REVIEW"; review: SelfReview }
  | { type: "START_RETRY"; now: number }
  | { type: "SAVE" }
  | { type: "SAVED"; summary: SessionSummary }
  | { type: "NEXT_TOPIC"; topic: TopicSnapshot };
```

The v0.2 reducer implements `IDLE → DRAWING → TOPIC_READY → SPEAKING → ATTEMPT_COMPLETE` for Recall
Sprint. Deep Research inserts `RESEARCHING → READY_TO_SPEAK` before `SPEAKING`. `START_TIMER` and
`START_RESEARCH` are invalid until `TOPIC_DRAWN` for the current request has succeeded. Optional
intelligence continues from `ATTEMPT_COMPLETE` into `PROCESSING`.

`reduceSession(state, event)` is pure. Effects are returned as commands such as
`REQUEST_MICROPHONE`, `START_TIMER`, `TRANSCRIBE`, `ANALYSE`, `PERSIST`, or `DISCARD_AUDIO` and run
by the orchestrator. Every asynchronous command carries `sessionId`, `attemptId`, and `requestId`;
late worker responses that do not match the current state are ignored.

## 4. Algorithms

### Deadline timer

```text
start(now, duration) => deadline = now + duration
remaining(now)       => max(0, deadline - now)
tick                  => render remaining(current monotonic time)
visibility restored   => recompute; emit deadline event once when remaining == 0
```

Wall-clock ISO instants identify reviewed attempts; strict learner-local `YYYY-MM-DD` values drive
due/exam calendar arithmetic. A monotonic clock is used within an active timer. Tests inject both
clocks. Main speaking defaults to 60 seconds and Deep Research to 600
seconds. Every v0.6 viva answer uses a fixed 60-second window and its unique attempt ID as the
deadline request ID; a late timer event from an earlier answer is ignored.

### Non-repeating random draw

1. Build sorted eligible variant IDs and a canonical fingerprint over pack IDs/versions, subject,
   challenge, implemented mode, and register when it changes eligibility.
2. Load the remaining bag through an injected `BagStore`; v0.2 uses session memory and later
   versions may add validated persistence.
3. Remove duplicate/unknown IDs. If the candidate set changed, intersect the bag and
   append/shuffle newly eligible IDs.
4. If empty, Fisher–Yates shuffle all candidates with an injectable cryptographic/random source.
5. Move a recently drawn ID to the end when at least two alternatives exist.
6. Pop one ID and save the remaining bag through the port.

Deterministic seeded randomness is used in tests. Production uses an unbiased index derived from
`crypto.getRandomValues`; unavailable Web Crypto falls back visibly to a deterministic ordering,
not implicit `Math.random`.

### Audio metrics

- Convert decoded audio to mono floating PCM for analysis; preserve the recording only for
  attempt-local playback.
- Calibrate/normalize measurements conservatively; do not compare absolute loudness across
  devices unless calibration supports it.
- VAD returns speech intervals. A pause is a non-speech interval bounded by speech, above a
  calibrated minimum and below the terminal-silence limit.
- Classify pause placement only when transcript timestamps and punctuation align reliably;
  otherwise use `UNKNOWN`.
- `WPM = approvedTranscriptWordCount / (spokenMs / 60000)` when both values are available. Label
  transcript dependency and avoid false precision.
- A filler matcher uses locale/pack-aware token patterns and counts evidence spans. It does not
  penalize medically meaningful hesitation words inside terminology.
- Repetition uses normalized token n-grams with stop-phrase exclusions and reports repeated spans.
- Clipping ratio is samples at/near full-scale divided by all samples; thresholds are fixture-
  calibrated.

Every optional metric can be absent with a limitation. Absence never becomes zero.

### Coverage matching

v0.4 always runs a bounded, deterministic lexical baseline first:

```text
tokens = normalizeUnicode(approvedTranscript, maxCharacters = 20_000)
if tokens are empty: NOT_VERIFIABLE(NO_TRANSCRIPT)
for each rubric concept:
    require at least one accepted phrase
    match an accepted phrase as a whole token sequence, or
    match all significant phrase tokens inside a bounded local window
    never match a partial word or tokens scattered across the full answer
```

The matched accepted phrase is retained as visible evidence. This baseline can establish that a
listed idea was mentioned; it does not infer correctness, contradiction, or clinical safety.
v0.5 adds the semantic evidence path below without removing the lexical fallback:

```text
sentences = segment(normalize(approvedTranscript))
for each rubric concept:
    phrases = [label, ...acceptedPhrases]
    best = max(cosine(embed(sentence), embed(phrase))) across pairs
    if explicit negation/contradiction rule applies: do not mark covered
    if an educator-calibrated coveredThreshold exists and best >= it: COVERED with best sentence
    else if best >= possibleThreshold: POSSIBLY_COVERED with best sentence
    else: NOT_FOUND
weightedCoverage = sum(weights of COVERED) / sum(all concept weights)
```

Thresholds are versioned. The v0.5 public beta deliberately disables semantic-to-`COVERED`
promotion until educator-labelled fixtures calibrate it; it surfaces only “possibly covered”
sentence/rubric evidence, which does not contribute to Refinement Delta. Exact curated phrase
matching may establish coverage, but it still cannot prove broader medical correctness.

### Prescription selection

Generate eligible candidates, then choose the first by stable priority and largest evidence gap:

1. Required high-importance content not found.
2. Answer structure/time failure that obscures most content.
3. Excessive long mid-clause pauses with reliable alignment.
4. Pace materially outside a broad calibrated intelligibility band.
5. High filler/repetition evidence.
6. Learner-selected self-review goal.

Tie-break by rubric order or stable metric identifier. Copy describes an action for attempt two,
for example “Lead with the definition, then cover causes and complications.” It does not describe
identity (“you are unconfident”) or issue multiple instructions.

### Refinement Delta

```text
if same topic + variant + difficulty profile + prompt + rubric + pack/version + mode + register + support + time policy + scoring identity:
    delta = attempt2.weightedCoverage - attempt1.weightedCoverage
else:
    delta = unavailable(reason)
```

Show the numeric delta alongside newly covered/lost concepts and limitations. Do not call it a
knowledge gap, grade, or evidence of long-term learning.

### Spaced scheduling

```text
quality = aggregate coverage band in 0..5; unverifiable => null
quality < 3        => repetitions = 0; interval = 1 day
quality >= 3       => update clamped SM-2 easiness; intervals begin 1, then 3 days
later interval     => round(previous interval * updated easiness)
dueDate            => learner-local review calendar date + interval
```

The recurrence is deterministic and fixture-tested. A missed due date does not compound a penalty.
Within 14 days before a non-past exam, due topics are secondarily triaged by weakest coverage.

## 5. Runtime topic-pack schema

### Authoring-inventory boundary

Curriculum extraction produces an authoring inventory, not the runtime schema shown below. The
current MPT file under `docs/curriculum/` is deliberately `runtimeCompatible: false`; empty prompt
and rubric arrays are evidence that content has not been authored, not valid learner content.

Minimum candidate shape for the planned v0.8 authoring schema:

```yaml
schemaVersion: authoring-inventory/1.0
documentType: curriculum-authoring-inventory
publicationStatus: REFERENCE_ONLY
runtimeCompatible: false
candidates:
  - candidateId: stable-lowercase-id
    title: Concise candidate label
    lifecycle: candidate
    curriculum:
      program: MPT
      year: 2
      track: neuro
      paper: III
      module: pediatric-neurology
      competencyCodes: [PPNP1.1]
      sourceLocators:
        - { sourceId: src-curriculum, pdfPages: [90] }
    classification:
      primaryDomain: foundations-science
      contexts: [pediatric]
      promptBlueprints: [explain-concept]
```

Inventory validation permits unresolved mappings only in `candidate` or `normalized` state. It
requires exact competency code and page locators before `educator-reviewed`, and original prompts,
rubrics, medical sources, licence approval, and reviewer evidence before `prompt-ready`. The
compiler accepts only `published` candidates and emits only an `APPROVED` runtime pack. Source PDF
ordering is never used as an implicit relationship.

The normative schema will live at `content/schema/topic-pack.schema.json`. Minimum runtime shape:

```json
{
  "schemaVersion": "1.0",
  "contentKind": "MEDICAL",
  "packId": "demo-foundations",
  "version": "1.0.0",
  "title": "Medical Foundations Demo",
  "locale": "en-IN",
  "licence": { "id": "CC-BY-4.0", "attribution": "..." },
  "review": {
    "status": "APPROVED",
    "reviewers": [{ "id": "reviewer-id", "role": "MEDICAL_REVIEWER" }],
    "reviewedAt": "2026-08-30"
  },
  "sources": [
    { "sourceId": "src-1", "citation": "...", "url": "https://...", "accessedAt": "2026-08-30" }
  ],
  "subjects": [
    {
      "subjectId": "physiology",
      "title": "Physiology",
      "topics": [
        {
          "topicId": "cardiac-cycle",
          "title": "Cardiac cycle",
          "variants": [{
            "variantId": "cardiac-cycle-guided-v1",
            "challengePreset": "GUIDED",
            "difficultyProfileVersion": "difficulty-profile/1.0",
            "blueprint": "explain-concept",
            "promptId": "explain-cardiac-cycle",
            "mode": "RECALL_SPRINT",
            "supportLevel": "FULL",
            "wording": "Explain the cardiac cycle in a structured sequence.",
            "answerArc": ["define", "explain", "apply"],
            "timePolicy": { "speakingSeconds": 60 },
            "rubricId": "examiner-core"
          }],
          "rubrics": [{
            "rubricId": "examiner-core",
            "variantId": "cardiac-cycle-guided-v1",
            "register": "EXAMINER",
            "concepts": [{
              "conceptId": "phase-sequence",
              "label": "Names the phases in sequence",
              "acceptedPhrases": ["..."],
              "weight": 2,
              "sourceRefs": ["src-1"]
            }]
          }]
        }
      ]
    }
  ]
}
```

Schema restrictions include `additionalProperties: false`, semantic pack versions, valid locale,
unique stable IDs, versioned challenge profiles, bounded timer values, non-empty original wording,
resolvable source references, and allowed review statuses. The normal medical release gate rejects
anything not `APPROVED`; the separate public-practice-beta gate accepts only one allowlisted,
source-grounded `MEDICAL`/`DRAFT` snapshot with empty attestation. `contentKind` is required; an approved `MEDICAL` pack requires at least one
`MEDICAL_REVIEWER`, while `CONTENT_EDITOR` approval is limited to
`NON_MEDICAL_INTERACTION` fixtures. Applied variants require a reviewed fictional case. Viva
variants additionally require plausible alternatives and a reviewed follow-up or evidence update.
Validator rules reject identical prompt variants that claim greater difficulty only through a
shorter timer.
Viva-question IDs are unique, ladder levels increase strictly, and every target concept in a
non-empty ladder must resolve together to one variant rubric. Runtime lookup repeats this as an
all-or-nothing check against the drawn rubric; malformed partial ladders are never exposed.

Review metadata models absence honestly: an unattested `DRAFT` has `reviewers: []` and
`reviewedAt: null`. The schema condition requires at least one reviewer and a non-null ISO date for
`APPROVED`; medical release validation then enforces the role/content-kind rule. Medical review
candidates live under `content/candidates/`, must meet the v0.2 topic/trio minimums, and must fail
the medical release gate. The v0.3 beta copy step allowlists the exact 20-topic candidate; artifact
and service-worker validation require `DRAFT`, no reviewers/date, and exclude generic packs.

## 6. Java compiler contracts

```java
public interface DocumentTextExtractor {
    ExtractedDocument extract(Path input) throws UnsupportedDocumentException;
}

public interface InputPolicyGate {
    PolicyDecision evaluate(ExtractedDocument document, SourceDeclaration source);
}

public interface TopicCandidateExtractor {
    List<TopicCandidate> extract(ExtractedDocument document);
}

public interface CurriculumCoordinateMapper {
    MappingResult map(List<TopicCandidate> candidates, ExtractedDocument document);
}

public interface TopicNormalizer {
    NormalizationResult normalize(List<TopicCandidate> candidates);
}

public interface PackValidator {
    ValidationReport validate(SourcePack pack);
}

public interface RuntimePackCompiler {
    CompiledPack compile(PublishedAuthoringPack pack);
}

public interface ProvenanceManifestWriter {
    byte[] write(CompilationContext context, CompiledPack pack);
}
```

Representative implementations:

- `PdfBoxDocumentTextExtractor`
- `RejectByDefaultInputPolicyGate`
- `LayoutAwareHeadingExtractor`
- `EvidencePreservingCurriculumCoordinateMapper`
- `ConservativeTopicNormalizer`
- `JsonSchemaAndPolicyPackValidator`
- `DeterministicRuntimePackCompiler`
- `Sha256ProvenanceManifestWriter`

The Spring Boot application uses `WebApplicationType.NONE` and Picocli or Spring Shell only after a
small spike. Exit codes are stable: `0` success, `2` validation failure, `3` policy rejection,
`4` unsupported input, and `5` internal failure. Logs never print full document text.

Commands:

```text
mediprompt-content extract --input syllabus.pdf --source source.yml --output inventory.yml
mediprompt-content validate --profile inventory --input inventory.yml
mediprompt-content validate --profile publication --input published-pack.yml
mediprompt-content compile --input published-pack.yml --output runtime/ --manifest manifest.json
```

`extract` records one-based PDF pages and unresolved row associations. `compile` accepts only
`published` authoring input with `APPROVED` review and writes to a staging directory before atomic
replace.

## 7. Future connected contracts

### Browser-facing REST

```text
POST   /api/v1/sync/batches              idempotent progress sync
GET    /api/v1/sync/changes?cursor=...   incremental changes
POST   /api/v1/coaching/jobs             opt-in grounded coaching
GET    /api/v1/coaching/jobs/{id}        status/result with evidence
DELETE /api/v1/coaching/jobs/{id}        delete artifacts/result
GET    /api/v1/account/export            portable export
DELETE /api/v1/account                   deletion workflow
```

Every mutation uses authentication, consent-purpose checks, object authorization, request-size
limits, an idempotency key, and a correlation ID. Error bodies use stable problem codes without
learner content.

### Provider ports

```java
interface SpeechToTextPort {
    TranscriptionResult transcribe(TranscriptionRequest request);
}

interface GroundedCoachPort {
    GroundedFeedback review(GroundedReviewRequest request);
}
```

`GroundedReviewRequest` contains the approved transcript, selected reviewed rubric/source excerpts,
register, and structured delivery evidence—not the learner's full history by default.
`GroundedFeedback` must contain claim IDs, evidence/source references, uncertainty, limitations,
and one of `SUPPORTED`, `PARTIALLY_SUPPORTED`, or `NOT_VERIFIABLE`. Provider adapters cannot return
free-form feedback directly to the UI.

Personal provider tokens are not persisted in the PWA. A future bring-your-own-key self-hosted
deployment accepts secrets on the server through environment/secret storage and documents provider
cost, retention, and revocation.

## 8. Accessibility implementation

- One `<main>` landmark and one page heading; native buttons and form fields.
- Move focus to the state heading after deliberate transitions, not every timer tick.
- Use `aria-live="polite"` for processing completion and significant timer thresholds; never a
  per-second countdown announcement.
- Pair waveform/timer visuals with text. Recording state has text plus icon/shape, not color alone.
- Preserve browser focus indicators and logical DOM order across responsive layouts.
- Minimum touch target about 44 × 44 CSS pixels where controls do not overlap.
- Respect `prefers-reduced-motion`; no looping/pulsing recording animation is required.
- Test at 320px width, 200% zoom, keyboard only, screen-reader smoke, and speech-recognition-off.

## 9. Observability and error taxonomy

Local mode keeps operational events on device unless the learner explicitly exports a diagnostic
bundle. The bundle redacts transcript/audio and contains versions, capability flags, durations,
error codes, and device/browser categories.

Error families:

- `CAPABILITY_*`: unsupported API, codec or worker feature;
- `PERMISSION_*`: denied/dismissed microphone;
- `AUDIO_*`: decode, VAD, clipping-quality or recorder failure;
- `MODEL_*`: download, checksum, initialization, memory, timeout, cancellation;
- `TRANSCRIPT_*`: empty, uncertain or invalid correction;
- `COVERAGE_*`: rubric/model/threshold unavailable;
- `PACK_*`: schema, checksum, compatibility, source-policy failure;
- `STORAGE_*`: quota, migration, corruption, export/import;
- `NETWORK_*`: offline/update/provider failure;
- `CONSENT_*` and `AUTHZ_*`: future connected policy failures.

Expected cancellation is not logged as a failure. Connected logs use correlation IDs and structured
codes; request/response bodies, audio URLs, transcripts, tokens, and patient information are
excluded.

## 10. Test fixtures and CI commands

Fixture sets:

- synthetic sine/silence/clipping PCM and consented, de-identified representative speech;
- medical-term transcription clips with accent never used as a quality label;
- approved/corrected transcripts covering exact, paraphrased, negated, contradictory, irrelevant,
  and ambiguous cases;
- deterministic topic bags, timers, schedules, and timezone transitions;
- valid/invalid/migrating IndexedDB snapshots;
- synthetic syllabus PDFs with headings, duplicates, scans, encryption, and fake-identifier traps;
- source/runtime pack golden files and checksums.

Planned commands (made executable in the version that introduces each tool):

```text
pnpm lint
pnpm typecheck
pnpm test
pnpm test:a11y
pnpm test:e2e
pnpm build
./mvnw -pl tools/content-compiler verify
pnpm content:validate
pnpm content:check-generated
```

CI uses pinned Node and Java versions, restores caches by lockfile hash, and builds from a clean
checkout. Model benchmarks run on named representative devices or a documented manual protocol;
CI performance on hosted runners is not presented as phone performance.

## 11. Version acceptance-test map

| Version | Required acceptance evidence |
| --- | --- |
| v0.1 | Markdown links valid; diagrams render; architecture/privacy/content decisions reviewed |
| v0.2 | Independent mode/challenge/subject controls, challenge hiding for single-level content, three reviewed prompt trios, drawing state, timer disabled before draw, Spin/Spin again, Recall direct-to-speech path, Deep Research research -> ready -> speech path, duration settings, challenge-specific arc, complete/exit/repeat, full-fingerprint random bag, background timer, responsive/a11y/offline shell, and operation with mic/storage/models/network disabled |
| v0.3 | Permission paths, record/playback, deterministic audio fixtures, local STT progress/cancel/failure, device benchmark, zero audio requests |
| v0.4 | Difficulty-specific golden lexical evidence, whole-token/local-window false-positive guards, distinct transcript/rubric `NOT_VERIFIABLE` outcomes, one prescription, offline typed-review E2E |
| v0.5 | Optional non-counting semantic evidence with pinned model/versioned thresholds and lexical fallback, bounded same-identity retry history, mismatch rejection and valid Refinement Delta |
| v0.6 | Opt-in post-review viva ladder; independent 60-second answer identities; hidden future prompts; typed/local-audio parity; strict one-rubric all-or-nothing validation; honest scored/unverifiable aggregate; active exit and stale-result cleanup; offline/a11y/budget/audit evidence |
| v0.7 | Explicit persistence opt-in; transcript/audio-free bounded records; strict validation and local dates; real IndexedDB index/migration tests; due-topic launch; exam triage; metadata export and verified delete-all; no-storage core regression |
| v0.8 | Safe PDF rejection/extraction, human-review/lifecycle gate, challenge-vector and fake-escalation validation, schema policy, deterministic JSON/manifest |
| v0.9 | Target-user end-to-end beta, crash recovery, pack migration, WCAG audit and measured budgets |
| v1.0 | Clean-device release journey, offline full loop, three approved packs, licence/privacy/security/recovery checklist |
| v1.1+ | Consent/authz/sync/provider contracts, retention/deletion, source-grounded results and local-mode regression |

## 12. Coding and review rules

1. Keep domain functions pure; inject clocks, randomness, storage, model, audio, and network ports.
2. Use strict TypeScript and null/unknown results rather than fabricated zeros.
3. Treat topic content, thresholds, models, and schemas as versioned inputs.
4. Require an evidence identifier for every automated learner-facing observation.
5. Never log or commit audio, transcripts, tokens, patient data, or proprietary source text.
6. Add a failure-path test with every new capability.
7. Keep generated output out of manual editing and verify it has no drift.
8. Record a short architecture decision when changing a boundary or trust assumption.
9. Preserve the complete mode/challenge/subject -> Spin -> focused timer -> finish/exit -> repeat tool without
   account, model, microphone, persistent storage, or network.
10. Do not merge a version until its exit gate in the execution plan has evidence.
