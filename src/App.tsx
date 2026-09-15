import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { InternshipMatcher } from './components/InternshipMatcher';
import { QuizSection } from './components/QuizSection';
import { ResumeLinkedInOptimizer } from './components/ResumeLinkedInOptimizer';
import { ProjectIdeaGenerator } from './components/ProjectIdeaGenerator';
import { ProgressDashboard } from './components/ProgressDashboard';
import { ProfileModal } from './components/ProfileModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import {
  INITIAL_PROFILE,
  INITIAL_INTERNSHIPS,
  INITIAL_STATS,
  LEVEL_THRESHOLDS,
} from './data/mockData';
import { StudentProfile, Internship, UserStats, SkillLevel } from './types';

export default function App() {
  // Load state from localStorage or fallback to mock data
  const [profile, setProfile] = useState<StudentProfile>(() => {
    try {
      const saved = localStorage.getItem('skillmatcher_profile');
      return saved ? JSON.parse(saved) : INITIAL_PROFILE;
    } catch {
      return INITIAL_PROFILE;
    }
  });

  const [internships, setInternships] = useState<Internship[]>(() => {
    try {
      const saved = localStorage.getItem('skillmatcher_internships');
      return saved ? JSON.parse(saved) : INITIAL_INTERNSHIPS;
    } catch {
      return INITIAL_INTERNSHIPS;
    }
  });

  const [stats, setStats] = useState<UserStats>(() => {
    try {
      const saved = localStorage.getItem('skillmatcher_stats');
      return saved ? JSON.parse(saved) : INITIAL_STATS;
    } catch {
      return INITIAL_STATS;
    }
  });

  const [activeTab, setActiveTab] = useState<
    'internships' | 'quizzes' | 'resume' | 'projects' | 'dashboard'
  >('internships');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAiMatching, setIsAiMatching] = useState(false);
  const [quizInitialTopic, setQuizInitialTopic] = useState<string | undefined>(undefined);
  const [resumeInitialRole, setResumeInitialRole] = useState<string | undefined>(undefined);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Persist state changes
  useEffect(() => {
    localStorage.setItem('skillmatcher_profile', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('skillmatcher_internships', JSON.stringify(internships));
  }, [internships]);

  useEffect(() => {
    localStorage.setItem('skillmatcher_stats', JSON.stringify(stats));
  }, [stats]);

  const showToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = 'toast_' + Date.now() + Math.random().toString(36).substr(2, 4);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Helper to add XP and update level
  const addXp = (amount: number, description: string) => {
    setStats((prev) => {
      const newXp = prev.xp + amount;
      let newLevel = prev.level;
      let newTitle = prev.levelTitle;

      for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
        if (newXp >= LEVEL_THRESHOLDS[i].minXp) {
          newLevel = LEVEL_THRESHOLDS[i].level;
          newTitle = LEVEL_THRESHOLDS[i].title;
          break;
        }
      }

      if (newLevel > prev.level) {
        showToast({
          type: 'streak',
          title: `Level Up! Reached Lvl ${newLevel}: ${newTitle}`,
          description: 'You unlocked new recruiter insights and achievement perks!',
        });
      }

      return {
        ...prev,
        xp: newXp,
        level: newLevel,
        levelTitle: newTitle,
        xpHistory: [
          {
            id: 'x_' + Date.now(),
            description,
            amount,
            timestamp: 'Just now',
          },
          ...prev.xpHistory.slice(0, 14),
        ],
      };
    });

    showToast({
      type: 'xp',
      title: `+${amount} XP Gained`,
      description,
    });
  };

  // Run AI matching for internships
  const handleRefreshAiMatch = async () => {
    setIsAiMatching(true);
    try {
      const res = await fetch('/api/gemini/match-internships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentSkills: profile.skills,
          interests: profile.interests,
          experience: profile.experienceSummary,
          internships,
        }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const matchMap = new Map<string, any>(data.data.map((m: any) => [m.internshipId, m]));
        setInternships((prev) =>
          prev.map((job) => {
            const m = matchMap.get(job.id);
            if (m) {
              return {
                ...job,
                matchScore: m.matchScore,
                matchReasons: m.matchReasons,
                missingSkills: m.missingSkills,
                prepTip: m.prepTip,
              };
            }
            return job;
          })
        );
        addXp(25, 'Ranked internships with Gemini AI');
      }
    } catch (err) {
      console.error('Match error:', err);
    } finally {
      setIsAiMatching(false);
    }
  };

  // Run initial scoring on profile change if needed
  useEffect(() => {
    handleRefreshAiMatch();
  }, [profile.skills.length, profile.targetRole]);

  // Claim daily streak
  const handleClaimDailyStreak = () => {
    if (stats.checkedInToday) return;

    setStats((prev) => ({
      ...prev,
      dailyStreak: prev.dailyStreak + 1,
      longestStreak: Math.max(prev.longestStreak, prev.dailyStreak + 1),
      checkedInToday: true,
      lastActiveDate: new Date().toISOString().split('T')[0],
    }));

    addXp(20, 'Daily Check-in Streak Reward');
    showToast({
      type: 'streak',
      title: `${stats.dailyStreak + 1} Day Streak Secured! 🔥`,
      description: 'Your learning habit is burning bright. Keep it going tomorrow!',
    });
  };

  // Toggle Save Internship
  const handleToggleSaveInternship = (id: string) => {
    setInternships((prev) =>
      prev.map((job) => (job.id === id ? { ...job, isSaved: !job.isSaved } : job))
    );
    showToast({
      type: 'info',
      title: 'Internship Bookmarked',
      description: 'Saved to your application wishlist.',
    });
  };

  // Toggle Apply Internship
  const handleToggleApplyInternship = (id: string) => {
    setInternships((prev) =>
      prev.map((job) => {
        if (job.id === id) {
          const nextApplied = !job.isApplied;
          if (nextApplied) {
            setStats((s) => ({ ...s, internshipsApplied: s.internshipsApplied + 1 }));
            addXp(20, `Applied to ${job.title} at ${job.company}`);
          }
          return { ...job, isApplied: nextApplied };
        }
        return job;
      })
    );
  };

  // Navigate to quiz with specific weak topic preselected
  const handleSelectWeakTopicForQuiz = (skillName: string) => {
    setQuizInitialTopic(skillName);
    setActiveTab('quizzes');
    showToast({
      type: 'info',
      title: `Selected "${skillName}" Diagnostic`,
      description: 'Loaded personalized quiz to close this specific skill gap.',
    });
  };

  // Navigate to resume optimizer tailored for specific role
  const handleOptimizeForRole = (roleTitle: string) => {
    setResumeInitialRole(roleTitle);
    setActiveTab('resume');
    showToast({
      type: 'info',
      title: 'Tuning for ' + roleTitle,
      description: 'Ready to generate role-specific XYZ bullet points and keywords.',
    });
  };

  // Quiz completion callback: updates mastery score and awards XP
  const handleQuizCompleted = (topic: string, score: number, total: number) => {
    const percent = Math.round((score / total) * 100);
    const xpGain = 50 + (percent === 100 ? 25 : 0);

    // Level up skill if exists in profile
    setProfile((prev) => {
      const updatedSkills = prev.skills.map((s) => {
        if (s.name.toLowerCase() === topic.toLowerCase()) {
          const newMastery = Math.min(100, s.masteryScore + 15);
          let newLevel: SkillLevel = s.level;
          if (newMastery >= 90) newLevel = 'Expert';
          else if (newMastery >= 75) newLevel = 'Advanced';
          else if (newMastery >= 55) newLevel = 'Intermediate';

          return {
            ...s,
            masteryScore: newMastery,
            level: newLevel,
            quizzesTaken: (s.quizzesTaken || 0) + 1,
          };
        }
        return s;
      });

      return {
        ...prev,
        skills: updatedSkills,
      };
    });

    setStats((prev) => ({
      ...prev,
      quizzesCompleted: prev.quizzesCompleted + 1,
    }));

    addXp(xpGain, `Completed Diagnostic on ${topic} (${score}/${total} correct)`);
  };

  // Profile optimization callback
  const handleProfileOptimized = (xpEarned: number) => {
    setStats((prev) => ({
      ...prev,
      resumesOptimized: prev.resumesOptimized + 1,
    }));
    addXp(xpEarned, 'Optimized Resume & LinkedIn with Google XYZ Formula');
  };

  // Project started callback
  const handleProjectStarted = (title: string) => {
    setStats((prev) => ({
      ...prev,
      projectsStarted: prev.projectsStarted + 1,
    }));
    addXp(20, `Started Portfolio Project: ${title}`);
    showToast({
      type: 'success',
      title: 'Project Added to Portfolio Tracker',
      description: 'Complete milestones to earn XP and build an interview-ready project!',
    });
  };

  // Milestone completed callback
  const handleMilestoneCompleted = (projectName: string, step: number) => {
    addXp(25, `Completed Milestone ${step} for ${projectName}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500/30 selection:text-sky-200">
      {/* Top Header */}
      <Header
        profile={profile}
        stats={stats}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenProfile={() => setIsProfileOpen(true)}
        onClaimDailyStreak={handleClaimDailyStreak}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'internships' && (
          <InternshipMatcher
            internships={internships}
            profile={profile}
            isAiMatching={isAiMatching}
            onRefreshAiMatch={handleRefreshAiMatch}
            onToggleSave={handleToggleSaveInternship}
            onToggleApply={handleToggleApplyInternship}
            onSelectWeakTopicForQuiz={handleSelectWeakTopicForQuiz}
            onOptimizeForRole={handleOptimizeForRole}
          />
        )}

        {activeTab === 'quizzes' && (
          <QuizSection
            profile={profile}
            initialTopic={quizInitialTopic}
            onQuizCompleted={handleQuizCompleted}
          />
        )}

        {activeTab === 'resume' && (
          <ResumeLinkedInOptimizer
            profile={profile}
            initialRole={resumeInitialRole}
            onProfileOptimized={handleProfileOptimized}
          />
        )}

        {activeTab === 'projects' && (
          <ProjectIdeaGenerator
            profile={profile}
            onProjectStarted={handleProjectStarted}
            onMilestoneCompleted={handleMilestoneCompleted}
          />
        )}

        {activeTab === 'dashboard' && (
          <ProgressDashboard
            profile={profile}
            stats={stats}
            onClaimDailyStreak={handleClaimDailyStreak}
            onNavigateToTab={(tab) => setActiveTab(tab)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>SkillMatcher • Personalized Career &amp; Skill Launchpad for Students</p>
          <p className="text-slate-600">
            Powered by Gemini AI • Real-time Skill Diagnostics &amp; Internship Fit Scoring
          </p>
        </div>
      </footer>

      {/* Profile Edit / Inventory Modal */}
      <ProfileModal
        profile={profile}
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onSaveProfile={(updated) => {
          setProfile(updated);
          showToast({
            type: 'success',
            title: 'Profile Updated',
            description: 'Skills inventory saved. Recalibrating internship fit scores...',
          });
        }}
        onSelectPreset={(preset) => {
          setProfile(preset);
          showToast({
            type: 'success',
            title: `Preset Loaded: ${preset.title}`,
            description: 'Loaded profile template with curated skills and resume bullets.',
          });
        }}
      />

      {/* Toast Notifications Container */}
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
}
