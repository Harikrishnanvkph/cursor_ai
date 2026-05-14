/**
 * HTML Sanitizer Utility
 * 
 * Wraps DOMPurify to prevent XSS attacks in all dangerouslySetInnerHTML usages.
 * Particularly critical for the public /share/[id] page where untrusted
 * user/AI-generated HTML is rendered without authentication.
 */
import DOMPurify from 'dompurify';

/**
 * Sanitizes an HTML string, stripping dangerous tags/attributes while
 * preserving safe formatting elements used by templates, formats, and decorations.
 */
export function sanitizeHTML(html: string): string {
  if (typeof window === 'undefined') return html;
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'b', 'i', 'em', 'strong', 'p', 'br', 'span', 'div',
      'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'a', 'blockquote', 'code', 'pre', 'sub', 'sup', 'hr',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'img', 'figure', 'figcaption', 'small', 'mark', 'del', 'ins',
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'style', 'class', 'id',
      'src', 'alt', 'width', 'height',
      'colspan', 'rowspan',
    ],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Sanitizes an SVG string for safe inline rendering.
 * More permissive than sanitizeHTML since SVG elements are needed.
 */
export function sanitizeSVG(svg: string): string {
  if (typeof window === 'undefined') return svg;
  return DOMPurify.sanitize(svg, {
    USE_PROFILES: { svg: true, svgFilters: true },
    ADD_TAGS: ['use'],
    ALLOW_DATA_ATTR: false,
  });
}
