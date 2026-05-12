export interface QuestionOption {
  key: string;
  text: string;
}

export interface Question {
  id: string;
  text: string;
  options: QuestionOption[];
}

export interface ExamSection {
  id: string;
  title: string;
  questions: Question[];
}

export interface SafetyExamPayload {
  fullName: string;
  email: string;
  militaryId: string;
  rank: string;
  answers: Record<string, string>;
  totalQuestions: number;
}
