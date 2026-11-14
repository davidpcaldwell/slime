//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { slime.$api.Global } $api
	 * @param { slime.jsh.Global } jsh
	 */
	function($api,jsh) {
		/** @returns { slime.jsh.test.remote.SubshellDescription } */
		var describe = function() {
			/** @type { { [name: string]: string } } */
			var properties = {};
			["http.proxyHost", "http.proxyPort", "https.proxyHost", "https.proxyPort", "slime.issue69", "slime.issue69.inherited"].forEach(function(name) {
				properties[name] = jsh.shell.properties.get(name);
			});
			return {
				installation: jsh.shell.jsh.Installation.from.current(),
				url: jsh.script.url.toString(),
				arguments: jsh.script.arguments,
				environment: {
					parent: jsh.shell.environment.SLIME_ISSUE69_PARENT,
					child: jsh.shell.environment.SLIME_ISSUE69_CHILD,
					httpHost: jsh.shell.environment.JSH_HTTP_PROXY_HOST,
					httpPort: jsh.shell.environment.JSH_HTTP_PROXY_PORT,
					httpsHost: jsh.shell.environment.JSH_HTTPS_PROXY_HOST,
					httpsPort: jsh.shell.environment.JSH_HTTPS_PROXY_PORT
				},
				properties: properties,
				invocation: jsh.internal.bootstrap.jsh.invocation.fromSystemProperties(),
				java: jsh.shell.properties.get("java.version"),
				engine: jsh.shell.engine
			};
		};

		if (jsh.script.arguments[0] == "child") {
			jsh.shell.echo(JSON.stringify(describe()));
			jsh.shell.console("issue69 child stderr");
			jsh.shell.exit(23);
		}

		var parent = describe();
		var results = ["omitted", "false", "true"].map(function(mode) {
			/** @type { { [name: string]: string } } */
			var properties = {};
			["http.proxyHost", "http.proxyPort", "https.proxyHost", "https.proxyPort"].forEach(function(name) {
				properties[name] = parent.properties[name];
			});
			properties["slime.issue69"] = "property " + mode;
			/** @type { slime.jsh.shell.oo.UrlInvocation<slime.jsh.test.remote.SubshellResult> } */
			var invocation = {
				script: jsh.script.url,
				arguments: ["child", mode, "argument with spaces", "quotes'\"$"],
				environment: $api.Object.compose(jsh.shell.environment, { SLIME_ISSUE69_CHILD: mode }),
				properties: properties,
				stdio: { output: "string", error: "string" },
				evaluate: function(result) {
					return {
						mode: mode,
						status: result.status,
						output: result.stdio.output,
						error: result.stdio.error,
						command: String(result.command)
					};
				}
			};
			if (mode != "omitted") invocation.fork = mode == "true";
			return jsh.shell.jsh(invocation);
		});
		jsh.shell.echo(JSON.stringify({ parent: parent, results: results }));
	}
//@ts-ignore
)($api,jsh);
