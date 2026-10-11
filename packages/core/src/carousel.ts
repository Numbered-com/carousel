interface Point {
	x: number
	y: number
}

// Single shared Element.prototype.scrollIntoView patch, refcounted across instances,
// so destroying instances out of init order can't leave a stale wrapper installed.
const scrollIntoViewSubscribers = new Set<(target: Element) => void>()
let originalScrollIntoView: typeof Element.prototype.scrollIntoView | null = null
let patchedScrollIntoView: typeof Element.prototype.scrollIntoView | null = null

function interceptScrollIntoViewCalls(onExternalScroll: (target: Element) => void): () => void {
	scrollIntoViewSubscribers.add(onExternalScroll)

	if (!originalScrollIntoView) {
		// Each wrapper keeps its own delegate: a library that wrapped ours outlives our
		// restore, and must still reach native (not a nulled or re-pointed global).
		const delegate = (originalScrollIntoView = Element.prototype.scrollIntoView)
		patchedScrollIntoView = Element.prototype.scrollIntoView = function (arg?: boolean | ScrollIntoViewOptions): void {
			for (const subscriber of scrollIntoViewSubscribers) subscriber(this)
			delegate.call(this, arg)
		}
	}

	return () => {
		scrollIntoViewSubscribers.delete(onExternalScroll)
		if (scrollIntoViewSubscribers.size === 0 && originalScrollIntoView) {
			// Only restore if we're still the installed patch; if another library patched
			// over ours, leave theirs in place (our wrapper just delegates once we're empty).
			if (Element.prototype.scrollIntoView === patchedScrollIntoView) {
				Element.prototype.scrollIntoView = originalScrollIntoView
			}
			originalScrollIntoView = null
			patchedScrollIntoView = null
		}
	}
}

interface HasOverflow {
	x: boolean
	y: boolean
}

interface SnapCandidate {
	el: HTMLElement
	align: string
	marginLeft: number
	marginRight: number
}

export interface CarouselOptions {
	repeat?: boolean
}

interface CurrentIndex {
	value: number
}

