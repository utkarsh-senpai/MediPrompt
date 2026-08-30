# MPT Cardiovascular and Respiratory Medical-Content Review

**Status:** source-grounded educator-review candidate; DRAFT; not for learner publication

**Evidence checked:** 2026-08-30

**Runtime candidate:** content/candidates/mpt-cardiorespiratory-review-candidate.json

**Generator:** apps/learner-web/scripts/generate-medical-candidate.ts

## Decision

MediPrompt now contains a complete 20-topic medical candidate pack rather than an empty medical
authoring queue. Every expected concept in its 46 prompt rubrics resolves to one or more identified
sources, all prompts and fictional cases use original wording, and three topics have distinct
Guided, Applied, and Viva variants.

The pack deliberately remains DRAFT. A guideline, textbook, or curriculum can support a claim,
but it cannot attest that a qualified educator reviewed MediPrompt's exact selection, phrasing,
fictional cases, rubrics, accepted phrases, scope, and exam relevance. The application therefore
continues to publish the approved non-medical interaction fixture until the attestation in this
document is completed by an identifiable medical educator.

## What was validated

### Curriculum provenance

The supplied source is:

- **Title:** Competency-Based Post Graduate Curriculum for the Indian Physiotherapy Post Graduate
- **Institution:** Ravi Nair Physiotherapy College, Datta Meghe Institute of Higher Education and
  Research, Wardha
- **Subject:** MPT in Cardiovascular and Respiratory Sciences, 2022-2023 to 2026-2027
- **File pages used:** 119-127 for the competency tables; 137-138 for recommended books and journals
- **SHA-256:** 245e15083822f842a5177f617604343328de3efa4063b03b245033061d15247c

The PDF was inspected as text and as rendered pages. File page 119 visibly begins Paper III,
Respiratory Physiotherapy, with competency codes PRP 1.1 through PRP 3.1. Subsequent pages
contain the investigation, RICU, airway-clearance, pulmonary-rehabilitation, cardiovascular,
exercise-testing, rehabilitation, surgery, and life-support rows used below.

The curriculum's prescribed list includes Guyton, mechanical-ventilation texts, Schamroth ECG,
Hyatt and Scanlon on PFT interpretation, Wasserman on exercise testing, Egan's respiratory-care
text, Harrison's, Braunwald's, Irwin, Frownfelter, Hillegass, Pryor and Prasad, Hough, Watchie, and
cardiac/pulmonary-rehabilitation texts. These remain useful teaching background. Because the PDF
does not identify editions and several items are old, MediPrompt does not treat the book list as
sufficient proof of current clinical guidance. Current primary guidelines and technical standards
anchor the candidate rubrics.

### Source hierarchy

Evidence selection used this order:

1. Current official clinical-practice guidelines and technical standards from professional bodies.
2. Current official strategy reports produced by an expert guideline committee.
3. Still-current professional standards when no 2025-2026 replacement exists.
4. Prescribed textbooks for educator background, not as copied or redistributed content.
5. Secondary summaries only for discovery; they are not rubric sources.

The sources establish provenance, not a treatment protocol for a real patient. They do not replace
local law, institutional policy, clinician judgment, certified BLS training, or educator review.

## Topic-to-curriculum and evidence matrix

