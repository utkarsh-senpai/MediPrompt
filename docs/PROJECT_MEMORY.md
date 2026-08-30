# MediPrompt project memory

**Owner:** Utkarsh Meshram (`utkarsh-senpai`)

**Updated:** 2026-08-30

**Current baseline:** v0.2 first playable; next branch is `feature/v0.3-private-speech`

## Product invariant

MediPrompt is a privacy-first speaking-practice PWA for medical students. Its permanent core is:

```text
choose mode + challenge + subject -> spin -> topic -> timed speech -> finish/exit -> repeat
```

That path must remain useful without an account, microphone, model, persistent storage, backend,
or network. Recording, transcription, feedback, scheduling, Spring Boot, and connected providers
are opt-in progressive enhancements. Unprompted is the interaction reference, not a source of
code, content, copy, or visual identity.

## Implemented in v0.2

- Static React/TypeScript PWA for GitHub Pages at the `/MediPrompt/` base path.
- Recall Sprint and Deep Research flows with independent mode, challenge, subject, support, and
  time concepts.
- Full-fingerprint shuffled bags, deadline-based timers, optional validated settings storage, and
  reducer transitions that reject stale or invalid events.
- Focused active-practice views, keyboard-safe accessible settings, reduced-motion support, and a
  narrow 320 px layout covered by tests.
- Strict runtime-pack schema and cross-reference validation. The production gate requires an
  approved pack with at least 20 topics and three complete Guided/Applied/Viva challenge trios.
- Atomic, fixed-manifest service-worker caching with an offline reload path and an explicit update
  action.
- CSP-safe standalone topic-pack validation generated at development time; runtime schema
  compilation and `unsafe-eval` are prohibited.
- Compiled reviewed non-medical fallback for both modes if the external pack is unavailable or
  invalid; the app never invents medical content or leaves the topic surface blank.

## Content and safety boundary

- The 265 MPT labels under `docs/curriculum/` are `DRAFT`, `REFERENCE_ONLY`, and not runtime
  learner content.
- Runtime packs declare `contentKind`. An `APPROVED` medical pack requires a
  `MEDICAL_REVIEWER`; owner/editor approval applies only to non-medical interaction fixtures.
- v0.2 intentionally publishes a 20-topic non-medical fixture until medical prompts, fictional
  cases, rubrics, sources, licence, and a named reviewer are available.
- Medical feedback may later report reviewed-rubric coverage, never independent correctness.
- Never score emotion, anxiety, confidence, personality, intelligence, accent, or native-speaker
  likeness. Never store or transmit patient information.
- Do not ship user/provider API keys in this static client. Any future BYOK/provider integration
  needs an explicit threat model; server-managed secrets belong to the optional connected service.

## Toolchain and verification

- Node 22.23.2 in CI; pnpm 9.15.0; frozen lockfile.
- React 18.3.1, TypeScript 5.9.3, Vite 6.4.3, Vitest 3.2.6, Playwright 1.62.1.
- Required gates: lint, typecheck, content validation, unit/component/content tests,
  accessibility smoke, production build/artifact validation, Playwright offline/responsive tests,
  production dependency audit, full dependency audit, and `git diff --check`.
- CI actions are SHA-pinned and run with read-only repository permissions. Production artifacts
  must contain no source maps, secrets, raw audio, transcripts, remote scripts, or unapproved
  packs.

## Next pickup: v0.3

Create `feature/v0.3-private-speech` from the promoted `develop` branch. Add microphone failure
paths, local recording/playback, deterministic delivery metrics, and a benchmarked cancellable
local transcription worker. Learners correct transcripts before later evaluation. Preserve the
entire v0.2 capability-free path and prove that audio never leaves the browser.

Before implementation, resolve the target phone/browser benchmark and collect only consented,
de-identified representative speech. Model choice remains a measured decision; do not encode
third-party accuracy claims as product guarantees.

## Source of truth

- `README.md`: product contract and commands.
- `docs/EXECUTION_PLAN.md`: version scope and exit gates.
- `docs/DIFFICULTY_AND_DEPTH_DESIGN.md`: difficulty/challenge contract.
- `docs/V0.2_DEVELOPMENT_CONTEXT.md`: v0.2 implementation/security contract.
- `docs/L1_PRODUCT_AND_SYSTEM_CONTEXT.md` through `docs/L4_CODE_DESIGN.md`: architecture.

If this file conflicts with an exit gate or normative design contract, the execution plan and
L1-L4 design win; update this memory in the same PR that changes those decisions.
