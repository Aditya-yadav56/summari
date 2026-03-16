import React, { useEffect, useState } from 'react';
import { FileText, ExternalLink, Maximize2 } from 'lucide-react';

export default function PdfPreview({ fileName, fileUrl }) {
    const [viewUrl, setViewUrl] = useState(fileUrl);

    useEffect(() => {
        window.jumpToPdfPage = (page) => {
            if (fileUrl) {
                // For native Chrome/Safari PDF viewer, #page=X works
                const baseUrl = fileUrl.split('#')[0];
                setViewUrl(`${baseUrl}#page=${page}`);
                
                // If it's the iframe, we might need to nudge it
                const frame = document.getElementById('pdf-frame');
                if (frame) frame.src = `${baseUrl}#page=${page}`;
            }
        };
        return () => { delete window.jumpToPdfPage; };
    }, [fileUrl]);

    return (
        <div style={containerStyle}>
            <header style={headerStyle}>
                <div style={titleWrapStyle}>
                    <FileText size={18} color="#2563eb" />
                    <h3 style={titleStyle}>{fileName || 'document.pdf'}</h3>
                </div>
                <div style={actionWrapStyle}>
                    <button onClick={() => window.open(fileUrl, '_blank')} style={iconBtnStyle} title="Open in new tab"><ExternalLink size={14} /></button>
                </div>
            </header>

            <div style={canvasStyle}>
                {fileUrl ? (
                    <iframe
                        id="pdf-frame"
                        src={viewUrl}
                        style={{ width: '100%', height: '100%', border: 'none', borderRadius: '8px' }}
                        title="PDF Preview"
                    />
                ) : (
                    <>
                        <div style={placeholderStyle}>
                            <FileText size={48} color="#e2e8f0" style={{ marginBottom: '16px' }} />
                            <p style={{ color: '#94a3b8', fontSize: '14px' }}>PDF Visual Preview</p>
                            <p style={{ color: '#cbd5e1', fontSize: '11px', marginTop: '4px' }}>Native PDF rendering disabled in dev</p>
                        </div>

                        <div style={mockContentStyle}>
                            {Array.from({ length: 20 }).map((_, i) => (
                                <div key={i} style={{
                                    height: '12px',
                                    width: `${Math.random() * 40 + 60}%`,
                                    background: '#f1f5f9',
                                    borderRadius: '4px',
                                    marginBottom: '12px'
                                }} />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

const containerStyle = {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--bg-primary)',
    borderRadius: '16px',
    overflow: 'hidden',
    border: '1px solid var(--border-glass)',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
};

const headerStyle = {
    padding: '16px 20px',
    borderBottom: '1px solid var(--border-glass)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'var(--bg-glass)'
};

const titleWrapStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
};

const titleStyle = {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--text-primary)',
    margin: 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '200px'
};

const actionWrapStyle = {
    display: 'flex',
    gap: '8px'
};

const iconBtnStyle = {
    border: 'none',
    background: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    transition: 'all 0.2s'
};

const canvasStyle = {
    flex: 1,
    padding: '40px',
    overflowY: 'auto',
    position: 'relative',
    background: 'var(--bg-primary)'
};

const placeholderStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 0',
    textAlign: 'center'
};

const mockContentStyle = {
    opacity: 0.5,
    userSelect: 'none',
    pointerEvents: 'none'
};
