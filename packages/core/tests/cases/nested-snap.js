import { assert, Blossom, frame, mount, richSlide, settle, stage } from '../helpers.js'

// Nested snap elements under a non-snapping sibling are found, re-resolved when replaced,
// and the index stays addressable when slides are removed
export default async () => {
	const mixed = mount(1)
	// A direct child that does NOT snap, wrapping one that does. Placed second so its
	// snap point is inside the scroll range: if the walk stopped at non-snapping direct
	// children, index 1 would land on the *third* slide instead of this one.
	const wrapper = document.createElement('li')
	wrapper.style.scrollSnapAlign = 'none'
	const nested = richSlide()
	nested.style.cssText = 'height:120px;scroll-snap-align:start;background:#ded'
	wrapper.append(nested)
	mixed.append(wrapper)
	for (let i = 0; i < 3; i++) mixed.append(richSlide())

	const carousel = Blossom(mixed, {})
	carousel.init()
	await frame()
	carousel.next()
	await settle(mixed)
	// Offset within the scroll content, so it doesn't move as we scroll
	const contentOffset = (el) => el.getBoundingClientRect().left - mixed.getBoundingClientRect().left + mixed.scrollLeft
	const landedOn = [...mixed.children].findIndex((el) => Math.abs(contentOffset(el) - mixed.scrollLeft) < 5)
	assert(landedOn === 1, 'nested snap element under a non-snapping sibling is reachable', `next() landed on child ${landedOn}, expected 1`)

	// Replacing that nested element must invalidate the cache (childList MO can't see it)
	const replacement = nested.cloneNode(true)
	wrapper.replaceChild(replacement, nested)
	stage().style.width = '400px'
	await frame()
	carousel.next()
	await settle(mixed)
	assert(!!replacement.isConnected && mixed.contains(replacement), 'replaced nested slide is re-resolved, not left detached')

	while (mixed.children.length > 2) mixed.lastElementChild.remove()
	await frame()
	const indexAfterShrink = carousel.currentIndex()
	carousel.prev()
	await settle(mixed)
	assert(indexAfterShrink <= 1, 'index is clamped when slides are removed', `index ${indexAfterShrink}`)
	assert(carousel.currentIndex() <= 1, 'prev() still works after the list shrinks', `index ${carousel.currentIndex()}`)
	carousel.destroy()
}
