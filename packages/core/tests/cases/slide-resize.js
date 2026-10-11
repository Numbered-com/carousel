import { alignment, assert, Blossom, frame, mount, settle } from '../helpers.js'

// A slide resizing on its own (e.g. a lazy image) re-measures snap points, including when
// another slide shrinks by the same amount and the scroller's total size doesn't change
export default async () => {
	for (const [label, sizes] of [
		['one slide grows', ['0 0 300px']],
		['balanced grow/shrink', ['0 0 300px', '0 0 100px']],
	]) {
		const el = mount(6)
		const carousel = Blossom(el, {})
		carousel.init()
		await frame()
		sizes.forEach((flex, i) => (el.children[i].style.flex = flex))
		await frame()
		carousel.next()
		await settle(el)
		assert(el.scrollLeft > 0 && alignment(el) === 0, `slide resize re-measures snap points (${label})`, `scrollLeft ${el.scrollLeft}, aligned at ${alignment(el)}px`)
		carousel.destroy()
		el.remove()
	}
}
