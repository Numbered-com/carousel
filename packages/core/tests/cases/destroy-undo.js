import { assert, Blossom, frame, mount } from '../helpers.js'

// destroy() undoes everything it wrote to the DOM
export default async () => {
	const el = mount(6, 'scroll-snap-type:x proximity')
	const carousel = Blossom(el, { repeat: true })
	carousel.init()
	await frame()
	carousel.next()
	await frame(24)
	carousel.destroy()
	assert(
		[...el.children].every((c) => !c.style.translate),
		'destroy() in repeat mode clears slide translations',
	)
	assert(el.style.scrollSnapType === 'x', 'destroy() restores the authored inline scroll-snap-type', `got "${el.style.scrollSnapType}"`)
}
