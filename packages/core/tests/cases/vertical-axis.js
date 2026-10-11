import { alignment, assert, Blossom, frame, mount, move, press, settle } from '../helpers.js'

// A scroller that scrolls only vertically snaps along y: navigation, drag, rubber band and
// snap suppression all follow the axis, and a stylesheet change flips it back to x live.
const VERTICAL = 'flex-direction:column;height:260px;overflow:hidden auto;scroll-snap-type:y mandatory'

// Distance from the nearest slide's top edge to the scrollport's top edge
const alignmentY = (el) => {
	const top = el.getBoundingClientRect().top + el.clientTop
	return [...el.children].map((c) => Math.round(c.getBoundingClientRect().top - top)).reduce((a, b) => (Math.abs(b) < Math.abs(a) ? b : a))
}

export default async () => {
	const el = mount(6, VERTICAL, 'flex:0 0 120px')
	const carousel = Blossom(el, {})
	carousel.init()
	await frame()

	carousel.next()
	await frame()
	const snapWhileTicking = getComputedStyle(el).scrollSnapType
	await settle(el)
	assert(
		el.scrollTop > 0 && el.scrollLeft === 0 && alignmentY(el) === 0,
		'vertical: next() steps along y onto a slide',
		`top ${el.scrollTop}, left ${el.scrollLeft}, aligned at ${alignmentY(el)}px`,
	)
	assert(
		snapWhileTicking === 'none' && getComputedStyle(el).scrollSnapType === 'y mandatory',
		'vertical: physics suppresses native snap while moving, authored y snap applies at rest',
		`moving "${snapWhileTicking}", at rest "${getComputedStyle(el).scrollSnapType}"`,
	)

	// Drag up by more than half a slide: lands on a later slide, aligned
	const from = el.scrollTop
	press(el, 100, 200)
	for (let i = 1; i <= 10; i++) {
		move(100, 'pointermove', 200 - i * 10)
		await frame(1)
	}
	move(100, 'pointerup', 100)
	await settle(el)
	assert(
		el.scrollTop > from && alignmentY(el) === 0,
		'vertical: drag snaps along y',
		`top ${from} -> ${el.scrollTop}, aligned at ${alignmentY(el)}px`,
	)

	// Drag down past the top edge: bands along y and reports the overscroll as `top`
	el.scrollTo({ top: 0, behavior: 'instant' })
	await settle(el)
	const overscroll = new Set()
	el.addEventListener('overscroll', (e) => {
		for (const key of Object.keys(e.detail)) overscroll.add(key)
	})
	press(el, 100, 50)
	for (let i = 1; i <= 10; i++) {
		move(100, 'pointermove', 50 + i * 15)
		await frame(1)
	}
	const band = el.style.translate
	move(100, 'pointerup', 200)
	await settle(el)
	assert(
		/^0px \d/.test(band) && [...overscroll].join() === 'top' && el.style.translate === '',
		'vertical: rubber band translates along y and reports overscroll as top',
		`translate "${band}", overscroll keys [${[...overscroll]}], after release "${el.style.translate}"`,
	)

	// The same carousel restyled horizontal (a breakpoint flip) re-picks the axis on resize
	el.style.cssText = ''
	for (const slide of el.children) slide.style.cssText = ''
	await frame()
	carousel.next()
	await settle(el)
	assert(
		el.scrollLeft > 0 && el.scrollTop === 0 && alignment(el) === 0,
		'axis follows the authored overflow live (vertical -> horizontal)',
		`left ${el.scrollLeft}, top ${el.scrollTop}, aligned at ${alignment(el)}px`,
	)

	carousel.destroy()
	el.remove()
}
