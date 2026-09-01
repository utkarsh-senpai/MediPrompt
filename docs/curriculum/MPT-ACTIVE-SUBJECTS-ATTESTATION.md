# MPT active-subject medical-content review worksheet

> Status: **UNATTESTED DRAFT — educator review required before a public medical release.**
> Completing or signing this worksheet is a human governance action. Its presence in the repository does not constitute approval.
> Reviewers should complete a dated copy tied to the reviewed commit; this generated template remains immutable so automated drift checks stay meaningful.

## Review scope

- Pack: `mpt-cardiorespiratory-review-candidate` version `0.3.0`
- Generated from the validated candidate: 3 active subjects, 61 topics, 136 prompt variants
- Active subjects: Neuro Physiotherapy, Respiratory Physiotherapy, and Cardiovascular Physiotherapy
- Evidence status: sources were checked in 2026 and include 2025–26 publications plus older still-current guidelines, measurement standards, and foundational texts
- Curriculum catalog: 265 topics across eight visible subjects; five subjects remain `COMING_SOON` and cannot start practice
- This worksheet reviews educational prompts and answer criteria. It is not patient-specific guidance, a diagnostic protocol, or a substitute for local policy or supervised clinical training.

## Reviewer record

- Reviewer name: ________________________________________________
- Professional registration / licence number: ____________________
- Qualification and specialty: ___________________________________
- Institution / role: _____________________________________________
- Conflicts of interest: __________________________________________
- Review date (YYYY-MM-DD): _______________________________________
- Pack commit SHA reviewed: _______________________________________

For every prompt below, verify factual accuracy, physiotherapy scope, safety boundaries, currency of cited evidence, clarity for an MPT learner, and whether the accepted phrases are broad enough to recognize a correct spoken answer without rewarding a materially wrong claim.

## Subject and prompt review

## Neuro Physiotherapy

### 1. Stroke rehabilitation: physiotherapy management

Topic ID: `stroke-management`

#### Question — GUIDED / RECALL_SPRINT

Explain physiotherapy management after stroke, from early assessment through intensity, task-oriented practice, impairment-specific adjuncts, and outcome measurement.

**Expected answer — required evidence criteria:**

1. Deliver therapy early and at high intensity with task-oriented, repetitive practice (`aha-asa-stroke-rehab-2016`)
   - Accepted evidence wording: `early high-intensity therapy`; `task-oriented repetitive practice`; `high repetition task practice`
2. Select impairment-specific adjuncts by deficit: CIMT, mirror therapy, treadmill with body-weight support, virtual reality (`aha-asa-stroke-rehab-2016`, `cochrane-cimt-2015`, `cochrane-mirror-therapy-2018`, `cochrane-treadmill-bws-2017`, `cochrane-vr-stroke-2025`)
   - Accepted evidence wording: `constraint-induced movement therapy`; `mirror therapy`; `treadmill with body weight support`; `virtual reality`
3. Track progress with validated outcome measures and adjust the dose (`aha-asa-stroke-rehab-2016`, `berg-balance-1992`, `fugl-meyer-1975`)
   - Accepted evidence wording: `Berg Balance Scale`; `Fugl-Meyer Assessment`; `track progress with outcome measures`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — GUIDED / DEEP_RESEARCH

Use the cited evidence sources to prepare, then answer: Explain physiotherapy management after stroke, from early assessment through intensity, task-oriented practice, impairment-specific adjuncts, and outcome measurement. State the source scope, one uncertainty, and what requires patient-specific clinical judgment.

**Expected answer — required evidence criteria:**

1. Deliver therapy early and at high intensity with task-oriented, repetitive practice (`aha-asa-stroke-rehab-2016`)
   - Accepted evidence wording: `early high-intensity therapy`; `task-oriented repetitive practice`; `high repetition task practice`
2. Select impairment-specific adjuncts by deficit: CIMT, mirror therapy, treadmill with body-weight support, virtual reality (`aha-asa-stroke-rehab-2016`, `cochrane-cimt-2015`, `cochrane-mirror-therapy-2018`, `cochrane-treadmill-bws-2017`, `cochrane-vr-stroke-2025`)
   - Accepted evidence wording: `constraint-induced movement therapy`; `mirror therapy`; `treadmill with body weight support`; `virtual reality`
3. Track progress with validated outcome measures and adjust the dose (`aha-asa-stroke-rehab-2016`, `berg-balance-1992`, `fugl-meyer-1975`)
   - Accepted evidence wording: `Berg Balance Scale`; `Fugl-Meyer Assessment`; `track progress with outcome measures`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — APPLIED / RECALL_SPRINT

Using the fictional case, prioritize early physiotherapy goals, choose impairment-specific adjuncts, and outline a monitored progression with the outcome measures you would track.

**Fictional case:** A fictional 64-year-old has a right middle cerebral artery infarct with left hemiparesis, is medically stable 72 hours after stroke, sits with assistance, and wants to walk independently and use the left arm for dressing.

**Reviewed follow-up questions:**

- PROBE: Which single adjunct would most change arm function for this person, and what limits its applicability?

**Expected answer — required evidence criteria:**

1. Prioritize early sitting, standing, and walking practice at tolerable intensity (`aha-asa-stroke-rehab-2016`)
   - Accepted evidence wording: `early sitting and standing`; `walking practice`; `tolerable intensity`
2. Match adjuncts to the deficit: CIMT for the arm, treadmill training for gait (`cochrane-cimt-2015`, `cochrane-treadmill-bws-2017`)
   - Accepted evidence wording: `constraint-induced movement therapy for arm`; `treadmill training for gait`; `match adjunct to deficit`
3. Track Berg Balance and Fugl-Meyer to justify progression (`berg-balance-1992`, `fugl-meyer-1975`)
   - Accepted evidence wording: `Berg Balance Scale`; `Fugl-Meyer Assessment`; `track to justify progression`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — VIVA / RECALL_SPRINT

Defend your early stroke rehabilitation plan for the fictional case, separate what the evidence supports from what is patient-specific, and state the findings that would pause progression and trigger escalation.

**Fictional case:** A fictional 64-year-old has a right middle cerebral artery infarct with left hemiparesis, is medically stable 72 hours after stroke, sits with assistance, and wants to walk independently and use the left arm for dressing.

**Reviewed follow-up questions:**

- PROBE: Which single adjunct would most change arm function for this person, and what limits its applicability?
- EVIDENCE_UPDATE: The person develops new shoulder pain during active left-arm practice. Explain how this changes your priorities and why forced-use CIMT must pause pending assessment.

**Expected answer — required evidence criteria:**

1. Defend high-intensity task practice using dose-response evidence (`aha-asa-stroke-rehab-2016`)
   - Accepted evidence wording: `dose-response evidence`; `high-intensity task practice`; `evidence supports intensity`
2. Acknowledge individual tolerance, comorbidity, and response uncertainty (`aha-asa-stroke-rehab-2016`)
   - Accepted evidence wording: `individual tolerance`; `comorbidity`; `response uncertainty`
3. State that new instability, deterioration, or red flags pause progression and trigger escalation (`nice-ng236-stroke-rehab`)
   - Accepted evidence wording: `pause progression`; `clinical escalation`; `red flags`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

### 2. Cerebral palsy: assessment and physiotherapy management

Topic ID: `cerebral-palsy-management`

#### Question — GUIDED / RECALL_SPRINT

Explain assessment and physiotherapy management of cerebral palsy, emphasizing MDT care, GMFM/GMFCS, comorbidity surveillance, and goal-based management.

**Expected answer — required evidence criteria:**

1. Use MDT care from diagnosis with surveillance for pain, sleep, feeding, salivation, and mental health (`nice-ng62-cerebral-palsy`)
   - Accepted evidence wording: `multidisciplinary care from diagnosis`; `comorbidity surveillance`; `pain sleep feeding surveillance`
2. Assess gross motor function with GMFM and classify with GMFCS to guide goals (`gmfm-russell-1989`, `gmfcs-palisano-1997`, `nice-ng62-cerebral-palsy`)
   - Accepted evidence wording: `Gross Motor Function Measure`; `GMFCS classification`; `GMFM and GMFCS`
3. Set functional goals and plan transition to adult services (`nice-ng62-cerebral-palsy`)
   - Accepted evidence wording: `functional goals`; `transition to adult services`; `goal-based management`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — GUIDED / DEEP_RESEARCH

Use the cited evidence sources to prepare, then answer: Explain assessment and physiotherapy management of cerebral palsy, emphasizing MDT care, GMFM/GMFCS, comorbidity surveillance, and goal-based management. State the source scope, one uncertainty, and what requires patient-specific clinical judgment.

**Expected answer — required evidence criteria:**

1. Use MDT care from diagnosis with surveillance for pain, sleep, feeding, salivation, and mental health (`nice-ng62-cerebral-palsy`)
   - Accepted evidence wording: `multidisciplinary care from diagnosis`; `comorbidity surveillance`; `pain sleep feeding surveillance`
2. Assess gross motor function with GMFM and classify with GMFCS to guide goals (`gmfm-russell-1989`, `gmfcs-palisano-1997`, `nice-ng62-cerebral-palsy`)
   - Accepted evidence wording: `Gross Motor Function Measure`; `GMFCS classification`; `GMFM and GMFCS`
3. Set functional goals and plan transition to adult services (`nice-ng62-cerebral-palsy`)
   - Accepted evidence wording: `functional goals`; `transition to adult services`; `goal-based management`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — APPLIED / RECALL_SPRINT

Using the fictional case, outline a GMFCS-stratified management plan, the comorbidity surveillance you would coordinate, and the goals you would set for school participation.

**Fictional case:** A fictional 5-year-old with bilateral cerebral palsy, GMFCS level III, walks with a mobility aid, has tight calf muscles, and is due for primary-school entry.

**Reviewed follow-up questions:**

- PROBE: What would change your management more: a one-level change in GMFCS, or a new pain complaint?

**Expected answer — required evidence criteria:**

1. Stratify management by GMFCS level and set participation goals (`gmfcs-palisano-1997`, `nice-ng62-cerebral-palsy`)
   - Accepted evidence wording: `GMFCS level III`; `stratify by GMFCS`; `school participation goals`
2. Coordinate MDT surveillance beyond motor impairment (`nice-ng62-cerebral-palsy`)
   - Accepted evidence wording: `MDT surveillance`; `comorbidity surveillance`; `coordinate multidisciplinary care`
3. Use GMFM to track gross motor change (`gmfm-russell-1989`)
   - Accepted evidence wording: `Gross Motor Function Measure`; `track motor change`; `GMFM progress`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — VIVA / RECALL_SPRINT

Defend your management plan for the fictional child, distinguish what GMFCS predicts from what is individual, and explain how you would respond if participation goals and motor goals conflict.

**Fictional case:** A fictional 5-year-old with bilateral cerebral palsy, GMFCS level III, walks with a mobility aid, has tight calf muscles, and is due for primary-school entry.

**Reviewed follow-up questions:**

- PROBE: What would change your management more: a one-level change in GMFCS, or a new pain complaint?
- EVIDENCE_UPDATE: The child reports new hip pain. Explain how this changes surveillance priorities and why motor goals must be revisited before progression.

**Expected answer — required evidence criteria:**

1. Defend GMFCS-stratified goals using predicted mobility trajectory (`gmfcs-palisano-1997`)
   - Accepted evidence wording: `GMFCS predicts mobility`; `predicted trajectory`; `stratified goals`
2. Acknowledge individual variation and the limits of classification (`nice-ng62-cerebral-palsy`)
   - Accepted evidence wording: `individual variation`; `limits of classification`; `child-specific factors`
3. Use shared decision making and reassessment to revise goals (`nice-ng62-cerebral-palsy`)
   - Accepted evidence wording: `shared decision making`; `reassess goals`; `revise the plan`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

### 3. Pediatric neuromuscular disorders: DMD and SMA management

Topic ID: `pediatric-neuromuscular-dmd-sma`

#### Question — GUIDED / RECALL_SPRINT

Explain physiotherapy management of Duchenne muscular dystrophy and spinal muscular atrophy, including contracture prevention, postural management, and multidisciplinary care.

**Expected answer — required evidence criteria:**

1. Focus PT on contracture prevention, scoliosis surveillance, and staged stretching and orthotic programmes (`dmd-care-birnkrant-2018`, `sma-care-mercuri-2018`)
   - Accepted evidence wording: `contracture prevention`; `scoliosis surveillance`; `stretching and orthotic programme`
2. Work within multidisciplinary care that extends ambulation and survival with serial respiratory and cardiac monitoring (`dmd-care-birnkrant-2018`)
   - Accepted evidence wording: `multidisciplinary care`; `extend ambulation`; `serial respiratory and cardiac monitoring`
3. Adjust rehabilitation goals by disease severity and therapy status, with postural and ventilation support (`sma-care-mercuri-2018`)
   - Accepted evidence wording: `postural management`; `assisted ventilation`; `goals by disease severity`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — GUIDED / DEEP_RESEARCH

Use the cited evidence sources to prepare, then answer: Explain physiotherapy management of Duchenne muscular dystrophy and spinal muscular atrophy, including contracture prevention, postural management, and multidisciplinary care. State the source scope, one uncertainty, and what requires patient-specific clinical judgment.

**Expected answer — required evidence criteria:**

1. Focus PT on contracture prevention, scoliosis surveillance, and staged stretching and orthotic programmes (`dmd-care-birnkrant-2018`, `sma-care-mercuri-2018`)
   - Accepted evidence wording: `contracture prevention`; `scoliosis surveillance`; `stretching and orthotic programme`
2. Work within multidisciplinary care that extends ambulation and survival with serial respiratory and cardiac monitoring (`dmd-care-birnkrant-2018`)
   - Accepted evidence wording: `multidisciplinary care`; `extend ambulation`; `serial respiratory and cardiac monitoring`
3. Adjust rehabilitation goals by disease severity and therapy status, with postural and ventilation support (`sma-care-mercuri-2018`)
   - Accepted evidence wording: `postural management`; `assisted ventilation`; `goals by disease severity`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — APPLIED / RECALL_SPRINT

Using the fictional case, outline a PT programme spanning contracture management, ambulation preservation, and the surveillance you would coordinate within the MDT.

**Fictional case:** A fictional 7-year-old with Duchenne muscular dystrophy is still ambulant but beginning to rise from the floor with hand-to-thigh climbing, and has tight heel cords.

**Reviewed follow-up questions:**

- PROBE: Which monitored outcome would most signal the need to shift from ambulation goals to postural management?

**Expected answer — required evidence criteria:**

1. Design a stretching and night-orthotic programme for contracture prevention (`dmd-care-birnkrant-2018`)
   - Accepted evidence wording: `stretching programme`; `night orthoses`; `contracture prevention`
2. Coordinate serial respiratory and cardiac monitoring with the MDT (`dmd-care-birnkrant-2018`)
   - Accepted evidence wording: `serial respiratory monitoring`; `cardiac monitoring`; `coordinate MDT`
3. Set ambulation-preservation goals aligned to disease stage (`dmd-care-birnkrant-2018`, `sma-care-mercuri-2018`)
   - Accepted evidence wording: `ambulation preservation`; `goals by disease stage`; `stage-aligned goals`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — VIVA / RECALL_SPRINT

Defend your DMD management plan, distinguish what is disease-stage specific from what is general, and explain how goals change if ambulation is lost.

**Fictional case:** A fictional 7-year-old with Duchenne muscular dystrophy is still ambulant but beginning to rise from the floor with hand-to-thigh climbing, and has tight heel cords.

**Reviewed follow-up questions:**

- PROBE: Which monitored outcome would most signal the need to shift from ambulation goals to postural management?
- EVIDENCE_UPDATE: The child loses independent ambulation over six months. Explain how the programme changes and why respiratory surveillance intensity increases.

**Expected answer — required evidence criteria:**

1. Defend contracture and scoliosis surveillance using care-consideration evidence (`dmd-care-birnkrant-2018`, `sma-care-mercuri-2018`)
   - Accepted evidence wording: `contracture and scoliosis surveillance`; `care considerations`; `evidence-based surveillance`
2. Acknowledge therapy-status uncertainty and individual progression (`sma-care-mercuri-2018`)
   - Accepted evidence wording: `therapy status`; `individual progression`; `disease progression uncertainty`
3. State that loss of ambulation shifts goals to postural care, scoliosis, and ventilation support (`sma-care-mercuri-2018`)
   - Accepted evidence wording: `postural care`; `scoliosis management`; `ventilation support`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

### 4. Parkinson's disease: physiotherapy management

Topic ID: `parkinsons-disease-management`

#### Question — GUIDED / RECALL_SPRINT

Explain physiotherapy management of Parkinson's disease, focusing on gait, balance, transfers, freezing of gait, and falls reduction.

**Expected answer — required evidence criteria:**

1. Offer physiotherapy targeting gait, balance, and transfers (`nice-ng71-parkinsons`)
   - Accepted evidence wording: `gait balance and transfers`; `physiotherapy for Parkinson's`; `transfers training`
2. Address freezing of gait and reduce falls (`nice-ng71-parkinsons`)
   - Accepted evidence wording: `freezing of gait`; `reduce falls`; `falls reduction`
3. Recognise that pharmacological management is levodopa-based and that non-motor symptoms need separate management (`nice-ng71-parkinsons`)
   - Accepted evidence wording: `levodopa-based management`; `non-motor symptoms`; `depression sleep autonomic`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — GUIDED / DEEP_RESEARCH

Use the cited evidence sources to prepare, then answer: Explain physiotherapy management of Parkinson's disease, focusing on gait, balance, transfers, freezing of gait, and falls reduction. State the source scope, one uncertainty, and what requires patient-specific clinical judgment.

**Expected answer — required evidence criteria:**

1. Offer physiotherapy targeting gait, balance, and transfers (`nice-ng71-parkinsons`)
   - Accepted evidence wording: `gait balance and transfers`; `physiotherapy for Parkinson's`; `transfers training`
2. Address freezing of gait and reduce falls (`nice-ng71-parkinsons`)
   - Accepted evidence wording: `freezing of gait`; `reduce falls`; `falls reduction`
3. Recognise that pharmacological management is levodopa-based and that non-motor symptoms need separate management (`nice-ng71-parkinsons`)
   - Accepted evidence wording: `levodopa-based management`; `non-motor symptoms`; `depression sleep autonomic`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — APPLIED / RECALL_SPRINT

Using the fictional case, design a physiotherapy plan targeting freezing of gait and falls, and explain how you would time therapy with medication cycles.

**Fictional case:** A fictional 68-year-old with Parkinson's disease has freezing of gait at doorways, two near-falls in the past month, and is independent in transfers but slow.

**Reviewed follow-up questions:**

- PROBE: Which outcome would best show whether your falls programme is working, and over what timeframe?

**Expected answer — required evidence criteria:**

1. Target freezing of gait with cueing and strategy training (`nice-ng71-parkinsons`)
   - Accepted evidence wording: `cueing strategies`; `freezing of gait`; `strategy training`
2. Prioritise falls reduction through balance and transfer training (`nice-ng71-parkinsons`)
   - Accepted evidence wording: `falls reduction`; `balance training`; `transfer training`
3. Time active therapy to 'on' periods where possible (`nice-ng71-parkinsons`)
   - Accepted evidence wording: `on periods`; `time therapy with medication`; `levodopa cycles`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — VIVA / RECALL_SPRINT

Defend your Parkinson's plan, separate what physiotherapy can change from what is medication-driven, and explain how you would respond to worsening falls.

**Fictional case:** A fictional 68-year-old with Parkinson's disease has freezing of gait at doorways, two near-falls in the past month, and is independent in transfers but slow.

**Reviewed follow-up questions:**

- PROBE: Which outcome would best show whether your falls programme is working, and over what timeframe?
- EVIDENCE_UPDATE: The person reports more freezing in the afternoon. Explain how this changes your timing of therapy and what medical review you would flag.

**Expected answer — required evidence criteria:**

1. Defend gait, balance, and transfer training using guideline evidence (`nice-ng71-parkinsons`)
   - Accepted evidence wording: `gait balance and transfers`; `guideline evidence`; `physiotherapy benefit`
2. Acknowledge that motor symptoms are levodopa-responsive and non-motor symptoms are not (`nice-ng71-parkinsons`)
   - Accepted evidence wording: `levodopa-responsive motor symptoms`; `non-motor symptoms`; `medication-driven`
