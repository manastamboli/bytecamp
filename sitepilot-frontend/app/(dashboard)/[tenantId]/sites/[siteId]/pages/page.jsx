'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth-client'
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Globe,
  ArrowLeft,
  X,
  Loader2,
  AlertCircle,
  Home,
  MonitorOff,
  ExternalLink,
  MousePointerClick,
  Users,
  Timer
} from 'lucide-react'

export default function PagesManagementPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const [site, setSite] = useState(null)
  const [pages, setPages] = useState([])
  const [pageAnalytics, setPageAnalytics] = useState({}) // slug → { views, uniqueSessions, avgDuration }
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newPageName, setNewPageName] = useState('')
  const [newPageSlug, setNewPageSlug] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isPending && !session) {
      router.push('/signin')
    }
  }, [session, isPending, router])

  useEffect(() => {
    if (session && params.siteId) {
      fetchData()
    }
  }, [session, params.siteId])

  const fetchData = async () => {
    try {
      const [siteRes, pagesRes, analyticsRes] = await Promise.all([
        fetch(`/api/sites/${params.siteId}`),
        fetch(`/api/sites/${params.siteId}/pages`),
        fetch(`/api/sites/${params.siteId}/analytics`),
      ])

      if (siteRes.ok) {
        const { site } = await siteRes.json()
        setSite(site)
      }

      if (pagesRes.ok) {
        const { pages } = await pagesRes.json()
        setPages(pages)
      }

      if (analyticsRes.ok) {
        const data = await analyticsRes.json()
        if (data.success && data.pageStats) {
          const map = {}
          data.pageStats.forEach(ps => { map[ps.slug] = ps })
          setPageAnalytics(map)
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePage = async (e) => {
    if (e) e.preventDefault()
    setError('')
    if (!newPageName.trim() || !newPageSlug.trim()) {
      setError('Name and slug are required.')
      return
    }

    setCreating(true)
    try {
      const response = await fetch(`/api/sites/${params.siteId}/pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPageName,
          slug: newPageSlug.startsWith('/') ? newPageSlug : `/${newPageSlug}`,
          seo: {
            title: `${site?.name} — ${newPageName}`,
            description: '',
            ogImage: ''
          },
          layout: []
        })
      })

      if (response.ok) {
        const { page } = await response.json()
        setPages([...pages, page])
        setShowCreateModal(false)
        setNewPageName('')
        setNewPageSlug('')
        // Navigate to builder for the new page
        router.push(`/${params.tenantId}/sites/${params.siteId}/pages/${page.id}/builder`)
      } else {
        const { error } = await response.json()
        setError(error || 'Failed to create page')
      }
    } catch (error) {
      console.error('Error creating page:', error)
      setError('Failed to create page')
    } finally {
      setCreating(false)
    }
  }

  const handleDeletePage = async (pageId, pageName) => {
    if (!confirm(`Are you sure you want to delete "${pageName}"? This cannot be undone.`)) return

    try {
      const response = await fetch(`/api/sites/${params.siteId}/pages/${pageId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setPages(pages.filter(p => p.id !== pageId))
      } else {
        const { error } = await response.json()
        alert(error || 'Failed to delete page')
      }
    } catch (error) {
      console.error('Error deleting page:', error)
      alert('Failed to delete page')
    }
  }

  const handleSetAsHome = async (pageId) => {
    if (!confirm('Set this page as the home page? The current home page will be moved to a different URL.')) return

    try {
      const response = await fetch(`/api/sites/${params.siteId}/pages/${pageId}/set-home`, {
        method: 'POST'
      })

      const result = await response.json()

      if (response.ok) {
        // Refresh the page list
        fetchData()
      } else {
        alert(result.error || 'Failed to set as home page')
      }
    } catch (error) {
      console.error('Error setting home page:', error)
      alert('Failed to set as home page')
    }
  }

  if (isPending || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfdfc]">
        <div className="animate-spin rounded-full h-10 w-10 border-[4px] border-gray-100 border-t-[#0b1411]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fcfdfc] font-sans text-gray-900 pb-20 relative">

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="flex items-start sm:items-center gap-6">
              <button
                onClick={() => router.push(`/${params.tenantId}/sites/${params.siteId}`)}
                className="mt-1 sm:mt-0 p-3 bg-white border border-gray-200 text-gray-400 hover:text-[#0b1411] hover:border-[#0b1411]/20 rounded-2xl transition-all shadow-sm hover:shadow-md focus:outline-none"
                title="Back to Site Details"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div>
                <p className="text-[#8bc4b1] text-[10px] font-bold tracking-[0.2em] uppercase mb-3">
                  PAGES DIRECTORY
                </p>
                <h1 className="text-4xl sm:text-5xl font-black text-[#1d2321] uppercase tracking-tighter leading-[1] truncate max-w-md">
                  Pages
                </h1>
                <p className="text-xs font-bold uppercase tracking-widest text-[#8bc4b1] mt-2 truncate">
                  Manage content for {site?.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
              <button
                onClick={() => setShowCreateModal(true)}
                className="w-full sm:w-auto bg-[#d3ff4a] text-[#0b1411] h-14 px-8 rounded-full font-bold flex items-center justify-center hover:bg-[#c0eb3f] transition-all active:scale-95 shadow-[0_0_20px_rgba(211,255,74,0.3)] hover:scale-105 duration-200 uppercase tracking-widest text-xs shrink-0"
              >
                <Plus size={16} className="mr-2" />
                New Page
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-12">
        {/* Pages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {pages.length === 0 ? (
            <div className="col-span-full text-center py-24 bg-white rounded-[2.5rem] border border-dashed border-gray-300 flex flex-col items-center">
              <div className="h-20 w-20 bg-[#f2f4f2] text-[#0b1411] border border-gray-100 rounded-[2rem] flex items-center justify-center mb-6">
                <FileText size={32} />
              </div>
              <h3 className="text-2xl font-black text-[#1d2321] uppercase tracking-tighter mb-3">No pages found</h3>
              <p className="text-sm font-medium text-gray-500 max-w-sm mb-8 leading-relaxed">
                Your site doesn't have any pages yet. Create your first page to start building.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center justify-center px-8 h-14 bg-[#0b1411] text-[#d3ff4a] text-xs font-black uppercase tracking-widest rounded-full hover:bg-[#1d2321] transition-all shadow-lg hover:scale-105 active:scale-95"
              >
                <Plus size={14} className="mr-2" />
                Create your first page
              </button>
            </div>
          ) : (
            pages.map((page) => (
              <div key={page.id} className="group bg-white border border-gray-100 rounded-[2rem] overflow-hidden hover:border-[#8bc4b1] hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] transition-all duration-300 flex flex-col h-[400px]">

                {/* Visual Preview / Status Top Frame */}
                <div className="h-[55%] relative flex items-center justify-center overflow-hidden border-b border-gray-100 bg-[#f2f4f2]">
                  {page.isPublished && site?.slug ? (
                    <div className="absolute inset-0 w-full h-full overflow-hidden">
                      <iframe
                        src={`/published/${site.slug}/${page.slug === '/' ? 'index' : page.slug.replace(/^\//, '')}.html`}
                        className="border-0 pointer-events-none origin-top-left"
                        style={{ width: '400%', height: '400%', transform: 'scale(0.25)' }}
                        title={`${page.name} Preview`}
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-center px-4">
                      {page.isPublished ? (
                        <div className="h-16 w-16 rounded-[2rem] bg-white border border-gray-100 flex items-center justify-center mb-4">
                          <Globe size={24} className="text-gray-400" />
                        </div>
                      ) : (
                        <div className="h-16 w-16 rounded-[2rem] bg-white border border-gray-100 flex items-center justify-center mb-4">
                          <MonitorOff size={24} className="text-gray-400" />
                        </div>
                      )}
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                        {page.isPublished ? 'Live preview hidden' : 'Draft no preview'}
                      </span>
                    </div>
                  )}
                  {/* Absolute overlay block to prevent clicking the iframe inside the card grid view */}
                  <div className="absolute inset-0 z-10 bg-transparent hover:bg-[#0b1411]/5 transition-colors cursor-pointer" onClick={() => router.push(`/${params.tenantId}/sites/${params.siteId}/pages/${page.id}/builder`)}></div>
                </div>

                {/* Info Area */}
                <div className="p-6 lg:p-8 flex-1 flex flex-col justify-between bg-white relative">
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-[1.2rem] font-black text-[#1d2321] tracking-tight uppercase truncate transition-colors">
                            {page.name}
                          </h3>
                          {page.slug === '/' && (
                            <span className="inline-flex flex-shrink-0 items-center px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase bg-[#0b1411] text-[#d3ff4a]" title="Home Page">
                              <Home size={10} className="mr-1 inline-block" />
                              Home
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-bold text-gray-400 truncate flex items-center px-3 py-2 bg-[#f2f4f2] text-[#0b1411] rounded-lg inline-block w-fit">
                          {page.slug}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-5">
                      {page.isPublished ? (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#0b1411] bg-[#d3ff4a] rounded-full px-3 py-1.5 shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0b1411]" />
                          Live {new Date(page.publishedAt).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-500 bg-[#f2f4f2] rounded-full px-3 py-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                          Draft
                        </span>
                      )}
                    </div>

                    {/* Per-page analytics mini stats */}
                    {(() => {
                      const stats = pageAnalytics[page.slug];
                      if (!stats || stats.views === 0) return null;
                      return (
                        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
                          <span className="flex items-center gap-1 text-[10px] font-bold text-gray-500" title="Page Views">
                            <MousePointerClick size={11} className="text-gray-400" />
                            {stats.views}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] font-bold text-gray-500" title="Unique Visitors">
                            <Users size={11} className="text-gray-400" />
                            {stats.uniqueSessions}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] font-bold text-gray-500" title="Avg. Duration">
                            <Timer size={11} className="text-gray-400" />
                            {stats.avgDuration}s
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="px-6 py-4 bg-[#fcfdfc] border-t border-gray-100 flex items-center justify-between gap-2 z-20">
                  <button
                    onClick={() => router.push(`/${params.tenantId}/sites/${params.siteId}/pages/${page.id}/builder`)}
                    className="flex-1 inline-flex items-center justify-center gap-2 h-10 px-4 bg-[#f2f4f2] text-[#0b1411] text-xs font-black uppercase tracking-widest rounded-full hover:bg-[#0b1411] hover:text-[#d3ff4a] transition-all focus:outline-none focus:ring-2 focus:ring-[#0b1411]/20 group"
                  >
                    <Edit size={12} className="text-[#0b1411] group-hover:text-[#d3ff4a]" />
                    Builder
                  </button>

                  <div className="flex items-center gap-2 shrink-0">
                    {page.isPublished && (
                      <button
                        onClick={() => window.open(`/published/${site.slug}/${page.slug === '/' ? 'index' : page.slug.replace(/^\//, '')}.html`, '_blank')}
                        className="h-10 w-10 flex items-center justify-center text-gray-400 bg-[#f2f4f2] rounded-full hover:bg-[#00e5ff] hover:text-[#0b1411] transition-colors shadow-sm"
                        title="Open published URL"
                      >
                        <ExternalLink size={14} />
                      </button>
                    )}
                    {page.slug !== '/' && (
                      <button
                        onClick={() => handleSetAsHome(page.id)}
                        className="px-4 h-10 flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-[#0b1411] bg-[#f2f4f2] hover:bg-gray-200 transition-colors rounded-full shadow-sm"
                        title="Set as Home Page"
                      >
                        Set Home
                      </button>
                    )}
                    {page.slug !== '/' && (
                      <button
                        onClick={() => handleDeletePage(page.id, page.name)}
                        className="h-10 w-10 flex items-center justify-center text-red-400 bg-red-50 rounded-full hover:bg-red-500 hover:text-white transition-colors shadow-sm"
                        title="Delete Page"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Page Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl border border-gray-100 w-full max-w-md mx-4 overflow-hidden transform transition-all">
            <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-[#fcfdfc]">
              <h2 className="text-xl font-black text-[#1d2321] tracking-tighter uppercase">Create New Page</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setNewPageName('')
                  setNewPageSlug('')
                  setError('')
                }}
                className="p-2 text-gray-400 hover:text-[#0b1411] hover:bg-[#f2f4f2] rounded-2xl transition-all shadow-sm hover:shadow"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreatePage} className="px-8 py-8 space-y-6">
              {error && (
                <div className="flex items-start gap-3 text-sm text-red-700 bg-red-50 border border-red-100 rounded-2xl px-5 py-4 shadow-inner">
                  <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-500" />
                  <span className="font-bold">{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-black tracking-[0.15em] uppercase text-gray-400 mb-3">
                  Page Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newPageName}
                  onChange={(e) => {
                    setNewPageName(e.target.value)
                    if (!newPageSlug || newPageSlug === `/${newPageName.toLowerCase().replace(/\s+/g, '-')}`) {
                      setNewPageSlug(`/${e.target.value.toLowerCase().replace(/\s+/g, '-')}`)
                    }
                  }}
                  placeholder="e.g. About Us"
                  className="w-full px-5 py-4 bg-[#f2f4f2] border-none rounded-2xl text-[1rem] font-bold text-[#0b1411] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0b1411]/20 transition-all shadow-inner"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black tracking-[0.15em] uppercase text-gray-400 mb-3">
                  URL Slug <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newPageSlug}
                  onChange={(e) => setNewPageSlug(e.target.value)}
                  placeholder="/about-us"
                  className="w-full px-5 py-4 bg-[#f2f4f2] border-none rounded-2xl text-[1rem] font-bold text-[#0b1411] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0b1411]/20 transition-all shadow-inner"
                  required
                />
                <p className="mt-3 text-xs font-medium text-gray-400">
                  The URL path structure for this specific page.
                </p>
              </div>

              <div className="flex items-center justify-end gap-4 pt-6 mt-8 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false)
                    setNewPageName('')
                    setNewPageSlug('')
                    setError('')
                  }}
                  disabled={creating}
                  className="px-6 py-3.5 bg-transparent border-none text-gray-500 text-xs font-bold uppercase tracking-widest rounded-full hover:bg-gray-100 hover:text-[#0b1411] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex items-center justify-center px-8 py-3.5 bg-[#d3ff4a] text-[#0b1411] text-xs font-black uppercase tracking-widest rounded-full hover:bg-[#c0eb3f] hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg min-w-[140px]"
                >
                  {creating ? (
                    <>
                      <Loader2 size={16} className="animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    'Create Page'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
