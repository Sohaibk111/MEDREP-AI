import {
  Doctor,
  Visit,
  FollowupTask,
  AnonymousPatientOpportunity,
  WeeklyFieldPlan,
  DataConflict,
  ApprovedProductClaim,
  CompetitorComparison
} from '../types';

export const INITIAL_DOCTORS: Doctor[] = [
  {
    id: 'doc-1',
    name: 'Prof. Dr. Jamal Ahmed',
    specialty: 'Endocrinology',
    subSpecialty: 'Pediatric & Adult Diabetes',
    qualification: 'MBBS, FCPS (Endocrinology), FACE (USA)',
    hospital: 'Shifa International Hospital',
    clinic: 'Executive OPD Clinic, 2nd Floor, Room 214',
    area: 'Shifa International',
    city: 'Islamabad',
    address: 'Pitras Bukhari Road, H-8/4, Islamabad',
    priority: 'A',
    prescriberStatus: 'trialing',
    cgmPotential: 'high',
    affordabilityTier: 'premium',
    relationshipStrength: 4,
    potentialScore: 94,
    dailyPriorityScore: 98,
    paName: 'Tariq Mehmood (OPD Coordinator)',
    paContact: '+92 300 5123490',
    contacts: [
      { id: 'c-1', type: 'mobile', value: '+92 321 5566778', isPrimary: true, isVerified: true },
      { id: 'c-2', type: 'whatsapp', value: '+92 321 5566778', isPrimary: false, isVerified: true },
      { id: 'c-3', type: 'clinic_landline', value: '051-8463000 Ext 214', isPrimary: false, isVerified: true }
    ],
    timings: [
      { id: 't-1', locationName: 'Shifa International Hospital OPD', dayOfWeek: 1, dayName: 'Monday', startTime: '10:00 AM', endTime: '02:00 PM', timingType: 'opd', source: 'field_verified' },
      { id: 't-2', locationName: 'Shifa International Hospital OPD', dayOfWeek: 3, dayName: 'Wednesday', startTime: '10:00 AM', endTime: '02:00 PM', timingType: 'opd', source: 'field_verified' },
      { id: 't-3', locationName: 'Shifa International Hospital OPD', dayOfWeek: 5, dayName: 'Friday', startTime: '10:00 AM', endTime: '01:00 PM', timingType: 'opd', source: 'field_verified' }
    ],
    lastVisitedDate: '2026-08-25',
    nextScheduledVisit: '2026-09-01',
    totalVisitsCount: 6,
    openPatientOpportunitiesCount: 2,
    recentObjections: ['Sensor cost for self-paying patients', 'Patient sensor re-application concern'],
    notes: 'Very receptive to scientific MARD comparisons. Does not like promotional talk. Emphasize continuous data fidelity for brittle Type 1 diabetics.',
    isVerified: true,
    hasConflict: false
  },
  {
    id: 'doc-2',
    name: 'Dr. Sarah Khan',
    specialty: 'Diabetology',
    subSpecialty: 'Gestational Diabetes & Metabolic Health',
    qualification: 'MBBS, MCPS, Dip. Diab (UK)',
    hospital: 'MediCenter Healthcare',
    clinic: 'Sugar & Metabolic Care Clinic',
    area: 'PWD',
    city: 'Rawalpindi',
    address: 'Main Boulevard, Sector C, PWD Housing Society, Rawalpindi',
    priority: 'A',
    prescriberStatus: 'active_prescriber',
    cgmPotential: 'high',
    affordabilityTier: 'upper_middle',
    relationshipStrength: 5,
    potentialScore: 89,
    dailyPriorityScore: 92,
    paName: 'Sister Rehana',
    paContact: '+92 333 5981122',
    contacts: [
      { id: 'c-4', type: 'mobile', value: '+92 333 5432109', isPrimary: true, isVerified: true },
      { id: 'c-5', type: 'whatsapp', value: '+92 333 5432109', isPrimary: false, isVerified: true }
    ],
    timings: [
      { id: 't-4', locationName: 'Sugar & Metabolic Care Clinic', dayOfWeek: 1, dayName: 'Monday', startTime: '11:30 AM', endTime: '03:30 PM', timingType: 'opd', source: 'field_verified' },
      { id: 't-5', locationName: 'Sugar & Metabolic Care Clinic', dayOfWeek: 2, dayName: 'Tuesday', startTime: '11:30 AM', endTime: '03:30 PM', timingType: 'opd', source: 'field_verified' },
      { id: 't-6', locationName: 'Sugar & Metabolic Care Clinic', dayOfWeek: 4, dayName: 'Thursday', startTime: '11:30 AM', endTime: '03:30 PM', timingType: 'opd', source: 'field_verified' }
    ],
    lastVisitedDate: '2026-08-20',
    nextScheduledVisit: '2026-09-01',
    totalVisitsCount: 9,
    openPatientOpportunitiesCount: 3,
    recentObjections: ['App calibration sync occasionally delayed on older Android handsets'],
    notes: 'Key advocate for EvoCheck in PWD/Soan area. Frequently educates pregnant diabetic patients on glucose variability.',
    isVerified: true,
    hasConflict: false
  },
  {
    id: 'doc-3',
    name: 'Dr. Uzair Malik',
    specialty: 'Nephrology',
    subSpecialty: 'Diabetic Kidney Disease',
    qualification: 'MBBS, FCPS (Nephrology)',
    hospital: 'Soan International Hospital',
    clinic: 'Renal & Diabetes Care Unit',
    area: 'Soan Garden',
    city: 'Rawalpindi',
    address: 'Block E, Soan Garden, Islamabad Expressway, Rawalpindi',
    priority: 'B',
    prescriberStatus: 'prospect',
    cgmPotential: 'medium',
    affordabilityTier: 'upper_middle',
    relationshipStrength: 2,
    potentialScore: 78,
    dailyPriorityScore: 84,
    paName: 'Naveed (Receptionist)',
    paContact: '+92 312 9081234',
    contacts: [
      { id: 'c-6', type: 'mobile', value: '+92 345 5112233', isPrimary: true, isVerified: false },
      { id: 'c-7', type: 'clinic_landline', value: '051-5730111', isPrimary: false, isVerified: true }
    ],
    timings: [
      { id: 't-7', locationName: 'Renal & Diabetes Care Unit', dayOfWeek: 1, dayName: 'Monday', startTime: '02:00 PM', endTime: '05:00 PM', timingType: 'opd', source: 'field_verified' },
      { id: 't-8', locationName: 'Renal & Diabetes Care Unit', dayOfWeek: 3, dayName: 'Wednesday', startTime: '02:00 PM', endTime: '05:00 PM', timingType: 'opd', source: 'field_verified' }
    ],
    lastVisitedDate: '2026-08-14',
    nextScheduledVisit: '2026-09-01',
    totalVisitsCount: 3,
    openPatientOpportunitiesCount: 1,
    recentObjections: ['Uncertain about CGM sensor accuracy in CKD stage 3/4 with fluctuating urea'],
    notes: 'Provide approved clinical study regarding MARD stability in CKD patients without severe edema.',
    isVerified: true,
    hasConflict: false
  },
  {
    id: 'doc-4',
    name: 'Prof. Dr. Tariq Mahmood',
    specialty: 'Endocrinology',
    subSpecialty: 'Internal Medicine & Diabetes',
    qualification: 'MBBS, MRCP (UK), FRCP (Edin)',
    hospital: 'PIMS (Pakistan Institute of Medical Sciences)',
    clinic: 'Diabetes & Endocrine OPD Room #4',
    area: 'PIMS',
    city: 'Islamabad',
    address: 'Sector G-8/3, Islamabad',
    priority: 'A',
    prescriberStatus: 'trialing',
    cgmPotential: 'high',
    affordabilityTier: 'premium',
    relationshipStrength: 3,
    potentialScore: 96,
    dailyPriorityScore: 88,
    paName: 'Mr. Asif (Head Clerk)',
    paContact: '+92 301 8877665',
    contacts: [
      { id: 'c-8', type: 'mobile', value: '+92 300 9554433', isPrimary: true, isVerified: true }
    ],
    timings: [
      { id: 't-9', locationName: 'PIMS Endocrine OPD', dayOfWeek: 2, dayName: 'Tuesday', startTime: '09:00 AM', endTime: '01:00 PM', timingType: 'opd', source: 'field_verified' },
      { id: 't-10', locationName: 'PIMS Endocrine OPD', dayOfWeek: 4, dayName: 'Thursday', startTime: '09:00 AM', endTime: '01:00 PM', timingType: 'opd', source: 'field_verified' }
    ],
    lastVisitedDate: '2026-08-18',
    totalVisitsCount: 5,
    openPatientOpportunitiesCount: 2,
    recentObjections: ['Wants sample sensor to demonstrate application directly to patient before prescribing'],
    notes: 'KOL (Key Opinion Leader). Trains postgraduate residents. Winning him gives deep hospital penetration.',
    isVerified: true,
    hasConflict: false
  },
  {
    id: 'doc-5',
    name: 'Dr. Kamran Siddiqui',
    specialty: 'Cardiology',
    subSpecialty: 'Preventive Cardiology & Diabetes',
    qualification: 'MBBS, Dip. Card, FCPS (Cardiology)',
    hospital: 'Rawalpindi Institute of Cardiology (RIC)',
    clinic: 'Executive Cardiac Suite',
    area: 'Saidpur Road',
    city: 'Rawalpindi',
    address: 'Saidpur Road, Rawalpindi',
    priority: 'B',
    prescriberStatus: 'prospect',
    cgmPotential: 'medium',
    affordabilityTier: 'upper_middle',
    relationshipStrength: 2,
    potentialScore: 76,
    dailyPriorityScore: 72,
    paName: 'Babar (OPD Assistant)',
    contacts: [
      { id: 'c-9', type: 'mobile', value: '+92 334 7788990', isPrimary: true, isVerified: true }
    ],
    timings: [
      { id: 't-11', locationName: 'RIC Executive Suite', dayOfWeek: 2, dayName: 'Tuesday', startTime: '11:00 AM', endTime: '03:00 PM', timingType: 'opd', source: 'field_verified' },
      { id: 't-12', locationName: 'RIC Executive Suite', dayOfWeek: 5, dayName: 'Friday', startTime: '11:00 AM', endTime: '01:00 PM', timingType: 'opd', source: 'field_verified' }
    ],
    lastVisitedDate: '2026-08-10',
    totalVisitsCount: 2,
    openPatientOpportunitiesCount: 0,
    recentObjections: ['Cardiologists usually rely on HbA1c; needs briefing on glycemic variability risk in post-CABG'],
    notes: 'Pitch glucose spike suppression to reduce cardiovascular endothelial damage.',
    isVerified: true,
    hasConflict: false
  },
  {
    id: 'doc-6',
    name: 'Dr. Farhana Qureshi',
    specialty: 'Diabetology',
    subSpecialty: 'Family Medicine & Diabetes Care',
    qualification: 'MBBS, MRCGP (INT)',
    hospital: 'Commercial Medical Center',
    clinic: 'Al-Farooq Diabetes Care Clinic',
    area: 'Commercial Market',
    city: 'Rawalpindi',
    address: 'Satellite Town, Commercial Market, Rawalpindi',
    priority: 'B',
    prescriberStatus: 'active_prescriber',
    cgmPotential: 'high',
    affordabilityTier: 'middle',
    relationshipStrength: 4,
    potentialScore: 82,
    dailyPriorityScore: 85,
    paName: 'Ms. Hira (Clinic Coordinator)',
    paContact: '+92 331 4455667',
    contacts: [
      { id: 'c-10', type: 'mobile', value: '+92 332 5566112', isPrimary: true, isVerified: true }
    ],
    timings: [
      { id: 't-13', locationName: 'Al-Farooq Diabetes Clinic', dayOfWeek: 1, dayName: 'Monday', startTime: '04:00 PM', endTime: '08:00 PM', timingType: 'opd', source: 'field_verified' },
      { id: 't-14', locationName: 'Al-Farooq Diabetes Clinic', dayOfWeek: 3, dayName: 'Wednesday', startTime: '04:00 PM', endTime: '08:00 PM', timingType: 'opd', source: 'field_verified' },
      { id: 't-15', locationName: 'Al-Farooq Diabetes Clinic', dayOfWeek: 5, dayName: 'Friday', startTime: '04:00 PM', endTime: '08:00 PM', timingType: 'opd', source: 'field_verified' }
    ],
    lastVisitedDate: '2026-08-22',
    totalVisitsCount: 7,
    openPatientOpportunitiesCount: 2,
    notes: 'Busy evening practice in Satellite Town. Best to meet 15 minutes before OPD starts.',
    isVerified: true,
    hasConflict: true // Marked for conflict demo
  },
  {
    id: 'doc-7',
    name: 'Dr. Haroon Rasheed',
    specialty: 'Internal Medicine',
    subSpecialty: 'Diabetes & Hypertension',
    qualification: 'MBBS, FCPS (Medicine)',
    hospital: 'Ghauri Medical Complex',
    clinic: 'Consultant Clinic #2',
    area: 'Ghauri Town',
    city: 'Islamabad',
    address: 'VIP Road, Phase 4, Ghauri Town, Islamabad',
    priority: 'C',
    prescriberStatus: 'prospect',
    cgmPotential: 'medium',
    affordabilityTier: 'middle',
    relationshipStrength: 1,
    potentialScore: 64,
    dailyPriorityScore: 60,
    paName: 'Kashif',
    contacts: [
      { id: 'c-11', type: 'mobile', value: '+92 300 4455998', isPrimary: true, isVerified: false }
    ],
    timings: [
      { id: 't-16', locationName: 'Consultant Clinic #2', dayOfWeek: 2, dayName: 'Tuesday', startTime: '06:00 PM', endTime: '09:00 PM', timingType: 'opd', source: 'web_researched' }
    ],
    lastVisitedDate: '2026-08-05',
    totalVisitsCount: 1,
    openPatientOpportunitiesCount: 0,
    notes: 'New prospect. Needs introductory product brochure.',
    isVerified: false,
    hasConflict: false
  }
];

