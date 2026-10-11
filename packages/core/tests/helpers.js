// Shared by every case in ./cases. Each case runs in its own iframe (see case.html), so
// patching globals (rAF, getComputedStyle, Element.prototype) stays local to that case.
export { Blossom } from '/src/carousel.ts'

export const results = []
export const assert = (ok, label, detail = '') => results.push({ ok: !!ok, label, detail })

export const wait = (ms) => new Promise((r) => setTimeout(r, ms))
// Waits n rendering updates. Cases share one main thread (same-origin iframes), so fixed
// sleeps drift with load while frame counts don't. The default 3 covers a ResizeObserver
// delivery (after rAF callbacks) plus the frame sync() schedules in response.
export const frame = async (n = 3) => {
	for (let i = 0; i < n; i++) await new Promise(requestAnimationFrame)
}

// Resolves once `el` has seen no scroll writes or movement for 10 frames: physics settles in
// ~0.5–1.5s, and a fixed sleep has to budget for the slowest case every time. scrollLeft
// alone isn't enough: it rounds, so the ticker keeps writing after it stops changing.
export const settle = async (el, timeout = 3000) => {
	const writes = spy(el, 'scrollTo')
	const end = performance.now() + timeout
	let last = [el.scrollLeft, 0]
	let still = 0
	while (still < 10 && performance.now() < end) {
		await frame(1)
		still = el.scrollLeft === last[0] && writes.calls === last[1] ? still + 1 : 0
		last = [el.scrollLeft, writes.calls]
	}
	writes.stop()
}

export const stage = () => document.getElementById('stage')

// Rich subtree content, which is what made the old recursive snap-candidate walk expensive
export const richSlide = () => {
	const li = document.createElement('li')
	li.innerHTML = '<div><p><span><b>x</b></span></p><p><span>y</span></p><p><span>z</span></p></div>'
	return li
}

export const mount = (count, css = '', slideCss = '') => {
	const el = document.createElement('ul')
	el.className = 'carousel'
	el.style.cssText = css
	stage().append(el)
	for (let i = 0; i < count; i++) {
		const slide = richSlide()
		slide.style.cssText = slideCss
		el.append(slide)
	}
	return el
}

// Distance from the nearest slide's left edge to the scrollport's left edge
export const alignment = (el) => {
	const left = el.getBoundingClientRect().left + el.clientLeft
	return [...el.children].map((c) => Math.round(c.getBoundingClientRect().left - left)).reduce((a, b) => (Math.abs(b) < Math.abs(a) ? b : a))
}

const pointer = (x, y) => ({ bubbles: true, clientX: x, clientY: y, button: 0, pointerType: 'mouse' })
export const press = (el, x, y = 30) => el.firstElementChild.dispatchEvent(new PointerEvent('pointerdown', pointer(x, y)))
export const move = (x, type = 'pointermove', y = 30) => window.dispatchEvent(new PointerEvent(type, pointer(x, y)))

// Counts calls to `obj[method]` until the returned stop() restores it
export const spy = (obj, method) => {
	const original = obj[method]
	const counter = { calls: 0, stop: () => (obj[method] = original) }
	obj[method] = function (...args) {
		counter.calls++
		return original.apply(this, args)
	}
	return counter
}
