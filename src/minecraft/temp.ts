import { FONT, PIXEL_FILTER } from '.'

export const CANVAS = new CanvasFrame(100, 100)
// CANVAS.ctx.font = FONT
// CANVAS.ctx.filter = PIXEL_FILTER
// CANVAS.ctx.fillStyle = '#ffffff'
// CANVAS.ctx.textBaseline = 'top'

const DATA = `<svg xmlns="http://www.w3.org/2000/svg" width="100", height="100">
	<foreignObject width="100%" height="100%">
		<div xmlns="http://www.w3.org/1999/xhtml" style="font: ${FONT}; filter: ${PIXEL_FILTER}; color: #ffffff; text-align: left; white-space: nowrap;">
			Hello World!
		</div>
	</foreignObject>
</svg>`

const DOMURL = window.URL || window.webkitURL || window

const IMG = new Image()
const SVG = new Blob([DATA], { type: 'image/svg+xml;charset=utf-8' })
const URL = DOMURL.createObjectURL(SVG)

IMG.onload = function () {
	CANVAS.ctx.drawImage(IMG, 0, 0)
	DOMURL.revokeObjectURL(URL)
}

IMG.src = URL
CANVAS.canvas.id = 'test-canvas'
jQuery('.preview').append(IMG)
console.log(CANVAS.canvas)
console.log(IMG)
