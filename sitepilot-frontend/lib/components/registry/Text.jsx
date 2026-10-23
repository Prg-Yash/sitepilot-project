"use client";

import { clsx } from "clsx";
import useBuilderStore from "@/lib/stores/builderStore";

export default function Text({ props = {}, styles = {}, isSelected, onClick, id }) {
  const { content = "Enter your text here", variant = "p" } = props;
  const Component = variant;
  const updateComponentProps = useBuilderStore((s) => s.updateComponentProps);

  const variantStyles = {
    h1: "text-4xl font-bold",
    h2: "text-3xl font-bold",
    h3: "text-2xl font-semibold",
    h4: "text-xl font-semibold",
    h5: "text-lg font-medium",
    h6: "text-base font-medium",
    p: "text-base leading-relaxed",
  };

  const handleBlur = (e) => {
    if (id && updateComponentProps) {
      updateComponentProps(id, { content: e.currentTarget.innerText });
    }
  };

  return (
    <Component
      onClick={onClick}
      contentEditable={isSelected}
      suppressContentEditableWarning
      onBlur={handleBlur}
      className={clsx(
        variantStyles[variant] || "text-base",
        "outline-none transition-all",
        isSelected && "ring-2 ring-blue-500 rounded px-1"
      )}
      style={{
        paddingTop: styles?.paddingTop ? `${styles.paddingTop}px` : undefined,
        paddingBottom: styles?.paddingBottom ? `${styles.paddingBottom}px` : undefined,
        color: styles?.textColor || "#4b5563",
        textAlign: styles?.textAlign || "left",
        backgroundColor: styles?.backgroundColor,
        fontFamily: styles?.fontFamily || undefined,
        fontWeight: styles?.fontWeight || undefined,
        fontSize: styles?.fontSize ? `${styles.fontSize}px` : undefined,
      }}
    >
      {content}
    </Component>
  );
}
