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
	 * @param { slime.jsh.unit.mock.github.test.Context } $context
	 * @param { slime.loader.Export<slime.jsh.unit.mock.github.test.Exports> } $export
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
		 * @param { slime.jsh.unit.mock.github.test.Settings } p
		 * @returns
		 */
		var echoJshBash = function(PATH,p) {
			/** @type { string[] } */
			var command = [];
			var PROTOCOL = (p.mock) ? "http" : "https";
			if (PATH.getCommand("curl")) {
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
			} else if (PATH.getCommand("wget")) {
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

		/**
		 *
		 * @param { slime.jsh.unit.mock.github.test.Settings } p
		 * @returns
		 */
		var getCommand = function(PATH,p) {
			if (!p) p = {};
			var command = echoJshBash(PATH,p);
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

		$export({
			startMock: startMock,
			getCommand: getCommand
		})
	}
//@ts-ignore
)($api,$context,$export);
