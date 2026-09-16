import React, { useState, useMemo } from 'react';
import {
  Award,
  Trophy,
  Shield,
  Sparkles,
  CheckCircle2,
  Lock,
  Search,
  Filter,
  Flame,
  ArrowRight,
  TrendingUp,
  Star,
  Users,
  ExternalLink,
  Share2,
  Copy,
  Zap,
  Briefcase,
  Crown,
  Medal,
} from 'lucide-react';
import { StudentProfile, UserStats, Internship, AchievementBadge, BadgeRarity, BadgeCategory } from '../types';
import { evaluateAchievementBadges, computeLeaderboard, LeaderboardEntry } from '../utils/achievementBadges';
import { Tooltip } from './Tooltip';

interface AchievementBadgesProps {
  profile: StudentProfile;
  stats: UserStats;
  internships: Internship[];
  onNavigateToTab: (tab: 'internships' | 'quizzes' | 'resume' | 'projects' | 'platforms' | 'dashboard' | 'skilltutor') => void;
  onShowToast?: (toast: { type: 'xp' | 'streak' | 'info'; title: string; description: string }) => void;
}

export function AchievementBadges({
  profile,
  stats,
  internships,
  onNavigateToTab,
  onShowToast,
}: AchievementBadgesProps) {
  const [selectedCategory, setSelectedCategory] = useState<BadgeCategory>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [rarityFilter, setRarityFilter] = useState<'all' | BadgeRarity>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBadge, setSelectedBadge] = useState<AchievementBadge | null>(null);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);

  // Compute live badges and leaderboard
  const { badges, userRank, totalLeaderboardCount, top3XpThreshold } = useMemo(() => {
    return evaluateAchievementBadges(profile, stats, internships);
  }, [profile, stats, internships]);

  const leaderboard = useMemo(() => {
    return computeLeaderboard(profile, stats);
  }, [profile, stats]);

  // Overall milestone statistics
  const unlockedCount = badges.filter((b) => b.unlocked).length;
  const totalCount = badges.length;
  const percentComplete = Math.round((unlockedCount / totalCount) * 100);
  const totalXpEarnedFromBadges = badges
    .filter((b) => b.unlocked)
    .reduce((acc, b) => acc + b.xpReward, 0);

  // Collector title rank
  const collectorTier = useMemo(() => {
    if (unlockedCount >= 12) return { title: 'Grandmaster Laureate', color: 'text-amber-300', bg: 'bg-amber-500/20 border-amber-500/40' };
    if (unlockedCount >= 9) return { title: 'Diamond Champion', color: 'text-cyan-300', bg: 'bg-cyan-500/20 border-cyan-500/40' };
    if (unlockedCount >= 6) return { title: 'Gold Achiever', color: 'text-yellow-300', bg: 'bg-yellow-500/20 border-yellow-500/40' };
    if (unlockedCount >= 3) return { title: 'Silver Contender', color: 'text-slate-200', bg: 'bg-slate-700 border-slate-600' };
    return { title: 'Apprentice Collector', color: 'text-sky-300', bg: 'bg-sky-500/20 border-sky-500/30' };
  }, [unlockedCount]);

  // Filtered badges
  const filteredBadges = useMemo(() => {
    return badges.filter((b) => {
      // Category filter
      if (selectedCategory !== 'all' && b.category !== selectedCategory) return false;
      // Status filter
      if (statusFilter === 'unlocked' && !b.unlocked) return false;
      if (statusFilter === 'locked' && b.unlocked) return false;
      // Rarity filter
      if (rarityFilter !== 'all' && b.rarity !== rarityFilter) return false;
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          b.title.toLowerCase().includes(q) ||
          b.description.toLowerCase().includes(q) ||
          b.tagline.toLowerCase().includes(q) ||
          b.rarity.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [badges, selectedCategory, statusFilter, rarityFilter, searchQuery]);

  // Handle badge sharing/copying
  const handleShareBadge = (badge: AchievementBadge) => {
    const text = `🏆 I unlocked the '${badge.title}' Digital Badge (${badge.rarity} Tier) on SkillMatcher Career Launchpad! "${badge.description}"`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      if (onShowToast) {
        onShowToast({
          type: 'info',
          title: 'Achievement Copied to Clipboard! 📋',
          description: `Share your ${badge.title} badge milestone with recruiters and peers.`,
        });
      }
    }
  };

  // Helper for badge visual aesthetics based on rarity
  const getRarityConfig = (rarity: BadgeRarity, isUnlocked: boolean) => {
    switch (rarity) {
      case 'Diamond':
        return {
          pill: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
          glow: isUnlocked ? 'shadow-cyan-500/20 border-cyan-500/50 bg-gradient-to-b from-cyan-950/40 to-slate-900' : 'border-slate-800 bg-slate-900/60',
          ring: isUnlocked ? 'border-cyan-400/60 shadow-lg shadow-cyan-500/30' : 'border-slate-800',
          iconBg: isUnlocked ? 'bg-gradient-to-tr from-cyan-600 to-sky-400 text-slate-950' : 'bg-slate-800 text-slate-500',
        };
      case 'Platinum':
        return {
          pill: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
          glow: isUnlocked ? 'shadow-indigo-500/20 border-indigo-500/50 bg-gradient-to-b from-indigo-950/40 to-slate-900' : 'border-slate-800 bg-slate-900/60',
          ring: isUnlocked ? 'border-indigo-400/60 shadow-lg shadow-indigo-500/30' : 'border-slate-800',
          iconBg: isUnlocked ? 'bg-gradient-to-tr from-indigo-500 to-violet-400 text-slate-950' : 'bg-slate-800 text-slate-500',
        };
      case 'Gold':
        return {
          pill: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
          glow: isUnlocked ? 'shadow-amber-500/20 border-amber-500/50 bg-gradient-to-b from-amber-950/40 to-slate-900' : 'border-slate-800 bg-slate-900/60',
          ring: isUnlocked ? 'border-amber-400/60 shadow-lg shadow-amber-500/30' : 'border-slate-800',
          iconBg: isUnlocked ? 'bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950' : 'bg-slate-800 text-slate-500',
        };
      case 'Silver':
        return {
          pill: 'bg-slate-400/10 text-slate-300 border-slate-500/30',
          glow: isUnlocked ? 'shadow-slate-400/20 border-slate-500/50 bg-gradient-to-b from-slate-800/60 to-slate-900' : 'border-slate-800 bg-slate-900/60',
          ring: isUnlocked ? 'border-slate-400/60 shadow-lg shadow-slate-400/20' : 'border-slate-800',
          iconBg: isUnlocked ? 'bg-gradient-to-tr from-slate-400 to-slate-200 text-slate-950' : 'bg-slate-800 text-slate-500',
        };
      case 'Bronze':
      default:
        return {
          pill: 'bg-orange-500/10 text-orange-300 border-orange-500/30',
          glow: isUnlocked ? 'shadow-orange-500/20 border-orange-500/40 bg-gradient-to-b from-orange-950/30 to-slate-900' : 'border-slate-800 bg-slate-900/60',
          ring: isUnlocked ? 'border-orange-500/50 shadow-lg shadow-orange-500/20' : 'border-slate-800',
          iconBg: isUnlocked ? 'bg-gradient-to-tr from-orange-600 to-amber-500 text-slate-950' : 'bg-slate-800 text-slate-500',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Trophy Showcase Header */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6 sm:p-8 shadow-xl">
        {/* Background ambient lighting */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-sky-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                <Trophy className="w-3.5 h-3.5" />
                Digital Credential Showcase
              </span>
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${collectorTier.bg} ${collectorTier.color}`}>
                <Crown className="w-3 h-3" />
                {collectorTier.title}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
              Earned Badges &amp; Career Milestones
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              Verify your early career achievements. Digital badges unlock automatically as you apply to roles, dominate technical quizzes, push your skills past 90%, and build daily streaks.
            </p>

            {/* Overall Progress Bar */}
            <div className="pt-2 space-y-1.5 max-w-md">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-semibold flex items-center gap-1">
                  <span>Badge Unlock Rate:</span>
                  <span className="text-amber-400 font-mono font-bold">{unlockedCount} of {totalCount} Badges</span>
                </span>
                <span className="text-slate-400 font-mono font-semibold">{percentComplete}% Complete</span>
              </div>
              <Tooltip
                position="top"
                className="w-full block"
                content={
                  <div className="space-y-1 text-left">
                    <p className="font-bold text-amber-300">Digital Credential Unlock Rate</p>
                    <p className="text-[11px] text-slate-300">
                      {unlockedCount} of {totalCount} badges earned ({percentComplete}%). Earn {totalCount - unlockedCount} more badges by taking technical quizzes and applying to internships.
                    </p>
                  </div>
                }
              >
                <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-700 cursor-help">
                  <div
                    className="bg-gradient-to-r from-amber-500 via-orange-400 to-sky-400 h-full rounded-full transition-all duration-700 shadow-sm"
                    style={{ width: `${percentComplete}%` }}
                  />
                </div>
              </Tooltip>
            </div>
          </div>

          {/* Key Metric Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 self-stretch lg:self-auto">
            {/* Unlocked Metric */}
            <Tooltip
              position="bottom"
              content="Total count of verified career milestone credentials unlocked on your candidate record."
            >
              <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-4 flex flex-col justify-between cursor-help h-full">
                <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  Earned Badges
                </span>
                <div className="mt-2">
                  <span className="text-2xl font-black text-slate-100">{unlockedCount}</span>
                  <span className="text-xs text-slate-500 font-mono ml-1">/ {totalCount}</span>
                </div>
                <span className="text-[10px] text-emerald-400 mt-1 font-semibold">
                  {percentComplete}% completed
                </span>
              </div>
            </Tooltip>

            {/* Badge XP Metric */}
            <Tooltip
              position="bottom"
              content="Cumulative bonus experience points (XP) credited directly to your rank from badge achievements."
            >
              <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-4 flex flex-col justify-between cursor-help h-full">
                <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                  <Zap className="w-3.5 h-3.5 text-sky-400" />
                  Milestone XP
                </span>
                <div className="mt-2">
                  <span className="text-2xl font-black text-sky-300">+{totalXpEarnedFromBadges}</span>
                  <span className="text-xs text-slate-500 font-mono ml-1">XP</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1">
                  Directly added to rank
                </span>
              </div>
            </Tooltip>

            {/* Campus Leaderboard Rank */}
            <Tooltip
              position="bottom"
              content="Your real-time standing among campus peers on the institutional placement leaderboard. Click to view full roster."
            >
              <div
                onClick={() => setShowLeaderboardModal(true)}
                className="col-span-2 sm:col-span-1 bg-slate-950/80 border border-slate-800/90 hover:border-amber-500/40 rounded-xl p-4 flex flex-col justify-between cursor-pointer transition-all group h-full"
              >
                <span className="text-xs text-slate-400 flex items-center justify-between font-medium">
                  <span className="flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    Campus Rank
                  </span>
                  <ArrowRight className="w-3 h-3 text-slate-600 group-hover:text-amber-400 transition-colors" />
                </span>
                <div className="mt-2">
                  <span className="text-2xl font-black text-amber-300">#{userRank}</span>
                  <span className="text-xs text-slate-500 font-mono ml-1">of {totalLeaderboardCount}</span>
                </div>
                <span className="text-[10px] text-amber-400/90 mt-1 font-semibold flex items-center gap-1">
                  {userRank <= 3 ? '🏆 Podium Position!' : `${Math.max(0, top3XpThreshold - stats.xp)} XP to Top 3`}
                </span>
              </div>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Featured Milestone Callout: Top of the Leaderboard Spotlight */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center text-slate-950 shrink-0 shadow-md shadow-amber-500/20 text-2xl">
            🏆
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100 text-sm sm:text-base">
                Campus Leaderboard Standing: Rank #{userRank}
              </span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Podium Challenge
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {userRank <= 3
                ? `Incredible! You hold Rank #${userRank} on the leaderboard. Your 'Top of the Leaderboard' badge is officially earned!`
                : `You are currently Rank #${userRank} (${stats.xp} XP). Climb ${userRank - 3} position${userRank - 3 === 1 ? '' : 's'} to unlock the prestigious Diamond 'Top of the Leaderboard' badge.`}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowLeaderboardModal(true)}
          className="flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Users className="w-3.5 h-3.5 text-amber-400" />
          <span>View Campus Leaderboard</span>
        </button>
      </div>

      {/* Filtering and Controls Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Segmented Buttons */}
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start">
            {[
              { id: 'all', label: `All (${totalCount})` },
              { id: 'unlocked', label: `Earned (${unlockedCount})` },
              { id: 'locked', label: `In Progress (${totalCount - unlockedCount})` },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === st.id
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search badge title or skill..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Category & Rarity Filters */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
          {/* Categories */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-500 mr-1 font-medium">Category:</span>
            {[
              { id: 'all', label: 'All Domains' },
              { id: 'career', label: '🎯 Career & Applications' },
              { id: 'skills', label: '👑 Skills & Mastery' },
              { id: 'streak', label: '🔥 Streaks & Habits' },
              { id: 'learning', label: '🚀 Learning & Leadership' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as any)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-slate-800 text-sky-300 border border-sky-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Rarity */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-slate-500 mr-1 font-medium">Tier:</span>
            {(['all', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'] as const).map((rar) => (
              <button
                key={rar}
                onClick={() => setRarityFilter(rar)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                  rarityFilter === rar
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {rar}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBadges.map((badge) => {
          const cfg = getRarityConfig(badge.rarity, badge.unlocked);
          const progressPercent = Math.min(
            100,
            Math.max(0, Math.round((badge.currentProgress / badge.maxProgress) * 100))
          );

          return (
            <div
              key={badge.id}
              onClick={() => setSelectedBadge(badge)}
              className={`group relative rounded-2xl border p-5 transition-all duration-200 cursor-pointer flex flex-col justify-between ${cfg.glow} hover:-translate-y-0.5 hover:shadow-lg`}
            >
              {/* Top Row: Rarity badge & XP bounty */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Tooltip
                    position="top"
                    content={`${badge.rarity} Tier Milestone: ${
                      badge.rarity === 'Diamond'
                        ? 'Top-echelon achievement for campus leaders.'
                        : badge.rarity === 'Platinum'
                        ? 'Advanced accomplishment demonstrating sustained dedication.'
                        : badge.rarity === 'Gold'
                        ? 'Mastery milestone signifying deep technical competence.'
                        : badge.rarity === 'Silver'
                        ? 'Intermediate milestone showing solid career momentum.'
                        : 'Foundational entry milestone.'
                    }`}
                  >
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border cursor-help ${cfg.pill}`}>
                      {badge.rarity}
                    </span>
                  </Tooltip>

                  <div className="flex items-center space-x-1.5">
                    <Tooltip
                      position="top"
                      content={`Awards +${badge.xpReward} XP directly to your candidate rank upon completion.`}
                    >
                      <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20 cursor-help">
                        +{badge.xpReward} XP
                      </span>
                    </Tooltip>
                    {badge.unlocked ? (
                      <Tooltip position="top" content={`Unlocked on ${badge.unlockedDate || 'your profile'}`}>
                        <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 cursor-help">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </span>
                      </Tooltip>
                    ) : (
                      <Tooltip position="top" content="Locked milestone. Complete criteria to unlock badge and claim XP.">
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center cursor-help">
                          <Lock className="w-3 h-3" />
                        </span>
                      </Tooltip>
                    )}
                  </div>
                </div>

                {/* Badge Emblem & Title */}
                <div className="flex items-start space-x-3.5 mb-3">
                  {/* Digital Medallion */}
                  <Tooltip
                    position="top"
                    content={
                      <div className="space-y-1 text-left">
                        <p className="font-bold text-amber-300">{badge.title} ({badge.rarity})</p>
                        <p className="text-[11px] text-slate-300">
                          {badge.unlocked ? `✓ Unlocked: ${badge.tagline}` : `🔒 In Progress: ${badge.progressLabel}`}
                        </p>
                      </div>
                    }
                  >
                    <div className={`relative w-14 h-14 rounded-2xl border-2 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 cursor-help ${cfg.ring} ${cfg.iconBg}`}>
                      <span className="text-2xl select-none">{badge.icon}</span>
                      {badge.unlocked && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow">
                          <CheckCircle2 className="w-3 h-3 stroke-[3]" />
                        </span>
                      )}
                    </div>
                  </Tooltip>

                  <div className="space-y-0.5">
                    <h3 className="text-base font-bold text-slate-100 group-hover:text-amber-300 transition-colors">
                      {badge.title}
                    </h3>
                    <p className="text-xs text-sky-400 font-medium">
                      {badge.tagline}
                    </p>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed pt-1">
                      {badge.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom: Progress bar & Status */}
              <div className="pt-3 border-t border-slate-800/80 space-y-2 mt-2">
                <Tooltip
                  position="top"
                  className="w-full block"
                  content={`Milestone Progress: ${badge.progressLabel} (${progressPercent}% complete)`}
                >
                  <div className="w-full space-y-1.5 cursor-help">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-medium">
                        {badge.unlocked ? (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            {badge.unlockedDate || 'Unlocked ✓'}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono">{badge.progressLabel}</span>
                        )}
                      </span>
                      <span className="text-slate-500 font-mono text-[10px]">
                        {progressPercent}%
                      </span>
                    </div>

                    {/* Progress track */}
                    <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          badge.unlocked
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                            : 'bg-gradient-to-r from-amber-500 to-sky-400'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </Tooltip>

                {/* Hint for locked badge */}
                {!badge.unlocked && (
                  <p className="text-[10px] text-slate-500 truncate italic">
                    Tip: {badge.hint}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredBadges.length === 0 && (
        <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <Award className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-300">No badges match your current filters</p>
          <p className="text-xs text-slate-500 mt-1">Try resetting the search or category filters to view all milestones.</p>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setStatusFilter('all');
              setRarityFilter('all');
              setSearchQuery('');
            }}
            className="mt-4 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-medium cursor-pointer"
          >
            Clear All Filters
          </button>
        </div>
      )}

      {/* Badge Inspect & Certificate Modal */}
      {selectedBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-5">
            {/* Close button */}
            <button
              onClick={() => setSelectedBadge(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              ✕
            </button>

            {/* Modal Header */}
            <div className="flex flex-col items-center text-center space-y-3 pt-2">
              {/* Big Medallion Plaque */}
              <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-tr from-slate-900 to-slate-800 border-2 border-amber-500/50 shadow-2xl flex items-center justify-center text-5xl">
                <span className="select-none">{selectedBadge.icon}</span>
                {selectedBadge.unlocked && (
                  <div className="absolute -bottom-2 px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow">
                    Verified
                  </div>
                )}
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded border bg-amber-500/10 text-amber-300 border-amber-500/30">
                  {selectedBadge.rarity} Tier • {selectedBadge.category.toUpperCase()}
                </span>
                <h2 className="text-xl font-black text-slate-100 mt-2">
                  {selectedBadge.title}
                </h2>
                <p className="text-xs font-semibold text-sky-400">
                  {selectedBadge.tagline}
                </p>
              </div>
            </div>

            {/* Description & Criteria */}
            <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-2 text-xs">
              <div>
                <span className="text-slate-400 font-medium">Milestone Requirement:</span>
                <p className="text-slate-200 mt-0.5 leading-relaxed">{selectedBadge.description}</p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-slate-400">XP Bounty:</span>
                <span className="font-bold text-amber-300 font-mono text-sm">+{selectedBadge.xpReward} XP</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Status:</span>
                <span className={`font-bold ${selectedBadge.unlocked ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {selectedBadge.unlocked ? 'Earned & Credentialed ✓' : 'In Progress'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Progress Metric:</span>
                <span className="font-mono text-slate-300">{selectedBadge.progressLabel}</span>
              </div>
            </div>

            {/* Action Tip */}
            <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-3 text-xs text-sky-200 space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-sky-300">
                <Sparkles className="w-3.5 h-3.5" />
                How to Accelerate:
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {selectedBadge.hint}
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={() => handleShareBadge(selectedBadge)}
                className="flex-1 flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Share Credential</span>
              </button>

              {/* Navigation button based on badge category */}
              <button
                onClick={() => {
                  setSelectedBadge(null);
                  if (selectedBadge.id === 'first-application' || selectedBadge.id === 'opportunity-campaigner') {
                    onNavigateToTab('internships');
                  } else if (selectedBadge.id === 'socratic-scholar' || selectedBadge.id === 'anti-paste-purist') {
                    onNavigateToTab('skilltutor');
                  } else if (selectedBadge.id === 'skill-master' || selectedBadge.id === 'diagnostic-ace') {
                    onNavigateToTab('quizzes');
                  } else if (selectedBadge.id === 'resume-architect') {
                    onNavigateToTab('resume');
                  } else if (selectedBadge.id === 'architectural-builder') {
                    onNavigateToTab('projects');
                  } else if (selectedBadge.id === 'comfort-zone-crusher') {
                    onNavigateToTab('platforms');
                  } else if (selectedBadge.id === 'top-leaderboard') {
                    setShowLeaderboardModal(true);
                  } else {
                    onNavigateToTab('dashboard');
                  }
                }}
                className="flex-1 flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-slate-950 text-xs font-bold transition-all cursor-pointer shadow-md shadow-amber-500/20"
              >
                <span>Jump to Challenge</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Campus Leaderboard Full Dossier Modal */}
      {showLeaderboardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowLeaderboardModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-100">
                  Campus Preparation Leaderboard
                </h2>
                <p className="text-xs text-slate-400">
                  Real-time ranking of student candidates across XP, level ranks, and active streaks.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 divide-y divide-slate-800/80 overflow-hidden">
              {leaderboard.map((entry) => {
                const isPodium = entry.rank <= 3;
                return (
                  <div
                    key={entry.name}
                    className={`p-3.5 flex items-center justify-between gap-3 transition-colors ${
                      entry.isCurrentUser
                        ? 'bg-amber-500/10 border-l-4 border-l-amber-400'
                        : 'hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-7 text-center font-black font-mono">
                        {entry.rank === 1 && <span className="text-xl">🥇</span>}
                        {entry.rank === 2 && <span className="text-xl">🥈</span>}
                        {entry.rank === 3 && <span className="text-xl">🥉</span>}
                        {entry.rank > 3 && <span className="text-xs text-slate-400">#{entry.rank}</span>}
                      </div>

                      <div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs font-bold ${entry.isCurrentUser ? 'text-amber-300' : 'text-slate-200'}`}>
                            {entry.name} {entry.isCurrentUser && '(You)'}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                            Lvl {entry.level}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {entry.role} • {entry.university}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 text-right">
                      <div className="text-xs font-mono">
                        <span className="font-bold text-sky-300">{entry.xp} XP</span>
                        <div className="flex items-center justify-end text-[10px] text-amber-400 gap-1 mt-0.5">
                          <Flame className="w-3 h-3 fill-amber-400" />
                          <span>{entry.streak}d streak</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowLeaderboardModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 cursor-pointer"
              >
                Close Leaderboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