3. State that worsening falls or new freezing triggers medical review and revised supervision (`nice-ng71-parkinsons`)
   - Accepted evidence wording: `worsening falls`; `medical review`; `revised supervision`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

### 5. Outcome measures in neurological physiotherapy

Topic ID: `neuro-outcome-measures`

#### Question — GUIDED / RECALL_SPRINT

Explain how to select and interpret outcome measures in neuro physiotherapy, including Berg Balance, Fugl-Meyer, MMSE, and the ASIA Impairment Scale.

**Expected answer — required evidence criteria:**

1. Use the Berg Balance Scale to measure static and dynamic balance; a change of about 4 points is the minimal detectable change (`berg-balance-1992`)
   - Accepted evidence wording: `Berg Balance Scale`; `minimal detectable change`; `balance assessment`
2. Use the Fugl-Meyer Assessment to quantify motor, balance, sensation and joint function in hemiplegia (`fugl-meyer-1975`)
   - Accepted evidence wording: `Fugl-Meyer Assessment`; `motor sensory assessment`; `hemiplegia assessment`
3. Use the MMSE as a bedside cognitive screen and the ASIA Impairment Scale for spinal cord injury classification (`mmse-folstein-1975`, `asia-isncsci-9th-2026`)
   - Accepted evidence wording: `Mini-Mental State Examination`; `ASIA Impairment Scale`; `cognitive screen`; `AIS grade`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — GUIDED / DEEP_RESEARCH

Use the cited evidence sources to prepare, then answer: Explain how to select and interpret outcome measures in neuro physiotherapy, including Berg Balance, Fugl-Meyer, MMSE, and the ASIA Impairment Scale. State the source scope, one uncertainty, and what requires patient-specific clinical judgment.

**Expected answer — required evidence criteria:**

1. Use the Berg Balance Scale to measure static and dynamic balance; a change of about 4 points is the minimal detectable change (`berg-balance-1992`)
   - Accepted evidence wording: `Berg Balance Scale`; `minimal detectable change`; `balance assessment`
2. Use the Fugl-Meyer Assessment to quantify motor, balance, sensation and joint function in hemiplegia (`fugl-meyer-1975`)
   - Accepted evidence wording: `Fugl-Meyer Assessment`; `motor sensory assessment`; `hemiplegia assessment`
3. Use the MMSE as a bedside cognitive screen and the ASIA Impairment Scale for spinal cord injury classification (`mmse-folstein-1975`, `asia-isncsci-9th-2026`)
   - Accepted evidence wording: `Mini-Mental State Examination`; `ASIA Impairment Scale`; `cognitive screen`; `AIS grade`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

### 6. Neuro-therapeutic skills: task-oriented and evidence-based adjuncts

Topic ID: `neuro-therapeutic-task-oriented`

#### Question — GUIDED / RECALL_SPRINT

Explain the evidence-based neuro-therapeutic approaches after stroke, emphasizing task-oriented practice and adjuncts with trial evidence.

**Expected answer — required evidence criteria:**

1. Prioritise task-oriented, high-intensity repetitive practice as the core approach (`aha-asa-stroke-rehab-2016`)
   - Accepted evidence wording: `task-oriented practice`; `high-intensity repetition`; `repetitive task practice`
2. Apply constraint-induced movement therapy with a transfer package for arm function (`cochrane-cimt-2015`)
   - Accepted evidence wording: `constraint-induced movement therapy`; `transfer package`; `shaping and restraint`
3. Use mirror therapy and virtual reality as adjuncts to increase dose and engagement (`cochrane-mirror-therapy-2018`, `cochrane-vr-stroke-2025`)
   - Accepted evidence wording: `mirror therapy`; `virtual reality adjunct`; `increase dose and engagement`
4. Use treadmill training with or without body-weight support for walking (`cochrane-treadmill-bws-2017`)
   - Accepted evidence wording: `treadmill training`; `body weight support`; `walking speed and endurance`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — GUIDED / DEEP_RESEARCH

Use the cited evidence sources to prepare, then answer: Explain the evidence-based neuro-therapeutic approaches after stroke, emphasizing task-oriented practice and adjuncts with trial evidence. State the source scope, one uncertainty, and what requires patient-specific clinical judgment.

**Expected answer — required evidence criteria:**

1. Prioritise task-oriented, high-intensity repetitive practice as the core approach (`aha-asa-stroke-rehab-2016`)
   - Accepted evidence wording: `task-oriented practice`; `high-intensity repetition`; `repetitive task practice`
2. Apply constraint-induced movement therapy with a transfer package for arm function (`cochrane-cimt-2015`)
   - Accepted evidence wording: `constraint-induced movement therapy`; `transfer package`; `shaping and restraint`
3. Use mirror therapy and virtual reality as adjuncts to increase dose and engagement (`cochrane-mirror-therapy-2018`, `cochrane-vr-stroke-2025`)
   - Accepted evidence wording: `mirror therapy`; `virtual reality adjunct`; `increase dose and engagement`
4. Use treadmill training with or without body-weight support for walking (`cochrane-treadmill-bws-2017`)
   - Accepted evidence wording: `treadmill training`; `body weight support`; `walking speed and endurance`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

### 7. Advanced assessment of adult neurological conditions

Topic ID: `adult-neuro-assessment`

#### Question — GUIDED / RECALL_SPRINT

Explain a structured physiotherapy assessment of an adult with a neurological condition, integrating impairment, activity, and participation with validated tools.

**Expected answer — required evidence criteria:**

1. Start early with structured assessment across body structure, activity, and participation (`aha-asa-stroke-rehab-2016`)
   - Accepted evidence wording: `early structured assessment`; `impairment activity participation`; `ICF framework`
2. Use Fugl-Meyer, Berg Balance, and MMSE to objectify motor, balance, and cognitive status (`fugl-meyer-1975`, `berg-balance-1992`, `mmse-folstein-1975`)
   - Accepted evidence wording: `Fugl-Meyer Assessment`; `Berg Balance Scale`; `Mini-Mental State Examination`
3. Screen for fatigue, mood, vision, hearing, and communication before planning (`nice-ng236-stroke-rehab`)
   - Accepted evidence wording: `screen fatigue and mood`; `vision hearing communication`; `routine screening`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — GUIDED / DEEP_RESEARCH

Use the cited evidence sources to prepare, then answer: Explain a structured physiotherapy assessment of an adult with a neurological condition, integrating impairment, activity, and participation with validated tools. State the source scope, one uncertainty, and what requires patient-specific clinical judgment.

**Expected answer — required evidence criteria:**

1. Start early with structured assessment across body structure, activity, and participation (`aha-asa-stroke-rehab-2016`)
   - Accepted evidence wording: `early structured assessment`; `impairment activity participation`; `ICF framework`
2. Use Fugl-Meyer, Berg Balance, and MMSE to objectify motor, balance, and cognitive status (`fugl-meyer-1975`, `berg-balance-1992`, `mmse-folstein-1975`)
   - Accepted evidence wording: `Fugl-Meyer Assessment`; `Berg Balance Scale`; `Mini-Mental State Examination`
3. Screen for fatigue, mood, vision, hearing, and communication before planning (`nice-ng236-stroke-rehab`)
   - Accepted evidence wording: `screen fatigue and mood`; `vision hearing communication`; `routine screening`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

### 8. Advanced pediatric assessment: GMFM and GMFCS

Topic ID: `pediatric-gross-motor-assessment`

#### Question — GUIDED / RECALL_SPRINT

Explain how the GMFM and GMFCS are used to assess and classify gross motor function in children with cerebral palsy and other paediatric neuro conditions.

**Expected answer — required evidence criteria:**

1. Use GMFM-66/88 as a criterion-referenced, change-sensitive measure of gross motor function (`gmfm-russell-1989`)
   - Accepted evidence wording: `Gross Motor Function Measure`; `criterion-referenced measure`; `change-sensitive`
2. Classify gross motor ability with GMFCS levels I to V to predict mobility and guide goals (`gmfcs-palisano-1997`)
   - Accepted evidence wording: `GMFCS classification`; `gross motor function classification`; `mobility trajectory`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — GUIDED / DEEP_RESEARCH

Use the cited evidence sources to prepare, then answer: Explain how the GMFM and GMFCS are used to assess and classify gross motor function in children with cerebral palsy and other paediatric neuro conditions. State the source scope, one uncertainty, and what requires patient-specific clinical judgment.

**Expected answer — required evidence criteria:**

1. Use GMFM-66/88 as a criterion-referenced, change-sensitive measure of gross motor function (`gmfm-russell-1989`)
   - Accepted evidence wording: `Gross Motor Function Measure`; `criterion-referenced measure`; `change-sensitive`
2. Classify gross motor ability with GMFCS levels I to V to predict mobility and guide goals (`gmfcs-palisano-1997`)
   - Accepted evidence wording: `GMFCS classification`; `gross motor function classification`; `mobility trajectory`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

### 9. Posture and gait management in pediatric neurological conditions

Topic ID: `pediatric-posture-gait-cp`

#### Question — GUIDED / RECALL_SPRINT

Explain assessment and management of posture and gait in children with cerebral palsy, linking GMFCS level to intervention goals.

**Expected answer — required evidence criteria:**

1. Link posture and gait management to GMFCS level and functional goals (`gmfcs-palisano-1997`, `nice-ng62-cerebral-palsy`)
   - Accepted evidence wording: `GMFCS level`; `posture and gait management`; `functional goals`
2. Use MDT surveillance and orthotic or surgical options aligned to motor prognosis (`nice-ng62-cerebral-palsy`)
   - Accepted evidence wording: `orthotic management`; `MDT surveillance`; `motor prognosis`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — GUIDED / DEEP_RESEARCH

Use the cited evidence sources to prepare, then answer: Explain assessment and management of posture and gait in children with cerebral palsy, linking GMFCS level to intervention goals. State the source scope, one uncertainty, and what requires patient-specific clinical judgment.

**Expected answer — required evidence criteria:**

1. Link posture and gait management to GMFCS level and functional goals (`gmfcs-palisano-1997`, `nice-ng62-cerebral-palsy`)
   - Accepted evidence wording: `GMFCS level`; `posture and gait management`; `functional goals`
2. Use MDT surveillance and orthotic or surgical options aligned to motor prognosis (`nice-ng62-cerebral-palsy`)
   - Accepted evidence wording: `orthotic management`; `MDT surveillance`; `motor prognosis`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

### 10. Management of progressive and non-progressive pediatric neurological conditions

Topic ID: `pediatric-progressive-management`

#### Question — GUIDED / RECALL_SPRINT

Explain how physiotherapy management differs between progressive (e.g., DMD, SMA) and non-progressive (e.g., cerebral palsy) paediatric conditions.

**Expected answer — required evidence criteria:**

1. For progressive conditions, focus on contracture prevention, postural care, and ambulation preservation within MDT care (`dmd-care-birnkrant-2018`, `sma-care-mercuri-2018`)
   - Accepted evidence wording: `progressive conditions`; `contracture prevention`; `ambulation preservation`
2. For non-progressive conditions, emphasise task-oriented motor learning and GMFCS-stratified goals (`nice-ng62-cerebral-palsy`, `gmfcs-palisano-1997`)
   - Accepted evidence wording: `non-progressive conditions`; `motor learning`; `GMFCS-stratified goals`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — GUIDED / DEEP_RESEARCH

Use the cited evidence sources to prepare, then answer: Explain how physiotherapy management differs between progressive (e.g., DMD, SMA) and non-progressive (e.g., cerebral palsy) paediatric conditions. State the source scope, one uncertainty, and what requires patient-specific clinical judgment.

**Expected answer — required evidence criteria:**

1. For progressive conditions, focus on contracture prevention, postural care, and ambulation preservation within MDT care (`dmd-care-birnkrant-2018`, `sma-care-mercuri-2018`)
   - Accepted evidence wording: `progressive conditions`; `contracture prevention`; `ambulation preservation`
2. For non-progressive conditions, emphasise task-oriented motor learning and GMFCS-stratified goals (`nice-ng62-cerebral-palsy`, `gmfcs-palisano-1997`)
   - Accepted evidence wording: `non-progressive conditions`; `motor learning`; `GMFCS-stratified goals`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

### 11. Neural plasticity and dose in neurorehabilitation

Topic ID: `neural-plasticity-dose`

#### Question — GUIDED / RECALL_SPRINT

Explain how neural plasticity and movement plasticity inform the dose and design of neurorehabilitation, using evidence of dose-response.

**Expected answer — required evidence criteria:**

1. Apply high-repetition, task-oriented practice to drive experience-dependent plasticity (`aha-asa-stroke-rehab-2016`)
   - Accepted evidence wording: `experience-dependent plasticity`; `high-repetition practice`; `task-oriented practice`
2. Expect a definable recovery sequence, tracked with the Fugl-Meyer Assessment (`fugl-meyer-1975`)
   - Accepted evidence wording: `recovery sequence`; `proximal to distal`; `Fugl-Meyer Assessment`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — GUIDED / DEEP_RESEARCH

Use the cited evidence sources to prepare, then answer: Explain how neural plasticity and movement plasticity inform the dose and design of neurorehabilitation, using evidence of dose-response. State the source scope, one uncertainty, and what requires patient-specific clinical judgment.

**Expected answer — required evidence criteria:**

1. Apply high-repetition, task-oriented practice to drive experience-dependent plasticity (`aha-asa-stroke-rehab-2016`)
   - Accepted evidence wording: `experience-dependent plasticity`; `high-repetition practice`; `task-oriented practice`
2. Expect a definable recovery sequence, tracked with the Fugl-Meyer Assessment (`fugl-meyer-1975`)
   - Accepted evidence wording: `recovery sequence`; `proximal to distal`; `Fugl-Meyer Assessment`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

### 12. Evidence-based practice in adult neurorehabilitation

Topic ID: `adult-neuro-ebp`

#### Question — GUIDED / RECALL_SPRINT

Explain how evidence-based practice shapes adult neurorehabilitation, including therapy intensity, telerehabilitation, and outcome review.

**Expected answer — required evidence criteria:**

1. Deliver structured, high-repetition task practice at sufficient dose (`nice-ng236-stroke-rehab`)
   - Accepted evidence wording: `sufficient dose`; `structured task practice`; `therapy intensity`
2. Use telerehabilitation as an acceptable delivery mode where appropriate (`nice-ng236-stroke-rehab`)
   - Accepted evidence wording: `telerehabilitation`; `delivery mode`; `remote rehabilitation`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — GUIDED / DEEP_RESEARCH

Use the cited evidence sources to prepare, then answer: Explain how evidence-based practice shapes adult neurorehabilitation, including therapy intensity, telerehabilitation, and outcome review. State the source scope, one uncertainty, and what requires patient-specific clinical judgment.

**Expected answer — required evidence criteria:**

1. Deliver structured, high-repetition task practice at sufficient dose (`nice-ng236-stroke-rehab`)
   - Accepted evidence wording: `sufficient dose`; `structured task practice`; `therapy intensity`
2. Use telerehabilitation as an acceptable delivery mode where appropriate (`nice-ng236-stroke-rehab`)
   - Accepted evidence wording: `telerehabilitation`; `delivery mode`; `remote rehabilitation`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

### 13. Community integration and early supported discharge after neurological injury

Topic ID: `adult-community-integration`

#### Question — GUIDED / RECALL_SPRINT

Explain how early supported discharge and community therapy support participation and continuity after neurological injury.

**Expected answer — required evidence criteria:**

1. Use early supported discharge with community therapy for eligible patients (`nice-ng236-stroke-rehab`)
   - Accepted evidence wording: `early supported discharge`; `community therapy`; `community rehabilitation`
2. Plan continuity and participation-focused goals beyond the acute phase (`nice-ng236-stroke-rehab`, `aha-asa-stroke-rehab-2016`)
   - Accepted evidence wording: `continuity of therapy`; `participation goals`; `community integration`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — GUIDED / DEEP_RESEARCH

Use the cited evidence sources to prepare, then answer: Explain how early supported discharge and community therapy support participation and continuity after neurological injury. State the source scope, one uncertainty, and what requires patient-specific clinical judgment.

**Expected answer — required evidence criteria:**

1. Use early supported discharge with community therapy for eligible patients (`nice-ng236-stroke-rehab`)
   - Accepted evidence wording: `early supported discharge`; `community therapy`; `community rehabilitation`
2. Plan continuity and participation-focused goals beyond the acute phase (`nice-ng236-stroke-rehab`, `aha-asa-stroke-rehab-2016`)
   - Accepted evidence wording: `continuity of therapy`; `participation goals`; `community integration`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

### 14. Pharmacotherapeutics in adult neurological conditions: Parkinson's

Topic ID: `parkinsons-pharmacotherapy`

#### Question — GUIDED / RECALL_SPRINT

Explain how pharmacotherapy for Parkinson's disease interacts with physiotherapy, including levodopa-based motor management and non-motor symptoms.

**Expected answer — required evidence criteria:**

1. Recognise levodopa-based management of motor symptoms and time therapy with medication cycles (`nice-ng71-parkinsons`)
   - Accepted evidence wording: `levodopa-based management`; `motor symptoms`; `on off fluctuations`
2. Identify non-motor symptoms that require separate management (`nice-ng71-parkinsons`)
   - Accepted evidence wording: `non-motor symptoms`; `depression sleep autonomic`; `separate management`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — GUIDED / DEEP_RESEARCH

Use the cited evidence sources to prepare, then answer: Explain how pharmacotherapy for Parkinson's disease interacts with physiotherapy, including levodopa-based motor management and non-motor symptoms. State the source scope, one uncertainty, and what requires patient-specific clinical judgment.

**Expected answer — required evidence criteria:**

1. Recognise levodopa-based management of motor symptoms and time therapy with medication cycles (`nice-ng71-parkinsons`)
   - Accepted evidence wording: `levodopa-based management`; `motor symptoms`; `on off fluctuations`
2. Identify non-motor symptoms that require separate management (`nice-ng71-parkinsons`)
   - Accepted evidence wording: `non-motor symptoms`; `depression sleep autonomic`; `separate management`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

### 15. Recent advances in technology for neurological physiotherapy

Topic ID: `neuro-tech-vr-fes`

#### Question — GUIDED / RECALL_SPRINT

Explain the role of technology in neuro physiotherapy, including virtual reality and functional electrical stimulation, and their evidence as adjuncts.

**Expected answer — required evidence criteria:**

1. Use virtual reality and interactive gaming as an adjunct to increase dose and engagement after stroke (`cochrane-vr-stroke-2025`)
   - Accepted evidence wording: `virtual reality`; `interactive gaming`; `adjunct to increase dose`
2. Apply functional electrical stimulation for specific impairments where evidence supports (`aha-asa-stroke-rehab-2016`)
   - Accepted evidence wording: `functional electrical stimulation`; `FES`; `evidence-based adjunct`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — GUIDED / DEEP_RESEARCH

Use the cited evidence sources to prepare, then answer: Explain the role of technology in neuro physiotherapy, including virtual reality and functional electrical stimulation, and their evidence as adjuncts. State the source scope, one uncertainty, and what requires patient-specific clinical judgment.

**Expected answer — required evidence criteria:**

1. Use virtual reality and interactive gaming as an adjunct to increase dose and engagement after stroke (`cochrane-vr-stroke-2025`)
   - Accepted evidence wording: `virtual reality`; `interactive gaming`; `adjunct to increase dose`
2. Apply functional electrical stimulation for specific impairments where evidence supports (`aha-asa-stroke-rehab-2016`)
   - Accepted evidence wording: `functional electrical stimulation`; `FES`; `evidence-based adjunct`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

### 16. Spinal cord injury: ISNCSCI classification and early management

Topic ID: `spinal-cord-injury-isncsci`

#### Question — GUIDED / RECALL_SPRINT

Explain how the ISNCSCI examination classifies spinal cord injury and how the AIS grade and neurological level guide early physiotherapy management.

**Expected answer — required evidence criteria:**

1. Perform the ISNCSCI motor and sensory examination to determine the neurological level and AIS grade (`asia-isncsci-9th-2026`)
   - Accepted evidence wording: `ISNCSCI examination`; `motor and sensory examination`; `neurological level of injury`; `AIS grade`
2. Use sacral sparing and key muscle levels to define completeness of injury (`asia-isncsci-9th-2026`)
   - Accepted evidence wording: `sacral sparing`; `ASIA Impairment Scale`; `completeness of injury`
