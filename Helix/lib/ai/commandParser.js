/**
 * COMMAND PARSER
 *
 * Parses AI responses to extract conversational text and executable actions.
 * Supports multiple formats:
 * - JSON in markdown code blocks (```json ... ```)
 * - Inline JSON objects
 * - Plain text responses (no actions)
 *
 * Action Types:
 * - ADD_COMPONENT: Add a new component to the layout
 * - UPDATE_COMPONENT: Modify existing component props/styles
 * - DELETE_COMPONENT: Remove a component
 * - UPDATE_STYLES: Change component styles only
 * - REORDER: Change component order
 */

// ============================================================================
// PARSER FUNCTIONS
// ============================================================================

/**
 * Parse AI response text to extract conversational text and actions
 * @param {string} responseText - The complete AI response text
 * @returns {Object} Parsed response with text, actions, and confidence
 */
export function parseAIResponse(responseText) {
  if (!responseText || typeof responseText !== "string") {
    return {
      success: false,
      text: "",
      actions: [],
      confidence: 0,
      error: "Invalid response text",
    };
  }

  try {
    let cleanText = responseText;
    
    // Try to extract JSON from markdown code block
    const jsonMatch = responseText.match(/```json\s*\n([\s\S]*?)\n```/);
    if (jsonMatch) {
        // Remove the JSON block from the visible text
        cleanText = responseText.replace(/```json\s*\n[\s\S]*?\n```/, "").trim();
        return parseJSONBlock(jsonMatch[1], cleanText);
    }

    // Try to find inline JSON object if no code block was used
    const inlineMatch = responseText.match(/\{[\s\S]*?"actions"[\s\S]*?\}/);
    if (inlineMatch && !responseText.includes("```")) {
        cleanText = responseText.replace(inlineMatch[0], "").trim();
        return parseJSONBlock(inlineMatch[0], cleanText);
    }

    // No JSON found - treat as plain text response with no actions
    return {
      success: true,
      text: cleanText.trim(),
      actions: [],
      confidence: 0.8,
    };
  } catch (error) {
    console.error("Parse error:", error);
    
    // Fallback: return text with no actions
    return {
      success: false,
      text: responseText.trim(),
      actions: [],
      confidence: 0,
      error: `Failed to parse AI response: ${error.message}`,
    };
  }
}

/**
 * Parse a JSON block and extract text and actions
 * @param {string} jsonText - The JSON text to parse
 * @param {string} fullResponse - The full response text for fallback
 * @returns {Object} Parsed response object
 */
function parseJSONBlock(jsonText, fullResponse) {
  try {
    const parsed = JSON.parse(jsonText);

    // Validate structure
    if (typeof parsed !== "object" || parsed === null) {
      throw new Error("Response is not a valid object");
    }

    // Extract fields with defaults
    // FullResponse here is already the cleaned text
    const text = (parsed.text ? parsed.text + "\n" : "") + fullResponse;
    const cleanText = text.trim() || "Action completed.";
    const actions = Array.isArray(parsed.actions) ? parsed.actions : [];
    const confidence = typeof parsed.confidence === "number" 
      ? Math.max(0, Math.min(1, parsed.confidence))
      : 0.8;

    // Validate actions array
    const validatedActions = actions.filter(action => {
      if (!action || typeof action !== "object") return false;
      if (!action.type || typeof action.type !== "string") return false;
      return true;
    });

    return {
      success: true,
      text: cleanText,
      actions: validatedActions,
      confidence,
    };
  } catch (error) {
    console.error("JSON parse error:", error);
    
    return {
      success: false,
      text: fullResponse.trim(),
      actions: [],
      confidence: 0,
      error: `Failed to parse JSON: ${error.message}`,
    };
  }
}

/**
 * Validate an action object structure
 * @param {Object} action - The action to validate
 * @returns {Object} Validation result with valid flag and errors
 */
