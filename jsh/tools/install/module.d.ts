//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh.tools.install.module {
	interface Context {
		client?: any
		api: {
			shell: any
			file: any
			http: any
		}
		downloads: any
	}

	interface Exports {
		format: any

		get: (
			p: { file?: slime.jrunscript.file.File, url?: string, name?: string },
			events?: slime.$api.Events.Function.Receiver
		) => slime.jrunscript.file.File

		install: (p: {
			name?: string,
			getDestinationPath?: (file: slime.jrunscript.file.File) => string,
			url?: any,
			file?: slime.jrunscript.file.File,
			format?: any,
			to: slime.jrunscript.file.Pathname,
			replace?: boolean
		}, events?: $api.Events.Function.Receiver) => slime.jrunscript.file.Directory

		gzip: any
		zip: any
		apache: any
		$api: any
	}
}