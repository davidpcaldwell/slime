//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh.test {
	export namespace shells {
		export type Invocable = {
			invoke: (
				p: {
					//	Not provided for packaged shells
					script?: string
					arguments?: string[]
				}
				& Partial<Pick<slime.jrunscript.shell.run.Intention,"environment"|"directory"|"stdio">>
			) => slime.jrunscript.shell.run.Intention
		}

		export namespace remote {
			export type Settings = Omit<slime.jsh.test.remote.Settings,"mock">
		}

		export interface Remote {
			//	TODO	not strictly pertaining to the shell, but rather to mock GitHub. Should refactor.
			getLoaderProperties: () => { [name: string]: string }

			/**
			 * Creates a shell intention that represents a command that downloads the remote `jsh` launcher and then executes it
			 * with appropriate configuration in order to run the given script.
			 *
			 * The `Intention` returned captures standard output and standard error as strings.
			 */
			getShellIntention: (p: {
				PATH: slime.jrunscript.file.Searchpath
				settings: remote.Settings

				/**
				 * A script to run, which can represent a local pathname or URL.
				 */
				script: string
			}) => slime.jrunscript.shell.run.Intention

			getSlimeUrl: (p: {
				path: string
			}) => string
		}
	}

	export interface Shells {
		unbuilt: slime.$api.fp.Thunk<
			slime.jsh.shell.UnbuiltInstallation
			& shells.Invocable
		>

		built: slime.$api.fp.Mapping<
			boolean,
			(
				slime.jsh.shell.BuiltInstallation
				& shells.Invocable
			)
		>

		/**
		 * Maps an operating system pathname to a packaged shell.
		 */
		packaged: slime.$api.fp.Mapping<
			string,
			(
				slime.jsh.shell.PackagedInstallation
				& shells.Invocable
			)
		>

		remote: slime.$api.fp.impure.External<shells.Remote>
	}

	export interface Exports {
		/**
		 * Returns a set of shells for this Fifty session.
		 */
		shells: (fifty: slime.fifty.test.Kit) => Shells
	}

	(
		function(Packages: slime.jrunscript.Packages, $api: slime.$api.Global, jsh: slime.jsh.Global, $export: slime.loader.Export<Exports>) {
			var memoizeMap: <T,R>(f: (t: T) => R) => (t: T) => R = function<T,R>(f: (t: T) => R) {
				var map: Map<T,R> = new Map();
				return function(t: T) {
					var cached = map.get(t);
					if (!cached) {
						cached = f(t);
						map.set(t, cached);
					}
					return cached;
				}
			}

			var asJshIntention: slime.$api.fp.Identity<slime.jsh.shell.Intention> = $api.fp.identity;

			var unbuilt = function(): slime.jsh.shell.UnbuiltInstallation {
				return {
					src: jsh.shell.jsh.src.pathname.toString()
				};
			};

			var remote = function(): shells.Remote {
				var current = jsh.shell.jsh.Installation.from.current();

				if (jsh.shell.jsh.Installation.is.unbuilt(current)) {
					var slime = jsh.file.Location.from.os(current.src);

					var loader = jsh.file.Location.directory.loader.synchronous({ root: slime });

					var code: {
						testing: slime.jrunscript.tools.github.internal.test.Script
					} = {
						testing: jsh.loader.synchronous.scripts(loader)("rhino/tools/github/test/module.js") as slime.jrunscript.tools.github.internal.test.Script
					};

					var library = {
						testing: code.testing({
							slime: jsh.file.object.directory(slime),
							library: {
								shell: jsh.shell
							}
						})
					};

					var server = library.testing.startMock(jsh);

					return {
						getLoaderProperties: function() {
							return {
								"http.proxyHost": "127.0.0.1",
								"http.proxyPort": String(server.port)
							};
						},
						getShellIntention: function(p) {
							return library.testing.getShellIntention({
								PATH: p.PATH,
								script: p.script,
								settings: $api.Object.compose(
									p.settings,
									{ mock: server }
								)
							})
						},
						getSlimeUrl: function(p) {
							return "http://raw.githubusercontent.com/davidpcaldwell/slime/local/" + p.path
						}
					};
				} else {
					throw new Error();
				}
			}


			$export({
				shells: function(fifty) {
					if (!fifty.global["jrunscript/jsh/fixtures.ts:shells"]) {
						var shells: Shells = {
							unbuilt: function() {
								return {
									src: unbuilt().src,
									invoke: $api.fp.pipe(
										function(p): slime.jsh.shell.Intention {
											//	TODO	this must be elsewhere
											var properties = /^http(s?)\:/.test(p.script) ? remote().getLoaderProperties() : {}
											return {
												shell: unbuilt(),
												script: p.script,
												arguments: p.arguments,
												environment: p.environment,
												properties: properties,
												directory: p.directory,
												stdio: p.stdio
											}
										},
										jsh.shell.jsh.Intention.toShellIntention
									)
								}
							},
							built: memoizeMap(
								function(executable) {
									//	TODO #1704	in Docker test environments, provide gcc
									if (executable && !jsh.shell.PATH.getCommand("gcc")) return null;
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
												var exists = $api.fp.world.mapping(jsh.file.Location.file.exists.world())(location);
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
													if (executable) rv.push("--executable");
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
											home: canonical,
											invoke: $api.fp.pipe(
												function(p): slime.jsh.shell.Intention {
													return {
														shell: {
															home: canonical
														},
														script: p.script,
														arguments: p.arguments,
														environment: p.environment,
														directory: p.directory,
														stdio: p.stdio
													}
												},
												jsh.shell.jsh.Intention.toShellIntention
											)
										};
									} else {
										throw new Error();
									}
								}
							),
							packaged: memoizeMap(
								function(script) {
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
												rv.push("--script", script);
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

									return {
										package: to.pathname,
										invoke: $api.fp.pipe(
											function(p): slime.jsh.shell.Intention {
												return {
													package: to.pathname,
													arguments: p.arguments,
													environment: p.environment,
													directory: p.directory,
													stdio: p.stdio
												}
											},
											jsh.shell.jsh.Intention.toShellIntention
										)
									};
								}
							),
							remote: $api.fp.impure.Input.memoized(remote)
						}
						fifty.global["jrunscript/jsh/fixtures.ts:shells"] = shells;
					}
					return fifty.global["jrunscript/jsh/fixtures.ts:shells"];
				}
			});
		}
	//@ts-ignore
	)(Packages, $api, (function() { return this; })().jsh, $export);

	export type Script = slime.loader.Script<void,Exports>;
}
