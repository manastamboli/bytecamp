/**
 * WEBSITE JSON SCHEMA
 * 
 * This schema represents the complete structure of a website
 * All visual state must conform to this schema
 */

// ============================================================================
// CORE SCHEMA TYPES
// ============================================================================

export interface WebsiteJSON {
  site: SiteMetadata;
  theme: Theme;
  pages: Page[];
}

export interface SiteMetadata {
  id: string;
  name: string;
  createdAt: string;
}

export interface Theme {
  colors: Record<string, string>;
  fonts: {
    heading: string;
    body: string;
  };
  spacing: Record<string, string | number>;
}

export interface Page {
  id: string;
  name: string;
  slug: string;
  seo: SEOMetadata;
  layout: Section[];
}

export interface SEOMetadata {
  title: string;
  description: string;
}

// ============================================================================
// LAYOUT TREE TYPES
// ============================================================================

export interface Section {
  id: string;
  type: 'section';
  variant: 'container' | 'fullwidth';
  styles?: SectionStyles;
  rows: Row[];
}

export interface SectionStyles {
  backgroundColor?: string;
  paddingTop?: number;
  paddingBottom?: number;
}

export interface Row {
  id: string;
  columns: Column[];
}

export interface Column {
  id: string;
  width: number; // 12-grid system (1-12)
  components: ComponentNode[];
}

// ============================================================================
// COMPONENT TYPES
// ============================================================================

export type ComponentType = 
  | 'Hero'
  | 'Text'
  | 'Image'
  | 'Button'
  | 'Gallery'
  | 'Navbar'
  | 'Footer'
  | 'Features'
  | 'CTA';

export interface ComponentNode {
  id: string;
  type: ComponentType;
  props: Record<string, any>;
  styles?: ComponentStyles;
}

export interface ComponentStyles {
  paddingTop?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  paddingRight?: number;
  backgroundColor?: string;
  textAlign?: 'left' | 'center' | 'right';
  textColor?: string;
  fontSize?: number;
  fontWeight?: number;
}

// ============================================================================
// COMPONENT PROPS INTERFACES
// ============================================================================

export interface HeroProps {
  title: string;
  subtitle: string;
  ctaText?: string;
  ctaLink?: string;
  backgroundImage?: string;
}

export interface TextProps {
  content: string;
  variant?: 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export interface ImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

export interface ButtonProps {
  text: string;
  link?: string;
  variant?: 'primary' | 'secondary' | 'outline';
}

export interface GalleryProps {
  images: Array<{
    src: string;
    alt: string;
  }>;
  columns?: number;
}

export interface NavbarProps {
  logo?: string;
  links: Array<{
    label: string;
    href: string;
  }>;
}

export interface FooterProps {
  copyright: string;
  links?: Array<{
    label: string;
    href: string;
  }>;
}

export interface FeaturesProps {
  title?: string;
  items: Array<{
    icon?: string;
    title: string;
    description: string;
  }>;
}

export interface CTAProps {
  title: string;
  description: string;
  buttonText: string;
  buttonLink?: string;
}

// ============================================================================
// BUILDER STATE TYPES
// ============================================================================

export interface BuilderState {
  layoutJSON: WebsiteJSON;
  selectedNodeId: string | null;
  currentPageId: string;
  hoveredNodeId: string | null;
}

export interface HistoryState {
  past: WebsiteJSON[];
  present: WebsiteJSON;
  future: WebsiteJSON[];
}

export type DevicePreview = 'desktop' | 'tablet' | 'mobile';

export interface UIState {
  devicePreview: DevicePreview;
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
}

// ============================================================================
// DRAG & DROP TYPES
// ============================================================================

export type DragType = 'section' | 'component' | 'reorder';

export interface DragData {
  type: DragType;
  componentType?: ComponentType;
  sourceId?: string;
  sourceIndex?: number;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type NodeType = 'section' | 'row' | 'column' | 'component';

export interface NodePath {
  pageIndex: number;
  sectionIndex?: number;
  rowIndex?: number;
  columnIndex?: number;
  componentIndex?: number;
}
