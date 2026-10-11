# Blossom Carousel

A native-scroll-first carousel enhanced with drag support for Web.

## Installation

`npm install @numbered/carousel-web @numbered/carousel`

```javascript
import { BlossomCarousel } from "@numbered/carousel-web";
import "@numbered/carousel/style.css";
```

#### CDN

```html
<script src="https://unpkg.com/@numbered/carousel-web/dist/blossom-carousel-web.umd.cjs"></script>
<link rel="stylesheet" href="https://unpkg.com/@numbered/carousel/dist/carousel.css" />
```

## Usage

```html
<blossom-carousel>
  <div>Slide 1</div>
  <div>Slide 2</div>
  <div>Slide 3</div>
  ...
</blossom-carousel>
```

The element dispatches a `change` event (`event.detail.index`) when the active snap point changes:

```javascript
document.querySelector("blossom-carousel").addEventListener("change", (e) => {
  if (e.target === e.currentTarget) console.log(e.detail.index);
});
```

The web component doesn't support `repeat` and exposes no navigation methods. Vertical carousels work through CSS: see the [core docs](https://www.npmjs.com/package/@numbered/carousel#vertical-carousels).

## Examples

- [Simple](https://www.blossom-carousel.com/docs/examples#simple)
- [Variable widths](https://www.blossom-carousel.com/docs/examples#variable-widths)
- [CSS Grid](https://www.blossom-carousel.com/docs/examples#css-grid)
- [Multiple rows](https://www.blossom-carousel.com/docs/examples#multiple-rows)
- [Snapping](https://www.blossom-carousel.com/docs/examples#snapping)
- [Grouping](https://www.blossom-carousel.com/docs/examples#grouping)
- [Sticky](https://www.blossom-carousel.com/docs/examples#sticky)
- [Coverflow](https://www.blossom-carousel.com/docs/examples#cover-flow)
