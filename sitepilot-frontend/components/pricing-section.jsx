'use client'

import { GridPattern } from '@/components/ui/grid-pattern'
import { Check } from 'lucide-react'

export default function PricingSection() {
  return (
    <section className="relative bg-black dark:bg-white py-20 px-4 sm:px-6 lg:px-8 overflow-hidden transition-colors duration-500">
      {/* Grid Pattern Background */}
      <GridPattern
        width={40}
        height={40}
        className="absolute inset-0 h-full w-full fill-gray-800/20 dark:fill-gray-300/20 stroke-gray-800/20 dark:stroke-gray-300/20 transition-colors duration-500"
        squares={[
          [0, 1],
          [1, 3],
          [2, 0],
          [3, 2],
          [4, 4],
          [5, 1],
          [6, 3],
          [7, 0],
          [8, 2],
          [9, 4],
          [10, 1],
          [11, 3],
          [12, 0],
          [13, 2],
          [14, 4],
          [15, 1],
          [16, 3],
          [17, 0],
          [18, 2],
          [19, 4],
        ]}
      />

      {/* Plus Icons in Corners */}
      <div className="absolute top-20 left-20 text-gray-700 dark:text-gray-400 text-4xl transition-colors duration-500">+</div>
      <div className="absolute top-20 right-20 text-gray-700 dark:text-gray-400 text-4xl transition-colors duration-500">+</div>
      <div className="absolute bottom-20 left-20 text-gray-700 dark:text-gray-400 text-4xl transition-colors duration-500">+</div>
      <div className="absolute bottom-20 right-20 text-gray-700 dark:text-gray-400 text-4xl transition-colors duration-500">+</div>

      <div className="relative max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-2 rounded-full border border-gray-700 dark:border-gray-300 mb-6 transition-colors duration-500">
            <span className="text-sm text-gray-300 dark:text-gray-700 transition-colors duration-500">Pricing</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-white dark:text-black mb-4 transition-colors duration-500">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-gray-400 dark:text-gray-600 max-w-2xl mx-auto transition-colors duration-500">
            Choose the perfect plan for your organization. Scale as you grow with flexible pricing designed for multi-tenant success.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Monthly Plan */}
          <div className="bg-gray-900/50 dark:bg-gray-100/50 backdrop-blur-sm border border-gray-800 dark:border-gray-300 rounded-2xl p-8 hover:border-gray-700 dark:hover:border-gray-400 transition-all duration-500">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-semibold text-white dark:text-black transition-colors duration-500">Starter</h3>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 dark:text-gray-600 line-through text-sm transition-colors duration-500">$49</span>
                <span className="px-2 py-1 bg-gray-800 dark:bg-gray-200 text-gray-300 dark:text-gray-700 text-xs rounded-full transition-colors duration-500">
                  20% off
                </span>
              </div>
            </div>
            <p className="text-gray-400 dark:text-gray-600 text-sm mb-6 transition-colors duration-500">Perfect for small teams and startups</p>
            
            <div className="mb-6">
              <div className="flex items-baseline">
                <span className="text-gray-400 dark:text-gray-600 text-2xl transition-colors duration-500">$</span>
                <span className="text-5xl font-bold text-white dark:text-black transition-colors duration-500">39</span>
                <span className="text-gray-400 dark:text-gray-600 text-xl ml-2 transition-colors duration-500">/month</span>
              </div>
            </div>

            <button className="w-full py-3 px-6 bg-transparent border border-gray-700 dark:border-gray-400 text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-all font-medium duration-300">
              Start Building
            </button>
          </div>

          {/* Yearly Plan */}
          <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-2xl p-8 hover:shadow-xl transition-all duration-500">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-semibold text-black dark:text-white transition-colors duration-500">Professional</h3>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 dark:text-gray-400 line-through text-sm transition-colors duration-500">$99</span>
                <span className="px-2 py-1 bg-black dark:bg-white text-white dark:text-black text-xs rounded-full transition-colors duration-500">
                  30% off
                </span>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 transition-colors duration-500">For growing organizations with multiple tenants</p>
            
            <div className="mb-6">
              <div className="flex items-baseline">
                <span className="text-gray-600 dark:text-gray-400 text-2xl transition-colors duration-500">$</span>
                <span className="text-5xl font-bold text-black dark:text-white transition-colors duration-500">69</span>
                <span className="text-gray-600 dark:text-gray-400 text-xl ml-2 transition-colors duration-500">/month</span>
              </div>
            </div>

            <button className="w-full py-3 px-6 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-900 dark:hover:bg-gray-100 transition-all font-medium duration-300">
              Get Started Now
            </button>
          </div>
        </div>

        {/* Features Note */}
        <div className="flex items-center justify-center gap-2 text-gray-400 dark:text-gray-600 transition-colors duration-500">
          <Check className="w-5 h-5" />
          <span>AI builder, custom domains, unlimited pages, and 24/7 support included</span>
        </div>
      </div>
    </section>
  )
}
