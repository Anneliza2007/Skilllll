export type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

export interface StudentSkill {
  id: string;
  name: string;
  category: 'Frontend' | 'Backend' | 'Database' | 'DevOps' | 'AI/Data' | 'Language' | 'Core CS';
  level: SkillLevel;
  masteryScore: number; // 0 to 100
  quizzesTaken?: number;
}

export interface StudentProfile {
  name: string;
  title: string;
  university: string;
  major: string;
  graduationYear: string;
  targetRole: string;
  interests: string[];
  skills: StudentSkill[];
  experienceSummary: string;
  currentResumeBullets: string[];
  githubUrl?: string;
  linkedinUrl?: string;
}

export interface Internship {
  id: string;
  title: string;
  company: string;
  companyLogo: string; // company logo initial or image
  location: string;
  workplaceType: 'Remote' | 'Hybrid' | 'Onsite';
  stipend: string;
  duration: string;
  category: string;
  requiredSkills: string[];
  preferredSkills: string[];
  description: string;
  applicationDeadline: string;
  matchScore?: number;
  matchReasons?: string[];
  missingSkills?: string[];
  prepTip?: string;
  isSaved?: boolean;
  isApplied?: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  codeSnippet?: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  quickFixTip: string;
}

export interface QuizSession {
  topic: string;
  skillFocus: string;
  questions: QuizQuestion[];
}

export interface OptimizedBullet {
  original: string;
  improved: string;
  metricsHighlighted: string;
  rationale: string;
}

export interface LinkedInHeadline {
  style: string;
  headline: string;
}

export interface AtsKeyword {
  keyword: string;
  importance: 'Critical' | 'High' | 'Medium';
  inProfile: boolean;
}

export interface OptimizationResult {
  optimizedBullets: OptimizedBullet[];
  linkedInHeadlines: LinkedInHeadline[];
  linkedInAbout: string;
  atsKeywords: AtsKeyword[];
}

export interface ProjectMilestone {
  step: number;
  title: string;
  description: string;
  completed?: boolean;
}

export interface ProjectIdea {
  id: string;
  title: string;
  tagline: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedHours: string;
  techStack: string[];
  problemSolved: string;
  milestones: ProjectMilestone[];
  resumePitchBullet: string;
  isSaved?: boolean;
  isStarted?: boolean;
}

export interface DailyTodoItem {
  id: string;
  title: string;
  category: 'quiz' | 'resume' | 'project' | 'practice' | 'custom';
  xpReward: number;
  completed: boolean;
  isCustom?: boolean;
}

export interface PracticePlatform {
  id: string;
  name: string;
  category: 'DevOps & Systems' | 'Low-Level & Core CS' | 'Security & Reverse Engineering' | 'UI & Visual Precision' | 'Real-World Data & ML' | 'Live Technical Pressure';
  tagline: string;
  whyOutOfComfortZone: string;
  skillsUnlocked: string[];
  difficulty: 'Challenging' | 'Steep' | 'Hardcore';
  url: string;
  exampleChallenge: string;
  estimatedTimeToFirstWin: string;
}

export interface UserStats {
  xp: number;
  level: number;
  levelTitle: string;
  dailyStreak: number;
  longestStreak: number;
  lastActiveDate: string; // YYYY-MM-DD
  checkedInToday: boolean;
  streakFreezesAvailable: number;
  quizzesCompleted: number;
  projectsStarted: number;
  resumesOptimized: number;
  internshipsApplied: number;
  dailyTodos?: DailyTodoItem[];
  xpHistory: {
    id: string;
    description: string;
    amount: number;
    timestamp: string;
  }[];
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  provider: 'credentials' | 'google';
  avatar?: string;
  joinedAt: string;
  profileData?: StudentProfile;
  statsData?: UserStats;
}

export type BadgeRarity = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
export type BadgeCategory = 'all' | 'career' | 'skills' | 'streak' | 'learning';

