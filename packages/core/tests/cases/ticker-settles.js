import { assert, Blossom, frame, mount, settle, spy } from '../helpers.js'

// The RAF loop settles instead of running forever
export default async () => {
	const el = mount(6)
	const carousel = Blossom(el, {})
	carousel.init()
	await frame()
	const writes = spy(el, 'scrollTo')
	carousel.next()
	await settle(el)
	const settledAt = writes.calls
	await frame(48)
	assert(writes.calls === settledAt, 'ticker stops after motion settles', `${writes.calls - settledAt} extra frames after settling`)
	writes.stop()
	carousel.destroy()
}
