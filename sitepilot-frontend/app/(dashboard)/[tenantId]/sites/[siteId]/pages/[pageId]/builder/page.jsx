"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Toolbar from "@/lib/components/builder/Toolbar";
import LeftSidebar from "@/lib/components/builder/LeftSidebar";
import RightSidebar from "@/lib/components/builder/RightSidebar";
import CanvasArea from "@/lib/components/builder/CanvasArea";
import CollaborativeCanvas from "@/components/builder/CollaborativeCanvas";
import AIChatCopilot from "@/lib/components/builder/AIChatCopilot";

import useBuilderStore from "@/lib/stores/builderStore";
import useHistoryStore from "@/lib/stores/historyStore";
import { useAutosave } from "@/lib/hooks/useAutosave";
import { useSession } from "@/lib/auth-client";
import { getCursorColor } from "@/liveblocks.config";
import { Loader2 } from "lucide-react";
import useUIStore from "@/lib/stores/uiStore";

export default function PageBuilderPage() {
  const params = useParams();
  const { tenantId, siteId, pageId } = params;
  const { data: session } = useSession();

  const { initializeFromAPI } = useBuilderStore();
  const { initialize: initializeHistory } = useHistoryStore();
  const { setLeftSidebarOpen, setRightSidebarOpen } = useUIStore();
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    if (window.innerWidth < 768) {
      setLeftSidebarOpen(false);
      setRightSidebarOpen(false);
    }
  }, [setLeftSidebarOpen, setRightSidebarOpen]);

  // ── Autosave: watches Zustand layoutJSON changes, debounced 5 s ──────────
  const { saving, lastSaved, error: saveError } = useAutosave({ siteId, pageId });

  useEffect(() => {
    const loadPage = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        // 1. Fetch site metadata
        const siteRes = await fetch(`/api/sites/${siteId}`);
        if (!siteRes.ok)
          throw new Error(`Failed to load site: ${siteRes.statusText}`);
        const { site } = await siteRes.json();

        // 2. Fetch the specific page
        const pageRes = await fetch(`/api/sites/${siteId}/pages/${pageId}`);
        if (!pageRes.ok)
          throw new Error(`Failed to load page: ${pageRes.statusText}`);
        const { page } = await pageRes.json();

        // 3. Initialize builder with this page
        initializeFromAPI({
          siteId: site.id,
          pageId: page.id,
          theme: site.theme,
          page,
        });

        // Sync history
        initializeHistory({
          site: { id: site.id, name: site.name },
          theme: site.theme,
          pages: [page],
        });
      } catch (err) {
        console.error("Failed to load page:", err);
        setLoadError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (siteId && pageId) {
      loadPage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId, pageId]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#fcfdfc]">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-[#0b1411] mx-auto mb-4" />
          <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Loading Page Builder…</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#fcfdfc]">
        <div className="text-center">
          <h2 className="text-3xl font-black text-[#1d2321] uppercase tracking-tighter mb-2">Failed to Load Page</h2>
          <p className="text-sm font-medium text-gray-500 mb-6 leading-relaxed">{loadError}</p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-4 bg-[#0b1411] text-[#d3ff4a] text-xs font-black uppercase tracking-widest rounded-full hover:bg-[#1d2321] shadow-lg hover:scale-105 active:scale-95 transition-all focus:outline-none"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Derive user info for collaboration
  const userName = session?.user?.name || session?.user?.email || "Anonymous";
  const userColor = getCursorColor(
    Math.abs(hashCode(session?.user?.id || "anon"))
  );

  return (
    <CollaborativeCanvas
      tenantId={tenantId}
      siteId={siteId}
      pageId={pageId}
      userName={userName}
      userColor={userColor}
    >
      <div className="h-screen flex flex-col bg-[#fcfdfc] font-sans text-gray-900 overflow-hidden text-base">
        <Toolbar saving={saving} lastSaved={lastSaved} saveError={saveError} tenantId={tenantId} />
        <div className="flex-1 flex overflow-hidden">
          <LeftSidebar />
          <CanvasArea />
          <RightSidebar />
        </div>
        
        {/* AI Copilot - Smart Suggestions */}

        
        {/* AI Chat Copilot - Conversational Assistant */}
        <AIChatCopilot tenantId={tenantId} siteId={siteId} />
      </div>
    </CollaborativeCanvas>
  );
}

/** Simple string hash for deterministic color assignment */
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash;
}
