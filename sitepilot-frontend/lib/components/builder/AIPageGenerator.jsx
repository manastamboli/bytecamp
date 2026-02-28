'use client';

import { useState } from 'react';
import { X, Sparkles, Loader2 } from 'lucide-react';

export default function AIPageGenerator({ isOpen, onClose, onGenerate, tenantId }) {
  const [description, setDescription] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [pageType, setPageType] = useState('home');
  const [loading, setLoading] = useState(false);
  const [brandKit, setBrandKit] = useState(null);

  // Fetch brand kit when modal opens
  useState(() => {
    if (isOpen && tenantId) {
      fetchBrandKit();
    }
  }, [isOpen, tenantId]);

  const fetchBrandKit = async () => {
    try {
      const response = await fetch(`/api/tenants/${tenantId}/brand-kit`);
      if (response.ok) {
        const data = await response.json();
        setBrandKit(data.brandKit);
      }
    } catch (error) {
      console.error('Failed to fetch brand kit:', error);
    }
  };

  const businessTypes = [
    'Restaurant',
    'Gym / Fitness',
    'Salon / Spa',
    'E-commerce Store',
    'Portfolio',
    'Agency',
    'School / Education',
    'Healthcare',
    'Real Estate',
    'Other'
  ];

  const pageTypes = [
    { value: 'home', label: 'Home Page' },
    { value: 'about', label: 'About Us' },
    { value: 'services', label: 'Services' },
    { value: 'contact', label: 'Contact' },
    { value: 'pricing', label: 'Pricing' },
    { value: 'blog', label: 'Blog' }
  ];

  const handleGenerate = async () => {
    if (!description.trim() || !businessType) {
      alert('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/ai/generate-layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          businessType,
          pageType,
          brandKit  // Pass brand kit to API
        })
      });

      const data = await response.json();

      if (data.success) {
        onGenerate(data.layout);
        onClose();
        setDescription('');
        setBusinessType('');
      } else {
        if (data.fallback) {
          const useFallback = confirm(
            'AI generation failed. Would you like to use a template instead?'
          );
          if (useFallback) {
            onGenerate(data.fallback);
            onClose();
          }
        } else {
          alert('Failed to generate page: ' + data.error);
        }
      }
    } catch (error) {
      console.error('Generation error:', error);
      alert('Failed to generate page');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#0b1411]/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#f2f4f2] rounded-full flex items-center justify-center border border-gray-100">
              <Sparkles size={16} className="text-[#0b1411]" />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#1d2321] uppercase tracking-tighter">Generate Page with AI</h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Describe your page and let AI build it</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 text-gray-400 hover:text-[#0b1411] hover:bg-[#f2f4f2] rounded-2xl transition-all shadow-sm"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6 overflow-y-auto bg-[#fcfdfc] flex-1">
          {/* Business Type */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
              Business Type *
            </label>
            <select
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              className="w-full p-4 bg-white border border-gray-100 text-[#0b1411] font-bold text-xs rounded-[1.5rem] focus:outline-none focus:ring-2 focus:ring-[#0b1411]/20 hover:border-[#8bc4b1] transition-all shadow-sm"
            >
              <option value="">Select business type...</option>
              {businessTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Page Type */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
              Page Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {pageTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setPageType(type.value)}
                  className={`px-4 py-3 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-widest shadow-sm ${
                    pageType === type.value
                      ? 'border-[#1d2321] bg-[#fcfdfc] text-[#1d2321]'
                      : 'bg-white border-gray-100 text-gray-400 hover:border-[#8bc4b1] hover:text-[#8bc4b1]'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
              Page Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Example: Create a modern gym homepage with a hero section showcasing our facilities, a features section highlighting our services, pricing plans, and a contact form..."
              rows={6}
              className="w-full p-5 bg-white border border-gray-100 rounded-[1.5rem] font-mono text-xs text-[#0b1411] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0b1411]/20 hover:border-[#8bc4b1] transition-all shadow-sm resize-none"
            />
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">
              Be specific about sections, content, and style you want
            </p>
          </div>

          {/* Examples */}
          <div className="bg-[#f2f4f2]/50 border border-gray-100 rounded-[1.5rem] p-5 shadow-sm">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">💡 Example Prompts:</p>
            <ul className="text-xs text-gray-600 font-medium space-y-2">
              <li>• "Modern restaurant homepage with hero, menu preview, chef's special, and reservation form"</li>
              <li>• "Fitness gym page with motivational hero, class schedule, trainer profiles, and membership pricing"</li>
              <li>• "Professional portfolio with project showcase, skills section, and contact information"</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-gray-100 bg-white gap-4">
          <button
            onClick={onClose}
            className="px-6 py-3.5 rounded-full border border-gray-200 text-[#0b1411] font-bold uppercase tracking-widest text-[10px] hover:border-[#8bc4b1] hover:text-[#8bc4b1] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={loading || !description.trim() || !businessType}
            className="px-8 py-3.5 rounded-full bg-[#d3ff4a] text-[#0b1411] font-black uppercase tracking-widest text-[10px] hover:bg-[#c0eb3f] transition-all shadow-[0_0_20px_rgba(211,255,74,0.3)] hover:scale-105 active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Generate Page</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
