import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Award,
  TrendingUp,
  FileText,
  Linkedin,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Zap,
  Target,
  BarChart3,
  Lightbulb,
  Layers,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { StudentProfile, UserStats, InitialLevelAssessment, SkillLevel } from '../types';
import { LEVEL_THRESHOLDS } from '../data/mockData';

interface InitialLevelCalibratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: StudentProfile;
  stats: UserStats;
  onApplyAssessment: (assessment: InitialLevelAssessment) => void;
  onShowToast?: (toast: { type: 'success' | 'info' | 'streak' | 'xp'; title: string; description: string }) => void;
}

const SAMPLE_PRESETS = [
  {
    name: 'College Freshman (Coursework Starter)',
    role: 'Software Engineering Intern',
    resume: `Education: State Tech University, B.S. in Computer Science (Expected 2028)\nCoursework: Intro to CS, Discrete Mathematics, Data Structures in Java.\nProjects:\n• Calculator App: Built basic Java swing calculator for class final project.\n• Personal Website: Made a 2-page HTML and CSS website hosted on GitHub Pages.\n• Student Club: Member of Association for Computing Machinery.`,
    linkedin: `https://linkedin.com/in/student-freshman-dev\nHeadline: Computer Science Student at State Tech University | Aspiring Developer\nAbout: Freshman enthusiastic about learning programming, Java, and web development fundamentals.`,
  },
  {
    name: 'Sophomore Full-Stack Builder',
    role: 'Full-Stack Software Engineering Intern',
    resume: `Projects:\n• Campus Marketplace (React, Node.js, Express, PostgreSQL): Built full-stack e-commerce app with JWT authentication, indexed database queries, and Stripe test checkout.\n• Study Group Matcher (TypeScript, Tailwind, Firebase): Deployed responsive web app used by 450+ campus students with real-time Firestore synchronization.\n• Open Source: Submitted 3 PRs fixing UI and bug tickets in popular React component libraries.\nSkills: TypeScript, React, Node.js, PostgreSQL, Git, Tailwind CSS.`,
    linkedin: `https://linkedin.com/in/alexchen-tech\nHeadline: Full-Stack Software Engineering Student | TypeScript, React, Node.js, PostgreSQL\nAbout: Sophomore CS major building real-world distributed web applications. Passionate about clean code, REST APIs, and developer tools.`,
  },
  {
    name: 'Junior with Prior Internship',
    role: 'Backend / Cloud Engineering Intern',
    resume: `Experience:\n• Software Engineering Intern at NovaTech Solutions (Summer 2025):\n  - Engineered 14+ RESTful endpoints in Go and PostgreSQL, reducing query p95 latency from 240ms to 45ms.\n  - Built automated Docker and GitHub Actions CI/CD pipelines, cutting deployment rollback rates by 35%.\n  - Implemented token-bucket rate limiter handling 8,000+ API requests per minute.\nProjects:\n• Distributed Key-Value Store (Go, Raft Consensus, Docker): Benchmarked node partition failovers with 99.9% read availability.\nSkills: Go, Python, Docker, AWS (ECS, S3), PostgreSQL, Redis, Kubernetes, Linux.`,
    linkedin: `https://linkedin.com/in/cloud-intern-pro\nHeadline: Software Engineering Intern at NovaTech | Distributed Systems & Cloud Infrastructure\nAbout: Junior CS student with backend production experience. Passionate about low-latency APIs, container orchestration, and high-availability systems.`,
  },
];

