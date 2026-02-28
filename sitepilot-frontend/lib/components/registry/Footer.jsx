"use client";

import { clsx } from "clsx";

export default function Footer({ props, styles, isSelected, onClick }) {
  const { copyright, links = [] } = props;

  return (
    <footer
      onClick={onClick}
      className={clsx(
        "px-6 py-8 text-center",
        isSelected && "ring-2 ring-blue-500",
      )}
      style={{
        backgroundColor: styles?.backgroundColor || "#1f2937",
        color: styles?.textColor || "#ffffff",
      }}
    >
      {links.length > 0 && (
        <div className="flex justify-center gap-6 mb-4">
          {links.map((link, index) => (
            <a
              key={index}
              href={link.href}
              className="hover:text-blue-400 transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>
      )}
      <p className="text-sm">
        {copyright || "© 2026 Your Company. All rights reserved."}
      </p>
    </footer>
  );
}
