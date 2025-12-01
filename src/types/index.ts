export interface ConsumerProfile {
  id: string;
  name: string;
  age: number;
  gender: string;
  location: string;
  income: string;
  education: string;
  lifestyle: string;
  interests: string[];
  shoppingBehavior: string;
  techSavviness: string;
  environmentalAwareness: string;
  brandLoyalty: string;
  pricesensitivity: string;
}

export interface PreferenceAnalysis {
  profileId: string;
  conceptId: string;
  preference: number; // 1-10 scale
  innovativeness: number; // 1-10 scale
  differentiation: number; // 1-10 scale
  reasoning: string;
}

export interface Concept {
  id: string;
  title: string;
  description: string;
}

export interface DemographicInput {
  ageRanges: string[];
  genders: string[];
  locations: string[];
  incomeRanges: string[];
  educationLevels: string[];
  consumerCount: number;
  ageMin?: number;
  ageMax?: number;
  incomeMin?: number;
  incomeMax?: number;
  additionalContext?: string;
  uploadedFiles?: Array<{name: string; content: string; type: string}>;
}

export interface AnalysisReport {
  id: string;
  timestamp: Date;
  demographics: DemographicInput;
  concepts: Concept[];
  profiles: ConsumerProfile[];
  analyses: PreferenceAnalysis[];
  summary: {
    averagePreference: number;
    averageInnovativeness: number;
    averageDifferentiation: number;
    topPerformingConcept: string;
    insights: string[];
  };
}
