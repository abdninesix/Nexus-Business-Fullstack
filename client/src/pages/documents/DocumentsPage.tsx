import React, { useMemo, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Upload, Trash2, Share2, View, UserPlus, Send, PencilIcon, FileCheck } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import toast from 'react-hot-toast';
import Modal from 'react-modal';
import { uploadDocument, deleteDocument, Document, fetchMyDocuments, shareDocument, requestSignature, signDocument } from '../../api/documents';
import { DocumentViewer } from '../../components/documentViewer/DocumentViewer';
import { CollaborationRequest, fetchReceivedRequests, fetchSentRequests } from '../../api/collaborations';
import { User } from '../../types';
import { useAuth } from '../../context/AuthContext';

const modalStyles = {
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    zIndex: 50, // High z-index to appear over everything
  },
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    width: '90%',
    maxWidth: '500px',
    border: 'none',
    padding: '2rem',
    borderRadius: '0.5rem',
    zIndex: 51, // Higher than the overlay
  },
};

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

  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [viewingDoc, setViewingDoc] = useState<Document | null>(null);
  const [shareActionDoc, setShareActionDoc] = useState<Document | null>(null);
  const [signActionDoc, setSignActionDoc] = useState<Document | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState('');

  // === DATA FETCHING ===
  const { data: allMyRelevantDocuments = [], isLoading, isError } = useQuery<Document[]>({
    queryKey: ['dashboardDocuments'], // Use a new key to avoid cache conflicts
    queryFn: fetchMyDocuments, // This API function still works, it just hits the new backend logic
  });

  const isInvestor = currentUser?.role === 'investor';
  const connectionsQueryFn = isInvestor ? fetchSentRequests : fetchReceivedRequests;
  const { data: requests = [] } = useQuery<CollaborationRequest[]>({
    queryKey: [isInvestor ? 'sentRequests' : 'receivedRequests'],
    queryFn: connectionsQueryFn,
    // enabled: !!signActionDoc,
  });

  const connections = useMemo(() => requests
    .filter(r => r.status === 'accepted')
    .map(r => isInvestor ? r.entrepreneurId : r.investorId)
    .filter((u): u is User => typeof u === 'object'), [requests, isInvestor]);

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

  const shareMutation = useMutation({
    mutationFn: shareDocument,
    onSuccess: () => { toast.success("Document shared!"); queryClient.invalidateQueries({ queryKey: ['myDocuments'] }); setShareActionDoc(null); },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to share.")
  });

  const requestSignatureMutation = useMutation({
    mutationFn: requestSignature,
    onSuccess: () => { toast.success("Signature request sent!"); queryClient.invalidateQueries({ queryKey: ['myDocuments'] }); setShareActionDoc(null); },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to send request.")
  });

  const signDocumentMutation = useMutation({
    mutationFn: signDocument,
    onSuccess: () => { toast.success("Document signed successfully!"); queryClient.invalidateQueries({ queryKey: ['myDocuments'] }); setSignActionDoc(null); },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to sign.")
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

  const handleShare = () => {
    if (!shareActionDoc || !selectedConnectionId) return;
    shareMutation.mutate({ id: shareActionDoc._id, shareWithUserId: selectedConnectionId });
  };

  const handleRequestSignature = () => {
    if (!shareActionDoc || !selectedConnectionId) return;
    requestSignatureMutation.mutate({ id: shareActionDoc._id, signerId: selectedConnectionId });
  };

  const handleSign = () => {
    if (!signActionDoc) return;
    signDocumentMutation.mutate(signActionDoc._id);
  };

  const handleDelete = (documentId: string) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      deleteMutation.mutate(documentId);
    }
  };

  // --- DERIVED DATA for UI ---
  const myDocuments = allMyRelevantDocuments.filter(doc => {
    // First, check if uploadedBy is an object (it should be, since it's populated)
    if (typeof doc.uploadedBy === 'object' && doc.uploadedBy !== null) {
      // Compare the ID *inside* the object
      return doc.uploadedBy._id === currentUser?._id;
    }
    // Fallback for older data or if population fails: check if it's a string
    return doc.uploadedBy === currentUser?._id;
  });
  const awaitingMySignature = allMyRelevantDocuments.filter(doc =>
    // The type guard is still important
    typeof doc.signer === 'object' && doc.signer !== null &&
    doc.signer._id === currentUser?._id &&
    doc.status === 'Awaiting Signature'
  );

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
        <div className="lg:col-span-3 space-y-6">
          {awaitingMySignature.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-medium text-gray-900">Awaiting Your Signature</h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-2">
                  {awaitingMySignature.map(doc => (
                    <div key={doc._id} className="flex flex-col sm:flex-row p-4 hover:bg-amber-50 rounded-lg">
                      {/* Icon and Content */}
                      <div className="flex flex-1 items-center">
                        <div className="p-2 bg-white rounded-lg mr-4">
                          <FileText size={24} className="text-amber-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-medium text-gray-900 truncate">{doc.name}</h3>
                            <Badge>{doc.status}</Badge>
                          </div>
                          {typeof doc.uploadedBy === 'object' && doc.uploadedBy !== null && (
                            <p className="text-sm text-gray-500 mt-1">
                              Request from: <span className="font-medium">{doc.uploadedBy.name}</span>
                            </p>
                          )}
                        </div>
                      </div>
                      {/* Actions */}
                      <div className="flex justify-end gap-2 mt-3 sm:mt-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label="View Document"
                          onClick={() => setViewingDoc(doc)}
                        >
                          <View size={18} />
                        </Button>
                        <Button
                          size="sm"
                          className="text-amber-600"
                          variant="ghost" // Use a primary color for the main action
                          onClick={() => { setSignActionDoc(doc) }}
                        >
                          <PencilIcon size={18} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">My Documents</h2>
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
                {myDocuments.length === 0 ? (<p>No documents uploaded</p>) :
                  myDocuments.map(doc => (
                    <div
                      key={doc._id}
                      className="flex flex-col sm:flex-row p-4 hover:bg-gray-50 rounded-lg0"
                    >
                      {/* Icon + Content */}
                      <div className="flex flex-1">
                        <div className="p-2 bg-primary-50 rounded-lg mr-4">
                          <FileText size={24} className="text-primary-600" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-medium text-gray-900 truncate">{doc.name}</h3>
                            <Badge>{doc.status}</Badge>
                          </div>

                          <div className="flex flex-wrap gap-2 sm:gap-4 mt-1 text-sm text-gray-500">
                            <span>{formatBytes(doc.size)}</span>
                            <span>Modified {formatDate(doc.updatedAt)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 mt-3 sm:mt-0">
                        <Button size="sm" variant="ghost" onClick={() => setViewingDoc(doc)}><View size={18} /></Button>
                        <Button size="sm" variant="ghost" onClick={() => setShareActionDoc(doc)}><Share2 size={18} /></Button>
                        {doc.status === 'Signed' &&
                          <a href={doc.signedUrl} target="_blank" rel="noreferrer" className="flex items-center"><Button size="sm" variant="ghost" className='h-full text-green-600'><FileCheck size={18} /></Button></a>
                        }
                        <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDelete(doc._id)} isLoading={deleteMutation.isPending && deleteMutation.variables === doc._id}><Trash2 size={18} /></Button>
                      </div>
                    </div>
                  ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Document Viewer Modal */}
      <DocumentViewer doc={viewingDoc} onClose={() => setViewingDoc(null)} />

      {/* Share / Request Signature Modal */}
      <Modal isOpen={!!shareActionDoc} onRequestClose={() => setShareActionDoc(null)} style={modalStyles}>
        {shareActionDoc && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Manage "{shareActionDoc.name}"</h2>
            <p className="text-sm text-gray-600">Select a connection to share with or request a signature from.</p>
            <select onChange={e => setSelectedConnectionId(e.target.value)} className="w-full p-2 border rounded-md">
              <option>-- Select a Connection --</option>
              {connections.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShareActionDoc(null)}>Cancel</Button>
              {isInvestor && <Button leftIcon={<Send size={16} />} onClick={handleRequestSignature}>Request Signature</Button>}
              <Button leftIcon={<UserPlus size={16} />} onClick={handleShare}>Share Access</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Sign Document Modal */}
      <Modal isOpen={!!signActionDoc} onRequestClose={() => setSignActionDoc(null)} style={modalStyles}>
        {signActionDoc && (
          <div className="space-y-2 text-center">
            <h2 className="text-xl font-bold">Sign Document</h2>
            <p>You are about to electronically sign <span className="font-semibold">{signActionDoc.name}</span>.</p>
            <div className="p-4 bg-gray-50 rounded-md">
              <p className="text-xs text-gray-600">By clicking "Sign", you agree that your signature is the electronic equivalent of your handwritten signature.</p>
            </div>
            <div className="flex justify-center gap-4 pt-4">
              <Button variant="outline" onClick={() => setSignActionDoc(null)}>Cancel</Button>
              <Button variant="success" onClick={handleSign} isLoading={signDocumentMutation.isPending}>Sign Document</Button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};