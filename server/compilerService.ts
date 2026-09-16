import { exec, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

export interface TestCaseInput {
  id?: string | number;
  input: string;
  expectedOutput: string;
  explanation?: string;
}

export interface TestCaseResult {
  id: string | number;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  executionTimeMs: number;
  error?: string;
}

export interface CompilationResult {
  success: boolean;
  compiled: boolean;
  language: 'python' | 'c' | 'cpp';
  stdout: string;
  stderr: string;
  exitCode: number | null;
  executionTimeMs: number;
  compilationError?: string;
  timedOut?: boolean;
  testCaseResults?: TestCaseResult[];
}

const TIMEOUT_MS = 6000; // 6 seconds execution safety timeout

/**
 * Runs a single command with input on stdin and captures output and runtime.
 */
function runProcess(
  command: string,
  args: string[],
  stdin: string,
  cwd: string,
  timeoutMs: number = TIMEOUT_MS
): Promise<{ stdout: string; stderr: string; exitCode: number | null; timedOut: boolean; executionTimeMs: number }> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let timedOut = false;

    const child = spawn(command, args, {
      cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, timeoutMs);

    if (stdin) {
      try {
        child.stdin.write(stdin);
        child.stdin.end();
      } catch (err) {
        // Stdin write error
      }
    } else {
      child.stdin.end();
    }

    child.stdout.on('data', (data) => {
      stdout += data.toString();
      if (stdout.length > 100000) {
        // Prevent buffer explosion
        child.kill('SIGKILL');
      }
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
      if (stderr.length > 50000) {
        child.kill('SIGKILL');
      }
    });

    child.on('close', (exitCode) => {
      clearTimeout(timer);
      const executionTimeMs = Date.now() - startTime;
      resolve({
        stdout: stdout.trimEnd(),
        stderr: stderr.trimEnd(),
        exitCode,
        timedOut,
        executionTimeMs,
      });
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      const executionTimeMs = Date.now() - startTime;
      resolve({
        stdout: '',
        stderr: String(err.message || err),
        exitCode: 1,
        timedOut: false,
        executionTimeMs,
      });
    });
  });
}

/**
 * Compiles and executes code for Python, C, or C++ with optional stdin and test cases.
 */
