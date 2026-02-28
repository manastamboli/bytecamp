import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { headers } from 'next/headers'

// Validate field value based on field configuration
function validateField(field, value) {
  const errors = [];

  // Required check
  if (field.required && (!value || value.toString().trim() === '')) {
    errors.push(`${field.label} is required`);
    return errors;
  }

  // Skip validation if field is empty and not required
  if (!value || value.toString().trim() === '') {
    return errors;
  }

  const validation = field.validation || {};

  // Type-specific validation
  switch (field.type) {
    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        errors.push(`${field.label} must be a valid email address`);
      }
      break;

    case 'phone':
      if (validation.pattern) {
        const phoneRegex = new RegExp(validation.pattern);
        if (!phoneRegex.test(value)) {
          errors.push(`${field.label} must be a valid phone number`);
        }
      }
      break;

    case 'number':
      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        errors.push(`${field.label} must be a number`);
      } else {
        if (validation.min !== null && numValue < validation.min) {
          errors.push(`${field.label} must be at least ${validation.min}`);
        }
        if (validation.max !== null && numValue > validation.max) {
          errors.push(`${field.label} must be at most ${validation.max}`);
        }
      }
      break;

    case 'text':
    case 'textarea':
      const strValue = value.toString();
      if (validation.minLength && strValue.length < validation.minLength) {
        errors.push(`${field.label} must be at least ${validation.minLength} characters`);
      }
      if (validation.maxLength && strValue.length > validation.maxLength) {
        errors.push(`${field.label} must be at most ${validation.maxLength} characters`);
      }
      if (validation.pattern) {
        const regex = new RegExp(validation.pattern);
        if (!regex.test(strValue)) {
          errors.push(`${field.label} format is invalid`);
        }
      }
      break;

    case 'checkbox':
      if (field.required && (!Array.isArray(value) || value.length === 0)) {
        errors.push(`${field.label} requires at least one selection`);
      }
      break;

    case 'radio':
    case 'select':
      if (field.required && !value) {
        errors.push(`${field.label} is required`);
      }
      // Validate that value is one of the options
      const validValues = field.options?.map(opt => opt.value) || [];
      if (value && !validValues.includes(value)) {
        errors.push(`${field.label} has an invalid selection`);
      }
      break;
  }

  return errors;
}

// POST /api/forms/[formId]/submit - Submit a form
export async function POST(request, { params }) {
  try {
    const headersList = await headers();
    const { formId } = await params;
    const body = await request.json();
    const { data: submissionData } = body;

    // Get form with schema
    const form = await prisma.form.findUnique({
      where: { id: formId },
      include: {
        site: true
      }
    });

    if (!form) {
      return NextResponse.json(
        { error: 'Form not found' },
        { 
          status: 404,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          }
        }
      );
    }

    // Validate submission data against form schema
    const fields = form.schema || [];
    const validationErrors = [];

    for (const field of fields) {
      const value = submissionData[field.id];
      const fieldErrors = validateField(field, value);
      validationErrors.push(...fieldErrors);
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          errors: validationErrors,
          message: validationErrors[0] // Return first error as main message
        },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          }
        }
      );
    }

    // Get client info
    const ipAddress = headersList.get('x-forwarded-for') || 
                     headersList.get('x-real-ip') || 
                     'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';

    // Save submission to database
    const submission = await prisma.formSubmission.create({
      data: {
        formId,
        data: submissionData,
        ipAddress,
        userAgent
      }
    });

    // TODO: Send email notifications if enabled
    const settings = form.settings || {};
    if (settings.emailNotifications?.enabled) {
      // Email notification logic will go here
      console.log('Email notifications:', settings.emailNotifications);
    }

    // Return success response with CORS headers
    return NextResponse.json({
      success: true,
      message: settings.successMessage || 'Thank you! Your submission has been received.',
      submissionId: submission.id,
      redirectUrl: settings.redirectUrl || null
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });

  } catch (error) {
    console.error('Error submitting form:', error);
    return NextResponse.json(
      { 
        error: 'Failed to submit form',
        message: 'Something went wrong. Please try again.'
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      }
    );
  }
}

// OPTIONS - Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
