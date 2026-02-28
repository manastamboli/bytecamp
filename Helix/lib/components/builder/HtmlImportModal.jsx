"use client";

import React, { useState } from "react";
import { X, Code2, LayoutTemplate } from "lucide-react";
import { nanoid } from "nanoid";
import { createPortal } from "react-dom";

function parseHtmlToComponents(htmlString) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, "text/html");
  
  // We will flatten all interesting elements into a single column container for simplicity
  const components = [];

  function traverse(el) {
    if (el.nodeType === Node.TEXT_NODE) {
       const text = el.textContent.trim();
       if (text && el.parentNode.tagName.toLowerCase() !== 'script' && el.parentNode.tagName.toLowerCase() !== 'style') {
           // If it's pure text not inside an already handled element, we might drop it or wrap it
       }
       return;
    }

    if (el.nodeType !== Node.ELEMENT_NODE) return;

    const tag = el.tagName.toLowerCase();

    if (/^h[1-6]$/.test(tag)) {
        components.push({
            id: nanoid(),
            type: "Heading",
            props: { text: el.textContent, level: tag },
            styles: { textAlign: el.style.textAlign || "left", color: el.style.color || "" }
        });
        return; // don't traverse children of heading
    }

    if (tag === "p" || tag === "span") {
        components.push({
            id: nanoid(),
            type: "Text",
            props: { content: el.innerHTML, variant: "p" },
            styles: { textAlign: el.style.textAlign || "left" }
        });
        return;
    }

    if (tag === "img") {
        components.push({
            id: nanoid(),
            type: "Image",
            props: { src: el.getAttribute("src") || "", alt: el.getAttribute("alt") || "" },
            styles: {}
        });
        return;
    }

    if (tag === "a") {
        components.push({
            id: nanoid(),
            type: "Link",
            props: { text: el.textContent, href: el.getAttribute("href") || "#" },
            styles: {}
        });
        return;
    }

    if (tag === "button") {
        components.push({
            id: nanoid(),
            type: "Button",
            props: { text: el.textContent, variant: "primary" },
            styles: {}
        });
        return;
    }

    // If it is a textarea, input, form, etc.
    if (tag === "input") {
        components.push({
            id: nanoid(),
            type: "Input",
            props: { placeholder: el.getAttribute("placeholder") || "Input field", type: el.getAttribute("type") || "text" },
            styles: {}
        });
        return;
    }

    // Traverse children for divs, sections, headers, footers, etc.
    for (let i = 0; i < el.childNodes.length; i++) {
        traverse(el.childNodes[i]);
    }
  }

  // Start traversal from body
  traverse(doc.body);

  if (components.length === 0) return [];

  // Group into one container
  return [{
      id: nanoid(),
      type: "Container",
      columns: [
          {
              id: nanoid(),
              width: 12,
              components: components
          }
      ],
      settings: { verticalAlign: "flex-start" },
      styles: { paddingTop: "40px", paddingBottom: "40px", backgroundColor: "#ffffff" }
  }];
}

