import React, { useMemo } from 'react';
import katex from 'katex';

interface MathRendererProps {
  content: string;
  className?: string;
  asBlock?: boolean;
}

export const MathRenderer: React.FC<MathRendererProps> = ({
  content,
  className = '',
  asBlock = false,
}) => {
  const renderedContent = useMemo(() => {
    if (!content) return '';

    // Regex to detect $$...$$, $...$, \[...\], \(...\)
    // We replace them with safe katex rendered spans
    try {
      // First normalize \( and \) to $, and \[ and \] to $$
      let normalized = content
        .replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$')
        .replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$');

      // Process display math ($$...$$) first
      normalized = normalized.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
        try {
          return `<div class="my-2 py-1 overflow-x-auto text-center">${katex.renderToString(math.trim(), {
            displayMode: true,
            throwOnError: false,
          })}</div>`;
        } catch {
          return `$$${math}$$`;
        }
      });

      // Process inline math ($...$)
      normalized = normalized.replace(/\$([^\$\n]+?)\$/g, (_, math) => {
        try {
          return katex.renderToString(math.trim(), {
            displayMode: false,
            throwOnError: false,
          });
        } catch {
          return `$${math}$`;
        }
      });

      // Convert line breaks to <br/> if not wrapped in tags
      normalized = normalized.replace(/\n/g, '<br/>');

      return normalized;
    } catch (e) {
      console.warn('Math rendering error:', e);
      return content;
    }
  }, [content]);

  const Tag = asBlock ? 'div' : 'span';

  return (
    <Tag
      className={`math-rendered-text leading-relaxed ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedContent }}
    />
  );
};

export default MathRenderer;
