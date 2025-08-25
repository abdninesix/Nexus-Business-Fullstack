// src/components/documents/DocumentViewer.tsx
import React from 'react';
import Modal from 'react-modal';
import { Viewer, Worker } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import { Document } from '../../api/documents';
import * as pdfjs from 'pdfjs-dist';

// Style for the modal
const customStyles = {
    content: {
        top: '50%', left: '50%', right: 'auto', bottom: 'auto',
        marginRight: '-50%', transform: 'translate(-50%, -50%)',
        width: '90%', maxWidth: '900px', height: '90vh',
        padding: '0', border: 'none', display: 'flex', flexDirection: 'column' as 'column',
        overflow: 'hidden', // The viewer will handle its own scrolling
    },
    overlay: { backgroundColor: 'rgba(0, 0, 0, 0.75)', zIndex: 1000 },
};

Modal.setAppElement('#root');

interface DocumentViewerProps {
    doc: Document | null;
    onClose: () => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ doc, onClose }) => {
    // Create new plugin instance
    const defaultLayoutPluginInstance = defaultLayoutPlugin();

    if (!doc) return null;

    const isPdf = doc.type === 'application/pdf';
    const isOfficeDoc = [
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ].includes(doc.type);

    const renderContent = () => {
        if (isPdf) {
            const workerUrl = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
            return (
                // The Worker component is the magic that solves the import issue.
                // It provides the context for the Viewer.
                <Worker workerUrl={workerUrl}>
                    <div style={{ height: '100%', width: '100%' }}>
                        <Viewer
                            fileUrl={doc.url}
                            plugins={[defaultLayoutPluginInstance]}
                        />
                    </div>
                </Worker>
            );
        }

        if (isOfficeDoc) {
            const googleViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(doc.url)}&embedded=true`;
            return <iframe src={googleViewerUrl} style={{ width: '100%', height: '100%', border: 'none' }} title={doc.name} />;
        }

        return (
            <div className="p-8 text-center"><h2 className="text-xl font-bold">Preview not available</h2><a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-primary-600 font-semibold mt-4 inline-block">Open in new tab</a></div>
        );
    };

    return (
        <Modal isOpen={!!doc} onRequestClose={onClose} style={customStyles} contentLabel="Document Viewer">
            <div className="flex justify-between items-center p-4 bg-gray-50 border-b">
                <h2 className="font-bold text-lg truncate">{doc.name}</h2>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl leading-none">&times;</button>
            </div>
            <div className="flex-1 bg-gray-200">
                {renderContent()}
            </div>
        </Modal>
    );
};