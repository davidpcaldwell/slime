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
			getLatestVersion: () => string
			findApache: slime.jsh.Global["tools"]["install"]["apache"]["find"]
		}

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

			export type Handler = slime.$api.events.Handler<tomcat.install.Events>
		}
	}

	export interface Tomcat {
		Installation: {
			from: {
				jsh: () => slime.jsh.shell.tools.tomcat.Installed
			}

			getVersion: (installation: slime.jsh.shell.tools.tomcat.Installed) => slime.$api.fp.Maybe<string>

			install: (installation: slime.jsh.shell.tools.tomcat.Installed) => slime.$api.fp.world.Action<{
				world?: slime.jsh.shell.tools.tomcat.World
				version?: string
			},slime.jsh.shell.tools.tomcat.installation.Events>

			require: (installation: slime.jsh.shell.tools.tomcat.Installed) => slime.$api.fp.world.Action<
				{
					world?: slime.jsh.shell.tools.tomcat.World
					version?: string
					replace?: (version: string) => boolean
				},
				slime.jsh.shell.tools.tomcat.installation.Events & {
					found: { version: string }
				}
			>
		}

		/**
		 * If Tomcat is not installed at the target location (defined by the first parameter; see `install()`), installs it at
		 * that location using the configuration specified by the first argument.
		 */
		require: (p?: slime.jsh.shell.tools.tomcat.old.Argument, handler?: slime.jsh.shell.tools.tomcat.old.Handler) => void
	}
}

namespace slime.jsh.shell.tools.internal.tomcat {
	export interface Context {
		$api: slime.$api.Global
		jsh: slime.jsh.Global
	}

	export interface Exports extends slime.jsh.shell.tools.Tomcat {
		test: {
			//	TODO	world test coverage only
			getReleaseNotes: slime.$api.fp.world.Question<slime.jsh.shell.tools.tomcat.Installed,void,slime.$api.fp.Maybe<string>>

			getVersion: (releaseNotes: string) => string

			getLatestVersion: slime.jsh.shell.tools.tomcat.World["getLatestVersion"]
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api, jsh } = fifty.global;
			const subject = jsh.shell.tools.tomcat as Exports;

			var getVersionString = function(): string {
				if (!this.version) return null;
				return this.version.toString();
			};

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
				getLatestVersion: function() {
					return "7.0.99";
				},
				findApache: function(o) {
					if (o.path == "tomcat/tomcat-7/v7.0.98/bin/apache-tomcat-7.0.98.zip") return MockDistribution("7.0.98");
					if (o.path == "tomcat/tomcat-7/v7.0.99/bin/apache-tomcat-7.0.99.zip") return MockDistribution("7.0.99");
					if (o.path == "tomcat/tomcat-7/v7.0.109/bin/apache-tomcat-7.0.109.zip") return MockDistribution("7.0.109");
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
				var notes = MockReleaseNotes("7.0.70");
				var version = subject.test.getVersion(notes);
				verify(version).is("7.0.70");
			}

			fifty.tests.install = function() {
				var installation = { base: mock.lib.getRelativePath("tomcat").toString() };

				var events: slime.$api.Event<any>[] = [];
				$api.fp.world.now.action(
					jsh.shell.tools.tomcat.Installation.install(installation),
					{ world: mock },
					new Captor(events,["unzipping","installing","installed"])
				);
				verify(events).length.is(3);
				verify(events)[0].type.is("unzipping");
				verify(events)[1].type.is("installing");
				verify(events)[2].type.is("installed");
				verify(events)[2].detail.evaluate(function(detail): string { return detail.version; }).is("7.0.109");
				verify(mock.lib).getSubdirectory("tomcat").getFile("a").is.type("object");
				verify(mock.lib).getSubdirectory("tomcat").getFile("b").is.type("null");
				var installed = jsh.shell.tools.tomcat.Installation.getVersion(installation);
				var version = orNull(installed);
				verify(version).is("7.0.109");
				mock.lib.getSubdirectory("tomcat").remove();
			}

			fifty.tests.replace = function() {
				var installation = { base: mock.lib.getRelativePath("tomcat").toString() };
				var events = ["unzipping","installing","installed","found"];

				$api.fp.world.now.action(
					jsh.shell.tools.tomcat.Installation.install(installation),
					{ world: mock, version: "7.0.98" }
				);
				var installed = jsh.shell.tools.tomcat.Installation.getVersion(installation);
				verify(installed).evaluate(orNull).is("7.0.98");

				var noreplace = [];
				$api.fp.world.now.action(
					jsh.shell.tools.tomcat.Installation.require(installation),
					{ world: mock },
					new Captor(noreplace,events)
				);
				installed = jsh.shell.tools.tomcat.Installation.getVersion(installation);
				verify(installed).evaluate(orNull).is("7.0.98");
				verify(noreplace).length.is(1);
				verify(noreplace)[0].detail.evaluate(function(detail): string { return detail.version; }).is("7.0.98");

				debugger;
				var replace = [];
				$api.fp.world.now.action(
					jsh.shell.tools.tomcat.Installation.require(installation),
					{
						world: mock,
						replace: function(version) { return true; }
					},
					new Captor(replace,events)
				)
				installed = jsh.shell.tools.tomcat.Installation.getVersion(installation);
				verify(installed).evaluate(orNull).is("7.0.109");
				verify(replace).length.is(4);

				mock.lib.getSubdirectory("tomcat").remove();
			};

			fifty.tests.suite = function() {
				fifty.run(fifty.tests.getVersion);

				fifty.run(function alreadyInstalled() {
					var installation = { base: mock.lib.getRelativePath("tomcat").toString() };
					$api.fp.world.now.action(
						jsh.shell.tools.tomcat.Installation.install(installation),
						{ world: mock }
					);
					var events: slime.$api.Event<any>[] = [];
					$api.fp.world.now.action(
						jsh.shell.tools.tomcat.Installation.require(installation),
						{ world: mock },
						new Captor(events,["unzipping","installing","installed","found"])
					);
					verify(events).length.is(1);
					verify(events)[0].type.is("found");
					verify(events)[0].detail.evaluate(function(detail): string { return detail.version; }).is("7.0.109");
					mock.lib.getSubdirectory("tomcat").remove();
				});

				fifty.run(fifty.tests.install);

				fifty.run(fifty.tests.replace);
			};

			fifty.tests.world = {};

			fifty.tests.world.getLatestVersion = function() {
				var version = subject.test.getLatestVersion();
				fifty.global.jsh.shell.console(version);
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
			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
