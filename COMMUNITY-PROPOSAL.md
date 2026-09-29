# AI/MAXXI community site proposal

Live preview: https://aimaxxi-community-concept.delonwest.chatgpt.site

This draft adds a separate community page while preserving the original homepage.

## Proposed direction

Preserve the original 1,000,000x ambition and AI-maximalist identity while making the site useful to an open, collaborative community of AI builders and investors. The 60% buyback / 40% contributor, team and growth split is a proposal applied to received payouts, after UsePaid’s separate allocation. It is not an announced commitment, a fund, or an implemented governance system.

## Features

- Responsive layout, concise original doctrine, sourced Geoff background.
- Dexscreener price, market cap and 24-hour change, refreshing every 30 seconds. Uses the most liquid matching Solana base-token pool; missing market cap is not replaced by FDV.
- UsePaid sent, token-specific pending and recipient-wide pending shown separately. Failed refreshes are marked stale.
- Illustrative 60/40 allocation calculator, contribution categories and detail dialogs.
- Browser-only poster editor with PNG export; no wallets, accounts, or private keys.

## Running

Serve community.html for the UI and Dexscreener data. The fee endpoint requires a Node serverless runtime; api/metrics.js adapts community-metrics.mjs to Vercel. Static deployments retain a labelled historical fallback. The existing manual deployment helper does not deploy these new files.

## Review decisions

- Whether the collaborative syndicate direction fits the project.
- Whether the 60/40 allocation should be adopted; who controls funds and approvals.
- Contributor selection, funding milestones, governance and token custody/burn policy.
- Wording and sources in the Geoff section. Anti Fund/Jake/Logan biographies do not imply token endorsement.

The UsePaid parser reads public HTML rather than a stable documented API. Payouts marked sent are not independent proof of settlement or buybacks. All funding language is proposed.

This is an AI-assisted community concept shared for feedback before integrating a replacement homepage.
