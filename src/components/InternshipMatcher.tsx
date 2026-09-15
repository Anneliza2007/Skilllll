import { useState } from 'react';
import {
  Briefcase,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Send,
  Sparkles,
  Zap,
  ArrowUpDown,
  BookOpen,
  Info,
} from 'lucide-react';
import { Internship, StudentProfile } from '../types';

interface InternshipMatcherProps {
  internships: Internship[];
  profile: StudentProfile;
  isAiMatching: boolean;
  onRefreshAiMatch: () => void;
  onToggleSave: (id: string) => void;
  onToggleApply: (id: string) => void;
  onSelectWeakTopicForQuiz: (skill: string) => void;
  onOptimizeForRole: (roleTitle: string) => void;
}

export function InternshipMatcher({
  internships,
  profile,
  isAiMatching,
  onRefreshAiMatch,
  onToggleSave,
  onToggleApply,
  onSelectWeakTopicForQuiz,
  onOptimizeForRole,
}: InternshipMatcherProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedWorkplace, setSelectedWorkplace] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'match' | 'stipend'>('match');
  const [selectedInternshipDetail, setSelectedInternshipDetail] = useState<Internship | null>(null);

  // Filter and sort internships
  const filtered = internships
    .filter((job) => {
      const matchesSearch =
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.requiredSkills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === 'All' || job.category === selectedCategory;
      const matchesWorkplace = selectedWorkplace === 'All' || job.workplaceType === selectedWorkplace;
      return matchesSearch && matchesCategory && matchesWorkplace;
    })
    .sort((a, b) => {
      if (sortBy === 'match') {
        return (b.matchScore || 0) - (a.matchScore || 0);
      }
      return 0;
    });

  const categories = ['All', 'Full-Stack', 'Frontend', 'Backend', 'AI / Machine Learning', 'DevOps & Systems'];
  const userSkillNames = new Set(profile.skills.map((s) => s.name.toLowerCase()));

  return (
    <div className="space-y-6">
      {/* Top Banner / Match Summary */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Sparkles className="w-3.5 h-3.5" />
                Ranked for {profile.name}
              </span>
              <span className="text-xs text-slate-400">
                Targeting: <strong className="text-slate-200">{profile.targetRole}</strong>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
              Personalized Internship Skill Matcher
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Roles are dynamically scored against your {profile.skills.length} skills and career interests.
              Identify skill gaps and take quizzes to turn weak topics into offer-winning strengths.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="ai-rerank-button"
              onClick={onRefreshAiMatch}
              disabled={isAiMatching}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md cursor-pointer ${
                isAiMatching
                  ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-sky-500/20'
              }`}
            >
              <Sparkles className={`w-4 h-4 ${isAiMatching ? 'animate-spin' : ''}`} />
              <span>{isAiMatching ? 'Analyzing Matches...' : 'Re-rank with Gemini AI'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by role, company, or skill (e.g., React, Stripe, Docker)..."
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={selectedWorkplace}
              onChange={(e) => setSelectedWorkplace(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none"
            >
              <option value="All">All Locations</option>
              <option value="Remote">Remote Only</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Onsite">Onsite</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none"
            >
              <option value="match">Sort: Highest Match %</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 no-scrollbar text-xs">
          <span className="text-slate-400 font-medium whitespace-nowrap mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Category:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Internships Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((job, jIdx) => {
          const score = job.matchScore || 75;
          const scoreColor =
            score >= 85
              ? 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10'
              : score >= 70
              ? 'text-sky-400 border-sky-500/40 bg-sky-500/10'
              : 'text-amber-400 border-amber-500/40 bg-amber-500/10';

          return (
            <div
              key={`${job.id}-${jIdx}`}
              id={`internship-card-${job.id}`}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 flex flex-col justify-between transition-all duration-200 shadow-md hover:shadow-lg hover:shadow-sky-500/5 group"
            >
              <div>
                {/* Header: Company & Score */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-950 border border-slate-700 flex items-center justify-center font-bold text-slate-100 text-sm shadow">
                      {job.companyLogo}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-100 group-hover:text-sky-300 transition-colors">
                        {job.title}
                      </h3>
                      <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="font-semibold text-slate-300">{job.company}</span>
                        <span>•</span>
                        <span>{job.location}</span>
                        <span>•</span>
                        <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[11px] text-slate-300">
                          {job.workplaceType}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Match Badge */}
                  <div
                    className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-xl border font-bold text-xs ${scoreColor}`}
                  >
                    <span className="text-base leading-none font-extrabold">{score}%</span>
                    <span className="text-[9px] uppercase tracking-wider font-semibold opacity-90">Fit Match</span>
                  </div>
                </div>

                {/* Stipend & Duration */}
                <div className="flex flex-wrap gap-2 text-xs text-slate-300 mb-3 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                  <span className="font-medium text-emerald-300">{job.stipend}</span>
                  <span className="text-slate-600">•</span>
                  <span>{job.duration}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-400">Apply by {job.applicationDeadline}</span>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                  {job.description}
                </p>

                {/* Skills Analysis */}
                <div className="space-y-2 mb-4">
                  <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                    Skill Alignment:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {job.requiredSkills.map((skill) => {
                      const hasSkill = userSkillNames.has(skill.toLowerCase());
                      return (
                        <span
                          key={skill}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${
                            hasSkill
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                              : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                          }`}
                        >
                          {hasSkill ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <AlertCircle className="w-3 h-3 text-amber-400" />
                          )}
                          <span>{skill}</span>
                          {!hasSkill && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectWeakTopicForQuiz(skill);
                              }}
                              title={`Take diagnostic quiz on ${skill} to fix this gap`}
                              className="ml-1 text-[10px] px-1 py-0.2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 rounded font-semibold transition-colors cursor-pointer"
                            >
                              Quiz
                            </button>
                          )}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Match Reason Snippet */}
                {job.matchReasons && job.matchReasons.length > 0 && (
                  <div className="bg-sky-950/20 border border-sky-500/20 rounded-lg p-2.5 mb-4 text-xs text-sky-200 flex items-start gap-2">
                    <Zap className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                    <p className="line-clamp-2">{job.matchReasons[0]}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onToggleSave(job.id)}
                    className={`p-2 rounded-lg text-xs font-medium transition-colors border cursor-pointer ${
                      job.isSaved
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                    title={job.isSaved ? 'Remove from saved' : 'Save for later'}
                  >
                    {job.isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => onToggleApply(job.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border flex items-center gap-1.5 cursor-pointer ${
                      job.isApplied
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                  >
                    <Send className="w-3 h-3" />
                    <span>{job.isApplied ? 'Applied ✓' : 'Mark Applied'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onOptimizeForRole(`${job.title} at ${job.company}`)}
                    className="px-2.5 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                    title="Tailor your resume & LinkedIn specifically for this role"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Optimize Resume</span>
                  </button>

                  <button
                    onClick={() => setSelectedInternshipDetail(job)}
                    className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>Details</span>
                    <Info className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Details Modal */}
      {selectedInternshipDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-800 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-lg text-white">
                  {selectedInternshipDetail.companyLogo}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-100">{selectedInternshipDetail.title}</h2>
                  <p className="text-xs text-slate-400">
                    {selectedInternshipDetail.company} • {selectedInternshipDetail.location} ({selectedInternshipDetail.workplaceType})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedInternshipDetail(null)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-400 block">Stipend</span>
                  <span className="font-bold text-emerald-400">{selectedInternshipDetail.stipend}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Duration</span>
                  <span className="font-semibold text-slate-200">{selectedInternshipDetail.duration}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Fit Score</span>
                  <span className="font-bold text-sky-400">{selectedInternshipDetail.matchScore || 85}% Alignment</span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-200 text-sm mb-1.5">Role Overview</h4>
                <p className="text-slate-400 leading-relaxed">{selectedInternshipDetail.description}</p>
              </div>

              {selectedInternshipDetail.matchReasons && selectedInternshipDetail.matchReasons.length > 0 && (
                <div>
                  <h4 className="font-semibold text-slate-200 text-sm mb-1.5 flex items-center gap-1.5 text-sky-300">
                    <Sparkles className="w-4 h-4" /> Why You Are a Strong Fit
                  </h4>
                  <ul className="space-y-1.5 pl-2">
                    {selectedInternshipDetail.matchReasons.map((reason, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-slate-300">
                        <span className="text-sky-400 font-bold">•</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedInternshipDetail.missingSkills && selectedInternshipDetail.missingSkills.length > 0 && (
                <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-3.5 space-y-2">
                  <h4 className="font-semibold text-amber-300 text-xs flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" /> Growth Topics for This Role
                  </h4>
                  <p className="text-amber-200/90 text-xs">
                    You haven't added or practiced these required skills yet. Taking quick diagnostic quizzes can boost your match score:
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {selectedInternshipDetail.missingSkills.map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          setSelectedInternshipDetail(null);
                          onSelectWeakTopicForQuiz(s);
                        }}
                        className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <BookOpen className="w-3 h-3" />
                        <span>Practice {s} Quiz (+50 XP)</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedInternshipDetail.prepTip && (
                <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-xl p-3.5 text-xs">
                  <h4 className="font-semibold text-indigo-300 mb-1 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-indigo-400" /> Recruiter &amp; Technical Interview Advice
                  </h4>
                  <p className="text-slate-300 leading-relaxed">{selectedInternshipDetail.prepTip}</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between">
              <button
                onClick={() => setSelectedInternshipDetail(null)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                Close
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const role = `${selectedInternshipDetail.title} at ${selectedInternshipDetail.company}`;
                    setSelectedInternshipDetail(null);
                    onOptimizeForRole(role);
                  }}
                  className="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Generate Tailored Resume
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
