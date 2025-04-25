import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export const NonMemoizedMarkdown = ({ children }: { children: string }) => {
  const components = {
    code: ({ node, inline, className, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || "");
      return !inline && match ? (
        <pre
          {...props}
          className={`${className} text-sm w-full overflow-x-auto bg-[#0A0A0A] p-4 rounded-lg mt-4 border border-[#222222]`}
        >
          <code className={`${match[1]} text-[#00E5BE]`}>{children}</code>
        </pre>
      ) : (
        <code
          className={`${className} text-sm bg-[#0A0A0A] text-[#00E5BE] py-1 px-2 rounded-md`}
          {...props}
        >
          {children}
        </code>
      );
    },
    ol: ({ node, children, ...props }: any) => {
      return (
        <ol className="list-decimal list-inside space-y-2 my-4" {...props}>
          {children}
        </ol>
      );
    },
    ul: ({ node, children, ...props }: any) => {
      return (
        <ul className="list-disc list-inside space-y-2 my-4" {...props}>
          {children}
        </ul>
      );
    },
    li: ({ node, children, ...props }: any) => {
      return (
        <li className="text-[#DDDDDD]" {...props}>
          {children}
        </li>
      );
    },
    p: ({ node, children, ...props }: any) => {
      return (
        <p className="my-3 text-[#DDDDDD] leading-relaxed" {...props}>
          {children}
        </p>
      );
    },
    a: ({ node, children, ...props }: any) => {
      return (
        <a className="text-[#00E5BE] hover:text-[#00ffcc] transition-colors" {...props}>
          {children}
        </a>
      );
    },
    strong: ({ node, children, ...props }: any) => {
      return (
        <strong className="font-semibold text-white" {...props}>
          {children}
        </strong>
      );
    },
    blockquote: ({ node, children, ...props }: any) => {
      return (
        <blockquote className="border-l-2 border-[#00E5BE] pl-4 my-4 text-[#888888]" {...props}>
          {children}
        </blockquote>
      );
    },
  };

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {children}
    </ReactMarkdown>
  );
};

export const Markdown = React.memo(
  NonMemoizedMarkdown,
  (prevProps, nextProps) => prevProps.children === nextProps.children,
);
