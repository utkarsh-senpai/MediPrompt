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

**v0.1 — Design foundation**

This repository currently contains the reviewed product and technical design. It does not yet
contain a runnable learner application. The first playable is planned for v0.2.

| Document | Purpose |
| --- | --- |
| [Execution plan](docs/EXECUTION_PLAN.md) | Version sequence, branches, gates, and delivery plan |
| [L1 design](docs/L1_PRODUCT_AND_SYSTEM_CONTEXT.md) | Problem, users, scope, outcomes, and system context |
| [L2 design](docs/L2_CONTAINER_ARCHITECTURE.md) | Containers, deployment, trust boundaries, and technology choices |
| [L3 design](docs/L3_COMPONENT_DESIGN.md) | Components, state, storage, content packs, and service boundaries |
| [L4 design](docs/L4_CODE_DESIGN.md) | Repository layout, interfaces, algorithms, contracts, and tests |

## Basic product contract

The first playable must work without an account, microphone, model, transcript, or backend:

1. Choose **Recall Sprint** or **Deep Research**.
2. Choose a medical subject.
3. Press **Spin** to draw a topic; the timer action stays disabled until a topic is drawn.
4. In Recall Sprint, press **Start timer**. In Deep Research, run or finish the research timer,
   confirm **Ready to speak**, then enter the same speaking view.
5. Keep the topic, a three-part medical answer arc, a large circular countdown, and an exit action
   visible throughout the attempt.
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

## What feedback means

MediPrompt keeps two dimensions separate:

- **Content coverage:** whether the answer expresses human-reviewed rubric concepts and their
  accepted synonyms. Local mode does not claim to prove medical correctness.
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
- Browser-local rubric matching using quantized `all-MiniLM-L6-v2` embeddings.
- IndexedDB for private progress and a service worker for application/model caching.
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

The first useful beta should serve one real medical student within four to six weeks after v0.1 is
approved. Success means she can complete the full prompt → speak → review → retry loop on a phone
and find the feedback useful—not that the repository contains the most features. The first
curriculum inventory contains 265 MPT candidate practice-topic labels; it remains a
[reference-only draft](docs/curriculum/MPT-CBC-topics.md) pending exact competency mapping, licence
review, prompt/rubric authoring, and educator approval.

## Contributing

Contribution instructions and software/content licences will be finalized before v1.0. Topic-pack
contributions will require source metadata, original rubric wording, automated validation, and
human review.

## Disclaimer

MediPrompt is an educational practice tool. It is not medical advice, a clinical decision system,
an official examination, or a substitute for qualified educators or healthcare professionals.
