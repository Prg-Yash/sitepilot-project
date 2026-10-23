"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { Sparkles, ArrowRight, Play, Star, CheckCircle2 } from "lucide-react";
import useBuilderStore from "@/lib/stores/builderStore";

export default function Hero({ props = {}, styles = {}, isSelected, onClick, id }) {
  const {
    title = "Build Stunning Websites with AI in Seconds",
    subtitle = "Experience the next-generation website builder with interactive animations, real-time collaboration, and instant e-commerce.",
    badgeText = "✨ Next-Gen Web Experience",
    ctaText = "Get Started Free",
    ctaLink = "#",
    secondaryCtaText = "Watch Demo",
    secondaryCtaLink = "#",
    theme = "dark", // "dark", "light", "gradient"
    showSocialProof = true,
  } = props;

  const updateComponentProps = useBuilderStore((s) => s.updateComponentProps);

  const handleInlineEdit = (key, value) => {
    if (id && updateComponentProps) {
      updateComponentProps(id, { [key]: value });
    }
  };

  const isDark = theme === "dark" || styles?.backgroundColor?.includes("#0") || styles?.backgroundColor?.includes("#1");

  return (
    <div
      onClick={onClick}
      className={clsx(
        "relative overflow-hidden transition-all duration-300 group/hero py-20 px-6",
        isSelected && "ring-2 ring-blue-500 ring-offset-2",
        isDark ? "bg-[#0b1411] text-white" : "bg-white text-gray-900"
      )}
      style={{
        backgroundColor: styles?.backgroundColor || (isDark ? "#0b1411" : "#ffffff"),
        paddingTop: styles?.paddingTop ? `${styles.paddingTop}px` : "90px",
        paddingBottom: styles?.paddingBottom ? `${styles.paddingBottom}px` : "90px",
      }}
    >
      {/* Background Radial Glow Spotlight */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-[#d3ff4a]/15 via-emerald-500/10 to-transparent blur-3xl pointer-events-none -z-0" />

      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none -z-0 opacity-40" />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        {/* Animated Badge */}
        {badgeText && (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-6 shadow-sm hover:border-[#d3ff4a]/50 transition-all cursor-default">
            <Sparkles size={13} className="text-[#d3ff4a] animate-pulse" />
            <span
              contentEditable={isSelected}
              suppressContentEditableWarning
              onBlur={(e) => handleInlineEdit("badgeText", e.currentTarget.innerText)}
              className="text-xs font-semibold tracking-wide text-gray-200 outline-none"
            >
              {badgeText}
            </span>
            <ArrowRight size={12} className="text-gray-400" />
          </div>
        )}

        {/* Heading with Gradient Accent */}
        <h1
          contentEditable={isSelected}
          suppressContentEditableWarning
          onBlur={(e) => handleInlineEdit("title", e.currentTarget.innerText)}
          className={clsx(
            "text-4xl sm:text-5xl md:text-6xl font-black tracking-tight mb-6 leading-[1.1] outline-none",
            isDark ? "text-white" : "text-gray-950"
          )}
        >
          {title}
        </h1>

        {/* Subtitle */}
        <p
          contentEditable={isSelected}
          suppressContentEditableWarning
          onBlur={(e) => handleInlineEdit("subtitle", e.currentTarget.innerText)}
          className={clsx(
            "text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-normal outline-none",
            isDark ? "text-gray-400" : "text-gray-600"
          )}
        >
          {subtitle}
        </p>

        {/* Call to Actions */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          {ctaText && (
            <a
              href={ctaLink || "#"}
              className="px-8 py-4 bg-[#d3ff4a] hover:bg-[#bce63b] text-[#0b1411] font-black text-xs uppercase tracking-wider rounded-full shadow-lg shadow-[#d3ff4a]/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
              <span
                contentEditable={isSelected}
                suppressContentEditableWarning
                onBlur={(e) => handleInlineEdit("ctaText", e.currentTarget.innerText)}
                className="outline-none"
              >
                {ctaText}
              </span>
              <ArrowRight size={15} />
            </a>
          )}

          {secondaryCtaText && (
            <a
              href={secondaryCtaLink || "#"}
              className={clsx(
                "px-7 py-4 rounded-full font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 border hover:scale-105 active:scale-95",
                isDark
                  ? "bg-white/5 border-white/10 hover:bg-white/10 text-white"
                  : "bg-gray-100 border-gray-200 hover:bg-gray-200 text-gray-900"
              )}
            >
              <Play size={14} className="fill-current text-[#d3ff4a]" />
              <span
                contentEditable={isSelected}
                suppressContentEditableWarning
                onBlur={(e) => handleInlineEdit("secondaryCtaText", e.currentTarget.innerText)}
                className="outline-none"
              >
                {secondaryCtaText}
              </span>
            </a>
          )}
        </div>

        {/* Social Proof */}
        {showSocialProof && (
          <div className="mt-14 pt-8 border-t border-white/10 flex flex-wrap items-center justify-center gap-6 text-xs text-gray-400 font-medium">
            <div className="flex -space-x-2">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80"
                alt="user"
                className="w-8 h-8 rounded-full border-2 border-[#0b1411] object-cover"
              />
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80"
                alt="user"
                className="w-8 h-8 rounded-full border-2 border-[#0b1411] object-cover"
              />
              <img
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80"
                alt="user"
                className="w-8 h-8 rounded-full border-2 border-[#0b1411] object-cover"
              />
              <img
                src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80"
                alt="user"
                className="w-8 h-8 rounded-full border-2 border-[#0b1411] object-cover"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <div className="flex text-amber-400">
                <Star size={13} className="fill-amber-400" />
                <Star size={13} className="fill-amber-400" />
                <Star size={13} className="fill-amber-400" />
                <Star size={13} className="fill-amber-400" />
                <Star size={13} className="fill-amber-400" />
              </div>
              <span className="font-bold text-white">4.9/5</span> from 10,000+ happy builders
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 size={14} />
              <span>No credit card required</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
