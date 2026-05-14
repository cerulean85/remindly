import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/withAuth"

type ChoicePayload = {
  options?: Array<{
    text?: unknown
    isCorrect?: unknown
  }>
}

const CHOICE_SCHEMA = {
  type: "object",
  properties: {
    options: {
      type: "array",
      minItems: 4,
      maxItems: 4,
      items: {
        type: "object",
        properties: {
          text: { type: "string", minLength: 1, maxLength: 180 },
          isCorrect: { type: "boolean" },
        },
        required: ["text", "isCorrect"],
      },
    },
  },
  required: ["options"],
}

function extractResponseText(data: unknown) {
  if (typeof data !== "object" || data === null) return null

  const candidates = (data as { candidates?: unknown }).candidates
  if (!Array.isArray(candidates)) return null
  for (const candidate of candidates) {
    if (typeof candidate !== "object" || candidate === null) continue
    const content = (candidate as { content?: { parts?: unknown } }).content
    const parts = content?.parts
    if (!Array.isArray(parts)) continue
    for (const part of parts) {
      if (typeof part !== "object" || part === null) continue
      const text = (part as { text?: unknown }).text
      if (typeof text === "string") return text
    }
  }
  return null
}

function parseGeminiJson(text: string) {
  try {
    return JSON.parse(text)
  } catch {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
    if (!fenced) throw new Error("Gemini response was not valid JSON")
    return JSON.parse(fenced[1])
  }
}

function buildPrompt(problem: {
  question: string
  answer: string
  keywords: string[]
  category?: { name: string } | null
}) {
  return [
    "You generate concise multiple-choice options for a study app.",
    "Create exactly one correct option and three plausible but clearly incorrect distractors.",
    "Match the user's language.",
    "Do not copy the source explanation verbatim; paraphrase the correct option.",
    "Return only JSON matching the supplied schema.",
    "",
    JSON.stringify({
      question: problem.question,
      answer: problem.answer,
      keywords: problem.keywords,
      category: problem.category?.name ?? null,
    }),
  ].join("\n")
}

function buildGeminiRequest(problem: {
  question: string
  answer: string
  keywords: string[]
  category?: { name: string } | null
}) {
  return {
    contents: [
      {
        role: "user",
        parts: [{ text: buildPrompt(problem) }],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: CHOICE_SCHEMA,
      maxOutputTokens: 700,
    },
  }
}

function extractGeminiError(data: unknown) {
  if (typeof data !== "object" || data === null) return null
  const error = (data as { error?: unknown }).error
  if (typeof error !== "object" || error === null) return null
  const message = (error as { message?: unknown }).message
  return typeof message === "string" ? message : null
}

function normalizeChoices(payload: ChoicePayload) {
  const options = Array.isArray(payload.options) ? payload.options : []
  const normalized = options
    .map((option) => ({
      text: typeof option.text === "string" ? option.text.trim() : "",
      isCorrect: option.isCorrect === true,
    }))
    .filter((option) => option.text.length > 0)

  if (normalized.length !== 4) return null
  if (normalized.filter((option) => option.isCorrect).length !== 1) return null

  return normalized.map((option, index) => ({
    id: `ai-${index}`,
    ...option,
  }))
}

export const POST = withAuth(async (req, { userId }) => {
  const { problemId } = await req.json()
  if (typeof problemId !== "string" || !problemId) {
    return NextResponse.json({ error: "problemId is required" }, { status: 400 })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY is not configured" }, { status: 503 })
  }

  const problem = await prisma.problem.findFirst({
    where: { id: problemId, userId },
    include: { category: true },
  })
  if (!problem) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash"
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: {
      "x-goog-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildGeminiRequest(problem)),
  })

  const data = await response.json()
  if (!response.ok) {
    return NextResponse.json(
      { error: extractGeminiError(data) ?? "Failed to generate choice options" },
      { status: 502 }
    )
  }

  const text = extractResponseText(data)
  if (!text) {
    return NextResponse.json({ error: "AI response did not include text" }, { status: 502 })
  }

  let parsed: ChoicePayload
  try {
    parsed = parseGeminiJson(text)
  } catch {
    return NextResponse.json({ error: "AI response was not valid JSON" }, { status: 502 })
  }

  const options = normalizeChoices(parsed)
  if (!options) {
    return NextResponse.json({ error: "AI response did not include valid choices" }, { status: 502 })
  }

  return NextResponse.json({ options })
})
