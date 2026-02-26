export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  rationale: string;
}

export interface QuizSession {
  questions: QuizQuestion[];
  currentQuestionIndex: number;
  score: number;
  userAnswers: (number | null)[];
  isFinished: boolean;
}
