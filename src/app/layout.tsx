import type { Metadata } from 'next'
import { Amplify } from 'aws-amplify'
import './globals.css'
import ConfigureAmplifyClientSide from '../components/auth/ConfigureAmplify'

// Configure Amplify
Amplify.configure({
    Auth: {
        Cognito: {
            userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID || '',
            userPoolClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID || '',
        }
    }
})

export const metadata: Metadata = {
    title: 'Cloud Collaboration Platform',
    description: 'Real-time collaboration with AI assistance',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body>
                <ConfigureAmplifyClientSide />
                {children}
            </body>
        </html>
    )
}
