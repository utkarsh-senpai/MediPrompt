// Generates the source-grounded MPT cardiorespiratory educator-review candidate.
// The artifact is deliberately DRAFT. It powers the explicitly labelled
// public practice beta and cannot pass the medically approved release gate.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ACCESSED_AT = "2026-08-30";

interface ConceptSeed {
  label: string;
  acceptedPhrases: string[];
  sourceRefs: string[];
}

type VivaLevel = "RECALL" | "EXPLAIN" | "APPLY" | "DIFFERENTIATE" | "DEFEND";

interface VivaQuestionSeed {
  level: VivaLevel;
  prompt: string;
  /** Concept IDs (resolved against a rubric of this topic) the question targets. */
  targetConceptIds: string[];
}

interface TopicSeed {
  topicId: string;
  title: string;
  prompt: string;
  concepts: ConceptSeed[];
  trio?: {
    caseText: string;
    appliedPrompt: string;
    appliedConcepts: ConceptSeed[];
    vivaPrompt: string;
    vivaConcepts: ConceptSeed[];
    probe: string;
    evidenceUpdate: string;
  };
  /** v0.6 defense-ladder questions. targetConceptIds use the runtime concept-id
   * convention `${topicId}-${kind}-c${n}` so they resolve at generation time. */
  viva?: VivaQuestionSeed[];
}

interface SubjectSeed {
  subjectId: string;
  title: string;
  topics: TopicSeed[];
}

const c = (
  label: string,
  acceptedPhrases: string[],
  sourceRefs: string[],
): ConceptSeed => ({ label, acceptedPhrases, sourceRefs });

