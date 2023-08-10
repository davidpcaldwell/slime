//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.jsh.test {
	export interface Shells {
		unbuilt: slime.$api.fp.impure.Input<slime.jsh.shell.UnbuiltInstallation>
		built: slime.$api.fp.impure.Input<slime.jsh.shell.BuiltInstallation>
		packaged: slime.$api.fp.impure.Input<string>
		remote: slime.$api.fp.impure.Input<string>
	}

	export interface Exports {
		shells: Shells
	}

	(
		function($api: slime.$api.Global, jsh: slime.jsh.Global, $export: slime.loader.Export<Exports>) {
			// var getTemporaryLocationProperty: (name: string) => slime.$api.fp.impure.Input<string> = function() {

			// }

			// var inTemporaryLocation = function(p: {
			// 	propertyName: string
			// 	build: (destination: string) => void
			// }) {
			// 	var location =
			// }
			$export({
				shells: {
					unbuilt: function(): slime.jsh.shell.UnbuiltInstallation {
						return {
							src: jsh.shell.jsh.src.pathname.toString()
						};
					},
					built: function() {
						//	TODO	should store result in system property so that it is cached across loads of this file as well as
						//			individual invocations
						var TMPDIR = $api.fp.world.now.question(
							jsh.file.Location.from.temporary(jsh.file.world.filesystems.os),
							{
								directory: true
							}
						);

						var isUnbuilt = jsh.shell.jsh.Installation.is.unbuilt;

						//	TODO	can we use jrunscript/jsh/tools/shell.jsh.js
						var getShellToolScript = jsh.file.Location.directory.relativePath("jrunscript/jsh/tools/shell.jsh.js");

						var current = jsh.shell.jsh.Installation.from.current();
						if (isUnbuilt(current)) {
							var rhino: slime.$api.fp.Maybe<slime.jrunscript.file.Location> = $api.fp.now.invoke(
								current,
								$api.fp.property("src"),
								jsh.file.Location.from.os,
								jsh.file.Location.directory.relativePath("local/jsh/lib/js.jar"),
								function(location) {
									var exists = $api.fp.world.mapping(jsh.file.Location.file.exists())(location);
									return (exists) ? $api.fp.Maybe.from.some(location) : $api.fp.Maybe.from.nothing();
								}
							);

							var asJshIntention: slime.$api.fp.Identity<slime.jsh.shell.Intention> = $api.fp.identity;

							$api.fp.now.invoke(
								asJshIntention({
									shell: current,
									script: getShellToolScript(jsh.file.Location.from.os(current.src)).pathname,
									arguments: $api.Array.build(function(rv) {
										rv.push("build");
										rv.push("--destination", TMPDIR.pathname);
										if (rhino.present) rv.push("--rhino", rhino.value.pathname);
									}),
									stdio: {
										output: "line",
										error: "line"
									}
								}),
								jsh.shell.jsh.Intention.toShellIntention,
								$api.fp.world.output(
									jsh.shell.subprocess.action,
									{
										stdout: function(e) {
											jsh.shell.console("jsh build STDOUT: " + e.detail.line);
										},
										stderr: function(e) {
											jsh.shell.console("jsh build STDERR: " + e.detail.line);
										}
									}
								)
							);

							var canonical = String(jsh.file.Pathname(TMPDIR.pathname).java.adapt().getCanonicalPath());
							return {
								home: canonical
							}
						} else {
							throw new Error();
						}
					},
					packaged: function() {
						return void(0);
					},
					remote: function() {
						return void(0);
					}
				}
			});
		}
	//@ts-ignore
	)($api, (function() { return this; })().jsh, $export);

	export type Script = slime.loader.Script<void,Exports>;
}
