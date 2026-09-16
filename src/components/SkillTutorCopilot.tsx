import { useState, type FormEvent } from 'react';
import {
  Sparkles,
  Shield,
  HelpCircle,
  Lightbulb,
  ArrowRight,
  Send,
  Brain,
  AlertTriangle,
  Bug,
  Compass,
  MessageSquare,
  Users,
  Target,
  Zap,
  Lock,
} from 'lucide-react';
import { SkillTutorMessage, SkillTutorMode, SignedSnippetToken } from '../types';
import { registerAuthorizedSnippet } from '../utils/skillTutorClipboard';
import { generateSignedCopilotToken } from '../utils/skillTutorSecurity';

interface SkillTutorCopilotProps {
  problemTitle: string;
  problemContext: string;
  topic?: string;
  currentDraft?: string;
  hintsUsedCount: number;
  onHintUsed: () => void;
  onInsertAuthorizedSnippet?: (snippet: string, signedToken?: SignedSnippetToken) => void;
  onShowToast?: (toast: { type: 'success' | 'info' | 'streak' | 'xp'; title: string; description: string }) => void;
  isCompact?: boolean;
  mode?: SkillTutorMode;
  onModeChange?: (mode: SkillTutorMode) => void;
  weakAreas?: string[];
  pastMistakes?: string[];
  onRefusalRecorded?: () => void;
  onCopiedDetected?: () => void;
  problemStatement?: {
    title?: string;
    description?: string;
    constraints?: string;
    inputFormat?: string;
    outputFormat?: string;
  };
  activeLanguage?: string;
  currentCode?: string;
}

const MODES_CONFIG: { id: SkillTutorMode; label: string; icon: typeof Lightbulb; desc: string }[] = [
  { id: 'hint', label: 'Hint Mode', icon: Lightbulb, desc: '5-stage progressive hints' },
  { id: 'socratic', label: 'Socratic', icon: MessageSquare, desc: 'Pure inquiry & questions' },
  { id: 'debug', label: 'Debug', icon: Bug, desc: 'Find logic flaws & pitfalls' },
  { id: 'concept', label: 'Concept', icon: Brain, desc: 'Mental models & proofs' },
  { id: 'interview', label: 'Interview', icon: Users, desc: 'Mock technical grilling' },
];

const HINT_STAGES = [
  { stage: 1, title: '1. Concept', subtitle: 'Clarification', color: 'amber' },
  { stage: 2, title: '2. Approach', subtitle: 'Suggestion', color: 'sky' },
  { stage: 3, title: '3. Pseudocode', subtitle: 'Or Analogy', color: 'indigo' },
  { stage: 4, title: '4. Bug Location', subtitle: 'Pitfalls', color: 'rose' },
  { stage: 5, title: '5. Guiding Q', subtitle: 'Synthesis', color: 'emerald' },
];

