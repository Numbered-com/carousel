import { assert, Blossom, frame, mount, move, press, settle } from '../helpers.js'

// Rubber banding leaves an author transform on the scroller alone
export default async () => {
	const el = mount(6, 'transform:rotate(0deg)')
	const carousel = Blossom(el, {})
	carousel.init()
	await frame()
	press(el, 100)
	for (let i = 1; i <= 10; i++) {
		move(100 + i * 15)
		await frame(1)
	}
	const banded = el.style.translate !== '' && el.style.transform === 'rotate(0deg)'
	move(250, 'pointerup')
	await settle(el)
	assert(banded && el.style.transform === 'rotate(0deg)', 'rubber banding keeps the author transform', `transform "${el.style.transform}", translate "${el.style.translate}"`)
	carousel.destroy()
}
