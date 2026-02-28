'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'

const tabs = [
  {
    id: 'ai-builder',
    label: 'AI Website Builder',
    title: 'Intelligent Design Automation',
    description: 'Let AI create professional website layouts, page structures, and content based on your business type. Build faster with smart suggestions and automated optimization.',
    features: [
      'AI-generated layouts and templates',
      'Smart component recommendations',
      'Automated accessibility checks',
      'Responsive design optimization'
    ],
    gradient: 'from-purple-600 to-pink-600'
  },
  {
    id: 'multi-tenant',
    label: 'Multi-Tenant Architecture',
    title: 'Complete Tenant Isolation',
    description: 'Secure, scalable infrastructure that keeps each organization\'s data, assets, and configurations completely separate. Manage unlimited tenants with confidence.',
    features: [
      'Strict data isolation',
      'Independent branding per tenant',
      'Scalable resource allocation',
      'Centralized governance'
    ],
    gradient: 'from-blue-600 to-cyan-600'
  },
  {
    id: 'collaboration',
    label: 'Team Collaboration',
    title: 'Role-Based Access Control',
    description: 'Enable seamless teamwork with granular permissions. Owners, admins, editors, and developers each get the right level of access to manage websites effectively.',
    features: [
      'Multiple user roles',
      'Permission-based workflows',
      'Real-time collaboration',
      'Activity tracking'
    ],
    gradient: 'from-green-600 to-emerald-600'
  },
  {
    id: 'deployment',
    label: 'Smart Deployment',
    title: 'Streamlined Publishing',
    description: 'Deploy websites with confidence using our intelligent workflow. Preview changes, manage custom domains, and track deployment history with complete version control.',
    features: [
      'One-click publishing',
      'Custom domain management',
      'Deployment history',
      'Automatic SSL certificates'
    ],
    gradient: 'from-orange-600 to-red-600'
  }
]

export default function AnimatedTabs() {
  const [activeTab, setActiveTab] = useState(0)
  const currentTab = tabs[activeTab]

  return (
    <div className="bg-black dark:bg-white py-20 px-4 sm:px-6 lg:px-8 transition-colors duration-500">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-white dark:text-black mb-4 transition-colors duration-500">
            Platform Features
          </h1>
          <p className="text-lg text-gray-400 dark:text-gray-600 max-w-2xl mx-auto transition-colors duration-500">
            Everything you need to build, manage, and scale multi-tenant websites with AI-powered automation
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 justify-center mb-12">
          {tabs.map((tab, index) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(index)}
              className={`relative px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                activeTab === index
                  ? 'text-white shadow-lg'
                  : 'text-gray-300 dark:text-gray-700 bg-gray-900 dark:bg-gray-100 border border-gray-800 dark:border-gray-300 hover:border-purple-500 dark:hover:border-purple-400'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {activeTab === index && (
                <motion.div
                  layoutId="active-tab"
                  className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full -z-10"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className="bg-gray-900 dark:bg-gray-50 rounded-2xl border border-gray-800 dark:border-gray-200 shadow-xl overflow-hidden transition-colors duration-500"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8 md:p-12">
              {/* Image Placeholder */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="flex items-center justify-center"
              >
                <div className={`relative w-full aspect-square rounded-xl overflow-hidden bg-gradient-to-br ${currentTab.gradient} border border-gray-800 dark:border-gray-200 shadow-inner flex items-center justify-center transition-colors duration-500`}>
                  <div className="text-center p-8">
                    <div className="text-6xl mb-4">✨</div>
                    <h3 className="text-2xl font-bold text-white">{currentTab.label}</h3>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
              </motion.div>

              {/* Content */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="flex flex-col justify-center"
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-purple-900/40 to-blue-900/40 dark:from-purple-200/60 dark:to-blue-200/60 border border-purple-700/50 dark:border-purple-400/50 mb-4 transition-colors duration-500">
                    <span className="text-sm font-semibold text-purple-400 dark:text-purple-700 transition-colors duration-500">
                      {currentTab.label}
                    </span>
                  </div>
                </motion.div>

                <h2 className="text-3xl md:text-4xl font-bold text-white dark:text-black mb-4 leading-tight transition-colors duration-500">
                  {currentTab.title}
                </h2>

                <p className="text-lg text-gray-400 dark:text-gray-600 mb-8 leading-relaxed transition-colors duration-500">
                  {currentTab.description}
                </p>

                {/* Features */}
                <div className="space-y-3 mb-8">
                  {currentTab.features.map((feature, index) => (
                    <motion.div
                      key={feature}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500" />
                      <span className="text-gray-300 dark:text-gray-700 font-medium transition-colors duration-500">{feature}</span>
                    </motion.div>
                  ))}
                </div>

                {/* CTA Button */}
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  whileHover={{ scale: 1.05, boxShadow: '0 20px 25px rgba(139, 92, 246, 0.3)' }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full md:w-auto px-8 py-4 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Explore {currentTab.label}
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Indicator Dots */}
        <div className="flex justify-center gap-2 mt-8">
          {tabs.map((_, index) => (
            <motion.button
              key={index}
              onClick={() => setActiveTab(index)}
              className={`rounded-full transition-all duration-300 ${
                activeTab === index
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 w-8 h-3'
                  : 'bg-gray-800 dark:bg-gray-300 w-3 h-3 hover:bg-gray-700 dark:hover:bg-gray-400'
              }`}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
