namespace slime.jsh.plugin {
	type plugin = (p: { isReady?: () => boolean, load: () => void }) => void;
	type plugins = { [x: string]: any }
}

namespace slime.jsh.loader.internal.plugins {
	interface Export {
		mock: (p: {
			global?: { [x: string]: any }
			jsh?: { [x: string]: any }
			plugins?: { [x: string]: any }
			$loader: slime.Loader
		}) => {
			global: { [x: string]: any },
			jsh: { [x: string]: any },
			plugins: { [x: string]: any }
		}

		load: {
			(p: {
				_file?: slime.jrunscript.native.java.io.File
				loader?: slime.Loader
				zip?: {
					_file: slime.jrunscript.native.java.io.File
				}
			}): void
		}
	}
}