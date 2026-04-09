# Security

This repo is designed to be easy to inspect before installation.

## Security boundary

Allowed behavior:

- outbound HTTPS calls to the configured diarize API base URL
- YouTube job submission
- job status polling
- transcript download

Disallowed behavior:

- VPN setup
- proxy installation
- route mutation
- firewall mutation
- hidden subprocess chains inside the plugin
- browser automation
- arbitrary URL crawling
- undeclared binaries or undocumented credentials

## Required runtime inputs

Standalone skill:

- `bash`
- `curl`
- `jq`
- `YOUTUBE_TRANSCRIPT_API_KEY` or `DIARIZE_API_KEY`

Native plugin:

- `plugins.entries["youtube-transcript-speaker-diarization"].config.apiKey`
  or `YOUTUBE_TRANSCRIPT_API_KEY`
  or `DIARIZE_API_KEY`

The recommended first-run flow is:

1. create a diarize account
2. create an API key at `https://diarize.io/settings/api-keys`
3. configure the plugin or export the env var

## Review checklist

Before installing, a reviewer should be able to confirm:

1. `skill/scripts/youtube-transcript.sh` only uses `curl` and `jq` against the configured API base URL.
2. `plugin/index.js` only calls the diarize REST API and does not shell out.
3. `plugin/openclaw.plugin.json` matches the shipped plugin files and bundled skill path.
4. The documented env vars and config fields match the actual code paths.

If any future release adds host networking, browser automation, or new external services, that change should be called out prominently in the changelog and security notes.
