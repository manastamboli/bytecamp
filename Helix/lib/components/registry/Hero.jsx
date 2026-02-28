"use client";

import { clsx } from "clsx";

export default function Hero({ props, styles, isSelected, onClick }) {
  const { title, subtitle, ctaText, ctaLink, backgroundImage } = props;

  return (
    <div
      onClick={onClick}
      className={clsx(
        "relative min-h-[400px] flex items-center justify-center",
        isSelected && "ring-4 ring-blue-500",
      )}
      style={{
        backgroundColor: styles?.backgroundColor || "#f3f4f6",
        paddingTop: styles?.paddingTop ? `${styles.paddingTop}px` : "80px",
        paddingBottom: styles?.paddingBottom
          ? `${styles.paddingBottom}px`
          : "80px",
        backgroundImage: backgroundImage
          ? `url(${backgroundImage})`
          : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="max-w-4xl mx-auto text-center px-4">
        <h1
          className="text-5xl font-bold mb-4"
          style={{
            color: styles?.textColor || "#1f2937",
          }}
        >
          {title || "Your Hero Title"}
        </h1>
        <p
          className="text-xl mb-8"
          style={{
            color: styles?.textColor || "#4b5563",
          }}
        >
          {subtitle || "Your hero subtitle goes here"}
        </p>
        {ctaText && (
          <button className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            {ctaText}
          </button>
        )}
      </div>
    </div>
  );
}
