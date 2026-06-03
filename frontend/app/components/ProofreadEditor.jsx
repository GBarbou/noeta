"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import { Mark, mergeAttributes } from "@tiptap/core";
import { useEffect, forwardRef, useImperativeHandle, useCallback, useState, useRef } from "react";
import { findInTextWithAnchor } from "@/lib/utils";

const CorrectionMark = Mark.create({
  name: "correction",
  addAttributes() {
    return {
      correctionId: { default: null },
      type: { default: "fix" },
      status: { default: "pending" },
    };
  },
  parseHTML() { return [{ tag: "span[data-correction-id]" }]; },
  renderHTML({ HTMLAttributes }) {
    const type = HTMLAttributes.type || "fix";
    const status = HTMLAttributes.status || "pending";
    let cls;
    if (type === "fix") {
      cls = status === "accepted" ? "correction-fix-accepted" : "correction-fix";
    } else {
      cls = "correction-suggestion";
    }
    return ["span", mergeAttributes(HTMLAttributes, {
      "data-correction-id": HTMLAttributes.correctionId,
      class: cls,
    }), 0];
  },
});

function paragraphsToHTML(paragraphs) {
  if (!paragraphs || paragraphs.length === 0) return "<p></p>";
  return paragraphs.map((para) => {
    if (para.segments && para.segments.length > 0) {
      const html = para.segments.map((seg) => {
        let text = seg.text || "";
        text = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        if (seg.bold && seg.italic) return `<strong><em>${text}</em></strong>`;
        if (seg.bold) return `<strong>${text}</strong>`;
        if (seg.italic) return `<em>${text}</em>`;
        return text;
      }).join("");
      return `<p>${html}</p>`;
    }
    let text = para.text || "";
    text = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return `<p>${text}</p>`;
  }).join("");
}

function buildParaPositionMap(paragraphNode, offset) {
  const posMap = []; let paraText = "";
  paragraphNode.descendants((node, relPos) => {
    if (node.isText) {
      const absPos = offset + 1 + relPos;
      for (let i = 0; i < node.text.length; i++) { posMap.push(absPos + i); paraText += node.text[i]; }
    }
  });
  return { paraText, posMap };
}

function buildDocPositionMap(editor) {
  const posMap = []; let fullText = "";
  editor.state.doc.descendants((node, pos) => {
    if (node.isText) { for (let i = 0; i < node.text.length; i++) { posMap.push(pos + i); fullText += node.text[i]; } }
  });
  return { fullText, posMap };
}

