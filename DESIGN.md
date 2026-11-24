# SimpleINSURE design system

A short record of the visual system. Layout patterns only. Copy rules live in compliance review, not here.

## Palette

- Ink `#0a2540` for body text.
- Navy `#1B365D` for headings and the wordmark field.
- Deep `#06182f` for heroes and the footer.
- Accent `#1A6EC8` for the one primary button and focus rings.
- Sky `#5BA4E5` for small labels on dark sections.
- Paper `#f4f7fb` for page ground. Cards sit on it in white.
- Muted `#3E4854` for supporting lines. It stays dark enough for AA on white.

## Type

- Newsreader for headlines, 500 weight, line-height about 1.05.
- Franklin for UI, 15 to 17 px, line-height 1.4 to 1.6.
- Scale: display clamp 40 to 96 px, section titles clamp 26 to 40 px, card titles 22 to 26 px, body 15 to 17 px.

## Space

- Section padding 72 px on large screens, 40 px under 800 px.
- Card padding 22 px. Grid gap 18 px.
- Radius 22 px on cards, 16 px on questions.
- Page width 1120 px.

## Cards

The Talk to a broker band is the source. Every block is one of these:

- `broker-card`: white, shadow, no grey border. Icon or short title plus one line.
- `img-card`: photo on top, title and one line below.
- `feature-card`: photo beside a short story.
- `guide-card`: title and one line, used for the guide index.
- `step-cards`: numbered steps in the same card shell.
- Full-bleed `page-hero-photo` or the home hero when the section is visual, not a card.

## Icons

Inline 24 px stroke icons, `currentColor`, no icon font. They sit in the card, not in a separate grey box.

## Motion

- Scroll reveal: `.reveal` fades and rises when it enters, via IntersectionObserver in `site.js`.
- Hover: `.lift` moves up 6 px.
- Header: `.bar` shortens after scroll.
- Hero photo: slow Ken Burns. Reduced motion turns transitions and that animation off.
- Anchor links use smooth scrolling except when reduced motion is requested.

## Images

Unique photo per placement. WebP, at least 1200 px wide, `object-fit: cover`. Sources are listed in `photo-credits.md`.
