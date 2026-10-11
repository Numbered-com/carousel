<script setup>
import { onBeforeUnmount, ref } from "vue";
import BlossomCarousel from "./BlossomCarousel.vue";
import "../../core/src/style.css";

// Same breakpoint as the stylesheet below: the engine reads the axis from the overflow
const desktop = window.matchMedia("(min-width: 1024px)");
const vertical = ref(desktop.matches);
const onBreakpoint = (e) => (vertical.value = e.matches);
desktop.addEventListener("change", onBreakpoint);
onBeforeUnmount(() => desktop.removeEventListener("change", onBreakpoint));

const blossom = ref(null);
const index = ref(0);
const onChange = (e) => {
  if (e.target === e.currentTarget) index.value = e.detail.index;
};
</script>

<template>
  <div class="page">
    <h1>Blossom Dev: vertical</h1>
    <p>
      Axis: {{ vertical ? "vertical" : "horizontal" }} (resize across 1024px to switch)
      · Slide {{ index + 1 }}
    </p>
    <BlossomCarousel ref="blossom" class="axis-carousel" as="ul" load="always" @change="onChange">
      <li v-for="i in 10" :key="i" class="axis-slide">
        <p>{{ i }}</p>
      </li>
    </BlossomCarousel>
    <div class="controls">
      <button @click="blossom?.prev()">prev slide</button>
      <button @click="blossom?.next()">next slide</button>
    </div>
  </div>
</template>

<style>
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 1rem;
  box-sizing: border-box;
}

/* `ul.` outranks the core's [blossom-carousel] rules, which aren't in a cascade layer */
ul.axis-carousel {
  display: flex;
  gap: 1rem;
  margin: 0;
  padding: 0;
  inline-size: 100%;
  overflow-x: auto;
  overflow-y: clip;
  scroll-snap-type: x mandatory;
}

.axis-slide {
  flex: 0 0 240px;
  aspect-ratio: 3 / 4;
  scroll-snap-align: start;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 1rem;
  background-color: #404040;
}

/* From lg, the same DOM scrolls vertically: only y overflows, so Blossom snaps along y */
@media (min-width: 1024px) {
  ul.axis-carousel {
    flex-direction: column;
    inline-size: 240px;
    block-size: 70vh;
    overflow-x: clip;
    overflow-y: auto;
    scroll-snap-type: y mandatory;
  }

  .axis-slide {
    flex: 0 0 auto;
  }
}
</style>
