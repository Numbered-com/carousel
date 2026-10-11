import { assert, Blossom, frame, mount, settle } from '../helpers.js'

// Snap areas include asymmetric scroll-margin, as native snapping does
export default async () => {
	for (const [align, margin, expected] of [
		['start', 'scroll-margin-left:30px;scroll-margin-right:5px', (r, box) => r.left - 30 - box.left],
		['end', 'scroll-margin-left:5px;scroll-margin-right:30px', (r, box) => r.right + 30 - box.right],
	]) {
		const el = mount(6, '', `scroll-snap-align:${align};${margin}`)
		const carousel = Blossom(el, {})
		carousel.init()
		await frame()
		carousel.next()
		await settle(el)
		// Snap indices skip clamped duplicates, so look for whichever slide is aligned
		const box = el.getBoundingClientRect()
		const off = [...el.children]
			.map((c) => Math.round(expected(c.getBoundingClientRect(), box)))
			.reduce((a, b) => (Math.abs(b) < Math.abs(a) ? b : a))
		assert(el.scrollLeft > 0 && Math.abs(off) <= 1, `${align}-aligned snap includes the slide's scroll-margin`, `closest snap area edge is ${off}px from the snapport edge`)
		carousel.destroy()
		el.remove()
	}
}
