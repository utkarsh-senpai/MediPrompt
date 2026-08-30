# MPT Competency-Based Curriculum - Candidate Practice Topics (DRAFT)

## Source citation

- **Document title:** Competency-Based Post Graduate Curriculum for the Indian Physiotherapy Post Graduate
- **Institution:** Ravi Nair Physiotherapy College, Datta Meghe Institute of Higher Education and Research (Deemed University), Wardha, Maharashtra, India
- **Source file:** `MPT COMPETENCY BASED CURRICULUM.pdf` (extracted with `pdftotext -layout` to ~5,972 lines / 210 pages)
- **Extracted and reviewed:** 2026-08-30 for MediPrompt

## Provenance and legal note

This file is a **DRAFT authoring reference**, not a reviewed or publishable MediPrompt topic pack. It
contains 265 concise **candidate practice-topic labels** derived from curriculum competency tables.
The number 265 is an authoring count, not an official curriculum count: some source competencies
were combined for a useful speaking prompt, some were split, and repeated practical rows were
usually folded into their didactic counterpart.

Only short labels and the minimum source coordinates needed for review are retained. No claim is
made that every label is outside copyright; publication still requires a documented source-use and
licence decision. Rubrics, model answers, prompts, viva questions, and medical correctness claims
have not been authored. The companion YAML is an authoring inventory and intentionally remains
`DRAFT`. It must not be loaded by the learner application or compiled into a runtime pack until an
educator has verified the topic-to-competency mapping and independently authored the learning
content.

## Extraction scope and traceability

PDF pages below are one-based file page numbers, not printed page numbers. The review used both
layout-aware text extraction and visual inspection of representative table pages in every subject.

| Curriculum section | Program coordinates | Section pages | Competency-table pages | Competency families |
| --- | --- | ---: | ---: | --- |
| Research Methods and Bioethics | Year 1, common, Paper I | 1-24 | 9-17 | `RMB` |
| Applied Physiotherapeutics | Year 1, common, Paper II | 25-49 | 34-42 | `PAP` |
| Musculoskeletal Physiotherapy | Year 2, specialty, Papers III-IV | 50-80 | 58-69 | `PMU`, `PML` |
| Neuro Physiotherapy | Year 2, specialty, Papers III-IV | 81-109 | 90-101 | `PPNP`, `PANP` |
| Cardiovascular and Respiratory Physiotherapy | Year 2, specialty, Papers III-IV | 110-137 | 119-127 | `PRP`, `PCVP` |
| Community Health Physiotherapy | Year 2, specialty, Papers III-IV | 138-178 | 146-168 | `PCP`, `PCWGP` |
| Sports Physiotherapy | Year 2, specialty, Papers III-IV | 179-210 | 187-196 | `PSP`, `PSA` |

Included: course-content competency rows and distinct practical skills useful for spoken practice.
Excluded: preambles, goals, PO/PSO/CO and AETCOM statements, examination schemes, book lists,
PO-CO matrices, teaching/assessment-method columns, and administrative prose. Those exclusions
avoid turning curriculum administration into learner prompts.

## Program overview

- **Program:** MPT — Master of Physiotherapy
- **Duration:** Two academic years, annual system (including dissertation submission).
- **Eligibility:** Bachelor in Physiotherapy + Post Graduate Physiotherapy Common Entrance Test (PGPCET) merit.
- **Structure:** Year 1 holds two **common** papers taken by all specialties. Year 2 holds **specialty** Paper III and Paper IV for the chosen track.
- **Year-1 common papers (all tracks):**
  - Paper I — Research Methods and Bioethics
  - Paper II — Applied Physiotherapeutics
- **Year-2 specialty tracks (each = Paper III + Paper IV):**
  1. MPT in Musculoskeletal Sciences (Musculoskeletal Physiotherapy)
  2. MPT in Neuro Sciences (Neuro Physiotherapy)
  3. MPT in Cardiovascular and Respiratory Sciences
  4. MPT in Community Health Physiotherapy
  5. MPT in Sports Physiotherapy

Subject codes are taken from the source document headers. Competency-family prefixes are encoded in
candidate IDs, but most exact row codes are not yet stored per candidate. The source page ranges and
competency families above are the present traceability boundary; exact row-code mapping is a
required educator-review task before compilation.

## Categorization model for MediPrompt