export interface AchievementBadge {
  id: string;
  title: string;
  tagline: string;
  description: string;
  category: 'career' | 'skills' | 'streak' | 'learning';
  rarity: BadgeRarity;
  icon: string; // Emoji or visual icon identifier
  unlocked: boolean;
  unlockedDate?: string;
  currentProgress: number;
  maxProgress: number;
  progressLabel: string;
  xpReward: number;
  hint: string;
}

// External competitive programming profiles & streak synchronization
export interface ExternalCodingProfile {
  platform: 'leetcode' | 'hackerrank';
  username: string;
  connected: boolean;
  dailyStreak: number;
  totalSolved: number;
  breakdown?: { easy: number; medium: number; hard: number };
  rankingOrRating?: string;
  lastSyncedAt?: string;
  syncedToday: boolean;
  badge?: string;
}

// SkillTutor Conceptual Socratic Engine types
export type SkillTutorMode = 'hint' | 'socratic' | 'debug' | 'concept' | 'interview';

export type SkillTutorHintStage = 1 | 2 | 3 | 4 | 5;

export interface SkillTutorChallenge {
  id: string;
  title: string;
  topic: string;
  difficulty: 'Conceptual Foundational' | 'Intermediate Architecture' | 'Advanced Trade-offs';
  conceptualScenario: string;
  promptQuestion: string;
  keyPrinciples: string[];
  exampleThoughtPrompt: string;
  relatedRole: string;
  weakSkillTag?: string;
  commonMistakes?: string[];
  adaptiveNotes?: string;
}

export interface SkillTutorHintLog {
  tier: number;
  tierName: string;
  timestamp: string;
  mode: SkillTutorMode;
}

export interface SkillTutorRevisionLog {
  id?: string;
  timestamp: string;
  diffSummary: string;
  length: number;
  characterCount?: number;
  wordCount?: number;
}

export interface SkillTutorTelemetry {
  hintRequests: SkillTutorHintLog[];
  timeOnTaskSeconds: number;
  attemptsCount: number;
  revisionCount: number;
  revisionPatterns: SkillTutorRevisionLog[];
  copiedAnswerWarnings: number;
  refusalGivenCount: number;
  independenceScore: number; // 0 to 100
  aiRelianceScore: number; // 0 to 100
}

export interface SkillTutorMessage {
  id: string;
  sender: 'user' | 'tutor';
  text: string;
  timestamp: string;
  mode?: SkillTutorMode;
  hintTier?: string;
  hintStage?: number;
  guidingQuestion?: string;
  conceptualAnalogy?: string;
  likelyBugLocation?: string;
  authorizedSnippet?: string;
  isRefusal?: boolean;
  requiresReExplanation?: boolean;
  adaptiveNote?: string;
}

export interface SkillTutorSubmission {
  id: string;
  challengeId: string;
  challengeTitle: string;
  topic: string;
  studentConceptualAnswer: string;
  score: number;
  passed: boolean;
  conceptualDepth: string;
  selfRelianceRating: string;
  hintsUsed: number;
  timestamp: string;
  strengths: string[];
  cognitiveGaps: string[];
  socraticFeedback: string;
  careerReadinessVerdict: string;
  antiCheatVerified: boolean;
  independenceScore: number;
  aiRelianceScore: number;
  timeOnTaskSeconds: number;
  attemptsCount: number;
  revisionCount: number;
  revisionsCount?: number;
  modeUsed?: SkillTutorMode;
  reExplanationVerified?: boolean;
}

export interface SkillTutorReport {
  executiveSummary: string;
  conceptualProficiencyIndex: number;
  selfRelianceRate: number;
  independenceScore: number;
  aiRelianceScore: number;
  antiCheatIntegrity: string;
  careerReadinessTier: string;
  recruiterPitchSummary: string;
  topStrengths: string[];
  growthOpportunities: string[];
  topicBreakdown: {
    topic: string;
    score: number;
    status: string;
    recommendation: string;
  }[];
}
