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
}
