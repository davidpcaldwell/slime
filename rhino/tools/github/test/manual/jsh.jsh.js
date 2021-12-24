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
	 * @param { slime.jsh.Global } jsh
	 */
	function($api,jsh) {
		var startMock = function() {
			var web = new jsh.unit.mock.Web({ trace: true });
			jsh.loader.plugins(jsh.script.file.parent.parent.parent);
			//	TODO	push these kinds of declarations back into a mock object that aggregates hosts and handler
			web.addHttpsHost("127.0.0.1");
			web.addHttpsHost("raw.githubusercontent.com");
			web.addHttpsHost("api.github.com");
			web.addHttpsHost("github.com");
			web.add(jsh.unit.mock.Web.github({
				//	TODO	flip to true to test possibility of accessing private repositories
				//	TODO	this should actually be per-repository, though
				private: false,
				src: {
					davidpcaldwell: {
						slime: jsh.tools.git.Repository({ directory: jsh.script.file.parent.parent.parent.parent.parent.parent })
					}
				}
			}));
			web.start();
			return web;
		};

		var echoJshBash = function(p) {
			var command = [];
			var PROTOCOL = (p.mock) ? "http" : "https";
			if (jsh.shell.PATH.getCommand("curl")) {
				command.push("curl", "-v");
				if (p.token) {
					command.push("-u", "davidpcaldwell:" + p.token);
				}
				if (p.mock) {
					command.push("--proxy", "https://127.0.0.1:" + p.mock.https.port);
				}
				command.push("-L");
				command.push(PROTOCOL + "://raw.githubusercontent.com/davidpcaldwell/slime/master/jsh.bash");
				return command;
			} else if (jsh.shell.PATH.getCommand("wget")) {
				command.push("wget");
				if (p.token) {
					command.push("--http-user=" + "davidpcaldwell");
					command.push("--http-password=" + p.token);
				}
				command.push(PROTOCOL + "://raw.githubusercontent.com/davidpcaldwell/slime/master/jsh.bash");
				if (p.mock) {
					command.push("-e", "use_proxy=yes");
					command.push("-e", "http_proxy=" + "http://127.0.0.1:" + p.mock.port);
				}
				command.push("-O", "-");
				return command;
			} else {
				throw new TypeError("No way to download files.");
			}
		}

		var getCommand = function(p) {
			if (!p) p = {};
			var command = echoJshBash(p);
			command.push("|");
			var PROTOCOL = "https";
			if (p.mock) {
				command.push("env");
				command.push("JSH_HTTP_PROXY_HOST=127.0.0.1", "JSH_HTTP_PROXY_PORT=" + p.mock.port);
				command.push("JSH_HTTPS_PROXY_HOST=127.0.0.1", "JSH_HTTPS_PROXY_PORT=" + p.mock.https.port);
				command.push("JSH_LAUNCHER_GITHUB_PROTOCOL=http");
				command.push("JSH_GITHUB_API_PROTOCOL=http");
				command.push("JSH_DISABLE_HTTPS_SECURITY=true");
				if (p && p.optimize) command.push("JSH_OPTIMIZE_REMOTE_SHELL=true");
				if (p && p.debug) command.push("JSH_LAUNCHER_DEBUG=true");
				PROTOCOL = "http";
			} else if (p && p.debug) {
				command.push("env");
				command.push("JSH_LAUNCHER_DEBUG=true");
			}
			if (p.token) {
				command.push("JSH_GITHUB_USER=davidpcaldwell", "JSH_GITHUB_PASSWORD=" + p.token);
			}
			command.push("bash", "-s");
			command.push(PROTOCOL + "://raw.githubusercontent.com/davidpcaldwell/slime/master/jsh/test/jsh-data.jsh.js");
			return command;
		};

		var emit = function(command) {
			var paste = command.join(" ");
			jsh.shell.console(paste);
			if (jsh.shell.PATH.getCommand("pbcopy")) {
				jsh.shell.run({
					command: "pbcopy",
					stdio: {
						input: paste
					}
				});
				jsh.shell.console("Copied to clipboard.");
			}
		}

		jsh.script.cli.wrap({
			commands: {
				serve: $api.Function.pipe(
					//	emit information about requests sent to GitHub
					jsh.script.cli.option.boolean({ longname: "optimize" }),

					//	turn on jsh launcher console-based debugging
					jsh.script.cli.option.boolean({ longname: "debug" }),

					function(p) {
						var web = startMock();
						jsh.shell.console("HTTP port: " + web.port + " HTTPS port: " + web.https.port);
						var token = jsh.shell.jsh.src.getFile("local/github/tokens/davidpcaldwell");
						var command = getCommand({
							mock: web,
							optimize: p.options.optimize,
							debug: p.options.debug,
							token: (token) ? token.read(String) : void(0)
						});
						emit(command);
						web.run();
					}
				),
				remote: function() {
					//	TODO	for now, we do not fully automate this command because of the piping
					var command = getCommand({
						token: jsh.shell.jsh.src.getFile("local/github/tokens/davidpcaldwell").read(String)
					});
					emit(command);
				},
				test: $api.Function.pipe(
					//	turn on jsh launcher console-based debugging
					jsh.script.cli.option.boolean({ longname: "debug" }),
					function(p) {
						var command = getCommand({
							debug: p.options.debug
						});
						emit(command);
					}
				)
			}
		});
	}
//@ts-ignore
)($api,jsh);