3. Guide early management by neurological level within the rehabilitation team (`asia-isncsci-9th-2026`)
   - Accepted evidence wording: `early management by level`; `rehabilitation team`; `neurological level guides management`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — GUIDED / DEEP_RESEARCH

Use the cited evidence sources to prepare, then answer: Explain how the ISNCSCI examination classifies spinal cord injury and how the AIS grade and neurological level guide early physiotherapy management. State the source scope, one uncertainty, and what requires patient-specific clinical judgment.

**Expected answer — required evidence criteria:**

1. Perform the ISNCSCI motor and sensory examination to determine the neurological level and AIS grade (`asia-isncsci-9th-2026`)
   - Accepted evidence wording: `ISNCSCI examination`; `motor and sensory examination`; `neurological level of injury`; `AIS grade`
2. Use sacral sparing and key muscle levels to define completeness of injury (`asia-isncsci-9th-2026`)
   - Accepted evidence wording: `sacral sparing`; `ASIA Impairment Scale`; `completeness of injury`
3. Guide early management by neurological level within the rehabilitation team (`asia-isncsci-9th-2026`)
   - Accepted evidence wording: `early management by level`; `rehabilitation team`; `neurological level guides management`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

### 17. Embryology of the nervous system; principles of human development

Topic ID: `neu-embryology-nervous-system`

#### Question — GUIDED / RECALL_SPRINT

Explain the clinically relevant development of the nervous system and how developmental history informs—but does not replace—a pediatric physiotherapy assessment.

**Expected answer — required evidence criteria:**

1. Relate neurulation and neural-tube formation to development of the central nervous system (`campbell-pt-children-2023`, `umphred-neuro-rehab-2025`)
   - Accepted evidence wording: `neurulation`; `neural tube`; `central nervous system development`
2. Distinguish central nervous system development from neural-crest contributions to peripheral structures (`campbell-pt-children-2023`)
   - Accepted evidence wording: `neural crest`; `peripheral nervous system development`; `central and peripheral development`
3. Use prenatal, perinatal, and developmental history alongside current function rather than inferring a diagnosis from history alone (`campbell-pt-children-2023`, `umphred-neuro-rehab-2025`)
   - Accepted evidence wording: `prenatal and perinatal history`; `developmental history`; `not diagnostic alone`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — GUIDED / DEEP_RESEARCH

Use the cited evidence sources to prepare, then answer: Explain the clinically relevant development of the nervous system and how developmental history informs—but does not replace—a pediatric physiotherapy assessment. State the source scope, one uncertainty, and what requires patient-specific clinical judgment.

**Expected answer — required evidence criteria:**

1. Relate neurulation and neural-tube formation to development of the central nervous system (`campbell-pt-children-2023`, `umphred-neuro-rehab-2025`)
   - Accepted evidence wording: `neurulation`; `neural tube`; `central nervous system development`
2. Distinguish central nervous system development from neural-crest contributions to peripheral structures (`campbell-pt-children-2023`)
   - Accepted evidence wording: `neural crest`; `peripheral nervous system development`; `central and peripheral development`
3. Use prenatal, perinatal, and developmental history alongside current function rather than inferring a diagnosis from history alone (`campbell-pt-children-2023`, `umphred-neuro-rehab-2025`)
   - Accepted evidence wording: `prenatal and perinatal history`; `developmental history`; `not diagnostic alone`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

### 18. Gross & fine motor development; assessment & testing of infant and child

Topic ID: `neu-gross-fine-motor-development-assessment`

#### Question — GUIDED / RECALL_SPRINT

Explain how to assess gross and fine motor development using developmental surveillance, standardized measures, observation, and the child's family and functional context.

**Expected answer — required evidence criteria:**

1. Assess the developmental trajectory across motor and related domains, not a single milestone in isolation (`cdc-developmental-milestones-2026`, `campbell-pt-children-2023`)
   - Accepted evidence wording: `developmental trajectory`; `multiple developmental domains`; `not one milestone alone`
2. Combine standardized age-appropriate measurement with observation of movement quality, activity, and participation (`campbell-pt-children-2023`)
   - Accepted evidence wording: `standardized assessment`; `movement quality`; `activity and participation`
3. Treat milestone checklists as surveillance aids rather than diagnostic or validated screening instruments and refer concerns for formal assessment (`cdc-developmental-milestones-2026`)
   - Accepted evidence wording: `surveillance aid`; `not diagnostic`; `refer for formal screening`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — GUIDED / DEEP_RESEARCH

Use the cited evidence sources to prepare, then answer: Explain how to assess gross and fine motor development using developmental surveillance, standardized measures, observation, and the child's family and functional context. State the source scope, one uncertainty, and what requires patient-specific clinical judgment.

**Expected answer — required evidence criteria:**

1. Assess the developmental trajectory across motor and related domains, not a single milestone in isolation (`cdc-developmental-milestones-2026`, `campbell-pt-children-2023`)
   - Accepted evidence wording: `developmental trajectory`; `multiple developmental domains`; `not one milestone alone`
2. Combine standardized age-appropriate measurement with observation of movement quality, activity, and participation (`campbell-pt-children-2023`)
   - Accepted evidence wording: `standardized assessment`; `movement quality`; `activity and participation`
3. Treat milestone checklists as surveillance aids rather than diagnostic or validated screening instruments and refer concerns for formal assessment (`cdc-developmental-milestones-2026`)
   - Accepted evidence wording: `surveillance aid`; `not diagnostic`; `refer for formal screening`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

### 19. Developmental reflexes (primitive, spinal, brainstem, cortical)

Topic ID: `neu-developmental-reflexes`

#### Question — GUIDED / RECALL_SPRINT

Explain how primitive and postural responses are examined in developmental assessment and why their presence, absence, asymmetry, or persistence must be interpreted in context.

**Expected answer — required evidence criteria:**

1. Describe primitive and postural responses as one part of the developing motor-control system (`campbell-pt-children-2023`, `shumway-cook-motor-control-2023`)
   - Accepted evidence wording: `primitive reflexes`; `postural reactions`; `developing motor control`
2. Observe response quality, symmetry, and age-related integration rather than recording presence alone (`campbell-pt-children-2023`)
   - Accepted evidence wording: `response quality`; `symmetry`; `age-related integration`
3. Integrate reflex findings with tone, voluntary movement, function, and standardized assessment; do not diagnose from a reflex in isolation (`campbell-pt-children-2023`, `umphred-neuro-rehab-2025`)
   - Accepted evidence wording: `integrate with voluntary movement`; `functional assessment`; `not diagnostic alone`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — GUIDED / DEEP_RESEARCH

Use the cited evidence sources to prepare, then answer: Explain how primitive and postural responses are examined in developmental assessment and why their presence, absence, asymmetry, or persistence must be interpreted in context. State the source scope, one uncertainty, and what requires patient-specific clinical judgment.

**Expected answer — required evidence criteria:**

1. Describe primitive and postural responses as one part of the developing motor-control system (`campbell-pt-children-2023`, `shumway-cook-motor-control-2023`)
   - Accepted evidence wording: `primitive reflexes`; `postural reactions`; `developing motor control`
2. Observe response quality, symmetry, and age-related integration rather than recording presence alone (`campbell-pt-children-2023`)
   - Accepted evidence wording: `response quality`; `symmetry`; `age-related integration`
3. Integrate reflex findings with tone, voluntary movement, function, and standardized assessment; do not diagnose from a reflex in isolation (`campbell-pt-children-2023`, `umphred-neuro-rehab-2025`)
   - Accepted evidence wording: `integrate with voluntary movement`; `functional assessment`; `not diagnostic alone`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

### 20. Theories of motor development, motor control & motor learning; stages of learning

Topic ID: `neu-motor-development-control-learning-theories`

#### Question — GUIDED / RECALL_SPRINT

Compare major motor-control and motor-learning perspectives and show how task, learner, environment, practice, and feedback shape a physiotherapy plan.

**Expected answer — required evidence criteria:**

1. Use a systems perspective in which movement emerges from interaction among the person, task, and environment (`shumway-cook-motor-control-2023`)
   - Accepted evidence wording: `person task environment`; `systems perspective`; `movement emerges from interaction`
2. Match practice structure and feedback to the learner's stage, goals, and task demands (`shumway-cook-motor-control-2023`)
   - Accepted evidence wording: `practice structure`; `feedback schedule`; `stage of learning`
3. Prioritize meaningful task-specific repetition and transfer to real contexts while monitoring performance and retention (`shumway-cook-motor-control-2023`, `umphred-neuro-rehab-2025`)
   - Accepted evidence wording: `task-specific repetition`; `retention and transfer`; `meaningful practice`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — GUIDED / DEEP_RESEARCH

Use the cited evidence sources to prepare, then answer: Compare major motor-control and motor-learning perspectives and show how task, learner, environment, practice, and feedback shape a physiotherapy plan. State the source scope, one uncertainty, and what requires patient-specific clinical judgment.

**Expected answer — required evidence criteria:**

1. Use a systems perspective in which movement emerges from interaction among the person, task, and environment (`shumway-cook-motor-control-2023`)
   - Accepted evidence wording: `person task environment`; `systems perspective`; `movement emerges from interaction`
2. Match practice structure and feedback to the learner's stage, goals, and task demands (`shumway-cook-motor-control-2023`)
   - Accepted evidence wording: `practice structure`; `feedback schedule`; `stage of learning`
3. Prioritize meaningful task-specific repetition and transfer to real contexts while monitoring performance and retention (`shumway-cook-motor-control-2023`, `umphred-neuro-rehab-2025`)
   - Accepted evidence wording: `task-specific repetition`; `retention and transfer`; `meaningful practice`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

### 21. Early identification & early intervention in pediatric neurological disorders

Topic ID: `neu-early-identification-intervention-pediatric`

#### Question — GUIDED / RECALL_SPRINT

Explain a pathway for early identification and early intervention when cerebral palsy or another pediatric neurological disorder is suspected.

**Expected answer — required evidence criteria:**

1. Use converging history, standardized neurological or movement assessment, and neuroimaging where clinically indicated rather than a wait-and-see approach (`aacpdm-early-cp-detection`)
   - Accepted evidence wording: `standardized neurological assessment`; `general movements assessment`; `do not wait and see`
2. Communicate risk sensitively and refer promptly to the appropriate diagnostic and multidisciplinary pathway (`aacpdm-early-cp-detection`, `morgan-early-cp-intervention-2021`)
   - Accepted evidence wording: `communicate risk sensitively`; `prompt referral`; `multidisciplinary pathway`
3. Begin goal-directed, active, task-specific, family-supported intervention for infants at high risk while monitoring development (`morgan-early-cp-intervention-2021`)
   - Accepted evidence wording: `goal-directed intervention`; `active task-specific practice`; `family-supported early intervention`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — GUIDED / DEEP_RESEARCH

Use the cited evidence sources to prepare, then answer: Explain a pathway for early identification and early intervention when cerebral palsy or another pediatric neurological disorder is suspected. State the source scope, one uncertainty, and what requires patient-specific clinical judgment.

**Expected answer — required evidence criteria:**

1. Use converging history, standardized neurological or movement assessment, and neuroimaging where clinically indicated rather than a wait-and-see approach (`aacpdm-early-cp-detection`)
   - Accepted evidence wording: `standardized neurological assessment`; `general movements assessment`; `do not wait and see`
2. Communicate risk sensitively and refer promptly to the appropriate diagnostic and multidisciplinary pathway (`aacpdm-early-cp-detection`, `morgan-early-cp-intervention-2021`)
   - Accepted evidence wording: `communicate risk sensitively`; `prompt referral`; `multidisciplinary pathway`
3. Begin goal-directed, active, task-specific, family-supported intervention for infants at high risk while monitoring development (`morgan-early-cp-intervention-2021`)
   - Accepted evidence wording: `goal-directed intervention`; `active task-specific practice`; `family-supported early intervention`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

### 22. Infant at high risk for developmental delay

Topic ID: `neu-infant-high-risk-developmental-delay`

#### Question — GUIDED / RECALL_SPRINT

Explain physiotherapy assessment, surveillance, and family-supported intervention for an infant at high risk of developmental delay.

**Expected answer — required evidence criteria:**

1. Identify relevant antenatal, perinatal, neonatal, medical, and environmental risk information (`campbell-pt-children-2023`, `apta-pediatrics-resources-2026`)
   - Accepted evidence wording: `antenatal and perinatal risk`; `neonatal history`; `environmental risk`
2. Use repeated standardized assessment and observation of spontaneous movement and function, not milestones alone (`aacpdm-early-cp-detection`, `campbell-pt-children-2023`)
   - Accepted evidence wording: `longitudinal standardized assessment`; `spontaneous movement`; `not milestones alone`
3. Coach caregivers in safe, active, goal-directed opportunities embedded in daily routines and coordinate early referral (`morgan-early-cp-intervention-2021`)
   - Accepted evidence wording: `caregiver coaching`; `daily routines`; `early referral`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — GUIDED / DEEP_RESEARCH

Use the cited evidence sources to prepare, then answer: Explain physiotherapy assessment, surveillance, and family-supported intervention for an infant at high risk of developmental delay. State the source scope, one uncertainty, and what requires patient-specific clinical judgment.

**Expected answer — required evidence criteria:**

1. Identify relevant antenatal, perinatal, neonatal, medical, and environmental risk information (`campbell-pt-children-2023`, `apta-pediatrics-resources-2026`)
   - Accepted evidence wording: `antenatal and perinatal risk`; `neonatal history`; `environmental risk`
2. Use repeated standardized assessment and observation of spontaneous movement and function, not milestones alone (`aacpdm-early-cp-detection`, `campbell-pt-children-2023`)
   - Accepted evidence wording: `longitudinal standardized assessment`; `spontaneous movement`; `not milestones alone`
3. Coach caregivers in safe, active, goal-directed opportunities embedded in daily routines and coordinate early referral (`morgan-early-cp-intervention-2021`)
   - Accepted evidence wording: `caregiver coaching`; `daily routines`; `early referral`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

### 23. Spina bifida

Topic ID: `neu-spina-bifida`

#### Question — GUIDED / RECALL_SPRINT

Explain physiotherapy assessment and lifespan mobility management for spina bifida, including skin, musculoskeletal, equipment, participation, and escalation concerns.

**Expected answer — required evidence criteria:**

1. Relate neurological level, strength, range, alignment, sensation, and developmental status to functional mobility (`spina-bifida-mobility-guideline`, `campbell-pt-children-2023`)
   - Accepted evidence wording: `neurological level`; `strength range and alignment`; `functional mobility`
2. Plan individualized mobility, positioning, skin protection, orthotic, wheelchair, and physical-activity support with regular reassessment (`spina-bifida-mobility-guideline`, `who-wheelchair-provision-2023`)
   - Accepted evidence wording: `skin protection`; `orthotic and wheelchair`; `individualized mobility`
3. Coordinate multidisciplinary surveillance and urgently escalate new neurological loss, shunt concerns, skin breakdown, or suspected tethered cord (`spina-bifida-mobility-guideline`, `cns-pediatric-hydrocephalus-2020`)
   - Accepted evidence wording: `multidisciplinary surveillance`; `shunt concern`; `tethered cord or skin breakdown`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — GUIDED / DEEP_RESEARCH

Use the cited evidence sources to prepare, then answer: Explain physiotherapy assessment and lifespan mobility management for spina bifida, including skin, musculoskeletal, equipment, participation, and escalation concerns. State the source scope, one uncertainty, and what requires patient-specific clinical judgment.

**Expected answer — required evidence criteria:**

1. Relate neurological level, strength, range, alignment, sensation, and developmental status to functional mobility (`spina-bifida-mobility-guideline`, `campbell-pt-children-2023`)
   - Accepted evidence wording: `neurological level`; `strength range and alignment`; `functional mobility`
2. Plan individualized mobility, positioning, skin protection, orthotic, wheelchair, and physical-activity support with regular reassessment (`spina-bifida-mobility-guideline`, `who-wheelchair-provision-2023`)
   - Accepted evidence wording: `skin protection`; `orthotic and wheelchair`; `individualized mobility`
3. Coordinate multidisciplinary surveillance and urgently escalate new neurological loss, shunt concerns, skin breakdown, or suspected tethered cord (`spina-bifida-mobility-guideline`, `cns-pediatric-hydrocephalus-2020`)
   - Accepted evidence wording: `multidisciplinary surveillance`; `shunt concern`; `tethered cord or skin breakdown`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

### 24. Pediatric traumatic brain injury & traumatic/non-traumatic spinal cord injury

Topic ID: `neu-pediatric-tbi-sci`

#### Question — GUIDED / RECALL_SPRINT

Explain staged physiotherapy management for pediatric brain or spinal cord injury from acute safety through rehabilitation and participation.

**Expected answer — required evidence criteria:**

1. Confirm medical and neurological stability, precautions, and team-defined physiological limits before mobilization in acute severe injury (`btf-pediatric-severe-tbi`, `campbell-pt-children-2023`)
   - Accepted evidence wording: `medical stability`; `neurological precautions`; `team-defined limits`
2. Perform serial age-appropriate assessment of motor, sensory, respiratory, cognitive, functional, and participation needs (`campbell-pt-children-2023`, `umphred-neuro-rehab-2025`)
   - Accepted evidence wording: `serial assessment`; `motor sensory and respiratory`; `function and participation`
3. Progress positioning, mobility, task practice, equipment, education, and participation goals while preventing secondary complications (`campbell-pt-children-2023`, `umphred-neuro-rehab-2025`)
   - Accepted evidence wording: `prevent secondary complications`; `progress mobility`; `family education and participation`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — GUIDED / DEEP_RESEARCH

Use the cited evidence sources to prepare, then answer: Explain staged physiotherapy management for pediatric brain or spinal cord injury from acute safety through rehabilitation and participation. State the source scope, one uncertainty, and what requires patient-specific clinical judgment.

**Expected answer — required evidence criteria:**

1. Confirm medical and neurological stability, precautions, and team-defined physiological limits before mobilization in acute severe injury (`btf-pediatric-severe-tbi`, `campbell-pt-children-2023`)
   - Accepted evidence wording: `medical stability`; `neurological precautions`; `team-defined limits`
2. Perform serial age-appropriate assessment of motor, sensory, respiratory, cognitive, functional, and participation needs (`campbell-pt-children-2023`, `umphred-neuro-rehab-2025`)
   - Accepted evidence wording: `serial assessment`; `motor sensory and respiratory`; `function and participation`
3. Progress positioning, mobility, task practice, equipment, education, and participation goals while preventing secondary complications (`campbell-pt-children-2023`, `umphred-neuro-rehab-2025`)
   - Accepted evidence wording: `prevent secondary complications`; `progress mobility`; `family education and participation`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

### 25. Intellectual disabilities — Down syndrome

Topic ID: `neu-down-syndrome-intellectual-disability`

#### Question — GUIDED / RECALL_SPRINT

Explain a strengths-based physiotherapy assessment and management plan for a child or adolescent with Down syndrome.

**Expected answer — required evidence criteria:**

1. Assess motor development, strength, balance, endurance, joint mobility, activity, and participation rather than assuming limitations from diagnosis (`aap-down-syndrome-2022`, `campbell-pt-children-2023`)
   - Accepted evidence wording: `motor and functional assessment`; `strength balance endurance`; `individual assessment`
2. Use active, goal-directed practice and physical-activity support adapted to communication, learning, and family priorities (`aap-down-syndrome-2022`, `campbell-pt-children-2023`)
   - Accepted evidence wording: `active goal-directed practice`; `physical activity`; `family priorities`
3. Coordinate health surveillance and screen for symptoms or precautions that require medical review before higher-risk activity (`aap-down-syndrome-2022`)
   - Accepted evidence wording: `health surveillance`; `medical review before risk`; `cervical or cardiac symptoms`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — GUIDED / DEEP_RESEARCH

Use the cited evidence sources to prepare, then answer: Explain a strengths-based physiotherapy assessment and management plan for a child or adolescent with Down syndrome. State the source scope, one uncertainty, and what requires patient-specific clinical judgment.

**Expected answer — required evidence criteria:**

1. Assess motor development, strength, balance, endurance, joint mobility, activity, and participation rather than assuming limitations from diagnosis (`aap-down-syndrome-2022`, `campbell-pt-children-2023`)
   - Accepted evidence wording: `motor and functional assessment`; `strength balance endurance`; `individual assessment`
