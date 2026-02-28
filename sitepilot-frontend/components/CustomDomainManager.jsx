"use client";

import { useState, useEffect } from "react";
import {
  Globe,
  Plus,
  X,
  Check,
  Loader2,
  AlertCircle,
  ExternalLink,
  Copy,
  CheckCircle2,
  Clock,
  Shield,
  Link as LinkIcon,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

// Status badge component
function StatusBadge({ status }) {
  const statusConfig = {
    PENDING: { color: "bg-gray-100 text-gray-700", label: "Pending", icon: Clock },
    VERIFYING: { color: "bg-blue-100 text-blue-700", label: "Verifying", icon: Loader2 },
    VERIFIED: { color: "bg-green-100 text-green-700", label: "Verified", icon: CheckCircle2 },
    SSL_PENDING: { color: "bg-yellow-100 text-yellow-700", label: "SSL Pending", icon: Clock },
    SSL_VALIDATING: { color: "bg-yellow-100 text-yellow-700", label: "SSL Validating", icon: Shield },
    SSL_ISSUED: { color: "bg-green-100 text-green-700", label: "SSL Issued", icon: Shield },
    ATTACHING: { color: "bg-indigo-100 text-indigo-700", label: "Attaching", icon: Loader2 },
    DNS_PENDING: { color: "bg-orange-100 text-orange-700", label: "DNS Setup", icon: LinkIcon },
    ACTIVE: { color: "bg-emerald-100 text-emerald-700", label: "Active", icon: CheckCircle2 },
    FAILED: { color: "bg-red-100 text-red-700", label: "Failed", icon: AlertCircle },
  };

  const config = statusConfig[status] || statusConfig.PENDING;
  const Icon = config.icon;
  const isAnimating = status === "VERIFYING" || status === "ATTACHING";

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${config.color}`}
    >
      <Icon size={11} className={isAnimating ? "animate-spin" : ""} />
      {config.label}
    </span>
  );
}

// Copy to clipboard helper
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-2 text-gray-400 hover:text-[#0b1411] hover:bg-gray-100 rounded-lg transition-colors"
      title="Copy to clipboard"
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
}

// DNS Instructions Panel
function DNSInstructions({ instructions, type = "TXT" }) {
  if (!instructions) return null;

  // Handle both single instruction object and array of instructions
  const recordsList = Array.isArray(instructions) ? instructions : [instructions];

  // Separate required (CNAME validation) and optional (CAA) records
  const requiredRecords = recordsList.filter(r => r.type !== "CAA");
  const caaRecords = recordsList.filter(r => r.type === "CAA");

  return (
    <div className="mt-4 p-4 bg-[#fcfdfc] border border-gray-100 rounded-2xl">
      <h4 className="text-xs font-black uppercase tracking-widest text-[#0b1411] mb-3">
        DNS Configuration Required
      </h4>

      {/* Required Records (CNAME Validation) */}
      {requiredRecords.length > 0 && (
        <div className="space-y-3 mb-4">
          <div className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-2">
            ⚠️ Required DNS Records
          </div>
          {requiredRecords.map((record, index) => (
            <div key={`required-${index}`} className="bg-white border border-gray-100 rounded-xl p-3">
              {requiredRecords.length > 1 && (
                <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                  Validation Record {index + 1} of {requiredRecords.length}
                </div>
              )}
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                  Type
                </span>
                <code className="text-xs font-mono text-[#0b1411] bg-gray-50 px-2 py-1 rounded">
                  {record.type || type}
                </code>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                  Host
                </span>
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono text-[#0b1411] bg-gray-50 px-2 py-1 rounded max-w-md truncate">
                    {record.host || record.name}
                  </code>
                  <CopyButton text={record.host || record.name} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                  Value
                </span>
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono text-[#0b1411] bg-gray-50 px-2 py-1 rounded max-w-md truncate">
                    {record.value}
                  </code>
                  <CopyButton text={record.value} />
                </div>
              </div>
              {record.message && (
                <p className="text-xs text-gray-600 mt-2 italic">{record.message}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Optional CAA Records */}
      {caaRecords.length > 0 && (
        <div className="space-y-3">
          <div className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">
            ℹ️ Recommended (CAA Records)
          </div>
          <p className="text-xs text-gray-600 leading-relaxed mb-3">
            CAA records tell DNS which certificate authorities can issue SSL certificates for your domain.
            While optional, adding these records is recommended for security.
          </p>
          {caaRecords.map((record, index) => (
            <div key={`caa-${index}`} className="bg-blue-50 border border-blue-100 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                  Type
                </span>
                <code className="text-xs font-mono text-[#0b1411] bg-white px-2 py-1 rounded">
                  {record.type}
                </code>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                  Host
                </span>
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono text-[#0b1411] bg-white px-2 py-1 rounded max-w-md truncate">
                    {record.host || record.name}
                  </code>
                  <CopyButton text={record.host || record.name} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                  Value
                </span>
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono text-[#0b1411] bg-white px-2 py-1 rounded max-w-md truncate">
                    {record.value}
                  </code>
                  <CopyButton text={record.value} />
                </div>
              </div>
              {record.message && (
                <p className="text-xs text-gray-600 mt-2 italic">{record.message}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Domain Card Component
function DomainCard({ domain, siteId, onUpdate, onDelete }) {
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [dnsInstructions, setDnsInstructions] = useState(null);

  // Auto-expand and show validation/routing records if needed
  useEffect(() => {
    if ((domain.status === "SSL_PENDING" || domain.status === "SSL_VALIDATING") && domain.certificateValidation) {
      try {
        const validationRecords = typeof domain.certificateValidation === 'string'
          ? JSON.parse(domain.certificateValidation)
          : domain.certificateValidation;

        if (validationRecords && validationRecords.length > 0) {
          // Add CAA records for AWS ACM
          const caaRecords = [
            {
              type: "CAA",
              name: "@",
              host: "@",
              value: '0 issue "amazon.com"',
              message: "Optional: Allows AWS to issue SSL certificates for your domain"
            },
            {
              type: "CAA",
              name: "@",
              host: "@",
              value: '0 issuewild "amazon.com"',
              message: "Optional: Allows AWS to issue wildcard SSL certificates"
            }
          ];

          // Combine validation records with CAA records
          const allRecords = [...validationRecords, ...caaRecords];
          setDnsInstructions(allRecords);
          setExpanded(true);
        }
      } catch (error) {
        console.error("Failed to parse certificate validation records:", error);
      }
    } else if (domain.status === "DNS_PENDING" && domain.cnameTarget) {
      setDnsInstructions([
        {
          type: "CNAME",
          name: domain.domain,
          host: domain.domain,
          value: domain.cnameTarget,
          message: "Required: Route your domain to CloudFront to serve your site. DNS propagation may take some time."
        }
      ]);
      setExpanded(true);
    }
  }, [domain.status, domain.certificateValidation, domain.cnameTarget, domain.domain]);

  const handleVerify = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sites/${siteId}/domains/${domain.id}/verify`, {
        method: "POST",
      });
      const data = await res.json();

      if (data.success && data.verified) {
        toast.success("Domain verified successfully!");
        onUpdate();
      } else {
        toast.error(data.message || "Verification failed");
        if (data.dnsInstructions) {
          setDnsInstructions(data.dnsInstructions);
          setExpanded(true);
        }
      }
    } catch (error) {
      toast.error("Verification failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSSL = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sites/${siteId}/domains/${domain.id}/ssl`, {
        method: "POST",
      });
      const data = await res.json();

      if (data.success) {
        toast.success("SSL certificate requested! Add the DNS records below to complete validation.");
        // Store ALL validation records plus CAA records
        if (data.certificate.validationRecords && data.certificate.validationRecords.length > 0) {
          // Add CAA records for AWS ACM
          const caaRecords = [
            {
              type: "CAA",
              name: "@",
              host: "@",
              value: '0 issue "amazon.com"',
              message: "Optional: Allows AWS to issue SSL certificates for your domain"
            },
            {
              type: "CAA",
              name: "@",
              host: "@",
              value: '0 issuewild "amazon.com"',
              message: "Optional: Allows AWS to issue wildcard SSL certificates"
            }
          ];

          // Combine validation records with CAA records
          const allRecords = [...data.certificate.validationRecords, ...caaRecords];
          setDnsInstructions(allRecords);
          setExpanded(true);
        }
        onUpdate();
      } else {
        toast.error(data.error || "SSL request failed");
      }
    } catch (error) {
      toast.error("SSL request failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckSSL = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sites/${siteId}/domains/${domain.id}/ssl`);
      const data = await res.json();

      if (data.success) {
        const isIssued = data.certificate.status === "ISSUED";
        if (isIssued) {
          toast.success("SSL certificate is issued!");
        } else {
          toast.info(`SSL status: ${data.certificate.status}`);
          // Show validation records if still validating
          if (data.certificate.validationRecords && data.certificate.validationRecords.length > 0) {
            // Add CAA records for AWS ACM
            const caaRecords = [
              {
                type: "CAA",
                name: "@",
                host: "@",
                value: '0 issue "amazon.com"',
                message: "Optional: Allows AWS to issue SSL certificates for your domain"
              },
              {
                type: "CAA",
                name: "@",
                host: "@",
                value: '0 issuewild "amazon.com"',
                message: "Optional: Allows AWS to issue wildcard SSL certificates"
              }
            ];

            // Combine validation records with CAA records
            const allRecords = [...data.certificate.validationRecords, ...caaRecords];
            setDnsInstructions(allRecords);
            setExpanded(true);
          }
        }
        onUpdate();
      }
    } catch (error) {
      toast.error("Failed to check SSL status");
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sites/${siteId}/domains/${domain.id}/activate`, {
        method: "POST",
      });
      const data = await res.json();

      if (data.success) {
        toast.success("Domain activation initiated!");
        if (data.dnsInstructions) {
          setDnsInstructions(data.dnsInstructions);
          setExpanded(true);
        }
        onUpdate();
      } else {
        toast.error(data.error || "Activation failed");
      }
    } catch (error) {
      toast.error("Activation failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckActivation = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sites/${siteId}/domains/${domain.id}/activate`);
      const data = await res.json();

      if (data.success && data.active) {
        toast.success("Domain is now active!");
        onUpdate();
      } else {
        toast.info(data.message || "Domain not yet active");
      }
    } catch (error) {
      toast.error("Failed to check activation status");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Remove domain ${domain.domain}?\n\nThis will:\n• Delete the SSL certificate (if issued)\n• Remove from CloudFront\n• Clear DNS routing\n\nThis action cannot be undone.`)) return;

    setLoading(true);
    toast.loading("Removing domain and cleaning up resources...", { id: "delete-domain" });

    try {
      const res = await fetch(`/api/sites/${siteId}/domains/${domain.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Domain and all associated resources removed successfully", { id: "delete-domain" });

        // Show cleanup details
        if (data.cleanup) {
          const cleaned = [];
          const skipped = [];

          if (data.cleanup.cloudfront === "removed") cleaned.push("CloudFront");
          if (data.cleanup.kvs === "removed") cleaned.push("DNS routing");
          if (data.cleanup.ssl === "deleted") cleaned.push("SSL certificate");

          // Handle skipped SSL cleanup
          if (data.cleanup.ssl && data.cleanup.ssl.startsWith("skipped:")) {
            const reason = data.cleanup.ssl.replace("skipped: ", "");
            if (reason.includes("permission")) {
              toast.warning("SSL certificate not deleted due to missing AWS permissions. See IAM_ACM_DELETE_POLICY.md", {
                duration: 8000
              });
            } else {
              skipped.push(`SSL (${reason})`);
            }
          }

          if (cleaned.length > 0) {
            toast.info(`Cleaned up: ${cleaned.join(", ")}`, { duration: 5000 });
          }

          if (skipped.length > 0 && !data.cleanup.ssl?.includes("permission")) {
            toast.info(`Skipped: ${skipped.join(", ")}`, { duration: 5000 });
          }
        }

        onDelete();
      } else {
        toast.error(data.error || "Failed to remove domain", { id: "delete-domain" });
      }
    } catch (error) {
      toast.error("Failed to remove domain: " + error.message, { id: "delete-domain" });
    } finally {
      setLoading(false);
    }
  };

  // Determine next action
  let nextAction = null;
  if (domain.status === "PENDING") {
    nextAction = { label: "Verify Ownership", handler: handleVerify };
  } else if (domain.status === "VERIFIED") {
    nextAction = { label: "Request SSL", handler: handleRequestSSL };
  } else if (domain.status === "SSL_PENDING" || domain.status === "SSL_VALIDATING") {
    nextAction = { label: "Check SSL Status", handler: handleCheckSSL };
  } else if (domain.status === "SSL_ISSUED") {
    nextAction = { label: "Activate Domain", handler: handleActivate };
  } else if (domain.status === "DNS_PENDING") {
    nextAction = { label: "Check Activation", handler: handleCheckActivation };
  }

  return (
    <div className="p-6 border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <Globe size={16} className="text-gray-400 flex-shrink-0" />
            <h4 className="text-base font-black text-[#1d2321] tracking-tight truncate">
              {domain.domain}
            </h4>
            <StatusBadge status={domain.status} />
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500 ml-7">
            {domain.verifiedAt && (
              <span className="flex items-center gap-1">
                <CheckCircle2 size={11} className="text-green-600" />
                Verified
              </span>
            )}
            {domain.certificateArn && (
              <span className="flex items-center gap-1">
                <Shield size={11} className="text-indigo-600" />
                SSL {domain.certificateStatus === "ISSUED" ? "Active" :
                  domain.certificateStatus === "PENDING_VALIDATION" ? "Validating" :
                    "Requested"}
              </span>
            )}
            {domain.activatedAt && (
              <span className="flex items-center gap-1">
                <CheckCircle2 size={11} className="text-emerald-600" />
                Active since {new Date(domain.activatedAt).toLocaleDateString()}
              </span>
            )}
          </div>

          {expanded && dnsInstructions && (
            <DNSInstructions instructions={dnsInstructions} />
          )}
        </div>

        <div className="flex items-center gap-2">
          {nextAction && (
            <button
              onClick={nextAction.handler}
              disabled={loading}
              className="px-4 py-2 bg-[#d3ff4a] text-[#0b1411] text-xs font-black uppercase tracking-widest rounded-full hover:bg-[#c0eb3f] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? <Loader2 size={12} className="animate-spin" /> : null}
              {nextAction.label}
            </button>
          )}
          {domain.status === "ACTIVE" && (
            <a
              href={`https://${domain.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-400 hover:text-[#0b1411] hover:bg-gray-100 rounded-lg transition-colors"
              title="Visit domain"
            >
              <ExternalLink size={14} />
            </a>
          )}
          {(domain.status === "PENDING" || domain.status === "VERIFIED") && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-2 text-gray-400 hover:text-[#0b1411] hover:bg-gray-100 rounded-lg transition-colors"
              title="Show DNS instructions"
            >
              <RefreshCw size={14} />
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            title="Remove domain"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

// Main Custom Domain Manager Component
export default function CustomDomainManager({ siteId, siteSlug }) {
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [adding, setAdding] = useState(false);

  // Default system domain
  const defaultDomain = siteSlug ? `${siteSlug}.sitepilot.devally.in` : null;

  const fetchDomains = async () => {
    try {
      const res = await fetch(`/api/sites/${siteId}/domains`);
      const data = await res.json();
      if (data.domains) {
        setDomains(data.domains);
      }
    } catch (error) {
      console.error("Failed to fetch domains:", error);
      toast.error("Failed to load domains");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDomains();
  }, [siteId]);

  const handleAddDomain = async () => {
    if (!newDomain.trim()) return;

    setAdding(true);
    try {
      const res = await fetch(`/api/sites/${siteId}/domains`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: newDomain.trim() }),
      });

      const data = await res.json();

      if (data.domain) {
        toast.success("Domain added successfully!");
        setNewDomain("");
        setShowAddForm(false);
        fetchDomains();
      } else {
        toast.error(data.error || "Failed to add domain");
      }
    } catch (error) {
      toast.error("Failed to add domain");
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-black text-gray-400 tracking-[0.15em] uppercase">
          Domains
        </h2>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center justify-center px-6 h-10 text-xs font-black uppercase tracking-widest text-[#d3ff4a] bg-[#0b1411] rounded-full hover:bg-[#1d2321] transition-all hover:scale-105 active:scale-95 shadow-lg focus:outline-none"
          >
            <Plus size={16} className="mr-1.5" />
            Add Domain
          </button>
        )}
      </div>

      <div className="bg-white border border-gray-100 rounded-[2rem] shadow-sm overflow-hidden">
        {/* Default System Domain (Always shown, non-removable) */}
        {defaultDomain && (
          <>
            <div className="px-8 py-4 bg-gradient-to-r from-[#d3ff4a]/20 to-[#8bc4b1]/20 border-b border-gray-100">
              <div className="flex items-center gap-2 mb-1">
                <Shield size={12} className="text-[#0b1411]" />
                <span className="text-[10px] font-black uppercase tracking-widest text-[#0b1411]">
                  Default Domain
                </span>
              </div>
              <p className="text-xs text-gray-600 font-medium">
                This is your system-assigned domain, always active and accessible.
              </p>
            </div>
            <div className="p-6 border-b-2 border-[#d3ff4a]/30 bg-gradient-to-b from-white to-[#fcfdfc]">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-[#d3ff4a] rounded-lg">
                      <Globe size={16} className="text-[#0b1411]" />
                    </div>
                    <h4 className="text-base font-black text-[#1d2321] tracking-tight truncate">
                      {defaultDomain}
                    </h4>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700">
                      <CheckCircle2 size={11} />
                      Active
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 ml-12">
                    <span className="flex items-center gap-1">
                      <Shield size={11} className="text-green-600" />
                      SSL Secured
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 size={11} className="text-emerald-600" />
                      Always Available
                    </span>
                    <span className="flex items-center gap-1 text-gray-400 italic">
                      Cannot be removed
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`https://${defaultDomain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-[#0b1411] text-[#d3ff4a] text-xs font-black uppercase tracking-widest rounded-full hover:bg-[#1d2321] transition-all flex items-center gap-2 shadow-sm hover:scale-105 active:scale-95"
                    title="Visit your site"
                  >
                    <ExternalLink size={12} />
                    Visit
                  </a>
                  <CopyButton text={defaultDomain} />
                </div>
              </div>
            </div>
            {domains.length > 0 && (
              <div className="px-8 py-4 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <LinkIcon size={12} className="text-gray-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                    Custom Domains ({domains.length})
                  </span>
                </div>
              </div>
            )}
          </>
        )}
        {showAddForm && (
          <div className="p-8 bg-[#fcfdfc] border-b border-gray-100">
            <label className="block text-xs font-black uppercase tracking-widest text-[#0b1411] mb-4">
              Add New Domain
            </label>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <Globe className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="example.com or www.example.com"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddDomain()}
                  className="pl-12 w-full px-5 py-3.5 bg-[#f2f4f2] border-none rounded-2xl text-[#0b1411] font-bold focus:outline-none focus:ring-2 focus:ring-[#0b1411]/20 transition-all text-sm shadow-inner"
                />
              </div>
              <div className="flex gap-3 shrink-0">
                <button
                  onClick={handleAddDomain}
                  disabled={adding}
                  className="px-8 py-3.5 bg-[#d3ff4a] text-[#0b1411] text-xs font-black uppercase tracking-widest rounded-full hover:bg-[#c0eb3f] transition-all shadow-sm hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {adding && <Loader2 size={12} className="animate-spin" />}
                  Add
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewDomain("");
                  }}
                  className="px-6 py-3.5 bg-transparent border-none text-gray-500 text-xs font-bold uppercase tracking-widest rounded-full hover:bg-gray-100 hover:text-[#0b1411] transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {domains.length === 0 && !defaultDomain ? (
          <div className="py-24 px-8 text-center">
            <div className="h-16 w-16 bg-[#f2f4f2] border border-gray-100 rounded-[2rem] flex items-center justify-center mb-6 mx-auto">
              <Globe size={24} className="text-gray-400" />
            </div>
            <p className="text-xl font-black text-[#1d2321] tracking-tight mb-2">
              No domains configured
            </p>
            <p className="text-sm font-medium text-gray-500 max-w-sm mx-auto">
              Add a custom domain to make your site accessible at your own URL.
            </p>
          </div>
        ) : domains.length === 0 && defaultDomain ? (
          <div className="py-16 px-8 text-center bg-gradient-to-b from-white to-[#fcfdfc]">
            <div className="h-14 w-14 bg-[#d3ff4a] border border-[#0b1411]/10 rounded-[2rem] flex items-center justify-center mb-5 mx-auto shadow-sm">
              <Plus size={24} className="text-[#0b1411]" />
            </div>
            <p className="text-lg font-black text-[#1d2321] tracking-tight mb-2">
              Ready to add a custom domain?
            </p>
            <p className="text-sm font-medium text-gray-500 max-w-md mx-auto mb-6">
              Connect your own domain (like www.yoursite.com) to make your site accessible at a branded URL. Your default domain will continue to work.
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center justify-center px-6 py-3 bg-[#0b1411] text-[#d3ff4a] text-xs font-black uppercase tracking-widest rounded-full hover:bg-[#1d2321] transition-all shadow-lg hover:scale-105 active:scale-95"
            >
              <Plus size={16} className="mr-2" />
              Add Custom Domain
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {domains.map((domain) => (
              <DomainCard
                key={domain.id}
                domain={domain}
                siteId={siteId}
                onUpdate={fetchDomains}
                onDelete={fetchDomains}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
