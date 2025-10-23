# 🎯 How to Run the Demo

## Quick Start (3 Steps)

### Step 1: Start a Local Server

Since the examples load external resources, you need to run them through a web server:

**Option A - Using Python (if installed):**
```powershell
cd c:\wamp64\www\senangwebs_tour
python -m http.server 8080
```

**Option B - Using Node.js:**
```powershell
cd c:\wamp64\www\senangwebs_tour
npx http-server -p 8080
```

**Option C - Using WAMP (already installed):**
Simply access via: `http://localhost/senangwebs_tour/example.html`

### Step 2: Open in Browser

Navigate to one of these URLs:
- **Full Demo**: http://localhost:8080/example.html
- **Simple Demo**: http://localhost:8080/example-simple.html
- **Library Tests**: http://localhost:8080/test.html

### Step 3: Interact

- **Click** on colored hotspots to navigate between scenes
- **Hover** over hotspots to see tooltips
- **Use buttons** at the bottom for direct navigation
- **Try VR mode** by clicking the VR goggles icon (if you have a VR headset)

## 🎮 Demo Controls

### Desktop Mode
- **Mouse**: Look around
- **Click**: Interact with hotspots
- **WASD**: Move (if enabled)

### VR Mode
- **Head Movement**: Look around
- **Gaze + Wait**: Look at a hotspot for 1.5 seconds to activate
- **Controller**: Point and click (if available)

## 📱 Mobile/Tablet

The demo works on mobile devices:
1. Open the URL on your mobile browser
2. Use touch to look around
3. Tap hotspots to navigate
4. Tap VR icon to enter cardboard mode

## 🧪 Testing the Library

Open `test.html` to run automated validation tests that verify:
- Library is properly loaded
- All API methods are available
- Configuration validation works
- Event system functions correctly
- Components are registered

## 🎨 Customizing the Demo

### Change 360° Images

Edit `example.html` and replace the panorama URLs:

```javascript
scenes: {
    living_room: {
        panorama: "YOUR_IMAGE_URL.jpg",  // Change this
        // ... rest of config
    }
}
```

### Add More Scenes

Add new scenes to the configuration:

```javascript
scenes: {
    // Existing scenes...
    new_room: {
        name: "New Room",
        panorama: "path/to/new-room.jpg",
        hotspots: [
            // Add hotspots here
        ]
    }
}
```

### Adjust Hotspot Positions

Modify the position values to place hotspots:

```javascript
position: { x: 5, y: 0, z: -5 }
// x: left(-) to right(+)
// y: down(-) to up(+)
// z: back(-) to front(+)
```

## 📋 File Overview

| File | Purpose |
|------|---------|
| `example.html` | Full-featured demo with UI controls |
| `example-simple.html` | Minimal implementation example |
| `test.html` | Automated library validation tests |
| `dist/senangwebs_tour.js` | Development build (readable) |
| `dist/senangwebs_tour.min.js` | Production build (minified) |

## 🚀 Building Your Own Tour

1. **Copy** `example-simple.html` as a starting point
2. **Replace** panorama URLs with your 360° images
3. **Position** hotspots where you want navigation points
4. **Test** in a browser with a local server
5. **Deploy** to your web server

## 🐛 Troubleshooting

### Demo Won't Load
- ✅ Check that you're using a local server (not file://)
- ✅ Check browser console for errors (F12)
- ✅ Verify internet connection (loads A-Frame from CDN)

### Hotspots Not Visible
- ✅ Check hotspot positions are within range (-10 to 10)
- ✅ Increase scale: `scale: "3 3 3"`
- ✅ Try different colors: `color: "#FF0000"`

### Images Not Loading
- ✅ Check image URLs are accessible
- ✅ Verify CORS headers if loading from different domain
- ✅ Use JPG format for best compatibility

### Performance Issues
- ✅ Reduce image size (4096x2048 recommended)
- ✅ Use JPG instead of PNG
- ✅ Limit number of hotspots per scene (<10)

## 📚 Documentation

- **QUICKSTART.md** - 5-minute quick start guide
- **README.md** - Library documentation
- **PROJECT_SUMMARY.md** - Complete project overview
- **blueprint.md** - Original specification

## 💡 Tips for Best Experience

1. Use **equirectangular 360° images** (2:1 ratio)
2. Recommended resolution: **4096x2048** or **8192x4096**
3. Place hotspots at **Y=0 or Y=1.6** for natural positioning
4. Use **contrasting colors** for hotspots
5. Keep **tooltip text short** (under 30 characters)
6. Test on **multiple devices** (desktop, mobile, VR)

## 🎓 Learning Path

1. **Start**: Open `example-simple.html` - see minimal code
2. **Explore**: Open `example.html` - see full features
3. **Test**: Open `test.html` - understand the API
4. **Read**: Check `QUICKSTART.md` - learn configuration
5. **Build**: Create your own tour with your images!

## 🌟 What's Next?

After running the demo, you can:
- Use your own 360° images
- Add more scenes and hotspots
- Customize colors and styles
- Add custom UI elements
- Integrate with your website
- Deploy to production

## 📞 Need Help?

1. Check the browser console (F12) for errors
2. Review `QUICKSTART.md` for configuration help
3. Look at `blueprint.md` for detailed specifications
4. Compare your code with `example-simple.html`

---

**Ready to explore? Start your local server and open the demo! 🚀**