2. Use active, goal-directed practice and physical-activity support adapted to communication, learning, and family priorities (`aap-down-syndrome-2022`, `campbell-pt-children-2023`)
   - Accepted evidence wording: `active goal-directed practice`; `physical activity`; `family priorities`
3. Coordinate health surveillance and screen for symptoms or precautions that require medical review before higher-risk activity (`aap-down-syndrome-2022`)
   - Accepted evidence wording: `health surveillance`; `medical review before risk`; `cervical or cardiac symptoms`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

### 26. Autism spectrum disorder & physical therapy

Topic ID: `neu-autism-spectrum-physical-therapy`

#### Question — GUIDED / RECALL_SPRINT

Explain the appropriate role of physiotherapy for an autistic child, focusing on motor function, physical activity, access, participation, and individualized support.

**Expected answer — required evidence criteria:**

1. Assess and address identified movement, coordination, balance, fitness, mobility, or participation needs rather than treating autism itself (`nice-cg170-autism-under-19`, `campbell-pt-children-2023`)
   - Accepted evidence wording: `motor and participation needs`; `physical activity access`; `not treating autism itself`
2. Adapt communication, predictability, environment, and sensory demands with the child and family's preferences (`nice-cg170-autism-under-19`)
   - Accepted evidence wording: `adapt communication`; `predictable environment`; `sensory preferences`
3. Set functional multidisciplinary goals and avoid unsupported claims that physiotherapy cures core autistic characteristics (`nice-cg170-autism-under-19`)
   - Accepted evidence wording: `functional goals`; `multidisciplinary support`; `avoid cure claims`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — GUIDED / DEEP_RESEARCH

Use the cited evidence sources to prepare, then answer: Explain the appropriate role of physiotherapy for an autistic child, focusing on motor function, physical activity, access, participation, and individualized support. State the source scope, one uncertainty, and what requires patient-specific clinical judgment.

**Expected answer — required evidence criteria:**

1. Assess and address identified movement, coordination, balance, fitness, mobility, or participation needs rather than treating autism itself (`nice-cg170-autism-under-19`, `campbell-pt-children-2023`)
   - Accepted evidence wording: `motor and participation needs`; `physical activity access`; `not treating autism itself`
2. Adapt communication, predictability, environment, and sensory demands with the child and family's preferences (`nice-cg170-autism-under-19`)
   - Accepted evidence wording: `adapt communication`; `predictable environment`; `sensory preferences`
3. Set functional multidisciplinary goals and avoid unsupported claims that physiotherapy cures core autistic characteristics (`nice-cg170-autism-under-19`)
   - Accepted evidence wording: `functional goals`; `multidisciplinary support`; `avoid cure claims`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

### 27. Parent education & counselling; family-centred care

Topic ID: `neu-parent-education-family-centred-care`

#### Question — GUIDED / RECALL_SPRINT

Explain family-centred pediatric physiotherapy, including shared decisions, caregiver coaching, daily routines, consent, and sustainable goals.

**Expected answer — required evidence criteria:**

1. Treat the child and family as partners and use shared decisions based on their priorities, culture, resources, and expertise (`campbell-pt-children-2023`, `morgan-early-cp-intervention-2021`)
   - Accepted evidence wording: `family partnership`; `shared decision making`; `family priorities and culture`
2. Coach safe, active practice in meaningful daily routines instead of prescribing an unsustainable volume of passive handling (`morgan-early-cp-intervention-2021`)
   - Accepted evidence wording: `caregiver coaching`; `meaningful daily routines`; `active practice`
3. Agree measurable participation goals, check understanding and burden, and revise the plan as the child and context change (`campbell-pt-children-2023`)
   - Accepted evidence wording: `measurable participation goals`; `check family burden`; `reassess and revise`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — GUIDED / DEEP_RESEARCH

Use the cited evidence sources to prepare, then answer: Explain family-centred pediatric physiotherapy, including shared decisions, caregiver coaching, daily routines, consent, and sustainable goals. State the source scope, one uncertainty, and what requires patient-specific clinical judgment.

**Expected answer — required evidence criteria:**

1. Treat the child and family as partners and use shared decisions based on their priorities, culture, resources, and expertise (`campbell-pt-children-2023`, `morgan-early-cp-intervention-2021`)
   - Accepted evidence wording: `family partnership`; `shared decision making`; `family priorities and culture`
2. Coach safe, active practice in meaningful daily routines instead of prescribing an unsustainable volume of passive handling (`morgan-early-cp-intervention-2021`)
   - Accepted evidence wording: `caregiver coaching`; `meaningful daily routines`; `active practice`
3. Agree measurable participation goals, check understanding and burden, and revise the plan as the child and context change (`campbell-pt-children-2023`)
   - Accepted evidence wording: `measurable participation goals`; `check family burden`; `reassess and revise`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

### 28. Pathological & radiological investigations; evoked potentials

Topic ID: `neu-radiology-evoked-potentials`

#### Question — GUIDED / RECALL_SPRINT

Explain how a physiotherapist uses reports from neuroimaging, electrodiagnostic studies, and evoked potentials within clinical reasoning and professional scope.

**Expected answer — required evidence criteria:**

1. State the clinical question and understand that imaging describes structure while electrodiagnostic and evoked-potential tests assess aspects of pathway function (`umphred-neuro-rehab-2025`, `campbell-pt-children-2023`)
   - Accepted evidence wording: `imaging structure`; `evoked potential pathway function`; `clinical question`
2. Use the formal report and appropriate specialist interpretation; physiotherapists do not independently diagnose from raw investigations outside competence (`umphred-neuro-rehab-2025`)
   - Accepted evidence wording: `formal report`; `specialist interpretation`; `within competence`
3. Integrate investigation findings with history, examination, function, and change over time rather than treating a test as a stand-alone answer (`umphred-neuro-rehab-2025`, `aacpdm-early-cp-detection`)
   - Accepted evidence wording: `integrate with clinical examination`; `function over time`; `not a stand-alone test`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — GUIDED / DEEP_RESEARCH

Use the cited evidence sources to prepare, then answer: Explain how a physiotherapist uses reports from neuroimaging, electrodiagnostic studies, and evoked potentials within clinical reasoning and professional scope. State the source scope, one uncertainty, and what requires patient-specific clinical judgment.

**Expected answer — required evidence criteria:**

1. State the clinical question and understand that imaging describes structure while electrodiagnostic and evoked-potential tests assess aspects of pathway function (`umphred-neuro-rehab-2025`, `campbell-pt-children-2023`)
   - Accepted evidence wording: `imaging structure`; `evoked potential pathway function`; `clinical question`
2. Use the formal report and appropriate specialist interpretation; physiotherapists do not independently diagnose from raw investigations outside competence (`umphred-neuro-rehab-2025`)
   - Accepted evidence wording: `formal report`; `specialist interpretation`; `within competence`
3. Integrate investigation findings with history, examination, function, and change over time rather than treating a test as a stand-alone answer (`umphred-neuro-rehab-2025`, `aacpdm-early-cp-detection`)
   - Accepted evidence wording: `integrate with clinical examination`; `function over time`; `not a stand-alone test`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

### 29. Surgical procedures in neuropediatric disorders (hydrocephalus, spina bifida) & perioperative PT

Topic ID: `neu-neuropediatric-surgical-perioperative`

#### Question — GUIDED / RECALL_SPRINT

Explain the physiotherapy role around neurosurgical care for pediatric hydrocephalus or spina bifida, including baseline function, precautions, recovery, and escalation.

**Expected answer — required evidence criteria:**

1. Define diagnosis, procedure, medical stability, positioning, wound, device, and activity precautions with the neurosurgical team (`cns-pediatric-hydrocephalus-2020`, `spina-bifida-mobility-guideline`)
   - Accepted evidence wording: `neurosurgical precautions`; `medical stability`; `wound and device precautions`
2. Document preoperative function and, when cleared, progress respiratory care, positioning, transfers, mobility, equipment, and family education (`campbell-pt-children-2023`, `spina-bifida-mobility-guideline`)
   - Accepted evidence wording: `preoperative baseline`; `progress mobility when cleared`; `family education`
3. Stop and urgently escalate neurological deterioration, suspected shunt malfunction or infection, wound problems, or other acute instability (`cns-pediatric-hydrocephalus-2020`)
   - Accepted evidence wording: `shunt malfunction or infection`; `neurological deterioration`; `urgent escalation`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — GUIDED / DEEP_RESEARCH

Use the cited evidence sources to prepare, then answer: Explain the physiotherapy role around neurosurgical care for pediatric hydrocephalus or spina bifida, including baseline function, precautions, recovery, and escalation. State the source scope, one uncertainty, and what requires patient-specific clinical judgment.

**Expected answer — required evidence criteria:**

1. Define diagnosis, procedure, medical stability, positioning, wound, device, and activity precautions with the neurosurgical team (`cns-pediatric-hydrocephalus-2020`, `spina-bifida-mobility-guideline`)
   - Accepted evidence wording: `neurosurgical precautions`; `medical stability`; `wound and device precautions`
2. Document preoperative function and, when cleared, progress respiratory care, positioning, transfers, mobility, equipment, and family education (`campbell-pt-children-2023`, `spina-bifida-mobility-guideline`)
   - Accepted evidence wording: `preoperative baseline`; `progress mobility when cleared`; `family education`
3. Stop and urgently escalate neurological deterioration, suspected shunt malfunction or infection, wound problems, or other acute instability (`cns-pediatric-hydrocephalus-2020`)
   - Accepted evidence wording: `shunt malfunction or infection`; `neurological deterioration`; `urgent escalation`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

### 30. Advanced physiotherapy approaches (PNF, NDT, Rood's, Motor Relearning Program, Vojta)

Topic ID: `neu-classic-approaches-pnf-ndt-rood-vojta-mrp`

#### Question — GUIDED / RECALL_SPRINT

Critically compare PNF, NDT/Bobath, Rood, Vojta, and Motor Relearning approaches with contemporary task-specific motor-learning practice.

**Expected answer — required evidence criteria:**

1. Describe named approaches as historical or clinical frameworks with distinct handling, facilitation, or task-practice assumptions (`umphred-neuro-rehab-2025`, `shumway-cook-motor-control-2023`)
   - Accepted evidence wording: `named clinical frameworks`; `facilitation and handling`; `task-practice assumptions`
2. Do not claim that one named approach is universally superior; prioritize active, goal-directed, task-specific, sufficiently dosed practice (`shumway-cook-motor-control-2023`, `morgan-early-cp-intervention-2021`, `aha-asa-stroke-rehab-2016`)
   - Accepted evidence wording: `no universal superiority`; `active goal-directed practice`; `task-specific sufficient dose`
3. Select components by goal, evidence, child or adult response, preference, feasibility, and measured outcomes while stating uncertainty (`umphred-neuro-rehab-2025`, `shumway-cook-motor-control-2023`)
   - Accepted evidence wording: `select components by goal`; `measured outcomes`; `state evidence uncertainty`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — GUIDED / DEEP_RESEARCH

Use the cited evidence sources to prepare, then answer: Critically compare PNF, NDT/Bobath, Rood, Vojta, and Motor Relearning approaches with contemporary task-specific motor-learning practice. State the source scope, one uncertainty, and what requires patient-specific clinical judgment.

**Expected answer — required evidence criteria:**

1. Describe named approaches as historical or clinical frameworks with distinct handling, facilitation, or task-practice assumptions (`umphred-neuro-rehab-2025`, `shumway-cook-motor-control-2023`)
   - Accepted evidence wording: `named clinical frameworks`; `facilitation and handling`; `task-practice assumptions`
2. Do not claim that one named approach is universally superior; prioritize active, goal-directed, task-specific, sufficiently dosed practice (`shumway-cook-motor-control-2023`, `morgan-early-cp-intervention-2021`, `aha-asa-stroke-rehab-2016`)
   - Accepted evidence wording: `no universal superiority`; `active goal-directed practice`; `task-specific sufficient dose`
3. Select components by goal, evidence, child or adult response, preference, feasibility, and measured outcomes while stating uncertainty (`umphred-neuro-rehab-2025`, `shumway-cook-motor-control-2023`)
   - Accepted evidence wording: `select components by goal`; `measured outcomes`; `state evidence uncertainty`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

### 31. Clinical decision making & evidence-based practice (pediatric)

Topic ID: `neu-pediatric-clinical-decision-ebp`

#### Question — GUIDED / RECALL_SPRINT

Explain an evidence-based pediatric physiotherapy decision from assessment and goal setting through intervention choice, outcome review, and plan revision.

**Expected answer — required evidence criteria:**

1. Integrate the best available evidence with clinical expertise and the child and family's values and circumstances (`campbell-pt-children-2023`)
   - Accepted evidence wording: `best available evidence`; `clinical expertise`; `child and family values`
2. Form a functional problem list, agree participation-focused goals, and choose valid age- and condition-appropriate outcomes (`campbell-pt-children-2023`, `morgan-early-cp-intervention-2021`)
   - Accepted evidence wording: `functional problem list`; `participation goals`; `appropriate outcome measures`
3. Balance benefit, harm, burden, access, and feasibility; measure response and revise or escalate when progress or safety differs from expectation (`campbell-pt-children-2023`)
   - Accepted evidence wording: `benefit harm and burden`; `measure response`; `revise or escalate`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — GUIDED / DEEP_RESEARCH

Use the cited evidence sources to prepare, then answer: Explain an evidence-based pediatric physiotherapy decision from assessment and goal setting through intervention choice, outcome review, and plan revision. State the source scope, one uncertainty, and what requires patient-specific clinical judgment.

**Expected answer — required evidence criteria:**

1. Integrate the best available evidence with clinical expertise and the child and family's values and circumstances (`campbell-pt-children-2023`)
   - Accepted evidence wording: `best available evidence`; `clinical expertise`; `child and family values`
2. Form a functional problem list, agree participation-focused goals, and choose valid age- and condition-appropriate outcomes (`campbell-pt-children-2023`, `morgan-early-cp-intervention-2021`)
   - Accepted evidence wording: `functional problem list`; `participation goals`; `appropriate outcome measures`
3. Balance benefit, harm, burden, access, and feasibility; measure response and revise or escalate when progress or safety differs from expectation (`campbell-pt-children-2023`)
   - Accepted evidence wording: `benefit harm and burden`; `measure response`; `revise or escalate`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

### 32. Physiotherapy in neonatal & pediatric intensive care units

Topic ID: `neu-neonatal-pediatric-icu`

#### Question — GUIDED / RECALL_SPRINT

Explain safe physiotherapy assessment and intervention in neonatal and pediatric intensive care, including readiness, monitoring, developmental care, family partnership, and stop criteria.

**Expected answer — required evidence criteria:**

1. Confirm indication, medical stability, respiratory and neurological status, lines or devices, precautions, and team-defined readiness before intervention (`apta-pediatrics-resources-2026`, `campbell-pt-children-2023`)
   - Accepted evidence wording: `medical stability and readiness`; `lines and devices`; `team-defined precautions`
2. Individualize positioning, handling, respiratory support within scope, developmental activity, and early mobility to tolerance (`apta-pediatrics-resources-2026`, `campbell-pt-children-2023`)
   - Accepted evidence wording: `individualized positioning`; `developmental care`; `early mobility to tolerance`
3. Use continuous observation and relevant monitoring, minimize stress, involve caregivers, and stop or escalate for instability or distress (`apta-pediatrics-resources-2026`)
   - Accepted evidence wording: `monitor physiological response`; `minimize stress`; `stop for instability`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — GUIDED / DEEP_RESEARCH

Use the cited evidence sources to prepare, then answer: Explain safe physiotherapy assessment and intervention in neonatal and pediatric intensive care, including readiness, monitoring, developmental care, family partnership, and stop criteria. State the source scope, one uncertainty, and what requires patient-specific clinical judgment.

**Expected answer — required evidence criteria:**

1. Confirm indication, medical stability, respiratory and neurological status, lines or devices, precautions, and team-defined readiness before intervention (`apta-pediatrics-resources-2026`, `campbell-pt-children-2023`)
   - Accepted evidence wording: `medical stability and readiness`; `lines and devices`; `team-defined precautions`
2. Individualize positioning, handling, respiratory support within scope, developmental activity, and early mobility to tolerance (`apta-pediatrics-resources-2026`, `campbell-pt-children-2023`)
   - Accepted evidence wording: `individualized positioning`; `developmental care`; `early mobility to tolerance`
3. Use continuous observation and relevant monitoring, minimize stress, involve caregivers, and stop or escalate for instability or distress (`apta-pediatrics-resources-2026`)
   - Accepted evidence wording: `monitor physiological response`; `minimize stress`; `stop for instability`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

### 33. Social integration of children (school/community, assistive technology, legislation, orthotics/prosthetics)

Topic ID: `neu-pediatric-social-integration-orthotics-legislation`

#### Question — GUIDED / RECALL_SPRINT

Explain a participation-led plan for school and community inclusion using environmental change, assistive technology, mobility equipment, and orthotic or prosthetic services.

**Expected answer — required evidence criteria:**

1. Begin with the child's participation goals and identify personal, task, environmental, access, and attitudinal barriers with the family and school (`campbell-pt-children-2023`, `apta-pediatrics-resources-2026`)
   - Accepted evidence wording: `participation goals`; `environmental barriers`; `family and school collaboration`
2. Select assistive technology, seating, mobility, orthotic, or prosthetic options through assessment, shared choice, fitting, training, and follow-up (`who-wheelchair-provision-2023`, `campbell-pt-children-2023`)
   - Accepted evidence wording: `assistive technology assessment`; `fitting and training`; `follow-up`
3. Document functional need and reasonable supports, coordinate with relevant local education and disability processes, and review real-world participation (`apta-pediatrics-resources-2026`, `who-wheelchair-provision-2023`)
   - Accepted evidence wording: `document functional need`; `education and disability supports`; `review participation`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — GUIDED / DEEP_RESEARCH

Use the cited evidence sources to prepare, then answer: Explain a participation-led plan for school and community inclusion using environmental change, assistive technology, mobility equipment, and orthotic or prosthetic services. State the source scope, one uncertainty, and what requires patient-specific clinical judgment.

**Expected answer — required evidence criteria:**

1. Begin with the child's participation goals and identify personal, task, environmental, access, and attitudinal barriers with the family and school (`campbell-pt-children-2023`, `apta-pediatrics-resources-2026`)
   - Accepted evidence wording: `participation goals`; `environmental barriers`; `family and school collaboration`
2. Select assistive technology, seating, mobility, orthotic, or prosthetic options through assessment, shared choice, fitting, training, and follow-up (`who-wheelchair-provision-2023`, `campbell-pt-children-2023`)
   - Accepted evidence wording: `assistive technology assessment`; `fitting and training`; `follow-up`
3. Document functional need and reasonable supports, coordinate with relevant local education and disability processes, and review real-world participation (`apta-pediatrics-resources-2026`, `who-wheelchair-provision-2023`)
   - Accepted evidence wording: `document functional need`; `education and disability supports`; `review participation`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

### 34. Pharmacotherapeutics in pediatric neurological conditions

Topic ID: `neu-pediatric-pharmacotherapeutics`

#### Question — GUIDED / RECALL_SPRINT

Explain how medication information affects pediatric neurological physiotherapy assessment, timing, monitoring, and multidisciplinary communication without crossing prescribing scope.

**Expected answer — required evidence criteria:**

1. Reconcile the prescribed indication, schedule, recent change, expected functional effect, and relevant adverse effects without independently prescribing or altering medication (`campbell-pt-children-2023`, `nice-ng62-cerebral-palsy`)
   - Accepted evidence wording: `medication reconciliation`; `functional effect and adverse effects`; `do not alter medication`
2. Account for medication-related alertness, tone, pain, fatigue, seizure control, cardiovascular response, or therapy timing in assessment and treatment (`campbell-pt-children-2023`, `nice-ng62-cerebral-palsy`)
   - Accepted evidence wording: `alertness and tone`; `seizure control`; `therapy timing`
3. Document observed response and promptly communicate suspected adverse effects, deterioration, or safety concerns to the prescribing team (`nice-ng62-cerebral-palsy`)
   - Accepted evidence wording: `document observed response`; `communicate adverse effects`; `prescribing team`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — GUIDED / DEEP_RESEARCH

