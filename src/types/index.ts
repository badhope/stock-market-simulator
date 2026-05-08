export interface Province {
  id: string;
  name: string;
  region: 'east' | 'central' | 'west' | 'northeast';
  candidates: number;
  undergraduateRate: number;
  keyUniversityRate: number;
  top985Rate: number;
  top211Rate: number;
  difficultyLevel: 1 | 2 | 3 | 4;
  localUniversities: { '985': number; '211': number; 'doubleFirst': number };
  undergraduateLine: number;
  sources: { enrollmentRate: string; candidates: string; scoreLine: string };
  educationInvestment: { perStudentFunding: number; educationGDPPercent: number; ruralFundingRatio: number };
  socialMobility: { ruralStudentRatio: number; familyEducationSpending: number; parentalEducationImpact: number };
  policyFactors: { localEnrollmentRatio: number; ruralSpecialPlan: number; retakeStudentRatio: number };
  urbanRuralGap: { urbanStudentRate: number; capitalStudentRate: number; nonCapitalRate: number };
  hiddenFactors: { hmtEnrollment: number; foreignEnrollment: number; overseaStudyRate: number; internationalSchoolStudents: number; studentQualityIndex: number; tutoringCostPerStudent: number; eliteSchoolConcentration: number };
}

export interface FilterState {
  selectedProvinces: string[];
  sortBy: 'candidates' | 'undergraduateRate' | 'difficulty';
  sortOrder: 'asc' | 'desc';
  regionFilter: string[];
  difficultyFilter: number[];
  difficultyLevel?: number;
  region?: string;
  minUndergraduateRate?: number;
}

export interface MiningInsight {
  category: string;
  title: string;
  description: string;
  data: { label: string; value: number; unit: string }[];
  conclusion: string;
}

export interface EducationFunnel {
  stage: string;
  total: number;
  passed: number;
  rate: number;
  filter: string;
}
