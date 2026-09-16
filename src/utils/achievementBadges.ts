import { AchievementBadge, StudentProfile, UserStats, Internship } from '../types';
import { PREDEFINED_USERS } from '../data/userAccounts';

export interface LeaderboardEntry {
  rank: number;
  name: string;
  role: string;
  university: string;
  xp: number;
  level: number;
  levelTitle: string;
  streak: number;
  isCurrentUser: boolean;
}

export function computeLeaderboard(currentProfile: StudentProfile, currentStats: UserStats): LeaderboardEntry[] {
  // Collect all peer accounts from PREDEFINED_USERS (excluding admin)
  const peerList = PREDEFINED_USERS
    .filter((u) => u.user.role !== 'admin')
    .map((u) => ({
      name: u.user.name,
      role: u.profile.targetRole,
      university: u.profile.university,
      xp: u.stats.xp,
      level: u.stats.level,
      levelTitle: u.stats.levelTitle,
      streak: u.stats.dailyStreak,
      isCurrentUser: u.user.name === currentProfile.name || u.profile.name === currentProfile.name,
    }));

  // Check if current user is already in peerList by name
  const existingIndex = peerList.findIndex((p) => p.isCurrentUser);
  if (existingIndex >= 0) {
    // Update their XP & stats with latest currentStats
    peerList[existingIndex].xp = currentStats.xp;
    peerList[existingIndex].level = currentStats.level;
    peerList[existingIndex].levelTitle = currentStats.levelTitle;
    peerList[existingIndex].streak = currentStats.dailyStreak;
  } else {
    // Add current user
    peerList.push({
      name: currentProfile.name,
      role: currentProfile.targetRole,
      university: currentProfile.university,
      xp: currentStats.xp,
      level: currentStats.level,
      levelTitle: currentStats.levelTitle,
      streak: currentStats.dailyStreak,
      isCurrentUser: true,
    });
  }

  // Sort descending by XP
  peerList.sort((a, b) => b.xp - a.xp);

  // Assign ranks
  return peerList.map((entry, idx) => ({
    ...entry,
    rank: idx + 1,
  }));
}