Curriculum navigation and learning classification solve different problems and must stay separate.
The application should preserve the source hierarchy for browsing:

```text
program -> year -> common/specialty track -> paper -> module -> competency code -> candidate topic
```

Each reviewed topic may then receive independent classification values:

| Axis | Controlled values / examples | Product use |
| --- | --- | --- |
| Primary domain | foundations-science; condition-pathophysiology; assessment-investigation; clinical-reasoning; intervention-rehabilitation; procedure-perioperative-critical-care; population-community-participation; research-ethics-evidence-professional-practice; sport-performance | Cross-paper discovery and balanced random draws |
| Context | pediatric; adult; geriatric; women; athlete; community; upper-quadrant; lower-quadrant; body system | Optional secondary filters; a topic may have several |
| Prompt blueprint | explain-concept; assess; interpret; manage-case; compare-differentiate; explain-procedure; defend-evidence; teach-back | Generates a reviewed prompt-authoring queue, never medical content automatically |
| Lifecycle | candidate; normalized; educator-reviewed; prompt-ready; published | Prevents raw extraction from reaching learners |

The first UI filters should be year, track, paper, and module. Domain and context tags are secondary;
they must not replace the curriculum coordinates or imply equivalent depth across specialties.

## Topic hierarchy

### Subject 1 — Research Methods and Bioethics (Paper I, Year 1)
*Subject code: MPT/RESEARCH METHODS & BIOETHICS/2022-2023 to 2026-2027 — 32 topics*

- Module: Bioethics & Professional Practice I
  - Helsinki Declaration & ethical issues in physiotherapy (clinical, research, academics)
  - Rights & responsibilities of physiotherapist and client; PWD Act; rules & regulations (national & international; MSOTPT Council, IAP & WCPT)
  - Roles of the physiotherapist per WCPT/WHO; standards for practice
  - Administration & management in physiotherapy (hospital, community, industry; planning, budget, quality assurance; communication, leadership, teamwork)
  - Education — formal & non-formal; health-education philosophy; curricular planning; teaching technology; clinical teaching; assessment of student competencies
- Module: Bioethics & Professional Practice II
  - Documentation of rehabilitation assessment & management using ICF; future challenges in physiotherapy
- Module: Research Methodology I
  - Introduction to research
  - Types of research & defining a research question
  - Qualitative study designs (grounded theory, phenomenological methods)
  - Delphi process
  - Quantitative study designs
  - Type I and Type II bias
- Module: Research Methodology II
  - Study design (case study, case series, longitudinal cohort, pre-post, time series, repeated measures, RCT)
  - Sampling design & minimum sample-size calculation
  - Measurement properties (reliability, validity, responsiveness, MCID)
  - Outcome measures in rehabilitation research
  - Research methods — designing methodology & reporting results
  - Communicating research
- Module: Research Methodology III — Scientific Writing
  - Scientific writing (research paper, review paper, book, thesis, conference/project reports; APA/MLA styles; citation & references; evaluation of research)
  - Report writing; abstract preparation; oral & poster presentation
- Module: Biostatistics I
  - Introduction to biostatistics; sources & presentation of data
  - Measures of location & variability; normal distribution & curve
  - Sampling, probability, sampling variability & significance
  - Significance of difference in means (small & large sample)
- Module: Biostatistics II
  - Statistical inference; T-test (comparison of group means)
  - Analysis of variance
  - Multiple comparison tests; non-parametric tests
  - Correlation & regression
  - Analysis of frequencies — chi-square
- Module: Biostatistics III
  - Statistical measure of reliability
  - Power analysis & determining sample size
  - Measures of population (rate, ratio, proportion, incidence, prevalence, relative risk, risk ratio, odds ratio)

### Subject 2 — Applied Physiotherapeutics (Paper II, Year 1)
*Subject code: MPT/APPLIED PHYSIOTHERAPEUTICS/2022-2023 to 2026-2027 — 35 topics*

- Module: Exercise Physiology and Nutrition
  - Introduction to exercise physiology (body composition, nutrition, caloric balance, performance)
  - Sources of energy, energy transfer & energy expenditure at rest and activity
  - Physiologic support systems & physical activity (cardio-pulmonary, neuromuscular, hormonal)
  - Responses & adaptations of various systems to exercise and training
  - Assessment & training for endurance and strength (anaerobic & aerobic power)
  - Environmental influence on performance
  - Exercise prescription for health & fitness; age & sex considerations
  - Fatigue — assessment & management
