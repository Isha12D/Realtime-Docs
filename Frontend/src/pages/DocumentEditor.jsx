import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import config from '../config';

export default function DocumentEditor() {
  const { docId } = useParams();
  const [document, setDocument] = useState(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [collaborators, setCollaborators] = useState([]);
  const [isSaved, setIsSaved] = useState(true);
  const [charCount, setCharCount] = useState(0);
  const [versions, setVersions] = useState([]);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const { token, user } = useAuth();
  const { socket, isConnected, joinRoom, leaveRoom, sendEdit } = useWebSocket();
  const navigate = useNavigate();
  const saveTimeoutRef = useRef(null);
  const contentRef = useRef(content);
  const isTypingRef = useRef(false);

  useEffect(() => {
    fetchDocument();
  }, [docId, token]);

  useEffect(() => {
    if (socket && docId && isConnected) {
      console.log('Joining document room:', docId);
      joinRoom(docId);

      // Listen for real-time updates from other users
      socket.on('document_updated', (data) => {
        console.log('Received update from another user:', data);
        // Only update if user is not currently typing
        if (!isTypingRef.current && data.content !== contentRef.current) {
          setContent(data.content);
          contentRef.current = data.content;
          setCharCount(data.content?.length || 0);
        }
      });

      socket.on('user_joined', (data) => {
        console.log('User joined the document:', data);
      });

      socket.on('user_left', (data) => {
        console.log('User left the document:', data);
      });

      return () => {
        console.log('Leaving document room:', docId);
        leaveRoom(docId);
        socket.off('document_updated');
        socket.off('user_joined');
        socket.off('user_left');
      };
    }
  }, [socket, docId, isConnected, joinRoom, leaveRoom]);

  const fetchDocument = async () => {
    try {
      const response = await fetch(`${config.api.baseURL}/api/documents/${docId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setDocument(data.document);
        setContent(data.document.content || '');
        contentRef.current = data.document.content || '';
        setCharCount(data.document.content?.length || 0);
      } else {
        setError('Document not found');
      }
    } catch (error) {
      setError('Failed to load document');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleContentChange = (e) => {
    const newContent = e.target.value;
    isTypingRef.current = true;
    setContent(newContent);
    contentRef.current = newContent;
    setCharCount(newContent.length);
    setIsSaved(false);

    // Send changes immediately to other users
    if (socket && isConnected) {
      console.log('Sending changes to other users');
      sendEdit(docId, { content: newContent });
    }

    // Debounce save to database
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveDocument(newContent);
      isTypingRef.current = false;
    }, 1000);
  };

  const saveDocument = async (docContent) => {
    try {
      const response = await fetch(`${config.api.baseURL}/api/documents/${docId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: docContent }),
      });

      if (response.ok) {
        setIsSaved(true);
        console.log('Document saved to database');
      }
    } catch (error) {
      setError('Failed to save document');
      console.error(error);
    }
  };

  const handleGoBack = () => {
    if (!isSaved) {
      if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
        navigate('/dashboard');
      }
    } else {
      navigate('/dashboard');
    }
  };

  const fetchVersionHistory = async () => {
    try {
      const response = await fetch(`${config.api.baseURL}/api/documents/${docId}/versions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setVersions(data.versions);
      }
    } catch (error) {
      console.error('Failed to fetch version history:', error);
    }
  };

  const handleRevert = async (versionNumber) => {
    if (!window.confirm(`Revert to Version ${versionNumber}?`)) return;

    try {
      const response = await fetch(`${config.api.baseURL}/api/documents/${docId}/revert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ versionNumber }),
      });

      const data = await response.json();
      if (response.ok) {
        setContent(data.document.content);
        contentRef.current = data.document.content;
        setCharCount(data.document.content?.length || 0);
        setShowVersionHistory(false);
        
        // Broadcast the reverted content to other users
        if (socket && isConnected) {
          sendEdit(docId, { content: data.document.content });
        }
        
        alert('Document reverted successfully!');
      }
    } catch (error) {
      console.error('Failed to revert:', error);
      alert('Failed to revert document');
    }
  };

  const toggleVersionHistory = () => {
    if (!showVersionHistory) {
      fetchVersionHistory();
    }
    setShowVersionHistory(!showVersionHistory);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin"></div>
          <span className="text-gray-500 font-medium">Loading document...</span>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl max-w-sm border border-gray-100">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
             <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
             </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Document Unavailable</h1>
          <p className="text-gray-500 mb-6">The document you're looking for doesn't exist or you don't have permission to access it.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full px-5 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-black transition font-medium"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      <header className="bg-white border-b border-gray-200 z-10 flex-none h-16">
        <div className="h-full px-4 sm:px-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={handleGoBack}
              className="p-2 -ml-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
              title="Back"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div className="h-6 w-px bg-gray-200"></div>
            <div className="flex flex-col">
              <h1 className="text-lg font-semibold text-gray-900 leading-tight truncate max-w-xs sm:max-w-md">
                {document.title}
              </h1>
              <div className="flex items-center gap-2">
                <span className={`flex items-center gap-1.5 text-xs font-medium ${isSaved ? 'text-green-600' : 'text-amber-500'}`}>
                   {isSaved ? (
                     <>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        Saved
                     </>
                   ) : (
                     <>
                        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Saving...
                     </>
                   )}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-6">
            <button
              onClick={toggleVersionHistory}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all border border-gray-200 hover:border-indigo-300"
              title="Version History"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              History
            </button>

            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${isConnected ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
              {isConnected ? 'LIVE' : 'OFFLINE'}
            </div>

            <div className="flex items-center -space-x-3">
              {collaborators.map((collab, idx) => (
                <div
                  key={idx}
                  className="w-9 h-9 rounded-full ring-2 ring-white bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold shadow-sm cursor-help hover:scale-110 transition-transform z-10 relative"
                  title={collab.name || 'Anonymous'}
                >
                  {collab.name ? collab.name.charAt(0).toUpperCase() : '?'}
                </div>
              ))}
              <div className="w-9 h-9 rounded-full ring-2 ring-white bg-gray-100 flex items-center justify-center text-gray-500 text-xs font-bold shadow-sm z-0">
                +{collaborators.length}
              </div>
            </div>
          </div>
        </div>
      </header>

      {error && (
        <div className="bg-red-50 px-4 py-2 text-center text-red-600 text-sm font-medium border-b border-red-100 animate-in slide-in-from-top duration-300">
          {error}
        </div>
      )}

      <main className="flex-1 overflow-hidden relative flex flex-col bg-gray-50 md:p-8">
        <div className="mx-auto w-full max-w-4xl h-full flex flex-col bg-white md:rounded-xl md:shadow-lg border border-gray-200/60 overflow-hidden ring-1 ring-gray-900/5">
          <div className="flex-none px-6 py-2 border-b border-gray-100 flex justify-between items-center text-xs text-gray-400 font-mono bg-gray-50/50">
             <span>Ln {content.split('\n').length}, Col {charCount}</span>
             <span>{content.split(/\s+/).filter(Boolean).length} Words</span>
          </div>
          
          <textarea
            value={content}
            onChange={handleContentChange}
            className="flex-1 w-full p-8 md:p-12 resize-none focus:outline-none font-serif text-lg leading-relaxed text-gray-800 placeholder-gray-300 selection:bg-indigo-100 selection:text-indigo-900"
            placeholder="Type your masterpiece here..."
            spellCheck="false"
          />
        </div>
      </main>

      {/* Version History Sidebar */}
      {showVersionHistory && (
        <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl border-l border-gray-200 z-50 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Version History</h2>
            <button
              onClick={() => setShowVersionHistory(false)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {versions.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>No version history yet</p>
              </div>
            ) : (
              versions.map((version) => (
                <div
                  key={version._id}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        Version {version.versionNumber}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(version.savedAt).toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRevert(version.versionNumber)}
                      className="px-3 py-1 text-xs font-medium text-indigo-600 hover:text-white hover:bg-indigo-600 border border-indigo-600 rounded-lg transition opacity-0 group-hover:opacity-100"
                    >
                      Revert
                    </button>
                  </div>
                  <div className="text-xs text-gray-600">
                    Saved by: {version.savedBy?.name || 'Unknown'}
                  </div>
                  <div className="mt-2 text-xs text-gray-400 font-mono bg-white p-2 rounded border border-gray-200 max-h-20 overflow-hidden">
                    {version.content.substring(0, 100)}...
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
