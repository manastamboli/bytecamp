"use client";

import { clsx } from "clsx";

export default function CTA({ props, styles, isSelected, onClick }) {
  const { title, description, buttonText, buttonLink } = props;

  return (
    <div
      onClick={onClick}
      className={clsx(
        "py-16 text-center",
        isSelected && "ring-2 ring-blue-500",
      )}
      style={{
        backgroundColor: styles?.backgroundColor || "#3b82f6",
        paddingTop: styles?.paddingTop ? `${styles.paddingTop}px` : undefined,
        paddingBottom: styles?.paddingBottom
          ? `${styles.paddingBottom}px`
          : undefined,
      }}
    >
      <div className="max-w-3xl mx-auto px-4">
        <h2
          className="text-4xl font-bold mb-4"
          style={{ color: styles?.textColor || "#ffffff" }}
        >
          {title || "Ready to Get Started?"}
        </h2>
        <p
          className="text-xl mb-8 opacity-90"
          style={{ color: styles?.textColor || "#ffffff" }}
        >
          {description || "Join us today and experience the difference"}
        </p>
        <button className="px-8 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors font-semibold">
          {buttonText || "Get Started"}
        </button>
      </div>
    </div>
  );
}
