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
		jsh.script = $loader.module("module.js", {
			api: {
				js: jsh.js,
				file: jsh.file,
				http: function() {
					return jsh.http;
				},
				addClasses: jsh.loader.addClasses
			},
			workingDirectory: jsh.shell.PWD,
			script: (function() {
				var uri = $shell.getInvocation().getScript().getUri();
				if (uri  && uri.getScheme() && String(uri.getScheme()) == "file") {
					return jsh.file.filesystem.java.adapt(new Packages.java.io.File(uri)).file;
				}
			})(),
			uri: (function() {
				if ($shell.getInvocation().getScript().getUri()) {
					return String($shell.getInvocation().getScript().getUri().normalize().toString());
				}
			})(),
			uri: (function() {
				if ($shell.getInvocation().getScript().getUri()) {
					return String($shell.getInvocation().getScript().getUri().normalize().toString());
				}
			})(),
			packaged: (function() {
				//	TODO	push back into Invocation
				if ($jsh.getSystemProperties().getProperty("jsh.launcher.packaged")) {
					return jsh.file.filesystem.java.adapt(
						new Packages.java.io.File(
							$jsh.getSystemProperties().getProperty("jsh.launcher.packaged")
						)
					).file;
				}
				return null;
			})(),
			arguments: jsh.java.Array.adapt($shell.getInvocation().getArguments()).map(function(s) { return String(s); }),
			loader: (function() {
				if ($shell.getConfiguration().getPackagedCode()) {
					return new jsh.io.Loader({ _source: $shell.getConfiguration().getPackagedCode() });
				} else {
					return function(){}();
				}
			})()
		});
		jsh.shell.getopts = $api.deprecate(jsh.script.getopts);
	}
})
