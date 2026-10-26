# NIRAL UI Repair Kit — read before use

This is a **local repair aid, not a completed/live website fix**. It includes the original user-supplied screenshots, a small safe candidate patch script for the About artwork, a full all-pages Codex brief, and a Playwright regression checklist/test starter.

The current repository lives on the user's computer; the execution environment here cannot write to that computer or push to GitHub. The patch is based on the public `main` source inspected on 2026-10-26 and may differ from uncommitted local changes.

## Steps in Windows PowerShell

From your actual Niral_Hackathon repo root, place this repair kit under `design-references/NIRAL_UI_Repair_Kit`.

Preview the candidate local About fix (does NOT write):

```powershell
python .\design-references\NIRAL_UI_Repair_Kit\fix_about_art.py --check
```

Only if the diff is correct, the target files are unchanged locally, and you want the specific About fix:

```powershell
python .\design-references\NIRAL_UI_Repair_Kit\fix_about_art.py --apply
```

The script refuses to overwrite uncommitted edits to its two target files. On success, timestamped backups go into `.niral-ui-backups/`.

To complete **all ten page fixes**, launch Codex in the repo and give this task:

> Read `design-references/NIRAL_UI_Repair_Kit/CODEX_FIX_ALL_PUBLIC_PAGES.md` and both screenshots. Audit all 10 public pages, correct the current artwork overlap and responsive/UI issues without changing the approved theme, then run builds, route tests, visual screenshots, and report results. Work locally. Do not commit, push or deploy.

The script only fixes the shared overlay depth and AboutHeroArt; other pages need source-level remediation and verified browser QA. Do not report all pages fixed by running this script alone.

If the site uses a different git branch/dirty files, **prefer Codex carefully applying the corrections to that source**, not force-applying old changes.
