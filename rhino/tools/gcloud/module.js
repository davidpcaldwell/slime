//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.$api.Global } $api
	 * @param { slime.jrunscript.tools.gcloud.Context } $context
	 * @param { slime.loader.Export<slime.jrunscript.tools.gcloud.Exports> } $export
	 */
	function($api,$context,$export) {
		/**
		 *
		 * @param { string } executable
		 * @param { string } config
		 * @param { string } account
		 * @param { string } project
		 * @returns
		 */
		var executeCommand = function(executable,config,account,project) {
			/** @type { slime.jrunscript.tools.gcloud.cli.Executor } */
			var rv = function(command) {
				return {
					argument: function(argument) {
						var toResult = command.result || $api.fp.identity;
						return {
							run: $api.fp.world.old.ask(
								function(events) {
									var result;
									var invocation = command.invocation(argument);
									$api.fp.world.now.action(
										$context.library.shell.world.action,
										$context.library.shell.Invocation.from.argument({
											//	TODO	could this dependency be narrowed to world filesystem rather than whole library?
											command: executable,
											arguments: $api.Array.build(function(rv) {
												if (account) rv.push("--account", account);
												if (project) rv.push("--project", project);
												rv.push("--format", "json");
												rv.push(invocation.command);
												rv.push.apply(rv, invocation.arguments);
											}),
											environment: (config) ? $api.Object.compose($context.library.shell.environment, { CLOUDSDK_CONFIG: config }) : void(0),
											stdio: {
												output: "string",
												error: "line"
											}
										}),
										{
											stderr: function(e) {
												events.fire("console", e.detail.line);
											},
											exit: function(e) {
												if (e.detail.status != 0) throw new Error("Exit status: " + e.detail.status);
												var json = JSON.parse(e.detail.stdio.output);
												result = toResult(json);
											}
										}
									);
									return result;
								}
							)
						}
					}
				}
			};

			return rv;
		}

		var macOsInstallers = function(version) {
			return {
				x86_64: "https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/google-cloud-cli-" + version + "-darwin-x86_64.tar.gz",
				aarch64: "https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/google-cloud-cli-" + version + "-darwin-arm.tar.gz"
			}
		}

		/** @type { { [os: string]: { [arch: string ]: string }} } */
		var INSTALLER = {
			"Mac OS X": macOsInstallers("417.0.1")
		};

		$export({
			cli: {
				Installation: {
					at: function at(installation) {
						if (typeof(installation) == "undefined") throw new TypeError("'installation' must not be undefined.");
						//	TODO	could this dependency be narrowed to world filesystem rather than whole library?
						var executable = $context.library.file.world.filesystems.os.relative(installation, "bin/gcloud");
						//	TODO	a lot of repetition below, but a lot of test coverage would be needed to safely refactor it
						return {
							config: function(config) {
								return {
									account: function(account) {
										return {
											project: function(project) {
												return {
													command: executeCommand(executable,config,account,project)
												}
											},
											command: executeCommand(executable,config,account,void(0))
										}
									},
									command: executeCommand(executable,config,void(0),void(0))
								}
							},
							account: function(account) {
								return {
									project: function(project) {
										return {
											command: executeCommand(executable,void(0),account,project)
										}
									},
									command: executeCommand(executable,void(0),account,void(0))
								}
							},
							command: executeCommand(executable,void(0),void(0),void(0))
						}
					},
					create: function create(pathname) {
						return function(events) {
							var url = $api.fp.result(INSTALLER, $api.fp.pipe(
								$api.fp.optionalChain($context.library.shell.os.name),
								$api.fp.optionalChain($context.library.shell.os.arch)
							));
							if (!url) {
								throw new Error("Could not install: No installer found for " + $context.library.shell.os.name + "/" + $context.library.shell.os.arch);
							}
							events.fire("console", "Installing from: " + url);
							$context.library.install.install({
								source: {
									url: url
								},
								archive: {
									folder: function(file) {
										return "google-cloud-sdk";
									}
								},
								destination: {
									location: pathname
								}
							})({
								console: function(e) {
									events.fire("console", e.detail);
								}
							})
						};
					}
				}
			}
		})
	}
//@ts-ignore
)($api,$context,$export);