| Candidate topic | Curriculum anchor | Primary rubric sources | Narrow review scope |
| --- | --- | --- | --- |
| Structured respiratory assessment | PRP 2.1, pp. 119-120 | GOLD 2026; GINA 2026; ERS/ATS PFT 2022 | Symptoms, function, observations, safety, integrated findings |
| Spirometry and PFT interpretation | PRP 4.1, p. 120 | ATS/ERS Spirometry 2019; ERS/ATS PFT 2022 | Quality before interpretation, reference limits, clinical integration |
| Arterial blood gas interpretation | PRP 4.1, p. 120 | ATS ABG resource; BTS Oxygen 2017 | Consistency, primary process/compensation, oxygenation and ventilation |
| COPD assessment and rehabilitation planning | PRP 3.1, PRP 5.1, PRP 12.2, pp. 119-123 | GOLD 2026; ATS Pulmonary Rehabilitation 2023 | Confirmation, multidimensional assessment, rehabilitation indication |
| Comprehensive pulmonary rehabilitation | PRP 12.2, p. 123 | ATS 2023; GOLD 2026 | Assessment, exercise, education, behaviour change, outcomes and access |
| Asthma assessment and self-management | PRP 3.1, PRP 5.1, pp. 119-120 | GINA 2026 | Control versus risk, objective variability, inhaler skills and action plan |
| Bronchiectasis airway clearance | PRP 11.1, p. 122 | ERS Bronchiectasis 2025; ATS 2023 | Assessment, individualized technique, review, activity/rehabilitation |
| Safe oxygen-therapy principles | PRP 8.1, p. 121 | BTS Oxygen 2017; ATS ABG | Prescribed targets, hypercapnia risk, monitoring and escalation |
| ICU rehabilitation and mobilization | PRP 8.1, p. 121 | SCCM PADIS update 2025 | Stability, individualized team delivery, explicit dose uncertainty |
| Ventilator liberation | PRP 8.1, p. 121 | ATS/ACCP 2017; SCCM 2025 | Readiness, spontaneous-breathing trials, sedation/rehabilitation, scope |
| Six-minute walk test | PRP 6.1, p. 120 and clinical-posting table | ERS/ATS Field Walking 2014 | Standardization, monitoring, documentation, contextual interpretation |
| Cardiovascular assessment and ECG | PCVP 2.1, PCVP 4.1, pp. 124-125 | ESC CCS 2024; ACSM 2025 | History/exam/risk, ECG as one component, referral boundaries |
| Comprehensive cardiovascular rehabilitation | PCVP 10.1, p. 126 | BACPR 2023; ACC/AHA ACS 2025 | Person-centred multicomponent pathway, continuity, audit |
| Chronic coronary syndrome rehabilitation | PCVP 3.1, PCVP 5.1, pp. 124-125 | ESC CCS 2024 | Symptoms/function, exercise and risk factors, patient involvement |
| Acute coronary syndrome recovery | PCVP 3.1, PCVP 10.1, pp. 124-126 | ACC/AHA ACS 2025; BACPR 2023 | Stability, rehabilitation referral, secondary prevention and escalation |
| Chronic heart-failure rehabilitation | PCVP 3.1, PCVP 5.1, pp. 124-125 | ESC Heart Failure 2021 | Stability, exercise benefit, supervision for higher-complexity patients |
| PAD structured walking | PCVP 3.1, PCVP 11.1, pp. 124-126 | ACC/AHA PAD 2024 | Walking function, structured exercise, foot/limb and risk management |
| Perioperative rehabilitation around CABG | PCVP 7.1, p. 125 | ERAS Cardiac 2019; BACPR 2023 | Preoperative engagement, early team recovery, rehabilitation transition |
| Exercise testing and risk stratification | PCVP 11.1, PCVP 12.1, p. 126 | ACSM GETP 12th ed. 2025; BACPR 2023 | Screening, test monitoring/termination, individualized FITT/supervision |
| Adult basic life support | PCVP 13.1, p. 126 | AHA Adult BLS 2025 | Recognition, emergency activation, high-quality CPR, prompt AED use |

PRP and PCVP coordinates were copied from the curriculum table. The pack itself stays small and
runtime-oriented; this document is the durable traceability record.

## Source currency and access register

