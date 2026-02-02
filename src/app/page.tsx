"use client";

import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import Workspace from "../components/workspace/Workspace";

export default function Home() {
    return (
        <Authenticator>
            {({ signOut, user }) => (
                <Workspace user={user} signOut={signOut!} />
            )}
        </Authenticator>
    );
}
