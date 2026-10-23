'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Edit3,
  ListFilter,
  Copy,
  Check,
  Code2,
  Layers,
  Inbox,
  Clock,
  ExternalLink,
  Settings,
  Trash2,
  AlertCircle,
  Save,
  CheckCircle2,
  Plus,
  Share2,
} from 'lucide-react';

export default function FormDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { tenantId, siteId, formId } = params;

  const [form, setForm] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Copy embed states
  const [copiedType, setCopiedType] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'embed' | 'submissions' | 'settings'

  useEffect(() => {
    fetchFormData();
  }, [formId, siteId]);

  async function fetchFormData() {
    try {
      setLoading(true);
      setError(null);

      // Fetch Form
      const formRes = await fetch(`/api/sites/${siteId}/forms/${formId}`);
      if (!formRes.ok) {
        if (formRes.status === 404) throw new Error('Form not found');
        throw new Error('Failed to load form');
      }
      const data = await formRes.json();
      const loadedForm = data.form || data;
      setForm(loadedForm);
      setName(loadedForm.name || '');
      setDescription(loadedForm.description || '');

      // Fetch Submissions
      const subRes = await fetch(`/api/sites/${siteId}/forms/${formId}/submissions`);
      if (subRes.ok) {
        const subData = await subRes.json();
        setSubmissions(subData.submissions || []);
      }
    } catch (err) {
      console.error('Error fetching form data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateForm(e) {
    e.preventDefault();
    try {
      setSaving(true);
      setSaveSuccess(false);

      const res = await fetch(`/api/sites/${siteId}/forms/${formId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });

      if (!res.ok) throw new Error('Failed to update form details');

      const updated = await res.json();
      setForm(prev => ({ ...prev, ...(updated.form || updated) }));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert(err.message || 'Error updating form');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteForm() {
    if (!confirm('Are you sure you want to permanently delete this form and all its submissions?')) {
      return;
    }

    try {
      const res = await fetch(`/api/sites/${siteId}/forms/${formId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete form');
      router.push(`/${tenantId}/sites/${siteId}/forms`);
    } catch (err) {
      alert(err.message || 'Error deleting form');
    }
  }

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfdfc]">
        <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-gray-100 border-t-[#0b1411]" />
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="min-h-screen bg-[#fcfdfc] p-8 flex items-center justify-center">
        <div className="max-w-md w-full bg-white border border-red-100 p-8 rounded-3xl text-center shadow-sm">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-black text-[#1d2321] uppercase tracking-tight mb-2">
            {error || 'Form Not Found'}
          </h2>
          <p className="text-sm text-gray-500 mb-6 font-medium">
            The form you are looking for might have been deleted or moved.
          </p>
          <button
            onClick={() => router.push(`/${tenantId}/sites/${siteId}/forms`)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#0b1411] text-[#d3ff4a] text-xs font-black uppercase tracking-wider rounded-full hover:bg-black transition-all"
          >
            <ArrowLeft size={14} /> Back to Forms
          </button>
        </div>
      </div>
    );
  }

  const schemaFields = Array.isArray(form.schema) ? form.schema : [];
  const submissionsCount = form._count?.submissions ?? submissions.length;
  const apiUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/api/forms/${form.id}/submit`
    : `https://sitepilot.devally.in/api/forms/${form.id}/submit`;

  const htmlEmbedSnippet = `<form action="${apiUrl}" method="POST">
${schemaFields.map(field => `  <div style="margin-bottom: 12px;">
    <label style="display:block; margin-bottom:4px; font-weight:600;">${field.label || field.name}${field.required ? ' *' : ''}</label>
    <input 
      type="${field.type || 'text'}" 
      name="${field.name || field.id}" 
      placeholder="${field.placeholder || ''}" 
      ${field.required ? 'required ' : ''}style="width:100%; padding:8px 12px; border:1px solid #ccc; border-radius:6px;" 
    />
  </div>`).join('\n')}
  <button type="submit" style="background:#0b1411; color:#fff; padding:10px 20px; border-radius:6px; border:none; cursor:pointer;">
    Submit
  </button>
</form>`;

  const reactEmbedSnippet = `// React / Next.js Form Submission Example
const handleSubmit = async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());

  const res = await fetch("${apiUrl}", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (res.ok) {
    alert("Form submitted successfully!");
  }
};`;

  return (
    <div className="min-h-screen bg-[#fcfdfc] text-[#1d2321] pb-20">
      {/* Top Header / Breadcrumb */}
      <div className="border-b border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push(`/${tenantId}/sites/${siteId}/forms`)}
                className="h-11 w-11 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:text-[#0b1411] hover:border-gray-400 hover:bg-gray-50 transition-all shrink-0"
                title="Back to Forms"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Form Details
                  </span>
                  <span className="w-1 h-1 rounded-full bg-gray-300" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    Active
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-[#1d2321] tracking-tight uppercase">
                  {form.name}
                </h1>
              </div>
            </div>

            {/* Top Quick Actions */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => router.push(`/${tenantId}/sites/${siteId}/forms/${form.id}/builder`)}
                className="inline-flex items-center gap-2 h-11 px-5 bg-[#0b1411] text-[#d3ff4a] text-xs font-black uppercase tracking-wider rounded-full hover:bg-[#1a2e26] hover:scale-105 active:scale-95 transition-all shadow-md"
              >
                <Edit3 size={15} />
                Form Builder
              </button>
              <button
                onClick={() => router.push(`/${tenantId}/sites/${siteId}/forms/${form.id}/submissions`)}
                className="inline-flex items-center gap-2 h-11 px-5 bg-[#d3ff4a] text-[#0b1411] text-xs font-black uppercase tracking-wider rounded-full hover:bg-[#c0eb3f] hover:scale-105 active:scale-95 transition-all shadow-md shadow-[#d3ff4a]/20"
              >
                <Inbox size={15} />
                Submissions ({submissionsCount})
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-8 -mb-6 border-b border-gray-200">
            {[
              { id: 'overview', label: 'Overview & Fields', icon: Layers },
              { id: 'embed', label: 'Embed & Integration', icon: Code2 },
              { id: 'submissions', label: `Submissions (${submissionsCount})`, icon: Inbox },
              { id: 'settings', label: 'Form Settings', icon: Settings },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 px-5 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${
                    isActive
                      ? 'border-[#0b1411] text-[#0b1411]'
                      : 'border-transparent text-gray-400 hover:text-gray-700'
                  }`}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 mt-10">
        {/* TAB 1: OVERVIEW & FIELDS */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Total Submissions</div>
                <div className="text-3xl font-black text-[#1d2321]">{submissionsCount}</div>
                <p className="text-xs font-bold text-gray-400 mt-1">Across all form versions</p>
              </div>

              <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Configured Fields</div>
                <div className="text-3xl font-black text-[#1d2321]">{schemaFields.length}</div>
                <p className="text-xs font-bold text-gray-400 mt-1">Active input fields</p>
              </div>

              <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">API Endpoint</div>
                <div className="text-xs font-mono font-bold text-gray-700 truncate mt-1">
                  POST /api/forms/{form.id.slice(0, 8)}...
                </div>
                <button
                  onClick={() => copyToClipboard(apiUrl, 'apiUrl')}
                  className="mt-2 text-[10px] font-black uppercase tracking-wider text-[#0b1411] hover:underline flex items-center gap-1"
                >
                  {copiedType === 'apiUrl' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                  {copiedType === 'apiUrl' ? 'Copied' : 'Copy Endpoint'}
                </button>
              </div>

              <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Created Date</div>
                <div className="text-lg font-black text-[#1d2321]">
                  {new Date(form.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                <p className="text-xs font-bold text-gray-400 mt-1">
                  {form.versions?.length || 1} saved version(s)
                </p>
              </div>
            </div>

            {/* Form Description & Details */}
            {form.description && (
              <div className="bg-[#f2f4f2]/70 border border-gray-100 p-6 rounded-3xl">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">
                  Form Description
                </span>
                <p className="text-sm font-medium text-gray-700 leading-relaxed">{form.description}</p>
              </div>
            )}

            {/* Form Fields Table */}
            <div className="bg-white border border-gray-100 rounded-[2rem] p-6 lg:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-[#1d2321]">
                    Form Fields Schema
                  </h3>
                  <p className="text-xs font-bold text-gray-400 mt-0.5">
                    Inputs configured for this form in the visual builder
                  </p>
                </div>
                <button
                  onClick={() => router.push(`/${tenantId}/sites/${siteId}/forms/${form.id}/builder`)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#f2f4f2] text-[#0b1411] text-xs font-black uppercase tracking-wider rounded-full hover:bg-[#d3ff4a] transition-all"
                >
                  <Edit3 size={13} />
                  Edit In Builder
                </button>
              </div>

              {schemaFields.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-gray-200 rounded-2xl">
                  <Layers className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-black uppercase text-gray-500 mb-1">No Fields Configured Yet</p>
                  <p className="text-xs text-gray-400 mb-4">Open the form builder to add fields like text, email, phone, or select inputs.</p>
                  <button
                    onClick={() => router.push(`/${tenantId}/sites/${siteId}/forms/${form.id}/builder`)}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#0b1411] text-[#d3ff4a] text-xs font-black uppercase tracking-wider rounded-full hover:bg-black transition-all"
                  >
                    <Plus size={14} /> Add Fields in Builder
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400">
                        <th className="pb-3 px-4">Field Label</th>
                        <th className="pb-3 px-4">Input Name</th>
                        <th className="pb-3 px-4">Type</th>
                        <th className="pb-3 px-4">Required</th>
                        <th className="pb-3 px-4">Placeholder</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {schemaFields.map((field, idx) => (
                        <tr key={field.id || idx} className="hover:bg-gray-50/60 transition-colors">
                          <td className="py-3 px-4 font-bold text-gray-900">{field.label || field.name}</td>
                          <td className="py-3 px-4 font-mono text-xs text-gray-500">{field.name || field.id}</td>
                          <td className="py-3 px-4">
                            <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-[10px] font-black uppercase tracking-wider rounded-md">
                              {field.type || 'text'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {field.required ? (
                              <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-black uppercase rounded-full">
                                Required
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400 font-medium">Optional</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-xs text-gray-400 font-medium">{field.placeholder || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: EMBED & INTEGRATION */}
        {activeTab === 'embed' && (
          <div className="space-y-8">
            <div className="bg-white border border-gray-100 rounded-[2rem] p-6 lg:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-[#1d2321]">
                    API Submission Endpoint
                  </h3>
                  <p className="text-xs font-bold text-gray-400 mt-0.5">
                    Post JSON or form-data directly to this endpoint from any application or site.
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(apiUrl, 'endpoint')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0b1411] text-[#d3ff4a] text-xs font-black uppercase tracking-wider rounded-full hover:bg-black transition-all"
                >
                  {copiedType === 'endpoint' ? <Check size={14} className="text-[#d3ff4a]" /> : <Copy size={14} />}
                  {copiedType === 'endpoint' ? 'Copied URL!' : 'Copy API URL'}
                </button>
              </div>

              <div className="p-4 bg-gray-900 text-emerald-400 font-mono text-xs rounded-2xl break-all">
                {apiUrl}
              </div>
            </div>

            {/* HTML Embed Code */}
            <div className="bg-white border border-gray-100 rounded-[2rem] p-6 lg:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-[#1d2321]">
                    HTML Form Snippet
                  </h3>
                  <p className="text-xs font-bold text-gray-400 mt-0.5">
                    Paste this standard HTML form directly into any HTML page or CMS.
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(htmlEmbedSnippet, 'html')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#f2f4f2] text-[#0b1411] text-xs font-black uppercase tracking-wider rounded-full hover:bg-[#d3ff4a] transition-all"
                >
                  {copiedType === 'html' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  {copiedType === 'html' ? 'Copied HTML!' : 'Copy HTML'}
                </button>
              </div>

              <pre className="p-4 bg-[#0b1411] text-gray-200 font-mono text-xs rounded-2xl overflow-x-auto max-h-[350px]">
                <code>{htmlEmbedSnippet}</code>
              </pre>
            </div>

            {/* React Snippet */}
            <div className="bg-white border border-gray-100 rounded-[2rem] p-6 lg:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-[#1d2321]">
                    React / Next.js Handler Example
                  </h3>
                  <p className="text-xs font-bold text-gray-400 mt-0.5">
                    Submit asynchronously using fetch with JSON payload.
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(reactEmbedSnippet, 'react')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#f2f4f2] text-[#0b1411] text-xs font-black uppercase tracking-wider rounded-full hover:bg-[#d3ff4a] transition-all"
                >
                  {copiedType === 'react' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  {copiedType === 'react' ? 'Copied React Code!' : 'Copy Code'}
                </button>
              </div>

              <pre className="p-4 bg-[#0b1411] text-gray-200 font-mono text-xs rounded-2xl overflow-x-auto">
                <code>{reactEmbedSnippet}</code>
              </pre>
            </div>
          </div>
        )}

        {/* TAB 3: SUBMISSIONS */}
        {activeTab === 'submissions' && (
          <div className="space-y-6">
            <div className="bg-white border border-gray-100 rounded-[2rem] p-6 lg:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-[#1d2321]">
                    Submissions List ({submissions.length})
                  </h3>
                  <p className="text-xs font-bold text-gray-400 mt-0.5">
                    Data captured by this form
                  </p>
                </div>
                <button
                  onClick={() => router.push(`/${tenantId}/sites/${siteId}/forms/${form.id}/submissions`)}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#d3ff4a] text-[#0b1411] text-xs font-black uppercase tracking-wider rounded-full hover:bg-[#c0eb3f] transition-all"
                >
                  <Inbox size={14} /> Full Submissions Page
                </button>
              </div>

              {submissions.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-gray-200 rounded-2xl">
                  <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-base font-black uppercase text-[#1d2321] mb-1">No Submissions Yet</p>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto mb-4">
                    Submissions received from published sites or external form embeds will appear here instantly.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400">
                        <th className="pb-3 px-4">Date</th>
                        <th className="pb-3 px-4">Submission Data</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {submissions.slice(0, 10).map((sub) => (
                        <tr key={sub.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="py-4 px-4 whitespace-nowrap text-xs font-bold text-gray-500">
                            {new Date(sub.createdAt).toLocaleString()}
                          </td>
                          <td className="py-4 px-4 font-mono text-xs text-gray-800">
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(sub.data || {}).map(([k, v]) => (
                                <span key={k} className="px-2 py-1 bg-gray-100 rounded text-gray-700">
                                  <strong>{k}:</strong> {String(v)}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="space-y-8 max-w-3xl">
            {/* Form Name & Description Form */}
            <div className="bg-white border border-gray-100 rounded-[2rem] p-6 lg:p-8 shadow-sm">
              <h3 className="text-lg font-black uppercase tracking-tight text-[#1d2321] mb-6">
                General Settings
              </h3>

              <form onSubmit={handleUpdateForm} className="space-y-6">
                {saveSuccess && (
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-2 text-emerald-700 text-xs font-bold">
                    <CheckCircle2 size={16} /> Form details saved successfully!
                  </div>
                )}

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-700 mb-2">
                    Form Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-5 py-3.5 bg-[#f2f4f2] rounded-2xl text-sm font-bold text-[#1d2321] focus:outline-none focus:ring-2 focus:ring-[#0b1411]/20 transition-all border border-transparent focus:border-gray-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Brief description of this form..."
                    className="w-full px-5 py-3.5 bg-[#f2f4f2] rounded-2xl text-sm font-medium text-[#1d2321] focus:outline-none focus:ring-2 focus:ring-[#0b1411]/20 transition-all border border-transparent focus:border-gray-300 resize-none"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#0b1411] text-[#d3ff4a] text-xs font-black uppercase tracking-wider rounded-full hover:bg-black transition-all disabled:opacity-50"
                  >
                    <Save size={14} />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-50/50 border border-red-100 rounded-[2rem] p-6 lg:p-8">
              <h3 className="text-lg font-black uppercase tracking-tight text-red-600 mb-2">
                Danger Zone
              </h3>
              <p className="text-xs text-red-500 font-medium mb-6">
                Deleting this form will permanently remove all associated fields, version history, and form submission data. This action cannot be undone.
              </p>
              <button
                type="button"
                onClick={handleDeleteForm}
                className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white text-xs font-black uppercase tracking-wider rounded-full hover:bg-red-700 transition-all shadow-md shadow-red-600/20"
              >
                <Trash2 size={14} />
                Delete This Form
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
