// @ts-ignore
import en from './lang/en.yaml'
// @ts-ignore
import de from './lang/de.yaml'
// @ts-ignore
import zh from './lang/zh_cn.yaml'

import { getItem } from './diamondfireConstructor'

export function loadExporter() {
	const API = AnimatedJava.API

	API.addTranslations('en', en as Record<string, string>)

	const TRANSLATIONS = {
		output_file: {
			error: {
				empty: API.translate(
					'animated_java.exporters.diamondfire_exporter.settings.output_file.error.empty'
				),
			},
		},
	}

	new API.Exporter({
		id: 'animated_java:diamondfire_exporter',
		name: API.translate('animated_java.exporters.diamondfire_exporter.name'),
		description: API.translate('animated_java.exporters.diamondfire_exporter.description'),
		getSettings() {
			return {
				minecraft_mod: new API.Settings.DropdownSetting({
					id: 'animated_java:diamondfire_exporter/mod',
					displayName: API.translate(
						'animated_java.exporters.diamondfire_exporter.settings.mod'
					),
					description: API.translate(
						'animated_java.exporters.diamondfire_exporter.settings.mod.description'
					).split('\n'),
					defaultValue: 0,
					options: [
						{
							name: 'Recode',
							value: 'Recode',
						},
						{
							name: 'Codeclient',
							value: 'Codeclient',
						},
					],
				}),
			}
		},
		settingsStructure: [
			{
				type: 'setting',
				settingId: 'animated_java:diamondfire_exporter/mod',
			},
		],
		async export(exportOptions) {
			console.log('Export Options:', exportOptions)

			let item = await getItem(exportOptions)

			if (exportOptions.exporterSettings.minecraft_mod._value == 0) {
				console.log('Sending data to Recode')

				const packet = `{"source":"Blockbench","type":"nbt","data":"${item}"}`

				const ws = new WebSocket('ws://localhost:31371')
				ws.addEventListener('open', _ => {
					ws.send(packet)
				})
			} else if (exportOptions.exporterSettings.minecraft_mod._value == 1) {
				console.log('Connecting to Codeclient')

				const packet = `give ${item.replaceAll('\\"', '"')}`

				const ws = new WebSocket('ws://localhost:31375')
				ws.addEventListener('open', _ => {
					ws.send(packet)
				})
			}
		},
	})
}
