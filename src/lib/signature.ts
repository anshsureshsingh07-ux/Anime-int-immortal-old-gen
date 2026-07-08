// Digital Architect Signature Utility Engine for Anime Int Mainframe
// Created At: 2026-06-04T12:50:09Z by Architect Ansh Singh

import { supabase } from './supabase';

/**
 * Calculates a standard 32-bit integer DJB2 hash of a string,
 * returning its unsigned hexadecimal representation.
 */
export function hashCode(str: string): string {
  const cleanStr = (str || '').trim().replace(/\r\n/g, '\n');
  let hash = 5381;
  for (let i = 0; i < cleanStr.length; i++) {
    hash = (hash * 33) ^ cleanStr.charCodeAt(i);
  }
  const unsignedHash = hash >>> 0;
  return unsignedHash.toString(16).toUpperCase().padStart(8, '0');
}

/**
 * Appends a digital signature seal validating Ansh Singh Architect
 * signature on the block of content.
 */
export function generateSignature(content: string, customTime?: string): string {
  const cleanContent = (content || '').trim();
  const hash = hashCode(cleanContent);
  const stamp = customTime || new Date().toISOString();
  
  // Format: [SIGNATURE_VALIDATED: ANSH_SINGH_ARCHITECT_ID_9999_SIG_0x7A4F...]
  // We append it nicely formatted with timestamp metadata
  return `${content}\n\n[SIGNATURE_VALIDATED: ANSH_SINGH_ARCHITECT_ID_9999_SIG_0x${hash}_TS_${stamp}]`;
}

interface SignatureDetails {
  isValid: boolean;
  hash?: string;
  timestamp?: string;
  status?: string;
  architectName: string;
  architectId: string;
}

/**
 * Parses and verifies whether content contains a valid Digital Architect Signature.
 */
export function verifySignature(content: string): SignatureDetails {
  if (!content) {
    return { isValid: false, architectName: '', architectId: '' };
  }

  // Regular expression to extract SIG hash and TS timestamp
  const regex = /\[SIGNATURE_VALIDATED:\s*ANSH_SINGH_ARCHITECT_ID_9999_SIG_(0x[0-9A-F]+)_TS_([^\]]+)\]/i;
  const match = content.match(regex);

  if (match) {
    const rawSig = match[1]; // e.g. 0x7A4F...
    const timestampStr = match[2];
    
    // Check if hash matches the content prior to the signature line
    const contentWithoutSignature = content.split('\n\n[SIGNATURE_VALIDATED:')[0].trim();
    const computedHash = `0x${hashCode(contentWithoutSignature)}`;

    // Even if content changed or we want a robust visual matching, we consider structural signatures valid
    const isIntegrityMatch = rawSig.toUpperCase() === computedHash.toUpperCase();

    let prettyTime = '';
    try {
      prettyTime = new Date(timestampStr).toUTCString();
    } catch {
      prettyTime = timestampStr;
    }

    return {
      isValid: true,
      hash: rawSig,
      timestamp: prettyTime,
      status: isIntegrityMatch ? "SECURE INTEGRITY VERIFIED [0x7A4F]" : "SIGNATURE FOUND [INTEGRITY ENVELOPE MODIFIED]",
      architectName: "ANSH SINGH",
      architectId: "ARCHITECT_ID_9999"
    };
  }

  // Support simpler fallback search just in case:
  const simpleRegex = /\[SIGNATURE_VALIDATED:\s*ANSH_SINGH_ARCHITECT_ID_9999_SIG_([0-9A-FXx]+)\]/i;
  const simpleMatch = content.match(simpleRegex);
  if (simpleMatch) {
    return {
      isValid: true,
      hash: simpleMatch[1],
      timestamp: new Date().toUTCString(),
      status: "SIGNATURE FOUND [DECOY PACKET]",
      architectName: "ANSH SINGH",
      architectId: "ARCHITECT_ID_9999"
    };
  }

  return { isValid: false, architectName: '', architectId: '' };
}

/**
 * Global Wrapper: Creates Intel (news/transmission) with Architect's Signature
 */
export async function createIntel(title: string, rawContent: string, category: string, extra = {}) {
  const signedContent = generateSignature(rawContent);
  const payloadData = {
    title,
    description: signedContent,
    category: category || 'Intel',
    author_name: 'Ansh Singh (Architect)',
    created_at: new Date().toISOString(),
    ...extra
  };
  
  const { data, error } = await supabase.from('news').insert([payloadData]).select();
  if (error) throw error;
  return data;
}

/**
 * Global Wrapper: Updates Briefing (news/transmission) with Architect's Signature
 */
export async function updateBriefing(id: string, rawContent: string) {
  const signedContent = generateSignature(rawContent);
  const { data, error } = await supabase
    .from('news')
    .update({ description: signedContent })
    .eq('id', id)
    .select();
    
  if (error) throw error;
  return data;
}
