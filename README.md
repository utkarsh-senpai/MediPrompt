# MediPrompt

> Prompt. Speak. Master.

MediPrompt is a privacy-first speaking-practice application for medical students. It helps a
learner turn knowledge they can recognize in notes or questions into an answer they can retrieve,
structure, and defend aloud during a viva, OSCE, ward round, seminar, or case presentation.

The basic product is the medical-student version of the low-friction practice tool demonstrated by
[Unprompted](https://www.unprompted.cool/): choose a practice mode and subject, spin for a topic,
then speak against a focused timer and short answer arc. MediPrompt uses its own implementation,
content, copy, and visual identity. Medical rubrics, recording, feedback, retry, and spaced
practice are additions to that basic tool—not prerequisites for it.

## Status

**v0.5 — Grounded refinement** (current)

The runnable learner application lives in `apps/learner-web/`. On top of the compact
mode/challenge/subject → Spin → timed-speech loop (no account, backend, or persistent
storage), v0.3 added optional on-device speech feedback: a plain-language mic primer,
session-local recording during the speaking window, in-app playback, Web Audio delivery
observations (time speaking, pauses, clipping, loudness variation), and — on explicit request —
pinned whisper-base.en transcription that downloads once and runs entirely in the browser.
Audio and transcripts never leave the device, and the timer-only loop is unchanged when the
mic is unsupported or declined.

v0.4 turned the approved transcript into deterministic, on-device **content feedback**: each rubric
concept is tested against the transcript's accepted phrases, a weighted coverage fraction is shown,
and a **single actionable prescription** names the highest-weight missed concept to address next.
Topics without a source-grounded rubric get a "not verifiable from sources" fallback instead of a
fabricated grade. Coverage is shown visually and verbally separate from delivery.

v0.5 closes the practice loop. **Refinement Delta** compares consecutive attempts only when the
topic, prompt, rubric, practice settings, and scoring version are identical; it shows changed
coverage and newly covered/lost concepts, never a knowledge or correctness claim. Optional
`all-MiniLM-L6-v2` meaning matching compares bounded transcript segments with rubric wording on
device. Because educator-labelled calibration is still pending, semantic matches appear as
“possibly present — not counted” evidence and cannot inflate coverage or the delta. The lexical
engine remains the guaranteed offline numeric baseline. Decision resolutions are recorded in
[docs/V0.5_DEVELOPMENT_CONTEXT.md](docs/V0.5_DEVELOPMENT_CONTEXT.md). Spaced resurfacing, the Viva
Round follow-up ladder, and the connected platform remain progressive enhancements for later versions.

```bash
corepack prepare pnpm@9.15.0 --activate          # Node >= 22.23.2
pnpm install
pnpm --filter @mediprompt/learner-web dev      # local dev
pnpm lint && pnpm typecheck && pnpm test       # unit + component + content
pnpm test:a11y                                  # accessibility smoke
pnpm content:validate                           # schema + cross-reference checks
pnpm build                                      # production PWA build
pnpm test:e2e                                   # Playwright offline/service-worker tests
pnpm audit --prod && pnpm audit                 # runtime + full dependency audit
```

**Content status (v0.4 public practice beta):** the learner app uses the genuine 20-topic MPT
cardiovascular/respiratory candidate from
`content/candidates/mpt-cardiorespiratory-review-candidate.json`, split into Respiratory
Physiotherapy and Cardiovascular Physiotherapy subjects. The generic interaction fixture remains
only as a schema/regression-test input and is not copied into the public app.

The medical pack remains `DRAFT`, with no reviewer or review date. Every screen therefore displays
`Curriculum beta · unreviewed draft` and is for recall/speaking practice only—not diagnosis,
treatment, clinical decisions, or a claim of medical approval. Source grounding makes the beta
useful for feedback; a public **medical release** remains gated on a qualified educator reviewing
the exact prompts, cases, rubrics, mappings, and cited-source scope. See the
[source review and educator checklist](docs/curriculum/MPT-CARDIORESPIRATORY-SOURCE-REVIEW.md).

| Document | Purpose |
| --- | --- |
| [Execution plan](docs/EXECUTION_PLAN.md) | Version sequence, branches, gates, and delivery plan |
| [L1 design](docs/L1_PRODUCT_AND_SYSTEM_CONTEXT.md) | Problem, users, scope, outcomes, and system context |
| [L2 design](docs/L2_CONTAINER_ARCHITECTURE.md) | Containers, deployment, trust boundaries, and technology choices |
| [L3 design](docs/L3_COMPONENT_DESIGN.md) | Components, state, storage, content packs, and service boundaries |
| [L4 design](docs/L4_CODE_DESIGN.md) | Repository layout, interfaces, algorithms, contracts, and tests |
| [Difficulty and depth](docs/DIFFICULTY_AND_DEPTH_DESIGN.md) | Guided, Applied, and Viva authoring/behavior contracts |
| [Implementation handoff](docs/IMPLEMENTATION_HANDOFF.md) | Minimum-context entry point for the next agent or contributor |
| [Project memory](docs/PROJECT_MEMORY.md) | Current decisions, evidence, risks, and next-version pickup |
| [v0.2 development context](docs/V0.2_DEVELOPMENT_CONTEXT.md) | Consolidated build brief for the first-playable version |
| [v0.3 development context](docs/V0.3_DEVELOPMENT_CONTEXT.md) | Consolidated build brief for private speech intelligence |
| [v0.4 development context](docs/V0.4_DEVELOPMENT_CONTEXT.md) | Consolidated build brief for content coverage |
| [v0.5 development context](docs/V0.5_DEVELOPMENT_CONTEXT.md) | Reviewed contract for retries, Refinement Delta, and semantic evidence |
| [Medical source review](docs/curriculum/MPT-CARDIORESPIRATORY-SOURCE-REVIEW.md) | 20-topic evidence matrix, currency decisions, and educator-review gate |

## Basic product contract

The first playable must work without an account, microphone, model, transcript, or backend:

1. Choose **Recall Sprint** or **Deep Research**.
2. Choose an available challenge (**Explain**, **Apply**, or **Defend**) and subject. Challenge is
   hidden when the selected pack has only one reviewed level.
3. Press **Spin a topic** to draw a topic; the timer action stays unavailable until a topic is
   drawn.
4. In Recall Sprint, press **Start timer**. In Deep Research, run or finish the research timer,
   confirm **Ready to speak**, then enter the same speaking view.
5. Keep the topic, the **What? → So what? → Now what?** answer compass, a large circular
   countdown, and an exit action visible throughout the attempt.
6. Finish, spin again, or optionally continue into enhanced review when that feature is available.

This compact mode/topic → spin → timed speech flow remains available even after advanced features
are added.

## Extended learning loop

```text
Choose or draw a topic
        ↓
Prepare when the selected mode allows it
        ↓
Explain aloud
        ↓
Correct the transcript
        ↓
Review content coverage and delivery separately
        ↓
Retry with one specific goal
        ↓
Resurface weak topics later
```

The extended loop is progressive enhancement. The basic timed speaking tool remains useful if
recording, transcription, evaluation, storage, or the network is unavailable.

## Planned practice modes

- **Recall Sprint:** speak immediately for 60–90 seconds.
- **Viva Round:** a structured answer followed by recall, explanation, application,
  differentiation, and defence questions.
- **Deep Research:** a configurable research timer, an explicit ready-to-speak handoff, then the
  same timed answer.
- **Teach-back:** explain the same topic to an examiner, junior student, or patient.

Practice mode defines the activity. A separate challenge preset defines reasoning depth: Explain
for structured retrieval, Apply for bounded case reasoning, or Defend under uncertainty. Register, visible support,
and accessibility time remain independent. See the
[difficulty and depth design](docs/DIFFICULTY_AND_DEPTH_DESIGN.md).

## What feedback means

MediPrompt keeps two dimensions separate:

- **Content coverage:** whether the answer expresses source-linked rubric concepts and their
  accepted phrases. The current public-beta rubric is an unreviewed draft; local mode never claims
  medical correctness or educator approval.
- **Delivery:** observable measurements such as duration, pace, fillers, repetition, silence,
  pause placement, loudness stability, and time discipline.

The application must not infer confidence, anxiety, emotion, intelligence, competence,
personality, honesty, or accent quality from a voice. It is a learning aid, not a diagnostic or
official assessment system.

## Architecture direction

The zero-cost learner experience is an offline-capable static PWA:

- TypeScript application deployed to GitHub Pages.
- Browser `MediaRecorder` and Web Audio APIs.
- Browser-local speech recognition through Transformers.js, with `whisper-base.en` as the
  candidate default subject to representative-device and Indian-English medical-speech tests.
- A deterministic browser-local lexical rubric baseline, with optional pinned q8
  `all-MiniLM-L6-v2` sentence/rubric evidence that remains non-counting until educator calibration.
- IndexedDB for future private progress, a service worker for application/runtime caching, and the
  Transformers.js browser cache for opt-in model files.
- Versioned, human-reviewed YAML topic packs compiled to static JSON.

Java remains a first-class part of the project through a Java 21/Spring Boot content compiler and,
later, an optional connected modular monolith for accounts, synchronization, educator workflows,
and provider-neutral AI integrations. The basic learner loop must remain useful without that
backend.

## Repository strategy

- `develop` is the integration and default branch during pre-release development.
- Each version is built sequentially from the latest `develop` on a branch named
  `feature/vX.Y-short-name`.
- Each feature branch returns to `develop` through a reviewed pull request.
- Stable public releases are promoted to `main` through a release PR and tagged.

Future version branches are deliberately not created in advance. Creating them from an old base
would make later versions drift from decisions and code merged in earlier versions.

## Privacy and safety principles

- No identifiable patient information.
- Local processing is the default.
- Raw audio is not uploaded in zero-cost mode.
- Learners can correct a transcript before it is evaluated.
- Medical feedback must be traceable to reviewed rubric items or report that it is not verifiable.
- No emotion, accent, personality, or native-speaker scoring.
- No official grades, diagnosis, treatment advice, or replacement for educators.
- Connected features require explicit consent, clear retention rules, server-side secrets, and
  deletion controls.

## Near-term target

The first useful beta should serve one real medical student and let her complete the full prompt →
speak → review → retry loop on a phone. The broad inventory contains 265
[reference-only candidate labels](docs/curriculum/MPT-CBC-topics.md). A coherent first subset of
20 cardiovascular/respiratory topics is available in the explicitly labelled public practice beta
while it awaits qualified educator review. Automated checks can make the software and beta
delivery test-ready; they cannot make unreviewed medical content medically release-ready.

## Contributing

Contribution instructions and software/content licences will be finalized before v1.0. Topic-pack
contributions will require source metadata, original rubric wording, automated validation, and
human review.

## Disclaimer

MediPrompt is an educational practice tool. It is not medical advice, a clinical decision system,
an official examination, or a substitute for qualified educators or healthcare professionals.
