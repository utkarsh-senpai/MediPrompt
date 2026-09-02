# MediPrompt difficulty and topic-depth design

**Status:** implementation-ready design baseline

**Owner:** Utkarsh Meshram (`utkarsh-senpai`)

**Last updated:** 2026-09-01

## 1. Decision

MediPrompt will offer three challenge presets while keeping practice mode, communication register,
and learner support as separate choices:

| UI label | Internal ID | Mental model | Primary learning job |
| --- | --- | --- | --- |
| Explain | `GUIDED` | Learn the map | Retrieve and organize core ideas |
| Apply | `APPLIED` | Use the route | Apply and connect ideas in a bounded case |
| Defend | `VIVA` | Handle the detour | Prioritize and defend a decision under uncertainty |

The navigation analogy is deliberate: a harder journey changes the decisions and conditions, not
the readability of the map. The equivalent medical progression is classroom explanation -> ward
application -> viva defense. Difficulty must never come from obscure trivia, faster speech, an
accent ideal, an intimidating interface, or withheld evaluation criteria.

These are authoring presets, not learner identities. The learner interface uses verbs—Explain,
Apply, Defend—and must not label a learner easy, medium, hard, weak, advanced, or failing.

## 2. Keep four concepts independent

| Concept | Question it answers | Examples |
| --- | --- | --- |
| Practice mode | What activity am I doing? | Recall Sprint, Viva Round, Deep Research, Teach-back |
| Challenge preset | How much reasoning complexity is present? | Guided, Applied, Viva |
| Register | Who am I speaking to? | Examiner, junior, patient |
| Support level | How much help is visible? | Full arc, fading cues, no cues, optional rescue |

A learner can therefore do a Guided Viva Round, an Applied Teach-back, or a Viva-level Deep
Research attempt. This avoids the common design error of treating "viva" simultaneously as an
activity, a difficulty, a timer, and a score.

For the first playable, expose the challenge selector only when the selected pack has at least two
reviewed variants. A single-variant pack silently uses `GUIDED`; disabled fake choices are worse
than a smaller honest interface.

## 3. Evidence-to-design synthesis

The frameworks below are complementary, not interchangeable scoring systems.

| Framework | What it contributes | MediPrompt design use | Boundary |
| --- | --- | --- | --- |
| Miller's pyramid | `knows -> knows how -> shows how -> does` | Guided targets knows; Applied targets knows-how; Viva can rehearse verbalized shows-how reasoning | A browser speech attempt cannot establish real workplace `does`, and usually cannot establish psychomotor `shows how` |
| Revised Bloom taxonomy | remember, understand, apply, analyze, evaluate, create | Select the required cognitive operation when authoring variants | Verb choice alone does not make a valid assessment |
| SOLO taxonomy | isolated facts -> several facts -> integrated structure -> transfer/generalization | Judge depth and connectedness of an answer rather than its length | Use as a qualitative rubric lens, not an automated diagnosis of understanding |
| Cognitive load theory | match intrinsic complexity to prior knowledge; minimize irrelevant load | Give novices worked structure, then fade support; keep UI calm at every level | Difficulty from confusing layout, jargon, or interruptions is extraneous and undesirable |
| Retrieval/desirable difficulties | retrieval, spacing, interleaving, generation, and variation can improve durable learning | Attempt before hints; resurface and interleave reviewed topics; vary cases | A difficulty is desirable only when the learner has a reasonable path through it |
| Deliberate practice | specific objective, measurable behavior, focused repetition, actionable feedback | One prescription followed by an immediate retry | Repetition without a target and feedback is not deliberate practice |
| SNAPPS/oral case presentation | concise summary, narrowed alternatives, analysis, uncertainty, plan, self-study | Applied and Viva prompt arcs; make uncertainty discussable | It is a presentation scaffold, not proof of medical correctness |
| Script concordance | reasoning in ill-defined situations can be explored with changing evidence | Defend-preset evidence updates and defended likelihood changes | Formal SCT scoring requires carefully constructed items and expert panels; MediPrompt must not imitate the score casually |
| Teach-back | clear explanation is checked through restatement in the listener's own words | Patient register and plain-language transfer tasks | Plain language is not merely deleting technical vocabulary |

The evidence supports retrieval, appropriate scaffolding, feedback, and repeated practice. The exact
three-preset combination is a MediPrompt product-design inference that must be evaluated with
students and educators rather than marketed as a validated assessment scale.

