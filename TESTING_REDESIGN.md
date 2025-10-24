# Testing the Redesigned Editor

## Quick Start

### 1. Start Local Server
```bash
# Navigate to project directory
cd c:\wamp64\www\senangwebs_tour

# Start server (choose one)
npx http-server -p 8080
# OR
python -m http.server 8080
```

### 2. Open Editor
Open in your browser:
```
http://localhost:8080/editor/redesign.html
```

## Testing Checklist

### Scene Management
- [ ] Click "+ Add Scene" button
- [ ] Select one or more 360° panorama images
- [ ] Verify scenes appear in left sidebar with thumbnails
- [ ] Click on a scene card to load it
- [ ] Verify active scene is highlighted with blue border
- [ ] Try deleting a scene (confirm it asks for confirmation)
- [ ] Try drag-and-drop to reorder scenes

### Hotspot Placement
- [ ] Select a scene (if not already selected)
- [ ] Click "+ Add Hotspot" button
- [ ] Verify "Click on Preview..." message appears
- [ ] Verify preview has blue border and crosshair cursor
- [ ] Click anywhere on the 360° preview
- [ ] Verify hotspot appears in the list below
- [ ] Verify hotspot appears as a sphere in the preview
- [ ] Click on the hotspot in the list to select it
- [ ] Verify hotspot properties form appears below the list
- [ ] Verify camera points to the selected hotspot

### Hotspot Properties
- [ ] Change the hotspot title
- [ ] Add a description
- [ ] Select a target scene from dropdown
- [ ] Verify target scene appears in list (→ Scene Name)
- [ ] Change the color using color picker
- [ ] Change the color by typing hex value
- [ ] Verify both color inputs stay synced
- [ ] Modify X, Y, Z position values
- [ ] Verify hotspot moves in preview
- [ ] Try entering very large position values
- [ ] Verify position is clamped and toast notification appears

### Scene Properties Tab
- [ ] Click "Scene" tab in toolbar
- [ ] Verify scene properties appear in right panel
- [ ] Change scene name
- [ ] Verify name updates in scene card
- [ ] View scene ID (should be read-only)
- [ ] Change image URL (if desired)

### Tour Settings Tab
- [ ] Click "Tour" tab in toolbar
- [ ] Verify tour settings appear in right panel
- [ ] Change tour title
- [ ] Verify title updates in header "Project:" section
- [ ] Add a description
- [ ] Select initial scene from dropdown
- [ ] Toggle "Auto-rotate camera"
- [ ] Toggle "Show compass"

### Header Actions
- [ ] Change project name in header
- [ ] Verify it syncs with tour title in Tour tab
- [ ] Click "New" button
- [ ] Verify confirmation dialog appears
- [ ] Click "Save" button
- [ ] Verify "Project saved" toast appears
- [ ] Refresh the page
- [ ] Verify you're asked to load previous project
- [ ] Click "Import" button
- [ ] Try importing a JSON file
- [ ] Click "Export" button
- [ ] Verify export modal appears with JSON preview
- [ ] Click "Copy JSON" and verify clipboard
- [ ] Click "Download JSON" and verify file downloads
- [ ] Click "Export Viewer HTML" and verify HTML downloads
- [ ] Click "Help" button
- [ ] Verify help modal appears

### Keyboard Shortcuts
- [ ] Press `Ctrl+S` (or `Cmd+S` on Mac)
- [ ] Verify project saves
- [ ] Press `Ctrl+E` (or `Cmd+E` on Mac)
- [ ] Verify export modal opens
- [ ] Press `ESC` with modal open
- [ ] Verify modal closes

### UI/UX Testing
- [ ] Verify dark theme is applied throughout
- [ ] Hover over buttons and verify hover effects
- [ ] Check that all text is readable (good contrast)
- [ ] Verify smooth transitions when switching tabs
- [ ] Check that scene cards show thumbnails correctly
- [ ] Verify hotspot list items have correct colors
- [ ] Check empty states (no scenes, no hotspots)
- [ ] Verify toast notifications appear and disappear
- [ ] Check that modals can be closed by clicking outside
- [ ] Verify all form inputs are properly styled
- [ ] Check scrollbars in sidebar and properties panel

### Browser Testing
Test in multiple browsers:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if available)

### Responsive Testing
- [ ] Test at different window widths
- [ ] Verify sidebar and properties panel remain functional
- [ ] Check that preview area scales appropriately

## Common Issues & Solutions

### Preview Not Loading
- **Issue**: Black screen, no panorama visible
- **Solution**: Ensure local server is running, A-Frame needs proper CORS

### Hotspot Not Appearing After Click
- **Issue**: Clicked on preview but hotspot didn't place
- **Solution**: Wait for A-Frame to fully load, try clicking again after 2-3 seconds

### Colors Not Syncing
- **Issue**: Color picker and text input show different values
- **Solution**: Refresh page, this is likely a caching issue

### Position Clamped
- **Issue**: Position keeps resetting to smaller values
- **Solution**: This is intentional - positions are limited to 10-unit radius sphere

### Can't Save Project
- **Issue**: Save button doesn't work or error appears
- **Solution**: Check browser console, might be LocalStorage quota exceeded

### Export Not Working
- **Issue**: Export buttons don't download files
- **Solution**: Check browser popup blocker, might need to allow downloads

## Sample Workflow

1. **Start Fresh**: Click "New" to clear any existing data
2. **Add Scenes**: Upload 2-3 panorama images
3. **Add Hotspots**: On first scene, add 2 hotspots
4. **Configure**: Set second hotspot to navigate to second scene
5. **Style**: Change hotspot colors (e.g., green for navigation, red for info)
6. **Test Navigation**: Select navigation hotspot and verify target scene is set
7. **Save**: Press Ctrl+S to save project
8. **Export**: Press Ctrl+E and download JSON
9. **Test Viewer**: Use exported Viewer HTML to test tour

## Sample Test Data

If you don't have 360° panoramas, you can use these free resources:
- [Flickr 360° Photos](https://www.flickr.com/search/?text=360%20panorama&license=2%2C3%2C4%2C5%2C6%2C9)
- [Pexels 360° Photos](https://www.pexels.com/search/360/)
- [Google Street View downloads](https://www.google.com/streetview/)

## Performance Testing

### Large Projects
- [ ] Create project with 10+ scenes
- [ ] Add 10+ hotspots to a single scene
- [ ] Verify UI remains responsive
- [ ] Check that scene switching is smooth
- [ ] Verify LocalStorage can handle the data size

### Image Sizes
- [ ] Upload small image (< 1MB)
- [ ] Upload medium image (1-5MB)
- [ ] Upload large image (5-10MB)
- [ ] Verify thumbnails generate correctly
- [ ] Check that save/load works with large images

## Expected Results

✅ **All features should work identically to the original editor**
✅ **UI should be more polished and modern**
✅ **Performance should be similar or better**
✅ **No console errors should appear**
✅ **All interactions should provide visual feedback**

## Reporting Issues

If you encounter any issues:
1. Check browser console for errors
2. Note the exact steps to reproduce
3. Test in different browser to confirm
4. Check if issue exists in original editor too
5. Document expected vs actual behavior

## Success Criteria

The redesigned editor is working correctly if:
- ✅ All items in testing checklist pass
- ✅ No console errors during normal usage
- ✅ Project can be saved and loaded
- ✅ Export produces valid JSON
- ✅ Exported viewer HTML works standalone
- ✅ UI is visually appealing and consistent
- ✅ All keyboard shortcuts work
- ✅ Performance is acceptable (no lag)
