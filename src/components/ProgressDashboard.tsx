import { useState } from 'react';
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
} from 'lucide-react';
import { StudentProfile, UserStats } from '../types';
import { LEVEL_THRESHOLDS } from '../data/mockData';

interface ProgressDashboardProps {
  profile: StudentProfile;
  stats: UserStats;
  onClaimDailyStreak: () => void;
  onNavigateToTab: (tab: 'internships' | 'quizzes' | 'resume' | 'projects') => void;
}

export function ProgressDashboard({
  profile,
  stats,
  onClaimDailyStreak,
  onNavigateToTab,
}: ProgressDashboardProps) {
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
  const strongSkillsCount = profile.skills.filter((s) => s.level === 'Advanced' || s.level === 'Expert').length;
  const averageMastery = Math.round(
    profile.skills.reduce((acc, s) => acc + s.masteryScore, 0) / Math.max(profile.skills.length, 1)
  );
  const resumeScore = profile.currentResumeBullets.length >= 3 ? 90 : 60;
  const quizFactor = Math.min(100, stats.quizzesCompleted * 15);
  const readinessScore = Math.round((averageMastery * 0.4) + (resumeScore * 0.3) + (Math.min(100, strongSkillsCount * 20) * 0.2) + (quizFactor * 0.1));

  // 7-day streak calendar visualization
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const todayDayIndex = (new Date().getDay() + 6) % 7; // Monday = 0

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

  return (
    <div className="space-y-6">
      {/* Gamification & Streak Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Streak Card */}
        <div className="bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 rounded-2xl p-6 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Flame className="w-4 h-4 fill-amber-400 text-amber-400 animate-pulse" />
                Daily Streak System
              </span>
              <span className="text-xs text-slate-400">Record: {stats.longestStreak} Days</span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-extrabold text-slate-100 font-mono tracking-tight">
                {stats.dailyStreak}
              </span>
              <span className="text-base font-semibold text-amber-300">Days Active</span>
            </div>

            <p className="text-xs text-slate-400 mt-2">
              {stats.checkedInToday
                ? 'Streak safely locked in for today! Complete another quiz to maintain velocity.'
                : 'Claim your daily check-in now to maintain your learning momentum!'}
            </p>
          </div>

          {/* 7-Day Mini Calendar */}
          <div className="mt-5 pt-4 border-t border-slate-800">
            <div className="flex justify-between items-center mb-2 text-[10px] text-slate-400 font-medium">
              <span>This Week's Activity</span>
              <span>Mon - Sun</span>
            </div>
            <div className="grid grid-cols-7 gap-1.5 text-center">
              {daysOfWeek.map((day, idx) => {
                const isPast = idx < todayDayIndex;
                const isToday = idx === todayDayIndex;
                const active = (isPast && idx >= todayDayIndex - stats.dailyStreak + 1) || (isToday && stats.checkedInToday);

                return (
                  <div key={day} className="flex flex-col items-center gap-1">
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
                );
              })}
            </div>

            {!stats.checkedInToday && (
              <button
                onClick={onClaimDailyStreak}
                className="w-full mt-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
              >
                <Flame className="w-4 h-4" />
                <span>Claim Daily +20 XP</span>
              </button>
            )}
          </div>
        </div>

        {/* Level & XP Progression Card */}
        <div className="bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-sky-400" />
                Level Status &amp; Tier
              </span>
              <span className="text-xs font-mono font-bold text-sky-300 px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/20">
                Tier {stats.level}
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-slate-100">{currentLevelInfo.title}</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Next Rank: <strong className="text-slate-200">{nextLevel ? nextLevel.title : 'Mastery Peak'}</strong>
            </p>

            <div className="mt-5 space-y-2">
              <div className="flex justify-between text-xs text-slate-300 font-mono">
                <span>{stats.xp} Total XP</span>
                <span>{nextLevelThreshold} XP Target</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                <div
                  className="bg-gradient-to-r from-sky-400 to-indigo-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-[11px] text-slate-400 block text-right">
                {nextLevelThreshold - stats.xp} XP needed to level up
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Quizzes Done: <strong className="text-slate-200">{stats.quizzesCompleted}</strong></span>
            <span>Projects: <strong className="text-slate-200">{stats.projectsStarted}</strong></span>
            <span>Resumes: <strong className="text-slate-200">{stats.resumesOptimized}</strong></span>
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
              <span className="text-xs text-emerald-300 font-semibold">Competitive</span>
            </div>

            <div className="flex items-center gap-4 my-2">
              <div className="w-20 h-20 rounded-2xl bg-slate-950 border border-emerald-500/40 flex flex-col items-center justify-center text-center shadow-inner">
                <span className="text-3xl font-black text-emerald-400 font-mono leading-none">{readinessScore}</span>
                <span className="text-[9px] uppercase font-bold text-slate-400 mt-1">/ 100 PTS</span>
              </div>

              <div className="space-y-1 text-xs text-slate-300">
                <p className="font-semibold text-slate-100">Top 15% of Applicant Profiles</p>
                <p className="text-slate-400 leading-tight">
                  Based on skills balance, diagnostic test scores, and quantifiable resume strength.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-1.5 pt-3 border-t border-slate-800 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Skill Inventory Depth:</span>
              <span className="text-slate-200 font-semibold">{averageMastery}%</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Resume XYZ Readiness:</span>
              <span className="text-slate-200 font-semibold">{resumeScore}%</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Diagnostic Coverage:</span>
              <span className="text-slate-200 font-semibold">{Math.min(100, stats.quizzesCompleted * 20)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Weak-to-Strong Skill Progression Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-sky-400" />
              Skill Mastery &amp; Growth Tracker
            </h3>
            <p className="text-xs text-slate-400">
              Track how your skills transform from beginner blindspots into verified interview strengths.
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab('quizzes')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 self-start sm:self-center transition-colors cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Practice Weak Topics</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {profile.skills.map((skill, idx) => {
            const isStrong = skill.level === 'Advanced' || skill.level === 'Expert';
            return (
              <div
                key={`${skill.id || skill.name}-${idx}`}
                className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-200 text-xs">{skill.name}</span>
                    <span className="text-[10px] text-slate-500 ml-1.5">({skill.category})</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                      isStrong
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}
                  >
                    {skill.level}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Mastery Level</span>
                    <span className="font-mono font-semibold text-slate-200">{skill.masteryScore}%</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        isStrong ? 'bg-emerald-400' : 'bg-amber-400'
                      }`}
                      style={{ width: `${skill.masteryScore}%` }}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1">
                  <span>Quizzes Cleared: {skill.quizzesTaken || 0}</span>
                  {!isStrong && (
                    <button
                      onClick={() => onNavigateToTab('quizzes')}
                      className="text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
                    >
                      Boost Mastery →
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Unlockable Achievement Badges */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-md">
        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <Shield className="w-4 h-4 text-amber-400" />
          Earned Badges &amp; Milestones
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {achievements.map((ach, idx) => (
            <div
              key={`${ach.id}-${idx}`}
              className={`p-3.5 rounded-xl border text-center flex flex-col items-center justify-between transition-all ${
                ach.unlocked
                  ? 'bg-slate-950 border-amber-500/30 shadow-sm'
                  : 'bg-slate-950/40 border-slate-800/80 opacity-50 grayscale'
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
    </div>
  );
}
