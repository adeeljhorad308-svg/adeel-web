import 'server-only';
import DOMPurify, { type Config } from 'isomorphic-dompurify';

/**
 * Rich-content and SVG sanitization (Stage 5 §10; OWASP: XSS).
 *
 * All user/admin-authored rich content (blog, portfolio narratives, legal docs)
 * is sanitized server-side before it is stored and again is only rendered from
 * sanitized storage. SVG uploads are sanitized separately because SVG can carry
 * script payloads.
 */

const RICH_TEXT_CONFIG: Config = {
  ALLOWED_TAGS: [
    'p',
    'br',
    'strong',
    'em',
    'u',
    's',
    'blockquote',
    'code',
    'pre',
    'h2',
    'h3',
    'h4',
    'ul',
    'ol',
    'li',
    'a',
    'img',
    'figure',
    'figcaption',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
    'hr',
    'span',
    'div',
  ],
  ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'target', 'rel', 'class', 'colspan', 'rowspan'],
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
  ADD_ATTR: ['target'],
  FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input', 'object', 'embed'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'style'],
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  RETURN_TRUSTED_TYPE: false,
};

/** Sanitize authored rich-text HTML for safe storage and rendering. */
export function sanitizeRichText(dirty: string): string {
  const clean = String(DOMPurify.sanitize(dirty, RICH_TEXT_CONFIG));
  // Force safe rel on any target=_blank anchors (reverse-tabnabbing defense).
  return clean.replace(
    /<a\b([^>]*?)target="_blank"([^>]*?)>/gi,
    (match: string, pre: string, post: string) =>
      /rel=/.test(match) ? match : `<a ${pre}target="_blank" rel="noopener noreferrer"${post}>`,
  );
}

/** Sanitize an uploaded SVG's markup, stripping scripts and event handlers. */
export function sanitizeSvg(svg: string): string {
  return String(
    DOMPurify.sanitize(svg, {
      USE_PROFILES: { svg: true, svgFilters: true },
      FORBID_TAGS: ['script', 'foreignObject'],
      FORBID_ATTR: ['onload', 'onerror', 'onclick'],
      RETURN_TRUSTED_TYPE: false,
    }),
  );
}
