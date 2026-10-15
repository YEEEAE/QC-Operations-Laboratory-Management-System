# Design QA Checklist

Run this checklist before handing off a frontend design task.

## Hierarchy

- Confirm the page has one clear focal point.
- Confirm headings, supporting copy, and actions read in the right order.
- Confirm repeated components share the same spacing, border, and typography logic.

## Responsive Behavior

- Check the smallest supported mobile width first.
- Check that layout shifts are intentional across tablet and desktop breakpoints.
- Check that decorative layers do not block reading or interaction on smaller screens.

## Interaction

- Check hover, focus, pressed, disabled, loading, and empty states when relevant.
- Check that motion clarifies structure instead of delaying access.
- Check that tappable targets remain comfortable on touch devices.

## Accessibility

- Check color contrast on primary text, controls, and status elements.
- Check keyboard navigation and visible focus treatment.
- Check semantic structure when editing markup-heavy pages.

## Performance

- Check that new fonts, images, and effects are justified.
- Check that critical rendering is not blocked by decorative assets.
- Check that added code stays proportional to the visual gain.

## Arabic And RTL

- Check logical spacing and mirrored alignment.
- Check mixed Arabic and English labels for clipping and awkward rhythm.
- Check form fields, tables, and icon directions in RTL contexts.
