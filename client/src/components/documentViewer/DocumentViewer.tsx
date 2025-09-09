// src/components/documentViewer/DocumentViewer.tsx
import React from 'react';
import { Viewer, Worker } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import Modal from 'react-modal';
// Import the styles
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
// Import your Document type
import { Document } from '../../api/documents';
import { Button } from '../ui/Button';
// This is the most reliable way to get the worker URL, using the installed package's version

const workerUrl = '/pdf.worker.min.js';

// Style for the modal
const modalStyles = {
    content: {
        top: '50%', left: '50%', right: 'auto', bottom: 'auto',
        marginRight: '-50%', transform: 'translate(-50%, -50%)',
        width: '90%', maxWidth: '900px', height: '90vh',
        padding: '0', border: 'none', display: 'flex', flexDirection: 'column' as 'column',
    },
    overlay: { backgroundColor: 'rgba(0, 0, 0, 0.75)', zIndex: 1000 },
};

interface DocumentViewerProps {
    doc: Document | null;
    onClose: () => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ doc, onClose }) => {
    // Create a new plugin instance for each render
    const defaultLayoutPluginInstance = defaultLayoutPlugin();

    if (!doc) {
        return null;
    }

    // Check for common file types
    const isPdf = doc.type === 'application/pdf';
    const isImage = doc.type.startsWith('image/');
    const isOfficeDoc = [
        'application/msword', // .doc
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        'application/vnd.ms-excel', // .xls
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    ].includes(doc.type);

    const renderContent = () => {
        if (isPdf) {
            return (
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

        if (isImage) {
            return (
                <div className="w-full h-full flex items-center justify-center p-4 bg-gray-200">
                    <img src={doc.url} alt={doc.name} className="max-w-full max-h-full object-contain" />
                </div>
            );
        }

        if (isOfficeDoc) {
            const googleViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(doc.url)}&embedded=true`;
            return <iframe src={googleViewerUrl} style={{ width: '100%', height: '100%', border: 'none' }} title={doc.name} />;
        }

        // Fallback for unsupported file types
        return (
            <div className="p-8 text-center flex flex-col justify-center items-center h-full">
                <h2 className="text-xl font-bold text-gray-900">Preview not available</h2>
                <p className="text-gray-600 mt-2">This file type ({doc.type}) cannot be previewed directly.</p>
                <a href={doc.url} target="_blank" rel="noopener noreferrer" className="mt-6">
                    <Button>Download File</Button>
                </a>
            </div>
        );
    };

    return (
        <Modal isOpen={!!doc} onRequestClose={onClose} style={modalStyles} contentLabel="Document Viewer">
            <div className="flex justify-between items-center p-4 bg-gray-50 border-b">
                <h2 className="font-bold text-lg truncate">{doc.name}</h2>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl leading-none">&times;</button>
            </div>
            <div className="flex-1 bg-gray-200 overflow-y-auto">
                {renderContent()}
            </div>
        </Modal>
    );
};