Use the cited evidence sources to prepare, then answer: Explain how medication information affects pediatric neurological physiotherapy assessment, timing, monitoring, and multidisciplinary communication without crossing prescribing scope. State the source scope, one uncertainty, and what requires patient-specific clinical judgment.

**Expected answer — required evidence criteria:**

1. Reconcile the prescribed indication, schedule, recent change, expected functional effect, and relevant adverse effects without independently prescribing or altering medication (`campbell-pt-children-2023`, `nice-ng62-cerebral-palsy`)
   - Accepted evidence wording: `medication reconciliation`; `functional effect and adverse effects`; `do not alter medication`
2. Account for medication-related alertness, tone, pain, fatigue, seizure control, cardiovascular response, or therapy timing in assessment and treatment (`campbell-pt-children-2023`, `nice-ng62-cerebral-palsy`)
   - Accepted evidence wording: `alertness and tone`; `seizure control`; `therapy timing`
3. Document observed response and promptly communicate suspected adverse effects, deterioration, or safety concerns to the prescribing team (`nice-ng62-cerebral-palsy`)
   - Accepted evidence wording: `document observed response`; `communicate adverse effects`; `prescribing team`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

### 35. Space-occupying CNS lesions, TBI, vestibular disorders, myopathies (adult)

Topic ID: `neu-adult-space-occupying-tbi-vestibular-myopathies`

#### Question — GUIDED / RECALL_SPRINT

Differentiate physiotherapy priorities for adults with a space-occupying CNS lesion, traumatic brain injury, peripheral vestibular hypofunction, or myopathy.

**Expected answer — required evidence criteria:**

1. For a CNS lesion or brain injury, establish medical and neurological stability, precautions, impairments, cognition, function, and red flags before graded rehabilitation (`umphred-neuro-rehab-2025`)
   - Accepted evidence wording: `neurological stability`; `cognitive and functional assessment`; `red flags before rehabilitation`
2. For diagnosed peripheral vestibular hypofunction, use individualized gaze-stability, habituation where indicated, balance, and walking exercise with reassessment (`apta-vestibular-hypofunction-2022`)
   - Accepted evidence wording: `gaze stability exercise`; `balance and gait exercise`; `vestibular reassessment`
3. For myopathy, grade activity to disease, weakness, fatigue, respiratory or cardiac involvement, goals, and recovery while avoiding unsupported one-size-fits-all dosing (`umphred-neuro-rehab-2025`)
   - Accepted evidence wording: `fatigue-aware graded activity`; `respiratory and cardiac involvement`; `individualized exercise dose`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — GUIDED / DEEP_RESEARCH

Use the cited evidence sources to prepare, then answer: Differentiate physiotherapy priorities for adults with a space-occupying CNS lesion, traumatic brain injury, peripheral vestibular hypofunction, or myopathy. State the source scope, one uncertainty, and what requires patient-specific clinical judgment.

**Expected answer — required evidence criteria:**

1. For a CNS lesion or brain injury, establish medical and neurological stability, precautions, impairments, cognition, function, and red flags before graded rehabilitation (`umphred-neuro-rehab-2025`)
   - Accepted evidence wording: `neurological stability`; `cognitive and functional assessment`; `red flags before rehabilitation`
2. For diagnosed peripheral vestibular hypofunction, use individualized gaze-stability, habituation where indicated, balance, and walking exercise with reassessment (`apta-vestibular-hypofunction-2022`)
   - Accepted evidence wording: `gaze stability exercise`; `balance and gait exercise`; `vestibular reassessment`
3. For myopathy, grade activity to disease, weakness, fatigue, respiratory or cardiac involvement, goals, and recovery while avoiding unsupported one-size-fits-all dosing (`umphred-neuro-rehab-2025`)
   - Accepted evidence wording: `fatigue-aware graded activity`; `respiratory and cardiac involvement`; `individualized exercise dose`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

## Respiratory Physiotherapy

### 1. Structured respiratory physiotherapy assessment

Topic ID: `respiratory-assessment`

#### Question — GUIDED / RECALL_SPRINT

Explain a structured respiratory physiotherapy assessment, from history and observation through functional impact, safety checks, and problem formulation.

**Expected answer — required evidence criteria:**

1. Connect symptoms and exacerbation history to activity and participation limits (`src-gold-2026`, `src-gina-2026`)
   - Accepted evidence wording: `symptoms and function`; `exacerbation history`; `activity limitation`
2. Include respiratory observations, vital signs, oxygen saturation, and relevant examination findings (`src-gold-2026`)
   - Accepted evidence wording: `vital signs`; `oxygen saturation`; `respiratory examination`
3. Integrate findings rather than using one test result as a stand-alone diagnosis (`src-ers-ats-pft-2022`)
   - Accepted evidence wording: `integrate findings`; `clinical context`; `not one test alone`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — GUIDED / DEEP_RESEARCH

Use the cited evidence sources to prepare, then answer: Explain a structured respiratory physiotherapy assessment, from history and observation through functional impact, safety checks, and problem formulation. State the source scope, one uncertainty, and what requires patient-specific clinical judgment.

**Expected answer — required evidence criteria:**

1. Connect symptoms and exacerbation history to activity and participation limits (`src-gold-2026`, `src-gina-2026`)
   - Accepted evidence wording: `symptoms and function`; `exacerbation history`; `activity limitation`
2. Include respiratory observations, vital signs, oxygen saturation, and relevant examination findings (`src-gold-2026`)
   - Accepted evidence wording: `vital signs`; `oxygen saturation`; `respiratory examination`
3. Integrate findings rather than using one test result as a stand-alone diagnosis (`src-ers-ats-pft-2022`)
   - Accepted evidence wording: `integrate findings`; `clinical context`; `not one test alone`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

### 2. Spirometry and pulmonary-function-test interpretation

Topic ID: `spirometry-pft-interpretation`

#### Question — GUIDED / RECALL_SPRINT

Describe how to judge spirometry quality and interpret a pulmonary-function report without separating the numbers from the clinical question.

**Expected answer — required evidence criteria:**

1. Check test quality, acceptability, repeatability, and relevant technical comments before interpretation (`src-ats-spirometry-2019`)
   - Accepted evidence wording: `acceptability and repeatability`; `quality check`; `technical comments`
2. Compare measured values with appropriate reference values and limits of normal (`src-ers-ats-pft-2022`)
   - Accepted evidence wording: `reference values`; `lower limit of normal`; `limits of normal`
3. Describe the physiological pattern, then integrate it with symptoms and other investigations (`src-ers-ats-pft-2022`)
   - Accepted evidence wording: `physiological pattern`; `clinical correlation`; `integrate investigations`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — GUIDED / DEEP_RESEARCH

Use the cited evidence sources to prepare, then answer: Describe how to judge spirometry quality and interpret a pulmonary-function report without separating the numbers from the clinical question. State the source scope, one uncertainty, and what requires patient-specific clinical judgment.

**Expected answer — required evidence criteria:**

1. Check test quality, acceptability, repeatability, and relevant technical comments before interpretation (`src-ats-spirometry-2019`)
   - Accepted evidence wording: `acceptability and repeatability`; `quality check`; `technical comments`
2. Compare measured values with appropriate reference values and limits of normal (`src-ers-ats-pft-2022`)
   - Accepted evidence wording: `reference values`; `lower limit of normal`; `limits of normal`
3. Describe the physiological pattern, then integrate it with symptoms and other investigations (`src-ers-ats-pft-2022`)
   - Accepted evidence wording: `physiological pattern`; `clinical correlation`; `integrate investigations`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

### 3. Arterial blood gas interpretation

Topic ID: `arterial-blood-gas-interpretation`

#### Question — GUIDED / RECALL_SPRINT

Walk through a safe, systematic interpretation of an arterial blood gas and explain how it informs—without replacing—the wider clinical assessment.

**Expected answer — required evidence criteria:**

1. Check internal consistency and identify acidemia or alkalemia (`src-ats-abg`)
   - Accepted evidence wording: `internal consistency`; `acidemia or alkalemia`; `check validity`
2. Identify the primary respiratory or metabolic process and assess expected compensation (`src-ats-abg`)
   - Accepted evidence wording: `primary process`; `respiratory or metabolic`; `expected compensation`
3. Assess oxygenation and ventilation in the context of oxygen delivery and the patient (`src-ats-abg`, `src-bts-oxygen-2017`)
   - Accepted evidence wording: `oxygenation and ventilation`; `oxygen delivery`; `clinical context`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — GUIDED / DEEP_RESEARCH

Use the cited evidence sources to prepare, then answer: Walk through a safe, systematic interpretation of an arterial blood gas and explain how it informs—without replacing—the wider clinical assessment. State the source scope, one uncertainty, and what requires patient-specific clinical judgment.

**Expected answer — required evidence criteria:**

1. Check internal consistency and identify acidemia or alkalemia (`src-ats-abg`)
   - Accepted evidence wording: `internal consistency`; `acidemia or alkalemia`; `check validity`
2. Identify the primary respiratory or metabolic process and assess expected compensation (`src-ats-abg`)
   - Accepted evidence wording: `primary process`; `respiratory or metabolic`; `expected compensation`
3. Assess oxygenation and ventilation in the context of oxygen delivery and the patient (`src-ats-abg`, `src-bts-oxygen-2017`)
   - Accepted evidence wording: `oxygenation and ventilation`; `oxygen delivery`; `clinical context`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

### 4. COPD assessment and rehabilitation planning

Topic ID: `copd-assessment-planning`

#### Question — GUIDED / RECALL_SPRINT

Explain how COPD is confirmed and how symptoms, exacerbations, function, comorbidity, and patient goals shape a physiotherapy rehabilitation plan.

**Expected answer — required evidence criteria:**

1. Confirm persistent airflow obstruction with appropriate post-bronchodilator spirometry (`src-gold-2026`)
   - Accepted evidence wording: `post-bronchodilator spirometry`; `persistent airflow obstruction`; `confirm obstruction`
2. Assess symptoms, exacerbation history, functional limitation, and relevant comorbidity (`src-gold-2026`)
   - Accepted evidence wording: `symptom burden`; `exacerbation history`; `functional limitation`
3. Use individualized non-pharmacological management, including physical activity and pulmonary rehabilitation when indicated (`src-gold-2026`, `src-ats-pulmonary-rehab-2023`)
   - Accepted evidence wording: `pulmonary rehabilitation`; `physical activity`; `individualized management`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — GUIDED / DEEP_RESEARCH

Use the cited evidence sources to prepare, then answer: Explain how COPD is confirmed and how symptoms, exacerbations, function, comorbidity, and patient goals shape a physiotherapy rehabilitation plan. State the source scope, one uncertainty, and what requires patient-specific clinical judgment.

**Expected answer — required evidence criteria:**

1. Confirm persistent airflow obstruction with appropriate post-bronchodilator spirometry (`src-gold-2026`)
   - Accepted evidence wording: `post-bronchodilator spirometry`; `persistent airflow obstruction`; `confirm obstruction`
2. Assess symptoms, exacerbation history, functional limitation, and relevant comorbidity (`src-gold-2026`)
   - Accepted evidence wording: `symptom burden`; `exacerbation history`; `functional limitation`
3. Use individualized non-pharmacological management, including physical activity and pulmonary rehabilitation when indicated (`src-gold-2026`, `src-ats-pulmonary-rehab-2023`)
   - Accepted evidence wording: `pulmonary rehabilitation`; `physical activity`; `individualized management`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — APPLIED / RECALL_SPRINT

Using the fictional case, prioritize the assessment domains, explain whether pulmonary rehabilitation should be considered, and outline a monitored, person-centred plan within physiotherapy scope.

**Fictional case:** A fictional 66-year-old has stable COPD confirmed by post-bronchodilator spirometry, breathlessness on ordinary walking, two treated exacerbations in the past year, reduced activity, and no current red-flag symptoms.

**Reviewed follow-up questions:**

- PROBE: Which additional measurement would most change the rehabilitation prescription, and why?

**Expected answer — required evidence criteria:**

1. Prioritize symptom, exacerbation, exercise-capacity, comorbidity, and goal assessment (`src-gold-2026`, `src-ats-pulmonary-rehab-2023`)
   - Accepted evidence wording: `exercise capacity`; `exacerbation risk`; `patient goals`
2. Justify referral to a comprehensive pulmonary rehabilitation programme (`src-gold-2026`, `src-ats-pulmonary-rehab-2023`)
   - Accepted evidence wording: `refer to pulmonary rehabilitation`; `comprehensive programme`; `pulmonary rehab referral`
3. Define monitoring, reassessment, and escalation boundaries (`src-gold-2026`)
   - Accepted evidence wording: `monitor and reassess`; `safety monitoring`; `escalation`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — VIVA / RECALL_SPRINT

Defend your plan for the fictional COPD case, separate what the evidence supports from what remains patient-specific, and state the findings that would pause exercise and trigger clinical escalation.

**Fictional case:** A fictional 66-year-old has stable COPD confirmed by post-bronchodilator spirometry, breathlessness on ordinary walking, two treated exacerbations in the past year, reduced activity, and no current red-flag symptoms.

**Reviewed follow-up questions:**

- PROBE: Which additional measurement would most change the rehabilitation prescription, and why?
- EVIDENCE_UPDATE: The person develops new chest pressure during the baseline walk. Explain how this changes your immediate priorities and why exercise progression must stop pending appropriate assessment.

**Expected answer — required evidence criteria:**

1. Defend pulmonary rehabilitation using expected benefits and patient goals (`src-gold-2026`, `src-ats-pulmonary-rehab-2023`)
   - Accepted evidence wording: `exercise capacity and quality of life`; `patient goals`; `rehabilitation benefit`
2. Acknowledge individual response, comorbidity, and implementation uncertainty (`src-ats-pulmonary-rehab-2023`)
   - Accepted evidence wording: `individual response`; `comorbidity`; `uncertainty`
3. State that new instability or red flags require pausing and appropriate escalation (`src-gold-2026`)
   - Accepted evidence wording: `pause exercise`; `clinical escalation`; `red flags`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

### 5. Comprehensive pulmonary rehabilitation

Topic ID: `pulmonary-rehabilitation`

#### Question — GUIDED / RECALL_SPRINT

Define comprehensive pulmonary rehabilitation and explain its assessment, exercise, education, self-management, and outcome-review components.

**Expected answer — required evidence criteria:**

1. Begin with a thorough, person-centred assessment and agreed goals (`src-ats-pulmonary-rehab-2023`, `src-gold-2026`)
   - Accepted evidence wording: `thorough assessment`; `person-centred goals`; `individual assessment`
2. Combine individualized exercise training with education and behaviour-change support (`src-ats-pulmonary-rehab-2023`, `src-gold-2026`)
   - Accepted evidence wording: `exercise training and education`; `behaviour change`; `self-management`
3. Reassess outcomes that matter to the learner, including symptoms, function, and participation (`src-ats-pulmonary-rehab-2023`)
   - Accepted evidence wording: `outcome reassessment`; `symptoms and function`; `participation`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — GUIDED / DEEP_RESEARCH

Use the cited evidence sources to prepare, then answer: Define comprehensive pulmonary rehabilitation and explain its assessment, exercise, education, self-management, and outcome-review components. State the source scope, one uncertainty, and what requires patient-specific clinical judgment.

**Expected answer — required evidence criteria:**

1. Begin with a thorough, person-centred assessment and agreed goals (`src-ats-pulmonary-rehab-2023`, `src-gold-2026`)
   - Accepted evidence wording: `thorough assessment`; `person-centred goals`; `individual assessment`
2. Combine individualized exercise training with education and behaviour-change support (`src-ats-pulmonary-rehab-2023`, `src-gold-2026`)
   - Accepted evidence wording: `exercise training and education`; `behaviour change`; `self-management`
3. Reassess outcomes that matter to the learner, including symptoms, function, and participation (`src-ats-pulmonary-rehab-2023`)
   - Accepted evidence wording: `outcome reassessment`; `symptoms and function`; `participation`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — APPLIED / RECALL_SPRINT

Use the fictional case to design the components—not disease-specific doses—of an accessible pulmonary rehabilitation pathway and explain how progress would be reviewed.

**Fictional case:** A fictional 59-year-old with stable chronic respiratory disease is limited by breathlessness and inactivity, wants to resume shopping independently, and cannot travel to the hospital twice each week.

**Reviewed follow-up questions:**

- PROBE: What baseline information is essential before choosing exercise mode and supervision?

**Expected answer — required evidence criteria:**

1. Translate the person's shopping goal into measurable functional outcomes (`src-ats-pulmonary-rehab-2023`)
   - Accepted evidence wording: `functional goal`; `measurable outcome`; `shopping goal`
2. Include individualized exercise, education, and supported self-management (`src-ats-pulmonary-rehab-2023`)
   - Accepted evidence wording: `individualized exercise`; `education`; `self-management`
3. Consider an evidence-based centre, home, or telerehabilitation delivery model after safety assessment (`src-ats-pulmonary-rehab-2023`)
   - Accepted evidence wording: `telerehabilitation`; `home-based rehabilitation`; `delivery model`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — VIVA / RECALL_SPRINT

Defend a delivery model for the fictional case, explain what cannot be inferred without baseline testing, and describe how you would respond if access and clinical-supervision needs conflict.

**Fictional case:** A fictional 59-year-old with stable chronic respiratory disease is limited by breathlessness and inactivity, wants to resume shopping independently, and cannot travel to the hospital twice each week.

**Reviewed follow-up questions:**

- PROBE: What baseline information is essential before choosing exercise mode and supervision?
- EVIDENCE_UPDATE: Reliable transport becomes available once weekly but not twice weekly. Compare a hybrid pathway with fully centre-based and fully remote options.

**Expected answer — required evidence criteria:**

1. Balance access, preference, safety, and available supervision (`src-ats-pulmonary-rehab-2023`)
   - Accepted evidence wording: `access and safety`; `patient preference`; `supervision`
2. Avoid prescribing intensity without individualized baseline assessment (`src-ats-pulmonary-rehab-2023`, `src-acsm-getp-2025`)
   - Accepted evidence wording: `baseline assessment`; `do not infer intensity`; `individualized prescription`
3. Use shared decision making and reassessment to revise delivery (`src-ats-pulmonary-rehab-2023`)
   - Accepted evidence wording: `shared decision making`; `reassess`; `revise the plan`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

### 6. Asthma assessment and supported self-management

Topic ID: `asthma-assessment-self-management`

#### Question — GUIDED / RECALL_SPRINT

Explain how current asthma assessment connects symptom control, future risk, lung-function evidence, inhaler skills, and supported self-management.

**Expected answer — required evidence criteria:**

1. Assess recent symptom control separately from risk of future adverse outcomes (`src-gina-2026`)
   - Accepted evidence wording: `symptom control and future risk`; `future risk`; `recent symptoms`
2. Use objective evidence of variable expiratory airflow limitation where appropriate (`src-gina-2026`)
   - Accepted evidence wording: `variable expiratory airflow limitation`; `objective lung function`; `spirometry`
3. Include inhaler-skill review, adherence discussion, action-plan education, and regular review (`src-gina-2026`)
   - Accepted evidence wording: `inhaler technique`; `written action plan`; `regular review`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — GUIDED / DEEP_RESEARCH

Use the cited evidence sources to prepare, then answer: Explain how current asthma assessment connects symptom control, future risk, lung-function evidence, inhaler skills, and supported self-management. State the source scope, one uncertainty, and what requires patient-specific clinical judgment.

**Expected answer — required evidence criteria:**

1. Assess recent symptom control separately from risk of future adverse outcomes (`src-gina-2026`)
   - Accepted evidence wording: `symptom control and future risk`; `future risk`; `recent symptoms`
2. Use objective evidence of variable expiratory airflow limitation where appropriate (`src-gina-2026`)
   - Accepted evidence wording: `variable expiratory airflow limitation`; `objective lung function`; `spirometry`
3. Include inhaler-skill review, adherence discussion, action-plan education, and regular review (`src-gina-2026`)
   - Accepted evidence wording: `inhaler technique`; `written action plan`; `regular review`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

### 7. Airway-clearance planning in adult bronchiectasis

Topic ID: `bronchiectasis-airway-clearance`

#### Question — GUIDED / RECALL_SPRINT

Explain the physiotherapist's reasoning when assessing, teaching, individualizing, and reviewing airway-clearance techniques for an adult with bronchiectasis.

