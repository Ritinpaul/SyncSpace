"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useRef, useCallback } from 'react';

interface EditorProps {
    documentId: string;
    initialContent?: string;
    onContentChange?: (content: string) => void;
    wsEndpoint: string;
}

export default function Editor({ documentId, initialContent, onContentChange, wsEndpoint }: EditorProps) {
    const wsRef = useRef<WebSocket | null>(null);
    const isRemoteUpdate = useRef(false);

    const editor = useEditor({
        extensions: [StarterKit],
        content: initialContent || '<p>Start typing...</p>',
        editorProps: {
            attributes: {
                class: 'prose prose-invert max-w-none focus:outline-none min-h-[400px] p-4',
            },
        },
        onUpdate: ({ editor }) => {
            if (isRemoteUpdate.current) {
                isRemoteUpdate.current = false;
                return;
            }

            const html = editor.getHTML();
            onContentChange?.(html);

            // Send to WebSocket
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({
                    action: 'sendMessage',
                    documentId,
                    type: 'edit',
                    content: html,
                    afterText: html,
                }));
            }
        },
    });

    // WebSocket connection
    useEffect(() => {
        if (!documentId || !wsEndpoint) return;

        const ws = new WebSocket(`${wsEndpoint}?documentId=${documentId}&userId=user`);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log('WebSocket connected');
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'edit' && data.content && editor) {
                    isRemoteUpdate.current = true;
                    editor.commands.setContent(data.content);
                }
            } catch (e) {
                console.error('WebSocket message error:', e);
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        return () => {
            ws.close();
        };
    }, [documentId, wsEndpoint, editor]);

    // Method to insert AI suggestion
    const insertContent = useCallback((content: string) => {
        if (editor) {
            editor.chain().focus().insertContent(content).run();
        }
    }, [editor]);

    // Expose insertContent method
    useEffect(() => {
        if (typeof window !== 'undefined') {
            (window as any).editorInsertContent = insertContent;
        }
    }, [insertContent]);

    if (!editor) return null;

    return (
        <div className="flex-1 flex flex-col bg-gray-800 rounded-lg overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center gap-1 p-2 border-b border-gray-700 bg-gray-900">
                <button
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`p-2 rounded hover:bg-gray-700 ${editor.isActive('bold') ? 'bg-gray-700 text-blue-400' : 'text-gray-300'}`}
                    title="Bold"
                >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3 4a1 1 0 011-1h5.5a3.5 3.5 0 012.854 5.515A3.5 3.5 0 0110.5 15H4a1 1 0 01-1-1V4zm4.5 5H6v4h3.5a1.5 1.5 0 000-3H7.5zm0-4H6v2h2.5a1 1 0 100-2H7.5z" />
                    </svg>
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`p-2 rounded hover:bg-gray-700 ${editor.isActive('italic') ? 'bg-gray-700 text-blue-400' : 'text-gray-300'}`}
                    title="Italic"
                >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8 4a1 1 0 011-1h6a1 1 0 110 2h-2.268l-3.464 10H12a1 1 0 110 2H6a1 1 0 110-2h2.268l3.464-10H9a1 1 0 01-1-1z" />
                    </svg>
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    className={`p-2 rounded hover:bg-gray-700 ${editor.isActive('strike') ? 'bg-gray-700 text-blue-400' : 'text-gray-300'}`}
                    title="Strikethrough"
                >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 3a1 1 0 01.894.553l6 12a1 1 0 01-1.788.894L13.618 13H6.382l-1.488 2.447a1 1 0 11-1.788-.894l6-12A1 1 0 0110 3z" />
                    </svg>
                </button>
                <div className="w-px h-6 bg-gray-600 mx-1"></div>
                <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    className={`p-2 rounded hover:bg-gray-700 ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-700 text-blue-400' : 'text-gray-300'}`}
                    title="Heading 1"
                >
                    H1
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={`p-2 rounded hover:bg-gray-700 ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-700 text-blue-400' : 'text-gray-300'}`}
                    title="Heading 2"
                >
                    H2
                </button>
                <div className="w-px h-6 bg-gray-600 mx-1"></div>
                <button
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={`p-2 rounded hover:bg-gray-700 ${editor.isActive('bulletList') ? 'bg-gray-700 text-blue-400' : 'text-gray-300'}`}
                    title="Bullet List"
                >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 100 2 1 1 0 000-2zm4 0a1 1 0 000 2h10a1 1 0 100-2H7zm0 5a1 1 0 000 2h10a1 1 0 100-2H7zm0 5a1 1 0 000 2h10a1 1 0 100-2H7zm-4-5a1 1 0 100 2 1 1 0 000-2zm0 5a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                    </svg>
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={`p-2 rounded hover:bg-gray-700 ${editor.isActive('orderedList') ? 'bg-gray-700 text-blue-400' : 'text-gray-300'}`}
                    title="Numbered List"
                >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h.5a.5.5 0 01.5.5v2a.5.5 0 01-.5.5H4a1 1 0 110-2zm4 0a1 1 0 000 2h10a1 1 0 100-2H7zm0 5a1 1 0 000 2h10a1 1 0 100-2H7zm0 5a1 1 0 000 2h10a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                    className={`p-2 rounded hover:bg-gray-700 ${editor.isActive('codeBlock') ? 'bg-gray-700 text-blue-400' : 'text-gray-300'}`}
                    title="Code Block"
                >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>

            {/* Editor Content */}
            <div className="flex-1 overflow-y-auto">
                <EditorContent editor={editor} className="h-full" />
            </div>
        </div>
    );
}
