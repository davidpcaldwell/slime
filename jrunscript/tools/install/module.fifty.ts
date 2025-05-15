//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

/**
 * Provides support for downloading and installing software.
 *
 * The module receives a {@link slime.jrunscript.tools.install.Context} that allows clients to specify a downloads directory to
 * which the module should save files.
 *
 * {@link slime.jrunscript.tools.install.Exports API}
 */
namespace slime.jrunscript.tools.install {
	export interface Context {
		library: {
			web: slime.web.Exports
			shell: slime.jrunscript.shell.Exports
			file: slime.jrunscript.file.Exports
			http: slime.jrunscript.http.client.Exports
			install: slime.jrunscript.java.tools.Exports
		}

		//	TODO	switch to spi
		/**
		 * An HTTP client implementation to use. If not specified, one will be created.
		 */
		client?: slime.jrunscript.http.client.object.Client

		/**
		 * The directory in which to store downloaded files. If not specified, a temporary directory will be used.
		 */
		downloads?: slime.jrunscript.file.Directory
	}

	/**
	 * A function that, for a given name, provides a store that can provide and contain the named resource.
	 */
	export type Cache = (name: string) => slime.$api.fp.impure.input.Store<slime.jrunscript.tools.install.downloads.Download>;

	export interface Exports {
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.exports = fifty.test.Parent();
		}
	//@ts-ignore
	)(fifty);

	export namespace test {
		export const scope = (
			function(fifty: slime.fifty.test.Kit) {
				const $api = fifty.global.$api;
				const jsh = fifty.global.jsh;

				var scope: {
					downloads: slime.jrunscript.file.Directory
					load: (p?: { downloads: slime.jrunscript.file.Directory }) => slime.jrunscript.tools.install.Exports
					api: slime.jrunscript.tools.install.Exports
					harness: {
						local: slime.jrunscript.file.Directory
						zip: slime.jrunscript.file.File
						tar: slime.jrunscript.file.File
						renamed: slime.jrunscript.file.File
					}
					server: any
					tmpdir: () => slime.jrunscript.file.Pathname
				} = {
					downloads: void(0),
					load: void(0),
					api: void(0),
					harness: void(0),
					server: void(0),
					tmpdir: void(0)
				};
				scope.downloads = jsh.shell.TMPDIR.createTemporary({ directory: true });

				var defaults: Context = {
					library: {
						shell: jsh.shell,
						http: jsh.http,
						file: jsh.file,
						web: jsh.web,
						install: void(0)
					},
					downloads: scope.downloads
				};

				scope.load = function(p) {
					if (!p) p = { downloads: void(0) };
					var context = $api.Object.compose(defaults);
					context.library.shell = $api.Object.compose(context.library.shell);
					if (p.downloads) {
						context.downloads = p.downloads;
					}
					return fifty.$loader.module("module.js", context);
				}

				scope.api = scope.load();

				scope.harness = (function createHarness() {
					var tmpdir = jsh.shell.TMPDIR.createTemporary({ directory: true });
					tmpdir.getRelativePath("directory").createDirectory();
					tmpdir.getRelativePath("directory/file").write("text", { append: false });

					var tmpdest = jsh.shell.TMPDIR.createTemporary({ directory: true });

					var rv = {
						local: tmpdest,
						tar: void(0),
						renamed: void(0),
						zip: void(0)
					};

					if (jsh.shell.PATH.getCommand("tar")) {
						jsh.shell.run({
							command: "tar",
							arguments: ["czvf", tmpdest.getRelativePath("directory.tar.gz"), "directory"],
							directory: tmpdir
						});

						rv.tar = tmpdest.getFile("directory.tar.gz");
						rv.renamed = rv.tar.copy(tmpdest.getRelativePath("renamed.tar.gz"));
					}

					jsh.file.zip({
						from: tmpdir,
						to: tmpdest.getRelativePath("directory.zip")
					});
					rv.zip = tmpdest.getFile("directory.zip");
					return rv;
				})();

				if (jsh.httpd.Tomcat) {
					var server = jsh.httpd.Tomcat.serve({ directory: scope.harness.local });
					scope.server = server;
				} else {
					scope.server = null;
				}

				//	TODO	provide within test framework and make return location / directory / file as desired
				scope.tmpdir = function() {
					var tmp = jsh.shell.TMPDIR.createTemporary({ directory: true }).pathname;
					tmp.directory.remove();
					return tmp;
				};

				return scope;
			}
		//@ts-ignore
		)(fifty);

		export interface Exports {
			getDefaultName: (url: string) => string
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;

				const subject = test.scope.api;

				fifty.tests.getDefaultFilename = function() {
					verify(subject).test.getDefaultName("https://www.example.com/path/dist.zip").is("dist.zip");
				}
			}
		//@ts-ignore
		)(fifty);

		export interface Exports {
			//	TODO	implement world test that exercises this so that downloads can be tested
			download: slime.$api.fp.world.Means<{
				from: string
				to: slime.jrunscript.file.Location
			},download.Events>
		}
	}

	export interface Exports {
		/**
		 * Parts exported only for testing.
		 */
		test: test.Exports
	}

	export namespace download {
		export interface Events {
			request: slime.jrunscript.http.client.Events["request"]
		}
	}

	export namespace distribution {
		export interface Events {
			request: slime.jrunscript.http.client.Events["request"]
			archive: slime.jrunscript.file.File
			installed: string
		}

		export interface Format {
			extract: (f: slime.jrunscript.file.File, d: slime.jrunscript.file.Directory) => void

			/**
			 * A file extension suitable for storing this format on a typical filesystem, including a leading period (`.`).
			 */
			extension: string
		}
	}

	/**
	 * A distribution (probably of software) that can be obtained as an archive from a URL. The properties of a `Distribution`
	 * specify the URL from which it can be obtained, an optional logically-globally-unique `name` for the distribution,
	 * the format of the archive, and a prefix within the archive at which the software can be found.
	 */
	export interface Distribution {
		/**
		 * The URL from which the file can be downloaded. Currently, only `http` and `https` URLs are supported.
		 */
		url: string

		/**
		 * A globally-unique name for this download. If present, it may be used as a cache key for certain kinds of caching
		 * (for example, storing downloads in a directory, indexed by this name).
		 */
		name?: string

		/**
		 * The format describing the distribution; an object that knows how to extract an archive to a specified directory.
		 * Implementations for ZIP and gzipped TAR files are provided in
		 * {@link slime.jrunscript.tools.install.exports.Distribution | Distribution}'s `format` property.
		 */
		format?: distribution.Format

		prefix?: string
	}

	export namespace exports {
		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				fifty.tests.exports.Cache = {};
			}
		//@ts-ignore
		)(fifty);

		export interface Cache {
			from: {
				/**
				 * Creates a cache implementation given a directory location in which files will be referenced by the name provided
				 * to the {@link install.Cache}.
				 *
				 * @param it A directory location. If it does not exist, it will be created if a file needs to be stored.
				 */
				directory: (it: slime.jrunscript.file.Location) => install.Cache
			}
		}
	}

	export interface Exports {
		Cache: exports.Cache
	}

	export namespace exports {
		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				fifty.tests.exports.Distribution = {};
			}
		//@ts-ignore
		)(fifty);

		export interface Distribution {
			from: {
				url: (url: string) => install.Distribution

				file: (p: {
					url: string
					prefix?: (p: Omit<install.Distribution,"prefix">) => string
				}) => install.Distribution
			}
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const { $api } = fifty.global;

				const subject = test.scope.load();

				fifty.tests.exports.Distribution.from = function() {
					var URL = "http://example.com/foo/bar.tar.gz";

					(
						function() {
							var download = subject.Distribution.from.url(URL);

							verify(download).url.is("http://example.com/foo/bar.tar.gz");
							verify(download).name.is("bar.tar.gz");
							verify(download).evaluate.property("format").extension.is(".tgz");
							verify(download).evaluate.property("format").is(subject.Distribution.Format.targz);
						}
					)();

					(
						function() {
							var download = subject.Distribution.from.file({
								url: URL
							});

							verify(download).url.is("http://example.com/foo/bar.tar.gz");
							verify(download).name.is("bar.tar.gz");
							verify(download).evaluate.property("format").extension.is(".tgz");
							verify(download).evaluate.property("format").is(subject.Distribution.Format.targz);
							verify(download).evaluate.property("prefix").is(void(0));
						}
					)();

					(
						function() {
							var download = subject.Distribution.from.file({
								url: URL,
								prefix: $api.fp.mapping.all("prefix/")
							});

							verify(download).url.is("http://example.com/foo/bar.tar.gz");
							verify(download).name.is("bar.tar.gz");
							verify(download).evaluate.property("format").extension.is(".tgz");
							verify(download).evaluate.property("format").is(subject.Distribution.Format.targz);
							verify(download).evaluate.property("prefix").is("prefix/");
						}
					)();
				}
			}
		//@ts-ignore
		)(fifty);
	}

	export namespace distribution {
		export interface InstallEvents extends Events {
			exists: slime.jrunscript.file.Location
			removing: slime.jrunscript.file.Location
		}
	}

	export namespace exports {
		export interface Distribution {
			Format: {
				zip: distribution.Format
				targz: distribution.Format
			}
		}

		export interface Distribution {
			install: {
				world: slime.$api.fp.world.Means<
					{
						download: install.Distribution
						to: string
						clean?: boolean
					},
					distribution.InstallEvents
				>
			}
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const { $api, jsh } = fifty.global;
				const { server, harness, load } = test.scope;

				fifty.tests.exports.Distribution.install = function() {
					var downloads = fifty.jsh.file.object.temporary.directory();
					var subject = load({ downloads: downloads });
					var url = "http://" + "127.0.0.1" + ":" + server.port + "/" + "directory.tar.gz";
					jsh.shell.console("url = " + url);

					fifty.run(function unprefixed() {
						var download: install.Distribution = {
							url: url,
							format: subject.Distribution.Format.targz
						};
						var destination = fifty.jsh.file.object.temporary.location();

						$api.fp.world.now.action(
							subject.Distribution.install.world,
							{ download: download, to: destination.toString() }
						);
						verify(destination).directory.getFile("file").is(null);
						verify(destination).directory.getFile("directory/file").is.not(null);
					});

					fifty.run(function prefixed() {
						var download: install.Distribution = {
							url: url,
							format: subject.Distribution.Format.targz,
							prefix: "directory"
						};
						var destination = fifty.jsh.file.object.temporary.location();

						$api.fp.world.now.action(
							subject.Distribution.install.world,
							{ download: download, to: destination.toString() }
						);
						verify(destination).directory.getFile("file").is.not(null);
						verify(destination).directory.getFile("directory/file").is(null);
					});

					fifty.run(function exists() {
						var download: install.Distribution = {
							url: url,
							format: subject.Distribution.Format.targz
						};

						fifty.run(function error() {
							var destination = fifty.jsh.file.object.temporary.location();
							$api.fp.world.Means.now({
								means: subject.Distribution.install.world,
								order: { download: download, to: destination.toString() }
							});
							verify(destination).directory.getFile("file").is(null);
							verify(destination).directory.getFile("directory/file").is.not(null);

							var error: Error = null;
							try {
								$api.fp.world.Means.now({
									means: subject.Distribution.install.world,
									order: { download: download, to: destination.toString() }
								});
							} catch (e) {
								error = e;
								jsh.shell.console(String(error));
							}
							verify(error).is.not(null);
							verify(destination).directory.getFile("file").is(null);
							verify(destination).directory.getFile("directory/file").is.not(null);
						});

						fifty.run(function overwrite() {
							var destination = fifty.jsh.file.object.temporary.location();
							$api.fp.world.Means.now({
								means: subject.Distribution.install.world,
								order: { download: download, to: destination.toString() }
							});
							destination.directory.getRelativePath("directory/a").write("");
							verify(destination).directory.getFile("file").is(null);
							verify(destination).directory.getFile("directory/file").is.not(null);
							verify(destination).directory.getFile("directory/a").is.not(null);


							var error: Error = null;
							try {
								$api.fp.world.Means.now({
									means: subject.Distribution.install.world,
									order: { download: download, to: destination.toString(), clean: false }
								});
							} catch (e) {
								error = e;
							}
							verify(error).is(null);
							verify(destination).directory.getFile("file").is(null);
							verify(destination).directory.getFile("directory/file").is.not(null);
							verify(destination).directory.getFile("directory/a").is.not(null);
						});

						fifty.run(function clean() {
							var destination = fifty.jsh.file.object.temporary.location();
							$api.fp.world.Means.now({
								means: subject.Distribution.install.world,
								order: { download: download, to: destination.toString() }
							});
							destination.directory.getRelativePath("directory/a").write("");
							verify(destination).directory.getFile("file").is(null);
							verify(destination).directory.getFile("directory/file").is.not(null);
							verify(destination).directory.getFile("directory/a").is.not(null);

							var error: Error = null;
							try {
								$api.fp.world.Means.now({
									means: subject.Distribution.install.world,
									order: { download: download, to: destination.toString(), clean: true }
								});
							} catch (e) {
								error = e;
							}
							verify(error).is(null);
							verify(destination).directory.getFile("file").is(null);
							verify(destination).directory.getFile("directory/file").is.not(null);
							verify(destination).directory.getFile("directory/a").is(null);
						});
					});

				}
			}
		//@ts-ignore
		)(fifty);
	}

	export namespace distribution {
		export namespace methods {
			export interface Install {
				download: install.Distribution

				/**
				 * The destination to which to install the distribution. If the location already exists, and `clean` is
				 * not `true`, an error will be thrown.
				 */
				to: string

				clean?: boolean
			}
		}

		export interface Methods {
			install:
				(client: slime.jrunscript.http.client.spi.Implementation)
				=> (downloads: slime.jrunscript.tools.install.Cache)
				=> slime.$api.fp.world.Means<
					methods.Install,
					distribution.InstallEvents
				>

			[x: string]: (client: slime.jrunscript.http.client.spi.Implementation) => any
		}
	}

	export namespace exports {
		export interface Distribution {
			methods: distribution.Methods
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const { $api, jsh } = fifty.global;
				const { api, server } = test.scope;

				fifty.tests.exports.Distribution.methods = fifty.test.Parent();
				fifty.tests.exports.Distribution.methods.install = function() {
					if (server) {
						var client = jsh.http.world.java.urlconnection;

						var scenario = function(downloads: slime.jrunscript.file.Location) {
							const fileExists = function(name) {
								return $api.fp.pipe(
									jsh.file.Location.directory.relativePath(name),
									jsh.file.Location.file.exists.simple
								);
							};

							const readFile = function(name) {
								return $api.fp.pipe(
									jsh.file.Location.directory.relativePath(name),
									jsh.file.Location.file.read.string.simple
								);
							}

							var cache = api.Cache.from.directory(downloads);

							var to = fifty.jsh.file.temporary.location();

							if (jsh.file.Location.directory.exists.simple(downloads)) {
								verify(downloads).evaluate(fileExists("directory.zip")).is(false);
							}

							var methods = $api.fp.now(
								api.Distribution.methods,
								$api.fp.methods.pin(client),
								$api.fp.methods.pin(cache)
							);

							var install = methods.install;

							$api.fp.now(
								{
									//	TODO	Distribution.from.url?
									download: {
										url: "http://127.0.0.1:" + server.port + "/directory.zip",
										format: api.Distribution.Format.zip,
										name: "directory.zip"
									},
									to: to.pathname
								},
								install,
								$api.fp.world.events.handle({
									exists: function(e) {
										//@ts-ignore
										jsh.shell.console("It exists: " + e.detail.pathname);
									}
								}).action,
								$api.fp.impure.Process.now
							);

							verify(downloads).evaluate(fileExists("directory.zip")).is(true);
							verify(to).evaluate(readFile("directory/file")).is("text");
						};

						scenario(fifty.jsh.file.temporary.directory());
						scenario(fifty.jsh.file.temporary.location());
					}
				}
			}
		//@ts-ignore
		)(fifty);
	}

	export interface Exports {
		/**
		 * Functions that operate on {@link slime.jrunscript.tools.install.Distribution}s.
		 */
		Distribution: exports.Distribution
	}

	export interface Destination {
		location: string
		replace?: boolean
	}

	export interface Exports {
		/** @deprecated */
		format: {
			zip: old.Format

			/**
			 * A format representing `gzip`ped `.tar` files. Conditional; requires `tar` to be in the `PATH`.
			 */
			gzip?: old.Format
		}

		//	installation: Specifies software to be installed (including where to obtain it and how it is structured) and a
		//	destination to which to install it.

		/**
		 * @deprecated Now that Apache uses an ordinary CDN rather than a series of mirrors to store their files; can just download
		 * Apache software like other distributions now.
		 */
		apache: {
			/**
			 * Locates a distribution from Apache, either in a local cache, or from an Apache mirror, and returns a local file
			 * containing the distribution (downloading it if necessary).
			 *
			 * @returns A local file containing the content from Apache.
			 */
			find: slime.$api.fp.world.Sensor<
				{
					path: string
					mirror?: string
				},
				{
					console: string
				},
				slime.jrunscript.file.File
			>
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const verify = fifty.verify;
			const jsh = fifty.global.jsh;
			const module = test.scope.load;
			const server = test.scope.server;

			fifty.tests.get = function() {
				if (server) {
					var downloads = jsh.shell.TMPDIR.createTemporary({ directory: true });
					var api = module({ downloads: downloads });
					var messages: object[] = [];
					var file = api.get({
						url: "http://127.0.0.1:" + server.port + "/directory.tar.gz"
					}, {
						console: function(e) {
							messages.push(e);
						}
					});
					var TOSTRING = function(p: object) {
						return { string: p.toString() };
					};
					var messageStartsWith = function(string) {
						return function() {
							return Boolean(this.detail.substring(0,string.length) == string);
						}
					};
					verify(file).is.type("object");
					verify(downloads).getFile("directory.tar.gz").is.not(null);
					verify(downloads).getFile("directory.tar.gz").evaluate(TOSTRING).string.is(file.toString());
					verify(messages,"messages").is(messages);
					verify(messages).length.is(2);
					verify(messages)[0].evaluate(messageStartsWith("Downloading")).is(true);
					verify(messages)[0].evaluate(messageStartsWith("Found")).is(false);
					verify(messages)[1].evaluate(messageStartsWith("Wrote")).is(true);
				}
			}
		}
	//@ts-ignore
	)(fifty);

	(
		function(
			Packages: slime.jrunscript.Packages,
			fifty: slime.fifty.test.Kit
		) {
			const verify = fifty.verify;
			const { $api, jsh } = fifty.global;
			const api = test.scope.api;
			const server = test.scope.server;
			const harness = test.scope.harness;
			const tmpdir: () => slime.jrunscript.file.Pathname = test.scope.tmpdir;
			const downloads: slime.jrunscript.file.Directory = test.scope.downloads;

			fifty.tests.tar = function() {
				//	Test .tar format
				var tmp = jsh.shell.TMPDIR.createTemporary({ directory: true }).pathname;
				tmp.directory.remove();

				if (harness.tar) {
					api.install({
						file: harness.tar,
						format: api.format.gzip,
						to: tmp
					});

					verify(tmp).directory.getFile("file").evaluate(function(p) { return p.read(String); }).is("text");

					//	Test a file with different download name can also be expanded, using getDestinationPath()
					(function() {
						var tmp = jsh.shell.TMPDIR.createTemporary({ directory: true }).pathname;
						tmp.directory.remove();
						api.install({
							file: harness.renamed,
							format: api.format.gzip,
							to: tmp,
							getDestinationPath: function() { return "directory"; }
						});
						verify(tmp).directory.getFile("file").evaluate(function(p) { return p.read(String); }).is("text");
					})();
				}

				//	Test a downloaded file
				if (server && harness.tar) (function() {
					var tmp = tmpdir();
					verify(downloads).getFile("directory.tar.gz").is(null);
					api.install({
						url: "http://127.0.0.1:" + server.port + "/directory.tar.gz",
						format: api.format.gzip,
						to: tmp
					});
					verify(downloads).getFile("directory.tar.gz").is.not(null);
					verify(tmp).directory.getFile("file").evaluate(function(p) { return p.read(String); }).is("text");
				})();

				//	TODO	ensure when a copy has already been downloaded, the cached version is used
			}

			fifty.tests.zip = function() {
				//	Test ZIP format
				if (server) {
					(function() {
						var tmp = tmpdir();
						verify(downloads).getFile("directory.zip").is(null);
						api.install({
							url: "http://127.0.0.1:" + server.port + "/directory.zip",
							format: api.format.zip,
							to: tmp
						});
						verify(downloads).getFile("directory.zip").is.not(null);
						verify(tmp).directory.getFile("file").evaluate(function(p) { return p.read(String); }).is("text");
					})();
				}
			};

			fifty.tests.apache = function() {
				var scope = {
					mock: void(0)
				};
				if (jsh.httpd.Tomcat) {
					var mock = jsh.httpd.Tomcat();
					mock.map({
						path: "/",
						servlets: {
							"/*": {
								load: function(scope) {
									Packages.java.lang.System.err.println("custom servlet loading ...");
									scope.$exports.handle = function(request) {
										Packages.java.lang.System.err.println("Got request ...");
										var host = request.headers.value("host");
										Packages.java.lang.System.err.println("host = " + host);
										if (host == "dlcdn.apache.org") {
											return {
												status: { code: 200 },
												body: fifty.$loader.get(request.path) as slime.jrunscript.runtime.old.Resource
											};
										}
									};
									Packages.java.lang.System.err.println("custom servlet loaded.");
								}
							}
						},
						resources: null
					});
					mock.start();
					scope.mock = mock;
				} else {
					scope.mock = null;
				}

				if (jsh.httpd.Tomcat) {
					verify(api).apache.is.type("object");
					verify(api).apache.evaluate.property("find").is.type("function");
					verify(mock).is.type("object");

					var PROXY = {
						http: {
							host: "127.0.0.1",
							port: mock.port
						}
					};

					var mockclient = new jsh.http.Client({
						proxy: PROXY
					});

					var mockdownloads = fifty.jsh.file.object.temporary.directory();

					var script: slime.jrunscript.tools.install.Script = fifty.$loader.script("module.js");

					var mockapi: slime.jrunscript.tools.install.Exports = script({
						client: mockclient,
						library: {
							shell: jsh.shell,
							http: jsh.http,
							file: jsh.file,
							web: jsh.web,
							install: jsh.java.tools
						},
						downloads: mockdownloads
					});

					var GET_DOWNLOADED_MODULE_FIFTY_TS = function(p: slime.jrunscript.file.Directory) { return p.getFile("module.fifty.ts") };
					var FILE_CONTENT_EQUALS = function(string) { return function(p) { return p.read(String) == string; } };

					verify(mockdownloads).evaluate(GET_DOWNLOADED_MODULE_FIFTY_TS).is(null);

					var file: object = $api.fp.world.now.ask(
						mockapi.apache.find({ path: "module.fifty.ts" })
					);
					var stringFromSrc = fifty.$loader.get("module.fifty.ts").read(String);

					verify(file).evaluate(FILE_CONTENT_EQUALS(stringFromSrc)).is(true);
					verify(mockdownloads).evaluate(GET_DOWNLOADED_MODULE_FIFTY_TS).is.not(null);
					verify(mockdownloads).getFile("module.fifty.ts").evaluate(FILE_CONTENT_EQUALS(stringFromSrc)).is(true);
				};

				//	TODO	does Fifty have a destroy mechanism?
				if (scope.mock) scope.mock.stop();
			}
		}
	//@ts-ignore
	)(Packages,fifty);

	export namespace rhino {
		export interface Installation {
			version: slime.$api.fp.impure.External<slime.$api.fp.Maybe<string>>
		}
	}

	export interface Exports {
		rhino: {
			at: (location: string) => slime.$api.fp.Maybe<rhino.Installation>
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {
				fifty.run(fifty.tests.exports);

				fifty.run(fifty.tests.get);
				fifty.run(fifty.tests.tar);
				fifty.run(fifty.tests.zip);
				fifty.run(fifty.tests.apache);

				fifty.load("downloads.fifty.ts");

				fifty.load("deprecated.fifty.ts");

				//	TODO	does Fifty have a destroy mechanism?
				const scope = test.scope;
				if (scope.server) scope.server.stop();
			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
