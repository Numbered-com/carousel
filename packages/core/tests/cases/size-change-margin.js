import { alignment, assert, Blossom, frame, mount, settle } from '../helpers.js'

// A size change re-reads scroll-margin (height media queries change it too)
export default async () => {
	const el = mount(6, 'height:130px', 'scroll-snap-align:start;scroll-margin-left:30px')
	const carousel = Blossom(el, {})
	carousel.init()
	await frame()
	el.style.height = '150px'
	for (const slide of el.children) slide.style.scrollMarginLeft = '60px'
	await frame()
	carousel.next()
	await settle(el)
	assert(alignment(el) === 60, 'height change picks up a new scroll-margin', `aligned at ${alignment(el)}px, expected 60`)
	carousel.destroy()
}
