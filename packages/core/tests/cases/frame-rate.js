import { assert, Blossom, frame, mount, wait } from '../helpers.js'

// Snap animations move at the same speed and land on the same spot at 60Hz and 120Hz
export default async () => {
	const realRAF = window.requestAnimationFrame
	const realCAF = window.cancelAnimationFrame
	const runAt = async (step) => {
		const el = mount(6)
		const carousel = Blossom(el, {})
		carousel.init()
		await frame()
		let now = performance.now()
		let frames = 0
		let midway = null
		// Simulated clock: each frame advances exactly `step`, as fast as the loop can run
		window.requestAnimationFrame = (cb) =>
			setTimeout(() => {
				cb((now += step))
				// Settle time is dominated by time-based damping; speed shows mid-flight
				if (++frames * step >= 100 && midway === null) midway = el.scrollLeft
			}, 0)
		window.cancelAnimationFrame = clearTimeout
		carousel.next()
		let last = -1
		while (frames !== last) {
			last = frames
			await wait(50)
		}
		window.requestAnimationFrame = realRAF
		window.cancelAnimationFrame = realCAF
		const result = { midway: Math.round(midway), at: el.scrollLeft }
		carousel.destroy()
		el.remove()
		return result
	}
	const at60 = await runAt(1000 / 60)
	const at120 = await runAt(1000 / 120)
	assert(
		Math.abs(at120.midway - at60.midway) <= 8 && Math.abs(at120.at - at60.at) <= 1,
		'snap animation is frame-rate independent',
		`at 100ms: 60Hz ${at60.midway}px, 120Hz ${at120.midway}px; landed ${at60.at}px / ${at120.at}px`,
	)
}