const sources = [
  {
    sourceId: "src-curriculum",
    citation:
      "DMIHER, Competency-Based Post Graduate Curriculum for Indian Physiotherapy PG, Cardiovascular & Respiratory Physiotherapy, 2022-2027, PDF pp. 119-127.",
    url: "https://dmiher.edu.in/lp/Educlass",
    accessedAt: ACCESSED_AT,
  },
  {
    sourceId: "src-gold-2026",
    citation:
      "Global Initiative for Chronic Obstructive Lung Disease. Global Strategy for Diagnosis, Management, and Prevention of COPD: 2026 Report, v1.3, 8 Dec 2025.",
    url: "https://goldcopd.org/2026-gold-report-and-pocket-guide",
    accessedAt: ACCESSED_AT,
  },
  {
    sourceId: "src-gina-2026",
    citation:
      "Global Initiative for Asthma. Global Strategy for Asthma Management and Prevention, 2026 update.",
    url: "https://ginasthma.org/2026-gina-strategy-report",
    accessedAt: ACCESSED_AT,
  },
  {
    sourceId: "src-ers-bronchiectasis-2025",
    citation:
      "Chalmers JD et al. ERS clinical practice guideline for management of adult bronchiectasis. Eur Respir J. 2025;66:2501126. doi:10.1183/13993003.01126-2025.",
    url: "https://doi.org/10.1183/13993003.01126-2025",
    accessedAt: ACCESSED_AT,
  },
  {
    sourceId: "src-ers-ats-pft-2022",
    citation:
      "Stanojevic S et al. ERS/ATS technical standard on interpretive strategies for routine lung function tests. Eur Respir J. 2022;60:2101499.",
    url: "https://doi.org/10.1183/13993003.01499-2021",
    accessedAt: ACCESSED_AT,
  },
  {
    sourceId: "src-ats-spirometry-2019",
    citation:
      "Graham BL et al. Standardization of Spirometry 2019 Update: official ATS/ERS technical statement. AJRCCM. 2019;200:e70-e88. doi:10.1164/rccm.201908-1590ST.",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6794117",
    accessedAt: ACCESSED_AT,
  },
  {
    sourceId: "src-ats-abg",
    citation:
      "American Thoracic Society. Interpretation of Arterial Blood Gases: six-step clinical education resource.",
    url: "https://www.thoracic.org/professionals/clinical-resources/critical-care/clinical-education/abgs.php",
    accessedAt: ACCESSED_AT,
  },
  {
    sourceId: "src-ats-pulmonary-rehab-2023",
    citation:
      "Rochester CL et al. Pulmonary Rehabilitation for Adults with Chronic Respiratory Disease: official ATS guideline. AJRCCM. 2023;208:e7-e26. doi:10.1164/rccm.202306-1066ST.",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC10449064",
    accessedAt: ACCESSED_AT,
  },
  {
    sourceId: "src-ers-ats-walk-2014",
    citation:
      "Holland AE et al. Official ERS/ATS technical standard: field walking tests in chronic respiratory disease. Eur Respir J. 2014;44:1428-1446. doi:10.1183/09031936.00150314.",
    url: "https://pubmed.ncbi.nlm.nih.gov/25359355",
    accessedAt: ACCESSED_AT,
  },
  {
    sourceId: "src-bts-oxygen-2017",
    citation:
      "O'Driscoll BR et al. BTS guideline for oxygen use in adults in healthcare and emergency settings. BMJ Open Respir Res. 2017;4:e000170. doi:10.1136/bmjresp-2016-000170.",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC5531304",
    accessedAt: ACCESSED_AT,
  },
  {
    sourceId: "src-sccm-padis-2025",
    citation:
      "Lewis K et al. Focused update to PADIS guidelines for adults in ICU. Crit Care Med. 2025;53:e711-e727. doi:10.1097/CCM.0000000000006574.",
    url: "https://www.sccm.org/clinical-resources/guidelines/guidelines/focused-update-padis-guideline",
    accessedAt: ACCESSED_AT,
  },
  {
    sourceId: "src-ats-accp-weaning-2017",
    citation:
      "Girard TD et al. Liberation from Mechanical Ventilation in Critically Ill Adults: official ATS/ACCP guideline. AJRCCM. 2017;195:120-133.",
    url: "https://www.thoracic.org/statements/guideline-implementation-tools/liberation-from-mechanical-ventilation-in-critically-ill-adults.php",
    accessedAt: ACCESSED_AT,
  },
  {
    sourceId: "src-bacpr-2023",
    citation:
      "British Association for Cardiovascular Prevention and Rehabilitation. Standards and Core Components, 4th ed., 2023.",
    url: "https://www.bacpr.org/resources/publications",
    accessedAt: ACCESSED_AT,
  },
  {
    sourceId: "src-esc-ccs-2024",
    citation:
      "Vrints C et al. 2024 ESC Guidelines for management of chronic coronary syndromes. Eur Heart J. 2024;45:3415-3537. doi:10.1093/eurheartj/ehae177.",
    url: "https://www.escardio.org/guidelines/clinical-practice-guidelines/all-esc-practice-guidelines/chronic-coronary-syndromes",
    accessedAt: ACCESSED_AT,
  },
  {
    sourceId: "src-aha-acs-2025",
    citation:
      "Rao SV et al. 2025 ACC/AHA/ACEP/NAEMSP/SCAI Guideline for Management of Patients With Acute Coronary Syndromes. Circulation. 2025. doi:10.1161/CIR.0000000000001309.",
    url: "https://professional.heart.org/en/guidelines-statements/2025-accahaacepnaemspscai-guideline-for-the-management-of-patients-with-acutecir0000000000001309",
    accessedAt: ACCESSED_AT,
  },
  {
    sourceId: "src-esc-heart-failure-2021",
    citation:
      "McDonagh TA et al. 2021 ESC Guidelines for diagnosis and treatment of acute and chronic heart failure. Eur Heart J. 2021;42:3599-3726. doi:10.1093/eurheartj/ehab368.",
    url: "https://doi.org/10.1093/eurheartj/ehab368",
    accessedAt: ACCESSED_AT,
  },
  {
    sourceId: "src-aha-pad-2024",
    citation:
      "Gornik HL et al. 2024 ACC/AHA multisociety guideline for management of lower-extremity peripheral artery disease. Circulation. 2024. doi:10.1161/CIR.0000000000001251.",
    url: "https://professional.heart.org/en/science-news/2024-guideline-for-the-management-of-lower-extremity-peripheral-artery-disease",
    accessedAt: ACCESSED_AT,
  },
  {
    sourceId: "src-eras-cardiac-2019",
    citation:
      "Engelman DT et al. Guidelines for perioperative care in cardiac surgery: ERAS Society recommendations. JAMA Surg. 2019;154:755-766. doi:10.1001/jamasurg.2019.1153.",
    url: "https://doi.org/10.1001/jamasurg.2019.1153",
    accessedAt: ACCESSED_AT,
  },
  {
    sourceId: "src-acsm-getp-2025",
    citation:
      "American College of Sports Medicine. ACSM's Guidelines for Exercise Testing and Prescription, 12th ed., published 24 Mar 2025. ISBN 9781975219215.",
    url: "https://acsm.org/education-resources/books/guidelines-exercise-testing-prescription",
    accessedAt: ACCESSED_AT,
  },
  {
    sourceId: "src-aha-bls-2025",
    citation:
      "Kleinman ME et al. Part 7: Adult Basic Life Support, 2025 AHA CPR and ECC Guidelines. Circulation. 2025;152(suppl 2):S448-S478. doi:10.1161/CIR.0000000000001369.",
    url: "https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines/adult-basic-life-support",
    accessedAt: ACCESSED_AT,
  },
];

