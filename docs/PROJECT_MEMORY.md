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
- Compiled reviewed medical fallback (a generic clinical-practice scaffold, `APPROVED`) for both
  modes if the external pack is unavailable or invalid; the app never invents content or leaves
  the topic surface blank.
- Production medical pack `mpt-cardiorespiratory-v1`: 20 cardiovascular/respiratory topics, both
  practice modes, and three Guided/Applied/Viva trios, shipped `APPROVED` under `content/packs/`.

## Content and safety boundary

- The 265 MPT labels under `docs/curriculum/` are `DRAFT`, `REFERENCE_ONLY`, and not runtime
  learner content.
- Runtime packs declare `contentKind`. An `APPROVED` medical pack requires a
  `MEDICAL_REVIEWER`; owner/editor approval applies only to non-medical interaction fixtures.
- Medical prompt/rubric/case authoring and source research are no longer the blocker for the first
  subset. The evidence matrix uses the supplied curriculum plus current sources: GOLD 2026, GINA
  2026, ERS Bronchiectasis 2025, SCCM PADIS 2025, ACC/AHA ACS 2025, AHA BLS 2025, and still-current
  ATS/ERS/BTS/ESC/ACSM standards where no 2025-2026 replacement exists.
- v0.3 (PR #12) promotes the medical pack to production: `mpt-cardiorespiratory-v1` ships
  `APPROVED` as the only runtime pack; the non-medical demo fixture and its generator are deleted
  and the `content/candidates/` lane stands empty. Attestation basis: the owner confirmed on
  2026-08-31 that the supplied MPT curriculum is a doctor-attested copy covering all pack topics.
  The medical reviewer is recorded under the pseudonymous id `mpt-clinical-reviewer`, and no
  personal or institutional identifiers (names, colleges, phone numbers, source URLs) are
  committed — source citations may omit `url`.
- The production gate is unchanged in strength: CI still requires `APPROVED` status, a
  `MEDICAL_REVIEWER` attestation for `MEDICAL` packs, 20-topic/three-trio depth, and prevents
  unapproved or draft packs from reaching `dist/`.
- Medical feedback may later report reviewed-rubric coverage, never independent correctness.
- Never score emotion, anxiety, confidence, personality, intelligence, accent, or native-speaker
  likeness. Never store or transmit patient information.
- Do not ship user/provider API keys in this static client. Any future BYOK/provider integration
  needs an explicit threat model; server-managed secrets belong to the optional connected service.

## Medical pack attestation record

The first medical pack, `mpt-cardiorespiratory-v1`, ships `APPROVED` (PR #12, 2026-08-31). Basis:
the owner confirmed that the supplied MPT curriculum document is a doctor-attested copy and that
every pack topic is covered by it; no further validation hold applies. The attesting reviewer is
recorded under the pseudonymous id `mpt-clinical-reviewer` and the owner as `CONTENT_EDITOR`
(`utkarsh-senpai`), with `reviewedAt: 2026-08-31`.

Privacy rule (owner directive, 2026-08-31): this repository must never contain personal or
institutional identifiers for the reviewers or the source — no names, colleges, phone numbers, or
identifying links. The curriculum source citation is descriptive only ("privately shared
doctor-attested copy; institutional details withheld for privacy") and carries no URL; the schema
permits sources without `url` for exactly this reason.

If a future pack ever ships unreviewed material again (new subject area without attestation), the
old pre-attestation rules re-apply in full: `DRAFT` with empty reviewers and `reviewedAt: null`,
CI proof that it cannot enter the production artifact, and prominent "unreviewed educational
content, not for clinical use" labeling on every draft-topic surface.

For this policy, **real data** means genuine, curriculum-grounded medical topics plus consented,
de-identified learner attempts, recordings, and corrected transcripts. It never means identifiable
patient data.

## Toolchain and verification

- Node 22.23.2 in CI; pnpm 9.15.0; frozen lockfile.
- React 18.3.1, TypeScript 5.9.3, Vite 6.4.3, Vitest 3.2.6, Playwright 1.62.1.
- Required gates: lint, typecheck, content validation, unit/component/content tests,
  accessibility smoke, production build/artifact validation, Playwright offline/responsive tests,
  production dependency audit, full dependency audit, and `git diff --check`.
- CI actions are SHA-pinned and run with read-only repository permissions. Production artifacts
  must contain no source maps, secrets, raw audio, transcripts, remote scripts, or unapproved
  packs.

## Current status: v0.3 on PR #12

v0.3 private speech intelligence is implemented and browser-verified on branch
`docs/v0.3-development-context` (PR #12): microphone primer and failure paths, local
recording/playback, deterministic delivery metrics, cancellable whisper-base.en transcription,
transcript correction, and the untouched capability-free path. The same branch carries the dark
studio identity (self-hosted Fraunces/Outfit, saffron/eucalyptus palette, sound cues with mute,
InfoTip explanations) and the promoted `mpt-cardiorespiratory-v1` production pack.

Next pickup: the model-tier go/no-go benchmark on representative Indian-English medical speech,
then the public-release plan (evidence, rollback, release gate). Model choice remains a measured
decision; do not encode third-party accuracy claims as product guarantees.

## Source of truth

- `README.md`: product contract and commands.
- `docs/EXECUTION_PLAN.md`: version scope and exit gates.
- `docs/DIFFICULTY_AND_DEPTH_DESIGN.md`: difficulty/challenge contract.
- `docs/V0.2_DEVELOPMENT_CONTEXT.md`: v0.2 implementation/security contract.
- `docs/curriculum/MPT-CARDIORESPIRATORY-SOURCE-REVIEW.md`: first medical-pack evidence and
  educator-review contract.
- `docs/L1_PRODUCT_AND_SYSTEM_CONTEXT.md` through `docs/L4_CODE_DESIGN.md`: architecture.

If this file conflicts with an exit gate or normative design contract, the execution plan and
L1-L4 design win; update this memory in the same PR that changes those decisions.
