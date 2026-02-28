/**
 * TOP TOOLBAR - Form Builder Actions
 */

'use client';

import { ArrowLeft, Save, Eye, Settings, Menu, Settings2 } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import useFormBuilderStore from '@/lib/stores/formBuilderStore';
import useUIStore from '@/lib/stores/uiStore';

export default function FormBuilderToolbar({ onSave, saving, lastSaved }) {
  const { toggleLeftSidebar, toggleRightSidebar } = useUIStore();
  const router = useRouter();
  const params = useParams();
  const { formData, isDirty } = useFormBuilderStore();

  const formatLastSaved = () => {
    if (!lastSaved) return '';
    const now = new Date();
    const diff = Math.floor((now - lastSaved) / 1000); // seconds
    
    if (diff < 60) return 'Saved just now';
    if (diff < 3600) return `Saved ${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `Saved ${Math.floor(diff / 3600)}h ago`;
    return `Saved ${lastSaved.toLocaleDateString()}`;
  };

  return (
    <div className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-6 sm:px-10 z-20">
      {/* Left Section */}
      <div className="flex items-center gap-2 sm:gap-6">
        <button
          onClick={toggleLeftSidebar}
          className="md:hidden p-2 text-gray-500 hover:text-[#0b1411] hover:bg-gray-100 rounded-xl transition-colors"
          title="Toggle Left Sidebar"
        >
          <Menu size={18} />
        </button>
        <button
          onClick={() => router.push(`/${params.tenantId}/sites/${params.siteId}/forms`)}
          className="p-3 bg-white border border-gray-200 text-gray-400 hover:text-[#0b1411] hover:border-[#0b1411]/20 rounded-2xl transition-all shadow-sm hover:shadow-md focus:outline-none"
          title="Back to Forms"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        
        <div className="h-10 w-px bg-gray-200" />
        
        <div>
          <p className="text-[#8bc4b1] text-[10px] font-bold tracking-[0.2em] uppercase mb-0.5">
            FORM BUILDER
          </p>
          <h1 className="text-xl font-black text-[#1d2321] uppercase tracking-tighter leading-none">{formData.name}</h1>
          <p className="text-[10px] font-bold uppercase tracking-widest mt-1 text-gray-400">
            {formData.fields.length} field{formData.fields.length !== 1 ? 's' : ''}
            {isDirty ? (
              <span className="ml-2 text-orange-500">• Unsaved changes</span>
            ) : lastSaved ? (
              <span className="ml-2 text-emerald-500">• {formatLastSaved()}</span>
            ) : null}
          </p>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        <button
          className="flex items-center gap-2 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-[#0b1411] bg-[#f2f4f2] hover:bg-gray-200 rounded-full transition-all"
          title="Preview Form"
        >
          <Eye size={14} />
          <span>Preview</span>
        </button>

        <button
          className="flex items-center gap-2 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-[#0b1411] bg-[#f2f4f2] hover:bg-gray-200 rounded-full transition-all"
          title="Form Settings"
        >
          <Settings size={14} />
          <span>Settings</span>
        </button>

        <div className="h-8 w-px bg-gray-200 mx-1" />

        <button
          onClick={onSave}
          disabled={saving || !isDirty}
          className="flex items-center gap-2 h-10 px-6 font-black uppercase tracking-widest text-xs bg-[#d3ff4a] text-[#0b1411] rounded-full hover:bg-[#c0eb3f] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md hover:scale-105 active:scale-95 duration-200"
        >
          <Save size={14} />
          <span className="hidden sm:inline">
            {saving ? 'Saving...' : 'Save Form'}
          </span>
        </button>

        <button
          onClick={toggleRightSidebar}
          className="md:hidden flex items-center justify-center p-2 text-gray-400 hover:text-[#0b1411] hover:bg-gray-100 rounded-xl transition-colors min-w-[36px]"
          title="Toggle Right Sidebar"
        >
          <Settings2 size={18} />
        </button>
      </div>
    </div>
  );
}
