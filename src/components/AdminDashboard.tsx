import React, { useState } from 'react';
import { Shield, Users, Briefcase, Award, Plus, Trash2, CheckCircle2, Search, Filter, RefreshCw, Key, UserCheck, Star } from 'lucide-react';
import { Internship, StudentProfile, UserStats, AuthUser } from '../types';
import { PREDEFINED_USERS } from '../data/userAccounts';

interface AdminDashboardProps {
  currentUser: AuthUser;
  internships: Internship[];
  onAddInternship: (internship: Internship) => void;
  onDeleteInternship: (id: string) => void;
  onResetMockData: () => void;
  stats: UserStats;
  profile: StudentProfile;
}

export function AdminDashboard({
  currentUser,
  internships,
  onAddInternship,
  onDeleteInternship,
  onResetMockData,
  stats,
  profile,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'internships' | 'students' | 'accounts'>('internships');
  const [searchTerm, setSearchTerm] = useState('');
  const [accountSearch, setAccountSearch] = useState('');
  const [isAddingInternship, setIsAddingInternship] = useState(false);

  // New Internship form state
  const [newTitle, setNewTitle] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newLocation, setNewLocation] = useState('Remote');
  const [newStipend, setNewStipend] = useState('$40 - $55 / hr');
  const [newSkills, setNewSkills] = useState('TypeScript, React, Node.js');
  const [newCategory, setNewCategory] = useState('Software Engineering');
  const [newDuration, setNewDuration] = useState('12 weeks (Summer 2027)');

  const handleCreateInternship = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newCompany.trim()) return;

    const skillArray = newSkills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const created: Internship = {
      id: `intern_custom_${Date.now()}`,
      title: newTitle.trim(),
      company: newCompany.trim(),
      companyLogo: newCompany.trim().slice(0, 2).toUpperCase(),
      location: newLocation,
      workplaceType: newLocation.toLowerCase().includes('remote') ? 'Remote' : 'Hybrid',
      stipend: newStipend.trim() || '$40 - $50 / hr',
      duration: newDuration,
      category: newCategory,
      requiredSkills: skillArray.length > 0 ? skillArray : ['TypeScript', 'Git'],
      preferredSkills: ['Agile', 'Docker'],
      description: `Newly published enterprise role by ${newCompany}. Opportunity to work directly on high-scale distributed client & server architectures.`,
      applicationDeadline: 'Rolling Admissions',
      matchScore: 88,
      matchReasons: ['Skills directly match student profile preferences.'],
    };

    onAddInternship(created);
    setIsAddingInternship(false);
    setNewTitle('');
    setNewCompany('');
  };

  const filteredInternships = internships.filter(
    (item) =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.requiredSkills.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Admin Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/40 border border-amber-500/30 text-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-slate-100">Administrator Command Center</h2>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Ann@321 Verified
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Logged in as <span className="text-slate-300 font-semibold">{currentUser.email}</span>. Manage verified roles, review student telemetry, and control launchpad data.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onResetMockData}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            title="Reset to default mock internships and sample student records"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>

      {/* Admin Section Tabs */}
      <div className="flex space-x-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('internships')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'internships'
              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30 shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>Internship Catalog ({internships.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('students')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'students'
              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30 shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Active Student Dossier</span>
        </button>

        <button
          onClick={() => setActiveTab('accounts')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'accounts'
              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30 shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Key className="w-3.5 h-3.5" />
          <span>Platform Accounts ({PREDEFINED_USERS.length})</span>
        </button>
      </div>

      {/* TAB 1: Internship Catalog Management */}
      {activeTab === 'internships' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter by company, title, or skills..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* Add New Internship Trigger */}
            <button
              onClick={() => setIsAddingInternship(!isAddingInternship)}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              <span>Publish New Internship</span>
            </button>
          </div>

          {/* Form to Add New Internship */}
          {isAddingInternship && (
            <form
              onSubmit={handleCreateInternship}
              className="p-5 rounded-xl bg-slate-900 border border-amber-500/40 space-y-4 animate-in fade-in duration-200"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Add Role to Student Matcher
                </h3>
                <span className="text-[10px] text-slate-400">Will be scored against student profiles instantly</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Job Title *</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g., Backend Systems Intern"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                    placeholder="e.g., Datadog, Stripe, NASA"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Location / Workplace</label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="e.g., Remote / San Francisco, CA"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Estimated Stipend</label>
                  <input
                    type="text"
                    value={newStipend}
                    onChange={(e) => setNewStipend(e.target.value)}
                    placeholder="e.g., $45 - $60 / hr"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">Required Skills (Comma separated)</label>
                  <input
                    type="text"
                    value={newSkills}
                    onChange={(e) => setNewSkills(e.target.value)}
                    placeholder="e.g., TypeScript, React, PostgreSQL, Docker"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingInternship(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow cursor-pointer"
                >
                  Save & Publish Role
                </button>
              </div>
            </form>
          )}

          {/* List of Internships */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden divide-y divide-slate-800">
            {filteredInternships.map((intern) => (
              <div key={intern.id} className="p-4 flex items-center justify-between hover:bg-slate-800/40 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-slate-100">{intern.title}</span>
                    <span className="text-xs text-slate-400">at</span>
                    <span className="text-xs font-semibold text-sky-400">{intern.company}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {intern.location}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                    <span className="text-emerald-400 font-medium">{intern.stipend}</span>
                    <span>•</span>
                    <span>{intern.requiredSkills.join(', ')}</span>
                  </div>
                </div>

                <button
                  onClick={() => onDeleteInternship(intern.id)}
                  className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  title="Remove this role from matching pool"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Student Dossier Review */}
      {activeTab === 'students' && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-100">Live Active Candidate Profile</h3>
              <p className="text-xs text-slate-400">Reviewing currently loaded student state in the platform</p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Candidate Ready</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400 block mb-1">Student Name</span>
              <span className="font-bold text-slate-200 text-sm">{profile.name}</span>
              <span className="text-slate-400 block mt-0.5">{profile.university} • {profile.major}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400 block mb-1">Target Track</span>
              <span className="font-bold text-sky-400 text-sm">{profile.targetRole}</span>
              <span className="text-slate-400 block mt-0.5">{profile.skills.length} Technical Skills Logged</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400 block mb-1">Platform Telemetry</span>
              <span className="font-bold text-amber-400 text-sm">Level {stats.level} ({stats.xp} XP)</span>
              <span className="text-slate-400 block mt-0.5">{stats.dailyStreak} Day Streak • {stats.quizzesCompleted} Quizzes Taken</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Predefined Platform User Accounts Directory */}
      {activeTab === 'accounts' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={accountSearch}
                onChange={(e) => setAccountSearch(e.target.value)}
                placeholder="Search by username, name, level, or track..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div className="text-xs text-slate-400">
              Showing {PREDEFINED_USERS.length} configured credentials across Levels 1 to 5
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden divide-y divide-slate-800">
            {PREDEFINED_USERS.filter(
              (acc) =>
                acc.username.toLowerCase().includes(accountSearch.toLowerCase()) ||
                acc.user.name.toLowerCase().includes(accountSearch.toLowerCase()) ||
                acc.levelTitle.toLowerCase().includes(accountSearch.toLowerCase()) ||
                acc.profile.targetRole.toLowerCase().includes(accountSearch.toLowerCase())
            ).map((acc) => (
              <div key={acc.username} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-800/40 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-slate-100">{acc.user.name}</span>
                    <span className="text-xs text-slate-400">({acc.user.email})</span>
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                        acc.user.role === 'admin'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-sky-500/10 text-sky-300 border-sky-500/30'
                      }`}
                    >
                      {acc.user.role === 'admin' ? 'Administrator' : `Level ${acc.level}: ${acc.levelTitle}`}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 font-medium">
                    {acc.profile.targetRole} • {acc.profile.university}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {acc.stats.xp} XP • {acc.stats.dailyStreak} day streak • {acc.stats.quizzesCompleted} quizzes completed
                  </div>
                </div>

                <div className="flex items-center space-x-3 bg-slate-950/80 px-3 py-2 rounded-xl border border-slate-800 self-start md:self-auto">
                  <div className="text-xs font-mono">
                    <span className="text-slate-400 text-[10px] block">Username</span>
                    <span className="text-sky-300 font-bold select-all">{acc.username}</span>
                  </div>
                  <div className="h-6 w-px bg-slate-800" />
                  <div className="text-xs font-mono">
                    <span className="text-slate-400 text-[10px] block">Password</span>
                    <span className="text-emerald-300 font-bold select-all">{acc.password}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
