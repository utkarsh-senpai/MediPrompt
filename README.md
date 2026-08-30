# MediPrompt

> Prompt. Speak. Master.

MediPrompt is a privacy-first speaking-practice application for medical students. It helps a
learner turn knowledge they can recognize in notes or questions into an answer they can retrieve,
structure, and defend aloud during a viva, OSCE, ward round, seminar, or case presentation.

The product takes inspiration from the low-friction, single-screen practice loop of
[Unprompted](https://www.unprompted.cool/) without copying its product or visual identity.
MediPrompt adds medical answer rubrics, observable delivery feedback, a second-attempt refinement
loop, and spaced resurfacing of weak topics.

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

## Product loop

```text
Choose or draw a topic
        ↓
Prepare under a timer
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

The application is designed around active retrieval and spoken production rather than passive
rereading. A learner should reach the first prompt without creating an account or installing an
application.

## Planned practice modes

- **Recall Sprint:** 15–30 seconds to prepare and 60–90 seconds to answer.
- **Viva Round:** a structured answer followed by recall, explanation, application,
  differentiation, and defence questions.
- **Deep Research:** longer preparation using approved sources before a timed answer.
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
and find the feedback useful—not that the repository contains the most features.

## Contributing

Contribution instructions and software/content licences will be finalized before v1.0. Topic-pack
contributions will require source metadata, original rubric wording, automated validation, and
human review.

## Disclaimer

MediPrompt is an educational practice tool. It is not medical advice, a clinical decision system,
an official examination, or a substitute for qualified educators or healthcare professionals.
