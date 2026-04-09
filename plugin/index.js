import { Type } from "@sinclair/typebox"
import {
  definePluginEntry,
  jsonResult,
  readNumberParam,
  readStringParam,
} from "openclaw/plugin-sdk/core"

const DEFAULT_BASE_URL = "https://diarize.io"
const DEFAULT_REQUEST_TIMEOUT_MS = 120000
const DEFAULT_POLL_INTERVAL_SECONDS = 10
const DEFAULT_TIMEOUT_SECONDS = 180
const MAX_TIMEOUT_SECONDS = 900
const VALID_FORMATS = new Set(["txt", "json", "srt", "vtt"])

const sharedConfigJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    apiKey: {
      type: "string",
      minLength: 1,
    },
    baseUrl: {
      type: "string",
      minLength: 1,
    },
    requestTimeoutMs: {
      type: "integer",
      minimum: 1000,
      maximum: 600000,
    },
  },
}

const sharedConfigUiHints = {
  apiKey: {
    label: "API key",
    help: "Diarize API key used for job creation and transcript downloads.",
    sensitive: true,
  },
  baseUrl: {
    label: "Base URL",
    help: "Override only if you host the API elsewhere.",
    placeholder: DEFAULT_BASE_URL,
  },
  requestTimeoutMs: {
    label: "Request timeout (ms)",
    help: "Per-request HTTP timeout for submit, status, and transcript fetch calls.",
    advanced: true,
    placeholder: String(DEFAULT_REQUEST_TIMEOUT_MS),
  },
}

const submitJobParameters = Type.Object(
  {
    youtubeUrl: Type.String({
      description: "The YouTube URL to transcribe.",
      minLength: 1,
    }),
  },
  { additionalProperties: false },
)

const getJobParameters = Type.Object(
  {
    jobId: Type.String({
      description: "The job ID returned from youtube_transcript_submit_job or youtube_transcript_run.",
      minLength: 1,
    }),
  },
  { additionalProperties: false },
)

const getTranscriptParameters = Type.Object(
  {
    jobId: Type.String({
      description: "The completed transcription job ID.",
      minLength: 1,
    }),
    format: Type.Optional(
      Type.Union(
        [
          Type.Literal("txt"),
          Type.Literal("json"),
          Type.Literal("srt"),
          Type.Literal("vtt"),
        ],
        { description: "Transcript output format. Defaults to txt." },
      ),
    ),
  },
  { additionalProperties: false },
)

const runParameters = Type.Object(
  {
    youtubeUrl: Type.String({
      description: "The YouTube URL to transcribe.",
      minLength: 1,
    }),
    format: Type.Optional(
      Type.Union(
        [
          Type.Literal("txt"),
          Type.Literal("json"),
          Type.Literal("srt"),
          Type.Literal("vtt"),
        ],
        { description: "Transcript output format. Defaults to txt." },
      ),
    ),
    timeoutSeconds: Type.Optional(
      Type.Number({
        description: "Maximum time to wait for the transcript before returning a timeout payload.",
        minimum: 10,
        maximum: MAX_TIMEOUT_SECONDS,
      }),
    ),
    pollIntervalSeconds: Type.Optional(
      Type.Number({
        description: "Polling interval while waiting for transcript completion.",
        minimum: 2,
        maximum: 60,
      }),
    ),
  },
  { additionalProperties: false },
)

function validatePluginConfig(value) {
  if (value == null) {
    return { ok: true, value: {} }
  }

  if (typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, errors: ["Plugin config must be an object."] }
  }

  const errors = []
  const config = value

  if ("apiKey" in config && typeof config.apiKey !== "string") {
    errors.push("apiKey must be a string.")
  }
  if ("baseUrl" in config && typeof config.baseUrl !== "string") {
    errors.push("baseUrl must be a string.")
  }
  if (
    "requestTimeoutMs" in config &&
    (typeof config.requestTimeoutMs !== "number" ||
      !Number.isFinite(config.requestTimeoutMs) ||
      config.requestTimeoutMs < 1000 ||
      config.requestTimeoutMs > 600000)
  ) {
    errors.push("requestTimeoutMs must be a number between 1000 and 600000.")
  }

  if (errors.length > 0) {
    return { ok: false, errors }
  }

  return { ok: true, value: config }
}

function resolveStringConfig(value) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined
}

function resolveNumberConfig(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined
}

