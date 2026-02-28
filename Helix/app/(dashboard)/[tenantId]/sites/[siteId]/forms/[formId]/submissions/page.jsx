'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Download, Trash2, Loader2, FileText, AlertCircle } from 'lucide-react';

export default function FormSubmissionsPage() {
  const params = useParams();
  const router = useRouter();
  const { tenantId, siteId, formId } = params;

  const [form, setForm] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [formId]);

  async function fetchData() {
    try {
      setLoading(true);
      
      // Fetch form details
      const formRes = await fetch(`/api/sites/${siteId}/forms/${formId}`);
      if (!formRes.ok) throw new Error('Failed to fetch form');
      const formData = await formRes.json();
      console.log('Form data received:', formData);
      // API returns { form: {...} }, so extract the form object
      setForm(formData.form || formData);

      // Fetch submissions
      const submissionsRes = await fetch(`/api/sites/${siteId}/forms/${formId}/submissions`);
      if (!submissionsRes.ok) throw new Error('Failed to fetch submissions');
      const submissionsData = await submissionsRes.json();
      console.log('Submissions data received:', submissionsData);
      setSubmissions(submissionsData.submissions || []);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Helper function to get field label from field ID
  function getFieldLabel(fieldId) {
    if (!form?.schema) {
      console.log('No form schema available');
      return fieldId;
    }
    
    console.log('Looking for field:', fieldId);
    console.log('Form schema:', form.schema);
    
    const field = form.schema.find(f => f.id === fieldId);
    console.log('Found field:', field);
    
    return field?.label || fieldId;
  }

  async function handleDelete(submissionId) {
    if (!confirm('Are you sure you want to delete this submission?')) return;

    try {
      const res = await fetch(`/api/sites/${siteId}/forms/${formId}/submissions`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId }),
      });

      if (!res.ok) throw new Error('Failed to delete submission');
      
      // Refresh submissions
      fetchData();
    } catch (err) {
      alert('Error deleting submission: ' + err.message);
    }
  }

  function handleExportCSV() {
    if (!submissions.length) return;

    // Get all unique field IDs
    const fieldIds = new Set();
    submissions.forEach(sub => {
      Object.keys(sub.data).forEach(key => fieldIds.add(key));
    });
    const fields = Array.from(fieldIds);

    // Create CSV header with field labels instead of IDs
    const fieldLabels = fields.map(fieldId => getFieldLabel(fieldId));
    const header = ['Submission Date', ...fieldLabels].join(',');

    // Create CSV rows
    const rows = submissions.map(sub => {
      const date = new Date(sub.createdAt).toLocaleString();
      const values = fields.map(field => {
        const value = sub.data[field];
        // Handle arrays (checkboxes)
        if (Array.isArray(value)) return `"${value.join(', ')}"`;
        // Escape quotes and wrap in quotes if contains comma
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      });
      return [date, ...values].join(',');
    });

    // Combine and download
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${form?.name || 'form'}-submissions-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfdfc]">
        <div className="animate-spin rounded-full h-10 w-10 border-[4px] border-gray-100 border-t-[#0b1411]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#fcfdfc] font-sans text-gray-900 flex items-center justify-center">
        <div className="flex items-start gap-3 text-sm text-red-700 bg-red-50 border border-red-100 rounded-[2rem] px-8 py-6 max-w-lg">
          <AlertCircle size={24} className="mt-0.5 shrink-0 text-red-500" />
          <div>
            <span className="font-bold text-lg block mb-1">Error Loading Submissions</span>
            <span className="text-red-600/80">{error}</span>
          </div>
        </div>
      </div>
    );
  }

  const fieldIds = Array.from(
    new Set(submissions.flatMap((sub) => Object.keys(sub.data || {})))
  );

  return (
    <div className="min-h-screen bg-[#fcfdfc] font-sans text-gray-900 pb-20 relative">
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="flex items-start sm:items-center gap-6">
              <button
                onClick={() => router.push(`/dashboard/${tenantId}/sites/${siteId}/forms`)}
                className="mt-1 sm:mt-0 p-3 bg-white border border-gray-200 text-gray-400 hover:text-[#0b1411] hover:border-[#0b1411]/20 rounded-2xl transition-all shadow-sm hover:shadow-md focus:outline-none"
                title="Back to Forms"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div>
                <p className="text-[#8bc4b1] text-[10px] font-bold tracking-[0.2em] uppercase mb-3">
                  {submissions.length} {submissions.length === 1 ? 'SUBMISSION' : 'SUBMISSIONS'}
                </p>
                <h1 className="text-4xl sm:text-5xl font-black text-[#1d2321] uppercase tracking-tighter leading-[1]">
                  {form?.name || 'Form Details'}
                </h1>
              </div>
            </div>
            {submissions.length > 0 && (
              <button
                onClick={handleExportCSV}
                className="w-full sm:w-auto bg-[#d3ff4a] text-[#0b1411] h-14 px-8 rounded-full font-bold flex items-center justify-center hover:bg-[#c0eb3f] transition-all active:scale-95 shadow-[0_0_20px_rgba(211,255,74,0.3)] hover:scale-105 duration-200"
              >
                <Download className="h-5 w-5 mr-2" />
                Export CSV
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-12">
        {submissions.length === 0 ? (
          <div className="py-32 text-center border border-gray-200 rounded-[2.5rem] bg-[#fcfdfc] border-dashed px-6 flex flex-col items-center">
            <div className="h-20 w-20 rounded-[2rem] bg-gray-50 border border-gray-100 flex items-center justify-center mb-8">
              <FileText size={32} className="text-gray-300" />
            </div>
            <h3 className="text-2xl font-black text-[#0b1411] tracking-tight mb-3">
              No Submissions Yet
            </h3>
            <p className="text-base font-medium text-gray-500 max-w-sm mb-10 leading-relaxed">
              Submissions will appear here when users fill out your form.
            </p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f2f4f2] border-b border-gray-200/80">
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-[#8bc4b1] whitespace-nowrap">
                      Submitted
                    </th>
                    {fieldIds.map((fieldId) => (
                      <th
                        key={fieldId}
                        className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-[#8bc4b1] whitespace-nowrap"
                      >
                        {getFieldLabel(fieldId)}
                      </th>
                    ))}
                    <th className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-widest text-[#8bc4b1] whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {submissions.map((submission) => (
                    <tr
                      key={submission.id}
                      className="group hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          <span className="text-sm font-bold text-[#1d2321]">
                            {new Date(submission.createdAt).toLocaleString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </td>
                      {fieldIds.map((fieldId) => {
                        const value = submission.data[fieldId];
                        const displayValue = Array.isArray(value) ? value.join(', ') : value || '—';
                        return (
                          <td
                            key={fieldId}
                            className="px-6 py-5 text-sm font-medium text-gray-600 max-w-xs truncate"
                            title={displayValue}
                          >
                            {displayValue}
                          </td>
                        );
                      })}
                      <td className="px-6 py-5 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleDelete(submission.id)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete submission"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
