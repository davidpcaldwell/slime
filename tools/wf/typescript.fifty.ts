//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jsh.wf.internal.module {
	export namespace test {
		export const subject = (function(fifty: slime.fifty.test.Kit) {
			var script: Script = fifty.$loader.script("module.js");
			return script({
				library: {
					file: fifty.global.jsh.file,
					shell: fifty.global.jsh.shell,
					node: fifty.global.jsh.shell.tools.node
				}
			});
		//@ts-ignore
		})(fifty);

		export const fixtures = (function(fifty: slime.fifty.test.Kit) {
			var script: Script = fifty.$loader.script("module.js");
			return {
				mockedFilesystem: function(fs: slime.jrunscript.file.world.Filesystem) {
					return script({
						library: {
							file: fifty.global.jsh.file,
							shell: fifty.global.jsh.shell,
							node: fifty.global.jsh.shell.tools.node
						},
						world: {
							filesystem: fs
						}
					});
				}
			};
		//@ts-ignore
		})(fifty);
	}

	export namespace exports {
		export interface Typescript {
			/**
			 * Returns the default version of TypeScript.
			 */
			version: () => string

			typedoc: {
				invocation: (p: typedoc.Invocation) => slime.$api.fp.world.Question<
					{
						found: string
						notFound: void
						installing: string
						installed: string
					},
					slime.$api.fp.world.Sensor<
						slime.jrunscript.tools.node.Installation,
						slime.jrunscript.shell.run.AskEvents,
						slime.jrunscript.shell.run.Exit
					>
				>
			}
		}

		export namespace project {
			export interface Typescript {
				version: (project: slime.jsh.wf.Project) => string
				configurationFile: (project: slime.jsh.wf.Project) => slime.$api.fp.Maybe<slime.jrunscript.file.Location>
			}
		}
	}


	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { $api, jsh } = fifty.global;

			fifty.tests.Project = function() {
				var fs = fifty.jsh.file.mock.fixtures().Filesystem.from.descriptor;

				const VERSION = "4.8.4";

				var mock = fs({
					contents: {
						project: {
							contents: {
								empty: {
									contents: {
									}
								},
								specified: {
									contents: {
										"tsc.version": {
											text: VERSION
										}
									}
								},
								js: {
									contents: {
										"jsconfig.json": {
											text: ""
										}
									}
								},
								ts: {
									contents: {
										"tsconfig.json": {
											text: ""
										}
									}
								}
							}
						}
					}
				});

				var subject = test.fixtures.mockedFilesystem(mock);

				verify(subject).Project.typescript.version({
					base: "/project/empty"
				}).is(subject.typescript.version());

				verify(subject).Project.typescript.version({
					base: "/project/specified"
				}).is(VERSION);

				verify(subject).Project.typescript.configurationFile({
					base: "/project/empty"
				}).evaluate(function(maybe) { return maybe.present; }).is(false);

				verify(subject).Project.typescript.configurationFile({
					base: "/project/js"
				}).evaluate(function(maybe) { return maybe.present; }).is(true);

				verify(subject).Project.typescript.configurationFile({
					base: "/project/js"
				}).evaluate(function(maybe) { return maybe.value.pathname; }).evaluate(String).is("/project/js/jsconfig.json");

				verify(subject).Project.typescript.configurationFile({
					base: "/project/ts"
				}).evaluate(function(maybe) { return maybe.present; }).is(true);

				verify(subject).Project.typescript.configurationFile({
					base: "/project/ts"
				}).evaluate(function(maybe) { return maybe.value.pathname; }).evaluate(String).is("/project/ts/tsconfig.json");
			}
		}
	//@ts-ignore
	)(fifty);

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {
				fifty.run(fifty.tests.Project);
			};
		}
	//@ts-ignore
	)(fifty);

	export namespace typedoc {
		export interface Invocation {
			stdio: Parameters<slime.jrunscript.shell.Exports["Invocation"]["create"]>[0]["stdio"]

			configuration: {
				typescript: {
					version: string
					/**
					 * Pathname of the project file (for example, `tsconfig.json`, `jsconfig.json`).
					 */
					configuration: string
				}
			}

			/**
			 * The pathname of the project to document.
			 */
			project: string

			/**
			 * Destination to provide as the `out` configuration parameter.
			 */
			out?: string
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.manual = {};
			fifty.tests.manual.typedoc = {};
			fifty.tests.manual.typedoc.invocation = function() {
				const { jsh } = fifty.global;
				const { subject } = test;

				const out = fifty.jsh.file.temporary.location();
				const invocation = subject.typescript.typedoc.invocation({
					stdio: {},
					configuration: {
						typescript: {
							version: subject.typescript.version(),
							configuration: "jsconfig.json"
						}
					},
					project: fifty.jsh.file.relative("../..").pathname,
					out: out.pathname
				});
				jsh.shell.console(JSON.stringify(invocation));
			}
		}
	//@ts-ignore
	)(fifty);
}

namespace slime.jsh.wf.internal.typescript {
	export interface Context {
		library: {
			file: slime.jrunscript.file.Exports
			shell: slime.jrunscript.shell.Exports
			node: slime.jsh.shell.tools.node.Exports
		}

		world?: {
			filesystem?: slime.jrunscript.file.world.Filesystem
		}
	}

	export interface Exports {
		module: slime.jsh.wf.internal.module.exports.Typescript
		Project: slime.jsh.wf.internal.module.exports.project.Typescript
	}

	export type Script = slime.loader.Script<Context,Exports>
}
