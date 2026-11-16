# Free camera and day/night theme

## Why

After trying the walking character, Aadit found that the camera chasing him made moving between sections feel like "a lot of movement and whooshing". He also wants visitors to be able to turn the world round and look at it themselves, and a light and dark theme tied to day and night in the valley.

## What Aadit decided

- **The camera goes back to how it was before.** Picking a section moves the camera straight to that section's view in the earlier calm arc. It does not follow the character.
- **The character keeps running exactly as he does now**: same routes, same speed, same poses on arrival. He is simply no longer the camera's subject.
- **"Free world" means turning the world, not steering the character.** Visitors can rotate the view. The character is not controlled by the visitor.
- **Light and dark theme linked to day and night**, with lights, lanterns and torches at night, and page text and colours changing to match.

## Approaches considered

1. **Walk-around valley** — the visitor steers the character. Rejected by Aadit: he meant the camera, not the character.
2. **Fully free fly-anywhere camera** — rejected: easy to get lost, and much more to build.
3. **Turn-the-model camera with the earlier section views (chosen)** — each section keeps its own composed view; from any of them the visitor can drag to turn the valley and zoom, like turning a model on a table.

## Design (my calls unless marked as Aadit's above)

### Camera

- Remove the follow-the-run camera. Restore the timed arc between section views (about 1.8 seconds).
- The character's run takes up to 3.6 seconds, so the camera arrives first and he runs into view. This is intended.
- Dragging on the world (mouse or one finger) turns the view around the current section's subject, all the way round. Scroll or pinch zooms within limits. Tilt is limited so the camera cannot go under the ground or look straight up.
- The camera never passes inside buildings or the mountains: zoom-out and height are clamped.
- Picking any section (bar or landmark) returns to that section's composed view. A small "reset view" button appears once the view has been turned.
- A drag does not count as a click on a landmark or exhibit.
- The gentle drift with the pointer stays while the view is untouched, and stops once the visitor has turned it.
- Keyboard: arrow keys turn, plus and minus zoom, so it is usable without a mouse.
- Reduced motion: turning still works (it is direct control), but section changes jump as they do now.
- Because backs and sides will now be seen, building backs get windows and trim so no side is a blank wall.

### Day and night

- A sun/moon button in the bottom bar. First visit follows the device's light or dark setting; the choice is remembered after that.
- Switching fades over about a second and a half (instant with reduced motion).
- **Night in the world:** deep blue sky with stars and a moon, dim cool moonlight, darker haze. Lamps, windows, the campfire, terminal and cabinet screens glow. New torches at each landmark's door and lanterns along the bridge. Fireflies near the trees. Clouds darken.
- **Night on the page:** all text, panels, the bar, the speech bubble and the opening overlay switch to light-on-dark, through the existing colour variables in `globals.css`. Text contrast is checked in both themes.
- Only a handful of real lights are added (the laptop has integrated graphics); most of the glow comes from bright blocks and a soft halo.

## Not in this piece

- Steering the character.
- Sound, project cards, block outlines, pixel wordmark: still in the round-3 plan, after this.

## Anti-goals

- The view must never end up somewhere confusing with no obvious way back.
- Night must not make the text or the world hard to read.
- No drop in frame rate on Aadit's laptop.
