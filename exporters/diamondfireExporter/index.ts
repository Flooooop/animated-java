import { loadExporter } from './diamondfireExporter'

requestAnimationFrame(function repeat() {
	if (AnimatedJava?.loaded) loadExporter()
	else requestAnimationFrame(repeat)
})