export const INITIAL_VISITS: Visit[] = [
  {
    id: 'vis-101',
    doctorId: 'doc-1',
    doctorName: 'Prof. Dr. Jamal Ahmed',
    doctorSpecialty: 'Endocrinology',
    hospitalClinic: 'Shifa International Hospital OPD',
    area: 'Shifa International',
    scheduledDate: '2026-09-01',
    scheduledTime: '11:00 AM',
    status: 'in_progress',
    objectives: [
      { id: 'obj-1', text: 'Present EvoCheck 14-day MARD 8.8% clinical trial data against standard fingerstick', isAchieved: true },
      { id: 'obj-2', text: 'Address pricing comparison with FreeStyle Libre for self-pay Type 1 cohort', isAchieved: false },
      { id: 'obj-3', text: 'Secure commitment for 2 patient trial installations this week', isAchieved: false }
    ],
    objections: [
      {
        id: 'obj-cat-1',
        category: 'price_affordability',
        detail: 'Doctor noted PKR 12,500 sensor price is difficult for fixed-income families.',
        responseGiven: 'Explained that 14 days continuous monitoring replaces 50+ test strips with zero calibration pain, lowering total glycemic cost.',
        resolved: true
      }
    ],
    interestLevel: 'very_high',
    summary: 'Dr. Jamal reviewed the MARD report and agreed to recommend EvoCheck to two poorly controlled Type 1 adolescent patients.',
    nextFollowUpDate: '2026-09-03',
    nextVisitObjective: 'Deliver dummy sensor applicator demo kit to OPD coordinator'
  },
  {
    id: 'vis-102',
    doctorId: 'doc-2',
    doctorName: 'Dr. Sarah Khan',
    doctorSpecialty: 'Diabetology',
    hospitalClinic: 'Sugar & Metabolic Care Clinic',
    area: 'PWD',
    scheduledDate: '2026-09-01',
    scheduledTime: '12:30 PM',
    status: 'planned',
    objectives: [
      { id: 'obj-4', text: 'Review feedback from last week’s gestational diabetes trial patient (#P-102)', isAchieved: false },
      { id: 'obj-5', text: 'Provide Android app sync update release notes', isAchieved: false }
    ],
    interestLevel: 'very_high'
  },
  {
    id: 'vis-103',
    doctorId: 'doc-3',
    doctorName: 'Dr. Uzair Malik',
    doctorSpecialty: 'Nephrology',
    hospitalClinic: 'Soan International Hospital',
    area: 'Soan Garden',
    scheduledDate: '2026-09-01',
    scheduledTime: '02:00 PM',
    status: 'planned',
    objectives: [
      { id: 'obj-6', text: 'Deliver clinical whitepaper on CGM accuracy in Diabetic Nephropathy Stage 3', isAchieved: false },
      { id: 'obj-7', text: 'Introduce EvoCheck water resistance (IP28) for dialysis patients', isAchieved: false }
    ]
  }
];

