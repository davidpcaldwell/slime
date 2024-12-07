//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.tools.install {
	export interface Exports {
		/**
		 * @deprecated
		 *
		 * Returns a file containing an installer, either using a specified local file or a specified URL. If `file` is absent or
		 * `null`, the method will attempt to locate it in the `$context.downloads` directory by `name`. If it is not found, and the
		 * `url` property is provided, the file will be downloaded.
		 *
		 * @returns A file containing the installer.
		 */
		get: (
			p: old.Source,
			events?: old.events.Receiver
		) => slime.jrunscript.file.File

		/** @deprecated */
		find: (p: old.WorldSource) => slime.$api.fp.world.old.Ask<old.events.Console,string>
	}
}

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

		find: slime.jrunscript.tools.install.Exports["find"]

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