export function InitialLevelCalibratorModal({
  isOpen,
  onClose,
  profile,
  stats,
  onApplyAssessment,
  onShowToast,
}: InitialLevelCalibratorModalProps) {
  const [targetRole, setTargetRole] = useState(profile.targetRole || 'Software Engineering Intern');
  const [resumeText, setResumeText] = useState(() => {
    if (profile.currentResumeBullets && profile.currentResumeBullets.length > 0) {
      return `Summary: ${profile.experienceSummary || ''}\n\nBullet Points:\n${profile.currentResumeBullets.map((b) => `• ${b}`).join('\n')}`;
    }
    return '';
  });
  const [linkedinTextOrUrl, setLinkedinTextOrUrl] = useState(profile.linkedinUrl || '');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [assessment, setAssessment] = useState<InitialLevelAssessment | null>(null);

  if (!isOpen) return null;

  const handleRunEvaluation = async () => {
    if (!resumeText.trim() && !linkedinTextOrUrl.trim()) {
      if (onShowToast) {
        onShowToast({
          type: 'info',
          title: 'Input Needed',
          description: 'Please paste your resume bullets or LinkedIn profile information to calculate your level.',
        });
      }
      return;
    }

    setIsEvaluating(true);
    try {
      const res = await fetch('/api/gemini/evaluate-initial-level', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText,
          linkedinTextOrUrl,
          targetRole,
          currentSkills: profile.skills,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setAssessment(data.data);
        if (onShowToast) {
          onShowToast({
            type: 'streak',
            title: `Calibrated: Level ${data.data.level} (${data.data.levelTitle})`,
            description: `Evaluated resume & LinkedIn with ${data.data.confidenceScore}% confidence.`,
          });
        }
      }
    } catch (err) {
      console.error('Initial level evaluation error:', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleApply = () => {
    if (!assessment) return;
    onApplyAssessment(assessment);
    onClose();
  };

  const handleLoadSample = (sample: typeof SAMPLE_PRESETS[0]) => {
    setTargetRole(sample.role);
    setResumeText(sample.resume);
    setLinkedinTextOrUrl(sample.linkedin);
    setAssessment(null);
  };

  const handleUseCurrentProfile = () => {
    setTargetRole(profile.targetRole);
    setResumeText(
      `Summary: ${profile.experienceSummary || ''}\n\nBullet Points:\n${profile.currentResumeBullets.map((b) => `• ${b}`).join('\n')}`
    );
    setLinkedinTextOrUrl(profile.linkedinUrl || 'https://linkedin.com/in/' + profile.name.toLowerCase().replace(/\s+/g, '-'));
    setAssessment(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div
        id="initial-level-calibrator-modal"
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/95 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-sky-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-100">Initial Level Calibrator</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  LinkedIn &amp; Resume Driven
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Calibrates your starting candidate level (1 to 5), starting XP, and mastery scores based on verified portfolio evidence.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preset Sample Selector Bar */}
        <div className="px-6 py-2.5 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between gap-3 overflow-x-auto text-xs">
          <div className="flex items-center gap-1.5 text-slate-400 font-medium whitespace-nowrap">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Test with Sample:</span>
          </div>
          <div className="flex items-center gap-2">
            {SAMPLE_PRESETS.map((sample) => (
              <button
                key={sample.name}
                onClick={() => handleLoadSample(sample)}
                className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-slate-100 border border-slate-700 text-[11px] font-medium transition-colors whitespace-nowrap cursor-pointer"
              >
                {sample.name}
              </button>
            ))}
            <button
              onClick={handleUseCurrentProfile}
              className="px-2.5 py-1 rounded-md bg-indigo-950/50 hover:bg-indigo-900/50 text-indigo-300 border border-indigo-500/30 text-[11px] font-semibold transition-colors whitespace-nowrap cursor-pointer"
            >
              Use Current Profile Data
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-200">
          {/* Input Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Left: Resume Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Resume Content &amp; Bullet Points</span>
                </label>
                <span className="text-[10px] text-slate-500">Paste text, bullets, or coursework</span>
              </div>
              <textarea
                rows={7}
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste your resume bullets, technical projects, past work experiences, or campus coursework here..."
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono leading-relaxed"
              />
            </div>

            {/* Right: LinkedIn & Target Role */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1.5">
                  <Linkedin className="w-3.5 h-3.5 text-sky-400" />
                  <span>LinkedIn Profile URL or Headline / Summary</span>
                </label>
                <textarea
                  rows={4}
                  value={linkedinTextOrUrl}
                  onChange={(e) => setLinkedinTextOrUrl(e.target.value)}
                  placeholder="e.g., https://linkedin.com/in/yourprofile or paste your LinkedIn headline and About section..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Target Internship / Entry Role
                </label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Full-Stack Software Engineering Intern"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              {/* Action Button */}
              <button
                id="calculate-initial-level-btn"
                onClick={handleRunEvaluation}
                disabled={isEvaluating}
                className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                  isEvaluating
                    ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-400 hover:to-sky-400 text-white shadow-indigo-500/20'
                }`}
              >
                <Sparkles className={`w-4 h-4 ${isEvaluating ? 'animate-spin' : ''}`} />
                <span>
                  {isEvaluating
                    ? 'Auditing Resume & LinkedIn Signals...'
                    : 'Calculate Initial Level based on LinkedIn & Resume'}
                </span>
              </button>
            </div>
          </div>

          {/* Results Display */}
          {assessment && (
            <div className="space-y-6 pt-4 border-t border-slate-800 animate-in fade-in slide-in-from-bottom-3 duration-200">
              {/* Level Progress Ladder */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5 text-sky-400" />
                    <span>Candidate Progression Spectrum</span>
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400">
                    Calibration Confidence: {assessment.confidenceScore}%
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {LEVEL_THRESHOLDS.map((tier) => {
                    const isAssigned = tier.level === assessment.level;
                    const isLower = tier.level < assessment.level;

                    return (
                      <div
                        key={tier.level}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          isAssigned
                            ? 'bg-indigo-950/60 border-indigo-400/80 ring-2 ring-indigo-500/40 shadow-lg shadow-indigo-500/10'
                            : isLower
                            ? 'bg-slate-900/50 border-slate-800 text-slate-400'
                            : 'bg-slate-900/30 border-slate-800/60 text-slate-500'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <span className={`text-[10px] font-bold ${isAssigned ? 'text-indigo-300' : 'text-slate-400'}`}>
                            Lvl {tier.level}
                          </span>
                          {isAssigned && (
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          )}
                        </div>
                        <p className={`text-xs font-bold leading-tight ${isAssigned ? 'text-white' : 'text-slate-300'}`}>
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

              {/* Assessment Summary Card */}
              <div className="bg-gradient-to-br from-slate-900 via-indigo-950/30 to-slate-900 border border-indigo-500/30 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-sky-500 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg">
                      {assessment.level}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                          Calibrated Initial Level
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {assessment.candidateArchetype}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-100">
                        Level {assessment.level}: {assessment.levelTitle}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Starting XP</span>
                      <span className="text-base font-black text-amber-300 font-mono">
                        +{assessment.startingXp} XP
                      </span>
                    </div>
                  </div>
                </div>

                {/* Recruiter Rationale */}
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-300 leading-relaxed space-y-1">
                  <div className="font-semibold text-slate-200 flex items-center gap-1.5 mb-1">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                    <span>Recruiter Calibration Justification:</span>
                  </div>
                  <p>{assessment.rationale}</p>
                </div>

                {/* Diagnostics Grid: Resume vs LinkedIn */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  {/* Resume Diagnostic */}
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Resume Audit</span>
                      </span>
                      <span className="text-[11px] font-bold text-indigo-300">
                        Quality: {assessment.resumeAnalysis.bulletQualityScore}/100
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="text-slate-400">Quantified Impact Metrics:</span>
                      {assessment.resumeAnalysis.quantifiedMetricsPresence ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Detected
                        </span>
                      ) : (
                        <span className="text-amber-400 font-semibold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Needs XYZ Numbers
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Top Strengths</span>
                      <ul className="space-y-0.5 text-slate-300">
                        {assessment.resumeAnalysis.strengths.slice(0, 2).map((s, idx) => (
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
                        {assessment.resumeAnalysis.improvementsNeeded.slice(0, 2).map((imp, idx) => (
                          <li key={idx} className="flex items-start gap-1.5 text-[11px]">
                            <span className="text-amber-400 font-bold">•</span>
                            <span>{imp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* LinkedIn Diagnostic */}
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                        <Linkedin className="w-3.5 h-3.5 text-sky-400" />
                        <span>LinkedIn Audit</span>
                      </span>
                      <span className="text-[11px] font-bold text-sky-300">
                        Completeness: {assessment.linkedInAnalysis.completenessScore}%
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300 italic">
                      "{assessment.linkedInAnalysis.headlineAssessment}"
                    </p>

                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Recruiter Recommendations</span>
                      <ul className="space-y-1 text-slate-300">
                        {assessment.linkedInAnalysis.recommendations.slice(0, 2).map((rec, idx) => (
                          <li key={idx} className="flex items-start gap-1.5 text-[11px]">
                            <span className="text-sky-400 font-bold">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Calibrated Technical Skills Inventory */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Extracted Skills &amp; Initial Mastery Calibration:</span>
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Inferred from projects and work experience
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {assessment.extractedSkills.map((skill, idx) => {
                      const levelColors: Record<string, string> = {
                        Beginner: 'text-amber-400 border-amber-500/20 bg-amber-500/5',
                        Intermediate: 'text-sky-400 border-sky-500/20 bg-sky-500/5',
                        Advanced: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5',
                        Expert: 'text-purple-400 border-purple-500/20 bg-purple-500/5',
                      };

                      return (
                        <div
                          key={idx}
                          className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-200 text-xs">{skill.name}</span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                                levelColors[skill.level] || levelColors.Intermediate
                              }`}
                            >
                              {skill.level}
                            </span>
                          </div>

                          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-1.5 rounded-full bg-indigo-500"
                              style={{ width: `${skill.masteryScore}%` }}
                            />
                          </div>

                          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                            <span>{skill.category}</span>
                            <span>{skill.masteryScore}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Next Steps to Reach Next Tier */}
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5 text-xs">
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Recommended Milestones to Reach Level {Math.min(5, assessment.level + 1)}:</span>
                  </span>
                  <ul className="space-y-1 text-slate-300">
                    {assessment.recommendedNextMilestones.map((ms, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 text-[11px]">
                        <span className="text-indigo-400 font-bold">•</span>
                        <span>{ms}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/95 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          {assessment ? (
            <button
              id="apply-initial-level-btn"
              type="button"
              onClick={handleApply}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-400 hover:to-sky-400 text-slate-950 flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-slate-950" />
              <span>
                Apply Level {assessment.level} ({assessment.levelTitle}) &amp; Skills to Profile
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleRunEvaluation}
              disabled={isEvaluating}
              className="px-5 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <span>Calculate Initial Level</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