- Module: Physiotherapy Diagnosis
  - Radiological investigations & imaging (MRI, X-ray) — musculoskeletal, neurological, cardiorespiratory, community
  - ECG & pulmonary function tests
  - Anthropometric measurements
  - Physical fitness assessment (body composition, ETT, field test, 6-minute walk test, flexibility, muscle strength, endurance, agility, balance, coordination)
  - Effect of aerobic/anaerobic/isometric/isotonic/isokinetic exercise on muscle & cardio-pulmonary function
  - S-D curve, EMG, NCV interpretation & biofeedback
  - Physical disability evaluation & disability diagnosis
  - Posture & gait analysis
- Module: Advance Physiotherapeutics
  - Pain — neurobiology, theories, assessment, modulation & management
  - Effect of medications on activity performance (antidepressants, narcotics, dopamine, beta-blockers, ACE inhibitors, diuretics, statins, oral hypoglycemics, bronchodilators, NSAIDs & steroids, etc.)
  - Physiotherapy for health & stress management
  - CPR, monitoring systems, defibrillators & artificial respirators
  - Physiotherapy modalities, techniques & approaches
  - Aging — physiological changes & physiotherapy management
  - Aids & appliances, adaptive functional devices for movement dysfunction
  - Physiotherapy in disaster management
  - Integration of yoga in physiotherapy for health promotion
  - Aquatic therapy (properties of water, hydrodynamics, immersion physiology, indications/contraindications, concepts)
  - Clinical decision making in physiotherapeutics
- Module: Screening & Evaluation (practical)
  - Screening & evaluation — subjective examination
  - Pain evaluation — subjective & objective assessment; pain measurement scales
  - General survey & physical examination techniques; integumentary, nail-bed, lymph-node, regional & systems-review screening
  - Screening & evaluation for cardiovascular & respiratory disease
  - Screening & evaluation for cancer
  - Screening & evaluation of head, cervical, thoracic & lumbosacral region
  - Screening & evaluation of upper & lower quadrant
  - ICF-based rehabilitation assessment & management

### Subject 3 — Musculoskeletal Physiotherapy (MPT in Musculoskeletal Sciences) (Papers III & IV, Year 2)
*Subject code: MPT/MPT IN MUSCULOSKELETAL SCIENCES/2022-2023 to 2026-2027 — 50 topics*

- Paper III — Musculo-skeletal Dysfunctions of the Upper Quadrant (occiput, cervical spine, thoracic spine, shoulder girdle, upper extremities) — 24 topics
  - Module: Biomechanics & pathomechanics
    - Shoulder complex
    - Elbow complex
    - Wrist complex
    - Cervical & thoracic complex
  - Module: Pathophysiology & clinical features
    - Shoulder complex
    - Elbow & wrist complex
    - Cervical & thoracic complex
  - Module: Assessment & functional diagnostic procedures
    - Shoulder complex (special tests, scales, questionnaires)
    - Elbow complex
    - Wrist complex
    - Cervical & thoracic complex
  - Module: Clinical decision making & management
    - Pediatric upper-quadrant dysfunctions
    - Adult upper-quadrant dysfunctions
    - Geriatric upper-quadrant dysfunctions
  - Module: Surgical procedures & perioperative physiotherapy
    - Traumatic upper-quadrant conditions
    - Non-traumatic upper-quadrant conditions
  - Module: Manual therapy
    - Manual therapy techniques & clinical reasoning (McKenzie, Maitland, Cyriax, Mulligan, Kaltenborn — peripheral & spinal)
    - Myofascial release, muscle energy, neurodynamics/neural tissue mobilization, taping (Kinesio & McConnell)
  - Module: Applied practice
    - Assistive devices for stability & mobility
    - Evidence-based practice in upper quadrant
    - Integumentary impairments in upper quadrant
    - Clinical decisions for lower-quadrant function with upper-quadrant dysfunction
    - Hand rehabilitation — soft-tissue injuries; sensory & motor re-education
    - Hand rehabilitation — congenital & acquired deformities; orthotics; recent advances
