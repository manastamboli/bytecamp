"use client";

import { Inter } from "next/font/google";
import { Mail, MessageSquare, Phone } from "lucide-react";
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

export default function ContactPage() {
    return (
        <div className={`min-h-screen bg-[#fcfdfc] text-gray-900 ${inter.className}`}>
            {/* Top Hero Section (Dark Theme matching the rest) */}
            <section className="relative overflow-hidden bg-gradient-to-br from-[#0b1411] via-[#0f211d] to-[#0c1a16] pt-6 pb-32 md:pb-48">
                <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)] bg-[size:50px_50px]" />

                <AppNavbar />

                <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 mt-12 sm:mt-16 text-center">
                    <motion.div initial="hidden" animate="show" variants={STAGGER_CONTAINER} className="max-w-3xl mx-auto">
                        <motion.h1 variants={FADE_UP_VARIANTS} className="text-5xl sm:text-7xl lg:text-[5.5rem] leading-[0.95] font-black text-white uppercase tracking-tighter mb-8">
                            Let's Connect
                        </motion.h1>
                        <motion.p variants={FADE_UP_VARIANTS} className="text-gray-400 text-lg sm:text-xl leading-relaxed font-light mb-10">
                            Have questions about limits, integrations, or custom deployments? Our team is ready to assist you.
                        </motion.p>
                    </motion.div>
                </div>
            </section>

            <section className="py-24 sm:py-32 relative -mt-32 z-20">
                <div className="max-w-6xl mx-auto px-6 lg:px-12 grid lg:grid-cols-3 gap-12 lg:gap-8 items-start">

                    <motion.div initial="hidden" animate="show" variants={STAGGER_CONTAINER} className="lg:col-span-1 flex flex-col gap-6">
                        <motion.div variants={FADE_UP_VARIANTS} className="bg-white rounded-[2rem] p-8 shadow-xl border border-gray-100 flex items-center gap-4 group cursor-pointer hover:border-[#8bc4b1] transition-colors">
                            <div className="w-12 h-12 bg-[#f2f4f2] rounded-xl flex items-center justify-center text-[#2a5948] group-hover:scale-110 transition-transform duration-300">
                                <Mail size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Email Us</h3>
                                <p className="text-sm text-gray-500">hello@sitepilot.dev</p>
                            </div>
                        </motion.div>

                        <motion.div variants={FADE_UP_VARIANTS} className="bg-white rounded-[2rem] p-8 shadow-xl border border-gray-100 flex items-center gap-4 group cursor-pointer hover:border-[#8bc4b1] transition-colors">
                            <div className="w-12 h-12 bg-[#f2f4f2] rounded-xl flex items-center justify-center text-[#2a5948] group-hover:scale-110 transition-transform duration-300">
                                <MessageSquare size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Live Chat</h3>
                                <p className="text-sm text-gray-500">Available 9am - 5pm EST</p>
                            </div>
                        </motion.div>

                        <motion.div variants={FADE_UP_VARIANTS} className="bg-white rounded-[2rem] p-8 shadow-xl border border-gray-100 flex items-center gap-4 group cursor-pointer hover:border-[#8bc4b1] transition-colors">
                            <div className="w-12 h-12 bg-[#f2f4f2] rounded-xl flex items-center justify-center text-[#2a5948] group-hover:scale-110 transition-transform duration-300">
                                <Phone size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Phone</h3>
                                <p className="text-sm text-gray-500">+1 (555) 123-4567</p>
                            </div>
                        </motion.div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }} className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 sm:p-12 shadow-2xl border border-gray-100 flex flex-col items-center">
                        <h2 className="text-3xl font-black text-gray-900 mb-8 tracking-tight self-start">Send us a message</h2>
                        <form className="flex flex-col gap-6 w-full">
                            <div className="grid sm:grid-cols-2 gap-6">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-bold text-gray-700">First Name</label>
                                    <input type="text" className="w-full bg-[#fcfdfc] border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#8bc4b1] focus:ring-2 focus:ring-[#8bc4b1]/20 transition-all text-gray-900" placeholder="John" />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-bold text-gray-700">Last Name</label>
                                    <input type="text" className="w-full bg-[#fcfdfc] border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#8bc4b1] focus:ring-2 focus:ring-[#8bc4b1]/20 transition-all text-gray-900" placeholder="Doe" />
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-gray-700">Work Email</label>
                                <input type="email" className="w-full bg-[#fcfdfc] border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#8bc4b1] focus:ring-2 focus:ring-[#8bc4b1]/20 transition-all text-gray-900" placeholder="john@company.com" />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-gray-700">Message</label>
                                <textarea rows="4" className="w-full bg-[#fcfdfc] border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#8bc4b1] focus:ring-2 focus:ring-[#8bc4b1]/20 transition-all resize-none text-gray-900" placeholder="How can we help?" />
                            </div>
                            <button className="w-full bg-[#0b1411] text-white py-4 rounded-xl font-bold hover:bg-[#132a25] transition-colors active:scale-95 duration-200 mt-2">
                                Send Message
                            </button>
                        </form>
                    </motion.div>

                </div>
            </section>

            <AppFooter />
        </div>
    );
}
