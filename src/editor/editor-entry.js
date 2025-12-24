// SenangWebs Tour Editor - Entry Point
// This file bundles all editor modules for distribution

// Import utility functions and make them global
import * as utils from './js/utils.js';
Object.assign(window, utils);

// Import classes
import ProjectStorageManager from './js/storage-manager.js';
import SceneManagerEditor from './js/scene-manager.js';
import HotspotEditor from './js/hotspot-editor.js';
import PreviewController from './js/preview-controller.js';
import UIController from './js/ui-controller.js';
import ExportManager from './js/export-manager.js';
import TourEditor from './js/editor.js';
import EditorEvents from './js/event-emitter.js';

// Attach classes to window for global access
window.ProjectStorageManager = ProjectStorageManager;
window.SceneManagerEditor = SceneManagerEditor;
window.HotspotEditor = HotspotEditor;
window.PreviewController = PreviewController;
window.UIController = UIController;
window.ExportManager = ExportManager;
window.TourEditor = TourEditor;
window.EditorEvents = EditorEvents;

// Import and execute UI initialization
import './js/ui-init.js';

// Export main editor class for potential programmatic use
export default TourEditor;
