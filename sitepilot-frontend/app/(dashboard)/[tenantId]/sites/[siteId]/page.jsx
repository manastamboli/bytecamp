"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import CustomDomainManager from "@/components/CustomDomainManager";
import {
  Globe,
  ExternalLink,
  Loader2,
  Pencil,
  X,
  Check,
  AlertCircle,
  History,
  ArrowLeft,
  Plus,
  Trash2,
  Calendar,
  Link as LinkIcon,
  Monitor,
  Users,
  Timer,
  MousePointerClick,
  MonitorOff,
  LayoutTemplate,
  Clock,
  CheckCircle2,
  RotateCcw,
  Rocket,
  Settings
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelative(iso) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

// ─── Inline Rename Input ──────────────────────────────────────────────────────

function InlineRename({ siteId, deployment, onRenamed }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(deployment.deploymentName || "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!value.trim()) { setEditing(false); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/sites/${siteId}/deployments`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deploymentId: deployment.deploymentId,
          deploymentName: value.trim(),
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Rename failed");
      onRenamed({ ...deployment, deploymentName: value.trim() });
      setEditing(false);
    } catch (err) {
      alert(`Rename failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <span className="flex items-center gap-2 min-w-0">
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") setEditing(false);
          }}
          className="flex-1 min-w-0 px-3 py-1.5 text-xs font-bold bg-[#f2f4f2] text-[#0b1411] border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0b1411]/20 shadow-inner"
        />
        <button onClick={save} disabled={saving} className="p-1.5 bg-[#d3ff4a] text-[#0b1411] hover:bg-[#c0eb3f] rounded-lg transition-colors">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
        </button>
        <button onClick={() => setEditing(false)} className="p-1.5 text-gray-400 hover:bg-gray-100 hover:text-[#0b1411] rounded-lg transition-colors">
          <X size={14} />
        </button>
      </span>
    );
  }

  return (
    <span className="flex items-center gap-2 group min-w-0">
      <span className="font-black text-[#1d2321] truncate text-[1.1rem]">
        {deployment.deploymentName || (
          <span className="text-gray-400 font-bold italic">Untitled version</span>
        )}
      </span>
      <button
        onClick={() => setEditing(true)}
        className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-[#0b1411] hover:bg-gray-100 rounded-lg transition-all"
        title="Rename deployment"
      >
        <Pencil size={12} />
      </button>
    </span>
  );
}

// ─── Deployment Row ───────────────────────────────────────────────────────────

function DeploymentRow({ siteId, siteSlug, deployment, onRollback, onRenamed }) {
  const [rolling, setRolling] = useState(false);

  const handleRollback = async () => {
    if (!confirm(`Roll back to "${deployment.deploymentName || deployment.deploymentId}"?\n\nYour live site will instantly serve this version.`)) return;
    setRolling(true);
    try {
      await onRollback(siteSlug, deployment.deploymentId);
    } finally {
      setRolling(false);
    }
  };

  return (
    <div
      className={`flex items-center gap-6 px-8 py-5 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors ${deployment.isActive ? "bg-emerald-50/30" : ""
        }`}
    >
      {/* Status Dot */}
      <div className="shrink-0">
        {deployment.isActive ? (
          <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#0b1411] bg-[#d3ff4a] rounded-full px-3 py-1.5 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0b1411] inline-block animate-pulse" />
            Live
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-500 bg-[#f2f4f2] rounded-full px-3 py-1.5">
            <Clock size={11} />
            Past
          </span>
        )}
      </div>

      {/* Name + ID */}
      <div className="flex-1 min-w-0">
        <InlineRename siteId={siteId} deployment={deployment} onRenamed={onRenamed} />
        <div className="flex items-center gap-3 mt-1.5">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest truncate">
            {deployment.deploymentId}
          </p>
          {/* CDN Status inline on small screens */}
          {deployment.kvsUpdated ? (
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-1 sm:hidden">
              <CheckCircle2 size={10} />
              Edge Live
            </span>
          ) : (
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 flex items-center gap-1 sm:hidden">
              <AlertCircle size={10} />
              Edge Pending
            </span>
          )}
        </div>
      </div>

      {/* KVS status */}
      <div className="shrink-0 hidden sm:block">
        {deployment.kvsUpdated ? (
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-1 border border-emerald-100 bg-emerald-50 px-2 py-1 rounded-md">
            <CheckCircle2 size={12} />
            Edge Live
          </span>
        ) : (
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 flex items-center gap-1 border border-amber-100 bg-amber-50 px-2 py-1 rounded-md">
            <AlertCircle size={12} />
            Edge Pending
          </span>
        )}
      </div>

      {/* Timestamp */}
      <div className="shrink-0 text-right hidden md:block w-[120px]">
        <p className="text-xs font-bold text-[#1d2321]">{formatRelative(deployment.createdAt)}</p>
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-0.5">{formatDate(deployment.createdAt)}</p>
      </div>

      {/* Actions */}
      {!deployment.isActive ? (
        <button
          onClick={handleRollback}
          disabled={rolling}
          className="shrink-0 flex items-center gap-1.5 px-4 h-10 text-[10px] font-black uppercase tracking-widest text-[#0b1411] bg-[#f2f4f2] hover:bg-[#0b1411] hover:text-[#d3ff4a] rounded-full transition-all disabled:opacity-50"
          title="Roll back to this deployment"
        >
          {rolling ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <RotateCcw size={12} />
          )}
          Restore
        </button>
      ) : (
        <span className="shrink-0 w-[104px]" /> // Spacer to align
      )}
    </div>
  );
}

// ─── Publish Modal ────────────────────────────────────────────────────────────

function PublishModal({ siteId, onClose, onSuccess }) {
  const [deploymentName, setDeploymentName] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState(null);

  const handlePublish = async () => {
    setError(null);
    setIsPublishing(true);
    try {
      const res = await fetch(`/api/sites/${siteId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deploymentName: deploymentName.trim() || null,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Publish failed");
      onSuccess(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Rocket size={16} className="text-indigo-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">Publish Site</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-gray-500">
            Your site will be uploaded to S3 and CloudFront will be
            updated instantly. Every publish creates a new versioned snapshot —
            you can roll back at any time.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Deployment name{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={deploymentName}
              onChange={(e) => setDeploymentName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handlePublish()}
              placeholder="e.g. v1.2 — Added hero section"
              autoFocus
              className="w-full px-3.5 py-2.5 bg-white border border-gray-300 text-gray-900 text-sm rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex gap-3">
          <button
            onClick={onClose}
            disabled={isPublishing}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 bg-white text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handlePublish}
            disabled={isPublishing}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2"
          >
            {isPublishing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Publishing…
              </>
            ) : (
              <>
                <Rocket size={16} />
                Publish now
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page Component ───────────────────────────────────────────────────────────

export default function SiteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const [site, setSite] = useState(null);
  const [deployments, setDeployments] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPublishModal, setShowPublishModal] = useState(false);

  const [fetchedSiteId, setFetchedSiteId] = useState(null);

  const siteUrl = site ? `https://${site.slug}.sitepilot.devally.in` : null;

  // ── Fetch site + deployments ──────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!params.siteId) return;
    setLoading(true);
    try {
      const [siteRes, depRes, analyticsRes] = await Promise.all([
        fetch(`/api/sites/${params.siteId}`),
        fetch(`/api/sites/${params.siteId}/deployments`),
        fetch(`/api/sites/${params.siteId}/analytics`)
      ]);

      if (!siteRes.ok) throw new Error((await siteRes.json()).error || "Failed to load site");
      const { site: siteData } = await siteRes.json();
      setSite(siteData);

      if (depRes.ok) {
        const { deployments: deps } = await depRes.json();
        setDeployments(deps || []);
      }

      if (analyticsRes.ok) {
        const data = await analyticsRes.json();
        if (data.success) {
          setAnalytics(data);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [params.siteId]);

  useEffect(() => {
    if (!isPending && !session) router.push("/auth/signin");
  }, [session, isPending, router]);

  useEffect(() => {
    if (session && params.siteId && fetchedSiteId !== params.siteId) {
      fetchData();
      setFetchedSiteId(params.siteId);
    }
  }, [session, params.siteId, fetchedSiteId, fetchData]);

  // ── Rollback ──────────────────────────────────────────────────────────────
  const handleRollback = async (siteSlug, deploymentId) => {
    try {
      const res = await fetch("/api/sites/rollback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteSlug, deploymentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Rollback failed");

      // Update local state optimistically
      setDeployments((prev) =>
        prev.map((d) => ({
          ...d,
          isActive: d.deploymentId === deploymentId,
          kvsUpdated: d.deploymentId === deploymentId ? true : d.kvsUpdated,
        }))
      );
    } catch (err) {
      alert(`Rollback failed: ${err.message}`);
    }
  };

  // ── Rename handler ────────────────────────────────────────────────────────
  const handleRenamed = (updatedDep) => {
    setDeployments((prev) =>
      prev.map((d) => (d.deploymentId === updatedDep.deploymentId ? updatedDep : d))
    );
  };

  const handlePublishSuccess = (result) => {
    setShowPublishModal(false);
    fetchData(); // reload deployments list and site state
  };

  // ─── Render: Loading ──────────────────────────────────────────────────────
  if ((isPending || loading) && !site && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfdfc]">
        <div className="animate-spin rounded-full h-10 w-10 border-[4px] border-gray-100 border-t-[#0b1411]" />
      </div>
    );
  }

  if (!site) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfdfc]">
        <div className="text-center max-w-sm px-6">
          <div className="bg-red-50 text-red-500 p-5 rounded-[2rem] inline-flex mb-8 shadow-sm">
            <Globe className="h-10 w-10" />
          </div>
          <h2 className="text-3xl font-black text-[#1d2321] uppercase tracking-tighter mb-3">Site not found</h2>
          <p className="text-sm font-medium text-gray-500 mb-10 leading-relaxed">
            The site you're looking for was either deleted or doesn't exist.
          </p>
          <button
            onClick={() => router.push(`/${params.tenantId}`)}
            className="w-full py-4 px-6 bg-[#0b1411] text-[#d3ff4a] rounded-full hover:bg-[#1d2321] transition-all font-black uppercase tracking-widest text-xs inline-flex justify-center items-center shadow-lg hover:scale-[1.02] active:scale-95"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Workspace
          </button>
        </div>
      </div>
    );
  }

  const activeDeployment = deployments.find((d) => d.isActive);

  // Check if site has deployments (published)
  const isPublished = Boolean(deployments.length > 0);

  return (
    <div className="min-h-screen bg-[#fcfdfc] font-sans text-gray-900 pb-20 relative">

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="flex items-start sm:items-center gap-6">
              <button
                onClick={() => router.push(`/${params.tenantId}/sites`)}
                className="mt-1 sm:mt-0 p-3 bg-white border border-gray-200 text-gray-400 hover:text-[#0b1411] hover:border-[#0b1411]/20 rounded-2xl transition-all shadow-sm hover:shadow-md focus:outline-none"
                title="Back to Sites"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div>
                <p className="text-[#8bc4b1] text-[10px] font-bold tracking-[0.2em] uppercase mb-3">
                  SITE DETAILS
                </p>
                <h1 className="text-4xl sm:text-5xl font-black text-[#1d2321] uppercase tracking-tighter leading-[1] truncate max-w-md">
                  {site.name}
                </h1>
                <p className="text-xs font-bold uppercase tracking-widest text-[#8bc4b1] mt-2 truncate">
                  /{site.slug}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
              <button
                onClick={() => router.push(`/${params.tenantId}/sites/${params.siteId}/pages`)}
                className="w-full sm:w-auto bg-[#d3ff4a] text-[#0b1411] h-14 px-8 rounded-full font-bold flex items-center justify-center hover:bg-[#c0eb3f] transition-all active:scale-95 shadow-[0_0_20px_rgba(211,255,74,0.3)] hover:scale-105 duration-200 uppercase tracking-widest text-xs"
              >
                <LayoutTemplate size={16} className="mr-2" />
                Manage Pages
              </button>
              <button
                onClick={() => router.push(`/${params.tenantId}/sites/${params.siteId}/settings`)}
                className="inline-flex items-center justify-center px-5 py-2.5 bg-white border border-gray-200 text-[#0b1411] text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors focus:outline-none shadow-sm"
              >
                <Settings size={16} className="mr-2" />
                Settings
              </button>
              <button
                onClick={() => setShowPublishModal(true)}
                className="inline-flex items-center justify-center px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 shadow-sm shadow-indigo-500/20"
              >
                <Rocket size={16} className="mr-2" />
                Publish Site
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-12 space-y-16">

        {/* Top Grid: Preview Card Left, Overview Right */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

          {/* Preview Card */}
          <div className="lg:col-span-1">
            <h2 className="text-sm font-black text-gray-400 tracking-[0.15em] uppercase mb-6">Site Preview</h2>
            <div className="bg-white border border-gray-100 rounded-[2rem] shadow-sm overflow-hidden flex flex-col h-[340px] group relative hover:border-[#8bc4b1] transition-colors">
              {isPublished ? (
                <div className="flex-1 bg-[#f2f4f2] flex items-center justify-center overflow-hidden relative">
                  <iframe
                    src={siteUrl}
                    className="w-[200%] h-[200%] border-0 pointer-events-none origin-top-left scale-[0.5]"
                    title="Site Live Preview"
                  />
                  <div className="absolute inset-0 z-10 bg-transparent" />
                </div>
              ) : (
                <div className="flex-1 bg-[#fcfdfc] flex flex-col items-center justify-center transition-colors">
                  <div className="h-16 w-16 rounded-[2rem] bg-gray-50 border border-gray-100 flex items-center justify-center mb-4">
                    <MonitorOff className="h-8 w-8 text-gray-300" />
                  </div>
                  <span className="text-sm font-bold text-[#1d2321]">Not Published</span>
                  <span className="text-xs font-medium text-gray-400 mt-1 max-w-[200px] text-center">Connect a domain to preview</span>
                </div>
              )}

              <div className="p-6 bg-white flex justify-between items-center border-t border-gray-100 relative z-10">
                <div className="min-w-0 pr-3">
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#0b1411] truncate">Live View</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 truncate mt-1">
                    {isPublished ? `${site.slug}.sitepilot.devally.in` : 'No deployment'}
                  </p>
                </div>
                {isPublished && (
                  <a
                    href={siteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-10 w-10 flex items-center justify-center bg-[#f2f4f2] text-[#0b1411] rounded-2xl hover:bg-[#d3ff4a] transition-colors flex-shrink-0"
                    title="Open live site"
                  >
                    <ExternalLink size={16} />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Overview & Domains */}
          <div className="lg:col-span-2 space-y-12">

            {/* Stats Overview */}
            <div>
              <h2 className="text-sm font-black text-gray-400 tracking-[0.15em] uppercase mb-6">Overview</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-white border border-gray-100 rounded-[2rem] p-6 lg:p-8 shadow-sm flex flex-col justify-between hover:border-[#8bc4b1] transition-all group">
                  <div className="flex items-center gap-4 mb-8 text-gray-500">
                    <div className="h-10 w-10 rounded-2xl bg-[#f2f4f2] text-[#0b1411] flex items-center justify-center group-hover:bg-[#d3ff4a] transition-colors">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-[#0b1411]">Created</span>
                  </div>
                  <p className="text-2xl font-black text-[#1d2321] tracking-tighter mt-auto">
                    {new Date(site.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                </div>

                <div className="bg-white border border-gray-100 rounded-[2rem] p-6 lg:p-8 shadow-sm flex flex-col justify-between hover:border-[#8bc4b1] transition-all group">
                  <div className="flex items-center gap-4 mb-8 text-gray-500">
                    <div className="h-10 w-10 rounded-2xl bg-[#f2f4f2] text-[#0b1411] flex items-center justify-center group-hover:bg-[#00e5ff] transition-colors">
                      <Clock className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-[#0b1411]">Updated</span>
                  </div>
                  <p className="text-2xl font-black text-[#1d2321] tracking-tighter mt-auto">
                    {new Date(site.updatedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                </div>

                <div className="bg-white border border-gray-100 rounded-[2rem] p-6 lg:p-8 shadow-sm flex flex-col justify-between hover:border-[#8bc4b1] transition-all group">
                  <div className="flex items-center gap-4 mb-8 text-gray-500">
                    <div className="h-10 w-10 rounded-2xl bg-[#f2f4f2] text-[#0b1411] flex items-center justify-center group-hover:bg-[#1d2321] group-hover:text-white transition-colors">
                      <History className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-[#0b1411]">Deploys</span>
                  </div>
                  <p className="text-2xl font-black text-[#1d2321] tracking-tighter mt-auto">
                    {site._count?.versions || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Custom Domains Section */}
            <CustomDomainManager siteId={params.siteId} siteSlug={site.slug} />

          </div>
        </div>

        {/* Analytics Section */}
        <div>
          <h2 className="text-sm font-black text-gray-400 tracking-[0.15em] uppercase mb-6">Site Analytics</h2>
          <div className="bg-white border border-gray-100 rounded-[2rem] shadow-sm overflow-hidden flex flex-col relative text-[#0b1411]">
            <div className="p-8 lg:p-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">

                <div className="flex flex-col">
                  <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
                    <Users size={16} /> Visitors
                  </span>
                  <span className="text-5xl font-black tracking-tighter">{analytics?.siteStats?.uniqueSessions || 0}</span>
                </div>

                <div className="flex flex-col">
                  <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
                    <MousePointerClick size={16} /> Page Views
                  </span>
                  <span className="text-5xl font-black tracking-tighter">{analytics?.siteStats?.totalViews || 0}</span>
                </div>

                <div className="flex flex-col">
                  <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
                    <Timer size={16} /> Avg. Duration
                  </span>
                  <span className="text-5xl font-black tracking-tighter">{analytics?.siteStats?.avgDuration || 0}s</span>
                </div>

                <div className="flex flex-col">
                  <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
                    <ExternalLink size={16} /> Top Page
                  </span>
                  <span className="text-3xl font-black tracking-tighter truncate max-w-full">
                    {analytics?.pageStats?.[0]?.slug || "N/A"}
                  </span>
                </div>
              </div>

              {analytics?.pageStats?.length > 0 && (
                <div className="pb-8 overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="pb-4 pt-0 font-bold text-xs uppercase tracking-widest text-[#1d2321]">Page Path</th>
                        <th className="pb-4 pt-0 font-bold text-xs uppercase tracking-widest text-[#1d2321]">Views</th>
                        <th className="pb-4 pt-0 font-bold text-xs uppercase tracking-widest text-[#1d2321]">Unique Visitors</th>
                        <th className="pb-4 pt-0 font-bold text-xs uppercase tracking-widest text-[#1d2321]">Avg. Session</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {analytics.pageStats.map(stat => (
                        <tr key={stat.slug} className="hover:bg-gray-50/50">
                          <td className="py-4 font-bold text-sm">{stat.slug}</td>
                          <td className="py-4 font-bold text-sm text-gray-500">{stat.views}</td>
                          <td className="py-4 font-bold text-sm text-gray-500">{stat.uniqueSessions}</td>
                          <td className="py-4 font-bold text-sm text-gray-500">{stat.avgDuration}s</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="pt-8 border-t border-gray-100">
                <p className="text-sm font-medium text-gray-500 text-center flex items-center justify-center gap-3">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  Analytics tracking will begin recording once traffic is detected on a live domain.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Deployment History ────────────────────────────────────────────── */}
        <div>
          <h2 className="text-sm font-black text-gray-400 tracking-[0.15em] uppercase mb-6 mt-8">Recent Deployments</h2>
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden relative">
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-[#fcfdfc]">
              <h2 className="text-sm font-black uppercase tracking-widest text-[#1d2321] flex items-center gap-3">
                <History size={16} className="text-[#8bc4b1]" />
                Version History
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest bg-[#f2f4f2] rounded-full px-2.5 py-1">
                  {deployments.length}
                </span>
              </h2>
              <button
                onClick={() => router.push(`/${params.tenantId}/sites/${params.siteId}/pages`)}
                className="flex items-center gap-1.5 text-xs text-[#0b1411] hover:text-[#8bc4b1] font-bold uppercase tracking-widest transition-colors"
              >
                <Pencil size={12} />
                Manage Pages
              </button>
            </div>

            {deployments.length === 0 ? (
              <div className="text-center py-24 px-8">
                <div className="h-20 w-20 rounded-[2rem] bg-[#f2f4f2] border border-gray-100 flex items-center justify-center mb-8 mx-auto">
                  <History size={36} className="text-gray-400" />
                </div>
                <p className="text-2xl font-black text-[#1d2321] tracking-tight mb-3">No deployments yet</p>
                <p className="text-sm font-medium text-gray-500 max-w-sm mx-auto">
                  Open the builder and click "Publish" to record your first deployment.
                </p>
                <button
                  onClick={() => router.push(`/${params.tenantId}/sites/${params.siteId}/pages`)}
                  className="mt-8 inline-flex items-center justify-center gap-2 px-8 h-14 bg-[#0b1411] text-[#d3ff4a] text-xs font-black uppercase tracking-widest rounded-full hover:bg-[#1d2321] transition-all hover:scale-105 active:scale-95 shadow-lg"
                >
                  <Pencil size={14} />
                  Manage Pages
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {deployments.map((dep) => (
                  <DeploymentRow
                    key={dep.id}
                    siteId={params.siteId}
                    siteSlug={site.slug}
                    deployment={dep}
                    onRollback={handleRollback}
                    onRenamed={handleRenamed}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Error ────────────────────────────────────────────────────────── */}
        {error && (
          <div className="flex items-start gap-3 text-sm text-red-700 bg-red-50 border border-red-100 rounded-2xl px-6 py-5 shadow-inner">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-500" />
            <span className="font-bold">{error}</span>
          </div>
        )}

      </div>

      {showPublishModal && site && (
        <PublishModal
          siteId={site.id}
          onClose={() => setShowPublishModal(false)}
          onSuccess={handlePublishSuccess}
        />
      )}
    </div>
  );
}