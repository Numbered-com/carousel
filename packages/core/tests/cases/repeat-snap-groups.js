import { assert, Blossom, frame, mount, settle } from '../helpers.js'

// Repeat mode with sparse snap points (only every third slide snaps): each slide wraps on
// its own, so the non-snapping slides of a group never leave a hole beside a wrapped one.
export default async () => {
	const el = mount(8, 'width:800px;gap:10px', 'flex-basis:100px')
	el.classList.add('repeat-fixture')
	;[...el.children].forEach((c, i) => i % 3 && (c.style.scrollSnapAlign = 'none'))
	const carousel = Blossom(el, { repeat: true })
	carousel.init()
	await frame()

	// Widest gap between visible slides (or a scrollport edge), so a missing slide shows as ~110px
	const hole = () => {
		const port = el.getBoundingClientRect()
		const boxes = [...el.children]
			.map((c) => c.getBoundingClientRect())
			.filter((r) => r.right > port.left && r.left < port.right)
			.sort((a, b) => a.left - b.left)
		const edges = [port.left, ...boxes.flatMap((r) => [r.left, r.right]), port.right]
		let widest = 0
		for (let i = 0; i < edges.length; i += 2) widest = Math.max(widest, edges[i + 1] - edges[i])
		return Math.round(widest)
	}

	const holes = [hole()]
	for (const step of ['next', 'next', 'next', 'next', 'prev', 'prev', 'prev', 'prev', 'prev']) {
		carousel[step]()
		await settle(el)
		holes.push(hole())
	}
	assert(holes.every((h) => h <= 10), 'repeat (snap groups): slides stay contiguous through wraps', `widest holes ${holes.join(',')}`)
	carousel.destroy()
	el.remove()
}
