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
				to: jsh.file.Pathname(jsh.shell.tools.tomcat.Installation.from.jsh().base),
				show: false
			}
		});

		/** @type { slime.jsh.shell.tools.tomcat.Installed } */
		var installation = {
			base: parameters.options.to.toString()
		};

		if (parameters.options.show) {
			var version = jsh.shell.tools.tomcat.Installation.getVersion(
				installation
			);
			if (!version.present) {
				jsh.shell.console("No Tomcat found at " + parameters.options.to);
			} else {
				jsh.shell.console("Tomcat " + version.value + " found at " + installation.base);
			}
			jsh.shell.exit(0);
		}

		$api.fp.world.now.action(
			jsh.shell.tools.tomcat.Installation.require(installation),
			{
				version: parameters.options.version,
				replace: (parameters.options.replace) ? function(version) { return true; } : function(version) { return false; }
			}
		);
	}
//@ts-ignore
)($api,jsh);
