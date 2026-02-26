import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Plus, 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Brain, 
  Loader2,
  Trophy,
  ChevronRight,
  HelpCircle
} from "lucide-react";
import Markdown from "react-markdown";
import confetti from "canvas-confetti";
import { parseQuizContent } from "./services/geminiService";
import { QuizQuestion } from "./types";
import { cn } from "./lib/utils";

type View = "input" | "quiz" | "results";

export default function App() {
  const [view, setView] = useState<View>("input");
  const [rawInput, setRawInput] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [shuffledOptions, setShuffledOptions] = useState<{ text: string; originalIndex: number }[]>([]);

  // Shuffle options when question changes
  useEffect(() => {
    if (questions.length > 0 && currentIndex < questions.length) {
      const currentQuestion = questions[currentIndex];
      const options = currentQuestion.options.map((text, index) => ({
        text,
        originalIndex: index,
      }));
      
      // Fisher-Yates shuffle
      for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
      }
      
      setShuffledOptions(options);
      setSelectedAnswer(null);
      setIsSubmitted(false);
    }
  }, [currentIndex, questions]);

  const handleStartQuiz = async () => {
    if (!rawInput.trim()) return;
    setIsParsing(true);
    try {
      const parsedQuestions = await parseQuizContent(rawInput);
      if (parsedQuestions.length > 0) {
        setQuestions(parsedQuestions);
        setCurrentIndex(0);
        setScore(0);
        setView("quiz");
      } else {
        alert("Could not parse any questions. Please try again with a different format.");
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred while parsing the quiz.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;
    setIsSubmitted(true);
    
    const currentQuestion = questions[currentIndex];
    const isCorrect = shuffledOptions[selectedAnswer].originalIndex === currentQuestion.correctAnswerIndex;
    
    if (isCorrect) {
      setScore(s => s + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1);
    } else {
      setView("results");
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  const handleReset = () => {
    setView("input");
    setRawInput("");
    setQuestions([]);
    setCurrentIndex(0);
    setScore(0);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#141414] font-sans selection:bg-emerald-200">
      <header className="border-b border-[#141414]/10 bg-white/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#141414] rounded-xl flex items-center justify-center text-white">
              <Brain size={24} />
            </div>
            <h1 className="text-xl font-bold tracking-tight">QuizCraft</h1>
          </div>
          {view !== "input" && (
            <button 
              onClick={handleReset}
              className="text-sm font-medium flex items-center gap-1 hover:text-emerald-600 transition-colors"
            >
              <RotateCcw size={16} />
              Reset
            </button>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {view === "input" && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <h2 className="text-4xl font-bold tracking-tight text-[#141414]">
                  Transform your notes into <br />
                  <span className="text-emerald-600 italic font-serif">interactive quizzes.</span>
                </h2>
                <p className="text-lg text-[#141414]/60 max-w-2xl">
                  Paste your questions, multiple choices, and rationales below. Our AI will automatically detect the structure and build your quiz.
                </p>
              </div>

              <div className="relative group">
                <textarea
                  value={rawInput}
                  onChange={(e) => setRawInput(e.target.value)}
                  placeholder="Example:
1. What is the capital of France?
A) London
B) Paris
C) Berlin
D) Madrid
Correct: B
Rationale: Paris has been the capital of France since the 6th century."
                  className="w-full h-80 p-6 bg-white border-2 border-[#141414]/10 rounded-3xl focus:border-emerald-500 focus:ring-0 transition-all resize-none text-lg leading-relaxed placeholder:text-[#141414]/20"
                />
                <div className="absolute bottom-6 right-6">
                  <button
                    onClick={handleStartQuiz}
                    disabled={isParsing || !rawInput.trim()}
                    className={cn(
                      "px-8 py-4 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20",
                      isParsing || !rawInput.trim() 
                        ? "bg-[#141414]/10 text-[#141414]/40 cursor-not-allowed" 
                        : "bg-emerald-600 text-white hover:bg-emerald-700 hover:scale-[1.02] active:scale-[0.98]"
                    )}
                  >
                    {isParsing ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        Parsing...
                      </>
                    ) : (
                      <>
                        <Play size={20} />
                        Start Quiz
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { icon: <Plus size={20} />, title: "Smart Detection", desc: "AI identifies questions, options, and rationales automatically." },
                  { icon: <RotateCcw size={20} />, title: "Shuffle System", desc: "Choices are shuffled every time to keep it challenging." },
                  { icon: <CheckCircle2 size={20} />, title: "Instant Feedback", desc: "Learn as you go with detailed rationales for every answer." }
                ].map((feature, i) => (
                  <div key={i} className="p-6 bg-white rounded-2xl border border-[#141414]/5">
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
                      {feature.icon}
                    </div>
                    <h3 className="font-bold mb-1">{feature.title}</h3>
                    <p className="text-sm text-[#141414]/60">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {view === "quiz" && questions.length > 0 && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">Question {currentIndex + 1} of {questions.length}</span>
                  <div className="h-2 w-64 bg-[#141414]/5 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-emerald-600"
                      initial={{ width: 0 }}
                      animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">Score</span>
                  <p className="text-xl font-bold">{score}</p>
                </div>
              </div>

              <div className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-[#141414]/5 shadow-xl shadow-[#141414]/5 space-y-8">
                <h3 className="text-2xl md:text-3xl font-bold leading-tight">
                  {questions[currentIndex].question}
                </h3>

                <div className="grid grid-cols-1 gap-4">
                  {shuffledOptions.map((option, idx) => {
                    const isCorrect = option.originalIndex === questions[currentIndex].correctAnswerIndex;
                    const isSelected = selectedAnswer === idx;
                    
                    let buttonClass = "p-6 rounded-2xl border-2 text-left transition-all flex items-center justify-between group";
                    
                    if (!isSubmitted) {
                      buttonClass += isSelected 
                        ? " border-emerald-600 bg-emerald-50 text-emerald-900" 
                        : " border-[#141414]/5 hover:border-[#141414]/20 hover:bg-[#141414]/2";
                    } else {
                      if (isCorrect) {
                        buttonClass += " border-emerald-600 bg-emerald-50 text-emerald-900";
                      } else if (isSelected) {
                        buttonClass += " border-red-600 bg-red-50 text-red-900";
                      } else {
                        buttonClass += " border-[#141414]/5 opacity-50";
                      }
                    }

                    return (
                      <button
                        key={idx}
                        disabled={isSubmitted}
                        onClick={() => setSelectedAnswer(idx)}
                        className={buttonClass}
                      >
                        <span className="text-lg font-medium">{option.text}</span>
                        <div className="flex items-center gap-3">
                          {isSubmitted && isCorrect && <CheckCircle2 className="text-emerald-600" size={24} />}
                          {isSubmitted && isSelected && !isCorrect && <XCircle className="text-red-600" size={24} />}
                          {!isSubmitted && (
                            <div className={cn(
                              "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                              isSelected ? "border-emerald-600 bg-emerald-600" : "border-[#141414]/10 group-hover:border-[#141414]/30"
                            )}>
                              {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <AnimatePresence>
                  {isSubmitted && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-8 bg-[#141414] text-white rounded-3xl space-y-4"
                    >
                      <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-widest text-xs">
                        <HelpCircle size={16} />
                        Rationale
                      </div>
                      <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-p:text-white/80">
                        <Markdown>{questions[currentIndex].rationale}</Markdown>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="pt-4 flex justify-end">
                  {!isSubmitted ? (
                    <button
                      onClick={handleSubmitAnswer}
                      disabled={selectedAnswer === null}
                      className={cn(
                        "px-10 py-4 rounded-2xl font-bold flex items-center gap-2 transition-all",
                        selectedAnswer === null
                          ? "bg-[#141414]/10 text-[#141414]/40 cursor-not-allowed"
                          : "bg-[#141414] text-white hover:scale-[1.02] active:scale-[0.98]"
                      )}
                    >
                      Submit Answer
                      <ChevronRight size={20} />
                    </button>
                  ) : (
                    <button
                      onClick={handleNextQuestion}
                      className="px-10 py-4 bg-emerald-600 text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-emerald-700 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {currentIndex < questions.length - 1 ? "Next Question" : "Finish Quiz"}
                      <ArrowRight size={20} />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {view === "results" && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto space-y-12 text-center"
            >
              <div className="space-y-6">
                <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8">
                  <Trophy size={48} />
                </div>
                <h2 className="text-5xl font-bold tracking-tight">Quiz Complete!</h2>
                <p className="text-xl text-[#141414]/60">
                  You scored <span className="text-[#141414] font-bold">{score}</span> out of <span className="text-[#141414] font-bold">{questions.length}</span> questions.
                </p>
              </div>

              <div className="bg-white p-12 rounded-[3rem] border border-[#141414]/5 shadow-xl shadow-[#141414]/5 space-y-8">
                <div className="relative w-48 h-48 mx-auto">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle 
                      cx="50" cy="50" r="45" 
                      fill="none" stroke="#F5F5F0" strokeWidth="10" 
                    />
                    <motion.circle 
                      cx="50" cy="50" r="45" 
                      fill="none" stroke="#10b981" strokeWidth="10" 
                      strokeDasharray="283"
                      initial={{ strokeDashoffset: 283 }}
                      animate={{ strokeDashoffset: 283 - (283 * (score / questions.length)) }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold">{Math.round((score / questions.length) * 100)}%</span>
                    <span className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">Accuracy</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => {
                      setCurrentIndex(0);
                      setScore(0);
                      setView("quiz");
                    }}
                    className="px-8 py-4 bg-[#141414] text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    <RotateCcw size={20} />
                    Try Again
                  </button>
                  <button
                    onClick={handleReset}
                    className="px-8 py-4 bg-white border-2 border-[#141414]/10 rounded-2xl font-bold flex items-center justify-center gap-2 hover:border-[#141414]/20 transition-all"
                  >
                    <Plus size={20} />
                    New Quiz
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="max-w-4xl mx-auto px-6 py-12 border-t border-[#141414]/5 text-center">
        <p className="text-sm text-[#141414]/40 font-medium">
          Powered by Gemini AI • Crafted for Learning
        </p>
      </footer>
    </div>
  );
}