| Source | Currency decision | Access and reuse boundary |
| --- | --- | --- |
| GOLD, Global Strategy for Diagnosis, Management, and Prevention of COPD, 2026 report v1.3, 8 Dec 2025 | Latest report found as of review; adds literature through July 2025 | Official page/PDF is free to read but copyrighted. Cite; do not redistribute or copy its prose, tables, or figures. |
| GINA, Global Strategy for Asthma Management and Prevention, 2026 update | Latest strategy report found; supersedes the initially discovered corrected 2025 report | Free personal download; copyrighted. Cite and independently phrase concepts. |
| Chalmers et al., ERS adult-bronchiectasis guideline, 2025, doi:10.1183/13993003.01126-2025 | Current 2025 guideline; replaces the 2017 ERS guideline for this scope | Link to DOI/official publication; no copied recommendation wording. |
| Lewis et al., SCCM PADIS focused update, 2025, doi:10.1097/CCM.0000000000006574 | Current 2025 focused update for ICU immobility/mobilization; uncertainty retained | Official SCCM summary is readable. No claim that it fixes an optimal exercise dose. |
| Rao et al., ACC/AHA multisociety ACS guideline, 2025 | Current ACS guideline and current rehabilitation-referral source | Official AHA page is linked; copyrighted guideline language is not copied. |
| Kleinman et al., AHA Adult BLS, 2025, doi:10.1161/CIR.0000000000001369 | Current adult BLS guideline | Official AHA page is linked. App content is not skills certification and omits detailed protocol numbers pending educator review. |
| Vrints et al., ESC chronic coronary syndromes guideline, 2024, doi:10.1093/eurheartj/ehae177 | Current ESC CCS guideline; 2025 correction noted by PubMed | Official ESC hub is linked. Concepts are independently phrased. |
| Gornik et al., ACC/AHA multisociety PAD guideline, 2024, doi:10.1161/CIR.0000000000001251 | Current lower-extremity PAD guideline | Official AHA hub is linked. |
| Rochester et al., ATS pulmonary-rehabilitation guideline, 2023, doi:10.1164/rccm.202306-1066ST | Current official ATS pulmonary-rehabilitation CPG | Full text is available through PMC; article licence governs source reuse. MediPrompt uses original wording. |
| Stanojevic et al., ERS/ATS routine-PFT interpretation standard, 2022, doi:10.1183/13993003.01499-2021 | Latest joint interpretation standard found | Link to DOI; do not reproduce tables/equations. |
| McDonagh et al., ESC heart-failure guideline, 2021, doi:10.1093/eurheartj/ehab368 | No newer comprehensive ESC HF replacement found for the scoped exercise claims | DOI link only; educator must check future updates before approval. |
| Graham et al., ATS/ERS spirometry standard, 2019, doi:10.1164/rccm.201908-1590ST | Still-current performance standard; paired with 2022 interpretation standard | Full text on PMC; independently phrased quality concepts. |
| Engelman et al., ERAS Cardiac recommendations, 2019, doi:10.1001/jamasurg.2019.1153 | Foundational cardiac-surgery ERAS recommendations; not presented as a 2025 update | DOI link; only high-level perioperative pathway concepts used. |
| O'Driscoll et al., BTS oxygen guideline, 2017, doi:10.1136/bmjresp-2016-000170 | Latest comprehensive BTS adult emergency/healthcare oxygen guideline found | Open-access PMC article; exact targets deliberately left for educator review/local protocols. |
| Girard et al., ATS/ACCP ventilator-liberation guideline, 2017 | Latest applicable joint guideline found for the scoped liberation-process claims | Official ATS implementation page linked; no device-setting advice. |
| Holland et al., ERS/ATS field-walking-test standard, 2014, doi:10.1183/09031936.00150314 | Older but still the governing joint technical standard found for 6MWT procedure | PubMed record linked; no protocol text reproduced. |
| ATS, Interpretation of Arterial Blood Gases | Official clinical-education resource; page has no visible publication date | Used only for the interpretation sequence. Educator must verify local reference ranges and teaching method. |
| BACPR, Standards and Core Components, 4th ed., 2023 | Current BACPR standard found | Official publication page linked; no diagrams or standard text copied. |
| ACSM, Guidelines for Exercise Testing and Prescription, 12th ed., 24 Mar 2025, ISBN 9781975219215 | Current 2025 edition; aligns with curriculum exercise-testing scope | Commercial book. Only bibliographic and high-level concepts are cited; no paywalled prose is included. |
| DMIHER/RNPC MPT curriculum, 2022-2027 | Governing supplied curriculum for topic selection | Local PDF is not redistributed. Institution landing page is linked; local hash and page coordinates preserve provenance. |

