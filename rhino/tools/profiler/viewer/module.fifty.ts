//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.tools.profiler.rhino.viewer {
	export interface Scope {
		$context: Context
		$loader: slime.Loader
	}

	export interface Context {
		console: (message: string) => void
		profiles: slime.jrunscript.tools.profiler.rhino.Profile[]
		to: {
			html?: {
				location: slime.jrunscript.file.Pathname
				inline: {
					css: boolean
					json: boolean
					js: boolean
				}
			}
			json?: {
				location: slime.jrunscript.file.Pathname
			}
		}
	}
}
