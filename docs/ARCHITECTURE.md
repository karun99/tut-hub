# Architecture

TutorConnect (tut-hub) is a React 19 + Vite single-page app for finding tutors
and generating practice quizzes. It talks to Supabase for data and to a Netlify
function that proxies model calls, so no provider key is ever shipped in the
bundle.

## Layout

| Path | Responsibility |
|---|---|
| `web-app/src/main.jsx` | Application entry: router, theme provider, global styles |
| `web-app/src/pages/public/*` | Landing, login, tutor catalogue and resources |
| `web-app/src/pages/admin/*` | Admin dashboard for platform settings |
| `web-app/src/pages/tutor/*` | Tutor workspace, including the quiz generator |
| `web-app/src/context/ThemeContext.jsx` | Light/dark theme with local persistence |
| `web-app/src/db/schema.js` | Drizzle schema: users, tutors, resources, quizzes, jobs |
| `web-app/src/db/index.js` | Database client |
| `web-app/src/lib/supabase.js` | Supabase client |
| `web-app/src/lib/api-client.js` | Model calls and quiz-response normalisation |
| `netlify/functions/ai-proxy.js` | Server-side proxy that injects the provider key |

## Request flow

```
QuizGenerator → generateQuiz() → callAI() → POST /.netlify/functions/ai-proxy
                                             → provider API
                                             ← choices[0].message.content
            ← extracted JSON array ← parsed and rendered
```

`generateQuiz` accepts the model output either as a bare array or wrapped in
prose or a fenced code block. Anything else raises a user-facing
`invalid response format` error instead of rendering a corrupt quiz.

## Trust boundaries

- The provider key travels from the browser to the proxy only for the request;
  the deployment keeps the canonical key in Netlify environment variables.
- Supabase access uses the public anon key; row-level policies gate writes.
- User-supplied topic and grade strings are interpolated into the prompt, so the
  proxy is the place to add rate limiting and moderation.

## Verification

```bash
cd web-app
npm ci
npm test
npm run build
```

The unit suite stubs `fetch` and covers proxy request shape, error propagation,
JSON extraction from prose/fences and the invalid-response path. CI runs the
same commands on Node 22 for every push and pull request.
