import React, { useState, useMemo, FormEvent } from 'react';
import {
  Flame,
  Award,
  TrendingUp,
  CheckCircle2,
  Calendar,
  Sparkles,
  Zap,
  Target,
  ArrowUpRight,
  Shield,
  BookOpen,
  FileText,
  Clock,
  Plus,
  Trash2,
  BarChart2,
  CheckSquare,
  Square,
  AlertCircle,
  Compass,
  Download,
  Eye,
} from 'lucide-react';
import { StudentProfile, UserStats, DailyTodoItem } from '../types';
import { LEVEL_THRESHOLDS } from '../data/mockData';
import { CareerReportModal } from './CareerReportModal';
import { downloadCareerReportPdf } from '../utils/generateCareerReportPdf';
import { Tooltip } from './Tooltip';

interface ProgressDashboardProps {
  profile: StudentProfile;
  stats: UserStats;
  onClaimDailyStreak: () => void;
  onNavigateToTab: (tab: 'internships' | 'quizzes' | 'resume' | 'projects' | 'platforms' | 'badges') => void;
  onToggleTodo: (todoId: string) => void;
  onAddCustomTodo: (title: string) => void;
  onDeleteTodo: (todoId: string) => void;
  onOpenPromptLab: (promptId?: string) => void;
  onUseStreakFreeze?: () => void;
  onShowToast?: (toast: { type: 'xp' | 'streak' | 'info'; title: string; description: string }) => void;
}

