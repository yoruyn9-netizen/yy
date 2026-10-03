/**
 * Sanitizes raw scraped web page markdown (e.g. from Jina Reader, DuckDuckGo, or HTML parsers)
 * Eliminates scraper tokens like "### ** (image1)", broken markdown headers, cookie warnings,
 * tracking links, and unformatted boilerplate, converting them into crystal-clear prose.
 */
export function cleanExtractedWebMarkdown(rawText: string): string {
  if (!rawText || typeof rawText !== 'string') return '';

  let text = rawText;

  // 1. Remove Jina / Scraper metadata headers at the beginning
  text = text.replace(/^(?:Title|URL Source|Markdown Content|Published time|Author|Warning):\s*[^\n]*\n?/gim, '');

  // 2. Remove image tokens and placeholders such as:
  // "### ** (image1)"
  // "### (image1)"
  // "(image1)", "(Image 2)"
  // "![Image 1: ...](...)"
  // "[Image 1: ...]"
  // "[Photo 1: ...]"
  // "[image1]"
  text = text.replace(/#{1,6}\s*\*{0,4}\s*\([iI]mage\s*\d+\)\s*\*{0,4}[^\n]*/gi, '');
  text = text.replace(/\([iI]mage\s*\d+\)/gi, '');
  text = text.replace(/\[[iI]mage\s*\d+[^\]]*\]/gi, '');
  text = text.replace(/\[(?:Photo|Gambar|Foto|Figure|Fig\.)\s*\d+[^\]]*\]/gi, '');
  text = text.replace(/!\[[^\]]*\]\([^\)]*\)/g, ''); // standard markdown images
  text = text.replace(/\[(?:Illustration|Diagram|Graphic|Logo|Icon)\s*[^\]]*\]/gi, '');
  text = text.replace(/\[(?:Image|Gambar|Photo)\s*source:[^\]]*\]/gi, '');

  // 3. Remove raw HTML tags leaked into markdown
  text = text.replace(/<!--[\s\S]*?-->/g, '');
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  text = text.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '');
  text = text.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '');
  text = text.replace(/<[^>]+>/g, ' ');

  // 4. Decode common HTML entities
  text = text
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&copy;/g, '©');

  // 5. Clean empty markdown header debris and bold leftovers
  // e.g. "### **", "## ****", "### ", "** **", "****"
  text = text.replace(/#{1,6}\s*\*{1,4}\s*#{0,6}/g, '');
  text = text.replace(/^\s*#{1,6}\s*$/gm, '');
  text = text.replace(/\*{2,4}\s*\*{2,4}/g, '');
  text = text.replace(/\*\*\s*\*\*/g, '');

  // 6. Clean common website boilerplate lines (cookie consent, share buttons, newsletter popups)
  const boilerplateRegex =
    /^\s*(?:We use cookies|Accept all cookies|Cookie Policy|Privacy Policy|Terms of Service|Manage preferences|Sign up for our newsletter|Subscribe to our newsletter|Share on (?:Twitter|Facebook|LinkedIn|WhatsApp)|All rights reserved|Skip to content|Main navigation|Back to top|Advertisement|Related articles|Read more:?)\b[^\n]*$/gim;
  text = text.replace(boilerplateRegex, '');

  // 7. Clean lines that are just standalone URLs, punctuation, or stray brackets
  text = text
    .split('\n')
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) return true; // preserve blank lines for paragraph breaks
      // Remove lines that are just a URL
      if (/^https?:\/\/[^\s]+$/.test(trimmed)) return false;
      // Remove lines that are just symbols or empty markdown artifacts
      if (/^[#*_\-`~+=|\s]{1,6}$/.test(trimmed)) return false;
      // Remove lines like "[Link]" or "[]"
      if (/^\[(?:link|source|url|gambar|foto|baca juga)\]$/i.test(trimmed)) return false;
      return true;
    })
    .join('\n');

  // 8. Normalize whitespace and paragraph flow
  text = text.replace(/[ \t]{2,}/g, ' ');
  text = text.replace(/\n{3,}/g, '\n\n').trim();

  return text;
}
