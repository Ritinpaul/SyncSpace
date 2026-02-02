"use client";

import { useState, useCallback } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';
import DocumentSidebar from './DocumentSidebar';
import Editor from './Editor';
import AIAssistant from '../AIAssistant';

interface WorkspaceProps {
    user: any;
    signOut: () => void;
}

export default function Workspace({ user, signOut }: WorkspaceProps) {
    const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
    const [documentContent, setDocumentContent] = useState<string>('');
    const [documentTitle, setDocumentTitle] = useState<string>('');

    const handleNewDocument = async () => {
        try {
            const session = await fetchAuthSession();
            const token = session.tokens?.idToken?.toString();

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/documents`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title: 'Untitled Document',
                    content: '<p>Start writing...</p>',
                }),
            });

            if (res.ok) {
                const data = await res.json();
                setSelectedDocId(data.documentId);
                setDocumentTitle('Untitled Document');
                setDocumentContent('<p>Start writing...</p>');
                // Refresh sidebar
                window.location.reload();
            }
        } catch (error) {
            console.error('Failed to create document:', error);
        }
    };

    const handleSelectDocument = async (docId: string) => {
        try {
            const session = await fetchAuthSession();
            const token = session.tokens?.idToken?.toString();

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/documents/${docId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                setSelectedDocId(docId);
                setDocumentTitle(data.title || 'Untitled');
                setDocumentContent(data.content || '');
            }
        } catch (error) {
            console.error('Failed to load document:', error);
        }
    };

    const handleContentChange = (content: string) => {
        setDocumentContent(content);
    };

    const handleInsertAISuggestion = useCallback((suggestion: string) => {
        if (typeof window !== 'undefined' && (window as any).editorInsertContent) {
            (window as any).editorInsertContent(`<p>${suggestion}</p>`);
        }
    }, []);

    return (
        <div className="flex h-screen bg-gray-900">
            {/* Sidebar */}
            <DocumentSidebar
                onSelectDocument={handleSelectDocument}
                selectedDocId={selectedDocId}
                onNewDocument={handleNewDocument}
            />

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <header className="flex items-center justify-between px-6 py-3 bg-gray-800 border-b border-gray-700">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            SyncSpace
                        </h1>
                        {selectedDocId && (
                            <span className="text-gray-400 text-sm">/ {documentTitle}</span>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-gray-400 text-sm">{user?.username}</span>
                        <button
                            onClick={signOut}
                            className="px-4 py-2 text-sm bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-all"
                        >
                            Sign Out
                        </button>
                    </div>
                </header>

                {/* Editor & AI Panel */}
                <div className="flex-1 flex overflow-hidden">
                    {selectedDocId ? (
                        <>
                            {/* Editor */}
                            <div className="flex-1 p-4">
                                <Editor
                                    documentId={selectedDocId}
                                    initialContent={documentContent}
                                    onContentChange={handleContentChange}
                                    wsEndpoint={process.env.NEXT_PUBLIC_WS_ENDPOINT || ''}
                                />
                            </div>

                            {/* AI Panel */}
                            <div className="w-80 p-4 border-l border-gray-700 overflow-y-auto">
                                <AIAssistant
                                    documentId={selectedDocId}
                                    content={documentContent}
                                    onInsertSuggestion={handleInsertAISuggestion}
                                />
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <div className="text-6xl mb-4">📄</div>
                                <h2 className="text-2xl font-bold text-white mb-2">No Document Selected</h2>
                                <p className="text-gray-400 mb-6">Create a new document or select one from the sidebar</p>
                                <button
                                    onClick={handleNewDocument}
                                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg font-medium transition-all"
                                >
                                    Create New Document
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
