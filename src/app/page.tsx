"use client";

import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import Timeline from "../components/Timeline";
import AIAssistant from "../components/AIAssistant";

export default function Home() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50 dark:bg-gray-900">
            <div className="z-10 w-full max-w-5xl items-center justify-center font-mono text-sm lg:flex">
                <Authenticator>
                    {({ signOut, user }) => (
                        <main className="flex flex-col items-center gap-8 p-10 bg-white rounded-xl shadow-2xl dark:bg-gray-800">
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                Welcome, {user?.username}
                            </h1>

                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                                <p className="text-center text-gray-700 dark:text-gray-300">
                                    You are now authenticated and ready to collaborate.
                                </p>
                            </div>

                            <div className="flex w-full gap-6">
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 h-fit">
                                    <div className="p-6 border rounded-lg hover:shadow-lg transition-all dark:border-gray-700">
                                        <h3 className="font-bold text-lg mb-2">Secure</h3>
                                        <p className="text-gray-600 dark:text-gray-400">Enterprise-grade security with AWS Cognito.</p>
                                    </div>
                                    <div className="p-6 border rounded-lg hover:shadow-lg transition-all dark:border-gray-700">
                                        <h3 className="font-bold text-lg mb-2">Real-time</h3>
                                        <p className="text-gray-600 dark:text-gray-400">Collaborate with your team instantly.</p>
                                    </div>
                                    <div className="p-6 border rounded-lg hover:shadow-lg transition-all dark:border-gray-700">
                                        <h3 className="font-bold text-lg mb-2">AI-Powered</h3>
                                        <p className="text-gray-600 dark:text-gray-400">Integrated AI assistance for your workflow.</p>
                                    </div>
                                </div>

                                <Timeline documentId="default" />
                            </div>

                            <AIAssistant documentId="default" />

                            <button
                                onClick={signOut}
                                className="mt-8 px-8 py-3 bg-red-500 hover:bg-red-600 text-white rounded-full font-semibold transition-all shadow-lg hover:shadow-red-500/30"
                            >
                                Sign out
                            </button>
                        </main>
                    )}
                </Authenticator>
            </div>
        </div>
    );
}
