# Blossom Carousel

A native-scroll-first carousel enhanced with drag support for React.

## Installation

`npm install @numbered/carousel-react @numbered/carousel`

#### React

```jsx
import { BlossomCarousel } from "@numbered/carousel-react";
import "@numbered/carousel/style.css";

function App() {
  return <BlossomCarousel>{/* slides */}</BlossomCarousel>;
}
```

#### Next.js

Add the import to your page or component:

```jsx
import { BlossomCarousel } from "@numbered/carousel-react";
import "@numbered/carousel/style.css";

export default function Page() {
  return <BlossomCarousel>{/* slides */}</BlossomCarousel>;
}
```

## Usage

```jsx
<BlossomCarousel>
  {Array.from({ length: 12 }, (_, i) => (
    <div>{i}</div>
  ))}
</BlossomCarousel>
```

### as

Define the HTMLElement of the carousel root.

```jsx
<BlossomCarousel as="ul">
  {Array.from({ length: 12 }, (_, i) => (
    <div>{i}</div>
  ))}
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

```jsx
<BlossomCarousel repeat>{/* slides */}</BlossomCarousel>
```

### load

By default the engine only loads on devices with a fine pointer (mouse, trackpad); touch devices keep native scrolling and load nothing. `load="always"` loads it everywhere.

```jsx
<BlossomCarousel load="always">{/* slides */}</BlossomCarousel>
```

### onChange

Called when the active snap point changes.

```jsx
<BlossomCarousel onChange={(e) => console.log(e.detail.index)}>{/* slides */}</BlossomCarousel>
```

### ref

Navigation methods. Positions follow each slide's `scroll-snap-align`, `scroll-margin` and the carousel's `scroll-padding`.

```tsx
import { type BlossomCarouselRef, BlossomCarousel } from "@numbered/carousel-react";

const carousel = useRef<BlossomCarouselRef>(null);

<BlossomCarousel ref={carousel}>{/* slides */}</BlossomCarousel>
<button onClick={() => carousel.current?.prev()}>Previous</button>
<button onClick={() => carousel.current?.next()}>Next</button>
// carousel.current?.currentIndex()
```

The engine isn't loaded on touch devices unless `load="always"`, so the methods do nothing there.

### elementRef

Ref to the rendered carousel element.

```tsx
const element = useRef<HTMLElement>(null);

<BlossomCarousel elementRef={element}>{/* slides */}</BlossomCarousel>
```

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
