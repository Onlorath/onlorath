'use client';

import React, { ReactNode } from 'react';

/**
 * Terminal-safe markdown parser. Converts basic markdown syntax to styled React elements.
 * Supports: code blocks (```), inline code (`), bold (**), italic (*), markdown links ([text](url)), and bare URLs.
 */
export function parseTerminalMarkdown(content: string): ReactNode[] {
  if (!content) return [];

  const parts: ReactNode[] = [];
  let keyCounter = 0;

  // 1. Process code blocks (``` ... ```)
  const codeBlockRegex = /```(?:[a-zA-Z0-9]+)?\n([\s\S]*?)\n```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const textBefore = content.substring(lastIndex, match.index);
    if (textBefore) {
      parts.push(...parseInlineMarkdown(textBefore, () => `${keyCounter++}`));
    }

    const codeContent = match[1];
    parts.push(
      <pre
        key={`cb-${keyCounter++}`}
        className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-cyan-300 font-mono text-[11px] my-2 overflow-x-auto block whitespace-pre select-text"
      >
        <code>{codeContent}</code>
      </pre>
    );

    lastIndex = codeBlockRegex.lastIndex;
  }

  const remainingText = content.substring(lastIndex);
  if (remainingText) {
    parts.push(...parseInlineMarkdown(remainingText, () => `${keyCounter++}`));
  }

  return parts;
}

function parseInlineMarkdown(text: string, getNextKey: () => string): ReactNode[] {
  type Token = { type: 'text' | 'react'; content: ReactNode };
  let tokens: Token[] = [{ type: 'text', content: text }];

  const applyRegex = (
    regex: RegExp,
    replacer: (match: string[], key: string) => ReactNode
  ) => {
    const nextTokens: Token[] = [];

    for (const token of tokens) {
      if (token.type === 'react') {
        nextTokens.push(token);
        continue;
      }

      const str = token.content as string;
      let lastIdx = 0;
      let m;
      regex.lastIndex = 0;

      while ((m = regex.exec(str)) !== null) {
        const before = str.substring(lastIdx, m.index);
        if (before) {
          nextTokens.push({ type: 'text', content: before });
        }

        const replacement = replacer(m, getNextKey());
        nextTokens.push({ type: 'react', content: replacement });

        lastIdx = regex.lastIndex;
      }

      const remaining = str.substring(lastIdx);
      if (remaining) {
        nextTokens.push({ type: 'text', content: remaining });
      }
    }

    tokens = nextTokens;
  };

  applyRegex(/`([^`]+)`/g, (m, k) => (
    <span key={`code-${k}`} className="bg-slate-900 px-1.5 py-0.5 rounded text-cyan-300 font-mono text-[11px] border border-white/5">
      {m[1]}
    </span>
  ));

  applyRegex(/\[([^\]]+)\]\(([^)]+)\)/g, (m, k) => {
    const isInternal = m[2].startsWith('/');
    return (
      <a
        key={`link-${k}`}
        href={m[2]}
        target={isInternal ? undefined : "_blank"}
        rel={isInternal ? undefined : "noopener noreferrer"}
        className="text-cyan-400 underline hover:text-cyan-300 transition-colors font-semibold"
      >
        {m[1]}
      </a>
    );
  });

  applyRegex(/\*\*([^*]+)\*\*/g, (m, k) => (
    <span key={`bold-${k}`} className="font-bold text-white">
      {m[1]}
    </span>
  ));

  applyRegex(/\*([^*]+)\*/g, (m, k) => (
    <span key={`italic-${k}`} className="italic text-slate-200">
      {m[1]}
    </span>
  ));

  applyRegex(/(https?:\/\/[^\s<]+)/g, (m, k) => (
    <a
      key={`url-${k}`}
      href={m[1]}
      target="_blank"
      rel="noopener noreferrer"
      className="text-cyan-400 underline hover:text-cyan-300 transition-colors font-semibold"
    >
      {m[1]}
    </a>
  ));

  return tokens.map((t) => t.content);
}
