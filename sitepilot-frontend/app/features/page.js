"use client";

import { Inter } from "next/font/google";
import { Server, Wand2, MonitorPlay } from "lucide-react";
import AppNavbar from "@/components/AppNavbar";
import AppFooter from "@/components/AppFooter";
import { motion } from "framer-motion";

const inter = Inter({ subsets: ["latin"] });

const FADE_UP_VARIANTS = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0, duration: 0.8 } },
};

const STAGGER_CONTAINER = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.15 } },
};

export default function FeaturesPage() {
    return (
        <div className={`min-h-screen bg-[#fcfdfc] text-gray-900 ${inter.className}`}>
            {/* Top Hero Section (Dark Theme) */}
            <section className="relative overflow-hidden bg-gradient-to-br from-[#0b1411] via-[#0f211d] to-[#0c1a16] pt-6 pb-24 md:pb-32">
                <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)] bg-[size:50px_50px]" />

                <AppNavbar />

                <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 mt-12 sm:mt-20 text-center">
                    <motion.div initial="hidden" animate="show" variants={STAGGER_CONTAINER} className="max-w-3xl mx-auto">
                        <motion.h1 variants={FADE_UP_VARIANTS} className="text-5xl sm:text-7xl lg:text-[5.5rem] leading-[0.95] font-black text-white uppercase tracking-tighter mb-8">
                            Core Capabilities
                        </motion.h1>
                        <motion.p variants={FADE_UP_VARIANTS} className="text-gray-400 text-lg sm:text-xl leading-relaxed font-light mb-10">
                            Discover the robust tools engineered to scale your multi-tenant ecosystem, from complete isolation to AI-driven site building.
                        </motion.p>
                    </motion.div>
                </div>
            </section>

            {/* Main Features Grid */}
            <section className="py-24 sm:py-32 bg-[#fcfdfc] relative">
                <div className="max-w-7xl mx-auto px-6 lg:px-12">

                    {/* Feature Row 1 (Image Right) */}
                    <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }} variants={STAGGER_CONTAINER} className="grid lg:grid-cols-2 gap-12 items-center mb-32">
                        <motion.div variants={FADE_UP_VARIANTS}>
                            <div className="w-14 h-14 bg-[#8bc4b1]/20 rounded-2xl flex items-center justify-center text-[#2a5948] mb-8">
                                <Server size={28} strokeWidth={2.5} />
                            </div>
                            <h2 className="text-4xl font-black text-gray-900 mb-6 tracking-tight">Absolute Tenant Isolation</h2>
                            <p className="text-gray-500 text-lg leading-relaxed mb-8">
                                Every tenant operates in a completely isolated logical environment. Prevent data leakage, ensure compliance, and securely manage distinct branding per tenant without custom deployment logic.
                            </p>
                        </motion.div>

                        <motion.div variants={FADE_UP_VARIANTS} className="relative h-[400px] sm:h-[500px] w-full bg-gray-100 rounded-[2.5rem] border border-gray-200 shadow-xl overflow-hidden flex items-center justify-center">
                            {/* Placeholder for User's Image */}
                            <span className="text-gray-400 font-bold tracking-widest uppercase">Image Placeholder</span>
                        </motion.div>
                    </motion.div>

                    {/* Feature Row 2 (Image Left) */}
                    <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }} variants={STAGGER_CONTAINER} className="grid lg:grid-cols-2 gap-12 items-center mb-32">
                        <motion.div variants={FADE_UP_VARIANTS} className="relative h-[400px] sm:h-[500px] w-full bg-[#0b1411] rounded-[2.5rem] shadow-xl overflow-hidden flex items-center justify-center order-2 lg:order-1">
                            {/* Placeholder for User's Image */}
                            <span className="text-white font-bold tracking-widest uppercase">Image Placeholder</span>
                        </motion.div>

                        <motion.div variants={FADE_UP_VARIANTS} className="order-1 lg:order-2 lg:pl-12">
                            <div className="w-14 h-14 bg-[#d3ff4a]/20 rounded-2xl flex items-center justify-center text-[#7cac23] mb-8">
                                <Wand2 size={28} strokeWidth={2.5} />
                            </div>
                            <h2 className="text-4xl font-black text-gray-900 mb-6 tracking-tight">AI-Powered Content Generation</h2>
                            <p className="text-gray-500 text-lg leading-relaxed mb-8">
                                Skip the blank canvas. Your tenants can instantly generate fully localized layouts, copy, and structural components using optimized AI models tailored for their niche.
                            </p>
                        </motion.div>
                    </motion.div>

                    {/* Feature Row 3 (Image Right) */}
                    <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }} variants={STAGGER_CONTAINER} className="grid lg:grid-cols-2 gap-12 items-center">
                        <motion.div variants={FADE_UP_VARIANTS}>
                            <div className="w-14 h-14 bg-[#9ad4bf]/20 rounded-2xl flex items-center justify-center text-[#356654] mb-8">
                                <MonitorPlay size={28} strokeWidth={2.5} />
                            </div>
                            <h2 className="text-4xl font-black text-gray-900 mb-6 tracking-tight">Structured Builder</h2>
                            <p className="text-gray-500 text-lg leading-relaxed mb-8">
                                Maintain rigorous control over your brand guidelines. Provide pre-approved components and restricted styles to guarantee beautiful outputs, while enabling creative freedom.
                            </p>
                        </motion.div>

                        <motion.div variants={FADE_UP_VARIANTS} className="relative h-[400px] sm:h-[500px] w-full bg-gray-100 rounded-[2.5rem] border border-gray-200 shadow-xl overflow-hidden flex items-center justify-center">
                            {/* Placeholder for User's Image */}
                            <span className="text-gray-400 font-bold tracking-widest uppercase">Image Placeholder</span>
                        </motion.div>
                    </motion.div>

                </div>
            </section>

            <AppFooter />
        </div>
    );
}
