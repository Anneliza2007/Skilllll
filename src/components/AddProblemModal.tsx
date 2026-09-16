import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Sparkles,
  BookOpen,
  Code2,
  AlertCircle,
  CheckCircle2,
  Layers,
  Wand2,
} from 'lucide-react';
import { SkillTutorChallenge, SkillTutorTestCase } from '../types';

interface AddProblemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveProblem: (challenge: SkillTutorChallenge) => void;
  initialChallenge?: SkillTutorChallenge | null;
}

export function AddProblemModal({
  isOpen,
  onClose,
  onSaveProblem,
  initialChallenge,
}: AddProblemModalProps) {
  const [title, setTitle] = useState(initialChallenge?.title || '');
  const [topic, setTopic] = useState(initialChallenge?.topic || 'Algorithms & Data Structures');
  const [difficulty, setDifficulty] = useState<
    'Conceptual Foundational' | 'Intermediate Architecture' | 'Advanced Trade-offs'
  >(initialChallenge?.difficulty || 'Intermediate Architecture');
  const [relatedRole, setRelatedRole] = useState(
    initialChallenge?.relatedRole || 'Software Engineer Candidate'
  );
  const [description, setDescription] = useState(
    initialChallenge?.conceptualScenario || ''
  );
  const [promptQuestion, setPromptQuestion] = useState(
    initialChallenge?.promptQuestion || ''
  );
  const [inputFormat, setInputFormat] = useState(
    initialChallenge?.inputFormat || 'First line contains N, followed by input elements on subsequent lines.'
  );
  const [outputFormat, setOutputFormat] = useState(
    initialChallenge?.outputFormat || 'Print the computed solution value on a single line.'
  );
  const [constraints, setConstraints] = useState(
    initialChallenge?.constraints || '1 <= N <= 10^5, Time Limit: 2.0s, Auxiliary Space: O(1)'
  );
  const [testCases, setTestCases] = useState<SkillTutorTestCase[]>(
    initialChallenge?.testCases || [
      { id: 'tc1', input: '5\n1 2 3 4 5', expectedOutput: '15', explanation: 'Sample sum test' },
      { id: 'tc2', input: '3\n10 20 30', expectedOutput: '60', explanation: 'Sample test 2' },
    ]
  );
  const [pythonStarter, setPythonStarter] = useState(
    initialChallenge?.starterCode?.python ||
      `import sys\n\ndef solve():\n    lines = sys.stdin.read().split()\n    if not lines:\n        return\n    # Process input and implement solution based on problem statement\n    print("Output")\n\nif __name__ == '__main__':\n    solve()\n`
  );
  const [cStarter, setCStarter] = useState(
    initialChallenge?.starterCode?.c ||
      `#include <stdio.h>\n#include <stdlib.h>\n\nint main() {\n    // Read input and implement solution\n    printf("Output\\n");\n    return 0;\n}\n`
  );
  const [cppStarter, setCppStarter] = useState(
    initialChallenge?.starterCode?.cpp ||
      `#include <iostream>\n#include <vector>\n\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    // Read input and implement solution\n    cout << "Output\\n";\n    return 0;\n}\n`
  );

  const [activeCodeTab, setActiveCodeTab] = useState<'python' | 'c' | 'cpp'>('python');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [showAiInput, setShowAiInput] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddTestCase = () => {
    const newId = `tc_${Date.now()}`;
    setTestCases([
      ...testCases,
      { id: newId, input: '', expectedOutput: '', explanation: '' },
    ]);
  };

  const handleRemoveTestCase = (index: number) => {
    if (testCases.length <= 1) return;
    setTestCases(testCases.filter((_, i) => i !== index));
  };

  const handleUpdateTestCase = (index: number, field: keyof SkillTutorTestCase, value: string) => {
    const updated = [...testCases];
    updated[index] = { ...updated[index], [field]: value };
    setTestCases(updated);
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiGenerating(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/skilltutor/generate-problem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promptText: aiPrompt.trim(),
          difficulty,
          topic,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        const p = data.data;
        setTitle(p.title || aiPrompt);
        if (p.topic) setTopic(p.topic);
        if (p.difficulty) setDifficulty(p.difficulty);
        setDescription(p.description || '');
        setPromptQuestion(
          p.description
            ? `Formulate the invariant and algorithmic logic to solve: ${p.title}`
            : ''
        );
        if (p.inputFormat) setInputFormat(p.inputFormat);
        if (p.outputFormat) setOutputFormat(p.outputFormat);
        if (p.constraints) setConstraints(p.constraints);
        if (p.testCases && Array.isArray(p.testCases)) {
          setTestCases(p.testCases);
        }
        if (p.starterCode) {
          if (p.starterCode.python) setPythonStarter(p.starterCode.python);
          if (p.starterCode.c) setCStarter(p.starterCode.c);
          if (p.starterCode.cpp) setCppStarter(p.starterCode.cpp);
        }
        setShowAiInput(false);
      } else {
        setErrorMsg('Failed to generate problem statement with AI. Please try again.');
      }
    } catch (err: any) {
      console.error('AI problem generation error:', err);
      setErrorMsg('Network error while generating problem with AI.');
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleLoadSample = (sampleType: 'twosum' | 'binarysearch' | 'reversestring') => {
    if (sampleType === 'twosum') {
      setTitle('Two Sum - Pair Invariant in Sorted Stream');
      setTopic('Algorithmic Invariants & Pointers');
      setDifficulty('Conceptual Foundational');
      setDescription(
        'Given a sorted array of integers numbers and an integer target, return the 1-based indices of the two numbers such that they add up to target. You must solve this with O(1) auxiliary memory using two-pointer convergence.'
      );
      setPromptQuestion('Why does sum(L, R) > target guarantee that R cannot pair with any valid index?');
      setInputFormat('First line: N and Target.\nSecond line: N space-separated sorted integers.');
      setOutputFormat('Print two space-separated 1-based indices.');
      setConstraints('2 <= N <= 10^5, -10^9 <= numbers[i] <= 10^9, Auxiliary Space: O(1)');
      setTestCases([
        { id: 'tc1', input: '4 9\n2 7 11 15', expectedOutput: '1 2', explanation: '2 + 7 = 9 at indices 1 and 2' },
        { id: 'tc2', input: '3 6\n2 3 4', expectedOutput: '1 3', explanation: '2 + 4 = 6 at indices 1 and 3' },
      ]);
      setPythonStarter(
        `import sys\n\ndef solve():\n    lines = sys.stdin.read().split()\n    if not lines:\n        return\n    n = int(lines[0])\n    target = int(lines[1])\n    nums = [int(x) for x in lines[2:n+2]]\n    \n    left, right = 0, n - 1\n    while left < right:\n        cur = nums[left] + nums[right]\n        if cur == target:\n            print(f"{left + 1} {right + 1}")\n            return\n        elif cur < target:\n            left += 1\n        else:\n            right -= 1\n\nif __name__ == '__main__':\n    solve()\n`
      );
      setCStarter(
        `#include <stdio.h>\n#include <stdlib.h>\n\nint main() {\n    int n;\n    long long target;\n    if (scanf("%d %lld", &n, &target) != 2) return 0;\n    long long *nums = (long long*)malloc(n * sizeof(long long));\n    for (int i = 0; i < n; i++) {\n        scanf("%lld", &nums[i]);\n    }\n    int left = 0, right = n - 1;\n    while (left < right) {\n        long long s = nums[left] + nums[right];\n        if (s == target) {\n            printf("%d %d\\n", left + 1, right + 1);\n            free(nums);\n            return 0;\n        } else if (s < target) {\n            left++;\n        } else {\n            right--;\n        }\n    }\n    free(nums);\n    return 0;\n}\n`
      );
      setCppStarter(
        `#include <iostream>\n#include <vector>\n\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    int n;\n    long long target;\n    if (!(cin >> n >> target)) return 0;\n    vector<long long> nums(n);\n    for (int i = 0; i < n; i++) cin >> nums[i];\n    \n    int left = 0, right = n - 1;\n    while (left < right) {\n        long long s = nums[left] + nums[right];\n        if (s == target) {\n            cout << (left + 1) << " " << (right + 1) << "\\n";\n            return 0;\n        } else if (s < target) {\n            left++;\n        } else {\n            right--;\n        }\n    }\n    return 0;\n}\n`
      );
    } else if (sampleType === 'binarysearch') {
      setTitle('Search in Rotated Sorted Array');
      setTopic('Divide & Conquer & Logarithmic Traversal');
      setDifficulty('Intermediate Architecture');
      setDescription(
        'Given a sorted array of distinct integers that was rotated at an unknown pivot index, and a target value, return the 0-based index of target, or -1 if not found. Run in O(log N) time.'
      );
      setPromptQuestion('How do you determine which half of the rotated array is strictly monotonically increasing?');
      setInputFormat('Line 1: N and Target.\nLine 2: N space-separated integers.');
      setOutputFormat('Print 0-based index or -1.');
      setConstraints('1 <= N <= 10^5, Time Limit: O(log N)');
      setTestCases([
        { id: 'tc1', input: '7 0\n4 5 6 7 0 1 2', expectedOutput: '4', explanation: '0 is at index 4' },
        { id: 'tc2', input: '7 3\n4 5 6 7 0 1 2', expectedOutput: '-1', explanation: '3 does not exist' },
      ]);
    } else if (sampleType === 'reversestring') {
      setTitle('String Token Inversion & In-Place Pointer Swap');
      setTopic('Memory Models & Pointers');
      setDifficulty('Conceptual Foundational');
      setDescription(
        'Given a single line string of characters, reverse the characters in-place using O(1) auxiliary memory.'
      );
      setPromptQuestion('Why is in-place string mutation memory-safe in C/C++ buffers versus immutable strings in Python?');
      setInputFormat('A single line of text.');
      setOutputFormat('Reversed text line.');
      setConstraints('1 <= length <= 10^5, Space: O(1)');
      setTestCases([
        { id: 'tc1', input: 'hello', expectedOutput: 'olleh', explanation: 'Reversed hello' },
        { id: 'tc2', input: 'SkillTutor', expectedOutput: 'rotuTllikS', explanation: 'Reversed SkillTutor' },
      ]);
    }
  };

  const handleSave = () => {
    if (!title.trim()) {
      setErrorMsg('Please enter a problem title.');
      return;
    }
    if (!description.trim()) {
      setErrorMsg('Please enter a problem description / statement.');
      return;
    }

    const newChallenge: SkillTutorChallenge = {
      id: initialChallenge?.id || `custom_challenge_${Date.now()}`,
      title: title.trim(),
      topic: topic.trim() || 'Custom Problem',
      difficulty,
      conceptualScenario: description.trim(),
      promptQuestion:
        promptQuestion.trim() ||
        `Explain the algorithmic invariants and trade-offs required to solve ${title.trim()}.`,
      keyPrinciples: [
        'Problem Formulation & Invariant Design',
        'Time & Space Asymptotic Complexity',
        'Edge Case & Boundary Safety',
      ],
      exampleThoughtPrompt: `How would you structure your first-principles approach for ${title.trim()}?`,
      relatedRole,
      isCustom: true,
      inputFormat,
      outputFormat,
      constraints,
      testCases,
      starterCode: {
        python: pythonStarter,
        c: cStarter,
        cpp: cppStarter,
      },
    };

    onSaveProblem(newChallenge);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                <span>{initialChallenge ? 'Edit Problem Statement' : 'Add Custom Problem Statement'}</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Python • C • C++
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Define the problem details, constraints, test cases, and starter templates. SkillTutor AI will assist based on this statement.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs text-slate-300 flex-1">
          {errorMsg && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/50 rounded-xl text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick AI Generator & Sample Presets Bar */}
          <div className="p-3.5 bg-slate-950/90 rounded-xl border border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Quick Setup Accelerators:</span>
              </span>
              <button
                type="button"
                onClick={() => setShowAiInput(!showAiInput)}
                className="px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>{showAiInput ? 'Close AI Draft' : 'Draft with AI'}</span>
              </button>
            </div>

            {/* AI Input Form */}
            {showAiInput && (
              <div className="pt-2 border-t border-slate-800/80 space-y-2 animate-in fade-in duration-150">
                <p className="text-[11px] text-slate-400">
                  Enter a topic or problem idea (e.g. <em>"Count islands in grid with BFS"</em>, <em>"LRU Cache in C++"</em>) and SkillTutor AI will draft the problem, constraints, and test cases:
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="e.g. Kadane's algorithm maximum subarray sum"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAiGenerate();
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAiGenerate}
                    disabled={isAiGenerating || !aiPrompt.trim()}
                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-sky-500 text-slate-950 font-bold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-md"
                  >
                    {isAiGenerating ? (
                      <>
                        <span className="w-3 h-3 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        <span>Drafting...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Generate</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Template Presets */}
            <div className="flex items-center gap-2 flex-wrap pt-1">
              <span className="text-[10px] text-slate-500 font-semibold">Or load template:</span>
              <button
                type="button"
                onClick={() => handleLoadSample('twosum')}
                className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 text-[11px] cursor-pointer"
              >
                Two Pointers
              </button>
              <button
                type="button"
                onClick={() => handleLoadSample('binarysearch')}
                className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 text-[11px] cursor-pointer"
              >
                Rotated Binary Search
              </button>
              <button
                type="button"
                onClick={() => handleLoadSample('reversestring')}
                className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 text-[11px] cursor-pointer"
              >
                In-Place String Reversal
              </button>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Problem Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Find Peak Element in O(log N)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Topic / Category</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Binary Search & Divide and Conquer"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Difficulty Level</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="Conceptual Foundational">Conceptual Foundational (Easy)</option>
                <option value="Intermediate Architecture">Intermediate Architecture (Medium)</option>
                <option value="Advanced Trade-offs">Advanced Trade-offs (Hard)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Target Engineering Role</label>
              <input
                type="text"
                value={relatedRole}
                onChange={(e) => setRelatedRole(e.target.value)}
                placeholder="e.g. Systems Engineer / Backend Intern"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Description / Problem Statement */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Problem Statement / Description <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="State the technical scenario, goal, inputs, expected behaviors, and algorithmic constraints clearly..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500 font-mono leading-relaxed"
            />
          </div>

          {/* Input & Output Format */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Input Format (stdin)</label>
              <textarea
                rows={2}
                value={inputFormat}
                onChange={(e) => setInputFormat(e.target.value)}
                placeholder="e.g. Line 1: N, Line 2: array elements"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Output Format (stdout)</label>
              <textarea
                rows={2}
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value)}
                placeholder="e.g. Print single integer answer"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          {/* Constraints */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Constraints &amp; Invariants</label>
            <input
              type="text"
              value={constraints}
              onChange={(e) => setConstraints(e.target.value)}
              placeholder="e.g. 1 <= N <= 10^5, Time Limit: 1.0s, Memory Limit: 256MB"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          {/* Test Cases Section */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Sample Test Cases ({testCases.length})</span>
              </span>
              <button
                type="button"
                onClick={handleAddTestCase}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Test Case</span>
              </button>
            </div>

            <div className="space-y-3">
              {testCases.map((tc, idx) => (
                <div
                  key={tc.id || idx}
                  className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 relative"
                >
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 border-b border-slate-900 pb-1">
                    <span>Test Case #{idx + 1}</span>
                    {testCases.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTestCase(idx)}
                        className="text-rose-400 hover:text-rose-300 cursor-pointer p-0.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-mono block mb-0.5">Input (stdin):</span>
                      <textarea
                        rows={2}
                        value={tc.input}
                        onChange={(e) => handleUpdateTestCase(idx, 'input', e.target.value)}
                        placeholder="e.g. 5\n1 2 3 4 5"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 font-mono text-[11px] text-slate-200 outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-mono block mb-0.5">Expected Output (stdout):</span>
                      <textarea
                        rows={2}
                        value={tc.expectedOutput}
                        onChange={(e) => handleUpdateTestCase(idx, 'expectedOutput', e.target.value)}
                        placeholder="e.g. 15"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 font-mono text-[11px] text-slate-200 outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Starter Code Templates for Python, C, C++ */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-sky-400" />
                <span>Compiler Starter Boilerplates</span>
              </span>
              <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveCodeTab('python')}
                  className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                    activeCodeTab === 'python'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Python
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCodeTab('c')}
                  className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                    activeCodeTab === 'c'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  C (GCC)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCodeTab('cpp')}
                  className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                    activeCodeTab === 'cpp'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  C++ (G++)
                </button>
              </div>
            </div>

            {activeCodeTab === 'python' && (
              <textarea
                rows={6}
                value={pythonStarter}
                onChange={(e) => setPythonStarter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-slate-200 outline-none focus:border-indigo-500"
              />
            )}
            {activeCodeTab === 'c' && (
              <textarea
                rows={6}
                value={cStarter}
                onChange={(e) => setCStarter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-slate-200 outline-none focus:border-indigo-500"
              />
            )}
            {activeCodeTab === 'cpp' && (
              <textarea
                rows={6}
                value={cppStarter}
                onChange={(e) => setCppStarter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-slate-200 outline-none focus:border-indigo-500"
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-400 text-slate-950 hover:opacity-95 shadow-md shadow-indigo-500/20 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Save &amp; Select Problem</span>
          </button>
        </div>
      </div>
    </div>
  );
}
