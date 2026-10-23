"use client";

import { clsx } from "clsx";
import { ShoppingBag, Sparkles, Menu } from "lucide-react";
import { useCartStore } from "@/lib/stores/cartStore";
import useBuilderStore from "@/lib/stores/builderStore";

export default function Navbar({ props = {}, styles = {}, isSelected, onClick, id }) {
  const {
    logo = "SitePilot",
    links = [
      { label: "Features", href: "#features" },
      { label: "Products", href: "#store" },
      { label: "Pricing", href: "#pricing" },
      { label: "Contact", href: "#contact" },
    ],
    ctaText = "Get Started",
    ctaLink = "#",
    theme = "dark",
    floating = true,
  } = props;

  const { openCart, getTotalCount } = useCartStore();
  const cartCount = getTotalCount();
  const updateComponentProps = useBuilderStore((s) => s.updateComponentProps);

  const handleInlineEdit = (key, value) => {
    if (id && updateComponentProps) {
      updateComponentProps(id, { [key]: value });
    }
  };

  const isDark = theme === "dark" || styles?.backgroundColor?.includes("#0") || styles?.backgroundColor?.includes("#1");

  return (
    <header
      onClick={onClick}
      className={clsx(
        "w-full transition-all duration-200 z-40 relative px-4 py-4",
        isSelected && "ring-2 ring-blue-500",
        isDark ? "bg-[#0b1411]/90" : "bg-white/90"
      )}
      style={{
        backgroundColor: styles?.backgroundColor || (isDark ? "rgba(11, 20, 17, 0.9)" : "rgba(255, 255, 255, 0.9)"),
      }}
    >
      <div
        className={clsx(
          "max-w-5xl mx-auto flex items-center justify-between px-6 py-3 transition-all",
          floating && "rounded-full border backdrop-blur-xl shadow-lg",
          isDark
            ? "border-white/10 bg-white/[0.04] text-white"
            : "border-gray-200 bg-white/80 text-gray-900 shadow-sm"
        )}
      >
        {/* Brand Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#d3ff4a] text-[#0b1411] flex items-center justify-center font-black text-sm shadow-md">
            <Sparkles size={16} />
          </div>
          <span
            contentEditable={isSelected}
            suppressContentEditableWarning
            onBlur={(e) => handleInlineEdit("logo", e.currentTarget.innerText)}
            className="font-black text-sm uppercase tracking-wider outline-none"
          >
            {logo}
          </span>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold">
          {links.map((link, idx) => (
            <a
              key={idx}
              href={link.href || "#"}
              className="text-gray-300 hover:text-white transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right Actions: Cart & CTA */}
        <div className="flex items-center gap-3">
          {/* Cart Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openCart();
            }}
            className="relative p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all hover:scale-105 active:scale-95"
            title="Open Shopping Cart"
          >
            <ShoppingBag size={16} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#d3ff4a] text-[#0b1411] text-[9px] font-black rounded-full flex items-center justify-center shadow-md animate-in zoom-in">
                {cartCount}
              </span>
            )}
          </button>

          {/* Primary CTA */}
          {ctaText && (
            <a
              href={ctaLink || "#"}
              className="hidden sm:flex px-4 py-2 bg-[#d3ff4a] hover:bg-[#bce63b] text-[#0b1411] font-black text-[11px] uppercase tracking-wider rounded-full shadow-md hover:scale-105 active:scale-95 transition-all items-center"
            >
              <span
                contentEditable={isSelected}
                suppressContentEditableWarning
                onBlur={(e) => handleInlineEdit("ctaText", e.currentTarget.innerText)}
                className="outline-none"
              >
                {ctaText}
              </span>
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
