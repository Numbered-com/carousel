# Blossom Core

A native-scroll-first carousel for the web.

## Installation

Add the blossom-carousel package to your project.

```bash
npm install @numbered/carousel
```

Then, create a Blossom instance and initialize it.

```js
import { Blossom } from "@numbered/carousel";
import "@numbered/carousel/style.css";

const element = document.querySelector("#my-carousel-element");
// prepare the Blossom carousel
const blossom = Blossom(element, {});
// initialize whenever you want
blossom.init();
```

The stylesheet is required, framework wrappers included: besides the base layout, it turns native snapping off while the physics engine moves the scroller, so the two never fight.

## Lazy loading

Load Blossom only when needed.

```js
const hasMouse = window.matchMedia(
  "(hover: hover) and (pointer: fine)"
).matches;

// We don't need Blossom's engine on touch devices
if (!hasMouse) return;

const { Blossom } = await import("@numbered/carousel");

const element = document.querySelector("#my-carousel-element");
const blossom = Blossom(element, {});
blossom.init();
```

### Destroy

Destroy the Blossom instance when you no longer need it to free up resources.

```js
blossom.destroy();
```

## Options

```js
Blossom(element, { repeat: true });
```

| Option   | Type      | Default | Description                                                                                                                                                                     |
| -------- | --------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `repeat` | `boolean` | `false` | Infinite loop: slides are translated so the carousel wraps seamlessly in both directions. Horizontal only, and it needs the physics engine, so it only runs where Blossom loads. |

## Navigation

```js
blossom.next();
blossom.prev();
blossom.currentIndex(); // index of the active snap point
```

`next()` and `prev()` move to the adjacent snap point. Positions come from your CSS: each slide's `scroll-snap-align` (`start`, `center` or `end`), its `scroll-margin`, the carousel's `scroll-padding` and `direction: rtl` are all honoured. When Blossom runs on a touch device without `repeat`, scrolling stays native and navigation uses a smooth `scrollIntoView`.

## Events

Both events are dispatched on the carousel element.

```js
element.addEventListener("change", (e) => {
  // Native `change` events from inputs in slides, and nested carousels, bubble here too
  if (e.target !== e.currentTarget) return;
  console.log(e.detail.index);
});

element.addEventListener("overscroll", (e) => {
  // Pulled past an edge: e.detail.left (horizontal) or e.detail.top (vertical), in px.
  // preventDefault() skips the built-in rubber band so you can render your own.
});
```

| Event        | Detail                       | Fires when                                     |
| ------------ | ---------------------------- | ---------------------------------------------- |
| `change`     | `{ index }`                  | The active snap point changes. Bubbles.        |
| `overscroll` | `{ left }` or `{ top }`      | The carousel is pulled past an edge. Cancelable. |

## Snapping

Snapping is plain CSS `scroll-snap`. At rest your `scroll-snap-type` applies, so trackpad, wheel and keyboard scrolls snap natively. While Blossom's physics moves the carousel (dragging, momentum, `next()`/`prev()`), native snapping is switched off through the stylesheet and Blossom lands on the snap point itself. Snap points are re-measured when the carousel, its slides or its children change.

## Vertical carousels

The snap axis follows the carousel's overflow. Make it scroll vertically only and Blossom drags, snaps and navigates along `y`; this can change per breakpoint, so one element can be horizontal on mobile and vertical on desktop:

```css
@media (min-width: 1024px) {
  #my-carousel-element {
    display: flex;
    flex-direction: column;
    overflow-x: clip;
    overflow-y: auto;
    scroll-snap-type: y mandatory;
  }
}
```

Repeat mode only loops horizontally.

### Get started in your favorite framework:

- [React](https://www.npmjs.com/package/@numbered/carousel-react)
- [Vue](https://www.npmjs.com/package/@numbered/carousel-vue)
- [Svelte](https://www.npmjs.com/package/@numbered/carousel-svelte)
- [Alpine.js](https://www.npmjs.com/package/@numbered/carousel-alpine)
- [Web Component](https://www.npmjs.com/package/@numbered/carousel-web)

## Examples

- [Simple](https://www.blossom-carousel.com/docs/examples#simple)
- [Variable widths](https://www.blossom-carousel.com/docs/examples#variable-widths)
- [CSS Grid](https://www.blossom-carousel.com/docs/examples#css-grid)
- [Multiple rows](https://www.blossom-carousel.com/docs/examples#multiple-rows)
- [Snapping](https://www.blossom-carousel.com/docs/examples#snapping)
- [Grouping](https://www.blossom-carousel.com/docs/examples#grouping)
- [Sticky](https://www.blossom-carousel.com/docs/examples#sticky)
- [Coverflow](https://www.blossom-carousel.com/docs/examples#cover-flow)
