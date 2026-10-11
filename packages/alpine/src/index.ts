import { Blossom, type CarouselOptions } from '@numbered/carousel'
import type { Alpine } from 'alpinejs'

export default function blossomCarousel(Alpine: Alpine) {
	Alpine.data('carousel', (options: CarouselOptions & { load?: 'always' } = {}) => ({
		blossom: null as ReturnType<typeof Blossom> | null,
		currentIndex: 0,

		init() {
			// Find the carousel element (first child with class 'carousel')
			const carouselEl = this.$refs.carousel || this.$el

			// Set the blossom-carousel attribute
			carouselEl.setAttribute('blossom-carousel', 'true')

			// Check if should load based on media query
			const hasMouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches

			// Don't load if the user has no mouse (unless load: 'always')
			if (!hasMouse && options.load !== 'always') {
				return
			}

			this.blossom = Blossom(carouselEl, options)
			this.blossom.init()

			// Listen for change events
			carouselEl.addEventListener('change', (e: Event) => {
				// Native `change` from inputs inside slides, and nested carousels' events, bubble here too
				if (e.target !== carouselEl || !(e instanceof CustomEvent)) return
				this.currentIndex = e.detail.index
			})
		},

		destroy() {
			this.blossom?.destroy()
		},

		next() {
			this.blossom?.next()
		},

		prev() {
			this.blossom?.prev()
		},
	}))
}
