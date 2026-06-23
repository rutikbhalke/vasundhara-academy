'use client';
import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import '@/styles/admin.css';

export default function AdminDocuments() {
  const [documents, setDocuments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', category: 'affiliation' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/documents').then(r => r.json()).then(data => {
      setDocuments(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setError('');

    const fileInput = e.target.querySelector('input[type=file]');
    const file = fileInput?.files?.[0];

    if (!file) {
      setError('Please choose a PDF or image before uploading.');
      return;
    }

    setSubmitting(true);

    try {
      const fd = new FormData();
      fd.append('file', file);
      const uploadRes = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const uploadData = await uploadRes.json().catch(() => ({}));
      if (!uploadRes.ok || !uploadData.url) {
        throw new Error(uploadData.error || 'File upload failed. Please try again.');
      }

      const res = await fetch('/api/admin/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, fileUrl: uploadData.url }),
      });
      const responseData = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(responseData.error || 'Document could not be saved.');
      }

      setDocuments((items) => [responseData, ...items]);
      setForm({ title: '', category: 'affiliation' });
      setShowForm(false);
      e.target.reset();
    } catch (err) {
      setError(err.message || 'Document upload failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this document?')) return;
    const res = await fetch(`/api/admin/documents?id=${id}`, { method: 'DELETE' });
    if (res.ok) setDocuments(documents.filter(d => d.id !== id));
  };

  return (
    <AdminLayout>
      <div className="admin-header">
        <h1>Public Disclosures</h1>
        <button className="admin-btn admin-btn-primary" onClick={() => setShowForm(!showForm)}>
          <i className={`fas fa-${showForm ? 'times' : 'plus'}`}></i> {showForm ? 'Cancel' : 'Upload Document'}
        </button>
      </div>

      {showForm && (
        <div className="admin-card" style={{ marginBottom: '1.5rem' }}>
          <div className="admin-card-body">
            <form onSubmit={handleSubmit} className="admin-form">
              {error && (
                <div className="admin-login-error" style={{ textAlign: 'left' }}>
                  <i className="fas fa-exclamation-circle"></i> {error}
                </div>
              )}
              <div className="admin-form-row">
                <div className="form-group">
                  <label className="form-label">Document Title *</label>
                  <input className="form-input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required placeholder="e.g., CBSE Affiliation Certificate" />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-select" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                    <option value="affiliation">School Affiliation</option>
                    <option value="self-affidavit">Self-Affidavit</option>
                    <option value="result">Results & Academic</option>
                    <option value="academic">Staff & Infrastructure</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Upload File (PDF/Image)</label>
                <input className="form-input" type="file" accept=".pdf,.jpg,.png,.jpeg" required />
              </div>
              <button
                type="submit"
                className="admin-btn admin-btn-primary"
                disabled={submitting}
                style={{ opacity: submitting ? 0.7 : 1, cursor: submitting ? 'not-allowed' : 'pointer' }}
              >
                <i className={`fas fa-${submitting ? 'spinner fa-spin' : 'save'}`}></i> {submitting ? 'Uploading...' : 'Upload Document'}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="admin-card">
        <div className="admin-card-header"><h3>All Documents ({documents.length})</h3></div>
        <div className="admin-card-body" style={{ padding: 0 }}>
          {loading ? (
            <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--gray-400)' }}><i className="fas fa-spinner fa-spin"></i> Loading...</p>
          ) : documents.length === 0 ? (
            <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--gray-400)' }}>No documents uploaded yet.</p>
          ) : (
            <table className="admin-table">
              <thead><tr><th>Title</th><th>Category</th><th>File</th><th>Actions</th></tr></thead>
              <tbody>
                {documents.map(d => (
                  <tr key={d.id}>
                    <td style={{ fontWeight: 600, color: 'var(--navy)' }}>{d.title}</td>
                    <td><span className="status-badge active">{d.category}</span></td>
                    <td>
                      {d.fileUrl ? (
                        <a href={d.fileUrl} target="_blank" className="admin-btn admin-btn-outline admin-btn-sm">
                          <i className="fas fa-download"></i> View
                        </a>
                      ) : 'No file'}
                    </td>
                    <td>
                      <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => handleDelete(d.id)}>
                        <i className="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
