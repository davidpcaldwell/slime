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
	 * @param { slime.jrunscript.tools.homebrew.Context } $context
	 * @param { slime.loader.Export<slime.jrunscript.tools.homebrew.Exports> } $export
	 */
	function($api,$context,$export) {
		/**
		 *
		 * @param { Parameters<slime.jrunscript.tools.homebrew.Exports["get"]>[0] } p
		 * @returns { slime.jrunscript.tools.homebrew.Installation }
		 */
		function getLocalHomebrew(p) {
			var to = p.location.directory;
			if (!to) {
				to = p.location.createDirectory({
					exists: function(dir) {
						return false;
					},
					recursive: true
				});

				$context.library.shell.run({
					command: "tar",
					arguments: ["xz", "--strip", "1", "-C", to.pathname.basename],
					//	TODO	might not exist
					directory: to.parent,
					stdio: {
						input: new $context.library.http.Client().request({
							url: "https://github.com/Homebrew/brew/tarball/master"
						}).body.stream
					}
				});
			}

			var homebrew = (
				function(directory) {
					var program = directory.getFile("bin/brew");

					var brew = function(command,args) {
						$context.library.shell.run({
							command: program,
							arguments: (function() {
								var rv = [command];
								if (args) rv.push.apply(rv,args);
								return rv;
							})()
						})
					}

					/** @type { slime.jrunscript.tools.homebrew.Installation } */
					var rv = {
						directory: to,
						update: function() {
							brew("update")
						},
						install: function install(p) {
							brew(
								"install",
								(function() {
									var rv = [];
									rv.push(p.formula);
									return rv;
								})()
							)
						},
						upgrade: function(p) {
							brew(
								"upgrade",
								(function() {
									var rv = [];
									rv.push(p.formula);
									return rv;
								})()
							)
						},
						command: function(command) {
							return {
								parameters: function(parameters) {
									var invocation = command.invocation(parameters);
									var tell = $context.library.shell.world.run(
										$context.library.shell.Invocation.create({
											command: program,
											arguments: [invocation.command].concat(invocation.arguments || []),
											environment: invocation.environment,
											stdio: {
												output: "line",
												error: "line"
											}
										})
									);
									return {
										run: $api.Function.world.old.ask(function(events) {
											var rv;
											tell({
												stdout: function(e) {
													events.fire("stdout", e.detail.line);
												},
												stderr: function(e) {
													events.fire("stderr", e.detail.line);
												},
												exit: function(e) {
													var status = e.detail.status;
													if (status != 0) throw new Error("Exit status: " + status);
													rv = command.result(e.detail.stdio.output);
												}
											})
											return rv;
										})
									}
								}
							}
						}
					}

					return rv;
				}
			)(to);

			return homebrew;
		}

		$export({
			get: function(p) {
				return getLocalHomebrew(p);
			},
			commands: {
				install: {
					invocation: function(p) {
						return {
							command: "install",
							arguments: [p.formula]
						}
					},
					result: function(output) {
						return output;
					}
				},
				list: {
					invocation: function() {
						return {
							command: "list",
							arguments: ["--full-name"]
						}
					},
					result: function(output) {
						return output.split("\n").filter(function(line) {
							return Boolean(line);
						});
					}
				}
			}
		});
	}
//@ts-ignore
)($api,$context,$export);
