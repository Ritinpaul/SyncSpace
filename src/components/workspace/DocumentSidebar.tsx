"use client";

import { useState, useEffect } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';

interface Document {
    id: string;
    title: string;
    updatedAt: string;
}

interface DocumentSidebarProps {
    onSelectDocument: (docId: string) => void;
    selectedDocId: string | null;
    onNewDocument: () => void;
}

export default function DocumentSidebar({ onSelectDocument, selectedDocId, onNewDocument }: DocumentSidebarProps) {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDocuments();
    }, []);

    const loadDocuments = async () => {
        try {
            const session = await fetchAuthSession();
            const token = session.tokens?.idToken?.toString();

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/documents`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setDocuments(data.documents || []);
            }
        } catch (error) {
            console.error('Failed to load documents:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-64 h-full bg-gray-900 border-r border-gray-700 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-700">
                <h2 className="text-lg font-bold text-white mb-3">Documents</h2>
                <button
                    onClick={onNewDocument}
                    className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Document
                </button>
            </div>

            {/* Document List */}
            <div className="flex-1 overflow-y-auto p-2">
                {loading ? (
                    <div className="flex items-center justify-center h-20">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    </div>
                ) : documents.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-8">No documents yet</p>
                ) : (
                    <ul className="space-y-1">
                        {documents.map((doc) => (
                            <li key={doc.id}>
                                <button
                                    onClick={() => onSelectDocument(doc.id)}
                                    className={`w-full text-left px-3 py-2 rounded-lg transition-all ${selectedDocId === doc.id
                                            ? 'bg-blue-600 text-white'
                                            : 'text-gray-300 hover:bg-gray-800'
                                        }`}
                                >
                                    <div className="font-medium truncate">{doc.title || 'Untitled'}</div>
                                    <div className="text-xs text-gray-400 mt-1">
                                        {new Date(doc.updatedAt).toLocaleDateString()}
                                    </div>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