const respiratoryTopics: TopicSeed[] = [
  {
    topicId: "respiratory-assessment",
    title: "Structured respiratory physiotherapy assessment",
    prompt:
      "Explain a structured respiratory physiotherapy assessment, from history and observation through functional impact, safety checks, and problem formulation.",
    concepts: [
      c("Connect symptoms and exacerbation history to activity and participation limits", ["symptoms and function", "exacerbation history", "activity limitation"], ["src-gold-2026", "src-gina-2026"]),
      c("Include respiratory observations, vital signs, oxygen saturation, and relevant examination findings", ["vital signs", "oxygen saturation", "respiratory examination"], ["src-gold-2026"]),
      c("Integrate findings rather than using one test result as a stand-alone diagnosis", ["integrate findings", "clinical context", "not one test alone"], ["src-ers-ats-pft-2022"]),
    ],
  },
  {
    topicId: "spirometry-pft-interpretation",
    title: "Spirometry and pulmonary-function-test interpretation",
    prompt:
      "Describe how to judge spirometry quality and interpret a pulmonary-function report without separating the numbers from the clinical question.",
    concepts: [
      c("Check test quality, acceptability, repeatability, and relevant technical comments before interpretation", ["acceptability and repeatability", "quality check", "technical comments"], ["src-ats-spirometry-2019"]),
      c("Compare measured values with appropriate reference values and limits of normal", ["reference values", "lower limit of normal", "limits of normal"], ["src-ers-ats-pft-2022"]),
      c("Describe the physiological pattern, then integrate it with symptoms and other investigations", ["physiological pattern", "clinical correlation", "integrate investigations"], ["src-ers-ats-pft-2022"]),
    ],
  },
  {
    topicId: "arterial-blood-gas-interpretation",
    title: "Arterial blood gas interpretation",
    prompt:
      "Walk through a safe, systematic interpretation of an arterial blood gas and explain how it informs—without replacing—the wider clinical assessment.",
    concepts: [
      c("Check internal consistency and identify acidemia or alkalemia", ["internal consistency", "acidemia or alkalemia", "check validity"], ["src-ats-abg"]),
      c("Identify the primary respiratory or metabolic process and assess expected compensation", ["primary process", "respiratory or metabolic", "expected compensation"], ["src-ats-abg"]),
      c("Assess oxygenation and ventilation in the context of oxygen delivery and the patient", ["oxygenation and ventilation", "oxygen delivery", "clinical context"], ["src-ats-abg", "src-bts-oxygen-2017"]),
    ],
  },
  {
    topicId: "copd-assessment-planning",
    title: "COPD assessment and rehabilitation planning",
    prompt:
      "Explain how COPD is confirmed and how symptoms, exacerbations, function, comorbidity, and patient goals shape a physiotherapy rehabilitation plan.",
    concepts: [
      c("Confirm persistent airflow obstruction with appropriate post-bronchodilator spirometry", ["post-bronchodilator spirometry", "persistent airflow obstruction", "confirm obstruction"], ["src-gold-2026"]),
      c("Assess symptoms, exacerbation history, functional limitation, and relevant comorbidity", ["symptom burden", "exacerbation history", "functional limitation"], ["src-gold-2026"]),
      c("Use individualized non-pharmacological management, including physical activity and pulmonary rehabilitation when indicated", ["pulmonary rehabilitation", "physical activity", "individualized management"], ["src-gold-2026", "src-ats-pulmonary-rehab-2023"]),
    ],
    trio: {
      caseText:
        "A fictional 66-year-old has stable COPD confirmed by post-bronchodilator spirometry, breathlessness on ordinary walking, two treated exacerbations in the past year, reduced activity, and no current red-flag symptoms.",
      appliedPrompt:
        "Using the fictional case, prioritize the assessment domains, explain whether pulmonary rehabilitation should be considered, and outline a monitored, person-centred plan within physiotherapy scope.",
      appliedConcepts: [
        c("Prioritize symptom, exacerbation, exercise-capacity, comorbidity, and goal assessment", ["exercise capacity", "exacerbation risk", "patient goals"], ["src-gold-2026", "src-ats-pulmonary-rehab-2023"]),
        c("Justify referral to a comprehensive pulmonary rehabilitation programme", ["refer to pulmonary rehabilitation", "comprehensive programme", "pulmonary rehab referral"], ["src-gold-2026", "src-ats-pulmonary-rehab-2023"]),
        c("Define monitoring, reassessment, and escalation boundaries", ["monitor and reassess", "safety monitoring", "escalation"], ["src-gold-2026"]),
      ],
      vivaPrompt:
        "Defend your plan for the fictional COPD case, separate what the evidence supports from what remains patient-specific, and state the findings that would pause exercise and trigger clinical escalation.",
      vivaConcepts: [
        c("Defend pulmonary rehabilitation using expected benefits and patient goals", ["exercise capacity and quality of life", "patient goals", "rehabilitation benefit"], ["src-gold-2026", "src-ats-pulmonary-rehab-2023"]),
        c("Acknowledge individual response, comorbidity, and implementation uncertainty", ["individual response", "comorbidity", "uncertainty"], ["src-ats-pulmonary-rehab-2023"]),
        c("State that new instability or red flags require pausing and appropriate escalation", ["pause exercise", "clinical escalation", "red flags"], ["src-gold-2026"]),
      ],
      probe: "Which additional measurement would most change the rehabilitation prescription, and why?",
      evidenceUpdate:
        "The person develops new chest pressure during the baseline walk. Explain how this changes your immediate priorities and why exercise progression must stop pending appropriate assessment.",
    },
    viva: [
      {
        level: "RECALL",
        prompt:
          "Recall how COPD is confirmed before rehabilitation planning begins.",
        targetConceptIds: ["copd-assessment-planning-guided-recall-c1"],
      },
      {
        level: "APPLY",
        prompt:
          "Apply the assessment domains that shape a person-centred rehabilitation plan for someone with two exacerbations this year and reduced activity.",
        targetConceptIds: ["copd-assessment-planning-guided-recall-c2"],
      },
      {
        level: "DEFEND",
        prompt:
          "Defend your recommendation for pulmonary rehabilitation and individualized non-pharmacological management, including what would pause exercise.",
        targetConceptIds: ["copd-assessment-planning-guided-recall-c3"],
      },
    ],
  },
  {
    topicId: "pulmonary-rehabilitation",
    title: "Comprehensive pulmonary rehabilitation",
    prompt:
      "Define comprehensive pulmonary rehabilitation and explain its assessment, exercise, education, self-management, and outcome-review components.",
    concepts: [
      c("Begin with a thorough, person-centred assessment and agreed goals", ["thorough assessment", "person-centred goals", "individual assessment"], ["src-ats-pulmonary-rehab-2023", "src-gold-2026"]),
      c("Combine individualized exercise training with education and behaviour-change support", ["exercise training and education", "behaviour change", "self-management"], ["src-ats-pulmonary-rehab-2023", "src-gold-2026"]),
      c("Reassess outcomes that matter to the learner, including symptoms, function, and participation", ["outcome reassessment", "symptoms and function", "participation"], ["src-ats-pulmonary-rehab-2023"]),
    ],
    trio: {
      caseText:
        "A fictional 59-year-old with stable chronic respiratory disease is limited by breathlessness and inactivity, wants to resume shopping independently, and cannot travel to the hospital twice each week.",
      appliedPrompt:
        "Use the fictional case to design the components—not disease-specific doses—of an accessible pulmonary rehabilitation pathway and explain how progress would be reviewed.",
      appliedConcepts: [
        c("Translate the person's shopping goal into measurable functional outcomes", ["functional goal", "measurable outcome", "shopping goal"], ["src-ats-pulmonary-rehab-2023"]),
        c("Include individualized exercise, education, and supported self-management", ["individualized exercise", "education", "self-management"], ["src-ats-pulmonary-rehab-2023"]),
        c("Consider an evidence-based centre, home, or telerehabilitation delivery model after safety assessment", ["telerehabilitation", "home-based rehabilitation", "delivery model"], ["src-ats-pulmonary-rehab-2023"]),
      ],
      vivaPrompt:
        "Defend a delivery model for the fictional case, explain what cannot be inferred without baseline testing, and describe how you would respond if access and clinical-supervision needs conflict.",
      vivaConcepts: [
        c("Balance access, preference, safety, and available supervision", ["access and safety", "patient preference", "supervision"], ["src-ats-pulmonary-rehab-2023"]),
        c("Avoid prescribing intensity without individualized baseline assessment", ["baseline assessment", "do not infer intensity", "individualized prescription"], ["src-ats-pulmonary-rehab-2023", "src-acsm-getp-2025"]),
        c("Use shared decision making and reassessment to revise delivery", ["shared decision making", "reassess", "revise the plan"], ["src-ats-pulmonary-rehab-2023"]),
      ],
      probe: "What baseline information is essential before choosing exercise mode and supervision?",
      evidenceUpdate:
        "Reliable transport becomes available once weekly but not twice weekly. Compare a hybrid pathway with fully centre-based and fully remote options.",
    },
    viva: [
      {
        level: "RECALL",
        prompt:
          "Recall where comprehensive pulmonary rehabilitation begins and why individual assessment matters.",
        targetConceptIds: ["pulmonary-rehabilitation-guided-recall-c1"],
      },
      {
        level: "APPLY",
        prompt:
          "Apply the components of an accessible pulmonary rehabilitation pathway for someone who cannot travel twice weekly.",
        targetConceptIds: ["pulmonary-rehabilitation-guided-recall-c2"],
      },
      {
        level: "DEFEND",
        prompt:
          "Defend how you would review outcomes that matter to the person, and what reassessment would trigger a change in delivery.",
        targetConceptIds: ["pulmonary-rehabilitation-guided-recall-c3"],
      },
    ],
  },
  {
    topicId: "asthma-assessment-self-management",
    title: "Asthma assessment and supported self-management",
    prompt:
      "Explain how current asthma assessment connects symptom control, future risk, lung-function evidence, inhaler skills, and supported self-management.",
    concepts: [
      c("Assess recent symptom control separately from risk of future adverse outcomes", ["symptom control and future risk", "future risk", "recent symptoms"], ["src-gina-2026"]),
      c("Use objective evidence of variable expiratory airflow limitation where appropriate", ["variable expiratory airflow limitation", "objective lung function", "spirometry"], ["src-gina-2026"]),
      c("Include inhaler-skill review, adherence discussion, action-plan education, and regular review", ["inhaler technique", "written action plan", "regular review"], ["src-gina-2026"]),
    ],
  },
  {
    topicId: "bronchiectasis-airway-clearance",
    title: "Airway-clearance planning in adult bronchiectasis",
    prompt:
      "Explain the physiotherapist's reasoning when assessing, teaching, individualizing, and reviewing airway-clearance techniques for an adult with bronchiectasis.",
    concepts: [
      c("Assess symptoms, sputum, exacerbations, function, preference, and contraindications", ["sputum and exacerbations", "patient preference", "contraindications"], ["src-ers-bronchiectasis-2025"]),
      c("Teach an individualized airway-clearance technique rather than a universal routine", ["individualized airway clearance", "airway-clearance technique", "tailored technique"], ["src-ers-bronchiectasis-2025"]),
      c("Review technique and response, and integrate physical activity or pulmonary rehabilitation where appropriate", ["review technique", "physical activity", "pulmonary rehabilitation"], ["src-ers-bronchiectasis-2025", "src-ats-pulmonary-rehab-2023"]),
    ],
  },
  {
    topicId: "oxygen-therapy-principles",
    title: "Safe oxygen-therapy principles",
    prompt:
      "Explain why oxygen is prescribed to a target range, how response is monitored, and why delivery must be adjusted to the clinical context rather than treated as a fixed routine.",
    concepts: [
      c("Treat hypoxaemia with a prescribed target saturation rather than treating breathlessness alone", ["target saturation", "treat hypoxaemia", "prescribed target"], ["src-bts-oxygen-2017"]),
      c("Select delivery and monitoring according to clinical context and risk of hypercapnic respiratory failure", ["hypercapnic respiratory failure risk", "oxygen delivery", "monitoring"], ["src-bts-oxygen-2017"]),
      c("Reassess saturation and blood gases when indicated, and escalate deterioration", ["reassess blood gases", "monitor saturation", "escalate deterioration"], ["src-bts-oxygen-2017", "src-ats-abg"]),
    ],
  },
  {
    topicId: "icu-mobilization-safety",
    title: "ICU rehabilitation and mobilization safety",
    prompt:
      "Explain how an interprofessional ICU team decides whether and how to mobilize a critically ill adult while accounting for stability, goals, dose uncertainty, and response.",
    concepts: [
      c("Base initiation and progression on cardiovascular, respiratory, and neurological stability", ["cardiovascular respiratory neurological stability", "physiological stability", "safety screen"], ["src-sccm-padis-2025"]),
      c("Use team-based, individualized mobilization or rehabilitation beyond passive usual care when appropriate", ["enhanced mobilization", "team-based rehabilitation", "individualized mobilization"], ["src-sccm-padis-2025"]),
      c("State that optimal frequency, intensity, duration, and delivery remain uncertain", ["dose remains uncertain", "frequency intensity duration", "evidence uncertainty"], ["src-sccm-padis-2025"]),
    ],
  },
  {
    topicId: "ventilator-liberation",
    title: "Physiotherapy within ventilator liberation",
    prompt:
      "Explain how readiness screening, spontaneous-breathing assessment, sedation strategy, rehabilitation, and team communication fit into ventilator liberation.",
    concepts: [
      c("Use protocolized readiness assessment and spontaneous-breathing trials where appropriate", ["readiness assessment", "spontaneous breathing trial", "liberation protocol"], ["src-ats-accp-weaning-2017"]),
      c("Coordinate sedation minimization and rehabilitation with the wider ICU team", ["sedation minimization", "rehabilitation protocol", "interprofessional team"], ["src-ats-accp-weaning-2017", "src-sccm-padis-2025"]),
      c("Separate physiotherapy contribution from medical decisions about extubation and ventilator settings", ["scope of practice", "team decision", "extubation decision"], ["src-ats-accp-weaning-2017"]),
    ],
  },
  {
    topicId: "six-minute-walk-test",
    title: "Six-minute walk test",
    prompt:
      "Describe how to prepare, standardize, monitor, document, and interpret a six-minute walk test in chronic respiratory disease.",
    concepts: [
      c("Use a standardized course, instructions, encouragement, and equipment", ["standardized course", "standard instructions", "standard encouragement"], ["src-ers-ats-walk-2014"]),
      c("Record baseline and end-test symptoms and physiological observations, including adverse events", ["baseline and end-test", "symptom monitoring", "physiological observations"], ["src-ers-ats-walk-2014"]),
      c("Interpret distance and change in context, including learning effect and the clinical question", ["learning effect", "interpret change", "clinical context"], ["src-ers-ats-walk-2014"]),
    ],
  },
];

