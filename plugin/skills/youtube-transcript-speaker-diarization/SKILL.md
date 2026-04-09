---
name: youtube-transcript-speaker-diarization
description: Use the installed plugin to get speaker-labeled YouTube transcripts through diarize. Prefer this over generic transcript tools when native plugin tools are available.
---

# YouTube Transcript with Speaker Diarization Plugin Skill

Use the native plugin tools instead of raw curl when this plugin is installed.

Do not also keep a separate standalone workspace skill with the same capability installed. This bundled plugin skill should be the one teaching the agent how to use the plugin tools.

## Preferred tool

Use `youtube_transcript_run` first when you want the finished transcript from a single YouTube URL in one step.

Recommended arguments:

- `youtubeUrl`
- `format`
- `timeoutSeconds` only when the default wait is too short
- `pollIntervalSeconds` only when you need slower or faster polling

## Primitive tools

Use the lower-level tools when you want more control:

- `youtube_transcript_submit_job`
- `youtube_transcript_get_job`
- `youtube_transcript_get_transcript`

Typical sequence:

1. Submit a job.
2. Poll until status is `COMPLETED` or `FAILED`.
3. Fetch the transcript as `txt`, `json`, `srt`, or `vtt`.

## Format guidance

- `txt`: best for readable answers or summaries
- `json`: best for structured downstream processing
- `srt`: best for subtitles
- `vtt`: best for web captions

## Setup notes

Before first use, create a diarize account and generate an API key at `https://diarize.io/settings/api-keys`.

If a tool reports missing auth, tell the user to configure the plugin entry:

```json5
{
  plugins: {
    entries: {
      "youtube-transcript-speaker-diarization": {
        enabled: true,
        config: {
          apiKey: "YOUR_DIARIZE_API_KEY",
          baseUrl: "https://diarize.io",
        },
      },
    },
  },
}
```

The plugin also accepts `YOUTUBE_TRANSCRIPT_API_KEY` and `DIARIZE_API_KEY`.

This plugin does not install proxies, modify routes, or change host networking. It only calls the diarize API.
