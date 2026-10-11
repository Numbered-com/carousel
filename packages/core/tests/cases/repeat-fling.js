import { assert, Blossom, frame, mount, move, press } from '../helpers.js'

// A fast repeat drag keeps going forward instead of reversing on release
export default async () => {
	const el = mount(5, '', 'flex:0 0 200px;scroll-snap-align:end')
	el.classList.add('repeat-fixture')
	const carousel = Blossom(el, { repeat: true })
	carousel.init()
	await frame()
	const style = getComputedStyle(el)
	const loop = el.scrollWidth - Number.parseFloat(style.paddingLeft) - Number.parseFloat(style.paddingRight)
	press(el, 360)
	for (let i = 1; i <= 5; i++) {
		move(360 - i * 60)
		await frame(1)
	}
	let previous = el.scrollLeft
	let travel = 0
	let reversed = 0
	move(60, 'pointerup')
	for (let i = 0; i < 90; i++) {
		await frame(1)
		let d = el.scrollLeft - previous
		if (Math.abs(d) > loop / 2) d -= Math.sign(d) * loop // unwrap loop jumps
		if (d < -0.5) reversed++
		travel += d
		previous = el.scrollLeft
	}
	assert(travel > 0 && reversed === 0, 'fast repeat drag continues forward after release', `travel ${Math.round(travel)}px, ${reversed} backward frames`)
	carousel.destroy()
}
