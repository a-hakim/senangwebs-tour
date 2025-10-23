# SenangWebs Tour GUI Editor - Blueprint Specification

**Application Name:** SenangWebs Tour Editor (SWTE)
**Version:** 1.0.0
**Target Users:** Content creators, marketers, real estate agents, tour designers
**Technology Stack:** HTML5, CSS3, JavaScript (ES6+), A-Frame, SWT Library

## 1. Introduction

The SenangWebs Tour GUI Editor is a visual, web-based application that allows users to create, edit, and export virtual tours without writing code. It provides an intuitive drag-and-drop interface for managing 360° panoramas, placing interactive hotspots, and configuring tour settings.

### Primary Goals
- **Zero Code Required:** Users can create complete tours through visual interaction
- **Instant Preview:** Real-time preview of changes in an embedded A-Frame viewer
- **Quick Start:** New users can create a basic tour in under 5 minutes
- **Export Ready:** Generate JSON configuration compatible with SWT library

## 2. Core Features

### 2.1 Scene Management
- Upload 360° panorama images (JPG, PNG) or videos (MP4, WebM)
- Visual scene cards with thumbnail previews
- Drag-and-drop scene reordering
- Set initial/starting scene
- Duplicate scenes
- Delete scenes with confirmation
- Scene naming and descriptions

### 2.2 Hotspot Placement & Configuration
- Click-to-place hotspots in 3D preview
- Visual hotspot editing with properties panel
- Real-time position adjustment (drag in 3D space)
- Hotspot appearance customization:
  - Color picker
  - Size/scale slider
  - Icon upload (optional)
- Tooltip text editor
- Action configuration (navigation target)
- Hotspot duplication
- Delete hotspots

### 2.3 Tour Preview
- Full-screen preview mode
- Real-time updates as changes are made
- Test navigation between scenes
- View tooltips and interactions
- VR mode preview

### 2.4 Project Management
- Save project to browser LocalStorage
- Export tour configuration as JSON
- Import existing tour JSON
- Clear/reset project
- Auto-save functionality

## 3. User Interface Layout

### 3.1 Main Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER: Logo | Project Name | Save | Export | Import       │
├─────────────────────┬───────────────────────────────────────┤
│                     │                                       │
│   LEFT SIDEBAR      │        MAIN PREVIEW AREA             │
│   (Scene Manager)   │     (A-Frame 360° Viewer)            │
│                     │                                       │
│  • Scene List       │     [Interactive 3D Preview]         │
│  • Add Scene        │                                       │
│  • Reorder Scenes   │                                       │
│                     │                                       │
│                     │                                       │
├─────────────────────┴───────────────────────────────────────┤
│         BOTTOM PANEL: Properties Editor                     │
│         (Hotspot Config, Scene Settings, Tour Settings)     │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Responsive Behavior
- **Desktop (>1280px):** Full 3-panel layout
- **Tablet (768-1280px):** Collapsible sidebar, full preview
- **Mobile (<768px):** Stacked layout with tabbed interface

## 4. Detailed Feature Specifications

### 4.1 Scene Manager (Left Sidebar)

#### Scene Card Component
```
┌─────────────────────────┐
│  [Thumbnail Preview]    │
│  Scene Name             │
│  🏠 Starting Scene      │  ← Badge if initial scene
│  📍 2 Hotspots          │  ← Hotspot count
│  ─────────────────────  │
│  [Edit] [⋮ Menu]        │
└─────────────────────────┘
```

**Scene Card Features:**
- Thumbnail generated from panorama
- Drag handle for reordering (six dots icon)
- Star icon to set as initial scene
- Click to select/edit
- Context menu (⋮):
  - Set as starting scene
  - Duplicate scene
  - Delete scene
  - View in preview

**Add Scene Button:**
- Large, prominent "+ Add Scene" button at bottom
- Click opens file picker for panorama upload
- Support drag-and-drop files onto button
- Show upload progress bar
- Auto-generate scene ID and name from filename

**Scene Reordering:**
- Visual drag handles (⣿⣿)
- Drag indicators (highlight drop zones)
- Smooth animation on reorder
- Update scene order in real-time

### 4.2 Preview Area (Center)

