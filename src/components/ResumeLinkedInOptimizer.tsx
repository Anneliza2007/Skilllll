import { useState } from 'react';
import {
  FileText,
  Linkedin,
  Sparkles,
  Copy,
  Check,
  ArrowRight,
  TrendingUp,
  Tag,
  HelpCircle,
  Briefcase,
  AlertCircle,
  Wand2,
  Award,
  BarChart3,
  Target,
  Layers,
  CheckCircle2,
  Lightbulb,
} from 'lucide-react';
import { OptimizationResult, StudentProfile, InitialLevelAssessment } from '../types';
import { LEVEL_THRESHOLDS } from '../data/mockData';

interface ResumeLinkedInOptimizerProps {
  profile: StudentProfile;
  initialRole?: string;
  onProfileOptimized: (xpEarned: number) => void;
  onOpenPromptLab?: (promptId?: string) => void;
  onOpenLevelCalibrator?: () => void;
  onApplyInitialLevel?: (assessment: InitialLevelAssessment) => void;
}

const SAMPLE_LEVEL_PRESETS = [
  {
    name: 'Freshman CS Starter',
    role: 'Software Engineering Intern',
    resume: `Education: B.S. in Computer Science (Expected 2028)\nCoursework: Intro to CS, Discrete Mathematics, Java Basics.\nProjects:\n• Calculator App: Built basic Java GUI calculator for course final project.\n• Personal HTML Website: Made a 2-page website on GitHub Pages.\n• Student Tech Club: Attending weekly meetings and hackathon prep.`,
    linkedin: `https://linkedin.com/in/student-freshman-dev\nHeadline: Computer Science Student | Aspiring Software Engineer\nAbout: Freshman excited to learn programming, algorithms, and web development.`,
  },
  {
    name: 'Sophomore Project Builder',
    role: 'Full-Stack Software Engineering Intern',
    resume: `Projects:\n• Campus Marketplace (React, Node.js, Express, PostgreSQL): Built full-stack e-commerce app with JWT auth, indexed database queries, and test Stripe checkout.\n• Study Group Matcher (TypeScript, Tailwind, Firebase): Deployed responsive web app used by 450+ campus students with real-time Firestore synchronization.\n• Open Source: Submitted 3 PRs fixing UI and bug tickets in popular React component libraries.\nSkills: TypeScript, React, Node.js, PostgreSQL, Git, Tailwind CSS.`,
    linkedin: `https://linkedin.com/in/alexchen-tech\nHeadline: Full-Stack Software Engineering Student | TypeScript, React, Node.js, PostgreSQL\nAbout: Sophomore CS major building real-world distributed web applications. Passionate about clean code and REST APIs.`,
  },
  {
    name: 'Junior Internship Veteran',
    role: 'Backend / Cloud Engineering Intern',
    resume: `Experience:\n• Software Engineering Intern at NovaTech Solutions (Summer 2025):\n  - Engineered 14+ RESTful endpoints in Go and PostgreSQL, reducing query p95 latency from 240ms to 45ms.\n  - Built automated Docker and GitHub Actions CI/CD pipelines, cutting deployment rollback rates by 35%.\n  - Implemented token-bucket rate limiter handling 8,000+ API requests per minute.\nProjects:\n• Distributed Key-Value Store (Go, Raft Consensus, Docker): Benchmarked node partition failovers with 99.9% read availability.\nSkills: Go, Python, Docker, AWS, PostgreSQL, Redis, Kubernetes.`,
    linkedin: `https://linkedin.com/in/cloud-intern-pro\nHeadline: Software Engineering Intern at NovaTech | Distributed Systems & Cloud Infrastructure\nAbout: Junior CS student with backend production experience. Passionate about low-latency APIs and container orchestration.`,
  },
];

