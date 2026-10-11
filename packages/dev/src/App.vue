<script setup>
import { computed, ref, watch } from "vue";
import BlossomCarousel from "./BlossomCarousel.vue";
import "../../core/src/style.css";

const blossom = ref(null);
const currentSlideIndex = ref(0);
const repeat = ref(false);
const coverflow = ref(false);
const group = ref(window.matchMedia("(max-width: 767px)").matches ? 1 : 2);
const snapEvery = computed(() => Math.max(1, Math.floor(group.value) || 1));
// Changing either remounts the carousel (see :key), which starts at snap 0 without a change event
const carouselKey = computed(() => `repeat${repeat.value}-group${snapEvery.value}`);
watch(carouselKey, () => (currentSlideIndex.value = 0));

function add() {
  const slide = document.createElement("li");
  const count = blossom.value?.el?.querySelectorAll(".slide").length ?? 0;
  slide.className = count % snapEvery.value ? "slide" : "slide snap";
  slide.innerHTML = `<p>${Math.floor(Math.random() * 100)}</p>`;
  blossom.value?.el?.appendChild(slide);
}

function remove() {
  const slides = blossom.value?.el?.querySelectorAll(".slide");
  if (slides.length > 0) {
    blossom.value?.el?.removeChild(slides[slides.length - 1]);
  }
}

const prev = () => {
  blossom.value?.prev();
};

const next = () => {
  blossom.value?.next();
};

const handleChange = ({detail}) => {
	const index = detail.index;
	currentSlideIndex.value = index;
};
</script>

<template>
  <div class="page">
    <h1>Blossom Dev</h1>
    <p>Current Slide: {{ currentSlideIndex + 1 }}</p>
    <div class="wrapper">
			<BlossomCarousel ref="blossom" :key="carouselKey" :class="['blossom', { coverflow }]" as="ul" :repeat="repeat" @change="handleChange">
				<li v-for="i in 8" ref="slides" :key="`slide${i}`" :class="['slide', { snap: (i - 1) % snapEvery === 0 }]">
					<a href="https://www.google.com" target="_blank">
						<p>{{ i }}</p>
					</a>
				</li>
			</BlossomCarousel>
      <!-- <BlossomCarousel ref="blossom" class="blossom" as="ul" :on-index-change="handleIndexChange" repeat>
        <li v-for="i in 12" ref="slides" :key="`slide${i}`" class="slide">
					<a href="https://www.google.com" target="_blank">
          	<p>{{ i }}</p>
					</a>
        </li>
      </BlossomCarousel> -->
    </div>
    <div class="controls">
      <button @click="add">add slide</button>
      <button @click="remove">remove slide</button>
    </div>
    <div class="controls">
      <button @click="prev">prev slide</button>
      <button @click="next">next slide</button>
      <button @click="repeat = !repeat">loop: {{ repeat ? "on" : "off" }}</button>
      <button @click="coverflow = !coverflow">coverflow: {{ coverflow ? "on" : "off" }}</button>
      <label>group <input v-model.number="group" type="number" min="1" style="width: 3rem" /></label>
    </div>
  </div>
</template>

<style>
.page {
  height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

.wrapper {
  /* max-width: 1000px; */
	overflow: clip;
}

.blossom {
  /* padding-inline: 1rem; */
  /* scroll-padding-inline: 1rem; */

	/* scroll-padding-inline: 50% !important;
  padding-inline: 50% !important; */

	/* scroll-padding-inline: 20% !important; */
  padding-inline: 50% !important;

  scroll-snap-type: x mandatory;
  scroll-snap-stop: always;
	padding-inline: 0;

	/* padding-inline: 3rem; */

	display: flex;
	gap: 1rem;
}

.slide {
	flex-shrink: 0;
  width: 300px;
  aspect-ratio: 3/4;
  background-color: #404040;
  border-radius: 1rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;

	&.snap {
		scroll-snap-align: center;
		background-color: #606060;
	}

	a {
		width: 100%;
		height: 100%;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}
}

.coverflow {
  perspective: 1000px;

	.slide {
		animation: coverflow linear both;
		animation-timeline: view(x);
		/* repeat mode translates slides, which view() ignores: shift the range to match */
		animation-range: cover calc(0% + var(--blossom-offset, 0px)) cover calc(100% + var(--blossom-offset, 0px));
	}
}

@keyframes coverflow {
  0% {
    transform: rotateY(-70deg) translateZ(-100px) scale(0.8);
  }
  50% {
    transform: none;
  }
  to {
    transform: rotateY(70deg) translateZ(-100px) scale(0.8);
  }
}
</style>
