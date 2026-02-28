"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { Inter } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { Play, Star, CreditCard, LayoutDashboard, FileText, ArrowUp, Server, Wand2, MonitorPlay, Globe, Shield, Activity, Users, CheckCircle2, Check, Github, Twitter, Linkedin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AppNavbar from "@/components/AppNavbar";
import AppFooter from "@/components/AppFooter";

const inter = Inter({ subsets: ["latin"] });

const FADE_UP_VARIANTS = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0, duration: 0.8 } },
};

const STAGGER_CONTAINER = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

export default function Home() {
  return (
    <div className={`min-h-screen bg-white text-gray-900 ${inter.className}`}>
      {/* Top Section (Dark) */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0b1411] via-[#0f211d] to-[#0c1a16] pt-6 pb-20">
        {/* Faint grid overlay */}
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)] bg-[size:50px_50px]" />

        <AppNavbar />

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Left Column */}
          <motion.div
            className="max-w-2xl"
            initial="hidden"
            animate="show"
            variants={STAGGER_CONTAINER}
          >
            <motion.h1 variants={FADE_UP_VARIANTS} className="text-5xl sm:text-7xl lg:text-[5.5rem] leading-[0.95] font-black text-white uppercase tracking-tighter mb-8 pb-1">
              Build Websites<br />At Scale
            </motion.h1>
            <motion.p variants={FADE_UP_VARIANTS} className="text-gray-400 text-lg sm:text-lg max-w-[340px] mb-10 leading-relaxed font-light">
              The AI-powered multi-tenant platform for generating and managing your organization's websites natively.
            </motion.p>
            <motion.div variants={FADE_UP_VARIANTS} className="flex flex-col sm:flex-row items-center gap-5 mb-16">
              <Link href="/signup" className="w-full sm:w-auto text-center bg-[#d3ff4a] text-[#0a1512] px-8 py-3.5 rounded-full font-bold hover:bg-[#c0eb3f] transition-all hover:scale-105 active:scale-95 duration-200">
                Start Building
              </Link>
              <button className="group w-full sm:w-auto bg-white/10 backdrop-blur-md border border-white/20 text-white px-6 py-3.5 rounded-full font-medium flex items-center justify-center gap-3 hover:bg-white/20 transition-all hover:scale-105 active:scale-95 duration-200">
                <span className="flex items-center justify-center w-6 h-6 bg-white rounded-full text-black group-hover:bg-[#d3ff4a] transition-colors">
                  <Play size={12} className="ml-0.5" />
                </span>
                Watch Tutorial
              </button>
            </motion.div>

            <motion.div variants={FADE_UP_VARIANTS}>
              <p className="text-gray-500 text-[10px] tracking-[0.2em] font-semibold uppercase mb-5">
                POWERING THOUSANDS OF TENANTS
              </p>
              <div className="flex items-center gap-8 sm:gap-12 opacity-80 mix-blend-screen text-white text-xl font-bold">
                <motion.div whileHover={{ scale: 1.1 }} className="flex items-center gap-2 cursor-pointer"><div className="w-4 h-4 bg-white rotate-45 transition-transform duration-300 hover:rotate-90" />Framer</motion.div>
                <motion.div whileHover={{ scale: 1.1 }} className="flex items-center gap-1 cursor-pointer">
                  <div className="flex gap-0.5">
                    <span className="w-1.5 h-1.5 bg-white rounded-full" /><span className="w-1.5 h-1.5 bg-white rounded-full" />
                  </div>
                  tunein
                </motion.div>
                <motion.div whileHover={{ scale: 1.1 }} className="flex items-center gap-2 cursor-pointer">
                  <div className="w-5 h-5 border-2 border-white rounded-md flex items-center justify-center transition-transform hover:rotate-12 duration-300">
                    <div className="w-2 h-2 bg-white rounded-sm" />
                  </div>
                  OpenAI
                </motion.div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column (Hero Graphic) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 50 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
            className="relative h-[550px] w-full max-w-lg mx-auto lg:ml-auto mt-10 lg:mt-0"
          >
            {/* Outline box behind main image */}
            <div className="absolute inset-0 border border-white/20 rounded-[2.5rem] transform translate-x-4 -translate-y-4 transition-transform duration-500 hover:translate-x-6 hover:-translate-y-6" />

            {/* Main Image Container placeholder */}
            <div className="absolute inset-0 overflow-hidden shadow-2xl z-10">
              <Image src="/human1.png" alt="Hero Image" fill className="object-cover" priority />
            </div>

            {/* Top Left Badge */}
            <div className="absolute top-8 -left-4 sm:-left-8 bg-white rounded-2xl p-4 shadow-xl flex flex-col gap-1 w-44">
              <div className="flex items-center gap-2">
                <span className="text-3xl font-black text-gray-900">10k+</span>
                <Globe size={20} className="text-[#8bc4b1]" />
              </div>
              <p className="text-gray-500 text-[11px] font-medium leading-tight">
                Live Tenant<br />Sites DEPLOYED
              </p>
            </div>

            {/* Top Right Badge */}
            <div className="absolute top-10 -right-4 sm:-right-6 bg-[#95d2bd] rounded-2xl p-4 shadow-xl flex flex-col items-center w-36">
              <span className="text-white/90 text-[11px] font-medium mb-1">AI Gens</span>
              <span className="text-4xl font-black text-[#d3ff4a] mb-2">99%</span>
              {/* Minimal bar chart visual */}
              <div className="flex items-end gap-1.5 h-6">
                <span className="w-1.5 h-3 bg-[#d3ff4a]/60 rounded-full" />
                <span className="w-1.5 h-4 bg-[#d3ff4a]/80 rounded-full" />
                <span className="w-1.5 h-2 bg-[#d3ff4a]/40 rounded-full" />
                <span className="w-1.5 h-5 bg-[#d3ff4a] rounded-full" />
              </div>
            </div>

            {/* Bottom Right Floating Element */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute bottom-16 -right-6 sm:-right-12 bg-white/95 backdrop-blur rounded-2xl p-4 shadow-xl w-32 border border-gray-100 hidden sm:block"
            >
              <div className="w-full h-20 bg-gray-50 rounded-xl mb-3 flex items-end px-2 pb-2 gap-1.5">
                <span className="w-1/4 h-1/2 bg-gray-300 rounded-sm hover:h-3/4 transition-all duration-300" />
                <span className="w-1/4 h-3/4 bg-gray-300 rounded-sm hover:h-full transition-all duration-300" />
                <span className="w-1/4 h-full bg-[#111827] rounded-sm relative transition-transform hover:-translate-y-1 duration-300">
                  <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-[#d3ff4a] rounded-full shadow-sm" />
                </span>
                <span className="w-1/4 h-2/3 bg-gray-300 rounded-sm hover:h-[85%] transition-all duration-300" />
              </div>
              <div className="w-8 h-1.5 bg-gray-200 rounded-full mb-1.5" />
              <div className="w-12 h-1.5 bg-gray-100 rounded-full" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Middle Features Section */}
      <section className="bg-[#fcfdfc] py-24 sm:py-32 border-b border-gray-100">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          variants={STAGGER_CONTAINER}
          className="max-w-6xl mx-auto px-6 lg:px-12 grid sm:grid-cols-3 gap-12 sm:gap-8 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 text-center"
        >

          <motion.div variants={FADE_UP_VARIANTS} className="flex flex-col items-center sm:px-4 pt-10 sm:pt-0 group">
            <div className="w-12 h-12 bg-[#8bc4b1] rounded-[14px] flex items-center justify-center text-white mb-6 shadow-sm group-hover:scale-110 group-hover:bg-[#72ad9b] transition-all duration-300">
              <Server size={20} strokeWidth={2.5} />
            </div>
            <h3 className="text-[1.1rem] font-bold text-gray-900 mb-3">Tenant Isolation</h3>
            <p className="text-gray-400 text-xs leading-relaxed max-w-[200px] font-medium">
              Strict logical boundaries keeping data, assets, and permissions secure for each tenant.
            </p>
          </motion.div>

          <motion.div variants={FADE_UP_VARIANTS} className="flex flex-col items-center sm:px-4 pt-10 sm:pt-0 group">
            <div className="w-12 h-12 bg-[#9ad4bf] rounded-[14px] flex items-center justify-center text-white mb-6 shadow-sm group-hover:scale-110 group-hover:bg-[#85cbb4] transition-all duration-300">
              <Wand2 size={20} strokeWidth={2.5} />
            </div>
            <h3 className="text-[1.1rem] font-bold text-gray-900 mb-3">AI Builder</h3>
            <p className="text-gray-400 text-xs leading-relaxed max-w-[200px] font-medium">
              Generate full website layouts and starter content based on simple business prompts.
            </p>
          </motion.div>

          <motion.div variants={FADE_UP_VARIANTS} className="flex flex-col items-center sm:px-4 pt-10 sm:pt-0 group">
            <div className="w-12 h-12 bg-[#5d6a66] rounded-[14px] flex items-center justify-center text-white mb-6 shadow-sm group-hover:scale-110 group-hover:bg-[#4a5853] transition-all duration-300">
              <FileText size={20} strokeWidth={2.5} />
            </div>
            <h3 className="text-[1.1rem] font-bold text-gray-900 mb-3">Central Governance</h3>
            <p className="text-gray-400 text-xs leading-relaxed max-w-[200px] font-medium">
              Manage subscription plans, limits, and RBAC to oversee hundreds of independent sites natively.
            </p>
          </motion.div>

        </motion.div>
      </section>

      {/* Bottom Section */}
      <section className="bg-[#f2f4f2] py-24 sm:py-32">
        <div className="max-w-5xl mx-auto px-6 lg:px-12">

          <div className="text-center max-w-2xl mx-auto mb-20">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#1d2321] uppercase tracking-tighter leading-[1] mb-6">
              Empower tenants without losing control.
            </h2>
            <p className="text-gray-500 text-[15px] font-medium">
              Provide the optimal mix of independence and governance,<br className="hidden sm:block" /> enabling teams to scale and publish reliably.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 sm:gap-6">
            {/* Card 1: Dark */}
            <div className="bg-[#0f1917] rounded-[2rem] p-8 sm:p-10 flex flex-col overflow-hidden relative group h-[400px]">
              <h3 className="text-[1.35rem] leading-[1.2] font-semibold text-[#d3ff4a] mb-2 z-10 text-center">Monitor Resource<br />Usage</h3>

              <div className="mt-auto z-10 flex items-baseline gap-2 mb-2">
                <span className="text-[#d3ff4a] text-[32px] font-black">100%</span>
                <span className="text-[#d3ff4a]/80 text-[11px] font-medium tracking-wide">tenant isolation</span>
              </div>

              {/* Bar charts background */}
              <div className="absolute bottom-28 right-8 left-8 h-28 flex items-end justify-between gap-3 opacity-95">
                <div className="w-full bg-[#d3ff4a] rounded-sm flex-1 h-[25%]" />
                <div className="w-full bg-[#d3ff4a] rounded-sm flex-1 h-[45%]" />
                <div className="w-full bg-[#d3ff4a] rounded-sm flex-1 h-[90%]" />
                <div className="w-full bg-[#d3ff4a] rounded-sm flex-1 h-[35%]" />
                <div className="w-full bg-[#d3ff4a] rounded-sm flex-1 h-[65%]" />
              </div>
            </div>

            {/* Card 2: Light with pie chart */}
            <div className="bg-white border border-gray-100 rounded-[2rem] p-8 sm:p-10 flex flex-col items-center text-center shadow-sm h-[400px]">
              <h3 className="text-[1.35rem] leading-[1.2] font-bold text-gray-900 mb-3">Automated<br />Deployments</h3>
              <p className="text-gray-400 text-xs font-medium max-w-[180px]">
                Effortless preview-to-production deployment flows and custom domain connections.
              </p>

              <div className="relative mt-auto mb-6 h-36 w-36 flex items-center justify-center">
                {/* Simulated circle chart */}
                <div className="absolute inset-0 rounded-full border-[14px] border-gray-100" />
                <div className="absolute inset-0 rounded-full border-[14px] border-[#1d2321] border-r-transparent border-t-transparent -rotate-45 transition-transform hover:rotate-0 duration-500 cursor-pointer" />
                <div className="text-center flex flex-col items-center bg-white h-[85%] w-[85%] rounded-full z-10 justify-center">
                  <span className="text-2xl font-black text-gray-900">1</span>
                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Click-Deploy</span>
                </div>

                {/* Floating 4.9 */}
                <div className="absolute -top-6 -left-8 flex items-center gap-1.5 font-bold text-xl text-gray-900 bg-white shadow-md border border-gray-50 rounded-xl px-2.5 py-1 z-20">
                  99% <span className="text-[10px] text-gray-400 font-normal">Uptime</span>
                </div>
              </div>
            </div>

            {/* Card 3: Light with overlapping balance card */}
            <div className="bg-white border border-gray-100 rounded-[2rem] p-8 sm:p-10 flex flex-col items-center text-center shadow-sm h-[400px] relative overflow-hidden">
              <h3 className="text-[1.35rem] leading-[1.2] font-bold text-gray-900 mb-3">Control your branding</h3>
              <p className="text-gray-400 text-xs font-medium max-w-[180px] z-10 relative">
                Centrally manage tenant assets, typography, and colors while enforcing plan limits.
              </p>

              {/* Floating inner card */}
              <div className="absolute bottom-8 right-6 bg-white rounded-3xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] border border-gray-100 p-6 w-[85%] z-20 transform -rotate-2">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] text-gray-400 font-bold flex items-center gap-1.5 uppercase tracking-wide text-left">
                    Total Tenants
                    <span className="w-3.5 h-3.5 text-[8px] flex items-center justify-center bg-gray-100 rounded-full text-gray-500 border border-gray-200">i</span>
                  </span>
                </div>
                <div className="text-[32px] font-black text-gray-900 mb-4 tracking-tight text-left">5,432</div>
                <div className="flex items-center justify-center w-fit px-3 py-1.5 gap-1.5 bg-[#d3ff4a]/20 rounded-full">
                  <div className="w-4 h-4 rounded-full bg-[#badf44] flex items-center justify-center text-[#1d2321]">
                    <ArrowUp size={10} strokeWidth={3} />
                  </div>
                  <span className="text-[#a1c13c] text-xs font-bold leading-none">Growing rapidly</span>
                </div>
              </div>

              <div className="absolute bottom-12 left-6 text-[10px] font-bold text-gray-900 z-10">Custom Domains</div>

              {/* Tiny arrow button representation */}
              <div className="absolute bottom-12 left-[100px] w-6 h-6 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center text-gray-400 z-10 transition-transform hover:-translate-y-1 hover:shadow-md cursor-pointer">
                <Globe size={12} className="text-gray-800" />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section className="bg-[#0b1411] py-24 sm:py-32 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,rgba(211,255,74,0.15)_0%,transparent_100%)]" />
        <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-16 md:mb-24 text-center max-w-3xl mx-auto"
          >
            <h2 className="text-[#d3ff4a] text-sm font-bold tracking-widest uppercase mb-4">Platform Solutions</h2>
            <h3 className="text-4xl sm:text-5xl font-black text-white uppercase tracking-tighter leading-[1.1]">
              Everything you need to manage your ecosystem.
            </h3>
            <p className="text-gray-400 mt-6 text-lg font-light leading-relaxed">
              A unified platform enabling strict tenant isolation, scalable architecture, and AI-powered automation to simplify website creation.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            variants={STAGGER_CONTAINER}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {/* Feature 1 */}
            <motion.div variants={FADE_UP_VARIANTS} className="bg-[#0f211d] border border-white/5 rounded-[2rem] p-8 hover:bg-[#132a25] hover:-translate-y-2 transition-all duration-300 group shadow-lg hover:shadow-[#d3ff4a]/5">
              <Server className="text-[#d3ff4a] w-10 h-10 mb-6 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300" />
              <h4 className="text-xl font-bold text-white mb-3">Multi-Tenant Isolation</h4>
              <p className="text-gray-400 text-sm leading-relaxed">Ensure strict logical isolation so each tenant's data, branding, and permissions remain completely independent.</p>
            </motion.div>

            {/* Feature 2 */}
            <motion.div variants={FADE_UP_VARIANTS} className="bg-[#0f211d] border border-white/5 rounded-[2rem] p-8 hover:bg-[#132a25] hover:-translate-y-2 transition-all duration-300 group shadow-lg hover:shadow-[#d3ff4a]/5">
              <Wand2 className="text-[#d3ff4a] w-10 h-10 mb-6 group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-300" />
              <h4 className="text-xl font-bold text-white mb-3">AI-Powered Builder</h4>
              <p className="text-gray-400 text-sm leading-relaxed">Generate beautiful layouts, page structures, and starter content in seconds using advanced AI logic.</p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div variants={FADE_UP_VARIANTS} className="bg-[#0f211d] border border-white/5 rounded-[2rem] p-8 hover:bg-[#132a25] hover:-translate-y-2 transition-all duration-300 group shadow-lg hover:shadow-[#d3ff4a]/5">
              <MonitorPlay className="text-[#d3ff4a] w-10 h-10 mb-6 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300" />
              <h4 className="text-xl font-bold text-white mb-3">Structured Creation</h4>
              <p className="text-gray-400 text-sm leading-relaxed">Organize navigation, manage reusable components, and apply custom branding with constraints that keep designs intact.</p>
            </motion.div>

            {/* Feature 4 */}
            <motion.div variants={FADE_UP_VARIANTS} className="bg-[#0f211d] border border-white/5 rounded-[2rem] p-8 hover:bg-[#132a25] hover:-translate-y-2 transition-all duration-300 group shadow-lg hover:shadow-[#d3ff4a]/5">
              <Globe className="text-[#d3ff4a] w-10 h-10 mb-6 group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-300" />
              <h4 className="text-xl font-bold text-white mb-3">Domain Management</h4>
              <p className="text-gray-400 text-sm leading-relaxed">Provide default hosted URLs and support custom domain routing, with a clear preview-to-production deployment flow.</p>
            </motion.div>

            {/* Feature 5 */}
            <motion.div variants={FADE_UP_VARIANTS} className="bg-[#0f211d] border border-white/5 rounded-[2rem] p-8 hover:bg-[#132a25] hover:-translate-y-2 transition-all duration-300 group shadow-lg hover:shadow-[#d3ff4a]/5">
              <Shield className="text-[#d3ff4a] w-10 h-10 mb-6 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300" />
              <h4 className="text-xl font-bold text-white mb-3">Role-Based Access</h4>
              <p className="text-gray-400 text-sm leading-relaxed">Restrict actions such as editing, domain management, and billing through robust RBAC for owners, admins, and editors.</p>
            </motion.div>

            {/* Feature 6 */}
            <motion.div variants={FADE_UP_VARIANTS} className="bg-[#0f211d] border border-white/5 rounded-[2rem] p-8 hover:bg-[#132a25] hover:-translate-y-2 transition-all duration-300 group shadow-lg hover:shadow-[#d3ff4a]/5">
              <Activity className="text-[#d3ff4a] w-10 h-10 mb-6 group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-300" />
              <h4 className="text-xl font-bold text-white mb-3">Usage Observability</h4>
              <p className="text-gray-400 text-sm leading-relaxed">Track metrics like website traffic and feature consumption. Automate plan adjustments and billing seamlessly.</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="bg-gradient-to-b from-white to-gray-50 py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-3xl mx-auto mb-16 md:mb-24"
          >
            <h2 className="text-[#5d6a66] text-sm font-bold tracking-widest uppercase mb-4">Pricing Plans</h2>
            <h3 className="text-4xl sm:text-5xl font-black text-[#0b1411] uppercase tracking-tighter leading-[1.1]">
              Scale your operations with confidence
            </h3>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            variants={STAGGER_CONTAINER}
            className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto"
          >
            {/* Starter */}
            <motion.div variants={FADE_UP_VARIANTS} className="bg-white border border-gray-200 rounded-[2rem] p-8 sm:p-10 flex flex-col hover:border-[#8bc4b1] transition-colors hover:shadow-xl hover:-translate-y-2 duration-300">
              <div className="mb-6">
                <h4 className="text-xl font-bold text-[#0b1411] mb-2">Starter</h4>
                <p className="text-gray-500 text-sm min-h-[40px]">Perfect for individuals and solo creators building their first site.</p>
              </div>
              <div className="mb-8 border-b border-gray-100 pb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-[#0b1411]">$0</span>
                  <span className="text-gray-500 text-sm font-medium">/month</span>
                </div>
              </div>
              <ul className="flex flex-col gap-4 mb-10 flex-1">
                <li className="flex items-start gap-3 text-sm text-gray-700 font-medium group">
                  <CheckCircle2 className="w-5 h-5 text-[#8bc4b1] shrink-0 group-hover:scale-110 transition-transform" />
                  1 Website
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-700 font-medium group">
                  <CheckCircle2 className="w-5 h-5 text-[#8bc4b1] shrink-0 group-hover:scale-110 transition-transform" />
                  Basic AI Layout Generation
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-700 font-medium group">
                  <CheckCircle2 className="w-5 h-5 text-[#8bc4b1] shrink-0 group-hover:scale-110 transition-transform" />
                  Standard Domain (tenant.sitepilot.dev)
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-700 font-medium group">
                  <CheckCircle2 className="w-5 h-5 text-[#8bc4b1] shrink-0 group-hover:scale-110 transition-transform" />
                  Community Support
                </li>
              </ul>
              <Link href="/signup" className="text-center w-full bg-[#f2f4f2] text-[#0b1411] py-4 rounded-full font-bold hover:bg-gray-200 transition-colors active:scale-95 duration-200">
                Get Started
              </Link>
            </motion.div>

            {/* Pro */}
            <motion.div variants={FADE_UP_VARIANTS} className="bg-[#0b1411] border border-transparent rounded-[2rem] p-8 sm:p-10 flex flex-col transform md:-translate-y-4 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] relative hover:shadow-[0_25px_60px_-15px_rgba(211,255,74,0.15)] transition-all duration-300">
              <div className="absolute top-0 inset-x-0 h-1 bg-[#d3ff4a] rounded-t-[2rem]" />
              <div className="absolute -top-4 right-8 bg-[#d3ff4a] text-[#0b1411] text-[10px] uppercase font-black tracking-widest py-1.5 px-3 rounded-full animate-pulse">
                Most Popular
              </div>
              <div className="mb-6">
                <h4 className="text-xl font-bold text-white mb-2">Professional</h4>
                <p className="text-gray-400 text-sm min-h-[40px]">For established businesses needing custom domains and more power.</p>
              </div>
              <div className="mb-8 border-b border-white/10 pb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">$29</span>
                  <span className="text-gray-500 text-sm font-medium">/month</span>
                </div>
              </div>
              <ul className="flex flex-col gap-4 mb-10 flex-1">
                <li className="flex items-start gap-3 text-sm text-gray-300 font-medium group">
                  <CheckCircle2 className="w-5 h-5 text-[#d3ff4a] shrink-0 group-hover:scale-110 transition-transform" />
                  Up to 10 Websites
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-300 font-medium group">
                  <CheckCircle2 className="w-5 h-5 text-[#d3ff4a] shrink-0 group-hover:scale-110 transition-transform" />
                  Advanced AI Content & Design
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-300 font-medium group">
                  <CheckCircle2 className="w-5 h-5 text-[#d3ff4a] shrink-0 group-hover:scale-110 transition-transform" />
                  Custom Domain Support
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-300 font-medium group">
                  <CheckCircle2 className="w-5 h-5 text-[#d3ff4a] shrink-0 group-hover:scale-110 transition-transform" />
                  RBAC (3 Admin Users)
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-300 font-medium group">
                  <CheckCircle2 className="w-5 h-5 text-[#d3ff4a] shrink-0 group-hover:scale-110 transition-transform" />
                  Analytics Dashboard
                </li>
              </ul>
              <button className="w-full bg-[#d3ff4a] text-[#0b1411] py-4 rounded-full font-bold hover:bg-[#c0eb3f] transition-all hover:scale-105 active:scale-95 duration-200 shadow-[0_0_20px_rgba(211,255,74,0.3)]">
                Start Free Trial
              </button>
            </motion.div>

            {/* Enterprise */}
            <motion.div variants={FADE_UP_VARIANTS} className="bg-white border border-gray-200 rounded-[2rem] p-8 sm:p-10 flex flex-col hover:border-[#8bc4b1] transition-colors hover:shadow-xl hover:-translate-y-2 duration-300">
              <div className="mb-6">
                <h4 className="text-xl font-bold text-[#0b1411] mb-2">Enterprise</h4>
                <p className="text-gray-500 text-sm min-h-[40px]">For large networks requiring unlimited scale, custom terms, and SLA.</p>
              </div>
              <div className="mb-8 border-b border-gray-100 pb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-[#0b1411]">Custom</span>
                </div>
              </div>
              <ul className="flex flex-col gap-4 mb-10 flex-1">
                <li className="flex items-start gap-3 text-sm text-gray-700 font-medium group">
                  <CheckCircle2 className="w-5 h-5 text-[#8bc4b1] shrink-0 group-hover:scale-110 transition-transform" />
                  Unlimited Websites
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-700 font-medium group">
                  <CheckCircle2 className="w-5 h-5 text-[#8bc4b1] shrink-0 group-hover:scale-110 transition-transform" />
                  Dedicated AI Models
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-700 font-medium group">
                  <CheckCircle2 className="w-5 h-5 text-[#8bc4b1] shrink-0 group-hover:scale-110 transition-transform" />
                  Advanced Security & Compliance
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-700 font-medium group">
                  <CheckCircle2 className="w-5 h-5 text-[#8bc4b1] shrink-0 group-hover:scale-110 transition-transform" />
                  Unlimited RBAC Roles
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-700 font-medium group">
                  <CheckCircle2 className="w-5 h-5 text-[#8bc4b1] shrink-0 group-hover:scale-110 transition-transform" />
                  Dedicated Success Manager
                </li>
              </ul>
              <button className="w-full bg-[#0b1411] text-white py-4 rounded-full font-bold hover:bg-[#132a25] transition-colors active:scale-95 duration-200">
                Contact Sales
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <AppFooter />

    </div>
  );
}
