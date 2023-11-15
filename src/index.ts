import { PACKAGE } from './constants'
import { events } from './util/events'
import './util/translation'

import './blueprintFormat'

// Blockbench Mods
import './mods/projectSettingsActionOverride'
import './mods/animationControllerMod'
import './mods/saveAllAnimationsActionMod'
import './mods/panelMod'
import './mods/saveProjectActionMod'
import './mods/saveProjectAsActionMod'
import './mods/exportOverActionMod'

// @ts-ignore
globalThis.AnimatedJava = {
	API: {},
}

// Uninstall events
events.EXTRACT_MODS.subscribe(() => {
	// @ts-ignore
	globalThis.AnimatedJava = undefined
})

BBPlugin.register(PACKAGE.name, {
	title: PACKAGE.title,
	author: PACKAGE.author.name,
	description: PACKAGE.description,
	icon: 'icon-armor_stand',
	variant: 'desktop',
	version: PACKAGE.version,
	min_version: PACKAGE.min_blockbench_version,
	tags: ['Minecraft: Java Edition', 'Animation', 'Display Entities'],
	await_loading: true,
	onload() {
		events.LOAD.dispatch()
	},
	onunload() {
		events.UNLOAD.dispatch()
	},
	oninstall() {
		events.INSTALL.dispatch()
	},
	onuninstall() {
		events.UNINSTALL.dispatch()
	},
})
