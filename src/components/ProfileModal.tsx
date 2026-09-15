import { useState } from 'react';
import { X, Plus, Trash2, Check, Sparkles, BookOpen, Briefcase, GraduationCap, ArrowRight } from 'lucide-react';
import { StudentProfile, StudentSkill, SkillLevel } from '../types';
import { PRESET_PROFILES } from '../data/mockData';

interface ProfileModalProps {
  profile: StudentProfile;
  isOpen: boolean;
  onClose: () => void;
  onSaveProfile: (updated: StudentProfile) => void;
  onSelectPreset: (preset: StudentProfile) => void;
}

const COMMON_SKILL_SUGGESTIONS = [
  'TypeScript', 'React', 'Node.js', 'Python', 'SQL', 'PostgreSQL', 'Docker',
  'Git & GitHub', 'REST APIs', 'Tailwind CSS', 'Next.js', 'FastAPI', 'PyTorch',
  'Pandas & NumPy', 'Go (Golang)', 'Kubernetes', 'AWS', 'Linux / Bash',
  'GraphQL', 'Redis', 'Java', 'C++', 'System Design', 'Algorithms & Math'
];

const COMMON_INTERESTS = [
  'Full-Stack Development', 'AI & Machine Learning', 'Distributed Systems',
  'Cloud Infrastructure', 'Developer Tooling', 'Data Engineering', 'Cybersecurity',
  'Open Source', 'Fintech', 'Mobile Apps (React Native/iOS)', 'UI/UX Design Systems'
];