export const INITIAL_FOLLOWUPS: FollowupTask[] = [
  {
    id: 'tsk-1',
    doctorId: 'doc-1',
    doctorName: 'Prof. Dr. Jamal Ahmed',
    doctorArea: 'Shifa International',
    visitId: 'vis-101',
    title: 'Deliver EvoCheck Dummy Applicator & Patient Starter Kit to PA Tariq',
    dueDate: '2026-09-02',
    priority: 'high',
    status: 'pending',
    source: 'visit'
  },
  {
    id: 'tsk-2',
    doctorId: 'doc-2',
    doctorName: 'Dr. Sarah Khan',
    doctorArea: 'PWD',
    title: 'Share Urdu Patient Application Guide video via WhatsApp with Clinic Staff',
    dueDate: '2026-09-01',
    priority: 'high',
    status: 'pending',
    source: 'visit'
  },
  {
    id: 'tsk-3',
    doctorId: 'doc-4',
    doctorName: 'Prof. Dr. Tariq Mahmood',
    doctorArea: 'PIMS',
    title: 'Send formal clinical dossier on EvoCheck MARD data to PIMS Endocrine Department',
    dueDate: '2026-08-30', // Overdue for demo
    priority: 'high',
    status: 'pending',
    source: 'ai_recommendation'
  },
  {
    id: 'tsk-4',
    doctorId: 'doc-6',
    doctorName: 'Dr. Farhana Qureshi',
    doctorArea: 'Commercial Market',
    title: 'Follow up on sensor installation for anonymous patient #P-104',
    dueDate: '2026-09-03',
    priority: 'medium',
    status: 'pending',
    source: 'manual'
  }
];

