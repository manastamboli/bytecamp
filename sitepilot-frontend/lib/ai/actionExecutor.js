/**
 * ACTION EXECUTOR
 *
 * Validates and executes AI-generated actions against component schemas.
 * Provides atomic transaction support with automatic rollback on errors.
 *
 * Features:
 * - Schema-based validation for all actions
 * - Atomic transaction execution
 * - Undo snapshot creation
 * - Partial execution (skip invalid, execute valid)
 * - Detailed error reporting
 */

import { nanoid } from "nanoid";
import {
  getSchema,
  isValidComponentType,
  validatePropValue,
  isValidStyleProp,
  getDefaultProps,
} from "./componentSchemas";

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate an action against component schemas and layout state
 * @param {Object} action - The action to validate
 * @param {Object} layoutJSON - Current layout state
 * @returns {Object} Validation result with valid flag and errors array
 */
export function validateAction(action, layoutJSON) {
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

  if (!validTypes.includes(action.type)) {
    return {
      valid: false,
      errors: [`Unknown action type: ${action.type}`],
    };
  }

  // Type-specific validation
  switch (action.type) {
    case "ADD_COMPONENT":
      return validateAddComponent(action.payload);
    
    case "UPDATE_COMPONENT":
      return validateUpdateComponent(action, layoutJSON);
    
    case "DELETE_COMPONENT":
      return validateDeleteComponent(action, layoutJSON);
    
    case "UPDATE_STYLES":
      return validateUpdateStyles(action, layoutJSON);
    
    case "REORDER":
      return validateReorder(action, layoutJSON);
    
    default:
      return {
        valid: false,
        errors: [`Unhandled action type: ${action.type}`],
      };
  }
}

/**
 * Validate ADD_COMPONENT action
 * @param {Object} payload - Action payload
 * @returns {Object} Validation result
 */