const cardiovascularTopics: TopicSeed[] = [
  {
    topicId: "cardiovascular-assessment-ecg",
    title: "Cardiovascular assessment and ECG relevance",
    prompt:
      "Explain how history, examination, risk factors, resting ECG, symptoms, and functional testing contribute to cardiovascular physiotherapy assessment and referral decisions.",
    concepts: [
      c("Start with symptoms, history, examination, comorbidity, and cardiovascular risk factors", ["history and examination", "risk factors", "comorbidity"], ["src-esc-ccs-2024"]),
      c("Use a resting 12-lead ECG as one part of basic assessment, not as an isolated clearance test", ["12-lead ECG", "part of basic assessment", "not isolated"], ["src-esc-ccs-2024"]),
      c("Recognize instability or red flags and refer rather than independently diagnosing cardiac disease", ["red flags", "refer", "within scope"], ["src-esc-ccs-2024", "src-acsm-getp-2025"]),
    ],
    viva: [
      {
        level: "RECALL",
        prompt:
          "Recall where a cardiovascular physiotherapy assessment starts and why history and risk factors matter.",
        targetConceptIds: ["cardiovascular-assessment-ecg-guided-recall-c1"],
      },
      {
        level: "EXPLAIN",
        prompt:
          "Explain the role of a resting 12-lead ECG and why it is not an isolated clearance test.",
        targetConceptIds: ["cardiovascular-assessment-ecg-guided-recall-c2"],
      },
      {
        level: "DEFEND",
        prompt:
          "Defend your response to instability or red flags, including why you refer rather than diagnose independently.",
        targetConceptIds: ["cardiovascular-assessment-ecg-guided-recall-c3"],
      },
    ],
  },
  {
    topicId: "cardiac-rehabilitation",
    title: "Comprehensive cardiovascular rehabilitation",
    prompt:
      "Define contemporary cardiovascular rehabilitation and explain its person-centred assessment, medical-risk, exercise, education, psychosocial, lifestyle, and outcome components.",
    concepts: [
      c("Start early with person-centred assessment, goal setting, and individualized planning", ["person-centred assessment", "goal setting", "individualized plan"], ["src-bacpr-2023"]),
      c("Coordinate medical-risk management, exercise, education, lifestyle, and psychosocial support", ["core components", "exercise and education", "psychosocial support"], ["src-bacpr-2023"]),
      c("Provide transition, long-term support, and outcome audit across the pathway", ["long-term support", "outcome audit", "continuity"], ["src-bacpr-2023"]),
    ],
    trio: {
      caseText:
        "A fictional 57-year-old is medically stable after an uncomplicated acute coronary syndrome, has been referred at discharge, is anxious about activity, and wants to return to desk work and caring responsibilities.",
      appliedPrompt:
        "Use the fictional case to outline a person-centred cardiovascular rehabilitation pathway, including initial assessment, activity progression principles, education, psychosocial needs, and review.",
      appliedConcepts: [
        c("Complete individualized assessment and shared goal setting before exercise prescription", ["individualized assessment", "shared goals", "before exercise prescription"], ["src-bacpr-2023", "src-acsm-getp-2025"]),
        c("Integrate exercise with risk-factor, medication, education, and psychosocial components", ["multicomponent rehabilitation", "risk-factor management", "psychosocial"], ["src-bacpr-2023", "src-aha-acs-2025"]),
        c("Plan continuity through outpatient or suitable home-based rehabilitation and reassessment", ["outpatient cardiac rehabilitation", "home-based rehabilitation", "reassessment"], ["src-aha-acs-2025", "src-bacpr-2023"]),
      ],
      vivaPrompt:
        "Defend your rehabilitation priorities for the fictional case, distinguish supervised rehabilitation from unsupervised exercise advice, and explain the safety information still needed.",
      vivaConcepts: [
        c("Prioritize safety assessment, goals, and coordinated secondary prevention", ["safety assessment", "secondary prevention", "patient goals"], ["src-bacpr-2023", "src-aha-acs-2025"]),
        c("Explain why exercise dose and supervision are individualized", ["individualized exercise", "supervision", "risk stratification"], ["src-acsm-getp-2025", "src-bacpr-2023"]),
        c("Use shared decision making while preserving escalation boundaries for recurrent symptoms", ["shared decision making", "recurrent symptoms", "escalation"], ["src-bacpr-2023", "src-aha-acs-2025"]),
      ],
      probe: "Which medical, functional, and psychosocial findings would change the initial supervision plan?",
      evidenceUpdate:
        "The person reports new pressure-like chest discomfort during light walking. Explain why progression stops and what escalation is required before rehabilitation continues.",
    },
    viva: [
      {
        level: "RECALL",
        prompt:
          "Recall the priorities that should come first when planning cardiovascular rehabilitation after an acute coronary syndrome.",
        targetConceptIds: ["cardiac-rehabilitation-viva-recall-c1"],
      },
      {
        level: "APPLY",
        prompt:
          "Apply those priorities to a person who is anxious about activity: how do you individualize exercise dose and supervision?",
        targetConceptIds: ["cardiac-rehabilitation-viva-recall-c2"],
      },
      {
        level: "DEFEND",
        prompt:
          "Defend your plan if the person reports recurrent symptoms during light walking. What escalation boundaries hold, and how do you preserve shared decision making?",
        targetConceptIds: ["cardiac-rehabilitation-viva-recall-c3"],
      },
    ],
  },
  {
    topicId: "chronic-coronary-syndrome-rehab",
    title: "Rehabilitation in chronic coronary syndromes",
    prompt:
      "Explain the physiotherapy contribution to long-term chronic-coronary-syndrome care through symptoms, function, exercise, education, risk-factor control, and shared decisions.",
    concepts: [
      c("Relate symptoms and functional limits to an individualized assessment", ["symptoms and function", "individualized assessment", "functional limitation"], ["src-esc-ccs-2024"]),
      c("Include lifestyle optimization, risk-factor control, patient education, and exercise therapy", ["exercise therapy", "lifestyle optimization", "risk-factor control"], ["src-esc-ccs-2024"]),
      c("Use patient involvement and reassessment when symptoms, risk, or preferences change", ["patient involvement", "reassessment", "preferences"], ["src-esc-ccs-2024"]),
    ],
  },
  {
    topicId: "acute-coronary-syndrome-recovery",
    title: "Rehabilitation after acute coronary syndrome",
    prompt:
      "Explain the transition from acute-coronary-syndrome care to safe, comprehensive secondary prevention and cardiovascular rehabilitation.",
    concepts: [
      c("Confirm medical stability and discharge information before rehabilitation progression", ["medical stability", "discharge information", "before progression"], ["src-aha-acs-2025"]),
      c("Arrange referral to outpatient cardiac rehabilitation or an appropriate home-based alternative", ["outpatient cardiac rehabilitation", "home-based alternative", "rehabilitation referral"], ["src-aha-acs-2025"]),
      c("Integrate monitored activity with education, adherence, risk-factor, and symptom-escalation support", ["monitored activity", "secondary prevention", "symptom escalation"], ["src-aha-acs-2025", "src-bacpr-2023"]),
    ],
  },
  {
    topicId: "heart-failure-rehabilitation",
    title: "Exercise rehabilitation in chronic heart failure",
    prompt:
      "Explain how stability, exercise capacity, symptoms, frailty, comorbidity, and goals shape exercise-based rehabilitation in chronic heart failure.",
    concepts: [
      c("Assess clinical stability, symptoms, exercise capacity, frailty, comorbidity, and goals", ["clinical stability", "exercise capacity", "frailty and comorbidity"], ["src-esc-heart-failure-2021"]),
      c("Use exercise to improve exercise capacity and quality of life in people who are able", ["improve exercise capacity", "quality of life", "exercise rehabilitation"], ["src-esc-heart-failure-2021"]),
      c("Consider supervised cardiac rehabilitation for more severe disease, frailty, or comorbidity", ["supervised cardiac rehabilitation", "severe disease", "frailty"], ["src-esc-heart-failure-2021"]),
    ],
  },
  {
    topicId: "peripheral-artery-disease-walking",
    title: "Structured walking exercise in peripheral artery disease",
    prompt:
      "Explain how structured exercise therapy fits into multidisciplinary management of chronic symptomatic lower-extremity peripheral artery disease.",
    concepts: [
      c("Assess walking impairment, limb and foot status, cardiovascular risk, and patient goals", ["walking impairment", "foot status", "patient goals"], ["src-aha-pad-2024"]),
      c("Use supervised exercise therapy or a structured community-based programme with behavioural support", ["supervised exercise therapy", "structured community programme", "behavioural support"], ["src-aha-pad-2024"]),
      c("Coordinate exercise with foot care, risk-factor management, and escalation for limb-threatening features", ["foot care", "risk-factor management", "limb-threatening"], ["src-aha-pad-2024"]),
    ],
  },
  {
    topicId: "cabg-perioperative-rehabilitation",
    title: "Perioperative rehabilitation around CABG",
    prompt:
      "Explain the physiotherapy pathway around coronary artery bypass grafting from preoperative function and education through early recovery and transition to cardiovascular rehabilitation.",
    concepts: [
      c("Assess and optimize modifiable functional risks and engage the person before surgery", ["preoperative assessment", "prehabilitation", "patient engagement"], ["src-eras-cardiac-2019"]),
      c("Coordinate early postoperative recovery within physiological, surgical, and team-defined safety limits", ["early recovery", "multidisciplinary care", "safety limits"], ["src-eras-cardiac-2019"]),
      c("Plan discharge education and transition into comprehensive cardiovascular rehabilitation", ["discharge education", "cardiovascular rehabilitation", "continuity"], ["src-bacpr-2023", "src-eras-cardiac-2019"]),
    ],
  },
  {
    topicId: "exercise-testing-risk-stratification",
    title: "Exercise testing and cardiovascular risk stratification",
    prompt:
      "Explain how the clinical question, pre-test screening, test selection, monitoring, termination criteria, and findings inform an individualized exercise prescription.",
    concepts: [
      c("Define the clinical question and complete preparticipation screening before selecting a test", ["clinical question", "preparticipation screening", "test selection"], ["src-acsm-getp-2025"]),
      c("Monitor symptoms and physiological responses and apply appropriate termination criteria", ["physiological monitoring", "symptom monitoring", "termination criteria"], ["src-acsm-getp-2025"]),
      c("Use results with diagnosis, medication, goals, and setting to individualize FITT and supervision", ["FITT", "individualized prescription", "supervision"], ["src-acsm-getp-2025", "src-bacpr-2023"]),
    ],
  },
  {
    topicId: "adult-basic-life-support",
    title: "Adult basic life support",
    prompt:
      "Explain the adult basic-life-support sequence, emphasizing recognition, emergency activation, high-quality CPR, prompt AED use, teamwork, and the need for certified skills practice.",
    concepts: [
      c("Recognize possible cardiac arrest and activate the emergency-response system", ["recognize cardiac arrest", "activate emergency response", "call for help"], ["src-aha-bls-2025"]),
      c("Provide high-quality CPR with minimal avoidable interruption", ["high-quality CPR", "chest compressions", "minimize interruptions"], ["src-aha-bls-2025"]),
      c("Use an AED promptly and follow its prompts while continuing coordinated care", ["automated external defibrillator", "AED", "follow prompts"], ["src-aha-bls-2025"]),
    ],
  },
];