export function validateActionStructure(action) {
  const errors = [];

  if (!action || typeof action !== "object") {
    return {
      valid: false,
      errors: ["Action must be an object"],
    };
  }

  // Validate action type
  const validTypes = [
    "ADD_COMPONENT",
    "UPDATE_COMPONENT",
    "DELETE_COMPONENT",
    "UPDATE_STYLES",
    "REORDER",
  ];

  if (!action.type) {
    errors.push("Action missing required 'type' field");
  } else if (!validTypes.includes(action.type)) {
    errors.push(`Unknown action type: ${action.type}`);
  }

  // Validate payload exists for non-DELETE actions
  if (action.type !== "DELETE_COMPONENT" && !action.payload) {
    errors.push("Action missing required 'payload' field");
  }

  // Validate targetId for UPDATE/DELETE actions
  if (
    (action.type === "UPDATE_COMPONENT" ||
      action.type === "DELETE_COMPONENT" ||
      action.type === "UPDATE_STYLES") &&
    !action.targetId
  ) {
    errors.push(`${action.type} requires 'targetId' field`);
  }

  // Type-specific validation
  if (action.type === "ADD_COMPONENT" && action.payload) {
    if (!action.payload.componentType) {
      errors.push("ADD_COMPONENT payload missing 'componentType'");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Extract all actions from a parsed response
 * @param {Object} parsedResponse - The parsed response object
 * @returns {Array} Array of action objects
 */
export function extractActions(parsedResponse) {
  if (!parsedResponse || !parsedResponse.actions) {
    return [];
  }

  return parsedResponse.actions.filter(action => {
    const validation = validateActionStructure(action);
    if (!validation.valid) {
      console.warn("Invalid action structure:", validation.errors, action);
      return false;
    }
    return true;
  });
}

/**
 * Check if response contains any executable actions
 * @param {Object} parsedResponse - The parsed response object
 * @returns {boolean} True if actions exist, false otherwise
 */
export function hasActions(parsedResponse) {
  return (
    parsedResponse &&
    Array.isArray(parsedResponse.actions) &&
    parsedResponse.actions.length > 0
  );
}

/**
 * Get conversational text from parsed response
 * @param {Object} parsedResponse - The parsed response object
 * @returns {string} The conversational text
 */
export function getResponseText(parsedResponse) {
  return parsedResponse?.text || "";
}

/**
 * Check if response indicates a clarifying question
 * @param {string} responseText - The response text
 * @returns {boolean} True if it's a question, false otherwise
 */
export function isQuestion(responseText) {
  if (!responseText) return false;
  
  const text = responseText.trim();
  
  // Check for question mark
  if (text.endsWith("?")) return true;
  
  // Check for common question patterns
  const questionPatterns = [
    /^(what|which|where|when|who|how|why|can|could|would|should|do|does|did|is|are|was|were)\b/i,
    /\b(clarify|specify|confirm|tell me|let me know)\b/i,
  ];
  
  return questionPatterns.some(pattern => pattern.test(text));
}

/**
 * Detect if response is an undo command
 * @param {string} userMessage - The user's message
 * @returns {boolean} True if undo command detected
 */
export function isUndoCommand(userMessage) {
  if (!userMessage) return false;
  
  const text = userMessage.toLowerCase().trim();
  const undoKeywords = [
    "undo",
    "revert",
    "go back",
    "undo that",
    "revert that",
    "undo last",
    "revert last",
    "undo the last",
    "cancel that",
  ];
  
  return undoKeywords.some(keyword => text.includes(keyword));
}

/**
 * Format action for display/logging
 * @param {Object} action - The action object
 * @returns {string} Formatted action description
 */
export function formatActionDescription(action) {
  if (!action || !action.type) return "Unknown action";

  switch (action.type) {
    case "ADD_COMPONENT":
      return `Add ${action.payload?.componentType || "component"}`;
    
    case "UPDATE_COMPONENT":
      return `Update component ${action.targetId}`;
    
    case "DELETE_COMPONENT":
      return `Delete component ${action.targetId}`;
    
    case "UPDATE_STYLES":
      return `Update styles for ${action.targetId}`;
    
    case "REORDER":
      return `Reorder component ${action.payload?.sourceId || ""}`;
    
    default:
      return `${action.type}`;
  }
}
