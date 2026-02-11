# Change Log

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