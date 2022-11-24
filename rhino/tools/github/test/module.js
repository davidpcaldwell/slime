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
	 * @param { slime.loader.Export<slime.jsh.unit.mock.github.Exports> } $export
	 */
	function($api,$context,$export) {
		/**
		 *
		 * @param { slime.jsh.Global } jsh
		 * @returns
		 */
		var startMock = function(jsh) {
			if (!jsh.unit.mock.Web.github) throw new Error("Required: Mock GitHub, loaded from rhino/tools/github plugin");
			var web = new jsh.unit.mock.Web({ trace: true });
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
						slime: jsh.tools.git.Repository({ directory: $context.slime })
					}
				}
			}));
			web.start();
			return web;
		};

		/**
		 * @param { slime.jrunscript.file.Searchpath } PATH
		 * @param { Pick<slime.jsh.unit.mock.github.Settings,"mock" | "token" | "branch"> } p
		 * @returns
		 */
		var getDownloadJshBashCommand = function(PATH,p) {
			/** @type { string[] } */
			var command = [];
			var PROTOCOL = (p.mock) ? "http" : "https";
			var branch = p.branch || "master";
			var URL = PROTOCOL + "://raw.githubusercontent.com/davidpcaldwell/slime/" + branch + "/jsh.bash";
			if (PATH.getCommand("curl")) {
				command.push("curl", "-v");
				if (p.token) {
					command.push("-u", "davidpcaldwell:" + p.token());
				}
				if (p.mock) {
					command.push("--proxy", "https://127.0.0.1:" + p.mock.https.port);
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
		 * @param { slime.jsh.unit.mock.github.Settings } p
		 * @returns
		 */
		var getBashInvocationCommand = function(p) {
			/** @type { string[] } */
			var command = [];
			var PROTOCOL = "https";
			var branch = p.branch || "master";
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
				command.push("JSH_GITHUB_USER=davidpcaldwell", "JSH_GITHUB_PASSWORD=" + p.token());
			}
			if (p && p.branch) command.push("JSH_LAUNCHER_GITHUB_BRANCH=" + p.branch);
			//	TODO	for now, we simply try to force-disable the Rhino debugger (because by default we will be running in
			//			Nashorn), even if this script is running in the Rhino debugger. Probably could do more here to think this
			//			through, including allowing the running of remote shells under Rhino, but bootstrapping with Nashorn may
			//			be fine.
			command.push("JSH_DEBUG_SCRIPT=");
			command.push("bash", "-s");
			command.push(PROTOCOL + "://raw.githubusercontent.com/davidpcaldwell/slime/" + branch + "/jsh/test/jsh-data.jsh.js");
			return command;
		}

		/**
		 *
		 * @param { slime.jsh.unit.mock.github.Settings } p
		 * @returns
		 */
		var getCommand = function(PATH,p) {
			if (!p) p = {};
			var command = getDownloadJshBashCommand(PATH,p);
			command.push("|");
			command = command.concat(getBashInvocationCommand(p));
			return command.join(" ");
		};

		$export({
			startMock: startMock,
			getDownloadJshBashCommand: getDownloadJshBashCommand,
			getBashInvocationCommand: getBashInvocationCommand,
			getCommandLine: getCommand
		})
	}
//@ts-ignore
)($api,$context,$export);
