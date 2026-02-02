import { useState } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';

export default function AIAssistant({ documentId, content }: { documentId?: string; content?: string }) {
    const [prompt, setPrompt] = useState('');
    const [suggestion, setSuggestion] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const askAI = async () => {
        if (!prompt.trim()) return;

        setLoading(true);
        setError('');
        setSuggestion('');

        try {
            const session = await fetchAuthSession();
            const token = session.tokens?.idToken?.toString();

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/ai/suggest`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    documentId: documentId || 'default',
                    content: content || '',
                    prompt
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to get AI suggestion');
            }

            setSuggestion(data.suggestion);
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-2xl p-6 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl shadow-lg border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-500 rounded-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">AI Assistant</h3>
                <span className="ml-auto text-xs px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                    Mistral 7B
                </span>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Ask AI for help
                    </label>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="E.g., 'Summarize this document' or 'Suggest improvements'"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-800 dark:text-white resize-none"
                        rows={3}
                        disabled={loading}
                    />
                </div>

                <button
                    onClick={askAI}
                    disabled={loading || !prompt.trim()}
                    className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Thinking...
                        </span>
                    ) : (
                        'Get AI Suggestion'
                    )}
                </button>

                {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    </div>
                )}

                {suggestion && (
                    <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-inner">
                        <div className="flex items-center gap-2 mb-2">
                            <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                            </svg>
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">AI Suggestion:</span>
                        </div>
                        <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{suggestion}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
