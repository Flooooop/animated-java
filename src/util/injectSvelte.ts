import { SvelteComponent } from 'svelte'
import { pollPromise } from './promises'
import { createBlockbenchMod } from '../util/moddingTools'

export function injectSvelteCompomponent(options: {
	// @ts-ignore
	svelteComponent: SvelteComponentConstructor<SvelteComponent, any>
	svelteComponentProperties: Record<string, any>
	elementFinder: () => Element | undefined | null
	prepend?: boolean
	postMount?: (el: Element) => void
}) {
	void pollPromise(options.elementFinder).then(el => {
		let anchor = undefined
		if (options.prepend) {
			anchor = el.children[0]
		}
		new options.svelteComponent({
			target: el,
			anchor,
			props: options.svelteComponentProperties,
		})
		if (options.postMount) options.postMount(el)
	})
}

export function injectSvelteCompomponentMod(options: {
	// @ts-ignore
	svelteComponent: SvelteComponentConstructor<SvelteComponent, any>
	svelteComponentArgs: Record<string, any>
	elementSelector: () => Element | undefined | null
	postMount?: (el: Element) => void
}) {
	createBlockbenchMod(
		`animated_java:injected_svelte_component[${
			options.svelteComponent.name as string
		}](${guid()})`,
		{},
		() => {
			let instance: SvelteComponent | undefined
			void pollPromise(options.elementSelector).then(el => {
				instance = new options.svelteComponent({
					target: el,
					props: options.svelteComponentArgs,
				})
				if (options.postMount) options.postMount(el)
			})
			return instance
		},
		context => {
			if (context) context.$destroy()
		}
	)
}
