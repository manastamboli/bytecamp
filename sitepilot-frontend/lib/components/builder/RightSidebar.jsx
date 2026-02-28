"use client";

/**
 * RIGHT SIDEBAR
 *
 * Comprehensive properties and styles editor for selected component.
 * Context-sensitive tools that change based on the element selected.
 * Shows a "locked" message when the selected node is being edited by another user.
 */

import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { useParams } from "next/navigation";
import useBuilderStore from "@/lib/stores/builderStore";
import useHistoryStore from "@/lib/stores/historyStore";
import useUIStore from "@/lib/stores/uiStore";
import { Trash2, Copy, Plus, Minus, Settings2, Paintbrush, Lock, X, Image as ImageIcon, Wand2, Loader2, ChevronDown, Maximize2, Move, Type, Palette, AlignLeft, AlignCenter, AlignRight, AlignJustify, Italic, Underline, Strikethrough, Layers, ChevronRight, RotateCcw, Square } from "lucide-react";
import { clsx } from "clsx";
import FormSelector from "./FormSelector";
import { useOthers } from "@/lib/liveblocks-client";

const GOOGLE_FONTS = [
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Oswald', 'Source Sans Pro',
  'Raleway', 'PT Sans', 'Merriweather', 'Nunito', 'Playfair Display', 'Poppins',
  'Ubuntu', 'Mukta', 'Rubik', 'Work Sans', 'Noto Sans', 'Fira Sans', 'Quicksand',
  'Karla', 'Cabin', 'Barlow', 'Crimson Text', 'Bitter', 'Arimo', 'Titillium Web',
  'DM Sans', 'Manrope', 'Space Grotesk', 'Plus Jakarta Sans', 'Outfit', 'Lexend'
].sort();

