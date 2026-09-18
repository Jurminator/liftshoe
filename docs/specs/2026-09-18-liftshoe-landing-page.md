# Liftshoe landing page
Status: draft     Tier: own     Playbook: `playbook-landing-pages` (researched 2026-09-18)

## Outcome & success criteria
A shorter concert-goer lands on the page, understands within one screen what Liftshoe does for them, and clicks the buy button to an external checkout.
- Live at `https://jurminator.github.io/liftshoe/`, free hosting.
- Measure: buy-button click rate (clicks ÷ visitors). No analytics in v1 (decision D4); until then success = page is live, passes every check, and the owner approves copy and images.
- `npm run check:release` passes — no placeholders, real buy link, all playbook rules a machine can check.

## Scope
**In:** one page, English, B2C · copy drafted by the agent from `docs/approved-facts.md` · illustrative hero image(s) via OpenArt · mobile-first, sticky buy button on mobile · sharing/search tags · automatic publish to GitHub Pages when `main` changes and the release check passes.
**Out (v1):** payments, cart, forms, email capture, cookies, analytics, custom domain, A/B tests, other languages, reviews or press (until real).

## Design
- `site/index.html` + `site/styles.css` + `site/img/`. System fonts, no JavaScript framework; a few lines of script only for the mobile sticky button if CSS alone can't do it.
- Host-neutral (relative paths). GitHub Pages now; GitHub's terms don't intend Pages for e-commerce businesses — accepted as low risk by the owner ("free and painless now"). Fallbacks: Cloudflare Pages / Netlify (free, commercial OK); Vercel only after checking its free plan allows commercial use.
- Publish: GitHub Actions on push to `main` → `npm ci` → `npm run check:release` → deploy `site/`. A failed check means the live page simply stays as it was.

### Page order (playbook default; short-to-medium — cheap product, simple idea)
| # | Section | Content | Facts used |
|---|---|---|---|
| 1 | Hero | Dream outcome headline ("See the whole show" angle) · one-line how · buy button with price · 3 selling points · illustration | F2, F3, F5, F6, (F4) |
| 2 | Problem | The moment every short fan knows: paid for the ticket, watched the back of heads (Sugarman opening, < 12 words) | F2 |
| 3 | How it works | 3 steps: pocket → inflate → see. Details `[[TODO]]` until Q4 | F5, F6, Q4 |
| 4 | Proof | v1: honest "new product" note + guarantee. Hidden review slots ready for real reviews (Q9). **No invented reviews, ratings, logos, counts** | Q6, Q9 |
| 5 | Offer | What's in the box → price → guarantee → button | F3, Q5, Q6 |
| 6 | FAQ | Weight and sizes, safety, inflation, returns, shipping | Q2–Q7 |
| 7 | Final button + footer | Returns, contact, seller identity, "illustrations, not product photos" note | Q6, Q8 |

Operator rules applied: offer before copy (Hormozi) · slippery-slide opening, plain words (Sugarman) · bundle before price (Brunson) · numbers not adjectives (Hopkins) · calm page, 3 selling points, no exits (Firestone) · credibility early — with no proof yet, the guarantee and one checkable fact stand in (Sharma) · no urgency, because no real constraint exists (Kennedy's own rule).

### How "placeholders for proof" is handled
The owner asked for placeholders while proof is collected. Placeholders are visible `[[TODO: …]]` markers in the draft and **block going live**; they are never filled with invented reviews (illegal in US/UK/EU — playbook L1). To go live before proof exists, the proof section ships in its honest v1 form (row 4).

### Images
Owner: "invent for now". Invented images are illustrations of the idea — a fan seeing over a crowd — in a clearly non-photographic style, labelled as illustration in the footer. Not photo-real fake product shots (would misrepresent a product people pay for — playbook L3). 2–3 candidates generated with OpenArt; the owner picks.

## Human approval points
1. This spec and `docs/approved-facts.md` (any later change to the facts file too).
2. F4 "adds 19.99 cm": owner confirms it was measured, or the page uses wording without a number.
3. Final copy and chosen images, before first publish.
4. Merging the first publish PR (= going live on the public internet).

## Verification
- `npm run check` (every change) and `npm run check:release` (gate to live): valid HTML + accessibility rules, no broken links, one buy destination, no exits above footer, relative paths, no third-party scripts/cookies, no fake-urgency wording, no superlatives, reading level ≤ grade 7 (fails above 8), colour contrast ≥ 4.5, no placeholders.
- `/review-gate` runs the playbook checklist; judgement items: O1–O5, C1, C4–C6, S3–S6, S8, L1, L3, L4, T5. Every claim traced to a fact number.
- After deploy: load the live address at phone width (375px) and desktop; Lighthouse mobile performance ≥ 90; buy link opens the checkout.

## Tasks
1. Repo setup: check command, CI check, AI reviewer, this spec and the facts file. *(PR 1)*
2. Page structure and styles with drafted copy; `[[TODO]]` for open facts. `[parallel with 3]`
3. Generate 2–3 illustration candidates (OpenArt); owner picks; optimise and add with alt text. `[parallel with 2]`
4. Sharing/search tags, favicon, Product structured data (price F3).
5. Publish workflow + enable GitHub Pages; protect `main`. *(PR 2 = tasks 2–5)*
6. Owner fills Q1–Q8 → placeholders replaced → release check green → merge → verify live.
7. `/compound` anything non-obvious.

## Decisions taken
- D1 Hosting: GitHub Pages (owner, 2026-09-18). D2 Repo: public `Jurminator/liftshoe`, AI reviewer + branch protection. D3 Workflow: standard. D4 No analytics in v1 (nothing to consent to; add cookie-free click counting later). D5 No discount, no urgency (playbook defaults).

## Open questions
Q1–Q11 in `docs/approved-facts.md`. Blocking for go-live: Q1 (checkout link), Q6 (returns), Q8 (seller contact), F4 confirmation. Safety (Q2, Q3): a ~20 cm inflatable platform used in crowds with an unknown weight limit is a product-liability question beyond this page — the page will make no safety or stability claims, and the FAQ will not answer these until tested.