export const INITIAL_PATIENT_OPPORTUNITIES: AnonymousPatientOpportunity[] = [
  {
    id: 'opp-1',
    patientCode: 'P-101',
    doctorId: 'doc-1',
    doctorName: 'Prof. Dr. Jamal Ahmed',
    clinicalProfile: 'Type 1 Adolescent, Severe Nocturnal Hypoglycemia',
    status: 'sensor_installed',
    units: 1,
    productName: 'EvoCheck 14-Day CGM',
    estimatedValuePKR: 12500,
    createdAt: '2026-08-26',
    updatedAt: '2026-08-28'
  },
  {
    id: 'opp-2',
    patientCode: 'P-102',
    doctorId: 'doc-2',
    doctorName: 'Dr. Sarah Khan',
    clinicalProfile: 'Gestational Diabetes, Week 28, High Glycemic Variability',
    status: 'reordered',
    units: 2,
    productName: 'EvoCheck 14-Day CGM',
    estimatedValuePKR: 25000,
    createdAt: '2026-08-15',
    updatedAt: '2026-08-29'
  },
  {
    id: 'opp-3',
    patientCode: 'P-103',
    doctorId: 'doc-1',
    doctorName: 'Prof. Dr. Jamal Ahmed',
    clinicalProfile: 'Type 2 Uncontrolled (HbA1c 10.2%) considering basal insulin',
    status: 'trial_scheduled',
    units: 1,
    productName: 'EvoCheck 14-Day CGM',
    estimatedValuePKR: 12500,
    createdAt: '2026-08-28',
    updatedAt: '2026-08-28'
  },
  {
    id: 'opp-4',
    patientCode: 'P-104',
    doctorId: 'doc-6',
    doctorName: 'Dr. Farhana Qureshi',
    clinicalProfile: 'Executive Type 2 Corporate Patient, Frequent Traveler',
    status: 'recommended',
    units: 1,
    productName: 'EvoCheck 14-Day CGM',
    estimatedValuePKR: 12500,
    createdAt: '2026-08-30',
    updatedAt: '2026-08-30'
  }
];

