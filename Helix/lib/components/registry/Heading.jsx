"use client";

import { clsx } from "clsx";

export default function Heading({ props, styles, isSelected, onClick }) {
  const { text, level = "h2" } = props;
  const Component = level;

  const levelStyles = {
    h1: "text-5xl font-bold",
    h2: "text-4xl font-bold",
    h3: "text-3xl font-semibold",
    h4: "text-2xl font-semibold",
    h5: "text-xl font-medium",
    h6: "text-lg font-medium",
  };

  return (
    <Component
      onClick={onClick}
      className={clsx(
        levelStyles[level],
        "mb-4",
        isSelected && "ring-2 ring-blue-500",
      )}
      style={{
        paddingTop: styles?.paddingTop ? `${styles.paddingTop}px` : undefined,
        paddingBottom: styles?.paddingBottom
          ? `${styles.paddingBottom}px`
          : undefined,
        paddingLeft: styles?.paddingLeft
          ? `${styles.paddingLeft}px`
          : undefined,
        paddingRight: styles?.paddingRight
          ? `${styles.paddingRight}px`
          : undefined,
        marginTop: styles?.marginTop ? `${styles.marginTop}px` : undefined,
        marginBottom: styles?.marginBottom
          ? `${styles.marginBottom}px`
          : undefined,
        color: styles?.textColor || "#1f2937",
        textAlign: styles?.textAlign || "left",
        backgroundColor: styles?.backgroundColor,
        fontFamily: styles?.fontFamily || undefined,
        fontWeight: styles?.fontWeight || undefined,
        fontSize: styles?.fontSize ? `${styles.fontSize}px` : undefined,
      }}
    >
      {text || "Heading Text"}
    </Component>
  );
}
