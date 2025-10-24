# CRITICAL BUGS FOUND - Analysis & Next Steps

## 🔴 **Confirmed Issues from Console Logs**

### 1. **Double Event Listener Attachment**
```
editor.js:82 Add Scene button clicked
editor.js:82 Add Scene button clicked  ← DUPLICATE!
```

**Problem:** Event listeners are being attached TWICE to the same buttons.

**Evidence:**
- "Setting up event listeners..." does NOT appear in console
- This means listeners are NOT being set up via `setupEventListeners()` method
- The safeguard flag (`listenersSetup`) never had a chance to work
- Listeners must be attached somewhere else OR the script is loaded twice

### 2. **Change Event Fires Twice**
```
editor.js:90 Scene upload change event triggered, files: 1
editor.js:90 Scene upload change event triggered, files: 0  ← Empty!
```

**Problem:** The `change` event on file input fires twice:
- First time: with the selected file
- Second time: with 0 files (because we reset `e.target.value = ''`)

**Root Cause:** Setting `e.target.value = ''` **triggers another change event**!

### 3. **Scenes Disappear from Export**
```
export-manager.js:15 ExportManager.generateJSON - scenes count: 2  ← Correct
...
export-manager.js:15 ExportManager.generateJSON - scenes count: 1  ← Lost a scene!
```

**Problem:** Scenes are being loaded/saved from/to localStorage, and old data is overwriting new scenes.

## 🔧 **Required Fixes**

### Fix #1: Remove `e.target.value = ''` to Prevent Double Change Event

**File:** `editor/js/editor.js`

**Current Code:**
```javascript
document.getElementById('sceneUpload')?.addEventListener('change', (e) => {
    console.log('Scene upload change event triggered, files:', e.target.files.length);
    if (e.target.files && e.target.files.length > 0) {
        this.handleSceneUpload(e.target.files);
    }
    e.target.value = ''; // ← THIS TRIGGERS SECOND CHANGE EVENT!
});
```

**Fix:** Reset value INSIDE handleSceneUpload, AFTER processing:
```javascript
document.getElementById('sceneUpload')?.addEventListener('change', (e) => {
    console.log('Scene upload change event triggered, files:', e.target.files.length);
    if (e.target.files && e.target.files.length > 0) {
        this.handleSceneUpload(e.target.files);
        // Reset after processing to allow re-selecting same file
        setTimeout(() => { e.target.value = ''; }, 100);
    }
});
```

### Fix #2: Find Why Listeners Are Attached Twice

Need to add DOM debugging:
- Check if there are duplicate elements with same ID
- Check if `setupEventListeners()` is called from somewhere else
- Check browser console for the new DOM check logs

### Fix #3: Auto-Save Conflict

**Problem:** When page loads, `loadProject()` loads old data from localStorage, potentially overwriting scenes added in current session.

**Options:**
1. Disable auto-load on init
2. Merge loaded scenes with current scenes instead of replacing
3. Save immediately after adding scene

## 🧪 **Next Testing Steps**

1. **Clear Browser Storage:**
   ```javascript
   localStorage.clear();
   location.reload();
   ```

2. **Check Console for:**
   - "🏗️ TourEditor constructor called" - should appear ONCE
   - "⚙️ Setting up event listeners..." - should appear ONCE
   - "🔍 DOM Check:" - shows element counts
   - Any error about duplicate IDs

3. **Test Sequence:**
   ```
   1. Clear localStorage
   2. Reload page
   3. Add ONE scene
   4. Check console logs
   5. Click Export
   6. Verify scene is in JSON
   ```

## 📝 **Immediate Actions Needed**

Would you like me to:
1. ✅ **Apply Fix #1** (change event reset timing)
2. ✅ **Wait for DOM check logs** (already added)
3. ⏳ **Investigate localStorage conflict**

Please refresh the page and share the new console output including the DOM check results!
