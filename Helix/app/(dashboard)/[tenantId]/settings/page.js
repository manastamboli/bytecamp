'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import {
  ArrowLeft,
  Save,
  Loader2,
  Upload,
  X,
  ImageIcon,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Briefcase,
  Type,
  User,
  Mail,
  Building2,
  UserCog,
  Rocket,
} from 'lucide-react';
import { toast } from 'sonner';

export default function TenantSettingsPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, isPending } = useSession();

  const [tenant, setTenant] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [deletingLogo, setDeletingLogo] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    workspaceType: '',
    defaultMemberRole: 'EDITOR',
  });

  const isOnboarding = tenant && !tenant.onboardingComplete;

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isPending && !session) {
      router.push('/auth/signin');
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session && params.tenantId) {
      fetchTenantData();
    }
  }, [session, params.tenantId]);

  const fetchTenantData = async () => {
    try {
      const response = await fetch(`/api/tenants/${params.tenantId}`);
      if (response.ok) {
        const data = await response.json();
        setTenant(data.tenant);
        setUserRole(data.userRole);
        setFormData({
          name: data.tenant.name || '',
          slug: data.tenant.slug || '',
          description: data.tenant.description || '',
          workspaceType: data.tenant.workspaceType || '',
          defaultMemberRole: data.tenant.defaultMemberRole || 'EDITOR',
        });
        // Use presigned URL if available
        if (data.tenant.logoUrl) {
          setLogoPreview(data.tenant.logoUrl);
        }
      } else {
        setError('Failed to load workspace settings');
      }
    } catch (err) {
      console.error('Error fetching tenant:', err);
      setError('Failed to load workspace settings');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please select a valid image file (JPEG, PNG, GIF, WebP, or SVG)');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('Image must be less than 5MB');
      return;
    }

    setError('');
    setLogoFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload immediately
    await uploadLogo(file);
  };

  const uploadLogo = async (file) => {
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload/tenant-logo', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload logo');
      }

      // Update tenant with new logo S3 key
      const updateResponse = await fetch(`/api/tenants/${params.tenantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logo: data.s3Key }),
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update tenant logo');
      }

      const updateData = await updateResponse.json();
      setTenant(updateData.tenant);
      
      // Use presigned URL for display
      if (updateData.tenant.logoUrl) {
        setLogoPreview(updateData.tenant.logoUrl);
      }

      toast.success('Logo uploaded successfully!');
    } catch (err) {
      setError(err.message);
      setLogoFile(null);
      setLogoPreview(tenant?.logoUrl || '');
      toast.error(err.message);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!confirm('Remove workspace logo? This action cannot be undone.')) return;

    setDeletingLogo(true);
    try {
      const response = await fetch(`/api/tenants/${params.tenantId}/logo`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove logo');
      }

      const data = await response.json();
      setTenant(data.tenant);
      setLogoFile(null);
      setLogoPreview('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      toast.success('Logo removed successfully!');
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setDeletingLogo(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate mandatory onboarding fields
    if (!formData.name.trim()) {
      setError('Workspace name is required.');
      return;
    }
    if (!formData.workspaceType) {
      setError('Please select a workspace type.');
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`/api/tenants/${params.tenantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          workspaceType: formData.workspaceType,
          defaultMemberRole: formData.defaultMemberRole,
          onboardingComplete: true,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update workspace');
      }

      const data = await response.json();
      setTenant(data.tenant);

      if (isOnboarding) {
        toast.success('Workspace setup complete!');
        router.push(`/${params.tenantId}`);
        return;
      }

      setSuccess('Workspace settings updated successfully!');
      toast.success('Settings saved!');
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (isPending || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfdfc]">
        <div className="animate-spin rounded-full h-10 w-10 border-[4px] border-gray-100 border-t-[#0b1411]" />
      </div>
    );
  }

  if (!tenant || userRole !== 'OWNER') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfdfc]">
        <div className="text-center max-w-sm px-6">
          <div className="bg-red-50 text-red-500 p-5 rounded-[2rem] inline-flex mb-8 shadow-sm">
            <AlertCircle className="h-10 w-10" />
          </div>
          <h2 className="text-3xl font-black text-[#1d2321] uppercase tracking-tighter mb-3">
            Access Denied
          </h2>
          <p className="text-sm font-medium text-gray-500 mb-10 leading-relaxed">
            Only workspace owners can access settings.
          </p>
          <button
            onClick={() => router.push(`/${params.tenantId}`)}
            className="w-full py-4 px-6 bg-[#0b1411] text-[#d3ff4a] rounded-full hover:bg-[#1d2321] transition-all font-black uppercase tracking-widest text-xs inline-flex justify-center items-center shadow-lg"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Workspace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfdfc] font-sans text-gray-900 pb-20">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 sm:px-10 py-6">
          <div className="flex items-center gap-6">
            {!isOnboarding && (
              <button
                onClick={() => router.push(`/${params.tenantId}`)}
                className="p-3 bg-white border border-gray-200 text-gray-400 hover:text-[#0b1411] hover:border-[#0b1411]/20 rounded-2xl transition-all shadow-sm hover:shadow-md"
                title="Back to Workspace"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
            )}
            <div>
              <p className="text-[#8bc4b1] text-[10px] font-bold tracking-[0.2em] uppercase mb-1">
                {isOnboarding ? 'WORKSPACE SETUP' : 'WORKSPACE SETTINGS'}
              </p>
              <h1 className="text-3xl sm:text-4xl font-black text-[#1d2321] uppercase tracking-tighter">
                {isOnboarding ? 'Complete Your Setup' : tenant.name}
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 sm:px-10 py-12">
        <form onSubmit={handleSubmit} className="space-y-12">
          {/* Status Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl flex items-start gap-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-6 py-4 rounded-2xl flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{success}</p>
            </div>
          )}

          {/* Onboarding Banner */}
          {isOnboarding && (
            <div className="bg-gradient-to-r from-[#0b1411] to-[#1d2321] text-white px-8 py-6 rounded-[2rem] shadow-lg">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 bg-[#d3ff4a] text-[#0b1411] rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Rocket className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black uppercase tracking-tight mb-1">Welcome to Your New Workspace!</h2>
                  <p className="text-sm text-gray-300 font-medium leading-relaxed">
                    Let's get your workspace set up. Fill in the required details below to start building your sites.
                    Fields marked with <span className="text-[#d3ff4a] font-bold">*</span> are mandatory.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Logo Section */}
          <div className="bg-white border border-gray-100 rounded-[2rem] shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100 bg-gray-50">
              <h2 className="text-sm font-black text-gray-900 tracking-[0.15em] uppercase">
                Workspace Logo
              </h2>
              <p className="text-xs text-gray-500 mt-1 font-medium">
                Update your workspace branding
              </p>
            </div>

            <div className="p-8">
              {!logoPreview ? (
                <div className="relative">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoSelect}
                    className="hidden"
                    id="logo-upload"
                    disabled={uploadingLogo}
                  />
                  <label
                    htmlFor="logo-upload"
                    className="flex flex-col items-center justify-center w-full p-12 border-2 border-gray-300 border-dashed rounded-2xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    {uploadingLogo ? (
                      <>
                        <Loader2 className="h-12 w-12 text-gray-400 animate-spin mb-4" />
                        <p className="text-sm text-gray-500 font-medium">Uploading...</p>
                      </>
                    ) : (
                      <>
                        <Upload className="h-12 w-12 text-gray-400 mb-4" />
                        <p className="mb-2 text-base text-gray-600 font-bold">
                          Click to upload logo
                        </p>
                        <p className="text-sm text-gray-500">
                          PNG, JPG, GIF, WebP or SVG (Max 5MB)
                        </p>
                      </>
                    )}
                  </label>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-start gap-6">
                  <div className="flex-shrink-0 w-32 h-32 rounded-2xl overflow-hidden bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                    <img
                      src={logoPreview}
                      alt="Workspace logo"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-black text-gray-900 mb-2">
                      Current Logo
                    </h3>
                    <p className="text-sm text-gray-500 mb-4 font-medium">
                      This logo appears in your workspace dashboard and navigation.
                    </p>
                    <div className="flex gap-3">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoSelect}
                        className="hidden"
                        id="logo-upload-replace"
                        disabled={uploadingLogo || deletingLogo}
                      />
                      <label
                        htmlFor="logo-upload-replace"
                        className="inline-flex items-center px-5 py-2.5 bg-[#0b1411] text-[#d3ff4a] text-xs font-black uppercase tracking-widest rounded-full hover:bg-[#1d2321] transition-all cursor-pointer disabled:opacity-50"
                      >
                        {uploadingLogo ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Replace
                          </>
                        )}
                      </label>
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        disabled={deletingLogo || uploadingLogo}
                        className="inline-flex items-center px-5 py-2.5 bg-red-50 text-red-600 text-xs font-black uppercase tracking-widest rounded-full hover:bg-red-100 transition-all disabled:opacity-50"
                      >
                        {deletingLogo ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Removing...
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Basic Information */}
          <div className="bg-white border border-gray-100 rounded-[2rem] shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100 bg-gray-50">
              <h2 className="text-sm font-black text-gray-900 tracking-[0.15em] uppercase">
                Basic Information
              </h2>
              <p className="text-xs text-gray-500 mt-1 font-medium">
                Update your workspace details
              </p>
            </div>

            <div className="p-8 space-y-6">
              {/* Workspace Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-black uppercase tracking-widest text-gray-900 mb-3"
                >
                  Workspace Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Briefcase className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="block w-full pl-12 pr-4 py-3.5 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0b1411]/10 focus:border-[#0b1411] transition-colors font-medium"
                    placeholder="e.g. Acme Inc."
                  />
                </div>
              </div>

              {/* Workspace URL (Read-only) */}
              <div>
                <label
                  htmlFor="slug"
                  className="block text-sm font-black uppercase tracking-widest text-gray-900 mb-3"
                >
                  Workspace URL
                </label>
                <div className="flex rounded-xl shadow-sm border border-gray-300 overflow-hidden bg-gray-50">
                  <span className="inline-flex items-center px-4 bg-gray-100 border-r border-gray-300 text-gray-500 text-sm select-none font-medium">
                    sitepilot.com/
                  </span>
                  <input
                    type="text"
                    id="slug"
                    value={formData.slug}
                    disabled
                    className="flex-1 block w-full px-4 py-3.5 bg-gray-50 text-gray-500 cursor-not-allowed focus:outline-none font-medium"
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500 font-medium">
                  Workspace URLs cannot be changed after creation
                </p>
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-black uppercase tracking-widest text-gray-900 mb-3"
                >
                  Description <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute top-3.5 left-4 flex items-start pointer-events-none">
                    <Type className="h-5 w-5 text-gray-400" />
                  </div>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of your workspace"
                    rows={4}
                    className="block w-full pl-12 pr-4 py-3.5 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0b1411]/10 focus:border-[#0b1411] transition-colors resize-y font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Workspace Type */}
          <div className="bg-white border border-gray-100 rounded-[2rem] shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100 bg-gray-50">
              <h2 className="text-sm font-black text-gray-900 tracking-[0.15em] uppercase">
                Workspace Type <span className="text-red-500">*</span>
              </h2>
              <p className="text-xs text-gray-500 mt-1 font-medium">
                What kind of workspace is this?
              </p>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { value: 'AGENCY', label: 'Agency', desc: 'Managing multiple client websites', icon: '🏢' },
                  { value: 'BUSINESS', label: 'Business', desc: 'Company or corporate website', icon: '💼' },
                  { value: 'PERSONAL', label: 'Personal', desc: 'Portfolio or personal brand', icon: '👤' },
                  { value: 'STARTUP', label: 'Startup', desc: 'Early-stage product or service', icon: '🚀' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, workspaceType: option.value })}
                    className={`p-5 rounded-2xl border-2 text-left transition-all duration-200 ${
                      formData.workspaceType === option.value
                        ? 'border-[#0b1411] bg-[#0b1411]/5 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{option.icon}</span>
                      <span className={`text-sm font-black uppercase tracking-widest ${
                        formData.workspaceType === option.value ? 'text-[#0b1411]' : 'text-gray-700'
                      }`}>
                        {option.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 font-medium pl-10">{option.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Default Member Role */}
          <div className="bg-white border border-gray-100 rounded-[2rem] shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100 bg-gray-50">
              <h2 className="text-sm font-black text-gray-900 tracking-[0.15em] uppercase">
                Default Role for Invited Members
              </h2>
              <p className="text-xs text-gray-500 mt-1 font-medium">
                New members will get this role by default when invited
              </p>
            </div>

            <div className="p-8">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <UserCog className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  value={formData.defaultMemberRole}
                  onChange={(e) => setFormData({ ...formData, defaultMemberRole: e.target.value })}
                  className="block w-full pl-12 pr-4 py-3.5 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0b1411]/10 focus:border-[#0b1411] transition-colors font-medium appearance-none"
                >
                  <option value="EDITOR">Editor — Can create and edit sites</option>
                  <option value="VIEWER">Viewer — Read-only access</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-gray-700">Editor</p>
                    <p className="text-[11px] text-gray-500">Can create, edit, and publish sites. Cannot manage members or billing.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-2 h-2 rounded-full bg-gray-400 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-gray-700">Viewer</p>
                    <p className="text-[11px] text-gray-500">Can view sites and pages. Cannot make any changes.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Workspace Owner Info (Read-only) */}
          <div className="bg-white border border-gray-100 rounded-[2rem] shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100 bg-gray-50">
              <h2 className="text-sm font-black text-gray-900 tracking-[0.15em] uppercase">
                Workspace Owner
              </h2>
              <p className="text-xs text-gray-500 mt-1 font-medium">
                Owner information
              </p>
            </div>

            <div className="p-8 space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-[#0b1411] text-[#d3ff4a] rounded-xl flex items-center justify-center font-black text-lg">
                  {tenant.owner?.name ? tenant.owner.name.substring(0, 2).toUpperCase() : 'U'}
                </div>
                <div>
                  <p className="text-base font-black text-gray-900">
                    {tenant.owner?.name || 'Unknown'}
                  </p>
                  <p className="text-sm text-gray-500 font-medium">
                    {tenant.owner?.email || 'No email available'}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500 font-medium">
                Created on {new Date(tenant.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
            {!isOnboarding && (
              <button
                type="button"
                onClick={() => router.push(`/${params.tenantId}`)}
                className="px-8 py-3.5 bg-white border-2 border-gray-300 text-gray-700 text-sm font-black uppercase tracking-widest rounded-full hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={saving || uploadingLogo}
              className="inline-flex items-center px-8 py-3.5 bg-[#0b1411] text-[#d3ff4a] text-sm font-black uppercase tracking-widest rounded-full hover:bg-[#1d2321] transition-all disabled:opacity-50 shadow-lg hover:scale-105 active:scale-95"
            >
              {saving ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  {isOnboarding ? 'Setting Up...' : 'Saving...'}
                </>
              ) : (
                <>
                  {isOnboarding ? (
                    <>
                      <Rocket className="h-5 w-5 mr-2" />
                      Complete Setup & Continue
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5 mr-2" />
                      Save Settings
                    </>
                  )}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
