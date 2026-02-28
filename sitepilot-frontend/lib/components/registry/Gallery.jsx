"use client";

import { clsx } from "clsx";

export default function Gallery({ props, styles, isSelected, onClick }) {
  const { images = [], columns = 3 } = props;

  const defaultImages = images.length
    ? images
    : [
        { src: "https://via.placeholder.com/400", alt: "Gallery 1" },
        { src: "https://via.placeholder.com/400", alt: "Gallery 2" },
        { src: "https://via.placeholder.com/400", alt: "Gallery 3" },
      ];

  return (
    <div
      onClick={onClick}
      className={clsx(isSelected && "ring-2 ring-blue-500")}
      style={{
        paddingTop: styles?.paddingTop ? `${styles.paddingTop}px` : "20px",
        paddingBottom: styles?.paddingBottom
          ? `${styles.paddingBottom}px`
          : "20px",
        backgroundColor: styles?.backgroundColor,
      }}
    >
      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
        }}
      >
        {defaultImages.map((image, index) => (
          <img
            key={index}
            src={image.src}
            alt={image.alt}
            className="w-full h-auto rounded-lg"
          />
        ))}
      </div>
    </div>
  );
}
