import { useEffect, useRef, type ChangeEvent, type ClipboardEvent, type DragEvent, type MouseEvent } from 'react';
import { Shield, Lock, FileText } from 'lucide-react';
import { PasteViolationType } from '../types';
import { isAuthorizedInjectionInProgress } from '../utils/skillTutorSecurity';

interface AntiPasteConceptualEditorProps {
  value: string;
  onChange: (val: string) => void;
  onPasteBlocked: (type: PasteViolationType, preview: string, length: number) => void;
  placeholder?: string;
  rows?: number;
  label?: string;
  badgeText?: string;
  minWordCount?: number;
}

export function AntiPasteConceptualEditor({
  value,
  onChange,
  onPasteBlocked,
  placeholder = 'Explain your conceptual reasoning, asymptotic Big-O trade-offs, and loop invariants in plain English. External copy-pasting is strictly locked.',
  rows = 7,
  label = 'Conceptual Reasoning & Invariant Proof',
  badgeText = 'Strict Manual Typing Enforced',
  minWordCount = 30,
}: AntiPasteConceptualEditorProps) {
  const previousValueRef = useRef<string>(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    previousValueRef.current = value;
  }, [value]);

  const words = value.trim() ? value.trim().split(/\s+/).length : 0;
  const chars = value.length;

  const handleBlocked = (type: PasteViolationType, preview: string, len: number) => {
    onPasteBlocked(type, preview, len);
  };

  const handlePaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const pasted = e.clipboardData?.getData('text') || '';
    handleBlocked('clipboard_paste', pasted, pasted.length || 1);
  };

  const handleDrop = (e: DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const dropped = e.dataTransfer?.getData('text') || '';
    handleBlocked('drag_drop', dropped, dropped.length || 1);
  };

  const handleContextMenu = (e: MouseEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    e.stopPropagation();
    handleBlocked('context_menu', '[Right-Click Context Menu Blocked]', 0);
  };

  const handleMouseDown = (e: MouseEvent<HTMLTextAreaElement>) => {
    // Middle-click on Linux/X11 or browsers triggers primary selection paste
    if (e.button === 1) {
      e.preventDefault();
      e.stopPropagation();
      handleBlocked('middle_click', '[Middle-Click Paste Intercepted]', 0);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    const oldVal = previousValueRef.current;

    // Check for abnormal jump if not during authorized injection
    if (!isAuthorizedInjectionInProgress() && newVal.length - oldVal.length > 15) {
      // Large burst detected (e.g. browser paste bypass or extension injection)
      e.preventDefault();
      handleBlocked('large_burst', newVal.slice(oldVal.length, oldVal.length + 50), newVal.length - oldVal.length);
      // Revert to old value
      onChange(oldVal);
      return;
    }

    previousValueRef.current = newVal;
    onChange(newVal);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <label className="font-bold text-slate-200 flex items-center space-x-1.5">
          <FileText className="w-3.5 h-3.5 text-indigo-400" />
          <span>{label}</span>
        </label>
        <div className="flex items-center space-x-2">
          <span className="flex items-center space-x-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
            <Shield className="w-3 h-3" />
            <span>{badgeText}</span>
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            {words} words ({chars} chars)
          </span>
        </div>
      </div>

      <div
        className="relative rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950 focus-within:border-indigo-500 transition-colors shadow-inner"
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'none';
        }}
      >
        <textarea
          ref={textareaRef}
          rows={rows}
          value={value}
          onChange={handleChange}
          onPaste={handlePaste}
          onDrop={handleDrop}
          onContextMenu={handleContextMenu}
          onMouseDown={handleMouseDown}
          onAuxClick={(e) => {
            if (e.button === 1) {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          data-lpignore="true"
          data-form-type="other"
          placeholder={placeholder}
          className="w-full p-4 bg-transparent text-slate-100 font-sans text-xs sm:text-sm leading-relaxed outline-none transition-all placeholder:text-slate-500 resize-y"
        />

        {/* Footer Guidance Strip */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/80 border-t border-slate-800 text-[10px] text-slate-400 select-none">
          <span className="flex items-center gap-1 text-slate-400">
            <Lock className="w-2.5 h-2.5 text-slate-500" />
            Paste, drop, middle-click, and external autocompletion are disabled.
          </span>
          <span className={words >= minWordCount ? 'text-emerald-400 font-semibold' : 'text-amber-400'}>
            {words >= minWordCount ? '✓ Conceptual length satisfied' : `Need ~${Math.max(0, minWordCount - words)} more words`}
          </span>
        </div>
      </div>
    </div>
  );
}
