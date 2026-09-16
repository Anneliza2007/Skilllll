import { useState, useEffect, useRef, useMemo, type ClipboardEvent } from 'react';
import {
  Brain,
  Shield,
  Sparkles,
  Award,
  AlertOctagon,
  CheckCircle2,
  XCircle,
  TrendingUp,
  FileText,
  RotateCcw,
  BookOpen,
  ArrowRight,
  Printer,
  ChevronRight,
  Compass,
  Lightbulb,
  ExternalLink,
  Timer,
  History,
  Gauge,
  Zap,
  Sliders,
  Eye,
  Activity,
  BarChart3,
  HelpCircle,
  Lock,
  Code2,
} from 'lucide-react';
import {
  StudentProfile,
  UserStats,
  SkillTutorChallenge,
  SkillTutorSubmission,
  SkillTutorReport,
  SkillTutorMode,
  SkillTutorRevisionLog,
  PasteViolationType,
  SkillTutorPasteAttempt,
  SignedSnippetToken,
} from '../types';
import { SKILL_TUTOR_CHALLENGES } from '../data/skillTutorData';
import { SkillTutorCopilot } from './SkillTutorCopilot';
import { AntiCheatCodeMirror } from './AntiCheatCodeMirror';
import { AntiPasteConceptualEditor } from './AntiPasteConceptualEditor';
import { AntiPasteViolationModal } from './AntiPasteViolationModal';
import { SkillTutorCompiler } from './SkillTutorCompiler';
import { AddProblemModal } from './AddProblemModal';
import {
  isAuthorizedCopilotSnippet,
  detectCodeBlockPatterns,
} from '../utils/skillTutorClipboard';
import {
  injectAuthorizedSnippetDirectly,
  generateSignedCopilotToken,
  calculateIntegrityScore,
  createPasteAttemptLog,
} from '../utils/skillTutorSecurity';

interface SkillTutorWorkspaceProps {
  profile: StudentProfile;
  stats: UserStats;
  onAddXp: (amount: number, description: string) => void;
  onShowToast: (toast: {
    type: 'success' | 'info' | 'streak' | 'xp';
    title: string;
    description: string;
  }) => void;
  onNavigateToTab?: (tab: any) => void;
}

