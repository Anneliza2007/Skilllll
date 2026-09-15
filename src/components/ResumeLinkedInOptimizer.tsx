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
} from 'lucide-react';
import { OptimizationResult, StudentProfile } from '../types';

interface ResumeLinkedInOptimizerProps {
  profile: StudentProfile;
  initialRole?: string;
  onProfileOptimized: (xpEarned: number) => void;
  onOpenPromptLab?: (promptId?: string) => void;
}

export function ResumeLinkedInOptimizer({
  profile,
  initialRole,
  onProfileOptimized,
  onOpenPromptLab,
}: ResumeLinkedInOptimizerProps) {
  const [targetRole, setTargetRole] = useState(initialRole || profile.targetRole);
  const [customBulletInput, setCustomBulletInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [optimizationData, setOptimizationData] = useState<OptimizationResult | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'resume' | 'linkedin' | 'ats'>('resume');

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

          <div className="flex items-center gap-2">
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
        <div className="flex border-t border-slate-800 pt-3 gap-2">
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

      {/* Results View */}
      {optimizationData && !isLoading && (
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

      {/* Initial Empty State prompt if not yet generated */}
      {!optimizationData && !isLoading && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-100">Ready to Auto-Optimize Your Profile?</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Click "Optimize Profile Now" above to translate your raw experience into quantified, ATS-proof resume bullets and high-converting LinkedIn copy.
          </p>
          <button
            onClick={() => handleRunOptimization()}
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-400 hover:to-sky-400 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
          >
            Launch Auto-Optimizer (+35 XP)
          </button>
        </div>
      )}
    </div>
  );
}
