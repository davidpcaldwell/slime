//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

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
			$slime?: slime.jsh.plugin.$slime
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