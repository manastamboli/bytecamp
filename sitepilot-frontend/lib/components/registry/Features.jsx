"use client";

import { clsx } from "clsx";

export default function Features({ props, styles, isSelected, onClick }) {
  const { title, items = [] } = props;

  const defaultItems = items.length
    ? items
    : [
        { title: "Feature 1", description: "Description of feature 1" },
        { title: "Feature 2", description: "Description of feature 2" },
        { title: "Feature 3", description: "Description of feature 3" },
      ];

  return (
    <div
      onClick={onClick}
      className={clsx("py-12", isSelected && "ring-2 ring-blue-500")}
      style={{
        backgroundColor: styles?.backgroundColor,
        paddingTop: styles?.paddingTop ? `${styles.paddingTop}px` : undefined,
        paddingBottom: styles?.paddingBottom
          ? `${styles.paddingBottom}px`
          : undefined,
      }}
    >
      {title && (
        <h2
          className="text-3xl font-bold text-center mb-12"
          style={{ color: styles?.textColor || "#1f2937" }}
        >
          {title}
        </h2>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {defaultItems.map((item, index) => (
          <div key={index} className="text-center">
            <h3
              className="text-xl font-semibold mb-2"
              style={{ color: styles?.textColor || "#1f2937" }}
            >
              {item.title}
            </h3>
            <p
              style={{
                color: styles?.textColor ? `${styles.textColor}cc` : "#4b5563",
              }}
            >
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
