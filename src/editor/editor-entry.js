// SenangWebs Tour Editor - Entry Point
// This file bundles all editor modules for distribution

// Import all editor modules in dependency order
import './js/utils.js';
import './js/storage-manager.js';
import './js/scene-manager.js';
import './js/hotspot-editor.js';
import './js/preview-controller.js';
import './js/ui-controller.js';
import './js/export-manager.js';
import './js/editor.js';
import './js/ui-init.js';

// The editor classes are attached to the global window object
// and initialized via ui-init.js when DOM is ready
