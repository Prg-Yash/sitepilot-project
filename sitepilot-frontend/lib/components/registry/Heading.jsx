"use client";

import { clsx } from "clsx";
import useBuilderStore from "@/lib/stores/builderStore";

export default function Heading({ props = {}, styles = {}, isSelected, onClick, id }) {
  const { text = "Heading Text", level = "h2" } = props;
  const Component = level;
  const updateComponentProps = useBuilderStore((s) => s.updateComponentProps);

  const levelStyles = {
    h1: "text-4xl sm:text-5xl font-black",
    h2: "text-3xl sm:text-4xl font-bold",
    h3: "text-2xl sm:text-3xl font-bold",
    h4: "text-xl sm:text-2xl font-semibold",
    h5: "text-lg sm:text-xl font-medium",
    h6: "text-base sm:text-lg font-medium",
  };

  const handleBlur = (e) => {
    if (id && updateComponentProps) {
      updateComponentProps(id, { text: e.currentTarget.innerText });
    }
  };

  return (
    <Component
      onClick={onClick}
      contentEditable={isSelected}
      suppressContentEditableWarning
      onBlur={handleBlur}
      className={clsx(
        levelStyles[level] || levelStyles.h2,
        "mb-4 outline-none tracking-tight transition-all",
        isSelected && "ring-2 ring-blue-500 rounded px-1"
      )}
      style={{
        paddingTop: styles?.paddingTop ? `${styles.paddingTop}px` : undefined,
        paddingBottom: styles?.paddingBottom ? `${styles.paddingBottom}px` : undefined,
        paddingLeft: styles?.paddingLeft ? `${styles.paddingLeft}px` : undefined,
        paddingRight: styles?.paddingRight ? `${styles.paddingRight}px` : undefined,
        marginTop: styles?.marginTop ? `${styles.marginTop}px` : undefined,
        marginBottom: styles?.marginBottom ? `${styles.marginBottom}px` : undefined,
        color: styles?.textColor || undefined,
        textAlign: styles?.textAlign || "left",
        backgroundColor: styles?.backgroundColor,
        fontFamily: styles?.fontFamily || undefined,
        fontWeight: styles?.fontWeight || undefined,
        fontSize: styles?.fontSize ? `${styles.fontSize}px` : undefined,
      }}
    >
      {text}
    </Component>
  );
}