const shadowPresets = [
  { label: "None", value: "none" },
  { label: "XS", value: "0 1px 2px 0 rgb(0 0 0 / 0.05)" },
  { label: "SM", value: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)" },
  { label: "MD", value: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)" },
  { label: "LG", value: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)" },
  { label: "XL", value: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" },
  { label: "2XL", value: "0 25px 50px -12px rgb(0 0 0 / 0.5)" },
  { label: "Inner", value: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)" },
];

export default function RightSidebar() {
  const store = useBuilderStore();
  const {
    layoutJSON,
    selectedNodeId,
    currentPageId,
    updateComponentProps,
    updateComponentStyles,
    deleteComponent,
    duplicateComponent,
    deleteContainer,
    duplicateContainer,
    updateContainerStyles,
    updateContainerSettings,
    addColumnToContainer,
    removeColumnFromContainer,
    updateColumnWidth,
    getLayoutJSON,
  } = store;

  const siteId = store.siteId;

  // Global settings (colors/fonts)
  const [globalSettings, setGlobalSettings] = useState(null);
  const [brandKit, setBrandKit] = useState(null);

  useEffect(() => {
    if (!siteId) return;
    // Fetch site global settings
    fetch(`/api/sites/${siteId}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.site?.globalSettings) {
          setGlobalSettings(data.site.globalSettings);
        }
        // Also fetch brand kit from tenant
        if (data?.site?.tenantId) {
          fetch(`/api/tenants/${data.site.tenantId}/brand-kit`)
            .then(res => res.ok ? res.json() : null)
            .then(bk => { if (bk?.brandKit) setBrandKit(bk.brandKit); })
            .catch(() => { });
        }
      })
      .catch(() => { });
  }, [siteId]);

  // Resolve effective global colors/fonts
  const effectiveGlobalColors = useMemo(() => {
    if (globalSettings?.colorMode === 'custom' && globalSettings?.globalColors) {
      return globalSettings.globalColors;
    }
    if (brandKit?.colors) return brandKit.colors;
    return { primary: '#3B82F6', secondary: '#8B5CF6', tertiary: '#EC4899' };
  }, [globalSettings, brandKit]);

  const effectiveGlobalFonts = useMemo(() => {
    if (globalSettings?.fontMode === 'custom' && globalSettings?.globalFonts) {
      return globalSettings.globalFonts;
    }
    if (brandKit?.fonts) return brandKit.fonts;
    return { heading: 'Poppins', body: 'Inter' };
  }, [globalSettings, brandKit]);

  const { pushState } = useHistoryStore();
  const { rightSidebarOpen } = useUIStore();
  const [activeTab, setActiveTab] = useState("properties");

  // ── Check if the selected node is locked by another user ──────────────
  const others = useOthers();
  const selectedNodeLock = useMemo(() => {
    if (!selectedNodeId) return null;
    for (const other of others) {
      if (other.presence?.lockedBlockId === selectedNodeId) {
        return {
          username: other.presence?.username || other.info?.name || "Anonymous",
          color: other.presence?.color || other.info?.color || "#999",
        };
      }
    }
    return null;
  }, [selectedNodeId, others]);

  // ✅ Find selected node from current layout state
  const selectedNode = React.useMemo(() => {
    if (!selectedNodeId || !layoutJSON) return null;

    const page = layoutJSON.pages.find((p) => p.id === currentPageId);
    if (!page) return null;

    // Search for the node
    for (const container of page.layout) {
      if (container.id === selectedNodeId) return container;

      for (const column of container.columns) {
        for (const component of column.components) {
          if (component.id === selectedNodeId) return component;
        }
      }
    }

    return null;
  }, [layoutJSON, selectedNodeId, currentPageId]);

  if (!selectedNodeId || !selectedNode) {
    return (
      <div className={clsx(
        "w-80 bg-[#fcfdfc] border-l border-gray-100 flex flex-col h-full min-h-0 builder-sidebar z-20 shrink-0 absolute right-0 md:relative",
        rightSidebarOpen ? "translate-x-0" : "translate-x-full md:translate-x-0",
        !rightSidebarOpen && "max-md:hidden"
      )}>
        <div data-lenis-prevent className="flex-1 min-h-0 overflow-y-auto p-8 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mb-4">
            <Settings2 size={20} className="text-[#8bc4b1] opacity-50" />
          </div>
          <p className="text-[10px] font-black tracking-widest uppercase text-[#1d2321]">Select an element</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-2 leading-relaxed">
            Click on any component or container on the canvas to view properties
          </p>
        </div>
      </div>
    );
  }

  // ── If the selected node is locked by another user ─────────────────────
  if (selectedNodeLock) {
    return (
      <div className={clsx(
        "w-80 bg-[#fcfdfc] border-l border-gray-100 flex flex-col h-full min-h-0 builder-sidebar z-20 shrink-0 absolute right-0 md:relative",
        rightSidebarOpen ? "translate-x-0" : "translate-x-full md:translate-x-0",
        !rightSidebarOpen && "max-md:hidden"
      )}>
        <div data-lenis-prevent className="flex-1 min-h-0 overflow-y-auto p-8 flex flex-col items-center justify-center text-center">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 border"
            style={{ backgroundColor: `${selectedNodeLock.color}10`, borderColor: `${selectedNodeLock.color}30` }}
          >
            <Lock size={20} style={{ color: selectedNodeLock.color }} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#1d2321]">Element Locked</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-2 leading-relaxed">
            <span
              className="mr-1"
              style={{ color: selectedNodeLock.color }}
            >
              {selectedNodeLock.username}
            </span>
            is currently editing
          </p>
          <p className="text-[9px] font-bold uppercase tracking-widest text-gray-300 mt-4 leading-relaxed">
            You can view real-time changes but cannot edit until they finish.
          </p>
        </div>
      </div>
    );
  }

  const isContainer = selectedNode.type === "container";
  const isComponent = selectedNode.type !== "container";

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this element?")) {
      pushState(getLayoutJSON());

      if (isContainer) {
        deleteContainer(selectedNodeId);
      } else {
        deleteComponent(selectedNodeId);
      }
    }
  };

  const handleDuplicate = () => {
    pushState(getLayoutJSON());
    if (isContainer) {
      duplicateContainer(selectedNodeId);
    } else {
      duplicateComponent(selectedNodeId);
    }
  };

  // ✅ Property update handler with history tracking
  const handleUpdateProps = (props) => {
    pushState(getLayoutJSON());
    updateComponentProps(selectedNodeId, props);
  };

  const handleUpdateStyles = (styles) => {
    pushState(getLayoutJSON());
    if (isContainer) {
      updateContainerStyles(selectedNodeId, styles);
    } else {
      updateComponentStyles(selectedNodeId, styles);
    }
  };

  return (
    <div className={clsx(
      "w-80 bg-white/80 backdrop-blur-md border-l border-gray-100 flex flex-col h-full min-h-0 builder-sidebar z-20 shadow-sm shrink-0 absolute right-0 md:relative",
      rightSidebarOpen ? "translate-x-0" : "translate-x-full md:translate-x-0",
      !rightSidebarOpen && "max-md:hidden"
    )}>
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[#8bc4b1] text-[10px] font-bold tracking-[0.2em] uppercase mb-1">Editing</p>
            <div className="flex items-center gap-2">
              <div
                className={clsx(
                  "w-2 h-2 rounded-full",
                  isContainer ? "bg-[#d3ff4a]" : "bg-[#0b1411]",
                )}
              />
              <h3 className="text-xl font-black text-[#1d2321] uppercase tracking-tighter">
                {isContainer ? "Container" : selectedNode.type}
              </h3>
            </div>
          </div>
          <div className="flex gap-1">
            <button
              onClick={handleDuplicate}
              className="p-2 hover:bg-[#f2f4f2] hover:text-[#0b1411] rounded-xl text-gray-400 transition-colors"
              title="Duplicate"
            >
              <Copy size={16} />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-xl transition-colors"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-[#f2f4f2] rounded-full p-1 border border-gray-100 shadow-inner">
          <button
            onClick={() => setActiveTab("properties")}
            className={clsx(
              "flex-1 flex items-center justify-center gap-1.5 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-full transition-all duration-300",
              activeTab === "properties"
                ? "bg-white text-[#0b1411] shadow-sm transform scale-105"
                : "text-gray-400 hover:text-gray-900",
            )}
          >
            <Settings2 size={12} />
            Properties
          </button>
          <button
            onClick={() => setActiveTab("styles")}
            className={clsx(
              "flex-1 flex items-center justify-center gap-1.5 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-full transition-all duration-300",
              activeTab === "styles"
                ? "bg-white text-[#0b1411] shadow-sm transform scale-105"
                : "text-gray-400 hover:text-gray-900",
            )}
          >
            <Paintbrush size={12} />
            Styles
          </button>
        </div>
      </div>

      {/* Content */}
      <div data-lenis-prevent className="flex-1 min-h-0 overflow-y-auto p-4">
        {activeTab === "properties" && isComponent && (
          <PropertiesEditor
            component={selectedNode}
            onUpdate={handleUpdateProps}
            siteId={siteId}
          />
        )}

        {activeTab === "styles" && isComponent && (
          <StylesEditor
            styles={selectedNode.styles || {}}
            onUpdate={handleUpdateStyles}
            globalColors={effectiveGlobalColors}
            globalFonts={effectiveGlobalFonts}
          />
        )}

        {activeTab === "styles" && isContainer && (
          <StylesEditor
            styles={selectedNode.styles || {}}
            onUpdate={handleUpdateStyles}
            globalColors={effectiveGlobalColors}
            globalFonts={effectiveGlobalFonts}
          />
        )}

        {activeTab === "properties" && isContainer && (
          <ContainerPropertiesEditor
            container={selectedNode}
            onUpdateSettings={(settings) => {
              pushState(getLayoutJSON());
              updateContainerSettings(selectedNodeId, settings);
            }}
            onAddColumn={() => {
              pushState(getLayoutJSON());
              addColumnToContainer(selectedNodeId);
            }}
            onRemoveColumn={(colIndex) => {
              pushState(getLayoutJSON());
              removeColumnFromContainer(selectedNodeId, colIndex);
            }}
            onUpdateColumnWidth={(colIndex, width) => {
              pushState(getLayoutJSON());
              updateColumnWidth(selectedNodeId, colIndex, width);
            }}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// CONTAINER PROPERTIES EDITOR
// ============================================================================

function ContainerPropertiesEditor({
  container,
  onUpdateSettings,
  onAddColumn,
  onRemoveColumn,
  onUpdateColumnWidth,
}) {
  const settings = container.settings || {};

  return (
    <div className="space-y-4">
      {/* Direction */}
      <SelectField
        label="Direction"
        value={settings.direction || "horizontal"}
        options={[
          { value: "horizontal", label: "Horizontal (Row)" },
          { value: "vertical", label: "Vertical (Column)" },
        ]}
        onChange={(v) => onUpdateSettings({ direction: v })}
      />

      {/* Content Width */}
      <SelectField
        label="Content Width"
        value={settings.contentWidth || "boxed"}
        options={[
          { value: "boxed", label: "Boxed" },
          { value: "full", label: "Full Width" },
        ]}
        onChange={(v) => onUpdateSettings({ contentWidth: v })}
      />

      {/* Max Width (only when boxed) */}
      {(settings.contentWidth || "boxed") === "boxed" && (
        <InputField
          label="Max Width (px)"
          type="number"
          value={settings.maxWidth || 1280}
          onChange={(v) => onUpdateSettings({ maxWidth: parseInt(v) || 1280 })}
        />
      )}

      {/* Gap */}
      <InputField
        label="Gap (px)"
        type="number"
        value={settings.gap ?? 16}
        onChange={(v) => onUpdateSettings({ gap: parseInt(v) || 0 })}
      />

      {/* Vertical Align */}
      <SelectField
        label="Vertical Align"
        value={settings.verticalAlign || "stretch"}
        options={[
          { value: "stretch", label: "Stretch" },
          { value: "flex-start", label: "Top" },
          { value: "center", label: "Center" },
          { value: "flex-end", label: "Bottom" },
        ]}
        onChange={(v) => onUpdateSettings({ verticalAlign: v })}
      />

      {/* Column Widths */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-2">
          Columns (width out of 12)
        </label>
        <div className="space-y-2">
          {(container.columns || []).map((col, i) => (
            <div key={col.id} className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-6">#{i + 1}</span>
              {/* Visual bar */}
              <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
                <div
                  className="h-full bg-blue-200 rounded transition-all"
                  style={{ width: `${(col.width / 12) * 100}%` }}
                />
              </div>
              <input
                type="number"
                min={1}
                max={12}
                value={col.width}
                onChange={(e) =>
                  onUpdateColumnWidth(i, parseInt(e.target.value) || 1)
                }
                className="w-14 px-2 py-1 border border-gray-200 rounded text-sm text-center"
              />
              {container.columns.length > 1 && (
                <button
                  onClick={() => onRemoveColumn(i)}
                  className="p-1 text-red-400 hover:text-red-600"
                  title="Remove column"
                >
                  <Minus size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={onAddColumn}
          className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
        >
          <Plus size={14} /> Add Column
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// PROPERTIES EDITOR
// ============================================================================

function PropertiesEditor({ component, onUpdate, siteId }) {
  const handleChange = (key, value) => {
    onUpdate({ [key]: value });
  };

  const props = component.props || {};
  const componentType = component.type;

  // Dynamic property fields based on component type
  return (
    <div className="space-y-4">
      {/* Hero Component */}
      {component.type === "Hero" && (
        <>
          <SelectField
            label="Variant"
            value={props.variant || "centered"}
            options={[
              { value: "centered", label: "Centered" },
              { value: "split", label: "Split (Text + Image)" },
              { value: "gradient-bg", label: "Gradient Background" },
              { value: "floating-card", label: "Floating Card" },
              { value: "minimal", label: "Minimal" },
            ]}
            onChange={(value) => handleChange("variant", value)}
          />
          <InputField
            label="Badge Text"
            value={props.badge || ""}
            onChange={(value) => handleChange("badge", value)}
            placeholder="e.g. NEW, LAUNCH, etc."
          />
          <InputField
            label="Title"
            value={props.title || ""}
            onChange={(value) => handleChange("title", value)}
            aiRewrite={true}
            componentType={componentType}
          />
          <InputField
            label="Subtitle"
            value={props.subtitle || ""}
            onChange={(value) => handleChange("subtitle", value)}
            multiline
            aiRewrite={true}
            componentType={componentType}
          />
          <InputField
            label="CTA Text"
            value={props.ctaText || ""}
            onChange={(value) => handleChange("ctaText", value)}
          />
          <InputField
            label="CTA Link"
            value={props.ctaLink || ""}
            onChange={(value) => handleChange("ctaLink", value)}
          />
          <InputField
            label="Secondary CTA Text"
            value={props.secondaryCtaText || ""}
            onChange={(value) => handleChange("secondaryCtaText", value)}
          />
          <InputField
            label="Secondary CTA Link"
            value={props.secondaryCtaLink || ""}
            onChange={(value) => handleChange("secondaryCtaLink", value)}
          />
          <InputField
            label="Image URL"
            value={props.image || props.backgroundImage || ""}
            onChange={(value) => handleChange("image", value)}
            placeholder="https://..."
          />
          <InputField
            label="Rating"
            value={props.rating || ""}
            onChange={(value) => handleChange("rating", value)}
            placeholder="e.g. 4.9"
          />
        </>
      )}

      {/* Text Component */}
      {component.type === "Text" && (
        <>
          <InputField
            label="Content"
            value={props.content || ""}
            onChange={(value) => handleChange("content", value)}
            multiline
            aiRewrite={true}
            componentType={componentType}
          />
          <SelectField
            label="Variant"
            value={props.variant || "p"}
            options={[
              { value: "h1", label: "Heading 1" },
              { value: "h2", label: "Heading 2" },
              { value: "h3", label: "Heading 3" },
              { value: "h4", label: "Heading 4" },
              { value: "p", label: "Paragraph" },
            ]}
            onChange={(value) => handleChange("variant", value)}
          />
        </>
      )}

      {/* Image Component */}
      {component.type === "Image" && (
        <>
          <MediaField
            label="Image File"
            value={props.src || ""}
            onChange={(value) => handleChange("src", value)}
          />
          <InputField
            label="Alt Text"
            value={props.alt || ""}
            onChange={(value) => handleChange("alt", value)}
          />
          <InputField
            label="Width (px)"
            type="number"
            value={props.width || ""}
            onChange={(value) =>
              handleChange("width", value ? parseInt(value) : null)
            }
          />
          <InputField
            label="Height (px)"
            type="number"
            value={props.height || ""}
            onChange={(value) =>
              handleChange("height", value ? parseInt(value) : null)
            }
          />
          <SelectField
            label="Object Fit"
            value={props.objectFit || "cover"}
            options={[
              { value: "cover", label: "Cover" },
              { value: "contain", label: "Contain" },
              { value: "fill", label: "Fill" },
              { value: "none", label: "None" },
              { value: "scale-down", label: "Scale Down" },
            ]}
            onChange={(value) => handleChange("objectFit", value)}
          />
          <InputField
            label="Border Radius (px)"
            type="number"
            value={props.borderRadius || 0}
            onChange={(value) =>
              handleChange("borderRadius", parseInt(value) || 0)
            }
          />
          <LinkField
            label="Link URL (optional)"
            value={props.linkUrl || ""}
            onChange={(value) => handleChange("linkUrl", value)}
          />
        </>
      )}

      {/* Button Component */}
      {component.type === "Button" && (
        <>
          <InputField
            label="Button Text"
            value={props.text || ""}
            onChange={(value) => handleChange("text", value)}
            aiRewrite={true}
            componentType={componentType}
          />
          <LinkField
            label="Link"
            value={props.link || ""}
            onChange={(value) => handleChange("link", value)}
          />
          <SelectField
            label="Open In"
            value={props.openInNewTab ? "new" : "same"}
            options={[
              { value: "same", label: "Same Tab" },
              { value: "new", label: "New Tab" },
            ]}
            onChange={(value) => handleChange("openInNewTab", value === "new")}
          />
          <SelectField
            label="Variant"
            value={props.variant || "primary"}
            options={[
              { value: "primary", label: "Primary" },
              { value: "secondary", label: "Secondary" },
              { value: "outline", label: "Outline" },
            ]}
            onChange={(value) => handleChange("variant", value)}
          />
        </>
      )}

      {/* CTA Component */}
      {component.type === "CTA" && (
        <>
          <InputField
            label="Title"
            value={props.title || ""}
            onChange={(value) => handleChange("title", value)}
            aiRewrite={true}
            componentType={componentType}
          />
          <InputField
            label="Description"
            value={props.description || ""}
            onChange={(value) => handleChange("description", value)}
            multiline
            aiRewrite={true}
            componentType={componentType}
          />
          <InputField
            label="Button Text"
            value={props.buttonText || ""}
            onChange={(value) => handleChange("buttonText", value)}
          />
          <InputField
            label="Button Link"
            value={props.buttonLink || ""}
            onChange={(value) => handleChange("buttonLink", value)}
          />
          <InputField
            label="Secondary Button Text"
            value={props.secondaryButtonText || ""}
            onChange={(value) => handleChange("secondaryButtonText", value)}
            placeholder="Optional"
          />
        </>
      )}

      {/* Heading Component */}
      {component.type === "Heading" && (
        <>
          <InputField
            label="Text"
            value={props.text || ""}
            onChange={(value) => handleChange("text", value)}
            aiRewrite={true}
            componentType={componentType}
          />
          <SelectField
            label="Level"
            value={props.level || "h2"}
            options={[
              { value: "h1", label: "H1" },
              { value: "h2", label: "H2" },
              { value: "h3", label: "H3" },
              { value: "h4", label: "H4" },
              { value: "h5", label: "H5" },
              { value: "h6", label: "H6" },
            ]}
            onChange={(value) => handleChange("level", value)}
          />
        </>
      )}

      {/* Link Component */}
      {component.type === "Link" && (
        <>
          <InputField
            label="Text"
            value={props.text || ""}
            onChange={(value) => handleChange("text", value)}
          />
          <LinkField
            label="URL"
            value={props.href || ""}
            onChange={(value) => handleChange("href", value)}
          />
          <SelectField
            label="Open In"
            value={props.openInNewTab ? "new" : "same"}
            options={[
              { value: "same", label: "Same Tab" },
              { value: "new", label: "New Tab" },
            ]}
            onChange={(value) => handleChange("openInNewTab", value === "new")}
          />
        </>
      )}

      {/* LinkBox Component */}
      {component.type === "LinkBox" && (
        <>
          <InputField
            label="Title"
            value={props.title || ""}
            onChange={(value) => handleChange("title", value)}
          />
          <InputField
            label="Description"
            value={props.description || ""}
            onChange={(value) => handleChange("description", value)}
          />
          <LinkField
            label="URL"
            value={props.href || ""}
            onChange={(value) => handleChange("href", value)}
          />
          <SelectField
            label="Open In"
            value={props.openInNewTab ? "new" : "same"}
            options={[
              { value: "same", label: "Same Tab" },
              { value: "new", label: "New Tab" },
            ]}
            onChange={(value) => handleChange("openInNewTab", value === "new")}
          />
        </>
      )}

      {/* ImageBox Component */}
      {component.type === "ImageBox" && (
        <>
          <MediaField
            label="Image File"
            value={props.src || ""}
            onChange={(value) => handleChange("src", value)}
          />
          <InputField
            label="Alt Text"
            value={props.alt || ""}
            onChange={(value) => handleChange("alt", value)}
          />
          <InputField
            label="Caption"
            value={props.caption || ""}
            onChange={(value) => handleChange("caption", value)}
          />
          <InputField
            label="Aspect Ratio"
            value={props.aspectRatio || "16/9"}
            onChange={(value) => handleChange("aspectRatio", value)}
          />
        </>
      )}

      {/* Video Component */}
      {component.type === "Video" && (
        <>
          <MediaField
            label="Video File"
            value={props.url || ""}
            onChange={(value) => handleChange("url", value)}
          />
          <SelectField
            label="Type"
            value={props.type || "youtube"}
            options={[
              { value: "youtube", label: "YouTube" },
              { value: "vimeo", label: "Vimeo" },
              { value: "direct", label: "Direct URL" },
            ]}
            onChange={(value) => handleChange("type", value)}
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={props.autoplay || false}
              onChange={(e) => handleChange("autoplay", e.target.checked)}
              className="rounded"
            />
            <label className="text-sm text-gray-700">Autoplay</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={props.controls !== false}
              onChange={(e) => handleChange("controls", e.target.checked)}
              className="rounded"
            />
            <label className="text-sm text-gray-700">Show controls</label>
          </div>
        </>
      )}

      {/* Map Component */}
      {component.type === "Map" && (
        <>
          <InputField
            label="Address"
            value={props.address || ""}
            onChange={(value) => handleChange("address", value)}
          />
          <InputField
            label="Height (px)"
            type="number"
            value={props.height || 400}
            onChange={(value) => handleChange("height", parseInt(value))}
          />
          <InputField
            label="Zoom Level"
            type="number"
            value={props.zoom || 15}
            onChange={(value) => handleChange("zoom", parseInt(value))}
          />
        </>
      )}

      {/* Icon Component */}
      {component.type === "Icon" && (
        <>
          <InputField
            label="Icon Name"
            value={props.name || "Star"}
            onChange={(value) => handleChange("name", value)}
          />
          <InputField
            label="Size (px)"
            type="number"
            value={props.size || 24}
            onChange={(value) => handleChange("size", parseInt(value))}
          />
        </>
      )}

      {/* Input Component */}
      {component.type === "Input" && (
        <>
          <InputField
            label="Label"
            value={props.label || ""}
            onChange={(value) => handleChange("label", value)}
          />
          <InputField
            label="Placeholder"
            value={props.placeholder || ""}
            onChange={(value) => handleChange("placeholder", value)}
          />
          <InputField
            label="Name"
            value={props.name || ""}
            onChange={(value) => handleChange("name", value)}
          />
          <SelectField
            label="Type"
            value={props.type || "text"}
            options={[
              { value: "text", label: "Text" },
              { value: "email", label: "Email" },
              { value: "password", label: "Password" },
              { value: "number", label: "Number" },
              { value: "tel", label: "Phone" },
              { value: "url", label: "URL" },
            ]}
            onChange={(value) => handleChange("type", value)}
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={props.required || false}
              onChange={(e) => handleChange("required", e.target.checked)}
              className="rounded"
            />
            <label className="text-sm text-gray-700">Required</label>
          </div>
        </>
      )}

      {/* Textarea Component */}
      {component.type === "Textarea" && (
        <>
          <InputField
            label="Label"
            value={props.label || ""}
            onChange={(value) => handleChange("label", value)}
          />
          <InputField
            label="Placeholder"
            value={props.placeholder || ""}
            onChange={(value) => handleChange("placeholder", value)}
          />
          <InputField
            label="Name"
            value={props.name || ""}
            onChange={(value) => handleChange("name", value)}
          />
          <InputField
            label="Rows"
            type="number"
            value={props.rows || 4}
            onChange={(value) => handleChange("rows", parseInt(value))}
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={props.required || false}
              onChange={(e) => handleChange("required", e.target.checked)}
              className="rounded"
            />
            <label className="text-sm text-gray-700">Required</label>
          </div>
        </>
      )}

      {/* Checkbox Component */}
      {component.type === "Checkbox" && (
        <>
          <InputField
            label="Label"
            value={props.label || ""}
            onChange={(value) => handleChange("label", value)}
          />
          <InputField
            label="Name"
            value={props.name || ""}
            onChange={(value) => handleChange("name", value)}
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={props.checked || false}
              onChange={(e) => handleChange("checked", e.target.checked)}
              className="rounded"
            />
            <label className="text-sm text-gray-700">Default checked</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={props.required || false}
              onChange={(e) => handleChange("required", e.target.checked)}
              className="rounded"
            />
            <label className="text-sm text-gray-700">Required</label>
          </div>
        </>
      )}

      {/* Select Component */}
      {component.type === "Select" && (
        <>
          <InputField
            label="Label"
            value={props.label || ""}
            onChange={(value) => handleChange("label", value)}
          />
          <InputField
            label="Name"
            value={props.name || ""}
            onChange={(value) => handleChange("name", value)}
          />
          <InputField
            label="Placeholder"
            value={props.placeholder || ""}
            onChange={(value) => handleChange("placeholder", value)}
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={props.required || false}
              onChange={(e) => handleChange("required", e.target.checked)}
              className="rounded"
            />
            <label className="text-sm text-gray-700">Required</label>
          </div>
          <OptionsEditor
            label="Options"
            options={props.options || []}
            onChange={(options) => handleChange("options", options)}
          />
        </>
      )}

      {/* Radio Component */}
      {component.type === "Radio" && (
        <>
          <InputField
            label="Group Label"
            value={props.label || ""}
            onChange={(value) => handleChange("label", value)}
          />
          <InputField
            label="Name"
            value={props.name || ""}
            onChange={(value) => handleChange("name", value)}
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={props.required || false}
              onChange={(e) => handleChange("required", e.target.checked)}
              className="rounded"
            />
            <label className="text-sm text-gray-700">Required</label>
          </div>
          <OptionsEditor
            label="Options"
            options={props.options || []}
            onChange={(options) => handleChange("options", options)}
          />
        </>
      )}

      {/* Label Component */}
      {component.type === "Label" && (
        <>
          <InputField
            label="Text"
            value={props.text || ""}
            onChange={(value) => handleChange("text", value)}
          />
          <InputField
            label="For (input name)"
            value={props.htmlFor || ""}
            onChange={(value) => handleChange("htmlFor", value)}
          />
        </>
      )}

      {/* FormEmbed Component */}
      {component.type === "FormEmbed" && (
        <>
          {siteId ? (
            <FormSelector
              value={props.formId}
              siteId={siteId}
              onChange={(formId, formName) => {
                handleChange("formId", formId);
                handleChange("formName", formName);
              }}
            />
          ) : (
            <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded border border-gray-200">
              Loading site information...
            </div>
          )}
          <div className="flex items-center gap-2 mt-4">
            <input
              type="checkbox"
              checked={props.showTitle !== false}
              onChange={(e) => handleChange("showTitle", e.target.checked)}
              className="rounded"
            />
            <label className="text-sm text-gray-700">Show form title</label>
          </div>
          {props.formId && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
              Form will be rendered when the page is published.
            </div>
          )}
        </>
      )}

      {/* Form Component */}
      {component.type === "Form" && (
        <>
          <InputField
            label="Action URL"
            value={props.action || ""}
            onChange={(value) => handleChange("action", value)}
          />
          <SelectField
            label="Method"
            value={props.method || "POST"}
            options={[
              { value: "GET", label: "GET" },
              { value: "POST", label: "POST" },
            ]}
            onChange={(value) => handleChange("method", value)}
          />
          <InputField
            label="Form Name"
            value={props.name || ""}
            onChange={(value) => handleChange("name", value)}
          />
        </>
      )}

      {/* Divider Component */}
      {component.type === "Divider" && (
        <>
          <InputField
            label="Thickness (px)"
            type="number"
            value={props.thickness || 1}
            onChange={(value) => handleChange("thickness", parseInt(value))}
          />
          <SelectField
            label="Style"
            value={props.style || "solid"}
            options={[
              { value: "solid", label: "Solid" },
              { value: "dashed", label: "Dashed" },
              { value: "dotted", label: "Dotted" },
            ]}
            onChange={(value) => handleChange("style", value)}
          />
        </>
      )}

      {/* Gallery Component */}
      {component.type === "Gallery" && (
        <>
          <InputField
            label="Columns"
            type="number"
            value={props.columns || 3}
            onChange={(value) => handleChange("columns", parseInt(value))}
          />
          <GalleryEditor
            images={props.images || []}
            onChange={(images) => handleChange("images", images)}
          />
        </>
      )}

      {/* Features Component */}
      {component.type === "Features" && (
        <>
          <InputField
            label="Section Title"
            value={props.title || ""}
            onChange={(value) => handleChange("title", value)}
          />
          <InputField
            label="Section Subtitle"
            value={props.subtitle || ""}
            onChange={(value) => handleChange("subtitle", value)}
            multiline
            placeholder="Optional description above the features grid"
          />
          <SelectField
            label="Columns"
            value={String(props.columns || 3)}
            options={[
              { value: "2", label: "2 Columns" },
              { value: "3", label: "3 Columns" },
              { value: "4", label: "4 Columns" },
            ]}
            onChange={(value) => handleChange("columns", parseInt(value))}
          />
          <FeaturesEditor
            items={props.items || []}
            onChange={(items) => handleChange("items", items)}
          />
        </>
      )}

      {/* Navbar Component */}
      {component.type === "Navbar" && (
        <>
          <InputField
            label="Logo Text"
            value={props.logo || ""}
            onChange={(value) => handleChange("logo", value)}
          />
          <InputField
            label="Logo Image URL"
            value={props.logoImage || ""}
            onChange={(value) => handleChange("logoImage", value)}
            placeholder="https://..."
          />
          <InputField
            label="CTA Button Text"
            value={props.ctaText || ""}
            onChange={(value) => handleChange("ctaText", value)}
            placeholder="Optional, e.g. Get Started"
          />
          <InputField
            label="CTA Button Link"
            value={props.ctaLink || ""}
            onChange={(value) => handleChange("ctaLink", value)}
            placeholder="#"
          />
          <NavLinksEditor
            links={props.links || []}
            onChange={(links) => handleChange("links", links)}
          />
        </>
      )}

      {/* Footer Component */}
      {component.type === "Footer" && (
        <>
          <InputField
            label="Copyright"
            value={props.copyright || ""}
            onChange={(value) => handleChange("copyright", value)}
          />
          <InputField
            label="Description"
            value={props.description || ""}
            onChange={(value) => handleChange("description", value)}
            multiline
            placeholder="Optional footer description"
          />
          <NavLinksEditor
            links={props.links || []}
            onChange={(links) => handleChange("links", links)}
          />
        </>
      )}
    </div>
  );
}

// ============================================================================
// STYLES EDITOR — Comprehensive modern style controls
// ============================================================================

function StylesEditor({ styles, onUpdate, globalColors, globalFonts }) {
  const handleChange = (key, value) => {
    onUpdate({ [key]: value });
  };

  const [openSections, setOpenSections] = useState({
    layout: true,
    spacing: true,
    typography: false,
    background: false,
    border: false,
    effects: false,
  });

  const toggleSection = (section) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="space-y-1">
      {/* ── Layout & Dimensions ─────────────────────────────────── */}
      <CollapsibleSection
        title="Layout & Size"
        icon={<Maximize2 size={12} />}
        isOpen={openSections.layout}
        onToggle={() => toggleSection("layout")}
      >
        <div className="grid grid-cols-2 gap-2">
          <InputField
            label="Width (px)"
            type="number"
            value={styles.width || ""}
            onChange={(v) => handleChange("width", v ? parseInt(v) : null)}
            compact
            placeholder="Auto"
          />
          <InputField
            label="Height (px)"
            type="number"
            value={styles.height || ""}
            onChange={(v) => handleChange("height", v ? parseInt(v) : null)}
            compact
            placeholder="Auto"
          />
          <InputField
            label="Min Height"
            type="number"
            value={styles.minHeight || ""}
            onChange={(v) => handleChange("minHeight", v ? parseInt(v) : null)}
            compact
            placeholder="—"
          />
          <InputField
            label="Max Width"
            type="number"
            value={styles.maxWidth || ""}
            onChange={(v) => handleChange("maxWidth", v ? parseInt(v) : null)}
            compact
            placeholder="—"
          />
        </div>
        <SelectField
          label="Overflow"
          value={styles.overflow || "visible"}
          options={[
            { value: "visible", label: "Visible" },
            { value: "hidden", label: "Hidden" },
            { value: "auto", label: "Scroll" },
          ]}
          onChange={(v) => handleChange("overflow", v === "visible" ? null : v)}
        />
      </CollapsibleSection>

      {/* ── Spacing — Visual Box Model ──────────────────────────── */}
      <CollapsibleSection
        title="Spacing"
        icon={<Move size={12} />}
        isOpen={openSections.spacing}
        onToggle={() => toggleSection("spacing")}
      >
        <SpacingBoxModel styles={styles} onChange={handleChange} />
      </CollapsibleSection>

      {/* ── Typography ──────────────────────────────────────────── */}
      <CollapsibleSection
        title="Typography"
        icon={<Type size={12} />}
        isOpen={openSections.typography}
        onToggle={() => toggleSection("typography")}
      >
        <div className="space-y-3">
          {/* Font Family */}
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Font Family
            </label>
            <select
              value={styles.fontFamily || ''}
              onChange={(e) => handleChange("fontFamily", e.target.value || undefined)}
              className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 focus:ring-1 focus:ring-[#8bc4b1] focus:border-[#8bc4b1] outline-none"
              style={{ fontFamily: styles.fontFamily || (typeof globalFonts !== 'undefined' ? globalFonts.body : 'Inter') || 'inherit' }}
            >
              <option value="">Global Default</option>
              <optgroup label="Google Fonts">
                {GOOGLE_FONTS.map(font => (
                  <option key={font} value={font}>{font}</option>
                ))}
              </optgroup>
            </select>
          </div>
          {/* Text Align */}
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Text Align
            </label>
            <ToggleGroup
              options={[
                { value: "left", icon: <AlignLeft size={13} />, label: "Left" },
                { value: "center", icon: <AlignCenter size={13} />, label: "Center" },
                { value: "right", icon: <AlignRight size={13} />, label: "Right" },
                { value: "justify", icon: <AlignJustify size={13} />, label: "Justify" },
              ]}
              value={styles.textAlign || "left"}
              onChange={(v) => handleChange("textAlign", v)}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <InputField
              label="Font Size"
              type="number"
              value={styles.fontSize || ""}
              onChange={(v) => handleChange("fontSize", v ? parseInt(v) : null)}
              compact
              placeholder="—"
              suffix="px"
            />
            <SelectField
              label="Font Weight"
              value={styles.fontWeight || ""}
              options={[
                { value: "", label: "Default" },
                { value: "100", label: "Thin" },
                { value: "300", label: "Light" },
                { value: "400", label: "Normal" },
                { value: "500", label: "Medium" },
                { value: "600", label: "Semi Bold" },
                { value: "700", label: "Bold" },
                { value: "800", label: "Extra Bold" },
                { value: "900", label: "Black" },
              ]}
              onChange={(v) => handleChange("fontWeight", v || null)}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <InputField
              label="Line Height"
              type="text"
              value={styles.lineHeight || ""}
              onChange={(v) => handleChange("lineHeight", v || null)}
              compact
              placeholder="Normal"
            />
            <InputField
              label="Letter Spacing"
              type="number"
              value={styles.letterSpacing || ""}
              onChange={(v) => handleChange("letterSpacing", v ? parseFloat(v) : null)}
              compact
              placeholder="0"
              suffix="px"
            />
          </div>

          {/* Text Transform */}
          <SelectField
            label="Text Transform"
            value={styles.textTransform || ""}
            options={[
              { value: "", label: "None" },
              { value: "uppercase", label: "UPPERCASE" },
              { value: "lowercase", label: "lowercase" },
              { value: "capitalize", label: "Capitalize" },
            ]}
            onChange={(v) => handleChange("textTransform", v || null)}
          />

          {/* Text Style Toggles */}
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Text Style
            </label>
            <div className="flex gap-1">
              <ToggleButton
                active={styles.fontStyle === "italic"}
                onClick={() =>
                  handleChange("fontStyle", styles.fontStyle === "italic" ? null : "italic")
                }
                title="Italic"
              >
                <Italic size={13} />
              </ToggleButton>
              <ToggleButton
                active={styles.textDecoration === "underline"}
                onClick={() =>
                  handleChange("textDecoration", styles.textDecoration === "underline" ? null : "underline")
                }
                title="Underline"
              >
                <Underline size={13} />
              </ToggleButton>
              <ToggleButton
                active={styles.textDecoration === "line-through"}
                onClick={() =>
                  handleChange("textDecoration", styles.textDecoration === "line-through" ? null : "line-through")
                }
                title="Strikethrough"
              >
                <Strikethrough size={13} />
              </ToggleButton>
            </div>
          </div>

          <ColorField
            label="Text Color"
            value={styles.textColor || ""}
            onChange={(v) => handleChange("textColor", v)}
            placeholder="#1f2937"
          />
        </div>
      </CollapsibleSection>

      {/* ── Background ──────────────────────────────────────────── */}
      <CollapsibleSection
        title="Background"
        icon={<Palette size={12} />}
        isOpen={openSections.background}
        onToggle={() => toggleSection("background")}
      >
        <div className="space-y-3">
          <GlobalColorField
            label="Background"
            value={styles.backgroundColor || "#ffffff"}
            onChange={(v) => handleChange("backgroundColor", v)}
            globalColors={globalColors}
          />
          <GlobalColorField
            label="Text Color"
            value={styles.textColor || "#1f2937"}
            onChange={(v) => handleChange("textColor", v)}
            globalColors={globalColors}
          />
        </div>
      </CollapsibleSection>

      {/* ── Border ─────────────────────────────────────────────── */}
      <CollapsibleSection
        title="Border"
        icon={<Square size={12} />}
        isOpen={openSections.border}
        onToggle={() => toggleSection("border")}
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <InputField
              label="Weight"
              type="number"
              value={styles.borderWidth || ""}
              onChange={(v) => handleChange("borderWidth", v ? parseInt(v) : null)}
              compact
              placeholder="0"
              suffix="px"
            />
            <SelectField
              label="Style"
              value={styles.borderStyle || "solid"}
              options={[
                { value: "solid", label: "Solid" },
                { value: "dashed", label: "Dashed" },
                { value: "dotted", label: "Dotted" },
                { value: "none", label: "None" },
              ]}
              onChange={(v) => handleChange("borderStyle", v)}
            />
          </div>
          <InputField
            label="Radius"
            type="number"
            value={styles.borderRadius || ""}
            onChange={(v) => handleChange("borderRadius", v ? parseInt(v) : null)}
            compact
            placeholder="0"
            suffix="px"
          />
          <ColorField
            label="Border Color"
            value={styles.borderColor || ""}
            onChange={(v) => handleChange("borderColor", v)}
            placeholder="#e5e7eb"
          />
        </div>
      </CollapsibleSection>

      {/* ── Effects ─────────────────────────────────────────────── */}
      <CollapsibleSection
        title="Effects"
        icon={<Layers size={12} />}
        isOpen={openSections.effects}
        onToggle={() => toggleSection("effects")}
      >
        <div className="space-y-3">
          {/* Box Shadow Presets */}
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Box Shadow
            </label>
            <div className="grid grid-cols-4 gap-1">
              {shadowPresets.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() =>
                    handleChange("boxShadow", preset.value === "none" ? null : preset.value)
                  }
                  className={clsx(
                    "px-2 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all border",
                    (styles.boxShadow || "none") === preset.value ||
                      (!styles.boxShadow && preset.value === "none")
                      ? "bg-[#0b1411] text-white border-[#0b1411]"
                      : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
}

// ============================================================================
// COLLAPSIBLE SECTION
// ============================================================================

function CollapsibleSection({ title, icon, isOpen, onToggle, children }) {
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden bg-white">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-gray-400">{icon}</span>
          <span className="text-[10px] font-black text-[#1d2321] uppercase tracking-widest">
            {title}
          </span>
        </div>
        {isOpen ? (
          <ChevronDown size={12} className="text-gray-400" />
        ) : (
          <ChevronRight size={12} className="text-gray-400" />
        )}
      </button>
      {isOpen && (
        <div className="px-3 pb-3 pt-1 space-y-2 border-t border-gray-50">
          {children}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SPACING BOX MODEL — Visual margin/padding editor
// ============================================================================

function SpacingBoxModel({ styles, onChange }) {
  const SpacingInput = ({ prop, pos }) => (
    <input
      type="number"
      value={styles[prop] || ""}
      onChange={(e) => onChange(prop, e.target.value ? parseInt(e.target.value) : 0)}
      placeholder="0"
      className={clsx(
        "w-10 h-6 text-center text-[10px] font-mono border border-transparent rounded",
        "bg-transparent focus:bg-white focus:border-gray-300 outline-none transition-all",
        "placeholder:text-gray-300"
      )}
      title={prop}
    />
  );

  return (
    <div className="space-y-1">
      {/* Margin label */}
      <p className="text-[9px] font-bold text-orange-400 uppercase tracking-widest">Margin</p>
      <div className="relative bg-orange-50/60 border border-orange-200/50 rounded-lg p-2">
        {/* Margin Top */}
        <div className="flex justify-center mb-1">
          <SpacingInput prop="marginTop" />
        </div>
        {/* Margin Left / Padding Box / Margin Right */}
        <div className="flex items-center">
          <div className="w-10 flex justify-center">
            <SpacingInput prop="marginLeft" />
          </div>
          {/* Padding box */}
          <div className="flex-1 bg-blue-50/60 border border-blue-200/50 rounded-md p-2 mx-1">
            <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest text-center mb-1">Padding</p>
            {/* Padding Top */}
            <div className="flex justify-center mb-1">
              <SpacingInput prop="paddingTop" />
            </div>
            {/* Padding Left / Content / Padding Right */}
            <div className="flex items-center">
              <SpacingInput prop="paddingLeft" />
              <div className="flex-1 h-6 bg-gray-100 rounded border border-dashed border-gray-300 mx-1" />
              <SpacingInput prop="paddingRight" />
            </div>
            {/* Padding Bottom */}
            <div className="flex justify-center mt-1">
              <SpacingInput prop="paddingBottom" />
            </div>
          </div>
          <div className="w-10 flex justify-center">
            <SpacingInput prop="marginRight" />
          </div>
        </div>
        {/* Margin Bottom */}
        <div className="flex justify-center mt-1">
          <SpacingInput prop="marginBottom" />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// TOGGLE GROUP — Button group for mutually exclusive options
// ============================================================================

function ToggleGroup({ options, value, onChange }) {
  return (
    <div className="flex bg-gray-100 rounded-lg p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={clsx(
            "flex-1 flex items-center justify-center p-1.5 rounded-md transition-all text-xs",
            value === opt.value
              ? "bg-white text-[#0b1411] shadow-sm"
              : "text-gray-400 hover:text-gray-600"
          )}
          title={opt.label}
        >
          {opt.icon}
        </button>
      ))}
    </div>
  );
}

// ============================================================================
// TOGGLE BUTTON — Individual on/off style button
// ============================================================================

function ToggleButton({ active, onClick, title, children }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "p-1.5 rounded-md transition-all border",
        active
          ? "bg-[#0b1411] text-white border-[#0b1411]"
          : "bg-white text-gray-400 border-gray-200 hover:border-gray-400 hover:text-gray-600"
      )}
      title={title}
    >
      {children}
    </button>
  );
}

// ============================================================================
// RANGE FIELD — Slider with value display
// ============================================================================

function RangeField({ label, value, min, max, step, onChange, suffix = "" }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
          {label}
        </label>
        <span className="text-[10px] font-mono text-gray-500">
          {value}{suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-[#0b1411]"
      />
    </div>
  );
}

// ============================================================================
// SECTION LABEL
// ============================================================================

function SectionLabel({ children }) {
  return (
    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
      {children}
    </p>
  );
}

// ============================================================================
// COLOR FIELD
// ============================================================================

function ColorField({ label, value, onChange, placeholder = "#ffffff" }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
        {label}
      </label>
      <div className="flex gap-2 items-center">
        <input
          type="color"
          value={value || "#ffffff"}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer p-0.5 shrink-0"
        />
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs font-mono text-gray-700 focus:ring-1 focus:ring-[#8bc4b1] focus:border-[#8bc4b1] outline-none bg-white"
          placeholder={placeholder}
        />
        {value && (
          <button
            onClick={() => onChange("")}
            className="p-1 text-gray-300 hover:text-gray-500 transition-colors"
            title="Clear"
          >
            <RotateCcw size={12} />
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// OPTIONS EDITOR (for Radio, Select)
// ============================================================================

function OptionsEditor({ label, options, onChange }) {
  const handleOptionChange = (index, field, value) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    onChange(newOptions);
  };

  const handleAddOption = () => {
    const newOptions = [
      ...options,
      { label: `Option ${options.length + 1}`, value: `${options.length + 1}` },
    ];
    onChange(newOptions);
  };

  const handleRemoveOption = (index) => {
    const newOptions = options.filter((_, i) => i !== index);
    onChange(newOptions);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="space-y-2">
        {options.map((option, index) => (
          <div key={index} className="flex gap-2 items-center">
            <input
              type="text"
              value={option.label || ""}
              onChange={(e) =>
                handleOptionChange(index, "label", e.target.value)
              }
              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
              placeholder="Label"
            />
            <input
              type="text"
              value={option.value || ""}
              onChange={(e) =>
                handleOptionChange(index, "value", e.target.value)
              }
              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
              placeholder="Value"
            />
            <button
              onClick={() => handleRemoveOption(index)}
              className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
              title="Remove option"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={handleAddOption}
        className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
      >
        + Add option
      </button>
    </div>
  );
}

// ============================================================================
// GALLERY EDITOR (for Gallery images)
// ============================================================================

function GalleryEditor({ images, onChange }) {
  const handleImageChange = (index, field, value) => {
    const newImages = [...images];
    newImages[index] = { ...newImages[index], [field]: value };
    onChange(newImages);
  };

  const handleAddImage = () => {
    onChange([
      ...images,
      {
        src: "https://via.placeholder.com/400",
        alt: `Image ${images.length + 1}`,
      },
    ]);
  };

  const handleRemoveImage = (index) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Images
      </label>
      <div className="space-y-3">
        {images.map((image, index) => (
          <div
            key={index}
            className="p-2 bg-gray-50 border border-gray-200 rounded space-y-1"
          >
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 font-medium">
                Image {index + 1}
              </span>
              <button
                onClick={() => handleRemoveImage(index)}
                className="text-xs text-red-400 hover:text-red-600"
              >
                Remove
              </button>
            </div>
            <input
              type="text"
              value={image.src || ""}
              onChange={(e) => handleImageChange(index, "src", e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              placeholder="Image URL"
            />
            <input
              type="text"
              value={image.alt || ""}
              onChange={(e) => handleImageChange(index, "alt", e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              placeholder="Alt text"
            />
          </div>
        ))}
      </div>
      <button
        onClick={handleAddImage}
        className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
      >
        + Add image
      </button>
    </div>
  );
}

// ============================================================================
// FEATURES EDITOR (for Features items)
// ============================================================================

function FeaturesEditor({ items, onChange }) {
  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    onChange(newItems);
  };

  const handleAddItem = () => {
    onChange([
      ...items,
      { title: `Feature ${items.length + 1}`, description: "Description" },
    ]);
  };

  const handleRemoveItem = (index) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Feature Items
      </label>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={index}
            className="p-2 bg-gray-50 border border-gray-200 rounded space-y-1"
          >
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 font-medium">
                Feature {index + 1}
              </span>
              <button
                onClick={() => handleRemoveItem(index)}
                className="text-xs text-red-400 hover:text-red-600"
              >
                Remove
              </button>
            </div>
            <input
              type="text"
              value={item.title || ""}
              onChange={(e) => handleItemChange(index, "title", e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              placeholder="Title"
            />
            <input
              type="text"
              value={item.description || ""}
              onChange={(e) =>
                handleItemChange(index, "description", e.target.value)
              }
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              placeholder="Description"
            />
          </div>
        ))}
      </div>
      <button
        onClick={handleAddItem}
        className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
      >
        + Add feature
      </button>
    </div>
  );
}

// ============================================================================
// NAV LINKS EDITOR (for Navbar, Footer)
// ============================================================================

function NavLinksEditor({ links, onChange }) {
  const handleLinkChange = (index, field, value) => {
    const newLinks = [...links];
    newLinks[index] = { ...newLinks[index], [field]: value };
    onChange(newLinks);
  };

  const handleAddLink = () => {
    onChange([...links, { label: "New Link", href: "#" }]);
  };

  const handleRemoveLink = (index) => {
    onChange(links.filter((_, i) => i !== index));
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Links
      </label>
      <div className="space-y-3">
        {links.map((link, index) => (
          <div key={index} className="p-3 bg-gray-50 border border-gray-200 rounded-md relative group">
            <button
              onClick={() => handleRemoveLink(index)}
              className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              title="Remove link"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <div className="space-y-3 mr-6">
              <InputField
                label="Label"
                value={link.label || ""}
                onChange={(value) => handleLinkChange(index, "label", value)}
              />
              <LinkField
                label="URL"
                value={link.href || ""}
                onChange={(value) => handleLinkChange(index, "href", value)}
              />
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={handleAddLink}
        className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
      >
        + Add link
      </button>
    </div>
  );
}

// ============================================================================
// FORM FIELDS
// ============================================================================

function MediaLibraryModal({ isOpen, onClose, onSelect, mediaList }) {
  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#0b1411]/80 backdrop-blur-sm p-4 sm:p-8" onClick={onClose}>
      <div
        className="bg-white rounded-[2.5rem] w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl overflow-hidden relative"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white relative z-10">
          <div>
            <h2 className="text-xl font-black text-[#1d2321] uppercase tracking-tighter">Media Library</h2>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Select an asset to insert</p>
          </div>
          <button onClick={onClose} className="p-3 text-gray-400 hover:text-[#0b1411] hover:bg-[#f2f4f2] rounded-2xl transition-all shadow-sm">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-8 bg-[#fcfdfc]">
          {mediaList.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center justify-center h-full">
              <div className="h-24 w-24 rounded-[2.5rem] bg-gray-50 border border-gray-100 flex items-center justify-center mb-8 shadow-inner">
                <ImageIcon size={40} className="text-gray-300" />
              </div>
              <h3 className="text-2xl font-black text-[#0b1411] uppercase tracking-tight mb-2">No Media Found</h3>
              <p className="text-sm font-medium text-gray-500 max-w-sm">Use the Media Library from your dashboard to upload files first.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {mediaList.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelect(item.url)}
                  className="group relative aspect-square bg-gray-50 border border-gray-100 rounded-3xl overflow-hidden cursor-pointer shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-[#8bc4b1] hover:ring-2 hover:ring-[#8bc4b1]/30 transition-all duration-300"
                >
                  <img src={item.url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <p className="text-white text-[10px] font-bold tracking-wider uppercase truncate">{item.name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
}

function MediaField({ label, value, onChange }) {
  const { tenantId } = useParams();
  const [media, setMedia] = useState([]);
  const [mediaType, setMediaType] = useState('url');
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (tenantId) {
      fetch(`/api/tenants/${tenantId}/media`)
        .then(res => res.json())
        .then(data => {
          if (data.media) {
            // sort by newest
            setMedia(data.media.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
          }
        })
        .catch(err => console.error("Failed to fetch media for MediaField", err));
    }
  }, [tenantId]);

  useEffect(() => {
    if (value) {
      if (media.some(m => m.url === value)) {
        setMediaType('library');
      } else {
        setMediaType('url');
      }
    } else {
      setMediaType('url');
    }
  }, [value, media]);

  return (
    <div className="space-y-4 p-4 bg-[#f2f4f2]/50 border border-gray-100 rounded-xl relative">
      <SelectField
        label={label + " Source"}
        value={mediaType}
        onChange={(type) => {
          setMediaType(type);
          if (type !== 'library') {
            onChange('');
          }
        }}
        options={[
          { label: 'Media Library', value: 'library' },
          { label: 'Custom URL', value: 'url' }
        ]}
      />
      {mediaType === 'url' ? (
        <InputField
          label="URL"
          value={value || ''}
          onChange={onChange}
        />
      ) : (
        <div className="space-y-3">
          <button
            onClick={() => setModalOpen(true)}
            className="w-full h-12 bg-white border border-gray-200 text-[#0b1411] text-xs font-bold uppercase tracking-widest rounded-xl hover:border-[#8bc4b1] hover:text-[#8bc4b1] transition-all shadow-sm flex items-center justify-center gap-2 hover:shadow-md active:scale-95"
          >
            <ImageIcon size={16} />
            {(value && media.some(m => m.url === value)) ? "Change Media" : "Browse Library"}
          </button>
          {value && media.some(m => m.url === value) && (
            <div className="mt-2 rounded-2xl overflow-hidden border border-gray-200 bg-white p-1.5 shadow-inner">
              <img src={value} alt="Preview" className="w-full h-auto max-h-40 object-contain rounded-xl" />
            </div>
          )}
          <MediaLibraryModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            mediaList={media}
            onSelect={(url) => {
              onChange(url);
              setModalOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}

function LinkField({ label, value, onChange }) {
  const { siteId } = useParams();
  const [pages, setPages] = useState([]);
  const [linkType, setLinkType] = useState('custom');

  useEffect(() => {
    if (siteId) {
      fetch(`/api/sites/${siteId}/pages`)
        .then(res => res.json())
        .then(data => {
          if (data.pages) setPages(data.pages);
        });
    }
  }, [siteId]);

  useEffect(() => {
    if (value) {
      if (pages.some(p => `/${p.slug}` === value || `/${p.slug.replace(/^\//, '')}/index.html` === value)) {
        setLinkType('page');
      } else {
        setLinkType('custom');
      }
    } else {
      setLinkType('custom');
    }
  }, [value, pages]);

  return (
    <div className="space-y-2">
      <SelectField
        label={label + " Type"}
        value={linkType}
        onChange={(type) => {
          setLinkType(type);
          if (type === 'page' && pages.length > 0) {
            onChange(`/${pages[0].slug.replace(/^\//, '')}`);
          } else {
            onChange('');
          }
        }}
        options={[
          { label: 'Site Page', value: 'page' },
          { label: 'Custom URL', value: 'custom' }
        ]}
      />
      {linkType === 'custom' ? (
        <InputField
          label="URL"
          value={value || ''}
          onChange={onChange}
        />
      ) : (
        <SelectField
          label="Select Page"
          value={value || (pages.length ? `/${pages[0].slug.replace(/^\//, '')}` : '')}
          onChange={onChange}
          options={pages.map(p => ({ label: p.name, value: `/${p.slug.replace(/^\//, '')}` }))}
        />
      )}
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  suffix = null,
  multiline = false,
  compact = false,
  aiRewrite = false,
  componentType = "",
}) {
  const [isRewriting, setIsRewriting] = useState(false);

  const handleRewrite = async () => {
    if (!value || isRewriting) return;
    setIsRewriting(true);
    try {
      const res = await fetch("/api/ai/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: value,
          fieldType: label,
          context: { componentType },
        }),
      });
      if (!res.ok) throw new Error("Failed to rewrite");
      const data = await res.json();
      if (data.text) {
        onChange(data.text);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to rewrite text. Please try again.");
    } finally {
      setIsRewriting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="block text-xs font-medium text-gray-600">
          {label}
        </label>
        {aiRewrite && type === "text" && (
          <button
            onClick={handleRewrite}
            disabled={isRewriting || !value}
            className="flex items-center gap-1 text-[10px] uppercase font-bold text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded-full transition-colors disabled:opacity-50"
            title="Rewrite with AI Magic"
          >
            {isRewriting ? (
              <Loader2 size={10} className="animate-spin" />
            ) : (
              <Wand2 size={10} />
            )}
            {isRewriting ? "Rewriting..." : "AI ✨"}
          </button>
        )}
      </div>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-1 focus:ring-[#8bc4b1] focus:border-[#8bc4b1] outline-none resize-none bg-white"
          rows={3}
          placeholder={placeholder}
        />
      ) : (
        <div className="relative">
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={clsx(
              "w-full border border-gray-200 rounded-lg text-gray-700 focus:ring-1 focus:ring-[#8bc4b1] focus:border-[#8bc4b1] outline-none bg-white",
              compact ? "px-2 py-1 text-xs" : "px-2.5 py-1.5 text-sm",
              suffix && "pr-8"
            )}
            placeholder={placeholder}
          />
          {suffix && (
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-gray-300 uppercase pointer-events-none">
              {suffix}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function SelectField({ label, value, options, onChange }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-1 focus:ring-[#8bc4b1] focus:border-[#8bc4b1] outline-none bg-white"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function GlobalColorField({ label, value, onChange, globalColors }) {
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  // Determine if the current value matches a global color
  const matchedGlobal = useMemo(() => {
    if (!globalColors) return null;
    for (const [key, color] of Object.entries(globalColors)) {
      if (color?.toLowerCase() === value?.toLowerCase()) return key;
    }
    return null;
  }, [value, globalColors]);

  const colorOptions = useMemo(() => {
    if (!globalColors) return [];
    return Object.entries(globalColors).map(([key, color]) => ({
      key,
      label: key.charAt(0).toUpperCase() + key.slice(1),
      color,
    }));
  }, [globalColors]);

  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">
        {label}
      </label>
      <div className="flex gap-2 items-center">
        {/* Global color swatches */}
        {colorOptions.map((opt) => (
          <button
            key={opt.key}
            onClick={() => { onChange(opt.color); setShowCustomPicker(false); }}
            className={clsx(
              "w-8 h-8 rounded-lg border-2 transition-all hover:scale-110",
              matchedGlobal === opt.key
                ? "border-[#0b1411] ring-2 ring-[#0b1411]/20 scale-110"
                : "border-gray-200 hover:border-gray-400"
            )}
            style={{ backgroundColor: opt.color }}
            title={`${opt.label} (${opt.color})`}
          />
        ))}

        {/* Custom button */}
        <button
          onClick={() => setShowCustomPicker(!showCustomPicker)}
          className={clsx(
            "w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 flex items-center justify-center text-[10px] font-bold",
            !matchedGlobal && !showCustomPicker
              ? "border-gray-300"
              : showCustomPicker
                ? "border-[#0b1411] ring-2 ring-[#0b1411]/20"
                : "border-gray-200 hover:border-gray-400"
          )}
          style={!matchedGlobal ? { backgroundColor: value } : { backgroundColor: '#f5f5f5' }}
          title="Custom color"
        >
          {matchedGlobal ? '⋯' : ''}
        </button>

        {/* Current value label */}
        <span className="text-[10px] font-mono font-bold text-gray-400 ml-1">
          {matchedGlobal ? matchedGlobal.toUpperCase() : value}
        </span>
      </div>

      {/* Custom color picker dropdown */}
      {showCustomPicker && (
        <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200 flex gap-3 items-center">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-10 h-8 rounded border border-gray-200 cursor-pointer"
          />
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-md text-xs font-mono font-bold uppercase focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
      )}
    </div>
  );
}
