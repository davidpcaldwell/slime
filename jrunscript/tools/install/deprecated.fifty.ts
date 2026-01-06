//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.tools.install {
	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.exports = fifty.test.Parent();
		}
	//@ts-ignore
	)(fifty);
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

	export interface Exports {
		/**
		 * @deprecated Replaced by the various functions of {@link exports.Distribution Distribution}.
		 *
		 * This method can process both local and remote files. For remote files, it is assumed that the filename of
		 * the file uniquely identifies the file, and that this assumption can be relied upon to determine whether the
		 * remote file has already been downloaded. This restriction may be removed in a future release, perhaps by
		 * adding additional configuration arguments.
		 *
		 * The file, when expanded, is assumed to create a single directory containing the installation. This directory
		 * is assumed to have the same name as the file (minus the extension). For a given archive, if the desired
		 * directory has a different path within, it can be specified with `getDestinationPath()`.
		 */
		install: old.install
	}

	export interface Exports {
		/** @deprecated */
		gzip: any

		/** @deprecated */
		zip: any
	}
}

namespace slime.jrunscript.tools.install.old {
	export namespace events {
		export interface Console {
			/**
			 * A message suitable for display on the console.
			 */
			console: string
		}

		/**
		 * An old-style event handler that will receive `console` events with a string detail type.
		 */
		export type Receiver = slime.$api.event.Function.Receiver<{ console: string }>
	}

	/**
	 *
	 * @returns The directory to which the installation was installed.
	 */
	export interface install {
		(p: Installation, events?: old.events.Receiver): slime.jrunscript.file.Directory
		(p: WorldInstallation): slime.$api.fp.world.old.Tell<events.Console>
	}

	export interface Source {
		//	TODO	it's not really specified what happens if `url` and `file` are both present.

		/**
		 * The URL from which the file can be downloaded. Currently, only `http` and `https` URLs are supported. Optional; not
		 * necessary if `file` is provided.
		 */
		url?: slime.jrunscript.http.client.request.url

		/**
		 * The filename to use if a file needs to be created when downloading this file. Defaults to terminal file name of URL.
		 */
		name?: string

		/**
		 * The local copy of the installation file. Optional; not necessary if `url` is present.
		 */
		file?: slime.jrunscript.file.File
	}

	export interface WorldSource {
		//	TODO	it's not really specified what happens if `url` and `file` are both present.

		/**
		 * The URL from which the file can be downloaded. Currently, only `http` and `https` URLs are supported. Optional; not
		 * necessary if `file` is provided.
		 */
		url?: string

		/**
		 * The filename to use if a file needs to be created when downloading this file. Defaults to terminal file name of URL.
		 */
		name?: string

		/**
		 * The local copy of the installation file. Optional; not necessary if `url` is present.
		 */
		file?: string
	}

	export interface Format {
		getDestinationPath: (basename: string) => string
		extract: (f: slime.jrunscript.file.File, d: slime.jrunscript.file.Directory) => void
	}

	export interface Formats {
		gzip?: Format
		zip: Format
	}

	export interface Archive {
		format?: Format
		folder?: (file: slime.jrunscript.file.File) => string
	}

	export interface WorldInstallation {
		source: WorldSource
		archive?: Archive
		destination: Destination
	}

	export interface Installation {
		/**
		 * The URL from which the file can be downloaded. Currently, only `http` and `https` URLs are supported. Optional; not
		 * necessary if `file` is provided.
		 */
		url?: slime.jrunscript.http.client.request.url

			/**
		 * The filename to use if a file needs to be created when downloading this file. Defaults to terminal file name of URL.
		 */
		name?: string

		/**
		 * The local copy of the installation file. Optional; not necessary if `url` is present.
		 */
		file?: slime.jrunscript.file.File

		/**
		 * Optional; if omitted, the implementation will attempt to determine it from `url` and `file`.
		 */
		format?: Format

		/**
		 * A function specifying the path within the archive of the installation.
		 *
		 * Optional; if not specified, the provided {@link Format} will be asked to guess the destination path.
		 *
		 * @param file The archive file.
		 * @returns A path within the archive to treat as the installation.
		 */
		getDestinationPath?: (file: slime.jrunscript.file.File) => string

		/**
		 * The location to which to install the installation.
		 */
		to: slime.jrunscript.file.Pathname

		/**
		 * If `true`, and a file or directory at the specified destination already exists, it will be removed and replaced by
		 * the installation. If `false`, and the specified destination already exists, an error will be thrown. Defaults to
		 * `false`.
		 */
		replace?: boolean
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

		newInstall: old.install

		formats: slime.jrunscript.tools.install.old.Formats

		gzip: slime.jrunscript.tools.install.Exports["gzip"]

		zip: slime.jrunscript.tools.install.Exports["zip"]
	}

	export type install = (
		p: slime.jrunscript.tools.install.old.Installation,
		events: slime.$api.event.Producer<{ console: string }>
	) => slime.jrunscript.file.Directory

	export namespace test {
		export const scope = (
			function(fifty: slime.fifty.test.Kit) {
				const { jsh } = fifty.global;

				const script: slime.jrunscript.tools.install.Script = fifty.$loader.script("module.js");

				var downloads = fifty.jsh.file.object.temporary.directory();

				//	TODO	a lot of copy-paste from module.fifty.ts in fixtures; probably should go to separate fixtures.ts

				var defaults: slime.jrunscript.tools.install.Context = {
					library: {
						shell: jsh.shell,
						http: jsh.http,
						file: jsh.file,
						web: jsh.web,
						install: jsh.java.tools
					},
					downloads: downloads
				};

				const api = script(defaults);

				const harness = (function createHarness() {
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

				return {
					//	TODO	seems to be a fifty native API to do this
					tmpdir: function() {
						var tmp = jsh.shell.TMPDIR.createTemporary({ directory: true }).pathname;
						tmp.directory.remove();
						return tmp;
					},
					api: api,
					harness: harness
				};
			}
		//@ts-ignore
		)(fifty);
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { jsh } = fifty.global;
			const { api, harness } = test.scope;

			fifty.tests.exports.install = function() {
				fifty.run(function happy() {
					var to = test.scope.tmpdir();

					var tell = api.install({
						source: {
							file: harness.zip.toString()
						},
						destination: {
							location: to.toString()
						}
					});

					verify(to).directory.is.type("null");
					tell();
					verify(to).directory.is.type("object");
				});

				fifty.run(function old() {
					fifty.run(function replace() {
						const harness = test.scope.harness;

						var install = function(to,replace?) {
							return function(p) {
								p.install({
									file: harness.zip,
									to: to,
									replace: replace
								});
							}
						};

						var clean = jsh.shell.TMPDIR.createTemporary({ directory: true }).pathname;
						clean.directory.remove();
						verify(api).evaluate(install(clean)).threw.nothing();

						verify(api).evaluate(install(clean,true)).threw.nothing();

						verify(api).evaluate(install(clean)).threw.type(Error);
					});

					fifty.run(function present() {
						verify(api).is.type("object");
						if (jsh.shell.PATH.getCommand("tar")) {
							verify(api).evaluate(function() { return this.format.gzip; }).is.type("object");
							verify(api).evaluate(function() { return this.gzip; }).is.type("function");
						}
					});
				});
			};
		}
	//@ts-ignore
	)(fifty);

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {
				fifty.run(fifty.tests.exports);
			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
