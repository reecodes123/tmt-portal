"use client";

import { useEffect, useRef } from "react";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Heading2,
  Link as LinkIcon,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const TOOLBAR_ACTIONS: {
  icon: typeof Bold;
  label: string;
  command: string;
  value?: string;
}[] = [
  { icon: Bold, label: "Bold", command: "bold" },
  { icon: Italic, label: "Italic", command: "italic" },
  { icon: Underline, label: "Underline", command: "underline" },
  { icon: Heading2, label: "Heading", command: "formatBlock", value: "h2" },
  { icon: Quote, label: "Quote", command: "formatBlock", value: "blockquote" },
  { icon: List, label: "Bullet list", command: "insertUnorderedList" },
  { icon: ListOrdered, label: "Numbered list", command: "insertOrderedList" },
];

/**
 * A minimal, dependency-free WYSIWYG editor built on `contentEditable` +
 * `document.execCommand`. It's intentionally lightweight rather than pulling
 * in a heavy editor framework, and stores/loads plain HTML which is what
 * gets saved to the article's `content` field in Firestore.
 */
export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current && editorRef.current) {
      editorRef.current.innerHTML = value || "";
      isFirstRender.current = false;
    }
  }, [value]);

  const runCommand = (command: string, commandValue?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const handleLink = () => {
    const url = window.prompt("Enter a URL");
    if (url) runCommand("createLink", url);
  };

  return (
    <div className="border-2 border-gray-200 rounded-lg overflow-hidden focus-within:border-[#FF7D00] transition-colors">
      <div className="flex flex-wrap items-center gap-1 bg-gray-50 border-b border-gray-200 p-2">
        {TOOLBAR_ACTIONS.map(({ icon: Icon, label, command, value: cmdValue }) => (
          <button
            key={label}
            type="button"
            onClick={() => runCommand(command, cmdValue)}
            className="p-2 rounded hover:bg-white hover:shadow-sm text-gray-600 hover:text-[#FF7D00] transition-colors"
            aria-label={label}
            title={label}
          >
            <Icon size={16} />
          </button>
        ))}
        <button
          type="button"
          onClick={handleLink}
          className="p-2 rounded hover:bg-white hover:shadow-sm text-gray-600 hover:text-[#FF7D00] transition-colors"
          aria-label="Insert link"
          title="Insert link"
        >
          <LinkIcon size={16} />
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={(e) => onChange((e.target as HTMLDivElement).innerHTML)}
        data-placeholder={placeholder}
        className="prose prose-sm sm:prose-base max-w-none min-h-[280px] p-4 break-words focus:outline-none [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-gray-400"
      />
    </div>
  );
}
