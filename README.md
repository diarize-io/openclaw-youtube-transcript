# YouTube Transcript with Speaker Diarization

Public, inspectable OpenClaw integration for people who need more than a generic YouTube transcript: diarize turns YouTube links into clean, speaker-aware transcripts.

This repo contains two install surfaces:

- `skill/`: standalone OpenClaw skill for the fastest first try
- `plugin/`: native OpenClaw plugin with typed tools and a bundled skill for the best long-term experience

Powered by [diarize](https://diarize.io), but intentionally published as a trust-first, standalone integration repo rather than part of the private diarize application codebase.

## Real user flow

This is the path we expect most people to take:

1. Sign up for a diarize account at [diarize.io](https://diarize.io).
2. Create an API key at [diarize.io/settings/api-keys](https://diarize.io/settings/api-keys).
3. Install the standalone skill first if you just want to try it quickly.
4. Upgrade to the native plugin later if you want typed tools and a cleaner OpenClaw integration.
5. Keep only one install surface active at a time.

Your API key consumes your diarize minute balance. If the key is valid but your account has no remaining balance, job creation will fail at the diarize API layer.

## Recommended adoption path

- Try it first with the standalone skill.
- Upgrade to the plugin once you know you want to keep using it.
- Do not keep both installed at the same time.

The reason for the last point is simple: the plugin already ships its own skill guidance, and OpenClaw gives workspace-installed skills higher precedence than plugin-bundled skills. If you leave the standalone skill installed, it can shadow the plugin's bundled skill.

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

### Fastest way to try it: standalone skill

The standalone skill is the fastest path for a first test. It is also the easiest to audit line by line, but it requires `bash`, `curl`, and `jq` on the host machine.

```bash
openclaw skills install ./skill
```

### Upgrade path: native plugin

The plugin is the cleanest install path. It does not require `bash`, `curl`, or `jq`, and it exposes typed tools directly inside OpenClaw.

If you already installed the standalone skill in your active OpenClaw workspace, remove that skill before enabling the plugin. Do not keep both installed.

```bash
openclaw plugins install ./plugin
openclaw plugins enable youtube-transcript-speaker-diarization
```

Then configure your diarize API key in the plugin entry:

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

## Authentication

Both install surfaces accept:

- `YOUTUBE_TRANSCRIPT_API_KEY`
- `DIARIZE_API_KEY`
- optional `YOUTUBE_TRANSCRIPT_BASE_URL`
- optional `DIARIZE_BASE_URL`

The default API base URL is `https://diarize.io`.

The standalone skill can also read OpenClaw skill config. The native plugin can also read plugin config.

Useful links:

- [Sign up for diarize](https://diarize.io)
- [Create or revoke API keys](https://diarize.io/settings/api-keys)
- [Diarize API docs](https://diarize.io/docs)

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

## License

MIT. See [LICENSE](./LICENSE).
