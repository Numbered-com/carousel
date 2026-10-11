import { alignment, assert, Blossom, frame, mount, settle } from '../helpers.js'

// Arrow keys in an unrelated input don't stop a carousel mid-animation
export default async () => {
	const el = mount(6)
	const carousel = Blossom(el, {})
	carousel.init()
	await frame()
	const input = document.body.appendChild(document.createElement('input'))
	carousel.next()
	await frame(6)
	input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
	await settle(el)
	assert(el.scrollLeft > 0 && alignment(el) === 0, 'arrow key outside the carousel lets it finish snapping', `aligned at ${alignment(el)}px`)
	input.remove()
	carousel.destroy()
}