const subjects: SubjectSeed[] = [
  {
    subjectId: "respiratory-physiotherapy",
    title: "Respiratory Physiotherapy",
    topics: respiratoryTopics,
  },
  {
    subjectId: "cardiovascular-physiotherapy",
    title: "Cardiovascular Physiotherapy",
    topics: cardiovascularTopics,
  },
];

function variantId(topicId: string, kind: string): string {
  return topicId + "-" + kind + "-v1";
}

function rubric(
  topicId: string,
  kind: string,
  concepts: ConceptSeed[],
): object {
  const id = variantId(topicId, kind);
  return {
    rubricId: "rubric-" + id,
    variantId: id,
    register: "EXAMINER",
    concepts: concepts.map((concept, index) => ({
      conceptId: topicId + "-" + kind + "-c" + (index + 1),
      label: concept.label,
      acceptedPhrases: concept.acceptedPhrases,
      weight: 2,
      sourceRefs: concept.sourceRefs,
    })),
  };
}

function guidedVariant(topic: TopicSeed, mode: "RECALL_SPRINT" | "DEEP_RESEARCH"): object {
  const kind = mode === "RECALL_SPRINT" ? "guided-recall" : "guided-deep";
  const wording =
    mode === "RECALL_SPRINT"
      ? topic.prompt
      : "Use the cited evidence sources to prepare, then answer: " +
        topic.prompt +
        " State the source scope, one uncertainty, and what requires patient-specific clinical judgment.";
  return {
    variantId: variantId(topic.topicId, kind),
    challengePreset: "GUIDED",
    difficultyProfileVersion: "difficulty-profile/1.0",
    blueprint: mode === "RECALL_SPRINT" ? "explain-concept" : "defend-evidence",
    promptId: "prompt-" + variantId(topic.topicId, kind),
    mode,
    supportLevel: "FULL",
    wording,
    answerArc:
      mode === "RECALL_SPRINT"
        ? ["frame", "explain", "apply"]
        : ["source", "synthesize", "qualify"],
    timePolicy:
      mode === "RECALL_SPRINT"
        ? { preparationSeconds: 30, speakingSeconds: 120 }
        : { researchSeconds: 240, speakingSeconds: 180 },
    caseRef: null,
    followUpRefs: [],
    rubricId: "rubric-" + variantId(topic.topicId, kind),
  };
}

