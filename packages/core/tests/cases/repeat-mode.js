import { assert, Blossom, frame, mount, stage } from '../helpers.js'

// Repeat mode wraps around, and translations survive a resize
export default async () => {
	const el = mount(6)
	const carousel = Blossom(el, { repeat: true })
	carousel.init()
	await frame()

	// Deliberately mid-motion: each next() interrupts the previous animation
	for (let i = 0; i < 8; i++) {
		carousel.next()
		await frame(24)
	}
	const translated = [...el.children].filter((c) => c.style.translate).length
	assert(translated > 0, 'repeat mode translates slides', `${translated}/${el.children.length} translated`)
	assert(carousel.currentIndex() < el.children.length, 'repeat mode wraps the index instead of running off the end', `index ${carousel.currentIndex()}`)

	stage().style.width = '500px'
	await frame()
	assert(
		[...el.children].every((c) => !Number.isNaN(Number.parseFloat(c.style.translate || '0'))),
		'repeat translations stay numeric across a resize',
	)
	carousel.destroy()
}
