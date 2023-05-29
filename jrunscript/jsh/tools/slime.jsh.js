//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.jsh.Global } jsh
	 */
	function(jsh) {
		//	TODO	Allow compilation dependencies
		var parameters = jsh.script.getopts({
			options: {
				from: jsh.file.Pathname,
				to: jsh.file.Pathname,
				version: String,
				format: "zip"
			}
		});

		if (!parameters.options.from.directory) {
			jsh.shell.console("Not found: " + parameters.options.from + "; failing.");
			jsh.shell.exit(1);
		}
		var from = parameters.options.from.directory;
		var format = parameters.options.format;

		var build = (function() {
			if (format == "zip") {
				var TMP_BUILD = jsh.shell.TMPDIR;
				return TMP_BUILD.getRelativePath("slime/" + from.pathname.basename + "-" + String(new Date().getTime())).createDirectory({ recursive: true });
			} else if (format == "directory") {
				return parameters.options.to.createDirectory();
			} else {
				throw new Error("Unknown -format: " + format);
			}
		})();

		jsh.loader.file(jsh.script.getRelativePath("slime.js")).slime.build.jsh(from,build,{},{
			source: parameters.options.version,
			target: parameters.options.version
		});

		if (format == "zip") {
			jsh.file.zip({ from: build.pathname, to: parameters.options.to });
		} else if (format == "directory") {
		} else {
		}
	}
//@ts-ignore
)(jsh);