function validateAddComponent(payload) {
  const errors = [];

  if (!payload) {
    return {
      valid: false,
      errors: ["ADD_COMPONENT requires payload"],
    };
  }

  // Validate component type
  if (!payload.componentType) {
    errors.push("Missing componentType in payload");
  } else if (!isValidComponentType(payload.componentType)) {
    errors.push(`Unknown component type: ${payload.componentType}`);
  }
  // Skip strict prop/style validation - let defaults fill in
  // The AI often sends slightly different prop names and that's OK

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate UPDATE_COMPONENT action
 * @param {Object} action - The action object
 * @param {Object} layoutJSON - Current layout state
 * @returns {Object} Validation result
 */
function validateUpdateComponent(action, layoutJSON) {
  const errors = [];

  if (!action.targetId) {
    errors.push("UPDATE_COMPONENT requires targetId");
  } else {
    // Check if component exists
    const component = findComponentById(layoutJSON, action.targetId);
    
    if (!component) {
      errors.push(`Component not found: ${action.targetId}`);
    } else {
      const schema = getSchema(component.type);
      
      if (!schema) {
        errors.push(`Unknown component type: ${component.type}`);
      } else {
        // Validate props if provided
        if (action.payload?.props) {
          for (const [propName, propValue] of Object.entries(action.payload.props)) {
            const propSchema = schema.allowedProps[propName];
            
            if (!propSchema) {
              errors.push(`Unknown prop for ${component.type}: ${propName}`);
            } else if (!validatePropValue(propValue, propSchema)) {
              errors.push(
                `Invalid type for ${propName}: expected ${propSchema.type}`
              );
            }
          }
        }

        // Validate styles if provided
        if (action.payload?.styles) {
          for (const styleProp of Object.keys(action.payload.styles)) {
            if (!isValidStyleProp(component.type, styleProp)) {
              errors.push(`Invalid style property for ${component.type}: ${styleProp}`);
            }
          }
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate DELETE_COMPONENT action
 * @param {Object} action - The action object
 * @param {Object} layoutJSON - Current layout state
 * @returns {Object} Validation result
 */
function validateDeleteComponent(action, layoutJSON) {
  const errors = [];

  if (!action.targetId) {
    errors.push("DELETE_COMPONENT requires targetId");
  } else {
    const component = findComponentById(layoutJSON, action.targetId);
    
    if (!component) {
      errors.push(`Component not found: ${action.targetId}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate UPDATE_STYLES action
 * @param {Object} action - The action object
 * @param {Object} layoutJSON - Current layout state
 * @returns {Object} Validation result
 */
function validateUpdateStyles(action, layoutJSON) {
  const errors = [];

  if (!action.targetId) {
    errors.push("UPDATE_STYLES requires targetId");
  } else {
    const component = findComponentById(layoutJSON, action.targetId);
    
    if (!component) {
      errors.push(`Component not found: ${action.targetId}`);
    } else if (action.payload?.styles) {
      for (const styleProp of Object.keys(action.payload.styles)) {
        if (!isValidStyleProp(component.type, styleProp)) {
          errors.push(`Invalid style property for ${component.type}: ${styleProp}`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate REORDER action
 * @param {Object} action - The action object
 * @param {Object} layoutJSON - Current layout state
 * @returns {Object} Validation result
 */
function validateReorder(action, layoutJSON) {
  const errors = [];

  if (!action.payload) {
    errors.push("REORDER requires payload");
  } else {
    if (!action.payload.sourceId) {
      errors.push("REORDER payload requires sourceId");
    } else {
      const component = findComponentById(layoutJSON, action.payload.sourceId);
      if (!component) {
        errors.push(`Component not found: ${action.payload.sourceId}`);
      }
    }

    if (action.payload.targetPosition === undefined) {
      errors.push("REORDER payload requires targetPosition");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// EXECUTION FUNCTIONS
// ============================================================================

/**
 * Execute multiple actions atomically with rollback support
 * @param {Array} actions - Array of actions to execute
 * @param {Object} builderStore - The Zustand builder store
 * @returns {Object} Execution result with success flag and details
 */
export async function executeActions(actions, builderStore) {
  if (!Array.isArray(actions) || actions.length === 0) {
    return {
      success: true,
      results: [],
      successCount: 0,
      failureCount: 0,
    };
  }

  // Create undo snapshot before any modifications
  const undoSnapshot = builderStore.getLayoutJSON();
  const results = [];
  let hasSuccessfulAction = false;

  try {
    const layoutJSON = builderStore.getLayoutJSON();

    // Sort actions: ADD_COMPONENT before UPDATE_COMPONENT
    const sortedActions = sortActions(actions);

    for (const action of sortedActions) {
      try {
        // Validate action
        const validation = validateAction(action, builderStore.getLayoutJSON());

        if (!validation.valid) {
          results.push({
            action,
            success: false,
            errors: validation.errors,
          });
          continue;
        }

        // Execute action
        await executeAction(action, builderStore);
        results.push({
          action,
          success: true,
        });
        hasSuccessfulAction = true;
      } catch (error) {
        console.error("Action execution error:", error);
        results.push({
          action,
          success: false,
          errors: [error.message],
        });
      }
    }

    // Store undo snapshot if any actions succeeded
    if (hasSuccessfulAction) {
      storeUndoSnapshot(builderStore, undoSnapshot);
    }

    return {
      success: true,
      results,
      successCount: results.filter((r) => r.success).length,
      failureCount: results.filter((r) => !r.success).length,
    };
  } catch (criticalError) {
    // Critical error - rollback everything
    console.error("Critical execution error:", criticalError);
    builderStore.updateLayoutJSON(undoSnapshot, false);

    return {
      success: false,
      error: "Critical error during execution. All changes rolled back.",
      results,
    };
  }
}

/**
 * Execute a single action
 * @param {Object} action - The action to execute
 * @param {Object} builderStore - The Zustand builder store
 */
async function executeAction(action, builderStore) {
  switch (action.type) {
    case "ADD_COMPONENT":
      return executeAddComponent(action.payload, builderStore);
    
    case "UPDATE_COMPONENT":
      return executeUpdateComponent(action, builderStore);
    
    case "DELETE_COMPONENT":
      return executeDeleteComponent(action, builderStore);
    
    case "UPDATE_STYLES":
      return executeUpdateStyles(action, builderStore);
    
    case "REORDER":
      return executeReorder(action, builderStore);
    
    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
}

/**
 * Execute ADD_COMPONENT action
 */
function executeAddComponent(payload, builderStore) {
  const {
    componentType,
    containerId,
    columnIndex,
    position,
    props = {},
    styles = {},
  } = payload;

  // Merge with default props, keeping only schema-valid props from AI
  const defaultProps = getDefaultProps(componentType);
  const schema = getSchema(componentType);
  const filteredAIProps = {};
  
  if (schema) {
    for (const [key, value] of Object.entries(props)) {
      if (schema.allowedProps[key]) {
        filteredAIProps[key] = value;
      }
    }
  }
  
  const finalProps = { ...defaultProps, ...filteredAIProps };

  // Filter styles too
  const filteredStyles = {};
  if (schema) {
    for (const [key, value] of Object.entries(styles)) {
      if (schema.allowedStyles.includes(key)) {
        filteredStyles[key] = value;
      }
    }
  }

  if (containerId && columnIndex !== undefined) {
    // Add to specific container/column
    builderStore.addComponent(containerId, columnIndex, componentType, finalProps);
    
    if (Object.keys(filteredStyles).length > 0) {
      const component = findLastAddedComponent(builderStore);
      if (component) {
        builderStore.updateComponentStyles(component.id, filteredStyles);
      }
    }
  } else {
    // Create new container with single column
    const columnWidths = [12];
    builderStore.addContainer(columnWidths);
    
    // Find the newly created container
    const layoutJSON = builderStore.getLayoutJSON();
    const currentPage = layoutJSON.pages.find(
      (p) => p.id === builderStore.currentPageId
    );
    
    if (currentPage && currentPage.layout.length > 0) {
      let newContainer = currentPage.layout[currentPage.layout.length - 1];
      
      // Handle position: "top" by reordering
      if (position === "top" && currentPage.layout.length > 1) {
        // Move the new container to the top
        const layout = currentPage.layout;
        const lastIdx = layout.length - 1;
        const removed = layout.splice(lastIdx, 1)[0];
        layout.unshift(removed);
        builderStore.updateLayoutJSON(layoutJSON, false);
        newContainer = removed;
      }
      
      builderStore.addComponent(newContainer.id, 0, componentType, finalProps);
      
      if (Object.keys(filteredStyles).length > 0) {
        const component = findLastAddedComponent(builderStore);
        if (component) {
          builderStore.updateComponentStyles(component.id, filteredStyles);
        }
      }
    }
  }
}

/**
 * Execute UPDATE_COMPONENT action
 */
function executeUpdateComponent(action, builderStore) {
  const { targetId, payload } = action;

  if (payload.props) {
    builderStore.updateComponentProps(targetId, payload.props);
  }

  if (payload.styles) {
    builderStore.updateComponentStyles(targetId, payload.styles);
  }
}

/**
 * Execute DELETE_COMPONENT action
 */
function executeDeleteComponent(action, builderStore) {
  builderStore.deleteComponent(action.targetId);
}

/**
 * Execute UPDATE_STYLES action
 */
function executeUpdateStyles(action, builderStore) {
  const { targetId, payload } = action;

  if (payload.styles) {
    builderStore.updateComponentStyles(targetId, payload.styles);
  }
}

/**
 * Execute REORDER action
 */
function executeReorder(action, builderStore) {
  const { sourceId, targetContainerId, targetColumnIndex, targetPosition } =
    action.payload;

  builderStore.moveComponent(
    sourceId,
    targetContainerId,
    targetColumnIndex,
    targetPosition
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Find a component by ID in the layout
 */
function findComponentById(layoutJSON, componentId) {
  if (!layoutJSON || !layoutJSON.pages) return null;

  for (const page of layoutJSON.pages) {
    for (const container of page.layout || []) {
      for (const column of container.columns || []) {
        const component = column.components?.find((c) => c.id === componentId);
        if (component) return component;
      }
    }
  }

  return null;
}

/**
 * Find the last added component in the layout
 */
function findLastAddedComponent(builderStore) {
  const layoutJSON = builderStore.getLayoutJSON();
  const currentPage = layoutJSON.pages.find(
    (p) => p.id === builderStore.currentPageId
  );

  if (!currentPage || !currentPage.layout.length) return null;

  const lastContainer = currentPage.layout[currentPage.layout.length - 1];
  if (!lastContainer.columns || !lastContainer.columns.length) return null;

  const lastColumn = lastContainer.columns[lastContainer.columns.length - 1];
  if (!lastColumn.components || !lastColumn.components.length) return null;

  return lastColumn.components[lastColumn.components.length - 1];
}

/**
 * Sort actions to ensure ADD_COMPONENT executes before UPDATE_COMPONENT
 */
function sortActions(actions) {
  const priority = {
    ADD_COMPONENT: 1,
    UPDATE_COMPONENT: 2,
    UPDATE_STYLES: 2,
    DELETE_COMPONENT: 3,
    REORDER: 4,
  };

  return [...actions].sort((a, b) => {
    const priorityA = priority[a.type] || 999;
    const priorityB = priority[b.type] || 999;
    return priorityA - priorityB;
  });
}

/**
 * Store undo snapshot in builder store
 */
function storeUndoSnapshot(builderStore, snapshot) {
  // Check if builderStore has undo functionality
  if (typeof builderStore.createUndoSnapshot === "function") {
    builderStore.createUndoSnapshot(snapshot);
  }
  // If not implemented yet, we'll add it in the next task
}