export async function executeCodeInSandbox(
  language: 'python' | 'c' | 'cpp',
  code: string,
  stdin: string = '',
  testCases: TestCaseInput[] = []
): Promise<CompilationResult> {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), `skilltutor_${language}_`));

  try {
    if (language === 'python') {
      const sourceFile = path.join(tempDir, 'solution.py');
      fs.writeFileSync(sourceFile, code, 'utf8');

      // Primary run for custom stdin
      const mainRun = await runProcess('python3', ['solution.py'], stdin, tempDir);

      let testCaseResults: TestCaseResult[] | undefined;
      if (testCases && testCases.length > 0) {
        testCaseResults = [];
        for (let i = 0; i < testCases.length; i++) {
          const tc = testCases[i];
          const tcRun = await runProcess('python3', ['solution.py'], tc.input, tempDir);
          const actualClean = tcRun.stdout.trim();
          const expectedClean = tc.expectedOutput.trim();
          const passed = tcRun.exitCode === 0 && actualClean === expectedClean;

          testCaseResults.push({
            id: tc.id ?? i + 1,
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            actualOutput: tcRun.stdout || (tcRun.stderr ? `Error: ${tcRun.stderr}` : ''),
            passed,
            executionTimeMs: tcRun.executionTimeMs,
            error: tcRun.exitCode !== 0 ? tcRun.stderr || 'Runtime Error' : undefined,
          });
        }
      }

      return {
        success: mainRun.exitCode === 0,
        compiled: true,
        language: 'python',
        stdout: mainRun.stdout,
        stderr: mainRun.stderr,
        exitCode: mainRun.exitCode,
        executionTimeMs: mainRun.executionTimeMs,
        timedOut: mainRun.timedOut,
        testCaseResults,
      };
    } else if (language === 'c') {
      const sourceFile = path.join(tempDir, 'solution.c');
      const binFile = path.join(tempDir, 'solution');
      fs.writeFileSync(sourceFile, code, 'utf8');

      // Compile step with gcc
      const compileRun = await runProcess(
        'gcc',
        ['-O2', '-Wall', '-Wno-unused-result', 'solution.c', '-o', 'solution', '-lm'],
        '',
        tempDir,
        10000
      );

      if (compileRun.exitCode !== 0 || !fs.existsSync(binFile)) {
        return {
          success: false,
          compiled: false,
          language: 'c',
          stdout: '',
          stderr: compileRun.stderr,
          compilationError: compileRun.stderr || 'Compilation failed with error',
          exitCode: compileRun.exitCode,
          executionTimeMs: compileRun.executionTimeMs,
        };
      }

      // Execute compiled binary
      const mainRun = await runProcess('./solution', [], stdin, tempDir);

      let testCaseResults: TestCaseResult[] | undefined;
      if (testCases && testCases.length > 0) {
        testCaseResults = [];
        for (let i = 0; i < testCases.length; i++) {
          const tc = testCases[i];
          const tcRun = await runProcess('./solution', [], tc.input, tempDir);
          const actualClean = tcRun.stdout.trim();
          const expectedClean = tc.expectedOutput.trim();
          const passed = tcRun.exitCode === 0 && actualClean === expectedClean;

          testCaseResults.push({
            id: tc.id ?? i + 1,
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            actualOutput: tcRun.stdout || (tcRun.stderr ? `Error: ${tcRun.stderr}` : ''),
            passed,
            executionTimeMs: tcRun.executionTimeMs,
            error: tcRun.exitCode !== 0 ? tcRun.stderr || 'Runtime Error' : undefined,
          });
        }
      }

      return {
        success: mainRun.exitCode === 0,
        compiled: true,
        language: 'c',
        stdout: mainRun.stdout,
        stderr: mainRun.stderr,
        exitCode: mainRun.exitCode,
        executionTimeMs: mainRun.executionTimeMs,
        timedOut: mainRun.timedOut,
        testCaseResults,
      };
    } else if (language === 'cpp') {
      const sourceFile = path.join(tempDir, 'solution.cpp');
      const binFile = path.join(tempDir, 'solution');
      fs.writeFileSync(sourceFile, code, 'utf8');

      // Compile step with g++
      const compileRun = await runProcess(
        'g++',
        ['-O2', '-std=c++17', '-Wall', '-Wno-unused-result', 'solution.cpp', '-o', 'solution'],
        '',
        tempDir,
        10000
      );

      if (compileRun.exitCode !== 0 || !fs.existsSync(binFile)) {
        return {
          success: false,
          compiled: false,
          language: 'cpp',
          stdout: '',
          stderr: compileRun.stderr,
          compilationError: compileRun.stderr || 'C++ compilation failed with error',
          exitCode: compileRun.exitCode,
          executionTimeMs: compileRun.executionTimeMs,
        };
      }

      // Execute compiled binary
      const mainRun = await runProcess('./solution', [], stdin, tempDir);

      let testCaseResults: TestCaseResult[] | undefined;
      if (testCases && testCases.length > 0) {
        testCaseResults = [];
        for (let i = 0; i < testCases.length; i++) {
          const tc = testCases[i];
          const tcRun = await runProcess('./solution', [], tc.input, tempDir);
          const actualClean = tcRun.stdout.trim();
          const expectedClean = tc.expectedOutput.trim();
          const passed = tcRun.exitCode === 0 && actualClean === expectedClean;

          testCaseResults.push({
            id: tc.id ?? i + 1,
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            actualOutput: tcRun.stdout || (tcRun.stderr ? `Error: ${tcRun.stderr}` : ''),
            passed,
            executionTimeMs: tcRun.executionTimeMs,
            error: tcRun.exitCode !== 0 ? tcRun.stderr || 'Runtime Error' : undefined,
          });
        }
      }

      return {
        success: mainRun.exitCode === 0,
        compiled: true,
        language: 'cpp',
        stdout: mainRun.stdout,
        stderr: mainRun.stderr,
        exitCode: mainRun.exitCode,
        executionTimeMs: mainRun.executionTimeMs,
        timedOut: mainRun.timedOut,
        testCaseResults,
      };
    } else {
      throw new Error(`Unsupported compiler language: ${language}`);
    }
  } finally {
    // Cleanup temporary files
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (e) {
      // Ignore cleanup error
    }
  }
}
