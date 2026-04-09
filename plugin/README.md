# Native Plugin

This folder contains the native OpenClaw plugin.

This is the best long-term install surface. It exposes typed tools directly in OpenClaw and does not require `bash`, `curl`, or `jq` on the host.

Before installing:

1. sign up at [diarize.io](https://diarize.io)
2. create an API key at [diarize.io/settings/api-keys](https://diarize.io/settings/api-keys)
3. if you previously installed the standalone skill, remove it from your active OpenClaw workspace
4. install the plugin and paste the key into plugin config

Do not keep the standalone skill and the plugin active at the same time. The plugin already ships a bundled skill, and a separately installed workspace skill can override it.

Install locally:

```bash
openclaw plugins install ./plugin
openclaw plugins enable youtube-transcript-speaker-diarization
```

Typed tools exposed by the plugin:

- `youtube_transcript_run`
- `youtube_transcript_submit_job`
- `youtube_transcript_get_job`
- `youtube_transcript_get_transcript`
