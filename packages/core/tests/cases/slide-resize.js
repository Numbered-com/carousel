import { alignment, assert, Blossom, frame, mount, settle } from '../helpers.js'

// A slide resizing on its own (e.g. a lazy image) re-measures snap points
export default async () => {
	const el = mount(6)
	const carousel = Blossom(el, {})
	carousel.init()
	await frame()
	el.firstElementChild.style.flex = '0 0 300px'
	await frame()
	carousel.next()
	await settle(el)
	assert(el.scrollLeft > 0 && alignment(el) === 0, 'slide resize re-measures snap points', `scrollLeft ${el.scrollLeft}, aligned at ${alignment(el)}px`)
	carousel.destroy()
}
