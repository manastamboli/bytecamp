"use client";

import { clsx } from "clsx";

export default function Navbar({ props, styles, isSelected, onClick }) {
  const { logo, links = [] } = props;

  const defaultLinks = links.length
    ? links
    : [
        { label: "Home", href: "#" },
        { label: "About", href: "#" },
        { label: "Services", href: "#" },
        { label: "Contact", href: "#" },
      ];

  return (
    <nav
      onClick={onClick}
      className={clsx(
        "flex items-center justify-between px-6 py-4",
        isSelected && "ring-2 ring-blue-500",
      )}
      style={{
        backgroundColor: styles?.backgroundColor || "#ffffff",
        borderBottom: "1px solid #e5e7eb",
      }}
    >
      <div
        className="text-xl font-bold"
        style={{ color: styles?.textColor || "#1f2937" }}
      >
        {logo || "Logo"}
      </div>
      <div className="flex gap-6">
        {defaultLinks.map((link, index) => (
          <a
            key={index}
            href={link.href}
            className="hover:text-blue-600 transition-colors"
            style={{ color: styles?.textColor || "#374151" }}
          >
            {link.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
