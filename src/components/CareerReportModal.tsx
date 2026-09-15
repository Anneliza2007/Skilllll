import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  X,
  CheckCircle2,
  Sparkles,
  Award,
  TrendingUp,
  Target,
  Flame,
  BarChart2,
  Calendar,
  AlertCircle,
  Sliders,
} from 'lucide-react';
import { StudentProfile, UserStats } from '../types';
import { downloadCareerReportPdf, ReportOptions } from '../utils/generateCareerReportPdf';
import { LEVEL_THRESHOLDS } from '../data/mockData';

interface CareerReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: StudentProfile;
  stats: UserStats;
  onDownloaded?: () => void;
}

export function CareerReportModal({
  isOpen,
  onClose,
  profile,
  stats,
  onDownloaded,
}: CareerReportModalProps) {
  const [includeXpHistory, setIncludeXpHistory] = useState(true);
  const [includeRecommendations, setIncludeRecommendations] = useState(true);
  const [notes, setNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const currentLevelInfo =
    LEVEL_THRESHOLDS.find((l) => l.level === stats.level) || LEVEL_THRESHOLDS[0];
  const nextLevel = LEVEL_THRESHOLDS.find((l) => l.level === stats.level + 1);
  const nextLevelThreshold = currentLevelInfo.maxXp;
  const prevLevelThreshold = currentLevelInfo.minXp;
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round(((stats.xp - prevLevelThreshold) / (nextLevelThreshold - prevLevelThreshold)) * 100))
  );

  const averageMastery = Math.round(
    profile.skills.reduce((acc, s) => acc + s.masteryScore, 0) / Math.max(profile.skills.length, 1)
  );
  const resumeScore = profile.currentResumeBullets.length >= 3 ? 92 : 65;
  const quizFactor = Math.min(100, stats.quizzesCompleted * 16);
  const projectFactor = Math.min(100, stats.projectsStarted * 35);
  const readinessScore = Math.min(
    100,
    Math.round(averageMastery * 0.35 + resumeScore * 0.25 + projectFactor * 0.2 + quizFactor * 0.2)
  );

  const handleDownload = () => {
    setIsGenerating(true);
    try {
      const options: ReportOptions = {
        includeXpHistory,
        includeRecommendations,
        notes: notes.trim(),
      };
      downloadCareerReportPdf(profile, stats, options);
      setDownloadSuccess(true);
      if (onDownloaded) onDownloaded();
      setTimeout(() => setDownloadSuccess(false), 3500);
    } catch (err) {
      console.error('PDF generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-100">Career Progress Report</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/10 text-sky-300 border border-sky-500/20">
                  PDF Export
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Official diagnostic summary of skill mastery, XP velocity, and readiness index
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              title="Print document or use browser PDF engine"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Preview</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Options + Report Document Preview */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Export Customization Bar */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-sky-400" />
                Report Options &amp; Inclusions
              </span>
              <span className="text-[11px] text-slate-500 font-mono">2-Page PDF Document</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeXpHistory}
                  onChange={(e) => setIncludeXpHistory(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-sky-500/20"
                />
                <span>Include XP Progression &amp; Milestone Logs</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeRecommendations}
                  onChange={(e) => setIncludeRecommendations(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-sky-500/20"
                />
                <span>Include Targeted Diagnostic &amp; Resume Roadmap</span>
              </label>
            </div>

            <div className="pt-2 border-t border-slate-800/80">
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional coach/advisor notes to embed at the bottom of the PDF..."
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* Document Preview Container (Paper-like view) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span>Live PDF Preview</span>
              <span className="font-mono text-[11px] text-sky-400">Vector-rendered A4 Layout</span>
            </div>

            {/* Paper Sheet Mockup */}
            <div className="bg-slate-100 text-slate-900 rounded-xl p-6 sm:p-8 shadow-inner border border-slate-200 font-sans space-y-6">
              {/* Document Banner */}
              <div className="bg-slate-900 text-slate-100 -mx-6 sm:-mx-8 -mt-6 sm:-mt-8 p-5 rounded-t-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t-4 border-sky-500">
                <div>
                  <h3 className="text-base sm:text-lg font-bold tracking-tight text-white">
                    CAREER PROGRESS &amp; SKILL MASTERY REPORT
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Diagnostic evaluation of technical mastery, XP progression, and internship preparedness
                  </p>
                </div>
                <div className="text-left sm:text-right text-[11px] font-mono">
                  <span className="text-sky-400 font-bold block">OFFICIAL CANDIDATE EVALUATION</span>
                  <span className="text-slate-400">
                    {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* Candidate Info Card */}
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-base font-bold text-slate-900">{profile.name}</h4>
                  <p className="text-xs text-sky-700 font-semibold">{profile.targetRole}</p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {profile.major} • {profile.university} (Class of {profile.graduationYear})
                  </p>
                </div>
                <div className="text-xs text-slate-600 sm:text-right space-y-0.5 font-mono">
                  {profile.githubUrl && <div>GitHub: {profile.githubUrl.replace('https://', '')}</div>}
                  {profile.linkedinUrl && <div>LinkedIn: {profile.linkedinUrl.replace('https://', '')}</div>}
                </div>
              </div>

              {/* 4 Stat Metric Tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                  <span className="text-[10px] font-bold uppercase text-emerald-800 block">Readiness Index</span>
                  <span className="text-xl font-black text-emerald-600 font-mono">{readinessScore}/100</span>
                  <span className="text-[10px] text-emerald-700 block mt-0.5">Top 15% Profile</span>
                </div>

                <div className="bg-sky-50 border border-sky-200 rounded-lg p-3">
                  <span className="text-[10px] font-bold uppercase text-sky-800 block">Rank &amp; Tier</span>
                  <span className="text-lg font-bold text-sky-700 block">Tier {stats.level}</span>
                  <span className="text-[10px] text-sky-600 block mt-0.5">{currentLevelInfo.title}</span>
                </div>

                <div className="bg-rose-50 border border-rose-200 rounded-lg p-3">
                  <span className="text-[10px] font-bold uppercase text-rose-800 block">Total Experience</span>
                  <span className="text-xl font-black text-rose-600 font-mono">{stats.xp} XP</span>
                  <span className="text-[10px] text-rose-700 block mt-0.5">
                    {nextLevelThreshold - stats.xp} XP to Tier {stats.level + 1}
                  </span>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <span className="text-[10px] font-bold uppercase text-amber-800 block">Habit Flame</span>
                  <span className="text-xl font-black text-amber-600 font-mono">{stats.dailyStreak} Days</span>
                  <span className="text-[10px] text-amber-700 block mt-0.5">Best: {stats.longestStreak} Days</span>
                </div>
              </div>

              {/* Skills Table Summary */}
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                <div className="bg-slate-800 text-slate-200 px-4 py-2 text-xs font-bold grid grid-cols-12">
                  <span className="col-span-4">Skill Name</span>
                  <span className="col-span-3">Category</span>
                  <span className="col-span-2">Proficiency</span>
                  <span className="col-span-3 text-right">Mastery &amp; Progress</span>
                </div>

                <div className="divide-y divide-slate-100 text-xs">
                  {profile.skills.slice(0, 7).map((skill) => (
                    <div key={skill.id || skill.name} className="px-4 py-2.5 grid grid-cols-12 items-center">
                      <span className="col-span-4 font-bold text-slate-800">{skill.name}</span>
                      <span className="col-span-3 text-slate-600">{skill.category}</span>
                      <span className="col-span-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            skill.level === 'Expert'
                              ? 'bg-purple-100 text-purple-800'
                              : skill.level === 'Advanced'
                              ? 'bg-emerald-100 text-emerald-800'
                              : skill.level === 'Intermediate'
                              ? 'bg-sky-100 text-sky-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {skill.level}
                        </span>
                      </span>
                      <div className="col-span-3 flex items-center justify-end gap-2">
                        <span className="font-mono font-bold text-slate-700 text-[11px]">
                          {skill.masteryScore}%
                        </span>
                        <div className="w-16 bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full ${
                              skill.masteryScore >= 85
                                ? 'bg-emerald-500'
                                : skill.masteryScore >= 70
                                ? 'bg-sky-500'
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${skill.masteryScore}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Page 2 Preview Snippet */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="font-bold text-slate-800 block mb-1">XP Milestones Log</span>
                  <div className="space-y-1 text-[11px] text-slate-600">
                    {stats.xpHistory.slice(0, 3).map((h, i) => (
                      <div key={i} className="flex justify-between">
                        <span className="truncate pr-2">• {h.description}</span>
                        <span className="font-mono text-emerald-600 font-bold">+{h.amount} XP</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="font-bold text-slate-800 block mb-1">Targeted Next Steps</span>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Prioritize diagnostic quizzes in {profile.skills.find((s) => s.masteryScore < 70)?.name || 'systems design'}{' '}
                    to elevate technical mastery above the 70% threshold.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer / Action Bar */}
        <div className="p-4 sm:px-6 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            {downloadSuccess ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Report downloaded successfully!
              </span>
            ) : (
              <span>Includes complete skill matrix, readiness index, streak stats &amp; XP history.</span>
            )}
          </div>

          <div className="flex items-center gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              onClick={handleDownload}
              disabled={isGenerating}
              className="px-5 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-sky-500/20 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isGenerating ? 'Generating PDF...' : 'Download Official PDF'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
