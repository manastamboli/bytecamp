'use client'

import { useState, useRef, useEffect } from 'react'
import gsap from 'gsap'
import { Menu, X } from 'lucide-react'

const MENU_LINKS = [
  { label: 'Home', href: '#' },
  { label: 'Features', href: '#' },
  { label: 'Pricing', href: '#' },
  { label: 'Contact', href: '#' },
]

export function FullscreenMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)
  const menuItemsRef = useRef([])
  const backdropRef = useRef(null)
  const hamburgerRef = useRef(null)

  useEffect(() => {
    // Set initial state
    if (menuRef.current) {
      gsap.set(menuRef.current, {
        yPercent: -100,
        opacity: 0,
        pointerEvents: 'none'
      })
    }
  }, [])

  const openMenu = () => {
    setIsOpen(true)

    // Animate backdrop fade in
    gsap.to(backdropRef.current, {
      opacity: 1,
      pointerEvents: 'auto',
      duration: 0.3,
    })

    // Animate menu slide down from top
    gsap.to(menuRef.current, {
      yPercent: 0,
      opacity: 1,
      pointerEvents: 'auto',
      duration: 0.6,
      ease: 'power3.out',
    })

    // Animate menu items with stagger
    gsap.fromTo(
      menuItemsRef.current,
      { opacity: 0, y: -20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: 'power2.out',
        delay: 0.2,
      }
    )
  }

  const closeMenu = () => {
    setIsOpen(false)

    // Animate backdrop fade out
    gsap.to(backdropRef.current, {
      opacity: 0,
      pointerEvents: 'none',
      duration: 0.3,
    })

    // Animate menu items fade out
    gsap.to(menuItemsRef.current, {
      opacity: 0,
      y: -20,
      duration: 0.3,
      stagger: -0.05,
    })

    // Animate menu slide up
    gsap.to(menuRef.current, {
      yPercent: -100,
      opacity: 0,
      duration: 0.5,
      ease: 'power3.in',
      onComplete: () => {
        gsap.set(menuRef.current, { pointerEvents: 'none' })
      }
    })
  }

  const handleLinkClick = () => {
    closeMenu()
  }

  const handleBackdropClick = () => {
    closeMenu()
  }

  return (
    <>
      {/* Hamburger Button */}
      <button
        ref={hamburgerRef}
        onClick={() => (isOpen ? closeMenu() : openMenu())}
        className="fixed top-6 right-6 z-[110] p-2 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
        aria-label="Toggle menu"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white dark:text-black transition-colors duration-500" />
        ) : (
          <Menu className="w-6 h-6 text-white dark:text-black transition-colors duration-500" />
        )}
      </button>

      {/* Backdrop */}
      <div
        ref={backdropRef}
        onClick={handleBackdropClick}
        className="fixed inset-0 bg-black/50 opacity-0 pointer-events-none z-[90]"
      />

      {/* Fullscreen Menu */}
      <div
        ref={menuRef}
        className="fixed top-0 left-0 right-0 bottom-0 bg-black z-[100] flex items-center justify-center will-change-transform"
      >
        <nav className="w-full px-6">
          <ul className="flex flex-col items-center gap-0">
            {MENU_LINKS.map((link, index) => (
              <li key={`${link.label}-${index}`} className="w-full max-w-md">
                <a
                  ref={(el) => {
                    if (el) menuItemsRef.current[index] = el
                  }}
                  href={link.href}
                  onClick={handleLinkClick}
                  className="block text-center py-6 text-4xl md:text-5xl font-bold text-white hover:text-blue-400 transition-colors cursor-pointer"
                >
                  {link.label}
                </a>
                {index < MENU_LINKS.length - 1 && (
                  <hr className="border-t border-gray-700" />
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  )
}