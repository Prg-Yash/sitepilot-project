"use client";

import { clsx } from "clsx";
import { Zap, ShieldCheck, Cpu, Sparkles, Layers, Globe } from "lucide-react";
import useBuilderStore from "@/lib/stores/builderStore";

const defaultIcons = [Zap, ShieldCheck, Cpu, Sparkles, Layers, Globe];

export default function Features({ props = {}, styles = {}, isSelected, onClick, id }) {
  const {
    title = "Engineered for Peak Performance",
    subtitle = "Everything you need to craft, launch, and scale production-ready web experiences with unprecedented speed.",
    badge = "CORE CAPABILITIES",
    items = [
      {
        title: "Sub-Second Edge Rendering",
        description: "Zero server lag with global CloudFront distribution and ultra-optimized asset pre-fetching.",
      },
      {
        title: "Enterprise Multi-Tenancy",
        description: "Isolated environments, custom SSL domains, and automated DNS validation out of the box.",
      },
      {
        title: "Multiplayer Collaboration",
        description: "Real-time visual editing with cursor tracking, component locking, and instant peer synchronization.",
      },
      {
        title: "Headless E-Commerce Native",
        description: "Plug-and-play product catalogs, cart drawers, and instant Razorpay payment gateway integration.",
      },
      {
        title: "Kubernetes Ready Export",
        description: "Download standalone Next.js 15 source code with multi-stage Dockerfiles ready for any cluster.",
      },
      {
        title: "AI-Powered Generation",
        description: "Generate full multi-page layouts and marketing copy with integrated Gemini 2.5 generative intelligence.",
      },
    ],
    theme = "dark",
  } = props;

  const updateComponentProps = useBuilderStore((s) => s.updateComponentProps);

  const handleInlineEdit = (key, value) => {
    if (id && updateComponentProps) {
      updateComponentProps(id, { [key]: value });
    }
  };

  const handleItemEdit = (index, field, value) => {
    if (id && updateComponentProps) {
      const updated = [...items];
      updated[index] = { ...updated[index], [field]: value };
      updateComponentProps(id, { items: updated });
    }
  };

  const isDark = theme === "dark" || styles?.backgroundColor?.includes("#0") || styles?.backgroundColor?.includes("#1");

  return (
    <div
      onClick={onClick}
      className={clsx(
        "relative py-24 px-6 overflow-hidden transition-all duration-300",
        isSelected && "ring-2 ring-blue-500 ring-offset-2",
        isDark ? "bg-[#080d0b] text-white" : "bg-gray-50 text-gray-900"
      )}
      style={{
        backgroundColor: styles?.backgroundColor || (isDark ? "#080d0b" : "#f9fafb"),
        paddingTop: styles?.paddingTop ? `${styles.paddingTop}px` : "96px",
        paddingBottom: styles?.paddingBottom ? `${styles.paddingBottom}px` : "96px",
      }}
    >
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          {badge && (
            <span
              contentEditable={isSelected}
              suppressContentEditableWarning
              onBlur={(e) => handleInlineEdit("badge", e.currentTarget.innerText)}
              className="inline-block text-[11px] font-black uppercase tracking-widest text-[#d3ff4a] bg-[#d3ff4a]/10 px-3.5 py-1.5 rounded-full mb-4 outline-none"
            >
              {badge}
            </span>
          )}

          <h2
            contentEditable={isSelected}
            suppressContentEditableWarning
            onBlur={(e) => handleInlineEdit("title", e.currentTarget.innerText)}
            className={clsx(
              "text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-4 leading-tight outline-none",
              isDark ? "text-white" : "text-gray-950"
            )}
          >
            {title}
          </h2>

          <p
            contentEditable={isSelected}
            suppressContentEditableWarning
            onBlur={(e) => handleInlineEdit("subtitle", e.currentTarget.innerText)}
            className={clsx(
              "text-sm sm:text-base md:text-lg leading-relaxed outline-none",
              isDark ? "text-gray-400" : "text-gray-600"
            )}
          >
            {subtitle}
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, idx) => {
            const Icon = defaultIcons[idx % defaultIcons.length];
            return (
              <div
                key={idx}
                className={clsx(
                  "p-8 rounded-3xl border transition-all duration-300 relative group/card flex flex-col justify-between hover:scale-[1.02]",
                  isDark
                    ? "bg-white/[0.03] border-white/10 hover:border-[#d3ff4a]/40 hover:bg-white/[0.05]"
                    : "bg-white border-gray-200/80 hover:border-gray-900/20 shadow-sm hover:shadow-md"
                )}
              >
                {/* Glow pill */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#d3ff4a]/10 rounded-full blur-2xl opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none" />

                <div>
                  <div
                    className={clsx(
                      "w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover/card:scale-110",
                      isDark
                        ? "bg-[#d3ff4a]/10 text-[#d3ff4a] border border-[#d3ff4a]/20"
                        : "bg-gray-900 text-white"
                    )}
                  >
                    <Icon size={22} />
                  </div>

                  <h3
                    contentEditable={isSelected}
                    suppressContentEditableWarning
                    onBlur={(e) => handleItemEdit(idx, "title", e.currentTarget.innerText)}
                    className={clsx(
                      "text-lg font-bold mb-3 tracking-tight outline-none",
                      isDark ? "text-white" : "text-gray-900"
                    )}
                  >
                    {item.title}
                  </h3>

                  <p
                    contentEditable={isSelected}
                    suppressContentEditableWarning
                    onBlur={(e) => handleItemEdit(idx, "description", e.currentTarget.innerText)}
                    className={clsx(
                      "text-xs sm:text-sm leading-relaxed outline-none",
                      isDark ? "text-gray-400" : "text-gray-600"
                    )}
                  >
                    {item.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[11px] font-bold text-gray-500 group-hover/card:text-[#d3ff4a] transition-colors">
                  <span>Explore capability</span>
                  <span>→</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
