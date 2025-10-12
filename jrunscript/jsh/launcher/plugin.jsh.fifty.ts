//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh {
	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.manual = {};
		}
	//@ts-ignore
	)(fifty);

	export interface Global {
		internal: {
			bootstrap: slime.jsh.internal.launcher.Global["$api"]

			api: {
				Library: slime.$api.fp.Mapping<slime.internal.jrunscript.bootstrap.Library,slime.internal.jrunscript.bootstrap.api.Library>
			}
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { jsh } = fifty.global;

			fifty.tests.manual.plugin = function() {
				jsh.shell.console(String(jsh.internal.bootstrap));
			}
		}
	//@ts-ignore
	)(fifty);
}

namespace slime.internal.jrunscript.bootstrap.api {
	export interface Library {
		version: string
		download: (directory: slime.jrunscript.file.Location) => slime.jrunscript.file.Location[]
		local: (directory: slime.jrunscript.file.Location) => slime.jrunscript.file.Location[]
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { $api, jsh } = fifty.global;

			fifty.tests.manual.library = function() {
				var rhino = $api.fp.now(
					jsh.internal.bootstrap.java.getMajorVersion(),
					jsh.internal.bootstrap.rhino.forJava,
					jsh.internal.api.Library
				);
				var local = rhino.local( fifty.jsh.file.relative("../../../local/jsh/lib") );
				jsh.shell.console(String(local.map(function(it) { return it.pathname; })));
			}
		}
	//@ts-ignore
	)(fifty);
}
