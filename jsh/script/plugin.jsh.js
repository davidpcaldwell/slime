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
				var uri = $host.getInvocation().getScript().getUri();
				if (uri  && uri.getScheme() && String(uri.getScheme()) == "file") {
					return jsh.file.filesystem.java.adapt(new Packages.java.io.File(uri)).file;
				}
			})(),
			uri: (function() {
				if ($host.getInvocation().getScript().getUri()) {
					return String($host.getInvocation().getScript().getUri().normalize().toString());
				}
			})(),
			uri: (function() {
				if ($host.getInvocation().getScript().getUri()) {
					return String($host.getInvocation().getScript().getUri().normalize().toString());
				}
			})(),
			packaged: (function() {
				//	TODO	push back into Invocation
				if ($host.getSystemProperties().getProperty("jsh.launcher.packaged")) {
					return jsh.file.filesystem.java.adapt(
						new Packages.java.io.File(
							$host.getSystemProperties().getProperty("jsh.launcher.packaged")
						)
					).file;
				}
				return null;
			})(),
			arguments: jsh.java.Array.adapt($host.getInvocation().getArguments()).map(function(s) { return String(s); }),
			loader: (function() {
				if ($host.getLoader().getPackagedCode()) {
					return new jsh.io.Loader({ _source: $host.getLoader().getPackagedCode() });
				} else {
					return function(){}();
				}
			})()
		});
		jsh.shell.getopts = $api.deprecate(jsh.script.getopts);
	}
})
