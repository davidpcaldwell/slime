//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { slime.jrunscript.Packages } Packages
	 * @param { slime.$api.Global } $api
	 * @param { slime.jsh.Global } jsh
	 */
	function(Packages,$api,jsh) {
		jsh.script.cli.main(
			$api.fp.pipe(
				jsh.script.cli.option.boolean({ longname: "replace" }),
				jsh.script.cli.option.string({ longname: "version" }),

				//	TODO	options below conflict; should think harder about this but adding --remove to deal with specific use
				//			case while refactoring for #2092.
				jsh.script.cli.option.boolean({ longname: "remove" }),
				function(p) {
					if (p.options.version) {
						jsh.shell.console("--version not supported; current version of Java will be used.");
						jsh.shell.exit(1);
					}

					var libraries = jsh.internal.bootstrap.jsh.current.installation.libraries;
					//jsh.shell.console("Libraries: " + String(libraries));
					var shellRhino = libraries.rhino(jsh.internal.bootstrap.java.getMajorVersion());
					//jsh.shell.console("shellRhino: " + shellRhino);

					if (p.options.replace || p.options.remove) {
						var local = shellRhino.local();
						if (local) {
							local.forEach(function(_url) {
								var _file = new Packages.java.io.File(_url.toURI());
								jsh.shell.console("Removing " + _file + " ...");
							});
						}
					}

					if (p.options.remove) {
						return;
					}

					var ignore = shellRhino.download();
					jsh.shell.console("Rhino installed at " + ignore);
				}
			)
		);
	}
//@ts-ignore
)(Packages,$api,jsh);
