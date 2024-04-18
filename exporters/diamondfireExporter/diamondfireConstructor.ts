import { error } from "console"

interface Animation {
	name: string
	frames: Frame[]
	duration: number
}

interface Frame {
	nodes: Node[]
}

interface Node {
	uuid: string
	matrix: Matrix
}

interface Matrix {
	elements: {}
}

async function loadPako() {
	return new Promise((resolve, reject) => {
		const script = document.createElement('script')
		script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pako/2.0.3/pako.min.js'
		script.onload = resolve
		script.onerror = reject // In case of any loading error
		document.head.appendChild(script)
	})
}
async function textToGZip(input) {
	try {
		if (typeof pako === 'undefined') {
			await loadPako()
		}

		var uint8array = pako.gzip(input, { to: 'string' })
		var stringValue = uint8ToString(uint8array)
		return btoa(stringValue)
	} catch (e) {
		console.error(e)
		throw new Error(e)
	}
}
function uint8ToString(uint8Value) {
	var bufferSize = 0x8000
	var c = []
	for (var i = 0; i < uint8Value.length; i += bufferSize) {
		c.push(String.fromCharCode.apply(null, uint8Value.subarray(i, i + bufferSize)))
	}
	return c.join('')
}

export async function getItem(exportOptions) {
	// get data

	const { projectSettings, renderedAnimations, rig } = exportOptions
	const uuids = rig.nodeMap
	let animations = renderedAnimations
	animations.push({ name: 'default', frames: [{ nodes: rig.defaultPose }], duration: 2 })

	const model = projectSettings.project_namespace._value as string
	const rig_item = projectSettings.rig_item.value

	// format animation data

	let animation_data = {}
	for (const animation of Object.values(animations) as Animation[]) {
		animation_data[animation.name] = { duration: animation.duration - 1 }

		for (const uuid in uuids) {
			animation_data[animation.name][uuids[uuid].name] = []
		}

		for (const frame in animation.frames) {
			
			// if frame isnt a number
			if (/[^\d\n]/gm.test(frame)) {
				continue
			}

			let nodes = []
			try {
				for (const node of Object.values(animation.frames[frame].nodes) as Node[]) {
					nodes.push(node.uuid)
					// flip matrix over diagonal and then dot product with [[-1,0,0,0],[0,1,0,0],[0,0,-1,0],[0,0,0,1]] and then round to 3 decimal places
					let matrix = `${-node.matrix.elements[0].toFixed(
						3
					)},${node.matrix.elements[4].toFixed(3)},${-node.matrix.elements[8].toFixed(
						3
					)},${node.matrix.elements[12].toFixed(3)},${-node.matrix.elements[1].toFixed(
						3
					)},${node.matrix.elements[5].toFixed(3)},${-node.matrix.elements[9].toFixed(
						3
					)},${node.matrix.elements[13].toFixed(3)},${-node.matrix.elements[2].toFixed(
						3
					)},${node.matrix.elements[6].toFixed(3)},${-node.matrix.elements[10].toFixed(
						3
					)},${node.matrix.elements[14].toFixed(3)},${-node.matrix.elements[3].toFixed(
						3
					)},${node.matrix.elements[7].toFixed(3)},${-node.matrix.elements[11].toFixed(
						3
					)},${node.matrix.elements[15].toFixed(3).trim()}\n`

					matrix = matrix
						.replace(
							/(((?<=\.)(?=.[0\n,]{2}))|((?<=\.)(?=.[\n,]))|((?<=\.\d)(?=.[0\n,]{1}))|((?<=\.\d\d)))0|(?<!\.)(?=\.[0\n,]{3})\./gm,
							''
						)
						.slice(0, -1)
					animation_data[animation.name][uuids[node.uuid].name].push(matrix)
				}
			} catch {
				break
			}

			nodes = Object.keys(uuids).filter(n => !nodes.includes(n))
			if (nodes.length > 0) {
				for (const node of nodes) {
					animation_data[animation.name][uuids[node].name].push(
						animation_data[animation.name][uuids[node].name].at(-1)
					)
				}
			}
		}
	}

	// parse to blocks

	let item_name = `display:{Name:'[{"text":"Model Data","color":"#6DC7E9","bold":true,"italic":false},{"text":" | ","color":"#283779","bold":false,"italic":false},{"text":"${model}","color":"#537AC1","bold":false,"italic":true}]'}`
	let icon = `{"item":{"id":"item","data":{"item":"{Count:1b,DF_NBT:3465,id:\\"${rig_item}\\",tag:{${item_name.replaceAll(
		'"',
		'\\"'
	)}}}"}},"slot":0}`

	let blocks = [
		`{"id":"block","block":"func","args":{"items":[${icon},{"item":{"id":"hint","data":{"id":"function"}},"slot":25},{"item":{"id":"bl_tag","data":{"option":"False","tag":"Is Hidden","action":"dynamic","block":"func"}},"slot":26}]},"data":"consts.rig.${model}"}`,
	]

	//model items
	let model_items = ''
	let i = 0
	for (const uuid in uuids) {
		i += 1
		model_items += `,{"item":{"id":"item","data":{"item":"{Count:1b,DF_NBT:3465,id:\\"${rig_item}\\",tag:{CustomModelData:${uuids[uuid].customModelData},PublicBukkitValues:{\\"hypercube:id\\":\\"${uuids[uuid].name}\\"}}}"}},"slot":${i}}`
	}
	if (i > 27) {
		throw new Error(`More than 26 model parts (${i})`)
	}
	blocks.push(
		`{"id":"block","block":"set_var","args":{"items":[{"item":{"id":"var","data":{"name":"${model.toUpperCase()}.model","scope":"unsaved"}},"slot":0}${model_items}]},"action":"CreateList"}`
	)

	//animation info
	let animation_ids = ''
	let animation_durations = ''
	for (const animation in animation_data) {
		;(animation_ids += ';' + animation),
			(animation_durations += ';' + animation_data[animation].duration)
	}
	animation_ids = `{"item":{"id":"txt","data":{"name":"${animation_ids.substring(1)}"}},"slot":1}`
	animation_durations = `{"item":{"id":"txt","data":{"name":"${animation_durations.substring(
		1
	)}"}},"slot":2}`
	blocks.push(
		`{"id":"block","block":"set_var","args":{"items":[{"item":{"id":"var","data":{"name":"${model.toUpperCase()}.animations","scope":"unsaved"}},"slot":0},${animation_ids},${animation_durations}]},"action":"CreateList"}`
	)

	//animation data
	for (const animation in animation_data) {
		for (const uuid in uuids) {
			let animation_string = ''
			let animation_items = ''
			let len = 10000
			let index = 0

			for (let i = 0; i < animation_data[animation].duration; i++) {
				
				let string = animation_data[animation][uuids[uuid].name][i]
				len -= string.length
				if (len < 0) {
					len = 10000 - string.length - 1
					index += 1
					if (index > 26) {
						throw new Error(`Exceeded frame limit at frame ${i + 1}`)
					}
					animation_items += `,{"item":{"id":"txt","data":{"name":"${animation_string.substring(
						1
					)}"}},"slot":${index}}`
					animation_string = ''
				}

				animation_string += ';' + string
			}

			if (animation_string != '') {
				if (index > 25) {
					throw new Error(`Exceeded frame limit at frame ${i + 1}`)
				}
				animation_items += `,{"item":{"id":"txt","data":{"name":"${animation_string.substring(
					1
				)}"}},"slot":${index + 1}}`
			}
			blocks.push(
				`{"id":"block","block":"set_var","args":{"items":[{"item":{"id":"var","data":{"name":"${model.toUpperCase()}.animation.${animation}.${
					uuids[uuid].name
				}","scope":"unsaved"}},"slot":0}${animation_items}]},"action":"CreateList"}`
			)
		}
	}

	let code = await textToGZip(`{"blocks":[${blocks.join(',')}]}`)
	const templateData = `{"author":"Floophead", "name":"const.rig.${model}", "version":1, "code": "${code}"}`
	const item = `{Count:1b,id:'minecraft:light_blue_stained_glass',tag:{PublicBukkitValues:{\\"hypercube:codetemplatedata\\":'${templateData.replaceAll(
		'"',
		'\\"'
	)}'},${item_name.replaceAll('"', '\\"')}}}`
	return item
}