export function SkillTutorWorkspace({
  profile,
  stats,
  onAddXp,
  onShowToast,
  onNavigateToTab,
}: SkillTutorWorkspaceProps) {
  // Custom problems & compiler state
  const [customChallenges, setCustomChallenges] = useState<SkillTutorChallenge[]>(() => {
    try {
      const saved = localStorage.getItem('skilltutor_custom_challenges');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isAddProblemModalOpen, setIsAddProblemModalOpen] = useState(false);

  const allChallenges = useMemo(() => {
    return [...customChallenges, ...SKILL_TUTOR_CHALLENGES];
  }, [customChallenges]);

  const [selectedChallenge, setSelectedChallenge] = useState<SkillTutorChallenge>(
    allChallenges[0] || SKILL_TUTOR_CHALLENGES[0]
  );
  const [studentAnswer, setStudentAnswer] = useState<string>('');
  const [hintsUsedCount, setHintsUsedCount] = useState<number>(0);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [currentSubmission, setCurrentSubmission] = useState<SkillTutorSubmission | null>(null);

  // SkillTutor Pedagogical Mode
  const [activeMode, setActiveMode] = useState<SkillTutorMode>('hint');

  // Hardened Anti-Cheat Workspace Configuration
  const [editorMode, setEditorMode] = useState<'codemirror' | 'conceptual'>('codemirror');
  const [pasteAttempts, setPasteAttempts] = useState<SkillTutorPasteAttempt[]>(() => {
    try {
      const saved = localStorage.getItem('skilltutor_paste_attempts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [violationModal, setViolationModal] = useState<{
    isOpen: boolean;
    attempt: SkillTutorPasteAttempt | null;
  }>({ isOpen: false, attempt: null });

  // Telemetry state: Time on task, attempts, revisions, refusal & copied tracking
  const [timeOnTaskSeconds, setTimeOnTaskSeconds] = useState<number>(0);
  const [attemptsCount, setAttemptsCount] = useState<number>(0);
  const [refusalCount, setRefusalCount] = useState<number>(0);
  const [copiedWarnings, setCopiedWarnings] = useState<number>(0);
  const [revisions, setRevisions] = useState<SkillTutorRevisionLog[]>([]);
  const [showRevisionDrawer, setShowRevisionDrawer] = useState<boolean>(false);
  const lastRevisionRef = useRef<{ text: string; time: number }>({ text: '', time: Date.now() });

  // Persist anti-cheat paste attempts
  useEffect(() => {
    localStorage.setItem('skilltutor_paste_attempts', JSON.stringify(pasteAttempts));
  }, [pasteAttempts]);

  // Anti-paste shield alert banner state
  const [pasteAlert, setPasteAlert] = useState<{
    show: boolean;
    type: 'blocked' | 'authorized';
    message: string;
  } | null>(null);

  // Submissions history for Career Growth Report
  const [submissionHistory, setSubmissionHistory] = useState<SkillTutorSubmission[]>(() => {
    try {
      const saved = localStorage.getItem('skilltutor_submissions');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Career Growth Report & Multi-Mode subtabs
  const [activeSubTab, setActiveSubTab] = useState<'compiler' | 'solver' | 'report'>('compiler');
  const [growthReport, setGrowthReport] = useState<SkillTutorReport | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState<boolean>(false);

  const handleSaveCustomProblem = (newChallenge: SkillTutorChallenge) => {
    setCustomChallenges((prev) => {
      const existingIdx = prev.findIndex((p) => p.id === newChallenge.id);
      let updated: SkillTutorChallenge[];
      if (existingIdx >= 0) {
        updated = [...prev];
        updated[existingIdx] = newChallenge;
      } else {
        updated = [newChallenge, ...prev];
      }
      localStorage.setItem('skilltutor_custom_challenges', JSON.stringify(updated));
      return updated;
    });
    setSelectedChallenge(newChallenge);
    onShowToast({
      type: 'success',
      title: 'Problem Statement Ready',
      description: `"${newChallenge.title}" saved with Python, C, and C++ compiler support!`,
    });
  };

  // Persist submissions
  useEffect(() => {
    localStorage.setItem('skilltutor_submissions', JSON.stringify(submissionHistory));
  }, [submissionHistory]);

  // Stopwatch for Time-on-Task Telemetry
  useEffect(() => {
    if (activeSubTab !== 'solver') return;
    const interval = setInterval(() => {
      setTimeOnTaskSeconds((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeSubTab]);

  // Derive weak areas & past mistakes adaptively from profile & history
  const weakAreas = useMemo(() => {
    const gaps = profile.skills
      .filter((s) => s.masteryScore < 75 || s.level === 'Beginner' || s.level === 'Intermediate')
      .map((s) => s.name);
    return gaps.length > 0 ? gaps.slice(0, 4) : ['Data Structure Invariants', 'Space Bounds'];
  }, [profile.skills]);

  const pastMistakes = useMemo(() => {
    const mistakes: string[] = [];
    submissionHistory.forEach((sub) => {
      if (sub.cognitiveGaps && Array.isArray(sub.cognitiveGaps)) {
        mistakes.push(...sub.cognitiveGaps);
      }
    });
    return mistakes.slice(0, 4);
  }, [submissionHistory]);

  // Anti-Cheat Integrity Calculation & Unresolved Violations
  const { score: integrityScore, signal: integritySignal } = useMemo(() => {
    return calculateIntegrityScore(pasteAttempts);
  }, [pasteAttempts]);

  const unresolvedViolationsCount = useMemo(() => {
    return pasteAttempts.filter((a) => !a.resolved).length;
  }, [pasteAttempts]);

  // Real-time Independence Score & AI Reliance Score calculations (factoring anti-cheat integrity)
  const independenceScore = useMemo(() => {
    const raw =
      100 -
      hintsUsedCount * 10 -
      refusalCount * 12 -
      copiedWarnings * 8 -
      pasteAttempts.length * 6 +
      (currentSubmission?.passed ? 5 : 0);
    return Math.max(10, Math.min(100, Math.round(raw)));
  }, [hintsUsedCount, refusalCount, copiedWarnings, pasteAttempts.length, currentSubmission]);

  const aiRelianceScore = useMemo(() => {
    return Math.max(0, Math.min(90, 100 - independenceScore + pasteAttempts.length * 4));
  }, [independenceScore, pasteAttempts.length]);

  // Track code revisions in real time
  const handleStudentAnswerChange = (val: string) => {
    setStudentAnswer(val);
    const now = Date.now();
    if (
      Math.abs(val.length - lastRevisionRef.current.text.length) > 20 &&
      now - lastRevisionRef.current.time > 5000
    ) {
      const delta = val.length - lastRevisionRef.current.text.length;
      const logEntry: SkillTutorRevisionLog = {
        id: 'rev_' + now,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        length: val.length,
        characterCount: val.length,
        wordCount: val.trim() ? val.trim().split(/\s+/).length : 0,
        diffSummary:
          delta > 0
            ? `+${delta} chars (expanded reasoning & invariants)`
            : `-${Math.abs(delta)} chars (streamlined conceptual draft)`,
      };
      setRevisions((prev) => [logEntry, ...prev.slice(0, 14)]);
      lastRevisionRef.current = { text: val, time: now };
    }
  };

  // Format time on task
  const formattedTimeOnTask = useMemo(() => {
    const mins = Math.floor(timeOnTaskSeconds / 60);
    const secs = timeOnTaskSeconds % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  }, [timeOnTaskSeconds]);

  // Handle Intercepted Paste/Drop/Burst from Hardened Editors
  const handlePasteBlocked = (type: PasteViolationType, preview: string, len: number) => {
    const attempt = createPasteAttemptLog(type, len, preview);
    setPasteAttempts((prev) => [attempt, ...prev]);
    setCopiedWarnings((c) => c + 1);
    setViolationModal({ isOpen: true, attempt });
    setPasteAlert({
      show: true,
      type: 'blocked',
      message: `🚫 Anti-Cheat Intercept: External ${type.replace(/_/g, ' ')} blocked (${len} chars). You must provide a conceptual explanation to unlock evaluation.`,
    });
    setTimeout(() => setPasteAlert(null), 6500);

    onShowToast({
      type: 'info',
      title: 'Anti-Paste Shield Active',
      description: 'External copy-paste is blocked. Please articulate the conceptual logic yourself.',
    });
  };

  // Resolve Violation with Student's Written Explanation
  const handleResolveViolation = (explanation: string) => {
    if (!violationModal.attempt) return;
    const targetId = violationModal.attempt.id;
    setPasteAttempts((prev) =>
      prev.map((item) =>
        item.id === targetId
          ? { ...item, resolved: true, studentExplanation: explanation }
          : item
      )
    );
    setViolationModal({ isOpen: false, attempt: null });
    onShowToast({
      type: 'success',
      title: 'Conceptual Explanation Accepted',
      description: 'Your explanation was logged to your integrity audit trail. Evaluation unlocked.',
    });
  };

  // Insert authorized snippet directly into answer box via HMAC token
  const handleInsertAuthorizedSnippet = (snippet: string, signedToken?: SignedSnippetToken) => {
    const token = signedToken || generateSignedCopilotToken(snippet);
    injectAuthorizedSnippetDirectly(
      studentAnswer,
      snippet,
      token,
      (newText) => {
        handleStudentAnswerChange(newText);
        setHintsUsedCount((h) => h + 1);
        setPasteAlert({
          show: true,
          type: 'authorized',
          message: `✓ Injected HMAC-verified Copilot concept (${token.token.slice(0, 10)}...). OS clipboard bypassed.`,
        });
        setTimeout(() => setPasteAlert(null), 4000);
      },
      (errMsg) => {
        onShowToast({
          type: 'info',
          title: 'Direct Injection Rejected',
          description: errMsg,
        });
      }
    );
  };

  // Submit and evaluate conceptual answer
  const handleSubmitConceptualAnswer = async () => {
    if (!studentAnswer.trim()) {
      onShowToast({
        type: 'info',
        title: 'Empty Scratchpad',
        description: 'Please articulate your conceptual logic before submitting.',
      });
      return;
    }

    // Anti-Cheat Lock: Block evaluation if there are unresolved violations
    if (unresolvedViolationsCount > 0) {
      const firstUnresolved = pasteAttempts.find((a) => !a.resolved);
      if (firstUnresolved) {
        setViolationModal({ isOpen: true, attempt: firstUnresolved });
      }
      onShowToast({
        type: 'info',
        title: 'Submission Locked by Anti-Cheat',
        description: 'You must explain your thinking for flagged paste attempts before evaluation.',
      });
      return;
    }

    // Increment attempts count
    setAttemptsCount((prev) => prev + 1);

    // Check if user is typing raw code
    const codeCheck = detectCodeBlockPatterns(studentAnswer);
    if (codeCheck.isCode && codeCheck.reason) {
      setCopiedWarnings((w) => w + 1);
      onShowToast({
        type: 'info',
        title: 'Code Syntax Detected',
        description: 'Remember to articulate the conceptual invariants and Big-O trade-offs.',
      });
    }

    setIsEvaluating(true);

    try {
      const res = await fetch('/api/gemini/skilltutor-evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemTitle: selectedChallenge.title,
          problemContext: selectedChallenge.conceptualScenario,
          studentAnswer,
          hintsUsedCount,
          topic: selectedChallenge.topic,
          timeOnTaskSeconds,
          attemptsCount: attemptsCount + 1,
          revisionsCount: revisions.length,
          refusalCount,
          copiedWarnings,
          mode: activeMode,
          pasteAttemptsCount: pasteAttempts.length,
          integrityScore,
          integritySignal,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        const evalData = data.data;
        const newSub: SkillTutorSubmission = {
          id: 'sub_' + Date.now(),
          challengeId: selectedChallenge.id,
          challengeTitle: selectedChallenge.title,
          topic: selectedChallenge.topic,
          studentConceptualAnswer: studentAnswer,
          score: evalData.score,
          passed: evalData.passed,
          conceptualDepth: evalData.conceptualDepth,
          selfRelianceRating: evalData.selfRelianceRating,
          hintsUsed: hintsUsedCount,
          independenceScore: evalData.independenceScore ?? independenceScore,
          aiRelianceScore: evalData.aiRelianceScore ?? aiRelianceScore,
          integrityScore: evalData.integrityScore ?? integrityScore,
          integritySignal: evalData.integritySignal ?? integritySignal,
          pasteAttemptsCount: pasteAttempts.length,
          timeOnTaskSeconds: timeOnTaskSeconds,
          attemptsCount: attemptsCount + 1,
          revisionCount: revisions.length,
          revisionsCount: revisions.length,
          modeUsed: activeMode,
          timestamp: new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          strengths: evalData.strengths || [],
          cognitiveGaps: evalData.cognitiveGaps || [],
          socraticFeedback: evalData.socraticFeedback,
          careerReadinessVerdict: evalData.careerReadinessVerdict,
          antiCheatVerified: true,
        };

        setCurrentSubmission(newSub);
        setSubmissionHistory((prev) => [newSub, ...prev]);

        const xpAwarded = evalData.passed ? 60 : 25;
        onAddXp(xpAwarded, `SkillTutor Conceptual Challenge: ${selectedChallenge.title}`);

        onShowToast({
          type: 'xp',
          title: `Challenge Evaluated (${evalData.score}/100)`,
          description: evalData.passed
            ? `Demonstrated solid conceptual depth! +${xpAwarded} XP earned.`
            : 'Good attempt. Review feedback to refine your mental model.',
        });
      }
    } catch (err) {
      console.error('Evaluation error:', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  // Generate or refresh Career Growth Report
  const handleGenerateCareerReport = async () => {
    setIsLoadingReport(true);
    setActiveSubTab('report');

    const totalSubmissions = submissionHistory.length;
    const avgScore =
      totalSubmissions > 0
        ? Math.round(
            submissionHistory.reduce((acc, s) => acc + s.score, 0) / totalSubmissions
          )
        : 85;
    const avgHints =
      totalSubmissions > 0
        ? Number(
            (
              submissionHistory.reduce((acc, s) => acc + s.hintsUsed, 0) / totalSubmissions
            ).toFixed(1)
          )
        : 1.2;

    try {
      const res = await fetch('/api/gemini/skilltutor-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentProfile: profile,
          challengesCompleted: Math.max(3, totalSubmissions),
          avgConceptualScore: avgScore,
          avgHintsPerProblem: avgHints,
          topicsSolved: [
            ...new Set(SKILL_TUTOR_CHALLENGES.map((c) => c.topic)),
          ],
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setGrowthReport(data.data);
      }
    } catch (err) {
      console.error('Report error:', err);
    } finally {
      setIsLoadingReport(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Mode Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-sky-500 to-emerald-400 p-0.5 shadow-md shadow-indigo-500/20">
                <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                  <Brain className="w-5 h-5 text-sky-400" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <span>SkillTutor AI: Socratic Problem Solving</span>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono uppercase tracking-wider">
                    Anti-Cheat Copilot
                  </span>
                </h1>
                <p className="text-xs text-slate-400">
                  Formulate solutions from first principles. External code paste is locked; SkillTutor guides your conceptual breakthrough.
                </p>
              </div>
            </div>
          </div>

          {/* Sub-Tab Navigation */}
          <div className="flex items-center space-x-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveSubTab('compiler')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeSubTab === 'compiler'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Interactive Compiler (Python, C, C++)</span>
            </button>

            <button
              onClick={() => setActiveSubTab('solver')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeSubTab === 'solver'
                  ? 'bg-gradient-to-r from-indigo-500 to-sky-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Conceptual Reasoner</span>
            </button>

            <button
              onClick={handleGenerateCareerReport}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeSubTab === 'report'
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Career &amp; Growth Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Mode 0: Interactive Compiler (Python, C, C++) with Socratic AI Guidance */}
      {activeSubTab === 'compiler' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Socratic Telemetry HUD Bar */}
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 shadow-xl backdrop-blur-sm space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
              {/* Integrity Score */}
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Shield className="w-3 h-3 text-emerald-400" />
                    <span>Integrity</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">0-100</span>
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-xl font-black text-emerald-400">
                    {integrityScore}%
                  </span>
                  <span className="text-[10px] text-emerald-300 font-medium">Verified</span>
                </div>
              </div>

              {/* Supported Languages */}
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Code2 className="w-3 h-3 text-sky-400" />
                    <span>Compilers</span>
                  </span>
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-sm font-bold text-sky-300">Py • C • C++</span>
                  <span className="text-[10px] text-slate-400">Native</span>
                </div>
              </div>

              {/* Paste Guard State */}
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-emerald-400" />
                    <span>Paste Guard</span>
                  </span>
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-xl font-black text-emerald-400">Active</span>
                  <span className="text-[10px] text-slate-400">Locked</span>
                </div>
              </div>

              {/* Hints Used */}
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Lightbulb className="w-3 h-3 text-amber-400" />
                    <span>Hints</span>
                  </span>
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-xl font-black text-amber-300">{hintsUsedCount}</span>
                  <span className="text-[10px] text-slate-400">Stages</span>
                </div>
              </div>

              {/* Context Summary */}
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-col justify-between col-span-2 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Brain className="w-3 h-3 text-indigo-400" />
                    <span>Active Problem Context for AI</span>
                  </span>
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-xs font-semibold text-slate-200 truncate">
                    {selectedChallenge.title}
                  </span>
                </div>
              </div>
            </div>

            {/* Socratic Mode Selector */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5 text-sky-400" />
                  <span>Socratic Mode:</span>
                </span>
                {(
                  [
                    { id: 'hint', label: 'Hint Mode', icon: '💡' },
                    { id: 'socratic', label: 'Socratic Mode', icon: '🏛️' },
                    { id: 'debug', label: 'Debug Mode', icon: '🐛' },
                    { id: 'concept', label: 'Concept Mode', icon: '🧠' },
                    { id: 'interview', label: 'Interview Mode', icon: '🎙️' },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setActiveMode(m.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                      activeMode === m.id
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <span>{m.icon}</span>
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                <span>
                  Adaptive Calibration:{' '}
                  <strong className="text-slate-200">
                    {weakAreas.length > 0 ? weakAreas[0] : 'First-Principles'}
                  </strong>{' '}
                  tuned
                </span>
              </div>
            </div>
          </div>

          {/* Problem Selector Bar with Add Problem Button */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
            <div className="flex items-center space-x-2 flex-wrap gap-2">
              <BookOpen className="w-4 h-4 text-sky-400 shrink-0" />
              <span className="text-xs font-bold text-slate-300">Active Problem:</span>
              <select
                value={selectedChallenge.id}
                onChange={(e) => {
                  const c = allChallenges.find((item) => item.id === e.target.value);
                  if (c) {
                    setSelectedChallenge(c);
                    setStudentAnswer('');
                    setCurrentSubmission(null);
                    setHintsUsedCount(0);
                    setTimeOnTaskSeconds(0);
                  }
                }}
                className="bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold outline-none focus:border-indigo-500 cursor-pointer max-w-xs sm:max-w-md truncate"
              >
                {allChallenges.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    {ch.isCustom ? '★ [Custom] ' : ''}{ch.title} ({ch.difficulty})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsAddProblemModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 hover:opacity-95 shadow-md shadow-indigo-500/20 cursor-pointer transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                <span>+ Add / Draft Problem Statement</span>
              </button>
            </div>
          </div>

          {/* Grid Layout: Compiler on Left (7 cols), Copilot on Right (5 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7">
              <SkillTutorCompiler
                activeChallenge={selectedChallenge}
                onOpenAddProblemModal={() => setIsAddProblemModalOpen(true)}
                onAskCopilotAboutBug={(diagnostic) => {
                  onShowToast({
                    type: 'info',
                    title: 'Diagnostic Forwarded to Copilot',
                    description: `Socratic mentor contextualized "${diagnostic.rootCause}".`,
                  });
                }}
                onShowToast={(t) =>
                  onShowToast({
                    type: t.type === 'error' || t.type === 'warning' ? 'info' : t.type,
                    title: t.title,
                    description: t.description || '',
                  })
                }
                onReportPasteViolation={(typeStr, previewText) => {
                  let vType: PasteViolationType = 'clipboard_paste';
                  if (typeStr === 'drag_drop') vType = 'drag_drop';
                  handlePasteBlocked(vType, previewText, previewText.length);
                }}
                integrityScore={integrityScore}
              />
            </div>

            <div className="lg:col-span-5 sticky top-20">
              <SkillTutorCopilot
                problemTitle={selectedChallenge.title}
                problemContext={selectedChallenge.conceptualScenario}
                topic={selectedChallenge.topic}
                currentDraft={studentAnswer}
                hintsUsedCount={hintsUsedCount}
                onHintUsed={() => setHintsUsedCount((c) => c + 1)}
                onInsertAuthorizedSnippet={handleInsertAuthorizedSnippet}
                onShowToast={onShowToast}
                mode={activeMode}
                onModeChange={setActiveMode}
                onRefusalRecorded={() => setRefusalCount((r) => r + 1)}
                onCopiedDetected={() => setCopiedWarnings((c) => c + 1)}
                weakAreas={weakAreas}
                pastMistakes={pastMistakes}
                problemStatement={selectedChallenge}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Mode 1: Conceptual Challenge Solver */}
      {activeSubTab === 'solver' && (
        <div className="space-y-6">
          {/* Socratic Telemetry HUD Bar */}
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 shadow-xl backdrop-blur-sm space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
              {/* Independence Score Gauge */}
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Shield className="w-3 h-3 text-emerald-400" />
                    <span>Independence</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">0-100</span>
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span
                    className={`text-xl font-black ${
                      independenceScore >= 75
                        ? 'text-emerald-400'
                        : independenceScore >= 50
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {independenceScore}%
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {independenceScore >= 80
                      ? 'Autonomous'
                      : independenceScore >= 50
                      ? 'Guided'
                      : 'Assisted'}
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1 mt-1.5 overflow-hidden">
                  <div
                    className={`h-1 rounded-full transition-all duration-300 ${
                      independenceScore >= 75
                        ? 'bg-emerald-400'
                        : independenceScore >= 50
                        ? 'bg-amber-400'
                        : 'bg-rose-400'
                    }`}
                    style={{ width: `${independenceScore}%` }}
                  />
                </div>
              </div>

              {/* AI Reliance Score Gauge */}
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Gauge className="w-3 h-3 text-indigo-400" />
                    <span>AI Reliance</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Socratic</span>
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span
                    className={`text-xl font-black ${
                      aiRelianceScore <= 25
                        ? 'text-sky-400'
                        : aiRelianceScore <= 55
                        ? 'text-indigo-300'
                        : 'text-amber-400'
                    }`}
                  >
                    {aiRelianceScore}%
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {aiRelianceScore <= 20
                      ? 'Minimal'
                      : aiRelianceScore <= 50
                      ? 'Moderate'
                      : 'Heavy'}
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1 mt-1.5 overflow-hidden">
                  <div
                    className="h-1 rounded-full bg-gradient-to-r from-sky-400 to-indigo-500 transition-all duration-300"
                    style={{ width: `${aiRelianceScore}%` }}
                  />
                </div>
              </div>

              {/* Anti-Cheat Integrity Gauge */}
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-emerald-400" />
                    <span>Integrity</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">Anti-Paste</span>
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span
                    className={`text-xl font-black ${
                      integrityScore >= 90
                        ? 'text-emerald-400'
                        : integrityScore >= 70
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {integrityScore}%
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium truncate max-w-[65px]">
                    {integritySignal}
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1 mt-1.5 overflow-hidden">
                  <div
                    className={`h-1 rounded-full transition-all duration-300 ${
                      integrityScore >= 90
                        ? 'bg-emerald-400'
                        : integrityScore >= 70
                        ? 'bg-amber-400'
                        : 'bg-rose-400'
                    }`}
                    style={{ width: `${integrityScore}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[9px] text-slate-500 mt-1 font-mono">
                  <span>Pastes: {pasteAttempts.length}</span>
                  <span className={unresolvedViolationsCount > 0 ? 'text-rose-400 font-bold' : 'text-slate-500'}>
                    {unresolvedViolationsCount > 0 ? `${unresolvedViolationsCount} Pending` : 'Clean'}
                  </span>
                </div>
              </div>

              {/* Time on Task */}
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Timer className="w-3 h-3 text-amber-400" />
                    <span>Time on Task</span>
                  </span>
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-xl font-black text-slate-100 font-mono">
                    {formattedTimeOnTask}
                  </span>
                  <span className="text-[10px] text-slate-400">Deep Work</span>
                </div>
                <p className="text-[10px] text-slate-500 truncate mt-1.5">
                  Live cognitive engagement
                </p>
              </div>

              {/* Attempts Counter */}
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-sky-400" />
                    <span>Attempts</span>
                  </span>
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-xl font-black text-slate-100">
                    {attemptsCount}
                  </span>
                  <span className="text-[10px] text-slate-400">Submissions</span>
                </div>
                <p className="text-[10px] text-slate-500 truncate mt-1.5">
                  {attemptsCount === 0 ? 'First attempt' : `${attemptsCount} evaluated`}
                </p>
              </div>

              {/* Revision Patterns */}
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-col justify-between col-span-2 sm:col-span-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <History className="w-3 h-3 text-purple-400" />
                    <span>Revisions</span>
                  </span>
                  {revisions.length > 0 && (
                    <button
                      onClick={() => setShowRevisionDrawer(!showRevisionDrawer)}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
                    >
                      {showRevisionDrawer ? 'Hide' : 'Log'}
                    </button>
                  )}
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-xl font-black text-purple-300">
                    {revisions.length}
                  </span>
                  <span className="text-[10px] text-slate-400">Patterns</span>
                </div>
                <p className="text-[10px] text-slate-500 truncate mt-1.5">
                  Iterative thought history
                </p>
              </div>
            </div>

            {/* Revision Patterns History Drawer */}
            {showRevisionDrawer && revisions.length > 0 && (
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-purple-400" />
                    <span>Candidate Code &amp; Conceptual Revision Progression</span>
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {revisions.length} checkpoints logged
                  </span>
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 text-xs">
                  {revisions.map((rev) => (
                    <div
                      key={rev.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300 text-[11px]"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-slate-500">{rev.timestamp}</span>
                        <span className="text-purple-300 font-semibold">{rev.diffSummary}</span>
                      </div>
                      <span className="text-slate-400 font-mono">
                        {rev.wordCount} words ({rev.characterCount} chars)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Adaptive Difficulty & Pedagogical Mode Selector */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5 text-sky-400" />
                  <span>Socratic Mode:</span>
                </span>
                {(
                  [
                    { id: 'hint', label: 'Hint Mode', icon: '💡' },
                    { id: 'socratic', label: 'Socratic Mode', icon: '🏛️' },
                    { id: 'debug', label: 'Debug Mode', icon: '🐛' },
                    { id: 'concept', label: 'Concept Mode', icon: '🧠' },
                    { id: 'interview', label: 'Interview Mode', icon: '🎙️' },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setActiveMode(m.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                      activeMode === m.id
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <span>{m.icon}</span>
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>

              {/* Adaptive Calibration Note */}
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                <span>
                  Adaptive Calibration:{' '}
                  <strong className="text-slate-200">
                    {weakAreas.length > 0 ? weakAreas[0] : 'First-Principles'}
                  </strong>{' '}
                  tuned
                </span>
              </div>
            </div>
          </div>

          {/* Challenge Selector Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
            <div className="flex items-center space-x-2 flex-wrap gap-2">
              <BookOpen className="w-4 h-4 text-sky-400 shrink-0" />
              <span className="text-xs font-bold text-slate-300">Select Challenge:</span>
              <select
                value={selectedChallenge.id}
                onChange={(e) => {
                  const c = allChallenges.find((item) => item.id === e.target.value);
                  if (c) {
                    setSelectedChallenge(c);
                    setStudentAnswer('');
                    setCurrentSubmission(null);
                    setHintsUsedCount(0);
                    setTimeOnTaskSeconds(0);
                    setAttemptsCount(0);
                    setRevisions([]);
                    setRefusalCount(0);
                    setCopiedWarnings(0);
                  }
                }}
                className="bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold outline-none focus:border-indigo-500 cursor-pointer max-w-xs sm:max-w-md truncate"
              >
                {allChallenges.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    {ch.isCustom ? '★ [Custom] ' : ''}{ch.title} ({ch.difficulty})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsAddProblemModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-sky-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 hover:opacity-95 shadow-md shadow-indigo-500/20 cursor-pointer transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                <span>+ Add / Draft Problem</span>
              </button>
              <div className="hidden sm:flex items-center space-x-1.5 pl-2 border-l border-slate-800">
                <span className="text-[11px] text-slate-400">Role:</span>
                <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20 text-xs font-semibold">
                  {selectedChallenge.relatedRole}
                </span>
              </div>
            </div>
          </div>

          {/* Grid: Left Column (Challenge Details & Anti-Paste Scratchpad) / Right Column (SkillTutor Copilot) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Area: Scenario, Prompt & Scratchpad (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Challenge Overview Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-semibold">
                    {selectedChallenge.topic}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Difficulty: {selectedChallenge.difficulty}
                  </span>
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-100">{selectedChallenge.title}</h2>
                  <p className="text-xs text-slate-300 leading-relaxed mt-2 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                    <strong className="text-slate-200 block mb-1">Production Scenario:</strong>
                    {selectedChallenge.conceptualScenario}
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                    <span>Conceptual Objective (No Raw Code):</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-100 font-medium leading-relaxed bg-indigo-950/20 border border-indigo-500/30 p-3.5 rounded-xl">
                    {selectedChallenge.promptQuestion}
                  </p>
                </div>

                {/* Key Principles Pills */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-400 block">
                    Core Principles Evaluated:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedChallenge.keyPrinciples.map((kp, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700 text-[11px]"
                      >
                        ✓ {kp}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Hardened Anti-Cheat Workspace Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                        <span>Anti-Cheat Hardened Editor</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/40">
                          {integrityScore}% Integrity
                        </span>
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Paste, drop, drag, middle-click &amp; autocomplete strictly disabled. Direct HMAC Copilot injection enabled.
                      </p>
                    </div>
                  </div>

                  {/* Editor Mode Selector */}
                  <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setEditorMode('codemirror')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        editorMode === 'codemirror'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Code2 className="w-3.5 h-3.5" />
                      <span>CodeMirror Sandbox</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditorMode('conceptual')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        editorMode === 'conceptual'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Conceptual Reasoner</span>
                    </button>
                  </div>
                </div>

                {/* Real-time Code Pattern Detection Warning */}
                {detectCodeBlockPatterns(studentAnswer).isCode && (
                  <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/50 text-amber-200 text-xs flex items-start gap-2 animate-in fade-in duration-150">
                    <AlertOctagon className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Code / Boilerplate Syntax Detected</p>
                      <p className="text-[11px] text-amber-300/90 mt-0.5">
                        SkillTutor is an anti-paste conceptual sandbox. Instead of writing function signatures or syntax, explain the state invariants, pointer traversals, and trade-offs in plain terms.
                      </p>
                    </div>
                  </div>
                )}

                {/* Unresolved Violations Alert Banner */}
                {unresolvedViolationsCount > 0 && (
                  <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/60 text-rose-200 text-xs flex items-center justify-between gap-3 animate-in fade-in duration-150">
                    <div className="flex items-start gap-2.5">
                      <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">
                          {unresolvedViolationsCount} Flagged Paste Attempt(s) Require Conceptual Explanation
                        </p>
                        <p className="text-[11px] text-rose-300/80 mt-0.5">
                          Evaluation is locked until you articulate the conceptual rationale behind the blocked insertion.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const target = pasteAttempts.find((a) => !a.resolved);
                        if (target) setViolationModal({ isOpen: true, attempt: target });
                      }}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg shrink-0 cursor-pointer shadow-md transition-all"
                    >
                      Explain Thinking
                    </button>
                  </div>
                )}

                {/* Anti-Paste Alert Banner */}
                {pasteAlert && (
                  <div
                    className={`p-3 rounded-xl border text-xs leading-relaxed flex items-start gap-2.5 animate-in fade-in duration-150 ${
                      pasteAlert.type === 'blocked'
                        ? 'bg-rose-950/50 border-rose-500/60 text-rose-200'
                        : 'bg-emerald-950/50 border-emerald-500/60 text-emerald-200'
                    }`}
                  >
                    {pasteAlert.type === 'blocked' ? (
                      <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-semibold">{pasteAlert.message}</p>
                    </div>
                  </div>
                )}

                {/* Hardened Editors Rendering */}
                <div>
                  {editorMode === 'codemirror' ? (
                    <AntiCheatCodeMirror
                      value={studentAnswer}
                      onChange={handleStudentAnswerChange}
                      onPasteBlocked={handlePasteBlocked}
                      placeholder="// CodeMirror Algorithmic Scratchpad&#10;// External paste, drop, drag & middle-click are blocked.&#10;// Articulate pointer mechanics, invariants, or pseudocode manually:&#10;&#10;class Solution {&#10;  // Explain logic & invariants step-by-step&#10;}"
                      language="typescript"
                    />
                  ) : (
                    <AntiPasteConceptualEditor
                      value={studentAnswer}
                      onChange={handleStudentAnswerChange}
                      onPasteBlocked={handlePasteBlocked}
                      placeholder="Articulate your conceptual reasoning here. Explain the invariant logic, asymptotic trade-offs, and boundary reasons in plain English. External copy-pasting is locked to ensure authentic learning."
                      rows={9}
                    />
                  )}
                </div>

                {/* Submit / Evaluate Action */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <button
                    onClick={() => {
                      setStudentAnswer('');
                      setCurrentSubmission(null);
                    }}
                    className="text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Clear Draft</span>
                  </button>

                  <button
                    onClick={handleSubmitConceptualAnswer}
                    disabled={isEvaluating || !studentAnswer.trim()}
                    className={`px-6 py-2.5 font-extrabold rounded-xl text-xs flex items-center gap-2 shadow-lg active:scale-95 transition-all cursor-pointer ${
                      unresolvedViolationsCount > 0
                        ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/30'
                        : 'bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-400 hover:brightness-110 disabled:opacity-50 text-slate-950 shadow-indigo-500/20'
                    }`}
                  >
                    {isEvaluating ? (
                      <>
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                        <span>Evaluating Conceptual Depth...</span>
                      </>
                    ) : unresolvedViolationsCount > 0 ? (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Locked: Conceptual Explanation Required ({unresolvedViolationsCount})</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Evaluate My Conceptual Solution (+60 XP)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Anti-Paste Violation Modal */}
              <AntiPasteViolationModal
                isOpen={violationModal.isOpen}
                violation={violationModal.attempt}
                onClose={() => setViolationModal({ isOpen: false, attempt: null })}
                onExplain={handleResolveViolation}
              />

              {/* Evaluated Submission Feedback Card */}
              {currentSubmission && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl animate-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center space-x-2">
                      <Award className="w-5 h-5 text-amber-400" />
                      <h3 className="text-base font-bold text-slate-100">
                        SkillTutor Evaluation &amp; Verdict
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          currentSubmission.passed
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        Score: {currentSubmission.score} / 100
                      </span>
                    </div>
                  </div>

                  {/* Summary Metric Badges including Telemetry Scores & Anti-Cheat */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Conceptual Depth
                      </span>
                      <span className="text-xs font-extrabold text-sky-400 mt-1 block">
                        {currentSubmission.conceptualDepth}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Independence Score
                      </span>
                      <span className="text-xs font-extrabold text-emerald-400 mt-1 block">
                        {currentSubmission.independenceScore ?? independenceScore}%
                      </span>
                    </div>

                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        AI Reliance Score
                      </span>
                      <span className="text-xs font-extrabold text-indigo-300 mt-1 block">
                        {currentSubmission.aiRelianceScore ?? aiRelianceScore}%
                      </span>
                    </div>

                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Anti-Cheat Integrity
                      </span>
                      <span className="text-xs font-extrabold text-amber-400 mt-1 block truncate">
                        {currentSubmission.integrityScore ?? integrityScore}%
                      </span>
                    </div>

                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center col-span-2 sm:col-span-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Integrity Signal
                      </span>
                      <span className="text-xs font-extrabold text-emerald-300 mt-1 block truncate">
                        {currentSubmission.integritySignal ?? integritySignal}
                      </span>
                    </div>
                  </div>

                  {/* Mentor Socratic Feedback */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                    <h4 className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                      <Brain className="w-4 h-4 text-indigo-400" />
                      <span>SkillTutor Mentor Appraisal:</span>
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {currentSubmission.socraticFeedback}
                    </p>
                  </div>

                  {/* Strengths and Cognitive Gaps */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 bg-emerald-950/20 border border-emerald-500/30 rounded-xl space-y-1.5">
                      <span className="text-xs font-bold text-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Key Conceptual Strengths:</span>
                      </span>
                      <ul className="text-xs text-slate-300 space-y-1">
                        {currentSubmission.strengths.map((str, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-emerald-400">•</span>
                            <span>{str}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3.5 bg-amber-950/20 border border-amber-500/30 rounded-xl space-y-1.5">
                      <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                        <AlertOctagon className="w-3.5 h-3.5 text-amber-400" />
                        <span>Blindspots to Address:</span>
                      </span>
                      <ul className="text-xs text-slate-300 space-y-1">
                        {currentSubmission.cognitiveGaps.map((gap, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-amber-400">•</span>
                            <span>{gap}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Recruiter Interview Readiness Verdict */}
                  <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Interview Readiness Verdict
                      </span>
                      <p className="text-xs font-semibold text-slate-200 mt-0.5">
                        {currentSubmission.careerReadinessVerdict}
                      </p>
                    </div>

                    <button
                      onClick={handleGenerateCareerReport}
                      className="px-3.5 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>View Full Career Report</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Area: SkillTutor Copilot (5 cols) */}
            <div className="lg:col-span-5 sticky top-20">
              <SkillTutorCopilot
                problemTitle={selectedChallenge.title}
                problemContext={selectedChallenge.conceptualScenario}
                topic={selectedChallenge.topic}
                currentDraft={studentAnswer}
                hintsUsedCount={hintsUsedCount}
                onHintUsed={() => setHintsUsedCount((c) => c + 1)}
                onInsertAuthorizedSnippet={handleInsertAuthorizedSnippet}
                onShowToast={onShowToast}
                mode={activeMode}
                onModeChange={setActiveMode}
                onRefusalRecorded={() => setRefusalCount((r) => r + 1)}
                onCopiedDetected={() => setCopiedWarnings((c) => c + 1)}
                weakAreas={weakAreas}
                pastMistakes={pastMistakes}
                problemStatement={selectedChallenge}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Mode 2: SkillTutor Career & Growth Report */}
      {activeSubTab === 'report' && (
        <div className="space-y-6">
          {isLoadingReport && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-400 animate-spin mx-auto" />
              <h3 className="text-base font-bold text-slate-100">
                Synthesizing SkillTutor Career &amp; Conceptual Growth Report...
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Analyzing your Socratic interactions, hint-reliance telemetry, anti-cheat compliance, and interview readiness.
              </p>
            </div>
          )}

          {!isLoadingReport && growthReport && (
            <div
              id="skilltutor-career-report"
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in duration-200"
            >
              {/* Report Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] font-mono uppercase tracking-wider">
                      Official SkillTutor Telemetry
                    </span>
                    <span className="text-xs text-slate-400">
                      Generated: {new Date().toLocaleDateString()}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-100 mt-1">
                    Student Conceptual &amp; Career Growth Report
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Candidate: {profile.name} • Target Role: {profile.targetRole}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print / Save PDF</span>
                  </button>
                  <button
                    onClick={() => setActiveSubTab('solver')}
                    className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>Solve More Challenges</span>
                  </button>
                </div>
              </div>

              {/* KPI Score Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-center">
                  <span className="text-[11px] font-semibold text-slate-400 block">
                    Conceptual Proficiency
                  </span>
                  <span className="text-2xl font-black text-emerald-400 mt-1 block">
                    {growthReport.conceptualProficiencyIndex}%
                  </span>
                  <span className="text-[10px] text-slate-500">First-Principles Rigor</span>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-center">
                  <span className="text-[11px] font-semibold text-slate-400 block">
                    Self-Reliance Rate
                  </span>
                  <span className="text-2xl font-black text-sky-400 mt-1 block">
                    {growthReport.selfRelianceRate}%
                  </span>
                  <span className="text-[10px] text-slate-500">Autonomous Derivations</span>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-center">
                  <span className="text-[11px] font-semibold text-slate-400 block">
                    Anti-Cheat Integrity
                  </span>
                  <span
                    className={`text-2xl font-black mt-1 block ${
                      integrityScore >= 90
                        ? 'text-emerald-400'
                        : integrityScore >= 70
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {integrityScore}%
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {pasteAttempts.length} Interceptions ({integritySignal})
                  </span>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-center">
                  <span className="text-[11px] font-semibold text-slate-400 block">
                    Readiness Tier
                  </span>
                  <span className="text-xs font-extrabold text-indigo-300 mt-2 block truncate">
                    {growthReport.careerReadinessTier}
                  </span>
                  <span className="text-[10px] text-slate-500">Technical Interview Stage</span>
                </div>
              </div>

              {/* Executive Summary */}
              <div className="p-5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Executive Growth Appraisal:</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {growthReport.executiveSummary}
                </p>
              </div>

              {/* Recruiter Pitch Summary Card */}
              <div className="p-5 bg-gradient-to-r from-indigo-950/40 via-slate-950 to-sky-950/40 rounded-xl border border-indigo-500/30 space-y-2">
                <h3 className="text-xs font-bold text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-sky-400" />
                  <span>Recruiter &amp; Hiring Manager Differentiation Point:</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed italic">
                  "{growthReport.recruiterPitchSummary}"
                </p>
              </div>

              {/* Topic Competency Matrix */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-sky-400" />
                  <span>Topic Breakdown &amp; Action Plan:</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {growthReport.topicBreakdown.map((tb, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200">{tb.topic}</span>
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          {tb.score}%
                        </span>
                      </div>

                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-sky-400 to-emerald-400 h-1.5 rounded-full"
                          style={{ width: `${tb.score}%` }}
                        />
                      </div>

                      <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20 inline-block font-semibold">
                        {tb.status}
                      </span>

                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {tb.recommendation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strengths vs Growth Opportunities */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-slate-950 rounded-xl border border-emerald-500/30 space-y-2">
                  <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Verified Core Strengths:</span>
                  </span>
                  <ul className="text-xs text-slate-300 space-y-1.5">
                    {growthReport.topStrengths.map((s, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">✓</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-amber-500/30 space-y-2">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <AlertOctagon className="w-4 h-4 text-amber-400" />
                    <span>Target Growth Opportunities:</span>
                  </span>
                  <ul className="text-xs text-slate-300 space-y-1.5">
                    {growthReport.growthOpportunities.map((g, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-amber-400 font-bold">→</span>
                        <span>{g}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Anti-Cheat & Academic Integrity Telemetry Log */}
              <div className="p-5 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <div className="flex items-center space-x-2">
                    <Lock className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      Academic Integrity &amp; AI Reliance Audit Trail
                    </h3>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono">
                    {integrityScore}% Verified Organic Logic
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-semibold">Intercepted External Pastes</span>
                    <span className="text-base font-bold text-slate-100 mt-0.5 block">{pasteAttempts.length} Blocked</span>
                    <span className="text-[10px] text-slate-500">DOM-level clipboard lockdown</span>
                  </div>
                  <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-semibold">Conceptual Explanations</span>
                    <span className="text-base font-bold text-emerald-400 mt-0.5 block">
                      {pasteAttempts.filter(a => a.resolved).length} / {pasteAttempts.length} Re-articulated
                    </span>
                    <span className="text-[10px] text-slate-500">Manual student rationale</span>
                  </div>
                  <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-semibold">HMAC Copilot Tokens</span>
                    <span className="text-base font-bold text-indigo-300 mt-0.5 block">Direct Injection Active</span>
                    <span className="text-[10px] text-slate-500">60-second cryptographically signed hints</span>
                  </div>
                </div>

                {pasteAttempts.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    <span className="text-[10px] font-semibold text-slate-400 block">Recent Intercept Log:</span>
                    <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                      {pasteAttempts.slice(0, 5).map((att) => (
                        <div key={att.id} className="p-2 rounded-lg bg-slate-900 border border-slate-800/80 text-[11px] flex items-center justify-between gap-2">
                          <div className="truncate flex-1">
                            <span className="text-rose-400 font-mono font-semibold uppercase text-[10px] mr-1.5">
                              [{att.type.replace(/_/g, ' ')}]
                            </span>
                            <span className="text-slate-300 italic truncate">"{att.attemptedTextSnippet.slice(0, 50)}..."</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono shrink-0">{att.timestamp}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal to Add / Draft Problem Statements */}
      <AddProblemModal
        isOpen={isAddProblemModalOpen}
        onClose={() => setIsAddProblemModalOpen(false)}
        onSaveProblem={handleSaveCustomProblem}
        initialChallenge={selectedChallenge.isCustom ? selectedChallenge : null}
      />
    </div>
  );
}
