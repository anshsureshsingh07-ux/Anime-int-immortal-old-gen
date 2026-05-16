import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ConvexReactClient, ConvexProvider } from "convex/react";
import App from './App.tsx';
import './index.css';

const sanitize = (val: string | undefined, name: string) => {
  if (!val) return val;
  let cleaned = val.trim();
  
  // Handle case where user pasted "KEY=VALUE" or "export KEY=VALUE"
  if (cleaned.includes('=')) {
    const parts = cleaned.split('=');
    const lastPart = parts[parts.length - 1].trim();
    cleaned = lastPart;
  }
  
  // Remove wrapping quotes (single or double) and any trailing semicolons
  cleaned = cleaned.replace(/^["']|["']$/g, '').replace(/;$/, '').trim();
  
  console.log(`[Config] Sanitized ${name}:`, cleaned.startsWith('pk_') ? 'Valid format' : 'Invalid format');
  return cleaned;
};

const convexUrl = sanitize(import.meta.env.VITE_CONVEX_URL, 'Convex URL');
const clerkKey = sanitize(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY, 'Clerk Key');

// Check if keys are actually provided and not just placeholders
const isConfigured = 
  convexUrl && 
  clerkKey && 
  !convexUrl.includes('your-') && 
  clerkKey.length > 20; // Basic check for real key vs placeholder

const Root = () => {
  const convex = new ConvexReactClient(convexUrl || "https://placeholder.convex.cloud");

  return (
    <ConvexProvider client={convex}>
      <App />
    </ConvexProvider>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
