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
	 * @param { slime.jsh.script.cli.main } main
	 */
	function(Packages,$api,jsh,main) {
		main(
			function() {
				var getProperty = function(name) {
					var rv = Packages.java.lang.System.getProperty(name);
					if (rv) return String(rv);
					return null;
				};

				var home = (jsh.shell.jsh.home) ? jsh.shell.jsh.home.toString() : null;
				var src = (jsh.shell.jsh.src) ? jsh.shell.jsh.src.toString() : null;
				var logging = getProperty("java.util.logging.config.file");
				var rhino = (function() {
					var rv = {
						running: (function() {
							if (typeof(Packages.org.mozilla.javascript.Context) != "function") return false;
							return Boolean(Packages.org.mozilla.javascript.Context.getCurrentContext());
						})()
					};
					rv.version = (rv.running) ? String(Packages.org.mozilla.javascript.Context.getCurrentContext().getImplementationVersion()) : null;
					rv.optimization = (rv.running) ? Number(Packages.org.mozilla.javascript.Context.getCurrentContext().getOptimizationLevel()) : null;
					rv.classpath = (jsh.shell.rhino && jsh.shell.rhino.classpath) ? String(jsh.shell.rhino.classpath) : null;
					return rv;
				})();
				jsh.shell.echo(
					JSON.stringify({
						src: src,
						home: home,
						logging: logging,
						foo1: getProperty("foo.1"),
						foo2: getProperty("foo.2"),
						tmp: String(jsh.shell.TMPDIR),
						rhino: rhino
					})
				);
			}
		)
	}
//@ts-ignore
)(Packages,$api,jsh,main);
