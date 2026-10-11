import { assert, Blossom, frame, mount, spy, stage } from '../helpers.js'

// Resize handling only recomputes when carousel metrics actually change
export default async () => {
	const carousel = Blossom(mount(6), {})
	carousel.init()
	await frame()
	const gcs = spy(window, 'getComputedStyle')

	stage().style.paddingBottom = '80px'
	await frame()
	assert(gcs.calls < 10, 'unrelated layout change stays under 10 getComputedStyle calls', `got ${gcs.calls}`)

	gcs.calls = 0
	stage().style.width = '400px'
	await frame()
	assert(gcs.calls > 0, 'a real width change does recompute snap points', `got ${gcs.calls}`)
	gcs.stop()
	carousel.destroy()
}
