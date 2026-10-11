import { assert, Blossom, mount, spy } from '../helpers.js'

// A library wrapping our scrollIntoView patch survives destroy() and re-init
export default async () => {
	const native = spy(Element.prototype, 'scrollIntoView')
	const el = mount(3)
	const carousel = Blossom(el, {})
	carousel.init()
	const ours = Element.prototype.scrollIntoView
	Element.prototype.scrollIntoView = function (...args) {
		return ours.apply(this, args) // external library wrapping Blossom's patch
	}
	carousel.destroy()
	el.firstElementChild.scrollIntoView({ block: 'nearest' })
	assert(native.calls === 1, 'a retained external wrapper still reaches native scrollIntoView after destroy()', `${native.calls} native calls`)

	carousel.init()
	let threw = null
	try {
		el.firstElementChild.scrollIntoView({ block: 'nearest' })
	} catch (e) {
		threw = e
	}
	assert(!threw && native.calls === 2, 're-init over an external wrapper neither recurses nor drops the native call', threw ? String(threw) : `${native.calls} native calls`)
	carousel.destroy()
	native.stop()
}
