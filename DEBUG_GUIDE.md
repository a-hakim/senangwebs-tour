# Debug Build - File Picker & Export Issues

## Changes Made

### 1. Added Event Listener Safeguard
**File:** `editor/js/editor.js`

- Added `listenersSetup` flag to prevent duplicate event listener registration
- Added guard check at start of `setupEventListeners()` method
- Added comprehensive console logging to track event flow

### 2. Enhanced Debugging Logs
Added detailed logging to:
- `editor.js` - Scene upload flow, button clicks, event triggers
- `scene-manager.js` - Scene addition, total scene count
- `export-manager.js` - Scene count during JSON generation

### 3. Created Test File
**File:** `test-file-picker.html`

Standalone test to verify the listener guard mechanism works correctly.

## How to Test

### Start Local Server
```powershell
npx http-server -p 8080
```

### Test File Picker Issue

1. Open: `http://localhost:8080/editor/redesign.html`
2. Open browser DevTools (F12) and go to Console tab
3. Click "Add Scene" button
4. **Expected behavior:**
   - Console shows: "Add Scene button clicked"
   - File picker opens ONCE
   - If you cancel, console shows nothing more
   - If you select a file:
     - Console shows: "Scene upload change event triggered"
     - Console shows: "SceneManager.addScene called"
     - Scene appears in sidebar

5. **If file picker appears twice:**
   - Check console for duplicate "Add Scene button clicked" messages
   - Check if "Event listeners already setup, skipping..." appears
   - This would indicate the guard is working but something else is triggering

### Test Export Issue

1. Add 1-2 scenes using the steps above
2. Wait for scenes to appear in the sidebar
3. Check console for: "Scene added successfully. Total scenes: X"
4. Click "Export" button
5. Check console for:
   - "ExportManager.generateJSON - scenes count: X"
   - "Scenes data:" (should show array with your scenes)
6. Look at the JSON preview in the modal
7. **Expected:** All scenes should be in the JSON

### Test Import Issue

1. Click "Import" button
2. Open DevTools Console
3. **Expected:**
   - Console shows: "Import button clicked" (ONCE)
   - File picker opens (ONCE)
   - If cancel: nothing happens
   - If select JSON: "Import upload change event triggered"

## Known Browser Behaviors

### File Picker Quirks
Some browsers (especially on Windows) may show:
1. First dialog: File system picker
2. Second dialog: OneDrive/Cloud picker

This is **browser behavior**, not a bug. To test if this is the case:
- Try in different browsers (Chrome, Firefox, Edge)
- Disable cloud storage integration in Windows settings

### Change Event
The `change` event only fires when:
- User selects a file and clicks Open
- NOT when user clicks Cancel

So canceling the first picker won't trigger anything.

## Debugging Commands

### Check Scene Count
In browser console:
```javascript
editor.sceneManager.getAllScenes().length
editor.sceneManager.getAllScenes()
```

### Check Export Data
```javascript
editor.exportManager.generateJSON()
```

### Force Re-setup Listeners (should be prevented)
```javascript
editor.setupEventListeners()
// Should see: "Event listeners already setup, skipping..."
```

### Check Listener Flag
```javascript
editor.listenersSetup
// Should be: true
```

## Expected Console Output

### On Page Load
```
Initializing SenangWebs Tour Editor...
Setting up event listeners...
Event listeners setup complete
Editor initialized successfully
```

### When Clicking "Add Scene"
```
Add Scene button clicked
```

### When Selecting File
```
Scene upload change event triggered, files: 1
=== handleSceneUpload START ===
Files received: 1
Processing file: myimage.jpg type: image/jpeg
SceneManager.addScene called with file: myimage.jpg
Scene added successfully. Total scenes: 1
Scene added, result: myimage
All files processed. Total scenes now: 1
=== handleSceneUpload END ===
```

### When Clicking "Export"
```
ExportManager.generateJSON - scenes count: 1
Scenes data: [{ id: "myimage", name: "myimage", ... }]
Generated scenes data: [{ id: "myimage", ... }]
```

## If Issues Persist

### File Picker Opens Twice
1. Check if Windows OneDrive/cloud picker is showing as second dialog
2. Try in Incognito/Private mode
3. Try different browser
4. Check console for ANY duplicate log messages

### Scenes Not in Export JSON
1. Verify scenes are in sidebar after upload
2. Check console: "Total scenes: X" should match sidebar count
3. Check console during export: "scenes count: X" should match
4. If counts don't match, the issue is in how scenes are stored/retrieved
5. Use console commands above to inspect scene data

### Still Seeing Duplicate Events
If console shows duplicate log messages:
1. Check for browser extensions interfering
2. Try with all extensions disabled
3. Check if there are any error messages in console
4. Verify no syntax errors in updated files

## Rollback

If you need to revert changes:
```powershell
git checkout editor/js/editor.js
git checkout editor/js/scene-manager.js
git checkout editor/js/export-manager.js
```

