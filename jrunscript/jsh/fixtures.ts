//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.jsh.test {
	export interface Shells {
		unbuilt: slime.$api.fp.impure.Input<slime.jsh.shell.UnbuiltInstallation>
		built: slime.$api.fp.impure.Input<slime.jsh.shell.BuiltInstallation>
		packaged: slime.$api.fp.impure.Input<slime.jsh.shell.PackagedInstallation>
		remote: slime.$api.fp.impure.Input<slime.jsh.shell.UrlInstallation>
	}

	export interface Exports {
		shells: Shells
	}

	(
		function(Packages: slime.jrunscript.Packages, $api: slime.$api.Global, jsh: slime.jsh.Global, $export: slime.loader.Export<Exports>) {
			var getTemporaryLocationProperty: (name: string) => slime.$api.fp.impure.Input<string> = function(name: string) {
				return function() {
					return jsh.java.vm.properties()[name];
				}
			};

			var inTemporaryLocation = function(p: {
				propertyName: string
				build: () => string
			}): string {
				var location = getTemporaryLocationProperty(p.propertyName)();
				if (!location) {
					location = p.build();
					jsh.java.vm.setProperty(p.propertyName)(location);
				}
				return location;
			}

			var asJshIntention: slime.$api.fp.Identity<slime.jsh.shell.Intention> = $api.fp.identity;

			var unbuilt = function(): slime.jsh.shell.UnbuiltInstallation {
				return {
					src: jsh.shell.jsh.src.pathname.toString()
				};
			};

			$export({
				shells: {
					unbuilt: unbuilt,
					built: function() {
						var rv = inTemporaryLocation({
							propertyName: "slime.jrunscript.jsh.test.built",
							build: function() {
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
									return canonical;
								} else {
									throw new Error();
								}
							}
						});
						return {
							home: rv
						};
					},
					packaged: function() {
						var rv = inTemporaryLocation({
							propertyName: "slime.jrunscript.jsh.test.packaged",
							build: function() {
								var to = jsh.file.Location.canonicalize($api.fp.world.now.question(
									jsh.file.Location.from.temporary(jsh.file.world.filesystems.os),
									{
										directory: false,
										suffix: ".jar"
									}
								));

								var at = $api.fp.now.invoke(
									unbuilt(),
									$api.fp.property("src"),
									jsh.file.Location.from.os,
									jsh.file.Location.directory.base,
									function(base) {
										return function(path: string) {
											return base(path).pathname;
										}
									}
								);

								var build = $api.fp.now.invoke(
									asJshIntention({
										shell: unbuilt(),
										script: at("jrunscript/jsh/tools/shell.jsh.js"),
										arguments: $api.Array.build(function(rv) {
											rv.push("package");
											rv.push("--script", at("jrunscript/jsh/test/jsh-data.jsh.js")),
											rv.push("--to", to.pathname);
										}),
										stdio: {
											output: "line",
											error: "line"
										}
									}),
									jsh.shell.jsh.Intention.toShellIntention,
									$api.fp.world.mapping(
										jsh.shell.subprocess.question,
										{
											stdout: function(e) {
												jsh.shell.console("package.jsh.js OUTPUT: " + e.detail.line);
											},
											stderr: function(e) {
												jsh.shell.console("package.jsh.js CONSOLE: " + e.detail.line);
											}
										}
									)
								);

								if (build.status != 0) throw new Error("package.jsh.js exit status: " + build.status);

								return to.pathname;
							}
						});
						return {
							package: rv
						};
					},
					remote: function() {
						var current = jsh.shell.jsh.Installation.from.current();

						if (jsh.shell.jsh.Installation.is.unbuilt(current)) {
							var loader = jsh.file.Location.directory.loader.synchronous({ root: jsh.file.Location.from.os(current.src) });

							var code: {
								testing: slime.jrunscript.tools.github.internal.test.Script
							} = {
								testing: jsh.loader.synchronous.script("rhino/tools/github/test/module.js")(loader)
							};

							var library = {
								testing: code.testing({
									slime: jsh.file.object.directory(slime)
								})
							};

							return void(0);
						} else {
							throw new Error();
						}
					}
				}
			});
		}
	//@ts-ignore
	)(Packages, $api, (function() { return this; })().jsh, $export);

	export type Script = slime.loader.Script<void,Exports>;
}
