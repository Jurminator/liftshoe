# Liftshoe landing page

One-page site that sells Liftshoe — a compact inflatable shoe set that lets smaller people see the acts at concerts. Visitors are consumers (English). "Working" means: a visitor understands the offer and clicks the buy button, which leads to an external checkout. No payments or personal data are handled here.

Tier: own   (see `.claude/tier`)
Workflow: standard

## Check command
`npm run check`   — page validity + accessibility rules, broken links, playbook page rules. Run before claiming anything is done.
`npm run check:release` — same, but unfinished content (placeholders, missing buy link) fails. This is the gate before going live; the deploy runs it.

## Architecture (5 lines max)
- `site/` is the whole website: plain HTML + one CSS file, system fonts, no framework, no build step.
- Hosted on GitHub Pages at jurminator.github.io/liftshoe/. Host-neutral on purpose (relative paths only) so it can move to another static host in minutes. Fallbacks: Vercel (check commercial-use terms of the plan first), Cloudflare Pages, Netlify.
- `scripts/check-page.mjs` enforces the machine-checkable playbook rules.

## Conventions
- Apply the `playbook-landing-pages` skill when planning, writing or reviewing the page. Its checklist is the acceptance test.
- **No fact, no claim.** Every factual statement on the page must trace to `docs/approved-facts.md`, which only the user approves. Never invent numbers, reviews, press, stock levels or deadlines. Missing facts become `[[TODO: …]]` placeholders; placeholders block going live.
- One action per page: every buy button is an `<a data-cta>` with the same link.
- Images go in `site/img/`, with alt text. AI-generated product images must match the real product and need the user's approval before publishing.
- No cookies, no third-party scripts unless allow-listed in `scripts/check-page.mjs`.
- The repo is public: nothing confidential in specs or docs.

## Knowledge
- Specs: `docs/specs/` — read the relevant spec before implementing.
- Approved facts: `docs/approved-facts.md` — changes here always need the user.
- Learnings: `docs/solutions/` — grep here before planning; add to it with `/compound`.
