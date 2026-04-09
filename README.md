# YouTube Transcript with Speaker Diarization

Public, inspectable OpenClaw integration for turning YouTube links into speaker-aware transcripts.

This repo contains two install surfaces:

- `skill/`: standalone OpenClaw skill
- `plugin/`: native OpenClaw plugin with typed tools and a bundled skill

Powered by [diarize](https://diarize.io), but intentionally published as a trust-first, standalone integration repo rather than part of the private diarize application codebase.

## Why this repo exists

ClawHub is crowded with generic YouTube transcript skills, and several flagged entries are flagged because the packaged behavior does not match the metadata or because they perform risky host-level operations.

This repo is intentionally narrow:

- no VPN setup
- no proxy install
- no route mutation
- no host networking changes
- no browser automation
- no shell execution inside the plugin
- only authenticated HTTPS calls to the configured diarize API base URL

## Repo layout

```text
skill/
  SKILL.md
  scripts/youtube-transcript.sh

plugin/
  package.json
  openclaw.plugin.json
  index.js
  skills/youtube-transcript-speaker-diarization/SKILL.md
```

## Install locally

Clone the repo, then install either the skill or the plugin.

### Standalone skill

```bash
openclaw skills install ./skill
```

### Native plugin

```bash
openclaw plugins install ./plugin
openclaw plugins enable youtube-transcript-speaker-diarization
```

## Authentication

Both install surfaces accept:

- `YOUTUBE_TRANSCRIPT_API_KEY`
- `DIARIZE_API_KEY`
- optional `YOUTUBE_TRANSCRIPT_BASE_URL`
- optional `DIARIZE_BASE_URL`

The default API base URL is `https://diarize.io`.

## What data leaves the machine

For a normal run, only this data is sent to the configured diarize API:

- the YouTube URL
- authenticated API requests for job creation/status/transcript download

No local files are uploaded by default. No host network settings are changed.

## Validation

This repo includes a tiny CI workflow that checks:

- shell syntax for the standalone helper script
- JSON validity of the plugin manifest
- JavaScript syntax for the plugin entry
- npm packability of the plugin package

## Security

See [SECURITY.md](./SECURITY.md).

## Changelog

See [CHANGELOG.md](./CHANGELOG.md).
