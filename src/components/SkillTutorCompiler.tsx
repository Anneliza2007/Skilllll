import React, { useState, useEffect, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { cpp } from '@codemirror/lang-cpp';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view';
import {
  Play,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  Terminal,
  AlertTriangle,
  Lightbulb,
  FileCode2,
  ChevronDown,
  ChevronUp,
  Cpu,
  Layers,
  HelpCircle,
  Copy,
  PlusCircle,
  MessageSquare,
} from 'lucide-react';
import {
  CompilerLanguage,
  SkillTutorChallenge,
  CompilerExecutionResult,
  CompilerAIDiagnostic,
  SignedSnippetToken,
} from '../types';

interface SkillTutorCompilerProps {
  activeChallenge: SkillTutorChallenge;
  onOpenAddProblemModal: () => void;
  onAskCopilotAboutBug?: (diagnostic: CompilerAIDiagnostic, code: string, error: string) => void;
  onShowToast?: (toast: { type: 'success' | 'error' | 'warning' | 'info'; title: string; description?: string }) => void;
  onReportPasteViolation?: (type: string, previewText: string) => void;
  integrityScore?: number;
}

export function SkillTutorCompiler({
  activeChallenge,
  onOpenAddProblemModal,
  onAskCopilotAboutBug,
  onShowToast,
  onReportPasteViolation,
  integrityScore = 100,
}: SkillTutorCompilerProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<CompilerLanguage>('python');
  const [code, setCode] = useState<string>('');
  const [customStdin, setCustomStdin] = useState<string>('');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isDiagnosing, setIsDiagnosing] = useState<boolean>(false);
  const [activeConsoleTab, setActiveConsoleTab] = useState<'testcases' | 'stdin' | 'output'>('testcases');
  const [executionResult, setExecutionResult] = useState<CompilerExecutionResult | null>(null);
  const [aiDiagnostic, setAiDiagnostic] = useState<CompilerAIDiagnostic | null>(null);
  const [isProblemExpanded, setIsProblemExpanded] = useState<boolean>(false);
  const [copiedConsole, setCopiedConsole] = useState<boolean>(false);

  // Default starter code templates for active problem
  const getStarterCode = (lang: CompilerLanguage): string => {
    if (activeChallenge.starterCode?.[lang]) {
      return activeChallenge.starterCode[lang];
    }

    if (lang === 'python') {
      return `# Solution for: ${activeChallenge.title}\nimport sys\n\ndef solve():\n    input_data = sys.stdin.read().split()\n    if not input_data:\n        return\n    # Process input according to problem statement\n    print("Output")\n\nif __name__ == '__main__':\n    solve()\n`;
    } else if (lang === 'c') {
      return `// Solution for: ${activeChallenge.title}\n#include <stdio.h>\n#include <stdlib.h>\n\nint main() {\n    // Implement solution in C (GCC 12)\n    printf("Output\\n");\n    return 0;\n}\n`;
    } else {
      return `// Solution for: ${activeChallenge.title}\n#include <iostream>\n#include <vector>\n\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    // Implement solution in C++17 (G++ 12)\n    cout << "Output\\n";\n    return 0;\n}\n`;
    }
  };

  // Sync starter code when challenge or language changes
  useEffect(() => {
    setCode(getStarterCode(selectedLanguage));
    setExecutionResult(null);
    setAiDiagnostic(null);
  }, [activeChallenge.id, selectedLanguage]);

  // CodeMirror language extension
  const getLanguageExtension = () => {
    if (selectedLanguage === 'python') {
      return [python()];
    } else {
      return [cpp()];
    }
  };

  // Anti-cheat paste event listener on editor container
  const handleEditorPasteEvent = (e: React.ClipboardEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const clipboardText = e.clipboardData?.getData('text/plain') || '';
    if (onReportPasteViolation) {
      onReportPasteViolation('clipboard_paste', clipboardText.slice(0, 100));
    }

    if (onShowToast) {
      onShowToast({
        type: 'warning',
        title: 'External Paste Blocked',
        description: 'Academic integrity guard active. Type your solution or inject authorized AI concept tokens directly.',
      });
    }
  };

  const handleEditorDropEvent = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onReportPasteViolation) {
      onReportPasteViolation('drag_drop', 'Dragged external text');
    }
  };

  // Execute Code against custom stdin and test cases
  const handleRunCode = async () => {
    if (isRunning) return;
    if (!code.trim()) {
      if (onShowToast) {
        onShowToast({
          type: 'error',
          title: 'Code is Empty',
          description: 'Write your solution before executing.',
        });
      }
      return;
    }

    setIsRunning(true);
    setExecutionResult(null);
    setAiDiagnostic(null);
    setActiveConsoleTab('output');

    try {
      const res = await fetch('/api/skilltutor/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: selectedLanguage,
          code,
          stdin: customStdin,
          testCases: activeChallenge.testCases || [],
          problemStatement: {
            title: activeChallenge.title,
            description: activeChallenge.conceptualScenario,
            constraints: activeChallenge.constraints,
            inputFormat: activeChallenge.inputFormat,
            outputFormat: activeChallenge.outputFormat,
          },
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        const result: CompilerExecutionResult = data.data;
        setExecutionResult(result);

        if (!result.compiled || !result.success || (result.testCaseResults && result.testCaseResults.some(t => !t.passed))) {
          // Switch to testcases tab if test cases exist and some failed
          if (result.testCaseResults && result.testCaseResults.length > 0) {
            setActiveConsoleTab('testcases');
          }
        }
      } else {
        setExecutionResult({
          success: false,
          compiled: false,
          language: selectedLanguage,
          stdout: '',
          stderr: data.message || 'Execution failed on server.',
          exitCode: 1,
          executionTimeMs: 0,
        });
      }
    } catch (err: any) {
      console.error('Compiler run error:', err);
      setExecutionResult({
        success: false,
        compiled: false,
        language: selectedLanguage,
        stdout: '',
        stderr: err?.message || 'Network error connecting to compiler service.',
        exitCode: 1,
        executionTimeMs: 0,
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Request Socratic AI Help on compiler error or test failure based on problem statement
  const handleRequestAiDiagnostics = async () => {
    if (isDiagnosing) return;
    setIsDiagnosing(true);

    const errorContext =
      executionResult?.compilationError ||
      executionResult?.stderr ||
      (executionResult?.testCaseResults
        ? executionResult.testCaseResults
            .filter((t) => !t.passed)
            .map((t) => `Failed Test Input:\n${t.input}\nExpected: ${t.expectedOutput}\nGot: ${t.actualOutput}`)
            .join('\n\n')
        : 'Code did not produce expected output.');

    try {
      const res = await fetch('/api/skilltutor/diagnose-compiler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: selectedLanguage,
          code,
          errorOutput: errorContext,
          problemStatement: {
            title: activeChallenge.title,
            description: activeChallenge.conceptualScenario,
            constraints: activeChallenge.constraints,
          },
          studentQuery: 'Diagnose this compilation or test failure Socratically based on the problem invariants.',
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setAiDiagnostic(data.data);
        if (onShowToast) {
          onShowToast({
            type: 'info',
            title: 'Socratic Diagnostic Unlocked',
            description: 'SkillTutor identified the invariant gap without spoiling the answer.',
          });
        }
      }
    } catch (err: any) {
      console.error('Diagnostic error:', err);
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleResetCode = () => {
    setCode(getStarterCode(selectedLanguage));
    setExecutionResult(null);
    setAiDiagnostic(null);
    if (onShowToast) {
      onShowToast({
        type: 'info',
        title: 'Boilerplate Reset',
        description: `Reset to clean ${selectedLanguage.toUpperCase()} starter template.`,
      });
    }
  };

  const handleCopyConsoleOutput = () => {
    const textToCopy = [
      executionResult?.stdout ? `STDOUT:\n${executionResult.stdout}` : '',
      executionResult?.stderr ? `STDERR:\n${executionResult.stderr}` : '',
      executionResult?.compilationError ? `COMPILATION ERROR:\n${executionResult.compilationError}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopiedConsole(true);
      setTimeout(() => setCopiedConsole(false), 2000);
    }
  };

  const totalTestCases = executionResult?.testCaseResults?.length || 0;
  const passedTestCases = executionResult?.testCaseResults?.filter((t) => t.passed).length || 0;

  return (
    <div className="space-y-4">
      {/* Active Problem Summary Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-slate-100">{activeChallenge.title}</h3>
                {activeChallenge.isCustom && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                    Custom Problem
                  </span>
                )}
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
                  {activeChallenge.difficulty}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate max-w-xl">
                Topic: {activeChallenge.topic} • Target Role: {activeChallenge.relatedRole}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsProblemExpanded(!isProblemExpanded)}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-700/80 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>{isProblemExpanded ? 'Hide Specs' : 'View Problem Statement'}</span>
              {isProblemExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={onOpenAddProblemModal}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Add / Edit Problem</span>
            </button>
          </div>
        </div>

        {/* Expandable Problem Statement Details */}
        {isProblemExpanded && (
          <div className="pt-3 space-y-3 text-xs text-slate-300 animate-in fade-in duration-150">
            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <strong className="text-slate-200 block text-xs font-bold">Scenario &amp; Problem Goal:</strong>
              <p className="leading-relaxed whitespace-pre-line text-slate-300">{activeChallenge.conceptualScenario}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Input Format:
                </span>
                <p className="font-mono text-[11px] text-slate-300">
                  {activeChallenge.inputFormat || 'Standard input (stdin).'}
                </p>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Output Format:
                </span>
                <p className="font-mono text-[11px] text-slate-300">
                  {activeChallenge.outputFormat || 'Standard output (stdout).'}
                </p>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Constraints:
                </span>
                <p className="font-mono text-[11px] text-amber-300">
                  {activeChallenge.constraints || 'Time Limit: 2.0s, Memory Limit: 256MB'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Compiler Workstation: Code Editor + Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {/* Editor Toolbar */}
        <div className="p-3 sm:p-4 border-b border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3">
          {/* Language Selector */}
          <div className="flex items-center space-x-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setSelectedLanguage('python')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                selectedLanguage === 'python'
                  ? 'bg-gradient-to-r from-amber-500/20 to-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🐍</span>
              <span>Python 3.10</span>
            </button>

            <button
              onClick={() => setSelectedLanguage('c')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                selectedLanguage === 'c'
                  ? 'bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>⚙️</span>
              <span>C (GCC 12)</span>
            </button>

            <button
              onClick={() => setSelectedLanguage('cpp')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                selectedLanguage === 'cpp'
                  ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>⚡</span>
              <span>C++17 (G++ 12)</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleResetCode}
              title="Reset code to default boilerplate"
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={handleRunCode}
              disabled={isRunning}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:opacity-95 shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isRunning ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Compiling &amp; Running...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Run Code / Compile</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Code Editor Container */}
        <div
          onPaste={handleEditorPasteEvent}
          onDrop={handleEditorDropEvent}
          className="border-b border-slate-800 bg-[#282c34] text-xs font-mono relative"
        >
          <CodeMirror
            value={code}
            height="340px"
            theme={oneDark}
            extensions={getLanguageExtension()}
            onChange={(val) => setCode(val)}
            basicSetup={{
              lineNumbers: true,
              highlightActiveLineGutter: true,
              foldGutter: true,
              dropCursor: false,
              allowMultipleSelections: false,
              indentOnInput: true,
              bracketMatching: true,
              closeBrackets: true,
              autocompletion: false, // External autocompletion blocked
              highlightActiveLine: true,
            }}
          />

          {/* Anti-paste integrity watermark badge */}
          <div className="absolute bottom-2 right-3 pointer-events-none flex items-center gap-1 text-[10px] text-slate-500 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
            <span>🛡️ Anti-Paste Active ({integrityScore}% Integrity)</span>
          </div>
        </div>

        {/* Console & Test Case Output Deck */}
        <div className="p-4 sm:p-5 bg-slate-950/95 space-y-3">
          {/* Console Tab Selector */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center space-x-2 text-xs font-semibold">
              <button
                onClick={() => setActiveConsoleTab('testcases')}
                className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeConsoleTab === 'testcases'
                    ? 'bg-slate-800 text-sky-400 font-bold border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Test Cases ({activeChallenge.testCases?.length || 0})</span>
                {executionResult?.testCaseResults && (
                  <span
                    className={`ml-1 text-[10px] px-1.5 py-0.2 rounded font-mono ${
                      passedTestCases === totalTestCases
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {passedTestCases}/{totalTestCases}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveConsoleTab('stdin')}
                className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeConsoleTab === 'stdin'
                    ? 'bg-slate-800 text-sky-400 font-bold border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Custom Stdin</span>
              </button>

              <button
                onClick={() => setActiveConsoleTab('output')}
                className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeConsoleTab === 'output'
                    ? 'bg-slate-800 text-sky-400 font-bold border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileCode2 className="w-3.5 h-3.5" />
                <span>Terminal Output</span>
              </button>
            </div>

            {/* Execution Runtime & Status */}
            {executionResult && (
              <div className="flex items-center space-x-2 text-xs">
                <span className="flex items-center gap-1 text-slate-400 font-mono text-[11px]">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span>{executionResult.executionTimeMs} ms</span>
                </span>
                <span
                  className={`px-2 py-0.5 rounded font-mono text-[11px] font-bold ${
                    !executionResult.compiled
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : executionResult.success
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {!executionResult.compiled
                    ? 'Compilation Error'
                    : executionResult.timedOut
                    ? 'Time Limit Exceeded'
                    : executionResult.exitCode === 0
                    ? 'Success (Exit 0)'
                    : `Runtime Error (${executionResult.exitCode})`}
                </span>
              </div>
            )}
          </div>

          {/* Console Content 1: Test Cases Tab */}
          {activeConsoleTab === 'testcases' && (
            <div className="space-y-3">
              {(!activeChallenge.testCases || activeChallenge.testCases.length === 0) ? (
                <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 text-center text-slate-400 text-xs">
                  No sample test cases configured for this problem.{' '}
                  <button
                    onClick={onOpenAddProblemModal}
                    className="text-sky-400 hover:underline font-semibold cursor-pointer"
                  >
                    Add test cases in problem settings.
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activeChallenge.testCases.map((tc, idx) => {
                    const evalResult = executionResult?.testCaseResults?.find(
                      (r) => String(r.id) === String(tc.id) || Number(r.id) === idx + 1
                    );

                    return (
                      <div
                        key={tc.id || idx}
                        className={`p-3 rounded-xl border transition-all ${
                          evalResult
                            ? evalResult.passed
                              ? 'bg-emerald-950/20 border-emerald-500/30'
                              : 'bg-rose-950/20 border-rose-500/40'
                            : 'bg-slate-900 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-semibold mb-2">
                          <span className="text-slate-300">Test Case #{idx + 1}</span>
                          {evalResult ? (
                            evalResult.passed ? (
                              <span className="flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Passed ({evalResult.executionTimeMs}ms)</span>
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-rose-400 font-bold text-[11px]">
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Failed ({evalResult.executionTimeMs}ms)</span>
                              </span>
                            )
                          ) : (
                            <span className="text-slate-500 text-[10px] font-mono">Not Run</span>
                          )}
                        </div>

                        <div className="space-y-1.5 text-[11px] font-mono">
                          <div>
                            <span className="text-slate-500 block text-[10px]">Input:</span>
                            <pre className="bg-slate-950 p-1.5 rounded border border-slate-800/80 text-slate-300 overflow-x-auto whitespace-pre-wrap">
                              {tc.input || '(empty)'}
                            </pre>
                          </div>

                          <div className="grid grid-cols-2 gap-1.5">
                            <div>
                              <span className="text-slate-500 block text-[10px]">Expected:</span>
                              <pre className="bg-slate-950 p-1.5 rounded border border-slate-800/80 text-slate-300 overflow-x-auto whitespace-pre-wrap">
                                {tc.expectedOutput}
                              </pre>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[10px]">Actual Output:</span>
                              <pre
                                className={`p-1.5 rounded border overflow-x-auto whitespace-pre-wrap ${
                                  evalResult
                                    ? evalResult.passed
                                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                                      : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                                    : 'bg-slate-950 border-slate-800/80 text-slate-500'
                                }`}
                              >
                                {evalResult ? evalResult.actualOutput || '(no output)' : '—'}
                              </pre>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Console Content 2: Custom Stdin Tab */}
          {activeConsoleTab === 'stdin' && (
            <div className="space-y-2">
              <p className="text-xs text-slate-400">
                Provide custom standard input (stdin) to test your program with specific edge cases:
              </p>
              <textarea
                rows={4}
                value={customStdin}
                onChange={(e) => setCustomStdin(e.target.value)}
                placeholder="Enter input to be read by scanf, cin, or sys.stdin..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 font-mono text-xs text-slate-200 outline-none focus:border-indigo-500"
              />
            </div>
          )}

          {/* Console Content 3: Terminal Output Tab */}
          {activeConsoleTab === 'output' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Standard Output &amp; Diagnostics</span>
                <button
                  onClick={handleCopyConsoleOutput}
                  className="hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedConsole ? 'Copied' : 'Copy Output'}</span>
                </button>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 font-mono text-xs max-h-48 overflow-y-auto space-y-2">
                {executionResult ? (
                  <>
                    {executionResult.compilationError && (
                      <div className="text-rose-400">
                        <strong className="block text-[10px] uppercase text-rose-500 mb-1">
                          Compiler Output (GCC / G++):
                        </strong>
                        <pre className="whitespace-pre-wrap">{executionResult.compilationError}</pre>
                      </div>
                    )}
                    {executionResult.stdout && (
                      <div>
                        <strong className="block text-[10px] uppercase text-slate-500 mb-1">Stdout:</strong>
                        <pre className="whitespace-pre-wrap text-emerald-300">{executionResult.stdout}</pre>
                      </div>
                    )}
                    {executionResult.stderr && (
                      <div className="text-amber-400">
                        <strong className="block text-[10px] uppercase text-amber-500 mb-1">Stderr:</strong>
                        <pre className="whitespace-pre-wrap">{executionResult.stderr}</pre>
                      </div>
                    )}
                    {!executionResult.compilationError && !executionResult.stdout && !executionResult.stderr && (
                      <p className="text-slate-500 italic">Program executed with 0 output.</p>
                    )}
                  </>
                ) : (
                  <p className="text-slate-500 italic">
                    Press "Run Code / Compile" to compile and execute in the Linux sandbox.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Socratic AI Diagnostics Action Card */}
          {executionResult && (!executionResult.compiled || !executionResult.success || (executionResult.testCaseResults && executionResult.testCaseResults.some(t => !t.passed))) && (
            <div className="p-3.5 bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900 border border-indigo-500/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-150">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-300">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                    <span>SkillTutor AI Compiler Guidance</span>
                    <span className="text-[10px] px-2 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
                      Based on Active Problem
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Get Socratic hints on syntax, memory, or logic bugs without revealing the full solution.
                  </p>
                </div>
              </div>

              <button
                onClick={handleRequestAiDiagnostics}
                disabled={isDiagnosing}
                className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-sky-500 text-slate-950 font-bold text-xs hover:opacity-95 shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0 self-start sm:self-auto"
              >
                {isDiagnosing ? (
                  <>
                    <span className="w-3 h-3 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Analyzing Invariants...</span>
                  </>
                ) : (
                  <>
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>Diagnose Bug Socratically</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* AI Diagnostic Report Card */}
          {aiDiagnostic && (
            <div className="p-4 bg-slate-900 border border-indigo-500/40 rounded-xl space-y-3 text-xs text-slate-300 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center space-x-2">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-slate-100">
                    Socratic Diagnostic for {activeChallenge.title}
                  </span>
                </div>
                {aiDiagnostic.lineReference && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                    📍 {aiDiagnostic.lineReference}
                  </span>
                )}
              </div>

              {/* Root Cause */}
              <div className="space-y-1">
                <strong className="text-rose-400 block text-[11px] font-semibold">Underlying Root Cause:</strong>
                <p className="leading-relaxed bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300">
                  {aiDiagnostic.rootCause}
                </p>
              </div>

              {/* Socratic Hint */}
              <div className="space-y-1">
                <strong className="text-amber-300 block text-[11px] font-semibold">Socratic Invariant Hint:</strong>
                <p className="leading-relaxed bg-indigo-950/20 p-2.5 rounded-lg border border-indigo-500/30 text-slate-200">
                  {aiDiagnostic.socraticHint}
                </p>
              </div>

              {/* Problem Connection & Guiding Question */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {aiDiagnostic.problemConnection && (
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-[10px] font-bold text-sky-400 block mb-0.5">Problem Invariant:</span>
                    <p className="text-[11px] text-slate-300 leading-normal">{aiDiagnostic.problemConnection}</p>
                  </div>
                )}
                {aiDiagnostic.guidingQuestion && (
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-[10px] font-bold text-emerald-400 block mb-0.5">Reflect On This:</span>
                    <p className="text-[11px] text-slate-200 font-medium leading-normal italic">
                      "{aiDiagnostic.guidingQuestion}"
                    </p>
                  </div>
                )}
              </div>

              {/* Forward to Copilot button */}
              {onAskCopilotAboutBug && (
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => {
                      const errOutput = executionResult?.compilationError || executionResult?.stderr || 'Test case failure';
                      onAskCopilotAboutBug(aiDiagnostic, code, errOutput);
                    }}
                    className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Discuss This Bug with Socratic Copilot</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
