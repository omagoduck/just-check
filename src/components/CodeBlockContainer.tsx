"use client";

import { memo } from "react";
import React, { useState } from "react";
import { Copy, ClipboardCheck } from "lucide-react";
import hljs from 'highlight.js';
// import 'highlight.js/styles/atom-one-dark.css'; // You can choose a different theme
// import 'highlight.js/styles/github-dark.css'; // Example: Changed to GitHub Dark
// import 'highlight.js/styles/github.css';
// import 'highlight.js/styles/base16/gigavolt.css';
// import 'highlight.js/styles/vs2015.css';
// import 'highlight.js/styles/tomorrow-night-bright.css';
// import 'highlight.js/styles/base16/google-dark.css';

// import 'highlight.js/styles/tokyo-night-dark.css';
// import 'highlight.js/styles/base16/framer.css';
// import 'highlight.js/styles/base16/brewer.css';
// import 'highlight.js/styles/panda-syntax-dark.css';
// import 'highlight.js/styles/cybertopia-dimmer.css';

// import 'highlight.js/styles/1-perfect-atomic.css';
// import 'highlight.js/styles/1-perfect-framer.css';

// Ignored: an-old-hope, xcode, agate, xt256, sunburst

// Prefer: cybertopia-dimmer, framer,

import './hjls-css-collection/framer-custom-1-light-dark.css';


interface CodeSnippetProps {
  code: string;
  language?: string;
}

const CodeBlockContainer: React.FC<CodeSnippetProps> = memo(({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const highlightedCode = React.useMemo(() => {
    if (language && hljs.getLanguage(language)) {
      try {
        return hljs.highlight(code, { language, ignoreIllegals: true }).value;
      } catch (e) {
        console.error(e);
      }
    }
    // Fallback to auto-detection or plain text if language is not provided or invalid
    try {
      return hljs.highlightAuto(code).value;
    } catch (e) {
      console.error(e);
      // As a last resort, just return the plain code
      return code;
    }
  }, [code, language]);

  return (
    <div className="bg-card rounded-lg overflow-hidden my-3 border">
      <div className="flex justify-between items-center px-4 py-2 text-muted-foreground text-xs font-semibold border-b border-border">
        <span>{language || "Code"}</span>
        <button
          onClick={handleCopy}
          className="flex items-center bg-secondary text-secondary-foreground hover:bg-secondary/80 px-3 py-1 rounded-md text-xs"
        >
          {copied ? (
            <>
              <ClipboardCheck className="mr-1 h-3.5 w-3.5" /> Copied!
            </>
          ) : (
            <>
              <Copy className="mr-1 h-3.5 w-3.5" /> Copy
            </>
          )}
        </button>
      </div>
      <div className="font-mono text-sm overflow-x-auto">
        <pre>
          <code
            className={`hljs ${language ? `language-${language}` : ''}`}
            dangerouslySetInnerHTML={{ __html: highlightedCode }}
          />
        </pre>
      </div>
    </div>
  );
});

export default CodeBlockContainer;