**Preview Controls:**
```
┌─────────────────────────────────────────────────┐
│  ← Back to Tour | Preview | 🎯 Place Hotspot   │
│  [Full Screen] [VR Mode] [Center View]          │
└─────────────────────────────────────────────────┘
```

**Interaction Modes:**

1. **View Mode (Default):**
   - Mouse drag to look around
   - Scroll to zoom
   - Click hotspots to navigate
   - Hover to see tooltips

2. **Edit Mode (Place Hotspot):**
   - Cursor changes to crosshair
   - Click anywhere in 3D space to place hotspot
   - Visual ray from camera to click point
   - Instant hotspot creation with default settings
   - Auto-switch to properties editor

3. **Hotspot Edit Mode:**
   - Click existing hotspot to select
   - Selected hotspot highlights with glow
   - Drag to reposition in 3D space
   - Arrow keys for fine adjustment
   - Properties panel shows on selection

**Visual Indicators:**
- Selected hotspot: Glowing outline + scale pulse
- Hover hotspot: Scale up 1.2x
- Placement mode: Crosshair cursor + grid overlay
- Hotspot connections: Dotted lines to target scenes

### 4.3 Properties Panel (Bottom)

**Tabbed Interface:**
```
┌───────────────────────────────────────────────────────┐
│  [Hotspot] [Scene] [Tour Settings]                    │
├───────────────────────────────────────────────────────┤
│  Content based on active tab...                        │
└───────────────────────────────────────────────────────┘
```

#### Tab 1: Hotspot Properties (When hotspot selected)
```
Hotspot ID: ___________________________
            [Auto-generated, editable]

Position: 
  X: [slider] -10 ←●─→ 10  Value: [5.2]
  Y: [slider] -5  ←●─→ 5   Value: [0.0]
  Z: [slider] -10 ←●─→ 10  Value: [-8.5]
  
Appearance:
  Color: [🎨 Color Picker] #FF6B6B
  Scale: [slider] 0.5 ←●─→ 5.0  Value: [1.5]
  Icon:  [📁 Upload Image] (Optional)
         [Preview thumbnail if uploaded]
         [✗ Remove] button if icon exists

Tooltip:
  Text: [_____________________________________]
        "Click to go to Kitchen"
  Position: [Dropdown: Top | Bottom | Left | Right]

Action:
  Type: [Navigate To ▼]  (Future: URL, Custom Event)
  Target Scene: [Dropdown of all scenes]
                [Kitchen ▼]

[Delete Hotspot]  [Duplicate Hotspot]
```

#### Tab 2: Scene Properties
```
Scene Information:
  Name: [_____________________________]
        "Living Room"
  
  ID: [auto-generated-id]  [🔄 Regenerate]
  
Panorama:
  Current: [Thumbnail preview]
  File: city-panorama.jpg (2.4 MB)
  [Change Panorama] button
  
Scene Settings:
  ☑ Set as starting scene
  
Hotspots in this scene: [2]
  • to_kitchen (Navigate to Kitchen)      [Edit]
  • to_bedroom (Navigate to Bedroom)      [Edit]

[Delete Scene]
```

#### Tab 3: Tour Settings
```
Tour Configuration:

  Tour Name: [_____________________________]
             "My Virtual Tour"

  Default Hotspot Settings:
    Default Color: [🎨] #4CC3D9
    Default Scale: [slider] 1.0
    Default Icon: [📁 Upload] (Optional)
  
  Transition Settings:
    Fade Duration: [slider] 100ms ←●─→ 2000ms
                   Value: [500ms]
    Enable fade effect: [✓]

[Reset to Defaults]
```

### 4.4 Top Toolbar Actions

```
┌──────────────────────────────────────────────────────────┐
│  [📝 SWT Editor] | Project: "My Tour" [✎]                │
│                                                            │
│  [💾 Save] [📤 Export JSON] [📥 Import] [👁 Preview]    │
│                                              [⚙ Settings] │
└──────────────────────────────────────────────────────────┘
```

**Action Buttons:**

1. **Save:**
   - Save to browser LocalStorage
   - Show "Saved!" confirmation toast
   - Auto-save every 30 seconds (with indicator)
   - Last saved timestamp display

2. **Export JSON:**
   - Generate SWT-compatible JSON
   - Download as `.json` file
   - Filename: `[project-name]-tour.json`
   - Show preview modal before download
   - Copy to clipboard option

