# Blossom Carousel

A native-scroll-first carousel enhanced with drag support for React.

## Installation

`npm install @numbered/carousel/react`

#### React

```jsx
import { BlossomCarousel } from "@numbered/carousel/react";
import "@numbered/carousel/core/style.css";

function App() {
  return <BlossomCarousel>{/* slides */}</BlossomCarousel>;
}
```

#### Next.js

Add the import to your page or component:

```jsx
import { BlossomCarousel } from "@numbered/carousel/react";
import "@numbered/carousel/core/style.css";

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

## Examples

- [Simple](https://www.blossom-carousel.com/docs/examples#simple)
- [Variable widths](https://www.blossom-carousel.com/docs/examples#variable-widths)
- [CSS Grid](https://www.blossom-carousel.com/docs/examples#css-grid)
- [Multiple rows](https://www.blossom-carousel.com/docs/examples#multiple-rows)
- [Snapping](https://www.blossom-carousel.com/docs/examples#snapping)
- [Grouping](https://www.blossom-carousel.com/docs/examples#grouping)
- [Sticky](https://www.blossom-carousel.com/docs/examples#sticky)
- [Coverflow](https://www.blossom-carousel.com/docs/examples#cover-flow)