**Expected answer — required evidence criteria:**

1. Assess symptoms, sputum, exacerbations, function, preference, and contraindications (`src-ers-bronchiectasis-2025`)
   - Accepted evidence wording: `sputum and exacerbations`; `patient preference`; `contraindications`
2. Teach an individualized airway-clearance technique rather than a universal routine (`src-ers-bronchiectasis-2025`)
   - Accepted evidence wording: `individualized airway clearance`; `airway-clearance technique`; `tailored technique`
3. Review technique and response, and integrate physical activity or pulmonary rehabilitation where appropriate (`src-ers-bronchiectasis-2025`, `src-ats-pulmonary-rehab-2023`)
   - Accepted evidence wording: `review technique`; `physical activity`; `pulmonary rehabilitation`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — GUIDED / DEEP_RESEARCH

Use the cited evidence sources to prepare, then answer: Explain the physiotherapist's reasoning when assessing, teaching, individualizing, and reviewing airway-clearance techniques for an adult with bronchiectasis. State the source scope, one uncertainty, and what requires patient-specific clinical judgment.

**Expected answer — required evidence criteria:**

1. Assess symptoms, sputum, exacerbations, function, preference, and contraindications (`src-ers-bronchiectasis-2025`)
   - Accepted evidence wording: `sputum and exacerbations`; `patient preference`; `contraindications`
2. Teach an individualized airway-clearance technique rather than a universal routine (`src-ers-bronchiectasis-2025`)
   - Accepted evidence wording: `individualized airway clearance`; `airway-clearance technique`; `tailored technique`
3. Review technique and response, and integrate physical activity or pulmonary rehabilitation where appropriate (`src-ers-bronchiectasis-2025`, `src-ats-pulmonary-rehab-2023`)
   - Accepted evidence wording: `review technique`; `physical activity`; `pulmonary rehabilitation`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

### 8. Safe oxygen-therapy principles

Topic ID: `oxygen-therapy-principles`

#### Question — GUIDED / RECALL_SPRINT

Explain why oxygen is prescribed to a target range, how response is monitored, and why delivery must be adjusted to the clinical context rather than treated as a fixed routine.

**Expected answer — required evidence criteria:**

1. Treat hypoxaemia with a prescribed target saturation rather than treating breathlessness alone (`src-bts-oxygen-2017`)
   - Accepted evidence wording: `target saturation`; `treat hypoxaemia`; `prescribed target`
2. Select delivery and monitoring according to clinical context and risk of hypercapnic respiratory failure (`src-bts-oxygen-2017`)
   - Accepted evidence wording: `hypercapnic respiratory failure risk`; `oxygen delivery`; `monitoring`
3. Reassess saturation and blood gases when indicated, and escalate deterioration (`src-bts-oxygen-2017`, `src-ats-abg`)
   - Accepted evidence wording: `reassess blood gases`; `monitor saturation`; `escalate deterioration`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — GUIDED / DEEP_RESEARCH

Use the cited evidence sources to prepare, then answer: Explain why oxygen is prescribed to a target range, how response is monitored, and why delivery must be adjusted to the clinical context rather than treated as a fixed routine. State the source scope, one uncertainty, and what requires patient-specific clinical judgment.

**Expected answer — required evidence criteria:**

1. Treat hypoxaemia with a prescribed target saturation rather than treating breathlessness alone (`src-bts-oxygen-2017`)
   - Accepted evidence wording: `target saturation`; `treat hypoxaemia`; `prescribed target`
2. Select delivery and monitoring according to clinical context and risk of hypercapnic respiratory failure (`src-bts-oxygen-2017`)
   - Accepted evidence wording: `hypercapnic respiratory failure risk`; `oxygen delivery`; `monitoring`
3. Reassess saturation and blood gases when indicated, and escalate deterioration (`src-bts-oxygen-2017`, `src-ats-abg`)
   - Accepted evidence wording: `reassess blood gases`; `monitor saturation`; `escalate deterioration`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

### 9. ICU rehabilitation and mobilization safety

Topic ID: `icu-mobilization-safety`

#### Question — GUIDED / RECALL_SPRINT

Explain how an interprofessional ICU team decides whether and how to mobilize a critically ill adult while accounting for stability, goals, dose uncertainty, and response.

**Expected answer — required evidence criteria:**

1. Base initiation and progression on cardiovascular, respiratory, and neurological stability (`src-sccm-padis-2025`)
   - Accepted evidence wording: `cardiovascular respiratory neurological stability`; `physiological stability`; `safety screen`
2. Use team-based, individualized mobilization or rehabilitation beyond passive usual care when appropriate (`src-sccm-padis-2025`)
   - Accepted evidence wording: `enhanced mobilization`; `team-based rehabilitation`; `individualized mobilization`
3. State that optimal frequency, intensity, duration, and delivery remain uncertain (`src-sccm-padis-2025`)
   - Accepted evidence wording: `dose remains uncertain`; `frequency intensity duration`; `evidence uncertainty`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — GUIDED / DEEP_RESEARCH

Use the cited evidence sources to prepare, then answer: Explain how an interprofessional ICU team decides whether and how to mobilize a critically ill adult while accounting for stability, goals, dose uncertainty, and response. State the source scope, one uncertainty, and what requires patient-specific clinical judgment.

**Expected answer — required evidence criteria:**

1. Base initiation and progression on cardiovascular, respiratory, and neurological stability (`src-sccm-padis-2025`)
   - Accepted evidence wording: `cardiovascular respiratory neurological stability`; `physiological stability`; `safety screen`
2. Use team-based, individualized mobilization or rehabilitation beyond passive usual care when appropriate (`src-sccm-padis-2025`)
   - Accepted evidence wording: `enhanced mobilization`; `team-based rehabilitation`; `individualized mobilization`
3. State that optimal frequency, intensity, duration, and delivery remain uncertain (`src-sccm-padis-2025`)
   - Accepted evidence wording: `dose remains uncertain`; `frequency intensity duration`; `evidence uncertainty`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

### 10. Physiotherapy within ventilator liberation

Topic ID: `ventilator-liberation`

#### Question — GUIDED / RECALL_SPRINT

Explain how readiness screening, spontaneous-breathing assessment, sedation strategy, rehabilitation, and team communication fit into ventilator liberation.

**Expected answer — required evidence criteria:**

1. Use protocolized readiness assessment and spontaneous-breathing trials where appropriate (`src-ats-accp-weaning-2017`)
   - Accepted evidence wording: `readiness assessment`; `spontaneous breathing trial`; `liberation protocol`
2. Coordinate sedation minimization and rehabilitation with the wider ICU team (`src-ats-accp-weaning-2017`, `src-sccm-padis-2025`)
   - Accepted evidence wording: `sedation minimization`; `rehabilitation protocol`; `interprofessional team`
3. Separate physiotherapy contribution from medical decisions about extubation and ventilator settings (`src-ats-accp-weaning-2017`)
   - Accepted evidence wording: `scope of practice`; `team decision`; `extubation decision`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — GUIDED / DEEP_RESEARCH

Use the cited evidence sources to prepare, then answer: Explain how readiness screening, spontaneous-breathing assessment, sedation strategy, rehabilitation, and team communication fit into ventilator liberation. State the source scope, one uncertainty, and what requires patient-specific clinical judgment.

**Expected answer — required evidence criteria:**

1. Use protocolized readiness assessment and spontaneous-breathing trials where appropriate (`src-ats-accp-weaning-2017`)
   - Accepted evidence wording: `readiness assessment`; `spontaneous breathing trial`; `liberation protocol`
2. Coordinate sedation minimization and rehabilitation with the wider ICU team (`src-ats-accp-weaning-2017`, `src-sccm-padis-2025`)
   - Accepted evidence wording: `sedation minimization`; `rehabilitation protocol`; `interprofessional team`
3. Separate physiotherapy contribution from medical decisions about extubation and ventilator settings (`src-ats-accp-weaning-2017`)
   - Accepted evidence wording: `scope of practice`; `team decision`; `extubation decision`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

### 11. Six-minute walk test

Topic ID: `six-minute-walk-test`

#### Question — GUIDED / RECALL_SPRINT

Describe how to prepare, standardize, monitor, document, and interpret a six-minute walk test in chronic respiratory disease.

**Expected answer — required evidence criteria:**

1. Use a standardized course, instructions, encouragement, and equipment (`src-ers-ats-walk-2014`)
   - Accepted evidence wording: `standardized course`; `standard instructions`; `standard encouragement`
2. Record baseline and end-test symptoms and physiological observations, including adverse events (`src-ers-ats-walk-2014`)
   - Accepted evidence wording: `baseline and end-test`; `symptom monitoring`; `physiological observations`
3. Interpret distance and change in context, including learning effect and the clinical question (`src-ers-ats-walk-2014`)
   - Accepted evidence wording: `learning effect`; `interpret change`; `clinical context`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — GUIDED / DEEP_RESEARCH

Use the cited evidence sources to prepare, then answer: Describe how to prepare, standardize, monitor, document, and interpret a six-minute walk test in chronic respiratory disease. State the source scope, one uncertainty, and what requires patient-specific clinical judgment.

**Expected answer — required evidence criteria:**

1. Use a standardized course, instructions, encouragement, and equipment (`src-ers-ats-walk-2014`)
   - Accepted evidence wording: `standardized course`; `standard instructions`; `standard encouragement`
2. Record baseline and end-test symptoms and physiological observations, including adverse events (`src-ers-ats-walk-2014`)
   - Accepted evidence wording: `baseline and end-test`; `symptom monitoring`; `physiological observations`
3. Interpret distance and change in context, including learning effect and the clinical question (`src-ers-ats-walk-2014`)
   - Accepted evidence wording: `learning effect`; `interpret change`; `clinical context`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

### 12. Anatomy, physiology, biomechanics, pathomechanics & embryology of respiratory system & thorax

Topic ID: `respiratory-anatomy-physiology-embryology`

#### Question — GUIDED / RECALL_SPRINT

Explain how respiratory anatomy, ventilatory mechanics, gas exchange, and developmental or structural variation inform physiotherapy assessment without replacing diagnosis.

**Expected answer — required evidence criteria:**

1. Relate thoracic, diaphragmatic, airway, and lung mechanics to ventilation and work of breathing (`src-ers-ats-pft-2022`, `src-gold-2026`)
   - Accepted evidence wording: `diaphragm and thoracic mechanics`; `ventilation`; `work of breathing`
2. Connect ventilation, perfusion, diffusion, and gas exchange to oxygenation and carbon-dioxide findings in clinical context (`src-ats-abg`, `src-ers-ats-pft-2022`)
   - Accepted evidence wording: `ventilation perfusion`; `diffusion and gas exchange`; `oxygenation and carbon dioxide`
3. Integrate developmental or structural history with symptoms, observation, examination, and investigations rather than inferring a diagnosis from anatomy alone (`src-curriculum`, `src-ers-ats-pft-2022`)
   - Accepted evidence wording: `developmental and structural history`; `integrated assessment`; `not anatomy alone`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — GUIDED / DEEP_RESEARCH

Use the cited evidence sources to prepare, then answer: Explain how respiratory anatomy, ventilatory mechanics, gas exchange, and developmental or structural variation inform physiotherapy assessment without replacing diagnosis. State the source scope, one uncertainty, and what requires patient-specific clinical judgment.

**Expected answer — required evidence criteria:**

1. Relate thoracic, diaphragmatic, airway, and lung mechanics to ventilation and work of breathing (`src-ers-ats-pft-2022`, `src-gold-2026`)
   - Accepted evidence wording: `diaphragm and thoracic mechanics`; `ventilation`; `work of breathing`
2. Connect ventilation, perfusion, diffusion, and gas exchange to oxygenation and carbon-dioxide findings in clinical context (`src-ats-abg`, `src-ers-ats-pft-2022`)
   - Accepted evidence wording: `ventilation perfusion`; `diffusion and gas exchange`; `oxygenation and carbon dioxide`
3. Integrate developmental or structural history with symptoms, observation, examination, and investigations rather than inferring a diagnosis from anatomy alone (`src-curriculum`, `src-ers-ats-pft-2022`)
   - Accepted evidence wording: `developmental and structural history`; `integrated assessment`; `not anatomy alone`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

### 13. Surgical procedures (thoracotomy, pleurodesis, lobectomy, pneumonectomy, VATS, transplantation) & perioperative PT

Topic ID: `respiratory-perioperative-surgical-procedures`

#### Question — GUIDED / RECALL_SPRINT

Explain a safe perioperative physiotherapy pathway for major thoracic surgery from preoperative risk and education through monitored recovery and rehabilitation.

**Expected answer — required evidence criteria:**

1. Establish procedure, baseline function, respiratory risk, goals, and surgeon or team precautions before prescribing intervention (`src-curriculum`, `src-ats-pulmonary-rehab-2023`)
   - Accepted evidence wording: `procedure and baseline function`; `respiratory risk`; `team precautions`
2. When medically cleared, use individualized breathing or airway-clearance strategies when indicated, positioning, functional exercise, and early mobility with physiological monitoring (`src-sccm-padis-2025`, `src-ats-pulmonary-rehab-2023`)
   - Accepted evidence wording: `airway clearance when indicated`; `early mobility`; `physiological monitoring`
3. Coordinate pain, drains, oxygen, complications, discharge education, and longer-term rehabilitation with the surgical and multidisciplinary team (`src-curriculum`, `src-sccm-padis-2025`)
   - Accepted evidence wording: `pain and drain precautions`; `multidisciplinary coordination`; `discharge and rehabilitation`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — GUIDED / DEEP_RESEARCH

Use the cited evidence sources to prepare, then answer: Explain a safe perioperative physiotherapy pathway for major thoracic surgery from preoperative risk and education through monitored recovery and rehabilitation. State the source scope, one uncertainty, and what requires patient-specific clinical judgment.

**Expected answer — required evidence criteria:**

1. Establish procedure, baseline function, respiratory risk, goals, and surgeon or team precautions before prescribing intervention (`src-curriculum`, `src-ats-pulmonary-rehab-2023`)
   - Accepted evidence wording: `procedure and baseline function`; `respiratory risk`; `team precautions`
2. When medically cleared, use individualized breathing or airway-clearance strategies when indicated, positioning, functional exercise, and early mobility with physiological monitoring (`src-sccm-padis-2025`, `src-ats-pulmonary-rehab-2023`)
   - Accepted evidence wording: `airway clearance when indicated`; `early mobility`; `physiological monitoring`
3. Coordinate pain, drains, oxygen, complications, discharge education, and longer-term rehabilitation with the surgical and multidisciplinary team (`src-curriculum`, `src-sccm-padis-2025`)
   - Accepted evidence wording: `pain and drain precautions`; `multidisciplinary coordination`; `discharge and rehabilitation`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

## Cardiovascular Physiotherapy

### 1. Cardiovascular assessment and ECG relevance

Topic ID: `cardiovascular-assessment-ecg`

#### Question — GUIDED / RECALL_SPRINT

Explain how history, examination, risk factors, resting ECG, symptoms, and functional testing contribute to cardiovascular physiotherapy assessment and referral decisions.

**Expected answer — required evidence criteria:**

1. Start with symptoms, history, examination, comorbidity, and cardiovascular risk factors (`src-esc-ccs-2024`)
   - Accepted evidence wording: `history and examination`; `risk factors`; `comorbidity`
2. Use a resting 12-lead ECG as one part of basic assessment, not as an isolated clearance test (`src-esc-ccs-2024`)
   - Accepted evidence wording: `12-lead ECG`; `part of basic assessment`; `not isolated`
3. Recognize instability or red flags and refer rather than independently diagnosing cardiac disease (`src-esc-ccs-2024`, `src-acsm-getp-2025`)
   - Accepted evidence wording: `red flags`; `refer`; `within scope`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — GUIDED / DEEP_RESEARCH

Use the cited evidence sources to prepare, then answer: Explain how history, examination, risk factors, resting ECG, symptoms, and functional testing contribute to cardiovascular physiotherapy assessment and referral decisions. State the source scope, one uncertainty, and what requires patient-specific clinical judgment.

**Expected answer — required evidence criteria:**

1. Start with symptoms, history, examination, comorbidity, and cardiovascular risk factors (`src-esc-ccs-2024`)
   - Accepted evidence wording: `history and examination`; `risk factors`; `comorbidity`
2. Use a resting 12-lead ECG as one part of basic assessment, not as an isolated clearance test (`src-esc-ccs-2024`)
   - Accepted evidence wording: `12-lead ECG`; `part of basic assessment`; `not isolated`
3. Recognize instability or red flags and refer rather than independently diagnosing cardiac disease (`src-esc-ccs-2024`, `src-acsm-getp-2025`)
   - Accepted evidence wording: `red flags`; `refer`; `within scope`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

### 2. Comprehensive cardiovascular rehabilitation

Topic ID: `cardiac-rehabilitation`

#### Question — GUIDED / RECALL_SPRINT

Define contemporary cardiovascular rehabilitation and explain its person-centred assessment, medical-risk, exercise, education, psychosocial, lifestyle, and outcome components.

**Expected answer — required evidence criteria:**

1. Start early with person-centred assessment, goal setting, and individualized planning (`src-bacpr-2023`)
   - Accepted evidence wording: `person-centred assessment`; `goal setting`; `individualized plan`
2. Coordinate medical-risk management, exercise, education, lifestyle, and psychosocial support (`src-bacpr-2023`)
   - Accepted evidence wording: `core components`; `exercise and education`; `psychosocial support`
3. Provide transition, long-term support, and outcome audit across the pathway (`src-bacpr-2023`)
   - Accepted evidence wording: `long-term support`; `outcome audit`; `continuity`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — GUIDED / DEEP_RESEARCH

Use the cited evidence sources to prepare, then answer: Define contemporary cardiovascular rehabilitation and explain its person-centred assessment, medical-risk, exercise, education, psychosocial, lifestyle, and outcome components. State the source scope, one uncertainty, and what requires patient-specific clinical judgment.

**Expected answer — required evidence criteria:**

1. Start early with person-centred assessment, goal setting, and individualized planning (`src-bacpr-2023`)
   - Accepted evidence wording: `person-centred assessment`; `goal setting`; `individualized plan`
2. Coordinate medical-risk management, exercise, education, lifestyle, and psychosocial support (`src-bacpr-2023`)
   - Accepted evidence wording: `core components`; `exercise and education`; `psychosocial support`
3. Provide transition, long-term support, and outcome audit across the pathway (`src-bacpr-2023`)
   - Accepted evidence wording: `long-term support`; `outcome audit`; `continuity`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — APPLIED / RECALL_SPRINT

Use the fictional case to outline a person-centred cardiovascular rehabilitation pathway, including initial assessment, activity progression principles, education, psychosocial needs, and review.

**Fictional case:** A fictional 57-year-old is medically stable after an uncomplicated acute coronary syndrome, has been referred at discharge, is anxious about activity, and wants to return to desk work and caring responsibilities.

**Reviewed follow-up questions:**

- PROBE: Which medical, functional, and psychosocial findings would change the initial supervision plan?

**Expected answer — required evidence criteria:**

1. Complete individualized assessment and shared goal setting before exercise prescription (`src-bacpr-2023`, `src-acsm-getp-2025`)
   - Accepted evidence wording: `individualized assessment`; `shared goals`; `before exercise prescription`
2. Integrate exercise with risk-factor, medication, education, and psychosocial components (`src-bacpr-2023`, `src-aha-acs-2025`)
   - Accepted evidence wording: `multicomponent rehabilitation`; `risk-factor management`; `psychosocial`
3. Plan continuity through outpatient or suitable home-based rehabilitation and reassessment (`src-aha-acs-2025`, `src-bacpr-2023`)
   - Accepted evidence wording: `outpatient cardiac rehabilitation`; `home-based rehabilitation`; `reassessment`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — VIVA / RECALL_SPRINT

Defend your rehabilitation priorities for the fictional case, distinguish supervised rehabilitation from unsupervised exercise advice, and explain the safety information still needed.

**Fictional case:** A fictional 57-year-old is medically stable after an uncomplicated acute coronary syndrome, has been referred at discharge, is anxious about activity, and wants to return to desk work and caring responsibilities.

**Reviewed follow-up questions:**

- PROBE: Which medical, functional, and psychosocial findings would change the initial supervision plan?
- EVIDENCE_UPDATE: The person reports new pressure-like chest discomfort during light walking. Explain why progression stops and what escalation is required before rehabilitation continues.

