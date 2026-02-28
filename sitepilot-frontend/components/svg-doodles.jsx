'use client'

export function FloatingDoodles() {
  return (
    <>
      {/* Top Left - Arrow Doodle */}
      <div className="fixed top-32 left-12 opacity-40 dark:opacity-30 pointer-events-none z-10 animate-float">
        <svg width="100" height="100" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M100 20 L180 100 L100 180 L20 100 Z" stroke="currentColor" strokeWidth="5" className="text-purple-500" fill="none"/>
          <circle cx="100" cy="100" r="18" fill="currentColor" className="text-purple-400"/>
        </svg>
      </div>

      {/* Top Right - Star Doodle */}
      <div className="fixed top-48 right-20 opacity-45 dark:opacity-35 pointer-events-none z-10 animate-float-delayed">
        <svg width="90" height="90" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M100 20 L120 80 L180 100 L120 120 L100 180 L80 120 L20 100 L80 80 Z" fill="currentColor" className="text-blue-400" opacity="0.8"/>
          <path d="M100 20 L120 80 L180 100 L120 120 L100 180 L80 120 L20 100 L80 80 Z" stroke="currentColor" strokeWidth="3" className="text-blue-500" fill="none"/>
        </svg>
      </div>

      {/* Middle Left - Circle Doodle */}
      <div className="fixed top-1/3 left-8 opacity-35 dark:opacity-25 pointer-events-none z-10 animate-spin-slow">
        <svg width="120" height="120" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="100" cy="100" r="60" stroke="currentColor" strokeWidth="4" className="text-cyan-500" fill="none" strokeDasharray="10 5"/>
          <circle cx="100" cy="100" r="40" stroke="currentColor" strokeWidth="3" className="text-cyan-400" fill="none"/>
          <circle cx="100" cy="100" r="20" fill="currentColor" className="text-cyan-300" opacity="0.5"/>
        </svg>
      </div>

      {/* Middle Right - Squiggle */}
      <div className="fixed top-1/2 right-16 opacity-45 dark:opacity-35 pointer-events-none z-10 animate-float">
        <svg width="110" height="110" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 100 Q60 50 100 100 T180 100" stroke="currentColor" strokeWidth="5" className="text-pink-500" fill="none" strokeLinecap="round"/>
          <path d="M30 120 Q70 70 110 120 T190 120" stroke="currentColor" strokeWidth="4" className="text-pink-400" fill="none" strokeLinecap="round"/>
          <circle cx="100" cy="100" r="8" fill="currentColor" className="text-pink-300"/>
        </svg>
      </div>

      {/* Bottom Left - Triangle */}
      <div className="fixed bottom-48 left-24 opacity-40 dark:opacity-30 pointer-events-none z-10 animate-float-delayed">
        <svg width="105" height="105" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M100 30 L170 150 L30 150 Z" stroke="currentColor" strokeWidth="5" className="text-green-500" fill="none"/>
          <circle cx="100" cy="110" r="25" fill="currentColor" className="text-green-400" opacity="0.6"/>
          <path d="M100 30 L170 150 L30 150 Z" fill="currentColor" className="text-green-300" opacity="0.2"/>
        </svg>
      </div>

      {/* Bottom Right - Abstract Shape */}
      <div className="fixed bottom-32 right-12 opacity-40 dark:opacity-30 pointer-events-none z-10 animate-pulse-slow">
        <svg width="115" height="115" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M100 20 C140 20 180 60 180 100 C180 140 140 180 100 180 C60 180 20 140 20 100 C20 60 60 20 100 20" stroke="currentColor" strokeWidth="4" className="text-orange-500" fill="none" strokeDasharray="15 5"/>
          <circle cx="100" cy="100" r="30" fill="currentColor" className="text-orange-400" opacity="0.5"/>
          <circle cx="100" cy="100" r="15" fill="currentColor" className="text-orange-300"/>
        </svg>
      </div>

      {/* Floating near hero - Dots */}
      <div className="fixed top-1/4 right-1/4 opacity-35 dark:opacity-25 pointer-events-none z-10 animate-float">
        <svg width="80" height="80" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="12" fill="currentColor" className="text-purple-500"/>
          <circle cx="100" cy="50" r="12" fill="currentColor" className="text-blue-500"/>
          <circle cx="150" cy="50" r="12" fill="currentColor" className="text-cyan-500"/>
          <circle cx="50" cy="100" r="12" fill="currentColor" className="text-pink-500"/>
          <circle cx="100" cy="100" r="12" fill="currentColor" className="text-orange-500"/>
          <circle cx="150" cy="100" r="12" fill="currentColor" className="text-green-500"/>
          <circle cx="50" cy="150" r="12" fill="currentColor" className="text-indigo-500"/>
          <circle cx="100" cy="150" r="12" fill="currentColor" className="text-rose-500"/>
          <circle cx="150" cy="150" r="12" fill="currentColor" className="text-emerald-500"/>
        </svg>
      </div>

      {/* Near pricing - Spiral */}
      <div className="fixed bottom-1/4 left-1/3 opacity-40 dark:opacity-30 pointer-events-none z-10 animate-spin-slow">
        <svg width="95" height="95" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M100 100 Q120 80 140 100 Q160 120 140 140 Q120 160 100 140 Q80 120 100 100" stroke="currentColor" strokeWidth="4" className="text-indigo-500" fill="none" strokeLinecap="round"/>
          <path d="M100 100 Q115 85 130 100 Q145 115 130 130 Q115 145 100 130 Q85 115 100 100" stroke="currentColor" strokeWidth="3" className="text-indigo-400" fill="none" strokeLinecap="round"/>
          <circle cx="100" cy="100" r="10" fill="currentColor" className="text-indigo-300"/>
        </svg>
      </div>

      {/* Additional doodle - Zigzag near tabs */}
      <div className="fixed top-2/3 right-8 opacity-40 dark:opacity-30 pointer-events-none z-10 animate-float-delayed">
        <svg width="100" height="100" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M30 50 L70 90 L30 130 L70 170" stroke="currentColor" strokeWidth="5" className="text-violet-500" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M70 50 L110 90 L70 130 L110 170" stroke="currentColor" strokeWidth="5" className="text-violet-400" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="70" cy="110" r="8" fill="currentColor" className="text-violet-300"/>
        </svg>
      </div>

      {/* Additional doodle - Waves near footer */}
      <div className="fixed bottom-1/3 right-1/4 opacity-35 dark:opacity-25 pointer-events-none z-10 animate-float">
        <svg width="110" height="110" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 80 Q50 60 80 80 T140 80 T200 80" stroke="currentColor" strokeWidth="4" className="text-teal-500" fill="none" strokeLinecap="round"/>
          <path d="M20 100 Q50 80 80 100 T140 100 T200 100" stroke="currentColor" strokeWidth="4" className="text-teal-400" fill="none" strokeLinecap="round"/>
          <path d="M20 120 Q50 100 80 120 T140 120 T200 120" stroke="currentColor" strokeWidth="4" className="text-teal-300" fill="none" strokeLinecap="round"/>
        </svg>
      </div>
    </>
  )
}
