import { Streamdown } from 'streamdown';

interface MarkdownRendererProps {
  content: string;
  isStreaming?: boolean;
}

export function MarkdownRenderer({ content, isStreaming = false }: MarkdownRendererProps) {
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      <Streamdown
        parseIncompleteMarkdown={true}
        isAnimating={isStreaming}
        controls={true}
        shikiTheme={['github-light-default', 'github-dark-default']}
      >
        {content}
      </Streamdown>
    </div>
  );
}

