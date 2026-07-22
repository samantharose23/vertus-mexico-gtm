---
name: Headline wrap guards
description: Why line-count assertions are insufficient for guarding authored headline line breaks
---

A rendered line-count check (e.g. "headline must be exactly 2 lines") can silently pass even when the authored `\n` break is removed or a style tweak re-wraps at a different word — long titles often still wrap naturally into the same number of lines at wide viewports.

**Why:** Mutation-testing the vertus hero spec showed removing the `\n` from the headline still rendered 2 lines at 1920/2560px, so the count-only assertion never fired.

**How to apply:** When guarding an authored line break (`white-space: pre-line` + `\n`), reconstruct rendered lines by measuring per-word Range rects and grouping by vertical position, then assert the rendered lines equal the `\n`-split segments — not just the count. Always mutation-test layout guards before trusting them.
