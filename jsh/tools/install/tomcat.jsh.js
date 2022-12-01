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
		var parameters = jsh.script.getopts({
			options: {
				version: String,
				local: jsh.file.Pathname,
				replace: false,
				to: jsh.shell.jsh.lib.getRelativePath("tomcat"),
				show: false
			}
		});

		if (parameters.options.show) {
			var installed = jsh.shell.tools.tomcat.installed({ home: parameters.options.to.directory });
			if (!installed) {
				jsh.shell.console("No Tomcat found at " + parameters.options.to);
			} else {
				jsh.shell.console("Tomcat " + installed.version.toString() + " found at " + parameters.options.to);
			}
			jsh.shell.exit(0);
		}

		jsh.shell.tools.tomcat.install({
			version: parameters.options.version,
			local: (parameters.options.local) ? parameters.options.local.file : null,
			replace: parameters.options.replace,
			to: parameters.options.to
		});
	}
//@ts-ignore
)($api,jsh);
