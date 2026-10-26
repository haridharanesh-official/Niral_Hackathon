#!/usr/bin/env python3
"""Surgical NIRAL About-art layering fix against the existing Next.js repo.

Use --check to preview, --apply to modify local working-tree files.
Requires clean target files and creates timestamped backups under .niral-ui-backups.
Does not call network or GitHub and cannot push/deploy.
"""
from __future__ import annotations
import argparse
import difflib
from datetime import datetime
from pathlib import Path
import subprocess
import sys

BEGIN = "// 1. ABOUT HERO ART:"
END = "// 2. ABOUT EXPERIENCE ART:"
MARKER = "NIRAL ABOUT HERO V2: CORRECTED LAYERING"
CSS_MARKER = "/* NIRAL_UI_ARTWORK_LAYERING_V2 */"

NEW_ABOUT = r'''// 1. ABOUT HERO ART: NIRAL ABOUT HERO V2: CORRECTED LAYERING
// The 3D scene tilts, while its interactive badges stay in an independent
// foreground layer. This prevents the browser window covering its labels.
export function AboutHeroArt() {
  const { x, y, handlePointerMove, handlePointerLeave } = useCardTilt(34);
  const [activeBadge, setActiveBadge] = useState<string | null>(null);
  const concepts = [
    { name: 'Ideas', Icon: Lightbulb, key: 'ideas', text: 'Start with a meaningful question and explore creative possibilities.' },
    { name: 'Build', Icon: Zap, key: 'build', text: 'Experiment with technology and transform ideas into practical prototypes.' },
    { name: 'Innovate', Icon: Cpu, key: 'innovate', text: 'Explore thoughtful approaches to real-world challenges.' },
    { name: 'Collaborate', Icon: Users, key: 'collaborate', text: 'Learn from different perspectives and build together.' },
  ];
  return (
    <div
      className={`${publicStyles.artCanvas} ${publicStyles.aboutArtCanvas}`}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      aria-label="Interactive NIRAL illustration: ideas, building, innovation and collaboration"
    >
      <motion.div
        className={`${publicStyles.interactiveStack} ${publicStyles.aboutVisualStage}`}
        style={{ rotateX: x, rotateY: y }}
        aria-hidden="true"
      >
        <div className={publicStyles.aboutArtOutline} />
        <div className={publicStyles.aboutRearLeft} />
        <div className={publicStyles.aboutRearRight} />
        <div className={publicStyles.aboutBackWindow}>
          <div className={publicStyles.aboutWindowTop}><span>● ● ●</span></div>
        </div>
        <div className={publicStyles.aboutFrontWindow}>
          <div className={publicStyles.aboutWindowTop}>
            <span className={publicStyles.aboutWindowDots}>● ● ●</span>
            <span className={publicStyles.aboutWindowName}>NIRAL / STUDIO</span>
          </div>
          <div className={publicStyles.aboutWindowBody}>
            <div className={publicStyles.aboutCodeBlock}>
              <Code2 size={64} strokeWidth={2.2} color="#111" />
            </div>
          </div>
        </div>
        <div className={publicStyles.aboutCursor} aria-hidden="true">↗</div>
      </motion.div>
      <div className={publicStyles.aboutFloatingLayer}>
        {concepts.map(({ name, Icon, key }) => (
          <button
            key={key}
            type="button"
            className={`${publicStyles.floatingBadge} ${publicStyles.aboutBadge} ${publicStyles[`aboutBadge${name}`]}`}
            aria-pressed={activeBadge === key}
            aria-controls="niral-about-art-detail"
            onClick={() => setActiveBadge(activeBadge === key ? null : key)}
          >
            <Icon size={18} aria-hidden="true" />
            <span>{name}</span>
          </button>
        ))}
      </div>
      <p id="niral-about-art-detail" className={publicStyles.aboutArtCaption} aria-live="polite">
        {concepts.find((c) => c.key === activeBadge)?.text ?? 'Select a concept to see what makes NIRAL special.'}
      </p>
    </div>
  );

'''