export default function HtmlImportModal({ isOpen, onClose, onImport }) {
  const [activeTab, setActiveTab] = useState("structured"); // "structured" | "raw"

  // Structured states
  const [headerHtml, setHeaderHtml] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [footerHtml, setFooterHtml] = useState("");

  // Raw state
  const [rawHtml, setRawHtml] = useState("");
  const [rawCss, setRawCss] = useState("");

  if (!isOpen) return null;

  const handleImport = () => {
    let finalHtml = "";
    if (activeTab === "structured") {
       finalHtml = `
         <div class="custom-header">${headerHtml}</div>
         <div class="custom-body">${bodyHtml}</div>
         <div class="custom-footer">${footerHtml}</div>
       `;
    } else {
       finalHtml = rawHtml;
    }

    const newContainers = parseHtmlToComponents(finalHtml);
    onImport(newContainers);
    onClose();
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0b1411]/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-white">
           <div>
              <h2 className="text-xl font-black text-[#1d2321] uppercase tracking-tighter">Import Custom HTML</h2>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Convert raw HTML/CSS into editable components</p>
           </div>
           <button onClick={onClose} className="p-3 text-gray-400 hover:text-[#0b1411] hover:bg-[#f2f4f2] rounded-2xl transition-all shadow-sm">
              <X size={20} />
           </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 bg-white">
           <button 
             onClick={() => setActiveTab('structured')}
             className={`flex-1 flex justify-center items-center gap-2 py-4 text-[10px] font-black uppercase tracking-widest transition-colors ${activeTab === 'structured' ? 'text-[#1d2321] border-b-2 border-[#1d2321] bg-[#fcfdfc]' : 'text-gray-400 hover:bg-gray-50 hover:text-[#1d2321]'}`}
           >
             <LayoutTemplate size={14} />
             Structured Sections
           </button>
           <button 
             onClick={() => setActiveTab('raw')}
             className={`flex-1 flex justify-center items-center gap-2 py-4 text-[10px] font-black uppercase tracking-widest transition-colors ${activeTab === 'raw' ? 'text-[#1d2321] border-b-2 border-[#1d2321] bg-[#fcfdfc]' : 'text-gray-400 hover:bg-gray-50 hover:text-[#1d2321]'}`}
           >
             <Code2 size={14} />
             Raw Editor
           </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-8 bg-[#fcfdfc]">
           {activeTab === 'structured' && (
              <div className="space-y-6">
                 <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Header HTML</label>
                    <textarea 
                       value={headerHtml}
                       onChange={e => setHeaderHtml(e.target.value)}
                       placeholder="<header><h1>My Site</h1></header>"
                       className="w-full h-32 p-5 bg-white border border-gray-100 rounded-[1.5rem] font-mono text-xs text-[#0b1411] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0b1411]/20 hover:border-[#8bc4b1] transition-all shadow-sm"
                    />
                 </div>
                 <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Body HTML</label>
                    <textarea 
                       value={bodyHtml}
                       onChange={e => setBodyHtml(e.target.value)}
                       placeholder="<section><p>Main content goes here.</p></section>"
                       className="w-full h-48 p-5 bg-white border border-gray-100 rounded-[1.5rem] font-mono text-xs text-[#0b1411] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0b1411]/20 hover:border-[#8bc4b1] transition-all shadow-sm"
                    />
                 </div>
                 <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Footer HTML</label>
                    <textarea 
                       value={footerHtml}
                       onChange={e => setFooterHtml(e.target.value)}
                       placeholder="<footer><p>&copy; 2026</p></footer>"
                       className="w-full h-32 p-5 bg-white border border-gray-100 rounded-[1.5rem] font-mono text-xs text-[#0b1411] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0b1411]/20 hover:border-[#8bc4b1] transition-all shadow-sm"
                    />
                 </div>
              </div>
           )}

           {activeTab === 'raw' && (
              <div className="space-y-6 flex flex-col h-full">
                 <div className="flex-1 flex flex-col">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">HTML Code</label>
                    <textarea 
                       value={rawHtml}
                       onChange={e => setRawHtml(e.target.value)}
                       placeholder="<div>\n  <h1>Hello World</h1>\n  <button>Click Me</button>\n</div>"
                       className="flex-1 w-full min-h-[250px] p-5 bg-white border border-gray-100 rounded-[1.5rem] font-mono text-xs text-[#0b1411] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0b1411]/20 hover:border-[#8bc4b1] transition-all shadow-sm"
                    />
                 </div>
                 <div className="flex-1 flex flex-col">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">CSS Styles (optional)</label>
                    <textarea 
                       value={rawCss}
                       onChange={e => setRawCss(e.target.value)}
                       placeholder="h1 { color: red; }\nbutton { background: blue; }"
                       className="flex-1 w-full min-h-[150px] p-5 bg-white border border-gray-100 rounded-[1.5rem] font-mono text-xs text-[#0b1411] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0b1411]/20 hover:border-[#8bc4b1] transition-all shadow-sm"
                    />
                 </div>
              </div>
           )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex justify-end gap-4 bg-white">
           <button 
             onClick={onClose}
             className="px-6 py-3.5 rounded-full border border-gray-200 text-[#0b1411] font-bold uppercase tracking-widest text-[10px] hover:border-[#8bc4b1] hover:text-[#8bc4b1] transition-all"
           >
             Cancel
           </button>
           <button 
             onClick={handleImport}
             className="px-8 py-3.5 rounded-full bg-[#d3ff4a] text-[#0b1411] font-black uppercase tracking-widest text-[10px] hover:bg-[#c0eb3f] transition-all shadow-[0_0_20px_rgba(211,255,74,0.3)] hover:scale-105 active:scale-95 flex items-center gap-2"
           >
             <Code2 size={16} />
             Import & Convert Build
           </button>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modalContent, document.body);
}
