//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh.internal.launcher {
	export interface Libraries {
		/**
		 * The classpath for the Java-version-appropriate version of Rhino.
		 */
		rhino: (jdkMajorVersion: number) => {
			local: () => slime.jrunscript.native.java.net.URL[]
			download: () => slime.jrunscript.native.java.net.URL[]
		}

		nashorn: slime.jrunscript.native.java.net.URL[]
	}

	export interface Installation {
		toString: () => string

		libraries?: Libraries
		packaged?: slime.jrunscript.native.java.io.File
		home?: slime.jrunscript.native.java.io.File

		graal?: slime.jrunscript.native.java.io.File
		profiler?: slime.jrunscript.native.java.io.File
		shellClasspath: (p?: { source: number, target: number }) => slime.jrunscript.native.java.net.URL[]
	}

	export interface Engine {
		/**
		 * The name of the `jsh` main class for this engine.
		 */
		main: string

		exit: (status: number) => void
	}

	export interface Jsh {
		engines: slime.internal.jrunscript.bootstrap.PerEngine<Engine>
	}

	export interface Jsh {
		exit: (status: number) => void
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
				const pwd = jsh.internal.bootstrap.properties.get("user.dir");
				const main = jsh.file.os.directory.relativePath("rhino/jrunscript/api.js")(pwd);

				const parse = function(command: string): Output {
					const input: Input = {
						jrunscript: jrunscript,
						pwd: pwd,
						command: command
					};

					return jsh.internal.bootstrap.jsh.test.invocation(input);
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

	export interface Classpath {
		_urls: slime.jrunscript.native.java.net.URL[]
		append: (classpath: Classpath) => void
		local: () => string
	}

	export interface Jsh {
		Classpath: (_urls?: Omit<slime.jrunscript.Array<slime.jrunscript.native.java.net.URL>,"getClass"> ) => Classpath

		Unbuilt: (p: {
			src?: Source
			lib?: {
				url?: string
				file?: slime.jrunscript.native.java.io.File
			}
			//	If Rhino was explicitly provided via a jsh setting
			rhino: slime.jrunscript.native.java.net.URL[]
		}) => Installation & {
			compileLoader: (p?: {
				to?: slime.jrunscript.native.java.io.File
				source?: number
				target?: number
			}) => slime.jrunscript.native.java.io.File
		}

		Built: (p: slime.jrunscript.native.java.io.File) => Installation

		Packaged: (p: slime.jrunscript.native.java.io.File) => Installation

		shell?: {
			packaged?: string
			rhino: any
			classpath: any
			current: Installation
		}

		//	TODO: Set in main.js
		current?: {
			installation?: Installation
		}

		invocation: () => invocation.Output

		test: {
			invocation: slime.$api.fp.Mapping<invocation.Input,invocation.Output>
		}
	}

	export interface Additions {
		slime: slime.jsh.internal.launcher.Slime
		jsh: slime.jsh.internal.launcher.Jsh
	}

	export interface JavaAdditions {
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {
				fifty.run(fifty.tests.invocation);
			}
		}
	//@ts-ignore
	)(fifty);

	export type Global = slime.internal.jrunscript.bootstrap.Global<Additions,JavaAdditions>
}
