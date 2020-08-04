namespace jsh.plugin {
	const plugin: (p: { isReady: () => boolean, load: () => void }) => void;
}

namespace jsh.loader.plugins {
	interface Export {
		mock: (p: {
			global?: { [x: string]: any }
			jsh?: { [x: string]: any }
			plugins?: { [x: string]: any }
			$loader: slime.Loader
		}) => { global: { [x: string]: any }, jsh: { [x: string]: any }, plugins: { [x: string]: any } }
		load: any
	}
}