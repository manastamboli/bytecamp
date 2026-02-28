'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Upload, Sparkles, Loader2, Check, X } from 'lucide-react';

// Popular Google Fonts list (expandable)
const GOOGLE_FONTS = [
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Oswald', 'Source Sans Pro',
  'Raleway', 'PT Sans', 'Merriweather', 'Nunito', 'Playfair Display', 'Poppins',
  'Ubuntu', 'Mukta', 'Rubik', 'Work Sans', 'Noto Sans', 'Fira Sans', 'Quicksand',
  'Karla', 'Cabin', 'Barlow', 'Crimson Text', 'Bitter', 'Arimo', 'Titillium Web',
  'DM Sans', 'Manrope', 'Space Grotesk', 'Plus Jakarta Sans', 'Outfit', 'Lexend'
].sort();

const BRAND_MOODS = [
  { value: 'professional', label: 'Professional', desc: 'Clean, trustworthy, corporate' },
  { value: 'modern', label: 'Modern', desc: 'Sleek, minimalist, contemporary' },
  { value: 'playful', label: 'Playful', desc: 'Fun, energetic, creative' },
  { value: 'luxury', label: 'Luxury', desc: 'Elegant, sophisticated, premium' },
  { value: 'minimal', label: 'Minimal', desc: 'Simple, clean, focused' },
  { value: 'bold', label: 'Bold', desc: 'Strong, confident, impactful' },
];

