import { assert, Blossom, frame, mount, richSlide, settle } from '../helpers.js'

// Snap points resolve on direct children, and via fallback on grandchildren
export default async () => {
	const flat = mount(6)
	const carousel = Blossom(flat, {})
	carousel.init()

	// Deep case: snap lives on grandchildren, not direct children
	const deep = mount(0)
	for (let i = 0; i < 6; i++) {
		const wrapper = document.createElement('li')
		wrapper.style.cssText = 'scroll-snap-align:none;background:none'
		const inner = richSlide()
		inner.style.cssText = 'height:120px;scroll-snap-align:start;background:#edd'
		wrapper.append(inner)
		deep.append(wrapper)
	}
	const deepCarousel = Blossom(deep, {})
	deepCarousel.init()
	await frame()

	carousel.next()
	deepCarousel.next()
	await Promise.all([settle(flat), settle(deep)])
	assert(carousel.currentIndex() > 0, 'next() advances on direct-child slides', `index ${carousel.currentIndex()}`)
	assert(deepCarousel.currentIndex() > 0, 'deep fallback finds snap-aligned grandchildren', `index ${deepCarousel.currentIndex()}`)
	carousel.destroy()
	deepCarousel.destroy()
}