3. **Import:**
   - Load existing tour JSON
   - Validate JSON structure
   - Confirm overwrite current project
   - Show import summary

4. **Preview:**
   - Open full-screen preview in new tab/window
   - Embedded SWT tour player
   - Test complete tour experience
   - Share preview link option

5. **Settings:**
   - Editor preferences
   - Default values
   - Keyboard shortcuts
   - About/version info

## 5. User Workflows

### 5.1 Quick Start: Create First Tour (5 minutes)

**Step 1: Add First Scene (30 seconds)**
1. Click "+ Add Scene" button
2. Select panorama image from computer
3. Image uploads and scene card appears
4. Scene auto-named "Scene 1"

**Step 2: Add Second Scene (30 seconds)**
1. Click "+ Add Scene" again
2. Select another panorama
3. New scene card "Scene 2" appears

**Step 3: Place First Hotspot (1 minute)**
1. Select "Scene 1" from scene list
2. Click "🎯 Place Hotspot" button
3. Click in preview where hotspot should appear
4. Hotspot appears, properties panel opens
5. Set "Target Scene" to "Scene 2"
6. Type tooltip: "Go to Scene 2"

**Step 4: Place Return Hotspot (1 minute)**
1. Select "Scene 2" from scene list
2. Click "🎯 Place Hotspot"
3. Click in preview
4. Set target to "Scene 1"
5. Type tooltip: "Back to Scene 1"

**Step 5: Test & Export (2 minutes)**
1. Click "Preview" to test navigation
2. Click hotspots to verify navigation works
3. Click "Export JSON"
4. Save file to computer
5. Done! ✓

### 5.2 Advanced Workflow: Multi-Room Tour

**Phase 1: Content Gathering**
- Prepare all 360° images
- Plan scene connections
- Design hotspot positions

**Phase 2: Scene Setup**
- Upload all panoramas
- Name scenes logically ("kitchen", "living_room")
- Set starting scene (main entrance)
- Reorder scenes by importance

**Phase 3: Hotspot Network**
- Place hotspots in each scene
- Connect scenes logically
- Customize hotspot colors per room type
- Add descriptive tooltips

**Phase 4: Polish**
- Adjust hotspot positions for optimal placement
- Customize colors and sizes
- Test all navigation paths
- Set tour-wide defaults

**Phase 5: Export & Deploy**
- Export JSON configuration
- Test in standalone HTML
- Deploy to web server

## 6. Technical Implementation

### 6.1 Technology Stack

**Frontend Framework:**
- Vanilla JavaScript (ES6+) or Vue.js/React for reactive UI
- No heavy framework required for MVP

**3D Rendering:**
- A-Frame for preview
- SWT Library for tour functionality

**File Handling:**
- FileReader API for image uploads
- Canvas API for thumbnail generation
- Blob API for JSON export

**Storage:**
- LocalStorage for project persistence
- IndexedDB for larger projects (future)

**UI Components:**
- Custom CSS with CSS Grid/Flexbox
- No external UI framework needed
- Drag-and-drop: Native HTML5 Drag & Drop API

### 6.2 Data Structure (Editor State)

```javascript
{
  project: {
    id: "unique-id",
    name: "My Virtual Tour",
    created: "2025-10-24T10:00:00Z",
    modified: "2025-10-24T12:30:00Z",
    version: "1.0.0"
  },
  
  settings: {
    defaultHotspot: {
      color: "#4CC3D9",
      scale: "1 1 1",
      icon: null
    },
    transition: {
      duration: 500,
      enableFade: true
    }
  },
  
  scenes: [
    {
      id: "scene_001",
      name: "Living Room",
      order: 0,
      isInitial: true,
      panorama: {
        filename: "living-room.jpg",
        dataUrl: "data:image/jpeg;base64,...",  // For preview
        thumbnail: "data:image/jpeg;base64,...",
        size: 2457600,
        type: "image/jpeg"
      },
      hotspots: [
        {
          id: "hotspot_001",
          position: { x: 5, y: 0, z: -8 },
          appearance: {
            color: "#FF6B6B",
            scale: "1.5 1.5 1.5",
            icon: null
          },
          tooltip: {
            text: "Go to Kitchen",
            position: "top"
          },
          action: {
            type: "navigateTo",
            target: "scene_002"
          }
        }
      ]
    },
    {
      id: "scene_002",
      name: "Kitchen",
      order: 1,
      isInitial: false,
      panorama: { /* ... */ },
      hotspots: [ /* ... */ ]
    }
  ],
  
  ui: {
    selectedSceneId: "scene_001",
    selectedHotspotId: "hotspot_001",
    editMode: "view", // "view" | "place-hotspot"
    previewMode: false
  }
}
```