function resolveRuntimeConfig(pluginConfig) {
  const config = pluginConfig ?? {}
  const baseUrl =
    resolveStringConfig(config.baseUrl) ??
    resolveStringConfig(process.env.YOUTUBE_TRANSCRIPT_BASE_URL) ??
    resolveStringConfig(process.env.DIARIZE_BASE_URL) ??
    DEFAULT_BASE_URL
  const apiKey =
    resolveStringConfig(config.apiKey) ??
    resolveStringConfig(process.env.YOUTUBE_TRANSCRIPT_API_KEY) ??
    resolveStringConfig(process.env.DIARIZE_API_KEY)
  const requestTimeoutMs =
    resolveNumberConfig(config.requestTimeoutMs) ?? DEFAULT_REQUEST_TIMEOUT_MS

  return {
    baseUrl: baseUrl.replace(/\/+$/, ""),
    apiKey,
    requestTimeoutMs,
  }
}

function ensureApiKey(runtimeConfig) {
  if (!runtimeConfig.apiKey) {
    throw new Error(
      "Missing API key. Configure plugins.entries.youtube-transcript-speaker-diarization.config.apiKey or set YOUTUBE_TRANSCRIPT_API_KEY.",
    )
  }
  return runtimeConfig.apiKey
}

function normalizeFormat(format) {
  const normalized = typeof format === "string" ? format.trim().toLowerCase() : "txt"
  if (!VALID_FORMATS.has(normalized)) {
    throw new Error(`Unsupported transcript format: ${format}`)
  }
  return normalized
}

function getErrorMessage(status, text) {
  try {
    const payload = JSON.parse(text)
    const code = typeof payload.code === "string" ? payload.code : undefined
    const message =
      typeof payload.message === "string" && payload.message.trim().length > 0
        ? payload.message
        : text

    return code ? `${status} ${code}: ${message}` : `${status}: ${message}`
  } catch {
    return text ? `${status}: ${text}` : `${status}`
  }
}

async function requestJson(runtimeConfig, path, options = {}) {
  const apiKey = ensureApiKey(runtimeConfig)
  const response = await fetch(`${runtimeConfig.baseUrl}${path}`, {
    method: options.method ?? "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: AbortSignal.timeout(runtimeConfig.requestTimeoutMs),
  })

  const text = await response.text()
  if (!response.ok) {
    throw new Error(`youtube-transcript API request failed: ${getErrorMessage(response.status, text)}`)
  }

  if (!text) return {}

  try {
    return JSON.parse(text)
  } catch {
    throw new Error(`youtube-transcript API returned invalid JSON from ${path}`)
  }
}

