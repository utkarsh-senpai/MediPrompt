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
const SPORTS_RESEARCH_ACCESSED_AT = "2026-09-02";

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
  // --- v0.8 sports physiotherapy sources (verified 2026-09-02) ---
  {
    sourceId: "wada-prohibited-list-2026",
    citation:
      "World Anti-Doping Agency. The Prohibited List (2026 List, effective 1 January 2026). Montreal: WADA.",
    url: "https://www.wada-ama.org/en/what-we-do/the-prohibited-list",
    accessedAt: ACCESSED_AT,
  },
  {
    sourceId: "wada-istue-2026",
    citation:
      "World Anti-Doping Agency. International Standard for Therapeutic Use Exemptions (ISTUE). Mandatory International Standard; in-force resource published 19 Dec 2025.",
    url: "https://www.wada-ama.org/en/resources/world-anti-doping-code-and-international-standards/international-standard-therapeutic-use",
    accessedAt: SPORTS_RESEARCH_ACCESSED_AT,
  },
  {
    sourceId: "ioc-epidemiology-consensus-2020",
    citation:
      "Bahr R, Clarsen B, Derman W, Dvorak J, Emery CA, et al. IOC consensus statement: methods for recording and reporting of epidemiological data on injury and illness in sport 2020 (STROBE-SIIS). Orthop J Sports Med. 2020;8(2):2325967120902908. doi:10.1177/2325967120902908.",
    url: "https://doi.org/10.1177/2325967120902908",
    accessedAt: ACCESSED_AT,
  },
  {
    sourceId: "amsterdam-2022-concussion",
    citation:
      "Patricios JS, Schneider KJ, Dvorak J, et al. Consensus statement on concussion in sport: the 6th International Conference on Concussion in Sport-Amsterdam, October 2022. Br J Sports Med. 2023;57(11):695-711. doi:10.1136/bjsports-2023-106898. PMID:37316210.",
    url: "https://pubmed.ncbi.nlm.nih.gov/37316210/",
    accessedAt: ACCESSED_AT,
  },
  {
    sourceId: "nordic-hamstring-meta-2019",
    citation:
      "van Dyk N, Behan FP, Whiteley R. Nordic hamstring exercise in injury prevention programmes halves the rate of hamstring injuries: systematic review and meta-analysis of 8459 athletes. Br J Sports Med. 2019;53(21):1362-1370. doi:10.1136/bjsports-2018-100045.",
    url: "https://doi.org/10.1136/bjsports-2018-100045",
    accessedAt: ACCESSED_AT,
  },
  {
    sourceId: "ioc-reds-consensus-2023",
    citation:
      "Mountjoy M, Ackerman KE, et al. 2023 IOC consensus statement on Relative Energy Deficiency in Sport (REDs). Br J Sports Med. 2023;57(17):1073-1098. doi:10.1136/bjsports-2023-106994.",
    url: "https://doi.org/10.1136/bjsports-2023-106994",
    accessedAt: ACCESSED_AT,
  },
  {
    sourceId: "ioc-reds-cat2-2023",
    citation:
      "Mountjoy M, Ackerman KE, Stellingwerff T, et al. IOC REDs CAT2 clinical assessment tool. Br J Sports Med. 2023;57(17):1068-1069. doi:10.1136/bjsports-2023-107549.",
    url: "https://doi.org/10.1136/bjsports-2023-107549",
    accessedAt: ACCESSED_AT,
  },
  {
    sourceId: "ioc-manual-sports-injuries",
    citation:
      "Caine D, Caine C, Lindner K (eds). IOC Manual of Sports Injuries. Chichester: Wiley-Blackwell; 2012. ISBN 978-0-470-67495-5. doi:10.1002/9781118467947.",
    url: "https://doi.org/10.1002/9781118467947",
    accessedAt: ACCESSED_AT,
  },
  {
    sourceId: "cochrane-kt-rotator-cuff-2021",
    citation:
      "Gianola S, et al. Kinesio taping for rotator cuff disease. Cochrane Database Syst Rev. 2021;(8):CD012720. doi:10.1002/14651858.CD012720.pub2.",
    url: "https://doi.org/10.1002/14651858.CD012720.pub2",
    accessedAt: ACCESSED_AT,
  },
  {
    sourceId: "wikstrom-ankle-rts-2020",
    citation:
      "Wikstrom EA, Mueller C, Cain MS. Lack of consensus on return-to-sport criteria following lateral ankle sprain: systematic review of expert opinions. J Sport Rehabil. 2020;29(2):231-237. doi:10.1123/jsr.2019-0038.",
    url: "https://doi.org/10.1123/jsr.2019-0038",
    accessedAt: ACCESSED_AT,
  },
  {
    sourceId: "acsm-getp-12th-2025",
    citation:
      "American College of Sports Medicine. ACSM's Guidelines for Exercise Testing and Prescription, 12th ed. Philadelphia: Wolters Kluwer; 2025. ISBN 9781975219215.",
    url: "https://doi.org/10.1249/FIT.0000000000001036",
    accessedAt: ACCESSED_AT,
  },
  {
    sourceId: "welling-acl-rts-2024",
    citation:
      "Welling W. Return to sports after an ACL reconstruction in 2024 - A glass half full? A narrative review. Phys Ther Sport. 2024;69:51-59. doi:10.1016/j.ptsp.2024.05.001.",
    url: "https://doi.org/10.1016/j.ptsp.2024.05.001",
    accessedAt: ACCESSED_AT,
  },
  {
    sourceId: "src-curriculum-sports",
    citation:
      "DMIHER. Competency-Based Post Graduate Curriculum for Indian Physiotherapy PG: Sports Physiotherapy, Papers III and IV, 2022-2027, PDF pp. 187-196; recommended references pp. 205-208.",
    url: "https://dmiher.edu.in/lp/Educlass",
    accessedAt: SPORTS_RESEARCH_ACCESSED_AT,
  },
  {
    sourceId: "nsca-sport-science-2022",
    citation:
      "French D, Torres Ronda L, eds. NSCA's Essentials of Sport Science. Human Kinetics; 2022. ISBN 9781492593355.",
    url: "https://us.humankinetics.com/products/nscas-essentials-of-sport-science",
    accessedAt: SPORTS_RESEARCH_ACCESSED_AT,
  },
  {
    sourceId: "mcginnis-biomechanics-4e",
    citation:
      "McGinnis PM. Biomechanics of Sport and Exercise. 4th ed. Human Kinetics. ISBN 9781492592334. Foundational mechanics source; current rules and clinical decisions require separate current sources.",
    url: "https://us.humankinetics.com/products/biomechanics-of-sport-and-exercise-4th-edition-with-web-resource",
    accessedAt: SPORTS_RESEARCH_ACCESSED_AT,
  },
  {
    sourceId: "icc-playing-conditions-2026",
    citation:
      "International Cricket Council. Official international playing conditions and regulations portal, including 2025-2026 competition documents.",
    url: "https://www.icc-cricket.com/about/cricket/rules-and-regulations/playing-conditions",
    accessedAt: SPORTS_RESEARCH_ACCESSED_AT,
  },
  {
    sourceId: "ifab-laws-2026-27",
    citation:
      "International Football Association Board. Laws of the Game 2026/27. Current official association-football rules portal.",
    url: "https://www.theifab.com/laws-of-the-game-documents",
    accessedAt: SPORTS_RESEARCH_ACCESSED_AT,
  },
  {
    sourceId: "fiba-rules-current",
    citation:
      "FIBA. Official Basketball Rules portal. Use the edition in force for the event; the 2026 edition takes effect 1 October 2026.",
    url: "https://about.fiba.basketball/en/our-sport/official-basketball-rules",
    accessedAt: SPORTS_RESEARCH_ACCESSED_AT,
  },
  {
    sourceId: "fih-rules-2026",
    citation:
      "International Hockey Federation. Rules of Hockey 2026, effective March 2026, with current protective-equipment resources.",
    url: "https://www.fih.hockey/about-fih/official-documents/rules-of-hockey",
    accessedAt: SPORTS_RESEARCH_ACCESSED_AT,
  },
  {
    sourceId: "itf-rules-2026",
    citation:
      "International Tennis Federation. 2026 Rules of Tennis and current tour regulations.",
    url: "https://www.itftennis.com/en/about-us/governance/rules-and-regulations",
    accessedAt: SPORTS_RESEARCH_ACCESSED_AT,
  },
  {
    sourceId: "world-athletics-rules-current",
    citation:
      "World Athletics. Constitution, Book of Rules, technical rules, and current competition regulations portal.",
    url: "https://worldathletics.org/about-iaaf/documents/book-of-rules",
    accessedAt: SPORTS_RESEARCH_ACCESSED_AT,
  },
  {
    sourceId: "world-aquatics-rules-current",
    citation:
      "World Aquatics. Current Competition Regulations and discipline-specific rules portal.",
    url: "https://www.worldaquatics.com/rules/competition-regulations",
    accessedAt: SPORTS_RESEARCH_ACCESSED_AT,
  },
  {
    sourceId: "ioc-mental-health-2026",
    citation:
      "Reardon CL et al. Mental health in elite athletes: International Olympic Committee consensus statement (2026). Br J Sports Med. 2026;60:1083-1130. doi:10.1136/bjsports-2025-111514.",
    url: "https://doi.org/10.1136/bjsports-2025-111514",
    accessedAt: SPORTS_RESEARCH_ACCESSED_AT,
  },
  {
    sourceId: "sport-injury-psychology-consensus-2024",
    citation:
      "Tranaeus U et al. 50 Years of Research on the Psychology of Sport Injury: A Consensus Statement. Sports Med. 2024;54:1733-1748. doi:10.1007/s40279-024-02045-w.",
    url: "https://doi.org/10.1007/s40279-024-02045-w",
    accessedAt: SPORTS_RESEARCH_ACCESSED_AT,
  },
  {
    sourceId: "manual-therapy-sports-clinical-reasoning-2023",
    citation:
      "Short S, Tuttle N. A Clinically-Reasoned Approach to Manual Therapy in Sports Physical Therapy. Int J Sports Phys Ther. 2023;18(1):262-278. doi:10.26603/001c.67936.",
    url: "https://doi.org/10.26603/001c.67936",
    accessedAt: SPORTS_RESEARCH_ACCESSED_AT,
  },
  {
    sourceId: "manual-therapy-mechanisms-2025",
    citation:
      "Keter DL et al. The mechanisms of manual therapy: a living review of systematic, narrative, and scoping reviews. PLoS One. 2025;20:e0319586. doi:10.1371/journal.pone.0319586.",
    url: "https://doi.org/10.1371/journal.pone.0319586",
    accessedAt: SPORTS_RESEARCH_ACCESSED_AT,
  },
  {
    sourceId: "para-athlete-sports-physio-2021",
    citation:
      "Fagher K et al. Sports physiotherapy—Actions to optimize the health of Para athletes. Int J Sports Phys Ther. 2021;16:1376-1378. doi:10.26603/001c.29910.",
    url: "https://doi.org/10.26603/001c.29910",
    accessedAt: SPORTS_RESEARCH_ACCESSED_AT,
  },
  {
    sourceId: "ioc-fair-2025",
    citation:
      "Crossley KM et al. Female/woman/girl Athlete Injury pRevention (FAIR) practical recommendations: IOC consensus meeting 2025. Br J Sports Med. 2025;59:1546-1559. doi:10.1136/bjsports-2025-110889.",
    url: "https://doi.org/10.1136/bjsports-2025-110889",
    accessedAt: SPORTS_RESEARCH_ACCESSED_AT,
  },
  {
    sourceId: "ioc-elite-youth-athletes-2024",
    citation:
      "Bergeron MF, Cote J, Erdener U, et al. IOC consensus statement on elite youth athletes competing at the Olympic Games: essentials to a healthy, safe and sustainable paradigm. Br J Sports Med. 2024;58(17):946-965. doi:10.1136/bjsports-2024-108186. PMID:39197945.",
    url: "https://pubmed.ncbi.nlm.nih.gov/39197945/",
    accessedAt: SPORTS_RESEARCH_ACCESSED_AT,
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

// --- v0.9 neuro physiotherapy catalog ---
// Topic labels are loaded from a standalone catalog so additions and deletions
// do not require editing this generator. Optional prompt/concept fields let a
// later content PR add source-grounded coverage without changing generator code.


interface NeuroCatalogTopic {
  topicId: string;
  label: string;
  prompt?: string;
  concepts: ConceptSeed[];
}

interface NeuroCatalogSection {
  sectionId: string;
  titlePrefix: string;
  topics: NeuroCatalogTopic[];
}

interface NeuroCatalog {
  subjectId: string;
  version: string;
  sourceDocument: string;
  expectedTopicCount: number;
  sections: NeuroCatalogSection[];
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`neuro catalog ${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function requireText(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() !== value || value.length === 0) {
    throw new Error(`neuro catalog ${label} must be non-empty trimmed text`);
  }
  return value;
}

function requireTextArray(value: unknown, label: string): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`neuro catalog ${label} must be a non-empty array`);
  }
  return value.map((item, index) => requireText(item, `${label} item ${index + 1}`));
}

function loadNeuroCatalog(): NeuroCatalog {
  const catalogPath = resolve(
    __dirname,
    "../../../content/catalogs/neuro-physiotherapy-topics.json",
  );
  const raw = requireRecord(
    JSON.parse(readFileSync(catalogPath, "utf8")) as unknown,
    "root",
  );
  const subjectId = requireText(raw["subjectId"], "subjectId");
  const version = requireText(raw["version"], "version");
  const sourceDocument = requireText(raw["sourceDocument"], "sourceDocument");
  const expectedTopicCount = raw["expectedTopicCount"];
  if (!Number.isSafeInteger(expectedTopicCount) || (expectedTopicCount as number) < 1) {
    throw new Error("neuro catalog expectedTopicCount must be a positive integer");
  }
  if (!Array.isArray(raw["sections"]) || raw["sections"].length === 0) {
    throw new Error("neuro catalog sections must be a non-empty array");
  }

  const sections = raw["sections"].map((value, sectionIndex) => {
    const section = requireRecord(value, `section ${sectionIndex + 1}`);
    const sectionId = requireText(
      section["sectionId"],
      `section ${sectionIndex + 1} sectionId`,
    );
    const titlePrefix = requireText(
      section["titlePrefix"],
      `section ${sectionIndex + 1} titlePrefix`,
    );
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(sectionId)) {
      throw new Error(`neuro catalog invalid sectionId: ${sectionId}`);
    }
    if (titlePrefix.includes("—")) {
      throw new Error(`neuro catalog titlePrefix must not contain an em dash: ${titlePrefix}`);
    }
    if (!Array.isArray(section["topics"]) || section["topics"].length === 0) {
      throw new Error(`neuro catalog section ${sectionId} must contain topics`);
    }
    const topics = section["topics"].map((topicValue, topicIndex) => {
      const topic = requireRecord(
        topicValue,
        `section ${sectionId} topic ${topicIndex + 1}`,
      );
      const topicId = requireText(
        topic["topicId"],
        `section ${sectionId} topic ${topicIndex + 1} topicId`,
      );
      const label = requireText(
        topic["label"],
        `section ${sectionId} topic ${topicIndex + 1} label`,
      );
      const prompt =
        topic["prompt"] === undefined
          ? undefined
          : requireText(
              topic["prompt"],
              `section ${sectionId} topic ${topicIndex + 1} prompt`,
            );
      const conceptsValue = topic["concepts"];
      if (conceptsValue !== undefined && !Array.isArray(conceptsValue)) {
        throw new Error(
          `neuro catalog section ${sectionId} topic ${topicIndex + 1} concepts must be an array`,
        );
      }
      const concepts = (conceptsValue ?? []).map((conceptValue, conceptIndex) => {
        const concept = requireRecord(
          conceptValue,
          `section ${sectionId} topic ${topicIndex + 1} concept ${conceptIndex + 1}`,
        );
        return {
          label: requireText(
            concept["label"],
            `section ${sectionId} topic ${topicIndex + 1} concept ${conceptIndex + 1} label`,
          ),
          acceptedPhrases: requireTextArray(
            concept["acceptedPhrases"],
            `section ${sectionId} topic ${topicIndex + 1} concept ${conceptIndex + 1} acceptedPhrases`,
          ),
          sourceRefs: requireTextArray(
            concept["sourceRefs"],
            `section ${sectionId} topic ${topicIndex + 1} concept ${conceptIndex + 1} sourceRefs`,
          ),
        };
      });
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(topicId) || topicId.length > 63) {
        throw new Error(`neuro catalog invalid topicId: ${topicId}`);
      }
      if (label.includes("—")) {
        throw new Error(`neuro catalog label must not contain an em dash: ${label}`);
      }
      return { topicId, label, prompt, concepts };
    });
    return { sectionId, titlePrefix, topics };
  });

  return {
    subjectId,
    version,
    sourceDocument,
    expectedTopicCount: expectedTopicCount as number,
    sections,
  };
}

function neuroTopicSeeds(catalog: NeuroCatalog): TopicSeed[] {
  if (catalog.subjectId !== "neuro-physiotherapy") {
    throw new Error(`unexpected neuro catalog subjectId: ${catalog.subjectId}`);
  }
  const sectionIds = new Set<string>();
  const topicIds = new Set<string>();
  const titles = new Set<string>();
  const topics = catalog.sections.flatMap((section) => {
    if (sectionIds.has(section.sectionId)) {
      throw new Error(`duplicate neuro sectionId: ${section.sectionId}`);
    }
    sectionIds.add(section.sectionId);
    return section.topics.map((topic) => {
      const title = `${section.titlePrefix} — ${topic.label}`;
      if (topicIds.has(topic.topicId)) {
        throw new Error(`duplicate neuro topicId: ${topic.topicId}`);
      }
      if (titles.has(title)) {
        throw new Error(`duplicate neuro topic title: ${title}`);
      }
      topicIds.add(topic.topicId);
      titles.add(title);
      return {
        topicId: topic.topicId,
        title,
        prompt:
          topic.prompt ??
          `Speak about ${topic.label}. Organize your answer around what it is, ` +
            "why it matters, and its physiotherapy relevance.",
        concepts: topic.concepts,
      };
    });
  });
  if (topics.length !== catalog.expectedTopicCount) {
    throw new Error(
      `neuro catalog expected ${catalog.expectedTopicCount} topics, got ${topics.length}`,
    );
  }
  return topics;
}

const neuroCatalog = loadNeuroCatalog();
const neuroTopics: TopicSeed[] = neuroTopicSeeds(neuroCatalog);

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

// Subject 7 — Sports Physiotherapy
// v0.8: all 34 curriculum candidates are authored. Current 2025-26 sources
// are preferred where they exist; still-current consensus work, foundational
// texts, and official sport rules are identified honestly by publication date.
const sportsTopics: TopicSeed[] = [
  {
    topicId: "spr-exercise-physiology-sports-context",
    title: "Introduction to exercise physiology (sports context)",
    prompt:
      "Explain exercise physiology in a sports context — energy systems, training adaptation, and how they inform conditioning.",
    concepts: [
      c("Describe energy systems and training adaptation across strength and endurance demands", ["energy systems", "training adaptation", "strength and endurance"], ["acsm-getp-12th-2025"]),
      c("Use FITT-VP framing and preparticipation screening to justify fitness prescriptions", ["FITT-VP", "preparticipation screening", "fitness prescription"], ["acsm-getp-12th-2025"]),
    ],
  },
  {
    topicId: "spr-sports-specific-fitness",
    title: "Sports-specific fitness (cricket, football, track & field, aquatic)",
    prompt:
      "Explain how sport-specific fitness is assessed and trained across cricket, football, track & field, and aquatic sports.",
    concepts: [
      c("Assess sport-specific fitness components relevant to the sport's demands", ["sport-specific fitness", "fitness components", "sport demands"], ["nsca-sport-science-2022", "acsm-getp-12th-2025"]),
      c("Use a needs analysis and sport-appropriate testing to plan conditioning within physiotherapy scope", ["needs analysis", "sport-appropriate testing", "conditioning within scope"], ["nsca-sport-science-2022"]),
    ],
  },
  {
    topicId: "spr-advanced-cardiorespiratory-strength-testing",
    title: "Advanced cardio-respiratory exercise physiology; strength training; fitness & strength testing in sports",
    prompt:
      "Explain advanced cardio-respiratory exercise physiology and strength training, and how fitness and strength testing informs prescription in athletes.",
    concepts: [
      c("Integrate cardio-respiratory physiology with strength-training principles for athletic prescription", ["cardio-respiratory physiology", "strength training", "athletic prescription"], ["acsm-getp-12th-2025"]),
      c("Use fitness and strength testing to individualize training load", ["fitness and strength testing", "individualize training load", "testing to prescribe"], ["acsm-getp-12th-2025"]),
    ],
  },
  {
    topicId: "spr-sports-conditioning-agility-equipment",
    title: "Sports-specific conditioning & agility training; sports equipment",
    prompt:
      "Explain sports-specific conditioning and agility training, and the role of sports equipment in performance and safety.",
    concepts: [
      c("Combine sport-specific conditioning with agility training matched to a needs analysis of the sport's demands", ["sport-specific conditioning", "agility training", "needs analysis"], ["nsca-sport-science-2022"]),
      c("Relate sports equipment to performance, protection, fit, rules, and residual risk within scope", ["sports equipment", "fit and rules", "residual risk"], ["nsca-sport-science-2022", "ioc-manual-sports-injuries"]),
    ],
  },
  {
    topicId: "spr-assessment-diagnosis-sports-injuries",
    title: "Assessment & diagnosis of sports injuries",
    prompt:
      "Explain a structured assessment and diagnosis of a sports injury, from mechanism and examination to a within-scope problem formulation.",
    concepts: [
      c("Take a mechanism, history, and examination to reach a within-scope problem formulation", ["mechanism and history", "examination", "within-scope problem formulation"], ["ioc-manual-sports-injuries", "ioc-epidemiology-consensus-2020"]),
      c("Recognise red flags and refer rather than independently diagnosing outside scope", ["red flags", "refer", "within scope"], ["ioc-manual-sports-injuries"]),
    ],
  },
  {
    topicId: "spr-investigations-imaging-sports-injuries",
    title: "Principles of investigations & imaging in sports injuries",
    prompt:
      "Explain how investigations and imaging are used in sports injuries, integrated with the clinical question and physiotherapy relevance.",
    concepts: [
      c("Select investigations and imaging according to the clinical question, not as isolated tests", ["investigations and imaging", "clinical question", "not isolated tests"], ["ioc-manual-sports-injuries", "ioc-epidemiology-consensus-2020"]),
      c("Interpret imaging alongside examination and mechanism rather than in isolation", ["interpret imaging", "examination and mechanism", "not in isolation"], ["ioc-manual-sports-injuries"]),
    ],
  },
  {
    topicId: "spr-soft-tissue-injuries-lower-limb",
    title: "Tissue healing & soft-tissue injuries of lower limb (hip, thigh, knee, leg, ankle)",
    prompt:
      "Explain tissue healing and soft-tissue injury management for the lower limb, integrating healing principles with sport-specific rehabilitation.",
    concepts: [
      c("Apply tissue-healing principles to lower-limb soft-tissue injury management", ["tissue healing", "soft-tissue injury management", "healing principles"], ["nordic-hamstring-meta-2019", "ioc-manual-sports-injuries"]),
      c("Use prospective surveillance and prevention evidence, not raw injury counts", ["prospective surveillance", "injury prevention evidence", "not raw counts"], ["ioc-epidemiology-consensus-2020", "nordic-hamstring-meta-2019"]),
      c("Base return-to-sport on functional performance and patient-reported function", ["return to sport", "functional performance", "patient-reported function"], ["wikstrom-ankle-rts-2020"]),
    ],
  },
  {
    topicId: "spr-soft-tissue-injuries-upper-limb",
    title: "Tissue healing & soft-tissue injuries of upper limb (shoulder, elbow, forearm, wrist, hand)",
    prompt:
      "Explain tissue healing and soft-tissue injury management for the upper limb, integrating healing principles with taping and rehabilitation evidence.",
    concepts: [
      c("Apply tissue-healing principles to upper-limb soft-tissue injury management", ["tissue healing", "upper-limb injury management", "healing principles"], ["ioc-manual-sports-injuries"]),
      c("If taping is trialled, define a functional or symptom goal, reassess response, and do not replace active rehabilitation; effects remain uncertain in the cited very-low-certainty evidence", ["taping trial and reassessment", "not a replacement for rehabilitation", "very low certainty and uncertain effects"], ["cochrane-kt-rotator-cuff-2021"]),
    ],
  },
  {
    topicId: "spr-fractures-dislocations-spinal-injuries",
    title: "Common fractures & dislocations; spinal injuries in sports",
    prompt:
      "Explain the assessment and within-scope management of fractures, dislocations, and spinal injuries in sport, including on-field decisions and referral.",
    concepts: [
      c("Recognise fractures, dislocations, and spinal injuries and apply on-field escalation", ["fractures and dislocations", "spinal injuries", "on-field escalation"], ["ioc-manual-sports-injuries"]),
      c("Refer limb-threatening or spinal red flags rather than independently managing outside scope", ["refer", "limb-threatening", "spinal red flags"], ["ioc-manual-sports-injuries"]),
    ],
  },
  {
    topicId: "spr-overuse-injuries-sports",
    title: "Overuse injuries in sports",
    prompt:
      "Explain overuse injuries in sport — mechanisms, risk factors, and prevention through load management and surveillance.",
    concepts: [
      c("Relate overuse mechanisms to training load and recovery, not to isolated pathology", ["overuse mechanisms", "training load", "recovery"], ["nordic-hamstring-meta-2019", "ioc-epidemiology-consensus-2020"]),
      c("Use prospective surveillance and load management to prevent overuse injury", ["prospective surveillance", "load management", "prevent overuse"], ["ioc-epidemiology-consensus-2020", "nordic-hamstring-meta-2019"]),
    ],
  },
  {
    topicId: "spr-special-populations-female-pediatric-elderly",
    title: "Sports-specific problems in female, pediatric & elderly athletes",
    prompt:
      "Explain sports-specific problems in female, pediatric, and elderly athletes, including energy availability and age-appropriate loading.",
    concepts: [
      c("For female athletes, consider sex- and gender-informed injury prevention, menstrual health, and low energy availability without reducing every presentation to REDs", ["sex and gender informed prevention", "menstrual health and energy availability", "not every presentation is REDs"], ["ioc-fair-2025", "ioc-reds-consensus-2023"]),
      c("For pediatric athletes, use a child-centred plan that accounts for growth, maturation, training exposure, recovery, psychosocial development, safeguarding, and long-term participation", ["child-centred plan", "growth maturation and recovery", "safeguarding and long-term participation"], ["ioc-elite-youth-athletes-2024"]),
      c("For older athletes, individualize screening, progressive loading, and recovery around training history, goals, comorbidity, medication, strength, balance, symptoms, and function rather than age alone", ["not age alone", "comorbidity medication and recovery", "individualized progressive loading"], ["acsm-getp-12th-2025"]),
    ],
  },
  {
    topicId: "spr-on-field-assessment-injury-prevention",
    title: "On-field assessment & decision making; injury prevention in sports",
    prompt:
      "Explain on-field assessment, decision making, and injury prevention in sport, including concussion recognition and graduated return.",
    concepts: [
      c("Apply the Amsterdam 2022 concussion standard: immediate removal and no same-day return to play", ["Amsterdam 2022 concussion standard", "immediate removal", "no same-day return"], ["amsterdam-2022-concussion"]),
      c("Use graduated return-to-sport and return-to-school protocols after a concussion", ["graduated return-to-sport", "return-to-school protocols", "graduated return"], ["amsterdam-2022-concussion"]),
      c("Base injury prevention on prospective surveillance rather than retrospective recall", ["prospective surveillance", "injury prevention", "not retrospective recall"], ["ioc-epidemiology-consensus-2020", "nordic-hamstring-meta-2019"]),
    ],
  },
  {
    topicId: "spr-doping-performance-enhancing-drugs",
    title: "Doping & performance-enhancing drugs",
    prompt:
      "Explain doping and performance-enhancing drugs in sport, including the WADA Prohibited List and the therapeutic use exemption framework.",
    concepts: [
      c("Cite the current (2026) WADA Prohibited List for in- and out-of-competition banned substances and methods", ["WADA Prohibited List", "banned substances", "prohibited methods"], ["wada-prohibited-list-2026"]),
      c("Explain that an athlete who needs a prohibited substance or method must follow the applicable anti-doping organization's TUE process and satisfy the ISTUE criteria; clinical need alone is not an automatic exemption", ["Therapeutic Use Exemption", "ISTUE criteria", "not an automatic exemption"], ["wada-istue-2026"]),
    ],
  },
  {
    topicId: "spr-sports-injury-management-principles",
    title: "Principles of sports injury management",
    prompt:
      "Explain the principles of sports injury management, from acute care through structured rehabilitation and return-to-sport decisions.",
    concepts: [
      c("Integrate acute care, rehabilitation, and return-to-sport within a structured pathway", ["acute care", "rehabilitation", "return-to-sport pathway"], ["ioc-manual-sports-injuries"]),
      c("Separate physiotherapy scope from medical decisions about surgery and return clearance", ["physiotherapy scope", "medical decisions", "surgery and return clearance"], ["ioc-manual-sports-injuries"]),
    ],
  },
  {
    topicId: "spr-surgical-management-rehab-arthroscopy",
    title: "Surgical management & rehabilitation (incl. arthroscopic surgery) for sports injuries",
    prompt:
      "Explain physiotherapy around surgical management and arthroscopy for sports injuries, from preoperative optimization through rehabilitation and return-to-sport.",
    concepts: [
      c("Assess and optimize modifiable functional risks and engage the person before surgery", ["preoperative assessment", "optimize functional risks", "engage before surgery"], ["ioc-manual-sports-injuries"]),
      c("Coordinate postoperative rehabilitation within surgical and team-defined safety limits", ["postoperative rehabilitation", "surgical safety limits", "team-defined limits"], ["ioc-manual-sports-injuries", "welling-acl-rts-2024"]),
    ],
    trio: {
      caseText:
        "A fictional 19-year-old ruptured the ACL during football and is 8 months post-reconstruction, has >=90% limb symmetry index on hop testing, and is anxious about returning to competitive play.",
      appliedPrompt:
        "Using the fictional case, outline a criteria-based return-to-sport progression that combines physical, hop, and psychological readiness, and state the residual risk.",
      appliedConcepts: [
        c("Combine strength, hop battery, and psychological readiness for return-to-sport, not time since surgery alone", ["strength and hop battery", "psychological readiness", "not time since surgery alone"], ["welling-acl-rts-2024"]),
        c("Acknowledge residual second-ACL-injury risk and use shared decision-making for progressive loading", ["residual second-ACL-injury risk", "shared decision-making", "progressive loading"], ["welling-acl-rts-2024"]),
        c("Define sport-specific progressive loading with ongoing monitoring and reassessment", ["sport-specific progressive loading", "ongoing monitoring", "reassessment"], ["welling-acl-rts-2024"]),
      ],
      vivaPrompt:
        "Defend your return-to-sport plan for the fictional ACL case, separate what the 2024 evidence supports from what is patient-specific, and state what would pause progression.",
      vivaConcepts: [
        c("Defend criteria-based RTS using strength, hop, and psychological readiness", ["criteria-based return-to-sport", "strength hop psychological readiness", "2024 evidence"], ["welling-acl-rts-2024"]),
        c("Acknowledge residual risk and individual response uncertainty", ["residual risk", "individual response", "uncertainty"], ["welling-acl-rts-2024"]),
        c("State that new instability or recurrent symptoms pause progression and trigger reassessment", ["pause progression", "reassessment", "recurrent symptoms"], ["welling-acl-rts-2024"]),
      ],
      probe: "Which single test would most change your return-to-sport decision, and why?",
      evidenceUpdate:
        "The person reports a new giving-way episode during sport-specific drills. Explain why progression pauses and what reassessment is required before returning.",
    },
    viva: [
      { level: "RECALL", prompt: "Recall what a criteria-based return-to-sport progression combines after ACL reconstruction.", targetConceptIds: ["spr-surgical-management-rehab-arthroscopy-viva-recall-c1"] },
      { level: "APPLY", prompt: "Apply strength, hop, and psychological readiness to a return-to-sport progression.", targetConceptIds: ["spr-surgical-management-rehab-arthroscopy-viva-recall-c2"] },
      { level: "DEFEND", prompt: "Defend your plan and what would pause progression and trigger reassessment.", targetConceptIds: ["spr-surgical-management-rehab-arthroscopy-viva-recall-c3"] },
    ],
  },
  {
    topicId: "spr-injury-specific-overuse-management",
    title: "Injury & sports-specific management; management of overuse injuries",
    prompt:
      "Explain injury- and sports-specific management of overuse injuries, integrating load management with rehabilitation and return-to-sport criteria.",
    concepts: [
      c("Integrate load management with rehabilitation for overuse injuries", ["load management", "overuse rehabilitation", "integrate load and rehab"], ["ioc-manual-sports-injuries", "welling-acl-rts-2024"]),
      c("Use return-to-sport criteria rather than time alone for overuse injuries", ["return-to-sport criteria", "not time alone", "overuse RTS"], ["welling-acl-rts-2024"]),
    ],
  },
  {
    topicId: "spr-electrotherapy-sports-rehabilitation",
    title: "Electrotherapy in sports rehabilitation; rehabilitation of sports injuries",
    prompt:
      "Explain the role of electrotherapy in sports rehabilitation, integrated with active rehabilitation and return-to-sport decisions.",
    concepts: [
      c("Use electrotherapy as an adjunct within a rehabilitation pathway, not as a standalone treatment", ["electrotherapy adjunct", "rehabilitation pathway", "not standalone"], ["ioc-manual-sports-injuries"]),
      c("Separate electrotherapy use from return-to-sport clearance decisions", ["electrotherapy use", "return-to-sport clearance", "separate from clearance"], ["ioc-manual-sports-injuries"]),
    ],
  },
  {
    topicId: "spr-msk-screening-athletes-season",
    title: "Musculoskeletal screening of athletes (pre-season, in-season, post-season)",
    prompt:
      "Explain musculoskeletal screening of athletes across pre-season, in-season, and post-season, and how it informs prevention and load management.",
    concepts: [
      c("Use prospective screening across the season cycle to inform prevention and load management", ["prospective screening", "pre-season in-season post-season", "prevention and load management"], ["ioc-epidemiology-consensus-2020"]),
      c("Interpret screening findings with the clinical question and ongoing monitoring", ["interpret screening", "clinical question", "ongoing monitoring"], ["ioc-epidemiology-consensus-2020"]),
    ],
  },
  {
    topicId: "spr-taping-advances-sports-rehabilitation",
    title: "Taping techniques & recent advances in sports rehabilitation",
    prompt:
      "Explain taping techniques and recent advances in sports rehabilitation, including the evidence and its limits as an adjunct.",
    concepts: [
      c("Treat kinesiology taping effects as uncertain in the cited very-low-certainty evidence; do not promise pain, function, movement, or range-of-motion benefit", ["uncertain effects", "very low certainty", "do not promise benefit"], ["cochrane-kt-rotator-cuff-2021"]),
      c("If taping is trialled as an adjunct, agree a functional or symptom goal, check skin and comfort, reassess meaningful response, and continue active rehabilitation", ["adjunct trial", "skin comfort and reassessment", "continue active rehabilitation"], ["cochrane-kt-rotator-cuff-2021", "ioc-manual-sports-injuries"]),
    ],
  },
  {
    topicId: "spr-diet-sports-carbohydrate-loading",
    title: "Diet & sports (pre-session diet, pre-game meal, carbohydrate loading, high-fat/high-protein diet)",
    prompt:
      "Explain diet in sports — pre-session, pre-game, carbohydrate loading, and high-fat/high-protein considerations within physiotherapy scope.",
    concepts: [
      c("Relate dietary intake to training load and energy availability, not to isolated nutrients", ["dietary intake", "training load", "energy availability"], ["acsm-getp-12th-2025", "ioc-reds-consensus-2023"]),
      c("Stay within physiotherapy scope: advise on intake relative to training, not prescriptive dietary plans", ["within physiotherapy scope", "intake relative to training", "not prescriptive dietary plans"], ["acsm-getp-12th-2025"]),
    ],
  },
  {
    topicId: "spr-ebp-sports-return-to-sports",
    title: "Evidence-based sports rehabilitation & return-to-sports criteria",
    prompt:
      "Explain evidence-based sports rehabilitation and return-to-sport criteria, integrating functional performance, patient-reported outcomes, and shared decision-making.",
    concepts: [
      c("Combine functional performance and patient-reported outcomes for return-to-sport, not time alone", ["functional performance", "patient-reported outcomes", "not time alone"], ["wikstrom-ankle-rts-2020", "welling-acl-rts-2024"]),
      c("Use shared decision-making and ongoing monitoring for return-to-sport clearance", ["shared decision-making", "ongoing monitoring", "return-to-sport clearance"], ["welling-acl-rts-2024"]),
    ],
  },
  {
    topicId: "spr-female-athletes-menstrual-preventive",
    title: "Problems in female athletes; menstrual synchrony; preventive strategies",
    prompt:
      "Explain problems in female athletes, including menstrual function, and preventive strategies grounded in energy availability.",
    concepts: [
      c("Relate menstrual dysfunction to low energy availability and training load, using the REDs framework", ["menstrual dysfunction", "low energy availability", "REDs framework"], ["ioc-reds-consensus-2023"]),
      c("Use REDs CAT2 and the 2025 FAIR recommendations to structure risk assessment and prevention without assuming one programme fits every female athlete", ["IOC REDs CAT2", "FAIR recommendations", "individualized prevention"], ["ioc-reds-cat2-2023", "ioc-fair-2025"]),
    ],
  },
  {
    topicId: "spr-introduction-sports-sciences",
    title: "Introduction to sports sciences",
    prompt:
      "Introduce sports sciences as an interdisciplinary field and explain how its disciplines support athlete health, performance, and physiotherapy decisions.",
    concepts: [
      c("Integrate physiology, biomechanics, psychology, performance analysis, epidemiology, nutrition, and ethics rather than treating one discipline as the whole of sport science", ["interdisciplinary sports science", "physiology biomechanics psychology", "performance and athlete health"], ["nsca-sport-science-2022", "src-curriculum-sports"]),
      c("Translate measurements into a defined athlete or team question while separating performance support from diagnosis and medical clearance", ["defined performance question", "measurement in context", "separate from diagnosis and clearance"], ["nsca-sport-science-2022", "ioc-epidemiology-consensus-2020"]),
    ],
  },
  {
    topicId: "spr-cricket-football-basketball-hockey",
    title: "Cricket, football, basketball & hockey — terminology, methodology, rules, equipment",
    prompt:
      "Compare the terminology, playing demands, rules, equipment, and infrastructure of cricket, football, basketball, and hockey that matter to a sports physiotherapist.",
    concepts: [
      c("For each sport, connect its playing objective, roles, movement and contact demands, surface, equipment, and substitution or medical-access rules to assessment and event planning", ["playing objective and roles", "movement and contact demands", "equipment and medical access"], ["nsca-sport-science-2022", "ioc-manual-sports-injuries", "src-curriculum-sports"]),
      c("Verify the edition and competition-specific playing conditions with the governing federation instead of relying on memorized generic rules", ["verify current rules", "competition-specific playing conditions", "official federation source"], ["icc-playing-conditions-2026", "ifab-laws-2026-27", "fiba-rules-current", "fih-rules-2026"]),
    ],
  },
  {
    topicId: "spr-tennis-track-field-aquatic",
    title: "Tennis, track & field, aquatic sports — terminology, methodology, rules, equipment",
    prompt:
      "Compare the terminology, event demands, rules, equipment, and infrastructure of tennis, track and field, and aquatic sports that matter to a sports physiotherapist.",
    concepts: [
      c("Relate court, track, field, and aquatic event demands—including repetition, impact, throwing, sprint or endurance load, and the environment—to physiotherapy observation and preparation", ["event-specific demands", "impact throwing sprint endurance", "environment and preparation"], ["nsca-sport-science-2022", "mcginnis-biomechanics-4e", "src-curriculum-sports"]),
      c("Check the current discipline and competition rulebook before advising on equipment, field-of-play access, or return during an event", ["current discipline rulebook", "equipment and access", "event-specific return rules"], ["itf-rules-2026", "world-athletics-rules-current", "world-aquatics-rules-current"]),
    ],
  },
  {
    topicId: "spr-sports-biomechanics-injury",
    title: "Principles of sports biomechanics & biomechanics of injury",
    prompt:
      "Explain the principles of sports biomechanics and show how they inform—but do not alone determine—an analysis of sports injury.",
    concepts: [
      c("Distinguish kinematics from kinetics and relate force, torque, work, power, impulse, momentum, and tissue loading to a defined movement task", ["kinematics and kinetics", "force torque impulse momentum", "tissue loading"], ["mcginnis-biomechanics-4e"]),
      c("Use biomechanics to generate and test hypotheses alongside exposure, capacity, symptoms, context, and clinical findings rather than claiming a single movement causes injury", ["biomechanical hypothesis", "multifactorial injury", "not single-factor causation"], ["mcginnis-biomechanics-4e", "ioc-epidemiology-consensus-2020"]),
    ],
  },
  {
    topicId: "spr-physics-running-throwing-swimming-jumping",
    title: "Physics in sports — biomechanics of running, throwing, swimming & jumping",
    prompt:
      "Use physics to compare running, throwing, swimming, and jumping, and explain how contemporary measurement can test a technique or rehabilitation question.",
    concepts: [
      c("Break each skill into phases and use appropriate variables such as ground-reaction force and impulse, angular momentum, projectile motion, or drag and buoyancy", ["movement phases", "ground reaction force and impulse", "angular momentum drag buoyancy"], ["mcginnis-biomechanics-4e"]),
      c("Choose video, force, temporal-spatial, or wearable measures for a stated question and interpret measurement error before changing technique or rehabilitation", ["measurement matched to question", "video force wearable measures", "measurement error"], ["mcginnis-biomechanics-4e", "nsca-sport-science-2022"]),
    ],
  },
  {
    topicId: "spr-psychological-aspects-sports",
    title: "Psychological aspects in sports (grief/loss models, cognitive stress & emotional response)",
    prompt:
      "Explain psychological responses to sport, injury, loss, rehabilitation, and return, using grief and stress models cautiously rather than as fixed stages.",
    concepts: [
      c("Describe cognitive appraisal, emotion, behaviour, identity, social context, and recovery as interacting and changing across injury rehabilitation and return to sport", ["cognitive appraisal", "emotional and behavioural response", "injury rehabilitation and return"], ["sport-injury-psychology-consensus-2024"]),
      c("Use grief or loss models as optional communication frameworks, not a mandatory linear sequence, and screen, safeguard, and refer mental-health concerns within role and competence", ["not fixed grief stages", "screen and safeguard", "refer within competence"], ["ioc-mental-health-2026", "sport-injury-psychology-consensus-2024"]),
    ],
  },
  {
    topicId: "spr-protective-equipment-orthotics-traumatology",
    title: "Protective equipment in sports incl. orthotics; sports traumatology",
    prompt:
      "Explain how protective equipment and orthoses fit into sports-trauma prevention and management, including fit, rules, residual risk, and reassessment.",
    concepts: [
      c("Match equipment or an orthosis to the sport, athlete, impairment, task, fit, skin and comfort checks, and the governing rules, then reassess function", ["sport and athlete specific fit", "skin comfort and function checks", "rules and reassessment"], ["ioc-manual-sports-injuries", "fih-rules-2026", "para-athlete-sports-physio-2021"]),
      c("Explain that protective equipment can modify exposure or injury severity but does not eliminate risk or replace technique, load management, emergency planning, and rehabilitation", ["modify not eliminate risk", "not replace load management", "emergency planning and rehabilitation"], ["ioc-manual-sports-injuries", "ioc-epidemiology-consensus-2020"]),
    ],
  },
  {
    topicId: "spr-sports-psychology-training",
    title: "Specific psychology management in sports; sports-specific training",
    prompt:
      "Explain psychologically informed sports rehabilitation and sports-specific training while keeping physiotherapy support distinct from specialist mental-health care.",
    concepts: [
      c("Use collaborative goals, graded exposure, confidence and readiness discussion, feedback, and monitoring to support adherence and return-to-sport training", ["collaborative goals", "graded exposure and confidence", "monitor readiness and adherence"], ["sport-injury-psychology-consensus-2024"]),
      c("Recognize distress and risk, protect confidentiality, and use established referral pathways; diagnosis and psychotherapy belong to appropriately qualified professionals", ["recognize distress and risk", "confidential referral pathway", "qualified mental health professional"], ["ioc-mental-health-2026"]),
    ],
  },
  {
    topicId: "spr-advanced-sports-assessment-acute-management",
    title: "Advanced sports assessment skills; initial management of acute sports injuries",
    prompt:
      "Explain an advanced on-field and off-field assessment of an acute sports injury and the decisions for emergency action, removal, referral, and reassessment.",
    concepts: [
      c("Start with scene safety, the event emergency-action plan, a primary survey, catastrophic-injury precautions, and timely escalation before a focused musculoskeletal examination", ["scene safety and emergency plan", "primary survey", "catastrophic injury escalation"], ["ioc-manual-sports-injuries"]),
      c("Use mechanism, symptoms, observation, palpation, movement and function to decide removal or referral, and apply immediate removal with no same-day return when concussion is suspected", ["mechanism and focused examination", "remove or refer", "suspected concussion no same-day return"], ["ioc-manual-sports-injuries", "amsterdam-2022-concussion"]),
    ],
  },
  {
    topicId: "spr-manual-therapy-sports-peripheral",
    title: "Manual therapy techniques in sports (McKenzie, Maitland, Cyriax, Mulligan, positional release)",
    prompt:
      "Compare named manual-therapy approaches used in sports physiotherapy and explain how assessment, consent, response, evidence, and active rehabilitation govern their use.",
    concepts: [
      c("Differentiate the named approaches as curricular frameworks without claiming that a school label identifies pathology or guarantees a technique-specific mechanism", ["compare named approaches", "not diagnostic school labels", "no guaranteed specific mechanism"], ["src-curriculum-sports", "manual-therapy-mechanisms-2025"]),
      c("Use consented manual therapy only when a reasoned trial supports a functional goal, reassess the response, and integrate it as an adjunct to active rehabilitation", ["clinical reasoning and consent", "reassess response", "adjunct to active rehabilitation"], ["manual-therapy-sports-clinical-reasoning-2023", "manual-therapy-mechanisms-2025"]),
    ],
  },
  {
    topicId: "spr-manual-therapy-sports-myofascial-neurodynamics",
    title: "Manual therapy in sports — myofascial release, muscle energy, neurodynamics",
    prompt:
      "Explain myofascial release, muscle-energy techniques, and neurodynamic or neural-mobilization techniques in sports rehabilitation, including evidence limits and safety.",
    concepts: [
      c("Describe each technique's intended examination-linked use and dosage while monitoring symptoms, neurological signs, irritability, contraindications, and the athlete's response", ["examination linked technique", "monitor neurological signs and irritability", "contraindications and response"], ["src-curriculum-sports", "manual-therapy-sports-clinical-reasoning-2023"]),
      c("Explain that observed effects may involve multiple neurophysiological and contextual mechanisms; avoid unsupported tissue-release claims and pair any short-term benefit with active rehabilitation", ["multiple mechanisms", "avoid tissue release claims", "pair with active rehabilitation"], ["manual-therapy-mechanisms-2025", "manual-therapy-sports-clinical-reasoning-2023"]),
    ],
  },
  {
    topicId: "spr-sports-special-populations-challenged",
    title: "Sports management of special populations (geriatric, physically challenged athletes)",
    prompt:
      "Explain sports physiotherapy management for older and Para athletes using person-, impairment-, sport-, equipment-, and environment-specific assessment.",
    concepts: [
      c("For a Para athlete, assess impairment-specific and secondary health risks, equipment and classification context, skin, thermoregulation, autonomic or overuse concerns, access, and the athlete's own expertise", ["Para athlete health risks", "equipment classification and access", "athlete expertise"], ["para-athlete-sports-physio-2021"]),
      c("For an older athlete, individualize progressive loading and recovery around training history, goals, comorbidity, medication, strength, balance, symptoms, and function rather than chronological age alone", ["not age alone", "comorbidity medication and recovery", "individualized progressive loading"], ["acsm-getp-12th-2025"]),
    ],
  },
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
    topics: neuroTopics,
  },
  {
    subjectId: "cardiovascular-and-respiratory-physiotherapy",
    title: "Cardiovascular & Respiratory Physiotherapy",
    availability: "ACTIVE",
    topics: [
      ...respiratoryTopics,
      ...respiratoryAdditionalTopics,
      ...cardiovascularTopics,
      ...cardiovascularAdditionalTopics,
    ],
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
    availability: "ACTIVE",
    topics: [...sportsTopics],
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
  version: "0.9.0",
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
// Minified to stay within the bounded public-pack byte budget (265 topics).
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
