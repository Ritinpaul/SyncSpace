"use client";

import { Amplify } from "aws-amplify";
import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import React from "react";

// Configure Amplify Client
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID || "",
      userPoolClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID || "",
    },
  },
});

export default function AuthWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Authenticator.Provider>
        {children}
    </Authenticator.Provider>
  );
}
