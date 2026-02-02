import { useEffect, useState } from 'react';
import { Authenticator } from "@aws-amplify/ui-react";
import { fetchAuthSession } from 'aws-amplify/auth';

interface AuditLog {
    userId: string;
    action: string;
    beforeText: string;
    afterText: string;
    timestamp: string;
    role: string;
}

export default function Timeline({ documentId }: { documentId: string }) {
    const [history, setHistory] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const session = await fetchAuthSession();
            const token = session.tokens?.idToken?.toString();

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/documents/${documentId}/history`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const data = await res.json();
            setHistory(data);
        } catch (err) {
            console.error("Failed to fetch history", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
        // Poll every 10 seconds for updates
        const interval = setInterval(fetchHistory, 10000);
        return () => clearInterval(interval);
    }, [documentId]);

    return (
        <div className="w-full max-w-md p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-y-auto max-h-[500px]">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">Audit History</h3>
                <button onClick={fetchHistory} className="text-sm text-blue-500 hover:text-blue-600">
                    Refresh
                </button>
            </div>

            {loading && <p className="text-center text-gray-500">Loading...</p>}

            <div className="relative border-l border-gray-200 dark:border-gray-700 ml-3">
                {history.map((item, index) => (
                    <div key={index} className="mb-6 ml-6">
                        <span className={`absolute flex items-center justify-center w-6 h-6 rounded-full -left-3 ring-8 ring-white dark:ring-gray-900 ${item.action === 'edit' ? 'bg-blue-500' : 'bg-green-500'
                            }`}>
                            <svg className="w-2.5 h-2.5 text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M20 4a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0H6a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v2h20V4ZM0 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8H0v10Zm5-8h10a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2Z" />
                            </svg>
                        </span>
                        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                            <div className="justify-between items-center mb-2 sm:flex">
                                <time className="mb-1 text-xs font-normal text-gray-400 sm:order-last sm:mb-0">
                                    {new Date(item.timestamp).toLocaleString()}
                                </time>
                                <div className="text-sm font-normal text-gray-500 dark:text-gray-300">
                                    <span className="font-semibold text-gray-900 dark:text-white">{item.userId}</span>
                                    <span className="ml-2 px-2 py-0.5 rounded text-xs bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200">
                                        {item.role}
                                    </span>
                                </div>
                            </div>
                            <div className="p-3 text-xs italic font-normal text-gray-500 border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-300">
                                {item.action === 'edit' ? 'Edited content' : item.action}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
