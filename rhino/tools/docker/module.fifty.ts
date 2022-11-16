//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.tools {
	export namespace docker {
		export interface Context {
			library: {
				web: slime.web.Exports
				file: slime.jrunscript.file.Exports
				http: slime.jrunscript.http.client.Exports
				curl: slime.jrunscript.http.client.curl.Exports
				shell: slime.jrunscript.shell.Exports
			}
		}
	}

	export namespace docker.test {
		export const subject: Exports = (function(fifty: slime.fifty.test.Kit) {
			const curl = (
				function() {
					var script: slime.jrunscript.http.client.curl.Script = fifty.$loader.script("../../../rhino/http/client/curl.js");
					return script({
						console: fifty.global.jsh.shell.console,
						library: {
							web: fifty.global.jsh.web,
							io: fifty.global.jsh.io,
							shell: fifty.global.jsh.shell
						}
					});
				}
			)();
			const script: Script = fifty.$loader.script("module.js");
			return script({
				library: {
					web: fifty.global.jsh.web,
					file: fifty.global.jsh.file,
					http: fifty.global.jsh.http,
					curl: curl,
					shell: fifty.global.jsh.shell
				}
			});
		//@ts-ignore
		})(fifty);
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.lab = fifty.test.Parent();
			fifty.tests.manual = {};
		}
	//@ts-ignore
	)(fifty);

	export namespace docker {
		export namespace install {
			export interface Events {
				installed: slime.jrunscript.file.Directory
				found: slime.jrunscript.file.Directory
			}
		}

		export interface Exports {
			install: (p: {
				version?: string
				library: {
					shell: slime.jrunscript.shell.Exports
					install: slime.jrunscript.tools.install.Exports
				}
				sudo?: {
					askpass: slime.jrunscript.file.File
				}
				destination: slime.jrunscript.file.Pathname
			}) => slime.$api.fp.world.Tell<install.Events>
		}

		export interface Engine {
			/**
			 * Determines whether the Docker daemon is running.
			 */
			isRunning: () => boolean

			volume: {
				/**
				 * Copies a file from the host machine, at `from` to the volume specified by `volume` at the
				 * volume-relative path indicated by `path`.
				 */
				copyFileTo: (p: {
					from: string
					volume: string
					path: string
				}) => slime.$api.fp.world.old.Tell<cli.Events>

				/**
				 * Runs a command on busybox with the given volume mounted at `/volume`.
				 */
				executeCommandWith: (p: {
					volume: string
					command: string
					arguments?: string[]
				}) => slime.$api.fp.world.old.Ask<cli.Events, string>
			}
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { $api, jsh } = fifty.global;

				const containerRun: cli.StringCommand<{
					cidfile?: string
					mounts?: string[]
					image: string
					command: string
					arguments?: string[]
				}> = (
					function() {
						return {
							invocation: function(p) {
								return {
									command: ["container", "run"],
									arguments: $api.Array.build(function(rv) {
										if (p.cidfile) rv.push("--cidfile", p.cidfile);
										if (p.mounts) p.mounts.forEach(function(mount) {
											rv.push("--mount", mount)
										});
										rv.push(p.image);
										rv.push(p.command);
										if (p.arguments) rv.push.apply(rv, p.arguments);
									})
								}
							}
						}
					}
				)();

				const volumeCreate: cli.StringCommand<void> = {
					invocation: function(p) {
						return {
							command: ["volume", "create"],
							arguments: []
						}
					}
				}

				const dumpErrors: $api.events.Handler<cli.Events> = {
					stderr: function(e) {
						jsh.shell.console(e.detail);
					}
				}

				fifty.tests.manual.volume = function() {
					const cli = test.subject.engine.cli;

					const volume = cli.command(volumeCreate).input().run(dumpErrors);

					const ls = function() {
						var result = test.subject.engine.volume.executeCommandWith({
							volume: volume,
							command: "ls",
							arguments: [
								"-l",
								"/volume"
							]
						});
						jsh.shell.console(result());
					}

					//	TODO	Use world-oriented Tell
					test.subject.engine.volume.copyFileTo({
						from: fifty.jsh.file.relative("module.fifty.ts").pathname,
						volume: volume,
						path: "module.fifty.ts"
					});

					ls();

					//	TODO	this command should use shell-based stdout / stderr handling, rather than the standard
					//			Docker CLI swallow-standard-output handling. Need another kind of Command, probably.
					//	TODO	Use world-oriented Ask/Tell
					test.subject.engine.volume.executeCommandWith({
						volume: volume,
						command: "chown",
						arguments: [
							"root:root",
							"/volume/module.fifty.ts"
						]
					});

					ls();
				}
			}
		//@ts-ignore
		)(fifty);

		export interface Exports {
			engine: slime.jrunscript.tools.docker.Engine
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				fifty.tests.cli = {};
				fifty.tests.cli.exec = function() {
					var invocation = test.subject.engine.cli.exec({
						interactive: true,
						tty: true,
						container: "CONTAINER",
						command: "COMMAND",
						arguments: [
							"--foo", "bar"
						]
					});
					fifty.verify(invocation).command.evaluate(function(p) { return p.toString(); }).is("exec");
					fifty.verify(invocation).arguments[0].is("--interactive");
					fifty.verify(invocation).arguments[1].is("--tty");
					fifty.verify(invocation).arguments[2].is("CONTAINER");
					fifty.verify(invocation).arguments[3].is("COMMAND");
					fifty.verify(invocation).arguments[4].is("--foo");
					fifty.verify(invocation).arguments[5].is("bar");
				}
			}
		//@ts-ignore
		)(fifty);
	}

	export namespace docker.cli {
		interface Invocation {
			command: string[]
			arguments: string[]
		}

		export interface Events {
			stderr: string
		}

		export interface Command<P,R> {
			invocation: (p: P) => Invocation

			output: {
				/**
				 * Whether the command emits JSON-formatted lines, and hence whether `stdout` should be parsed as lines of JSON
				 * or should be passed as a string.
				 */
				json: boolean

				/**
				 * Whether this *command* *can* be truncated, and hence the `--no-trunc` argument is available to cause it
				 * *not* to be truncated.
				 */
				truncated: boolean
			}

			result: (output: any) => R
		}

		export interface JsonCommand<P,R> {
			invocation: (p: P) => Invocation

			output: {
				json: {
					/**
					 * Whether this command *can* be truncated, and hence the `--no-trunc` argument is available to cause it
					 * *not* to be truncated.
					 */
					truncated: boolean
				}
			}

			map?: (json: any) => R
		}

		export interface StringCommand<P,R = string> {
			invocation: (p: P) => Invocation

			result?: (output: string) => R
		}

		export type AnyCommand = Command<any,any> | JsonCommand<any,any> | StringCommand<any,any>

		export interface Interface {
			exec: (p: {
				interactive: boolean
				tty: boolean
				container: string
				command: string
				arguments: string[]
			}) => Invocation

			shell: (p: Invocation) => slime.jrunscript.shell.invocation.Argument

			command: {
				<I,O>(command: Command<I,O>): {
					input: (i: I) => {
						run: slime.$api.fp.world.old.Ask<Events, O>
					}
				}

				<I,O>(command: StringCommand<I,O>): {
					input: (i: I) => {
						run: slime.$api.fp.world.old.Ask<Events, O>
					}
				}

				<I,O>(command: JsonCommand<I,O>): {
					input: (i: I) => {
						run: slime.$api.fp.world.old.Ask<Events, O[]>
					}
				}
			}
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { $api, jsh } = fifty.global;

				const containerCreate: StringCommand<{ image: string }> = {
					invocation: function(p) {
						return {
							command: ["container", "create"],
							arguments: [p.image]
						}
					}
				};

				fifty.tests.lab.cli = fifty.test.Parent();

				fifty.tests.lab.cli.containerCreateRemove = function() {
					const containerRemove: StringCommand<{ id: string }> = {
						invocation: function(p) {
							return {
								command: ["container", "rm"],
								arguments: [p.id]
							}
						}
					};

					const containerListAll: JsonCommand<void,{ ID: string }> = {
						invocation: () => {
							return {
								command: ["container", "ls"],
								arguments: ["-a"]
							}
						},
						output: {
							json: {
								truncated: true
							}
						}
					};

					var containerExists = function(id: string): boolean {
						return test.subject.engine.cli.command(containerListAll).input().run().some(function(container) {
							return container.ID == id;
						})
					}

					var created = test.subject.engine.cli.command(containerCreate).input({ image: "busybox" }).run({
						stderr: function(e) {
							jsh.shell.console(e.detail);
						}
					});
					fifty.verify(containerExists(created)).is(true);

					var removed = test.subject.engine.cli.command(containerRemove).input({ id: created }).run({
						stderr: function(e) {
							jsh.shell.console(e.detail);
						}
					});
					fifty.verify(containerExists(created)).is(false);
				}
			}
		//@ts-ignore
		)(fifty);
	}

	export namespace docker {
		export interface Engine {
			cli: cli.Interface
		}
	}

	export namespace docker.api {
		export type Endpoint<P,Q,B,R> = (p?: {
			path?: P
			query?: Q
			body?: B
		}) => R

		//	TODO	automatically generate this by parsing the YAML
		export interface Interface {
			SystemInfo: Endpoint<void, void, void, slime.external.docker.engine.paths.SystemInfo.Responses.$200>

			ContainerList: Endpoint<void, slime.external.docker.engine.paths.ContainerList.QueryParameters, void, slime.external.docker.engine.paths.ContainerList.Responses.$200>
			ContainerCreate: Endpoint<void, slime.external.docker.engine.paths.ContainerCreate.QueryParameters, slime.external.docker.engine.paths.ContainerCreate.Parameters.Body, slime.external.docker.engine.paths.ContainerCreate.Responses.$201>
			ContainerDelete: Endpoint<slime.external.docker.engine.paths.ContainerDelete.PathParameters, slime.external.docker.engine.paths.ContainerDelete.QueryParameters, void, void>

			VolumeList: Endpoint<void, slime.external.docker.engine.paths.VolumeList.QueryParameters, void, slime.external.docker.engine.paths.VolumeList.Responses.$200>
			VolumeCreate: Endpoint<void, void, slime.external.docker.engine.paths.VolumeCreate.Parameters.VolumeConfig, slime.external.docker.engine.paths.VolumeCreate.Responses.$201>
			VolumeDelete: Endpoint<slime.external.docker.engine.paths.VolumeDelete.PathParameters, slime.external.docker.engine.paths.VolumeDelete.QueryParameters, void, void>
		}

		(
			function(
				fifty: slime.fifty.test.Kit
			) {
				const { verify } = fifty;
				const { $api, jsh } = fifty.global;

				jsh.shell.console("Loading ...");
				var api: docker.api.Interface = docker.test.subject.engine.api;
				jsh.shell.console("Loaded.");

				fifty.tests.lab.api = fifty.test.Parent();
				fifty.tests.manual.api = {};

				fifty.tests.manual.api.info = function() {
					var info = api.SystemInfo();
					jsh.shell.console(JSON.stringify(info, void(0), 4));
				}

				fifty.tests.lab.api.containerCd = function() {
					function exists(id: string): boolean {
						return api.ContainerList({ query: { all: true } }).some(function(container) {
							return container.Id == id;
						});
					}

					var created = api.ContainerCreate({ query: {}, body: { Image: "busybox" } });
					verify(exists(created.Id)).is(true);
					api.ContainerDelete({ path: { id: created.Id }});
					verify(exists(created.Id)).is(false);
				}

				fifty.tests.lab.api.volumeCd = function() {
					function exists(name: string): boolean {
						return api.VolumeList({ query: {} }).Volumes.some(function(volume) {
							return volume.Name == name;
						});
					}

					var created = api.VolumeCreate({ body: {} });
					verify(exists(created.Name)).is(true);
					api.VolumeDelete({ path: { name: created.Name }});
					verify(exists(created.Name)).is(false);
				}
			}
		//@ts-ignore
		)(fifty);
	}

	export namespace docker {
		export interface Engine {
			api: api.Interface
		}
	}

	export namespace docker {
		export type Script = slime.loader.Script<Context,Exports>
	}

	export namespace docker {
		export interface Exports {
			kubectl: slime.jrunscript.tools.kubernetes.cli.Exports
		}
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			fifty.tests.suite = function() {
				fifty.run(fifty.tests.cli.exec);
				if (fifty.global.jsh.shell.PATH.getCommand("docker")) fifty.run(fifty.tests.lab.cli);
				if (fifty.global.jsh.tools.docker.engine.api) fifty.run(fifty.tests.lab.api);
				fifty.load("kubectl.fifty.ts");
			}
		}
	//@ts-ignore
	)(fifty);
}

namespace slime.jrunscript.tools.docker.internal {
	export type Endpoint<P,Q,B,R> = (spi: slime.jrunscript.http.client.spi.Implementation, p: Parameters<slime.jrunscript.tools.docker.api.Endpoint<P,Q,B,R>>[0]) => R
}
