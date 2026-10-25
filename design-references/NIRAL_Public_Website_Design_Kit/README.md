# NIRAL 2026 — Public Website Design Kit

Contents:
- `references/`: 10 numbered design mockups (full-page PNGs), mapped to routes in the `manifest.json`.
- `CODEX_MASTER_PROMPT.md`: ready-to-use detailed instructions for ChatGPT Codex.
- `manifest.json`: image filenames and SHA-256 checksums.

**These are design images and an implementation prompt, NOT a pre-built source-code website.**
The live website at https://niralhackathon.dpdns.org/ sets the approved global theme. Preserve that homepage exactly. The nine other routes should be developed inside the existing Niral_Hackathon repo using these screenshots as visual reference.

IMPORTANT: Mockups contain illustrative example text (problem listings, schedules, team counts, prize/fee/eligibility claims, and announcements). These are not approved real event facts. Use published backend/CMS data only; show Coming Soon / TBA for missing facts.

## Windows PowerShell (from the existing repository root)
```
# Replace the path below with where you cloned Niral_Hackathon.
cd 'C:\path\to\Niral_Hackathon'
New-Item -ItemType Directory -Force -Path '.\design-references' | Out-Null
Expand-Archive -LiteralPath "$env:USERPROFILE\Downloads\NIRAL_Public_Website_Design_Kit.zip" -DestinationPath '.\design-references' -Force
# Open Codex in this repository (if Codex CLI is installed):
codex
```

Then paste this Codex instruction:
```
Read design-references/NIRAL_Public_Website_Design_Kit/CODEX_MASTER_PROMPT.md and inspect every PNG in design-references/NIRAL_Public_Website_Design_Kit/references/. Implement the complete NIRAL public website in this existing repository. Preserve the deployed homepage and current design system. Do not commit, push or deploy without my approval. Proceed with code and local checks.
```

For the ChatGPT Codex app, select the existing Niral_Hackathon repository and use that same instruction, ensuring the extracted design-references folder is in Codex's working copy.

After Codex has implemented the website, in a terminal at the repo root:
```
npm ci
npm run build
```
If the repository provides lint/test scripts, run those too (check `package.json`). Do not run destructive DB commands.

## Ubuntu/Linux/macOS
```
cd ~/Development/GitHub/Niral_Hackathon
mkdir -p design-references
unzip ~/Downloads/NIRAL_Public_Website_Design_Kit.zip -d design-references
codex
```
Then paste the same Codex instruction. After implementation, run `npm ci && npm run build`.
