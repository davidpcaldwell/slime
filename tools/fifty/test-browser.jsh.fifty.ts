//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.fifty.browser.test.internal.script {
	export interface Context {
	}

	export interface Chrome {
		location: slime.jrunscript.file.Pathname
		devtools: boolean
		debugPort: number
	}

	export interface Browser {
		open: (p: {
			host: string
			port: number
			paths: {
				toHtmlRunner: string
				toFile: string
				results: string
			}
			delay: number
			part: string
		}) => void

		close: () => void
	}

	export interface Exports {
	}

	(
		function(
			fifty: slime.fifty.test.kit
		) {
			fifty.tests.suite = function() {

			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
