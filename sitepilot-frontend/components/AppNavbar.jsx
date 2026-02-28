"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import Shuffle from "@/components/Shuffle";
import { motion } from "framer-motion";
import Link from "next/link";

export default function AppNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between mb-16 sm:mb-24 pt-6"
      >
        <Link href="/" className="flex items-center gap-2 text-white">
          <div className="flex flex-col gap-0.5 w-6">
            <span className="w-5 h-[3px] bg-[#d3ff4a] rounded-full" />
            <span className="w-6 h-[3px] bg-[#00e5ff] rounded-full" />
            <span className="w-4 h-[3px] bg-white rounded-full" />
          </div>
          <span className="text-xl font-bold tracking-tight">SitePilot</span>
        </Link>

        <div className="flex items-center gap-4 sm:gap-6 text-sm font-semibold">
          <div className="hidden sm:flex items-center gap-4">
            <Link href="/signin" className="text-white hover:text-gray-200 transition-colors px-4 py-2">
              Login
            </Link>
            <Link href="/signup" className="bg-[#d3ff4a] text-[#0a1512] px-6 py-2.5 rounded-full hover:bg-[#c0eb3f] transition-colors hover:scale-105 active:scale-95 duration-200">
              Get Started
            </Link>
          </div>
          {/* Menu Button */}
          <button
            className="text-white hover:text-[#d3ff4a] transition-colors"
            onClick={() => setIsMenuOpen(true)}
          >
            <Menu size={28} />
          </button>
        </div>
      </motion.nav>

      {/* Half-Screen Slide-in Menu */}
      <div
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setIsMenuOpen(false)}
      >
        <div
          className={`absolute top-0 right-0 h-full w-[80vw] sm:w-[50vw] lg:w-[40vw] bg-[#0f211d] border-l border-white/10 p-8 md:p-12 shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] flex flex-col ${isMenuOpen ? "translate-x-0" : "translate-x-full"}`}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="absolute top-8 right-8 text-gray-400 hover:text-white transition-colors"
            onClick={() => setIsMenuOpen(false)}
          >
            <X size={32} />
          </button>

          <div className="flex flex-col gap-6 md:gap-8 mt-20 flex-1 justify-center -translate-y-12">
            <Link href="/" onClick={() => setIsMenuOpen(false)} className="w-fit group">
              <Shuffle text="Home" tag="div" className="!text-4xl md:!text-5xl lg:!text-6xl font-black text-white group-hover:text-[#d3ff4a] transition-colors tracking-tight" />
            </Link>
            <Link href="/features" onClick={() => setIsMenuOpen(false)} className="w-fit group">
              <Shuffle text="Features" tag="div" className="!text-4xl md:!text-5xl lg:!text-6xl font-black text-white group-hover:text-[#d3ff4a] transition-colors tracking-tight" />
            </Link>
            <Link href="/pricing" onClick={() => setIsMenuOpen(false)} className="w-fit group">
              <Shuffle text="Pricing" tag="div" className="!text-4xl md:!text-5xl lg:!text-6xl font-black text-white group-hover:text-[#d3ff4a] transition-colors tracking-tight" />
            </Link>
            <Link href="/contact" onClick={() => setIsMenuOpen(false)} className="w-fit group">
              <Shuffle text="Contact" tag="div" className="!text-4xl md:!text-5xl lg:!text-6xl font-black text-white group-hover:text-[#d3ff4a] transition-colors tracking-tight" />
            </Link>
          </div>

          <div className="flex flex-col gap-4 mt-auto sm:hidden">
            <Link href="/signin" onClick={() => setIsMenuOpen(false)} className="text-center text-white font-semibold py-3 border border-white/20 rounded-xl hover:bg-white/5 transition-colors">
              Login
            </Link>
            <Link href="/signup" onClick={() => setIsMenuOpen(false)} className="text-center bg-[#d3ff4a] text-[#0a1512] font-semibold py-3 rounded-xl hover:bg-[#c0eb3f] transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
