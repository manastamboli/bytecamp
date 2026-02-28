/**
 * COMPONENT SCHEMAS REGISTRY
 *
 * Defines validation schemas for all available components in the builder.
 * Each schema specifies:
 * - type: Component type identifier
 * - allowedProps: Object defining allowed properties with type, required, and default values
 * - allowedStyles: Array of valid CSS style properties
 *
 * Used by the AI action executor to validate all AI-generated modifications
 * before applying them to the builder store.
 */

// ============================================================================
// SCHEMA DEFINITIONS
// ============================================================================

export const COMPONENT_SCHEMAS = {
  Hero: {
    type: "Hero",
    allowedProps: {
      title: {
        type: "string",
        required: true,
        default: "Transform Your Business Today",
      },
      subtitle: {
        type: "string",
        required: false,
        default: "Discover how our solution can help you achieve your goals faster",
      },
      ctaText: {
        type: "string",
        required: false,
        default: "Get Started",
      },
      ctaLink: {
        type: "string",
        required: false,
        default: "#contact",
      },
      backgroundImage: {
        type: "string",
        required: false,
        default: "",
      },
    },
    allowedStyles: [
      "backgroundColor",
      "textColor",
      "paddingTop",
      "paddingBottom",
      "paddingLeft",
      "paddingRight",
      "marginTop",
      "marginBottom",
      "textAlign",
      "fontSize",
      "fontWeight",
    ],
  },

  CTA: {
    type: "CTA",
    allowedProps: {
      title: {
        type: "string",
        required: true,
        default: "Ready to Get Started?",
      },
      description: {
        type: "string",
        required: false,
        default: "Join thousands of satisfied customers today",
      },
      buttonText: {
        type: "string",
        required: true,
        default: "Start Free Trial",
      },
      buttonLink: {
        type: "string",
        required: true,
        default: "#signup",
      },
    },
    allowedStyles: [
      "backgroundColor",
      "textColor",
      "paddingTop",
      "paddingBottom",
      "paddingLeft",
      "paddingRight",
      "marginTop",
      "marginBottom",
      "textAlign",
      "fontSize",
      "fontWeight",
    ],
  },

  Features: {
    type: "Features",
    allowedProps: {
      heading: {
        type: "string",
        required: true,
        default: "Why Choose Us",
      },
      items: {
        type: "array",
        required: true,
        default: [
          {
            icon: "⚡",
            title: "Fast & Reliable",
            description: "Lightning-fast performance you can count on",
          },
          {
            icon: "🔒",
            title: "Secure",
            description: "Enterprise-grade security for your peace of mind",
          },
          {
            icon: "💡",
            title: "Easy to Use",
            description: "Intuitive interface that anyone can master",
          },
        ],
      },
    },
    allowedStyles: [
      "backgroundColor",
      "textColor",
      "paddingTop",
      "paddingBottom",
      "paddingLeft",
      "paddingRight",
      "marginTop",
      "marginBottom",
      "textAlign",
    ],
  },

  FormEmbed: {
    type: "FormEmbed",
    allowedProps: {
      formId: {
        type: "string",
        required: false,
        default: null,
      },
      title: {
        type: "string",
        required: false,
        default: "Get in Touch",
      },
      description: {
        type: "string",
        required: false,
        default: "Fill out the form below and we'll get back to you soon",
      },
    },
    allowedStyles: [
      "backgroundColor",
      "textColor",
      "paddingTop",
      "paddingBottom",
      "paddingLeft",
      "paddingRight",
      "marginTop",
      "marginBottom",
    ],
  },

  Text: {
    type: "Text",
    allowedProps: {
      content: {
        type: "string",
        required: true,
        default: "Add your compelling content here to engage your visitors and communicate your message effectively.",
      },
      variant: {
        type: "string",
        required: false,
        default: "p",
      },
    },
    allowedStyles: [
      "textAlign",
      "fontSize",
      "color",
      "fontWeight",
      "lineHeight",
      "marginTop",
      "marginBottom",
      "paddingTop",
      "paddingBottom",
      "paddingLeft",
      "paddingRight",
    ],
  },

  Heading: {
    type: "Heading",
    allowedProps: {
      text: {
        type: "string",
        required: true,
        default: "Section Heading",
      },
      level: {
        type: "string",
        required: false,
        default: "h2",
      },
    },
    allowedStyles: [
      "textAlign",
      "fontSize",
      "color",
      "fontWeight",
      "lineHeight",
      "marginTop",
      "marginBottom",
      "paddingTop",
      "paddingBottom",
    ],
  },

  Button: {
    type: "Button",
    allowedProps: {
      text: {
        type: "string",
        required: true,
        default: "Click Here",
      },
      link: {
        type: "string",
        required: true,
        default: "#",
      },
      variant: {
        type: "string",
        required: false,
        default: "primary",
      },
    },
    allowedStyles: [
      "backgroundColor",
      "textColor",
      "fontSize",
      "fontWeight",
      "paddingTop",
      "paddingBottom",
      "paddingLeft",
      "paddingRight",
      "borderRadius",
      "borderWidth",
      "borderColor",
    ],
  },

  Image: {
    type: "Image",
    allowedProps: {
      src: {
        type: "string",
        required: true,
        default: "https://via.placeholder.com/800x400",
      },
      alt: {
        type: "string",
        required: true,
        default: "Placeholder image",
      },
      width: {
        type: "number",
        required: false,
        default: 800,
      },
      height: {
        type: "number",
        required: false,
        default: 400,
      },
    },
    allowedStyles: [
      "width",
      "height",
      "objectFit",
      "borderRadius",
      "marginTop",
      "marginBottom",
      "paddingTop",
      "paddingBottom",
    ],
  },

  Gallery: {
    type: "Gallery",
    allowedProps: {
      images: {
        type: "array",
        required: true,
        default: [
          { src: "https://via.placeholder.com/400x300", alt: "Gallery image 1" },
          { src: "https://via.placeholder.com/400x300", alt: "Gallery image 2" },
          { src: "https://via.placeholder.com/400x300", alt: "Gallery image 3" },
        ],
      },
      columns: {
        type: "number",
        required: false,
        default: 3,
      },
      gap: {
        type: "number",
        required: false,
        default: 16,
      },
    },
    allowedStyles: [
      "paddingTop",
      "paddingBottom",
      "paddingLeft",
      "paddingRight",
      "marginTop",
      "marginBottom",
    ],
  },

  Navbar: {
    type: "Navbar",
    allowedProps: {
      logo: {
        type: "string",
        required: false,
        default: "",
      },
      links: {
        type: "array",
        required: false,
        default: [
          { text: "Home", href: "#home" },
          { text: "About", href: "#about" },
          { text: "Services", href: "#services" },
          { text: "Contact", href: "#contact" },
        ],
      },
      ctaText: {
        type: "string",
        required: false,
        default: "Get Started",
      },
      ctaLink: {
        type: "string",
        required: false,
        default: "#signup",
      },
    },
    allowedStyles: [
      "backgroundColor",
      "textColor",
      "paddingTop",
      "paddingBottom",
      "paddingLeft",
      "paddingRight",
    ],
  },

  Footer: {
    type: "Footer",
    allowedProps: {
      logo: {
        type: "string",
        required: false,
        default: "",
      },
      columns: {
        type: "array",
        required: false,
        default: [
          {
            title: "Company",
            links: [
              { text: "About", href: "#about" },
              { text: "Careers", href: "#careers" },
              { text: "Contact", href: "#contact" },
            ],
          },
          {
            title: "Resources",
            links: [
              { text: "Blog", href: "#blog" },
              { text: "Help Center", href: "#help" },
              { text: "Documentation", href: "#docs" },
            ],
          },
        ],
      },
      copyright: {
        type: "string",
        required: false,
        default: "© 2024 Your Company. All rights reserved.",
      },
    },
    allowedStyles: [
      "backgroundColor",
      "textColor",
      "paddingTop",
      "paddingBottom",
      "paddingLeft",
      "paddingRight",
    ],
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get schema for a specific component type
 * @param {string} componentType - The component type
 * @returns {Object|null} The schema object or null if not found
 */
export function getSchema(componentType) {
  return COMPONENT_SCHEMAS[componentType] || null;
}

/**
 * Check if a component type is valid
 * @param {string} componentType - The component type to check
 * @returns {boolean} True if valid, false otherwise
 */
export function isValidComponentType(componentType) {
  return componentType in COMPONENT_SCHEMAS;
}

/**
 * Get all available component types
 * @returns {string[]} Array of component type names
 */
export function getAvailableComponentTypes() {
  return Object.keys(COMPONENT_SCHEMAS);
}

/**
 * Validate a prop value against its schema definition
 * @param {any} value - The value to validate
 * @param {Object} propSchema - The prop schema definition
 * @returns {boolean} True if valid, false otherwise
 */
export function validatePropValue(value, propSchema) {
  if (value === null || value === undefined) {
    return !propSchema.required;
  }

  const valueType = Array.isArray(value) ? "array" : typeof value;
  return valueType === propSchema.type;
}

/**
 * Validate a style property name
 * @param {string} componentType - The component type
 * @param {string} styleProp - The style property name
 * @returns {boolean} True if valid, false otherwise
 */
export function isValidStyleProp(componentType, styleProp) {
  const schema = getSchema(componentType);
  if (!schema) return false;
  return schema.allowedStyles.includes(styleProp);
}

/**
 * Get default props for a component type
 * @param {string} componentType - The component type
 * @returns {Object} Object with default prop values
 */
export function getDefaultProps(componentType) {
  const schema = getSchema(componentType);
  if (!schema) return {};

  const defaults = {};
  for (const [propName, propSchema] of Object.entries(schema.allowedProps)) {
    if (propSchema.default !== undefined) {
      defaults[propName] = propSchema.default;
    }
  }
  return defaults;
}
