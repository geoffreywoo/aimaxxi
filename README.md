# AI/MAXXI — aimaxxi.com


The memetic warfare engine for AI maximalists. The full counterbalance to decels.


Maximum compute. Maximum intelligence. Maximum agents. Maximum robots.
Maximum energy. Maximum abundance. Maximum memes.


10x is cowardice. We want 1,000,000x.


## Site


Static single-page site. No build step.


| File | Purpose |
|---|---|
| `index.html` | The whole site — copy, styles, scripts |
| `hero-bg.jpg` | Hero background artwork |
| `icon.png` | ↗↗ brand mark (nav, footer, final CTA) |
| `favicon.png` | Browser tab icon |
| `memes.jpg` | Meme collage grid |
| `forge.js` | In-browser meme forge — caption, templates, PNG download |
| `lockup.png` | AI/MAXXI text lockup (unused, kept for reference) |
| `deploy.py` | Manual deploy helper — pushes these files to Vercel via API |


## Deploy


Two ways to ship:


1. **Vercel Git integration (connected):** the repo is linked to the `aimaxxi` Vercel project — every push to `main` auto-deploys to production (aimaxxi.com).
2. **Manual:** `VERCEL_TOKEN=<token> python3 deploy.py` — uploads the files in
   this directory straight to the production deployment via the Vercel REST API.
   (Token needs scope for the `aimaxxi` project on the "Geoffrey Woo's projects" team.)


## Links


- Live: https://aimaxxi.com
- Original post: https://x.com/geoffwoo/status/2103746556369543673
- Contract (Solana): `5CQREYZGJQBTBGLVKM1VN9GDGFBWZCAC6TDPRBWZVVJL`
