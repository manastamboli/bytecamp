import { Twitter, Linkedin, Github } from "lucide-react";
import Link from "next/link";

export default function AppFooter() {
  return (
    <footer className="bg-[#0b1411] pt-24 pb-12 border-t border-white/5 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 sm:gap-8 mb-20">
          <div className="col-span-2 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 text-white mb-6 w-fit">
              <div className="flex flex-col gap-0.5 w-6">
                <span className="w-5 h-[3px] bg-[#d3ff4a] rounded-full" />
                <span className="w-6 h-[3px] bg-[#00e5ff] rounded-full" />
                <span className="w-4 h-[3px] bg-white rounded-full" />
              </div>
              <span className="text-2xl font-black tracking-tight uppercase">SitePilot</span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed max-w-sm font-medium mb-8">
              The ultimate AI-powered multi-tenant platform. Build smarter, scale faster, and manage your sites effortlessly.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-[#d3ff4a] hover:text-[#0b1411] transition-colors group">
                <Twitter size={18} className="transition-transform group-hover:scale-110" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-[#d3ff4a] hover:text-[#0b1411] transition-colors group">
                <Linkedin size={18} className="transition-transform group-hover:scale-110" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-[#d3ff4a] hover:text-[#0b1411] transition-colors group">
                <Github size={18} className="transition-transform group-hover:scale-110" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Product</h4>
            <ul className="flex flex-col gap-4">
              <li><Link href="/features" className="text-gray-400 hover:text-[#d3ff4a] text-sm font-medium transition-colors">Features</Link></li>
              <li><Link href="/pricing" className="text-gray-400 hover:text-[#d3ff4a] text-sm font-medium transition-colors">Pricing</Link></li>
              <li><a href="#" className="text-gray-400 hover:text-[#d3ff4a] text-sm font-medium transition-colors">Integrations</a></li>
              <li><a href="#" className="text-gray-400 hover:text-[#d3ff4a] text-sm font-medium transition-colors">Changelog</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Solutions</h4>
            <ul className="flex flex-col gap-4">
              <li><a href="#" className="text-gray-400 hover:text-[#d3ff4a] text-sm font-medium transition-colors">Agencies</a></li>
              <li><a href="#" className="text-gray-400 hover:text-[#d3ff4a] text-sm font-medium transition-colors">Startups</a></li>
              <li><a href="#" className="text-gray-400 hover:text-[#d3ff4a] text-sm font-medium transition-colors">Creators</a></li>
              <li><a href="#" className="text-gray-400 hover:text-[#d3ff4a] text-sm font-medium transition-colors">Enterprise</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Resources</h4>
            <ul className="flex flex-col gap-4">
              <li><a href="#" className="text-gray-400 hover:text-[#d3ff4a] text-sm font-medium transition-colors">Documentation</a></li>
              <li><a href="#" className="text-gray-400 hover:text-[#d3ff4a] text-sm font-medium transition-colors">API Reference</a></li>
              <li><Link href="/contact" className="text-gray-400 hover:text-[#d3ff4a] text-sm font-medium transition-colors">Contact</Link></li>
              <li><a href="#" className="text-gray-400 hover:text-[#d3ff4a] text-sm font-medium transition-colors">Help Center</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm font-medium">© 2026 SitePilot. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-gray-500 hover:text-white text-sm font-medium transition-colors">Privacy Policy</a>
            <a href="#" className="text-gray-500 hover:text-white text-sm font-medium transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>

      {/* Giant text watermark behind footer */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[15rem] font-black text-white/[0.02] whitespace-nowrap pointer-events-none z-0">
        SITEPILOT
      </div>
    </footer>
  );
}
