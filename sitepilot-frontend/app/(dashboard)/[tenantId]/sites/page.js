"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import {
  Globe,
  Plus,
  Pencil,
  Eye,
  Trash2,
  ExternalLink,
  Loader2,
  X,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { hasPermission } from "@/lib/permissions";

// ─── Helpers ────────────────────────────────────────────────────────────────

function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Create Site Modal ───────────────────────────────────────────────────────

function CreateSiteModal({ tenantId, onClose, onCreated }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleNameChange = (e) => {
    setName(e.target.value);
    if (!slugEdited) setSlug(slugify(e.target.value));
  };

  const handleSlugChange = (e) => {
    setSlug(slugify(e.target.value));
    setSlugEdited(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!name.trim() || !slug.trim()) {
      setError("Name and slug are required.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          name: name.trim(),
          slug,
          description,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create site");
      onCreated(data.site);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1411]/40 backdrop-blur-md">
      <div className="bg-[#fcfdfc] rounded-[2rem] shadow-2xl border border-gray-100 w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
          <h2 className="text-xl font-black uppercase tracking-tight text-[#1d2321]">
            Create New Site
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-[#0b1411] hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-8 space-y-6">
          {error && (
            <div className="flex items-start gap-3 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-500" />
              <span className="font-bold">{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
              Site Name <span className="text-[#8bc4b1]">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={handleNameChange}
              placeholder="e.g. Acme Marketing"
              className="w-full px-5 py-4 bg-[#f2f4f2] border-none rounded-2xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0b1411]/20 transition-all shadow-inner"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
              URL Slug <span className="text-[#8bc4b1]">*</span>
            </label>
            <div className="flex items-center bg-[#f2f4f2] rounded-2xl focus-within:ring-2 focus-within:ring-[#0b1411]/20 overflow-hidden transition-all shadow-inner">
              <span className="pl-5 py-4 text-gray-400 text-sm font-bold select-none tracking-tight">
                sitepilot.com/
              </span>
              <input
                type="text"
                value={slug}
                onChange={handleSlugChange}
                placeholder="acme-marketing"
                className="flex-1 px-2 py-4 bg-transparent text-sm font-bold text-gray-900 placeholder-gray-400 focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
              Description{" "}
              <span className="text-gray-400 font-normal normal-case tracking-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief description of this site's purpose..."
              rows={2}
              className="w-full px-5 py-4 bg-[#f2f4f2] border-none rounded-2xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0b1411]/20 transition-all shadow-inner resize-y"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 sm:pb-0 pb-6 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3.5 bg-transparent text-gray-500 text-sm font-bold rounded-full hover:bg-gray-100 focus:outline-none transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center px-8 py-3.5 bg-[#d3ff4a] text-[#0b1411] text-sm font-black uppercase tracking-wider rounded-full hover:bg-[#c0eb3f] hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed focus:outline-none shadow-[0_0_20px_rgba(211,255,74,0.3)] transition-all min-w-[140px]"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                'Create Site'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Site Card ───────────────────────────────────────────────────────────────

function SiteCard({ site, tenantId, onDelete, router, userRole }) {
  const publishedCount = site.pages?.filter((p) => p.isPublished).length ?? 0;
  const totalPages = site._count?.pages ?? site.pages?.length ?? 0;
  const canEdit = hasPermission(userRole, 'sites:edit');
  const canDelete = hasPermission(userRole, 'sites:delete');

  const openBuilder = () => {
    router.push(`/${tenantId}/sites/${site.id}/pages`);
  };

  return (
    <div className="group flex flex-col bg-white border border-gray-200 rounded-[2rem] hover:border-[#8bc4b1] hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-500 overflow-hidden relative">

      {/* Subtle card background accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#d3ff4a]/0 to-[#8bc4b1]/0 group-hover:from-[#d3ff4a]/10 group-hover:to-[#8bc4b1]/10 rounded-bl-[100px] transition-all duration-500 pointer-events-none" />

      {/* Header Info */}
      <div className="p-6 lg:p-8 flex-1 relative z-10">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="h-14 w-14 rounded-2xl bg-[#0b1411] text-[#d3ff4a] flex items-center justify-center shrink-0 font-black text-xl group-hover:bg-[#d3ff4a] group-hover:text-[#0b1411] shadow-lg shadow-black/5 transition-colors">
              <Globe className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h3 className="text-[1.35rem] font-black text-[#1d2321] leading-[1.2] tracking-tight truncate group-hover:text-[#8bc4b1] transition-colors">
                {site.name}
              </h3>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1 truncate">
                /{site.slug}
              </p>
            </div>
          </div>
        </div>

        {site.description && (
          <p className="text-sm text-gray-500 font-medium mt-4 line-clamp-2 leading-relaxed">
            {site.description}
          </p>
        )}

        <div className="flex items-center gap-3 mt-6">
          {publishedCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {publishedCount} Published
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#f2f4f2] text-gray-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-gray-100 group-hover:border-[#8bc4b1]/30 transition-colors">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
              Draft
            </span>
          )}
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-gray-300" />
            {formatDate(site.updatedAt)}
          </span>
        </div>
      </div>

      {/* Actions Footer */}
      <div className="px-6 lg:px-8 pb-6 pt-4 border-t border-gray-100/50 flex items-center justify-between gap-3 relative z-10">
        {canEdit ? (
          <button
            onClick={openBuilder}
            className="flex-1 h-11 inline-flex items-center justify-center gap-2 px-6 bg-[#f2f4f2] text-[#0b1411] text-xs font-black uppercase tracking-widest rounded-full group-hover:bg-[#d3ff4a] shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-95 transition-all focus:outline-none"
          >
            <Pencil size={15} className="text-[#0b1411]/50 group-hover:text-[#0b1411]/70" />
            Build
          </button>
        ) : (
          <button
            onClick={() => router.push(`/${tenantId}/sites/${site.id}`)}
            className="flex-1 h-11 flex items-center justify-center gap-1.5 px-6 bg-[#fcfdfc] border border-gray-200 text-gray-700 text-xs font-black uppercase tracking-widest rounded-full hover:bg-gray-50 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <Eye size={14} />
            View
          </button>
        )}

        <div className="flex items-center gap-2 shrink-0">
          {site.domain && (
            <a
              href={`https://${site.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="h-11 w-11 flex items-center justify-center bg-[#fcfdfc] border border-gray-200 text-gray-500 rounded-full hover:bg-gray-50 hover:text-[#0b1411] transition-all hover:scale-105"
              title="Open live site"
            >
              <ExternalLink size={16} />
            </a>
          )}
          {canDelete && (
            <button
              onClick={() => onDelete(site)}
              className="h-11 w-11 flex items-center justify-center border border-transparent text-gray-400 rounded-full hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all hover:scale-105"
              title="Delete site"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function SitesPage() {
  const router = useRouter();
  const params = useParams();
  const { tenantId } = params;
  const { data: session, isPending } = useSession();

  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [userRole, setUserRole] = useState(null);
  const [successToast, setSuccessToast] = useState(null); // Added state for toast

  const [fetchedTenantId, setFetchedTenantId] = useState(null);

  const canCreate = hasPermission(userRole, 'sites:create');

  useEffect(() => {
    if (!isPending && !session) router.push("/auth/signin");
  }, [session, isPending, router]);

  useEffect(() => {
    if (session && tenantId && fetchedTenantId !== tenantId) {
      fetchSites();
      fetchUserRole();
      setFetchedTenantId(tenantId);
    }
  }, [session, tenantId, fetchedTenantId]);

  const fetchUserRole = async () => {
    try {
      const res = await fetch(`/api/tenants/${tenantId}`);
      if (res.ok) {
        const data = await res.json();
        setUserRole(data.userRole);
      }
    } catch (err) {
      console.error('Error fetching role:', err);
    }
  };

  const fetchSites = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sites?tenantId=${tenantId}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setSites(data.sites || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreated = (newSite) => {
    setSites((prev) => [newSite, ...prev]);
    setShowCreate(false);
    setSuccessToast(newSite.name);
    // Give the user a moment to see the success toast before redirecting
    setTimeout(() => {
      router.push(`/${tenantId}/sites/${newSite.id}/pages`);
    }, 1500);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/sites/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error((await res.json()).error || "Delete failed");
      setSites((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    } finally {
      setDeleting(false);
    }
  };

  if (isPending || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfdfc]">
        <div className="animate-spin rounded-full h-10 w-10 border-[4px] border-gray-100 border-t-[#0b1411]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfdfc] font-sans text-gray-900 pb-20 relative">

      <div className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="flex items-start sm:items-center gap-6">
              <button
                onClick={() => router.push(`/${tenantId}`)}
                className="mt-1 sm:mt-0 p-3 bg-white border border-gray-200 text-gray-400 hover:text-[#0b1411] hover:border-[#0b1411]/20 rounded-2xl transition-all shadow-sm hover:shadow-md focus:outline-none"
                title="Back to Workspace"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div>
                <p className="text-[#8bc4b1] text-[10px] font-bold tracking-[0.2em] uppercase mb-3">
                  WORKSPACE DIRECTORY
                </p>
                <h1 className="text-4xl sm:text-5xl font-black text-[#1d2321] uppercase tracking-tighter leading-[1]">
                  Sites
                </h1>
              </div>
            </div>
            {canCreate && (
              <button
                onClick={() => setShowCreate(true)}
                className="w-full sm:w-auto bg-[#d3ff4a] text-[#0b1411] h-14 px-8 rounded-full font-bold flex items-center justify-center hover:bg-[#c0eb3f] transition-all active:scale-95 shadow-[0_0_20px_rgba(211,255,74,0.3)] hover:scale-105 duration-200"
              >
                <Plus className="h-5 w-5 mr-2" />
                New Site
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-12">
        {error && (
          <div className="mb-8 flex items-start gap-3 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-5 py-4">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-500" />
            <span className="font-medium text-base">{error}</span>
          </div>
        )}

        {/* Sites grid */}
        {sites.length === 0 ? (
          <div className="py-32 text-center border border-gray-200 rounded-[2.5rem] bg-[#fcfdfc] border-dashed px-6 flex flex-col items-center">
            <div className="h-20 w-20 rounded-[2rem] bg-gray-50 border border-gray-100 flex items-center justify-center mb-8">
              <Globe size={32} className="text-gray-300" />
            </div>
            <h3 className="text-2xl font-black text-[#0b1411] tracking-tight mb-3">
              No Domains Launched
            </h3>
            <p className="text-base font-medium text-gray-500 max-w-sm mb-10 leading-relaxed">
              {canCreate ? 'Start building your digital presence by creating your first website in this workspace.' : 'No sites have been created yet.'}
            </p>
            {canCreate && (
              <button
                onClick={() => setShowCreate(true)}
                className="h-14 px-8 bg-[#0b1411] text-[#d3ff4a] font-bold rounded-full flex items-center justify-center hover:bg-[#1d2321] transition-all hover:scale-105 active:scale-95 shadow-lg"
              >
                <Plus size={20} className="mr-2" />
                Initialize Site
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sites.map((site) => (
              <SiteCard
                key={site.id}
                site={site}
                tenantId={tenantId}
                onDelete={setDeleteTarget}
                router={router}
                userRole={userRole}
              />
            ))}
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 bg-gray-900 text-white rounded-2xl shadow-2xl animate-in slide-in-from-bottom-5 duration-300">
          <div className="p-1 bg-emerald-500 rounded-full">
            <CheckCircle2 size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold">Site created successfully!</p>
            <p className="text-xs text-gray-400 mt-0.5">Your CloudFront tenant is live.</p>
          </div>
          <button
            onClick={() => setSuccessToast(null)}
            className="ml-4 p-1 text-gray-500 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <CreateSiteModal
          tenantId={tenantId}
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1411]/40 backdrop-blur-md">
          <div className="bg-[#fcfdfc] rounded-[2rem] shadow-2xl border border-gray-100 w-full max-w-md mx-4 p-8 text-center text-[#0b1411]">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[2rem] border border-red-100 bg-red-50 mb-6 shadow-sm">
              <Trash2 className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-black tracking-tight uppercase mb-3">
              Delete Site
            </h2>
            <p className="text-sm font-medium text-gray-500 mb-8 leading-relaxed px-2">
              Are you sure you want to delete <strong className="text-gray-900 font-bold">{deleteTarget.name}</strong>? This action cannot be undone and will permanently remove all pages and content.
            </p>
            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 px-6 py-4 bg-[#f2f4f2] text-gray-600 text-sm font-bold uppercase tracking-widest rounded-full hover:bg-gray-200 transition-colors focus:outline-none"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 flex items-center justify-center px-6 py-4 bg-red-500 text-white text-sm font-black uppercase tracking-widest rounded-full hover:bg-red-600 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-lg shadow-red-500/20"
              >
                {deleting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : "Delete Site"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
