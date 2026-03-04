export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  rationale: string;
}

export interface Flashcard {
  id: string;
  term: string;
  definition: string;
}

export interface IdentificationQuestion {
  id: string;
  term: string;
  definition: string;
  hint?: string;
}

export interface QuizSession {
  questions: QuizQuestion[];
  currentQuestionIndex: number;
  score: number;
  userAnswers: (number | null)[];
  isFinished: boolean;
}
