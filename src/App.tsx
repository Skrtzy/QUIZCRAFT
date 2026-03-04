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
  HelpCircle,
  LayoutGrid,
  CreditCard,
  Zap,
  ArrowLeft,
  Home as HomeIcon,
  Eye,
  EyeOff
} from "lucide-react";
import Markdown from "react-markdown";
import confetti from "canvas-confetti";
import { parseQuizContent, parseIdentificationContent } from "./services/geminiService";
import { QuizQuestion, IdentificationQuestion } from "./types";
import { cn } from "./lib/utils";

type View = "home" | "input_mcq" | "input_id" | "quiz_mcq" | "quiz_id" | "flashcards" | "results_mcq" | "results_id";

export default function App() {
  const [view, setView] = useState<View>("home");
  const [rawInput, setRawInput] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [scramble, setScramble] = useState(false);
  
  // MCQ State
  const [mcqQuestions, setMcqQuestions] = useState<QuizQuestion[]>([]);
  const [mcqIndex, setMcqIndex] = useState(0);
  const [mcqScore, setMcqScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [shuffledOptions, setShuffledOptions] = useState<{ text: string; originalIndex: number }[]>([]);

  // Identification State
  const [idQuestions, setIdQuestions] = useState<IdentificationQuestion[]>([]);
  const [idIndex, setIdIndex] = useState(0);
  const [idScore, setIdScore] = useState(0);
  const [userTypedAnswer, setUserTypedAnswer] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [isIdSubmitted, setIsIdSubmitted] = useState(false);

  // Flashcard State
  const [isFlipped, setIsFlipped] = useState(false);

  // Shuffle MCQ options
  useEffect(() => {
    if (view === "quiz_mcq" && mcqQuestions.length > 0 && mcqIndex < mcqQuestions.length) {
      const currentQuestion = mcqQuestions[mcqIndex];
      const options = currentQuestion.options.map((text, index) => ({
        text,
        originalIndex: index,
      }));
      
      for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
      }
      
      setShuffledOptions(options);
      setSelectedAnswer(null);
      setIsSubmitted(false);
    }
  }, [mcqIndex, mcqQuestions, view]);

  // Reset ID state when question changes
  useEffect(() => {
    if (view === "quiz_id" || view === "flashcards") {
      setUserTypedAnswer("");
      setShowHint(false);
      setIsIdSubmitted(false);
      setIsFlipped(false);
    }
  }, [idIndex, view]);

  const handleStartMcq = async () => {
    if (!rawInput.trim()) return;
    setIsParsing(true);
    try {
      const parsed = await parseQuizContent(rawInput);
      if (parsed.length > 0) {
        let finalQuestions = parsed;
        if (scramble) {
          finalQuestions = [...parsed].sort(() => Math.random() - 0.5);
        }
        setMcqQuestions(finalQuestions);
        setMcqIndex(0);
        setMcqScore(0);
        setView("quiz_mcq");
      } else {
        alert("Could not parse any questions. Please try again.");
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred while parsing.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleStartId = async (targetView: "flashcards" | "quiz_id") => {
    if (!rawInput.trim()) return;
    setIsParsing(true);
    try {
      const parsed = await parseIdentificationContent(rawInput);
      if (parsed.length > 0) {
        let finalQuestions = parsed;
        if (scramble) {
          finalQuestions = [...parsed].sort(() => Math.random() - 0.5);
        }
        setIdQuestions(finalQuestions);
        setIdIndex(0);
        setIdScore(0);
        setView(targetView);
      } else {
        alert("Could not parse any terms. Please try again.");
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred while parsing.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleReset = () => {
    setView("home");
    setRawInput("");
    setMcqQuestions([]);
    setIdQuestions([]);
  };

  const handleMcqSubmit = () => {
    if (selectedAnswer === null) return;
    setIsSubmitted(true);
    if (shuffledOptions[selectedAnswer].originalIndex === mcqQuestions[mcqIndex].correctAnswerIndex) {
      setMcqScore(s => s + 1);
    }
  };

  const handleIdSubmit = () => {
    if (!userTypedAnswer.trim()) return;
    setIsIdSubmitted(true);
    const correct = userTypedAnswer.trim().toLowerCase() === idQuestions[idIndex].term.toLowerCase();
    if (correct) {
      setIdScore(s => s + 1);
    }
  };

  const handleNextMcq = () => {
    if (mcqIndex < mcqQuestions.length - 1) {
      setMcqIndex(i => i + 1);
    } else {
      setView("results_mcq");
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    }
  };

  const handleNextId = () => {
    if (idIndex < idQuestions.length - 1) {
      setIdIndex(i => i + 1);
    } else {
      if (view === "quiz_id") {
        setView("results_id");
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      } else {
        setView("home");
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#141414] font-sans selection:bg-emerald-200">
      <header className="border-b border-[#141414]/10 bg-white/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={handleReset}>
            <div className="w-10 h-10 bg-[#141414] rounded-xl flex items-center justify-center text-white">
              <Brain size={24} />
            </div>
            <h1 className="text-xl font-bold tracking-tight">QuizCraft</h1>
          </div>
          <div className="flex items-center gap-4">
            {view !== "home" && (
              <button 
                onClick={handleReset}
                className="text-sm font-medium flex items-center gap-1 hover:text-emerald-600 transition-colors"
              >
                <HomeIcon size={16} />
                Home
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {view === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <div className="text-center space-y-4">
                <h2 className="text-5xl font-bold tracking-tight text-[#141414]">
                  What would you like to <br />
                  <span className="text-emerald-600 italic font-serif">study today?</span>
                </h2>
                <p className="text-xl text-[#141414]/60 max-w-2xl mx-auto">
                  Choose a study mode and let AI transform your notes into a powerful learning experience.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <button 
                  onClick={() => setView("input_mcq")}
                  className="group p-8 bg-white rounded-[2.5rem] border-2 border-[#141414]/5 hover:border-emerald-600 transition-all text-left space-y-6 shadow-xl shadow-[#141414]/5"
                >
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <LayoutGrid size={32} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold">Multiple Choice</h3>
                    <p className="text-[#141414]/60 leading-relaxed">
                      Classic quiz format with shuffled options and detailed rationales. Best for testing conceptual understanding.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-600 font-bold">
                    Get Started <ChevronRight size={20} />
                  </div>
                </button>

                <button 
                  onClick={() => setView("input_id")}
                  className="group p-8 bg-white rounded-[2.5rem] border-2 border-[#141414]/5 hover:border-emerald-600 transition-all text-left space-y-6 shadow-xl shadow-[#141414]/5"
                >
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Zap size={32} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold">Identification</h3>
                    <p className="text-[#141414]/60 leading-relaxed">
                      Master terms and definitions through flashcards or fast-paced identification quizzes.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-600 font-bold">
                    Get Started <ChevronRight size={20} />
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {(view === "input_mcq" || view === "input_id") && (
            <motion.div
              key="input"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <button onClick={() => setView("home")} className="flex items-center gap-2 text-[#141414]/60 hover:text-[#141414] font-medium transition-colors">
                <ArrowLeft size={20} /> Back to Home
              </button>
              
              <div className="space-y-4">
                <h2 className="text-4xl font-bold tracking-tight">
                  {view === "input_mcq" ? "Multiple Choice Quiz" : "Identification Study"}
                </h2>
                <p className="text-lg text-[#141414]/60">
                  {view === "input_mcq" 
                    ? "Paste your questions, choices, and rationales." 
                    : "Paste your terms and meanings. AI will generate flashcards and quizzes."}
                </p>
              </div>

              <div className="space-y-6 relative group">
                <textarea
                  value={rawInput}
                  onChange={(e) => setRawInput(e.target.value)}
                  placeholder={view === "input_mcq" 
                    ? "Example:\n1. What is photosynthesis?\nA) Process of plants making food\nB) Process of animals breathing\nCorrect: A\nRationale: Plants use sunlight to synthesize nutrients."
                    : "Example:\nPhotosynthesis - the process by which green plants and some other organisms use sunlight to synthesize foods.\nCell - the smallest structural and functional unit of an organism."}
                  className="w-full h-80 p-8 bg-white border-2 border-[#141414]/10 rounded-3xl focus:border-emerald-500 focus:ring-0 transition-all resize-none text-lg leading-relaxed placeholder:text-[#141414]/20"
                />

                <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white/50 p-6 rounded-3xl border border-[#141414]/5 backdrop-blur-sm">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setScramble(!scramble)}
                      className="flex items-center gap-3 group cursor-pointer"
                    >
                      <div className={cn(
                        "w-12 h-6 rounded-full transition-colors relative",
                        scramble ? "bg-emerald-600" : "bg-[#141414]/10"
                      )}>
                        <motion.div 
                          className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm"
                          animate={{ x: scramble ? 24 : 0 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      </div>
                      <span className="font-bold text-[#141414]/80 group-hover:text-emerald-600 transition-colors">
                        Scramble Questions
                      </span>
                    </button>
                  </div>

                  <div className="flex gap-4 w-full md:w-auto">
                    {view === "input_mcq" ? (
                      <button
                        onClick={handleStartMcq}
                        disabled={isParsing || !rawInput.trim()}
                        className={cn(
                          "flex-1 md:flex-none px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20",
                          isParsing || !rawInput.trim() 
                            ? "bg-[#141414]/10 text-[#141414]/40 cursor-not-allowed" 
                            : "bg-emerald-600 text-white hover:bg-emerald-700 hover:scale-[1.02] active:scale-[0.98]"
                        )}
                      >
                        {isParsing ? <Loader2 className="animate-spin" size={20} /> : <Play size={20} />}
                        Start Quiz
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleStartId("flashcards")}
                          disabled={isParsing || !rawInput.trim()}
                          className={cn(
                            "flex-1 md:flex-none px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all border-2 border-[#141414]/10 bg-white",
                            isParsing || !rawInput.trim() ? "opacity-50 cursor-not-allowed" : "hover:border-emerald-600 hover:text-emerald-600"
                          )}
                        >
                          <CreditCard size={20} /> Flashcards
                        </button>
                        <button
                          onClick={() => handleStartId("quiz_id")}
                          disabled={isParsing || !rawInput.trim()}
                          className={cn(
                            "flex-1 md:flex-none px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all bg-emerald-600 text-white shadow-lg shadow-emerald-500/20",
                            isParsing || !rawInput.trim() ? "opacity-50 cursor-not-allowed" : "hover:bg-emerald-700"
                          )}
                        >
                          <Zap size={20} /> Fast Quiz
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {view === "flashcards" && idQuestions.length > 0 && (
            <motion.div
              key="flashcards"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-12"
            >
              <div className="flex items-center justify-between">
                <button onClick={() => setView("input_id")} className="flex items-center gap-2 text-[#141414]/60 hover:text-[#141414] font-medium">
                  <ArrowLeft size={20} /> Back
                </button>
                <span className="text-sm font-bold uppercase tracking-widest text-emerald-600">Card {idIndex + 1} of {idQuestions.length}</span>
              </div>

              <div className="max-w-xl mx-auto perspective-1000">
                <motion.div
                  className="relative w-full h-96 preserve-3d cursor-pointer"
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                  onClick={() => setIsFlipped(!isFlipped)}
                >
                  {/* Front */}
                  <div className="absolute inset-0 backface-hidden bg-white border-2 border-[#141414]/5 rounded-[3rem] shadow-2xl shadow-[#141414]/5 flex flex-col items-center justify-center p-12 text-center">
                    <span className="text-xs font-bold uppercase tracking-widest text-[#141414]/30 mb-4">Term</span>
                    <h3 className="text-4xl font-bold leading-tight">{idQuestions[idIndex].term}</h3>
                    <div className="mt-12 text-emerald-600 flex items-center gap-2 text-sm font-bold animate-pulse">
                      Click to flip <RotateCcw size={14} />
                    </div>
                  </div>
                  {/* Back */}
                  <div 
                    className="absolute inset-0 backface-hidden bg-[#141414] text-white border-2 border-[#141414] rounded-[3rem] shadow-2xl shadow-[#141414]/20 flex flex-col items-center justify-center p-12 text-center"
                    style={{ transform: "rotateY(180deg)" }}
                  >
                    <span className="text-xs font-bold uppercase tracking-widest text-white/30 mb-4">Meaning</span>
                    <p className="text-2xl leading-relaxed">{idQuestions[idIndex].definition}</p>
                  </div>
                </motion.div>
              </div>

              <div className="flex justify-center gap-6">
                <button 
                  onClick={() => setIdIndex(i => Math.max(0, i - 1))}
                  disabled={idIndex === 0}
                  className="w-16 h-16 rounded-full border-2 border-[#141414]/10 flex items-center justify-center hover:border-emerald-600 hover:text-emerald-600 disabled:opacity-30 transition-all"
                >
                  <ArrowLeft size={24} />
                </button>
                <button 
                  onClick={handleNextId}
                  className="px-12 py-4 bg-[#141414] text-white rounded-2xl font-bold flex items-center gap-2 hover:scale-[1.05] active:scale-[0.95] transition-all"
                >
                  {idIndex < idQuestions.length - 1 ? "Next Card" : "Finish Session"}
                  <ArrowRight size={20} />
                </button>
              </div>
            </motion.div>
          )}

          {view === "quiz_id" && idQuestions.length > 0 && (
            <motion.div
              key="quiz_id"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">Identification {idIndex + 1} of {idQuestions.length}</span>
                  <div className="h-2 w-64 bg-[#141414]/5 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-emerald-600"
                      initial={{ width: 0 }}
                      animate={{ width: `${((idIndex + 1) / idQuestions.length) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">Score</span>
                  <p className="text-xl font-bold">{idScore}</p>
                </div>
              </div>

              <div className="bg-white p-12 rounded-[3rem] border border-[#141414]/5 shadow-xl shadow-[#141414]/5 space-y-12">
                <div className="space-y-4">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#141414]/30">Definition</span>
                  <h3 className="text-3xl font-bold leading-tight">{idQuestions[idIndex].definition}</h3>
                </div>

                <div className="space-y-6">
                  <div className="relative">
                    <input
                      type="text"
                      value={userTypedAnswer}
                      onChange={(e) => setUserTypedAnswer(e.target.value)}
                      disabled={isIdSubmitted}
                      placeholder="Type the term here..."
                      className={cn(
                        "w-full p-8 text-2xl font-bold bg-[#F5F5F0] border-2 rounded-3xl transition-all focus:ring-0",
                        isIdSubmitted 
                          ? (userTypedAnswer.trim().toLowerCase() === idQuestions[idIndex].term.toLowerCase() ? "border-emerald-600 bg-emerald-50" : "border-red-600 bg-red-50")
                          : "border-transparent focus:border-emerald-600"
                      )}
                      onKeyDown={(e) => e.key === "Enter" && !isIdSubmitted && handleIdSubmit()}
                    />
                    {isIdSubmitted && (
                      <div className="absolute right-6 top-1/2 -translate-y-1/2">
                        {userTypedAnswer.trim().toLowerCase() === idQuestions[idIndex].term.toLowerCase() 
                          ? <CheckCircle2 className="text-emerald-600" size={32} />
                          : <XCircle className="text-red-600" size={32} />
                        }
                      </div>
                    )}
                  </div>

                  {isIdSubmitted && userTypedAnswer.trim().toLowerCase() !== idQuestions[idIndex].term.toLowerCase() && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 bg-emerald-50 border border-emerald-100 rounded-2xl">
                      <p className="text-emerald-900 font-bold">Correct Answer: <span className="text-xl">{idQuestions[idIndex].term}</span></p>
                    </motion.div>
                  )}

                  {!isIdSubmitted && idQuestions[idIndex].hint && (
                    <div className="flex justify-center">
                      <button 
                        onClick={() => setShowHint(!showHint)}
                        className="text-sm font-bold text-emerald-600 flex items-center gap-2 hover:underline"
                      >
                        {showHint ? <EyeOff size={16} /> : <Eye size={16} />}
                        {showHint ? `Hint: ${idQuestions[idIndex].hint}` : "Need a hint?"}
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  {!isIdSubmitted ? (
                    <button
                      onClick={handleIdSubmit}
                      disabled={!userTypedAnswer.trim()}
                      className={cn(
                        "px-12 py-4 rounded-2xl font-bold flex items-center gap-2 transition-all",
                        !userTypedAnswer.trim() ? "bg-[#141414]/10 text-[#141414]/40 cursor-not-allowed" : "bg-[#141414] text-white hover:scale-[1.02]"
                      )}
                    >
                      Submit Answer <ChevronRight size={20} />
                    </button>
                  ) : (
                    <button
                      onClick={handleNextId}
                      className="px-12 py-4 bg-emerald-600 text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-emerald-700 transition-all"
                    >
                      {idIndex < idQuestions.length - 1 ? "Next Question" : "Finish Quiz"} <ArrowRight size={20} />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {view === "quiz_mcq" && mcqQuestions.length > 0 && (
            <motion.div
              key="quiz_mcq"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">Question {mcqIndex + 1} of {mcqQuestions.length}</span>
                  <div className="h-2 w-64 bg-[#141414]/5 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-emerald-600"
                      initial={{ width: 0 }}
                      animate={{ width: `${((mcqIndex + 1) / mcqQuestions.length) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">Score</span>
                  <p className="text-xl font-bold">{mcqScore}</p>
                </div>
              </div>

              <div className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-[#141414]/5 shadow-xl shadow-[#141414]/5 space-y-8">
                <h3 className="text-2xl md:text-3xl font-bold leading-tight">
                  {mcqQuestions[mcqIndex].question}
                </h3>

                <div className="grid grid-cols-1 gap-4">
                  {shuffledOptions.map((option, idx) => {
                    const isCorrect = option.originalIndex === mcqQuestions[mcqIndex].correctAnswerIndex;
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
                        <Markdown>{mcqQuestions[mcqIndex].rationale}</Markdown>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="pt-4 flex justify-end">
                  {!isSubmitted ? (
                    <button
                      onClick={handleMcqSubmit}
                      disabled={selectedAnswer === null}
                      className={cn(
                        "px-10 py-4 rounded-2xl font-bold flex items-center gap-2 transition-all",
                        selectedAnswer === null
                          ? "bg-[#141414]/10 text-[#141414]/40 cursor-not-allowed"
                          : "bg-[#141414] text-white hover:scale-[1.02] active:scale-[0.98]"
                      )}
                    >
                      Submit Answer <ChevronRight size={20} />
                    </button>
                  ) : (
                    <button
                      onClick={handleNextMcq}
                      className="px-10 py-4 bg-emerald-600 text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-emerald-700 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {mcqIndex < mcqQuestions.length - 1 ? "Next Question" : "Finish Quiz"} <ArrowRight size={20} />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {(view === "results_mcq" || view === "results_id") && (
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
                <h2 className="text-5xl font-bold tracking-tight">Session Complete!</h2>
                <p className="text-xl text-[#141414]/60">
                  You scored <span className="text-[#141414] font-bold">{view === "results_mcq" ? mcqScore : idScore}</span> out of <span className="text-[#141414] font-bold">{view === "results_mcq" ? mcqQuestions.length : idQuestions.length}</span>.
                </p>
              </div>

              <div className="bg-white p-12 rounded-[3rem] border border-[#141414]/5 shadow-xl shadow-[#141414]/5 space-y-8">
                <div className="relative w-48 h-48 mx-auto">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#F5F5F0" strokeWidth="10" />
                    <motion.circle 
                      cx="50" cy="50" r="45" fill="none" stroke="#10b981" strokeWidth="10" 
                      strokeDasharray="283"
                      initial={{ strokeDashoffset: 283 }}
                      animate={{ strokeDashoffset: 283 - (283 * ((view === "results_mcq" ? mcqScore : idScore) / (view === "results_mcq" ? mcqQuestions.length : idQuestions.length))) }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold">{Math.round(((view === "results_mcq" ? mcqScore : idScore) / (view === "results_mcq" ? mcqQuestions.length : idQuestions.length)) * 100)}%</span>
                    <span className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">Accuracy</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => {
                      if (view === "results_mcq") {
                        setMcqIndex(0); setMcqScore(0); setView("quiz_mcq");
                      } else {
                        setIdIndex(0); setIdScore(0); setView("quiz_id");
                      }
                    }}
                    className="px-8 py-4 bg-[#141414] text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    <RotateCcw size={20} /> Try Again
                  </button>
                  <button
                    onClick={handleReset}
                    className="px-8 py-4 bg-white border-2 border-[#141414]/10 rounded-2xl font-bold flex items-center justify-center gap-2 hover:border-[#141414]/20 transition-all"
                  >
                    <HomeIcon size={20} /> Back to Home
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
