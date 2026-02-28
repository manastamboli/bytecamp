'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from '@/lib/auth-client'
import {
  Users,
  Plus,
  Mail,
  ShieldAlert,
  ShieldCheck,
  UserX,
  Clock,
  Loader2,
  ArrowLeft
} from 'lucide-react'
import { hasPermission, ROLE_LABELS, ROLE_COLORS } from '@/lib/permissions'

export default function MembersPage() {
  const router = useRouter()
  const params = useParams()
  const { data: session, isPending } = useSession()
  const [tenant, setTenant] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [isTrueOwner, setIsTrueOwner] = useState(false)
  const [members, setMembers] = useState([])
  const [invitations, setInvitations] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddMember, setShowAddMember] = useState(false)
  const [memberEmail, setMemberEmail] = useState('')
  const [memberRole, setMemberRole] = useState('EDITOR')
  const [addMemberLoading, setAddMemberLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [copiedId, setCopiedId] = useState(null)

  const [fetchedTenantId, setFetchedTenantId] = useState(null)

  useEffect(() => {
    if (!isPending && !session) {
      router.push('/auth/signin')
    }
  }, [session, isPending, router])

  useEffect(() => {
    if (session && params.tenantId && fetchedTenantId !== params.tenantId) {
      fetchTenantData()
      fetchMembers()
      fetchInvitations()
      setFetchedTenantId(params.tenantId)
    }
  }, [session, params.tenantId, fetchedTenantId])

  const fetchTenantData = async () => {
    try {
      const response = await fetch(`/api/tenants/${params.tenantId}`)
      if (response.ok) {
        const data = await response.json()
        setTenant(data.tenant)
        setUserRole(data.userRole)
        setIsTrueOwner(data.isTrueOwner)
      }
    } catch (err) {
      console.error('Error fetching tenant:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchMembers = async () => {
    try {
      const response = await fetch(`/api/tenants/${params.tenantId}/members`)
      if (response.ok) {
        const data = await response.json()
        setMembers(data.members)
      }
    } catch (err) {
      console.error('Error fetching members:', err)
    }
  }

  const fetchInvitations = async () => {
    try {
      const response = await fetch(`/api/tenants/${params.tenantId}/invitations`)
      if (response.ok) {
        const data = await response.json()
        setInvitations(data.invitations)
      }
    } catch (err) {
      console.error('Error fetching invitations:', err)
    }
  }

  const handleAddMember = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')
    setAddMemberLoading(true)

    try {
      const response = await fetch(`/api/tenants/${params.tenantId}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: memberEmail, role: memberRole })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitation')
      }

      if (data.invitationUrl) {
        setSuccessMessage(`Invitation created! Share this link: ${data.invitationUrl}`)
      } else {
        setSuccessMessage('Invitation sent successfully!')
      }

      setMemberEmail('')
      setMemberRole('EDITOR')
      setShowAddMember(false)
      fetchInvitations()
    } catch (err) {
      setError(err.message)
    } finally {
      setAddMemberLoading(false)
    }
  }

  const handleRemoveMember = async (userId) => {
    if (!confirm('Are you sure you want to remove this member?')) return

    try {
      const response = await fetch(
        `/api/tenants/${params.tenantId}/members?userId=${userId}`,
        { method: 'DELETE' }
      )

      if (response.ok) {
        setMembers(members.filter(m => m.userId !== userId))
      }
    } catch (err) {
      console.error('Error removing member:', err)
    }
  }

  const copyInvitationLink = async (token) => {
    const invitationUrl = `${window.location.origin}/invitations/${token}`
    try {
      await navigator.clipboard.writeText(invitationUrl)
      setCopiedId(token)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  if (isPending || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfdfc]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-[4px] border-gray-100 border-t-[#0b1411] mb-4" />
        </div>
      </div>
    )
  }

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
                  Members
                </h1>
                <span className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1 block">Manage access and roles</span>
              </div>
            </div>

            {isTrueOwner && !showAddMember && (
              <button
                onClick={() => setShowAddMember(true)}
                className="w-full sm:w-auto bg-[#d3ff4a] text-[#0b1411] h-14 px-8 rounded-full font-bold flex items-center justify-center hover:bg-[#c0eb3f] transition-all active:scale-95 shadow-[0_0_20px_rgba(211,255,74,0.3)] hover:scale-105 duration-200"
              >
                <Plus className="h-5 w-5 mr-2" />
                Invite Member
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-12 space-y-16">

        {/* Team Settings Container */}
        <div>
          <div className="bg-white border border-gray-100 rounded-[2rem] shadow-sm overflow-hidden relative">
            {/* Success Message */}
            {successMessage && (
              <div className="px-8 py-6 bg-emerald-50 border-b border-emerald-100 flex items-start">
                <ShieldCheck className="h-5 w-5 text-emerald-600 mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-sm font-bold text-emerald-800">{successMessage}</p>
              </div>
            )}

            {/* Add Member Form */}
            {showAddMember && (
              <div className="p-8 bg-[#fcfdfc] border-b border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#0b1411]">Invite new team member</h3>
                  <button
                    onClick={() => {
                      setShowAddMember(false)
                      setError('')
                      setMemberEmail('')
                      setSuccessMessage('')
                    }}
                    className="text-xs text-gray-400 font-bold uppercase tracking-widest hover:text-[#0b1411] transition-colors"
                  >
                    Cancel
                  </button>
                </div>

                <form onSubmit={handleAddMember} className="space-y-4">
                  {error && (
                    <div className="bg-red-50 border border-red-100 text-red-600 px-5 py-4 rounded-2xl flex items-start text-sm">
                      <ShieldAlert className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0" />
                      <p className="font-bold">{error}</p>
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        placeholder="member@example.com"
                        value={memberEmail}
                        onChange={(e) => setMemberEmail(e.target.value)}
                        required
                        className="pl-12 block w-full px-5 py-3.5 bg-[#f2f4f2] border-none rounded-2xl text-[#0b1411] font-bold placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0b1411]/20 transition-all text-sm shadow-inner"
                      />
                    </div>
                    <div className="sm:w-48 relative">
                      <select
                        value={memberRole}
                        onChange={(e) => setMemberRole(e.target.value)}
                        className="block w-full px-5 py-3.5 bg-[#f2f4f2] border-none rounded-2xl text-[#0b1411] font-bold focus:outline-none focus:ring-2 focus:ring-[#0b1411]/20 transition-all text-sm appearance-none cursor-pointer shadow-inner"
                      >
                        <option value="EDITOR">Editor</option>
                        <option value="VIEWER">Viewer</option>
                        <option value="OWNER">Owner</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      disabled={addMemberLoading}
                      className="inline-flex items-center justify-center px-8 py-3.5 text-xs font-black uppercase tracking-widest text-[#0b1411] bg-[#d3ff4a] rounded-full hover:bg-[#c0eb3f] hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(211,255,74,0.3)] transition-all min-w-[140px]"
                    >
                      {addMemberLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Invite'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Members List */}
            <ul className="divide-y divide-gray-100">
              {members.map((member) => (
                <li key={member.id} className="p-6 lg:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-5">
                    <div className="h-12 w-12 rounded-2xl border border-gray-100 bg-[#f2f4f2] text-[#0b1411] flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
                      {member.user.image ? (
                        <img
                          src={member.user.image}
                          alt={member.user.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="font-black text-lg">
                          {(member.user.name || member.user.email).charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#1d2321]">
                        {member.user.name || 'Unknown User'}
                        {member.userId === session?.user?.id && (
                          <span className="ml-2 text-[10px] font-black uppercase tracking-widest text-[#8bc4b1]">(You)</span>
                        )}
                      </p>
                      <p className="text-xs font-medium text-gray-500 mt-0.5">{member.user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 justify-between sm:justify-end">
                    <span className="inline-flex items-center px-3 py-1.5 bg-[#f2f4f2] text-gray-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-gray-100">
                      {ROLE_LABELS[member.role] || member.role}
                    </span>

                    {isTrueOwner && member.userId !== session?.user?.id && (
                      <button
                        onClick={() => handleRemoveMember(member.userId)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                        title="Remove member"
                      >
                        <UserX className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Pending Invitations Section */}
        {isTrueOwner && invitations.length > 0 && (
          <div>
            <h2 className="text-sm font-black text-gray-400 tracking-[0.15em] uppercase mb-6 mt-16">Pending Invitations</h2>
            <div className="bg-white border border-gray-100 rounded-[2rem] shadow-sm overflow-hidden relative">
              <ul className="divide-y divide-gray-100">
                {invitations.map((invitation) => (
                  <li key={invitation.id} className="p-6 lg:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-[#1d2321]">{invitation.email}</p>
                        <div className="mt-1.5 flex items-center text-xs font-black uppercase tracking-widest text-[#8bc4b1] space-x-2">
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            Invited {new Date(invitation.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 self-start sm:self-center">
                      <span className="inline-flex items-center px-3 py-1.5 bg-[#f2f4f2] text-gray-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-gray-100">
                        {invitation.role.toLowerCase()} • Pending
                      </span>
                      <button
                        onClick={() => copyInvitationLink(invitation.token)}
                        className="px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-[#0b1411] bg-[#d3ff4a] rounded-full hover:bg-[#c0eb3f] transition-colors shadow-sm focus:outline-none"
                        title="Copy invitation link"
                      >
                        {copiedId === invitation.token ? 'Copied' : 'Copy URL'}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
