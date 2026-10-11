import { assert, Blossom, frame, mount } from '../helpers.js'

// Native scrolling to either edge wraps once instead of ping-ponging, and a wrap is
// seamless. The grid case gives the repeat spacer a full 300px track.
export default async () => {
	const variants = [
		['no gap', 'gap:0', 6 * 200],
		['flex gap', 'gap:20px', 6 * 220],
		['grid tracks', 'display:grid;grid-auto-flow:column;grid-auto-columns:300px;gap:20px', 6 * 320],
	]
	for (const [label, css, loopWidth] of variants) {
		const el = mount(6, css)
		el.classList.add('repeat-fixture')
		const carousel = Blossom(el, { repeat: true })
		carousel.init()
		await frame()
		const max = el.scrollWidth - el.clientWidth

		// Straddle the upper wrap threshold by 20px: visible slides must just move 20px.
		// The threshold comes from the untranslated range: translated copies extend scrollWidth.
		const translations = [...el.children].map((c) => c.style.translate)
		for (const c of el.children) c.style.translate = ''
		const range = el.scrollWidth - el.clientWidth
		translations.forEach((t, i) => (el.children[i].style.translate = t))
		const hi = Math.floor((range - loopWidth) / 2 + loopWidth)
		const offsets = () => {
			const left = el.getBoundingClientRect().left
			return [...el.children].map((c) => Math.round(c.getBoundingClientRect().left - left))
		}
		el.scrollLeft = hi - 10
		await frame()
		const before = offsets()
		el.scrollLeft = hi + 10
		await frame()
		const after = offsets()
		const torn = before.filter((x, i) => x >= 0 && x < el.clientWidth && after[i] !== x - 20)

		let events = 0
		el.addEventListener('scroll', () => events++)
		el.scrollLeft = max
		await frame(30)
		const endEvents = events
		const endPos = el.scrollLeft
		events = 0
		el.scrollLeft = 0
		await frame(30)
		assert(
			torn.length === 0 && endEvents < 5 && events < 5 && endPos < max && el.scrollLeft > 0,
			`repeat (${label}): wraps seamlessly and settles at either edge`,
			`${torn.length} slides jumped, ${endEvents}/${events} scroll events, end ${endPos}/${max}, start ${el.scrollLeft}`,
		)
		carousel.destroy()
		el.remove()
	}
}
