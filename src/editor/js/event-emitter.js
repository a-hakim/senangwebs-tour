/**
 * Event Emitter for TourEditor
 * 
 * Provides a comprehensive event system for the editor with:
 * - Specific events for all editor operations
 * - A unified 'change' event that fires for any modification
 * - Support for wildcards and namespaced events
 */

/**
 * Event types for the Tour Editor
 * These are the available events that can be listened to
 */
export const EditorEvents = {
  // Lifecycle
  INIT: 'init',
  READY: 'ready',
  DESTROY: 'destroy',
  
  // Scene events
  SCENE_ADD: 'scene:add',
  SCENE_REMOVE: 'scene:remove',
  SCENE_SELECT: 'scene:select',
  SCENE_UPDATE: 'scene:update',
  SCENE_REORDER: 'scene:reorder',
  SCENE_CLEAR: 'scene:clear',
  SCENE_IMAGE_CHANGE: 'scene:imageChange',
  SCENE_STARTING_POSITION_SET: 'scene:startingPositionSet',
  SCENE_STARTING_POSITION_CLEAR: 'scene:startingPositionClear',
  
  // Hotspot events
  HOTSPOT_ADD: 'hotspot:add',
  HOTSPOT_REMOVE: 'hotspot:remove',
  HOTSPOT_SELECT: 'hotspot:select',
  HOTSPOT_UPDATE: 'hotspot:update',
  HOTSPOT_DUPLICATE: 'hotspot:duplicate',
  HOTSPOT_POSITION_CHANGE: 'hotspot:positionChange',
  
  // Project events
  PROJECT_NEW: 'project:new',
  PROJECT_SAVE: 'project:save',
  PROJECT_LOAD: 'project:load',
  PROJECT_IMPORT: 'project:import',
  PROJECT_EXPORT: 'project:export',
  
  // Config/Tour events
  CONFIG_UPDATE: 'config:update',
  INITIAL_SCENE_CHANGE: 'config:initialSceneChange',
  TOUR_TITLE_CHANGE: 'tour:titleChange',
  TOUR_DESCRIPTION_CHANGE: 'tour:descriptionChange',
  
  // Preview events
  PREVIEW_START: 'preview:start',
  PREVIEW_STOP: 'preview:stop',
  PREVIEW_SCENE_CHANGE: 'preview:sceneChange',
  
  // UI events
  UI_RENDER: 'ui:render',
  UI_LOADING_START: 'ui:loadingStart',
  UI_LOADING_END: 'ui:loadingEnd',
  MODAL_OPEN: 'ui:modalOpen',
  MODAL_CLOSE: 'ui:modalClose',
  
  // Data events
  DATA_CHANGE: 'data:change',      // Fires when any data changes
  UNSAVED_CHANGES: 'data:unsavedChanges',
  
  // Unified change event - fires for ANY modification
  CHANGE: 'change'
};

/**
 * Event Emitter class
 * Provides pub/sub functionality for editor events
 */
class EventEmitter {
  constructor() {
    this.listeners = new Map();
    this.onceListeners = new Map();
  }

  /**
   * Register an event listener
   * @param {string} event - Event name or 'change' for all changes
   * @param {Function} callback - Function to call when event fires
   * @returns {Function} Unsubscribe function
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    
    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  /**
   * Register a one-time event listener
   * @param {string} event - Event name
   * @param {Function} callback - Function to call once when event fires
   * @returns {Function} Unsubscribe function
   */
  once(event, callback) {
    if (!this.onceListeners.has(event)) {
      this.onceListeners.set(event, new Set());
    }
    this.onceListeners.get(event).add(callback);
    
    return () => {
      if (this.onceListeners.has(event)) {
        this.onceListeners.get(event).delete(callback);
      }
    };
  }

