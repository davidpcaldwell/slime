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
		var invocation = jsh.script.cli.invocation(
			$api.Function.pipe(
				jsh.script.cli.option.pathname({ longname: "installation" }),
				jsh.script.cli.option.string({ longname: "account" }),
				jsh.script.cli.option.string({ longname: "project" })
			)
		);

		var loader = new jsh.file.Loader({ directory: jsh.script.file.parent });
		/** @type { slime.jrunscript.tools.gcloud.Script } */
		var script = loader.script("../../module.js");
		var module = script({
			library: {
				file: jsh.file,
				shell: jsh.shell,
				install: jsh.tools.install
			}
		});
		var executor = (function() {
			var installation = module.cli.Installation.at(invocation.options.installation.toString());
			if (invocation.options.account) {
				var account = installation.account(invocation.options.account);
				if (invocation.options.project) return account.project(invocation.options.project);
				return account;
			}
			return installation;
		})();

		/** @type { slime.jrunscript.tools.gcloud.cli.Command<{ arguments: string[] },any> } */
		var command = {
			invocation: function(p) {
				return {
					command: p.arguments[0],
					arguments: p.arguments.slice(1)
				}
			},
			result: function(json) {
				return json;
			}
		};

		var result = executor.command(command).argument({ arguments: invocation.arguments }).run();
		jsh.shell.console(JSON.stringify(result,void(0),4));
	}
//@ts-ignore
)($api,jsh);