## 4. Difficulty is a vector

Every authored prompt variant declares these dimensions. Presets provide defaults; educators may
override a dimension with a reason.

| Dimension | Guided default | Applied default | Viva default |
| --- | --- | --- | --- |
| Cognitive operation | recall + explain | apply + analyze | analyze + evaluate + transfer |
| Knowledge integration | 1-3 core concepts | mechanism, finding, and action linked | competing mechanisms, actions, and consequences linked |
| Context | topic only or familiar example | short, bounded case | incomplete or evolving case |
| Ambiguity | none; answer space explicit | one distractor or trade-off | plausible alternatives and missing information |
| Prioritization | optional sequence | choose first assessment/action | rank options and state what changes priority |
| Evidence obligation | state rationale | connect findings to plan | defend choice, limitations, and alternatives |
| Safety reasoning | name a key precaution when relevant | identify red flags/monitoring when relevant | explicit stop/escalate/safety-net reasoning when relevant |
| Transfer | familiar context | near transfer | changed population, constraint, or new finding |
| Follow-ups | none | one reviewed probe | two reviewed probes or one evidence update |
| Visible support | full answer arc and optional cue card | reduced arc; optional planning notes | criteria visible, answer cues hidden; rescue available |
| Preparation | optional, untimed cue review | 30-60 seconds | 30-60 seconds; never a surprise penalty |
| Speaking time | 60-90 seconds | 90-150 seconds | 120-180 seconds plus probes |

Timer values are defaults, not the source of difficulty. Accessibility settings may add time
without lowering the prompt's cognitive level. Pauses, dysfluency, motor/speech disability, or use
of assistive technology must not cause a difficulty downgrade.

## 5. Mode contracts

### Explain (`GUIDED`)

Goal: build a usable schema and a complete answer shape.

- Prompt asks for definition, purpose, mechanism, components, or a familiar example.
- The screen shows a reviewed 3-step arc such as `Define -> Explain -> Apply`.
- Optional cue card may show headings, never the model answer.
- Feedback prioritizes one missing core concept or one structural improvement.
- A retry uses the same prompt and arc.

Success evidence is a structured explanation covering reviewed essentials. A list of disconnected
facts may be useful progress but is not deep understanding.

### Apply (`APPLIED`)

Goal: turn knowledge into bounded clinical reasoning.

- Prompt adds a short fictional case with only relevant, non-identifying information.
- Learner must select and justify an assessment, interpretation, or management priority.
- Arc defaults to `Summarize -> Reason -> Plan`.
- One reviewed follow-up tests a nearby alternative or asks what additional information matters.
- Feedback prioritizes a broken link between finding, interpretation, and action.

Success evidence is a coherent chain: salient finding -> interpretation -> justified plan ->
monitoring/precaution when applicable.

### Defend (`VIVA`)

Goal: rehearse defensible reasoning under realistic uncertainty.

- Prompt uses an incomplete, evolving, or constrained fictional case.
- At least two plausible options exist; the learner must rank rather than merely list them.
- Arc defaults to `Prioritize -> Defend -> Safety-net`.
- A reviewed evidence update or follow-up asks whether the plan changes and why.
- Learner states uncertainty, missing information, limitations, and escalation criteria when
  relevant.
- Feedback prioritizes unsafe certainty, unconnected claims, or failure to revise after evidence.

Success is not agreement with one magic sentence. The reviewed rubric defines acceptable reasoning
paths and non-negotiable safety boundaries. The Defend preset remains formative and cannot award a clinical
competence or fitness-to-practise decision.

## 6. Blueprint transformation rules

Each candidate topic is deepened through an educator-authored blueprint rather than an unrestricted
LLM prompt.

| Blueprint | Guided | Applied | Viva |
| --- | --- | --- | --- |
| Explain concept | define, purpose, major components | explain how the concept accounts for case findings | compare mechanisms and defend the best explanation after new evidence |
| Assess | outline assessment sequence | choose relevant assessments for a bounded case | prioritize, justify exclusions, and adapt to a constraint/red flag |
| Interpret | explain what a test measures | interpret a supplied result in context | reconcile conflicting results and state uncertainty |
| Manage case | state management principles | propose and justify a plan | compare plans, manage risk, and revise after an evidence update |
| Compare/differentiate | give key distinctions | differentiate two plausible options in a case | rank several options and identify the discriminating evidence |
| Explain procedure | indications, sequence, precautions | adapt procedure to a patient/context | handle complication, contraindication, or resource constraint |
| Defend evidence | summarize a claim and source type | apply evidence with patient/context limits | critique applicability, alternatives, uncertainty, and decision impact |
| Teach-back | explain simply with one analogy | tailor explanation and check understanding | correct a misconception without shame while preserving safety nuance |

