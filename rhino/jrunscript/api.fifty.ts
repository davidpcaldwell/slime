//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.internal.jrunscript.bootstrap {
	export interface Configuration {
		script: {
			file: string
			url: string
		}
		engine: {
			script: any
		}
		arguments: string[]
	}

	export interface Script {
		load: () => void
		file?: slime.jrunscript.native.java.io.File
		url?: slime.jrunscript.native.java.net.URL
		resolve: (path: string) => Script
	}

	export interface Environment {
		load: any

		//	Rhino compatibility
		Packages: slime.jrunscript.Packages
		JavaAdapter?: any

		//	Rhino-provided
		readFile?: any
		readUrl?: any

		//	Nashorn-provided
		//	Used to provide debug output before Packages is loaded
		//	Used in jsh/launcher/main.js
		Java?: any

		$api: {
			debug: boolean
		}
	}

	export namespace internal {
		export namespace io.zip {
			export type Processor = {
				directory: (name: string) => void
				write: (name: string, _stream: slime.jrunscript.native.java.io.InputStream) => void
			}
		}

		export type Io = {
			copy: (from: slime.jrunscript.native.java.io.InputStream, to: slime.jrunscript.native.java.io.OutputStream) => void
			zip: {
				parse: (_stream: slime.jrunscript.native.java.io.InputStream, destination: io.zip.Processor) => void
			}
		}

		export namespace github {
			export type Archive = {
				read: (name: string) => slime.jrunscript.native.java.io.InputStream
			}
		}
	}

	export interface Global<T,J> extends Environment {
		$api: {
			debug: any
			console: any
			log: any
			engine: {
				toString: () => string
				resolve: any
				readFile: any
				readUrl: any
				runCommand: any
			}

			github: {
				test: {
					zip: (_stream: slime.jrunscript.native.java.io.InputStream) => internal.github.Archive
				}
			}

			Script: {
				new (p: { string: string }): Script
				new (p: { file: slime.jrunscript.native.java.io.File }): Script
				new (p: { url: slime.jrunscript.native.java.net.URL }): Script

				run: (p: any) => void

				test: {
					interpret: (string: string) => {
						file?: slime.jrunscript.native.java.io.File
						url?: slime.jrunscript.native.java.net.URL
					}
					toGithubArchiveLocation: (url: slime.jrunscript.native.java.net.URL) => {
						zip: slime.jrunscript.native.java.net.URL
						path: string
					}
				}
			}
			script: Script
			arguments: string[]

			java: {
				Install: any
				install: any
				getClass: any
				Array: any
				Command: any
			} & J

			io: {
				tmpdir: (p?: { prefix?: string, suffix?: string }) => slime.jrunscript.native.java.io.File
				copy: any
				unzip: any
			}

			bitbucket: any

			rhino: any
			shell: any
		} & T
	}

	(
		function(
			Packages: any,
			fifty: slime.fifty.test.kit
		) {
			var jsh = fifty.global.jsh;
			var verify = fifty.verify;

			fifty.tests.zip = function() {
				var web = new jsh.unit.mock.Web();
				web.add(jsh.unit.mock.Web.github({
					src: {
						davidpcaldwell: {
							slime: jsh.tools.git.Repository({ directory: jsh.shell.jsh.src })
						}
					}
				}));
				web.start();
				var client = web.client;
				var zip = client.request({
					url: "http://github.com/davidpcaldwell/slime/archive/refs/heads/master.zip"
				});
				fifty.verify(zip).status.code.is(200);

				var configuration: slime.internal.jrunscript.bootstrap.Environment = {
					Packages: Packages,
					load: function() {
						throw new Error("Implement.");
					},
					$api: {
						debug: true
					}
				};
				fifty.$loader.run("api.js", {}, configuration);
				var global: slime.internal.jrunscript.bootstrap.Global<{},{}> = configuration as slime.internal.jrunscript.bootstrap.Global<{},{}>;

				var archive = global.$api.github.test.zip(zip.body.stream.java.adapt());
				verify(archive).read("slime-master/rhino/jrunscript/api.fifty.ts").is.type("object");
				verify(archive).read("slime-master/rhino/jrunscript/api.fifty.ts.foo").is.type("null");
				var descriptor: slime.jrunscript.runtime.resource.Descriptor = {
					read: {
						binary: function() {
							return jsh.io.java.adapt(archive.read("slime-master/rhino/jrunscript/api.fifty.ts"));
						}
					}
				}
				var resource = new jsh.io.Resource(descriptor);
				var fromZip = resource.read(String);
				var fromFilesystem = fifty.$loader.getRelativePath("api.fifty.ts").file.read(String);
				var filesAreEqual = fromZip == fromFilesystem
				verify(filesAreEqual,"filesAreEqual").is(true);
			}

			fifty.tests.suite = function() {
				var configuration: slime.internal.jrunscript.bootstrap.Environment = {
					Packages: Packages,
					load: function() {
						throw new Error("Implement.");
					},
					$api: {
						debug: true
					}
				};
				fifty.$loader.run("api.js", {}, configuration);
				var global: slime.internal.jrunscript.bootstrap.Global<{},{}> = configuration as slime.internal.jrunscript.bootstrap.Global<{},{}>;
				fifty.verify(global).is.type("object");
				fifty.verify(global).$api.is.type("object");
				fifty.verify(global).$api.script.is.type("object");

				var subject = global.$api;

				var interpret = function(string) {
					return Object.assign(function(p) {
						var result = p.interpret(string);
						var entries: [name: string, value: any][] = [];
						if (result.url) entries.push(["url",String(result.url)]);
						if (result.file) entries.push(["file",String(result.file)]);
						if (result.zip) entries.push(["zip",String(result.zip)]);
						//	TODO	try to figure out obscure issue below
						//@ts-ignore
						return Object.fromEntries(entries);
					}, {
						toString: function() { return "interpret(" + string + ")"}
					})
				};

				fifty.verify(subject).Script.test.evaluate(interpret("http://server.com/path")).url.is("http://server.com/path");

				fifty.verify(subject).Script.test.evaluate(interpret("http://raw.githubusercontent.com/davidpcaldwell/slime/branch/rhino/jrunscript/api.js")).url.is("http://raw.githubusercontent.com/davidpcaldwell/slime/branch/rhino/jrunscript/api.js");
				fifty.verify(subject).Script.test.evaluate(interpret("https://raw.githubusercontent.com/davidpcaldwell/slime/branch/rhino/jrunscript/api.js")).url.is("https://raw.githubusercontent.com/davidpcaldwell/slime/branch/rhino/jrunscript/api.js");

				var toZipLocation = function(string): (p: any) => { zip: string, path: string } {
					return Object.assign(function(p) {
						var result = p.toGithubArchiveLocation(string);
						return (result) ? {
							zip: String(result.zip),
							path: result.path
						} : result
					}, {
						toString: function() { return "toZipLocation(" + string + ")"}
					})
				}

				fifty.verify(subject).Script.test.evaluate(toZipLocation("http://raw.githubusercontent.com/davidpcaldwell/slime/branch/rhino/jrunscript/api.js")).zip.is("http://github.com/davidpcaldwell/slime/archive/refs/heads/branch.zip");
				fifty.verify(subject).Script.test.evaluate(toZipLocation("http://raw.githubusercontent.com/davidpcaldwell/slime/branch/rhino/jrunscript/api.js")).path.is("rhino/jrunscript/api.js");

				fifty.verify(subject).Script.test.evaluate(toZipLocation("http://example.com/path")).is(null);
			}
		}
	//@ts-ignore
	)(Packages,fifty);

}