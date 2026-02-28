"use client"

import { cn } from "@/lib/utils"
import { Marquee } from "@/components/ui/marquee"

const reviews = [
  {
    name: "Sarah Chen",
    username: "@sarahchen",
    body: "This platform transformed how we manage our restaurant websites. The AI builder saved us weeks of development time!",
    img: "https://avatar.vercel.sh/sarahchen",
  },
  {
    name: "Michael Torres",
    username: "@mtorres",
    body: "Perfect for our school district. Each school has its own branded site with complete isolation. Exactly what we needed.",
    img: "https://avatar.vercel.sh/mtorres",
  },
  {
    name: "Emily Watson",
    username: "@emilyw",
    body: "The multi-tenant architecture is brilliant. We can manage 50+ client websites from one dashboard. Game changer!",
    img: "https://avatar.vercel.sh/emilyw",
  },
  {
    name: "David Kim",
    username: "@davidkim",
    body: "AI-powered design suggestions helped us create professional sites in minutes. Our clients love the results.",
    img: "https://avatar.vercel.sh/davidkim",
  },
  {
    name: "Lisa Anderson",
    username: "@lisaa",
    body: "Role-based access control makes team collaboration seamless. Everyone has the right permissions automatically.",
    img: "https://avatar.vercel.sh/lisaa",
  },
  {
    name: "James Rodriguez",
    username: "@jamesrod",
    body: "The deployment workflow is smooth and the custom domain setup was surprisingly easy. Highly recommend!",
    img: "https://avatar.vercel.sh/jamesrod",
  },
]

const firstRow = reviews.slice(0, reviews.length / 2)
const secondRow = reviews.slice(reviews.length / 2)

const ReviewCard = ({
  img,
  name,
  username,
  body,
}) => {
  return (
    <figure
      className={cn(
        "relative w-80 cursor-pointer overflow-hidden rounded-2xl border p-6",
        "border-gray-700 dark:border-gray-300 bg-gray-800/80 dark:bg-gray-100/80 hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors duration-500"
      )}
    >
      <div className="flex flex-row items-center gap-3">
        <img className="rounded-full w-12 h-12" width="48" height="48" alt="" src={img} />
        <div className="flex flex-col">
          <figcaption className="text-base font-semibold text-white dark:text-black transition-colors duration-500">
            {name}
          </figcaption>
          <p className="text-sm font-normal text-gray-400 dark:text-gray-600 transition-colors duration-500">{username}</p>
        </div>
      </div>
      <blockquote className="mt-4 text-base text-gray-300 dark:text-gray-700 transition-colors duration-500">{body}</blockquote>
    </figure>
  )
}

export function MarqueeDemo() {
  return (
    <div className="relative flex w-full flex-col items-center justify-center overflow-hidden py-8 gap-6 bg-black dark:bg-white transition-colors duration-500">
      <Marquee pauseOnHover className="[--duration:30s] [--gap:1.5rem]">
        {firstRow.map((review) => (
          <ReviewCard key={review.username} {...review} />
        ))}
      </Marquee>
      <Marquee reverse pauseOnHover className="[--duration:30s] [--gap:1.5rem]">
        {secondRow.map((review) => (
          <ReviewCard key={review.username} {...review} />
        ))}
      </Marquee>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/6 bg-gradient-to-r from-black dark:from-white transition-colors duration-500"></div>
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/6 bg-gradient-to-l from-black dark:from-white transition-colors duration-500"></div>
    </div>
  )
}
