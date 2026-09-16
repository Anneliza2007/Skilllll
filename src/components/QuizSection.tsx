import { useState } from 'react';
import {
  HelpCircle,
  Sparkles,
  CheckCircle,
  XCircle,
  ArrowRight,
  RotateCcw,
  Zap,
  Award,
  BookOpen,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Brain,
} from 'lucide-react';
import { QuizQuestion, StudentProfile, StudentSkill } from '../types';
import { SkillTutorCopilot } from './SkillTutorCopilot';

interface QuizSectionProps {
  profile: StudentProfile;
  initialTopic?: string;
  onQuizCompleted: (topic: string, score: number, total: number) => void;
  onOpenPromptLab?: (promptId?: string) => void;
}

export function QuizSection({ profile, initialTopic, onQuizCompleted, onOpenPromptLab }: QuizSectionProps) {
  // Categorize skills into Weak (<70% or Beginner/Intermediate) and Strong (>=70% or Advanced/Expert)
  const weakSkills = profile.skills
    .filter((s) => s.level === 'Beginner' || s.level === 'Intermediate' || s.masteryScore < 70)
    .sort((a, b) => a.masteryScore - b.masteryScore);

  const strongSkills = profile.skills
    .filter((s) => (s.level === 'Advanced' || s.level === 'Expert') && s.masteryScore >= 70)
    .sort((a, b) => b.masteryScore - a.masteryScore);

  const [activeMode, setActiveMode] = useState<'weak' | 'strong'>('weak');

  const defaultTopic =
    initialTopic ||
    (activeMode === 'weak'
      ? (weakSkills[0]?.name || 'SQL & Relational Databases')
      : (strongSkills[0]?.name || 'React & TypeScript Architecture'));

  const [selectedTopic, setSelectedTopic] = useState(defaultTopic);
  const [customTopicInput, setCustomTopicInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[] | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [isQuizFinished, setIsQuizFinished] = useState(false);
  const [answersHistory, setAnswersHistory] = useState<
    { question: QuizQuestion; chosenIndex: number; isCorrect: boolean }[]
  >([]);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [copilotHintsCount, setCopilotHintsCount] = useState(0);

  // Start / Generate Quiz
  const handleStartQuiz = async (topicToFetch?: string) => {
    const topic = topicToFetch || selectedTopic;
    setIsLoading(true);
    setQuizQuestions(null);
    setCurrentQuestionIndex(0);
    setSelectedOptionIndex(null);
    setIsAnswerSubmitted(false);
    setScore(0);
    setIsQuizFinished(false);
    setAnswersHistory([]);

    try {
      const res = await fetch('/api/gemini/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          weakSkills: activeMode === 'weak' ? weakSkills.map((w) => w.name) : [],
          studentLevel: activeMode === 'strong' ? 'advanced' : 'intermediate',
          count: 3,
        }),
      });
      const data = await res.json();
      if (data.success && data.data?.questions) {
        setQuizQuestions(data.data.questions);
      }
    } catch (err) {
      console.error('Quiz fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectOption = (idx: number) => {
    if (isAnswerSubmitted) return;
    setSelectedOptionIndex(idx);
  };

  const handleSubmitAnswer = () => {
    if (selectedOptionIndex === null || !quizQuestions) return;
    const currentQ = quizQuestions[currentQuestionIndex];
    const isCorrect = selectedOptionIndex === currentQ.correctAnswerIndex;

    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    setIsAnswerSubmitted(true);
    setAnswersHistory((prev) => [
      ...prev,
      { question: currentQ, chosenIndex: selectedOptionIndex, isCorrect },
    ]);
  };

  const handleNextQuestion = () => {
    if (!quizQuestions) return;
    if (currentQuestionIndex + 1 < quizQuestions.length) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOptionIndex(null);
      setIsAnswerSubmitted(false);
    } else {
      setIsQuizFinished(true);
      onQuizCompleted(selectedTopic, score + (selectedOptionIndex === quizQuestions[currentQuestionIndex]?.correctAnswerIndex ? 0 : 0), quizQuestions.length);
    }
  };

  const currentQ = quizQuestions ? quizQuestions[currentQuestionIndex] : null;

  const activeSkillsList = activeMode === 'weak' ? weakSkills : strongSkills;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className={`border rounded-2xl p-5 shadow-lg relative overflow-hidden transition-all ${
        activeMode === 'weak'
          ? 'bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border-amber-500/20'
          : 'bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border-emerald-500/20'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                activeMode === 'weak'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              }`}>
                <Zap className="w-3.5 h-3.5" />
                {activeMode === 'weak' ? 'Blindspot Diagnostic Engine' : 'High-Mastery Architecture Engine'}
              </span>
              <span className="text-xs text-slate-400">
                Earn <strong className={activeMode === 'weak' ? 'text-amber-300' : 'text-emerald-300'}>+50 XP</strong> per session
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
              {activeMode === 'weak' ? 'Personalized Weak Topic Diagnostics' : 'Strong Topic Mastery Challenges'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              {activeMode === 'weak'
                ? 'Surface hidden conceptual traps and edge-case bugs before interviewers do. Every diagnostic gives a 1-sentence quick-fix takeaway.'
                : 'Take your strongest skills to the elite 1% tier. Solve non-trivial questions about scalability, memory contention, and architectural trade-offs.'}
            </p>
          </div>

          {onOpenPromptLab && (
            <button
              onClick={() => onOpenPromptLab('prompt-diagnostic-quiz')}
              className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Prompt Lab</span>
            </button>
          )}
        </div>
      </div>

      {/* Weak vs Strong Mode Toggle */}
      {!quizQuestions && !isLoading && (
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => {
              setActiveMode('weak');
              if (weakSkills.length > 0) setSelectedTopic(weakSkills[0].name);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeMode === 'weak'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Target Weak Skills ({weakSkills.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveMode('strong');
              if (strongSkills.length > 0) setSelectedTopic(strongSkills[0].name);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeMode === 'strong'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>Push Strong Skills to Peak ({strongSkills.length})</span>
          </button>
        </div>
      )}

      {/* Topics Selector */}
      {!quizQuestions && !isLoading && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-md">
          <div>
            <h2 className="text-base font-bold text-slate-100 mb-1 flex items-center gap-2">
              {activeMode === 'weak' ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Identified Growth Areas (&lt; 70% Mastery)</span>
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>Your Standout Strengths (≥ 70% Mastery)</span>
                </>
              )}
            </h2>
            <p className="text-xs text-slate-400">
              {activeMode === 'weak'
                ? 'Choose a weak skill to isolate bugs, syntax pitfalls, and diagnostic edge cases:'
                : 'Choose a strong skill to tackle advanced design patterns, concurrency, and performance optimization:'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {activeSkillsList.length > 0 ? (
              activeSkillsList.map((skill, sIdx) => {
                const isSelected = selectedTopic === skill.name;
                const isStrong = activeMode === 'strong';
                return (
                  <button
                    key={`${skill.id || skill.name}-${sIdx}`}
                    onClick={() => setSelectedTopic(skill.name)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? isStrong
                          ? 'bg-emerald-500/10 border-emerald-500/50 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500/30'
                          : 'bg-amber-500/10 border-amber-500/50 shadow-md shadow-amber-500/10 ring-1 ring-amber-500/30'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-200 text-sm">{skill.name}</span>
                      <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${
                        isStrong
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      }`}>
                        {skill.level}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
                      <span>Mastery Score:</span>
                      <span className="font-mono font-semibold text-slate-200">{skill.masteryScore}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full ${isStrong ? 'bg-emerald-400' : 'bg-amber-400'}`}
                        style={{ width: `${skill.masteryScore}%` }}
                      />
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="col-span-full p-4 text-center text-slate-400 text-xs">
                No skills in this category yet. Pick a custom topic below or update your profile inventory.
              </div>
            )}
          </div>

          {/* Custom Topic Row */}
          <div className="pt-2 border-t border-slate-800/80">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Or Test Any Specific Engineering Topic:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customTopicInput}
                onChange={(e) => setCustomTopicInput(e.target.value)}
                placeholder="e.g., Docker container networking, SQL indexing, React reconciliation..."
                className="flex-1 px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && customTopicInput.trim()) {
                    setSelectedTopic(customTopicInput.trim());
                    handleStartQuiz(customTopicInput.trim());
                  }
                }}
              />
              <button
                onClick={() => {
                  if (customTopicInput.trim()) {
                    setSelectedTopic(customTopicInput.trim());
                    handleStartQuiz(customTopicInput.trim());
                  }
                }}
                disabled={!customTopicInput.trim()}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Set Topic
              </button>
            </div>
          </div>

          {/* Launch Quiz Action */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <div className="text-xs text-slate-400">
              Selected Topic: <strong className={activeMode === 'weak' ? 'text-amber-300 font-semibold' : 'text-emerald-300 font-semibold'}>{selectedTopic}</strong>
            </div>
            <button
              id="start-quiz-button"
              onClick={() => handleStartQuiz()}
              className={`px-6 py-2.5 font-extrabold rounded-xl text-xs flex items-center gap-2 shadow-lg active:scale-95 transition-all cursor-pointer ${
                activeMode === 'weak'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-amber-500/20'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/20'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>{activeMode === 'weak' ? 'Generate Diagnostic Quiz (+50 XP)' : 'Generate Mastery Challenge (+50 XP)'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-amber-500/20 border-t-amber-400 animate-spin mx-auto" />
          <h3 className="text-base font-bold text-slate-100">
            Synthesizing Diagnostic Questions for "{selectedTopic}"...
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Gemini is formulating realistic code debugging scenarios to test your conceptual depth and prepare you for technical rounds.
          </p>
        </div>
      )}

      {/* Active Quiz View */}
      {quizQuestions && !isQuizFinished && currentQ && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl animate-in fade-in duration-200">
          {/* Quiz Status Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-semibold">
                {selectedTopic}
              </span>
              <span className="text-xs text-slate-400">
                Question {currentQuestionIndex + 1} of {quizQuestions.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold text-emerald-400">
                Score: {score}/{currentQuestionIndex + (isAnswerSubmitted ? 1 : 0)}
              </span>

              <button
                onClick={() => setIsCopilotOpen((prev) => !prev)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isCopilotOpen
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-750 border border-slate-700'
                }`}
                title="Consult SkillTutor Socratic Copilot for conceptual hints without spoilers"
              >
                <Brain className="w-3.5 h-3.5 text-indigo-400" />
                <span>{isCopilotOpen ? 'Hide SkillTutor' : 'Ask SkillTutor'}</span>
              </button>

              <button
                onClick={() => setQuizQuestions(null)}
                className="text-xs text-slate-400 hover:text-slate-200 p-1 rounded transition-colors cursor-pointer"
              >
                Quit Quiz
              </button>
            </div>
          </div>

          {/* Question Text */}
          <div className="space-y-3">
            <h3 className="text-base sm:text-lg font-bold text-slate-100 leading-snug">
              {currentQ.question}
            </h3>

            {currentQ.codeSnippet && (
              <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-sky-300 overflow-x-auto">
                <code>{currentQ.codeSnippet}</code>
              </pre>
            )}
          </div>

          {/* Options */}
          <div className="space-y-2.5">
            {currentQ.options.map((option, idx) => {
              const isSelected = selectedOptionIndex === idx;
              let optionStyle = 'bg-slate-950/70 border-slate-800 text-slate-200 hover:border-slate-700';

              if (isAnswerSubmitted) {
                if (idx === currentQ.correctAnswerIndex) {
                  optionStyle = 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200 ring-1 ring-emerald-500/40 font-semibold';
                } else if (isSelected) {
                  optionStyle = 'bg-red-950/40 border-red-500/60 text-red-200 ring-1 ring-red-500/40';
                } else {
                  optionStyle = 'bg-slate-950/40 border-slate-800/60 text-slate-500 opacity-60';
                }
              } else if (isSelected) {
                optionStyle = 'bg-sky-500/10 border-sky-500/60 text-sky-200 ring-1 ring-sky-500/30';
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  disabled={isAnswerSubmitted}
                  className={`w-full p-3.5 rounded-xl border text-left text-xs sm:text-sm flex items-start gap-3 transition-all cursor-pointer ${optionStyle}`}
                >
                  <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-xs font-mono shrink-0 mt-0.5">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="leading-relaxed">{option}</span>
                </button>
              );
            })}
          </div>

          {/* Explanation & Quick Fix Tip after submission */}
          {isAnswerSubmitted && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div
                className={`p-4 rounded-xl border text-xs leading-relaxed ${
                  selectedOptionIndex === currentQ.correctAnswerIndex
                    ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                    : 'bg-red-950/30 border-red-500/30 text-red-200'
                }`}
              >
                <div className="flex items-center gap-2 font-bold mb-1">
                  {selectedOptionIndex === currentQ.correctAnswerIndex ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>Spot on! That's correct.</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-red-400" />
                      <span>Not quite. Let's fix this misconception:</span>
                    </>
                  )}
                </div>
                <p className="text-slate-300 mt-1">{currentQ.explanation}</p>
              </div>

              {/* Quick Fix Rule */}
              <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-3.5 text-xs text-amber-200 flex items-start gap-2.5">
                <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-amber-300 block mb-0.5">Fix-it Takeaway Rule:</span>
                  <p className="text-amber-100/90">{currentQ.quickFixTip}</p>
                </div>
              </div>
            </div>
          )}

          {/* SkillTutor Copilot In-Quiz Drawer */}
          {isCopilotOpen && (
            <div className="pt-4 border-t border-slate-800 animate-in fade-in duration-200">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <Brain className="w-3.5 h-3.5 text-indigo-400" />
                  <span>SkillTutor Copilot Guidance (Socratic Hints Only)</span>
                </span>
                <span className="text-[11px] text-slate-400">
                  Hints used on this question: {copilotHintsCount}
                </span>
              </div>
              <SkillTutorCopilot
                problemTitle={currentQ.question}
                problemContext={currentQ.codeSnippet || currentQ.question}
                topic={selectedTopic}
                hintsUsedCount={copilotHintsCount}
                onHintUsed={() => setCopilotHintsCount((c) => c + 1)}
                isCompact
              />
            </div>
          )}

          {/* Footer Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <span className="text-xs text-slate-400">
              {isAnswerSubmitted
                ? currentQuestionIndex + 1 === quizQuestions.length
                  ? 'Last question completed!'
                  : 'Review the explanation and continue'
                : 'Select an answer to submit'}
            </span>

            {!isAnswerSubmitted ? (
              <button
                onClick={handleSubmitAnswer}
                disabled={selectedOptionIndex === null}
                className="px-5 py-2 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Check Answer
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                <span>{currentQuestionIndex + 1 === quizQuestions.length ? 'Finish & Claim XP' : 'Next Question'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Quiz Finished Screen */}
      {isQuizFinished && quizQuestions && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 text-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 p-0.5 mx-auto shadow-xl shadow-amber-500/20">
            <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
              <Award className="w-8 h-8 text-amber-400" />
            </div>
          </div>

          <div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold uppercase tracking-wider">
              Diagnostic Session Complete
            </span>
            <h2 className="text-2xl font-bold text-slate-100 mt-2">
              You Scored {score} / {quizQuestions.length} ({Math.round((score / quizQuestions.length) * 100)}%)
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
              Great work! Your diagnostic performance has been recorded. +50 XP and skill mastery score updated.
            </p>
          </div>

          {/* XP & Mastery Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto text-left">
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold">
                +50
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Experience Earned</span>
                <span className="text-sm font-bold text-slate-100">+50 XP Added</span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs text-slate-400 block">{selectedTopic}</span>
                <span className="text-sm font-bold text-emerald-400">Mastery Up +15%</span>
              </div>
            </div>
          </div>

          {/* Cheat-Sheet Recap of Quick-Fix Tips */}
          <div className="text-left bg-slate-950/80 border border-slate-800 rounded-xl p-4 max-w-2xl mx-auto space-y-3">
            <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              Key Rules Learned in this Session (Review Sheet):
            </h4>
            <div className="space-y-2 text-xs">
              {quizQuestions.map((q, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <p className="font-semibold text-slate-200">Q{idx + 1}: {q.question}</p>
                  <p className="text-amber-200/90 italic">💡 Rule: {q.quickFixTip}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              onClick={() => handleStartQuiz()}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retry This Topic</span>
            </button>
            <button
              onClick={() => setQuizQuestions(null)}
              className="px-6 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>Choose Another Weak Skill</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