export const INITIAL_FIELD_PLAN: WeeklyFieldPlan = {
  id: 'plan-wk-36',
  weekStartDate: '2026-09-01',
  weekEndDate: '2026-09-06',
  days: [
    {
      date: '2026-09-01',
      dayName: 'Monday',
      areaCluster: 'Zone A: Shifa / PWD / Soan Garden Route',
      stops: [
        {
          id: 'stp-1',
          doctorId: 'doc-1',
          doctorName: 'Prof. Dr. Jamal Ahmed',
          specialty: 'Endocrinology',
          hospitalClinic: 'Shifa International Hospital',
          area: 'Shifa International',
          timingSlot: '10:00 AM - 02:00 PM',
          priority: 'A',
          plannedTime: '11:00 AM',
          estDurationMinutes: 30,
          visitId: 'vis-101',
          isCompleted: false
        },
        {
          id: 'stp-2',
          doctorId: 'doc-2',
          doctorName: 'Dr. Sarah Khan',
          specialty: 'Diabetology',
          hospitalClinic: 'MediCenter Healthcare',
          area: 'PWD',
          timingSlot: '11:30 AM - 03:30 PM',
          priority: 'A',
          plannedTime: '12:30 PM',
          estDurationMinutes: 25,
          visitId: 'vis-102',
          isCompleted: false
        },
        {
          id: 'stp-3',
          doctorId: 'doc-3',
          doctorName: 'Dr. Uzair Malik',
          specialty: 'Nephrology',
          hospitalClinic: 'Soan International Hospital',
          area: 'Soan Garden',
          timingSlot: '02:00 PM - 05:00 PM',
          priority: 'B',
          plannedTime: '02:00 PM',
          estDurationMinutes: 25,
          visitId: 'vis-103',
          isCompleted: false
        }
      ]
    },
    {
      date: '2026-09-02',
      dayName: 'Tuesday',
      areaCluster: 'Zone B: PIMS / Saidpur Road Cluster',
      stops: [
        {
          id: 'stp-4',
          doctorId: 'doc-4',
          doctorName: 'Prof. Dr. Tariq Mahmood',
          specialty: 'Endocrinology',
          hospitalClinic: 'PIMS Endocrine OPD',
          area: 'PIMS',
          timingSlot: '09:00 AM - 01:00 PM',
          priority: 'A',
          plannedTime: '10:00 AM',
          estDurationMinutes: 30,
          isCompleted: false
        },
        {
          id: 'stp-5',
          doctorId: 'doc-5',
          doctorName: 'Dr. Kamran Siddiqui',
          specialty: 'Cardiology',
          hospitalClinic: 'Rawalpindi Institute of Cardiology',
          area: 'Saidpur Road',
          timingSlot: '11:00 AM - 03:00 PM',
          priority: 'B',
          plannedTime: '12:15 PM',
          estDurationMinutes: 25,
          isCompleted: false
        }
      ]
    },
    {
      date: '2026-09-03',
      dayName: 'Wednesday',
      areaCluster: 'Zone C: Commercial Market & 6th Road Hub',
      stops: [
        {
          id: 'stp-6',
          doctorId: 'doc-6',
          doctorName: 'Dr. Farhana Qureshi',
          specialty: 'Diabetology',
          hospitalClinic: 'Al-Farooq Diabetes Care Clinic',
          area: 'Commercial Market',
          timingSlot: '04:00 PM - 08:00 PM',
          priority: 'B',
          plannedTime: '04:15 PM',
          estDurationMinutes: 30,
          isCompleted: false
        }
      ]
    }
  ]
};

