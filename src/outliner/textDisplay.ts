import { createAction } from '../util/moddingTools'
import * as events from '../events'
import { ajModelFormat } from '../modelFormat'
import { JsonText } from '../minecraft'
import { createCanvas } from '../minecraft/temp'

const DEFAULT_TEXT = 'The quick brown fox jumps over the lazy dog.'
const SIZE_DIVISOR = 4.75

events.LOAD.subscribe(() => {
	console.log('Animated Java loaded!')
	class TextDisplayElement extends OutlinerElement {
		text = 'text_display'
		lineWidth = 100
		position: ArrayVector3 = [0, 0, 0]
		rotation: ArrayVector3 = [0, 0, 0]
		scale: ArrayVector3 = [1, 1, 1]
		visibility = true

		title = 'text_display'
		type = 'textDisplay'
		icon = 'text_fields'
		movable = true
		scalable = true
		rotatable = true
		needsUniqueName = true
		menu = new Menu([...Outliner.control_menu_group, '_', 'rename', 'delete'])
		buttons = [Outliner.buttons.export, Outliner.buttons.locked, Outliner.buttons.visibility]
		// eslint-disable-next-line @typescript-eslint/naming-convention
		preview_controller = PreviewController
		_offset = 0

		constructor(data: Record<string, any>, uuid: string = guid()) {
			super(data, uuid)
			for (const key in TextDisplayElement.properties) {
				TextDisplayElement.properties[key].reset(this)
			}

			data && typeof data === 'object' && this.extend(data)
		}

		get origin() {
			return this.position
		}

		getWorldCenter() {
			Reusable.vec3.set(0, this._offset, 0)
			// @ts-ignore
			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			return THREE.fastWorldPosition(this.mesh, Reusable.vec2).add(Reusable.vec3)
		}

		extend(object: Record<string, any>) {
			for (const key in TextDisplayElement.properties) {
				TextDisplayElement.properties[key].merge(this, object)
			}

			this.sanitizeName()
			return this
		}

		getUndoCopy() {
			const copy = new TextDisplayElement(this)
			copy.uuid = this.uuid
			delete copy.parent
			return copy
		}

		getSaveCopy() {
			const el: any = {}
			for (const key in TextDisplayElement.properties) {
				TextDisplayElement.properties[key].copy(this, el)
			}
			el.type = 'textDisplay'
			el.uuid = this.uuid
			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			return el
		}

		select(event?: any, isOutlinerClick?: boolean) {
			super.select(event, isOutlinerClick)
			if (Animator.open && Blockbench.Animation.selected) {
				// eslint-disable-next-line @typescript-eslint/no-extra-semi
				;(Blockbench.Animation.selected as _Animation).getBoneAnimator(this).select()
			}
			return this
		}

		unselect() {
			super.unselect()
			if (
				Animator.open &&
				Timeline.selected_animator &&
				Timeline.selected_animator.element == this
			) {
				Timeline.selected_animator.selected = false
			}
		}
	}

	new Property(TextDisplayElement, 'string', 'name', { default: 'text_display' })
	new Property(TextDisplayElement, 'string', 'text', { default: DEFAULT_TEXT })
	new Property(TextDisplayElement, 'string', 'lineWidth', { default: 100 })
	new Property(TextDisplayElement, 'vector', 'position')
	new Property(TextDisplayElement, 'vector', 'rotation')
	new Property(TextDisplayElement, 'boolean', 'visibility', { default: true })

	OutlinerElement.registerType(TextDisplayElement, 'textDisplay')

	const PreviewController = new NodePreviewController(TextDisplayElement, {
		setup(element: TextDisplayElement) {
			// const text = new JsonText([
			// 	{ text: 'Hello World!', color: 'red' },
			// 	{ text: 'Hello World Again!' },
			// ])
			// const text = new JsonText([{ text: 'MMMMMMMMMMMMMMMMM' }])
			// const canvas = text.renderToCanvas(element.lineWidth)
			void createCanvas().then(canvas => {
				const width = canvas.width
				const height = canvas.height

				const texture = new THREE.CanvasTexture(canvas.canvas)
				// @ts-ignore
				texture.colorSpace = THREE.sRGBEncoding
				texture.magFilter = THREE.NearestFilter
				// console.log('texture', texture)
				// texture.image.style.border = '2px solid black'
				jQuery('#preview')[0].appendChild(texture.image)

				const material = new THREE.MeshBasicMaterial({
					map: texture,
					transparent: true,
					alphaTest: 0.5,
				})
				const textGeometry = new THREE.BoxGeometry(
					width / SIZE_DIVISOR,
					height / SIZE_DIVISOR,
					0.01
				)
				// @ts-ignore
				// Remove the backface
				textGeometry.attributes.uv.array = textGeometry.attributes.uv.array.map(
					(v: number, i: number) => (i < 40 ? 0 : v)
				)
				const textMesh = new THREE.Mesh(textGeometry, material)

				// Background
				const backgroundGeometry = new THREE.BoxGeometry(
					(width + 4) / SIZE_DIVISOR,
					(height + 8) / SIZE_DIVISOR,
					0
				)
				// Align bottom of mesh with the origin
				const offset = height / SIZE_DIVISOR / 2 + 4 / SIZE_DIVISOR
				backgroundGeometry.translate(0, offset, 0)
				textGeometry.translate(0, offset, 0)
				element._offset = offset

				const outline = new THREE.LineSegments(
					new THREE.EdgesGeometry(backgroundGeometry),
					new THREE.LineBasicMaterial({ color: Canvas.outlineMaterial.color })
				)
				// @ts-ignore
				outline.no_export = true
				outline.name = element.uuid + '_outline'
				outline.visible = element.selected
				outline.renderOrder = 2
				outline.frustumCulled = false

				const backgroundMaterial = new THREE.MeshBasicMaterial({
					color: 0x000000,
					transparent: true,
					opacity: 0.255,
				})
				// @ts-ignore
				// Remove the backface
				backgroundGeometry.index!.array = backgroundGeometry.index!.array.map(
					(v: number, i: number) => (i < 30 ? 0 : v)
				)
				const backgroundMesh = new THREE.Mesh(backgroundGeometry, backgroundMaterial)
				// Prevent z-fighting
				backgroundMesh.position.z = 0.01
				// Align edges of text
				backgroundMesh.position.x = 1 / SIZE_DIVISOR
				textMesh.position.y = 2 / SIZE_DIVISOR

				Project!.nodes_3d[element.uuid] = backgroundMesh
				backgroundMesh.name = element.uuid
				backgroundMesh.type = element.type
				// @ts-ignore
				backgroundMesh.isElement = true
				backgroundMesh.visible = element.visibility
				backgroundMesh.rotation.order = 'ZYX'
				backgroundMesh.add(outline)
				backgroundMesh.add(textMesh)
				// @ts-ignore
				backgroundMesh.outline = outline
				Canvas.updateAll()
			})
			Project!.nodes_3d[element.uuid] = new THREE.Mesh() // Temp mesh
			PreviewController.updateTransform(element)
			PreviewController.dispatchEvent('setup', { element })
		},
	})

	const ACTION = createAction('animated_java:add_text_display', {
		name: 'Add Text Display',
		icon: 'text_fields',
		category: 'animated_java',
		condition: () => Format.id === ajModelFormat.id && Mode.selected.id === 'edit',
		click() {
			Undo.initEdit({ outliner: true, elements: [], selection: true })

			const textDisplay = new TextDisplayElement({}).init()
			const group = getCurrentGroup()
			textDisplay.addTo(group)

			Format.bone_rig && group && textDisplay.extend({ position: group.origin.slice() })
			Group.selected && Group.selected.unselect()

			textDisplay.select()

			Undo.finishEdit('Add Text', {
				outliner: true,
				elements: selected,
				selection: true,
			})

			return textDisplay
		},
	})

	Interface.Panels.outliner.menu.addAction(ACTION, 3)
	Toolbars.outliner.add(ACTION, 0)
	MenuBar.menus.edit.addAction(ACTION, 8)

	// @ts-ignore
	window.TextDisplayElement = TextDisplayElement
})

// export async function createText() {
// 	const font = await new FontFace('Minecraft', url as Buffer, {}).load()
// 	document.fonts.add(font)

// 	const texture = new Blockbench.Texture({
// 		name: 'font-test',
// 		width: 128,
// 		height: 128,
// 	})

// 	const ctx = texture.canvas.getContext('2d')!
// 	ctx.fillStyle = 'black'
// 	ctx.font = '20px Minecraft'
// 	ctx.fillText('Hello, world!', 0, 16)
// 	return texture
// }
