import { Doctor, DoctorTiming, PriorityTier, SourceType } from '../types';

export type DoctorMasterVerification =
  | 'FIELD_VERIFIED'
  | 'WEB_VERIFIED'
  | 'COMPANY_PROVIDED'
  | 'MIXED'
  | 'UNKNOWN';

export type LocationVerificationStatus =
  | 'FACILITY_CONFIRMED'
  | 'DOCTOR_FACILITY_CONFIRMED'
  | 'DIRECTORY_AREA_ONLY'
  | 'HISTORICAL'
  | 'UNKNOWN';

export interface DoctorFacilityRecord {
  doctorId: string;
  doctorName: string;
  facilityName: string;
  clinic?: string;
  area: string;
  city: string;
  address: string;
  specialty: string;
  priority: PriorityTier;
  cgmPotential: Doctor['cgmPotential'];
  relationshipStatus?: Doctor['relationshipStatus'];
  prescriberStatus: Doctor['prescriberStatus'];
  companyCode?: string;
  verification: DoctorMasterVerification;
  locationVerification: LocationVerificationStatus;
  timings: DoctorTiming[];
  sourceTypes: SourceType[];
}

export interface DoctorFieldCandidate {
  doctor: Doctor;
  facility: string;
  area: string;
  timing?: DoctorTiming;
  score: number;
  reasons: string[];
  verification: DoctorMasterVerification;
}

const PRIORITY_SCORE: Record<PriorityTier, number> = { A: 30, B: 20, C: 10 };
const POTENTIAL_SCORE: Record<Doctor['cgmPotential'], number> = { high: 30, medium: 20, low: 10 };
const PRESCRIBER_SCORE: Record<Doctor['prescriberStatus'], number> = {
  advocate: 25,
  active_prescriber: 23,
  trialing: 18,
  prospect: 10,
  dormant: 5
};

function sourceRank(source: SourceType): number {
  if (source === 'field_verified') return 4;
  if (source === 'company_provided') return 3;
  if (source === 'web_researched') return 2;
  if (source === 'rep_voice_entry') return 2;
  return 1;
}

export function getDoctorMasterVerification(doctor: Doctor): DoctorMasterVerification {
  const sources = doctor.timings.map(t => t.source);
  if (sources.length === 0) return 'UNKNOWN';
  const ranks = sources.map(sourceRank);
  const max = Math.max(...ranks);
  const min = Math.min(...ranks);
  if (max === 4) return min < 4 ? 'MIXED' : 'FIELD_VERIFIED';
  if (max === 3) return 'COMPANY_PROVIDED';
  if (max === 2) return 'WEB_VERIFIED';
  return 'UNKNOWN';
}

export function getLocationVerificationStatus(doctor: Doctor): LocationVerificationStatus {
  const verification = getDoctorMasterVerification(doctor);
  if (verification === 'FIELD_VERIFIED') return 'DOCTOR_FACILITY_CONFIRMED';
  if (verification === 'COMPANY_PROVIDED') return 'FACILITY_CONFIRMED';
  if (verification === 'WEB_VERIFIED' || verification === 'MIXED') return 'FACILITY_CONFIRMED';
  return 'UNKNOWN';
}

export function buildDoctorFacilityIndex(doctors: Doctor[]): DoctorFacilityRecord[] {
  return doctors.map(doctor => {
    const verification = getDoctorMasterVerification(doctor);
    return {
      doctorId: doctor.id,
      doctorName: doctor.name,
      facilityName: doctor.hospital,
      clinic: doctor.clinic,
      area: doctor.area,
      city: doctor.city,
      address: doctor.address,
      specialty: doctor.specialty,
      priority: doctor.priority,
      cgmPotential: doctor.cgmPotential,
      relationshipStatus: doctor.relationshipStatus,
      prescriberStatus: doctor.prescriberStatus,
      companyCode: doctor.companyCode,
      verification,
      locationVerification: getLocationVerificationStatus(doctor),
      timings: [...doctor.timings],
      sourceTypes: [...new Set(doctor.timings.map(t => t.source))]
    };
  });
}

function timingForDate(doctor: Doctor, targetDate: string): DoctorTiming | undefined {
  const day = new Date(`${targetDate}T12:00:00`).getDay();
  return doctor.timings
    .filter(t => t.dayOfWeek === day)
    .sort((a, b) => sourceRank(b.source) - sourceRank(a.source))[0];
}

export function rankDoctorForFieldCall(doctor: Doctor, targetDate: string): DoctorFieldCandidate {
  const timing = timingForDate(doctor, targetDate);
  let score = PRIORITY_SCORE[doctor.priority] + POTENTIAL_SCORE[doctor.cgmPotential] + PRESCRIBER_SCORE[doctor.prescriberStatus];
  const reasons: string[] = [];

  if (doctor.priority === 'A') reasons.push('A-priority account');
  if (doctor.cgmPotential === 'high') reasons.push('High CGM opportunity');
  if (doctor.prescriberStatus === 'active_prescriber' || doctor.prescriberStatus === 'advocate') reasons.push('Existing prescribing relationship');
  if (timing) {
    score += 15;
    reasons.push(`Known calling window: ${timing.startTime}-${timing.endTime}`);
  } else {
    reasons.push('No verified timing for target day');
  }

  const verification = getDoctorMasterVerification(doctor);
  if (verification === 'FIELD_VERIFIED') {
    score += 10;
    reasons.push('Field-verified data');
  } else if (verification === 'WEB_VERIFIED' || verification === 'MIXED') {
    score += 4;
    reasons.push('Web-supported facility/timing data');
  }

  return {
    doctor,
    facility: doctor.hospital,
    area: doctor.area,
    timing,
    score,
    reasons,
    verification
  };
}

export function rankFieldCandidates(doctors: Doctor[], targetDate: string, excludedDoctorIds: string[] = []): DoctorFieldCandidate[] {
  const excluded = new Set(excludedDoctorIds);
  return doctors
    .filter(doctor => !excluded.has(doctor.id) && doctor.isActive !== false)
    .map(doctor => rankDoctorForFieldCall(doctor, targetDate))
    .sort((a, b) => b.score - a.score || a.doctor.name.localeCompare(b.doctor.name));
}

export function groupFacilityCallPoints(doctors: Doctor[]): Record<string, DoctorFacilityRecord[]> {
  return buildDoctorFacilityIndex(doctors).reduce<Record<string, DoctorFacilityRecord[]>>((groups, record) => {
    const key = `${record.city}::${record.area}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(record);
    return groups;
  }, {});
}
