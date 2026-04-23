# Zoom Chapter Splitter

> AI-powered macOS app that automatically splits Zoom recordings into individual chapter videos — complete with title cards, transitions, and custom filenames.

---

## Table of Contents

- [Requirements](#requirements)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Step-by-Step Guide](#step-by-step-guide)
  - [Step 1 — Configure Your API Key](#step-1--configure-your-api-key)
  - [Step 2 — Import Your Recording](#step-2--import-your-recording)
  - [Step 3 — Import the Transcript](#step-3--import-the-transcript)
  - [Step 4 — Detect Chapters with AI](#step-4--detect-chapters-with-ai)
  - [Step 5 — Review & Edit Chapters](#step-5--review--edit-chapters)
  - [Step 6 — Configure Title Cards (Optional)](#step-6--configure-title-cards-optional)
  - [Step 7 — Export Your Chapters](#step-7--export-your-chapters)
- [Export Options Reference](#export-options-reference)
- [Tips & Troubleshooting](#tips--troubleshooting)
- [Development](#development)

---

## Requirements

- **macOS 12 (Monterey)** or later
- An **OpenAI** or **Anthropic** API key
  - OpenAI: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
  - Anthropic: [console.anthropic.com/account/keys](https://console.anthropic.com/account/keys)

---

## Installation

Download the latest `.dmg` from the [Releases](../../releases) page, open it, and drag **Zoom Chapter Splitter** to your Applications folder.

> Your API key is stored securely in your macOS Keychain and never transmitted anywhere except directly to the AI provider you choose.

---

## Quick Start

1. Open the app and click the **⚙️ Settings** icon
2. Paste your OpenAI or Anthropic API key and click **Save**
3. Drag your Zoom `.mp4` recording onto the **video drop zone**
4. Drag the matching `.vtt` transcript onto the **transcript drop zone**
5. Click **Auto-Detect with AI**
6. Review the suggested chapters, adjust any timecodes if needed
7. Click **Export All** — done!

---

## Step-by-Step Guide

### Step 1 — Configure Your API Key

1. Click the **⚙️** (Settings) button in the top-right corner of the app
2. Choose your preferred AI provider:
   - **OpenAI** — paste your key (starts with `sk-...`) and click **Save**
   - **Anthropic** — paste your key (starts with `sk-ant-...`) and click **Save**
3. Select your **Provider** and **Model** from the dropdowns:

| Provider | Recommended Model | Notes |
|---|---|---|
| OpenAI | GPT-4.1 | Best accuracy |
| OpenAI | GPT-4.1 Mini | Faster, lower cost |
| OpenAI | o3 / o4-mini | Reasoning models — excellent for long recordings |
| Anthropic | Claude Sonnet 4 | Best accuracy |
| Anthropic | Claude 3.5 Haiku | Faster, lower cost |

4. Close Settings — your key is saved securely in macOS Keychain

---

### Step 2 — Import Your Recording

You have two ways to load your video:

- **Drag & drop** your `.mp4`, `.mov`, `.m4v`, or `.webm` file onto the 🎬 drop zone
- **Click** the drop zone to open a file picker

Once loaded, you'll see the filename and total duration confirmed.

> **Where to find your Zoom recording:** Zoom saves local recordings to `~/Documents/Zoom/`. Cloud recordings can be downloaded from the Zoom web portal.

---

### Step 3 — Import the Transcript

Zoom generates a `.vtt` caption file alongside your recording. Load it the same way:

- **Drag & drop** the `.vtt` file onto the 📝 drop zone
- **Click** the drop zone to browse for it

Once loaded, you'll see a cue count confirming how many caption lines were parsed.

> **Finding the VTT file:** For local recordings it lives in the same folder as your `.mp4`. For cloud recordings, download it from the Zoom web portal under the recording's **Audio Transcript** section.

---

### Step 4 — Detect Chapters with AI

1. Click **Auto-Detect with AI** in the Chapters panel
2. A progress bar will show the stages: *Preparing transcript → Analyzing → Synthesizing*
3. For long recordings, the transcript is processed in chunks — this may take 30–60 seconds

The AI analyzes topic changes, speaker transitions, and natural breaks to suggest 3–10 chapters for a typical one-hour meeting.

---

### Step 5 — Review & Edit Chapters

Each detected chapter shows its **title**, **start/end timecodes**, and a confidence indicator. You can:

| Action | How |
|---|---|
| **Rename** a chapter | Click the title and type a new name |
| **Adjust timecodes** | Edit the start/end time fields directly |
| **Delete** a chapter | Click the trash icon on that chapter |
| **Add a chapter manually** | Click **+ Add Chapter** in the toolbar |
| **Save chapters** to a file | Click 💾 — saves as `.json` for later use |
| **Load saved chapters** | Click 📂 — reload a previously saved `.json` |

> **Tip:** Use "Save Chapters" if you want to export a different selection later without re-running AI detection.

---

### Step 6 — Configure Title Cards (Optional)

Click the **Title Card** tab in the sidebar to add a branded title screen to each chapter.

| Setting | Description |
|---|---|
| **Enable Title Cards** | Toggle on/off |
| **Duration** | How long the title card displays (1–10 seconds) |
| **Background Color** | Pick any color for the card background |
| **Text Color** | Pick any color for the chapter title text |
| **Font Size** | Drag the slider (32–120px) |
| **Font Family** | SF Pro Display, Helvetica Neue, Georgia, or Menlo |

A live **Preview** on the right updates in real time as you adjust settings.

---

### Step 7 — Export Your Chapters

1. Click the **Export** tab in the sidebar
2. Click **Browse** to choose an output folder
3. *(Optional)* Adjust intro/outro effects:

| Effect | Options |
|---|---|
| **Intro** | None, Fade from Black, Fade from White, Blur (Focus Pull), Zoom Out |
| **Outro** | None, Fade to Black, Fade to White, Blur (Focus Pull), Zoom In |

4. *(Optional)* Customize the **Filename Pattern**:
   - Use `{index}` for the chapter number (e.g., `01`, `02`)
   - Use `{title}` for the chapter title
   - Default: `{index}_{title}` → `01_Introduction_and_Welcome.mp4`

5. *(Optional)* Enable **Hardware Acceleration** to use macOS VideoToolbox for faster encoding

6. Click **Export All** to export every chapter, or **Export** on an individual chapter to export just that one

Progress bars show each chapter's encoding status in real time. Completed chapters are marked with ✓.

---

## Export Options Reference

### Intro / Outro Effects

| Effect | Description |
|---|---|
| None | Hard cut — no transition |
| Fade from/to Black | Classic dissolve to/from black |
| Fade from/to White | Bright dissolve (good for presentation style) |
| Blur (Focus Pull) | Starts/ends out of focus, pulls to sharp |
| Zoom Out / Zoom In | Subtle zoom motion on the cut |

### Filename Pattern Tokens

| Token | Example Output |
|---|---|
| `{index}` | `01`, `02`, `03` |
| `{title}` | `Product_Demo`, `Q_and_A` |

Example patterns:
- `{index}_{title}` → `01_Introduction.mp4`
- `Chapter_{index}` → `Chapter_01.mp4`
- `{title}` → `Introduction.mp4`

---

## Tips & Troubleshooting

**The AI didn't detect the right chapters**
- Try a more powerful model (GPT-4.1 or Claude Sonnet 4) for better accuracy
- Add chapters manually with **+ Add Chapter** and drag the timecodes to the right spots
- For very long recordings (2h+), o3 or o4-mini reasoning models often perform better

**Export is slow**
- Enable **Hardware Acceleration** in Export Settings — this uses your Mac's GPU via VideoToolbox and can be 3–5× faster

**I can't find the `.vtt` file**
- For local recordings: look in `~/Documents/Zoom/[meeting-name]/`; make sure "Save Captions" was enabled in Zoom settings before the meeting
- For cloud recordings: go to zoom.us → Recordings → click your recording → download the **Audio Transcript**

**The app says "Encryption not available"**
- This can happen if the app is not in your `/Applications` folder. Move it there and relaunch.

**API key errors**
- Double-check that your key is active and has credits (OpenAI) or is enabled (Anthropic)
- Keys are stored in macOS Keychain — open **Settings** and click **Remove** then re-enter the key to reset it

---

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Package as macOS .dmg
npm run package
```

**Requirements:** Node.js 20+

**Tech stack:** Electron · React · TypeScript · Vite · FFmpeg (bundled) · OpenAI SDK · Anthropic SDK
