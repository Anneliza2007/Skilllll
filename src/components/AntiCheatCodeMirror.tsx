import { useEffect, useRef, useCallback } from 'react';
import CodeMirror, { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { Shield, ShieldAlert, Lock, Zap } from 'lucide-react';
import {
  isAuthorizedInjectionInProgress,
  runWithAuthorizedDirectInjection,
  verifySignedCopilotToken,
} from '../utils/skillTutorSecurity';
import { PasteViolationType, SignedSnippetToken } from '../types';

interface AntiCheatCodeMirrorProps {
  value: string;
  onChange: (val: string) => void;
  onPasteBlocked: (type: PasteViolationType, preview: string, length: number) => void;
  onAuthorizedInjectionSuccess?: (snippet: string) => void;
  placeholder?: string;
  height?: string;
  minHeight?: string;
  mode?: 'code' | 'conceptual';
  readOnly?: boolean;
  language?: string;
}

export function AntiCheatCodeMirror({
  value,
  onChange,
  onPasteBlocked,
  placeholder = 'Articulate your algorithmic invariants, state transitions, and pseudocode logic here...',
  height = '280px',
  minHeight = '200px',
  readOnly = false,
}: AntiCheatCodeMirrorProps) {
  const editorRef = useRef<ReactCodeMirrorRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastPristineValueRef = useRef<string>(value);

  // Keep last pristine value updated
  useEffect(() => {
    lastPristineValueRef.current = value;
  }, [value]);

  // Handler for blocked violation
  const handleBlockedViolation = useCallback(
    (type: PasteViolationType, preview: string, len: number) => {
      onPasteBlocked(type, preview, len);
    },
    [onPasteBlocked]
  );

  // Construct CodeMirror extensions with hardened security barriers
  const extensions = [
    javascript({ typescript: true }),
    oneDark,
    EditorView.contentAttributes.of({
      autocomplete: 'off',
      autocorrect: 'off',
      autocapitalize: 'off',
      spellcheck: 'false',
      'data-lpignore': 'true',
      'data-form-type': 'other',
      'aria-autocomplete': 'none',
    }),
    // 1. Intercept all clipboard & mouse paste events at the CodeMirror DOM level
    EditorView.domEventHandlers({
      paste(event) {
        event.preventDefault();
        event.stopPropagation();
        const text = event.clipboardData?.getData('text') || '';
        handleBlockedViolation('clipboard_paste', text, text.length || 1);
        return true;
      },
      drop(event) {
        event.preventDefault();
        event.stopPropagation();
        const text = event.dataTransfer?.getData('text') || '';
        handleBlockedViolation('drag_drop', text, text.length || 1);
        return true;
      },
      dragover(event) {
        event.preventDefault();
        if (event.dataTransfer) {
          event.dataTransfer.dropEffect = 'none';
        }
        return true;
      },
      dragenter(event) {
        event.preventDefault();
        return true;
      },
      contextmenu(event) {
        // Prevent context-menu right click paste
        event.preventDefault();
        event.stopPropagation();
        handleBlockedViolation('context_menu', '[Right-Click Context Menu Blocked]', 0);
        return true;
      },
      mousedown(event) {
        // Button 1 is middle-click paste on Linux/X11
        if (event.button === 1) {
          event.preventDefault();
          event.stopPropagation();
          handleBlockedViolation('middle_click', '[Middle-Click Paste Intercepted]', 0);
          return true;
        }
        return false;
      },
      auxclick(event) {
        if (event.button === 1) {
          event.preventDefault();
          event.stopPropagation();
          return true;
        }
        return false;
      },
    }),
    // 2. Transaction filter: Block any sudden burst or paste-like change > 15 characters
    // UNLESS it was authorized by our direct API injection flag
    EditorState.transactionFilter.of((tr) => {
      if (isAuthorizedInjectionInProgress()) {
        return tr; // Authorized Copilot injection allowed
      }

      // Check if user is deleting text (always allowed)
      if (tr.newDoc.length < tr.startState.doc.length) {
        return tr;
      }

      let insertedLength = 0;
      let insertedTextSample = '';

      tr.changes.iterChanges((_fromA, _toA, _fromB, _toB, inserted) => {
        insertedLength += inserted.length;
        if (!insertedTextSample && inserted.length > 0) {
          insertedTextSample = inserted.sliceString(0, 50);
        }
      });

      // Normal human typing is 1-2 chars per event. If > 15 chars appear at once without authorization, block & revert!
      if (insertedLength > 15) {
        handleBlockedViolation('large_burst', insertedTextSample, insertedLength);
        return []; // Reject the transaction completely
      }

      return tr;
    }),
  ];

  // Additional wrapper listeners for beforeinput events
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleBeforeInput = (e: InputEvent) => {
      if (isAuthorizedInjectionInProgress()) return;

      if (
        e.inputType === 'insertFromPaste' ||
        e.inputType === 'insertFromDrop' ||
        e.inputType === 'insertReplacementText'
      ) {
        e.preventDefault();
        e.stopPropagation();
        handleBlockedViolation('beforeinput_paste', '[External Input Intercepted]', 0);
      }
    };

    container.addEventListener('beforeinput', handleBeforeInput as EventListener, true);
    return () => {
      container.removeEventListener('beforeinput', handleBeforeInput as EventListener, true);
    };
  }, [handleBlockedViolation]);

  return (
    <div
      ref={containerRef}
      className="relative rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950 focus-within:border-indigo-500 transition-colors shadow-inner"
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'none';
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleBlockedViolation('drag_drop', e.dataTransfer.getData('text'), 1);
      }}
    >
      {/* Security Status Ribbon */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/90 border-b border-slate-800 text-[11px] select-none">
        <div className="flex items-center space-x-2">
          <span className="flex items-center space-x-1 text-emerald-400 font-semibold">
            <Shield className="w-3.5 h-3.5" />
            <span>Anti-Paste Sandbox</span>
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400 flex items-center space-x-1">
            <Lock className="w-3 h-3 text-slate-500" />
            <span>CodeMirror • Paste, Drop &amp; Autocomplete Blocked</span>
          </span>
        </div>
        <div className="flex items-center space-x-2 text-[10px] text-slate-400">
          <span className="px-2 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-800/40 flex items-center gap-1">
            <Zap className="w-2.5 h-2.5 text-indigo-400" />
            Direct HMAC Injection Only
          </span>
        </div>
      </div>

      {/* CodeMirror Surface */}
      <CodeMirror
        ref={editorRef}
        value={value}
        height={height}
        minHeight={minHeight}
        theme={oneDark}
        extensions={extensions}
        placeholder={placeholder}
        readOnly={readOnly}
        onChange={(val) => {
          onChange(val);
        }}
        className="text-xs sm:text-sm font-mono"
        basicSetup={{
          lineNumbers: true,
          highlightActiveLineGutter: true,
          highlightSpecialChars: true,
          history: true,
          foldGutter: false,
          drawSelection: true,
          dropCursor: false,
          allowMultipleSelections: false,
          indentOnInput: true,
          syntaxHighlighting: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: false, // External / auto completions disabled
          rectangularSelection: false,
          crosshairCursor: false,
          highlightActiveLine: true,
          highlightSelectionMatches: false,
          closeBracketsKeymap: true,
          defaultKeymap: true,
          searchKeymap: false,
          historyKeymap: true,
          foldKeymap: false,
          completionKeymap: false,
          lintKeymap: false,
        }}
      />
    </div>
  );
}

/**
 * Helper to programmatically inject an authorized Copilot snippet into state or CodeMirror
 * using a signed HMAC token, bypassing OS clipboard entirely.
 */
export function injectAuthorizedSnippetDirectly(
  currentText: string,
  snippet: string,
  signedToken: SignedSnippetToken,
  onSuccess: (newText: string) => void,
  onError: (msg: string) => void
) {
  const verification = verifySignedCopilotToken(signedToken, snippet);
  if (!verification.valid) {
    onError(verification.reason || 'Cryptographic verification failed for snippet.');
    return;
  }

  runWithAuthorizedDirectInjection(() => {
    // Append or inject snippet cleanly
    const cleanSnippet = snippet.trim();
    const separator = currentText.trim().length > 0 ? '\n\n' : '';
    const newText = `${currentText}${separator}/* [Copilot Authorized Blueprint • ${signedToken.token}] */\n${cleanSnippet}`;
    onSuccess(newText);
  });
}