**Expected answer — required evidence criteria:**

1. Prioritize safety assessment, goals, and coordinated secondary prevention (`src-bacpr-2023`, `src-aha-acs-2025`)
   - Accepted evidence wording: `safety assessment`; `secondary prevention`; `patient goals`
2. Explain why exercise dose and supervision are individualized (`src-acsm-getp-2025`, `src-bacpr-2023`)
   - Accepted evidence wording: `individualized exercise`; `supervision`; `risk stratification`
3. Use shared decision making while preserving escalation boundaries for recurrent symptoms (`src-bacpr-2023`, `src-aha-acs-2025`)
   - Accepted evidence wording: `shared decision making`; `recurrent symptoms`; `escalation`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

### 3. Rehabilitation in chronic coronary syndromes

Topic ID: `chronic-coronary-syndrome-rehab`

#### Question — GUIDED / RECALL_SPRINT

Explain the physiotherapy contribution to long-term chronic-coronary-syndrome care through symptoms, function, exercise, education, risk-factor control, and shared decisions.

**Expected answer — required evidence criteria:**

1. Relate symptoms and functional limits to an individualized assessment (`src-esc-ccs-2024`)
   - Accepted evidence wording: `symptoms and function`; `individualized assessment`; `functional limitation`
2. Include lifestyle optimization, risk-factor control, patient education, and exercise therapy (`src-esc-ccs-2024`)
   - Accepted evidence wording: `exercise therapy`; `lifestyle optimization`; `risk-factor control`
3. Use patient involvement and reassessment when symptoms, risk, or preferences change (`src-esc-ccs-2024`)
   - Accepted evidence wording: `patient involvement`; `reassessment`; `preferences`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — GUIDED / DEEP_RESEARCH

Use the cited evidence sources to prepare, then answer: Explain the physiotherapy contribution to long-term chronic-coronary-syndrome care through symptoms, function, exercise, education, risk-factor control, and shared decisions. State the source scope, one uncertainty, and what requires patient-specific clinical judgment.

**Expected answer — required evidence criteria:**

1. Relate symptoms and functional limits to an individualized assessment (`src-esc-ccs-2024`)
   - Accepted evidence wording: `symptoms and function`; `individualized assessment`; `functional limitation`
2. Include lifestyle optimization, risk-factor control, patient education, and exercise therapy (`src-esc-ccs-2024`)
   - Accepted evidence wording: `exercise therapy`; `lifestyle optimization`; `risk-factor control`
3. Use patient involvement and reassessment when symptoms, risk, or preferences change (`src-esc-ccs-2024`)
   - Accepted evidence wording: `patient involvement`; `reassessment`; `preferences`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

### 4. Rehabilitation after acute coronary syndrome

Topic ID: `acute-coronary-syndrome-recovery`

#### Question — GUIDED / RECALL_SPRINT

Explain the transition from acute-coronary-syndrome care to safe, comprehensive secondary prevention and cardiovascular rehabilitation.

**Expected answer — required evidence criteria:**

1. Confirm medical stability and discharge information before rehabilitation progression (`src-aha-acs-2025`)
   - Accepted evidence wording: `medical stability`; `discharge information`; `before progression`
2. Arrange referral to outpatient cardiac rehabilitation or an appropriate home-based alternative (`src-aha-acs-2025`)
   - Accepted evidence wording: `outpatient cardiac rehabilitation`; `home-based alternative`; `rehabilitation referral`
3. Integrate monitored activity with education, adherence, risk-factor, and symptom-escalation support (`src-aha-acs-2025`, `src-bacpr-2023`)
   - Accepted evidence wording: `monitored activity`; `secondary prevention`; `symptom escalation`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — GUIDED / DEEP_RESEARCH

Use the cited evidence sources to prepare, then answer: Explain the transition from acute-coronary-syndrome care to safe, comprehensive secondary prevention and cardiovascular rehabilitation. State the source scope, one uncertainty, and what requires patient-specific clinical judgment.

**Expected answer — required evidence criteria:**

1. Confirm medical stability and discharge information before rehabilitation progression (`src-aha-acs-2025`)
   - Accepted evidence wording: `medical stability`; `discharge information`; `before progression`
2. Arrange referral to outpatient cardiac rehabilitation or an appropriate home-based alternative (`src-aha-acs-2025`)
   - Accepted evidence wording: `outpatient cardiac rehabilitation`; `home-based alternative`; `rehabilitation referral`
3. Integrate monitored activity with education, adherence, risk-factor, and symptom-escalation support (`src-aha-acs-2025`, `src-bacpr-2023`)
   - Accepted evidence wording: `monitored activity`; `secondary prevention`; `symptom escalation`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

### 5. Exercise rehabilitation in chronic heart failure

Topic ID: `heart-failure-rehabilitation`

#### Question — GUIDED / RECALL_SPRINT

Explain how stability, exercise capacity, symptoms, frailty, comorbidity, and goals shape exercise-based rehabilitation in chronic heart failure.

**Expected answer — required evidence criteria:**

1. Assess clinical stability, symptoms, exercise capacity, frailty, comorbidity, and goals (`src-esc-heart-failure-2021`)
   - Accepted evidence wording: `clinical stability`; `exercise capacity`; `frailty and comorbidity`
2. Use exercise to improve exercise capacity and quality of life in people who are able (`src-esc-heart-failure-2021`)
   - Accepted evidence wording: `improve exercise capacity`; `quality of life`; `exercise rehabilitation`
3. Consider supervised cardiac rehabilitation for more severe disease, frailty, or comorbidity (`src-esc-heart-failure-2021`)
   - Accepted evidence wording: `supervised cardiac rehabilitation`; `severe disease`; `frailty`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — GUIDED / DEEP_RESEARCH

Use the cited evidence sources to prepare, then answer: Explain how stability, exercise capacity, symptoms, frailty, comorbidity, and goals shape exercise-based rehabilitation in chronic heart failure. State the source scope, one uncertainty, and what requires patient-specific clinical judgment.

**Expected answer — required evidence criteria:**

1. Assess clinical stability, symptoms, exercise capacity, frailty, comorbidity, and goals (`src-esc-heart-failure-2021`)
   - Accepted evidence wording: `clinical stability`; `exercise capacity`; `frailty and comorbidity`
2. Use exercise to improve exercise capacity and quality of life in people who are able (`src-esc-heart-failure-2021`)
   - Accepted evidence wording: `improve exercise capacity`; `quality of life`; `exercise rehabilitation`
3. Consider supervised cardiac rehabilitation for more severe disease, frailty, or comorbidity (`src-esc-heart-failure-2021`)
   - Accepted evidence wording: `supervised cardiac rehabilitation`; `severe disease`; `frailty`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

### 6. Structured walking exercise in peripheral artery disease

Topic ID: `peripheral-artery-disease-walking`

#### Question — GUIDED / RECALL_SPRINT

Explain how structured exercise therapy fits into multidisciplinary management of chronic symptomatic lower-extremity peripheral artery disease.

**Expected answer — required evidence criteria:**

1. Assess walking impairment, limb and foot status, cardiovascular risk, and patient goals (`src-aha-pad-2024`)
   - Accepted evidence wording: `walking impairment`; `foot status`; `patient goals`
2. Use supervised exercise therapy or a structured community-based programme with behavioural support (`src-aha-pad-2024`)
   - Accepted evidence wording: `supervised exercise therapy`; `structured community programme`; `behavioural support`
3. Coordinate exercise with foot care, risk-factor management, and escalation for limb-threatening features (`src-aha-pad-2024`)
   - Accepted evidence wording: `foot care`; `risk-factor management`; `limb-threatening`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — GUIDED / DEEP_RESEARCH

Use the cited evidence sources to prepare, then answer: Explain how structured exercise therapy fits into multidisciplinary management of chronic symptomatic lower-extremity peripheral artery disease. State the source scope, one uncertainty, and what requires patient-specific clinical judgment.

**Expected answer — required evidence criteria:**

1. Assess walking impairment, limb and foot status, cardiovascular risk, and patient goals (`src-aha-pad-2024`)
   - Accepted evidence wording: `walking impairment`; `foot status`; `patient goals`
2. Use supervised exercise therapy or a structured community-based programme with behavioural support (`src-aha-pad-2024`)
   - Accepted evidence wording: `supervised exercise therapy`; `structured community programme`; `behavioural support`
3. Coordinate exercise with foot care, risk-factor management, and escalation for limb-threatening features (`src-aha-pad-2024`)
   - Accepted evidence wording: `foot care`; `risk-factor management`; `limb-threatening`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

### 7. Perioperative rehabilitation around CABG

Topic ID: `cabg-perioperative-rehabilitation`

#### Question — GUIDED / RECALL_SPRINT

Explain the physiotherapy pathway around coronary artery bypass grafting from preoperative function and education through early recovery and transition to cardiovascular rehabilitation.

**Expected answer — required evidence criteria:**

1. Assess and optimize modifiable functional risks and engage the person before surgery (`src-eras-cardiac-2019`)
   - Accepted evidence wording: `preoperative assessment`; `prehabilitation`; `patient engagement`
2. Coordinate early postoperative recovery within physiological, surgical, and team-defined safety limits (`src-eras-cardiac-2019`)
   - Accepted evidence wording: `early recovery`; `multidisciplinary care`; `safety limits`
3. Plan discharge education and transition into comprehensive cardiovascular rehabilitation (`src-bacpr-2023`, `src-eras-cardiac-2019`)
   - Accepted evidence wording: `discharge education`; `cardiovascular rehabilitation`; `continuity`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — GUIDED / DEEP_RESEARCH

Use the cited evidence sources to prepare, then answer: Explain the physiotherapy pathway around coronary artery bypass grafting from preoperative function and education through early recovery and transition to cardiovascular rehabilitation. State the source scope, one uncertainty, and what requires patient-specific clinical judgment.

**Expected answer — required evidence criteria:**

1. Assess and optimize modifiable functional risks and engage the person before surgery (`src-eras-cardiac-2019`)
   - Accepted evidence wording: `preoperative assessment`; `prehabilitation`; `patient engagement`
2. Coordinate early postoperative recovery within physiological, surgical, and team-defined safety limits (`src-eras-cardiac-2019`)
   - Accepted evidence wording: `early recovery`; `multidisciplinary care`; `safety limits`
3. Plan discharge education and transition into comprehensive cardiovascular rehabilitation (`src-bacpr-2023`, `src-eras-cardiac-2019`)
   - Accepted evidence wording: `discharge education`; `cardiovascular rehabilitation`; `continuity`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

### 8. Exercise testing and cardiovascular risk stratification

Topic ID: `exercise-testing-risk-stratification`

#### Question — GUIDED / RECALL_SPRINT

Explain how the clinical question, pre-test screening, test selection, monitoring, termination criteria, and findings inform an individualized exercise prescription.

**Expected answer — required evidence criteria:**

1. Define the clinical question and complete preparticipation screening before selecting a test (`src-acsm-getp-2025`)
   - Accepted evidence wording: `clinical question`; `preparticipation screening`; `test selection`
2. Monitor symptoms and physiological responses and apply appropriate termination criteria (`src-acsm-getp-2025`)
   - Accepted evidence wording: `physiological monitoring`; `symptom monitoring`; `termination criteria`
3. Use results with diagnosis, medication, goals, and setting to individualize FITT and supervision (`src-acsm-getp-2025`, `src-bacpr-2023`)
   - Accepted evidence wording: `FITT`; `individualized prescription`; `supervision`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — GUIDED / DEEP_RESEARCH

Use the cited evidence sources to prepare, then answer: Explain how the clinical question, pre-test screening, test selection, monitoring, termination criteria, and findings inform an individualized exercise prescription. State the source scope, one uncertainty, and what requires patient-specific clinical judgment.

**Expected answer — required evidence criteria:**

1. Define the clinical question and complete preparticipation screening before selecting a test (`src-acsm-getp-2025`)
   - Accepted evidence wording: `clinical question`; `preparticipation screening`; `test selection`
2. Monitor symptoms and physiological responses and apply appropriate termination criteria (`src-acsm-getp-2025`)
   - Accepted evidence wording: `physiological monitoring`; `symptom monitoring`; `termination criteria`
3. Use results with diagnosis, medication, goals, and setting to individualize FITT and supervision (`src-acsm-getp-2025`, `src-bacpr-2023`)
   - Accepted evidence wording: `FITT`; `individualized prescription`; `supervision`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

### 9. Adult basic life support

Topic ID: `adult-basic-life-support`

#### Question — GUIDED / RECALL_SPRINT

Explain the adult basic-life-support sequence, emphasizing recognition, emergency activation, high-quality CPR, prompt AED use, teamwork, and the need for certified skills practice.

**Expected answer — required evidence criteria:**

1. Recognize possible cardiac arrest and activate the emergency-response system (`src-aha-bls-2025`)
   - Accepted evidence wording: `recognize cardiac arrest`; `activate emergency response`; `call for help`
2. Provide high-quality CPR with minimal avoidable interruption (`src-aha-bls-2025`)
   - Accepted evidence wording: `high-quality CPR`; `chest compressions`; `minimize interruptions`
3. Use an AED promptly and follow its prompts while continuing coordinated care (`src-aha-bls-2025`)
   - Accepted evidence wording: `automated external defibrillator`; `AED`; `follow prompts`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — GUIDED / DEEP_RESEARCH

Use the cited evidence sources to prepare, then answer: Explain the adult basic-life-support sequence, emphasizing recognition, emergency activation, high-quality CPR, prompt AED use, teamwork, and the need for certified skills practice. State the source scope, one uncertainty, and what requires patient-specific clinical judgment.

**Expected answer — required evidence criteria:**

1. Recognize possible cardiac arrest and activate the emergency-response system (`src-aha-bls-2025`)
   - Accepted evidence wording: `recognize cardiac arrest`; `activate emergency response`; `call for help`
2. Provide high-quality CPR with minimal avoidable interruption (`src-aha-bls-2025`)
   - Accepted evidence wording: `high-quality CPR`; `chest compressions`; `minimize interruptions`
3. Use an AED promptly and follow its prompts while continuing coordinated care (`src-aha-bls-2025`)
   - Accepted evidence wording: `automated external defibrillator`; `AED`; `follow prompts`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

### 10. Anatomy, physiology & embryology of cardiovascular system

Topic ID: `cardiovascular-anatomy-physiology-embryology`

#### Question — GUIDED / RECALL_SPRINT

Explain the cardiovascular anatomy and physiology most relevant to exercise response, monitoring, and physiotherapy clinical reasoning.

**Expected answer — required evidence criteria:**

1. Relate chamber, valve, coronary, and vascular structure to circulation and functional demand (`src-curriculum`, `src-acsm-getp-2025`)
   - Accepted evidence wording: `cardiac chambers and valves`; `coronary and vascular structure`; `circulation`
2. Explain cardiac output as heart rate times stroke volume and connect preload, afterload, contractility, and vascular resistance to exercise response (`src-acsm-getp-2025`)
   - Accepted evidence wording: `cardiac output`; `heart rate times stroke volume`; `preload afterload contractility`
3. Use developmental or structural information with diagnosis, symptoms, medication, and measured response rather than as a stand-alone exercise decision (`src-curriculum`, `src-acsm-getp-2025`)
   - Accepted evidence wording: `developmental or structural information`; `clinical context`; `measured exercise response`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — GUIDED / DEEP_RESEARCH

Use the cited evidence sources to prepare, then answer: Explain the cardiovascular anatomy and physiology most relevant to exercise response, monitoring, and physiotherapy clinical reasoning. State the source scope, one uncertainty, and what requires patient-specific clinical judgment.

**Expected answer — required evidence criteria:**

1. Relate chamber, valve, coronary, and vascular structure to circulation and functional demand (`src-curriculum`, `src-acsm-getp-2025`)
   - Accepted evidence wording: `cardiac chambers and valves`; `coronary and vascular structure`; `circulation`
2. Explain cardiac output as heart rate times stroke volume and connect preload, afterload, contractility, and vascular resistance to exercise response (`src-acsm-getp-2025`)
   - Accepted evidence wording: `cardiac output`; `heart rate times stroke volume`; `preload afterload contractility`
3. Use developmental or structural information with diagnosis, symptoms, medication, and measured response rather than as a stand-alone exercise decision (`src-curriculum`, `src-acsm-getp-2025`)
   - Accepted evidence wording: `developmental or structural information`; `clinical context`; `measured exercise response`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

### 11. Health & performance principles, risk stratification, prevention & health promotion

Topic ID: `cardiovascular-risk-stratification-health-promotion`

#### Question — GUIDED / RECALL_SPRINT

Explain cardiovascular screening and risk stratification before exercise and how findings shape prevention, health promotion, prescription, supervision, and referral.

**Expected answer — required evidence criteria:**

1. Start with the clinical purpose, symptoms, diagnosis, recent events, medications, comorbidity, activity, and relevant cardiovascular risk factors (`src-acsm-getp-2025`, `src-bacpr-2023`)
   - Accepted evidence wording: `clinical purpose and symptoms`; `medications and comorbidity`; `cardiovascular risk factors`
2. Use findings to decide readiness, test selection, monitoring, supervision, and whether medical clarification is needed (`src-acsm-getp-2025`)
   - Accepted evidence wording: `exercise readiness`; `monitoring and supervision`; `medical clarification`
3. Co-produce an individualized physical-activity and risk-factor plan with behavior support, safety-netting, and outcome review (`src-bacpr-2023`, `src-acsm-getp-2025`)
   - Accepted evidence wording: `individualized physical activity`; `risk-factor management`; `behavior support and review`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — GUIDED / DEEP_RESEARCH

Use the cited evidence sources to prepare, then answer: Explain cardiovascular screening and risk stratification before exercise and how findings shape prevention, health promotion, prescription, supervision, and referral. State the source scope, one uncertainty, and what requires patient-specific clinical judgment.

**Expected answer — required evidence criteria:**

1. Start with the clinical purpose, symptoms, diagnosis, recent events, medications, comorbidity, activity, and relevant cardiovascular risk factors (`src-acsm-getp-2025`, `src-bacpr-2023`)
   - Accepted evidence wording: `clinical purpose and symptoms`; `medications and comorbidity`; `cardiovascular risk factors`
2. Use findings to decide readiness, test selection, monitoring, supervision, and whether medical clarification is needed (`src-acsm-getp-2025`)
   - Accepted evidence wording: `exercise readiness`; `monitoring and supervision`; `medical clarification`
3. Co-produce an individualized physical-activity and risk-factor plan with behavior support, safety-netting, and outcome review (`src-bacpr-2023`, `src-acsm-getp-2025`)
   - Accepted evidence wording: `individualized physical activity`; `risk-factor management`; `behavior support and review`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

### 12. Basic & advanced life support

Topic ID: `cardiovascular-advanced-life-support`

#### Question — GUIDED / RECALL_SPRINT

Explain how a physiotherapist responds to adult cardiac arrest, distinguishing universal basic life support actions from credentialed advanced-life-support team roles.

**Expected answer — required evidence criteria:**

1. Recognize cardiac arrest, activate the emergency response, begin high-quality CPR, and use an AED promptly (`src-aha-bls-2025`)
   - Accepted evidence wording: `recognize cardiac arrest`; `high-quality CPR`; `prompt AED`
2. Minimize interruptions and work within a coordinated resuscitation team using current local protocols and certified training (`src-aha-bls-2025`, `aha-adult-als-2025`)
   - Accepted evidence wording: `minimize interruptions`; `resuscitation team`; `certified training`
3. Describe advanced airway, rhythm, medication, and reversible-cause decisions as credentialed advanced-life-support responsibilities rather than unsupervised physiotherapy actions (`aha-adult-als-2025`)
   - Accepted evidence wording: `advanced life support roles`; `reversible causes`; `within credentials and protocol`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — GUIDED / DEEP_RESEARCH

Use the cited evidence sources to prepare, then answer: Explain how a physiotherapist responds to adult cardiac arrest, distinguishing universal basic life support actions from credentialed advanced-life-support team roles. State the source scope, one uncertainty, and what requires patient-specific clinical judgment.

**Expected answer — required evidence criteria:**

1. Recognize cardiac arrest, activate the emergency response, begin high-quality CPR, and use an AED promptly (`src-aha-bls-2025`)
   - Accepted evidence wording: `recognize cardiac arrest`; `high-quality CPR`; `prompt AED`
