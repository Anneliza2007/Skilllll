import { useState, type ClipboardEvent, type ChangeEvent } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { SkillTutorPasteAttempt } from '../types';

interface AntiPasteViolationModalProps {
  isOpen: boolean;
  violation: SkillTutorPasteAttempt | null;
  onResolveExplanation?: (explanation: string) => void;
  onExplain?: (explanation: string) => void;
  onClose: () => void;
}

export function AntiPasteViolationModal({
  isOpen,
  violation,
  onResolveExplanation,
  onExplain,
  onClose,
}: AntiPasteViolationModalProps) {
  const [explanation, setExplanation] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !violation) return null;

  const handleResolve = (exp: string) => {
    if (onResolveExplanation) onResolveExplanation(exp);
    if (onExplain) onExplain(exp);
  };

  const getViolationTitle = (type: string) => {
    switch (type) {
      case 'clipboard_paste':
        return 'Clipboard Paste Attempt Intercepted';
      case 'drag_drop':
        return 'Drag-and-Drop Insertion Blocked';
      case 'middle_click':
        return 'Middle-Click Paste Intercepted';
      case 'context_menu':
        return 'Right-Click Context Menu Paste Blocked';
      case 'large_burst':
        return 'Anomalous Bulk Text Insertion Detected';
      case 'beforeinput_paste':
        return 'External Input Event Intercepted';
      default:
        return 'Unauthorized Insertion Event';
    }
  };

  const handleExplanationChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setExplanation(e.target.value);
    if (errorMsg && e.target.value.trim().length >= 20) {
      setErrorMsg('');
    }
  };

  // Prevent paste into the explanation field itself!
  const handlePasteIntoExplanation = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setErrorMsg('Paste is disabled here too. Please type your explanation manually.');
  };

  const handleSubmit = () => {
    if (explanation.trim().length < 20) {
      setErrorMsg('Please write at least 20 characters explaining your conceptual approach.');
      return;
    }
    handleResolve(explanation.trim());
    setExplanation('');
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-rose-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-slate-100 relative">
        {/* Header */}
        <div className="flex items-start space-x-3.5">
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/40">
                Integrity Flag
              </span>
              <span className="text-xs text-slate-400 font-mono">{violation.timestamp}</span>
            </div>
            <h3 className="text-lg font-bold text-slate-100 mt-1">
              {getViolationTitle(violation.type)}
            </h3>
          </div>
        </div>

        {/* Violation Context Details */}
        <div className="bg-slate-950/90 rounded-xl p-3.5 border border-slate-800 space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span>Detection Mechanism:</span>
            <span className="font-mono text-slate-200 uppercase">{violation.type.replace('_', ' ')}</span>
          </div>
          {violation.attemptedLength > 0 && (
            <div className="flex items-center justify-between text-slate-400">
              <span>Attempted Insertion Size:</span>
              <span className="font-mono text-rose-400">{violation.attemptedLength} characters</span>
            </div>
          )}
          {violation.previewText && (
            <div className="pt-1 border-t border-slate-800/60">
              <span className="text-[11px] text-slate-500 block mb-1">Blocked Content Sample:</span>
              <div className="p-2 rounded bg-slate-900 font-mono text-[11px] text-slate-300 truncate">
                {violation.previewText}
              </div>
            </div>
          )}
        </div>

        {/* Pedagogical Policy Warning */}
        <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-200/90 leading-relaxed flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-300">Why was this blocked?</p>
            <p className="mt-0.5 text-[11px] text-amber-200/80">
              SkillTutor develops genuine technical intuition. External code pastes and clipboard dumps prevent neural retention. All conceptual invariants must be typed manually or injected exclusively via verified Copilot hints.
            </p>
          </div>
        </div>

        {/* Mandatory Student Explanation */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
            <span className="flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Mandatory Conceptual Explanation</span>
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {explanation.length} / 20 min chars
            </span>
          </label>
          <p className="text-[11px] text-slate-400">
            To clear this integrity flag and unblock submission, summarize the logic or explain why you attempted to insert this in your own words:
          </p>

          <textarea
            rows={3}
            value={explanation}
            onChange={handleExplanationChange}
            onPaste={handlePasteIntoExplanation}
            autoComplete="off"
            placeholder="Type your explanation manually (e.g. 'I was attempting to test a two-pointer sliding window invariant where right advances until duplicate...')"
            className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 focus:border-indigo-500 text-slate-100 text-xs leading-relaxed outline-none transition-all placeholder:text-slate-500"
          />

          {errorMsg && (
            <p className="text-[11px] text-rose-400 font-medium animate-in fade-in duration-150">
              {errorMsg}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            Review Code Without Unlocking
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={explanation.trim().length < 20}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
              explanation.trim().length >= 20
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <span>Confirm &amp; Clear Flag</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