export function ProgressDashboard({
  profile,
  stats,
  onClaimDailyStreak,
  onNavigateToTab,
  onToggleTodo,
  onAddCustomTodo,
  onDeleteTodo,
  onOpenPromptLab,
  onUseStreakFreeze,
  onShowToast,
}: ProgressDashboardProps) {
  const [customTaskInput, setCustomTaskInput] = useState('');
  const [chartSkillFilter, setChartSkillFilter] = useState<'all' | 'weak' | 'strong'>('all');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isQuickDownloading, setIsQuickDownloading] = useState(false);

  const handleQuickDownload = () => {
    setIsQuickDownloading(true);
    try {
      downloadCareerReportPdf(profile, stats, {
        includeXpHistory: true,
        includeRecommendations: true,
      });
      if (onShowToast) {
        onShowToast({
          type: 'streak',
          title: 'Career Progress Report Downloaded! 📄',
          description: `Generated 2-page PDF summarizing ${profile.skills.length} skills, ${stats.xp} XP, and readiness index.`,
        });
      }
    } catch (err) {
      console.error('Quick download error:', err);
    } finally {
      setTimeout(() => setIsQuickDownloading(false), 1200);
    }
  };

  const handleModalDownloaded = () => {
    if (onShowToast) {
      onShowToast({
        type: 'streak',
        title: 'Career Progress Report Downloaded! 📄',
        description: 'Your official diagnostic summary PDF has been saved to your downloads.',
      });
    }
  };

  const currentLevelInfo =
    LEVEL_THRESHOLDS.find((l) => l.level === stats.level) || LEVEL_THRESHOLDS[0];
  const nextLevel = LEVEL_THRESHOLDS.find((l) => l.level === stats.level + 1);
  const nextLevelThreshold = currentLevelInfo.maxXp;
  const prevLevelThreshold = currentLevelInfo.minXp;
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round(((stats.xp - prevLevelThreshold) / (nextLevelThreshold - prevLevelThreshold)) * 100))
  );

  // Compute Career Readiness Score
  const strongSkillsCount = profile.skills.filter(
    (s) => s.level === 'Advanced' || s.level === 'Expert' || s.masteryScore >= 70
  ).length;
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

  // Streak Multiplier
  let streakMultiplier = '1.0x';
  let multiplierLabel = 'Base Velocity';
  if (stats.dailyStreak >= 14) {
    streakMultiplier = '2.0x';
    multiplierLabel = 'Apex Momentum (+100% XP)';
  } else if (stats.dailyStreak >= 7) {
    streakMultiplier = '1.5x';
    multiplierLabel = 'Unstoppable Habit (+50% XP)';
  } else if (stats.dailyStreak >= 3) {
    streakMultiplier = '1.2x';
    multiplierLabel = 'Active Fire (+20% XP)';
  }

  // 7-day streak calendar visualization
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const todayDayIndex = (new Date().getDay() + 6) % 7; // Monday = 0

  // Category grouping for Domain Distribution Bar Chart
  const categoryMastery = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    profile.skills.forEach((s) => {
      if (!map[s.category]) map[s.category] = { total: 0, count: 0 };
      map[s.category].total += s.masteryScore;
      map[s.category].count += 1;
    });
    return Object.entries(map).map(([category, val]) => ({
      category,
      avg: Math.round(val.total / val.count),
      count: val.count,
    }));
  }, [profile.skills]);

  // Filter skills for bar chart
  const filteredSkillsForChart = useMemo(() => {
    return profile.skills.filter((s) => {
      const isStrong = s.level === 'Advanced' || s.level === 'Expert' || s.masteryScore >= 70;
      if (chartSkillFilter === 'weak') return !isStrong;
      if (chartSkillFilter === 'strong') return isStrong;
      return true;
    });
  }, [profile.skills, chartSkillFilter]);

  // Todo Items
  const dailyTodos = stats.dailyTodos || [];
  const completedTodosCount = dailyTodos.filter((t) => t.completed).length;
  const todoCompletionPercent =
    dailyTodos.length > 0 ? Math.round((completedTodosCount / dailyTodos.length) * 100) : 0;

  const handleAddTodoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTaskInput.trim()) return;
    onAddCustomTodo(customTaskInput.trim());
    setCustomTaskInput('');
  };

  const achievements = [
    {
      id: 'ach-1',
      title: 'Diagnostic Cleared',
      desc: 'Completed first weak-topic quiz',
      unlocked: stats.quizzesCompleted > 0,
      icon: '⚡',
    },
    {
      id: 'ach-2',
      title: 'Streak Flame',
      desc: 'Maintained a 3+ day streak',
      unlocked: stats.dailyStreak >= 3,
      icon: '🔥',
    },
    {
      id: 'ach-3',
      title: 'Resume Polished',
      desc: 'Generated Google XYZ bullet points',
      unlocked: stats.resumesOptimized > 0,
      icon: '📝',
    },
    {
      id: 'ach-4',
      title: 'Project Builder',
      desc: 'Started an architectural portfolio project',
      unlocked: stats.projectsStarted > 0,
      icon: '💡',
    },
    {
      id: 'ach-5',
      title: 'Internship Hunter',
      desc: 'Saved or marked applied on an internship',
      unlocked: stats.internshipsApplied > 0,
      icon: '🎯',
    },
    {
      id: 'ach-6',
      title: 'Skill Master',
      desc: 'Reached 90%+ mastery in any skill',
      unlocked: profile.skills.some((s) => s.masteryScore >= 90),
      icon: '👑',
    },
  ];

  // Weekly dummy data for XP volume chart
  const weeklyActivityData = [
    { day: 'Mon', xp: 45, height: '40%' },
    { day: 'Tue', xp: 75, height: '65%' },
    { day: 'Wed', xp: 50, height: '45%' },
    { day: 'Thu', xp: 95, height: '80%' },
    { day: 'Fri', xp: 60, height: '52%' },
    { day: 'Sat', xp: 120, height: '95%' },
    { day: 'Sun', xp: stats.checkedInToday ? 80 : 30, height: stats.checkedInToday ? '70%' : '25%' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner with PDF Report & Prompt Lab Links */}
      <div className="bg-gradient-to-r from-sky-950/40 via-slate-900 to-slate-900 border border-sky-500/20 rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <BarChart2 className="w-3.5 h-3.5" />
              Graphical Analytics &amp; Habits
            </span>
            <span className="text-xs text-slate-400">
              Tier {stats.level} • {stats.xp} Total XP
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
            Progress Analytics &amp; Daily Habit Engine
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Visual breakdown of skill mastery, interactive daily action checklists with checkboxes, and daily streak protection.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {/* Primary Career Progress Report PDF Button */}
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-xs font-bold text-white flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-sky-500/25 active:scale-95"
            title="Preview and customize full 2-page Career Progress Report PDF"
          >
            <FileText className="w-4 h-4" />
            <span>Career Report (PDF)</span>
          </button>

          {/* Quick Direct Download Button */}
          <button
            onClick={handleQuickDownload}
            disabled={isQuickDownloading}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-all cursor-pointer shadow-md disabled:opacity-50"
            title="Instantly download Career Progress Report PDF with default options"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span>{isQuickDownloading ? 'Saving...' : 'Quick PDF'}</span>
          </button>

          <button
            onClick={() => onOpenPromptLab('prompt-streak-routine')}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Prompt Lab</span>
          </button>
        </div>
      </div>

      {/* Gamification & Streak Banner: 3-column top cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Streak Maintainer Card */}
        <div className="bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 rounded-2xl p-6 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Flame className="w-4 h-4 fill-amber-400 text-amber-400 animate-pulse" />
                Daily Streak Maintainer
              </span>
              <span className="text-xs text-slate-400">Record: {stats.longestStreak} Days</span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-4xl sm:text-5xl font-extrabold text-slate-100 font-mono tracking-tight">
                {stats.dailyStreak}
              </span>
              <div>
                <span className="text-base font-bold text-amber-300 block leading-tight">Days Active</span>
                <span className="text-[10px] font-mono text-amber-400/90 font-semibold">
                  Multiplier: {streakMultiplier} ({multiplierLabel})
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 mt-2">
              {stats.checkedInToday
                ? 'Streak safely locked for today! Check in tomorrow to keep the flame burning.'
                : 'Claim your daily check-in now to maintain your learning momentum!'}
            </p>
          </div>

          {/* 7-Day Mini Calendar */}
          <div className="mt-5 pt-4 border-t border-slate-800">
            <div className="flex justify-between items-center mb-2 text-[10px] text-slate-400 font-medium">
              <span>Weekly Streak Momentum</span>
              <Tooltip
                position="top"
                content="Freeze Shields protect your streak from resetting if you miss a single calendar day."
              >
                <span className="text-amber-300 font-semibold cursor-help">
                  {stats.streakFreezesAvailable || 1} Freeze Shield Ready
                </span>
              </Tooltip>
            </div>
            <div className="grid grid-cols-7 gap-1.5 text-center">
              {daysOfWeek.map((day, idx) => {
                const isPast = idx < todayDayIndex;
                const isToday = idx === todayDayIndex;
                const active =
                  (isPast && idx >= todayDayIndex - stats.dailyStreak + 1) ||
                  (isToday && stats.checkedInToday);

                return (
                  <Tooltip
                    key={day}
                    position="top"
                    content={`${day}: ${active ? 'Streak verified ✓' : isToday ? 'Check in today!' : 'Pending'}`}
                  >
                    <div className="flex flex-col items-center gap-1 cursor-help">
                      <span className="text-[10px] text-slate-500 font-mono">{day}</span>
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                          active
                            ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/20'
                            : isToday
                            ? 'border border-dashed border-amber-400 text-amber-300'
                            : 'bg-slate-950 border border-slate-800 text-slate-600'
                        }`}
                      >
                        {active ? '✓' : idx + 1}
                      </div>
                    </div>
                  </Tooltip>
                );
              })}
            </div>

            {!stats.checkedInToday ? (
              <button
                onClick={onClaimDailyStreak}
                className="w-full mt-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer active:scale-95"
              >
                <Flame className="w-4 h-4 fill-slate-950" />
                <span>Claim Daily Streak Bonus (+20 XP)</span>
              </button>
            ) : (
              <div className="w-full mt-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold rounded-xl flex items-center justify-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Streak Protected Today</span>
              </div>
            )}

            <button
              onClick={() => onNavigateToTab('platforms')}
              className="w-full mt-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-750 text-amber-300 border border-amber-500/20 text-[11px] font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Flame className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span>Sync LeetCode &amp; HackerRank Streaks</span>
            </button>
          </div>
        </div>

        {/* Level Status & XP Progression Card */}
        <div className="bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-sky-400" />
                Rank &amp; Experience
              </span>
              <Tooltip position="top" content={`Your current tier standing: Level ${stats.level} of 5`}>
                <span className="text-xs font-mono font-bold text-sky-300 px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/20 cursor-help">
                  Tier {stats.level}
                </span>
              </Tooltip>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-slate-100">{currentLevelInfo.title}</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Next Tier: <strong className="text-slate-200">{nextLevel ? nextLevel.title : 'Mastery Peak'}</strong>
            </p>

            <Tooltip
              position="top"
              className="w-full block"
              content={`XP Progression: ${stats.xp} of ${nextLevelThreshold} XP (${progressPercent}% toward ${nextLevel ? nextLevel.title : 'Peak'}). Need ${Math.max(0, nextLevelThreshold - stats.xp)} more XP.`}
            >
              <div className="mt-5 space-y-2 cursor-help">
                <div className="flex justify-between text-xs text-slate-300 font-mono">
                  <span>{stats.xp} Current XP</span>
                  <span>{nextLevelThreshold} XP Next</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-sky-400 to-indigo-500 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="text-[11px] text-slate-400 block text-right font-mono">
                  {nextLevelThreshold - stats.xp} XP to level up
                </span>
              </div>
            </Tooltip>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Quizzes: <strong className="text-slate-200">{stats.quizzesCompleted}</strong></span>
            <span>Projects: <strong className="text-slate-200">{stats.projectsStarted}</strong></span>
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="text-[11px] font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors cursor-pointer"
              title="Generate PDF Career Report"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        {/* Career Readiness Score Card */}
        <div className="bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl p-6 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-emerald-400" />
                Internship Readiness Score
              </span>
              <Tooltip position="top" content="Calculated composite metric predicting your interview and selection probability across tech roles.">
                <span className="text-xs text-emerald-300 font-semibold cursor-help">Competitive</span>
              </Tooltip>
            </div>

            <div className="flex items-center gap-4 my-2">
              <Tooltip
                position="top"
                content={`${readinessScore}/100 Readiness: Weighted score based 40% on skill mastery, 35% on resume XYZ quantification, and 25% on technical diagnostics.`}
              >
                <div className="w-20 h-20 rounded-2xl bg-slate-950 border border-emerald-500/40 flex flex-col items-center justify-center text-center shadow-inner cursor-help">
                  <span className="text-3xl font-black text-emerald-400 font-mono leading-none">{readinessScore}</span>
                  <span className="text-[9px] uppercase font-bold text-slate-400 mt-1">/ 100 PTS</span>
                </div>
              </Tooltip>

              <div className="space-y-1 text-xs text-slate-300">
                <p className="font-semibold text-slate-100">Top 15% Candidate Profile</p>
                <p className="text-slate-400 leading-tight">
                  Evaluated across skill depth, diagnostic coverage, quantified resume XYZ bullets, and portfolio architectures.
                </p>
              </div>
            </div>
          </div>

          {/* Breakdown progress bars */}
          <div className="space-y-2 pt-3 border-t border-slate-800 text-xs">
            <Tooltip
              position="top"
              className="w-full block"
              content="Skill Mastery Index: Average verified proficiency across your technical curriculum skills. Target: 75%+."
            >
              <div className="space-y-1 cursor-help">
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Skill Mastery Index:</span>
                  <span className="text-slate-200 font-semibold">{averageMastery}%</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-sky-400 h-1.5 rounded-full" style={{ width: `${averageMastery}%` }} />
                </div>
              </div>
            </Tooltip>

            <Tooltip
              position="top"
              className="w-full block"
              content="Resume XYZ Polish: Quality score for achievement-driven Google XYZ format bullets (Accomplished [X], measured by [Y], by doing [Z])."
            >
              <div className="space-y-1 cursor-help">
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Resume XYZ Polish:</span>
                  <span className="text-slate-200 font-semibold">{resumeScore}%</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-indigo-400 h-1.5 rounded-full" style={{ width: `${resumeScore}%` }} />
                </div>
              </div>
            </Tooltip>

            <Tooltip
              position="top"
              className="w-full block"
              content="Diagnostics & Tests: Coverage of completed interactive skill assessments and practice platform benchmarks."
            >
              <div className="space-y-1 cursor-help">
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Diagnostics &amp; Tests:</span>
                  <span className="text-slate-200 font-semibold">{quizFactor}%</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-emerald-400 h-1.5 rounded-full" style={{ width: `${quizFactor}%` }} />
                </div>
              </div>
            </Tooltip>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-mono">Verified Scorecard</span>
              <button
                onClick={() => setIsReportModalOpen(true)}
                className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>Download Report PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Action Plan & Habit Checklist (Todo List with Checkboxes) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CheckSquare className="w-4 h-4 text-emerald-400" />
              <h2 className="text-base font-bold text-slate-100">
                Daily Action Plan &amp; Habit Checklist
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Tick and check off your daily goals to maintain your streak and earn immediate bonus XP:
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs font-mono font-bold text-slate-200 block">
                {completedTodosCount} of {dailyTodos.length} Completed
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold">
                {todoCompletionPercent}% Today's Target
              </span>
            </div>
            <Tooltip
              position="top"
              content={`Checklist Target: ${completedTodosCount}/${dailyTodos.length} actions finished (${todoCompletionPercent}%). Complete daily habits to earn XP and strengthen streak.`}
            >
              <div className="w-20 bg-slate-800 rounded-full h-2 overflow-hidden cursor-help">
                <div
                  className="bg-emerald-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${todoCompletionPercent}%` }}
                />
              </div>
            </Tooltip>
          </div>
        </div>

        {/* Todo Items Checklist */}
        <div className="space-y-2">
          {dailyTodos.map((todo) => {
            return (
              <div
                key={todo.id}
                className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                  todo.completed
                    ? 'bg-slate-950/60 border-emerald-500/30 text-slate-400'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-200'
                }`}
              >
                <div
                  onClick={() => onToggleTodo(todo.id)}
                  className="flex items-center gap-3 flex-1 cursor-pointer select-none"
                >
                  <button
                    type="button"
                    className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                      todo.completed
                        ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30'
                        : 'border border-slate-600 hover:border-sky-400 text-transparent'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>

                  <span
                    className={`text-xs font-medium leading-normal ${
                      todo.completed ? 'line-through text-slate-500' : 'text-slate-200'
                    }`}
                  >
                    {todo.title}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 ml-3">
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      todo.completed
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                    }`}
                  >
                    +{todo.xpReward} XP
                  </span>

                  {todo.isCustom && (
                    <button
                      onClick={() => onDeleteTodo(todo.id)}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Delete custom task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Custom Task Input */}
        <form onSubmit={handleAddTodoSubmit} className="pt-2 border-t border-slate-800/80 flex gap-2">
          <input
            type="text"
            value={customTaskInput}
            onChange={(e) => setCustomTaskInput(e.target.value)}
            placeholder="Add custom daily goal (e.g., Read DDIA Chapter 3, Solve 1 LeetCode in Rust)..."
            className="flex-1 px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
          <button
            type="submit"
            disabled={!customTaskInput.trim()}
            className="px-4 py-2 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-sky-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
        </form>
      </div>

      {/* Graphical Bar Formats: Multi-bar Skill Comparison & Domain Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Horizontal Skill Benchmark Bar Chart (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-sky-400" />
                Skill Mastery Benchmark Bar Chart
              </h3>
              <p className="text-xs text-slate-400">
                Visual progress bars compared against industry benchmark thresholds:
              </p>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setChartSkillFilter('all')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                  chartSkillFilter === 'all' ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setChartSkillFilter('weak')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                  chartSkillFilter === 'weak' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Weak (&lt;70%)
              </button>
              <button
                onClick={() => setChartSkillFilter('strong')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                  chartSkillFilter === 'strong' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Strong (≥70%)
              </button>
            </div>
          </div>

          {/* Benchmark Legend */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 border-b border-slate-800 pb-2">
            <span>Skill</span>
            <div className="flex items-center gap-4 font-mono">
              <Tooltip position="top" content="60% Baseline: The minimum proficiency expected by hiring managers for entry-level internships.">
                <span className="flex items-center gap-1 cursor-help">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span> 60% Baseline
                </span>
              </Tooltip>
              <Tooltip position="top" content="85% Standout: High-competency threshold separating top-percentile candidates in interview selection.">
                <span className="flex items-center gap-1 cursor-help">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span> 85% Standout
                </span>
              </Tooltip>
            </div>
          </div>

          {/* Graphical Bars */}
          <div className="space-y-3.5">
            {filteredSkillsForChart.map((skill) => {
              const isStrong = skill.masteryScore >= 70;
              const standing =
                skill.masteryScore >= 85
                  ? 'Standout Candidate'
                  : skill.masteryScore >= 60
                  ? 'Industry Baseline'
                  : 'Growth Opportunity';

              return (
                <div key={skill.id || skill.name} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-200">{skill.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500">({skill.category})</span>
                      <span className="font-mono font-bold text-slate-300">{skill.masteryScore}%</span>
                    </div>
                  </div>

                  {/* Visual Bar with benchmark markers */}
                  <Tooltip
                    position="top"
                    className="w-full block"
                    content={
                      <div className="space-y-1 text-left">
                        <p className="font-bold text-slate-100 flex items-center justify-between gap-2">
                          <span>{skill.name}</span>
                          <span className={skill.masteryScore >= 85 ? 'text-emerald-400 font-mono' : skill.masteryScore >= 60 ? 'text-sky-400 font-mono' : 'text-amber-400 font-mono'}>
                            {skill.masteryScore}% ({standing})
                          </span>
                        </p>
                        <p className="text-[11px] text-slate-300">
                          {skill.masteryScore >= 85
                            ? 'Exceptional mastery surpassing the 85% standout bar. Highlight in interview discussions.'
                            : skill.masteryScore >= 60
                            ? 'Meets standard job requirements. Target 85%+ through diagnostic quizzes.'
                            : 'Currently below 60% baseline. Prioritize targeted practice in diagnostic quizzes.'}
                        </p>
                      </div>
                    }
                  >
                    <div className="relative w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800 cursor-help">
                      {/* Baseline indicator line at 60% */}
                      <div className="absolute top-0 bottom-0 left-[60%] w-0.5 bg-amber-500/40 z-10" />
                      {/* Standout indicator line at 85% */}
                      <div className="absolute top-0 bottom-0 left-[85%] w-0.5 bg-emerald-500/40 z-10" />

                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isStrong
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                            : 'bg-gradient-to-r from-amber-500 to-orange-400'
                        }`}
                        style={{ width: `${skill.masteryScore}%` }}
                      />
                    </div>
                  </Tooltip>
                </div>
              );
            })}
          </div>
        </div>

        {/* Domain Distribution & Weekly Activity (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Domain Distribution Bars */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-md">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Compass className="w-4 h-4 text-indigo-400" />
              Domain Mastery Breakdown
            </h3>

            <div className="space-y-3">
              {categoryMastery.map((cat) => (
                <div key={cat.category} className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>{cat.category}</span>
                    <span className="font-mono font-bold text-sky-400">{cat.avg}% Avg</span>
                  </div>
                  <Tooltip
                    position="top"
                    className="w-full block"
                    content={`${cat.category} curriculum average: ${cat.avg}% composite mastery.`}
                  >
                    <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800 cursor-help">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-sky-400 h-2 rounded-full"
                        style={{ width: `${cat.avg}%` }}
                      />
                    </div>
                  </Tooltip>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Consistency Volume Bar Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                Weekly Activity &amp; XP Volume
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">Total: 470 XP</span>
            </div>

            <div className="h-28 flex items-end justify-between gap-2 pt-4 px-2">
              {weeklyActivityData.map((item, idx) => {
                const isToday = idx === todayDayIndex;
                return (
                  <Tooltip
                    key={item.day}
                    position="top"
                    content={`${item.day}: +${item.xp} XP earned ${isToday ? '(Today)' : ''}`}
                  >
                    <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end cursor-help">
                      <span className="text-[9px] font-mono text-slate-400">{item.xp}</span>
                      <div className="w-full bg-slate-950 rounded-t-lg h-full flex items-end p-0.5 border border-slate-800">
                        <div
                          className={`w-full rounded-t-md transition-all duration-500 ${
                            isToday
                              ? 'bg-gradient-to-t from-sky-500 to-emerald-400 shadow-sm shadow-emerald-500/20'
                              : 'bg-slate-700/80 hover:bg-slate-600'
                          }`}
                          style={{ height: item.height }}
                        />
                      </div>
                      <span
                        className={`text-[10px] font-mono ${
                          isToday ? 'text-sky-300 font-bold' : 'text-slate-500'
                        }`}
                      >
                        {item.day}
                      </span>
                    </div>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Unlockable Achievement Badges */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-400" />
              Earned Badges &amp; Career Milestones
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live milestones earned across applications, quizzes, and streaks.
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab('badges')}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto"
          >
            <span>Full Trophy Room (🏆)</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {achievements.map((ach, idx) => (
            <Tooltip
              key={`${ach.id}-${idx}`}
              position="top"
              className="w-full h-full flex"
              content={
                <div className="text-left space-y-1">
                  <p className="font-bold text-slate-100 flex items-center gap-1.5">
                    <span>{ach.icon}</span>
                    <span>{ach.title}</span>
                  </p>
                  <p className="text-[11px] text-slate-300">{ach.desc}</p>
                  <p className="text-[10px] font-semibold text-amber-400">
                    Status: {ach.unlocked ? 'Unlocked Milestone' : 'Milestone In Progress'}
                  </p>
                </div>
              }
            >
              <div
                className={`w-full p-3.5 rounded-xl border text-center flex flex-col items-center justify-between transition-all cursor-help ${
                  ach.unlocked
                    ? 'bg-slate-950 border-amber-500/30 shadow-sm hover:border-amber-400/50'
                    : 'bg-slate-950/40 border-slate-800/80 opacity-50 grayscale hover:opacity-75'
                }`}
              >
                <span className="text-2xl mb-1">{ach.icon}</span>
                <span className="text-xs font-bold text-slate-200 leading-tight">{ach.title}</span>
                <span className="text-[10px] text-slate-400 leading-tight mt-1">{ach.desc}</span>
                <span
                  className={`mt-2 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                    ach.unlocked
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {ach.unlocked ? 'Unlocked ✓' : 'Locked'}
                </span>
              </div>
            </Tooltip>
          ))}
        </div>
      </div>

      {/* XP Activity Feed */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-md">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-400" />
            Recent Activity &amp; XP Logs
          </h3>
          <span className="text-xs font-mono text-slate-400">Lifetime XP: {stats.xp}</span>
        </div>

        <div className="space-y-2">
          {stats.xpHistory.map((item, idx) => (
            <div
              key={`${item.id}-${idx}`}
              className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800/90 text-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-[11px]">
                  +{item.amount}
                </div>
                <div>
                  <span className="font-semibold text-slate-200 block">{item.description}</span>
                  <span className="text-[10px] text-slate-500">{item.timestamp}</span>
                </div>
              </div>

              <span className="font-mono font-bold text-emerald-400">+{item.amount} XP</span>
            </div>
          ))}
        </div>
      </div>

      {/* Career Progress Report PDF Modal */}
      <CareerReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        profile={profile}
        stats={stats}
        onDownloaded={handleModalDownloaded}
      />
    </div>
  );
}