export default function BrandingPage() {
  const params = useParams();
  const { tenantId } = params;
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [brandKit, setBrandKit] = useState({
    logo: '',
    colors: {
      primary: '#3B82F6',
      secondary: '#8B5CF6',
      tertiary: '#EC4899'
    },
    fonts: {
      heading: 'Poppins',
      body: 'Inter'
    },
    mood: 'modern'
  });

  const [suggestedPalettes, setSuggestedPalettes] = useState([]);
  const [generatingColors, setGeneratingColors] = useState(false);
  const [suggestedFonts, setSuggestedFonts] = useState([]);
  const [generatingFonts, setGeneratingFonts] = useState(false);

  useEffect(() => {
    fetchBrandKit();
  }, [tenantId]);

  // Load Google Fonts dynamically
  useEffect(() => {
    const loadFont = (fontFamily) => {
      if (!fontFamily) return;
      
      // Check if font is already loaded
      const existingLink = document.querySelector(`link[href*="${fontFamily.replace(/\s+/g, '+')}"]`);
      if (existingLink) return;
      
      // Create and append link element
      const link = document.createElement('link');
      link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/\s+/g, '+')}:wght@400;500;600;700;800;900&display=swap`;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    };

    // Load both heading and body fonts
    loadFont(brandKit.fonts.heading);
    loadFont(brandKit.fonts.body);
  }, [brandKit.fonts.heading, brandKit.fonts.body]);

  async function fetchBrandKit() {
    try {
      const res = await fetch(`/api/tenants/${tenantId}/brand-kit`);
      if (!res.ok) throw new Error('Failed to fetch brand kit');
      const data = await res.json();
      
      if (data.brandKit && Object.keys(data.brandKit).length > 0) {
        setBrandKit({
          logo: data.logo || '',
          ...data.brandKit
        });
      }
    } catch (error) {
      console.error('Error fetching brand kit:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    try {
      setUploading(true);
      
      // Create form data
      const formData = new FormData();
      formData.append('file', file);

      // Upload to media API
      const res = await fetch(`/api/tenants/${tenantId}/media`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');
      
      const data = await res.json();
      
      // Update brand kit with S3 key (not presigned URL which expires)
      // Store the s3Key for permanent reference
      setBrandKit(prev => ({ ...prev, logo: data.s3Key || data.media.s3Key }));
      
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('Failed to upload logo');
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      const res = await fetch(`/api/tenants/${tenantId}/brand-kit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandKit: {
            colors: brandKit.colors,
            fonts: brandKit.fonts,
            mood: brandKit.mood
          },
          logo: brandKit.logo
        }),
      });

      if (!res.ok) throw new Error('Failed to save brand kit');
      
      alert('Brand kit saved successfully!');
    } catch (error) {
      console.error('Error saving brand kit:', error);
      alert('Failed to save brand kit');
    } finally {
      setSaving(false);
    }
  }

  async function generateColorSuggestions() {
    try {
      setGeneratingColors(true);
      const res = await fetch('/api/ai/suggest-colors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logoUrl: brandKit.logo,
          brandMood: brandKit.mood,
          businessType: 'business'
        }),
      });

      if (!res.ok) throw new Error('Failed to generate colors');
      
      const data = await res.json();
      setSuggestedPalettes(data.palettes);
    } catch (error) {
      console.error('Error generating colors:', error);
      alert('Failed to generate color suggestions');
    } finally {
      setGeneratingColors(false);
    }
  }

  function applyPalette(palette) {
    setBrandKit(prev => ({
      ...prev,
      colors: palette.colors
    }));
    setSuggestedPalettes([]);
  }

  async function generateFontSuggestions() {
    try {
      setGeneratingFonts(true);
      const res = await fetch('/api/ai/suggest-fonts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandMood: brandKit.mood,
          businessType: 'business',
          currentFonts: brandKit.fonts
        }),
      });

      if (!res.ok) throw new Error('Failed to generate fonts');
      
      const data = await res.json();
      setSuggestedFonts(data.pairings);
    } catch (error) {
      console.error('Error generating fonts:', error);
      alert('Failed to generate font suggestions');
    } finally {
      setGeneratingFonts(false);
    }
  }

  function applyFontPairing(pairing) {
    setBrandKit(prev => ({
      ...prev,
      fonts: pairing.fonts
    }));
    setSuggestedFonts([]);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#fcfdfc]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0b1411]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfdfc] p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-black text-[#0b1411] uppercase tracking-tight">Brand Kit</h1>
              <p className="text-gray-600 mt-2 font-medium">
                Define your brand identity to maintain consistency across all websites
              </p>
            </div>
            
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-[#d3ff4a] text-[#0b1411] rounded-xl font-bold uppercase text-sm tracking-wider hover:bg-[#c0eb3f] transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(211,255,74,0.2)] disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Save Brand Kit
                </>
              )}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Logo Section */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-xl font-black text-[#0b1411] uppercase tracking-tight mb-6">Logo</h2>
            <div className="flex flex-col md:flex-row items-start gap-6">
              {brandKit.logo && (
                <div className="relative group">
                  <img 
                    src={brandKit.logo} 
                    alt="Logo" 
                    className="w-32 h-32 object-contain border-2 border-gray-100 rounded-xl p-4 bg-gray-50"
                  />
                  <button
                    onClick={() => setBrandKit(prev => ({ ...prev, logo: '' }))}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 px-6 py-3 border-2 border-gray-200 rounded-xl hover:border-[#0b1411] hover:bg-gray-50 transition-all font-bold text-sm uppercase tracking-wider disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      {brandKit.logo ? 'Change Logo' : 'Upload Logo'}
                    </>
                  )}
                </button>
                <p className="text-sm text-gray-500 mt-3 font-medium">
                  Upload your logo (PNG, JPG, SVG • Max 5MB)
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Logo will be saved to your Media Library
                </p>
              </div>
            </div>
          </div>

          {/* Brand Mood */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-xl font-black text-[#0b1411] uppercase tracking-tight mb-6">Brand Mood</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {BRAND_MOODS.map((mood) => (
                <button
                  key={mood.value}
                  onClick={() => setBrandKit(prev => ({ ...prev, mood: mood.value }))}
                  className={`p-5 border-2 rounded-xl text-left transition-all font-bold ${
                    brandKit.mood === mood.value
                      ? 'border-[#0b1411] bg-[#f2f4f2] shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-[#0b1411] text-base uppercase tracking-tight">{mood.label}</div>
                  <div className="text-sm text-gray-600 mt-1 font-normal">{mood.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Color Palette */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-[#0b1411] uppercase tracking-tight">Color Palette</h2>
              <button
                onClick={generateColorSuggestions}
                disabled={generatingColors}
                className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all font-bold text-sm uppercase tracking-wider disabled:opacity-50 hover:scale-105 active:scale-95"
              >
                {generatingColors ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    AI Suggest
                  </>
                )}
              </button>
            </div>

            {/* AI Suggested Palettes */}
            {suggestedPalettes.length > 0 && (
              <div className="mb-6 p-6 bg-purple-50 rounded-xl border-2 border-purple-200">
                <h3 className="font-black text-purple-900 mb-4 uppercase tracking-tight text-sm">AI Suggested Palettes</h3>
                <div className="space-y-4">
                  {suggestedPalettes.map((palette, idx) => (
                    <div key={idx} className="bg-white p-5 rounded-xl border-2 border-purple-100">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="font-bold text-gray-900">{palette.name}</div>
                          <div className="text-sm text-gray-600 mt-1">{palette.description}</div>
                        </div>
                        <button
                          onClick={() => applyPalette(palette)}
                          className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 font-bold uppercase tracking-wider"
                        >
                          Apply
                        </button>
                      </div>
                      <div className="flex gap-3">
                        {Object.entries(palette.colors).map(([key, color]) => (
                          <div key={key} className="flex-1">
                            <div 
                              className="h-16 rounded-lg border-2 border-gray-100"
                              style={{ backgroundColor: color }}
                            />
                            <div className="text-xs text-gray-600 mt-2 text-center font-mono font-bold">{color}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Current Colors */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(brandKit.colors).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-sm font-black text-gray-700 mb-3 uppercase tracking-wider">
                    {key}
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="color"
                      value={value}
                      onChange={(e) => setBrandKit(prev => ({
                        ...prev,
                        colors: { ...prev.colors, [key]: e.target.value }
                      }))}
                      className="w-16 h-12 rounded-lg border-2 border-gray-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => setBrandKit(prev => ({
                        ...prev,
                        colors: { ...prev.colors, [key]: e.target.value }
                      }))}
                      className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg font-mono text-sm font-bold uppercase focus:border-[#0b1411] focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Typography */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-[#0b1411] uppercase tracking-tight">Typography</h2>
              <button
                onClick={generateFontSuggestions}
                disabled={generatingFonts}
                className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all font-bold text-sm uppercase tracking-wider disabled:opacity-50 hover:scale-105 active:scale-95"
              >
                {generatingFonts ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    AI Suggest
                  </>
                )}
              </button>
            </div>

            {/* AI Suggested Font Pairings */}
            {suggestedFonts.length > 0 && (
              <div className="mb-6 p-6 bg-purple-50 rounded-xl border-2 border-purple-200">
                <h3 className="font-black text-purple-900 mb-4 uppercase tracking-tight text-sm">AI Suggested Font Pairings</h3>
                <div className="space-y-4">
                  {suggestedFonts.map((pairing, idx) => (
                    <div key={idx} className="bg-white p-5 rounded-xl border-2 border-purple-100">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="font-bold text-gray-900">{pairing.name}</div>
                          <div className="text-sm text-gray-600 mt-1">{pairing.description}</div>
                        </div>
                        <button
                          onClick={() => applyFontPairing(pairing)}
                          className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 font-bold uppercase tracking-wider"
                        >
                          Apply
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                          <div className="text-xs text-gray-500 mb-2 font-bold uppercase">Heading</div>
                          <div 
                            className="p-4 bg-gray-50 rounded-lg text-xl font-bold border-2 border-gray-100"
                            style={{ fontFamily: pairing.fonts.heading }}
                          >
                            {pairing.fonts.heading}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-2 font-bold uppercase">Body</div>
                          <div 
                            className="p-4 bg-gray-50 rounded-lg text-sm border-2 border-gray-100"
                            style={{ fontFamily: pairing.fonts.body }}
                          >
                            {pairing.fonts.body}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-black text-gray-700 mb-3 uppercase tracking-wider">
                  Heading Font
                </label>
                <select
                  value={brandKit.fonts.heading}
                  onChange={(e) => setBrandKit(prev => ({
                    ...prev,
                    fonts: { ...prev.fonts, heading: e.target.value }
                  }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg font-bold focus:border-[#0b1411] focus:outline-none"
                  style={{ fontFamily: brandKit.fonts.heading }}
                >
                  {GOOGLE_FONTS.map(font => (
                    <option key={font} value={font} style={{ fontFamily: font }}>
                      {font}
                    </option>
                  ))}
                </select>
                <div 
                  className="mt-4 p-6 bg-gray-50 rounded-xl text-2xl font-bold border-2 border-gray-100"
                  style={{ fontFamily: brandKit.fonts.heading }}
                >
                  The quick brown fox jumps
                </div>
              </div>

              <div>
                <label className="block text-sm font-black text-gray-700 mb-3 uppercase tracking-wider">
                  Body Font
                </label>
                <select
                  value={brandKit.fonts.body}
                  onChange={(e) => setBrandKit(prev => ({
                    ...prev,
                    fonts: { ...prev.fonts, body: e.target.value }
                  }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg font-bold focus:border-[#0b1411] focus:outline-none"
                  style={{ fontFamily: brandKit.fonts.body }}
                >
                  {GOOGLE_FONTS.map(font => (
                    <option key={font} value={font} style={{ fontFamily: font }}>
                      {font}
                    </option>
                  ))}
                </select>
                <div 
                  className="mt-4 p-6 bg-gray-50 rounded-xl border-2 border-gray-100"
                  style={{ fontFamily: brandKit.fonts.body }}
                >
                  The quick brown fox jumps over the lazy dog. This is how your body text will look across all your websites.
                </div>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-xl font-black text-[#0b1411] uppercase tracking-tight mb-6">Preview</h2>
            <div 
              className="p-10 rounded-xl"
              style={{ backgroundColor: brandKit.colors.primary }}
            >
              <h1 
                className="text-5xl font-black mb-4 uppercase tracking-tight"
                style={{ 
                  fontFamily: brandKit.fonts.heading,
                  color: '#ffffff'
                }}
              >
                Your Brand
              </h1>
              <p 
                className="text-lg mb-6"
                style={{ 
                  fontFamily: brandKit.fonts.body,
                  color: '#ffffff'
                }}
              >
                This is how your brand will look across all websites. The colors, fonts, and mood you've selected will be applied consistently.
              </p>
              <div className="flex gap-4">
                <button 
                  className="px-8 py-4 rounded-xl font-bold uppercase tracking-wider text-sm"
                  style={{ 
                    backgroundColor: brandKit.colors.secondary,
                    color: '#ffffff'
                  }}
                >
                  Secondary
                </button>
                <button 
                  className="px-8 py-4 rounded-xl font-bold uppercase tracking-wider text-sm"
                  style={{ 
                    backgroundColor: brandKit.colors.tertiary,
                    color: '#ffffff'
                  }}
                >
                  Tertiary
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
