/**
 * FORM RENDERER
 * Generates HTML and JavaScript for forms on published sites
 */

import { FIELD_WIDTHS } from './form-schema';

// Generate HTML for a form field
function generateFieldHTML(field) {
  const widthClass = field.width === FIELD_WIDTHS.HALF ? 'w-1/2' : 
                     field.width === FIELD_WIDTHS.THIRD ? 'w-1/3' : 
                     'w-full';
  
  const requiredAttr = field.required ? 'required' : '';
  const requiredLabel = field.required ? '<span class="text-red-500">*</span>' : '';

  let inputHTML = '';

  switch (field.type) {
    case 'textarea':
      inputHTML = `
        <textarea
          id="${field.id}"
          name="${field.id}"
          placeholder="${field.placeholder || ''}"
          rows="${field.rows || 4}"
          ${requiredAttr}
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        ></textarea>
      `;
      break;

    case 'select':
      const options = field.options?.map(opt => 
        `<option value="${opt.value}">${opt.label}</option>`
      ).join('') || '';
      inputHTML = `
        <select
          id="${field.id}"
          name="${field.id}"
          ${requiredAttr}
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">${field.placeholder || 'Select an option'}</option>
          ${options}
        </select>
      `;
      break;

    case 'checkbox':
      const checkboxLayout = field.layout === 'horizontal' ? 'flex flex-wrap gap-4' : 'space-y-2';
      const checkboxes = field.options?.map(opt => `
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            name="${field.id}"
            value="${opt.value}"
            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span class="text-sm text-gray-700">${opt.label}</span>
        </label>
      `).join('') || '';
      inputHTML = `<div class="${checkboxLayout}">${checkboxes}</div>`;
      break;

    case 'radio':
      const radioLayout = field.layout === 'horizontal' ? 'flex flex-wrap gap-4' : 'space-y-2';
      const radios = field.options?.map(opt => `
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="${field.id}"
            value="${opt.value}"
            ${requiredAttr}
            class="border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span class="text-sm text-gray-700">${opt.label}</span>
        </label>
      `).join('') || '';
      inputHTML = `<div class="${radioLayout}">${radios}</div>`;
      break;

    case 'file':
      inputHTML = `
        <input
          type="file"
          id="${field.id}"
          name="${field.id}"
          ${requiredAttr}
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      `;
      break;

    default:
      inputHTML = `
        <input
          type="${field.type}"
          id="${field.id}"
          name="${field.id}"
          placeholder="${field.placeholder || ''}"
          ${requiredAttr}
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      `;
  }

  return `
    <div class="${widthClass} px-2 mb-4">
      <label for="${field.id}" class="block text-sm font-medium text-gray-700 mb-2">
        ${field.label} ${requiredLabel}
      </label>
      ${inputHTML}
    </div>
  `;
}

// Generate complete form HTML
export function generateFormHTML(form) {
  const fields = form.schema || [];
  const settings = form.settings || {};
  const styling = form.styling || {};

  const fieldsHTML = fields
    .sort((a, b) => a.order - b.order)
    .map(generateFieldHTML)
    .join('');

  const buttonPosition = settings.submitButtonPosition === 'center' ? 'justify-center' :
                        settings.submitButtonPosition === 'right' ? 'justify-end' :
                        'justify-start';

  return `
    <form 
      id="form-${form.id}" 
      data-form-id="${form.id}"
      class="max-w-4xl mx-auto"
      novalidate
    >
      <div class="flex flex-wrap -mx-2">
        ${fieldsHTML}
      </div>
      
      <div class="flex ${buttonPosition} mt-6 px-2">
        <button
          type="submit"
          class="px-6 py-3 text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
          style="background-color: ${styling.buttonColor || '#000000'}; color: ${styling.buttonTextColor || '#ffffff'};"
        >
          ${settings.submitButtonText || 'Submit'}
        </button>
      </div>

      <!-- Success Message (hidden by default) -->
      <div id="form-${form.id}-success" class="hidden mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <p class="text-green-800">${settings.successMessage || 'Thank you! Your submission has been received.'}</p>
      </div>

      <!-- Error Message (hidden by default) -->
      <div id="form-${form.id}-error" class="hidden mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
        <p class="text-red-800"></p>
      </div>
    </form>
  `;
}

// Generate JavaScript for form submission
export function generateFormJS(form, apiBaseUrl) {
  // Ensure apiBaseUrl is provided and doesn't end with slash
  if (!apiBaseUrl) {
    throw new Error('apiBaseUrl is required for form submission');
  }
  const cleanApiBaseUrl = apiBaseUrl.replace(/\/$/, '');
  
  return `
    (function() {
      const form = document.getElementById('form-${form.id}');
      const successDiv = document.getElementById('form-${form.id}-success');
      const errorDiv = document.getElementById('form-${form.id}-error');
      
      if (!form) return;

      form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Hide previous messages
        successDiv.classList.add('hidden');
        errorDiv.classList.add('hidden');
        
        // Get form data
        const formData = new FormData(form);
        const data = {};
        
        // Process form data
        for (const [key, value] of formData.entries()) {
          if (data[key]) {
            // Handle multiple values (checkboxes)
            if (Array.isArray(data[key])) {
              data[key].push(value);
            } else {
              data[key] = [data[key], value];
            }
          } else {
            data[key] = value;
          }
        }
        
        // Disable submit button
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';
        
        try {
          // Always use the full API URL (never relative)
          const apiUrl = '${cleanApiBaseUrl}/api/forms/${form.id}/submit';
          console.log('Submitting to:', apiUrl);
          
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ data })
          });
          
          const result = await response.json();
          
          if (response.ok) {
            // Show success message
            successDiv.classList.remove('hidden');
            form.reset();
            
            // Redirect if specified
            if (result.redirectUrl) {
              setTimeout(() => {
                window.location.href = result.redirectUrl;
              }, 2000);
            }
          } else {
            // Show error message
            errorDiv.querySelector('p').textContent = result.message || 'Something went wrong. Please try again.';
            errorDiv.classList.remove('hidden');
          }
        } catch (error) {
          console.error('Form submission error:', error);
          errorDiv.querySelector('p').textContent = 'Network error. Please check your connection and try again.';
          errorDiv.classList.remove('hidden');
        } finally {
          // Re-enable submit button
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }
      });
    })();
  `;
}

// Generate CSS for form styling
export function generateFormCSS(form) {
  const styling = form.styling || {};
  
  return `
    #form-${form.id} {
      font-family: system-ui, -apple-system, sans-serif;
    }
    
    #form-${form.id} input:focus,
    #form-${form.id} textarea:focus,
    #form-${form.id} select:focus {
      outline: none;
      border-color: ${styling.buttonColor || '#000000'};
      box-shadow: 0 0 0 3px ${styling.buttonColor || '#000000'}20;
    }
  `;
}