export const INITIAL_DATA_CONFLICTS: DataConflict[] = [
  {
    id: 'conf-1',
    entityType: 'doctor_timing',
    entityId: 'doc-6',
    doctorName: 'Dr. Farhana Qureshi',
    fieldName: 'Wednesday OPD Start Time',
    currentVerifiedValue: '04:00 PM - 08:00 PM (Field-Verified by Specialist on Aug 22)',
    incomingValue: '02:00 PM - 06:00 PM (Reported by Al-Farooq Clinic Web Portal Update)',
    incomingSource: 'web_researched',
    detectedAt: '2026-08-31T14:20:00Z',
    status: 'unresolved'
  }
];

export const APPROVED_PRODUCT_CLAIMS: ApprovedProductClaim[] = [
  {
    id: 'clm-1',
    category: 'accuracy',
    headline: 'Verified 8.66% MARD Across 15-Day Wear',
    claimText: 'EvoCheck CGM demonstrates a verified Mean Absolute Relative Difference (MARD) of 8.66% in technical evaluation across its 15-day operational lifespan.',
    clinicalSource: 'EvoCheck Technical Specification Dossier (DRAP Approved)',
    effectiveDate: '2026-01-01',
    status: 'approved'
  },
  {
    id: 'clm-2',
    category: 'wear_duration',
    headline: '15 Continuous Days of Uninterrupted Monitoring',
    claimText: 'Single sensor deployment delivers real-time continuous glucose monitoring for 15 full days without daily routine fingerstick calibration requirements.',
    clinicalSource: 'EvoCheck Technical Specification Dossier (Section 2.3)',
    effectiveDate: '2026-01-01',
    status: 'approved'
  },
  {
    id: 'clm-3',
    category: 'convenience',
    headline: 'IP68 Certified Water Resistance',
    claimText: 'Sensor assembly achieves verified IP68 ingress protection against dust and continuous water immersion according to standard IEC 60529.',
    clinicalSource: 'EvoCheck Environmental Ingress Test Report (IEC 60529 IP68)',
    effectiveDate: '2026-01-01',
    status: 'approved'
  },
  {
    id: 'clm-4',
    category: 'app_connectivity',
    headline: 'Continuous Bluetooth (BLE) Telemetry & Real-Time Alerts',
    claimText: 'Bluetooth Low Energy (BLE) transmits live glucose data at approximately 1-minute intervals directly to patient mobile devices with configurable high/low alerts.',
    clinicalSource: 'EvoCheck Mobile Software User Manual (DRAP Approved)',
    effectiveDate: '2026-01-01',
    status: 'approved'
  }
];

