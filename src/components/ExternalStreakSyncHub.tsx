import { useState } from 'react';
import {
  Flame,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Code2,
  Award,
  Zap,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';
import { ExternalCodingProfile } from '../types';

interface ExternalStreakSyncHubProps {
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

export function ExternalStreakSyncHub({
  onStreakSynced,
  onShowToast,
}: ExternalStreakSyncHubProps) {
  // Profiles state
  const [profiles, setProfiles] = useState<Record<string, ExternalCodingProfile>>(() => {
    try {
      const saved = localStorage.getItem('skillmatcher_external_profiles');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {
      leetcode: {
        platform: 'leetcode',
        username: 'student_coder',
        connected: true,
        dailyStreak: 12,
        totalSolved: 148,
        breakdown: { easy: 72, medium: 64, hard: 12 },
        rankingOrRating: '#42,190',
        lastSyncedAt: 'Today at 09:15 AM',
        syncedToday: true,
        badge: 'LeetCode Daily Streak Solver',
      },
      hackerrank: {
        platform: 'hackerrank',
        username: 'candidate_dev',
        connected: true,
        dailyStreak: 8,
        totalSolved: 89,
        rankingOrRating: '5 Stars (Gold)',
        lastSyncedAt: 'Today at 10:30 AM',
        syncedToday: true,
        badge: 'HackerRank Problem Solving Gold',
      },
    };
  });

  const [syncingPlatform, setSyncingPlatform] = useState<string | null>(null);
  const [editingPlatform, setEditingPlatform] = useState<string | null>(null);
  const [editUsername, setEditUsername] = useState<string>('');

  const saveProfiles = (updated: Record<string, ExternalCodingProfile>) => {
    setProfiles(updated);
    localStorage.setItem('skillmatcher_external_profiles', JSON.stringify(updated));
  };

  const handleSync = async (platform: 'leetcode' | 'hackerrank') => {
    setSyncingPlatform(platform);
    const profile = profiles[platform];

    try {
      const res = await fetch('/api/platforms/sync-streak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          username: profile?.username || 'student_dev',
        }),
      });

      const data = await res.json();
      if (data.success) {
        const updatedProfile: ExternalCodingProfile = {
          platform,
          username: data.username,
          connected: true,
          dailyStreak: data.dailyStreak,
          totalSolved: data.totalSolved,
          breakdown: data.breakdown,
          rankingOrRating: data.ranking || data.stars,
          lastSyncedAt: `Today at ${data.lastSyncedAt}`,
          syncedToday: true,
          badge: data.badge,
        };

        const nextProfiles = { ...profiles, [platform]: updatedProfile };
        saveProfiles(nextProfiles);

        if (onStreakSynced) {
          onStreakSynced({
            platform,
            dailyStreak: data.dailyStreak,
            xpBonus: data.xpBonusAwarded || 40,
            message: `Synced ${data.dailyStreak}-day ${platform === 'leetcode' ? 'LeetCode' : 'HackerRank'} active streak!`,
          });
        }

        if (onShowToast) {
          onShowToast({
            type: 'streak',
            title: `${platform === 'leetcode' ? 'LeetCode' : 'HackerRank'} Streak Synced! 🔥`,
            description: `Active ${data.dailyStreak}-day streak verified. Daily check-in secured +40 XP bonus!`,
          });
        }
      }
    } catch (err) {
      console.error('Streak sync error:', err);
    } finally {
      setSyncingPlatform(null);
    }
  };

  const handleStartEdit = (platform: string) => {
    setEditingPlatform(platform);
    setEditUsername(profiles[platform]?.username || '');
  };

  const handleSaveUsername = (platform: 'leetcode' | 'hackerrank') => {
    if (!editUsername.trim()) return;
    const current = profiles[platform] || {
      platform,
      username: '',
      connected: true,
      dailyStreak: 5,
      totalSolved: 30,
      lastSyncedAt: 'Never',
      syncedToday: false,
    };

    const nextProfiles = {
      ...profiles,
      [platform]: {
        ...current,
        username: editUsername.trim(),
        connected: true,
      },
    };
    saveProfiles(nextProfiles);
    setEditingPlatform(null);
    handleSync(platform);
  };

  return (
    <div
      id="external-streak-sync-hub"
      className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 p-0.5 shadow-md shadow-amber-500/20">
            <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
              <Flame className="w-5 h-5 text-amber-400 fill-amber-400 animate-pulse" />
            </div>
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
              <span>External Coding Streak Integration</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-mono">
                LeetCode • HackerRank
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Link your competitive programming handles. Solving problems on external sites automatically fuels your SkillMatcher daily streak and awards bonus XP.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Unified Streak Active</span>
          </span>
        </div>
      </div>

      {/* Grid: LeetCode & HackerRank Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* LeetCode Sync Card */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/30 transition-all space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center font-bold text-amber-400 text-sm">
                LC
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm text-slate-200">LeetCode</span>
                  <a
                    href={`https://leetcode.com/u/${profiles.leetcode?.username || 'student'}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                {editingPlatform === 'leetcode' ? (
                  <div className="flex items-center space-x-1 mt-1">
                    <input
                      type="text"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      placeholder="LeetCode username"
                      className="bg-slate-900 border border-slate-700 px-2 py-0.5 rounded text-[11px] text-slate-100 outline-none w-28"
                    />
                    <button
                      onClick={() => handleSaveUsername('leetcode')}
                      className="px-2 py-0.5 bg-amber-500 text-slate-950 font-bold text-[10px] rounded cursor-pointer"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleStartEdit('leetcode')}
                    className="text-[11px] text-slate-400 hover:text-slate-200 underline cursor-pointer"
                  >
                    @{profiles.leetcode?.username || 'set_username'}
                  </button>
                )}
              </div>
            </div>

            <button
              onClick={() => handleSync('leetcode')}
              disabled={syncingPlatform === 'leetcode'}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${syncingPlatform === 'leetcode' ? 'animate-spin' : ''}`}
              />
              <span>{syncingPlatform === 'leetcode' ? 'Syncing...' : 'Sync Streak'}</span>
            </button>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-2 pt-1 text-center">
            <div className="p-2 bg-slate-900/80 rounded-lg border border-slate-800/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Streak</span>
              <span className="text-sm font-extrabold text-amber-400 flex items-center justify-center gap-1 mt-0.5">
                <Flame className="w-3.5 h-3.5 fill-amber-400" />
                <span>{profiles.leetcode?.dailyStreak || 0} Days</span>
              </span>
            </div>

            <div className="p-2 bg-slate-900/80 rounded-lg border border-slate-800/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Solved</span>
              <span className="text-sm font-extrabold text-sky-400 mt-0.5 block">
                {profiles.leetcode?.totalSolved || 0} Qs
              </span>
            </div>

            <div className="p-2 bg-slate-900/80 rounded-lg border border-slate-800/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Ranking</span>
              <span className="text-xs font-mono font-bold text-slate-200 mt-1 block truncate">
                {profiles.leetcode?.rankingOrRating || 'Unranked'}
              </span>
            </div>
          </div>

          {/* Solved breakdown */}
          {profiles.leetcode?.breakdown && (
            <div className="flex items-center justify-between text-[10px] px-2 py-1 bg-slate-900 rounded-md border border-slate-800 text-slate-400">
              <span className="text-emerald-400 font-semibold">
                Easy: {profiles.leetcode.breakdown.easy}
              </span>
              <span className="text-amber-400 font-semibold">
                Med: {profiles.leetcode.breakdown.medium}
              </span>
              <span className="text-rose-400 font-semibold">
                Hard: {profiles.leetcode.breakdown.hard}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
            <span>Last Synced: {profiles.leetcode?.lastSyncedAt || 'Just now'}</span>
            <span className="text-emerald-400 font-medium">✓ Auto-advances SkillMatcher streak</span>
          </div>
        </div>

        {/* HackerRank Sync Card */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/30 transition-all space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-bold text-emerald-400 text-sm">
                HR
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm text-slate-200">HackerRank</span>
                  <a
                    href={`https://www.hackerrank.com/profile/${profiles.hackerrank?.username || 'student'}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                {editingPlatform === 'hackerrank' ? (
                  <div className="flex items-center space-x-1 mt-1">
                    <input
                      type="text"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      placeholder="HackerRank username"
                      className="bg-slate-900 border border-slate-700 px-2 py-0.5 rounded text-[11px] text-slate-100 outline-none w-28"
                    />
                    <button
                      onClick={() => handleSaveUsername('hackerrank')}
                      className="px-2 py-0.5 bg-emerald-500 text-slate-950 font-bold text-[10px] rounded cursor-pointer"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleStartEdit('hackerrank')}
                    className="text-[11px] text-slate-400 hover:text-slate-200 underline cursor-pointer"
                  >
                    @{profiles.hackerrank?.username || 'set_username'}
                  </button>
                )}
              </div>
            </div>

            <button
              onClick={() => handleSync('hackerrank')}
              disabled={syncingPlatform === 'hackerrank'}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${syncingPlatform === 'hackerrank' ? 'animate-spin' : ''}`}
              />
              <span>{syncingPlatform === 'hackerrank' ? 'Syncing...' : 'Sync Streak'}</span>
            </button>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-2 pt-1 text-center">
            <div className="p-2 bg-slate-900/80 rounded-lg border border-slate-800/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Streak</span>
              <span className="text-sm font-extrabold text-amber-400 flex items-center justify-center gap-1 mt-0.5">
                <Flame className="w-3.5 h-3.5 fill-amber-400" />
                <span>{profiles.hackerrank?.dailyStreak || 0} Days</span>
              </span>
            </div>

            <div className="p-2 bg-slate-900/80 rounded-lg border border-slate-800/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Solved</span>
              <span className="text-sm font-extrabold text-emerald-400 mt-0.5 block">
                {profiles.hackerrank?.totalSolved || 0} Qs
              </span>
            </div>

            <div className="p-2 bg-slate-900/80 rounded-lg border border-slate-800/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Badge</span>
              <span className="text-xs font-bold text-amber-300 mt-1 block truncate">
                {profiles.hackerrank?.rankingOrRating || '5 Stars Gold'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] px-2 py-1 bg-slate-900 rounded-md border border-slate-800 text-slate-300">
            <span className="font-semibold text-emerald-400">Certification:</span>
            <span>Problem Solving (Verified)</span>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
            <span>Last Synced: {profiles.hackerrank?.lastSyncedAt || 'Just now'}</span>
            <span className="text-emerald-400 font-medium">✓ Grants +40 XP Daily Streak Bonus</span>
          </div>
        </div>
      </div>
    </div>
  );
}