export function SkillTutorCopilot({
  problemTitle,
  problemContext,
  topic = 'Algorithms & System Design',
  currentDraft = '',
  hintsUsedCount,
  onHintUsed,
  onInsertAuthorizedSnippet,
  onShowToast,
  isCompact = false,
  mode: initialMode = 'hint',
  onModeChange,
  weakAreas = [],
  pastMistakes = [],
  onRefusalRecorded,
  onCopiedDetected,
  problemStatement,
  activeLanguage = 'python',
  currentCode = '',
}: SkillTutorCopilotProps) {
  const [activeMode, setActiveMode] = useState<SkillTutorMode>(initialMode);
  const [messages, setMessages] = useState<SkillTutorMessage[]>([
    {
      id: 'msg_welcome',
      sender: 'tutor',
      text: `Hello! I am SkillTutor, your Socratic mentor. I guide your reasoning for "${problemTitle}" without giving away complete code. I can diagnose compiler bugs for Python, C, and C++, explain algorithmic invariants, and provide 5-stage progressive hints.`,
      timestamp: 'Just now',
    },
  ]);
  const [studentInput, setStudentInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const [selectedHintLevel, setSelectedHintLevel] = useState<number>(1);

  const handleSelectMode = (newMode: SkillTutorMode) => {
    setActiveMode(newMode);
    if (onModeChange) onModeChange(newMode);
  };

  // Request a specific 5-stage Socratic Hint
  const handleRequestHint = async (level: number) => {
    setSelectedHintLevel(level);
    setIsLoading(true);
    onHintUsed();

    try {
      const res = await fetch('/api/gemini/skilltutor-guidance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemTitle,
          problemContext,
          studentQuery: studentInput || `Provide Stage ${level} guidance in ${activeMode} mode`,
          currentDraft,
          hintLevel: level,
          mode: activeMode,
          topic,
          weakAreas,
          pastMistakes,
          problemStatement,
          activeLanguage,
          currentCode,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        const hint = data.data;
        let signedToken: SignedSnippetToken | undefined;
        if (hint.authorizedSnippet) {
          registerAuthorizedSnippet(hint.authorizedSnippet);
          signedToken = generateSignedCopilotToken(hint.authorizedSnippet);
        }

        if (hint.isRefusal && onRefusalRecorded) {
          onRefusalRecorded();
        }
        if (hint.requiresReExplanation && onCopiedDetected) {
          onCopiedDetected();
        }

        const newMsg: SkillTutorMessage = {
          id: 'msg_' + Date.now(),
          sender: 'tutor',
          text: hint.socraticNudge,
          guidingQuestion: hint.guidingQuestion,
          conceptualAnalogy: hint.conceptualAnalogy,
          likelyBugLocation: hint.likelyBugLocation,
          authorizedSnippet: hint.authorizedSnippet,
          signedToken,
          hintTier: hint.hintTierName || `Stage ${level} Hint`,
          hintStage: level,
          mode: activeMode,
          isRefusal: hint.isRefusal,
          requiresReExplanation: hint.requiresReExplanation,
          adaptiveNote: hint.adaptiveNote,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages((prev) => [...prev, newMsg]);

        if (onShowToast) {
          onShowToast({
            type: 'info',
            title: `SkillTutor ${hint.hintTierName || `Stage ${level}`}`,
            description: 'Conceptual guidance unlocked. Analyze the mental model below.',
          });
        }
      }
    } catch (err) {
      console.error('SkillTutor hint error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Submit custom student question
  const handleSendQuestion = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!studentInput.trim() || isLoading) return;

    const userText = studentInput.trim();
    setStudentInput('');

    const userMsg: SkillTutorMessage = {
      id: 'msg_user_' + Date.now(),
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/gemini/skilltutor-guidance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemTitle,
          problemContext,
          studentQuery: userText,
          currentDraft,
          hintLevel: selectedHintLevel,
          mode: activeMode,
          topic,
          weakAreas,
          pastMistakes,
          problemStatement,
          activeLanguage,
          currentCode,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        const hint = data.data;
        let signedToken: SignedSnippetToken | undefined;
        if (hint.authorizedSnippet) {
          registerAuthorizedSnippet(hint.authorizedSnippet);
          signedToken = generateSignedCopilotToken(hint.authorizedSnippet);
        }

        if (hint.isRefusal && onRefusalRecorded) {
          onRefusalRecorded();
        }
        if (hint.requiresReExplanation && onCopiedDetected) {
          onCopiedDetected();
        }

        const tutorMsg: SkillTutorMessage = {
          id: 'msg_tutor_' + Date.now(),
          sender: 'tutor',
          text: hint.socraticNudge,
          guidingQuestion: hint.guidingQuestion,
          conceptualAnalogy: hint.conceptualAnalogy,
          likelyBugLocation: hint.likelyBugLocation,
          authorizedSnippet: hint.authorizedSnippet,
          signedToken,
          hintTier: hint.hintTierName || `${activeMode.toUpperCase()} Guidance`,
          mode: activeMode,
          isRefusal: hint.isRefusal,
          requiresReExplanation: hint.requiresReExplanation,
          adaptiveNote: hint.adaptiveNote,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages((prev) => [...prev, tutorMsg]);
      }
    } catch (err) {
      console.error('SkillTutor query error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInsertDirectly = (snippet: string, signedToken?: SignedSnippetToken) => {
    registerAuthorizedSnippet(snippet);
    if (onInsertAuthorizedSnippet) {
      onInsertAuthorizedSnippet(snippet, signedToken);
      if (onShowToast) {
        onShowToast({
          type: 'success',
          title: 'Authorized Concept Injected',
          description: 'Inserted directly into editor memory via signed HMAC token. OS clipboard bypassed.',
        });
      }
    }
  };

  return (
    <div
      id="skilltutor-copilot-container"
      className={`flex flex-col bg-slate-900 border border-indigo-500/30 rounded-2xl overflow-hidden shadow-2xl ${
        isCompact ? 'h-[520px]' : 'h-full min-h-[620px]'
      }`}
    >
      {/* Copilot Header */}
      <div className="bg-gradient-to-r from-indigo-950/90 via-slate-900 to-indigo-950/90 border-b border-indigo-500/20 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 via-sky-500 to-emerald-400 p-0.5 shadow-md shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
              <Brain className="w-4 h-4 text-sky-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-sm text-slate-100">SkillTutor Socratic AI</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Zero Code Dumps
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Never spoon-feeds solutions • Guiding first principles</p>
          </div>
        </div>

        {/* Anti-Paste Shield Indicator */}
        <div
          className="flex items-center space-x-1 text-[11px] px-2.5 py-1 rounded-lg bg-emerald-950/50 border border-emerald-500/30 text-emerald-300"
          title="SkillTutor Anti-Cheat active: external copy-paste is blocked to verify your own thinking."
        >
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline font-mono font-semibold">Anti-Paste Shield Active</span>
        </div>
      </div>

      {/* Modes Navigation Bar */}
      <div className="bg-slate-950/90 border-b border-slate-800 px-3 py-2 flex items-center gap-1.5 overflow-x-auto">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
          Mode:
        </span>
        {MODES_CONFIG.map((m) => {
          const Icon = m.icon;
          const isActive = activeMode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => handleSelectMode(m.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/30 border border-indigo-400/50'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-750 hover:text-white border border-slate-700/50'
              }`}
              title={m.desc}
            >
              <Icon className={`w-3 h-3 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* Progressive 5-Stage Hint Quick Bar */}
      <div className="bg-slate-950/70 border-b border-slate-800/80 px-3 py-2 flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            <span>5 Progressive Hint Stages:</span>
          </span>
          <span className="text-[10px] text-slate-400">
            {hintsUsedCount === 0 ? 'No hints used (100% independence)' : `${hintsUsedCount} hints requested`}
          </span>
        </div>

        <div className="grid grid-cols-5 gap-1.5">
          {HINT_STAGES.map((h) => {
            const isSelected = selectedHintLevel === h.stage;
            return (
              <button
                key={h.stage}
                onClick={() => handleRequestHint(h.stage)}
                disabled={isLoading}
                className={`px-1.5 py-1 rounded-lg text-center transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-indigo-500/25 border-indigo-400 text-indigo-200 font-bold shadow-sm'
                    : 'bg-slate-800/70 hover:bg-slate-800 border-slate-700/70 text-slate-300'
                }`}
              >
                <div className="text-[10px] font-bold truncate">{h.title}</div>
                <div className="text-[9px] text-slate-400 truncate">{h.subtitle}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Conversation / Guidance Message Log */}
      <div className="flex-1 p-3.5 overflow-y-auto space-y-3.5 text-xs">
        {messages.map((m) => {
          const isTutor = m.sender === 'tutor';
          return (
            <div
              key={m.id}
              className={`flex flex-col ${isTutor ? 'items-start' : 'items-end'} space-y-1`}
            >
              <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 px-1">
                <span>{isTutor ? 'SkillTutor Mentor' : 'You'}</span>
                <span>•</span>
                <span>{m.timestamp}</span>
                {m.hintTier && (
                  <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium">
                    {m.hintTier}
                  </span>
                )}
                {m.mode && (
                  <span className="px-1 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 uppercase text-[9px]">
                    {m.mode}
                  </span>
                )}
              </div>

              <div
                className={`max-w-[94%] p-3.5 rounded-xl border leading-relaxed ${
                  isTutor
                    ? 'bg-slate-950/95 border-slate-800 text-slate-200'
                    : 'bg-indigo-600 text-white border-indigo-500/50'
                }`}
              >
                {/* Refusal Notice Banner */}
                {m.isRefusal && (
                  <div className="mb-2.5 p-2 rounded-lg bg-amber-950/50 border border-amber-500/40 text-amber-200 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-[11px] text-amber-300">
                        Polite Refusal: Direct Code & Solutions Restricted
                      </span>
                      <p className="text-[10px] text-amber-100/90 mt-0.5">
                        Technical interviews test your internal reasoning. SkillTutor provides Socratic scaffolding instead of spoon-fed answers.
                      </p>
                    </div>
                  </div>
                )}

                {/* Copied Code Warning Banner */}
                {m.requiresReExplanation && (
                  <div className="mb-2.5 p-2 rounded-lg bg-rose-950/50 border border-rose-500/40 text-rose-200 flex items-start gap-2">
                    <Shield className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-[11px] text-rose-300">
                        Conceptual Re-Explanation Required
                      </span>
                      <p className="text-[10px] text-rose-100/90 mt-0.5">
                        Code or boilerplate detected. Please explain the algorithmic invariant in plain English in your scratchpad.
                      </p>
                    </div>
                  </div>
                )}

                {/* Adaptive Calibration Note */}
                {m.adaptiveNote && (
                  <div className="mb-2 p-1.5 rounded-md bg-indigo-950/40 border border-indigo-500/30 text-indigo-200 text-[10px] flex items-center gap-1.5">
                    <Target className="w-3 h-3 text-indigo-400 shrink-0" />
                    <span><strong className="text-indigo-300">Adaptive calibration:</strong> {m.adaptiveNote}</span>
                  </div>
                )}

                <p className="whitespace-pre-line text-xs">{m.text}</p>

                {/* Conceptual Analogy Card */}
                {m.conceptualAnalogy && (
                  <div className="mt-2.5 p-2.5 rounded-lg bg-sky-950/40 border border-sky-500/30 text-sky-200">
                    <span className="font-bold text-sky-300 flex items-center gap-1 mb-1">
                      <span>💡 Mental Analogy:</span>
                    </span>
                    <p className="text-[11px] leading-relaxed text-sky-100/90">{m.conceptualAnalogy}</p>
                  </div>
                )}

                {/* Likely Bug Location / Edge Case Pitfall */}
                {m.likelyBugLocation && (
                  <div className="mt-2.5 p-2.5 rounded-lg bg-rose-950/30 border border-rose-500/30 text-rose-200">
                    <span className="font-bold text-rose-300 flex items-center gap-1 mb-1">
                      <Bug className="w-3.5 h-3.5 text-rose-400" />
                      <span>Likely Bug Location & Pitfall:</span>
                    </span>
                    <p className="text-[11px] leading-relaxed text-rose-100/90">{m.likelyBugLocation}</p>
                  </div>
                )}

                {/* Guiding Question */}
                {m.guidingQuestion && (
                  <div className="mt-2.5 p-2.5 rounded-lg bg-amber-950/35 border border-amber-500/30 text-amber-200">
                    <span className="font-bold text-amber-300 flex items-center gap-1 mb-1">
                      <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                      <span>Guiding Question to Solve:</span>
                    </span>
                    <p className="text-[11px] leading-relaxed text-amber-100/90">{m.guidingQuestion}</p>
                  </div>
                )}

                {/* Authorized Snippet with Copy / Insert Actions */}
                {m.authorizedSnippet && (
                  <div className="mt-3 pt-2.5 border-t border-slate-800 flex flex-col space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1">
                        <Shield className="w-3 h-3 text-emerald-400" />
                        <span>Authorized SkillTutor Concept Token</span>
                      </span>
                      <span className="text-[9px] text-slate-400">Permitted in Scratchpad</span>
                    </div>

                    <div className="p-2 bg-slate-900 border border-emerald-500/30 rounded-lg font-mono text-[11px] text-emerald-200">
                      {m.authorizedSnippet}
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                        <Lock className="w-3 h-3 text-emerald-400" />
                        <span>HMAC Token: {m.signedToken ? m.signedToken.token.slice(0, 10) + '...' : 'Verified (TTL 60s)'}</span>
                      </div>

                      {onInsertAuthorizedSnippet && (
                        <button
                          type="button"
                          onClick={() => handleInsertDirectly(m.authorizedSnippet!, m.signedToken)}
                          className="px-3 py-1.5 bg-gradient-to-r from-emerald-500/25 to-teal-500/25 hover:from-emerald-500/35 hover:to-teal-500/35 text-emerald-200 border border-emerald-500/50 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
                        >
                          <Zap className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Direct Inject (Bypasses OS Clipboard)</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center space-x-2 text-indigo-400 p-2 text-xs">
            <div className="w-3.5 h-3.5 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
            <span className="italic">SkillTutor is formulating your Socratic hint...</span>
          </div>
        )}
      </div>

      {/* Quick Problem Context Prompts */}
      <div className="px-3 pt-2 bg-slate-950 border-t border-slate-900 flex items-center gap-1.5 overflow-x-auto text-[10px]">
        <span className="text-slate-500 font-semibold shrink-0">Quick Ask:</span>
        <button
          type="button"
          onClick={() => {
            setStudentInput('What invariant or core algorithmic logic governs this problem?');
          }}
          className="px-2 py-0.5 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 whitespace-nowrap cursor-pointer transition-colors"
        >
          Core Invariant
        </button>
        <button
          type="button"
          onClick={() => {
            setStudentInput(`How do I structure the standard I/O and data types for ${activeLanguage.toUpperCase()}?`);
          }}
          className="px-2 py-0.5 rounded-full bg-slate-900 hover:bg-slate-800 text-sky-300 border border-slate-800 whitespace-nowrap cursor-pointer transition-colors"
        >
          {activeLanguage.toUpperCase()} I/O &amp; Types
        </button>
        <button
          type="button"
          onClick={() => {
            setStudentInput('What boundary conditions or extreme test inputs could fail?');
          }}
          className="px-2 py-0.5 rounded-full bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-800 whitespace-nowrap cursor-pointer transition-colors"
        >
          Boundary Cases
        </button>
      </div>

      {/* Socratic Chat Input */}
      <form onSubmit={handleSendQuestion} className="p-3 bg-slate-950 flex gap-2">
        <input
          type="text"
          value={studentInput}
          onChange={(e) => setStudentInput(e.target.value)}
          placeholder={`Ask SkillTutor (${activeMode} mode)...`}
          disabled={isLoading}
          className="flex-1 bg-slate-900 border border-slate-700 focus:border-indigo-500 text-slate-100 rounded-xl px-3 py-2 text-xs placeholder:text-slate-500 outline-none transition-all"
        />
        <button
          type="submit"
          disabled={!studentInput.trim() || isLoading}
          className="px-3.5 py-2 bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-400 hover:to-sky-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1 disabled:opacity-40 transition-all cursor-pointer"
        >
          <span>Ask</span>
          <Send className="w-3 h-3" />
        </button>
      </form>
    </div>
  );
}
