# Llave

[![X (formerly Twitter) Follow](https://img.shields.io/twitter/follow/mativallej_?style=social)](https://x.com/mativallej_)
[![GitHub top language](https://img.shields.io/github/languages/top/mativallej/llave?color=1081c2)](https://github.com/mativallej/llave/search?l=typescript)
![License](https://img.shields.io/github/license/mativallej/llave?label=license&logo=github&color=f80&logoColor=fff)
![Forks](https://img.shields.io/github/forks/mativallej/llave.svg)
![Stars](https://img.shields.io/github/stars/mativallej/llave.svg)

> The digital channel of a single car dealership: a conversational agent that builds the buyer's request, a tracking link per case, and an MCP server so the staff run the whole operation from Claude. Next.js + Supabase, spec-driven with OpenSpec.

> [!WARNING]
> **In development, nothing shipped yet.** The specs are complete and the code is not. The roadmap below is seven OpenSpec changes, and `openspec list` is the honest progress report. Starring this now means starring an intention.

## Introduction

**Llave is not a marketplace.** It is the digital sales channel of **one** dealership — Falkenberg Meyer Automotores, a used-car multimarca in Rafaela, Argentina. There is no liquidity to build and no two sides: there is a dealership and its customers.

The customer says what car they have and what car they want. The dealership sources it — from its own lot, its network, or an official dealer — appraises the trade-in after seeing it in person, and comes back with one number: the difference.

**What the software actually does** is narrower and more specific than "a dealership website":

- It turns a conversation into a complete, qualified request, without a form.
- It gives that request a link where the customer can see what happened, what is missing and what comes next — **without asking anyone**.
- It lets the dealership run on Claude instead of on an admin panel.

### The mantra, which is also the design constraint

> **The Starbucks of used-car dealers: at every step you know exactly what happens next.**

Starbucks did not win on coffee. It won on consistency — the same menu, the same process, your name on the cup, and a counter where you watch your order move. Buying a car is the opposite: every dealer is different, every salesperson is different, and you never know what comes next.

The test, before building anything: **does the customer know what is next, and when?** If yes, ship it. If no, something needs to be said — and saying it is almost always cheaper than solving it.

## Key Features

- **A conversational agent** that builds the request with widgets inside the chat — stock cards, a service-area map, the photo checklist — instead of asking for everything as text. It never quotes the trade-in: that number requires a human who saw the car.
- **One link per case, no login.** The token *is* the authentication. The customer sees their own progress; the operator sees only the actions of the current state, which is what keeps it from becoming a CRM.
- **The proposal lives in the link**, with a date next to every number. That is what makes *"we do not renegotiate what was already disclosed"* verifiable instead of a promise.
- **An MCP server** so the operator never opens a screen: a photo and *"a 2019 Corolla came in with 78k"* is enough to load a car. Reading is free; writing is deterministic — one explicit argument per tool, never a free-form instruction.
- **Eight metrics, captured as events in the same commit as the feature that produces them.** The one that decides whether the product exists is the only one no system can answer: *"would you have come here without this?"*

## Tech Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router) · React 19 · TypeScript 5.7 |
| Styling | Tailwind 4 + shadcn/ui |
| Data | Supabase — Postgres + Storage + Auth (admin only) |
| Agent | `openai` (Responses API) · `gpt-5.5-2026-04-23` |
| MCP | `@modelcontextprotocol/sdk` — HTTP at `/api/mcp`, stdio for development |
| Deploy | Vercel |

No ORM on top of Supabase. No job queue. No charting library — the dashboard is big numbers and a table.

## Quick Start

### Prerequisites

- Node 20+, pnpm 10+
- A Supabase project
- An OpenAI API key

### Steps

```bash
git clone https://github.com/mativallej/llave.git
cd llave
pnpm install

cp .env.example .env.local     # three Supabase keys + the OpenAI key
supabase login
supabase link --project-ref <your-project-ref>
supabase db push

pnpm dev
```

Operational configuration — the WhatsApp number, the guarantee flag, the contact-window wording — lives in the `config` table, **not** in environment variables. Those change for business reasons and should never require a deploy.

## Architecture Overview

### The data model is a table and a link

One `caso` row per request, **indexed by phone number** — the only identifier consistent across the web, WhatsApp and a phone call. Two `acceso` tokens per case, one for the customer and one for the operator, which is where the two views come from.

### The state maintains itself

Every action goes through the case link, so the state is a byproduct rather than something someone updates. That is why the admin panel only **reads**: if a screen invites you to type anything other than stock, a note, or marking a sale closed, it is badly designed.

### Events are not optional

Each state transition writes its `evento` in the same function that produces the change, never in a later hook. An event added a week later has no history, and the metric starts at zero.

### Autonomy to read, determinism to act

The MCP exposes free reads and deterministic writes. No tool estimates the value of the car the customer is trading in — not because of caution, but because if a tool estimates it, the owner stops being the one who sets the number, and that judgment is the one thing in this business that does not automate.

## Development

Spec-driven with [OpenSpec](https://github.com/Fission-AI/OpenSpec). **No code lands without an approved change.**

```bash
openspec list                 # open changes and their progress
openspec validate <slug>      # before writing a line
openspec archive <slug>       # once done and verified
```

| # | Change | What it enables |
|---|---|---|
| 1 | `limpieza-scaffold` | a repo that does not carry the discarded model |
| 2 | `fundacion-datos` | schema, RLS, events, config. Everything depends on it |
| 3 | `stock-publicaciones` | without stock the agent has nothing to show |
| 4 | `mcp-operacion` | loading a car by talking to Claude |
| 5 | `canal-publico` | the door, the agent and the WhatsApp handoff |
| 6 | `caso-seguimiento` | the counter — the mantra as a product |
| 7 | `tablero-metricas` | the instrument decisions are made with |

`AGENTS.md` is the repo's constitution: business context, the mantra as a tie-breaker, the hard copy rules, the agent's rules, and the list of what not to build. Read it before any change. `openspec/KICKOFF.md` is the prompt that starts an autonomous session, and it opens with a fourteen-check preflight.

## What this is not

| | Why not |
|---|---|
| A multi-tenant SaaS | it charges per operation, not per month |
| A marketplace | no two sides, no liquidity to build |
| A trade-in auction | the dealership appraises. Nobody competes for the incoming car |
| A CRM | the state is a byproduct, so there is nothing to maintain |

**The real competitor is the WhatsApp of a salesperson the customer already knows** — free, trusted, and the default in a town of 120,000. That is what has to be beaten, not the startups.

## Contributing

Issues and pull requests welcome. If you are adding a feature, open an OpenSpec change first: `AGENTS.md` explains the protocol, and a PR without a change is a PR without a spec.

The user-facing language is **Argentine Spanish** (voseo). Code, types and commits are in English.

## Contact

[@mativallej_](https://x.com/mativallej_) · [mativallej.com](https://mativallej.com)

## License

MIT
