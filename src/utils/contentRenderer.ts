import DOMPurify from 'dompurify';
import katex from 'katex';
import 'katex/dist/katex.min.css';

// Helper function to render math expressions
export const renderMath = (text: string): string => {
  if (!text) return '';
  
  try {
    // First handle explicit katex tags
    let processedText = text.replace(/<katex\s+latex="([^"]+)"[^>]*><\/katex>/g, (match, formula) => {
      try {
        return katex.renderToString(formula, { 
          displayMode: true,
          throwOnError: false,
          output: 'html'
        });
      } catch (e) {
        console.error('Math rendering error:', e);
        return match;
      }
    });
    
    // Then handle $$ delimiters (display mode)
    processedText = processedText.replace(/\$\$(.*?)\$\$/g, (match, formula) => {
      try {
        return katex.renderToString(formula.trim(), { 
          displayMode: true,
          throwOnError: false,
          output: 'html'
        });
      } catch (e) {
        console.error('Math rendering error:', e);
        return match;
      }
    });

    // Finally handle $ delimiters (inline mode)
    return processedText.replace(/\$(.*?)\$/g, (match, formula) => {
      try {
        return katex.renderToString(formula.trim(), { 
          displayMode: false,
          throwOnError: false,
          output: 'html'
        });
      } catch (e) {
        console.error('Math rendering error:', e);
        return match;
      }
    });
  } catch (e) {
    console.error('Math rendering error:', e);
    return text;
  }
};

// Helper function to clean and render HTML content
export const renderHTML = (html: string): string => {
  if (!html) return '';
  
  try {
    // Remove HTML tags except for basic formatting and math-related elements
    const cleanHTML = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'span', 'sub', 'sup', 'br', 'div', 'math', 'mrow', 'mn', 'mo', 'mi', 'mtext', 'mspace', 'msup', 'msub', 'mfrac', 'mtable', 'mtr', 'mtd', 'katex'],
      ALLOWED_ATTR: ['class', 'style', 'latex', 'data-*'],
      ADD_ATTR: ['*::class', '*::style'],
      ADD_TAGS: ['math', 'mrow', 'mn', 'mo', 'mi', 'mtext', 'mspace', 'msup', 'msub', 'mfrac', 'mtable', 'mtr', 'mtd', 'katex']
    });
    
    // Process KaTeX content
    return renderMath(cleanHTML);
  } catch (e) {
    console.error('HTML rendering error:', e);
    return html;
  }
};

// Helper function to truncate text
export const truncateText = (text: string, maxLength: number = 30): string => {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}; 