### Authoring sequence

1. Verify exact curriculum coordinates and source-use permission.
2. Define the observable learning objective and prerequisites.
3. Identify essential concepts, relationships, common misconceptions, and safety boundaries.
4. Choose one blueprint and create the Guided variant.
5. Add context and a decision link for Applied; do not merely add more facts.
6. Add ambiguity, a competing option, and an evidence update for Viva.
7. Author acceptable reasoning paths and explicit `NOT_VERIFIABLE` cases.
8. Review the trio for genuine progression, cognitive load, inclusivity, and medical accuracy.
9. Pilot with a student; revise time and supports independently of content difficulty.
10. Publish only after schema, licence, medical-review, and editorial checks pass.

## 7. Worked prompt examples

These demonstrate shape only. They are not reviewed MPT pack content and must not be published as
medical questions or rubrics without educator review.

### Pulmonary rehabilitation

- **Guided:** "Explain the purpose and major components of pulmonary rehabilitation. Organize your
  answer as definition, components, and expected functional benefit."
- **Applied:** "A fictional adult with stable chronic respiratory disease reports exertional
  breathlessness and reduced walking tolerance. Explain what you would assess before planning
  pulmonary rehabilitation and justify the main components of your plan."
- **Viva:** "The same fictional patient has a new exertional desaturation finding and limited home
  support. Prioritize your next decisions, compare feasible rehabilitation options, and state what
  would make you stop, modify, or escalate. A follow-up then changes one finding."

### Falls in geriatrics

- **Guided:** "Explain major modifiable contributors to falls and the structure of a prevention
  plan."
- **Applied:** "Given a fictional older adult with two recent falls, medication change, and reduced
  balance, summarize the important risks and justify your first assessment and intervention
  priorities."
- **Viva:** "The patient also fears activity, lives alone, and has conflicting mobility and safety
  goals. Defend a prioritized plan, explain trade-offs, and revise it after a new symptom is
  disclosed."

### Helsinki Declaration and physiotherapy ethics

- **Guided:** "Explain why the Helsinki Declaration matters to physiotherapy research and identify
  its core ethical purpose."
- **Applied:** "A fictional student project proposes recruiting a dependent patient group. Explain
  the ethical issues you would examine before approval and how consent should be protected."
- **Viva:** "The study offers likely benefit but has sponsor pressure, limited alternatives, and a
  participant with uncertain capacity. Prioritize the unresolved issues, defend whether recruitment
  should proceed, and state what evidence could change your decision."

## 8. Feedback and scoring boundary

Difficulty changes what evidence is expected, not whether MediPrompt can claim correctness.

Common reviewed rubric dimensions:

1. **Coverage:** essential concepts expressed.
2. **Structure:** answer has an intelligible clinical sequence.
3. **Reasoning links:** findings/claims are connected to interpretation and action.
4. **Prioritization:** important items are ranked with a rationale.
5. **Uncertainty and alternatives:** limits and plausible alternatives are acknowledged.
6. **Safety:** reviewed red flags, precautions, monitoring, and escalation are addressed.
7. **Communication fit:** wording and organization suit the selected register.

The local semantic engine may report rubric coverage and transcript evidence. It must not infer that
a fluent answer is medically correct, score confidence/emotion/accent, or issue a pass/fail grade.
Defend-preset answers may have lower raw coverage because the task is more complex; cross-preset scores are not
directly comparable. Refinement Delta is valid only for the same topic, prompt variant, rubric,
pack/version, difficulty profile, mode, register, support, time policy, and scoring identity.

Delivery feedback remains separate. Pause placement, pace, repetition, clipping, and audible time
can produce observable coaching, but they never change the medical-content result.

## 9. Adaptive progression without punishment

The learner always controls the challenge. MediPrompt may suggest, never force, a change.

Suggested deterministic policy:

- Suggest the next preset after two completed attempts on different prompt variants where the
  learner approves the transcript, attempts a retry, meets the reviewed coverage threshold, and
  self-rates the challenge as manageable.
- Suggest more support after repeated `NOT_VERIFIABLE`, aborted attempts, or learner request. Do not
  infer low ability from microphone/STT failure.