function buildTopic(topic: TopicSeed): object {
  const variants: object[] = [
    guidedVariant(topic, "RECALL_SPRINT"),
    guidedVariant(topic, "DEEP_RESEARCH"),
  ];
  const rubrics: object[] = [
    rubric(topic.topicId, "guided-recall", topic.concepts),
    rubric(topic.topicId, "guided-deep", topic.concepts),
  ];
  const cases: object[] = [];
  const followUps: object[] = [];

  if (topic.trio) {
    const caseId = topic.topicId + "-case-v1";
    const probeId = topic.topicId + "-probe-v1";
    const updateId = topic.topicId + "-evidence-v1";
    const appliedKind = "applied-recall";
    const vivaKind = "viva-recall";

    variants.push({
      variantId: variantId(topic.topicId, appliedKind),
      challengePreset: "APPLIED",
      difficultyProfileVersion: "difficulty-profile/1.0",
      blueprint: "manage-case",
      promptId: "prompt-" + variantId(topic.topicId, appliedKind),
      mode: "RECALL_SPRINT",
      supportLevel: "FULL",
      wording: topic.trio.appliedPrompt,
      answerArc: ["summarize", "prioritize", "plan"],
      timePolicy: { preparationSeconds: 60, speakingSeconds: 180 },
      caseRef: caseId,
      followUpRefs: [probeId],
      rubricId: "rubric-" + variantId(topic.topicId, appliedKind),
    });
    variants.push({
      variantId: variantId(topic.topicId, vivaKind),
      challengePreset: "VIVA",
      difficultyProfileVersion: "difficulty-profile/1.0",
      blueprint: "defend-evidence",
      promptId: "prompt-" + variantId(topic.topicId, vivaKind),
      mode: "RECALL_SPRINT",
      supportLevel: "FULL",
      wording: topic.trio.vivaPrompt,
      answerArc: ["prioritize", "defend", "safety-net"],
      timePolicy: { preparationSeconds: 45, speakingSeconds: 210 },
      caseRef: caseId,
      followUpRefs: [probeId, updateId],
      rubricId: "rubric-" + variantId(topic.topicId, vivaKind),
    });
    rubrics.push(rubric(topic.topicId, appliedKind, topic.trio.appliedConcepts));
    rubrics.push(rubric(topic.topicId, vivaKind, topic.trio.vivaConcepts));
    cases.push({ caseId, text: topic.trio.caseText });
    followUps.push(
      { followUpId: probeId, text: topic.trio.probe, kind: "PROBE" },
      {
        followUpId: updateId,
        text: topic.trio.evidenceUpdate,
        kind: "EVIDENCE_UPDATE",
      },
    );
  }

  return {
    topicId: topic.topicId,
    title: topic.title,
    variants,
    rubrics,
    cases,
    followUps,
    vivaQuestions: topic.viva
      ? topic.viva.map((question, index) => ({
          id: `${topic.topicId}-viva-q${index + 1}`,
          level: question.level,
          prompt: question.prompt,
          targetConceptIds: question.targetConceptIds,
        }))
      : [],
  };
}

