# 🤠 Emojify Chrome Extension with Built-in AI

Add the perfect emojis to your text with AI-powered style adjustments, from professional to creative tones. This Chrome extension uses Chrome's built-in AI capabilities to enhance your text with contextually appropriate emojis.

<img src="/assets/sidebar-context.png" alt="extension sidebar context" width="100%">

*Extension loads as a sidebar*

## Prerequisites

Before installing the extension, you'll need:

1. [Chrome Canary](https://www.google.com/chrome/canary/) browser
2. Enable Chrome AI features:
   - Navigate to `chrome://flags/#optimization-guide-on-device-model`
   - Select "Enabled BypassPerfRequirement"
   - Go to `chrome://flags/#prompt-api-for-gemini-nano`
   - Select "Enabled"
   - Navigate to `chrome://flags/#text-safety-classifier`
   - Select "Disabled" ([Issue #379429927](https://issues.chromium.org/issues/379429927))
   - Relaunch Chrome

## Installation

0. Open Chrome Canary and navigate to `chrome://extensions`
1. Enable "Developer mode" in the top right corner
2. Click "Load unpacked" button
3. Select the directory containing the extension files

<img src="/assets/developer-mode.png" alt="developer mode for extensions" width="100%">

*Enable Developer mode (1) and click Load unpacked (2) to install the extension*

## Features

### Welcome and Style Adjustment Screens

<div style="display: flex; justify-content: center; gap: 20px;">
  <img src="/assets/sidebar-welcome.png" alt="sidebar welcome screen" width="300">
  <img src="/assets/sidebar-processed.png" alt="style adjustment slider" width="300">
</div>

*Left: Initial sidebar interface where you can paste text*  
*Right: Style slider to adjust tone from Professional to Creative.*

### Key Features:

- **Context Menu Integration**: Right-click on any selected text to "Emojify" it
- **Adjustable Style Slider**: 
  - Professional Mode 👔: Formal tone with minimal emojis
  - Balanced Mode 🎯: Natural style with moderate emojis
  - Creative Mode 🎨: Expressive style with more emojis
- **Smart Emoji Placement**: Distributes emojis naturally throughout your text
- **Copy & Clear Functions**: Easy text management

## Usage

1. Select text on any webpage
2. Copy and paste into input area or select **Emojify** from the context menu
3. The text will appear in the sidebar with emoji enhancements
4. Adjust the style slider to change the tone and emoji density
5. Click "Copy" to copy the enhanced text
6. Use "Clear" to start fresh

## Development Notes

This extension uses Chrome's experimental AI Language Model API (Gemini Nano).

- Built with Chrome's AI Early Preview Program capabilities
- Uses the Prompt API for text transformation