export const Blossom = (scroller: HTMLElement, options: CarouselOptions) => {
	let snap = <boolean>true
	const pointerStart: Point = { x: 0, y: 0 }
	const target: Point = { x: 0, y: 0 }
	const velocity: Point = { x: 0, y: 0 }
	const distanceMovedSincePointerDown: Point = new Proxy(
		{ x: 0, y: 0 },
		{
			set(target, prop: keyof Point, value) {
				if (!nativeScroll) {
					const old = target[prop]
					if (old === value) return true

					target[prop] = value

					// Only movement can cross the threshold; a reset must not trip it on the
					// other axis's not-yet-reset distance from the previous drag.
					if (value > old && (target.x >= 10 || target.y >= 10)) {
						setIsTicking(true)
					}
				}

				return true
			},
		},
	)

	const hasOverflow: HasOverflow = new Proxy(
		{ x: false, y: false },
		{
			set(target, prop: keyof HasOverflow, value) {
				const old = target[prop]
				if (old === value) return true

				target[prop] = value

				// Touch-only devices scroll natively, so the drag machinery has nothing to do there.
				if ((target.x || target.y) && !nativeScroll) {
					scroller.setAttribute('has-overflow', 'true')
					// Passive: none of these handlers ever preventDefault, and non-passive
					// wheel/touch listeners block the compositor scroll thread.
					scroller.addEventListener('touchstart', onPointerDown, { passive: true })
					scroller.addEventListener('pointerdown', onPointerDown, { passive: true })
					scroller.addEventListener('wheel', onWheel, { passive: true })
				} else {
					scroller.removeAttribute('has-overflow')
					scroller.removeEventListener('touchstart', onPointerDown)
					scroller.removeEventListener('pointerdown', onPointerDown)
					scroller.removeEventListener('wheel', onWheel)
				}

				return true
			},
		},
	)

	const currentIndex: CurrentIndex = new Proxy(
		{ value: 0 },
		{
			set(target, prop: keyof CurrentIndex, value: any) {
				const old = target[prop]
				if (old === value) return true

				;(target as any)[prop] = value

				// Dispatch custom event when value changes
				if (prop === 'value') {
					const event = new CustomEvent('change', {
						bubbles: true,
						detail: { index: value },
					})
					scroller?.dispatchEvent(event)
				}

				return true
			},
		},
	)

	// Repeat period: content width plus the trailing gap the last slide would have before the first
	let loopWidth = 0
	let raf: number | null = null
	let isDragging = false
	let scrollerScrollWidth = 300
	let scrollerWidth = 300
	let scrollerScrollHeight = 300
	let scrollerHeight = 300
	const scrollPadding = { left: 0, right: 0 }
	let gap = 0
	let snapPoints: number[] = []
	let snapElements: HTMLElement[] = []
	let snapAlignments: ScrollLogicalPosition[] = []
	let snapCenters: number[] = []
	let snapCandidates: SnapCandidate[] = []
	const virtualSnapPoints: number[] = []
	let slides: HTMLElement[] = []
	const observedSlides = new Set<HTMLElement>()
	let slidesResized = false
	let resizeObserver: ResizeObserver | null = null
	let mutationObserver: MutationObserver | null = null
	// Observer callbacks are coalesced into one sync per microtask; structureDirty
	// records whether any of them implied a child-list change.
	let structureDirty = false
	let syncScheduled = false
	let initialised = false
	let candidatesResolved = false
	let deepCandidates = false
	let hasSnap = false
	let hasMouse = false
	let nativeScroll = true
	let previousInlineSnapType = ''
	let restoreScrollMethods: () => void
	let dir = 1

	function init() {
		// Re-entrant: a second init() without destroy() would otherwise strand the previous
		// observers, listeners and scrollIntoView subscriber.
		if (initialised) destroy()
		initialised = true
		installScrollOverrides()
		scroller?.setAttribute('blossom-carousel', 'true')

		window.addEventListener('keydown', onKeydown)
		scroller.addEventListener('scroll', onScroll, { passive: true })

		const { scrollSnapType } = window.getComputedStyle(scroller)
		hasSnap = scrollSnapType !== 'none'
		scroller.style.setProperty('--snap-type', scrollSnapType)
		scroller.setAttribute('has-repeat', options?.repeat ? 'true' : 'false')

		hasMouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches

		nativeScroll = !hasMouse && !options?.repeat
		previousInlineSnapType = scroller.style.scrollSnapType
		if (!nativeScroll) {
			scroller.style.scrollSnapType = 'none'
		}

		restoreScrollMethods = interceptScrollIntoViewCalls((target) => {
			if (target === scroller || scroller.contains(target)) setIsTicking(false)
		})

		resizeObserver = new ResizeObserver((entries) => {
			// A slide's own resize can move snap points without changing the scroller's
			// aggregate size (one grows, another shrinks), so it must defeat sync()'s size bail
			if (entries.some((entry) => observedSlides.has(entry.target as HTMLElement))) slidesResized = true
			scheduleSync(false)
		})
		// If scroller width matches parent width, observe parent for resize events
		// (ResizeObserver may not fire on elements sized by their containers)
		const parent = scroller.parentElement
		if (parent && scroller.clientWidth === parent.clientWidth) {
			resizeObserver.observe(parent)
		} else {
			resizeObserver.observe(scroller)
		}
		// Slides are observed too (see sync): one resizing on its own, e.g. a lazy image,
		// changes snap positions without resizing the scroller or its parent.

		mutationObserver = new MutationObserver(() => {
			scheduleSync(true)
		})
		mutationObserver.observe(scroller, {
			attributes: false,
			childList: true,
			subtree: false,
		})
	}

	function destroy() {
		scroller.removeAttribute('blossom-carousel')
		resizeObserver?.disconnect()
		observedSlides.clear()
		mutationObserver?.disconnect()
		if (raf) cancelAnimationFrame(raf)
		raf = null
		// Reset, or a later setIsTicking(true) sees a stale `true` and never restarts the loop
		isTicking = false
		// A pending sync can't be cancelled, so make it a no-op instead
		structureDirty = false
		candidatesResolved = false
		initialised = false

		velocity.x = velocity.y = 0
		rubberBandOffset = 0

		window.removeEventListener('keydown', onKeydown)
		scroller.removeEventListener('scroll', onScroll)
		// A destroy mid-drag would otherwise leave these window listeners live until
		// the next pointerup, still mutating this instance's state.
		removePointerListeners()
		isDragging = false
		scroller.classList.remove('blossom-dragging')
		// Removes the pointer listeners the proxy installed, and lets a later init()
		// re-add them once it re-detects overflow.
		hasOverflow.x = false
		hasOverflow.y = false

		// Undo everything init() wrote. Notably scrollSnapType: leaving our own 'none' on
		// the element makes a later init() read it back as the authored value, conclude the
		// carousel doesn't snap, and come up with no snap points at all.
		clearTranslations()
		scroller.style.scrollSnapType = previousInlineSnapType
		scroller.style.translate = ''
		scroller.style.removeProperty('--snap-type')
		scroller.removeAttribute('has-repeat')
		scroller.removeAttribute('has-snap')

		restoreScrollOverrides?.()
		restoreScrollMethods?.()
	}

	function scheduleSync(structure: boolean): void {
		if (structure) structureDirty = true

		// Coalesce, but flush in a microtask rather than a frame. ResizeObserver callbacks
		// are delivered after rAF and *before* paint, so deferring to the next frame would
		// let one frame paint at the wrong scroll position, a visible blink on open.
		if (syncScheduled) return
		syncScheduled = true
		queueMicrotask(() => {
			syncScheduled = false
			const structureChanged = structureDirty
			structureDirty = false
			sync(structureChanged)
		})
	}

	function sync(structureChanged: boolean): void {
		if (!scroller || !initialised) return

		const sizeChanged = scroller.clientWidth !== scrollerWidth || scroller.clientHeight !== scrollerHeight
		const resolveStructure =
			structureChanged ||
			!candidatesResolved ||
			// A size change can flip a (width or height) media query, changing which elements
			// snap, how, and their scroll-margin
			sizeChanged ||
			// MutationObserver is childList-only, so a replaced *nested* slide is invisible
			// to it. Cheap to detect, and only possible when we resolved deep candidates.
			(deepCandidates && snapCandidates.some(({ el }) => !scroller.contains(el)))

		// Bail before touching anything if our own box is unchanged and the child list is
		// intact. This is the common case: the ResizeObserver watches the parent, so it
		// fires for page layout changes that never affect the carousel at all.
		// Repeat mode translates slides, which skews scrollWidth, so its measurements are
		// only trustworthy once the translations are cleared, so no early bail there.
		if (
			!resolveStructure &&
			!slidesResized &&
			!options?.repeat &&
			scroller.scrollWidth === scrollerScrollWidth &&
			scroller.scrollHeight === scrollerScrollHeight &&
			scroller.clientHeight === scrollerHeight
		) {
			return
		}
		slidesResized = false

		setIsTicking(false)

		// Only write before the read phase, never between reads, so the browser flushes once.
		if (options?.repeat) clearTranslations()
		if (structureChanged || !candidatesResolved) {
			slides = Array.from(scroller.children) as HTMLElement[]
			// Only on child-list changes: observing a new target queues an initial notification,
			// which would otherwise schedule a second sync after every resize.
			const current = new Set(slides)
			for (const el of observedSlides) {
				if (!current.has(el)) {
					resizeObserver?.unobserve(el)
					observedSlides.delete(el)
				}
			}
			for (const el of slides) {
				if (!observedSlides.has(el)) {
					resizeObserver?.observe(el)
					observedSlides.add(el)
				}
			}
		}

		scrollerScrollWidth = scroller.scrollWidth
		scrollerWidth = scroller.clientWidth
		scrollerScrollHeight = scroller.scrollHeight
		scrollerHeight = scroller.clientHeight

		const styles = window.getComputedStyle(scroller)
		hasOverflow.x =
			// !hasTouch &&
			scrollerScrollWidth > scrollerWidth && ['auto', 'scroll'].includes(styles.getPropertyValue('overflow-x'))
		hasOverflow.y =
			// !hasTouch &&
			scrollerScrollHeight > scrollerHeight && ['auto', 'scroll'].includes(styles.getPropertyValue('overflow-y'))
		// Computed scroll-padding keeps percentages (repeat mode uses 50%), so resolve them
		// against the scrollport ourselves; parseInt would read "50%" as 50px.
		const px = (value: string) =>
			value.endsWith('%') ? (Number.parseFloat(value) * scrollerWidth) / 100 : Number.parseFloat(value) || 0
		scrollPadding.left = px(styles.scrollPaddingLeft)
		scrollPadding.right = px(styles.scrollPaddingRight)
		dir = styles.direction === 'rtl' ? -1 : 1
		// `gap` is the "row column" shorthand; only the column gap separates slides horizontally,
		// and only in flex/grid: the default inline-block layout reports it but never applies it.
		gap = /flex|grid/.test(styles.display) ? Number.parseFloat(styles.columnGap) || 0 : 0
		// Loop period: the slides' margin-box span plus the gap that would follow the last one.
		// Measured from the slides, not scrollWidth, because repeat's trailing spacer
		// (style.css) can take a whole grid track. min/max keeps it direction-agnostic.
		if (options?.repeat && slides.length) {
			const edges = [slides[0], slides[slides.length - 1]].map((el) => {
				const rect = el.getBoundingClientRect()
				const style = window.getComputedStyle(el)
				return [rect.left - (Number.parseFloat(style.marginLeft) || 0), rect.right + (Number.parseFloat(style.marginRight) || 0)]
			})
			loopWidth = Math.max(edges[0][1], edges[1][1]) - Math.min(edges[0][0], edges[1][0]) + gap
		}

		// Which elements snap only changes when the child list changes; their positions
		// change on every resize. Resolving identity is the expensive half, so cache it.
		if (resolveStructure) {
			snapCandidates = hasSnap ? findSnapCandidates() : []
			candidatesResolved = true
		}
		measureSnapPoints()

		// Slides can disappear from under us; keep the index addressable or prev()/next()
		// would compute another out-of-range index and stall permanently.
		if (snapPoints.length && currentIndex.value > snapPoints.length - 1) {
			currentIndex.value = snapPoints.length - 1
		}

		// Repositioning mid-drag would yank the carousel out from under the pointer
		const point = snapPoints[currentIndex.value]
		if (point !== undefined && !isDragging) {
			target.x = virtualScroll.x = point
			scroller.scrollTo({ left: point, behavior: 'instant' })
		}
		if (options?.repeat) {
			onRepeat()
		}
	}

	// Walks descendants but stops at the first snap-aligned element on each branch, so a
	// slide's own rich content is never descended into. The expensive case is a carousel
	// whose slides don't snap at all; that's why the result is cached and only re-resolved
	// when the structure (or a media query, via a width change) could have altered it.
	function findSnapCandidates(): SnapCandidate[] {
		const found: SnapCandidate[] = []

		const collect = (children: HTMLCollection) => {
			for (const node of children) {
				const style = window.getComputedStyle(node)
				// scroll-snap-align is `<block> <inline>`; the inline value drives horizontal snapping
				const parts = style.scrollSnapAlign.split(' ')
				const align = parts[1] ?? parts[0]

				if (align !== 'none') {
					// Read here, from the style we already have: scroll-margin only changes with
					// the same media queries that already trigger a re-resolve.
					found.push({
						el: node as HTMLElement,
						align,
						marginLeft: Number.parseFloat(style.scrollMarginLeft) || 0,
						marginRight: Number.parseFloat(style.scrollMarginRight) || 0,
					})
					continue
				}
				if (node.children.length) collect(node.children)
			}
		}

		collect(scroller.children)
		deepCandidates = found.some(({ el }) => el.parentElement !== scroller)

		return found
	}

	// Read-only: no style writes may happen between the rect reads below.
	function measureSnapPoints(): void {
		const scrollerRect = scroller.getBoundingClientRect()
		// Scroll coordinates start at the padding box, so exclude the border (and a left scrollbar)
		const originLeft = scrollerRect.left + scroller.clientLeft - scroller.scrollLeft
		// Native snap clamps snap positions to the scrollable range; unclamped points past the
		// end are unreachable, so the index could never get there and next() would stall.
		const maxScroll = getMaxScrollPosition() * dir
		const min = Math.min(maxScroll, 0)
		const max = Math.max(maxScroll, 0)

		snapPoints = []
		snapElements = []
		snapAlignments = []
		snapCenters = []
		const seenPositions = new Set<number>()

		for (const { el, align, marginLeft, marginRight } of snapCandidates) {
			// Snap areas are border boxes (clientWidth drops borders and rounds) grown by scroll-margin
			const { left: rectLeft, width } = el.getBoundingClientRect()
			const left = rectLeft - originLeft
			const areaLeft = left - marginLeft
			const areaRight = left + width + marginRight
			// start/end are logical: in RTL, start is the physical right edge
			const physical = dir === -1 && align !== 'center' ? (align === 'start' ? 'end' : 'start') : align

			let position: number | null = null
			switch (physical) {
				case 'start':
					position = areaLeft - scrollPadding.left
					break
				case 'end':
					position = areaRight - scrollerWidth + scrollPadding.right
					break
				case 'center':
					position = (areaLeft + areaRight) / 2 - (scrollerWidth + scrollPadding.left - scrollPadding.right) / 2
					break
			}
			if (position === null) continue
			if (!options?.repeat) position = clamp(position, min, max)

			// Filter out duplicates (i.e. in case of multiple rows, or points clamped to an edge)
			if (seenPositions.has(position)) continue
			seenPositions.add(position)

			snapPoints.push(position)
			snapElements.push(el)
			snapAlignments.push(align as ScrollLogicalPosition)
			snapCenters.push(left + width / 2)
		}
	}

	function onScroll() {
		// While ticking, tick() already handles repeat and the index for the scroll it just made
		if (isDragging || isTicking || !scroller) return

		const scrollStart = scroller.scrollLeft
		virtualScroll.x = target.x = scrollStart

		if (options?.repeat) {
			// onRepeat may scroll us elsewhere, so let the index re-read the position
			onRepeat()
			updateCurrentIndex()
			return
		}

		const maxScroll = getMaxScrollPosition()
		const position = scrollStart * dir

		if (position < 0) {
			dispatchOverscrollEvent(-scrollStart)
		} else if (position > maxScroll) {
			dispatchOverscrollEvent(maxScroll * dir - scrollStart)
		}

		updateCurrentIndex(scrollStart)
	}

	/*********************
	 **** Drag events ****
	 *********************/

	const virtualScroll: Point = {
		x: 0,
		y: 0,
	}

	function addPointerListeners(): void {
		window.addEventListener('pointermove', onPointerMove, { passive: true })
		window.addEventListener('touchmove', onPointerMove, { passive: true })
		window.addEventListener('pointerup', onPointerUp, { passive: true })
		window.addEventListener('pointercancel', onPointerUp, { passive: true })
		window.addEventListener('touchend', onPointerUp, { passive: true })
	}

	function removePointerListeners(): void {
		window.removeEventListener('pointermove', onPointerMove)
		window.removeEventListener('touchmove', onPointerMove)
		window.removeEventListener('pointerup', onPointerUp)
		window.removeEventListener('pointercancel', onPointerUp)
		window.removeEventListener('touchend', onPointerUp)
	}

	function onPointerDown(e: PointerEvent | TouchEvent): void {
		// Primary button only, and not on the scrollbar, whose native drag we'd fight
		if (!scroller || ('button' in e && e.button !== 0) || ('offsetY' in e && e.target === scroller && e.offsetY > scrollerHeight)) return

		const clientX = 'touches' in e ? e.touches[0]?.clientX : e.clientX
		const clientY = 'touches' in e ? e.touches[0]?.clientY : e.clientY

		if (hasOverflow.x) handleAxisPointerDown('x', clientX)
		if (hasOverflow.y) handleAxisPointerDown('y', clientY)

		distanceMovedSincePointerDown.x = distanceMovedSincePointerDown.y = 0
		isDragging = true

		addPointerListeners()
	}

	function onPointerMove(e: PointerEvent | TouchEvent): void {
		const clientX = 'touches' in e ? e.touches[0]?.clientX : e.clientX
		const clientY = 'touches' in e ? e.touches[0]?.clientY : e.clientY

		if (hasOverflow.x) handleAxisPointerMove('x', clientX)
		if (hasOverflow.y) handleAxisPointerMove('y', clientY)

		if (distanceMovedSincePointerDown.x > 2 || distanceMovedSincePointerDown.y > 2) scroller.classList.add('blossom-dragging')
	}

	function onPointerUp(): void {
		removePointerListeners()

		isDragging = false
		scroller.classList.remove('blossom-dragging')

		// Ticking means a drag passed the threshold or the pointer caught a glide; either way
		// the carousel is in motion and must be snapped, or it would stop between slides.
		if (!isTicking) return
		if (hasOverflow.x) velocity.x *= 2
		if (hasOverflow.y) velocity.y *= 2

		dragSnap()
	}

	function onWheel(e: WheelEvent): void {
		if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
			setIsTicking(false)
			if (isDragging || !scroller) return
			if (hasOverflow.x) virtualScroll.x = scroller.scrollLeft
			if (hasOverflow.y) virtualScroll.y = scroller.scrollTop
		}
	}

	function onKeydown(e: KeyboardEvent): void {
		// Only keys that can scroll this carousel: focus inside it, or none (Chrome then scrolls
		// the last-clicked scroller). Arrow keys in an unrelated input mustn't stop the animation.
		const target = e.target as Node
		if (
			['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key) &&
			(scroller.contains(target) || target === document.body || target === document.documentElement)
		) {
			setIsTicking(false)
		}
	}

	function dragSnap(): void {
		//TODO: add support for vertical snapping
		// Snap to the point nearest the projected resting position. Repeat mode used to step
		// one slide past the *live* index, which had already advanced mid-drag, so a one-slide
		// drag moved two. virtualSnapPoints (repeat) are the copies around the viewport;
		// snapPoints (otherwise) are already clamped to the scroll range.
		if (snapElements.length) animateToSlideX(snapSelect({ axis: 'x' }))
	}

	/*********************
	 ***** WRAP *****
	 *********************/

	// Reuse these allocations to avoid GC pressure in repeat mode
	const repeatVirtualCache: number[] = []
	const repeatElementOffsetCache = new Map<HTMLElement, number>()
	const appliedTranslate = new Map<HTMLElement, number>()

	function setTranslate(el: HTMLElement, x: number): void {
		if (appliedTranslate.get(el) === x) return
		appliedTranslate.set(el, x)
		el.style.translate = `${x}px 0`
	}

	function clearTranslations(): void {
		for (const el of appliedTranslate.keys()) el.style.translate = ''
		appliedTranslate.clear()
	}

	function onRepeat(): void {
		if (!scroller) return

		if (loopWidth <= 0) return

		// Wrap only when leaving a one-loop window centred in the scroll range, so the wrapped
		// position lands inside the window, never on the opposite threshold. Compared along the
		// inline direction, otherwise RTL (negative scrollLeft) wraps every frame.
		const lo = (getMaxScrollPosition() - loopWidth) / 2
		const position = virtualScroll.x * dir
		const shift = position > lo + loopWidth ? -loopWidth * dir : position < lo ? loopWidth * dir : 0
		if (shift) {
			virtualScroll.x += shift
			target.x += shift
			if (!isTicking) {
				scroller.scrollTo({ left: virtualScroll.x, behavior: 'instant' })
			}
		}

		const scrollLeft = virtualScroll.x

		// Clear and reuse cached arrays/maps
		repeatElementOffsetCache.clear()
		repeatVirtualCache.length = snapPoints.length

		// Compute offsets for snapped elements first to produce a dense virtualSnapPoints
		for (let i = 0; i < snapElements.length; i++) {
			const el = snapElements[i]
			const basePoint = snapPoints[i] ?? 0
			// Place each slide in the cycle whose centre is nearest the viewport centre, so the
			// visible window is symmetric whatever the alignment. snapCenters comes from sync;
			// reading layout here would force a reflow mid translate writes.
			const raw = (scrollLeft + scrollerWidth / 2 - (snapCenters[i] ?? 0)) / loopWidth
			const k = Math.round(raw + (velocity.x >= 0 ? 0.001 : -0.001))
			const offsetX = k * loopWidth
			setTranslate(el, offsetX)
			repeatElementOffsetCache.set(el, offsetX)
			repeatVirtualCache[i] = basePoint + offsetX
		}

		// Translate non-snap slides to the nearest previous snapped slide's cycle
		let previousOffset = 0
		for (let i = 0; i < slides.length; i++) {
			const el = slides[i]
			const own = repeatElementOffsetCache.get(el)
			if (own !== undefined) {
				previousOffset = own
				continue
			}
			setTranslate(el, previousOffset)
		}

		// Replace contents of virtualSnapPoints with the dense array
		virtualSnapPoints.length = 0
		for (let i = 0; i < repeatVirtualCache.length; i++) virtualSnapPoints.push(repeatVirtualCache[i])
	}

	/******************
	 ***** Ticker *****
	 ******************/

	const FRICTION = 0.72
	const DAMPING = 0.12
	let isTicking = false

	function setIsTicking(bool: boolean): void {
		if (!scroller) return
		// Called on every pointermove past the drag threshold, so don't rewrite the attribute.
		if (bool === isTicking) return

		if (bool && !isTicking) {
			lastTick = performance.now()
			if (hasOverflow.x) target.x = scroller.scrollLeft
			if (hasOverflow.y) target.y = scroller.scrollTop

			if (!raf) {
				raf = requestAnimationFrame(tick)
			}
		} else if (!bool && raf) {
			cancelAnimationFrame(raf)
			raf = null
		}

		isTicking = bool
		snap = !bool

		scroller.setAttribute('has-snap', snap ? 'true' : 'false')
	}

	// Sub-pixel threshold below which motion is indistinguishable and the loop can stop.
	const SETTLE_EPSILON = 0.05

	let frameDelta = 0
	let lastTick = 0
	function tick(t: number): void {
		// The rAF timestamp is the frame start, which can predate the performance.now() taken
		// in setIsTicking; a negative delta would make damp() extrapolate backwards.
		frameDelta = Math.max(0, t - lastTick)
		lastTick = t

		if (hasOverflow.x) handleAxisTick('x')
		if (hasOverflow.y) handleAxisTick('y')

		if (options?.repeat) {
			onRepeat()
		} else {
			applyRubberBanding(round(virtualScroll.x, 2))
		}

		__scrollingInternally = true
		scroller.scrollTo({
			left: virtualScroll.x,
			top: virtualScroll.y,
			behavior: 'instant' as ScrollBehavior,
		})

		// virtualScroll is what we just scrolled to, so we don't need to read scrollLeft back
		updateCurrentIndex(virtualScroll.x)

		// Stop once motion has converged, otherwise this loop runs forever
		if (isSettled()) {
			setIsTicking(false)
			return
		}

		raf = requestAnimationFrame(tick)
	}

	function isSettled(): boolean {
		if (isDragging) return false
		// Only axes that tick can converge. Checking an axis that lost its overflow would
		// keep the loop alive forever on whatever stale velocity it was left holding.
		if (hasOverflow.x && !isAxisSettled('x')) return false
		if (hasOverflow.y && !isAxisSettled('y')) return false
		return Math.abs(rubberBandOffset) < SETTLE_EPSILON
	}

	function isAxisSettled(axis: 'x' | 'y'): boolean {
		return Math.abs(velocity[axis]) < SETTLE_EPSILON && Math.abs(target[axis] - virtualScroll[axis]) < SETTLE_EPSILON
	}

	let rubberBandOffset = 0
	function applyRubberBanding(left: number): void {
		if (!scroller) return

		//TODO: add support for vertical rubber banding
		const edge = getMaxScrollPosition()

		let targetOffset = 0
		if (left * dir <= 0) {
			targetOffset = isDragging ? left * -0.2 : 0
		} else if (left * dir > edge) {
			targetOffset = isDragging ? (left - edge * dir) * -0.2 : 0
		}
		rubberBandOffset = damp(rubberBandOffset, targetOffset, isDragging ? 0.8 : DAMPING, frameDelta)

		if (Math.abs(rubberBandOffset) > 0.01) {
			const evt = dispatchOverscrollEvent(rubberBandOffset)
			if (evt.defaultPrevented) return
			// `translate`, not `transform`, so an author transform on the scroller survives
			scroller.style.translate = `${round(rubberBandOffset, 3)}px 0`
			return
		}

		// Only clear once, not on every frame spent at rest
		if (rubberBandOffset !== 0) {
			scroller.style.translate = ''
			rubberBandOffset = 0
		}
	}

	function dispatchOverscrollEvent(left: number): CustomEvent<{ left: number }> {
		const overscrollEvent = new CustomEvent('overscroll', {
			bubbles: true,
			cancelable: true,
			detail: { left },
		})
		scroller?.dispatchEvent(overscrollEvent)
		return overscrollEvent
	}

	/******************************
	 ********* METHODS **************
	 ******************************/

	let __scrollingInternally = false
	let restoreScrollOverrides: (() => void) | null = null

	// Installed per init() and undone per destroy(), so the instance survives a
	// destroy/init cycle and hands back any override the element already carried.
	function installScrollOverrides(): void {
		restoreScrollOverrides?.()

		const originals = (['scrollTo', 'scrollBy'] as const).map((name) => {
			const native = scroller[name].bind(scroller)
			const had = Object.hasOwn(scroller, name)
			const previous = scroller[name]

			scroller[name] = ((optionsOrX?: ScrollToOptions | number, y?: number) => {
				const internal = __scrollingInternally === true
				if (!internal) setIsTicking(false)
				__scrollingInternally = false
				if (typeof optionsOrX === 'number') {
					native(optionsOrX, y ?? 0)
				} else {
					native(optionsOrX)
				}
			}) as typeof scroller.scrollTo

			return { name, had, previous }
		})

		restoreScrollOverrides = () => {
			for (const { name, had, previous } of originals) {
				if (had) scroller[name] = previous
				else delete (scroller as Partial<HTMLElement>)[name]
			}
			restoreScrollOverrides = null
		}
	}

	/******************************
	 ********* UTILS **************
	 ******************************/

	interface AxisOption {
		axis: 'x' | 'y'
	}

	function handleAxisPointerDown(axis: 'x' | 'y', clientPos: number): void {
		const scrollProp = axis === 'x' ? 'scrollLeft' : 'scrollTop'
		virtualScroll[axis] = scroller[scrollProp]
		target[axis] = scroller[scrollProp]
		pointerStart[axis] = clientPos
		velocity[axis] = 0
	}

	function handleAxisPointerMove(axis: 'x' | 'y', clientPos: number): void {
		const delta = pointerStart[axis] - clientPos
		target[axis] += delta
		velocity[axis] += delta
		pointerStart[axis] = clientPos
		distanceMovedSincePointerDown[axis] += Math.abs(delta)
	}

	function handleAxisTick(axis: 'x' | 'y'): void {
		// Friction is defined per 60Hz step. Applying it per frame made motion twice as fast at
		// 120Hz; scale it by elapsed steps instead. The travel term is the closed form of the
		// per-step series, so it composes exactly: total travel stays v·F/(1−F) at any frame
		// rate, which animateToSlideX relies on to land on the snap point.
		const decay = FRICTION ** (frameDelta / (1000 / 60))
		if (!isDragging) target[axis] += (velocity[axis] * FRICTION * (1 - decay)) / (1 - FRICTION)
		velocity[axis] *= decay
		virtualScroll[axis] = damp(virtualScroll[axis], target[axis], isDragging ? FRICTION : DAMPING, frameDelta)
	}

	function project({ axis = 'x' }: AxisOption): number {
		return target[axis] + velocity[axis] / (1 - FRICTION)
	}

	function snapSelect({ axis = 'x' }: AxisOption): number {
		const restingX = project({ axis })
		const points = virtualSnapPoints.length ? virtualSnapPoints : snapPoints
		return points.reduce((prev, curr) => (Math.abs(curr - restingX) < Math.abs(prev - restingX) ? curr : prev))
	}

	function lerp(x: number, y: number, t: number): number {
		return (1 - t) * x + t * y
	}

	function damp(x: number, y: number, t: number, delta: number): number {
		return lerp(x, y, 1 - Math.exp(Math.log(1 - t) * (delta / (1000 / 60))))
	}

	function clamp(value: number, min: number, max: number): number {
		if (value < min) return min
		if (value > max) return max
		return value
	}

	function round(value: number, precision = 0): number {
		const multiplier = 10 ** precision
		return Math.round(value * multiplier) / multiplier
	}

	/******************************
	 ********* REPEAT UTILS *********
	 ******************************/

	function getMaxScrollPosition(): number {
		return scrollerScrollWidth - scrollerWidth
	}

	function normalizeToCycle(point: number, reference: number): number {
		const w = loopWidth
		if (w <= 0) return point
		const k = Math.round((reference - point) / w)
		return point + k * w
	}

	function animateToSlideX(slideX: number): void {
		if (slideX === undefined || Number.isNaN(slideX)) return

		setIsTicking(true)
		target.x = virtualScroll.x
		// No shortest-path wrapping: navigate() already picks the cycle in the intended
		// direction, and a drag's virtual snap point is the copy it was projected towards.
		// Wrapping reversed fast repeat drags whose target lay over half a loop away.
		const distance = slideX - virtualScroll.x
		const force = distance * (1 - FRICTION) * (1 / FRICTION)
		velocity.x = force
	}

	function computeRepeatSlideX(targetIndex: number, directionSign: 1 | -1): number {
		const base = snapPoints[targetIndex] ?? 0
		const candidate = normalizeToCycle(base, virtualScroll.x)
		const w = loopWidth
		if (w <= 0) return candidate
		const delta = candidate - virtualScroll.x
		if (directionSign === 1 && delta * dir <= 0) return candidate + w * dir
		if (directionSign === -1 && delta * dir >= 0) return candidate - w * dir
		return candidate
	}

	/******************************
	 ********* NAVIGATION *********
	 ******************************/

	function getCurrentSnapIndex(scrollLeft?: number): number {
		const points = options?.repeat && virtualSnapPoints.length ? virtualSnapPoints : snapPoints
		if (!points.length) return 0

		const currentScroll = scrollLeft ?? scroller.scrollLeft
		let closestIndex = 0
		let closestDistance = Math.abs(points[0] - currentScroll)

		for (let i = 1; i < points.length; i++) {
			const distance = Math.abs(points[i] - currentScroll)
			if (distance < closestDistance) {
				closestDistance = distance
				closestIndex = i
			}
		}

		return closestIndex
	}

	function updateCurrentIndex(scrollLeft?: number): void {
		const newIndex = getCurrentSnapIndex(scrollLeft)
		if (currentIndex.value !== newIndex) {
			currentIndex.value = newIndex
		}
	}

	function navigate(direction: 1 | -1): void {
		if (snapElements.length <= 1) return

		const points = snapPoints
		const targetIndex = options?.repeat
			? (currentIndex.value + direction + points.length) % points.length
			: direction === 1
				? Math.min(currentIndex.value + 1, points.length - 1)
				: Math.max(currentIndex.value - 1, 0)

		if (nativeScroll) {
			const align = snapAlignments[targetIndex] ?? 'start'
			;(snapElements[targetIndex] as HTMLElement).scrollIntoView({
				behavior: 'smooth',
				block: 'nearest',
				inline: align,
			})
			return
		}

		const slideX = options?.repeat && points.length >= 2 ? computeRepeatSlideX(targetIndex, direction) : points[targetIndex]

		animateToSlideX(slideX)
	}

	function next(): void {
		navigate(1)
	}

	function prev(): void {
		navigate(-1)
	}

	return {
		init,
		get snap() {
			return snap
		},
		hasOverflow,
		currentIndex: () => currentIndex.value,
		next,
		prev,
		destroy,
	}
}
