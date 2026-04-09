# Standalone Skill

This folder contains the standalone OpenClaw skill.

This is the more inspectable install path, but not the simplest one. Use it if you want a plain shell script you can audit end to end.

Before installing:

1. sign up at [diarize.io](https://diarize.io)
2. create an API key at [diarize.io/settings/api-keys](https://diarize.io/settings/api-keys)
3. make sure `bash`, `curl`, and `jq` are available

Install locally:

```bash
openclaw skills install ./skill
```

Primary files:

- [SKILL.md](./SKILL.md)
- [scripts/youtube-transcript.sh](./scripts/youtube-transcript.sh)
