import { useState } from 'react';
import {
  Compass,
  ExternalLink,
  Flame,
  Zap,
  CheckCircle2,
  Shield,
  Code2,
  Terminal,
  Cpu,
  Eye,
  Users,
  Sparkles,
  Plus,
} from 'lucide-react';
import { PracticePlatform } from '../types';
import { PRACTICE_PLATFORMS } from '../data/practicePlatforms';
import { ExternalStreakSyncHub } from './ExternalStreakSyncHub';

interface PracticePlatformsProps {
  onAddToDailyTasks: (title: string, xpReward: number) => void;
  onOpenPromptLab: (initialPromptId?: string) => void;
  onStreakSynced?: (result: {
    platform: 'leetcode' | 'hackerrank';
    dailyStreak: number;
    xpBonus: number;
    message: string;
  }) => void;
  onShowToast?: (toast: {
    type: 'success' | 'info' | 'streak' | 'xp';
    title: string;
    description: string;
  }) => void;
}

export function PracticePlatforms({
  onAddToDailyTasks,
  onOpenPromptLab,
  onStreakSynced,
  onShowToast,
}: PracticePlatformsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const categories = [
    'All',
    'DevOps & Systems',
    'Low-Level & Core CS',
    'Security & Reverse Engineering',
    'UI & Visual Precision',
    'Live Technical Pressure',
  ];

  const filteredPlatforms = PRACTICE_PLATFORMS.filter((p) => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.whyOutOfComfortZone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.skillsUnlocked.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleAddPlatformTask = (platform: PracticePlatform) => {
    onAddToDailyTasks(`Attempt starter challenge on ${platform.name}`, 35);
    setAddedIds((prev) => new Set(prev).add(platform.id));
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'DevOps & Systems':
        return <Terminal className="w-4 h-4 text-emerald-400" />;
      case 'Low-Level & Core CS':
        return <Cpu className="w-4 h-4 text-indigo-400" />;
      case 'Security & Reverse Engineering':
        return <Shield className="w-4 h-4 text-amber-400" />;
      case 'UI & Visual Precision':
        return <Eye className="w-4 h-4 text-sky-400" />;
      case 'Live Technical Pressure':
        return <Users className="w-4 h-4 text-rose-400" />;
      default:
        return <Compass className="w-4 h-4 text-sky-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-orange-950/40 via-slate-900 to-slate-900 border border-orange-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20">
                <Flame className="w-3.5 h-3.5 fill-orange-400 text-orange-400" />
                Anti-Tutorial Bubble
              </span>
              <span className="text-xs text-slate-400">
                Break outside standard LeetCode &amp; W3Schools loops
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight">
              Out-of-Comfort-Zone Practice Platforms
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Real engineering begins where clean tutorials end. These handpicked platforms force you into live broken Linux servers, raw binary protocols, peer pressure interviews, and strict type constraints.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              onClick={() => onOpenPromptLab('prompt-comfort-zone')}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-sky-400" />
              <span>Scout Prompt Template</span>
            </button>
          </div>
        </div>
      </div>

      {/* External Platforms Streak Integration (LeetCode & HackerRank) */}
      <ExternalStreakSyncHub
        onStreakSynced={onStreakSynced}
        onShowToast={onShowToast}
      />

      {/* Category Pills & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 no-scrollbar">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-transparent'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder="Search platforms or skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* Platforms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredPlatforms.map((platform) => {
          const isAdded = addedIds.has(platform.id);
          const diffBadge =
            platform.difficulty === 'Hardcore'
              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              : platform.difficulty === 'Steep'
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';

          return (
            <div
              key={platform.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-6 flex flex-col justify-between shadow-lg transition-all group"
            >
              <div className="space-y-4">
                {/* Card Top */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-slate-800/90 border border-slate-700">
                      {getCategoryIcon(platform.category)}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-100 group-hover:text-sky-300 transition-colors">
                        {platform.name}
                      </h3>
                      <p className="text-[11px] text-slate-400 font-medium">{platform.category}</p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide ${diffBadge}`}
                  >
                    {platform.difficulty}
                  </span>
                </div>

                <p className="text-xs text-slate-300 font-medium leading-relaxed">
                  {platform.tagline}
                </p>

                {/* Why Out Of Comfort Zone Callout */}
                <div className="bg-orange-950/20 border border-orange-500/30 rounded-xl p-3 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-orange-300 font-semibold text-[11px] uppercase tracking-wider">
                    <Flame className="w-3.5 h-3.5 fill-orange-400 text-orange-400" />
                    <span>Why This Shocks Your Comfort Zone</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    {platform.whyOutOfComfortZone}
                  </p>
                </div>

                {/* Example Scenario */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs space-y-1">
                  <span className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider block">
                    Real Challenge Example
                  </span>
                  <p className="text-slate-300 font-mono text-[11px] leading-relaxed">
                    {platform.exampleChallenge}
                  </p>
                </div>

                {/* Skills Unlocked */}
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                    Concrete Skills Gained
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {platform.skillsUnlocked.map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700/80 text-slate-300 text-[10px] font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="mt-5 pt-4 border-t border-slate-800/90 flex items-center justify-between gap-3">
                <span className="text-[10px] text-slate-400 font-mono">
                  ⏱ ~{platform.estimatedTimeToFirstWin}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAddPlatformTask(platform)}
                    disabled={isAdded}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isAdded
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Added to Today's Tasks</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5 text-sky-400" />
                        <span>Add to Daily Todo (+35 XP)</span>
                      </>
                    )}
                  </button>

                  <a
                    href={platform.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-sky-500/20 transition-all"
                  >
                    <span>Launch</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
