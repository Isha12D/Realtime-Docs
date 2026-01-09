import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';

export default function DocumentEditor() {
  const { docId } = useParams();
  const [document, setDocument] = useState(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [collaborators, setCollaborators] = useState([]);
  const [isSaved, setIsSaved] = useState(true);
  const [charCount, setCharCount] = useState(0);
  const { token, user } = useAuth();
  const { socket, isConnected, joinRoom, leaveRoom, sendEdit } = useWebSocket();
  const navigate = useNavigate();
  const saveTimeoutRef = useRef(null);
  const contentRef = useRef(content);

  useEffect(() => {
    fetchDocument();
  }, [docId, token]);

  useEffect(() => {
    if (socket && docId) {
      joinRoom(docId);

      socket.on('document_content', (data) => {
        setContent(data.content);
        contentRef.current = data.content;
      });

      socket.on('document_updated', (data) => {
        setContent(data.content);
        contentRef.current = data.content;
      });

      socket.on('collaborators_list', (data) => {
        setCollaborators(data.collaborators);
      });

      socket.on('user_joined', (data) => {
        setCollaborators(data.collaborators);
      });

      socket.on('user_left', (data) => {
        setCollaborators(data.collaborators);
      });

      return () => {
        leaveRoom(docId);
        socket.off('document_content');
        socket.off('document_updated');
        socket.off('collaborators_list');
        socket.off('user_joined');
        socket.off('user_left');
      };
    }
  }, [socket, docId, joinRoom, leaveRoom]);

  const fetchDocument = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/documents/${docId}`, {
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
    setContent(newContent);
    contentRef.current = newContent;
    setCharCount(newContent.length);
    setIsSaved(false);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveDocument(newContent);
    }, 1000);
  };

  const saveDocument = async (docContent) => {
    try {
      const response = await fetch(`http://localhost:5000/api/documents/${docId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: docContent }),
      });

      if (response.ok) {
        setIsSaved(true);
        if (socket) {
          sendEdit(docId, { content: docContent });
        }
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
    </div>
  );
}
