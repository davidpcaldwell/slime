//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh {
	export interface Global {
		//	TODO	this nasty little workaround is needed because of name collisions between loader/document and
		//			rhino/document

		/**
		 * `jsh` plugin for runtime and `jrunscript` document implementations.
		 */
		document: slime.runtime.document.Exports & slime.jrunscript.document.Exports
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api, jsh } = fifty.global;

			const shells = (
				function() {
					var script: slime.jsh.test.Script = fifty.$loader.script("../../jrunscript/jsh/fixtures.ts");
					return script().shells(fifty);
				}
			)();

			fifty.tests.suite = function() {
				var stdio = function(): slime.jrunscript.shell.run.Intention["stdio"] {
					return {
						output: "string"
					};
				};

				var evaluate = function(result: jrunscript.shell.run.Exit) {
					verify(result).status.is(0);
					return JSON.parse(result.stdio.output);
				}

				var shell = shells.unbuilt();

				var src = $api.fp.now(
					shell,
					$api.fp.property("src"),
					jsh.file.Location.from.os
				);

				var jsoupLocation = $api.fp.now(
					src,
					jsh.file.Location.directory.relativePath("local/jsh/lib/jsoup.jar")
				);

				var hasJsoup = $api.fp.now(
					jsoupLocation,
					jsh.file.Location.file.exists.simple
				);

				if (true && hasJsoup) {
					var intention = shell.invoke({
						script: fifty.jsh.file.relative("test/html-parser.jsh.js").pathname,
						stdio: stdio()
					});
					var result = $api.fp.world.Sensor.now({
						sensor: jsh.shell.subprocess.question,
						subject: intention
					});
					var jsoup: { parser: string } = evaluate(result);
					verify(jsoup).parser.is("jsoup");
				} else {
					const message = "JSoup not present.";
					verify(message).is(message);
				}

				//	We no longer assume the JavaFX browser is available, so do not test it
				if (false) {
					// var EMPTY = jsh.shell.TMPDIR.createTemporary({ directory: true });
					// var javafx = jsh.shell.jsh({
					// 	shell: $jsapi.environment.jsh.unbuilt.src,
					// 	script: $jsapi.loader.getRelativePath("test/html-parser.jsh.js").file,
					// 	environment: Object.assign({}, jsh.shell.environment, { JSH_SHELL_LIB: EMPTY.toString() }),
					// 	stdio: stdio(),
					// 	evaluate: evaluate
					// });
					// verify(javafx).parser.is("javafx");
					verify(false).is(true);
				}
			}
		}
	//@ts-ignore
	)(fifty);
}
