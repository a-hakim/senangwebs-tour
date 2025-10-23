# 📁 SenangWebs Tour - Project Structure

```
senangwebs_tour/
│
├── 📄 .gitignore                      # Git ignore rules
├── 📄 package.json                    # NPM configuration (type: module)
├── 📄 package-lock.json               # NPM dependency lock file
├── 📄 rollup.config.js                # Rollup bundler configuration
│
├── 📖 Documentation Files
│   ├── 📄 blueprint.md                # Original specification (blueprint)
│   ├── 📄 README.md                   # Library overview & documentation
│   ├── 📄 QUICKSTART.md               # Quick start guide (5 minutes)
│   ├── 📄 PROJECT_SUMMARY.md          # Complete implementation summary
│   ├── 📄 HOW_TO_RUN.md              # Demo running instructions
│   └── 📄 DIRECTORY_STRUCTURE.md      # This file
│
├── 🌐 Demo & Test Files
│   ├── 📄 example.html                # Full-featured demo with UI
│   ├── 📄 example-simple.html         # Minimal working example
│   └── 📄 test.html                   # Automated validation tests
│
├── 📂 src/                            # Source Code Directory
│   ├── 📄 index.js                    # Main entry point
│   │                                  # - Tour class (public API)
│   │                                  # - Event system
│   │                                  # - Lifecycle management
│   │
│   ├── 📄 AssetManager.js             # Asset Management
│   │                                  # - Preload images/videos
│   │                                  # - Manage <a-assets>
│   │                                  # - Asset caching
│   │
│   ├── 📄 SceneManager.js             # Scene Management
│   │                                  # - Load/transition scenes
│   │                                  # - <a-sky> manipulation
│   │                                  # - Fade effects
│   │
│   ├── 📄 HotspotManager.js           # Hotspot Management
│   │                                  # - Create hotspot entities
│   │                                  # - Tooltip system
│   │                                  # - Interaction handling
│   │
│   └── 📂 components/
│       └── 📄 hotspot-listener.js     # A-Frame Component
│                                      # - Click/gaze detection
│                                      # - Hover effects
│                                      # - Event emission
│
├── 📂 dist/                           # Built Files (Output)
│   ├── 📄 senangwebs_tour.js          # Development build (~15KB)
│   │                                  # - UMD format
│   │                                  # - Readable code
│   │                                  # - Source maps included
│   │
│   ├── 📄 senangwebs_tour.js.map      # Source map file
│   │
│   └── 📄 senangwebs_tour.min.js      # Production build (~8KB)
│                                      # - Minified
│                                      # - Optimized
│                                      # - Ready for deployment
│
└── 📂 node_modules/                   # NPM Dependencies (ignored by git)
    ├── @rollup/plugin-node-resolve    # Rollup plugin
    ├── @rollup/plugin-terser          # Minification plugin
    └── rollup                         # Build tool
```

## 🎯 Quick File Reference

### 🚀 To Get Started
1. Read: `HOW_TO_RUN.md`
2. Open: `example.html`

### 📚 To Learn
1. Quick: `QUICKSTART.md` (5 min)
2. Detailed: `README.md`
3. Specs: `blueprint.md`

### 🔧 To Build
1. Source: `src/` directory
2. Config: `rollup.config.js`
3. Output: `dist/` directory

### 🌐 To Demo
1. Full: `example.html`
2. Simple: `example-simple.html`
3. Test: `test.html`

## 📊 File Statistics

| Category | Count | Total Size |
|----------|-------|------------|
| Source Files | 5 | ~15 KB |
| Built Files | 3 | ~23 KB |
| Documentation | 6 | ~45 KB |
| Examples | 3 | ~25 KB |
| **Total** | **17** | **~108 KB** |

## 🔑 Key Files Explained

### Source Code (`src/`)

**index.js**
- Main `Tour` class
- Public API methods: `start()`, `navigateTo()`, `destroy()`
- Event system integration
- Coordinates all managers

**AssetManager.js**
- Handles asset preloading
- Manages A-Frame's `<a-assets>` system
- Supports both images and videos
- Prevents duplicate loading

**SceneManager.js**
- Controls `<a-sky>` element
- Manages scene transitions
- Implements fade effects
- Tracks current scene

**HotspotManager.js**
- Creates hotspot entities
- Manages tooltip display
- Handles hotspot interactions
- Cleans up old hotspots

**components/hotspot-listener.js**
- A-Frame component registration
- Click/gaze event handling
- Hover visual feedback
- Custom event emission

### Built Files (`dist/`)

**senangwebs_tour.js**
- For development/debugging
- Includes comments
- Has source maps
- Easier to read

**senangwebs_tour.min.js**
- For production deployment
- Minified and optimized
- Smaller file size
- Best performance

### Demo Files

**example.html**
- Complete demo implementation
- UI overlay with scene info
- Navigation buttons
- Event logging
- Loading screen
- VR support

**example-simple.html**
- Minimal code example
- Best for learning
- Easy to understand
- Quick to modify

**test.html**
- Automated tests
- Library validation
- API verification
- Component checks

## 🎨 Customization Guide

### To Modify the Library
Edit files in `src/` → Run `npm run build` → Test in demos

### To Create Your Own Tour
Copy `example-simple.html` → Edit config → Add your images

### To Deploy to Production
Use `dist/senangwebs_tour.min.js` + your HTML

## 🔄 Build Process

```
src/
├── index.js
├── AssetManager.js
├── SceneManager.js
├── HotspotManager.js
└── components/
    └── hotspot-listener.js

        ↓ [Rollup Bundle]
        
dist/
├── senangwebs_tour.js      (Development)
└── senangwebs_tour.min.js  (Production)
```

## 📦 Dependencies

### Runtime Dependencies
- **A-Frame** (^1.4.0) - WebVR framework (peer dependency)

### Development Dependencies
- **Rollup** (^4.9.6) - Module bundler
- **@rollup/plugin-node-resolve** (^15.2.3) - Module resolution
- **@rollup/plugin-terser** (^0.4.4) - Minification

## 🚀 Commands

```bash
npm install          # Install dependencies
npm run build        # Build for production
npm run dev          # Watch mode for development
```

## 📌 Important Notes

1. **Source Code**: All in `src/` directory
2. **Built Files**: Generated in `dist/` directory
3. **Documentation**: Multiple guides for different needs
4. **Examples**: Three demo files for different use cases
5. **Node Modules**: Auto-generated, not committed to git

---

**Total Project Files**: 17 (excluding node_modules)
**Total Lines of Code**: ~2,000 lines
**Library Size**: ~8KB (minified)
