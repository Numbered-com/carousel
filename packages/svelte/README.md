# Blossom Svelte

A native-scroll-first carousel for Svelte.

## Installation

`npm install @numbered/carousel-svelte @numbered/carousel`

#### Svelte

```javascript
import { BlossomCarousel } from "@numbered/carousel-svelte";
import "@numbered/carousel/style.css";
```

## Usage

```html
<BlossomCarousel>
  {#each Array(12).fill(0).map((_, i) => i + 1) as num}
  <div key="{num}">{num}</div>
  {/each}
</BlossomCarousel>
```

### as

Define the HTMLElement of the carousel root.

```html
<BlossomCarousel as="ul">
  {#each Array(12).fill(0).map((_, i) => i + 1) as num}
  <li key="{num}">{num}</li>
  {/each}
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

The Svelte component doesn't expose navigation methods. The carousel element dispatches a bubbling `change` event (`event.detail.index`), which a parent element can listen to.

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