export const QUARANTINED_PRODUCT_CLAIMS = [
  {
    id: 'quar-1',
    category: 'accuracy',
    headline: 'Unverified: Specialized Sub-70 mg/dL Algorithm Superiority',
    claimText: 'Claimed superior accuracy in hypoglycemia range (<70 mg/dL).',
    reason: 'Quarantined: Lacks peer-reviewed head-to-head clinical trial data.',
    status: 'quarantined'
  },
  {
    id: 'quar-2',
    category: 'clinical_outcomes',
    headline: 'Unverified: Hospitalization Prevention Guarantee',
    claimText: 'Claimed to eliminate emergency nocturnal hypoglycemia admissions.',
    reason: 'Quarantined: Unsubstantiated clinical outcome claim. Medical reps must not make outcome guarantees.',
    status: 'quarantined'
  },
  {
    id: 'quar-3',
    category: 'pricing',
    headline: 'Unverified: 25-30% Better Affordability',
    claimText: 'Claimed 25-30% better price per day for self-pay patients.',
    reason: 'Quarantined: Official institutional retail price is not yet configured for this territory.',
    status: 'quarantined'
  }
];

export const COMPETITOR_COMPARISONS: CompetitorComparison[] = [
  {
    id: 'comp-1',
    brandName: 'Abbott FreeStyle Libre (1 / 2)',
    manufacturer: 'Abbott Diabetes Care',
    pricePKR: 16500,
    wearDurationDays: 14,
    mardRating: 9.2,
    keyStrengths: ['High global brand recognition', 'Established doctor familiarity', 'Compact reader available'],
    keyWeaknesses: ['Higher unit cost in Pakistan market', 'Libre 1 requires NFC scanning (no continuous BLE broadcast)', '14-day wear duration compared to EvoCheck 15-day wear'],
    approvedCounterArguments: [
      'EvoCheck provides true continuous real-time BLE broadcast without needing to manually tap phone to sensor.',
      'EvoCheck delivers a verified MARD of 8.66% with 15 days of continuous sensor wear.',
      'EvoCheck captures glucose readings every 1 minute (~21,600 theoretical data points per 15-day sensor).'
    ]
  },
  {
    id: 'comp-2',
    brandName: 'SIBIONICS CGM',
    manufacturer: 'SIBIONICS Healthcare',
    pricePKR: 13500,
    wearDurationDays: 14,
    mardRating: 8.83,
    keyStrengths: ['Direct BLE broadcasting', 'Sleek mobile application UI', 'Competitive pricing'],
    keyWeaknesses: ['14-day wear lifecycle compared to EvoCheck 15 days', 'Limited official local distributor warranty in Pakistan'],
    approvedCounterArguments: [
      'EvoCheck delivers a 15-day sensor wear duration (1 additional day per sensor lifecycle compared to 14-day CGMs).',
      'EvoCheck achieves a verified MARD of 8.66% with DRAP regulatory registration approval.'
    ]
  }
];