2. Minimize interruptions and work within a coordinated resuscitation team using current local protocols and certified training (`src-aha-bls-2025`, `aha-adult-als-2025`)
   - Accepted evidence wording: `minimize interruptions`; `resuscitation team`; `certified training`
3. Describe advanced airway, rhythm, medication, and reversible-cause decisions as credentialed advanced-life-support responsibilities rather than unsupervised physiotherapy actions (`aha-adult-als-2025`)
   - Accepted evidence wording: `advanced life support roles`; `reversible causes`; `within credentials and protocol`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

### 13. PT management in ICCU — monitoring, ventilator, hyperbaric oxygen therapy

Topic ID: `cardiovascular-iccu-monitoring-hyperbaric`

#### Question — GUIDED / RECALL_SPRINT

Explain physiotherapy decision-making in an intensive cardiac care setting, including readiness, monitoring, ventilator coordination, mobility, and the limited role of hyperbaric oxygen therapy.

**Expected answer — required evidence criteria:**

1. Confirm indication, hemodynamic and respiratory stability, lines or devices, medications, precautions, and team-defined readiness before intervention (`src-aha-acs-2025`, `src-sccm-padis-2025`)
   - Accepted evidence wording: `hemodynamic stability`; `lines and devices`; `team-defined readiness`
2. Coordinate ventilator-related care and graded mobility with the critical-care team while monitoring symptoms and physiological response and using explicit stop criteria (`src-ats-accp-weaning-2017`, `src-sccm-padis-2025`)
   - Accepted evidence wording: `ventilator coordination`; `graded mobility`; `monitoring and stop criteria`
3. Recognize hyperbaric oxygen as a specialist medical treatment for specific accepted indications, not a routine physiotherapy modality, and follow facility safety procedures (`fda-hyperbaric-oxygen-2021`)
   - Accepted evidence wording: `specialist medical treatment`; `not routine physiotherapy`; `accepted indications and safety`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

#### Question — GUIDED / DEEP_RESEARCH

Use the cited evidence sources to prepare, then answer: Explain physiotherapy decision-making in an intensive cardiac care setting, including readiness, monitoring, ventilator coordination, mobility, and the limited role of hyperbaric oxygen therapy. State the source scope, one uncertainty, and what requires patient-specific clinical judgment.

**Expected answer — required evidence criteria:**

1. Confirm indication, hemodynamic and respiratory stability, lines or devices, medications, precautions, and team-defined readiness before intervention (`src-aha-acs-2025`, `src-sccm-padis-2025`)
   - Accepted evidence wording: `hemodynamic stability`; `lines and devices`; `team-defined readiness`
2. Coordinate ventilator-related care and graded mobility with the critical-care team while monitoring symptoms and physiological response and using explicit stop criteria (`src-ats-accp-weaning-2017`, `src-sccm-padis-2025`)
   - Accepted evidence wording: `ventilator coordination`; `graded mobility`; `monitoring and stop criteria`
3. Recognize hyperbaric oxygen as a specialist medical treatment for specific accepted indications, not a routine physiotherapy modality, and follow facility safety procedures (`fda-hyperbaric-oxygen-2021`)
   - Accepted evidence wording: `specialist medical treatment`; `not routine physiotherapy`; `accepted indications and safety`

Review: [ ] accurate  [ ] scope-safe  [ ] citations suitable  [ ] accepted wording suitable  [ ] revise

Reviewer notes: ____________________________________________________________________

## Source index used by active answer criteria

- `src-curriculum` — DMIHER, Competency-Based Post Graduate Curriculum for Indian Physiotherapy PG, Cardiovascular & Respiratory Physiotherapy, 2022-2027, PDF pp. 119-127. https://dmiher.edu.in/lp/Educlass (accessed 2026-08-30)
- `src-gold-2026` — Global Initiative for Chronic Obstructive Lung Disease. Global Strategy for Diagnosis, Management, and Prevention of COPD: 2026 Report, v1.3, 8 Dec 2025. https://goldcopd.org/2026-gold-report-and-pocket-guide (accessed 2026-08-30)
- `src-gina-2026` — Global Initiative for Asthma. Global Strategy for Asthma Management and Prevention, 2026 update. https://ginasthma.org/2026-gina-strategy-report (accessed 2026-08-30)
- `src-ers-bronchiectasis-2025` — Chalmers JD et al. ERS clinical practice guideline for management of adult bronchiectasis. Eur Respir J. 2025;66:2501126. doi:10.1183/13993003.01126-2025. https://doi.org/10.1183/13993003.01126-2025 (accessed 2026-08-30)
- `src-ers-ats-pft-2022` — Stanojevic S et al. ERS/ATS technical standard on interpretive strategies for routine lung function tests. Eur Respir J. 2022;60:2101499. https://doi.org/10.1183/13993003.01499-2021 (accessed 2026-08-30)
- `src-ats-spirometry-2019` — Graham BL et al. Standardization of Spirometry 2019 Update: official ATS/ERS technical statement. AJRCCM. 2019;200:e70-e88. doi:10.1164/rccm.201908-1590ST. https://pmc.ncbi.nlm.nih.gov/articles/PMC6794117 (accessed 2026-08-30)
- `src-ats-abg` — American Thoracic Society. Interpretation of Arterial Blood Gases: six-step clinical education resource. https://www.thoracic.org/professionals/clinical-resources/critical-care/clinical-education/abgs.php (accessed 2026-08-30)
- `src-ats-pulmonary-rehab-2023` — Rochester CL et al. Pulmonary Rehabilitation for Adults with Chronic Respiratory Disease: official ATS guideline. AJRCCM. 2023;208:e7-e26. doi:10.1164/rccm.202306-1066ST. https://pmc.ncbi.nlm.nih.gov/articles/PMC10449064 (accessed 2026-08-30)
- `src-ers-ats-walk-2014` — Holland AE et al. Official ERS/ATS technical standard: field walking tests in chronic respiratory disease. Eur Respir J. 2014;44:1428-1446. doi:10.1183/09031936.00150314. https://pubmed.ncbi.nlm.nih.gov/25359355 (accessed 2026-08-30)
- `src-bts-oxygen-2017` — O'Driscoll BR et al. BTS guideline for oxygen use in adults in healthcare and emergency settings. BMJ Open Respir Res. 2017;4:e000170. doi:10.1136/bmjresp-2016-000170. https://pmc.ncbi.nlm.nih.gov/articles/PMC5531304 (accessed 2026-08-30)
- `src-sccm-padis-2025` — Lewis K et al. Focused update to PADIS guidelines for adults in ICU. Crit Care Med. 2025;53:e711-e727. doi:10.1097/CCM.0000000000006574. https://www.sccm.org/clinical-resources/guidelines/guidelines/focused-update-padis-guideline (accessed 2026-08-30)
- `src-ats-accp-weaning-2017` — Girard TD et al. Liberation from Mechanical Ventilation in Critically Ill Adults: official ATS/ACCP guideline. AJRCCM. 2017;195:120-133. https://www.thoracic.org/statements/guideline-implementation-tools/liberation-from-mechanical-ventilation-in-critically-ill-adults.php (accessed 2026-08-30)
- `src-bacpr-2023` — British Association for Cardiovascular Prevention and Rehabilitation. Standards and Core Components, 4th ed., 2023. https://www.bacpr.org/resources/publications (accessed 2026-08-30)
- `src-esc-ccs-2024` — Vrints C et al. 2024 ESC Guidelines for management of chronic coronary syndromes. Eur Heart J. 2024;45:3415-3537. doi:10.1093/eurheartj/ehae177. https://www.escardio.org/guidelines/clinical-practice-guidelines/all-esc-practice-guidelines/chronic-coronary-syndromes (accessed 2026-08-30)
- `src-aha-acs-2025` — Rao SV et al. 2025 ACC/AHA/ACEP/NAEMSP/SCAI Guideline for Management of Patients With Acute Coronary Syndromes. Circulation. 2025. doi:10.1161/CIR.0000000000001309. https://professional.heart.org/en/guidelines-statements/2025-accahaacepnaemspscai-guideline-for-the-management-of-patients-with-acutecir0000000000001309 (accessed 2026-08-30)
- `src-esc-heart-failure-2021` — McDonagh TA et al. 2021 ESC Guidelines for diagnosis and treatment of acute and chronic heart failure. Eur Heart J. 2021;42:3599-3726. doi:10.1093/eurheartj/ehab368. https://doi.org/10.1093/eurheartj/ehab368 (accessed 2026-08-30)
- `src-aha-pad-2024` — Gornik HL et al. 2024 ACC/AHA multisociety guideline for management of lower-extremity peripheral artery disease. Circulation. 2024. doi:10.1161/CIR.0000000000001251. https://professional.heart.org/en/science-news/2024-guideline-for-the-management-of-lower-extremity-peripheral-artery-disease (accessed 2026-08-30)
- `src-eras-cardiac-2019` — Engelman DT et al. Guidelines for perioperative care in cardiac surgery: ERAS Society recommendations. JAMA Surg. 2019;154:755-766. doi:10.1001/jamasurg.2019.1153. https://doi.org/10.1001/jamasurg.2019.1153 (accessed 2026-08-30)
- `src-acsm-getp-2025` — American College of Sports Medicine. ACSM's Guidelines for Exercise Testing and Prescription, 12th ed., published 24 Mar 2025. ISBN 9781975219215. https://acsm.org/education-resources/books/guidelines-exercise-testing-prescription (accessed 2026-08-30)
- `src-aha-bls-2025` — Kleinman ME et al. Part 7: Adult Basic Life Support, 2025 AHA CPR and ECC Guidelines. Circulation. 2025;152(suppl 2):S448-S478. doi:10.1161/CIR.0000000000001369. https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines/adult-basic-life-support (accessed 2026-08-30)
- `nice-ng236-stroke-rehab` — NICE. Stroke rehabilitation in adults. NG236. Published 18 Oct 2023; replaces CG162 (2013). https://www.nice.org.uk/guidance/ng236 (accessed 2026-08-30)
- `nice-ng62-cerebral-palsy` — NICE. Cerebral palsy in under 25s: assessment and management. NG62. Published 25 Jan 2017; last reviewed 19 Sep 2024. https://www.nice.org.uk/guidance/ng62 (accessed 2026-08-30)
- `nice-ng71-parkinsons` — NICE. Parkinson's disease in adults. NG71. Published 19 Jul 2017; last reviewed 19 Dec 2024. Updates and replaces CG35 (2006). https://www.nice.org.uk/guidance/ng71 (accessed 2026-08-30)
- `aha-asa-stroke-rehab-2016` — Winstein CJ et al.; AHA/ASA. Guidelines for Adult Stroke Rehabilitation and Recovery. Stroke. 2016;47(6):e98-e169. doi:10.1161/STR.0000000000000098. PMID:27145936. https://pubmed.ncbi.nlm.nih.gov/27145936/ (accessed 2026-08-30)
- `cochrane-mirror-therapy-2018` — Thieme H et al. Mirror therapy for improving motor function after stroke. Cochrane Database Syst Rev. 2018;7:CD008449. doi:10.1002/14651858.CD008449.pub3. PMID:29993119. https://pubmed.ncbi.nlm.nih.gov/29993119/ (accessed 2026-08-30)
- `cochrane-cimt-2015` — Corbetta D et al. Constraint-induced movement therapy for upper extremities in people with stroke. Cochrane Database Syst Rev. 2015;(10):CD004433. doi:10.1002/14651858.CD004433.pub3. PMID:26446577. https://pubmed.ncbi.nlm.nih.gov/26446577/ (accessed 2026-08-30)
- `cochrane-vr-stroke-2025` — Laver KE et al. Virtual reality for stroke rehabilitation. Cochrane Database Syst Rev. 2025;6:CD008349. doi:10.1002/14651858.CD008349.pub5. PMID:40537150. https://pubmed.ncbi.nlm.nih.gov/40537150/ (accessed 2026-08-30)
- `cochrane-treadmill-bws-2017` — Mehrholz J et al. Treadmill training and body weight support for walking after stroke. Cochrane Database Syst Rev. 2017;8:CD002840. doi:10.1002/14651858.CD002840.pub4. PMID:28815562. https://pubmed.ncbi.nlm.nih.gov/28815562/ (accessed 2026-08-30)
- `fugl-meyer-1975` — Fugl-Meyer AR et al. The post-stroke hemiplegic patient: a method for evaluation of physical performance. Scand J Rehabil Med. 1975;7(1):13-31. PMID:1135616. https://pubmed.ncbi.nlm.nih.gov/1135616/ (accessed 2026-08-30)
- `berg-balance-1992` — Berg KO et al. Measuring balance in the elderly: validation of an instrument. Can J Public Health. 1992;83 Suppl 2:S7-11. PMID:1468055. https://pubmed.ncbi.nlm.nih.gov/1468055/ (accessed 2026-08-30)
- `gmfm-russell-1989` — Russell DJ et al. The gross motor function measure: a means to evaluate effects of physical therapy. Dev Med Child Neurol. 1989;31(3):341-52. doi:10.1111/j.1469-8749.1989.tb04003.x. PMID:2753238. https://pubmed.ncbi.nlm.nih.gov/2753238/ (accessed 2026-08-30)
- `gmfcs-palisano-1997` — Palisano R et al. Development and reliability of a system to classify gross motor function in children with cerebral palsy. Dev Med Child Neurol. 1997;39(4):214-23. doi:10.1111/j.1469-8749.1997.tb07414.x. PMID:9183258. https://pubmed.ncbi.nlm.nih.gov/9183258/ (accessed 2026-08-30)
- `dmd-care-birnkrant-2018` — Birnkrant DJ et al.; DMD Care Considerations Working Group. Diagnosis and management of Duchenne muscular dystrophy, part 1. Lancet Neurol. 2018;17(3):251-267. doi:10.1016/S1474-4422(18)30024-3. PMID:29395989. https://pubmed.ncbi.nlm.nih.gov/29395989/ (accessed 2026-08-30)
- `sma-care-mercuri-2018` — Mercuri E et al.; SMA Care Group. Diagnosis and management of spinal muscular atrophy: Part 1. Neuromuscul Disord. 2018;28(2):103-115. doi:10.1016/j.nmd.2017.11.005. PMID:29290580. https://pubmed.ncbi.nlm.nih.gov/29290580/ (accessed 2026-08-30)
- `asia-isncsci-9th-2026` — American Spinal Injury Association. International Standards for Neurological Classification of Spinal Cord Injury (ISNCSCI), 9th Edition (2026). Richmond, VA: ASIA. https://www.asia-spinalinjury.org/ (accessed 2026-08-30)
- `mmse-folstein-1975` — Folstein MF, Folstein SE, McHugh PR. Mini-mental state: a practical method for grading the cognitive state of patients. J Psychiatr Res. 1975;12(3):189-98. https://pubmed.ncbi.nlm.nih.gov/?term=Folstein+mini-mental+state+1975 (accessed 2026-08-30)
- `umphred-neuro-rehab-2025` — Lazaro RT et al., eds. Umphred's Neurological Rehabilitation. 8th ed. Elsevier; published 17 Nov 2025. ISBN 9780443112928. https://www.us.elsevierhealth.com/umphreds-neurological-rehabilitation-9780443112928.html (accessed 2026-09-02)
- `campbell-pt-children-2023` — Palisano RJ et al., eds. Campbell's Physical Therapy for Children. 6th ed. Elsevier; 2023. ISBN 9780323797962. https://www.us.elsevierhealth.com/campbells-physical-therapy-for-children-9780323797962.html (accessed 2026-09-02)
- `shumway-cook-motor-control-2023` — Shumway-Cook A, Woollacott MH. Motor Control: Translating Research into Clinical Practice. 6th ed. Wolters Kluwer; 2023. ISBN 9781975209568. https://shop.lww.com/Motor-Control/p/9781975209568 (accessed 2026-09-02)
- `cdc-developmental-milestones-2026` — US CDC. Developmental Milestones. Learn the Signs. Act Early. Current website reviewed for 2026 use; milestone checklists are not diagnostic or screening tools. https://www.cdc.gov/act-early/milestones/index.html (accessed 2026-09-02)
- `aacpdm-early-cp-detection` — AACPDM. Early Detection of Cerebral Palsy Care Pathway. Current care pathway reviewed 2 Sep 2026. https://www.aacpdm.org/publications/care-pathways/early-detection-of-cerebral-palsy (accessed 2026-09-02)
- `morgan-early-cp-intervention-2021` — Morgan C et al. Early Intervention for Children Aged 0 to 2 Years With or at High Risk of Cerebral Palsy: International Clinical Practice Guideline. JAMA Pediatr. 2021;175:846-858. https://pmc.ncbi.nlm.nih.gov/articles/PMC9677545 (accessed 2026-09-02)
- `spina-bifida-mobility-guideline` — Spina Bifida Association. Mobility Guideline. Current clinical guidance reviewed 2 Sep 2026. https://www.spinabifidaassociation.org/blog/mobility (accessed 2026-09-02)
- `btf-pediatric-severe-tbi` — Brain Trauma Foundation. Guidelines for the Management of Pediatric Severe TBI, 3rd edition. Current guideline portal reviewed 2 Sep 2026. https://braintrauma.org/coma/guidelines/pediatric (accessed 2026-09-02)
- `aap-down-syndrome-2022` — Bull MJ et al. Health Supervision for Children and Adolescents With Down Syndrome. Pediatrics. 2022;149(5):e2022057010. https://publications.aap.org/pediatrics/article/149/5/e2022057010/186778/Health-Supervision-for-Children-and-Adolescents (accessed 2026-09-02)
- `nice-cg170-autism-under-19` — NICE. Autism spectrum disorder in under 19s: support and management. CG170. Published 2013; current surveillance status reviewed 2 Sep 2026. https://www.nice.org.uk/guidance/cg170 (accessed 2026-09-02)
- `apta-pediatrics-resources-2026` — APTA Pediatrics. Evidence-based resource documents, including neonatal and school-based pediatric physical therapy resources. Current portal reviewed 2 Sep 2026. https://pediatricapta.org/resource-documents (accessed 2026-09-02)
- `who-wheelchair-provision-2023` — World Health Organization. Wheelchair provision guidelines. Geneva: WHO; 2023. ISBN 9789240074521. https://www.who.int/publications/i/item/9789240074521 (accessed 2026-09-02)
- `apta-vestibular-hypofunction-2022` — Hall CD et al. Vestibular Rehabilitation for Peripheral Vestibular Hypofunction: Updated Clinical Practice Guideline. J Neurol Phys Ther. 2022;46:118-177. https://pubmed.ncbi.nlm.nih.gov/34864777 (accessed 2026-09-02)
- `cns-pediatric-hydrocephalus-2020` — Congress of Neurological Surgeons. Pediatric Hydrocephalus: Systematic Literature Review and Evidence-Based Guidelines. Updated 2020. https://www.cns.org/guidelines/browse-guidelines-detail/pediatric-hydrocephalus-guideline-1 (accessed 2026-09-02)
- `aha-adult-als-2025` — American Heart Association. Part 9: Adult Advanced Life Support. 2025 AHA Guidelines for CPR and Emergency Cardiovascular Care. Circulation. 2025;152(suppl 2). https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines/adult-advanced-life-support (accessed 2026-09-02)
- `fda-hyperbaric-oxygen-2021` — US Food and Drug Administration. Hyperbaric Oxygen Therapy: Get the Facts. Consumer safety communication; content current as of 26 July 2021. https://www.fda.gov/consumers/consumer-updates/hyperbaric-oxygen-therapy-get-facts (accessed 2026-09-02)

## Final disposition

Select exactly one after reviewing every active prompt and criterion:

- [ ] APPROVE for the stated educational scope
- [ ] APPROVE WITH REQUIRED CHANGES listed below
- [ ] DO NOT APPROVE

Required changes / exclusions: __________________________________________________________

Reviewer declaration: I reviewed the commit SHA recorded above and confirm that my disposition applies only to that immutable content revision and the stated educational scope.

- Signature: __________________________________________
- Date: ______________________________________________

Repository action after approval: retain the completed dated copy under release governance, record the real reviewer as `MEDICAL_REVIEWER`, set `reviewedAt`, resolve every required change, and rerun all content and application gates. Do not overwrite this generated template with the completed copy.