- Paper IV — Musculo-skeletal Dysfunctions of the Lower Quadrant and Sports (lumbar spine, sacrum, pelvis, lower extremities) — 26 topics
  - Module: Biomechanics & pathomechanics
    - Hip complex
    - Knee complex
    - Ankle complex
    - Lumbo-sacral complex
  - Module: Pathophysiology & clinical features
    - Hip complex
    - Knee & ankle complex
    - Lumbo-sacral complex
  - Module: Assessment & functional diagnostic procedures
    - Hip complex
    - Knee complex
    - Ankle complex
    - Lumbo-sacral complex
  - Module: Clinical decision making & management
    - Pediatric lower-quadrant dysfunctions
    - Adult lower-quadrant dysfunctions
    - Geriatric lower-quadrant dysfunctions
  - Module: Surgical procedures & perioperative physiotherapy
    - Traumatic lower-quadrant conditions
    - Non-traumatic lower-quadrant conditions
  - Module: Manual therapy
    - Manual therapy techniques & clinical reasoning (lower quadrant)
    - Myofascial release, muscle energy, neurodynamics, taping (lower quadrant)
  - Module: Applied practice
    - Assistive devices for stability & mobility (lower quadrant)
    - Evidence-based practice in lower quadrant
    - Integumentary impairments in lower quadrant
    - Clinical decisions for upper-quadrant function with lower-quadrant dysfunction
  - Module: Sports (within MSK track)
    - Sports philosophy, physiology, psychology & pharmacology
    - Biomechanics & pathomechanics of common sports & sports injuries
    - Sport injury — prevention, diagnosis, treatment & rehabilitation
    - Gait rehabilitation

### Subject 4 — Neuro Physiotherapy (MPT in Neuro Sciences) (Papers III & IV, Year 2)
*Subject code: MPT/MPT IN NEURO SCIENCES/2022-2023 to 2026-2027 — 35 topics*

