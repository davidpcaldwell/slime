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
	 * @param { slime.jrunscript.tools.github.internal.test.Context } $context
	 * @param { slime.loader.Export<slime.jsh.test.remote.Exports> } $export
	 */
	function($api,$context,$export) {
		/**
		 * @type { slime.jsh.test.remote.Exports["startMock"] }
		 */
		var startMock = function(jsh) {
			var web = jsh.unit.mock.Web({ trace: true });
			//	TODO	push these kinds of declarations back into a mock object that aggregates hosts and handler
			web.addHttpsHost("127.0.0.1");
			web.addHttpsHost("raw.githubusercontent.com");
			web.addHttpsHost("api.github.com");
			web.addHttpsHost("github.com");
			web.add(
				jsh.unit.mock.web.Github({
					//	TODO	flip to true to test possibility of accessing private repositories
					//	TODO	this should actually be per-repository, though
					private: false,
					src: {
						davidpcaldwell: {
							slime: jsh.tools.git.oo.Repository({ directory: $context.slime })
						}
					}
				})
			);
			web.start();
			return web;
		};

		/**
		 * @param { slime.jrunscript.file.Searchpath } PATH
		 * @param { Pick<slime.jsh.test.remote.Settings,"mock" | "token" | "branch"> } p
		 * @returns
		 */
		var downloadJshScriptCommand = function(PATH,p) {
			/** @type { string[] } */
			var command = [];
			var URL = (
				((p.mock) ? "http" : "https")
					+ "://raw.githubusercontent.com/davidpcaldwell/slime/"
					+ (p.branch || "main") + "/jsh"

			);
			if (PATH.getCommand("curl")) {
				command.push("curl", "-v");
				if (p.token) {
					command.push("-u", "davidpcaldwell:" + p.token());
				}
				if (p.mock) {
					command.push("--proxy", "https://127.0.0.1:" + p.mock.https.port);
					//	Inserting this to try to pass macOS tests on GitHub; if this comment remains, it worked:
					//	TODO	--ca-native is also worth a try
					command.push("--proxy-insecure");
				}
				command.push("-L");
				command.push(URL);
				return command;
			} else if (PATH.getCommand("wget")) {
				command.push("wget");
				if (p.token) {
					command.push("--http-user=" + "davidpcaldwell");
					command.push("--http-password=" + p.token());
				}
				command.push(URL);
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

		/**
		 *
		 * @param { { settings: slime.jsh.test.remote.Settings, script: string } } p
		 * @returns
		 */
		var processJshScriptCommand = function(p) {
			/** @type { string[] } */
			var command = [];
			var PROTOCOL = "https";
			var branch = p.settings.branch || "main";
			if (p.settings.mock) {
				command.push("env");
				command.push("JSH_HTTP_PROXY_HOST=127.0.0.1", "JSH_HTTP_PROXY_PORT=" + p.settings.mock.port);
				command.push("JSH_HTTPS_PROXY_HOST=127.0.0.1", "JSH_HTTPS_PROXY_PORT=" + p.settings.mock.https.port);
				command.push("JSH_LAUNCHER_GITHUB_PROTOCOL=http");
				command.push("JSH_GITHUB_API_PROTOCOL=http");
				command.push("JSH_DISABLE_HTTPS_SECURITY=true");
				if (p.settings.optimize) command.push("JSH_OPTIMIZE_REMOTE_SHELL=true");
				if (p.settings.debug) command.push("JSH_LAUNCHER_BASH_DEBUG=true");
				if (p.settings.debug) command.push("JSH_LAUNCHER_DEBUG=true");
				PROTOCOL = "http";
			} else if (p.settings.debug) {
				command.push("env");
				command.push("JSH_LAUNCHER_BASH_DEBUG=1");
				command.push("JSH_LAUNCHER_DEBUG=1");
			}
			if (p.settings.token) {
				command.push("JSH_GITHUB_USER=davidpcaldwell", "JSH_GITHUB_PASSWORD=" + p.settings.token());
			}
			if (p.settings.branch) command.push("JSH_LAUNCHER_GITHUB_BRANCH=" + p.settings.branch);
			//	TODO	for now, we simply try to force-disable the Rhino debugger (because by default we will be running in
			//			Nashorn), even if this script is running in the Rhino debugger. Probably could do more here to think this
			//			through, including allowing the running of remote shells under Rhino, but bootstrapping with Nashorn may
			//			be fine.
			command.push("JSH_DEBUG_SCRIPT=");
			command.push("bash", "-s");
			command.push(p.script);
			//	TODO	expose this somehow?
			//command.push(PROTOCOL + "://raw.githubusercontent.com/davidpcaldwell/slime/" + branch + "/" + p.script);
			return command;
		}

		/**
		 * @type { slime.jsh.test.remote.Exports["getCommandLine"] }
		 */
		var getCommand = function(p) {
			var command = downloadJshScriptCommand(p.PATH,p.settings);
			command.push("|");
			command = command.concat(processJshScriptCommand({
				settings: p.settings,
				script: p.script
			}));
			return command.join(" ");
		};

		/**
		 *
		 * @param { string[] } line
		 * @param { string } [input]
		 * @param { { [name: string]: string } } [environment]
		 * @returns { slime.jrunscript.shell.run.Intention }
		 */
		var toShellIntention = function(line, input, environment) {
			return {
				command: line[0],
				arguments: line.slice(1),
				environment: function(was) {
					return $api.Object.compose(was, environment);
				},
				stdio: {
					input: input,
					output: "string",
					error: "string"
				}
			};
		};

		/** @type { slime.$api.fp.Identity<slime.jrunscript.shell.run.Intention> } */
		var asShellIntention = $api.fp.identity;

		var getOutput = $api.fp.pipe(
			asShellIntention,
			$api.fp.world.Sensor.old.mapping({
				sensor: $context.library.shell.subprocess.question
			}),
			$api.fp.impure.tap(function(t) {
				if (t.status != 0) {
					throw new Error("Exit status: " + t.status + "\nStandard error:\n" + t.stdio.error);
				}
			}),
			$api.fp.property("stdio"),
			$api.fp.property("output")
		)

		/** @type { slime.jsh.test.remote.Exports["getShellIntention"] } */
		var getShellIntention = function(p) {
			//	When running remote shell from command line, we download the launcher script using curl and then pipe it
			//	to `bash`, hence the two step process below in which the first download is sent as input to the second
			//	command

			var download = downloadJshScriptCommand(
				p.PATH,
				p.settings
			);
			// jsh.shell.console("Downloading ...");
			// jsh.shell.console(download.join(" "));
			var launcherBashScript = $api.fp.now.invoke(
				toShellIntention(download),
				getOutput
			);
			//jsh.shell.console("Script starts with:\n" + launcherBashScript.split("\n").slice(0,10).join("\n"));

			var invoke = processJshScriptCommand({
				settings: p.settings,
				script: p.script
			});
			//jsh.shell.console("Invoking ...");
			//jsh.shell.console(invoke.join(" "));
			var shellIntention = toShellIntention(
				invoke,
				launcherBashScript,
				{ JSH_LAUNCHER_BASH_DEBUG: "1", JSH_EMBED_BOOTSTRAP_DEBUG: "true" }
			);
			return shellIntention;
		};

		$export({
			startMock: startMock,
			getCommandLine: getCommand,
			getShellIntention: getShellIntention
		})
	}
//@ts-ignore
)($api,$context,$export);
