//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh.internal.launcher {
	//	would like to use namespace slime but that conflicts with same name of top-level namespace
	export interface SlimeConfiguration {
		built?: slime.jrunscript.native.java.io.File
	}

	export namespace settings {
		/**
		 * Defines how a particular setting (which is denoted by a Java system property, although it can also be set via
		 * environment variable) is used by the launcher.
		 */
		export interface Definition {
			/**
			 * If `true`, this setting is available within the launcher.
			 */
			launcher: boolean

			/**
			 * If `true`, this setting is passed as a system property to the loader VM.
			 */
			loader: boolean

			/**
			 * If present, this setting adds VM arguments to the loader VM; this function is invoked with the setting's current
			 * value, and should return an array of strings representing VM arguments.
			 */
			loaderVmArguments?: (value: string) => string[]
		}

		export namespace invocation {
			export interface Input {
				jrunscript: slime.jrunscript.native.java.io.File
				pwd: string
				command: string
			}

			export interface Output {
				jrunscript: string
				classpath: string[]
				properties: { [name: string]: string }
				main: string
			}

			(
				function(
					fifty: slime.fifty.test.Kit
				) {
					const { verify } = fifty;
					const { $api, jsh } = fifty.global as unknown as { $api: slime.$api.jrunscript.Global, jsh: slime.jsh.Global };

					fifty.tests.invocation = fifty.test.Parent();

					const jrunscript = jsh.internal.bootstrap.java.install.jrunscript;
					const pwd = $api.jrunscript.properties.get("user.dir");
					const main = jsh.file.os.directory.relativePath("rhino/jrunscript/api.js")(pwd);

					const parse = function(command: string): Output {
						const input: Input = {
							jrunscript: jrunscript,
							pwd: pwd,
							command: command
						};

						return jsh.internal.bootstrap.slime.settings.test.invocation(input);
					};

					const equalsArray = function(v: any[]): (p: any[]) => boolean {
						const rv = function(p) {
							if (v.length !== p.length) {
								return false;
							}
							for (let i = 0; i < v.length; i++) {
								if (v[i] !== p[i]) {
									return false;
								}
							}
							return true;
						};
						rv.toString = function() {
							return "equalsArray(" + v.toString() + ")";
						}
						return rv;
					};

					const equalsObject = function(v: { [name: string]: any }): (p: { [name: string]: any }) => boolean {
						const rv = function(p) {
							const keys = Object.keys(v);
							if (keys.length !== Object.keys(p).length) {
								return false;
							}
							for (let i = 0; i < keys.length; i++) {
								const key = keys[i];
								if (v[key] !== p[key]) {
									return false;
								}
							}
							return true;
						};
						rv.toString = function() {
							return "equalsObject(" + JSON.stringify(v) + ")";
						}
						return rv;
					};

					const check = function(output: Output, classpath: string[], properties: { [name: string]: string }) {
						verify(output).jrunscript.is(String(jrunscript.toString()));
						verify(output).classpath.evaluate(equalsArray(classpath)).is(true);
						verify(output).properties.evaluate(equalsObject(properties)).is(true);
						verify(output).main.is(main);
					};

					fifty.tests.invocation.jdk8 = function() {
						const output = parse("com.sun.tools.script.shell.Main ./rhino/jrunscript/api.js jsh jrunscript/jsh/test/jsh-data.jsh.js");
						check(output, [], {});
					};

					fifty.tests.invocation.jdk11 = function() {
						const output = parse("java.scripting/com.sun.tools.script.shell.Main -Dnashorn.args=--no-deprecation-warning ./rhino/jrunscript/api.js jsh jrunscript/jsh/test/jsh-data.jsh.js");
						check(output, [], {"nashorn.args": "--no-deprecation-warning"});
						jsh.shell.console(JSON.stringify(output.properties));
					};

					fifty.tests.invocation.jdk17 = function() {
						const output = parse("java.scripting/com.sun.tools.script.shell.Main -classpath ./local/jsh/lib/asm.jar:./local/jsh/lib/asm-commons.jar:./local/jsh/lib/asm-tree.jar:./local/jsh/lib/asm-util.jar:./local/jsh/lib/nashorn.jar ./rhino/jrunscript/api.js jsh jrunscript/jsh/test/jsh-data.jsh.js");
						const relative = jsh.file.Location.directory.base( fifty.jsh.file.relative("../../..") );
						check(output, ["local/jsh/lib/asm.jar","local/jsh/lib/asm-commons.jar","local/jsh/lib/asm-tree.jar","local/jsh/lib/asm-util.jar","local/jsh/lib/nashorn.jar"].map(relative).map($api.fp.property("pathname")), {});
						jsh.shell.console(JSON.stringify(output,void(0),4));
					}

					fifty.tests.invocation.jdk21 = function() {
						const output = parse("java.scripting/com.sun.tools.script.shell.Main -classpath ./local/jsh/lib/asm.jar:./local/jsh/lib/asm-commons.jar:./local/jsh/lib/asm-tree.jar:./local/jsh/lib/asm-util.jar:./local/jsh/lib/nashorn.jar ./rhino/jrunscript/api.js jsh jrunscript/jsh/test/jsh-data.jsh.js");
						const relative = jsh.file.Location.directory.base( fifty.jsh.file.relative("../../..") );
						check(output, ["local/jsh/lib/asm.jar","local/jsh/lib/asm-commons.jar","local/jsh/lib/asm-tree.jar","local/jsh/lib/asm-util.jar","local/jsh/lib/nashorn.jar"].map(relative).map($api.fp.property("pathname")), {});
					}

					fifty.tests.invocation.macos = function() {
						const output = parse("java.scripting/com.sun.tools.script.shell.Main -classpath ./local/jsh/lib/asm.jar:./local/jsh/lib/asm-commons.jar:./local/jsh/lib/asm-tree.jar:./local/jsh/lib/asm-util.jar:./local/jsh/lib/nashorn.jar ./rhino/jrunscript/api.js jsh jrunscript/jsh/test/jsh-data.jsh.js");
						const relative = jsh.file.Location.directory.base( fifty.jsh.file.relative("../../..") );
						check(output, ["local/jsh/lib/asm.jar","local/jsh/lib/asm-commons.jar","local/jsh/lib/asm-tree.jar","local/jsh/lib/asm-util.jar","local/jsh/lib/nashorn.jar"].map(relative).map($api.fp.property("pathname")), {});
					}
				}
			//@ts-ignore
			)(fifty);
		}

		export interface Setting {
			set: (value: string) => void
			default: (f: () => string) => void
			getLauncherProperty: () => string
			loaderVmArguments: () => string[]
			getLoaderProperty: () => string
		}
	}

	export interface Source {
		getSourceFilesUnder: {
			(string: string): slime.jrunscript.native.java.net.URL[]
			(dir: slime.jrunscript.native.java.io.File): slime.jrunscript.native.java.io.File[]
		}

		/**
		 * (conditional; if underlying source root is a directory rather than a URL)
		 */
		File?: (path: string) => slime.jrunscript.native.java.io.File

		//	TODO	poaaibly equivalent to File
		/**
		 * (conditional; if underlying source root is a directory rather than a URL)
		 */
		getFile?: (path: string) => slime.jrunscript.native.java.io.File

		getPath: (path: string) => string
	}

	export interface Slime {
		launcher: {
			getClasses: any
			compile: any
		}

		home: any

		settings: {
			byName: (name: string) => settings.Setting

			/**
			 * Returns the effective value for a given setting in the context of the launcher process.
			 */
			getLauncherProperty: (name: string) => string

			//	Probably redundant but currently appears to be used in packaged shells, where applyTo does not apply in the same
			//	way given that there is no loader VM.
			sendPropertiesTo: (recipient: slime.internal.jrunscript.bootstrap.java.Command) => void

			applyTo: (recipient: slime.internal.jrunscript.bootstrap.java.Command) => void

			test: {
				invocation: slime.$api.fp.Mapping<settings.invocation.Input,settings.invocation.Output>
			}
		}

		Src: (p: {
			file?: slime.jrunscript.native.java.io.File
			url?: slime.jrunscript.native.java.net.URL
			resolve: (path: string) => Pick<slime.internal.jrunscript.bootstrap.Script,"toString"|"file">
		}) => Source

		/**
		 * (conditional; if this is an unbuilt local or remote shell)
		 */
		src?: Source
	}
}
