namespace jsh.plugin {
	type plugin = (p: { isReady?: () => boolean, load: () => void }) => void;
}

namespace jsh.loader.internal.plugins {
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
				_file?: Packages.java.io.File
				loader?: slime.Loader
				zip?: {
					_file: Packages.java.io.File
				}
			}): void
		}
	}
}