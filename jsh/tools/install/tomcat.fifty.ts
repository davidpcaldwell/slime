//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh.shell.tools {
	export namespace tomcat {
		export type Version = {
			toString(): string
		}

		export type Installation = {
			version: Version
		}

		//	TODO	because this is Java, it's possible that we don't need a native filesystem to do this; we might be able to run
		//			it directly out of other Location objects. But for now we assume a native filesystem and use only the base
		//			property.
		export type Installed = {
			base: string
		}

		export namespace install {
			export type Events = {
				console: string
				installed: {
					to: slime.jrunscript.file.Pathname
				}
			}
		}

		export namespace installation {
			export type Events = {
				unzipping: {
					local: string
					to: string
				}
				installing: {
					to: string
				}
				installed: {
					version: string
				}
			}
		}

		export interface World {
			getLatestVersion: slime.$api.fp.world.Question<number,void,slime.$api.fp.Maybe<string>>
			findApache: slime.jsh.Global["tools"]["install"]["apache"]["find"]
		}

		export type Mock = Partial<World>

		export namespace old {
			export type Argument = {
				mock?: {
					lib?: slime.jrunscript.file.Directory
					getLatestVersion?: () => string
					findApache?: slime.jsh.Global["tools"]["install"]["apache"]["find"]
				}
				to?: slime.jrunscript.file.Pathname
				replace?: boolean
				version?: string
				local?: slime.jrunscript.file.File
			}

			export type Handler = slime.$api.event.Handlers<tomcat.install.Events>
		}

		export interface Exports {
			input: {
				getDefaultMajorVersion: slime.$api.fp.impure.Input<number>
			}

			Installation: {
				from: {
					jsh: () => slime.jsh.shell.tools.tomcat.Installed
				}

				getVersion: (installation: slime.jsh.shell.tools.tomcat.Installed) => slime.$api.fp.Maybe<string>

				install: (installation: slime.jsh.shell.tools.tomcat.Installed) => slime.$api.fp.world.Action<{
					world?: tomcat.Mock
					version?: string
				},slime.jsh.shell.tools.tomcat.installation.Events>

				require: (installation: slime.jsh.shell.tools.tomcat.Installed) => slime.$api.fp.world.Action<
					{
						world?: tomcat.Mock
						version?: string
						replace?: (version: string) => boolean
					},
					slime.jsh.shell.tools.tomcat.installation.Events & {
						found: { version: string }
					}
				>
			}

			old: {
				/** @deprecated */
				require: (
					argument?: {
						world?: tomcat.Mock
						version?: string
						replace?: (version: string) => boolean
					},
					handler?: slime.$api.event.Handlers<{
						console: string
					}>
				) => void
			}
		}
	}

	export interface Exports {
		tomcat: slime.jsh.shell.tools.tomcat.Exports
	}
}

namespace slime.jsh.shell.tools.internal.tomcat {
	export interface Context {
		$api: slime.$api.Global
		jsh: slime.jsh.Global
	}

	export interface Exports extends slime.jsh.shell.tools.tomcat.Exports {
		test: {
			//	TODO	world test coverage only
			getReleaseNotes: slime.$api.fp.world.Question<slime.jsh.shell.tools.tomcat.Installed,void,slime.$api.fp.Maybe<string>>

			getVersion: (releaseNotes: string) => string

			getLatestVersion: slime.$api.fp.world.Question<number,{ online: { major: number, latest: slime.$api.fp.Maybe<string> } },string>
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api, jsh } = fifty.global;
			const subject = jsh.shell.tools.tomcat as Exports;

			var majorVersion = subject.input.getDefaultMajorVersion();

			var orNull = function<T>(maybe: slime.$api.fp.Maybe<T>): T {
				if (maybe.present) return maybe.value;
				return null;
			}

			var MockReleaseNotes = function(version: string) {
				return fifty.$loader.get("test/data/tomcat-release-notes-7.0.70.txt").read(String).replace(/7\.0\.70/g, version);
			}

