// @ts-ignore
import en from './lang/en.yaml'
// @ts-ignore
import de from './lang/de.yaml'
// @ts-ignore
import zh from './lang/zh_cn.yaml'

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
							value: 'recode',
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

			const json = constructJSON(exportOptions)

			console.log('Exported JSON:', json)

			await fs.promises.writeFile(
				exportOptions.exporterSettings.output_file.value,
				exportOptions.ajSettings.minify_output.value
					? JSON.stringify(json)
					: JSON.stringify(json, null, '\t')
			)
		},
	})
}
