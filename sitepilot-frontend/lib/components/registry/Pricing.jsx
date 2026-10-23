"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { Check, Sparkles, ArrowRight } from "lucide-react";
import useBuilderStore from "@/lib/stores/builderStore";
import { useCartStore } from "@/lib/stores/cartStore";

export default function Pricing({ props = {}, styles = {}, isSelected, onClick, id }) {
  const {
    title = "Transparent, Predictable Pricing",
    subtitle = "Choose the plan that fits your growth. Switch or cancel anytime with zero friction.",
    badge = "FLEXIBLE PLANS",
    currency = "₹",
    plans = [
      {
        id: "plan-starter",
        name: "Starter",
        monthlyPrice: 999,
        annualPrice: 799,
        description: "Perfect for indie creators and early-stage websites.",
        featured: false,
        features: [
          "1 Production Website",
          "Custom Domain + SSL",
          "Up to 10,000 monthly visitors",
          "Standard AI Copilot Generations",
          "Community Support",
        ],
        ctaText: "Start Free Trial",
      },
      {
        id: "plan-pro",
        name: "Pro Creator",
        monthlyPrice: 2499,
        annualPrice: 1999,
        description: "Engineered for scaling startups, agencies, and businesses.",
        featured: true,
        features: [
          "Unlimited Production Sites",
          "Full Headless E-Commerce Store",
          "Real-Time Multiplayer Collaboration",
          "Zero Razorpay Transaction Fees",
          "Export Next.js Source & Dockerfile",
          "Priority 24/7 Concierge Support",
        ],
        ctaText: "Unlock Pro Power",
      },
      {
        id: "plan-enterprise",
        name: "Enterprise",
        monthlyPrice: 6999,
        annualPrice: 5499,
        description: "Dedicated infrastructure, SLA guarantees, and custom K8s pods.",
        featured: false,
        features: [
          "Custom Kubernetes Cluster Ingress",
          "Dedicated Neon PostgreSQL Pool",
          "White-Label Reseller Portal",
          "99.99% Uptime SLA Agreement",
          "Dedicated Solutions Architect",
        ],
        ctaText: "Contact Sales",
      },
    ],
    theme = "dark",
  } = props;

  const [isAnnual, setIsAnnual] = useState(true);
  const addItem = useCartStore((s) => s.addItem);
  const updateComponentProps = useBuilderStore((s) => s.updateComponentProps);

  const handleInlineEdit = (key, value) => {
    if (id && updateComponentProps) {
      updateComponentProps(id, { [key]: value });
    }
  };

  const handlePlanCheckout = (e, plan) => {
    e.stopPropagation();
    const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
    addItem({
      id: `${plan.id}-${isAnnual ? "annual" : "monthly"}`,
      title: `SitePilot ${plan.name} (${isAnnual ? "Yearly" : "Monthly"})`,
      price: price,
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80",
      quantity: 1,
      variant: isAnnual ? "Annual Billing (20% Off)" : "Monthly Billing",
    });
  };

  const isDark = theme === "dark" || styles?.backgroundColor?.includes("#0") || styles?.backgroundColor?.includes("#1");

  return (
    <div
      onClick={onClick}
      className={clsx(
        "relative py-24 px-6 overflow-hidden transition-all duration-300",
        isSelected && "ring-2 ring-blue-500 ring-offset-2",
        isDark ? "bg-[#0b1411] text-white" : "bg-white text-gray-900"
      )}
      style={{
        backgroundColor: styles?.backgroundColor || (isDark ? "#0b1411" : "#ffffff"),
        paddingTop: styles?.paddingTop ? `${styles.paddingTop}px` : "96px",
        paddingBottom: styles?.paddingBottom ? `${styles.paddingBottom}px` : "96px",
      }}
    >
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
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
              "text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-4 outline-none",
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
              "text-sm sm:text-base leading-relaxed outline-none",
              isDark ? "text-gray-400" : "text-gray-600"
            )}
          >
            {subtitle}
          </p>

          {/* Monthly / Annual Toggle */}
          <div className="mt-8 inline-flex items-center gap-3 p-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsAnnual(false);
              }}
              className={clsx(
                "px-5 py-2 rounded-full text-xs font-bold transition-all",
                !isAnnual
                  ? "bg-[#d3ff4a] text-[#0b1411] shadow-md"
                  : "text-gray-400 hover:text-white"
              )}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsAnnual(true);
              }}
              className={clsx(
                "px-5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2",
                isAnnual
                  ? "bg-[#d3ff4a] text-[#0b1411] shadow-md"
                  : "text-gray-400 hover:text-white"
              )}
            >
              <span>Annual</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/30 font-black">
                SAVE 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan, idx) => {
            const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
            return (
              <div
                key={plan.id || idx}
                className={clsx(
                  "rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 relative border",
                  plan.featured
                    ? "bg-[#14231e] border-[#d3ff4a]/60 shadow-2xl shadow-[#d3ff4a]/10 scale-105 z-10"
                    : isDark
                    ? "bg-white/[0.03] border-white/10 hover:border-white/20"
                    : "bg-white border-gray-200 shadow-sm hover:shadow-md"
                )}
              >
                {plan.featured && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#d3ff4a] text-[#0b1411] text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md">
                    <Sparkles size={11} />
                    MOST POPULAR
                  </div>
                )}

                <div>
                  <h3 className="text-xl font-bold mb-2 text-white">{plan.name}</h3>
                  <p className="text-xs text-gray-400 mb-6 leading-relaxed">{plan.description}</p>

                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-black text-white">
                      {currency}
                      {price}
                    </span>
                    <span className="text-xs text-gray-400 font-medium">/ month</span>
                  </div>

                  <ul className="space-y-3 mb-8 text-xs text-gray-300">
                    {plan.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2.5">
                        <Check size={14} className="text-[#d3ff4a] shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={(e) => handlePlanCheckout(e, plan)}
                  className={clsx(
                    "w-full py-3.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2",
                    plan.featured
                      ? "bg-[#d3ff4a] hover:bg-[#bce63b] text-[#0b1411] shadow-lg shadow-[#d3ff4a]/20 hover:scale-105 active:scale-95"
                      : "bg-white/10 hover:bg-white/20 text-white"
                  )}
                >
                  <span>{plan.ctaText}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