  /**
   * Remove an event listener
   * @param {string} event - Event name
   * @param {Function} callback - Function to remove
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
    if (this.onceListeners.has(event)) {
      this.onceListeners.get(event).delete(callback);
    }
  }

  /**
   * Remove all listeners for an event, or all listeners if no event specified
   * @param {string} [event] - Optional event name
   */
  removeAllListeners(event) {
    if (event) {
      this.listeners.delete(event);
      this.onceListeners.delete(event);
    } else {
      this.listeners.clear();
      this.onceListeners.clear();
    }
  }

  /**
   * Emit an event
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  emit(event, data = {}) {
    const eventData = {
      type: event,
      timestamp: Date.now(),
      ...data
    };

    // Call specific event listeners
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(eventData);
        } catch (error) {
          console.error(`Error in event listener for "${event}":`, error);
        }
      });
    }

    // Call once listeners and remove them
    if (this.onceListeners.has(event)) {
      const onceCallbacks = this.onceListeners.get(event);
      this.onceListeners.delete(event);
      onceCallbacks.forEach(callback => {
        try {
          callback(eventData);
        } catch (error) {
          console.error(`Error in once listener for "${event}":`, error);
        }
      });
    }

    // Also emit to wildcard listeners (namespace:*)
    const namespace = event.split(':')[0];
    const wildcardEvent = `${namespace}:*`;
    if (this.listeners.has(wildcardEvent)) {
      this.listeners.get(wildcardEvent).forEach(callback => {
        try {
          callback(eventData);
        } catch (error) {
          console.error(`Error in wildcard listener for "${wildcardEvent}":`, error);
        }
      });
    }

    // Emit unified 'change' event for data-modifying events
    if (this.isDataModifyingEvent(event) && event !== EditorEvents.CHANGE) {
      this.emit(EditorEvents.CHANGE, {
        originalEvent: event,
        ...data
      });
    }
  }

  /**
   * Check if an event modifies data (should trigger 'change' event)
   * @param {string} event - Event name
   * @returns {boolean}
   */
  isDataModifyingEvent(event) {
    const dataEvents = [
      EditorEvents.SCENE_ADD,
      EditorEvents.SCENE_REMOVE,
      EditorEvents.SCENE_SELECT,
      EditorEvents.SCENE_UPDATE,
      EditorEvents.SCENE_REORDER,
      EditorEvents.SCENE_CLEAR,
      EditorEvents.SCENE_IMAGE_CHANGE,
      EditorEvents.SCENE_STARTING_POSITION_SET,
      EditorEvents.SCENE_STARTING_POSITION_CLEAR,
      EditorEvents.HOTSPOT_ADD,
      EditorEvents.HOTSPOT_REMOVE,
      EditorEvents.HOTSPOT_SELECT,
      EditorEvents.HOTSPOT_UPDATE,
      EditorEvents.HOTSPOT_DUPLICATE,
      EditorEvents.HOTSPOT_POSITION_CHANGE,
      EditorEvents.CONFIG_UPDATE,
      EditorEvents.INITIAL_SCENE_CHANGE,
      EditorEvents.TOUR_TITLE_CHANGE,
      EditorEvents.TOUR_DESCRIPTION_CHANGE,
      EditorEvents.PROJECT_LOAD,
      EditorEvents.PROJECT_IMPORT,
      EditorEvents.PROJECT_NEW,
      EditorEvents.DATA_CHANGE
    ];
    return dataEvents.includes(event);
  }

  /**
   * Get the number of listeners for an event
   * @param {string} event - Event name
   * @returns {number}
   */
  listenerCount(event) {
    let count = 0;
    if (this.listeners.has(event)) {
      count += this.listeners.get(event).size;
    }
    if (this.onceListeners.has(event)) {
      count += this.onceListeners.get(event).size;
    }
    return count;
  }

  /**
   * Get all event names that have listeners
   * @returns {string[]}
   */
  eventNames() {
    const names = new Set([...this.listeners.keys(), ...this.onceListeners.keys()]);
    return Array.from(names);
  }
}

export default EventEmitter;
