# Plugin Security Notes

The native plugin is intentionally narrower than many other YouTube-related entries on ClawHub.

It only:

- reads documented plugin config and env vars
- performs authenticated HTTPS requests to the diarize API
- returns job/transcript results

It does not:

- spawn shell commands
- install or configure proxies
- mutate host routing
- browse arbitrary URLs
