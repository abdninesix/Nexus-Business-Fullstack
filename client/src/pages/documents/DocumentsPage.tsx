import React, { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Upload, Download, Trash2, Share2, View } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import toast from 'react-hot-toast';
import { fetchDocuments, uploadDocument, deleteDocument, Document } from '../../api/documents';
import { DocumentViewer } from '../../components/documentViewer/DocumentViewer';

// Helper function to format bytes into KB/MB/GB
const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// Helper function to format date strings
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const DocumentsPage: React.FC = () => {

  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [viewingDoc, setViewingDoc] = useState<Document | null>(null);

  // === DATA FETCHING ===
  const { data: documents = [], isLoading, isError } = useQuery<Document[]>({
    queryKey: ['documents'],
    queryFn: fetchDocuments,
  });

  // === MUTATIONS ===
  const uploadMutation = useMutation({
    mutationFn: uploadDocument,
    onSuccess: () => {
      toast.success('Document uploaded successfully!');
      queryClient.invalidateQueries({ queryKey: ['documents'] }); // Refetch the documents list
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Upload failed.'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      toast.success('Document deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['documents'] }); // Refetch the documents list
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Delete failed.'),
  });

  // === HANDLERS ===
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  const handleDelete = (documentId: string) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      deleteMutation.mutate(documentId);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-600">Manage your startup's important files</p>
        </div>

        <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
        <Button onClick={handleUploadClick} leftIcon={<Upload size={18} />} isLoading={uploadMutation.isPending} className='w-fit'>
          Upload Document
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Storage info */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <h2 className="text-lg font-medium text-gray-900">Storage</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Used</span>
                <span className="font-medium text-gray-900">12.5 GB</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full">
                <div className="h-2 bg-primary-600 rounded-full" style={{ width: '65%' }}></div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Available</span>
                <span className="font-medium text-gray-900">7.5 GB</span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Quick Access</h3>
              <div className="space-y-2">
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">
                  Recent Files
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">
                  Shared with Me
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">
                  Starred
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">
                  Trash
                </button>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Document list */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">All Documents</h2>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  Sort by
                </Button>
                <Button variant="outline" size="sm">
                  Filter
                </Button>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-2">
                {isLoading && <p>Loading documents...</p>}
                {isError && <p className="text-red-500">Failed to load documents.</p>}
                {documents.length === 0 ? (<p>No documents uploaded</p>) :
                  documents.map(doc => (
                    <div
                      key={doc._id}
                      className="flex flex-col sm:flex-row p-4 hover:bg-gray-50 rounded-lg"
                    >
                      {/* Icon + Content */}
                      <div className="flex flex-1">
                        <div className="p-2 bg-primary-50 rounded-lg mr-4">
                          <FileText size={24} className="text-primary-600" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-medium text-gray-900 truncate">{doc.name}</h3>
                            <Badge variant="secondary" size="sm">Shared</Badge>
                          </div>

                          <div className="flex flex-wrap gap-2 sm:gap-4 mt-1 text-sm text-gray-500">
                            <span>{doc.type}</span>
                            <span>{formatBytes(doc.size)}</span>
                            <span>Modified {formatDate(doc.updatedAt)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex justify-end gap-2 mt-3 sm:mt-0 sm:ml-4">
                        <a href={doc.url} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="sm" className="p-2" aria-label="View">
                            <View size={18} />
                          </Button>
                        </a>
                        <a href={doc.url} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="sm" className="p-2" aria-label="Download">
                            <Download size={18} />
                          </Button>
                        </a>
                        <Button variant="ghost" size="sm" className="p-2" aria-label="Share">
                          <Share2 size={18} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-2 text-error-600 hover:text-error-700"
                          aria-label="Delete"
                          onClick={() => handleDelete(doc._id)}
                          isLoading={deleteMutation.isPending && deleteMutation.variables === doc._id}
                        >
                          <Trash2 size={18} />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* RENDER THE MODAL COMPONENT */}
      <DocumentViewer doc={viewingDoc} onClose={() => setViewingDoc(null)} />

    </div>
  );
};