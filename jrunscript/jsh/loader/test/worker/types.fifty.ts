//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.native.inonit.script.jsh {
	export interface Shell {
		onMessage: any
		postMessage: any
	}
}

namespace slime.jsh.loader {
	export interface Worker {
		postMessage: (value: slime.$api.fp.Data) => void
		terminate: () => void
	}

	export interface Exports {
		worker: {
			create: (p: {
				script: slime.jrunscript.file.File
				arguments: string[]
				onmessage: (e: slime.$api.Event<any>) => void
			}) => Worker

			onmessage: (handler: (e: slime.$api.Event<any>) => void) => void

			postMessage: (value: slime.$api.fp.Data) => void
		}
	}
}