export function evaluateAchievementBadges(
  profile: StudentProfile,
  stats: UserStats,
  internships: Internship[]
): { badges: AchievementBadge[]; userRank: number; totalLeaderboardCount: number; top3XpThreshold: number } {
  const leaderboard = computeLeaderboard(profile, stats);
  const currentUserEntry = leaderboard.find((e) => e.isCurrentUser) || {
    rank: leaderboard.length,
    xp: stats.xp,
  };
  const userRank = currentUserEntry.rank;
  const top3XpThreshold = leaderboard.length >= 3 ? leaderboard[2].xp : 1200;

  // 1. Applications Count
  const appliedCount = Math.max(
    stats.internshipsApplied,
    internships.filter((i) => i.isApplied).length
  );

  // 2. Highest Skill Mastery
  const highestMastery = profile.skills.reduce((max, s) => Math.max(max, s.masteryScore), 0);
  const highestSkill = profile.skills.find((s) => s.masteryScore === highestMastery);

  // 3. Category diversity
  const uniqueCategories = new Set(profile.skills.map((s) => s.category)).size;

  // 4. Comfort task check
  const comfortTaskDone = stats.dailyTodos?.some((t) => t.category === 'practice' && t.completed && t.id.includes('comfort')) || false;

  // 5. SkillTutor submissions check
  let skillTutorPassedCount = 0;
  let highIndependenceCount = 0;
  try {
    const rawSubs = localStorage.getItem('skillmatcher_skilltutor_submissions');
    if (rawSubs) {
      const parsedSubs = JSON.parse(rawSubs);
      if (Array.isArray(parsedSubs)) {
        skillTutorPassedCount = parsedSubs.filter((s: any) => s.passed).length;
        highIndependenceCount = parsedSubs.filter((s: any) => s.passed && (s.independenceScore ?? 80) >= 80).length;
      }
    }
  } catch {
    // ignore
  }

  const badges: AchievementBadge[] = [
    // 1. First Application (Explicitly Requested)
    {
      id: 'first-application',
      title: 'First Application',
      tagline: 'Step into the Arena',
      description: 'Submit or track your very first internship application through the launchpad.',
      category: 'career',
      rarity: 'Bronze',
      icon: '🎯',
      unlocked: appliedCount >= 1,
      unlockedDate: appliedCount >= 1 ? 'Earned' : undefined,
      currentProgress: Math.min(appliedCount, 1),
      maxProgress: 1,
      progressLabel: `${Math.min(appliedCount, 1)} / 1 Application`,
      xpReward: 50,
      hint: 'Browse Ranked Internships and mark at least one role as Applied.',
    },

    // 2. Top of the Leaderboard (Explicitly Requested)
    {
      id: 'top-leaderboard',
      title: 'Top of the Leaderboard',
      tagline: 'Campus Podium Elite',
      description: 'Ascend to the prestigious Top 3 on the university XP & readiness leaderboard.',
      category: 'learning',
      rarity: 'Diamond',
      icon: '🏆',
      unlocked: userRank <= 3,
      unlockedDate: userRank <= 3 ? `Earned (Rank #${userRank})` : undefined,
      currentProgress: userRank <= 3 ? 3 : Math.max(0, 3 - Math.max(0, userRank - 3)),
      maxProgress: 3,
      progressLabel: userRank <= 3 ? `Rank #${userRank} (Top 3 Achieved!)` : `Rank #${userRank} (Need Top 3 • ${Math.max(0, top3XpThreshold - stats.xp)} XP to Podium)`,
      xpReward: 250,
      hint: 'Complete daily diagnostic quizzes and polish resume bullets to overtake campus peers.',
    },

    // 3. Skill Master (Explicitly Requested)
    {
      id: 'skill-master',
      title: 'Skill Master',
      tagline: 'Subject Matter Authority',
      description: 'Achieve 90% or higher verified mastery in any technical domain skill.',
      category: 'skills',
      rarity: 'Gold',
      icon: '👑',
      unlocked: highestMastery >= 90,
      unlockedDate: highestMastery >= 90 ? `Earned (${highestSkill?.name || 'Technical Skill'} at ${highestMastery}%)` : undefined,
      currentProgress: Math.min(highestMastery, 90),
      maxProgress: 90,
      progressLabel: `${highestMastery}% / 90% (${highestSkill?.name || 'Top Skill'})`,
      xpReward: 120,
      hint: 'Complete targeted topic quizzes to push your strongest skill above the 90% threshold.',
    },

    // 4. Diagnostic Ace
    {
      id: 'diagnostic-ace',
      title: 'Diagnostic Ace',
      tagline: 'Blindspot Annihilator',
      description: 'Complete 5 or more technical diagnostic quizzes to identify and patch interview gaps.',
      category: 'skills',
      rarity: 'Silver',
      icon: '⚡',
      unlocked: stats.quizzesCompleted >= 5,
      unlockedDate: stats.quizzesCompleted >= 5 ? 'Earned' : undefined,
      currentProgress: Math.min(stats.quizzesCompleted, 5),
      maxProgress: 5,
      progressLabel: `${Math.min(stats.quizzesCompleted, 5)} / 5 Quizzes`,
      xpReward: 75,
      hint: 'Take adaptive quizzes on your weakest skills under the Quizzes tab.',
    },

    // 5. Resume Architect
    {
      id: 'resume-architect',
      title: 'Resume Architect',
      tagline: 'Google XYZ Calibrator',
      description: 'Calibrate 3 or more experience bullets using the quantified Google XYZ impact formula.',
      category: 'career',
      rarity: 'Silver',
      icon: '📝',
      unlocked: stats.resumesOptimized >= 3,
      unlockedDate: stats.resumesOptimized >= 3 ? 'Earned' : undefined,
      currentProgress: Math.min(stats.resumesOptimized, 3),
      maxProgress: 3,
      progressLabel: `${Math.min(stats.resumesOptimized, 3)} / 3 Bullets`,
      xpReward: 60,
      hint: 'Use the Resume & LinkedIn AI tab to convert generic text into quantified accomplishment statements.',
    },

    // 6. Unstoppable Momentum
    {
      id: 'unstoppable-streak',
      title: 'Unstoppable Momentum',
      tagline: 'Habit-Forming Rigor',
      description: 'Maintain a 7-day uninterrupted daily preparation streak on the platform.',
      category: 'streak',
      rarity: 'Gold',
      icon: '🔥',
      unlocked: stats.dailyStreak >= 7,
      unlockedDate: stats.dailyStreak >= 7 ? 'Earned' : undefined,
      currentProgress: Math.min(stats.dailyStreak, 7),
      maxProgress: 7,
      progressLabel: `${Math.min(stats.dailyStreak, 7)} / 7 Days Active`,
      xpReward: 100,
      hint: 'Check in daily and complete at least one micro-task to keep your flame burning.',
    },

    // 7. Architectural Builder
    {
      id: 'architectural-builder',
      title: 'Architectural Builder',
      tagline: 'Portfolio Proof of Work',
      description: 'Initiate a production-grade portfolio project blueprint matching target employer tech stacks.',
      category: 'skills',
      rarity: 'Bronze',
      icon: '💡',
      unlocked: stats.projectsStarted >= 1,
      unlockedDate: stats.projectsStarted >= 1 ? 'Earned' : undefined,
      currentProgress: Math.min(stats.projectsStarted, 1),
      maxProgress: 1,
      progressLabel: `${Math.min(stats.projectsStarted, 1)} / 1 Project Started`,
      xpReward: 50,
      hint: 'Head to the Strong Skill Projects tab and start building a recommended blueprint.',
    },

    // 8. Comfort Zone Crusher
    {
      id: 'comfort-zone-crusher',
      title: 'Comfort Zone Crusher',
      tagline: 'Beyond Tutorial Hell',
      description: 'Tackle specialized challenge tracks in systems, reverse engineering, or visual precision.',
      category: 'learning',
      rarity: 'Gold',
      icon: '🚀',
      unlocked: comfortTaskDone || stats.projectsStarted >= 2 || stats.quizzesCompleted >= 8,
      unlockedDate: comfortTaskDone || stats.projectsStarted >= 2 || stats.quizzesCompleted >= 8 ? 'Earned' : undefined,
      currentProgress: (comfortTaskDone || stats.projectsStarted >= 2 || stats.quizzesCompleted >= 8) ? 1 : 0,
      maxProgress: 1,
      progressLabel: (comfortTaskDone || stats.projectsStarted >= 2 || stats.quizzesCompleted >= 8) ? 'Challenge Complete' : '0 / 1 Challenges Attempted',
      xpReward: 90,
      hint: 'Visit Out-of-Comfort Practice and mark a practice challenge as added or completed in your daily checklist.',
    },

    // 9. Polyglot Engineer
    {
      id: 'polyglot-engineer',
      title: 'Polyglot Engineer',
      tagline: 'Multi-Domain Versatility',
      description: 'Establish rated skills across at least 4 distinct engineering domains (Frontend, Backend, DB, DevOps, etc.).',
      category: 'skills',
      rarity: 'Platinum',
      icon: '🌐',
      unlocked: uniqueCategories >= 4,
      unlockedDate: uniqueCategories >= 4 ? `Earned (${uniqueCategories} Domains)` : undefined,
      currentProgress: Math.min(uniqueCategories, 4),
      maxProgress: 4,
      progressLabel: `${Math.min(uniqueCategories, 4)} / 4 Domains Mastered`,
      xpReward: 150,
      hint: 'Add skills from diverse categories like Database, DevOps, and Language in your profile.',
    },

    // 10. Century Club
    {
      id: 'century-club',
      title: 'Century Club',
      tagline: '500 XP Milestone',
      description: 'Accumulate 500 or more total experience points through daily tasks, quizzes, and resumes.',
      category: 'streak',
      rarity: 'Silver',
      icon: '⭐',
      unlocked: stats.xp >= 500,
      unlockedDate: stats.xp >= 500 ? 'Earned' : undefined,
      currentProgress: Math.min(stats.xp, 500),
      maxProgress: 500,
      progressLabel: `${Math.min(stats.xp, 500)} / 500 XP`,
      xpReward: 70,
      hint: 'Keep racking up XP points across daily checklists and diagnostic quiz completions.',
    },

    // 11. Opportunity Campaigner
    {
      id: 'opportunity-campaigner',
      title: 'Opportunity Campaigner',
      tagline: 'Active Candidate',
      description: 'Submit applications to 3 or more verified high-match internship opportunities.',
      category: 'career',
      rarity: 'Platinum',
      icon: '💼',
      unlocked: appliedCount >= 3,
      unlockedDate: appliedCount >= 3 ? 'Earned' : undefined,
      currentProgress: Math.min(appliedCount, 3),
      maxProgress: 3,
      progressLabel: `${Math.min(appliedCount, 3)} / 3 Applications`,
      xpReward: 140,
      hint: 'Mark at least 3 matched internships as applied in the Ranked Internships tab.',
    },

    // 12. Offer Magnet Ascendant
    {
      id: 'offer-magnet-ascendant',
      title: 'Offer Magnet Ascendant',
      tagline: 'Tier-1 Candidate Caliber',
      description: 'Ascend to Level 5 (Offer Magnet rank) with over 2,000 career preparation XP.',
      category: 'learning',
      rarity: 'Diamond',
      icon: '✨',
      unlocked: stats.level >= 5 || stats.xp >= 2000,
      unlockedDate: stats.level >= 5 || stats.xp >= 2000 ? 'Earned' : undefined,
      currentProgress: Math.min(stats.xp, 2000),
      maxProgress: 2000,
      progressLabel: `${Math.min(stats.xp, 2000)} / 2000 XP`,
      xpReward: 300,
      hint: 'Consistently practice to climb all the way to Level 5: Offer Magnet status.',
    },

    // 13. Socratic Scholar
    {
      id: 'socratic-scholar',
      title: 'Socratic Scholar',
      tagline: 'High-Independence Thinker',
      description: 'Solve a SkillTutor conceptual challenge maintaining an Independence Score of 80% or higher.',
      category: 'learning',
      rarity: 'Gold',
      icon: '🧠',
      unlocked: highIndependenceCount >= 1,
      unlockedDate: highIndependenceCount >= 1 ? 'Earned' : undefined,
      currentProgress: Math.min(highIndependenceCount, 1),
      maxProgress: 1,
      progressLabel: `${Math.min(highIndependenceCount, 1)} / 1 High-Independence Challenge`,
      xpReward: 150,
      hint: 'Engage SkillTutor AI, avoid full solution requests, and articulate invariant concepts autonomously.',
    },

    // 14. Anti-Paste Purist
    {
      id: 'anti-paste-purist',
      title: 'Anti-Paste Purist',
      tagline: 'Authentic Conceptual Mastery',
      description: 'Successfully complete a SkillTutor challenge with zero unauthorized copy-paste warnings.',
      category: 'skills',
      rarity: 'Platinum',
      icon: '🛡️',
      unlocked: skillTutorPassedCount >= 1,
      unlockedDate: skillTutorPassedCount >= 1 ? 'Earned' : undefined,
      currentProgress: Math.min(skillTutorPassedCount, 1),
      maxProgress: 1,
      progressLabel: `${Math.min(skillTutorPassedCount, 1)} / 1 Authentic Challenge`,
      xpReward: 120,
      hint: 'Type your conceptual explanations organically in the anti-paste scratchpad.',
    },
  ];

  return {
    badges,
    userRank,
    totalLeaderboardCount: leaderboard.length,
    top3XpThreshold,
  };
}
