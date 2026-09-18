---
title: First launch gotchas (stacked PRs, previews, screenshots)
tags: [github, pull-requests, preview, github-pages]
date: 2026-09-18
---

## Stacked PRs close when the base branch is deleted
PR 2 was based on the branch of PR 1. Merging PR 1 with `gh pr merge --delete-branch` deleted that base, and GitHub **closed** PR 2 (it does not retarget to `main` when the deletion comes from the CLI).
**Do instead:** base every PR on `main`; if work depends on an open PR, wait for it to merge, or retarget the second PR to `main` before merging the first. Recovery: new branch from `origin/main`, cherry-pick the commits, open a fresh PR.

## Looking at the page without a server
- The desktop app's browser pane shows a local HTML file as a static snapshot: sibling files (`styles.css`, `img/`) are not loaded, so the page looks unstyled. Nothing is wrong with the page.
- For a true preview, build a single file with the CSS inlined and images as base64 into `preview/index.html` (git-ignored).
- Headless Chrome (`--headless=new --screenshot`) will not go narrower than about 500px. For a real 375px phone render, screenshot a wrapper page holding an `<iframe style="width:375px">`, with `--force-device-scale-factor=1`.

## Go-live gate
`npm run check:release` is what the Publish workflow runs. A `[[TODO: …]]` anywhere in the HTML (also inside a `data-todo` attribute, used to guard a claim that awaits owner confirmation) blocks publishing; HTML comments are ignored. A `mailto:` buy link is accepted as a stopgap until a checkout exists.

## Pages setup order
Enable Pages with `gh api -X POST repos/<owner>/<repo>/pages -f build_type=workflow` **before** the first merge that contains the publish workflow, otherwise the first deploy fails.