const pack = {
  schemaVersion: "1.0",
  contentKind: "MEDICAL",
  packId: "mpt-cardiorespiratory-review-candidate",
  version: "0.1.0",
  title: "MPT Cardiovascular and Respiratory — educator review candidate",
  locale: "en-IN",
  licence: {
    id: "LICENCE-DECISION-PENDING",
    attribution:
      "Original MediPrompt prompt, case, and rubric wording. Publication/reuse licence awaits owner and medical review; cited source text and figures are not redistributed.",
  },
  review: {
    status: "DRAFT",
    reviewers: [],
    reviewedAt: null,
  },
  sources,
  subjects: subjects.map((subject) => ({
    subjectId: subject.subjectId,
    title: subject.title,
    topics: subject.topics.map(buildTopic),
  })),
};

const out = resolve(
  __dirname,
  "../../../content/candidates/mpt-cardiorespiratory-review-candidate.json",
);
mkdirSync(dirname(out), { recursive: true });
const serialized = JSON.stringify(pack, null, 2) + "\n";
if (process.argv.includes("--check")) {
  if (readFileSync(out, "utf8") !== serialized) {
    throw new Error("medical candidate is stale; run pnpm candidate:medical:generate");
  }
} else {
  writeFileSync(out, serialized, "utf8");
}

const topicCount = subjects.reduce((sum, subject) => sum + subject.topics.length, 0);
const trioCount = subjects.reduce(
  (sum, subject) => sum + subject.topics.filter((topic) => topic.trio).length,
  0,
);
console.log(
  (process.argv.includes("--check") ? "verified " : "wrote ") +
    out +
    " (" +
    topicCount +
    " topics, " +
    trioCount +
    " challenge trios)",
);
