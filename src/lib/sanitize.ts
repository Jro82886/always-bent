import DOMPurify from 'dompurify';

// Configure DOMPurify for server-side if needed
const purify = typeof window !== 'undefined' ? DOMPurify : null;

export interface SanitizeOptions {
  allowedTags?: string[];
  allowedAttributes?: string[];
  stripDangerousTags?: boolean;
}

// HTML Sanitization
export function sanitizeHtml(dirty: string, options: SanitizeOptions = {}): string {
  if (!purify) {
    // Server-side: strip all HTML
    return dirty.replace(/<[^>]*>/g, '');
  }

  const config: any = {
    ALLOWED_TAGS: options.allowedTags || ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: options.allowedAttributes || ['href', 'target'],
    KEEP_CONTENT: !options.stripDangerousTags
  };

  return purify.sanitize(dirty, config) as unknown as string;
}

// SQL Injection Prevention (even though we use prepared statements)
export function sanitizeSqlInput(input: string): string {
  // Remove or escape potentially dangerous characters
  return input
    .replace(/['";\\]/g, '') // Remove quotes and backslashes
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*/g, '') // Remove multi-line comments
    .replace(/\*\//g, '')
    .trim();
}

// File name sanitization
export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace unsafe chars with underscore
    .replace(/\.{2,}/g, '.') // Remove multiple dots
    .replace(/^\./, '') // Remove leading dot
    .substring(0, 255); // Limit length
}

// URL sanitization
export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Only allow http(s) protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return '';
    }
    return parsed.toString();
  } catch {
    return '';
  }
}

// General input validation
export function validateInput(
  input: string,
  type: 'email' | 'username' | 'alphanumeric' | 'numeric'
): boolean {
  const patterns = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    username: /^[a-zA-Z0-9_-]{3,30}$/,
    alphanumeric: /^[a-zA-Z0-9]+$/,
    numeric: /^\d+$/
  };

  const pattern = patterns[type];
  return pattern ? pattern.test(input) : false;
}

// XSS Prevention for JSON responses
export function sanitizeJson(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeHtml(obj, { allowedTags: [] });
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeJson);
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Sanitize both keys and values
      const safeKey = key.replace(/[<>'"]/g, '');
      sanitized[safeKey] = sanitizeJson(value);
    }
    return sanitized;
  }
  
  return obj;
}

// File upload validation
export function validateFileUpload(file: File, options: {
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  allowedExtensions?: string[];
} = {}): { valid: boolean; error?: string } {
  const { 
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf']
  } = options;

  // Check file size
  if (file.size > maxSize) {
    return { 
      valid: false, 
      error: `File size exceeds ${maxSize / 1024 / 1024}MB limit` 
    };
  }

  // Check MIME type
  if (!allowedTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: `File type ${file.type} not allowed` 
    };
  }

  // Check file extension
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!allowedExtensions.includes(extension)) {
    return { 
      valid: false, 
      error: `File extension ${extension} not allowed` 
    };
  }

  return { valid: true };
}