const ProofreadEditor = forwardRef(function ProofreadEditor(
  { paragraphs = [], corrections = [], onContentChange, onCorrectionClick, readOnly = false, className = "" }, ref
) {
  const [isInitialized, setIsInitialized] = useState(false);
  const lastLoadedFingerprint = useRef(null);
  const isProgrammatic = useRef(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ codeBlock: false, code: false, blockquote: false, horizontalRule: false, heading: false }),
      Underline, Highlight.configure({ multicolor: true }), CorrectionMark,
    ],
    content: "",
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      if (isProgrammatic.current) return;
      if (onContentChange) onContentChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "max-w-none focus:outline-none min-h-[400px]",
        style: "color: var(--ink-soft); font-family: var(--display); font-size: 18px; line-height: 1.85; padding: 0;",
      },
      handleClick: (view, pos, event) => {
        const corrId = event.target?.getAttribute?.("data-correction-id");
        if (corrId && onCorrectionClick) { onCorrectionClick(parseInt(corrId, 10)); return true; }
        return false;
      },
    },
  });

  const applyCorrection = useCallback((correctionId) => {
    if (!editor) return false;
    const corr = corrections.find(c => c.id === correctionId);
    if (!corr || !corr.original) return false;
    const { original, suggested = "", paragraph_number: targetPara = 0, anchor = "" } = corr;

    if (targetPara > 0) {
      let n = 0, found = false;
      editor.state.doc.forEach((node, offset) => {
        if (found || node.type.name !== "paragraph" || !node.textContent.trim()) return;
        if (++n !== targetPara) return;
        const { paraText, posMap } = buildParaPositionMap(node, offset);
        const idx = findInTextWithAnchor(paraText, original, anchor, []);
        if (idx === -1) return;
        isProgrammatic.current = true;
        try { editor.chain().setTextSelection({ from: posMap[idx], to: posMap[idx + original.length - 1] + 1 }).deleteSelection().insertContent(suggested).run(); found = true; } catch (e) {}
        setTimeout(() => { isProgrammatic.current = false; }, 50);
      });
      if (found) return true;
    }
    const { fullText, posMap } = buildDocPositionMap(editor);
    const idx = findInTextWithAnchor(fullText, original, anchor, []);
    if (idx === -1) return false;
    isProgrammatic.current = true;
    try { editor.chain().setTextSelection({ from: posMap[idx], to: posMap[idx + original.length - 1] + 1 }).deleteSelection().insertContent(suggested).run(); setTimeout(() => { isProgrammatic.current = false; }, 50); return true; }
    catch (e) { isProgrammatic.current = false; return false; }
  }, [editor, corrections]);

  const undoCorrection = useCallback((correctionId) => {
    if (!editor) return false;
    const corr = corrections.find(c => c.id === correctionId);
    if (!corr || !corr.original) return false;
    const { original, suggested = "", paragraph_number: targetPara = 0, anchor = "" } = corr;
    if (targetPara > 0) {
      let n = 0, found = false;
      editor.state.doc.forEach((node, offset) => {
        if (found || node.type.name !== "paragraph" || !node.textContent.trim()) return;
        if (++n !== targetPara) return;
        const { paraText, posMap } = buildParaPositionMap(node, offset);
        const idx = paraText.indexOf(suggested);
        if (idx === -1) return;
        isProgrammatic.current = true;
        try { editor.chain().setTextSelection({ from: posMap[idx], to: posMap[idx + suggested.length - 1] + 1 }).deleteSelection().insertContent(original).run(); found = true; } catch (e) {}
        setTimeout(() => { isProgrammatic.current = false; }, 50);
      });
      if (found) return true;
    }
    const { fullText, posMap } = buildDocPositionMap(editor);
    const idx = fullText.indexOf(suggested);
    if (idx === -1) return false;
    isProgrammatic.current = true;
    try { editor.chain().setTextSelection({ from: posMap[idx], to: posMap[idx + suggested.length - 1] + 1 }).deleteSelection().insertContent(original).run(); setTimeout(() => { isProgrammatic.current = false; }, 50); return true; }
    catch (e) { isProgrammatic.current = false; return false; }
  }, [editor, corrections]);

  const getEditorParagraphs = useCallback(() => {
    if (!editor) return [];
    const result = []; let n = 1;
    editor.state.doc.forEach((node) => {
      if (node.type.name !== "paragraph" || !node.textContent.trim()) return;
      const segments = [];
      node.forEach((child) => {
        if (child.isText) {
          const marks = child.marks || [];
          segments.push({ text: child.text, bold: marks.some(m => m.type.name === "bold"), italic: marks.some(m => m.type.name === "italic") });
        }
      });
      result.push({ number: n++, text: node.textContent, segments });
    });
    return result;
  }, [editor]);

  // Flag: has the initial full highlight pass been done?
  const initialHighlightDone = useRef(false);

  const applyHighlights = useCallback(() => {
    if (!editor || !isInitialized) return;
    const pending = corrections.filter(c => c.status === "pending" && c.type === "fix" && c.original);
    isProgrammatic.current = true;
    editor.chain().selectAll().unsetMark("correction").run();
    if (pending.length > 0) {
      const paraMap = new Map(); let n = 0;
      editor.state.doc.forEach((node, offset) => {
        if (node.type.name !== "paragraph" || !node.textContent.trim()) return;
        paraMap.set(++n, buildParaPositionMap(node, offset));
      });
      const usedPerPara = new Map(); let docMap = null; const usedDoc = [];
      pending.forEach((corr) => {
        if (!corr.original) return;
        const tp = corr.paragraph_number || 0, anchor = corr.anchor || "";
        let matched = false;
        if (tp > 0 && paraMap.has(tp)) {
          const { paraText, posMap } = paraMap.get(tp);
          if (!usedPerPara.has(tp)) usedPerPara.set(tp, []);
          const used = usedPerPara.get(tp);
          const idx = findInTextWithAnchor(paraText, corr.original, anchor, used);
          if (idx !== -1 && idx + corr.original.length <= posMap.length) {
            used.push([idx, idx + corr.original.length]);
            try { editor.chain().setTextSelection({ from: posMap[idx], to: posMap[idx + corr.original.length - 1] + 1 }).setMark("correction", { correctionId: corr.id, type: corr.type }).run(); matched = true; } catch {}
          }
        }
        if (!matched) {
          if (!docMap) docMap = buildDocPositionMap(editor);
          const { fullText, posMap } = docMap;
          const idx = findInTextWithAnchor(fullText, corr.original, anchor, usedDoc);
          if (idx !== -1 && idx + corr.original.length <= posMap.length) {
            usedDoc.push([idx, idx + corr.original.length]);
            try { editor.chain().setTextSelection({ from: posMap[idx], to: posMap[idx + corr.original.length - 1] + 1 }).setMark("correction", { correctionId: corr.id, type: corr.type }).run(); } catch {}
          }
        }
      });
    }
    editor.commands.setTextSelection(1);
    initialHighlightDone.current = true;
    setTimeout(() => { isProgrammatic.current = false; }, 50);
  }, [editor, corrections, isInitialized]);

  const markCorrectionAccepted = useCallback((correctionId) => {
    if (!editor) return;
    const correctionMarkType = editor.schema.marks.correction;
    const { tr } = editor.state;
    let updated = false;
    editor.state.doc.descendants((node, pos) => {
      if (node.isText) {
        node.marks.forEach(mark => {
          if (mark.type === correctionMarkType && mark.attrs.correctionId === correctionId) {
            const newMark = correctionMarkType.create({ ...mark.attrs, status: "accepted" });
            tr.removeMark(pos, pos + node.nodeSize, correctionMarkType);
            tr.addMark(pos, pos + node.nodeSize, newMark);
            updated = true;
          }
        });
      }
    });
    if (updated) editor.view.dispatch(tr);
  }, [editor]);

  // Remove only one correction's highlight (fast, no full rebuild)
  const removeSingleHighlight = useCallback((correctionId) => {
    if (!editor) return;
    isProgrammatic.current = true;
    const correctionMarkType = editor.schema.marks.correction;
    const { tr } = editor.state;
    editor.state.doc.descendants((node, pos) => {
      if (node.isText) {
        node.marks.forEach(mark => {
          if (mark.type === correctionMarkType && mark.attrs.correctionId === correctionId) {
            tr.removeMark(pos, pos + node.nodeSize, mark);
          }
        });
      }
    });
    if (tr.steps.length > 0) editor.view.dispatch(tr);
    setTimeout(() => { isProgrammatic.current = false; }, 50);
  }, [editor]);

  useImperativeHandle(ref, () => ({
    getEditor: () => editor, getContent: () => editor?.getHTML() || "", getText: () => editor?.getText() || "",
    applyCorrection, undoCorrection, getEditorParagraphs, refreshHighlights: applyHighlights, removeSingleHighlight, markCorrectionAccepted, focus: () => editor?.commands.focus(),
  }));

  useEffect(() => {
    if (!editor || paragraphs.length === 0) return;
    const fp = paragraphs.map(p => p.text).join("\n");
    if (fp !== lastLoadedFingerprint.current) {
      isProgrammatic.current = true; editor.commands.setContent(paragraphsToHTML(paragraphs));
      lastLoadedFingerprint.current = fp; setIsInitialized(true);
      setTimeout(() => { isProgrammatic.current = false; }, 100);
    }
  }, [editor, paragraphs]);

  useEffect(() => { if (isInitialized && !initialHighlightDone.current && corrections.length > 0) { const t = setTimeout(applyHighlights, 150); return () => clearTimeout(t); } }, [corrections, isInitialized, applyHighlights]);
  useEffect(() => { if (editor) editor.setEditable(!readOnly); }, [editor, readOnly]);

  if (!editor) return (
    <div className={`flex items-center justify-center p-12 ${className}`}>
      <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--mid)" }}>Φόρτωση...</div>
    </div>
  );

  return (
    <div className={className} onKeyDown={(e) => { if (e.key === " " || e.key === "Backspace" || e.key === "Delete" || e.key === "Enter" || e.key.length === 1) e.stopPropagation(); }}>
      {!readOnly && (
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "10px 20px", borderBottom: "1px solid var(--rule)",
          backgroundColor: "var(--surface)",
        }}>
          <TBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" /></svg>
          </TBtn>
          <TBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="4" x2="10" y2="4" /><line x1="14" y1="20" x2="5" y2="20" /><line x1="15" y1="4" x2="9" y2="20" /></svg>
          </TBtn>
          <TBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3" /><line x1="4" y1="21" x2="20" y2="21" /></svg>
          </TBtn>
          <div style={{ width: 1, height: 16, margin: "0 6px", background: "var(--rule)" }} />
          <TBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 7v6h6" /><path d="M3 13a9 9 0 1 0 2.636-6.364L3 9" /></svg>
          </TBtn>
          <TBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 7v6h-6" /><path d="M21 13a9 9 0 1 1-2.636-6.364L21 9" /></svg>
          </TBtn>
        </div>
      )}
      <div style={{ overflowY: "auto", maxHeight: "calc(100vh - 380px)", padding: "32px 0" }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
});

function TBtn({ onClick, active, disabled, title, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      type="button"
      style={{
        padding: "6px",
        borderRadius: "var(--r-xs)",
        transition: "all 0.2s",
        background: active ? "var(--accent-soft)" : "transparent",
        color: active ? "var(--accent)" : "var(--mid)",
        opacity: disabled ? 0.3 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        border: "none",
      }}
    >
      {children}
    </button>
  );
}

export default ProofreadEditor;
