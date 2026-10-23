"use client";

import { MessageCircle } from "lucide-react";
import { clsx } from "clsx";

export default function WhatsAppWidget({ props = {}, styles = {}, isSelected, onClick }) {
  const {
    phoneNumber = "919876543210",
    message = "Hi! I am visiting your site and would like more information.",
    tooltip = "Chat with us on WhatsApp",
    position = "bottom-right", // "bottom-right", "bottom-left"
  } = props;

  const url = `https://wa.me/${phoneNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(message)}`;

  return (
    <div
      onClick={onClick}
      className={clsx(
        "fixed z-50 transition-all flex items-center gap-3 group/wa cursor-pointer",
        position === "bottom-left" ? "bottom-6 left-6 flex-row-reverse" : "bottom-6 right-6",
        isSelected && "ring-4 ring-emerald-400 rounded-full"
      )}
    >
      {/* Tooltip */}
      <span className="hidden sm:inline-block px-3 py-1.5 rounded-xl bg-gray-900 text-white text-xs font-bold shadow-xl opacity-0 group-hover/wa:opacity-100 transition-opacity">
        {tooltip}
      </span>

      {/* WhatsApp Button */}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => {
          if (isSelected) e.preventDefault(); // Don't navigate while editing in canvas
        }}
        className="w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all relative"
      >
        <div className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-25 pointer-events-none" />
        <MessageCircle size={28} className="fill-white text-[#25D366]" />
      </a>
    </div>
  );
}
