# Blossom Carousel

A native-scroll-first carousel enhanced with drag support for Vue.

## Installation

`npm install @numbered/carousel-vue @numbered/carousel`

#### Vue

```javascript
import { BlossomCarousel } from "@numbered/carousel-vue";
import "@numbered/carousel/style.css";

const app = createApp({});
app.component("BlossomCarousel", BlossomCarousel);
```

#### Nuxt

Install globally `plugins/blossom-carousel.js`

```javascript
import { BlossomCarousel } from "@numbered/carousel-vue";
import "@numbered/carousel/style.css";

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component("BlossomCarousel", BlossomCarousel);
});
```

## Usage

```html
<BlossomCarousel>
  <div v-for="i in 12">Slide {{ i }}</div>
</BlossomCarousel>
```

### as

Define the HTMLElement of the carousel root.

```html
<BlossomCarousel as="ul">
  <li v-for="i in 12">Slide {{ i }}</li>
</BlossomCarousel>
```

Renders as

```html
<ul>
  <li>Slide 1</li>
  <li>Slide 2</li>
  <li>Slide 3</li>
  ...
</ul>
```

### repeat

Infinite loop. Horizontal only, and only where the physics engine loads (see `load`).

```html
<BlossomCarousel repeat>...</BlossomCarousel>
```

### load

By default the engine only loads on devices with a fine pointer (mouse, trackpad); touch devices keep native scrolling and load nothing. `load="always"` loads it everywhere.

```html
<BlossomCarousel load="always">...</BlossomCarousel>
```

### change event

The carousel element dispatches a `change` event when the active snap point changes.

```html
<BlossomCarousel @change="(e) => e.target === e.currentTarget && console.log(e.detail.index)">...</BlossomCarousel>
```

The target check skips native `change` events bubbling up from inputs inside slides.

### Navigation

The component exposes `next()`, `prev()`, `currentIndex()` and the element as `el`. Positions follow each slide's `scroll-snap-align`, `scroll-margin` and the carousel's `scroll-padding`.

```html
<script setup>
import { ref } from "vue";
const carousel = ref(null);
</script>

<template>
  <BlossomCarousel ref="carousel">...</BlossomCarousel>
  <button @click="carousel.prev()">Previous</button>
  <button @click="carousel.next()">Next</button>
</template>
```

The engine isn't loaded on touch devices unless `load="always"`, so the methods do nothing there.

### Vertical carousels

The axis follows the carousel's CSS overflow and can change per breakpoint. See the [core docs](https://www.npmjs.com/package/@numbered/carousel#vertical-carousels).

## Examples

- [Simple](https://www.blossom-carousel.com/docs/examples#simple)
- [Variable widths](https://www.blossom-carousel.com/docs/examples#variable-widths)
- [CSS Grid](https://www.blossom-carousel.com/docs/examples#css-grid)
- [Multiple rows](https://www.blossom-carousel.com/docs/examples#multiple-rows)
- [Snapping](https://www.blossom-carousel.com/docs/examples#snapping)
- [Grouping](https://www.blossom-carousel.com/docs/examples#grouping)
- [Sticky](https://www.blossom-carousel.com/docs/examples#sticky)
- [Coverflow](https://www.blossom-carousel.com/docs/examples#cover-flow)
