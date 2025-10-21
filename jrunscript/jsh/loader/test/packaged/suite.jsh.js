//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { slime.jrunscript.Packages } Packages
	 * @param { slime.$api.jrunscript.Global } $api
	 * @param { slime.jsh.Global } jsh
	 */
	function(Packages,$api,jsh) {
		var parameters = jsh.script.getopts({
			options: {
				classes: jsh.file.Pathname,
				view: "console"
			}
		});

		var src = jsh.script.file.parent.parent.parent.parent.parent;

		/** @type { slime.jrunscript.file.Directory } */
		var classes = (parameters.options.classes) ? parameters.options.classes.directory : null;
		if (!classes) {
			// TODO: Not DRY; this code is also in jsh/loader/loader.api.html
			classes = jsh.shell.TMPDIR.createTemporary({ directory: true });
			jsh.shell.console("Compiling AddClasses ...");
			jsh.java.tools.javac({
				destination: classes.pathname,
				sourcepath: jsh.file.Searchpath([src.getRelativePath("jsh/loader/test/addClasses/java")]),
				arguments: [src.getRelativePath("jsh/loader/test/addClasses/java/test/AddClasses.java")]
			});
		}

		var RHINO_LIBRARIES = $api.fp.Thunk.now(
			$api.fp.now(
				/** @type { slime.$api.fp.Partial<void,slime.jrunscript.native.java.io.File[]> } */($api.fp.Partial.match({
					if: function() { return typeof(Packages.org.mozilla.javascript.Context) != "function"; },
					then: function() { return null; }
				})),
				$api.fp.Partial.else(
					$api.fp.Thunk.map(
						jsh.internal.api.rhino.forCurrentJava,
						function(library) {
							return library.local( jsh.shell.jsh.lib.pathname.os.adapt() );
						},
						function(locations) {
							if (locations == null) return null;
							return locations.map(jsh.file.Location.java.File.simple);
						}
					)
				)
			)
		);

		//	TODO	there is an undocumented API for this now
		var LINE_SEPARATOR = String(Packages.java.lang.System.getProperty("line.separator"));

		jsh.shell.console("src = " + src);
		var definition = jsh.script.loader.value("suite.js", {
			src: src,
			RHINO_LIBRARIES: RHINO_LIBRARIES,
			LINE_SEPARATOR: LINE_SEPARATOR,
			getClasses: function() {
				return classes;
			}
		});

		var suite = new jsh.unit.Suite(definition);

		jsh.unit.interface.create(suite, {
			view: parameters.options.view
		});
	}
//@ts-ignore
)(Packages,$api,jsh);
