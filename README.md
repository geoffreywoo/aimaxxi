# AI/MAXXI ↗↗

Maximum intelligence. Maximum memes. An open invitation to build, make, and meme an abundant future into existence.

## Run locally

Node.js 22 or newer. The site has no runtime or npm dependencies.

```sh
npm run build
npm test
python3 -m http.server 4173 --directory dist
```

Open http://localhost:4173. Rebuild after editing the HTML template or assets.

## Source

| Path | Purpose |
| --- | --- |
| `src/index.html` | Static page template and approved copy |
| `site.config.json` | Canonical URL, exact Solana mint, repository and social links |
| `assets/css/site.css` | Responsive visual system and reduced-motion rules |
| `assets/js/site.js` | Progressive mobile navigation and honest clipboard states |
| `assets/brand/` | SVG masters, outlined wordmarks, PNGs, icons and social preview |
| `assets/art/` | Optimized original campaign imagery |
| `assets/art/source/` | Original generated artwork and production provenance; excluded from deployment |
| `assets/kit/` | Posters, editable SVG templates, usage guide and complete ZIP |
| `scripts/build-site.mjs` | Renders canonical links and produces the public `dist/` tree |
| `scripts/build-assets.py` | Rebuilds identity exports, artwork composites and kit |
| `tests/` | Static integrity and interaction regression tests |

`index.html` is generated and committed for easy inspection. Edit `src/index.html`, then build. All essential content, downloads and outbound links are HTML; JavaScript only enhances the menu and clipboard. Existing `#top`, `#doctrine`, `#schism`, `#buy` and `#memes` links continue to work.

Artwork exports require Python 3.11 or newer (Pillow 13). In an isolated environment using that Python version, install the pinned packages in `scripts/asset-requirements.txt`, then run `python scripts/build-assets.py` and rebuild the site. The Node site build does not run this asset generator. The original image-generation prompts and production details are recorded in the source provenance; the kit includes a portable provenance manifest. Logos and campaign typography are composited vector/raster elements. The kit includes editable SVG templates and the OFL font files required to edit them.

## Participate

Get the [brand kit](https://aimaxxi.com/assets/kit/aimaxxi-brand-kit-v1.zip), make something and share it with **#AIMAXXI**. The site opens an editable X post or a prefilled GitHub issue. It never posts or submits on your behalf. GitHub submissions are public and require sign-in. Attach images manually on X.

See [asset use and remix guidance](assets/kit/BRAND-GUIDE.md). Use **AI/MAXXI** visually, **AI Maxxi** in prose and **#AIMAXXI** for discovery. Credit contributors; a community remix does not imply official endorsement.

## Token

The token's on-chain name is `ai/maxxi` on Solana. Addresses are case sensitive. The canonical mint is:

```text
5cQReyzgJQbtbGLvkm1vN9GDGFBWzcAC6TDprBwzVVjL
```

Change it only in `site.config.json`; the build derives the display, metadata and Jupiter, Solscan and Dexscreener destinations. Clipboard behavior reads the rendered value. The mint was checked read-only against Solana mainnet during the redesign. The coin may lose all value. Participation does not require owning it.

## Preview and release

Use the existing Vercel Git integration. Push a feature branch and review its Preview deployment and PR. `vercel.json` builds the static `dist/` output and runs every test before deployment. Do not promote or merge until the preview has been reviewed. A merge to the production branch can publish to aimaxxi.com.

The obsolete manual production uploader has been removed. Deploy through the Git integration; no deployment token is required by this repository. Private local strategy/research documents are ignored and excluded from the published tree. Existing meme-generator and enlistment-card PRs are independent work, not part of this release.

Before a production release, record the current production deployment; retain it for rollback. After promotion, verify the live domain, full kit, exact mint, metadata and main participation links. Roll back through the Vercel deployment history if those checks fail.

## Security

See [SECURITY.md](SECURITY.md) for the threat model, browser policy, credential handling, and private vulnerability reporting. A public deployment URL or project ID is not an upload credential. Deploy-hook URLs and API tokens are secrets.

## Links

- [Website](https://aimaxxi.com)
- [Original manifesto](https://x.com/geoffwoo/status/2103746556369543673)
- [Geoffrey Woo on X](https://x.com/geoffwoo)
- [Repository](https://github.com/geoffreywoo/aimaxxi)
