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
const blossom = Blossom(element);
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
const blossom = Blossom(element);
blossom.init();
```

### Destroy

Destroy the Blossom instance when you no longer need it to free up resources.

```js
blossom.destroy();
```

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

Repeat mode only loops horizontally. Overscroll events carry `detail.left` horizontally and `detail.top` vertically.

### Get started in your favorite framework:

- [React](https://www.npmjs.com/package/@numbered/carousel-react)
- [Vue](https://www.npmjs.com/package/@numbered/carousel-vue)
- [Svelte](https://www.npmjs.com/package/@numbered/carousel-svelte)
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
