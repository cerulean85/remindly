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
  additionalProperties: false,
  properties: {
    options: {
      type: "array",
      minItems: 4,
      maxItems: 4,
      items: {
        type: "object",
        additionalProperties: false,
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
  const direct = (data as { output_text?: unknown }).output_text
  if (typeof direct === "string") return direct

  const output = (data as { output?: unknown }).output
  if (!Array.isArray(output)) return null

  for (const item of output) {
    if (typeof item !== "object" || item === null) continue
    const content = (item as { content?: unknown }).content
    if (!Array.isArray(content)) continue
    for (const part of content) {
      if (typeof part !== "object" || part === null) continue
      const text = (part as { text?: unknown }).text
      if (typeof text === "string") return text
    }
  }
  return null
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

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured" }, { status: 503 })
  }

  const problem = await prisma.problem.findFirst({
    where: { id: problemId, userId },
    include: { category: true },
  })
  if (!problem) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      instructions:
        "You generate concise multiple-choice options for a study app. Create one correct option and three plausible but clearly incorrect distractors. Match the user's language. Do not copy the source explanation verbatim; paraphrase the correct option.",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify({
                question: problem.question,
                answer: problem.answer,
                keywords: problem.keywords,
                category: problem.category?.name ?? null,
              }),
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "choice_options",
          strict: true,
          schema: CHOICE_SCHEMA,
        },
      },
      max_output_tokens: 700,
    }),
  })

  if (!response.ok) {
    return NextResponse.json({ error: "Failed to generate choice options" }, { status: 502 })
  }

  const data = await response.json()
  const text = extractResponseText(data)
  if (!text) {
    return NextResponse.json({ error: "AI response did not include text" }, { status: 502 })
  }

  let parsed: ChoicePayload
  try {
    parsed = JSON.parse(text)
  } catch {
    return NextResponse.json({ error: "AI response was not valid JSON" }, { status: 502 })
  }

  const options = normalizeChoices(parsed)
  if (!options) {
    return NextResponse.json({ error: "AI response did not include valid choices" }, { status: 502 })
  }

  return NextResponse.json({ options })
})
