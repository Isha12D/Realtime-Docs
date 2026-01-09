import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DocumentCard from '../components/DocumentCard';
import NewDocumentModal from '../components/NewDocumentModal';

export default function Dashboard() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNewDocModal, setShowNewDocModal] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDocuments();
  }, [token]);

  const fetchDocuments = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/documents', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setDocuments(data.documents);
      }
    } catch (error) {
      setError('Failed to fetch documents');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const createDocument = async (e) => {
    e.preventDefault();
    if (!newDocName.trim()) return;

    try {
      const response = await fetch('http://localhost:5000/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: newDocName }),
      });

      const data = await response.json();
      if (response.ok) {
        setDocuments([...documents, data.document]);
        setNewDocName('');
        setShowNewDocModal(false);
      }
    } catch (error) {
      setError('Failed to create document');
      console.error(error);
    }
  };

  const deleteDocument = async (docId) => {
    if (!window.confirm('Delete this document?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/documents/${docId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setDocuments(documents.filter((doc) => doc._id !== docId));
      }
    } catch (error) {
      setError('Failed to delete document');
      console.error(error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-indigo-100 selection:text-indigo-900">
      <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg shadow-indigo-200">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
              DocSync
            </h1>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-gray-500 font-medium text-sm hidden sm:block">
              Welcome, <span className="text-gray-900">{user?.name}</span>
            </span>
            <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>
            <button
              onClick={handleLogout}
              className="text-gray-500 hover:text-red-600 transition-colors font-medium text-sm"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
          <div>
            <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">Your Documents</h2>
            <p className="text-gray-500 mt-2 text-lg">Manage and collaborate on your projects.</p>
          </div>
          <button
            onClick={() => setShowNewDocModal(true)}
            className="group px-6 py-3 bg-gray-900 hover:bg-black text-white rounded-xl transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5 font-medium flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Document
          </button>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-center gap-3">
             <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
             {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              <p className="text-gray-400 text-sm font-medium">Loading your library...</p>
            </div>
          </div>
        ) : documents.length === 0 ? (
          <div className="bg-white/50 border border-dashed border-gray-300 rounded-2xl p-20 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6.586a1 1 0 011.414.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2h-1zm-9-6h6m6 0v6" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No documents yet</h3>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto">
              Get started by creating your first document and inviting your team to collaborate.
            </p>
            <button
              onClick={() => setShowNewDocModal(true)}
              className="text-indigo-600 font-semibold hover:text-indigo-700 hover:underline underline-offset-2"
            >
              Create your first document &rarr;
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {documents.map((doc) => (
              <DocumentCard
                key={doc._id}
                doc={doc}
                onOpen={(id) => navigate(`/editor/${id}`)}
                onDelete={deleteDocument}
              />
            ))}
          </div>
        )}
      </div>

      <NewDocumentModal
        isOpen={showNewDocModal}
        onClose={() => setShowNewDocModal(false)}
        onSubmit={createDocument}
        value={newDocName}
        onChange={(e) => setNewDocName(e.target.value)}
      />
    </div>
  );
}
