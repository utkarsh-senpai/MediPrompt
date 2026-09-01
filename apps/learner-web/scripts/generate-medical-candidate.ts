// Generates the source-grounded MPT curriculum educator-review candidate.
// The artifact is deliberately DRAFT. It powers the explicitly labelled
// public practice beta and cannot pass the medically approved release gate.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ACCESSED_AT = "2026-08-30";
const NEURO_RESEARCH_ACCESSED_AT = "2026-09-02";

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
  availability: "ACTIVE" | "COMING_SOON";
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
  // --- v0.7 neuro physiotherapy sources (verified 2026-09-02) ---
  {
    sourceId: "nice-ng236-stroke-rehab",
    citation:
      "NICE. Stroke rehabilitation in adults. NG236. Published 18 Oct 2023; replaces CG162 (2013).",
    url: "https://www.nice.org.uk/guidance/ng236",
    accessedAt: ACCESSED_AT,
  },
  {
    sourceId: "nice-ng62-cerebral-palsy",
    citation:
      "NICE. Cerebral palsy in under 25s: assessment and management. NG62. Published 25 Jan 2017; last reviewed 19 Sep 2024.",
    url: "https://www.nice.org.uk/guidance/ng62",
    accessedAt: ACCESSED_AT,
  },
  {
    sourceId: "nice-ng71-parkinsons",
    citation:
      "NICE. Parkinson's disease in adults. NG71. Published 19 Jul 2017; last reviewed 19 Dec 2024. Updates and replaces CG35 (2006).",
    url: "https://www.nice.org.uk/guidance/ng71",
    accessedAt: ACCESSED_AT,
  },
  {
    sourceId: "aha-asa-stroke-rehab-2016",
    citation:
      "Winstein CJ et al.; AHA/ASA. Guidelines for Adult Stroke Rehabilitation and Recovery. Stroke. 2016;47(6):e98-e169. doi:10.1161/STR.0000000000000098. PMID:27145936.",
    url: "https://pubmed.ncbi.nlm.nih.gov/27145936/",
    accessedAt: ACCESSED_AT,
  },
  {
    sourceId: "cochrane-mirror-therapy-2018",
    citation:
      "Thieme H et al. Mirror therapy for improving motor function after stroke. Cochrane Database Syst Rev. 2018;7:CD008449. doi:10.1002/14651858.CD008449.pub3. PMID:29993119.",
    url: "https://pubmed.ncbi.nlm.nih.gov/29993119/",
    accessedAt: ACCESSED_AT,
  },
  {
    sourceId: "cochrane-cimt-2015",
    citation:
      "Corbetta D et al. Constraint-induced movement therapy for upper extremities in people with stroke. Cochrane Database Syst Rev. 2015;(10):CD004433. doi:10.1002/14651858.CD004433.pub3. PMID:26446577.",
    url: "https://pubmed.ncbi.nlm.nih.gov/26446577/",
    accessedAt: ACCESSED_AT,
  },
  {
    sourceId: "cochrane-vr-stroke-2025",
    citation:
      "Laver KE et al. Virtual reality for stroke rehabilitation. Cochrane Database Syst Rev. 2025;6:CD008349. doi:10.1002/14651858.CD008349.pub5. PMID:40537150.",
    url: "https://pubmed.ncbi.nlm.nih.gov/40537150/",
    accessedAt: ACCESSED_AT,
  },
  {
    sourceId: "cochrane-treadmill-bws-2017",
    citation:
      "Mehrholz J et al. Treadmill training and body weight support for walking after stroke. Cochrane Database Syst Rev. 2017;8:CD002840. doi:10.1002/14651858.CD002840.pub4. PMID:28815562.",
    url: "https://pubmed.ncbi.nlm.nih.gov/28815562/",
    accessedAt: ACCESSED_AT,
  },
  {
    sourceId: "fugl-meyer-1975",
    citation:
      "Fugl-Meyer AR et al. The post-stroke hemiplegic patient: a method for evaluation of physical performance. Scand J Rehabil Med. 1975;7(1):13-31. PMID:1135616.",
    url: "https://pubmed.ncbi.nlm.nih.gov/1135616/",
    accessedAt: ACCESSED_AT,
  },
  {
    sourceId: "berg-balance-1992",
    citation:
      "Berg KO et al. Measuring balance in the elderly: validation of an instrument. Can J Public Health. 1992;83 Suppl 2:S7-11. PMID:1468055.",
    url: "https://pubmed.ncbi.nlm.nih.gov/1468055/",
    accessedAt: ACCESSED_AT,
  },
  {
    sourceId: "gmfm-russell-1989",
    citation:
      "Russell DJ et al. The gross motor function measure: a means to evaluate effects of physical therapy. Dev Med Child Neurol. 1989;31(3):341-52. doi:10.1111/j.1469-8749.1989.tb04003.x. PMID:2753238.",
    url: "https://pubmed.ncbi.nlm.nih.gov/2753238/",
    accessedAt: ACCESSED_AT,
  },
  {
    sourceId: "gmfcs-palisano-1997",
    citation:
      "Palisano R et al. Development and reliability of a system to classify gross motor function in children with cerebral palsy. Dev Med Child Neurol. 1997;39(4):214-23. doi:10.1111/j.1469-8749.1997.tb07414.x. PMID:9183258.",
    url: "https://pubmed.ncbi.nlm.nih.gov/9183258/",
    accessedAt: ACCESSED_AT,
  },
  {
    sourceId: "dmd-care-birnkrant-2018",
    citation:
      "Birnkrant DJ et al.; DMD Care Considerations Working Group. Diagnosis and management of Duchenne muscular dystrophy, part 1. Lancet Neurol. 2018;17(3):251-267. doi:10.1016/S1474-4422(18)30024-3. PMID:29395989.",
    url: "https://pubmed.ncbi.nlm.nih.gov/29395989/",
    accessedAt: ACCESSED_AT,
  },
  {
    sourceId: "sma-care-mercuri-2018",
    citation:
      "Mercuri E et al.; SMA Care Group. Diagnosis and management of spinal muscular atrophy: Part 1. Neuromuscul Disord. 2018;28(2):103-115. doi:10.1016/j.nmd.2017.11.005. PMID:29290580.",
    url: "https://pubmed.ncbi.nlm.nih.gov/29290580/",
    accessedAt: ACCESSED_AT,
  },
  {
    sourceId: "asia-isncsci-9th-2026",
    citation:
      "American Spinal Injury Association. International Standards for Neurological Classification of Spinal Cord Injury (ISNCSCI), 9th Edition (2026). Richmond, VA: ASIA.",
    url: "https://www.asia-spinalinjury.org/",
    accessedAt: ACCESSED_AT,
  },
  {
    sourceId: "mmse-folstein-1975",
    citation:
      "Folstein MF, Folstein SE, McHugh PR. Mini-mental state: a practical method for grading the cognitive state of patients. J Psychiatr Res. 1975;12(3):189-98.",
    url: "https://pubmed.ncbi.nlm.nih.gov/?term=Folstein+mini-mental+state+1975",
    accessedAt: ACCESSED_AT,
  },
  {
    sourceId: "umphred-neuro-rehab-2025",
    citation:
      "Lazaro RT et al., eds. Umphred's Neurological Rehabilitation. 8th ed. Elsevier; published 17 Nov 2025. ISBN 9780443112928.",
    url: "https://www.us.elsevierhealth.com/umphreds-neurological-rehabilitation-9780443112928.html",
    accessedAt: NEURO_RESEARCH_ACCESSED_AT,
  },
  {
    sourceId: "campbell-pt-children-2023",
    citation:
      "Palisano RJ et al., eds. Campbell's Physical Therapy for Children. 6th ed. Elsevier; 2023. ISBN 9780323797962.",
    url: "https://www.us.elsevierhealth.com/campbells-physical-therapy-for-children-9780323797962.html",
    accessedAt: NEURO_RESEARCH_ACCESSED_AT,
  },
  {
    sourceId: "shumway-cook-motor-control-2023",
    citation:
      "Shumway-Cook A, Woollacott MH. Motor Control: Translating Research into Clinical Practice. 6th ed. Wolters Kluwer; 2023. ISBN 9781975209568.",
    url: "https://shop.lww.com/Motor-Control/p/9781975209568",
    accessedAt: NEURO_RESEARCH_ACCESSED_AT,
  },
  {
    sourceId: "cdc-developmental-milestones-2026",
    citation:
      "US CDC. Developmental Milestones. Learn the Signs. Act Early. Current website reviewed for 2026 use; milestone checklists are not diagnostic or screening tools.",
    url: "https://www.cdc.gov/act-early/milestones/index.html",
    accessedAt: NEURO_RESEARCH_ACCESSED_AT,
  },
  {
    sourceId: "aacpdm-early-cp-detection",
    citation:
      "AACPDM. Early Detection of Cerebral Palsy Care Pathway. Current care pathway reviewed 2 Sep 2026.",
    url: "https://www.aacpdm.org/publications/care-pathways/early-detection-of-cerebral-palsy",
    accessedAt: NEURO_RESEARCH_ACCESSED_AT,
  },
  {
    sourceId: "morgan-early-cp-intervention-2021",
    citation:
      "Morgan C et al. Early Intervention for Children Aged 0 to 2 Years With or at High Risk of Cerebral Palsy: International Clinical Practice Guideline. JAMA Pediatr. 2021;175:846-858.",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9677545",
    accessedAt: NEURO_RESEARCH_ACCESSED_AT,
  },
  {
    sourceId: "spina-bifida-mobility-guideline",
    citation:
      "Spina Bifida Association. Mobility Guideline. Current clinical guidance reviewed 2 Sep 2026.",
    url: "https://www.spinabifidaassociation.org/blog/mobility",
    accessedAt: NEURO_RESEARCH_ACCESSED_AT,
  },
  {
    sourceId: "btf-pediatric-severe-tbi",
    citation:
      "Brain Trauma Foundation. Guidelines for the Management of Pediatric Severe TBI, 3rd edition. Current guideline portal reviewed 2 Sep 2026.",
    url: "https://braintrauma.org/coma/guidelines/pediatric",
    accessedAt: NEURO_RESEARCH_ACCESSED_AT,
  },
  {
    sourceId: "aap-down-syndrome-2022",
    citation:
      "Bull MJ et al. Health Supervision for Children and Adolescents With Down Syndrome. Pediatrics. 2022;149(5):e2022057010.",
    url: "https://publications.aap.org/pediatrics/article/149/5/e2022057010/186778/Health-Supervision-for-Children-and-Adolescents",
    accessedAt: NEURO_RESEARCH_ACCESSED_AT,
  },
  {
    sourceId: "nice-cg170-autism-under-19",
    citation:
      "NICE. Autism spectrum disorder in under 19s: support and management. CG170. Published 2013; current surveillance status reviewed 2 Sep 2026.",
    url: "https://www.nice.org.uk/guidance/cg170",
    accessedAt: NEURO_RESEARCH_ACCESSED_AT,
  },
  {
    sourceId: "apta-pediatrics-resources-2026",
    citation:
      "APTA Pediatrics. Evidence-based resource documents, including neonatal and school-based pediatric physical therapy resources. Current portal reviewed 2 Sep 2026.",
    url: "https://pediatricapta.org/resource-documents",
    accessedAt: NEURO_RESEARCH_ACCESSED_AT,
  },
  {
    sourceId: "who-wheelchair-provision-2023",
    citation:
      "World Health Organization. Wheelchair provision guidelines. Geneva: WHO; 2023. ISBN 9789240074521.",
    url: "https://www.who.int/publications/i/item/9789240074521",
    accessedAt: NEURO_RESEARCH_ACCESSED_AT,
  },
  {
    sourceId: "apta-vestibular-hypofunction-2022",
    citation:
      "Hall CD et al. Vestibular Rehabilitation for Peripheral Vestibular Hypofunction: Updated Clinical Practice Guideline. J Neurol Phys Ther. 2022;46:118-177.",
    url: "https://pubmed.ncbi.nlm.nih.gov/34864777",
    accessedAt: NEURO_RESEARCH_ACCESSED_AT,
  },
  {
    sourceId: "cns-pediatric-hydrocephalus-2020",
    citation:
      "Congress of Neurological Surgeons. Pediatric Hydrocephalus: Systematic Literature Review and Evidence-Based Guidelines. Updated 2020.",
    url: "https://www.cns.org/guidelines/browse-guidelines-detail/pediatric-hydrocephalus-guideline-1",
    accessedAt: NEURO_RESEARCH_ACCESSED_AT,
  },
  {
    sourceId: "aha-adult-als-2025",
    citation:
      "American Heart Association. Part 9: Adult Advanced Life Support. 2025 AHA Guidelines for CPR and Emergency Cardiovascular Care. Circulation. 2025;152(suppl 2).",
    url: "https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines/adult-advanced-life-support",
    accessedAt: NEURO_RESEARCH_ACCESSED_AT,
  },
  {
    sourceId: "fda-hyperbaric-oxygen-2021",
    citation:
      "US Food and Drug Administration. Hyperbaric Oxygen Therapy: Get the Facts. Consumer safety communication; content current as of 26 July 2021.",
    url: "https://www.fda.gov/consumers/consumer-updates/hyperbaric-oxygen-therapy-get-facts",
    accessedAt: NEURO_RESEARCH_ACCESSED_AT,
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

// --- v0.7 neuro physiotherapy ---
// All 35 neuro topics are source-grounded. Sources were checked in 2026 and
// combine 2025-26 material with older current guidelines and foundational
// standards. Five future subjects retain non-playable curriculum scaffolds.

const neuroTopics: TopicSeed[] = [
  {
    topicId: "stroke-management",
    title: "Stroke rehabilitation: physiotherapy management",
    prompt:
      "Explain physiotherapy management after stroke, from early assessment through intensity, task-oriented practice, impairment-specific adjuncts, and outcome measurement.",
    concepts: [
      c("Deliver therapy early and at high intensity with task-oriented, repetitive practice", ["early high-intensity therapy", "task-oriented repetitive practice", "high repetition task practice"], ["aha-asa-stroke-rehab-2016"]),
      c("Select impairment-specific adjuncts by deficit: CIMT, mirror therapy, treadmill with body-weight support, virtual reality", ["constraint-induced movement therapy", "mirror therapy", "treadmill with body weight support", "virtual reality"], ["aha-asa-stroke-rehab-2016", "cochrane-cimt-2015", "cochrane-mirror-therapy-2018", "cochrane-treadmill-bws-2017", "cochrane-vr-stroke-2025"]),
      c("Track progress with validated outcome measures and adjust the dose", ["Berg Balance Scale", "Fugl-Meyer Assessment", "track progress with outcome measures"], ["aha-asa-stroke-rehab-2016", "berg-balance-1992", "fugl-meyer-1975"]),
    ],
    trio: {
      caseText:
        "A fictional 64-year-old has a right middle cerebral artery infarct with left hemiparesis, is medically stable 72 hours after stroke, sits with assistance, and wants to walk independently and use the left arm for dressing.",
      appliedPrompt:
        "Using the fictional case, prioritize early physiotherapy goals, choose impairment-specific adjuncts, and outline a monitored progression with the outcome measures you would track.",
      appliedConcepts: [
        c("Prioritize early sitting, standing, and walking practice at tolerable intensity", ["early sitting and standing", "walking practice", "tolerable intensity"], ["aha-asa-stroke-rehab-2016"]),
        c("Match adjuncts to the deficit: CIMT for the arm, treadmill training for gait", ["constraint-induced movement therapy for arm", "treadmill training for gait", "match adjunct to deficit"], ["cochrane-cimt-2015", "cochrane-treadmill-bws-2017"]),
        c("Track Berg Balance and Fugl-Meyer to justify progression", ["Berg Balance Scale", "Fugl-Meyer Assessment", "track to justify progression"], ["berg-balance-1992", "fugl-meyer-1975"]),
      ],
      vivaPrompt:
        "Defend your early stroke rehabilitation plan for the fictional case, separate what the evidence supports from what is patient-specific, and state the findings that would pause progression and trigger escalation.",
      vivaConcepts: [
        c("Defend high-intensity task practice using dose-response evidence", ["dose-response evidence", "high-intensity task practice", "evidence supports intensity"], ["aha-asa-stroke-rehab-2016"]),
        c("Acknowledge individual tolerance, comorbidity, and response uncertainty", ["individual tolerance", "comorbidity", "response uncertainty"], ["aha-asa-stroke-rehab-2016"]),
        c("State that new instability, deterioration, or red flags pause progression and trigger escalation", ["pause progression", "clinical escalation", "red flags"], ["nice-ng236-stroke-rehab"]),
      ],
      probe: "Which single adjunct would most change arm function for this person, and what limits its applicability?",
      evidenceUpdate:
        "The person develops new shoulder pain during active left-arm practice. Explain how this changes your priorities and why forced-use CIMT must pause pending assessment.",
    },
    viva: [
      { level: "RECALL", prompt: "Recall where stroke rehabilitation should begin and why intensity matters.", targetConceptIds: ["stroke-management-guided-recall-c1"] },
      { level: "APPLY", prompt: "Apply impairment-specific adjuncts to a person with left hemiparesis who wants to walk and use the arm.", targetConceptIds: ["stroke-management-guided-recall-c2"] },
      { level: "DEFEND", prompt: "Defend your plan and the findings that would pause progression and trigger escalation.", targetConceptIds: ["stroke-management-guided-recall-c3"] },
    ],
  },
  {
    topicId: "cerebral-palsy-management",
    title: "Cerebral palsy: assessment and physiotherapy management",
    prompt:
      "Explain assessment and physiotherapy management of cerebral palsy, emphasizing MDT care, GMFM/GMFCS, comorbidity surveillance, and goal-based management.",
    concepts: [
      c("Use MDT care from diagnosis with surveillance for pain, sleep, feeding, salivation, and mental health", ["multidisciplinary care from diagnosis", "comorbidity surveillance", "pain sleep feeding surveillance"], ["nice-ng62-cerebral-palsy"]),
      c("Assess gross motor function with GMFM and classify with GMFCS to guide goals", ["Gross Motor Function Measure", "GMFCS classification", "GMFM and GMFCS"], ["gmfm-russell-1989", "gmfcs-palisano-1997", "nice-ng62-cerebral-palsy"]),
      c("Set functional goals and plan transition to adult services", ["functional goals", "transition to adult services", "goal-based management"], ["nice-ng62-cerebral-palsy"]),
    ],
    trio: {
      caseText:
        "A fictional 5-year-old with bilateral cerebral palsy, GMFCS level III, walks with a mobility aid, has tight calf muscles, and is due for primary-school entry.",
      appliedPrompt:
        "Using the fictional case, outline a GMFCS-stratified management plan, the comorbidity surveillance you would coordinate, and the goals you would set for school participation.",
      appliedConcepts: [
        c("Stratify management by GMFCS level and set participation goals", ["GMFCS level III", "stratify by GMFCS", "school participation goals"], ["gmfcs-palisano-1997", "nice-ng62-cerebral-palsy"]),
        c("Coordinate MDT surveillance beyond motor impairment", ["MDT surveillance", "comorbidity surveillance", "coordinate multidisciplinary care"], ["nice-ng62-cerebral-palsy"]),
        c("Use GMFM to track gross motor change", ["Gross Motor Function Measure", "track motor change", "GMFM progress"], ["gmfm-russell-1989"]),
      ],
      vivaPrompt:
        "Defend your management plan for the fictional child, distinguish what GMFCS predicts from what is individual, and explain how you would respond if participation goals and motor goals conflict.",
      vivaConcepts: [
        c("Defend GMFCS-stratified goals using predicted mobility trajectory", ["GMFCS predicts mobility", "predicted trajectory", "stratified goals"], ["gmfcs-palisano-1997"]),
        c("Acknowledge individual variation and the limits of classification", ["individual variation", "limits of classification", "child-specific factors"], ["nice-ng62-cerebral-palsy"]),
        c("Use shared decision making and reassessment to revise goals", ["shared decision making", "reassess goals", "revise the plan"], ["nice-ng62-cerebral-palsy"]),
      ],
      probe: "What would change your management more: a one-level change in GMFCS, or a new pain complaint?",
      evidenceUpdate:
        "The child reports new hip pain. Explain how this changes surveillance priorities and why motor goals must be revisited before progression.",
    },
    viva: [
      { level: "RECALL", prompt: "Recall how GMFM and GMFCS are used together in cerebral palsy assessment.", targetConceptIds: ["cerebral-palsy-management-guided-recall-c2"] },
      { level: "APPLY", prompt: "Apply MDT comorbidity surveillance and goal setting for a GMFCS level III child entering school.", targetConceptIds: ["cerebral-palsy-management-guided-recall-c1"] },
      { level: "DEFEND", prompt: "Defend how you would revise goals if participation and motor goals conflict.", targetConceptIds: ["cerebral-palsy-management-guided-recall-c3"] },
    ],
  },
  {
    topicId: "pediatric-neuromuscular-dmd-sma",
    title: "Pediatric neuromuscular disorders: DMD and SMA management",
    prompt:
      "Explain physiotherapy management of Duchenne muscular dystrophy and spinal muscular atrophy, including contracture prevention, postural management, and multidisciplinary care.",
    concepts: [
      c("Focus PT on contracture prevention, scoliosis surveillance, and staged stretching and orthotic programmes", ["contracture prevention", "scoliosis surveillance", "stretching and orthotic programme"], ["dmd-care-birnkrant-2018", "sma-care-mercuri-2018"]),
      c("Work within multidisciplinary care that extends ambulation and survival with serial respiratory and cardiac monitoring", ["multidisciplinary care", "extend ambulation", "serial respiratory and cardiac monitoring"], ["dmd-care-birnkrant-2018"]),
      c("Adjust rehabilitation goals by disease severity and therapy status, with postural and ventilation support", ["postural management", "assisted ventilation", "goals by disease severity"], ["sma-care-mercuri-2018"]),
    ],
    trio: {
      caseText:
        "A fictional 7-year-old with Duchenne muscular dystrophy is still ambulant but beginning to rise from the floor with hand-to-thigh climbing, and has tight heel cords.",
      appliedPrompt:
        "Using the fictional case, outline a PT programme spanning contracture management, ambulation preservation, and the surveillance you would coordinate within the MDT.",
      appliedConcepts: [
        c("Design a stretching and night-orthotic programme for contracture prevention", ["stretching programme", "night orthoses", "contracture prevention"], ["dmd-care-birnkrant-2018"]),
        c("Coordinate serial respiratory and cardiac monitoring with the MDT", ["serial respiratory monitoring", "cardiac monitoring", "coordinate MDT"], ["dmd-care-birnkrant-2018"]),
        c("Set ambulation-preservation goals aligned to disease stage", ["ambulation preservation", "goals by disease stage", "stage-aligned goals"], ["dmd-care-birnkrant-2018", "sma-care-mercuri-2018"]),
      ],
      vivaPrompt:
        "Defend your DMD management plan, distinguish what is disease-stage specific from what is general, and explain how goals change if ambulation is lost.",
      vivaConcepts: [
        c("Defend contracture and scoliosis surveillance using care-consideration evidence", ["contracture and scoliosis surveillance", "care considerations", "evidence-based surveillance"], ["dmd-care-birnkrant-2018", "sma-care-mercuri-2018"]),
        c("Acknowledge therapy-status uncertainty and individual progression", ["therapy status", "individual progression", "disease progression uncertainty"], ["sma-care-mercuri-2018"]),
        c("State that loss of ambulation shifts goals to postural care, scoliosis, and ventilation support", ["postural care", "scoliosis management", "ventilation support"], ["sma-care-mercuri-2018"]),
      ],
      probe: "Which monitored outcome would most signal the need to shift from ambulation goals to postural management?",
      evidenceUpdate:
        "The child loses independent ambulation over six months. Explain how the programme changes and why respiratory surveillance intensity increases.",
    },
    viva: [
      { level: "RECALL", prompt: "Recall the PT focus in DMD and SMA care standards.", targetConceptIds: ["pediatric-neuromuscular-dmd-sma-guided-recall-c1"] },
      { level: "APPLY", prompt: "Apply contracture and ambulation management for an ambulant boy with DMD and tight heel cords.", targetConceptIds: ["pediatric-neuromuscular-dmd-sma-guided-recall-c2"] },
      { level: "DEFEND", prompt: "Defend how goals change if ambulation is lost and why respiratory surveillance intensifies.", targetConceptIds: ["pediatric-neuromuscular-dmd-sma-guided-recall-c3"] },
    ],
  },
  {
    topicId: "parkinsons-disease-management",
    title: "Parkinson's disease: physiotherapy management",
    prompt:
      "Explain physiotherapy management of Parkinson's disease, focusing on gait, balance, transfers, freezing of gait, and falls reduction.",
    concepts: [
      c("Offer physiotherapy targeting gait, balance, and transfers", ["gait balance and transfers", "physiotherapy for Parkinson's", "transfers training"], ["nice-ng71-parkinsons"]),
      c("Address freezing of gait and reduce falls", ["freezing of gait", "reduce falls", "falls reduction"], ["nice-ng71-parkinsons"]),
      c("Recognise that pharmacological management is levodopa-based and that non-motor symptoms need separate management", ["levodopa-based management", "non-motor symptoms", "depression sleep autonomic"], ["nice-ng71-parkinsons"]),
    ],
    trio: {
      caseText:
        "A fictional 68-year-old with Parkinson's disease has freezing of gait at doorways, two near-falls in the past month, and is independent in transfers but slow.",
      appliedPrompt:
        "Using the fictional case, design a physiotherapy plan targeting freezing of gait and falls, and explain how you would time therapy with medication cycles.",
      appliedConcepts: [
        c("Target freezing of gait with cueing and strategy training", ["cueing strategies", "freezing of gait", "strategy training"], ["nice-ng71-parkinsons"]),
        c("Prioritise falls reduction through balance and transfer training", ["falls reduction", "balance training", "transfer training"], ["nice-ng71-parkinsons"]),
        c("Time active therapy to 'on' periods where possible", ["on periods", "time therapy with medication", "levodopa cycles"], ["nice-ng71-parkinsons"]),
      ],
      vivaPrompt:
        "Defend your Parkinson's plan, separate what physiotherapy can change from what is medication-driven, and explain how you would respond to worsening falls.",
      vivaConcepts: [
        c("Defend gait, balance, and transfer training using guideline evidence", ["gait balance and transfers", "guideline evidence", "physiotherapy benefit"], ["nice-ng71-parkinsons"]),
        c("Acknowledge that motor symptoms are levodopa-responsive and non-motor symptoms are not", ["levodopa-responsive motor symptoms", "non-motor symptoms", "medication-driven"], ["nice-ng71-parkinsons"]),
        c("State that worsening falls or new freezing triggers medical review and revised supervision", ["worsening falls", "medical review", "revised supervision"], ["nice-ng71-parkinsons"]),
      ],
      probe: "Which outcome would best show whether your falls programme is working, and over what timeframe?",
      evidenceUpdate:
        "The person reports more freezing in the afternoon. Explain how this changes your timing of therapy and what medical review you would flag.",
    },
    viva: [
      { level: "RECALL", prompt: "Recall the physiotherapy targets in Parkinson's disease per current guidance.", targetConceptIds: ["parkinsons-disease-management-guided-recall-c1"] },
      { level: "APPLY", prompt: "Apply a freezing-of-gait and falls plan for a person with doorway freezing and near-falls.", targetConceptIds: ["parkinsons-disease-management-guided-recall-c2"] },
      { level: "DEFEND", prompt: "Defend how you would respond to worsening falls and what is medication-driven versus therapy-driven.", targetConceptIds: ["parkinsons-disease-management-guided-recall-c3"] },
    ],
  },
  {
    topicId: "neuro-outcome-measures",
    title: "Outcome measures in neurological physiotherapy",
    prompt:
      "Explain how to select and interpret outcome measures in neuro physiotherapy, including Berg Balance, Fugl-Meyer, MMSE, and the ASIA Impairment Scale.",
    concepts: [
      c("Use the Berg Balance Scale to measure static and dynamic balance; a change of about 4 points is the minimal detectable change", ["Berg Balance Scale", "minimal detectable change", "balance assessment"], ["berg-balance-1992"]),
      c("Use the Fugl-Meyer Assessment to quantify motor, balance, sensation and joint function in hemiplegia", ["Fugl-Meyer Assessment", "motor sensory assessment", "hemiplegia assessment"], ["fugl-meyer-1975"]),
      c("Use the MMSE as a bedside cognitive screen and the ASIA Impairment Scale for spinal cord injury classification", ["Mini-Mental State Examination", "ASIA Impairment Scale", "cognitive screen", "AIS grade"], ["mmse-folstein-1975", "asia-isncsci-9th-2026"]),
    ],
  },
  {
    topicId: "neuro-therapeutic-task-oriented",
    title: "Neuro-therapeutic skills: task-oriented and evidence-based adjuncts",
    prompt:
      "Explain the evidence-based neuro-therapeutic approaches after stroke, emphasizing task-oriented practice and adjuncts with trial evidence.",
    concepts: [
      c("Prioritise task-oriented, high-intensity repetitive practice as the core approach", ["task-oriented practice", "high-intensity repetition", "repetitive task practice"], ["aha-asa-stroke-rehab-2016"]),
      c("Apply constraint-induced movement therapy with a transfer package for arm function", ["constraint-induced movement therapy", "transfer package", "shaping and restraint"], ["cochrane-cimt-2015"]),
      c("Use mirror therapy and virtual reality as adjuncts to increase dose and engagement", ["mirror therapy", "virtual reality adjunct", "increase dose and engagement"], ["cochrane-mirror-therapy-2018", "cochrane-vr-stroke-2025"]),
      c("Use treadmill training with or without body-weight support for walking", ["treadmill training", "body weight support", "walking speed and endurance"], ["cochrane-treadmill-bws-2017"]),
    ],
  },
  {
    topicId: "adult-neuro-assessment",
    title: "Advanced assessment of adult neurological conditions",
    prompt:
      "Explain a structured physiotherapy assessment of an adult with a neurological condition, integrating impairment, activity, and participation with validated tools.",
    concepts: [
      c("Start early with structured assessment across body structure, activity, and participation", ["early structured assessment", "impairment activity participation", "ICF framework"], ["aha-asa-stroke-rehab-2016"]),
      c("Use Fugl-Meyer, Berg Balance, and MMSE to objectify motor, balance, and cognitive status", ["Fugl-Meyer Assessment", "Berg Balance Scale", "Mini-Mental State Examination"], ["fugl-meyer-1975", "berg-balance-1992", "mmse-folstein-1975"]),
      c("Screen for fatigue, mood, vision, hearing, and communication before planning", ["screen fatigue and mood", "vision hearing communication", "routine screening"], ["nice-ng236-stroke-rehab"]),
    ],
  },
  {
    topicId: "pediatric-gross-motor-assessment",
    title: "Advanced pediatric assessment: GMFM and GMFCS",
    prompt:
      "Explain how the GMFM and GMFCS are used to assess and classify gross motor function in children with cerebral palsy and other paediatric neuro conditions.",
    concepts: [
      c("Use GMFM-66/88 as a criterion-referenced, change-sensitive measure of gross motor function", ["Gross Motor Function Measure", "criterion-referenced measure", "change-sensitive"], ["gmfm-russell-1989"]),
      c("Classify gross motor ability with GMFCS levels I to V to predict mobility and guide goals", ["GMFCS classification", "gross motor function classification", "mobility trajectory"], ["gmfcs-palisano-1997"]),
    ],
  },
  {
    topicId: "pediatric-posture-gait-cp",
    title: "Posture and gait management in pediatric neurological conditions",
    prompt:
      "Explain assessment and management of posture and gait in children with cerebral palsy, linking GMFCS level to intervention goals.",
    concepts: [
      c("Link posture and gait management to GMFCS level and functional goals", ["GMFCS level", "posture and gait management", "functional goals"], ["gmfcs-palisano-1997", "nice-ng62-cerebral-palsy"]),
      c("Use MDT surveillance and orthotic or surgical options aligned to motor prognosis", ["orthotic management", "MDT surveillance", "motor prognosis"], ["nice-ng62-cerebral-palsy"]),
    ],
  },
  {
    topicId: "pediatric-progressive-management",
    title: "Management of progressive and non-progressive pediatric neurological conditions",
    prompt:
      "Explain how physiotherapy management differs between progressive (e.g., DMD, SMA) and non-progressive (e.g., cerebral palsy) paediatric conditions.",
    concepts: [
      c("For progressive conditions, focus on contracture prevention, postural care, and ambulation preservation within MDT care", ["progressive conditions", "contracture prevention", "ambulation preservation"], ["dmd-care-birnkrant-2018", "sma-care-mercuri-2018"]),
      c("For non-progressive conditions, emphasise task-oriented motor learning and GMFCS-stratified goals", ["non-progressive conditions", "motor learning", "GMFCS-stratified goals"], ["nice-ng62-cerebral-palsy", "gmfcs-palisano-1997"]),
    ],
  },
  {
    topicId: "neural-plasticity-dose",
    title: "Neural plasticity and dose in neurorehabilitation",
    prompt:
      "Explain how neural plasticity and movement plasticity inform the dose and design of neurorehabilitation, using evidence of dose-response.",
    concepts: [
      c("Apply high-repetition, task-oriented practice to drive experience-dependent plasticity", ["experience-dependent plasticity", "high-repetition practice", "task-oriented practice"], ["aha-asa-stroke-rehab-2016"]),
      c("Expect a definable recovery sequence, tracked with the Fugl-Meyer Assessment", ["recovery sequence", "proximal to distal", "Fugl-Meyer Assessment"], ["fugl-meyer-1975"]),
    ],
  },
  {
    topicId: "adult-neuro-ebp",
    title: "Evidence-based practice in adult neurorehabilitation",
    prompt:
      "Explain how evidence-based practice shapes adult neurorehabilitation, including therapy intensity, telerehabilitation, and outcome review.",
    concepts: [
      c("Deliver structured, high-repetition task practice at sufficient dose", ["sufficient dose", "structured task practice", "therapy intensity"], ["nice-ng236-stroke-rehab"]),
      c("Use telerehabilitation as an acceptable delivery mode where appropriate", ["telerehabilitation", "delivery mode", "remote rehabilitation"], ["nice-ng236-stroke-rehab"]),
    ],
  },
  {
    topicId: "adult-community-integration",
    title: "Community integration and early supported discharge after neurological injury",
    prompt:
      "Explain how early supported discharge and community therapy support participation and continuity after neurological injury.",
    concepts: [
      c("Use early supported discharge with community therapy for eligible patients", ["early supported discharge", "community therapy", "community rehabilitation"], ["nice-ng236-stroke-rehab"]),
      c("Plan continuity and participation-focused goals beyond the acute phase", ["continuity of therapy", "participation goals", "community integration"], ["nice-ng236-stroke-rehab", "aha-asa-stroke-rehab-2016"]),
    ],
  },
  {
    topicId: "parkinsons-pharmacotherapy",
    title: "Pharmacotherapeutics in adult neurological conditions: Parkinson's",
    prompt:
      "Explain how pharmacotherapy for Parkinson's disease interacts with physiotherapy, including levodopa-based motor management and non-motor symptoms.",
    concepts: [
      c("Recognise levodopa-based management of motor symptoms and time therapy with medication cycles", ["levodopa-based management", "motor symptoms", "on off fluctuations"], ["nice-ng71-parkinsons"]),
      c("Identify non-motor symptoms that require separate management", ["non-motor symptoms", "depression sleep autonomic", "separate management"], ["nice-ng71-parkinsons"]),
    ],
  },
  {
    topicId: "neuro-tech-vr-fes",
    title: "Recent advances in technology for neurological physiotherapy",
    prompt:
      "Explain the role of technology in neuro physiotherapy, including virtual reality and functional electrical stimulation, and their evidence as adjuncts.",
    concepts: [
      c("Use virtual reality and interactive gaming as an adjunct to increase dose and engagement after stroke", ["virtual reality", "interactive gaming", "adjunct to increase dose"], ["cochrane-vr-stroke-2025"]),
      c("Apply functional electrical stimulation for specific impairments where evidence supports", ["functional electrical stimulation", "FES", "evidence-based adjunct"], ["aha-asa-stroke-rehab-2016"]),
    ],
  },
  {
    topicId: "spinal-cord-injury-isncsci",
    title: "Spinal cord injury: ISNCSCI classification and early management",
    prompt:
      "Explain how the ISNCSCI examination classifies spinal cord injury and how the AIS grade and neurological level guide early physiotherapy management.",
    concepts: [
      c("Perform the ISNCSCI motor and sensory examination to determine the neurological level and AIS grade", ["ISNCSCI examination", "motor and sensory examination", "neurological level of injury", "AIS grade"], ["asia-isncsci-9th-2026"]),
      c("Use sacral sparing and key muscle levels to define completeness of injury", ["sacral sparing", "ASIA Impairment Scale", "completeness of injury"], ["asia-isncsci-9th-2026"]),
      c("Guide early management by neurological level within the rehabilitation team", ["early management by level", "rehabilitation team", "neurological level guides management"], ["asia-isncsci-9th-2026"]),
    ],
  },
];

// --- scaffold topics: playable but not yet content-scored ---
// A scaffold topic has one GUIDED variant and a rubric with zero concepts, so
// coverage falls back to "not verifiable from sources" until an educator authors
// sourced concepts. The production (attestation) gate rejects empty rubrics, so
// scaffolds cannot be promoted to APPROVED unchanged.

function scaffoldTopic(topicId: string, title: string): object {
  // Compact derived IDs so long curriculum topicIds stay within the 63-char
  // kebabId limit. Authored topics keep the longer "-guided-recall-v1" form.
  const vid = `${topicId}-v1`;
  const rub = `r-${vid}`;
  return {
    topicId,
    title,
    variants: [
      {
        variantId: vid,
        challengePreset: "GUIDED",
        difficultyProfileVersion: "difficulty-profile/1.0",
        blueprint: "explain-concept",
        promptId: `p-${vid}`,
        mode: "RECALL_SPRINT",
        supportLevel: "FULL",
        wording:
          "Explain " +
          title.charAt(0).toLowerCase() + title.slice(1) +
          " as it applies to physiotherapy practice — key assessment reasoning, management principles, and safety considerations within scope.",
        answerArc: ["frame", "explain", "apply"],
        timePolicy: { preparationSeconds: 30, speakingSeconds: 120 },
        caseRef: null,
        followUpRefs: [],
        rubricId: rub,
      },
    ],
    rubrics: [
      {
        rubricId: rub,
        variantId: vid,
        register: "EXAMINER",
        concepts: [],
      },
    ],
    cases: [],
    followUps: [],
  };
}

function scaffoldTopics(pairs: ReadonlyArray<readonly [string, string]>): object[] {
  return pairs.map(([id, title]) => scaffoldTopic(id, title));
}

// Subject 1 — Research Methods and Bioethics (32 scaffold topics)
const rmbScaffolds: ReadonlyArray<readonly [string, string]> = [
  ["rmb-helsinki-ethics", "Helsinki Declaration & ethical issues in physiotherapy"],
  ["rmb-rights-responsibilities-pwd-act", "Rights & responsibilities of physiotherapist and client; PWD Act; rules & regulations"],
  ["rmb-wcpt-who-roles-standards", "Roles of the physiotherapist per WCPT/WHO; standards for practice"],
  ["rmb-administration-management", "Administration & management in physiotherapy"],
  ["rmb-education-curriculum-teaching", "Education, curricular planning, teaching technology & clinical teaching"],
  ["rmb-icf-documentation-future-challenges", "Documentation using ICF & future challenges in physiotherapy"],
  ["rmb-introduction-to-research", "Introduction to research"],
  ["rmb-types-of-research-question", "Types of research & defining a research question"],
  ["rmb-qualitative-study-designs", "Qualitative study designs (grounded theory, phenomenological methods)"],
  ["rmb-delphi-process", "Delphi process"],
  ["rmb-quantitative-study-designs", "Quantitative study designs"],
  ["rmb-type-i-type-ii-bias", "Type I and Type II bias"],
  ["rmb-study-design-rct-cohort", "Study design (case study, case series, cohort, pre-post, time series, RCT)"],
  ["rmb-sampling-sample-size", "Sampling design & minimum sample-size calculation"],
  ["rmb-measurement-properties-reliability-validity", "Measurement properties (reliability, validity, responsiveness, MCID)"],
  ["rmb-outcome-measures-rehabilitation-research", "Outcome measures in rehabilitation research"],
  ["rmb-designing-methodology-reporting", "Research methods — designing methodology & reporting results"],
  ["rmb-communicating-research", "Communicating research"],
  ["rmb-scientific-writing", "Scientific writing (paper, review, thesis; APA/MLA; citation & references)"],
  ["rmb-report-writing-abstract-presentation", "Report writing, abstract preparation, oral & poster presentation"],
  ["rmb-introduction-to-biostatistics", "Introduction to biostatistics; sources & presentation of data"],
  ["rmb-measures-location-variability-normal-distribution", "Measures of location & variability; normal distribution & curve"],
  ["rmb-sampling-probability-significance", "Sampling, probability, sampling variability & significance"],
  ["rmb-significance-difference-in-means", "Significance of difference in means (small & large sample)"],
  ["rmb-t-test-statistical-inference", "Statistical inference; T-test (comparison of group means)"],
  ["rmb-analysis-of-variance", "Analysis of variance"],
  ["rmb-multiple-comparison-nonparametric-tests", "Multiple comparison tests; non-parametric tests"],
  ["rmb-correlation-regression", "Correlation & regression"],
  ["rmb-chi-square-frequencies", "Analysis of frequencies — chi-square"],
  ["rmb-statistical-measure-reliability", "Statistical measure of reliability"],
  ["rmb-power-analysis-sample-size", "Power analysis & determining sample size"],
  ["rmb-measures-of-population-incidence-prevalence", "Measures of population (rate, ratio, proportion, incidence, prevalence, relative risk, odds ratio)"],
];

// Subject 2 — Applied Physiotherapeutics (35 scaffold topics)
const papScaffolds: ReadonlyArray<readonly [string, string]> = [
  ["pap-exercise-physiology-nutrition-intro", "Introduction to exercise physiology (body composition, nutrition, caloric balance)"],
  ["pap-energy-transfer-expenditure", "Sources of energy, energy transfer & energy expenditure at rest and activity"],
  ["pap-physiologic-support-systems-activity", "Physiologic support systems & physical activity (cardio-pulmonary, neuromuscular, hormonal)"],
  ["pap-responses-adaptations-exercise", "Responses & adaptations of various systems to exercise and training"],
  ["pap-endurance-strength-assessment-training", "Assessment & training for endurance and strength (anaerobic & aerobic power)"],
  ["pap-environmental-influence-performance", "Environmental influence on performance"],
  ["pap-exercise-prescription-health-fitness", "Exercise prescription for health & fitness; age & sex considerations"],
  ["pap-fatigue-assessment-management", "Fatigue — assessment & management"],
  ["pap-radiological-imaging-investigations", "Radiological investigations & imaging (MRI, X-ray) across systems"],
  ["pap-ecg-pulmonary-function-tests", "ECG & pulmonary function tests"],
  ["pap-anthropometric-measurements", "Anthropometric measurements"],
  ["pap-physical-fitness-assessment", "Physical fitness assessment (body composition, ETT, field test, 6MWT, strength, balance)"],
  ["pap-effect-exercise-muscle-cardiopulmonary", "Effect of aerobic/anaerobic/isometric/isotonic/isokinetic exercise on muscle & cardio-pulmonary function"],
  ["pap-sdc-emg-ncv-biofeedback", "S-D curve, EMG, NCV interpretation & biofeedback"],
  ["pap-disability-evaluation-diagnosis", "Physical disability evaluation & disability diagnosis"],
  ["pap-posture-gait-analysis", "Posture & gait analysis"],
  ["pap-pain-neurobiology-management", "Pain — neurobiology, theories, assessment, modulation & management"],
  ["pap-medications-effect-activity", "Effect of medications on activity performance"],
  ["pap-physiotherapy-health-stress-management", "Physiotherapy for health & stress management"],
  ["pap-cpr-monitoring-defibrillators-respirators", "CPR, monitoring systems, defibrillators & artificial respirators"],
  ["pap-physiotherapy-modalities-techniques-approaches", "Physiotherapy modalities, techniques & approaches"],
  ["pap-aging-changes-management", "Aging — physiological changes & physiotherapy management"],
  ["pap-aids-appliances-adaptive-devices", "Aids & appliances, adaptive functional devices for movement dysfunction"],
  ["pap-physiotherapy-disaster-management", "Physiotherapy in disaster management"],
  ["pap-yoga-integration-health-promotion", "Integration of yoga in physiotherapy for health promotion"],
  ["pap-aquatic-therapy", "Aquatic therapy (properties of water, hydrodynamics, immersion physiology)"],
  ["pap-clinical-decision-making-physiotherapeutics", "Clinical decision making in physiotherapeutics"],
  ["pap-screening-subjective-examination", "Screening & evaluation — subjective examination"],
  ["pap-pain-evaluation-scales", "Pain evaluation — subjective & objective assessment; pain measurement scales"],
  ["pap-general-survey-physical-examination", "General survey & physical examination techniques; regional & systems-review screening"],
  ["pap-screening-cardiovascular-respiratory", "Screening & evaluation for cardiovascular & respiratory disease"],
  ["pap-screening-cancer", "Screening & evaluation for cancer"],
  ["pap-screening-head-cervical-thoracic-lumbosacral", "Screening & evaluation of head, cervical, thoracic & lumbosacral region"],
  ["pap-screening-upper-lower-quadrant", "Screening & evaluation of upper & lower quadrant"],
  ["pap-icf-rehabilitation-assessment-management", "ICF-based rehabilitation assessment & management"],
];

// Subject 3 — Musculoskeletal Physiotherapy (50 scaffold topics)
const mskScaffolds: ReadonlyArray<readonly [string, string]> = [
  ["msk-shoulder-complex-biomechanics", "Shoulder complex biomechanics & pathomechanics"],
  ["msk-elbow-complex-biomechanics", "Elbow complex biomechanics & pathomechanics"],
  ["msk-wrist-complex-biomechanics", "Wrist complex biomechanics & pathomechanics"],
  ["msk-cervical-thoracic-biomechanics", "Cervical & thoracic complex biomechanics & pathomechanics"],
  ["msk-shoulder-pathophysiology-features", "Shoulder complex pathophysiology & clinical features"],
  ["msk-elbow-wrist-pathophysiology-features", "Elbow & wrist complex pathophysiology & clinical features"],
  ["msk-cervical-thoracic-pathophysiology-features", "Cervical & thoracic complex pathophysiology & clinical features"],
  ["msk-shoulder-assessment-diagnostic", "Shoulder complex assessment & functional diagnostic procedures"],
  ["msk-elbow-assessment-diagnostic", "Elbow complex assessment & functional diagnostic procedures"],
  ["msk-wrist-assessment-diagnostic", "Wrist complex assessment & functional diagnostic procedures"],
  ["msk-cervical-thoracic-assessment-diagnostic", "Cervical & thoracic complex assessment & functional diagnostic procedures"],
  ["msk-pediatric-upper-quadrant-management", "Pediatric upper-quadrant dysfunctions management"],
  ["msk-adult-upper-quadrant-management", "Adult upper-quadrant dysfunctions management"],
  ["msk-geriatric-upper-quadrant-management", "Geriatric upper-quadrant dysfunctions management"],
  ["msk-traumatic-upper-quadrant-perioperative", "Traumatic upper-quadrant conditions & perioperative physiotherapy"],
  ["msk-non-traumatic-upper-quadrant-perioperative", "Non-traumatic upper-quadrant conditions & perioperative physiotherapy"],
  ["msk-manual-therapy-upper-reasoning", "Manual therapy techniques & clinical reasoning (McKenzie, Maitland, Cyriax, Mulligan, Kaltenborn)"],
  ["msk-myofascial-muscle-energy-neurodynamics-taping-upper", "Myofascial release, muscle energy, neurodynamics, taping (upper quadrant)"],
  ["msk-assistive-devices-upper", "Assistive devices for stability & mobility (upper quadrant)"],
  ["msk-ebp-upper-quadrant", "Evidence-based practice in upper quadrant"],
  ["msk-integumentary-upper-quadrant", "Integumentary impairments in upper quadrant"],
  ["msk-upper-with-lower-quadrant-decisions", "Clinical decisions for lower-quadrant function with upper-quadrant dysfunction"],
  ["msk-hand-rehab-soft-tissue", "Hand rehabilitation — soft-tissue injuries; sensory & motor re-education"],
  ["msk-hand-rehab-deformities-orthotics", "Hand rehabilitation — congenital & acquired deformities; orthotics; recent advances"],
  ["msk-hip-complex-biomechanics", "Hip complex biomechanics & pathomechanics"],
  ["msk-knee-complex-biomechanics", "Knee complex biomechanics & pathomechanics"],
  ["msk-ankle-complex-biomechanics", "Ankle complex biomechanics & pathomechanics"],
  ["msk-lumbosacral-biomechanics", "Lumbo-sacral complex biomechanics & pathomechanics"],
  ["msk-hip-pathophysiology-features", "Hip complex pathophysiology & clinical features"],
  ["msk-knee-ankle-pathophysiology-features", "Knee & ankle complex pathophysiology & clinical features"],
  ["msk-lumbosacral-pathophysiology-features", "Lumbo-sacral complex pathophysiology & clinical features"],
  ["msk-hip-assessment-diagnostic", "Hip complex assessment & functional diagnostic procedures"],
  ["msk-knee-assessment-diagnostic", "Knee complex assessment & functional diagnostic procedures"],
  ["msk-ankle-assessment-diagnostic", "Ankle complex assessment & functional diagnostic procedures"],
  ["msk-lumbosacral-assessment-diagnostic", "Lumbo-sacral complex assessment & functional diagnostic procedures"],
  ["msk-pediatric-lower-quadrant-management", "Pediatric lower-quadrant dysfunctions management"],
  ["msk-adult-lower-quadrant-management", "Adult lower-quadrant dysfunctions management"],
  ["msk-geriatric-lower-quadrant-management", "Geriatric lower-quadrant dysfunctions management"],
  ["msk-traumatic-lower-quadrant-perioperative", "Traumatic lower-quadrant conditions & perioperative physiotherapy"],
  ["msk-non-traumatic-lower-quadrant-perioperative", "Non-traumatic lower-quadrant conditions & perioperative physiotherapy"],
  ["msk-manual-therapy-lower-reasoning", "Manual therapy techniques & clinical reasoning (lower quadrant)"],
  ["msk-myofascial-muscle-energy-neurodynamics-taping-lower", "Myofascial release, muscle energy, neurodynamics, taping (lower quadrant)"],
  ["msk-assistive-devices-lower", "Assistive devices for stability & mobility (lower quadrant)"],
  ["msk-ebp-lower-quadrant", "Evidence-based practice in lower quadrant"],
  ["msk-integumentary-lower-quadrant", "Integumentary impairments in lower quadrant"],
  ["msk-lower-with-upper-quadrant-decisions", "Clinical decisions for upper-quadrant function with lower-quadrant dysfunction"],
  ["msk-sports-philosophy-physiology-psychology-pharmacology", "Sports philosophy, physiology, psychology & pharmacology"],
  ["msk-sports-biomechanics-injuries", "Biomechanics & pathomechanics of common sports & sports injuries"],
  ["msk-sport-injury-prevention-rehabilitation", "Sport injury — prevention, diagnosis, treatment & rehabilitation"],
  ["msk-gait-rehabilitation", "Gait rehabilitation"],
];

// Subject 4 — Neuro Physiotherapy: the remaining 19 curriculum topics. These
// criteria stay deliberately conservative and within physiotherapy scope; the
// educator worksheet must be signed before the pack can become APPROVED.
const neuroAdditionalTopics: TopicSeed[] = [
  {
    topicId: "neu-embryology-nervous-system",
    title: "Embryology of the nervous system; principles of human development",
    prompt:
      "Explain the clinically relevant development of the nervous system and how developmental history informs—but does not replace—a pediatric physiotherapy assessment.",
    concepts: [
      c("Relate neurulation and neural-tube formation to development of the central nervous system", ["neurulation", "neural tube", "central nervous system development"], ["campbell-pt-children-2023", "umphred-neuro-rehab-2025"]),
      c("Distinguish central nervous system development from neural-crest contributions to peripheral structures", ["neural crest", "peripheral nervous system development", "central and peripheral development"], ["campbell-pt-children-2023"]),
      c("Use prenatal, perinatal, and developmental history alongside current function rather than inferring a diagnosis from history alone", ["prenatal and perinatal history", "developmental history", "not diagnostic alone"], ["campbell-pt-children-2023", "umphred-neuro-rehab-2025"]),
    ],
  },
  {
    topicId: "neu-gross-fine-motor-development-assessment",
    title: "Gross & fine motor development; assessment & testing of infant and child",
    prompt:
      "Explain how to assess gross and fine motor development using developmental surveillance, standardized measures, observation, and the child's family and functional context.",
    concepts: [
      c("Assess the developmental trajectory across motor and related domains, not a single milestone in isolation", ["developmental trajectory", "multiple developmental domains", "not one milestone alone"], ["cdc-developmental-milestones-2026", "campbell-pt-children-2023"]),
      c("Combine standardized age-appropriate measurement with observation of movement quality, activity, and participation", ["standardized assessment", "movement quality", "activity and participation"], ["campbell-pt-children-2023"]),
      c("Treat milestone checklists as surveillance aids rather than diagnostic or validated screening instruments and refer concerns for formal assessment", ["surveillance aid", "not diagnostic", "refer for formal screening"], ["cdc-developmental-milestones-2026"]),
    ],
  },
  {
    topicId: "neu-developmental-reflexes",
    title: "Developmental reflexes (primitive, spinal, brainstem, cortical)",
    prompt:
      "Explain how primitive and postural responses are examined in developmental assessment and why their presence, absence, asymmetry, or persistence must be interpreted in context.",
    concepts: [
      c("Describe primitive and postural responses as one part of the developing motor-control system", ["primitive reflexes", "postural reactions", "developing motor control"], ["campbell-pt-children-2023", "shumway-cook-motor-control-2023"]),
      c("Observe response quality, symmetry, and age-related integration rather than recording presence alone", ["response quality", "symmetry", "age-related integration"], ["campbell-pt-children-2023"]),
      c("Integrate reflex findings with tone, voluntary movement, function, and standardized assessment; do not diagnose from a reflex in isolation", ["integrate with voluntary movement", "functional assessment", "not diagnostic alone"], ["campbell-pt-children-2023", "umphred-neuro-rehab-2025"]),
    ],
  },
  {
    topicId: "neu-motor-development-control-learning-theories",
    title: "Theories of motor development, motor control & motor learning; stages of learning",
    prompt:
      "Compare major motor-control and motor-learning perspectives and show how task, learner, environment, practice, and feedback shape a physiotherapy plan.",
    concepts: [
      c("Use a systems perspective in which movement emerges from interaction among the person, task, and environment", ["person task environment", "systems perspective", "movement emerges from interaction"], ["shumway-cook-motor-control-2023"]),
      c("Match practice structure and feedback to the learner's stage, goals, and task demands", ["practice structure", "feedback schedule", "stage of learning"], ["shumway-cook-motor-control-2023"]),
      c("Prioritize meaningful task-specific repetition and transfer to real contexts while monitoring performance and retention", ["task-specific repetition", "retention and transfer", "meaningful practice"], ["shumway-cook-motor-control-2023", "umphred-neuro-rehab-2025"]),
    ],
  },
  {
    topicId: "neu-early-identification-intervention-pediatric",
    title: "Early identification & early intervention in pediatric neurological disorders",
    prompt:
      "Explain a pathway for early identification and early intervention when cerebral palsy or another pediatric neurological disorder is suspected.",
    concepts: [
      c("Use converging history, standardized neurological or movement assessment, and neuroimaging where clinically indicated rather than a wait-and-see approach", ["standardized neurological assessment", "general movements assessment", "do not wait and see"], ["aacpdm-early-cp-detection"]),
      c("Communicate risk sensitively and refer promptly to the appropriate diagnostic and multidisciplinary pathway", ["communicate risk sensitively", "prompt referral", "multidisciplinary pathway"], ["aacpdm-early-cp-detection", "morgan-early-cp-intervention-2021"]),
      c("Begin goal-directed, active, task-specific, family-supported intervention for infants at high risk while monitoring development", ["goal-directed intervention", "active task-specific practice", "family-supported early intervention"], ["morgan-early-cp-intervention-2021"]),
    ],
  },
  {
    topicId: "neu-infant-high-risk-developmental-delay",
    title: "Infant at high risk for developmental delay",
    prompt:
      "Explain physiotherapy assessment, surveillance, and family-supported intervention for an infant at high risk of developmental delay.",
    concepts: [
      c("Identify relevant antenatal, perinatal, neonatal, medical, and environmental risk information", ["antenatal and perinatal risk", "neonatal history", "environmental risk"], ["campbell-pt-children-2023", "apta-pediatrics-resources-2026"]),
      c("Use repeated standardized assessment and observation of spontaneous movement and function, not milestones alone", ["longitudinal standardized assessment", "spontaneous movement", "not milestones alone"], ["aacpdm-early-cp-detection", "campbell-pt-children-2023"]),
      c("Coach caregivers in safe, active, goal-directed opportunities embedded in daily routines and coordinate early referral", ["caregiver coaching", "daily routines", "early referral"], ["morgan-early-cp-intervention-2021"]),
    ],
  },
  {
    topicId: "neu-spina-bifida",
    title: "Spina bifida",
    prompt:
      "Explain physiotherapy assessment and lifespan mobility management for spina bifida, including skin, musculoskeletal, equipment, participation, and escalation concerns.",
    concepts: [
      c("Relate neurological level, strength, range, alignment, sensation, and developmental status to functional mobility", ["neurological level", "strength range and alignment", "functional mobility"], ["spina-bifida-mobility-guideline", "campbell-pt-children-2023"]),
      c("Plan individualized mobility, positioning, skin protection, orthotic, wheelchair, and physical-activity support with regular reassessment", ["skin protection", "orthotic and wheelchair", "individualized mobility"], ["spina-bifida-mobility-guideline", "who-wheelchair-provision-2023"]),
      c("Coordinate multidisciplinary surveillance and urgently escalate new neurological loss, shunt concerns, skin breakdown, or suspected tethered cord", ["multidisciplinary surveillance", "shunt concern", "tethered cord or skin breakdown"], ["spina-bifida-mobility-guideline", "cns-pediatric-hydrocephalus-2020"]),
    ],
  },
  {
    topicId: "neu-pediatric-tbi-sci",
    title: "Pediatric traumatic brain injury & traumatic/non-traumatic spinal cord injury",
    prompt:
      "Explain staged physiotherapy management for pediatric brain or spinal cord injury from acute safety through rehabilitation and participation.",
    concepts: [
      c("Confirm medical and neurological stability, precautions, and team-defined physiological limits before mobilization in acute severe injury", ["medical stability", "neurological precautions", "team-defined limits"], ["btf-pediatric-severe-tbi", "campbell-pt-children-2023"]),
      c("Perform serial age-appropriate assessment of motor, sensory, respiratory, cognitive, functional, and participation needs", ["serial assessment", "motor sensory and respiratory", "function and participation"], ["campbell-pt-children-2023", "umphred-neuro-rehab-2025"]),
      c("Progress positioning, mobility, task practice, equipment, education, and participation goals while preventing secondary complications", ["prevent secondary complications", "progress mobility", "family education and participation"], ["campbell-pt-children-2023", "umphred-neuro-rehab-2025"]),
    ],
  },
  {
    topicId: "neu-down-syndrome-intellectual-disability",
    title: "Intellectual disabilities — Down syndrome",
    prompt:
      "Explain a strengths-based physiotherapy assessment and management plan for a child or adolescent with Down syndrome.",
    concepts: [
      c("Assess motor development, strength, balance, endurance, joint mobility, activity, and participation rather than assuming limitations from diagnosis", ["motor and functional assessment", "strength balance endurance", "individual assessment"], ["aap-down-syndrome-2022", "campbell-pt-children-2023"]),
      c("Use active, goal-directed practice and physical-activity support adapted to communication, learning, and family priorities", ["active goal-directed practice", "physical activity", "family priorities"], ["aap-down-syndrome-2022", "campbell-pt-children-2023"]),
      c("Coordinate health surveillance and screen for symptoms or precautions that require medical review before higher-risk activity", ["health surveillance", "medical review before risk", "cervical or cardiac symptoms"], ["aap-down-syndrome-2022"]),
    ],
  },
  {
    topicId: "neu-autism-spectrum-physical-therapy",
    title: "Autism spectrum disorder & physical therapy",
    prompt:
      "Explain the appropriate role of physiotherapy for an autistic child, focusing on motor function, physical activity, access, participation, and individualized support.",
    concepts: [
      c("Assess and address identified movement, coordination, balance, fitness, mobility, or participation needs rather than treating autism itself", ["motor and participation needs", "physical activity access", "not treating autism itself"], ["nice-cg170-autism-under-19", "campbell-pt-children-2023"]),
      c("Adapt communication, predictability, environment, and sensory demands with the child and family's preferences", ["adapt communication", "predictable environment", "sensory preferences"], ["nice-cg170-autism-under-19"]),
      c("Set functional multidisciplinary goals and avoid unsupported claims that physiotherapy cures core autistic characteristics", ["functional goals", "multidisciplinary support", "avoid cure claims"], ["nice-cg170-autism-under-19"]),
    ],
  },
  {
    topicId: "neu-parent-education-family-centred-care",
    title: "Parent education & counselling; family-centred care",
    prompt:
      "Explain family-centred pediatric physiotherapy, including shared decisions, caregiver coaching, daily routines, consent, and sustainable goals.",
    concepts: [
      c("Treat the child and family as partners and use shared decisions based on their priorities, culture, resources, and expertise", ["family partnership", "shared decision making", "family priorities and culture"], ["campbell-pt-children-2023", "morgan-early-cp-intervention-2021"]),
      c("Coach safe, active practice in meaningful daily routines instead of prescribing an unsustainable volume of passive handling", ["caregiver coaching", "meaningful daily routines", "active practice"], ["morgan-early-cp-intervention-2021"]),
      c("Agree measurable participation goals, check understanding and burden, and revise the plan as the child and context change", ["measurable participation goals", "check family burden", "reassess and revise"], ["campbell-pt-children-2023"]),
    ],
  },
  {
    topicId: "neu-radiology-evoked-potentials",
    title: "Pathological & radiological investigations; evoked potentials",
    prompt:
      "Explain how a physiotherapist uses reports from neuroimaging, electrodiagnostic studies, and evoked potentials within clinical reasoning and professional scope.",
    concepts: [
      c("State the clinical question and understand that imaging describes structure while electrodiagnostic and evoked-potential tests assess aspects of pathway function", ["imaging structure", "evoked potential pathway function", "clinical question"], ["umphred-neuro-rehab-2025", "campbell-pt-children-2023"]),
      c("Use the formal report and appropriate specialist interpretation; physiotherapists do not independently diagnose from raw investigations outside competence", ["formal report", "specialist interpretation", "within competence"], ["umphred-neuro-rehab-2025"]),
      c("Integrate investigation findings with history, examination, function, and change over time rather than treating a test as a stand-alone answer", ["integrate with clinical examination", "function over time", "not a stand-alone test"], ["umphred-neuro-rehab-2025", "aacpdm-early-cp-detection"]),
    ],
  },
  {
    topicId: "neu-neuropediatric-surgical-perioperative",
    title: "Surgical procedures in neuropediatric disorders (hydrocephalus, spina bifida) & perioperative PT",
    prompt:
      "Explain the physiotherapy role around neurosurgical care for pediatric hydrocephalus or spina bifida, including baseline function, precautions, recovery, and escalation.",
    concepts: [
      c("Define diagnosis, procedure, medical stability, positioning, wound, device, and activity precautions with the neurosurgical team", ["neurosurgical precautions", "medical stability", "wound and device precautions"], ["cns-pediatric-hydrocephalus-2020", "spina-bifida-mobility-guideline"]),
      c("Document preoperative function and, when cleared, progress respiratory care, positioning, transfers, mobility, equipment, and family education", ["preoperative baseline", "progress mobility when cleared", "family education"], ["campbell-pt-children-2023", "spina-bifida-mobility-guideline"]),
      c("Stop and urgently escalate neurological deterioration, suspected shunt malfunction or infection, wound problems, or other acute instability", ["shunt malfunction or infection", "neurological deterioration", "urgent escalation"], ["cns-pediatric-hydrocephalus-2020"]),
    ],
  },
  {
    topicId: "neu-classic-approaches-pnf-ndt-rood-vojta-mrp",
    title: "Advanced physiotherapy approaches (PNF, NDT, Rood's, Motor Relearning Program, Vojta)",
    prompt:
      "Critically compare PNF, NDT/Bobath, Rood, Vojta, and Motor Relearning approaches with contemporary task-specific motor-learning practice.",
    concepts: [
      c("Describe named approaches as historical or clinical frameworks with distinct handling, facilitation, or task-practice assumptions", ["named clinical frameworks", "facilitation and handling", "task-practice assumptions"], ["umphred-neuro-rehab-2025", "shumway-cook-motor-control-2023"]),
      c("Do not claim that one named approach is universally superior; prioritize active, goal-directed, task-specific, sufficiently dosed practice", ["no universal superiority", "active goal-directed practice", "task-specific sufficient dose"], ["shumway-cook-motor-control-2023", "morgan-early-cp-intervention-2021", "aha-asa-stroke-rehab-2016"]),
      c("Select components by goal, evidence, child or adult response, preference, feasibility, and measured outcomes while stating uncertainty", ["select components by goal", "measured outcomes", "state evidence uncertainty"], ["umphred-neuro-rehab-2025", "shumway-cook-motor-control-2023"]),
    ],
  },
  {
    topicId: "neu-pediatric-clinical-decision-ebp",
    title: "Clinical decision making & evidence-based practice (pediatric)",
    prompt:
      "Explain an evidence-based pediatric physiotherapy decision from assessment and goal setting through intervention choice, outcome review, and plan revision.",
    concepts: [
      c("Integrate the best available evidence with clinical expertise and the child and family's values and circumstances", ["best available evidence", "clinical expertise", "child and family values"], ["campbell-pt-children-2023"]),
      c("Form a functional problem list, agree participation-focused goals, and choose valid age- and condition-appropriate outcomes", ["functional problem list", "participation goals", "appropriate outcome measures"], ["campbell-pt-children-2023", "morgan-early-cp-intervention-2021"]),
      c("Balance benefit, harm, burden, access, and feasibility; measure response and revise or escalate when progress or safety differs from expectation", ["benefit harm and burden", "measure response", "revise or escalate"], ["campbell-pt-children-2023"]),
    ],
  },
  {
    topicId: "neu-neonatal-pediatric-icu",
    title: "Physiotherapy in neonatal & pediatric intensive care units",
    prompt:
      "Explain safe physiotherapy assessment and intervention in neonatal and pediatric intensive care, including readiness, monitoring, developmental care, family partnership, and stop criteria.",
    concepts: [
      c("Confirm indication, medical stability, respiratory and neurological status, lines or devices, precautions, and team-defined readiness before intervention", ["medical stability and readiness", "lines and devices", "team-defined precautions"], ["apta-pediatrics-resources-2026", "campbell-pt-children-2023"]),
      c("Individualize positioning, handling, respiratory support within scope, developmental activity, and early mobility to tolerance", ["individualized positioning", "developmental care", "early mobility to tolerance"], ["apta-pediatrics-resources-2026", "campbell-pt-children-2023"]),
      c("Use continuous observation and relevant monitoring, minimize stress, involve caregivers, and stop or escalate for instability or distress", ["monitor physiological response", "minimize stress", "stop for instability"], ["apta-pediatrics-resources-2026"]),
    ],
  },
  {
    topicId: "neu-pediatric-social-integration-orthotics-legislation",
    title: "Social integration of children (school/community, assistive technology, legislation, orthotics/prosthetics)",
    prompt:
      "Explain a participation-led plan for school and community inclusion using environmental change, assistive technology, mobility equipment, and orthotic or prosthetic services.",
    concepts: [
      c("Begin with the child's participation goals and identify personal, task, environmental, access, and attitudinal barriers with the family and school", ["participation goals", "environmental barriers", "family and school collaboration"], ["campbell-pt-children-2023", "apta-pediatrics-resources-2026"]),
      c("Select assistive technology, seating, mobility, orthotic, or prosthetic options through assessment, shared choice, fitting, training, and follow-up", ["assistive technology assessment", "fitting and training", "follow-up"], ["who-wheelchair-provision-2023", "campbell-pt-children-2023"]),
      c("Document functional need and reasonable supports, coordinate with relevant local education and disability processes, and review real-world participation", ["document functional need", "education and disability supports", "review participation"], ["apta-pediatrics-resources-2026", "who-wheelchair-provision-2023"]),
    ],
  },
  {
    topicId: "neu-pediatric-pharmacotherapeutics",
    title: "Pharmacotherapeutics in pediatric neurological conditions",
    prompt:
      "Explain how medication information affects pediatric neurological physiotherapy assessment, timing, monitoring, and multidisciplinary communication without crossing prescribing scope.",
    concepts: [
      c("Reconcile the prescribed indication, schedule, recent change, expected functional effect, and relevant adverse effects without independently prescribing or altering medication", ["medication reconciliation", "functional effect and adverse effects", "do not alter medication"], ["campbell-pt-children-2023", "nice-ng62-cerebral-palsy"]),
      c("Account for medication-related alertness, tone, pain, fatigue, seizure control, cardiovascular response, or therapy timing in assessment and treatment", ["alertness and tone", "seizure control", "therapy timing"], ["campbell-pt-children-2023", "nice-ng62-cerebral-palsy"]),
      c("Document observed response and promptly communicate suspected adverse effects, deterioration, or safety concerns to the prescribing team", ["document observed response", "communicate adverse effects", "prescribing team"], ["nice-ng62-cerebral-palsy"]),
    ],
  },
  {
    topicId: "neu-adult-space-occupying-tbi-vestibular-myopathies",
    title: "Space-occupying CNS lesions, TBI, vestibular disorders, myopathies (adult)",
    prompt:
      "Differentiate physiotherapy priorities for adults with a space-occupying CNS lesion, traumatic brain injury, peripheral vestibular hypofunction, or myopathy.",
    concepts: [
      c("For a CNS lesion or brain injury, establish medical and neurological stability, precautions, impairments, cognition, function, and red flags before graded rehabilitation", ["neurological stability", "cognitive and functional assessment", "red flags before rehabilitation"], ["umphred-neuro-rehab-2025"]),
      c("For diagnosed peripheral vestibular hypofunction, use individualized gaze-stability, habituation where indicated, balance, and walking exercise with reassessment", ["gaze stability exercise", "balance and gait exercise", "vestibular reassessment"], ["apta-vestibular-hypofunction-2022"]),
      c("For myopathy, grade activity to disease, weakness, fatigue, respiratory or cardiac involvement, goals, and recovery while avoiding unsupported one-size-fits-all dosing", ["fatigue-aware graded activity", "respiratory and cardiac involvement", "individualized exercise dose"], ["umphred-neuro-rehab-2025"]),
    ],
  },
];

// The six newly enumerated cardiorespiratory curriculum entries are authored
// here; the original 20 topic seeds above remain semantically unchanged.
const respiratoryAdditionalTopics: TopicSeed[] = [
  {
    topicId: "respiratory-anatomy-physiology-embryology",
    title: "Anatomy, physiology, biomechanics, pathomechanics & embryology of respiratory system & thorax",
    prompt:
      "Explain how respiratory anatomy, ventilatory mechanics, gas exchange, and developmental or structural variation inform physiotherapy assessment without replacing diagnosis.",
    concepts: [
      c("Relate thoracic, diaphragmatic, airway, and lung mechanics to ventilation and work of breathing", ["diaphragm and thoracic mechanics", "ventilation", "work of breathing"], ["src-ers-ats-pft-2022", "src-gold-2026"]),
      c("Connect ventilation, perfusion, diffusion, and gas exchange to oxygenation and carbon-dioxide findings in clinical context", ["ventilation perfusion", "diffusion and gas exchange", "oxygenation and carbon dioxide"], ["src-ats-abg", "src-ers-ats-pft-2022"]),
      c("Integrate developmental or structural history with symptoms, observation, examination, and investigations rather than inferring a diagnosis from anatomy alone", ["developmental and structural history", "integrated assessment", "not anatomy alone"], ["src-curriculum", "src-ers-ats-pft-2022"]),
    ],
  },
  {
    topicId: "respiratory-perioperative-surgical-procedures",
    title: "Surgical procedures (thoracotomy, pleurodesis, lobectomy, pneumonectomy, VATS, transplantation) & perioperative PT",
    prompt:
      "Explain a safe perioperative physiotherapy pathway for major thoracic surgery from preoperative risk and education through monitored recovery and rehabilitation.",
    concepts: [
      c("Establish procedure, baseline function, respiratory risk, goals, and surgeon or team precautions before prescribing intervention", ["procedure and baseline function", "respiratory risk", "team precautions"], ["src-curriculum", "src-ats-pulmonary-rehab-2023"]),
      c("When medically cleared, use individualized breathing or airway-clearance strategies when indicated, positioning, functional exercise, and early mobility with physiological monitoring", ["airway clearance when indicated", "early mobility", "physiological monitoring"], ["src-sccm-padis-2025", "src-ats-pulmonary-rehab-2023"]),
      c("Coordinate pain, drains, oxygen, complications, discharge education, and longer-term rehabilitation with the surgical and multidisciplinary team", ["pain and drain precautions", "multidisciplinary coordination", "discharge and rehabilitation"], ["src-curriculum", "src-sccm-padis-2025"]),
    ],
  },
];

const cardiovascularAdditionalTopics: TopicSeed[] = [
  {
    topicId: "cardiovascular-anatomy-physiology-embryology",
    title: "Anatomy, physiology & embryology of cardiovascular system",
    prompt:
      "Explain the cardiovascular anatomy and physiology most relevant to exercise response, monitoring, and physiotherapy clinical reasoning.",
    concepts: [
      c("Relate chamber, valve, coronary, and vascular structure to circulation and functional demand", ["cardiac chambers and valves", "coronary and vascular structure", "circulation"], ["src-curriculum", "src-acsm-getp-2025"]),
      c("Explain cardiac output as heart rate times stroke volume and connect preload, afterload, contractility, and vascular resistance to exercise response", ["cardiac output", "heart rate times stroke volume", "preload afterload contractility"], ["src-acsm-getp-2025"]),
      c("Use developmental or structural information with diagnosis, symptoms, medication, and measured response rather than as a stand-alone exercise decision", ["developmental or structural information", "clinical context", "measured exercise response"], ["src-curriculum", "src-acsm-getp-2025"]),
    ],
  },
  {
    topicId: "cardiovascular-risk-stratification-health-promotion",
    title: "Health & performance principles, risk stratification, prevention & health promotion",
    prompt:
      "Explain cardiovascular screening and risk stratification before exercise and how findings shape prevention, health promotion, prescription, supervision, and referral.",
    concepts: [
      c("Start with the clinical purpose, symptoms, diagnosis, recent events, medications, comorbidity, activity, and relevant cardiovascular risk factors", ["clinical purpose and symptoms", "medications and comorbidity", "cardiovascular risk factors"], ["src-acsm-getp-2025", "src-bacpr-2023"]),
      c("Use findings to decide readiness, test selection, monitoring, supervision, and whether medical clarification is needed", ["exercise readiness", "monitoring and supervision", "medical clarification"], ["src-acsm-getp-2025"]),
      c("Co-produce an individualized physical-activity and risk-factor plan with behavior support, safety-netting, and outcome review", ["individualized physical activity", "risk-factor management", "behavior support and review"], ["src-bacpr-2023", "src-acsm-getp-2025"]),
    ],
  },
  {
    topicId: "cardiovascular-advanced-life-support",
    title: "Basic & advanced life support",
    prompt:
      "Explain how a physiotherapist responds to adult cardiac arrest, distinguishing universal basic life support actions from credentialed advanced-life-support team roles.",
    concepts: [
      c("Recognize cardiac arrest, activate the emergency response, begin high-quality CPR, and use an AED promptly", ["recognize cardiac arrest", "high-quality CPR", "prompt AED"], ["src-aha-bls-2025"]),
      c("Minimize interruptions and work within a coordinated resuscitation team using current local protocols and certified training", ["minimize interruptions", "resuscitation team", "certified training"], ["src-aha-bls-2025", "aha-adult-als-2025"]),
      c("Describe advanced airway, rhythm, medication, and reversible-cause decisions as credentialed advanced-life-support responsibilities rather than unsupervised physiotherapy actions", ["advanced life support roles", "reversible causes", "within credentials and protocol"], ["aha-adult-als-2025"]),
    ],
  },
  {
    topicId: "cardiovascular-iccu-monitoring-hyperbaric",
    title: "PT management in ICCU — monitoring, ventilator, hyperbaric oxygen therapy",
    prompt:
      "Explain physiotherapy decision-making in an intensive cardiac care setting, including readiness, monitoring, ventilator coordination, mobility, and the limited role of hyperbaric oxygen therapy.",
    concepts: [
      c("Confirm indication, hemodynamic and respiratory stability, lines or devices, medications, precautions, and team-defined readiness before intervention", ["hemodynamic stability", "lines and devices", "team-defined readiness"], ["src-aha-acs-2025", "src-sccm-padis-2025"]),
      c("Coordinate ventilator-related care and graded mobility with the critical-care team while monitoring symptoms and physiological response and using explicit stop criteria", ["ventilator coordination", "graded mobility", "monitoring and stop criteria"], ["src-ats-accp-weaning-2017", "src-sccm-padis-2025"]),
      c("Recognize hyperbaric oxygen as a specialist medical treatment for specific accepted indications, not a routine physiotherapy modality, and follow facility safety procedures", ["specialist medical treatment", "not routine physiotherapy", "accepted indications and safety"], ["fda-hyperbaric-oxygen-2021"]),
    ],
  },
];

// Subject 6 — Community Health Physiotherapy (53 scaffold topics)
const comScaffolds: ReadonlyArray<readonly [string, string]> = [
  ["com-legal-issues-rehabilitation-acts", "Legal issues — national & international (WHO) rehabilitation acts & implementation"],
  ["com-health-delivery-system-india", "Health delivery system in India — health & illness; levels of healthcare"],
  ["com-fitness-training-health-promotion-community", "Fitness training for health promotion in community"],
  ["com-basic-concepts-rehabilitation-institute-based", "Basic concepts of rehabilitation; institute-based rehabilitation; multidisciplinary approach"],
  ["com-community-based-rehabilitation", "Community-based rehabilitation (CBR) — methodology, spectrum, govt/NGO roles"],
  ["com-role-community-physiotherapist", "Role of community physiotherapist (national/state institutes, district rehabilitation centre, PHC)"],
  ["com-legislation-laws-disability-un", "Legislation & laws for persons with disability (national & UN); public awareness"],
  ["com-disability-evaluation-icf-rehabilitation", "Disability evaluation per ICF (MSK, neurological, cardio-respiratory) & rehabilitation of disabled"],
  ["com-appropriate-technology-assistive-devices", "Appropriate technology & assistive devices for stability & mobility"],
  ["com-home-exercise-msk", "Home exercise programs — musculoskeletal conditions (arthritis, chronic pain, burn, degenerative)"],
  ["com-home-exercise-neurological", "Home exercise programs — neurological conditions (SCI, TBI, stroke, Parkinson's)"],
  ["com-home-exercise-cardiorespiratory", "Home exercise programs — cardiorespiratory conditions (amputation, heart & pulmonary disease)"],
  ["com-physical-fitness-yoga-stress-management", "Physical fitness, yoga & psychosomatic approaches (meditation) for stress management"],
  ["com-geriatric-physiology-ageing", "Physiology of ageing; factors affecting ageing"],
  ["com-geriatric-theories-aging", "Theories of aging"],
  ["com-geriatric-medicine-surgery", "Geriatric medicine & geriatric surgery"],
  ["com-geriatric-common-diseases", "Common diseases affecting the elderly"],
  ["com-geriatric-assessment", "Assessment of geriatric conditions"],
  ["com-geriatric-rehabilitation-exercise-prescription", "Geriatric rehabilitation — exercise prescription in geriatrics"],
  ["com-geriatric-nutrition", "Nutrition in geriatric health"],
  ["com-geriatric-falls-prevention", "Falls in geriatrics & fall-prevention programme; incontinence, balance; home/workplace modification"],
  ["com-geriatric-psychosocial-safety", "Psychosocial & safety issues in the elderly"],
  ["com-geriatric-services", "Services for the elderly"],
  ["com-geriatric-recent-advances", "Recent advances in geriatric physical therapy"],
  ["com-geriatric-posture-gait", "Posture & gait evaluation & management in the elderly"],
  ["com-geriatric-successful-aging", "Successful aging"],
  ["com-geriatric-holistic-physiotherapy", "Holistic physiotherapy for the elderly"],
  ["com-geriatric-ebp", "Evidence-based practice in geriatrics"],
  ["com-womens-reproductive-health-pregnancy", "Women's reproductive health care; physiology of pregnancy; assessment of common discomforts"],
  ["com-womens-antenatal-care-exercise", "Antenatal care & exercise prescription"],
  ["com-womens-pregnancy-complications", "Pregnancy-induced complications (cardiac, vascular, respiratory, neurologic)"],
  ["com-womens-labour-pain-relief", "Labour — pain mechanism & relief; physical therapy for pain during labour"],
  ["com-womens-postpartum-care", "Postpartum care; post-natal exercises"],
  ["com-womens-caesarean-section-management", "Caesarean section & physiotherapy management"],
  ["com-womens-neonate-handling-kangaroo-care", "Neonate handling education (kangaroo care)"],
  ["com-womens-gynaecologic-conditions-pt", "Common gynaecologic conditions & PT management (PID, incontinence, prolapse, PCOD)"],
  ["com-womens-gynaecologic-surgery-pt", "Common surgical interventions (hysterectomy, laparotomy) & PT management"],
  ["com-womens-msk-childbearing-year", "Musculoskeletal pain & dysfunction in the childbearing year"],
  ["com-womens-recent-advances", "Recent advances in women's health"],
  ["com-womens-menopause-climacteric", "Menopause (climacteric) — anatomical, physiological, psychological & cardiovascular changes"],
  ["com-womens-cancer-rehab-osteoporosis", "Cancer rehabilitation (breast & reproductive organs); osteoporosis, falls & fractures in postmenopausal women"],
  ["com-womens-exercise-prescription-postmenopausal", "Exercise prescription for postmenopausal women"],
  ["com-womens-exercise-testing-female-athletes", "Exercise testing & prescription in female athletes"],
  ["com-industrial-occupational-health-stress-hazards", "Occupational health, occupational stress, hazards, industrial hygiene, vulnerable worker groups"],
  ["com-industrial-therapy-worker-assessment", "Industrial therapy — traditional medical model vs worker-care spectrum; assessment of worker"],
  ["com-industrial-injury-prevention-ergonomics-screening", "Injury prevention — ergonomics, job analysis, pre-employment screening; employee fitness"],
  ["com-industrial-return-to-work-fce", "Returning to work — functional capacity evaluation, job simulation, work conditioning & hardening"],
  ["com-industrial-workplace-injuries-cumulative-trauma", "Workplace injuries — design, repetitive motion & cumulative trauma disorders"],
  ["com-industrial-ergonomics-principles-application", "Ergonomics — principles & application to job/workstation design and redesign"],
  ["com-industrial-recent-advances", "Recent advances in industrial therapy"],
  ["com-industrial-pt-role-preventive-rehabilitative", "Physiotherapy role in industry — preventive, intervention, ergonomic & rehabilitative"],
  ["com-industrial-ergonomics-hand-tools-lifting", "Ergonomics of hand tools, posture, material handling & lifting"],
  ["com-community-ebp-cross-cutting", "Evidence-based practice in community health (cross-cutting)"],
];

// Subject 7 — Sports Physiotherapy (34 scaffold topics)
const sprScaffolds: ReadonlyArray<readonly [string, string]> = [
  ["spr-introduction-sports-sciences", "Introduction to sports sciences"],
  ["spr-exercise-physiology-sports-context", "Introduction to exercise physiology (sports context)"],
  ["spr-cricket-football-basketball-hockey", "Cricket, football, basketball & hockey — terminology, methodology, rules, equipment"],
  ["spr-tennis-track-field-aquatic", "Tennis, track & field, aquatic sports — terminology, methodology, rules, equipment"],
  ["spr-assessment-diagnosis-sports-injuries", "Assessment & diagnosis of sports injuries"],
  ["spr-sports-specific-fitness", "Sports-specific fitness (cricket, football, track & field, aquatic)"],
  ["spr-sports-biomechanics-injury", "Principles of sports biomechanics & biomechanics of injury"],
  ["spr-physics-running-throwing-swimming-jumping", "Physics in sports — biomechanics of running, throwing, swimming & jumping"],
  ["spr-advanced-cardiorespiratory-strength-testing", "Advanced cardio-respiratory exercise physiology; strength training; fitness & strength testing"],
  ["spr-sports-conditioning-agility-equipment", "Sports-specific conditioning & agility training; sports equipment"],
  ["spr-psychological-aspects-sports", "Psychological aspects in sports (grief/loss models, cognitive stress & emotional response)"],
  ["spr-doping-performance-enhancing-drugs", "Doping & performance-enhancing drugs"],
  ["spr-protective-equipment-orthotics-traumatology", "Protective equipment in sports incl. orthotics; sports traumatology"],
  ["spr-investigations-imaging-sports-injuries", "Principles of investigations & imaging in sports injuries"],
  ["spr-soft-tissue-injuries-lower-limb", "Tissue healing & soft-tissue injuries of lower limb (hip, thigh, knee, leg, ankle)"],
  ["spr-soft-tissue-injuries-upper-limb", "Tissue healing & soft-tissue injuries of upper limb (shoulder, elbow, forearm, wrist, hand)"],
  ["spr-fractures-dislocations-spinal-injuries", "Common fractures & dislocations; spinal injuries in sports"],
  ["spr-overuse-injuries-sports", "Overuse injuries in sports"],
  ["spr-special-populations-female-pediatric-elderly", "Sports-specific problems in female, pediatric & elderly athletes"],
  ["spr-on-field-assessment-injury-prevention", "On-field assessment & decision making; injury prevention in sports"],
  ["spr-sports-injury-management-principles", "Principles of sports injury management"],
  ["spr-sports-psychology-training", "Specific psychology management in sports; sports-specific training"],
  ["spr-advanced-sports-assessment-acute-management", "Advanced sports assessment skills; initial management of acute sports injuries"],
  ["spr-surgical-management-rehab-arthroscopy", "Surgical management & rehabilitation (incl. arthroscopic surgery) for sports injuries"],
  ["spr-injury-specific-overuse-management", "Injury & sports-specific management; management of overuse injuries"],
  ["spr-electrotherapy-sports-rehabilitation", "Electrotherapy in sports rehabilitation; rehabilitation of sports injuries"],
  ["spr-manual-therapy-sports-peripheral", "Manual therapy techniques in sports (McKenzie, Maitland, Cyriax, Mulligan, positional release)"],
  ["spr-manual-therapy-sports-myofascial-neurodynamics", "Manual therapy in sports — myofascial release, muscle energy, neurodynamics"],
  ["spr-msk-screening-athletes-season", "Musculoskeletal screening of athletes (pre-season, in-season, post-season)"],
  ["spr-sports-special-populations-challenged", "Sports management of special populations (geriatric, physically challenged athletes)"],
  ["spr-taping-advances-sports-rehabilitation", "Taping techniques & recent advances in sports rehabilitation"],
  ["spr-diet-sports-carbohydrate-loading", "Diet & sports (pre-session diet, pre-game meal, carbohydrate loading, high-fat/high-protein diet)"],
  ["spr-ebp-sports-return-to-sports", "Evidence-based sports rehabilitation & return-to-sports criteria"],
  ["spr-female-athletes-menstrual-preventive", "Problems in female athletes; menstrual synchrony; preventive strategies"],
];

const subjects: SubjectSeed[] = [
  {
    subjectId: "research-methods-and-bioethics",
    title: "Research Methods and Bioethics",
    availability: "COMING_SOON",
    topics: [],
  },
  {
    subjectId: "applied-physiotherapeutics",
    title: "Applied Physiotherapeutics",
    availability: "COMING_SOON",
    topics: [],
  },
  {
    subjectId: "musculoskeletal-physiotherapy",
    title: "Musculoskeletal Physiotherapy",
    availability: "COMING_SOON",
    topics: [],
  },
  {
    subjectId: "neuro-physiotherapy",
    title: "Neuro Physiotherapy",
    availability: "ACTIVE",
    topics: [...neuroTopics, ...neuroAdditionalTopics],
  },
  {
    subjectId: "respiratory-physiotherapy",
    title: "Respiratory Physiotherapy",
    availability: "ACTIVE",
    topics: [...respiratoryTopics, ...respiratoryAdditionalTopics],
  },
  {
    subjectId: "cardiovascular-physiotherapy",
    title: "Cardiovascular Physiotherapy",
    availability: "ACTIVE",
    topics: [...cardiovascularTopics, ...cardiovascularAdditionalTopics],
  },
  {
    subjectId: "community-health-physiotherapy",
    title: "Community Health Physiotherapy",
    availability: "COMING_SOON",
    topics: [],
  },
  {
    subjectId: "sports-physiotherapy",
    title: "Sports Physiotherapy",
    availability: "COMING_SOON",
    topics: [],
  },
];

function variantId(topicId: string, kind: string): string {
  return boundedId(topicId, kind, "v1");
}

/** Keep stable readable IDs where possible and add a deterministic suffix only
 * when a derived identifier would exceed the schema's 64-character bound. */
function boundedId(...parts: string[]): string {
  const value = parts.join("-");
  if (value.length <= 64) return value;
  const digest = createHash("sha256").update(value).digest("hex").slice(0, 10);
  return `${value.slice(0, 53).replace(/-+$/u, "")}-${digest}`;
}

function rubric(
  topicId: string,
  kind: string,
  concepts: ConceptSeed[],
): object {
  const id = variantId(topicId, kind);
  return {
    rubricId: boundedId("rubric", id),
    variantId: id,
    register: "EXAMINER",
    concepts: concepts.map((concept, index) => ({
      conceptId: boundedId(topicId, kind, "c" + (index + 1)),
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
    promptId: boundedId("prompt", variantId(topic.topicId, kind)),
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
    rubricId: boundedId("rubric", variantId(topic.topicId, kind)),
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
    const caseId = boundedId(topic.topicId, "case", "v1");
    const probeId = boundedId(topic.topicId, "probe", "v1");
    const updateId = boundedId(topic.topicId, "evidence", "v1");
    const appliedKind = "applied-recall";
    const vivaKind = "viva-recall";

    variants.push({
      variantId: variantId(topic.topicId, appliedKind),
      challengePreset: "APPLIED",
      difficultyProfileVersion: "difficulty-profile/1.0",
      blueprint: "manage-case",
      promptId: boundedId("prompt", variantId(topic.topicId, appliedKind)),
      mode: "RECALL_SPRINT",
      supportLevel: "FULL",
      wording: topic.trio.appliedPrompt,
      answerArc: ["summarize", "prioritize", "plan"],
      timePolicy: { preparationSeconds: 60, speakingSeconds: 180 },
      caseRef: caseId,
      followUpRefs: [probeId],
      rubricId: boundedId("rubric", variantId(topic.topicId, appliedKind)),
    });
    variants.push({
      variantId: variantId(topic.topicId, vivaKind),
      challengePreset: "VIVA",
      difficultyProfileVersion: "difficulty-profile/1.0",
      blueprint: "defend-evidence",
      promptId: boundedId("prompt", variantId(topic.topicId, vivaKind)),
      mode: "RECALL_SPRINT",
      supportLevel: "FULL",
      wording: topic.trio.vivaPrompt,
      answerArc: ["prioritize", "defend", "safety-net"],
      timePolicy: { preparationSeconds: 45, speakingSeconds: 210 },
      caseRef: caseId,
      followUpRefs: [probeId, updateId],
      rubricId: boundedId("rubric", variantId(topic.topicId, vivaKind)),
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
    ...(topic.viva
      ? {
          vivaQuestions: topic.viva.map((question, index) => ({
            id: boundedId(topic.topicId, "viva", `q${index + 1}`),
            level: question.level,
            prompt: question.prompt,
            targetConceptIds: question.targetConceptIds,
          })),
        }
      : {}),
  };
}

const pack = {
  schemaVersion: "1.0",
  contentKind: "MEDICAL",
  packId: "mpt-cardiorespiratory-review-candidate",
  version: "0.3.0",
  title: "MPT Competency-Based Curriculum — educator review candidate",
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
  subjects: subjects.map((subject) => {
    const scaffoldsBySubject: Record<string, ReadonlyArray<readonly [string, string]>> = {
      "research-methods-and-bioethics": rmbScaffolds,
      "applied-physiotherapeutics": papScaffolds,
      "musculoskeletal-physiotherapy": mskScaffolds,
      "community-health-physiotherapy": comScaffolds,
      "sports-physiotherapy": sprScaffolds,
    };
    const authored = subject.topics.map(buildTopic);
    const scaffolds = scaffoldTopics(scaffoldsBySubject[subject.subjectId] ?? []);
    return {
      subjectId: subject.subjectId,
      title: subject.title,
      availability: subject.availability,
      topics: [...authored, ...scaffolds],
    };
  }),
};

const out = resolve(
  __dirname,
  "../../../content/candidates/mpt-cardiorespiratory-review-candidate.json",
);
mkdirSync(dirname(out), { recursive: true });
// Minified to stay within the 512 KiB pack byte budget (265 topics).
const serialized = JSON.stringify(pack) + "\n";
if (process.argv.includes("--check")) {
  if (readFileSync(out, "utf8") !== serialized) {
    throw new Error("medical candidate is stale; run pnpm candidate:medical:generate");
  }
} else {
  writeFileSync(out, serialized, "utf8");
}

const topicCount = pack.subjects.reduce((sum, subject) => sum + subject.topics.length, 0);
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
