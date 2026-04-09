# Native Plugin

This folder contains the native OpenClaw plugin.

This is the recommended install surface. It exposes typed tools directly in OpenClaw and does not require `bash`, `curl`, or `jq` on the host.

Before installing:

1. sign up at [diarize.io](https://diarize.io)
2. create an API key at [diarize.io/settings/api-keys](https://diarize.io/settings/api-keys)
3. install the plugin and paste the key into plugin config

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