async function requestTranscript(runtimeConfig, jobId, format) {
  const apiKey = ensureApiKey(runtimeConfig)
  const response = await fetch(
    `${runtimeConfig.baseUrl}/api/v1/jobs/${encodeURIComponent(jobId)}/transcript/${format}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      signal: AbortSignal.timeout(runtimeConfig.requestTimeoutMs),
    },
  )

  const text = await response.text()
  if (!response.ok) {
    throw new Error(
      `youtube-transcript transcript request failed: ${getErrorMessage(response.status, text)}`,
    )
  }

  const contentType = response.headers.get("content-type") ?? undefined

  if (format === "json") {
    try {
      return {
        contentType,
        transcript: JSON.parse(text),
      }
    } catch {
      throw new Error("youtube-transcript returned invalid JSON transcript output")
    }
  }

  return {
    contentType,
    transcript: text,
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitForCompletion(runtimeConfig, jobId, options = {}) {
  const timeoutSeconds =
    Math.min(Math.max(options.timeoutSeconds ?? DEFAULT_TIMEOUT_SECONDS, 10), MAX_TIMEOUT_SECONDS)
  const pollIntervalSeconds = Math.min(
    Math.max(options.pollIntervalSeconds ?? DEFAULT_POLL_INTERVAL_SECONDS, 2),
    60,
  )
  const deadline = Date.now() + timeoutSeconds * 1000
  let lastStatus = null

  while (Date.now() < deadline) {
    const statusPayload = await requestJson(
      runtimeConfig,
      `/api/v1/jobs/${encodeURIComponent(jobId)}`,
    )
    lastStatus = statusPayload

    if (statusPayload.status === "COMPLETED") {
      return {
        kind: "completed",
        statusPayload,
      }
    }

    if (statusPayload.status === "FAILED") {
      return {
        kind: "failed",
        statusPayload,
      }
    }

    await sleep(pollIntervalSeconds * 1000)
  }

  return {
    kind: "timeout",
    statusPayload: lastStatus,
    timeoutSeconds,
    pollIntervalSeconds,
  }
}

function buildPluginConfigSchema() {
  return {
    validate: validatePluginConfig,
    jsonSchema: sharedConfigJsonSchema,
    uiHints: sharedConfigUiHints,
  }
}

function createSubmitTool(pluginConfig) {
  const runtimeConfig = resolveRuntimeConfig(pluginConfig)

  return {
    description:
      "Submit a YouTube URL for speaker-aware transcription. Returns a job ID and initial status.",
    parameters: submitJobParameters,
    execute: async (args) => {
      const youtubeUrl = readStringParam(args, "youtubeUrl", { required: true, trim: true })
      const payload = await requestJson(runtimeConfig, "/api/v1/jobs", {
        method: "POST",
        body: { youtubeUrl },
      })

      return jsonResult({
        youtubeUrl,
        ...payload,
      })
    },
  }
}

function createGetJobTool(pluginConfig) {
  const runtimeConfig = resolveRuntimeConfig(pluginConfig)

  return {
    description: "Get the current status, progress, and error state for a transcription job.",
    parameters: getJobParameters,
    execute: async (args) => {
      const jobId = readStringParam(args, "jobId", { required: true, trim: true })
      const payload = await requestJson(runtimeConfig, `/api/v1/jobs/${encodeURIComponent(jobId)}`)

      return jsonResult(payload)
    },
  }
}

function createGetTranscriptTool(pluginConfig) {
  const runtimeConfig = resolveRuntimeConfig(pluginConfig)

  return {
    description: "Download a completed transcript in txt, json, srt, or vtt format.",
    parameters: getTranscriptParameters,
    execute: async (args) => {
      const jobId = readStringParam(args, "jobId", { required: true, trim: true })
      const format = normalizeFormat(readStringParam(args, "format", { trim: true }) ?? "txt")
      const payload = await requestTranscript(runtimeConfig, jobId, format)

      return jsonResult({
        jobId,
        format,
        ...payload,
      })
    },
  }
}

function createRunTool(pluginConfig) {
  const runtimeConfig = resolveRuntimeConfig(pluginConfig)

  return {
    description:
      "Submit a YouTube URL, wait for completion, and return the finished transcript when it is ready.",
    parameters: runParameters,
    execute: async (args) => {
      const youtubeUrl = readStringParam(args, "youtubeUrl", { required: true, trim: true })
      const format = normalizeFormat(readStringParam(args, "format", { trim: true }) ?? "txt")
      const timeoutSeconds = readNumberParam(args, "timeoutSeconds", { integer: true })
      const pollIntervalSeconds = readNumberParam(args, "pollIntervalSeconds", {
        integer: true,
      })

      const createPayload = await requestJson(runtimeConfig, "/api/v1/jobs", {
        method: "POST",
        body: { youtubeUrl },
      })

      const jobId = typeof createPayload.jobId === "string" ? createPayload.jobId : undefined
      if (!jobId) {
        throw new Error("youtube-transcript API did not return a jobId")
      }

      if (createPayload.status === "COMPLETED") {
        const transcriptPayload = await requestTranscript(runtimeConfig, jobId, format)
        return jsonResult({
          youtubeUrl,
          jobId,
          format,
          job: createPayload,
          ...transcriptPayload,
        })
      }

      const waitResult = await waitForCompletion(runtimeConfig, jobId, {
        timeoutSeconds,
        pollIntervalSeconds,
      })

      if (waitResult.kind === "completed") {
        const transcriptPayload = await requestTranscript(runtimeConfig, jobId, format)
        return jsonResult({
          youtubeUrl,
          jobId,
          format,
          job: waitResult.statusPayload,
          ...transcriptPayload,
        })
      }

      if (waitResult.kind === "failed") {
        return jsonResult({
          youtubeUrl,
          jobId,
          format,
          status: "FAILED",
          job: waitResult.statusPayload,
        })
      }

      return jsonResult({
        youtubeUrl,
        jobId,
        format,
        status: "TIMEOUT",
        timeoutSeconds: waitResult.timeoutSeconds,
        pollIntervalSeconds: waitResult.pollIntervalSeconds,
        job: waitResult.statusPayload,
      })
    },
  }
}

export default definePluginEntry({
  id: "youtube-transcript-speaker-diarization",
  name: "YouTube Transcript with Speaker Diarization",
  description: "Turn YouTube URLs into speaker-aware transcripts with diarization through diarize.",
  configSchema: buildPluginConfigSchema,
  register(api) {
    api.registerTool(() => createRunTool(api.pluginConfig), {
      name: "youtube_transcript_run",
    })

    api.registerTool(() => createSubmitTool(api.pluginConfig), {
      name: "youtube_transcript_submit_job",
    })

    api.registerTool(() => createGetJobTool(api.pluginConfig), {
      name: "youtube_transcript_get_job",
    })

    api.registerTool(() => createGetTranscriptTool(api.pluginConfig), {
      name: "youtube_transcript_get_transcript",
    })
  },
})