export function ResumeLinkedInOptimizer({
  profile,
  initialRole,
  onProfileOptimized,
  onOpenPromptLab,
  onOpenLevelCalibrator,
  onApplyInitialLevel,
}: ResumeLinkedInOptimizerProps) {
  const [targetRole, setTargetRole] = useState(initialRole || profile.targetRole);
  const [customBulletInput, setCustomBulletInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [optimizationData, setOptimizationData] = useState<OptimizationResult | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'resume' | 'linkedin' | 'ats' | 'level'>('resume');

  // Initial Level Calibrator state
  const [levelResumeInput, setLevelResumeInput] = useState(() => {
    if (profile.currentResumeBullets && profile.currentResumeBullets.length > 0) {
      return `Summary: ${profile.experienceSummary || ''}\n\nBullet Points:\n${profile.currentResumeBullets.map((b) => `• ${b}`).join('\n')}`;
    }
    return '';
  });
  const [levelLinkedinInput, setLevelLinkedinInput] = useState(profile.linkedinUrl || '');
  const [isEvaluatingLevel, setIsEvaluatingLevel] = useState(false);
  const [levelAssessment, setLevelAssessment] = useState<InitialLevelAssessment | null>(null);
  const [levelApplied, setLevelApplied] = useState(false);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRunOptimization = async (customBulletsToRun?: string[]) => {
    setIsLoading(true);
    const bullets = customBulletsToRun || (profile.currentResumeBullets.length > 0
      ? profile.currentResumeBullets
      : [
          'Built a full stack web app using React and Node.js with database integration',
          'Worked on student team project with Git and GitHub',
          'Implemented REST API endpoints for user authentication',
        ]);

    try {
      const res = await fetch('/api/gemini/optimize-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentBullets: bullets,
          skills: profile.skills,
          targetRole,
          experienceSummary: profile.experienceSummary,
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setOptimizationData(data.data);
        onProfileOptimized(35);
      }
    } catch (err) {
      console.error('Optimization error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCustomBulletAndOptimize = () => {
    if (!customBulletInput.trim()) return;
    const bullets = [customBulletInput.trim(), ...profile.currentResumeBullets];
    handleRunOptimization(bullets);
    setCustomBulletInput('');
  };

  const handleRunLevelEvaluation = async () => {
    setIsEvaluatingLevel(true);
    setLevelApplied(false);
    try {
      const res = await fetch('/api/gemini/evaluate-initial-level', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText: levelResumeInput,
          linkedinTextOrUrl: levelLinkedinInput,
          targetRole,
          currentSkills: profile.skills,
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setLevelAssessment(data.data);
      }
    } catch (err) {
      console.error('Level evaluation error:', err);
    } finally {
      setIsEvaluatingLevel(false);
    }
  };

  const handleApplyLevelToProfile = () => {
    if (!levelAssessment) return;
    if (onApplyInitialLevel) {
      onApplyInitialLevel(levelAssessment);
      setLevelApplied(true);
    }
  };

  const handleLoadSamplePreset = (preset: typeof SAMPLE_LEVEL_PRESETS[0]) => {
    setTargetRole(preset.role);
    setLevelResumeInput(preset.resume);
    setLevelLinkedinInput(preset.linkedin);
    setLevelAssessment(null);
    setLevelApplied(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/20 rounded-2xl p-5 shadow-lg relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Wand2 className="w-3.5 h-3.5" />
                Google XYZ Formula &amp; ATS Tuner
              </span>
              <span className="text-xs text-slate-400">
                Turn passive bullet points into high-impact recruiter magnets
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
              Resume &amp; LinkedIn Auto-Optimization
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Transform "worked on a project" into verified quantifiable statements that pass Applicant Tracking Systems (ATS) and catch hiring manager eyes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              id="header-calibrate-level-btn"
              onClick={() => {
                setActiveSubTab('level');
                if (onOpenLevelCalibrator) {
                  onOpenLevelCalibrator();
                }
              }}
              className="px-3.5 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>Calibrate Initial Level</span>
            </button>

            {onOpenPromptLab && (
              <button
                onClick={() => onOpenPromptLab('prompt-resume-xyz')}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-sky-400" />
                <span>Prompt Lab</span>
              </button>
            )}

            <button
              id="run-optimize-button"
              onClick={() => handleRunOptimization()}
              disabled={isLoading}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all cursor-pointer ${
                isLoading
                  ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-400 hover:to-sky-400 text-white shadow-indigo-500/20'
              }`}
            >
              <Sparkles className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Enhancing with AI...' : 'Optimize Profile Now (+35 XP)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Target Role & Custom Bullet Quick Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="sm:w-1/3">
            <label className="block text-xs font-semibold text-slate-300 mb-1">Tailor For Target Role:</label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="e.g. Software Engineering Intern"
            />
          </div>

          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Have a custom resume line? Test &amp; upgrade it:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customBulletInput}
                onChange={(e) => setCustomBulletInput(e.target.value)}
                placeholder="e.g., Created a React web dashboard for managing club members..."
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomBulletAndOptimize();
                  }
                }}
              />
              <button
                onClick={handleAddCustomBulletAndOptimize}
                disabled={!customBulletInput.trim() || isLoading}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
              >
                Upgrade Bullet
              </button>
            </div>
          </div>
        </div>

        {/* Sub Navigation */}
        <div className="flex flex-wrap border-t border-slate-800 pt-3 gap-2">
          <button
            id="subtab-level-calibrator"
            onClick={() => setActiveSubTab('level')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeSubTab === 'level'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>Initial Level Calibrator</span>
          </button>
          <button
            onClick={() => setActiveSubTab('resume')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeSubTab === 'resume'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Resume Bullets (XYZ Formula)</span>
          </button>
          <button
            onClick={() => setActiveSubTab('linkedin')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeSubTab === 'linkedin'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Linkedin className="w-3.5 h-3.5" />
            <span>LinkedIn Headline &amp; About</span>
          </button>
          <button
            onClick={() => setActiveSubTab('ats')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeSubTab === 'ats'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>ATS Keyword Matcher</span>
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-400 animate-spin mx-auto" />
          <h3 className="text-base font-bold text-slate-100">
            Applying Google XYZ Formula &amp; Tuning for {targetRole}...
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Extracting quantifiable metrics, active impact verbs, and technical keywords tailored to your strong skills.
          </p>
        </div>
      )}

      {/* Subtab Content: Initial Level Calibrator */}
      {activeSubTab === 'level' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Preset Bar */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3 overflow-x-auto text-xs">
            <div className="flex items-center gap-1.5 text-slate-400 font-medium whitespace-nowrap">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Calibrate with Candidate Sample:</span>
            </div>
            <div className="flex items-center gap-2">
              {SAMPLE_LEVEL_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => handleLoadSamplePreset(preset)}
                  className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-slate-100 border border-slate-700 text-[11px] font-medium transition-colors whitespace-nowrap cursor-pointer"
                >
                  {preset.name}
                </button>
              ))}
              <button
                onClick={() => {
                  setTargetRole(profile.targetRole);
                  setLevelResumeInput(
                    `Summary: ${profile.experienceSummary || ''}\n\nBullet Points:\n${profile.currentResumeBullets.map((b) => `• ${b}`).join('\n')}`
                  );
                  setLevelLinkedinInput(profile.linkedinUrl || '');
                  setLevelAssessment(null);
                  setLevelApplied(false);
                }}
                className="px-2.5 py-1 rounded-md bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-500/30 text-[11px] font-semibold transition-colors whitespace-nowrap cursor-pointer"
              >
                Use My Profile Data
              </button>
            </div>
          </div>

          {/* Level Inputs Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Resume Content / Bullets / Coursework</span>
                </label>
                <span className="text-[10px] text-slate-500">Evaluates quantified metrics &amp; project depth</span>
              </div>
              <textarea
                rows={6}
                value={levelResumeInput}
                onChange={(e) => setLevelResumeInput(e.target.value)}
                placeholder="Paste your resume bullets, past experience, or coursework..."
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono leading-relaxed"
              />
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1.5">
                  <Linkedin className="w-3.5 h-3.5 text-sky-400" />
                  <span>LinkedIn Profile URL or Headline / Bio</span>
                </label>
                <textarea
                  rows={3}
                  value={levelLinkedinInput}
                  onChange={(e) => setLevelLinkedinInput(e.target.value)}
                  placeholder="e.g. https://linkedin.com/in/yourname or paste headline and about summary..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  id="eval-level-submit-btn"
                  onClick={handleRunLevelEvaluation}
                  disabled={isEvaluatingLevel}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                    isEvaluatingLevel
                      ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-amber-500 via-orange-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-slate-950 font-extrabold shadow-amber-500/20'
                  }`}
                >
                  <Award className={`w-4 h-4 ${isEvaluatingLevel ? 'animate-spin' : ''}`} />
                  <span>
                    {isEvaluatingLevel
                      ? 'Assessing Resume & LinkedIn Evidence...'
                      : 'Calculate Initial Level based on LinkedIn & Resume'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Level Assessment Output */}
          {levelAssessment && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
              {/* Level Progression Spectrum Ladder */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <BarChart3 className="w-4 h-4 text-sky-400" />
                    <span>Candidate Progression Spectrum (Levels 1 to 5)</span>
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400">
                    Calibration Confidence: {levelAssessment.confidenceScore}%
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {LEVEL_THRESHOLDS.map((tier) => {
                    const isCurrent = tier.level === levelAssessment.level;
                    const isPassed = tier.level < levelAssessment.level;

                    return (
                      <div
                        key={tier.level}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          isCurrent
                            ? 'bg-amber-950/40 border-amber-400 ring-2 ring-amber-500/40 shadow-lg shadow-amber-500/10'
                            : isPassed
                            ? 'bg-slate-900/50 border-slate-800 text-slate-400'
                            : 'bg-slate-900/20 border-slate-800/60 text-slate-500'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <span className={`text-[11px] font-bold ${isCurrent ? 'text-amber-300' : 'text-slate-400'}`}>
                            Lvl {tier.level}
                          </span>
                          {isCurrent && (
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                          )}
                        </div>
                        <p className={`text-xs font-bold leading-tight ${isCurrent ? 'text-slate-100' : 'text-slate-300'}`}>
                          {tier.title}
                        </p>
                        <span className="text-[10px] font-mono text-slate-400 block mt-1">
                          {tier.minXp}-{tier.maxXp} XP
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Assessment Result Card */}
              <div className="bg-gradient-to-br from-slate-900 via-indigo-950/20 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-xl space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 via-orange-400 to-indigo-500 flex items-center justify-center text-slate-950 font-black text-2xl shadow-xl shadow-amber-500/10">
                      {levelAssessment.level}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                          Calibrated Initial Rank
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                          {levelAssessment.candidateArchetype}
                        </span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black text-slate-100">
                        Level {levelAssessment.level}: {levelAssessment.levelTitle}
                      </h2>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-start sm:self-auto">
                    <div className="px-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Starting XP</span>
                      <span className="text-lg font-black text-amber-300 font-mono">
                        +{levelAssessment.startingXp} XP
                      </span>
                    </div>

                    {onApplyInitialLevel && (
                      <button
                        id="apply-calibrated-level-page-btn"
                        onClick={handleApplyLevelToProfile}
                        disabled={levelApplied}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all cursor-pointer ${
                          levelApplied
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                            : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{levelApplied ? 'Level & Skills Applied ✓' : 'Apply to Profile'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Recruiter Rationale */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 leading-relaxed space-y-1.5">
                  <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4 text-amber-400" />
                    <span>Hiring Manager Assessment Rationale:</span>
                  </div>
                  <p>{levelAssessment.rationale}</p>
                </div>

                {/* Resume vs LinkedIn Diagnostics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Resume Audit Card */}
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Resume Diagnostic</span>
                      </span>
                      <span className="text-[11px] font-bold text-indigo-300">
                        Score: {levelAssessment.resumeAnalysis.bulletQualityScore}/100
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="text-slate-400">Quantified Impact Metrics:</span>
                      {levelAssessment.resumeAnalysis.quantifiedMetricsPresence ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Detected
                        </span>
                      ) : (
                        <span className="text-amber-400 font-semibold flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> Needs XYZ Numbers
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Key Strengths</span>
                      <ul className="space-y-0.5 text-slate-300">
                        {levelAssessment.resumeAnalysis.strengths.slice(0, 2).map((s, idx) => (
                          <li key={idx} className="flex items-start gap-1.5 text-[11px]">
                            <span className="text-emerald-400 font-bold">•</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-1 pt-1 border-t border-slate-800/60">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Growth Areas</span>
                      <ul className="space-y-0.5 text-slate-400">
                        {levelAssessment.resumeAnalysis.improvementsNeeded.slice(0, 2).map((imp, idx) => (
                          <li key={idx} className="flex items-start gap-1.5 text-[11px]">
                            <span className="text-amber-400 font-bold">•</span>
                            <span>{imp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* LinkedIn Audit Card */}
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                        <Linkedin className="w-3.5 h-3.5 text-sky-400" />
                        <span>LinkedIn Diagnostic</span>
                      </span>
                      <span className="text-[11px] font-bold text-sky-300">
                        Completeness: {levelAssessment.linkedInAnalysis.completenessScore}%
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300 italic">
                      "{levelAssessment.linkedInAnalysis.headlineAssessment}"
                    </p>

                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Recruiter Recommendations</span>
                      <ul className="space-y-1 text-slate-300">
                        {levelAssessment.linkedInAnalysis.recommendations.slice(0, 2).map((rec, idx) => (
                          <li key={idx} className="flex items-start gap-1.5 text-[11px]">
                            <span className="text-sky-400 font-bold">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Calibrated Skills Inventory */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Extracted Skills &amp; Initial Mastery Scores:</span>
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Inferred from project code and descriptions
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {levelAssessment.extractedSkills.map((skill, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-200 text-xs truncate">{skill.name}</span>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                            {skill.level}
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-1.5 rounded-full bg-amber-400"
                            style={{ width: `${skill.masteryScore}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                          <span>{skill.category}</span>
                          <span>{skill.masteryScore}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Next Steps to Reach Next Tier */}
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5 text-xs">
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Milestones to Reach Level {Math.min(5, levelAssessment.level + 1)}:</span>
                  </span>
                  <ul className="space-y-1 text-slate-300">
                    {levelAssessment.recommendedNextMilestones.map((ms, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 text-[11px]">
                        <span className="text-amber-400 font-bold">•</span>
                        <span>{ms}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Results View for Bullets, LinkedIn & ATS */}
      {optimizationData && !isLoading && activeSubTab !== 'level' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Resume Tab */}
          {activeSubTab === 'resume' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    Optimized Resume Bullet Points
                  </h3>
                  <p className="text-xs text-slate-400">
                    Formula: <em>"Accomplished [X] as measured by [Y], by doing [Z]"</em>
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {optimizationData.optimizedBullets.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-3 shadow-md"
                  >
                    {/* Before (Original) */}
                    <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                        Before (Standard Student Bullet)
                      </span>
                      <p className="text-slate-400 line-through decoration-slate-600">{item.original}</p>
                    </div>

                    {/* After (Improved) */}
                    <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/30 text-xs sm:text-sm space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-indigo-400 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" /> High-Impact Google XYZ Version
                        </span>
                        <button
                          onClick={() => handleCopy(item.improved, `bullet-${idx}`)}
                          className="px-2.5 py-1 rounded-md bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          {copiedId === `bullet-${idx}` ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400 font-bold">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>

                      <p className="text-slate-100 font-medium leading-relaxed">{item.improved}</p>

                      <div className="pt-2 border-t border-indigo-500/20 flex flex-wrap items-center gap-2 text-xs">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[11px] font-semibold">
                          Metric: {item.metricsHighlighted}
                        </span>
                        <span className="text-slate-400 text-[11px] italic">{item.rationale}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LinkedIn Tab */}
          {activeSubTab === 'linkedin' && (
            <div className="space-y-6">
              {/* Headlines */}
              <div className="space-y-3">
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Linkedin className="w-4 h-4 text-sky-400" />
                  High-Converting LinkedIn Headlines
                </h3>
                <p className="text-xs text-slate-400">
                  Select a headline style tailored to your strengths to stand out in recruiter candidate searches:
                </p>

                <div className="grid grid-cols-1 gap-3">
                  {optimizationData.linkedInHeadlines.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <span className="text-[10px] uppercase font-bold text-sky-400 px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/20">
                          {item.style}
                        </span>
                        <p className="text-xs sm:text-sm font-semibold text-slate-100 mt-2 leading-relaxed">
                          {item.headline}
                        </p>
                      </div>
                      <button
                        onClick={() => handleCopy(item.headline, `headline-${idx}`)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 self-start sm:self-center transition-colors cursor-pointer shrink-0"
                      >
                        {copiedId === `headline-${idx}` ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400 font-bold">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Headline</span>
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* LinkedIn About Section */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-100">Polished LinkedIn "About" Summary</h3>
                    <p className="text-xs text-slate-400">
                      Story-driven, conversational intro highlighting your projects and ambition.
                    </p>
                  </div>
                  <button
                    onClick={() => handleCopy(optimizationData.linkedInAbout, 'about-section')}
                    className="px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedId === 'about-section' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy About</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs sm:text-sm text-slate-200 whitespace-pre-line leading-relaxed font-sans">
                  {optimizationData.linkedInAbout}
                </div>
              </div>
            </div>
          )}

          {/* ATS Keywords Tab */}
          {activeSubTab === 'ats' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-emerald-400" />
                  ATS Keyword Heatmap for {targetRole}
                </h3>
                <p className="text-xs text-slate-400">
                  Applicant Tracking Systems filter candidates by exact keyword frequency. Ensure these critical terms appear in your resume and LinkedIn skills section.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {optimizationData.atsKeywords.map((kw, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-200 block">{kw.keyword}</span>
                      <span
                        className={`text-[10px] font-semibold ${
                          kw.importance === 'Critical'
                            ? 'text-red-400'
                            : kw.importance === 'High'
                            ? 'text-amber-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {kw.importance} Priority
                      </span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        kw.inProfile
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {kw.inProfile ? 'In Profile ✓' : 'Add to Resume'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Initial Empty State prompt if not yet generated and not on level tab */}
      {!optimizationData && !isLoading && activeSubTab !== 'level' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-100">Ready to Auto-Optimize Your Profile?</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Click "Optimize Profile Now" above to translate your raw experience into quantified, ATS-proof resume bullets and high-converting LinkedIn copy, or switch to "Initial Level Calibrator" to assess your starting candidate rank.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => handleRunOptimization()}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-400 hover:to-sky-400 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
            >
              Launch Auto-Optimizer (+35 XP)
            </button>
            <button
              onClick={() => setActiveSubTab('level')}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-750 text-amber-300 border border-amber-500/30 font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>Calibrate Level from LinkedIn &amp; Resume</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
