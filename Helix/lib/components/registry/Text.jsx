"use client";

import { clsx } from "clsx";

export default function Text({ props, styles, isSelected, onClick }) {
  const { content, variant = "p" } = props;
  const Component = variant;

  const variantStyles = {
    h1: "text-4xl font-bold",
    h2: "text-3xl font-bold",
    h3: "text-2xl font-semibold",
    h4: "text-xl font-semibold",
    h5: "text-lg font-medium",
    h6: "text-base font-medium",
    p: "text-base",
  };

  return (
    <Component
      onClick={onClick}
      className={clsx(
        variantStyles[variant],
        isSelected && "ring-2 ring-blue-500",
      )}
      style={{
        paddingTop: styles?.paddingTop ? `${styles.paddingTop}px` : undefined,
        paddingBottom: styles?.paddingBottom
          ? `${styles.paddingBottom}px`
          : undefined,
        color: styles?.textColor || "#1f2937",
        textAlign: styles?.textAlign || "left",
        backgroundColor: styles?.backgroundColor,
        fontFamily: styles?.fontFamily || undefined, // Falls back to global via CSS inheritance
        fontWeight: styles?.fontWeight || undefined,
        fontSize: styles?.fontSize ? `${styles.fontSize}px` : undefined,
      }}
    >
      {content || "Enter your text here"}
    </Component>
  );
}
