import { useState, useEffect } from 'react';
import {
  Lightbulb,
  Sparkles,
  CheckCircle2,
  Clock,
  Code2,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Zap,
  PlayCircle,
  Award,
} from 'lucide-react';
import { ProjectIdea, StudentProfile } from '../types';

interface ProjectIdeaGeneratorProps {
  profile: StudentProfile;
  onProjectStarted: (title: string) => void;
  onMilestoneCompleted: (projectName: string, step: number) => void;
}

export function ProjectIdeaGenerator({
  profile,
  onProjectStarted,
  onMilestoneCompleted,
}: ProjectIdeaGeneratorProps) {
  const strongSkills = profile.skills
    .filter((s) => s.level === 'Advanced' || s.level === 'Expert')
    .map((s) => s.name);

  const [projects, setProjects] = useState<ProjectIdea[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSkillFilter, setSelectedSkillFilter] = useState<string>('All');
  const [activeProjectMilestones, setActiveProjectMilestones] = useState<Record<string, number[]>>({});

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/gemini/generate-projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strongSkills: strongSkills.length > 0 ? strongSkills : ['React', 'TypeScript', 'Node.js'],
          interests: profile.interests,
          targetRole: profile.targetRole,
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setProjects(data.data);
      }
    } catch (err) {
      console.error('Project generation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleToggleMilestone = (projectId: string, projectTitle: string, stepNumber: number) => {
    const currentList = activeProjectMilestones[projectId] || [];
    const isCompleted = currentList.includes(stepNumber);

    let updated: number[];
    if (isCompleted) {
      updated = currentList.filter((s) => s !== stepNumber);
    } else {
      updated = [...currentList, stepNumber];
      onMilestoneCompleted(projectTitle, stepNumber);
    }

    setActiveProjectMilestones((prev) => ({
      ...prev,
      [projectId]: updated,
    }));
  };

  const filteredProjects = projects.filter((proj) => {
    if (selectedSkillFilter === 'All') return true;
    return proj.techStack.some((t) => t.toLowerCase().includes(selectedSkillFilter.toLowerCase()));
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/20 rounded-2xl p-5 shadow-lg relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Sparkles className="w-3.5 h-3.5" />
                Tailored for Strong Skills
              </span>
              <span className="text-xs text-slate-400">
                Showcase: <strong className="text-emerald-300">{strongSkills.join(', ') || 'Your Top Skills'}</strong>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
              Standout Portfolio Project Generator
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Tired of generic todo lists and clones? These curated project architectures solve genuine engineering challenges and give you impressive talking points for interviews.
            </p>
          </div>

          <button
            onClick={fetchProjects}
            disabled={isLoading}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all cursor-pointer ${
              isLoading
                ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
            }`}
          >
            <Sparkles className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Ideating...' : 'Generate New Ideas'}</span>
          </button>
        </div>
      </div>

      {/* Filter by strong skill */}
      {strongSkills.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto text-xs pb-1 no-scrollbar">
          <span className="text-slate-400 font-medium whitespace-nowrap">Filter by Strong Skill:</span>
          <button
            onClick={() => setSelectedSkillFilter('All')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              selectedSkillFilter === 'All'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            All Skills
          </button>
          {strongSkills.map((s) => (
            <button
              key={s}
              onClick={() => setSelectedSkillFilter(s)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                selectedSkillFilter === s
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-400 animate-spin mx-auto" />
          <h3 className="text-base font-bold text-slate-100">
            Architecting Projects for Your Strong Skills...
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Formulating real-world systems, API rate limiters, distributed streams, and data engineering projects tailored to your profile.
          </p>
        </div>
      )}

      {/* Projects List */}
      {!isLoading && (
        <div className="space-y-6">
          {filteredProjects.map((project, pIdx) => {
            const completedMilestones = activeProjectMilestones[project.id] || [];
            const isStarted = project.isStarted || completedMilestones.length > 0;
            const progress = Math.round((completedMilestones.length / project.milestones.length) * 100);

            return (
              <div
                key={`${project.id}-${pIdx}`}
                id={`project-card-${project.id}`}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700/90 rounded-2xl p-6 space-y-5 transition-all shadow-md"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                        {project.difficulty} Level
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {project.estimatedHours}
                      </span>
                      {isStarted && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                          In Progress ({progress}%)
                        </span>
                      )}
                    </div>
                    <h2 className="text-lg font-bold text-slate-100">{project.title}</h2>
                    <p className="text-xs sm:text-sm text-slate-300 mt-0.5 font-medium">{project.tagline}</p>
                  </div>

                  <button
                    onClick={() => onProjectStarted(project.title)}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors self-start cursor-pointer shrink-0"
                  >
                    <PlayCircle className="w-4 h-4 text-emerald-400" />
                    <span>Track in Portfolio</span>
                  </button>
                </div>

                {/* Problem Solved */}
                <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3.5 text-xs text-slate-300">
                  <span className="font-bold text-slate-200 block mb-1">The Real-World Problem Solved:</span>
                  <p className="text-slate-400 leading-relaxed">{project.problemSolved}</p>
                </div>

                {/* Tech Stack */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Recommended Tech Stack:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {project.techStack.map((tech) => (
                      <span
                        key={tech}
                        className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-medium text-slate-300"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Step-by-Step Milestones */}
                <div className="space-y-3 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      Step-by-Step Roadmap (Earn +25 XP per Milestone):
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      {completedMilestones.length}/{project.milestones.length} Completed
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {project.milestones.map((m, mIdx) => {
                      const isDone = completedMilestones.includes(m.step);
                      return (
                        <div
                          key={`${project.id}-step-${m.step}-${mIdx}`}
                          onClick={() => handleToggleMilestone(project.id, project.title, m.step)}
                          className={`p-3 rounded-xl border text-xs transition-all cursor-pointer ${
                            isDone
                              ? 'bg-emerald-950/30 border-emerald-500/40 text-slate-200 ring-1 ring-emerald-500/20'
                              : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-bold text-slate-200">Phase {m.step}: {m.title}</span>
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                                isDone
                                  ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                                  : 'border-slate-600 hover:border-slate-400'
                              }`}
                            >
                              {isDone && <CheckCircle2 className="w-3 h-3" />}
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed">{m.description}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Resume Hook */}
                <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-xl p-3.5 text-xs text-slate-300 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-indigo-300 flex items-center gap-1.5">
                    <Award className="w-3 h-3" /> Exact Resume &amp; Interview Pitch Bullet:
                  </span>
                  <p className="text-slate-200 italic font-mono text-[11px] leading-relaxed">
                    "{project.resumePitchBullet}"
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
