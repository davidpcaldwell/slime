//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.tools.install.deprecated {
	export interface Context {
		library: {
			file: slime.jrunscript.file.Exports
			shell: slime.jrunscript.shell.Exports
		}

		urlToString: (url: slime.jrunscript.http.client.request.url) => string
		getDefaultName: (url: string) => string
		formats: slime.jrunscript.tools.install.old.Formats

		downloads: slime.jrunscript.file.Directory
		client: slime.jrunscript.http.client.object.Client
	}

	export interface Exports {
		get: (
			p: slime.jrunscript.tools.install.old.WorldSource,
			events: slime.$api.event.Emitter<{ console: string }>
		) => slime.jrunscript.tools.install.old.WorldSource

		// * @param { slime.jrunscript.tools.install.old.Installation } p
		// * @param { slime.$api.event.Emitter<{ console: string }> } events
		// * @returns { slime.jrunscript.file.Directory }
		install: (
			p: slime.jrunscript.tools.install.old.Installation,
			events: slime.$api.event.Emitter<{ console: string }>
		) => slime.jrunscript.file.Directory

		oldInstall: (
			p: Parameters<Exports["install"]>[0],
			receiver: slime.$api.event.Function.Receiver<{ console: string }>
		) => slime.jrunscript.file.Directory
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
