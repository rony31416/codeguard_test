# Change Log

## [0.0.7] - 2026-02-23 (re-release)

### � Critical Fix: Side Panel Not Showing
- **Root cause**: Extension was compiled with plain `tsc` and packaged with `--no-dependencies`, so `require('axios')` failed at runtime because `node_modules` was never included. Extension activation crashed silently — the webview panel was never registered, so clicking the CodeGuard icon showed nothing.
- **Solution**: Replaced `tsc` with `esbuild` bundling. `axios` and all other dependencies are now fully embedded inside `out/extension.js` (a single 440 KB bundle). No `node_modules` folder needed.

### �🚀 Major Fix: Analysis No Longer Times Out
- **Root cause fixed**: Linguistic analysis (LLM stage) takes 110–120 s, exceeding Render's 60 s proxy timeout. The HTTP response was killed before reaching the extension, wrongly showing "Cannot connect to backend."
- **Solution**: Backend now returns a preliminary result (static + dynamic bugs) in **<2 seconds**. Linguistic analysis runs as a background task. Extension automatically polls `GET /api/analysis/{id}` every 15 s until complete.

### Changed
- Extension `apiService.ts`: POST timeout reduced to 60 s; polling loop added (up to 5 min, 15 s interval)
- Extension `extension.ts`: Progress notification updated to indicate the 2-min analysis window
- Backend `main.py`: Stage 3 (linguistic) moved to `BackgroundTasks`; `AnalysisResponse` gains `status` field (`"processing"` | `"complete"`)
- Backend `schemas.py`: `status: Optional[str]` added to `AnalysisResponse`

---

## [0.0.6] - 2025-02-15

### 🔧 Critical Bug Fixes
- **Fixed Sidebar Panel Loading Error**: Resolved "An error occurred while loading view" issue
- **Fixed Inconsistent Analysis Results**: Both sidebar and top-right button now give identical results
- **Fixed Selection Confusion**: Sidebar now always analyzes entire file (not selected text)

### Changed
- Sidebar button renamed to "Analyze Entire File" for clarity
- Added helpful hint: "Will analyze the complete file in the active editor"
- Improved HTML file loading with multiple fallback paths
- Enhanced error handling with detailed error messages
- Added debug logging for troubleshooting analysis issues

### Improved
- Better consistency between different analysis methods
- Clearer user feedback with file names in notifications
- Robust webview HTML loading (works in both dev and production)
- Trimmed prompt input to avoid whitespace issues

---

## [0.0.5] - 2025-02-12

### 🚀 Production Deployment
- **Cloud Backend**: Now using production backend on Render.com
- **Database**: Connected to Supabase PostgreSQL (cloud database)
- **Production URL**: https://codeguard-backend-g7ka.onrender.com
- No longer requires local backend for basic functionality

### Added
- `useLocalBackend` setting for switching between production and local backend
- Cold start warning message for first-time requests
- Extended timeout to 90 seconds for Render.com cold starts
- Better error messages with connection details

### Changed
- Default API URL now points to production backend
- Improved timeout handling for cloud deployments
- Updated configuration descriptions with cold start information

### Fixed
- Better handling of slow initial requests
- Improved error messages when backend is unavailable

---

## [0.0.4] - 2025-02-11

### Added
- ⭐ **Feedback System**: Rate analysis results with 5-star rating system
- 👍 **Helpful/Not Helpful** buttons for quick feedback
- 💬 **Comment box** for detailed user feedback
- 📊 Feedback data stored in backend PostgreSQL database
- 🎨 **Collapsible Feedback Panel** with glassmorphism design
  - Thin toggle button: "Want to rate this analysis?"
  - Smooth slide-up animation from bottom
  - Auto-collapses after feedback submission
- 📝 **Prompt Input Section** in sidebar (no more popup dialogs)
- 🔘 **Analyze Code Button** in sidebar for easy access
- 📋 **Numbered Summary** format (1, 2, 3...) for detected bug patterns
- 🔴 **Red Box Highlighting** for buggy code lines in editor
- 💬 **Hover Tooltips** showing bug details when hovering over red boxes

### Changed
- Improved UI/UX with better visual hierarchy
- Left-aligned text in summary section for better readability
- Removed unnecessary emoji usage for cleaner interface
- Enhanced error handling for feedback submission
- Feedback panel now auto-collapses 1.5s after successful submission

### Fixed
- Fixed feedback schema mismatch in backend
- Fixed database table structure for feedback ratings
- Improved decoration rendering for bug highlighting

## [0.0.3] - 2025-02-11

### Added
- Basic feedback collection mechanism
- Sidebar panel improvements

## [0.0.2] - 2025-02-11

### Fixed
- Fixed sidebar icon display (now shows custom SVG icon instead of circle)
- Improved activity bar icon visibility

### Changed
- Updated sidebar icon to use monochrome SVG for better VS Code integration
- Enhanced icon contrast for dark and light themes

## [0.0.1] - 2025-02-11

### Added
- Initial release
- Code analysis integration with CodeGuard backend
- Bug pattern detection and classification
- Real-time syntax error highlighting
- Sidebar panel for analysis results
- Support for Python code analysis