- Keep a manual `Change challenge` action visible before every spin.
- Store progression per topic family, not as one global intelligence level.
- Explain the suggestion: "You connected the key findings to a plan twice; try a case with competing
  options?"
- Never create streak loss, public ranking, or an exam-readiness claim.

Until educator calibration exists, this policy should use coverage only as one input and remain a
recommendation. A learner can choose Viva immediately or stay Guided indefinitely.

## 10. Content and code contracts

### Runtime content shape

```yaml
topicId: pulmonary-rehabilitation
variants:
  - variantId: pulmonary-rehabilitation-guided-v1
    challengePreset: GUIDED
    difficultyProfileVersion: difficulty-profile/1.0
    blueprint: explain-concept
    wording: "Educator-authored wording"
    answerArc: [define, explain, apply]
    timePolicy: { preparationSeconds: 0, speakingSeconds: 90 }
    caseRef: null
    followUpRefs: []
    rubricId: pulmonary-rehabilitation-guided-rubric-v1
  - variantId: pulmonary-rehabilitation-applied-v1
    challengePreset: APPLIED
    difficultyProfileVersion: difficulty-profile/1.0
    blueprint: manage-case
    wording: "Educator-authored wording"
    answerArc: [summarize, reason, plan]
    timePolicy: { preparationSeconds: 45, speakingSeconds: 120 }
    caseRef: stable-fictional-case-id
    followUpRefs: [reviewed-follow-up-id]
    rubricId: pulmonary-rehabilitation-applied-rubric-v1
```

The schema must require stable variant IDs, difficulty-profile version, blueprint, answer arc, time policy, and
a difficulty-specific rubric. Applied/Viva variants require a reviewed fictional case; Viva also
requires a competing option plus follow-up or evidence update. Generated cases and real patient
details are prohibited.

### Session identity

Carry these fields from the first playable and persist them when attempt history is introduced so
comparisons remain reproducible:

```ts
type ChallengePreset = "GUIDED" | "APPLIED" | "VIVA";

interface ChallengeIdentity {
  preset: ChallengePreset;
  difficultyProfileVersion: string;
  variantId: string;
  supportLevel: "FULL" | "FADING" | "MINIMAL";
}
```

`ChallengeIdentity` joins the existing topic, mode, register, rubric, time-policy, pack, threshold,
and model versions used by `PracticeSession` and `AttemptComparison`.

### Java content compiler

The planned v0.9 compiler must:

- validate the vector/preset combination rather than trusting a difficulty string;
- reject Applied/Viva variants without case provenance and medical review;
- reject Viva variants without ambiguity/alternative and revision opportunity;
- verify each variant has a distinct rubric and resolvable sources;
- detect fake escalation such as identical prompts with shorter timers;
- emit a coverage report by subject, blueprint, register, and challenge preset;
- never synthesize prompts, cases, expected answers, or safety rules from a curriculum PDF.

An optional connected LLM may later rephrase within reviewed constraints, but it cannot create the
ground truth, promote lifecycle state, or override deterministic publication validation.

## 11. UI behavior

Keep the Unprompted-style interaction compact:

```text
Practice mode  [Recall] [Viva] [Research] [Teach-back]
Challenge      [Explain] [Apply] [Defend]
Subject        [selected subject]
                         [Spin]
```

- Changing challenge updates eligible variants and resets the shuffled bag fingerprint.
- The topic card shows a one-line expectation, e.g. "Explain core ideas" or "Defend under changing
  evidence," not a threatening badge.
- Criteria are visible before starting; answer content is not.
- `Need a scaffold` is always available and records support use without penalty.
- Reduced motion, keyboard access, screen-reader labels, and additional-time settings apply equally
  to every preset.
- Color is not the sole signal. Avoid green/easy and red/hard as ability judgments.

## 12. Implementation sequence

| Version | Deliverable |
| --- | --- |
| v0.2 | Add `ChallengePreset` and variant identity to contracts; ship reviewed Guided variants and at least three complete Guided/Applied/Viva demonstration trios; keep core usable when only Guided exists |
| v0.3 | Measure delivery identically across challenges; accessibility time changes do not mutate difficulty |
| v0.4 | Add deterministic lexical coverage over difficulty-specific source-linked draft rubrics, visible accepted-phrase evidence, and one prescription; educator review remains pending |
| v0.5 | Add optional non-counting semantic evidence, bounded same-variant retry history, complete comparison guards, and Refinement Delta |
| v0.6 | Add reviewed follow-ups/evidence updates and the opt-in Viva defense ladder |
| v0.7 | Add the private learning plan, spaced resurfacing, and exam-date triage without changing difficulty labels |
| v0.8 | Activate the complete 35/26/34 subject set while preserving authored challenge and timer contracts |
| v0.9 | Add authoring schema/compiler validation, coverage reports, lifecycle gates, and fake-escalation detection |
| v0.10 | Pilot timing, comprehensibility, challenge calibration, and subgroup/device failure modes with the target student and educator |

