'use client';

import React, { useState } from 'react';
import { Sparkles, Loader2, X, Wand2, RefreshCw, CheckCircle2, AlertCircle, Layers, Box } from 'lucide-react';
import useBuilderStore from '@/lib/stores/builderStore';
import useHistoryStore from '@/lib/stores/historyStore';
import { clsx } from 'clsx';

const QUICK_PRESETS = [
  { label: '⚡ Modern Tech SaaS', prompt: 'Modern high-tech SaaS aesthetic with clean typography, subtle borders, high-impact CTA, and streamlined layout' },
  { label: '🌙 Dark Glassmorphism', prompt: 'Dark mode glassmorphism with deep slate background, translucent cards, neon accent highlights, and glowing buttons' },
  { label: '💎 Clean & Minimalist', prompt: 'Ultra-clean minimalist design with generous whitespace, elegant typography, subtle contrast, and refined layout' },
  { label: '🚀 High-Conversion Sales', prompt: 'Bold, high-converting direct response layout with persuasive headline, key value props, social proof indicators, and urgent CTA' },
  { label: '🎨 Vibrant & Creative', prompt: 'Dynamic, creative visual layout with lively color accents, playful typography, modern card styles, and visual depth' },
  { label: '🏆 Corporate & Trustworthy', prompt: 'Professional, trustworthy corporate presentation with structured grid, dignified color scheme, and authoritative tone' },
];

