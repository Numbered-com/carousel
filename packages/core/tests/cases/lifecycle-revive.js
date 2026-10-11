import { assert, Blossom, frame, mount, settle } from '../helpers.js'

// destroy() then init() fully revives the instance; double init() strands nothing
export default async () => {
	const el = mount(5)
	const carousel = Blossom(el, {})
	carousel.init()
	await frame()
	carousel.next()
	await frame(12)
	carousel.destroy() // mid-animation, while isTicking is true
	carousel.init()
	await frame()
	const before = carousel.currentIndex()
	carousel.next()
	await settle(el)
	assert(carousel.currentIndex() !== before, 'next() still animates after destroy() mid-tick then init()', `${before} -> ${carousel.currentIndex()}`)

	carousel.init()
	carousel.init()
	await frame()
	carousel.destroy()
	assert(!Object.hasOwn(el, 'scrollTo'), 'double init() then one destroy() leaves no override behind')
}
