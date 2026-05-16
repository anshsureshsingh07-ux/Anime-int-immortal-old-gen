import { SignedIn, SignedOut } from "@clerk/clerk-react";
import React from 'react';

export const Show = ({ when, children }: { when: 'signed-in' | 'signed-out', children: React.ReactNode }) => {
  if (when === 'signed-in') return <SignedIn>{children}</SignedIn>;
  if (when === 'signed-out') return <SignedOut>{children}</SignedOut>;
  return null;
};
