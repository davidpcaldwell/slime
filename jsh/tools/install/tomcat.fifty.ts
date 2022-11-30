//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh.shell.tools {
	export interface Tomcat {
		/**
		 * Returns the Tomcat installed at the
		 */
		 installed: (p?: {
			mock?: {
				notes: slime.Resource
			}
			/**
			 * If present, represents the location in which to look for the installation. Defaults to the `jsh` managed Tomcat
			 * location.
			 */
			home?: slime.jrunscript.file.Pathname
		}) => tomcat.Installation

		install: (p?: {
			mock?: {
				lib?: slime.jrunscript.file.Directory
				getLatestVersion?: () => string
				findApache?: slime.jsh.Global["tools"]["install"]["apache"]["find"]
			}
			to?: slime.jrunscript.file.Pathname
			replace?: boolean
			version?: string
			local?: slime.jrunscript.file.File
		}, handler?: slime.$api.events.Handler<tomcat.install.Events>) => void

		/**
		 * If Tomcat is not installed at the target location (defined by the first parameter; see `install()`), installs it at
		 * that location using the configuration specified by the first argument.
		 */
		require: (p?: Parameters<Exports["tomcat"]["install"]>[0], handler?: Parameters<Exports["tomcat"]["install"]>[1]) => void
	}
}

namespace slime.jsh.shell.tools.internal.tomcat {
	export interface Context {
		$api: slime.$api.Global
		jsh: slime.jsh.Global
	}

	export interface Exports extends slime.jsh.shell.tools.Tomcat {
		test: {
			getLatestVersion: () => string
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { jsh } = fifty.global;
			const subject = jsh.shell.tools.tomcat as Exports;

			var getVersionString = function(): string {
				if (!this.version) return null;
				return this.version.toString();
			};

			var Distribution = function(version) {
				var tmpdir = jsh.shell.TMPDIR.createTemporary({ directory: true });
				var dist = tmpdir.getRelativePath("apache-tomcat-" + version).createDirectory();
				dist.getRelativePath("a").write("a", { append: false });
				dist.getRelativePath("RELEASE-NOTES").write(fifty.$loader.get("test/data/tomcat-release-notes-7.0.70.txt").read(String).replace(/7\.0\.70/g, version), { append: false });
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

			var mock = {
				lib: jsh.shell.TMPDIR.createTemporary({ directory: true }),
				getLatestVersion: function() {
					return "7.0.99";
				},
				findApache: function(o) {
					if (o.path == "tomcat/tomcat-7/v7.0.98/bin/apache-tomcat-7.0.98.zip") return Distribution("7.0.98");
					if (o.path == "tomcat/tomcat-7/v7.0.99/bin/apache-tomcat-7.0.99.zip") return Distribution("7.0.99");
					if (o.path == "tomcat/tomcat-7/v7.0.109/bin/apache-tomcat-7.0.109.zip") return Distribution("7.0.109");
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

			fifty.tests.replace = function() {
				jsh.shell.tools.tomcat.install({ mock: mock, version: "7.0.98" });
				var installed = jsh.shell.tools.tomcat.installed({ home: mock.lib.getRelativePath("tomcat") });
				verify(installed).evaluate(getVersionString).is("7.0.98");

				var noreplace = [];
				jsh.shell.tools.tomcat.install({ mock: mock }, new Captor(noreplace,["installed"]));
				installed = jsh.shell.tools.tomcat.installed({ home: mock.lib.getRelativePath("tomcat") });
				verify(installed).evaluate(getVersionString).is("7.0.98");
				verify(noreplace).length.is(0);

				debugger;
				var replace = [];
				jsh.shell.tools.tomcat.install({ mock: mock, replace: true }, new Captor(replace,["installed"]));
				installed = jsh.shell.tools.tomcat.installed({ home: mock.lib.getRelativePath("tomcat") });
				verify(installed).evaluate(getVersionString).is("7.0.109");
				verify(replace).length.is(1);

				mock.lib.getSubdirectory("tomcat").remove();
			}

			fifty.tests.suite = function() {
				fifty.run(function alreadyInstalled() {
					var events: slime.$api.Event<string>[] = [];
					mock.lib.getRelativePath("tomcat").createDirectory();
					jsh.shell.tools.tomcat.install({ mock: mock }, new Captor(events,["console","installed"]));
					verify(events)[0].type.is("console");
					verify(events)[0].detail.is("Tomcat already installed at " + mock.lib.getSubdirectory("tomcat"));
					mock.lib.getSubdirectory("tomcat").remove();
				});

				fifty.run(function install() {
					var events: slime.$api.Event<string>[] = [];
					jsh.shell.tools.tomcat.install({ mock: mock }, new Captor(events,["console","installed"]));
					verify(events)[0].type.is("console");
					jsh.shell.console(events[1].detail);
					verify(events)[1].evaluate(function() { return /^Unzipping (?:[a-zA-Z0-9\/\._]+) to\:(.*)$/.test(this.detail); }).is(true);
					verify(mock.lib).getSubdirectory("tomcat").getFile("a").is.type("object");
					verify(mock.lib).getSubdirectory("tomcat").getFile("b").is.type("null");
					var installed = jsh.shell.tools.tomcat.installed({ home: mock.lib.getRelativePath("tomcat") });
					var version = installed.version.toString();
					verify(version).is("7.0.109");
					mock.lib.getSubdirectory("tomcat").remove();
				});

				fifty.run(fifty.tests.replace);
			}

			fifty.tests.world = function() {
				var version = subject.test.getLatestVersion();
				fifty.global.jsh.shell.console(version);
			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
