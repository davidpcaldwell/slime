//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.tools.install.deprecated {
	export interface Context {
		library: {
			web: slime.web.Exports
			file: slime.jrunscript.file.Exports
			shell: slime.jrunscript.shell.Exports
		}

		extract: {
			zip: slime.jrunscript.tools.install.distribution.Format["extract"],
			gzip?: slime.jrunscript.tools.install.distribution.Format["extract"]
		}

		getPrefix: { [format: string]: (basename: string) => string }

		getDefaultName: (url: string) => string

		downloads: slime.jrunscript.file.Directory
		client: slime.jrunscript.http.client.object.Client
	}

	export interface Exports {
		oldGet: slime.jrunscript.tools.install.Exports["get"]

		get: (
			p: slime.jrunscript.tools.install.old.WorldSource,
			events: slime.$api.event.Emitter<{ console: string }>
		) => slime.jrunscript.tools.install.old.WorldSource

		install: (
			p: slime.jrunscript.tools.install.old.Installation,
			events: slime.$api.event.Emitter<{ console: string }>
		) => slime.jrunscript.file.Directory

		oldInstall: (
			p: Parameters<Exports["install"]>[0],
			receiver: slime.$api.event.Function.Receiver<{ console: string }>
		) => slime.jrunscript.file.Directory

		formats: slime.jrunscript.tools.install.old.Formats
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {

			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
