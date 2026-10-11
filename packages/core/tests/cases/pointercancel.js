import { alignment, assert, Blossom, frame, mount, move, press, settle } from '../helpers.js'

// pointercancel ends a drag like pointerup
export default async () => {
	const el = mount(6)
	const carousel = Blossom(el, {})
	carousel.init()
	await frame()
	press(el, 300)
	for (let i = 1; i <= 8; i++) {
		move(300 - i * 10)
		await frame(1)
	}
	move(220, 'pointercancel')
	await settle(el)
	const dragging = el.classList.contains('blossom-dragging')
	assert(!dragging && alignment(el) === 0, 'pointercancel ends the drag and snaps', `dragging class ${dragging}, aligned at ${alignment(el)}px`)
	move(220, 'pointerup')
	carousel.destroy()
}