- Paper III — Pediatric Neurology — 23 topics
  - Embryology of the nervous system; principles of human development
  - Gross & fine motor development; assessment & testing of infant and child
  - Developmental reflexes (primitive, spinal, brainstem, cortical)
  - Theories of motor development, motor control & motor learning; stages of learning
  - Early identification & early intervention in pediatric neurological disorders
  - Infant at high risk for developmental delay
  - Cerebral palsy
  - Spina bifida
  - Pediatric traumatic brain injury & traumatic/non-traumatic spinal cord injury
  - Neuromuscular disorders in childhood (muscular dystrophies, SMA, polyneuropathy, meningitis, encephalitis)
  - Intellectual disabilities — Down syndrome
  - Autism spectrum disorder & physical therapy
  - Parent education & counselling; family-centred care
  - Pathological & radiological investigations; evoked potentials
  - Advanced assessment of pediatric neuropsychological/neurosurgical conditions (GCS, GMFM, sensory profile)
  - Surgical procedures in neuropediatric disorders (hydrocephalus, spina bifida) & perioperative PT
  - Advanced physiotherapy approaches (PNF, NDT, Rood's, Motor Relearning Program, Vojta)
  - Clinical decision making & evidence-based practice (pediatric)
  - Posture & gait assessment & management in pediatric neurological conditions
  - PT management of progressive & non-progressive pediatric conditions; terminally ill children; perceptuo-motor & sensory issues
  - Physiotherapy in neonatal & pediatric intensive care units
  - Social integration of children (school/community, assistive technology, legislation, orthotics/prosthetics)
  - Pharmacotherapeutics in pediatric neurological conditions
- Paper IV — Adult Neurology — 12 topics
  - Review of nervous-system basics (anatomical & physiological)
  - Neural plasticity & movement plasticity
  - Clinical decision making & evidence-based practice (adult)
  - Advanced assessment of adult neurological/neurosurgical/neuropsychological conditions
  - Outcome measures & assessment methods (GCS, MMSE, Berg Balance Scale, Fugl-Meyer, Barthel index, ASIA Impairment scale)
  - Advanced neuro-therapeutic skills (PNF, NDT, Rood's, Motor Relearning, Brunnstrom, task-oriented)
  - Pathophysiology & PT management of CNS/ANS/PNS — cerebrovascular accidents
  - Inflammatory, degenerative, metabolic, traumatic & infectious conditions; cranial-nerve disorders
  - Space-occupying CNS lesions, TBI, traumatic spinal cord injury, vestibular disorders, myopathies
  - Social integration of disabled persons; adaptive equipment; orthotics/prosthetics
  - Pharmacotherapeutics in adult neurological conditions
  - Recent advances in technology for neurological physiotherapy

### Subject 5 — Cardiovascular & Respiratory Physiotherapy (MPT in Cardiovascular and Respiratory Sciences) (Papers III & IV, Year 2)
*Subject code: MPT/MPT IN CARDIOVASCULAR AND RESPIRATORY SCIENCES/2022-2023 to 2026-2027 — 26 topics*

- Paper III — Respiratory Physiotherapy — 13 topics
  - Anatomy, physiology, biomechanics, pathomechanics & embryology of respiratory system & thorax
  - Assessment of neonatal, pediatric, adult & critically ill respiratory patients
  - Pathophysiology & clinical features of acute & chronic respiratory dysfunctions; pharmacotherapy
  - Investigations (X-ray, PFT, ABG, blood, sputum, CT, MRI) & relevance to physiotherapy
  - Clinical reasoning in PT evaluation & management (neonatal, pediatric, adult; acute care & rehab)
  - Recent advances in outcome measures for thoracic & respiratory dysfunction
  - Surgical procedures (thoracotomy, thoracoplasty, pleurodesis, ICT, lobectomy, pneumonectomy, VATS, lung transplantation) & perioperative PT
  - PT management in RICU — monitoring, ventilator modes, weaning, oxygen therapy
  - Clinical decision making & evidence-based practice (respiratory)
  - Ergonomics & energy conservation in respiratory dysfunction; assistive devices
  - Recent advances in airway-clearance & inspiratory muscle-training devices
  - Physiotherapy management in COVID-19 & recent advances
  - Pulmonary rehabilitation
- Paper IV — Cardiovascular Physiotherapy — 13 topics
  - Anatomy, physiology & embryology of cardiovascular system
  - Assessment of neonatal, pediatric, adult & critically ill cardiac patients
  - Pathophysiology & clinical features of acute & chronic cardiovascular & peripheral vascular disease; pharmacotherapy & PT
  - Investigations (ECG, X-ray, blood biomarkers, Doppler, angiography) & relevance to physiotherapy
  - Clinical reasoning in PT evaluation & management (CV & peripheral vascular; acute care & rehab)
  - Recent advances in outcome measures for CV & peripheral vascular dysfunction
  - Surgical procedures (CABG, MVR, AVR, heart transplantation, angioplasty, robotics, ASD, VSD, TOF) & perioperative PT
  - PT management in ICCU — monitoring, ventilator, hyperbaric oxygen therapy
  - Clinical decision making & evidence-based practice (cardiovascular)
  - Cardiac rehabilitation (Phase I, II, III & IV)
  - Exercise testing & prescription in cardiac conditions, PVD & diabetes mellitus
  - Health & performance principles, risk stratification, prevention & health promotion
  - Basic & advanced life support

### Subject 6 — Community Health Physiotherapy (MPT in Community Health) (Papers III & IV, Year 2)
*Subject code: MPT/MPT IN COMMUNITY HEALTH/2022-2023 to 2026-2027 — 53 topics*

- Paper III — Essentials of Community Physiotherapy — 13 topics
  - Legal issues — national & international (WHO) rehabilitation acts & implementation
  - Health delivery system in India — health & illness; levels of healthcare
  - Fitness training for health promotion in community
  - Basic concepts of rehabilitation; institute-based rehabilitation; multidisciplinary approach
  - Community-based rehabilitation (CBR) — methodology, spectrum, govt/NGO roles, outreach, rehabilitation counselling
  - Role of community physiotherapist (national/state institutes, district rehabilitation centre, PHC)
  - Legislation & laws for persons with disability (national & UN); public awareness
  - Disability evaluation per ICF (MSK, neurological, cardio-respiratory) & rehabilitation of disabled
  - Appropriate technology & assistive devices for stability & mobility
  - Home exercise programs — musculoskeletal conditions (arthritis, chronic pain, burn, degenerative/progressive)
  - Home exercise programs — neurological conditions (SCI, TBI, stroke, Parkinson's)
  - Home exercise programs — cardiorespiratory conditions (amputation, heart & pulmonary disease)
  - Physical fitness, yoga & psychosomatic approaches (meditation) for stress management
- Paper IV — Women's Health, Industrial Health & Geriatric Health — 40 topics
  - Module: Geriatric health (15)
    - Physiology of ageing; factors affecting ageing
    - Theories of aging
    - Geriatric medicine & geriatric surgery
    - Common diseases affecting the elderly
    - Assessment of geriatric conditions
    - Geriatric rehabilitation — exercise prescription in geriatrics
    - Nutrition in geriatric health
    - Falls in geriatrics & fall-prevention programme; incontinence, balance; home/workplace modification
    - Psychosocial & safety issues in the elderly
    - Services for the elderly
    - Recent advances in geriatric physical therapy
    - Posture & gait evaluation & management in the elderly
    - Successful aging
    - Holistic physiotherapy for the elderly
    - Evidence-based practice in geriatrics
  - Module: Women's health (15)
    - Women's reproductive health care; physiology of pregnancy; assessment of common discomforts
    - Antenatal care & exercise prescription
    - Pregnancy-induced complications (cardiac, vascular, respiratory, neurologic)
    - Labour — pain mechanism & relief; physical therapy for pain during labour
    - Postpartum care; post-natal exercises
    - Caesarean section & physiotherapy management
    - Neonate handling education (kangaroo care)
    - Common gynaecologic conditions & PT management (pelvic inflammatory disease, incontinence, uterovaginal prolapse, infertility, PCOD, obesity)
    - Common surgical interventions (hysterectomy, laparotomy) & PT management
    - Musculoskeletal pain & dysfunction in the childbearing year
    - Recent advances in women's health
    - Menopause (climacteric) — anatomical, physiological, psychological & cardiovascular changes
    - Cancer rehabilitation (breast & reproductive organs); osteoporosis, falls & fractures in postmenopausal women
    - Exercise prescription for postmenopausal women
    - Exercise testing & prescription in female athletes
  - Module: Industrial health (9)
    - Occupational health, occupational stress, hazards, industrial hygiene, vulnerable worker groups
    - Industrial therapy — traditional medical model vs worker-care spectrum; assessment of worker
    - Injury prevention — ergonomics, job analysis, pre-employment screening; employee fitness programme
    - Returning to work — functional capacity evaluation, job simulation, work conditioning & hardening
    - Workplace injuries — design, repetitive motion & cumulative trauma disorders
    - Ergonomics — principles & application to job/workstation design and redesign
    - Recent advances in industrial therapy
    - Physiotherapy role in industry — preventive, intervention, ergonomic & rehabilitative
    - Ergonomics of hand tools, posture, material handling & lifting
  - Module: Cross-cutting
    - Evidence-based practice in community health

### Subject 7 — Sports Physiotherapy (MPT in Sports) (Papers III & IV, Year 2)
*Subject code: MPT/MPT IN SPORTS/2022-2023 to 2026-2027 — 34 topics*

- Paper III — Advances in Sports Physiotherapy (Part I) — 20 topics
  - Introduction to sports sciences
  - Introduction to exercise physiology (sports context)
  - Cricket, football, basketball & hockey — terminology, methodology, rules, equipment, infrastructure
  - Tennis, track & field, aquatic sports — terminology, methodology, rules, equipment, infrastructure
  - Assessment & diagnosis of sports injuries
  - Sports-specific fitness (cricket, football, track & field, aquatic)
  - Principles of sports biomechanics & biomechanics of injury
  - Physics in sports — biomechanics of running, throwing, swimming & jumping; advances in biomechanics assessment
  - Advanced cardio-respiratory exercise physiology; strength training; fitness & strength testing in sports
  - Sports-specific conditioning & agility training; sports equipment (incl. gym equipment)
  - Psychological aspects in sports (grief/loss models, cognitive stress & emotional response)
  - Doping & performance-enhancing drugs
  - Protective equipment in sports incl. orthotics; sports traumatology
  - Principles of investigations & imaging in sports injuries
  - Tissue healing & soft-tissue injuries of lower limb (hip, thigh, knee, leg, ankle)
  - Tissue healing & soft-tissue injuries of upper limb (shoulder, elbow, forearm, wrist, hand)
  - Common fractures & dislocations; spinal injuries in sports
  - Overuse injuries in sports
  - Sports-specific problems in female, pediatric & elderly athletes
  - On-field assessment & decision making; injury prevention in sports
- Paper IV — Advances in Sports Physiotherapy (Part II) — 14 topics
  - Principles of sports injury management
  - Specific psychology management in sports; sports-specific training
  - Advanced sports assessment skills; initial management of acute sports injuries
  - Surgical management & rehabilitation (incl. arthroscopic surgery) for sports injuries
  - Injury & sports-specific management; management of overuse injuries
  - Electrotherapy in sports rehabilitation; rehabilitation of sports injuries
  - Manual therapy techniques in sports (McKenzie, Maitland, Cyriax, Mulligan mobilization, positional release — peripheral joints)
  - Manual therapy in sports — myofascial release, muscle energy, neurodynamics
  - Musculoskeletal screening of athletes (pre-season, in-season, post-season)
  - Sports management of special populations (geriatric, physically challenged athletes)
  - Taping techniques & recent advances in sports rehabilitation
  - Diet & sports (pre-session diet, pre-game meal, carbohydrate loading, high-fat/high-protein diet)
  - Evidence-based sports rehabilitation & return-to-sports criteria
  - Problems in female athletes; menstrual synchrony; preventive strategies

## Counts

| # | Subject | Paper(s) | Year | Topics |
| --- | --- | --- | --- | --- |
| 1 | Research Methods and Bioethics | I | 1 | 32 |
| 2 | Applied Physiotherapeutics | II | 1 | 35 |
| 3 | Musculoskeletal Physiotherapy | III & IV | 2 | 50 |
| 4 | Neuro Physiotherapy | III & IV | 2 | 35 |
| 5 | Cardiovascular & Respiratory Physiotherapy | III & IV | 2 | 26 |
| 6 | Community Health Physiotherapy | III & IV | 2 | 53 |
| 7 | Sports Physiotherapy | III & IV | 2 | 34 |
| **Total** | | | | **265** |

## Extraction review findings

- **Granularity is intentionally non-canonical.** Research mostly yields one label per competency;
  Community Paper III combines several rows; some composite rows were split where two concepts would
  make distinct speaking prompts. Practical repetitions were generally folded into the related
  didactic candidate. This is why the count is explicitly 265 candidate labels rather than 265
  official topics or competencies.
- **Practical-table labels are inconsistent in the source.** Most papers distinguish didactic and
  non-didactic/practical content, but Sports Paper IV labels its repeated skills table "Didactic
  Content." MediPrompt classifies by the row's learning purpose and provenance, not by assuming all
  source tables use one label.
- **Applied Physiotherapeutics adds distinct practical screening candidates.** These are retained
  where the practical table introduces a usable evaluation skill rather than merely repeating the
  didactic row.
- **Cardiovascular Paper IV contains a source anomaly.** Early `PCVP` rows display Paper III in the
  table column, while the enclosing section is Part II / Paper IV (Cardiovascular Physiotherapy).
  This reference follows the enclosing section and records the anomaly for review.
- **Musculoskeletal Paper IV also covers sports.** The `PML` sports block is retained separately
  from the dedicated Sports specialty because their source coordinates and expected depth differ.
- **Recurring concepts are not automatic duplicates.** Exercise physiology, physical-fitness
  assessment, posture/gait, manual therapy, assistive devices, pharmacotherapeutics, clinical
  reasoning, evidence-based practice, ICF documentation, and life support recur in different
  contexts. An educator must decide whether a shared rubric is valid or a specialty-specific rubric
  is required.
- **No image-only competency tables were found.** Multi-line wrapping and merged cells still make
  exact automated row association unsafe; page and row-code evidence must survive normalization.

## Educator review checklist

Before any candidate becomes prompt-ready:

1. Confirm the label against the cited PDF page and exact competency code(s).
2. Confirm its year, track, paper, and module; resolve the documented source anomalies.
3. Decide whether combined labels should split and whether split labels should recombine.
4. Assign one primary domain, optional context tags, and suitable prompt blueprint(s).
5. Author original prompt wording, expected concepts, acceptable variants, limitations, and sources.
6. Review medical accuracy, scope, and exam relevance; record reviewer identity and date.
7. Record the content licence and attribution decision.
8. Promote lifecycle state one gate at a time; only `published` content may enter a runtime pack.

No rubrics, prompts, viva questions, difficulty levels, or classification tags have been authored in
this inventory. Empty fields are deliberate and must fail publication validation.
