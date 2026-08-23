export type LanguageMode = 'sw' | 'en' | 'both';

export type FindingStatus = 'normal' | 'attention' | 'inconclusive';

export interface KeyFinding {
  title_en: string;
  title_sw: string;
  explanation_en: string;
  explanation_sw: string;
  status: FindingStatus;
}

export interface MedicalTerm {
  term: string;
  meaning_en: string;
  meaning_sw: string;
}

export interface InterpretationResponse {
  modality: string;
  modality_sw?: string;
  bodyRegion: string;
  bodyRegion_sw?: string;
  overallSummary_en: string;
  overallSummary_sw: string;
  keyFindings: KeyFinding[];
  medicalTermsGlossary: MedicalTerm[];
  questionsForDoctor_en: string[];
  questionsForDoctor_sw: string[];
  disclaimer_en: string;
  disclaimer_sw: string;
  detectedOriginalLanguage?: string;
  reportRawText?: string;
}

export interface SampleReport {
  id: string;
  title_en: string;
  title_sw: string;
  category: string;
  description_en: string;
  description_sw: string;
  text: string;
}
