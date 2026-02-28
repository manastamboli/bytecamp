'use client'
// Force recompile to inject imports
import { useState, useRef, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft,
  Image as ImageIcon,
  Upload,
  Search,
  FolderOpen,
  X,
  Trash2
} from 'lucide-react'

export default function MediaLibraryPage() {
  const router = useRouter()
  const params = useParams()
  
  // Empty state for pure UI scaffolding
  const [images, setImages] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [previewImage, setPreviewImage] = useState(null)
  const [loading, setLoading] = useState(true)
  const fileInputRef = useRef(null)

  // Fetch media from API
  useEffect(() => {
    fetchMedia()
  }, [params.tenantId])

  async function fetchMedia() {
    try {
      setLoading(true)
      const res = await fetch(`/api/tenants/${params.tenantId}/media`)
      if (!res.ok) throw new Error('Failed to fetch media')
      
      const data = await res.json()
      if (data.success && data.media) {
        setImages(data.media.map(m => ({
          id: m.id,
          url: m.url,
          name: m.name,
          date: new Date(m.createdAt).toLocaleDateString()
        })))
      }
    } catch (error) {
      console.error('Error fetching media:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(`/api/tenants/${params.tenantId}/media`, {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      
      if (data.success) {
        // Refresh media list
        await fetchMedia()
        alert('File uploaded successfully!')
      } else {
        alert(data.error || 'Upload failed')
      }
    } catch (err) {
      alert('Error uploading file: ' + err.message)
    } finally {
      setIsUploading(false)
      // reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const triggerUpload = () => fileInputRef.current?.click()

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this media asset?')) {
      try {
        const res = await fetch(`/api/tenants/${params.tenantId}/media/${id}`, {
          method: 'DELETE',
        })

        if (!res.ok) {
          throw new Error('Failed to delete media')
        }

        // Refresh media list
        await fetchMedia()
      } catch (error) {
        console.error('Error deleting media:', error)
        alert('Failed to delete media')
      }
    }
  }

  const filteredImages = images.filter(img => 
    img.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-[#fcfdfc] font-sans text-gray-900 text-base pb-20 relative">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="flex items-start sm:items-center gap-6">
              <button
                onClick={() => router.push(`/${params.tenantId}`)}
                className="mt-1 sm:mt-0 p-3 bg-white border border-gray-200 text-gray-400 hover:text-[#0b1411] hover:border-[#0b1411]/20 rounded-2xl transition-all shadow-sm hover:shadow-md focus:outline-none"
                title="Back to Overview"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div>
                <p className="text-[#8bc4b1] text-[10px] font-bold tracking-[0.2em] uppercase mb-1">
                  WORKSPACE DIRECTORY
                </p>
                <h1 className="text-3xl sm:text-4xl font-black text-[#1d2321] uppercase tracking-tighter leading-tight">
                  Media Library
                </h1>
                <span className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1 block">Manage your uploaded assets</span>
              </div>
            </div>
            
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileUpload}
              accept="image/*"
            />
            <button 
              onClick={triggerUpload}
              disabled={isUploading}
              className="w-full sm:w-auto bg-[#d3ff4a] text-[#0b1411] h-14 px-8 rounded-full font-bold flex items-center justify-center hover:bg-[#c0eb3f] transition-all active:scale-95 shadow-[0_0_20px_rgba(211,255,74,0.3)] hover:scale-105 duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <span className="flex items-center gap-2">Uploading...</span>
              ) : (
                <>
                  <Upload className="h-5 w-5 mr-2" />
                  Upload Image
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-12 space-y-10">

        {/* Search & Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search images..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 block w-full px-5 py-4 bg-white border border-gray-100 rounded-[1.5rem] text-[#0b1411] font-bold placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0b1411]/20 transition-all text-sm shadow-sm hover:border-[#8bc4b1]"
            />
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest hidden sm:flex">
             {filteredImages.length} {filteredImages.length === 1 ? 'Asset' : 'Assets'} Found
          </div>
        </div>

        {/* Media Grid / Empty State */}
        {loading ? (
          <div className="py-32 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-100 border-t-[#0b1411] mx-auto mb-4" />
            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Loading media...</p>
          </div>
        ) : filteredImages.length === 0 ? (
          <div className="py-32 text-center border border-gray-200 rounded-[2.5rem] bg-[#fcfdfc] border-dashed px-6 flex flex-col items-center">
             <div className="h-24 w-24 rounded-[2.5rem] bg-gray-50 border border-gray-100 flex items-center justify-center mb-8 shadow-inner">
               <FolderOpen size={40} className="text-gray-300" />
             </div>
             <h3 className="text-2xl font-black text-[#0b1411] tracking-tight mb-3">
               {searchQuery ? 'No Results Found' : 'No Media Uploaded'}
             </h3>
             <p className="text-base font-medium text-gray-500 max-w-sm mb-10 leading-relaxed">
               {searchQuery ? 'Try adjusting your search query.' : 'Drop images here to start building out your media library. Uploaded assets will be reusable across all your websites.'}
             </p>
             {!searchQuery && (
               <>
                 <button 
                  onClick={triggerUpload}
                  className="h-14 px-8 bg-[#0b1411] text-[#d3ff4a] font-bold rounded-full flex items-center justify-center hover:bg-[#1d2321] transition-all hover:scale-105 active:scale-95 shadow-lg"
                 >
                   <Upload size={20} className="mr-2" />
                   Select Files
                 </button>
                 <p className="mt-4 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                    Supported formats: PNG, JPG, JPEG, WEBP, SVG
                 </p>
               </>
             )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredImages.map((img) => (
              <div 
                key={img.id} 
                className="group relative bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                onClick={() => setPreviewImage(img)}
              >
                 <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
                    <img src={img.url} alt={img.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                 </div>
                 <div className="p-4 bg-white border-t border-gray-50">
                    <h4 className="text-xs font-bold text-gray-900 truncate" title={img.name}>{img.name}</h4>
                    <p className="text-[10px] font-medium text-gray-400 mt-0.5">{img.date}</p>
                 </div>
                 
                 <div className="absolute top-3 right-3">
                    <button
                      onClick={(e) => handleDelete(img.id, e)}
                      className="p-2 bg-white/90 backdrop-blur-sm text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl shadow-sm transition-all focus:outline-none"
                      title="Delete Image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                 </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Full Screen Image Modal */}
      {previewImage && (
        <div 
           className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0b1411]/90 backdrop-blur-sm p-4 sm:p-8"
           onClick={() => setPreviewImage(null)}
        >
          <div className="relative w-full max-w-5xl max-h-full bg-transparent flex flex-col items-center justify-center">
            <button 
              onClick={() => setPreviewImage(null)}
              className="absolute -top-12 right-0 text-white/60 hover:text-white p-2 transition-colors focus:outline-none"
            >
              <X className="w-8 h-8" />
            </button>
            <img 
              src={previewImage.url} 
              alt={previewImage.name} 
              className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="mt-6 text-white text-sm font-bold uppercase tracking-widest text-center">
              {previewImage.name}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
