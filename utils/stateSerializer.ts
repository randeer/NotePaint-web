// This requires pako to be available globally, e.g., via a CDN script in index.html
declare const pako: any;

import { Item } from '../types';

export const encodeState = (state: Item[]): string => {
  try {
    const jsonString = JSON.stringify(state);
    // Deflate returns a Uint8Array
    const compressed = pako.deflate(jsonString);
    // Convert Uint8Array to a binary string that btoa can handle
    // FIX: Cast byte to number as `pako.deflate` returns `any`, so `byte` is inferred as `unknown`.
    const binaryString = Array.from(compressed).map(byte => String.fromCharCode(byte as number)).join('');
    // btoa creates a Base64-encoded ASCII string from a string of binary data.
    return btoa(binaryString);
  } catch (error) {
      console.error("Encoding state failed:", error);
      throw new Error("Failed to encode whiteboard state for sharing.");
  }
};

export const decodeState = (encodedString: string): Item[] => {
  try {
    // atob decodes a Base64-encoded string to a binary string.
    const binaryString = atob(encodedString);
    const len = binaryString.length;
    // Convert binary string to Uint8Array
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    // Inflate is zlib decompression
    const jsonString = pako.inflate(bytes, { to: 'string' });
    return JSON.parse(jsonString) as Item[];
  } catch (error) {
      console.error("Decoding state failed:", error);
      throw error; // Re-throw to be caught by the caller
  }
};