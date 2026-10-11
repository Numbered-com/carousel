import { assert, Blossom, frame, mount } from '../helpers.js'

// destroy() restores the globals it patched, but only once the last instance is gone
export default async () => {
	const first = Blossom(mount(6), {})
	const secondEl = mount(6)
	const second = Blossom(secondEl, {})
	first.init()
	second.init()
	await frame()

	const patched = Element.prototype.scrollIntoView
	first.destroy()
	assert(Element.prototype.scrollIntoView === patched, 'scrollIntoView stays patched while another instance lives')
	second.destroy()
	assert(
		Element.prototype.scrollIntoView !== patched && !Object.hasOwn(secondEl, 'scrollTo'),
		'last destroy() restores scrollIntoView and the scrollTo override',
	)
}