			var MockDistribution = function(version) {
				return function(events) {
					var tmpdir = jsh.shell.TMPDIR.createTemporary({ directory: true });
					var dist = tmpdir.getRelativePath("apache-tomcat-" + version).createDirectory();
					dist.getRelativePath("a").write("a", { append: false });
					dist.getRelativePath("RELEASE-NOTES").write(MockReleaseNotes(version), { append: false });
					var rv = jsh.shell.TMPDIR.createTemporary({ suffix: ".zip" }).pathname;
					jsh.io.archive.zip.encode({
						stream: rv.write(jsh.io.Streams.binary, { append: false }),
						entries: [
							//@ts-ignore
							{ path: "apache-tomcat-" + version + "/" + "RELEASE-NOTES", resource: dist.getFile("RELEASE-NOTES") },
							//@ts-ignore
							{ path: "apache-tomcat-" + version + "/" + "a", resource: dist.getFile("a") }
						]
					});
					return rv.file;
				}
			}

			var mock = {
				lib: jsh.shell.TMPDIR.createTemporary({ directory: true }),
				getLatestVersion: function(major) {
					return function(events) {
						return $api.fp.Maybe.value(major + ".0.99");
					}
				},
				findApache: function(o) {
					if (o.path == "tomcat/tomcat-9/v9.0.98/bin/apache-tomcat-9.0.98.zip") return MockDistribution("9.0.98");
					if (o.path == "tomcat/tomcat-9/v9.0.99/bin/apache-tomcat-9.0.99.zip") return MockDistribution("9.0.99");
					throw new Error("Mock: " + o.path);
				}
			};

			//	TODO	switch to Fifty standard implementation
			var Captor = function(array,types) {
				types.forEach(function(type) {
					this[type] = function(e) {
						array.push(e);
					}
				},this);
			};

			fifty.tests.getVersion = function() {
				var notes = MockReleaseNotes("3.4.5");
				var version = subject.test.getVersion(notes);
				verify(version).is("3.4.5");
			}

			fifty.tests.install = function() {
				var installation = { base: mock.lib.getRelativePath("tomcat").toString() };

				var events: slime.$api.Event<any>[] = [];
				$api.fp.world.now.action(
					subject.Installation.install(installation),
					{ world: mock },
					new Captor(events,["unzipping","installing","installed"])
				);
				verify(events).length.is(3);
				verify(events)[0].type.is("unzipping");
				verify(events)[1].type.is("installing");
				verify(events)[2].type.is("installed");
				verify(events)[2].detail.evaluate(function(detail): string { return detail.version; }).is(majorVersion + ".0.99");
				verify(mock.lib).getSubdirectory("tomcat").getFile("a").is.type("object");
				verify(mock.lib).getSubdirectory("tomcat").getFile("b").is.type("null");
				var installed = subject.Installation.getVersion(installation);
				var version = orNull(installed);
				verify(version).is(majorVersion + ".0.99");
				mock.lib.getSubdirectory("tomcat").remove();
			}

			fifty.tests.replace = function() {
				const VERSION = majorVersion + ".0.98";
				const LATEST = majorVersion + ".0.99";

				var installation = { base: mock.lib.getRelativePath("tomcat").toString() };
				var events = ["unzipping","installing","installed","found"];

				$api.fp.world.now.action(
					subject.Installation.install(installation),
					{ world: mock, version: VERSION }
				);
				var installed = subject.Installation.getVersion(installation);
				verify(installed).evaluate(orNull).is(VERSION);

				var noreplace = [];
				$api.fp.world.now.action(
					subject.Installation.require(installation),
					{ world: mock },
					new Captor(noreplace,events)
				);
				installed = subject.Installation.getVersion(installation);
				verify(installed).evaluate(orNull).is(VERSION);
				verify(noreplace).length.is(1);
				verify(noreplace)[0].detail.evaluate(function(detail): string { return detail.version; }).is(VERSION);

				debugger;
				var replace = [];
				$api.fp.world.now.action(
					subject.Installation.require(installation),
					{
						world: mock,
						replace: function(version) { return true; }
					},
					new Captor(replace,events)
				)
				installed = subject.Installation.getVersion(installation);
				verify(installed).evaluate(orNull).is(LATEST);
				verify(replace).length.is(4);

				mock.lib.getSubdirectory("tomcat").remove();
			};

