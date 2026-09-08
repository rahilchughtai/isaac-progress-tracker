# Ray Isaac Tracker

## Features

- Upload your local Binding of Isaac: Repentance save file to see which achievements you've unlocked
- Track progress for all characters, items, and secrets
- Fully client-side &mdash; no server, no accounts, no data leaves your browser
- Mobile-friendly

## Development

```
npm install
npm run dev       # start the local dev server
npm run build     # produce a static build in dist/
npm run preview   # preview the production build locally
```

## Deployment

This is a fully static site (see `netlify.toml`) &mdash; `npm run build` produces `dist/`, which needs no server, database, or environment variables to run. Deploys cleanly to Netlify or any other static host.

## Data

Achievement/unlock metadata (`src/data/unlocks.json`) is a frozen snapshot combining Steam's achievement schema with content from the [Binding of Isaac Rebirth Wiki](https://bindingofisaacrebirth.fandom.com/). It is not regenerated automatically; see git history for the previous PHP/MariaDB-based scraping pipeline if this ever needs to be refreshed for new game content.