Search results, vendor blogs, news summaries, Guideline Central, and Physio-Pedia were used only to
locate or corroborate primary sources. They are not used as ground truth in the runtime candidate.

## Authoring and safety controls

- Prompts, rubric labels, accepted phrases, and cases are original derivative wording.
- Expected concepts are deliberately broad; no dose, drug, diagnostic threshold, ventilator
  setting, oxygen target, or patient-specific treatment instruction was invented.
- Fictional cases contain no real patient identifiers and say “fictional” in the case text.
- Accepted phrases are retrieval cues, not exhaustive model answers.
- Source coverage can later support a “mentioned/not yet mentioned” signal; it cannot certify that
  a spoken answer is medically correct.
- The generator emits review.status DRAFT, an empty reviewer list, and reviewedAt null.
- Candidate validation first checks generator/artifact drift, then requires 20 topics, three
  challenge trios, valid references, and guaranteed failure of the production gate.
- Build validation forbids the candidate identifier in production output. Only content/packs/ is
  copied to the PWA.

## Required educator review

The medical reviewer must review the generated JSON and this evidence matrix, not just the source
list.

1. Confirm professional qualification and freedom from an undisclosed conflict for this review.
2. Verify every curriculum code and page coordinate against the supplied PDF.
3. Review every prompt, concept, accepted phrase, fictional case, follow-up, and answer arc.
4. Check that source scope supports the exact concept and that no cited guidance is superseded.
5. Check Indian teaching context, local practice boundaries, exam depth, terminology, and English
   clarity.
6. Add or remove acceptable phrases; do not approve keyword matches that could reward a medically
   unsafe statement.
7. Confirm that BLS material is educational recall only and directs learners to certified,
   hands-on training.
8. Confirm the content/reuse decision for all original wording and citations.
9. Record findings in the PR; approve only after all required corrections are merged.

### Attestation template

    Pack ID and version:
    Candidate commit SHA:
    Reviewer full name:
    Professional qualification:
    Registration/licence identifier and jurisdiction (or institutional role):
    Relevant teaching/clinical specialty:
    Conflicts of interest:
    Review date:
    Sources checked through:
    Curriculum mappings accepted/corrected:
    Prompts/rubrics/cases accepted/corrected:
    Scope and safety limitations accepted:
    Content licence decision:
    Disposition: APPROVE / CHANGES REQUIRED / REJECT
    Signature or verifiable GitHub review:

The reviewer identity stored in the pack should be a stable public identifier that can be traced to
the attestation. reviewedAt must be the actual completion date. Do not use an organization,
guideline author, AI system, repository owner, or placeholder as MEDICAL_REVIEWER.

## Promotion procedure after genuine approval

1. Apply every reviewer correction in the generator and regenerate the candidate.
2. Record the completed attestation in the promotion PR.
3. Change the reviewed artifact to APPROVED, add the identified MEDICAL_REVIEWER, and set the
   actual review date.
4. Replace the one published JSON under content/packs/; do not copy the draft directory.
5. Generate a reviewed medical fallback or explicitly retain and label the non-medical emergency
   fallback; the UI must never imply that fallback prompts are medical.
6. Update the required production artifact name and tests.
7. Run content, unit, accessibility, build, offline/E2E, dependency, secret, and link gates.
8. Merge only after the medical reviewer approves the exact final diff and CI commit.

Until those steps are complete, “source-grounded” must never be displayed as “medically approved.”