export default function AIRedesignModal({ isOpen, onClose, selectedNode, tenantId }) {
  const [prompt, setPrompt] = useState('');
  const [keepContent, setKeepContent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const {
    replaceContainer,
    replaceComponent,
    getLayoutJSON,
    theme,
  } = useBuilderStore();
  const { pushState } = useHistoryStore();

  if (!isOpen || !selectedNode) return null;

  const isContainer = selectedNode.type === 'container';
  const nodeName = isContainer ? 'Container / Section' : `${selectedNode.type} Component`;

  // Collect summary of components inside container if it's a container
  let innerComponentsSummary = '';
  if (isContainer && selectedNode.columns) {
    const types = [];
    selectedNode.columns.forEach((col) => {
      (col.components || []).forEach((c) => {
        if (!types.includes(c.type)) types.push(c.type);
      });
    });
    if (types.length > 0) {
      innerComponentsSummary = `Contains: ${types.join(', ')}`;
    }
  }

  const handlePresetClick = (presetPrompt) => {
    setPrompt(presetPrompt);
    setError('');
  };

  const handleRedesign = async (e) => {
    e?.preventDefault();
    if (!prompt.trim()) {
      setError('Please enter a redesign description or click one of the quick presets below.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // 1. Save history state before modifying for instant Undo
      pushState(getLayoutJSON());

      // 2. Call backend AI redesign endpoint
      const res = await fetch('/api/ai/redesign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedType: isContainer ? 'container' : selectedNode.type,
          selectedData: selectedNode,
          prompt: prompt.trim(),
          keepContent,
          theme: theme || null,
          tenantId: tenantId || null,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to redesign element with AI');
      }

      // 3. Apply the redesigned element to the builder store
      if (isContainer) {
        replaceContainer(selectedNode.id, data.redesignedData);
      } else {
        replaceComponent(selectedNode.id, data.redesignedData);
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 700);
    } catch (err) {
      console.error('AI Redesign Error:', err);
      setError(err.message || 'An error occurred while generating the redesign. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl bg-[#0f211d] border border-white/10 rounded-3xl shadow-2xl text-white overflow-hidden flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-1/4 w-72 h-32 bg-[#d3ff4a]/10 blur-[80px] pointer-events-none rounded-full" />
        <div className="absolute bottom-0 left-1/4 w-72 h-32 bg-[#00e5ff]/10 blur-[80px] pointer-events-none rounded-full" />

        {/* Header */}
        <div className="p-6 pb-4 border-b border-white/10 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#d3ff4a]/15 border border-[#d3ff4a]/30 flex items-center justify-center text-[#d3ff4a] shadow-[0_0_15px_rgba(211,255,74,0.15)]">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#d3ff4a]">
                  SitePilot AI Studio
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-gray-300">
                  {isContainer ? 'Section Mode' : 'Component Mode'}
                </span>
              </div>
              <h2 className="text-xl font-black uppercase tracking-tight text-white mt-0.5">
                Redesign with AI
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white flex items-center justify-center transition-all disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 relative z-10 max-h-[75vh] overflow-y-auto">
          {/* Target Element Tag */}
          <div className="flex items-center justify-between p-3.5 bg-white/5 rounded-2xl border border-white/10 text-xs">
            <div className="flex items-center gap-2.5">
              {isContainer ? (
                <Layers size={16} className="text-violet-400" />
              ) : (
                <Box size={16} className="text-blue-400" />
              )}
              <div>
                <p className="font-bold text-white uppercase tracking-wider">{nodeName}</p>
                {innerComponentsSummary && (
                  <p className="text-[10px] text-gray-400 font-medium mt-0.5">{innerComponentsSummary}</p>
                )}
              </div>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md bg-[#d3ff4a]/10 text-[#d3ff4a] border border-[#d3ff4a]/20">
              Selected Target
            </span>
          </div>

          {/* Prompt Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="redesign-prompt" className="text-xs font-bold uppercase tracking-wider text-gray-300">
                How should AI redesign this {isContainer ? 'section' : 'component'}?
              </label>
              <span className="text-[10px] text-gray-400">Describe style, layout, or copy</span>
            </div>
            <textarea
              id="redesign-prompt"
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={loading}
              placeholder={
                isContainer
                  ? "e.g., Transform this into a high-converting tech startup hero section with dark glassmorphism, bold headline, glowing gradient buttons, and responsive grid layout..."
                  : "e.g., Redesign this component with bold typography, dark contrast background, and engaging action buttons..."
              }
              className="w-full px-4 py-3 bg-[#0b1411]/80 border border-white/15 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-[#d3ff4a] focus:ring-2 focus:ring-[#d3ff4a]/20 text-sm leading-relaxed transition-all resize-none"
            />
          </div>

          {/* Quick Preset Prompts */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2.5 flex items-center gap-1.5">
              <Wand2 size={12} className="text-[#d3ff4a]" /> Quick Inspiration Presets
            </p>
            <div className="flex flex-wrap gap-2">
              {QUICK_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handlePresetClick(preset.prompt)}
                  disabled={loading}
                  className={clsx(
                    "text-xs px-3 py-1.5 rounded-full border transition-all text-left font-medium",
                    prompt === preset.prompt
                      ? "bg-[#d3ff4a] text-[#0a1512] border-[#d3ff4a] font-bold shadow-sm"
                      : "bg-white/5 border-white/10 text-gray-300 hover:border-white/25 hover:text-white"
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Keep Existing Content Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-white/5 rounded-2xl border border-white/10">
            <div>
              <p className="text-xs font-bold text-white">Preserve Original Text</p>
              <p className="text-[10px] text-gray-400 leading-normal mt-0.5">
                Keep current headlines & copy — only redesign layout, spacing, and styling
              </p>
            </div>
            <button
              type="button"
              onClick={() => setKeepContent(!keepContent)}
              disabled={loading}
              className={clsx(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                keepContent ? "bg-[#d3ff4a]" : "bg-white/20"
              )}
            >
              <span
                className={clsx(
                  "inline-block h-4 w-4 transform rounded-full bg-black transition-transform",
                  keepContent ? "translate-x-6 bg-[#0a1512]" : "translate-x-1 bg-white"
                )}
              />
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success State */}
          {success && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>Redesign applied successfully! (Press Ctrl+Z to undo anytime)</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 pt-4 border-t border-white/10 flex items-center justify-between relative z-10 bg-[#0a1512]/60">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
            Isolated redesign • Rest of page untouched
          </p>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-full text-xs font-bold text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleRedesign}
              disabled={loading || !prompt.trim()}
              className="px-6 py-2.5 rounded-full bg-[#d3ff4a] text-[#0a1512] font-black uppercase tracking-wider text-xs hover:bg-[#c0eb3f] hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_20px_rgba(211,255,74,0.2)] disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Redesigning with AI...
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  Redesign {isContainer ? 'Section' : 'Component'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
