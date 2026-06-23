'use client';
import { useEffect, useState } from 'react';
import '@/styles/about.css';
import '@/styles/phase5.css';

export default function MandatoryDisclosurePage() {
  const [documents, setDocuments] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/public/documents')
      .then((res) => res.json())
      .then((data) => {
        setDocuments(Array.isArray(data) ? data : []);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  return (
    <>
      <section className="page-hero">
        <div className="page-hero-content">
          <h1 className="page-hero-title">Mandatory Disclosure</h1>
          <p className="page-hero-desc">View and download mandatory disclosure documents shared by Vasundhara Academy.</p>
        </div>
      </section>

      <section className="docs-section">
        <div className="container text-center">
          <span className="section-tag"><i className="fas fa-minus"></i> Downloads</span>
          <h2 className="section-title">Mandatory Disclosure PDFs</h2>
          <p className="section-desc" style={{ margin: '0 auto' }}>
            Uploaded PDF documents will appear here for parents and visitors to download.
          </p>
        </div>

        <div className="docs-grid">
          <div className="docs-category">
            <h3><i className="fas fa-file-pdf"></i> Documents</h3>
            {!loaded ? (
              <div className="doc-item">
                <div className="doc-info">
                  <div className="doc-icon"><i className="fas fa-spinner fa-spin"></i></div>
                  <div>
                    <h4>Loading documents...</h4>
                    <p>Please wait</p>
                  </div>
                </div>
              </div>
            ) : documents.length === 0 ? (
              <div className="doc-item">
                <div className="doc-info">
                  <div className="doc-icon"><i className="fas fa-file-alt"></i></div>
                  <div>
                    <h4>No PDF uploaded yet</h4>
                    <p>The document will be available after it is uploaded from the admin gallery.</p>
                  </div>
                </div>
              </div>
            ) : (
              documents.map((doc) => (
                <div key={doc.id} className="doc-item">
                  <div className="doc-info">
                    <div className="doc-icon"><i className="fas fa-file-pdf" style={{ color: '#dc2626' }}></i></div>
                    <div>
                      <h4>{doc.title || 'Mandatory Disclosure'}</h4>
                      <p>Disclosure document</p>
                    </div>
                  </div>
                  <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="doc-download">
                    <i className="fas fa-download" style={{ marginRight: '0.3rem' }}></i> Download
                  </a>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </>
  );
}
