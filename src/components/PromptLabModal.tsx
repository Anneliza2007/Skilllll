import { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Sparkles,
  Terminal,
  Zap,
  Layers,
  FileText,
  Compass,
  Calendar,
} from 'lucide-react';
import { CAREER_PROMPTS, CareerPrompt } from '../data/promptsData';
import { StudentProfile } from '../types';

interface PromptLabModalProps {
  isOpen: boolean;
  initialPromptId?: string;
  profile: StudentProfile;
  onClose: () => void;
  onShowToast?: (title: string, desc: string) => void;
}

export function PromptLabModal({
  isOpen,
  initialPromptId,
  profile,
  onClose,
  onShowToast,
}: PromptLabModalProps) {
  const [selectedPromptId, setSelectedPromptId] = useState<string>(
    initialPromptId || CAREER_PROMPTS[0].id
  );
  const [copied, setCopied] = useState(false);

  // Form states for dynamic variables
  const weakSkillsNames = profile.skills
    .filter((s) => s.level === 'Beginner' || s.level === 'Intermediate')
    .map((s) => s.name)
    .join(', ') || 'SQL, Docker';
  const strongSkillsNames = profile.skills
    .filter((s) => s.level === 'Advanced' || s.level === 'Expert')
    .map((s) => s.name)
    .join(', ') || 'React, TypeScript, Python';

  const [variablesState, setVariablesState] = useState<Record<string, string>>({
    TARGET_TOPIC: weakSkillsNames.split(',')[0]?.trim() || 'SQL Queries & Indexing',
    STUDENT_LEVEL: 'Intermediate',
    QUESTION_COUNT: '4',
    STRONG_SKILLS: strongSkillsNames,
    TARGET_ROLE: profile.targetRole || 'Software Engineer Intern',
    DOMAIN_INTEREST: profile.interests.join(', ') || 'Distributed Systems & Cloud Services',
    RAW_BULLET: profile.currentResumeBullets[0] || 'Worked on backend API endpoints and wrote unit tests for user management service',
    TARGET_COMPANY_TYPE: 'Top Tech Startups & High-Scale Cloud Companies',
    KEY_SKILLS: strongSkillsNames,
    COMFORT_STACK: 'Standard MERN / Python tutorials and clean textbook code',
    INTIMIDATING_TOPIC: 'Production outage debugging, Linux CLI wargames, and raw network sockets',
    AVAILABLE_DAILY_MINUTES: '45',
    PRIMARY_GOAL: `Land a ${profile.targetRole || 'Software Engineer Intern'} role for 2026`,
  });

  if (!isOpen) return null;

  const currentPrompt =
    CAREER_PROMPTS.find((p) => p.id === selectedPromptId) || CAREER_PROMPTS[0];

  // Replace placeholders with current values
  let evaluatedPrompt = currentPrompt.promptTemplate;
  Object.entries(variablesState).forEach(([key, val]) => {
    evaluatedPrompt = evaluatedPrompt.replaceAll(`{${key}}`, String(val || `{${key}}`));
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(evaluatedPrompt);
    setCopied(true);
    if (onShowToast) {
      onShowToast('Prompt Copied to Clipboard', 'Ready to paste into Gemini, Claude, or any AI assistant.');
    }
    setTimeout(() => setCopied(false), 2000);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Quizzes':
        return <Zap className="w-4 h-4 text-amber-400" />;
      case 'Strong Projects':
        return <Layers className="w-4 h-4 text-emerald-400" />;
      case 'Resume & LinkedIn':
        return <FileText className="w-4 h-4 text-sky-400" />;
      case 'Comfort Zone':
        return <Compass className="w-4 h-4 text-orange-400" />;
      case 'Daily Routine':
        return <Calendar className="w-4 h-4 text-indigo-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20">
              <Terminal className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>AI Career Prompt Lab</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20">
                  Ready-to-Use
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Battle-tested prompts engineered for zero-fluff, high-density career preparation.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Two columns on desktop */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-800">
          {/* Prompt Selector List (Left Column) */}
          <div className="md:col-span-4 p-4 overflow-y-auto space-y-2 bg-slate-950/50">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 block">
              Choose Prompt Template
            </span>

            {CAREER_PROMPTS.map((prompt) => {
              const isSelected = prompt.id === currentPrompt.id;
              return (
                <button
                  key={prompt.id}
                  onClick={() => setSelectedPromptId(prompt.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-sky-500/10 border-sky-500/40 shadow-sm'
                      : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-850 hover:border-slate-700 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {getCategoryIcon(prompt.category)}
                    <span className="text-[10px] font-semibold text-slate-400">
                      {prompt.category}
                    </span>
                  </div>
                  <h4
                    className={`text-xs font-bold leading-snug ${
                      isSelected ? 'text-sky-300' : 'text-slate-200'
                    }`}
                  >
                    {prompt.title}
                  </h4>
                </button>
              );
            })}
          </div>

          {/* Prompt Editor & Live Preview (Right Column) */}
          <div className="md:col-span-8 p-5 overflow-y-auto space-y-5 bg-slate-900">
            {/* Header info */}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {currentPrompt.category}
                </span>
                <h3 className="text-base font-bold text-slate-100">{currentPrompt.title}</h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">{currentPrompt.description}</p>
            </div>

            {/* Variable Inputs */}
            {currentPrompt.variables.length > 0 && (
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400 block">
                  Customize Variables with Your Profile Data
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentPrompt.variables.map((variable) => (
                    <div key={variable.name} className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-400 block">
                        {`{${variable.name}}`}
                      </label>
                      <input
                        type="text"
                        value={variablesState[variable.name] || ''}
                        onChange={(e) =>
                          setVariablesState((prev) => ({ ...prev, [variable.name]: e.target.value }))
                        }
                        placeholder={variable.example}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-sans"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Prompt Output Code Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400">
                  Final Evaluated Prompt (Ready to paste)
                </span>
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md shadow-sky-500/20 transition-all cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Full Prompt</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative">
                <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto select-all selection:bg-sky-500/30 selection:text-sky-200">
                  {evaluatedPrompt}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>Pro tip: You can also execute these directly in the app’s AI features</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