## 13. Test and acceptance matrix

### Content validation

- Every published topic has at least one Guided variant.
- Every variant resolves to one reviewed rubric and source set.
- Applied has a bounded fictional case and decision link.
- Viva has plausible alternatives, uncertainty, and a reviewed revision event.
- No real patient identifiers, copied source prose, generated ground truth, or orphaned variants.
- Prompt trio review confirms escalation across at least three vector dimensions, not timer alone.

### Product behavior

- Challenge remains independent from mode and register.
- Shuffled bags do not repeat variants before exhaustion for the full filter fingerprint.
- Changing accessibility time preserves `ChallengePreset`.
- Retry comparison rejects mismatched challenge/profile/variant/rubric/time identities.
- Model, microphone, or storage failure leaves topic -> spin -> timer functional.

### Feedback safety

- Unsupported medical correctness returns `NOT_VERIFIABLE`.
- Delivery metrics cannot alter content coverage.
- The Defend preset produces no pass/fail, competence, confidence, emotion, personality, or accent label.
- New-evidence fixtures verify that only educator-authored acceptable paths receive coverage.

### Research validation

- Student can explain the difference between presets before first use.
- Educators independently order blinded prompt trios in the intended direction.
- Inter-rater disagreement and reasons are recorded; unclear trios return to authoring.
- Compare completion, retry, perceived challenge, and delayed recall by preset; do not infer learning
  from engagement alone.

## 14. Sources and evidence limits

- [Miller GE, The assessment of clinical skills/competence/performance](https://pubmed.ncbi.nlm.nih.gov/2400509/)
- [Anderson and Krathwohl revised Bloom taxonomy summary](https://www.coloradocollege.edu/other/assessment/how-to-assess-learning/learning-outcomes/blooms-revised-taxonomy.html)
- [University of KwaZulu-Natal summary of SOLO taxonomy](https://medicine.ukzn.ac.za/educationaltheory/solotaxonomy/)
- [Distributed and retrieval practice in health-professions education: systematic review](https://pubmed.ncbi.nlm.nih.gov/37615780/)
- [Desirable difficulties in medical education](https://pubmed.ncbi.nlm.nih.gov/35950522/)
- [Cognitive load theory in health-professional education](https://pubmed.ncbi.nlm.nih.gov/24593808/)
- [Clinical reasoning, cognitive load, and worked examples](https://pmc.ncbi.nlm.nih.gov/articles/PMC3989791/)
- [Simulation-based medical education with deliberate practice: meta-analysis](https://pubmed.ncbi.nlm.nih.gov/21512370/)
- [Rapid-cycle deliberate practice: systematic review](https://pubmed.ncbi.nlm.nih.gov/28540142/)
- [SNAPPS learner-centered case presentation model](https://pubmed.ncbi.nlm.nih.gov/14507619/)
- [SNAPPS clinical-reasoning randomized trial](https://pmc.ncbi.nlm.nih.gov/articles/PMC6588865/)
- [Script concordance construction guidance](https://pmc.ncbi.nlm.nih.gov/articles/PMC2427021/)
- [Review of script-concordance validity evidence](https://pubmed.ncbi.nlm.nih.gov/21401680/)
- [AHRQ Teach-Back tool](https://www.ahrq.gov/teamstepps-program/curriculum/communication/tools/teachback.html)
- [Assessment of professional competence: from methods to programmes](https://pubmed.ncbi.nlm.nih.gov/15733167/)
- [Patient Presentation Rating tool](https://www.abp.org/publications/patient-presentation-rating-tool-oral-case-presentations)

Source quality varies by question and many studies concern knowledge tests, simulations, residents,
or specific disciplines rather than a lightweight physiotherapy speaking PWA. MediPrompt must
describe the framework as research-informed and validate the implementation locally. It must not
claim that a preset measures clinical competence, predicts examination results, or improves patient
outcomes without appropriate studies.
