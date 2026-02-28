'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth-client'
import { hasPermission } from '@/lib/permissions'
import {
  Loader2,
  ArrowLeft,
  Plus,
  FileText,
  X,
  AlertCircle,
  Edit,
  List,
  Trash2,
  Calendar,
  Layers
} from 'lucide-react'

export default function FormsListPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const [forms, setForms] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [creating, setCreating] = useState(false)
  const [userRole, setUserRole] = useState(null)

  const [fetchedSiteId, setFetchedSiteId] = useState(null)

  const canCreate = hasPermission(userRole, 'forms:create')
  const canEdit = hasPermission(userRole, 'forms:edit')
  const canDelete = hasPermission(userRole, 'forms:delete')

  useEffect(() => {
    if (!isPending && !session) {
      router.push('/auth/signin')
    }
  }, [session, isPending, router])

  useEffect(() => {
    if (session && params.siteId && fetchedSiteId !== params.siteId) {
      fetchForms()
      fetchUserRole()
      setFetchedSiteId(params.siteId)
    }
  }, [session, params.siteId, fetchedSiteId])

  const fetchUserRole = async () => {
    try {
      const res = await fetch(`/api/tenants/${params.tenantId}`)
      if (res.ok) {
        const data = await res.json()
        setUserRole(data.userRole)
      }
    } catch (err) {
      console.error('Error fetching role:', err)
    }
  }

  const fetchForms = async () => {
    try {
      const response = await fetch(`/api/sites/${params.siteId}/forms`)
      if (response.ok) {
        const data = await response.json()
        setForms(data.forms)
      }
    } catch (error) {
      console.error('Error fetching forms:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateForm = async (e) => {
    e.preventDefault()
    setCreating(true)

    try {
      const response = await fetch(`/api/sites/${params.siteId}/forms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          description: formDescription
        })
      })

      if (response.ok) {
        const data = await response.json()
        router.push(`/${params.tenantId}/sites/${params.siteId}/forms/${data.form.id}`)
      }
    } catch (error) {
      console.error('Error creating form:', error)
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteForm = async (formId) => {
    if (!confirm('Are you sure you want to delete this form?')) return

    try {
      const response = await fetch(`/api/sites/${params.siteId}/forms/${formId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setForms(forms.filter(f => f.id !== formId))
      }
    } catch (error) {
      console.error('Error deleting form:', error)
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
                  FORMS DIRECTORY
                </p>
                <h1 className="text-4xl sm:text-5xl font-black text-[#1d2321] uppercase tracking-tighter leading-[1] truncate max-w-md">
                  Forms
                </h1>
                <p className="text-xs font-bold uppercase tracking-widest text-[#8bc4b1] mt-2 truncate">
                  Create and manage your forms
                </p>
              </div>
            </div>

            {canCreate && (
              <div className="flex items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full sm:w-auto bg-[#d3ff4a] text-[#0b1411] h-14 px-8 rounded-full font-bold flex items-center justify-center hover:bg-[#c0eb3f] transition-all active:scale-95 shadow-[0_0_20px_rgba(211,255,74,0.3)] hover:scale-105 duration-200 uppercase tracking-widest text-xs shrink-0"
                >
                  <Plus size={16} className="mr-2" />
                  Create Form
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-12">
        {/* Create Form Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[2rem] shadow-2xl border border-gray-100 w-full max-w-md mx-4 overflow-hidden transform transition-all">
              <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-[#fcfdfc]">
                <h2 className="text-xl font-black text-[#1d2321] tracking-tighter uppercase">Create New Form</h2>
                <button
                  onClick={() => {
                    setShowCreateForm(false)
                    setFormName('')
                    setFormDescription('')
                  }}
                  className="p-2 text-gray-400 hover:text-[#0b1411] hover:bg-[#f2f4f2] rounded-2xl transition-all shadow-sm hover:shadow"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateForm} className="px-8 py-8 space-y-6">
                <div>
                  <label className="block text-xs font-black tracking-[0.15em] uppercase text-gray-400 mb-3">
                    Form Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                    className="w-full px-5 py-4 bg-[#f2f4f2] border-none rounded-2xl text-[1rem] font-bold text-[#0b1411] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0b1411]/20 transition-all shadow-inner"
                    placeholder="e.g. Contact Form"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black tracking-[0.15em] uppercase text-gray-400 mb-3">
                    Description (optional)
                  </label>
                  <textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full px-5 py-4 bg-[#f2f4f2] border-none rounded-2xl text-[1rem] font-bold text-[#0b1411] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0b1411]/20 transition-all shadow-inner resize-none h-32"
                    placeholder="Brief description about this form..."
                  />
                </div>

                <div className="flex items-center justify-end gap-4 pt-6 mt-8 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false)
                      setFormName('')
                      setFormDescription('')
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
                      'Create Form'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Forms List */}
        {forms.length === 0 ? (
          <div className="col-span-full text-center py-24 bg-white rounded-[2.5rem] border border-dashed border-gray-300 flex flex-col items-center">
            <div className="h-20 w-20 bg-[#f2f4f2] text-[#0b1411] border border-gray-100 rounded-[2rem] flex items-center justify-center mb-6">
              <FileText size={32} />
            </div>
            <h3 className="text-2xl font-black text-[#1d2321] uppercase tracking-tighter mb-3">No forms yet</h3>
            <p className="text-sm font-medium text-gray-500 max-w-sm mb-8 leading-relaxed">
              {canCreate ? 'Get started by creating your first form to collect submissions.' : 'No forms have been created yet.'}
            </p>
            {canCreate && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center justify-center px-8 h-14 bg-[#0b1411] text-[#d3ff4a] text-xs font-black uppercase tracking-widest rounded-full hover:bg-[#1d2321] transition-all shadow-lg hover:scale-105 active:scale-95"
              >
                <Plus size={14} className="mr-2" />
                Create your first form
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {forms.map((form) => (
              <div key={form.id} className="group bg-white border border-gray-100 rounded-[2rem] overflow-hidden hover:border-[#8bc4b1] hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] transition-all duration-300 flex flex-col h-auto min-h-[280px]">

                {/* Info Area */}
                <div className="p-6 lg:p-8 flex-1 flex flex-col relative bg-white">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[1.2rem] font-black text-[#1d2321] tracking-tight uppercase truncate transition-colors mb-2">
                        {form.name}
                      </h3>
                      {form.description && (
                        <p className="text-xs font-bold text-gray-400 line-clamp-2 leading-relaxed">
                          {form.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-6">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#0b1411] bg-[#f2f4f2] rounded-full px-3 py-1.5 shadow-sm">
                      <Calendar size={12} />
                      {new Date(form.createdAt).toLocaleDateString()}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-500 bg-[#f2f4f2] rounded-full px-3 py-1.5">
                      <Layers size={12} />
                      {form._count?.versions || 0} Versions
                    </span>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="px-6 py-4 bg-[#fcfdfc] border-t border-gray-100 flex items-center justify-between gap-2 z-20">
                  <button
                    onClick={() => router.push(`/${params.tenantId}/sites/${params.siteId}/forms/${form.id}${canEdit ? '/builder' : ''}`)}
                    className="flex-1 inline-flex items-center justify-center gap-2 h-10 px-4 bg-[#f2f4f2] text-[#0b1411] text-xs font-black uppercase tracking-widest rounded-full hover:bg-[#0b1411] hover:text-[#d3ff4a] transition-all focus:outline-none focus:ring-2 focus:ring-[#0b1411]/20 group"
                  >
                    <Edit size={12} className="text-[#0b1411] group-hover:text-[#d3ff4a]" />
                    {canEdit ? 'Builder' : 'View'}
                  </button>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => router.push(`/${params.tenantId}/sites/${params.siteId}/forms/${form.id}/submissions`)}
                      className="px-4 h-10 flex items-center justify-center text-[10px] gap-1.5 font-black uppercase tracking-widest text-[#0b1411] bg-[#d3ff4a] hover:bg-[#c0eb3f] transition-all rounded-full shadow-sm hover:scale-105"
                      title="View Submissions"
                    >
                      <List size={12} />
                      Data
                    </button>
                    {canDelete && (
                      <button
                        onClick={() => handleDeleteForm(form.id)}
                        className="h-10 w-10 flex items-center justify-center text-red-400 bg-red-50 rounded-full hover:bg-red-500 hover:text-white transition-colors shadow-sm"
                        title="Delete Form"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
