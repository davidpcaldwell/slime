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
		jsh.loader.plugins(jsh.script.file.parent.pathname);

		var parameters = jsh.script.getopts({
			options: {
				to: jsh.file.Pathname,
				recursive: false,
				//	TODO	switch -library and -parameter to use new Object in jsh.script.getopts
				library: jsh.script.getopts.OBJECT(jsh.file.Pathname),
				compile: jsh.script.getopts.ARRAY(jsh.file.Pathname),
				resources: jsh.script.getopts.ARRAY(jsh.file.Pathname),
				norhino: false,
				//	TODO	allow multiple servlets with separate parameters
				servlet: String,
				parameter: jsh.script.getopts.OBJECT(String),
				"java:version": String
			}
		});

		var destination = (function() {
			if (!parameters.options.to) {
				jsh.shell.echo("Required: -to <pathname>");
				jsh.shell.exit(1);
			}

			if (/\.war$/.test(parameters.options.to)) {
				return {
					directory: jsh.shell.TMPDIR.createTemporary({ directory: true }),
					war: parameters.options.to
				};
			} else {
				return {
					directory: parameters.options.to.createDirectory({
						recursive: parameters.options.recursive,
						ifExists: function(dir) {
							dir.remove();
							return true;
						}
					})
				};
			}
		})();

		jsh.httpd.tools.build({
			destination: destination,
			rhino: !parameters.options.norhino,
			libraries: (function() {
				/** @type { { [x: string]: slime.jrunscript.file.Pathname } } */
				var options = parameters.options.library;
				/** @type { Parameters<slime.jsh.httpd.Exports["tools"]["build"]>[0]["libraries"] } */
				var rv = {};
				for (var x in options) {
					rv[x] = options[x].file;
				}
				return rv;
			})(),
			Resources: function() {
				parameters.options.resources.forEach(function(resources) {
					if (!resources.file) throw new Error("No file at " + resources);
					this.file(resources.file);
				},this);
			},
			compile: (function() {
				/** @type { slime.jrunscript.file.Pathname[] } */
				var options = parameters.options.compile;
				/** @type { slime.jrunscript.file.File[] } */
				var args = [];
				options.forEach(function(pathname) {
					args.push.apply(args,jsh.httpd.tools.getJavaSourceFiles(pathname));
				});
				return args;
			})(),
			servlet: parameters.options.servlet,
			parameters: parameters.options.parameter
		});
	}
//@ts-ignore
)($api,jsh);
