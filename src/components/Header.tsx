import { Flame, Sparkles, User, Award, CheckCircle2 } from 'lucide-react';
import { StudentProfile, UserStats } from '../types';
import { LEVEL_THRESHOLDS } from '../data/mockData';

interface HeaderProps {
  profile: StudentProfile;
  stats: UserStats;
  activeTab: 'internships' | 'quizzes' | 'resume' | 'projects' | 'dashboard' | 'platforms';
  onSelectTab: (tab: 'internships' | 'quizzes' | 'resume' | 'projects' | 'dashboard' | 'platforms') => void;
  onOpenProfile: () => void;
  onClaimDailyStreak: () => void;
  onOpenPromptLab?: (promptId?: string) => void;
}

export function Header({
  profile,
  stats,
  activeTab,
  onSelectTab,
  onOpenProfile,
  onClaimDailyStreak,
  onOpenPromptLab,
}: HeaderProps) {
  const currentLevelInfo =
    LEVEL_THRESHOLDS.find((l) => l.level === stats.level) || LEVEL_THRESHOLDS[0];
  const nextLevelThreshold = currentLevelInfo.maxXp;
  const prevLevelThreshold = currentLevelInfo.minXp;
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round(((stats.xp - prevLevelThreshold) / (nextLevelThreshold - prevLevelThreshold)) * 100))
  );

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-sky-500 to-emerald-400 p-0.5 shadow-md shadow-indigo-500/20">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-sky-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-sky-300 bg-clip-text text-transparent">
                  SkillMatcher
                </span>
                <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  Career Launchpad
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Tailored Internships • Diagnostics • Resume AI • Projects
              </p>
            </div>
          </div>

          {/* Gamification Stats: Streak & XP */}
          <div className="flex items-center space-x-3">
            {/* Daily Streak */}
            <div className="flex items-center">
              {stats.checkedInToday ? (
                <div
                  id="streak-active-badge"
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold shadow-inner"
                  title="Daily streak active! Check in tomorrow to keep the flame alive."
                >
                  <Flame className="w-4 h-4 text-amber-400 animate-pulse fill-amber-400" />
                  <span>{stats.dailyStreak} Day Streak</span>
                </div>
              ) : (
                <button
                  id="claim-streak-btn"
                  onClick={onClaimDailyStreak}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-xs font-bold shadow-md shadow-orange-500/20 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                  title="Click to claim your daily check-in streak bonus!"
                >
                  <Flame className="w-4 h-4 text-slate-950 fill-slate-950" />
                  <span>Claim Daily +20 XP</span>
                </button>
              )}
            </div>

            {/* Level & XP bar */}
            <div
              id="xp-level-badge"
              className="hidden md:flex flex-col px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700/80 text-xs w-44"
            >
              <div className="flex justify-between items-center text-[11px] font-medium text-slate-300">
                <span className="flex items-center space-x-1 text-sky-400 font-semibold">
                  <Award className="w-3 h-3 text-sky-400" />
                  <span>Lvl {stats.level}</span>
                </span>
                <span className="text-slate-400 font-mono">
                  {stats.xp}/{nextLevelThreshold} XP
                </span>
              </div>
              <div className="w-full bg-slate-700/80 rounded-full h-1.5 mt-1 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-sky-400 to-indigo-400 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400 truncate mt-0.5 font-medium">
                {currentLevelInfo.title}
              </span>
            </div>

            {/* User Profile Pill */}
            <button
              id="header-profile-btn"
              onClick={onOpenProfile}
              className="flex items-center space-x-2 pl-2 pr-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/90 border border-slate-700 text-slate-200 transition-colors text-xs font-medium cursor-pointer"
            >
              <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-bold text-xs">
                {profile.name.charAt(0)}
              </div>
              <div className="text-left hidden sm:block">
                <p className="font-semibold text-xs leading-none text-slate-100">{profile.name}</p>
                <p className="text-[10px] text-slate-400 truncate max-w-[110px] leading-tight">
                  {profile.skills.length} skills added
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center justify-between overflow-x-auto py-2 border-t border-slate-800/80 no-scrollbar">
          <div className="flex space-x-1 sm:space-x-2">
            {[
              { id: 'internships', label: 'Ranked Internships', icon: '🎯' },
              { id: 'quizzes', label: 'Weak & Strong Quizzes', icon: '⚡' },
              { id: 'resume', label: 'Resume & LinkedIn AI', icon: '📝' },
              { id: 'projects', label: 'Strong Skill Projects', icon: '💡' },
              { id: 'platforms', label: 'Out-of-Comfort Practice', icon: '🚀' },
              { id: 'dashboard', label: 'Progress & Streaks', icon: '📈' },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`nav-tab-${tab.id}`}
                  onClick={() => onSelectTab(tab.id as any)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {onOpenPromptLab && (
            <button
              onClick={() => onOpenPromptLab()}
              className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ml-2"
              title="Open AI Prompt Lab for custom ChatGPT / Claude / Gemini career prompts"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Career Prompt Lab</span>
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