### 6.3 Key JavaScript Classes

```javascript
// Main editor controller
class TourEditor {
  constructor(containerEl)
  loadProject(json)
  saveProject()
  exportJSON()
  addScene(file)
  removeScene(sceneId)
  reorderScenes(oldIndex, newIndex)
  setInitialScene(sceneId)
}

// Scene manager
class SceneManager {
  constructor(editor)
  createScene(file)
  updateScene(sceneId, data)
  deleteScene(sceneId)
  generateThumbnail(file)
}

// Hotspot manager
class HotspotEditor {
  constructor(editor)
  enablePlacementMode()
  disablePlacementMode()
  createHotspot(sceneId, position)
  updateHotspot(hotspotId, properties)
  deleteHotspot(hotspotId)
  selectHotspot(hotspotId)
}

// Preview controller
class PreviewController {
  constructor(editor, aframeSceneEl)
  loadScene(sceneId)
  highlightHotspot(hotspotId)
  enableEditMode()
  disableEditMode()
  onHotspotClick(event)
  onSceneClick(event)
}

// UI Controller
class UIController {
  constructor(editor)
  renderSceneList()
  renderPropertiesPanel()
  updateToolbar()
  showNotification(message)
  openModal(type, data)
}
```

### 6.4 Export Format

The editor exports JSON in the exact format required by the SWT library:

```json
{
  "settings": {
    "defaultHotspot": {
      "scale": "1 1 1",
      "color": "#4CC3D9"
    }
  },
  "initialScene": "living_room",
  "scenes": {
    "living_room": {
      "name": "Living Room",
      "panorama": "assets/living-room.jpg",
      "hotspots": [
        {
          "id": "to_kitchen",
          "position": { "x": 5, "y": 0, "z": -8 },
          "action": {
            "type": "navigateTo",
            "target": "kitchen"
          },
          "appearance": {
            "color": "#FF6B6B",
            "scale": "1.5 1.5 1.5"
          },
          "tooltip": {
            "text": "Go to Kitchen"
          }
        }
      ]
    },
    "kitchen": {
      "name": "Kitchen",
      "panorama": "assets/kitchen.jpg",
      "hotspots": []
    }
  }
}
```

**Note:** Editor stores full dataUrls internally, but exports relative paths that user must set up on deployment.

## 7. User Experience Enhancements

### 7.1 Onboarding & Tutorials

**First-Time User Experience:**
1. Welcome modal with quick tour overview
2. Highlight "Add Scene" button with tooltip
3. Show sample tour template option
4. Interactive tutorial mode (optional)

**In-App Help:**
- Tooltip hints on hover
- "?" help icons with explanations
- Keyboard shortcuts overlay (press '?')
- Video tutorial links

### 7.2 Visual Feedback

**Loading States:**
- Upload progress bars
- Spinning indicators
- "Processing..." overlays
- Thumbnail generation progress

**Success/Error States:**
- Toast notifications (success/error/warning)
- Inline validation messages
- Color-coded alerts

**Interactive Feedback:**
- Button hover states
- Click ripple effects
- Drag preview ghosts
- Drop zone highlights

### 7.3 Keyboard Shortcuts

```
Global:
  Ctrl/Cmd + S     Save project
  Ctrl/Cmd + E     Export JSON
  Ctrl/Cmd + Z     Undo (future)
  Ctrl/Cmd + Y     Redo (future)
  Escape           Cancel current action
  ?                Show shortcuts help

Scene Management:
  Ctrl/Cmd + N     New scene
  Delete           Delete selected scene/hotspot

Hotspot Editing:
  H                Toggle placement mode
  Arrow Keys       Fine-tune hotspot position
  Delete           Delete selected hotspot
  Ctrl/Cmd + D     Duplicate hotspot

Preview:
  F                Full-screen preview
  Space            Toggle preview mode
```

