import { assert, Blossom, frame, mount, move, press, settle, spy } from '../helpers.js'

// A stationary press after a drag doesn't start the ticker, whichever axis dominated
export default async () => {
	for (const [label, dx, dy] of [['horizontal', 10, 1], ['vertical', 1, 10]]) {
		const el = mount(6, 'overflow-y:auto;height:60px')
		const carousel = Blossom(el, {})
		carousel.init()
		await frame()
		// Drag along the dominant axis while drifting slightly on the other one
		press(el, 300, 40)
		for (let i = 1; i <= 10; i++) {
			move(300 - i * dx, 'pointermove', 40 - i * dy)
			await frame(1)
		}
		move(300 - 10 * dx, 'pointerup', 40 - 10 * dy)
		await settle(el)

		const writes = spy(el, 'scrollTo')
		press(el, 200)
		await frame(18)
		move(200, 'pointerup')
		assert(writes.calls === 0, `stationary press after a ${label}-dominant drag stays idle`, `${writes.calls} scroll writes while held`)
		writes.stop()
		carousel.destroy()
		el.remove()
	}
}
