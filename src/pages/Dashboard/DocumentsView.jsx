// src/pages/Dashboard/DocumentsView.jsx
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import {
  FiUpload,
  FiDownload,
  FiTrash2,
  FiEdit2,
  FiFile,
  FiFolder,
  FiSearch,
  FiX,
  FiCheck,
  FiAlertCircle,
  FiEye,
  FiMaximize2,
  FiMinimize2
} from 'react-icons/fi';

const DocumentViewer = ({ url, type, name, onClose }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    // Check if URL is accessible
    fetch(url)
      .then(response => {
        if (!response.ok) throw new Error('Failed to load preview');
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Preview error:', err);
        setError(err.message);
        setIsLoading(false);
      });
  }, [url]);

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const getViewer = () => {
    if (isLoading) return <div className="text-medium-text">Loading preview...</div>;
    if (error) return <div className="text-red-400">Error loading preview: {error}</div>;
    if (!url) return <div className="text-medium-text">Preview URL not available</div>;

    // Image files
    if (type.startsWith('image/')) {
      return (
        <img 
          src={url} 
          alt={name} 
          className="max-w-full h-auto max-h-[70vh] object-contain"
          onError={(e) => {
            console.error('Image load error:', e);
            setError('Failed to load image');
          }}
        />
      );
    }
    
    // PDF files
    if (type === 'application/pdf') {
      return (
        <iframe
          src={`${url}#toolbar=0`}
          className="w-full h-[70vh] border-0"
          title={name}
          onError={(e) => {
            console.error('PDF load error:', e);
            setError('Failed to load PDF');
          }}
        />
      );
    }
    
    // Text files and JSON
    if (type.startsWith('text/') || type === 'application/json') {
      return (
        <iframe
          src={url}
          className="w-full h-[70vh] border-0 bg-white"
          title={name}
          onError={(e) => {
            console.error('Text load error:', e);
            setError('Failed to load text file');
          }}
        />
      );
    }

    // Microsoft Office files
    if (type.includes('officedocument') || type.includes('msword') || type.includes('ms-excel') || type.includes('ms-powerpoint')) {
      const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
      return (
        <iframe
          src={officeViewerUrl}
          className="w-full h-[70vh] border-0"
          title={name}
          onError={(e) => {
            console.error('Office document load error:', e);
            setError('Failed to load Office document');
          }}
        />
      );
    }

    // Default for unsupported file types
    return (
      <div className="text-medium-text text-center py-8">
        <FiFile size={48} className="mx-auto mb-4" />
        <p>Preview not available for this file type ({type})</p>
        <p className="text-sm mt-2">Please download the file to view it.</p>
      </div>
    );
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm ${isFullscreen ? 'overflow-hidden' : ''}`}>
      <div 
        className={`bg-navbar-grey rounded-lg shadow-xl relative overflow-hidden
          ${isFullscreen ? 'fixed inset-0 m-0 rounded-none' : 'max-w-4xl w-full max-h-[90vh]'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-light-text truncate mr-4">{name}</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleFullscreen}
              className="p-2 text-medium-text hover:text-light-text rounded-md hover:bg-pleasant-grey"
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? <FiMinimize2 size={20} /> : <FiMaximize2 size={20} />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-medium-text hover:text-light-text rounded-md hover:bg-pleasant-grey"
              title="Close preview"
            >
              <FiX size={20} />
            </button>
          </div>
        </div>
        
        <div className={`p-4 ${isFullscreen ? 'h-[calc(100vh-4rem)]' : ''}`}>
          {getViewer()}
        </div>
      </div>
    </div>
  );
};

