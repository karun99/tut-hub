import { test } from "node:test";
import assert from "node:assert/strict";

import { callAI, generateQuiz } from "../src/lib/api-client.js";

function stubFetch(handler) {
  const original = globalThis.fetch;
  globalThis.fetch = handler;
  return () => {
    globalThis.fetch = original;
  };
}

test("callAI posts the prompt to the proxy and returns the payload", async () => {
  let captured;
  const restore = stubFetch(async (url, init) => {
    captured = { url, init };
    return new Response(JSON.stringify({ choices: [{ message: { content: "ok" } }] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  });

  try {
    const result = await callAI("hello", "test-model", "sk-or-123");
    assert.equal(result.choices[0].message.content, "ok");
    assert.equal(captured.url, "/.netlify/functions/ai-proxy");
    assert.equal(captured.init.method, "POST");
    const body = JSON.parse(captured.init.body);
    assert.deepEqual(body, { prompt: "hello", model: "test-model", apiKey: "sk-or-123" });
  } finally {
    restore();
  }
});

test("callAI surfaces the proxy error message", async () => {
  const restore = stubFetch(async () =>
    new Response(JSON.stringify({ error: "rate limited" }), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    }),
  );

  try {
    await assert.rejects(() => callAI("hello", "m", "k"), /rate limited/);
  } finally {
    restore();
  }
});

test("generateQuiz parses an array wrapped in prose and a code fence", async () => {
  const questions = [
    { question: "2 + 2?", options: ["3", "4", "5", "6"], correctIndex: 1, explanation: "arithmetic" },
  ];
  const restore = stubFetch(async () =>
    new Response(
      JSON.stringify({
        choices: [{ message: { content: "Here you go:\n```json\n" + JSON.stringify(questions) + "\n```" } }],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    ),
  );

  try {
    const result = await generateQuiz("addition", "grade 1", "m", "k");
    assert.deepEqual(result, questions);
  } finally {
    restore();
  }
});

test("generateQuiz builds a topic- and grade-aware default prompt", async () => {
  let prompt;
  const restore = stubFetch(async (_url, init) => {
    prompt = JSON.parse(init.body).prompt;
    return new Response(JSON.stringify({ choices: [{ message: { content: "[]" } }] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  });

  try {
    await generateQuiz("fractions", "grade 4", "m", "k");
    assert.match(prompt, /fractions/);
    assert.match(prompt, /grade 4/);
    assert.match(prompt, /correctIndex/);
  } finally {
    restore();
  }
});

test("generateQuiz throws when the model returns invalid JSON", async () => {
  const restore = stubFetch(async () =>
    new Response(JSON.stringify({ choices: [{ message: { content: "not json at all" } }] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
  );

  try {
    await assert.rejects(
      () => generateQuiz("x", "y", "m", "k"),
      /invalid response format/,
    );
  } finally {
    restore();
  }
});