export function ProfileModal({
  profile,
  isOpen,
  onClose,
  onSaveProfile,
  onSelectPreset,
}: ProfileModalProps) {
  const [formData, setFormData] = useState<StudentProfile>({ ...profile });
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState<StudentSkill['category']>('Frontend');
  const [newSkillLevel, setNewSkillLevel] = useState<SkillLevel>('Intermediate');
  const [customInterest, setCustomInterest] = useState('');
  const [newBullet, setNewBullet] = useState('');

  if (!isOpen) return null;

  const handleAddSkill = () => {
    if (!newSkillName.trim()) return;
    const exists = formData.skills.some(
      (s) => s.name.toLowerCase() === newSkillName.trim().toLowerCase()
    );
    if (exists) return;

    const baseScores: Record<SkillLevel, number> = {
      Beginner: 40,
      Intermediate: 65,
      Advanced: 85,
      Expert: 95,
    };

    const newSkill: StudentSkill = {
      id: 'skill_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      name: newSkillName.trim(),
      category: newSkillCategory,
      level: newSkillLevel,
      masteryScore: baseScores[newSkillLevel],
      quizzesTaken: 0,
    };

    setFormData({
      ...formData,
      skills: [...formData.skills, newSkill],
    });
    setNewSkillName('');
  };

  const handleRemoveSkill = (id: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((s) => s.id !== id),
    });
  };

  const handleUpdateSkillLevel = (id: string, level: SkillLevel) => {
    const baseScores: Record<SkillLevel, number> = {
      Beginner: 40,
      Intermediate: 65,
      Advanced: 85,
      Expert: 95,
    };
    setFormData({
      ...formData,
      skills: formData.skills.map((s) =>
        s.id === id ? { ...s, level, masteryScore: baseScores[level] } : s
      ),
    });
  };

  const handleToggleInterest = (interest: string) => {
    if (formData.interests.includes(interest)) {
      setFormData({
        ...formData,
        interests: formData.interests.filter((i) => i !== interest),
      });
    } else {
      setFormData({
        ...formData,
        interests: [...formData.interests, interest],
      });
    }
  };

  const handleAddCustomInterest = () => {
    if (!customInterest.trim() || formData.interests.includes(customInterest.trim())) return;
    setFormData({
      ...formData,
      interests: [...formData.interests, customInterest.trim()],
    });
    setCustomInterest('');
  };

  const handleAddResumeBullet = () => {
    if (!newBullet.trim()) return;
    setFormData({
      ...formData,
      currentResumeBullets: [...formData.currentResumeBullets, newBullet.trim()],
    });
    setNewBullet('');
  };

  const handleRemoveResumeBullet = (idx: number) => {
    setFormData({
      ...formData,
      currentResumeBullets: formData.currentResumeBullets.filter((_, i) => i !== idx),
    });
  };

  const strongSkillsCount = formData.skills.filter((s) => s.level === 'Advanced' || s.level === 'Expert').length;
  const weakSkillsCount = formData.skills.filter((s) => s.level === 'Beginner' || s.level === 'Intermediate').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div
        id="profile-modal-container"
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Student Profile & Skill Inventory</h2>
              <p className="text-xs text-slate-400">
                Your skills, interests, and background power the internship matcher and quizzes.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets Bar */}
        <div className="px-6 py-2.5 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between gap-2 overflow-x-auto text-xs">
          <span className="text-slate-400 font-medium whitespace-nowrap flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Load Sample Profile:
          </span>
          <div className="flex gap-2">
            {PRESET_PROFILES.map((preset) => (
              <button
                key={preset.label}
                onClick={() => {
                  setFormData({ ...preset.profile });
                  onSelectPreset(preset.profile);
                }}
                className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-medium transition-colors whitespace-nowrap cursor-pointer"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-200">
          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Target Internship Role</label>
              <input
                type="text"
                value={formData.targetRole}
                onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                placeholder="e.g. Full-Stack Software Engineering Intern"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">University / College</label>
              <input
                type="text"
                value={formData.university}
                onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Major / Degree</label>
                <input
                  type="text"
                  value={formData.major}
                  onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Graduation Year</label>
                <input
                  type="text"
                  value={formData.graduationYear}
                  onChange={(e) => setFormData({ ...formData, graduationYear: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Skills Management */}
          <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/40 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-semibold text-slate-100 text-sm flex items-center gap-2">
                  <span>Skills &amp; Proficiencies</span>
                  <span className="text-xs font-normal text-slate-400">({formData.skills.length} total)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  <span className="text-emerald-400 font-medium">{strongSkillsCount} strong skills</span> (used for project ideas) •{' '}
                  <span className="text-amber-400 font-medium">{weakSkillsCount} weak/growth skills</span> (used for diagnostic quizzes)
                </p>
              </div>
            </div>

            {/* Add Skill Row */}
            <div className="flex flex-wrap sm:flex-nowrap gap-2">
              <input
                type="text"
                list="skills-suggestions"
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                placeholder="Add skill (e.g., Docker, SQL, PyTorch)..."
                className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
              />
              <datalist id="skills-suggestions">
                {COMMON_SKILL_SUGGESTIONS.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>

              <select
                value={newSkillCategory}
                onChange={(e) => setNewSkillCategory(e.target.value as any)}
                className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none"
              >
                <option value="Frontend">Frontend</option>
                <option value="Backend">Backend</option>
                <option value="Database">Database</option>
                <option value="DevOps">DevOps</option>
                <option value="AI/Data">AI/Data</option>
                <option value="Language">Language</option>
                <option value="Core CS">Core CS</option>
              </select>

              <select
                value={newSkillLevel}
                onChange={(e) => setNewSkillLevel(e.target.value as SkillLevel)}
                className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none"
              >
                <option value="Beginner">Beginner (Weak)</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced (Strong)</option>
                <option value="Expert">Expert (Strong)</option>
              </select>

              <button
                type="button"
                onClick={handleAddSkill}
                className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            {/* Existing Skills List */}
            <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto p-1">
              {formData.skills.map((skill, idx) => {
                const isStrong = skill.level === 'Advanced' || skill.level === 'Expert';
                return (
                  <div
                    key={`${skill.id || skill.name}-${idx}`}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs ${
                      isStrong
                        ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                        : 'bg-amber-950/30 border-amber-500/30 text-amber-300'
                    }`}
                  >
                    <span className="font-medium text-slate-200">{skill.name}</span>
                    <select
                      value={skill.level}
                      onChange={(e) => handleUpdateSkillLevel(skill.id, e.target.value as SkillLevel)}
                      className="bg-slate-900 border border-slate-700 text-[11px] rounded px-1 py-0.5 text-slate-300 focus:outline-none"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                      <option value="Expert">Expert</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill.id)}
                      className="text-slate-400 hover:text-red-400 transition-colors ml-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interests */}
          <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/40 space-y-3">
            <h3 className="font-semibold text-slate-100 text-sm">Career Interests &amp; Focus Domains</h3>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_INTERESTS.map((interest) => {
                const isSelected = formData.interests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => handleToggleInterest(interest)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-sky-500 text-slate-950 font-semibold shadow-sm'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                    {interest}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={customInterest}
                onChange={(e) => setCustomInterest(e.target.value)}
                placeholder="Add custom interest..."
                className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomInterest();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddCustomInterest}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium cursor-pointer"
              >
                Add Interest
              </button>
            </div>
          </div>

          {/* Experience Summary & Resume Bullets */}
          <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/40 space-y-3">
            <h3 className="font-semibold text-slate-100 text-sm">Experience Summary &amp; Current Resume Bullets</h3>
            <p className="text-xs text-slate-400">
              Provide your current resume bullet points so the AI Resume Optimizer can transform them into high-impact Google XYZ statements.
            </p>
            <textarea
              rows={2}
              value={formData.experienceSummary}
              onChange={(e) => setFormData({ ...formData, experienceSummary: e.target.value })}
              placeholder="Brief summary of projects, past clubs, or coursework..."
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">Resume Bullets to Optimize</label>
              {formData.currentResumeBullets.map((bullet, idx) => (
                <div key={idx} className="flex items-start gap-2 bg-slate-900/90 border border-slate-800 rounded-lg p-2 text-xs">
                  <span className="text-sky-400 font-bold mt-0.5">•</span>
                  <input
                    type="text"
                    value={bullet}
                    onChange={(e) => {
                      const updated = [...formData.currentResumeBullets];
                      updated[idx] = e.target.value;
                      setFormData({ ...formData, currentResumeBullets: updated });
                    }}
                    className="flex-1 bg-transparent text-slate-200 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveResumeBullet(idx)}
                    className="text-slate-500 hover:text-red-400 transition-colors p-0.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newBullet}
                  onChange={(e) => setNewBullet(e.target.value)}
                  placeholder="Add a resume bullet point to polish..."
                  className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddResumeBullet();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddResumeBullet}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium cursor-pointer"
                >
                  Add Bullet
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onSaveProfile(formData);
              onClose();
            }}
            className="px-5 py-2 rounded-lg text-xs font-bold bg-sky-500 hover:bg-sky-400 text-slate-950 flex items-center gap-1.5 shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
          >
            <span>Save Profile &amp; Match Internships</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