const DocumentsView = () => {
  const { session } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const [editingDocId, setEditingDocId] = useState(null);
  const [newName, setNewName] = useState('');
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchDocuments();
  }, [session]);

  const fetchDocuments = async () => {
    if (!session?.user) {
      setError("Please log in to view documents");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !session?.user) return;

    try {
      setUploading(true);
      setError(null);

      // 1. Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${session.user.id}/${fileName}`;

      console.log('Attempting to upload file:', { fileName, filePath, fileSize: file.size, fileType: file.type });

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error(uploadError.message || 'Error uploading file to storage');
      }

      console.log('File uploaded successfully:', uploadData);

      // 2. Create database record
      const { data, error: dbError } = await supabase
        .from('documents')
        .insert({
          user_id: session.user.id,
          name: file.name,
          file_path: filePath,
          size: file.size,
          type: file.type
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database insert error:', dbError);
        // If db insert fails, try to clean up the uploaded file
        await supabase.storage.from('documents').remove([filePath]);
        throw new Error(dbError.message || 'Error creating document record');
      }

      setDocuments(prev => [data, ...prev]);
      event.target.value = ''; // Reset file input
    } catch (err) {
      console.error('Error uploading document:', err);
      setError(err.message || 'Failed to upload document. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(doc.file_path);

      if (error) throw error;

      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading document:', err);
      setError('Failed to download document');
    }
  };

  const handleDelete = async (doc) => {
    if (!window.confirm(`Are you sure you want to delete "${doc.name}"?`)) return;

    try {
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([doc.file_path]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', doc.id);

      if (dbError) throw dbError;

      setDocuments(prev => prev.filter(d => d.id !== doc.id));
    } catch (err) {
      console.error('Error deleting document:', err);
      setError('Failed to delete document');
    }
  };

  const startEditing = (doc) => {
    setEditingDocId(doc.id);
    setNewName(doc.name);
  };

  const handleRename = async (doc) => {
    if (!newName.trim() || newName === doc.name) {
      setEditingDocId(null);
      return;
    }

    try {
      const { error } = await supabase
        .from('documents')
        .update({ name: newName.trim() })
        .eq('id', doc.id);

      if (error) throw error;

      setDocuments(prev =>
        prev.map(d => d.id === doc.id ? { ...d, name: newName.trim() } : d)
      );
    } catch (err) {
      console.error('Error renaming document:', err);
      setError('Failed to rename document');
    } finally {
      setEditingDocId(null);
    }
  };

  const handlePreview = async (doc) => {
    try {
      setPreviewDoc(doc);
      setError(null);

      // Don't apply image transformations for non-image files
      const options = {
        download: false,
        transform: doc.type.startsWith('image/') ? { quality: 75 } : undefined
      };

      const { data, error: signedError } = await supabase.storage
        .from('documents')
        .createSignedUrl(doc.file_path, 3600, options);

      if (signedError) {
        console.error('Signed URL error:', signedError);
        throw new Error('Failed to generate preview URL');
      }

      setPreviewUrl(data.signedUrl);
    } catch (err) {
      console.error('Error getting preview URL:', err);
      setError('Failed to load document preview. ' + err.message);
      setPreviewDoc(null);
      setPreviewUrl(null);
    }
  };

  const closePreview = () => {
    setPreviewDoc(null);
    setPreviewUrl(null);
  };

  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!session) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-semibold text-light-text mb-4">Documents</h2>
        <p className="text-medium-text">Please log in to view your documents.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h2 className="text-2xl font-semibold text-light-text mb-4 md:mb-0">Documents</h2>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-medium-text" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-pleasant-grey border border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-accent-teal text-light-text placeholder-medium-text w-full sm:w-64"
            />
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-accent-teal hover:bg-accent-teal-hover text-white rounded-md transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiUpload size={18} />
            {uploading ? 'Uploading...' : 'Upload Document'}
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-md flex items-center gap-2 text-red-400">
          <FiAlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {previewDoc && previewUrl && (
        <DocumentViewer
          url={previewUrl}
          type={previewDoc.type}
          name={previewDoc.name}
          onClose={closePreview}
        />
      )}

      {isLoading ? (
        <div className="text-medium-text">Loading documents...</div>
      ) : filteredDocuments.length === 0 ? (
        <div className="text-medium-text">
          {searchQuery ? 'No documents match your search.' : 'No documents uploaded yet.'}
        </div>
      ) : (
        <div className="bg-navbar-grey rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-pleasant-grey">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-medium-text uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-medium-text uppercase tracking-wider">Size</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-medium-text uppercase tracking-wider">Type</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-medium-text uppercase tracking-wider">Uploaded</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-medium-text uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-pleasant-grey/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingDocId === doc.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="px-2 py-1 bg-pleasant-grey border border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-accent-teal text-light-text w-full"
                            autoFocus
                          />
                          <button
                            onClick={() => handleRename(doc)}
                            className="text-green-500 hover:text-green-400"
                          >
                            <FiCheck size={18} />
                          </button>
                          <button
                            onClick={() => setEditingDocId(null)}
                            className="text-red-500 hover:text-red-400"
                          >
                            <FiX size={18} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <FiFile className="mr-2 text-medium-text" size={18} />
                          <span className="text-light-text">{doc.name}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-medium-text">
                      {formatFileSize(doc.size)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-medium-text">
                      {doc.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-medium-text">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end items-center gap-3">
                        <button
                          onClick={() => handlePreview(doc)}
                          className="text-accent-teal hover:text-accent-teal-hover"
                          title="Preview"
                        >
                          <FiEye size={18} />
                        </button>
                        <button
                          onClick={() => handleDownload(doc)}
                          className="text-accent-teal hover:text-accent-teal-hover"
                          title="Download"
                        >
                          <FiDownload size={18} />
                        </button>
                        <button
                          onClick={() => startEditing(doc)}
                          className="text-accent-teal hover:text-accent-teal-hover"
                          title="Rename"
                        >
                          <FiEdit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(doc)}
                          className="text-red-500 hover:text-red-400"
                          title="Delete"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsView;