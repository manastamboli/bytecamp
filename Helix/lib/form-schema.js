/**
 * FORM SCHEMA DEFINITIONS
 * Clean, simple structure for form builder
 */

// Field Types
export const FIELD_TYPES = {
  TEXT: 'text',
  EMAIL: 'email',
  PHONE: 'phone',
  NUMBER: 'number',
  TEXTAREA: 'textarea',
  SELECT: 'select',
  CHECKBOX: 'checkbox',
  RADIO: 'radio',
  DATE: 'date',
  FILE: 'file'
};

// Field Width Options
export const FIELD_WIDTHS = {
  FULL: 'full',    // 100% width
  HALF: 'half',    // 50% width (2 columns)
  THIRD: 'third'   // 33% width (3 columns)
};

// Default field configurations
export const FIELD_DEFAULTS = {
  [FIELD_TYPES.TEXT]: {
    type: FIELD_TYPES.TEXT,
    label: 'Text Field',
    placeholder: 'Enter text',
    required: false,
    width: FIELD_WIDTHS.FULL,
    validation: {
      minLength: null,
      maxLength: null,
      pattern: null
    }
  },
  [FIELD_TYPES.EMAIL]: {
    type: FIELD_TYPES.EMAIL,
    label: 'Email',
    placeholder: 'your@email.com',
    required: true,
    width: FIELD_WIDTHS.FULL,
    validation: {
      pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$'
    }
  },
  [FIELD_TYPES.PHONE]: {
    type: FIELD_TYPES.PHONE,
    label: 'Phone Number',
    placeholder: '+1 (555) 000-0000',
    required: false,
    width: FIELD_WIDTHS.HALF,
    validation: {
      pattern: null
    }
  },
  [FIELD_TYPES.NUMBER]: {
    type: FIELD_TYPES.NUMBER,
    label: 'Number',
    placeholder: '0',
    required: false,
    width: FIELD_WIDTHS.HALF,
    validation: {
      min: null,
      max: null,
      step: 1
    }
  },
  [FIELD_TYPES.TEXTAREA]: {
    type: FIELD_TYPES.TEXTAREA,
    label: 'Message',
    placeholder: 'Enter your message',
    required: false,
    width: FIELD_WIDTHS.FULL,
    rows: 4,
    validation: {
      minLength: null,
      maxLength: null
    }
  },
  [FIELD_TYPES.SELECT]: {
    type: FIELD_TYPES.SELECT,
    label: 'Select Option',
    placeholder: 'Choose an option',
    required: false,
    width: FIELD_WIDTHS.FULL,
    options: [
      { label: 'Option 1', value: 'option1' },
      { label: 'Option 2', value: 'option2' }
    ]
  },
  [FIELD_TYPES.CHECKBOX]: {
    type: FIELD_TYPES.CHECKBOX,
    label: 'Checkbox Group',
    required: false,
    width: FIELD_WIDTHS.FULL,
    options: [
      { label: 'Option 1', value: 'option1' },
      { label: 'Option 2', value: 'option2' }
    ],
    layout: 'vertical' // vertical or horizontal
  },
  [FIELD_TYPES.RADIO]: {
    type: FIELD_TYPES.RADIO,
    label: 'Radio Group',
    required: false,
    width: FIELD_WIDTHS.FULL,
    options: [
      { label: 'Option 1', value: 'option1' },
      { label: 'Option 2', value: 'option2' }
    ],
    layout: 'vertical' // vertical or horizontal
  },
  [FIELD_TYPES.DATE]: {
    type: FIELD_TYPES.DATE,
    label: 'Date',
    placeholder: 'Select date',
    required: false,
    width: FIELD_WIDTHS.HALF,
    validation: {
      minDate: null,
      maxDate: null
    }
  },
  [FIELD_TYPES.FILE]: {
    type: FIELD_TYPES.FILE,
    label: 'File Upload',
    required: false,
    width: FIELD_WIDTHS.FULL,
    validation: {
      maxSize: 5242880, // 5MB in bytes
      allowedTypes: ['image/*', 'application/pdf']
    }
  }
};

// Create a new field with unique ID
export function createField(type) {
  const defaults = FIELD_DEFAULTS[type];
  if (!defaults) {
    throw new Error(`Unknown field type: ${type}`);
  }
  
  return {
    id: `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    ...JSON.parse(JSON.stringify(defaults)), // Deep clone
    order: 0 // Will be set when added to form
  };
}

// Default form structure
export function createDefaultForm(name = 'New Form') {
  return {
    name,
    fields: [],
    settings: {
      submitButtonText: 'Submit',
      submitButtonPosition: 'left', // left, center, right
      successMessage: 'Thank you! Your submission has been received.',
      errorMessage: 'Something went wrong. Please try again.',
      redirectUrl: null,
      emailNotifications: {
        enabled: false,
        recipients: [],
        subject: 'New form submission'
      }
    },
    styling: {
      fieldSpacing: 16,
      labelPosition: 'top', // top, left, floating
      buttonColor: '#000000',
      buttonTextColor: '#ffffff',
      borderRadius: 8
    }
  };
}

// Validate form schema
export function validateFormSchema(formData) {
  const errors = [];
  
  if (!formData.name || formData.name.trim() === '') {
    errors.push('Form name is required');
  }
  
  if (!formData.fields || formData.fields.length === 0) {
    errors.push('Form must have at least one field');
  }
  
  // Validate each field
  formData.fields?.forEach((field, index) => {
    if (!field.id) {
      errors.push(`Field ${index + 1}: Missing ID`);
    }
    if (!field.type || !FIELD_TYPES[field.type.toUpperCase()]) {
      errors.push(`Field ${index + 1}: Invalid type`);
    }
    if (!field.label || field.label.trim() === '') {
      errors.push(`Field ${index + 1}: Label is required`);
    }
    
    // Validate options for select/checkbox/radio
    if ([FIELD_TYPES.SELECT, FIELD_TYPES.CHECKBOX, FIELD_TYPES.RADIO].includes(field.type)) {
      if (!field.options || field.options.length === 0) {
        errors.push(`Field ${index + 1}: Options are required for ${field.type} fields`);
      }
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Generate form slug from name
export function generateFormSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Field type metadata for UI
export const FIELD_TYPE_METADATA = {
  [FIELD_TYPES.TEXT]: {
    icon: '📝',
    label: 'Text Input',
    description: 'Single line text field'
  },
  [FIELD_TYPES.EMAIL]: {
    icon: '📧',
    label: 'Email',
    description: 'Email address field'
  },
  [FIELD_TYPES.PHONE]: {
    icon: '📱',
    label: 'Phone',
    description: 'Phone number field'
  },
  [FIELD_TYPES.NUMBER]: {
    icon: '🔢',
    label: 'Number',
    description: 'Numeric input field'
  },
  [FIELD_TYPES.TEXTAREA]: {
    icon: '📄',
    label: 'Text Area',
    description: 'Multi-line text field'
  },
  [FIELD_TYPES.SELECT]: {
    icon: '📋',
    label: 'Dropdown',
    description: 'Select from options'
  },
  [FIELD_TYPES.CHECKBOX]: {
    icon: '☑️',
    label: 'Checkboxes',
    description: 'Multiple choice selection'
  },
  [FIELD_TYPES.RADIO]: {
    icon: '🔘',
    label: 'Radio Buttons',
    description: 'Single choice selection'
  },
  [FIELD_TYPES.DATE]: {
    icon: '📅',
    label: 'Date Picker',
    description: 'Date selection field'
  },
  [FIELD_TYPES.FILE]: {
    icon: '📎',
    label: 'File Upload',
    description: 'File attachment field'
  }
};
