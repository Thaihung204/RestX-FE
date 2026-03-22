'use client';

import React, { useMemo } from 'react';
import DOMPurify from 'dompurify';

export interface RichTextRendererProps {
    content?: string;
    className?: string;
}

/**
 * RichTextRenderer
 * 
 * Securely renders HTML content from a WYSIWYG editor.
 * Uses DOMPurify to sanitize content before rendering to prevent XSS attacks.
 */
const RichTextRenderer: React.FC<RichTextRendererProps> = ({ content, className }) => {
    // Memoize sanitized content to prevent re-sanitization on every render
    const sanitizedContent = useMemo(() => {
        if (!content) return '';

        // Ensure we are in a browser environment before sanitizing
        if (typeof window === 'undefined') {
            return ''; // Or return a safe server-side fallback if needed, but usually empty until hydration
        }

        // Configure DOMPurify (optional: add specific config if needed)
        return DOMPurify.sanitize(content, {
            USE_PROFILES: { html: true }, // Ensure only HTML is processed
            ADD_ATTR: ['target'], // Allow target attribute for links
        });
    }, [content]);

    // If no content or sanitation resulted in empty string (or server-side), don't render
    if (!content || (!sanitizedContent && typeof window !== 'undefined')) {
        return null;
    }

    return (
        <div
            className={`rich-text-content ${className || ''}`}
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        />
    );
};

export default RichTextRenderer;
