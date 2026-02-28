'use client'

import { Twitter, Linkedin } from 'lucide-react'
import { useTheme } from '@/contexts/theme-context'

export default function Footer() {
  const { theme, toggleTheme } = useTheme()

  return (
    <footer className="relative bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white border-t border-gray-200 dark:border-gray-800 transition-colors duration-500">
      <div className="relative z-10">
        {/* Main Footer Content */}
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {/* Company */}
            <div>
              <h3 className="text-lg font-bold mb-6">SitePilot</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-500">
                AI-powered multi-tenant website builder for modern organizations.
              </p>
            </div>

            {/* Product */}
            <div>
              <h3 className="text-sm font-semibold mb-4 text-gray-900 dark:text-white transition-colors duration-500">Product</h3>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                    Documentation
                  </a>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-sm font-semibold mb-4 text-gray-900 dark:text-white transition-colors duration-500">Company</h3>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            {/* Social */}
            <div>
              <h3 className="text-sm font-semibold mb-4 text-gray-900 dark:text-white transition-colors duration-500">Follow Us</h3>
              <div className="flex gap-3 mb-6">
                <a
                  href="#"
                  className="w-10 h-10 rounded-full border border-gray-300 dark:border-gray-700 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <Twitter className="w-4 h-4" />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 rounded-full border border-gray-300 dark:border-gray-700 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
              </div>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                {theme === 'dark' ? '☀️ Light' : '🌙 Dark'} Mode
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 dark:border-gray-800 transition-colors duration-500">
          <div className="max-w-6xl mx-auto px-6 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-600 dark:text-gray-400 transition-colors duration-500">
              <p>© 2024 SitePilot. All rights reserved.</p>
              <div className="flex gap-6">
                <a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">
                  Privacy
                </a>
                <a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">
                  Terms
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
