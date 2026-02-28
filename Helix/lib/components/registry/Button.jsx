"use client";

import { clsx } from "clsx";

export default function Button({ props, styles, isSelected, onClick }) {
  const { text, link, variant = "primary", openInNewTab = false } = props;

  const variantStyles = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-600 text-white hover:bg-gray-700",
    outline: "border-2 border-blue-600 text-blue-600 hover:bg-blue-50",
  };

  return (
    <div
      onClick={(e) => {
        if (onClick) {
          e.preventDefault();
          onClick(e);
        }
      }}
      className={clsx("inline-block", isSelected && "ring-2 ring-blue-500")}
      style={{
        paddingTop: styles?.paddingTop ? `${styles.paddingTop}px` : undefined,
        paddingBottom: styles?.paddingBottom
          ? `${styles.paddingBottom}px`
          : undefined,
        fontFamily: styles?.fontFamily || undefined,
      }}
    >
      <a
        href={link || "#"}
        target={openInNewTab ? "_blank" : "_self"}
        rel={openInNewTab ? "noopener noreferrer" : undefined}
        className={clsx(
          "px-6 py-2 rounded-lg transition-colors inline-block text-center",
          variantStyles[variant],
        )}
      >
        {text || "Button Text"}
      </a>
    </div>
  );
}