CSS = r'''
/* NIRAL_UI_ARTWORK_LAYERING_V2 */
/* Make all original artwork badges sit above transformed front windows. */
.interactiveStack .floatingBadge {
  transform: translateZ(85px);
  backface-visibility: hidden;
  white-space: nowrap;
}
.interactiveStack .floatingBadge:hover {
  transform: translateZ(85px) translateY(-3px) scale(1.03);
}

/* About hero: tilt the illustration only, not its accessible controls. */
.aboutArtCanvas {
  isolation: isolate;
  min-height: 430px;
}
.aboutVisualStage {
  position: absolute;
  inset: 11% 9% 15%;
  width: auto;
  max-width: none;
  aspect-ratio: auto;
  height: auto;
  pointer-events: none;
}
.aboutArtOutline {
  position: absolute;
  inset: 0;
  border: 2px solid #111;
  border-radius: 23px;
}
.aboutRearLeft, .aboutRearRight, .aboutBackWindow, .aboutFrontWindow {
  position: absolute;
  border: 2px solid #111;
  border-radius: 15px;
}
.aboutRearLeft {
  inset: 30% 33% 17% 16%;
  background: var(--niral-soft-coral, #ffe2db);
  transform: rotate(-5deg) translateZ(3px);
}
.aboutRearRight {
  inset: 27% 10% 18% 45%;
  background: var(--niral-coral, #fd9b9b);
  transform: rotate(6deg) translateZ(6px);
}
.aboutBackWindow {
  inset: 17% 28% 27% 15%;
  background: var(--niral-soft-coral, #ffe2db);
  transform: rotate(-5deg) translateZ(12px);
  overflow: hidden;
}
.aboutFrontWindow {
  inset: 19% 19% 23% 24%;
  background: #fff;
  box-shadow: 0 7px 0 #111;
  transform: rotate(3deg) translateZ(28px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.aboutWindowTop {
  height: 32px;
  flex: 0 0 32px;
  border-bottom: 2px solid #111;
  background: var(--niral-paper, #faf7f2);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 12px;
}
.aboutWindowDots { color: #ba7373; letter-spacing: 2px; font-size: 10px; }
.aboutWindowName { font-size: 10px; letter-spacing: 1.2px; font-weight: 700; color: #777; }
.aboutWindowBody {
  flex: 1;
  display: grid;
  place-items: center;
  background: radial-gradient(#dededb .65px, transparent .65px) 4px 4px/18px 18px, #fff;
}
.aboutCodeBlock {
  width: 69%;
  aspect-ratio: 1.34;
  max-height: 76%;
  display: grid;
  place-items: center;
  border: 2px solid #111;
  border-radius: 13px;
  background: var(--niral-coral, #fd9b9b);
  box-shadow: 0 5px 0 #111;
}
.aboutCursor {
  position: absolute;
  top: 68%;
  left: 69%;
  color: var(--niral-coral, #fd9b9b);
  font-size: 50px;
  line-height: 1;
  font-weight: 900;
  text-shadow: -2px -2px #111, 2px -2px #111, -2px 2px #111, 2px 2px #111;
  transform: translateZ(46px) rotate(-15deg);
}
.aboutFloatingLayer {
  position: absolute;
  inset: 0;
  z-index: 10;
  pointer-events: none;
}
.aboutFloatingLayer .aboutBadge {
  pointer-events: auto;
  position: absolute;
  transform: none;
  background: var(--niral-soft-coral, #ffe2db);
  white-space: nowrap;
  box-shadow: 0 3px 0 #111;
}
.aboutFloatingLayer .aboutBadge:hover { transform: translateY(-3px) scale(1.03); }
.aboutFloatingLayer .aboutBadge[aria-pressed="true"] { background: var(--niral-coral, #fd9b9b); }
.aboutBadgeIdeas { top: 10%; left: 1%; }
.aboutBadgeBuild { top: 9%; right: 1%; }
.aboutBadgeInnovate { right: 0; bottom: 20%; }
.aboutBadgeCollaborate { left: 0; bottom: 24%; }
.aboutArtCaption {
  position: absolute;
  z-index: 11;
  bottom: 1%;
  left: 8%;
  right: 8%;
  min-height: 22px;
  margin: 0;
  text-align: center;
  font-size: 12px;
  line-height: 1.35;
  color: #555;
}
@media (max-width: 600px) {
  .aboutArtCanvas { min-height: 350px; }
  .aboutVisualStage { inset: 13% 7% 20%; }
  .aboutFloatingLayer .aboutBadge { font-size: 11px; padding: 7px 9px; gap: 5px; }
  .aboutFloatingLayer .aboutBadge svg { width: 15px; height: 15px; }
  .aboutBadgeIdeas { top: 6%; left: 0; }
  .aboutBadgeBuild { top: 6%; right: 0; }
  .aboutBadgeInnovate { right: 0; bottom: 20%; }
  .aboutBadgeCollaborate { left: 0; bottom: 20%; }
  .aboutWindowName { display: none; }
}
@media (max-width: 360px) {
  .aboutArtCanvas { min-height: 320px; }
  .aboutFloatingLayer .aboutBadge { font-size: 10px; padding: 6px 7px; }
  .aboutCodeBlock svg { width: 44px; }
}
@media (prefers-reduced-motion: reduce) {
  .interactiveStack .floatingBadge,
  .interactiveStack .floatingBadge:hover,
  .aboutFloatingLayer .aboutBadge:hover { transform: none; }
}
'''

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('repo',nargs='?',default='.',help='Path to existing Niral_Hackathon repository')
    mode=parser.add_mutually_exclusive_group(required=True)
    mode.add_argument('--check',action='store_true',help='Preview changes without writing files')
    mode.add_argument('--apply',action='store_true',help='Apply local changes after checking clean target files')
    args=parser.parse_args()
    repo=Path(args.repo).resolve()
    art=repo/'apps/web/src/components/niral/art-components.tsx'
    css=repo/'apps/web/src/components/niral/public-pages.module.css'
    if not art.is_file() or not css.is_file():
        sys.exit('ERROR: Expected NIRAL source files not found. Run from project root, or pass repo path.')
    art_old=art.read_text(encoding='utf-8')
    css_old=css.read_text(encoding='utf-8')
    if MARKER in art_old and CSS_MARKER in css_old:
        print('Already applied. No changes needed.'); return
    if BEGIN not in art_old or END not in art_old:
        sys.exit('ERROR: Expected AboutHeroArt markers not found; branch differs. Use Codex rather than applying a blind patch.')
    i,j=art_old.index(BEGIN),art_old.index(END)
    if i>=j: sys.exit('ERROR: Unexpected source ordering.')
    art_new=art_old[:i]+NEW_ABOUT+art_old[j:]
    css_new=css_old if CSS_MARKER in css_old else css_old+'\n'+CSS
    rels=['apps/web/src/components/niral/art-components.tsx','apps/web/src/components/niral/public-pages.module.css']
    if args.check:
        for rel,old,new in zip(rels,[art_old,css_old],[art_new,css_new]):
            before=old.splitlines(keepends=True); after=new.splitlines(keepends=True)
            diff=list(difflib.unified_diff(before,after,fromfile='a/'+rel,tofile='b/'+rel,n=2))
            print(rel,':',len(diff),'diff lines; ',len(new)-len(old),'characters change')
            print(''.join(diff[:65]))
            if len(diff)>65: print('... diff truncated; no files modified')
        return
    status=subprocess.run(['git','status','--porcelain','--',*rels],cwd=repo,text=True,capture_output=True)
    if status.returncode != 0: sys.exit('ERROR: git status failed; ensure this is a Git repository')
    if status.stdout.strip():
        sys.exit('ERROR: Target files have existing uncommitted changes. Preserve them and ask Codex to apply the fix manually.\n'+status.stdout)
    backups=repo/'.niral-ui-backups'/datetime.now().strftime('%Y%m%d-%H%M%S')
    backups.mkdir(parents=True,exist_ok=True)
    for rel,old,new in zip(rels,[art_old,css_old],[art_new,css_new]):
        backup=backups/rel;backup.parent.mkdir(parents=True,exist_ok=True);backup.write_text(old,encoding='utf-8')
        (repo/rel).write_text(new,encoding='utf-8')
        print('UPDATED',rel)
    print('Backups:',backups)
    print('Next: npm run build, browser QA on /about and all public routes. No changes committed or pushed.')

if __name__=='__main__':main()
