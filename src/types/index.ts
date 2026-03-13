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
  questionResponses: { [questionId: string]: string | number | string[] };
}

export interface Concept {
  id: string;
  title: string;
  description: string;
  imageBase64?: string;   // Optional base64-encoded image data
  imageMimeType?: string; // e.g. 'image/png', 'image/jpeg'
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
    insights: string[];
  };
  questions?: Question[];
}

export type ResponseType = 'scale_1_5' | 'scale_1_10' | 'rank_order' | 'open_ended';

export interface Question {
  id: string;
  text: string;
  type: ResponseType;
  enabled: boolean;
}

// Chat types
export type ChatMode = 'follow_up' | 'focus_group';

export interface ChatMessage {
  id: string;
  role: 'user' | 'persona';
  personaId?: string;
  personaName?: string;
  content: string;
  timestamp: Date;
}

export interface SurveyContext {
  concepts: Concept[];
  questions: Question[];
  analyses: PreferenceAnalysis[];
}

export interface ChatSession {
  mode: ChatMode;
  selectedPersonas: ConsumerProfile[];
  messages: ChatMessage[];
  surveyContext: SurveyContext;
}