### 7.4 Validation & Error Handling

**Scene Validation:**
- ✓ At least one scene required
- ✓ Initial scene must be set
- ✓ All scenes must have panorama
- ✓ Scene IDs must be unique
- ⚠ Warning: Scene has no hotspots
- ⚠ Warning: Scene not connected (unreachable)

**Hotspot Validation:**
- ✓ Target scene must exist
- ✓ Position must be valid coordinates
- ⚠ Warning: Hotspot overlaps with another
- ⚠ Warning: Hotspot outside typical view range

**Export Validation:**
- Check all scenes valid
- Check all hotspot targets exist
- Check for circular navigation loops (warning only)
- Provide export summary/report

## 8. Future Enhancements (Post-MVP)

### Phase 2 Features:
- **Undo/Redo system**
- **Multi-scene selection and bulk edit**
- **Hotspot templates/presets**
- **Custom icon library**
- **Scene connection visualization (flowchart view)**
- **Collaborative editing (cloud save)**

### Phase 3 Features:
- **Analytics integration**
- **Custom actions (JavaScript hooks)**
- **Audio narration per scene**
- **Interactive info panels (not just navigation)**
- **Tour branching (conditional navigation)**
- **Mobile app for capture and edit**

### Advanced Features:
- **AI-assisted hotspot placement**
- **Automatic scene linking suggestions**
- **360° video support**
- **Multi-language tooltip support**
- **Tour templates marketplace**

## 9. File Structure (Editor Application)

```
senangwebs_tour_editor/
├── index.html                  # Main editor page
├── css/
│   ├── editor.css              # Main editor styles
│   ├── components.css          # UI components
│   └── preview.css             # Preview area styles
├── js/
│   ├── editor.js               # Main editor class
│   ├── scene-manager.js        # Scene management
│   ├── hotspot-editor.js       # Hotspot editing
│   ├── preview-controller.js   # Preview control
│   ├── ui-controller.js        # UI rendering
│   ├── storage-manager.js      # LocalStorage handler
│   ├── export-manager.js       # JSON export
│   └── utils.js                # Helper functions
├── lib/
│   ├── aframe.min.js           # A-Frame library
│   └── senangwebs_tour.min.js  # SWT library
├── assets/
│   ├── icons/                  # UI icons
│   ├── templates/              # Sample tours
│   └── tutorials/              # Help content
└── README.md
```

## 10. Development Phases

### Phase 1: MVP (4-6 weeks)
- ✅ Basic scene management
- ✅ Hotspot placement
- ✅ Properties panel
- ✅ JSON export
- ✅ LocalStorage save

### Phase 2: Polish (2-3 weeks)
- ✅ Drag-and-drop reordering
- ✅ Full-screen preview
- ✅ Import functionality
- ✅ Validation system
- ✅ Help system

### Phase 3: Enhancement (3-4 weeks)
- ✅ Undo/redo
- ✅ Scene connection visualization
- ✅ Templates
- ✅ Performance optimization
- ✅ Mobile responsiveness

## 11. Success Metrics

**User Onboarding:**
- New user creates first tour < 5 minutes
- Tutorial completion rate > 70%

**Editor Performance:**
- Scene add/upload < 2 seconds
- Preview load time < 1 second
- Export generation < 500ms

**User Satisfaction:**
- Intuitive interface (user testing)
- <3 clicks to common actions
- Minimal learning curve

## 12. Conclusion

The SenangWebs Tour GUI Editor empowers users to create professional virtual tours without coding. With an intuitive interface, real-time preview, and seamless integration with the SWT library, users can go from concept to deployed tour in minutes.

The editor focuses on:
- **Simplicity:** Minimal clicks, maximum results
- **Visual feedback:** See changes instantly
- **Flexibility:** Customize every aspect
- **Compatibility:** Export standard JSON for SWT library

This blueprint provides a complete specification for building a production-ready GUI editor that makes virtual tour creation accessible to everyone.

---

**Next Steps:**
1. Create wireframes/mockups
2. Develop HTML/CSS prototype
3. Implement core JavaScript classes
4. Integrate with SWT library
5. User testing and iteration
6. Launch MVP

**Target Launch:** Q1 2026
