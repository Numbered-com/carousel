# Blossom Alpine

A native-scroll-first carousel enhanced with drag support for Alpine.js.

## Installation

`npm install @numbered/carousel-alpine @numbered/carousel`

```javascript
import Alpine from "alpinejs";
import blossomCarousel from "@numbered/carousel-alpine";
import "@numbered/carousel/style.css";

Alpine.plugin(blossomCarousel);
Alpine.start();
```

## Usage

The plugin registers a `carousel` component. The carousel is the element with `x-ref="carousel"`, or the `x-data` element itself.

```html
<div x-data="carousel()">
  <ul x-ref="carousel">
    <li>Slide 1</li>
    <li>Slide 2</li>
    <li>Slide 3</li>
    ...
  </ul>

  <button @click="prev()">Previous</button>
  <button @click="next()">Next</button>
  <span x-text="currentIndex"></span>
</div>
```

| Scope          | Description                                                                                                         |
| -------------- | ------------------------------------------------------------------------------------------------------------------- |
| `currentIndex` | Reactive index of the active snap point.                                                                            |
| `next()`       | Moves to the next snap point, following each slide's `scroll-snap-align`, `scroll-margin` and the `scroll-padding`. |
| `prev()`       | Moves to the previous snap point.                                                                                   |

## Options

```html
<div x-data="carousel({ repeat: true, load: 'always' })">...</div>
```

| Option   | Default | Description                                                                                                                                       |
| -------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `repeat` | `false` | Infinite loop. Horizontal only, and only where the physics engine runs.                                                                           |
| `load`   | -       | By default the engine only initialises on devices with a fine pointer (mouse, trackpad); touch devices keep native scrolling. `'always'` initialises it everywhere. The plugin imports the engine statically, so it is downloaded on every device. |

Without the engine (touch devices, unless `load: 'always'`), `prev()`/`next()` do nothing and `currentIndex` stays `0`.

## Vertical carousels

The axis follows the carousel's CSS overflow and can change per breakpoint. See the [core docs](https://www.npmjs.com/package/@numbered/carousel#vertical-carousels).
