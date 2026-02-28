"use client";

/**
 * FORM BUILDER PAGE
 * Simplified form builder with dedicated UI
 */

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import useFormBuilderStore from "@/lib/stores/formBuilderStore";
import FormBuilderToolbar from "@/lib/components/form-builder/FormBuilderToolbar";
import FormFieldsSidebar from "@/lib/components/form-builder/FormFieldsSidebar";
import FormCanvas from "@/lib/components/form-builder/FormCanvas";
import FormPropertiesSidebar from "@/lib/components/form-builder/FormPropertiesSidebar";
import useUIStore from "@/lib/stores/uiStore";
import { Loader2 } from "lucide-react";

export default function FormBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const { initializeForm, formData, markAsSaved, isDirty } = useFormBuilderStore();
  const { setLeftSidebarOpen, setRightSidebarOpen } = useUIStore();

  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  useEffect(() => {
    if (window.innerWidth < 768) {
      setLeftSidebarOpen(false);
      setRightSidebarOpen(false);
    }
  }, [setLeftSidebarOpen, setRightSidebarOpen]);

  // Auth guard
  useEffect(() => {
    if (!isPending && !session) {
      router.push("/signin");
    }
  }, [session, isPending, router]);

  // Load form data
  const loadForm = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/sites/${params.siteId}/forms/${params.formId}`
      );

      if (response.ok) {
        const data = await response.json();
        
        // Initialize form builder with form data
        initializeForm({
          name: data.form.name,
          fields: data.form.schema || [],
          settings: data.form.settings || {
            submitButtonText: 'Submit',
            submitButtonPosition: 'left',
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
            labelPosition: 'top',
            buttonColor: '#000000',
            buttonTextColor: '#ffffff',
            borderRadius: 8
          }
        });
        
        setLastSaved(new Date(data.form.updatedAt));
      }
    } catch (error) {
      console.error("Failed to load form:", error);
      alert("Failed to load form. Please refresh the page.");
    } finally {
      setIsLoading(false);
    }
  }, [params.siteId, params.formId, initializeForm]);

  useEffect(() => {
    if (session && params.formId) {
      loadForm();
    }
  }, [session, params.formId, loadForm]);

  // Save handler
  const handleSave = useCallback(async () => {
    if (!isDirty) return;
    
    setSaving(true);
    try {
      const response = await fetch(
        `/api/sites/${params.siteId}/forms/${params.formId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            schema: formData.fields,
            settings: formData.settings
          }),
        }
      );
      
      if (response.ok) {
        markAsSaved();
        setLastSaved(new Date());
        console.log("Form saved successfully!");
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save');
      }
    } catch (error) {
      console.error("Failed to save form:", error);
      alert("Failed to save form. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [params.siteId, params.formId, formData, markAsSaved, isDirty]);

  // Auto-save every 30 seconds if there are changes
  useEffect(() => {
    if (!isDirty) return;
    
    const autoSaveTimer = setTimeout(() => {
      handleSave();
    }, 30000); // 30 seconds

    return () => clearTimeout(autoSaveTimer);
  }, [isDirty, handleSave]);

  // Keyboard shortcut: Ctrl+S to save
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave]);

  // Loading state
  if (isLoading || isPending) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#fcfdfc]">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-[#0b1411] mx-auto mb-4" />
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">
            Loading Form Builder...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#fcfdfc] font-sans text-gray-900 overflow-hidden text-base">
      {/* Top Toolbar */}
      <FormBuilderToolbar onSave={handleSave} saving={saving} lastSaved={lastSaved} />

      {/* Main Content */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Left Sidebar — Field Types */}
        <FormFieldsSidebar />

        {/* Canvas Area — Form Preview */}
        <FormCanvas />

        {/* Right Sidebar — Field Properties */}
        <FormPropertiesSidebar />
      </div>
    </div>
  );
}
