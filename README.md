# Fuse Hub

The main menu for Fuse Recruitment's internal tools, hosted on GitHub Pages at
https://fuserecruitment.github.io/FuseTech/

People enter their `@fuserecruitment.com` email the first time they open the
hub (no password). It's saved in their browser, and each tool checks for it
and sends people back to the hub if it's missing. This keeps casual visitors
out. It is **not** real security: the repo is public, so don't put
confidential content here.

## Tools

| Tool | Where it lives | Link |
|---|---|---|
| Bullhorn Categorisation | [fuserecruitment/bullhorn-category](https://github.com/fuserecruitment/bullhorn-category) | https://fuserecruitment.github.io/bullhorn-category/ |
| Present Feedback Review | `present-feedback/` in this repo | https://fuserecruitment.github.io/FuseTech/present-feedback/ |

## Adding a tool

1. Put the tool in its own folder here, or in its own repo under the
   `fuserecruitment` org (GitHub Pages keeps it on the same domain, which the
   shared sign-in relies on).
2. Add an entry to the `TOOLS` list near the top of the script in `index.html`.
   It shows up in the sidebar and as a card on the home page.
3. In the tool's page, add the sign-in check to `<head>` and a
   "Back to Fuse Hub" link. Copy both from `present-feedback/index.html`
   (use `https://fuserecruitment.github.io/FuseTech/` as the hub URL if the
   tool lives in a different repo).
