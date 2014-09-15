//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

plugin({
	isReady: function() {
		return jsh.js && jsh.java && jsh.file && jsh.http && jsh.shell;
	},
	load: function() {
		var source = (function() {
			var _script = $jsh.getInvocation().getScript();
			var _uri = _script.getUri();
			var rv = {};
			if (_uri) {
				if (_uri.getScheme() && String(_uri.getScheme()) == "file") {
					rv.file = jsh.file.filesystem.java.adapt(new Packages.java.io.File(_uri)).file;
				}
				rv.uri = String(_uri.normalize().toString());
			}
			if ($jsh.getPackageFile()) {
				rv.packaged = {
					file: jsh.file.filesystem.java.adapt($jsh.getPackageFile()).file,
					loader: new jsh.io.Loader({ _source: $jsh.getPackagedCode() })
				}
			}
			return rv;
		})();
		jsh.script = $loader.module("module.js", jsh.js.Object.set({}, {
			api: {
				js: jsh.js,
				file: jsh.file,
				http: function() {
					return jsh.http;
				},
				addClasses: jsh.loader.java.add
			},
			directory: jsh.shell.PWD,
			arguments: jsh.java.Array.adapt($jsh.getInvocation().getArguments()).map(function(s) { return String(s); }),
		}, source));
		jsh.shell.getopts = $api.deprecate(jsh.script.getopts);
		jsh.script.Application.run = function(descriptor) {
			try {
				return new jsh.script.Application(descriptor).run.apply(null, jsh.script.arguments);
			} catch (e) {
				if (e.usage) {
					jsh.shell.echo("Usage: " + jsh.script.file + " <command> [arguments]");
					jsh.shell.exit(1);
				} else if (e.commandNotFound) {
					jsh.shell.echo("Command not found: " + e.commandNotFound);
					jsh.shell.exit(1);
				}
			}
		};
	}
})