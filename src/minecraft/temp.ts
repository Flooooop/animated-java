// @ts-ignore
import fontFile from '../assets/MinecraftFull.ttf'
import * as htmlToImage from 'html-to-image'

import { FONT, JsonText, PIXEL_FILTER } from '.'

const CSS = `@font-face {
	font-family: 'MinecraftFull';
	src: url(${fontFile as string});
}`

function autoCrop(canvasFrame: CanvasFrame) {
	// Based on code by remy, licensed under MIT
	// https://gist.github.com/remy/784508

	const copy = document.createElement('canvas').getContext('2d')!
	const pixels = canvasFrame.ctx.getImageData(0, 0, canvasFrame.width, canvasFrame.height)
	let i
	const bound: Record<string, number | null> = {
		top: null,
		left: null,
		right: null,
		bottom: null,
	}
	let x, y

	for (i = 0; i < pixels.data.length; i += 4) {
		if (pixels.data[i + 3] !== 0) {
			x = (i / 4) % canvasFrame.width
			y = ~~(i / 4 / canvasFrame.width)

			if (bound.top === null) {
				bound.top = y
			}

			if (bound.left === null) {
				bound.left = x
			} else if (x < bound.left) {
				bound.left = x
			}

			if (bound.right === null) {
				bound.right = x
			} else if (bound.right < x) {
				bound.right = x
			}

			if (bound.bottom === null) {
				bound.bottom = y
			} else if (bound.bottom < y) {
				bound.bottom = y
			}
		}
	}

	const trimHeight = bound.bottom! - bound.top! + 1,
		trimWidth = bound.right! - bound.left! + 1,
		trimmed = canvasFrame.ctx.getImageData(bound.left!, bound.top!, trimWidth, trimHeight)

	copy.canvas.width = trimWidth
	copy.canvas.height = trimHeight
	copy.putImageData(trimmed, 0, 0)
	canvasFrame.canvas = copy.canvas
	canvasFrame.ctx = copy
}

export function createCanvas() {
	const maxWidth = 100 * 2
	const canvasFrame = new CanvasFrame(maxWidth, 200)
	canvasFrame.ctx.font = FONT
	canvasFrame.ctx.filter = `url(${PIXEL_FILTER})`
	canvasFrame.ctx.fillStyle = '#ffffff'
	canvasFrame.ctx.textBaseline = 'top'
	canvasFrame.ctx.imageSmoothingEnabled = false
	canvasFrame.canvas.style.imageRendering = 'pixelated'
	// window.devicePixelRatio = 1.01

	const meta = document.createElement('meta')
	meta.name = 'viewport'
	meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0'
	document.head.appendChild(meta)

	const element = document.createElement('div')
	const text = new JsonText([
		{ text: 'Hello World!', color: 'red' },
		' ',
		{ text: 'Hello World!' },
	])
	// const text = new JsonText([{ text: 'Hello World! Hello World!', color: 'red' }])

	element.style.width = `${maxWidth}px`
	element.style.font = FONT
	element.style.filter = `url(${PIXEL_FILTER})`
	element.style.color = '#ffffff'
	element.style.whiteSpace = 'normal'
	element.style.overflowWrap = 'break-word'
	element.style.textAlign = 'center'
	element.style.lineHeight = '22px'
	element.style.imageRendering = 'pixelated'

	text.toHTML(element)

	jQuery('#preview')[0].appendChild(element)

	const promise = new Promise<CanvasFrame>(resolve => {
		void htmlToImage
			.toPng(element, {
				fontEmbedCSS: CSS,
				style: {
					// font: FONT,
					// filter: `url(${PIXEL_FILTER})`,
					// color: '#ffffff',
					// whiteSpace: 'normal',
					// overflowWrap: 'break-word',
					// textAlign: 'center',
					// lineHeight: '22px',
				},
			})
			.then(data => {
				const img = new Image()
				img.onload = () => {
					canvasFrame.loadFromImage(img)
					autoCrop(canvasFrame)
					resolve(canvasFrame)
				}
				img.src = data
				// element.remove()
				// window.devicePixelRatio = 1
			})
	})

	return promise
}