			var jshInvocation = function(p: {
				shell: {
					jdks: slime.jrunscript.file.world.Location
					lib: slime.jrunscript.file.world.Location
				}
				script: slime.jrunscript.file.world.Location
			}): slime.jrunscript.shell.run.Invocation {
				var invocation = jsh.shell.Invocation.from.argument({
					command: "bash",
					arguments: $api.Array.build(function(rv) {
						rv.push(fifty.jsh.file.relative("../../../jsh.bash").pathname);
						rv.push(p.script.pathname);
					}),
					environment: $api.Object.compose(
						jsh.shell.environment,
						{
							JSH_LOCAL_JDKS: p.shell.jdks.pathname,
							JSH_USER_JDKS: "/dev/null",
							JSH_SHELL_LIB: p.shell.lib.pathname
						}
					),
					stdio: {
						output: "line",
						error: "line"
					}
				});
				return invocation;
			}

			fifty.tests.addToShellAtRuntime = function() {
				//	TODO	we use local JDK downloads when available, but do not seem to say so in the output of jsh.bash
				var shell = {
					jdks: fifty.jsh.file.temporary.directory(),
					lib: fifty.jsh.file.temporary.directory()
				};

				var getInvocation = function(script) {
					return jshInvocation({
						shell: shell,
						script: script
					})
				}

				var invokeTomcatRequire = getInvocation(fifty.jsh.file.relative("test/require-tomcat.jsh.js"));

				var getCommandResult = $api.fp.world.mapping(
					jsh.shell.world.question,
					{
						stdout: function(e) {
							jsh.shell.console("STDOUT: " + e.detail.line);
						},
						stderr: function(e) {
							jsh.shell.console("STDERR: " + e.detail.line);
						}
					}
				);

				jsh.shell.console("Invoking ./test/require-tomcat.jsh.js ...");

				var result = $api.fp.now.invoke(
					invokeTomcatRequire,
					getCommandResult,
					$api.fp.property("stdio"),
					$api.fp.property("output"),
					JSON.parse
				);

				verify(result).before.is(false);
				verify(result).after.is(true);
			}

			fifty.tests.suite = function() {
				fifty.run(fifty.tests.getVersion);

				fifty.run(function alreadyInstalled() {
					var installation = { base: mock.lib.getRelativePath("tomcat").toString() };
					$api.fp.world.now.action(
						subject.Installation.install(installation),
						{ world: mock }
					);
					var events: slime.$api.Event<any>[] = [];
					$api.fp.world.now.action(
						subject.Installation.require(installation),
						{ world: mock },
						new Captor(events,["unzipping","installing","installed","found"])
					);
					verify(events).length.is(1);
					verify(events)[0].type.is("found");
					verify(events)[0].detail.evaluate(function(detail): string { return detail.version; }).is(majorVersion + ".0.99");
					mock.lib.getSubdirectory("tomcat").remove();
				});

				fifty.run(fifty.tests.install);

				fifty.run(fifty.tests.replace);

				fifty.run(fifty.tests.addToShellAtRuntime);
			};

			fifty.tests.world = {};

			fifty.tests.world.getLatestVersion = function() {
				var getLatestVersion = $api.fp.world.mapping(subject.test.getLatestVersion, {
					online: function(e) {
						jsh.shell.console("Latest version (via Apache): " + JSON.stringify(e.detail));
					}
				});

				[7,8,9].forEach(function(major) {
					var version = getLatestVersion(major);
					fifty.global.jsh.shell.console("Latest version for " + major + " is " + JSON.stringify(version));
				})
			};

			fifty.tests.world.getReleaseNotes = function() {
				var notes = $api.fp.world.now.question(
					subject.test.getReleaseNotes,
					{
						base: jsh.shell.jsh.lib.getRelativePath("tomcat").toString()
					}
				);
				if (notes.present) {
					jsh.shell.console(notes.value);
				} else {
					jsh.shell.console("Release notes at " + jsh.shell.jsh.lib.getRelativePath("tomcat") + " not found.");
				}
			};

			fifty.tests.world.getInstalledVersion = function() {
				var installation = subject.Installation.from.jsh();

				var version = subject.Installation.getVersion(installation);

				jsh.shell.console(JSON.stringify(version));
			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
