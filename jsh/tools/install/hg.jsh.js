//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2016 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var parameters = jsh.script.getopts({
	options: {
		test: false
	}
});

if (parameters.options.test) {
	var suite = new jsh.unit.Suite({
		initialize: function(scope) {
			scope.api = jsh.script.loader.file("hg.js");
		}
	});

	suite.part("distribution", {
		parts: {
			low: {
				execute: function(scope,verify) {
					verify(1).is(1);
					verify(scope).api.is.type("object");

					var distribution = scope.api.distribution.osx({ os: "10.9.2" });
					verify(distribution).distribution.url.is("https://www.mercurial-scm.org/mac/binaries/Mercurial-3.4.2-py2.7-macosx10.9.zip");

					verify(scope.api).evaluate(function() { return this.distribution.osx({ os: "10.3.2" }) }).threw.type(Error);

					verify(scope.api).distribution.osx({ os: "10.12.2" }).distribution.url.is("https://www.mercurial-scm.org/mac/binaries/Mercurial-4.0.1-macosx10.11.pkg");
				}
			}
		}
	});

	jsh.unit.interface.create(suite, {
		view: "console"
	});
}

var installed = (function() {
	var command = jsh.shell.PATH.getCommand("hg");
	if (command) {
		var output = jsh.shell.run({
			command: command,
			arguments: ["-q", "version"],
			stdio: {
				output: String
			},
			evaluate: function(result) {
				return result.stdio.output.split("\n")[0];
			}
		});
		var versionMatcher = /.*\(version ([\d\.]+)(?:.*)\)/;
		var version = versionMatcher.exec(output)[1];
		return {
			version: version
		}
	} else {
		return null;
	}
})();

var api = jsh.script.loader.file("hg.js");

if (jsh.shell.os.name == "Mac OS X") {
	jsh.shell.console("Detected OS X " + jsh.shell.os.version);

	var distribution = api.distribution.osx({ os: jsh.shell.os.version });

	if (installed && distribution.hg == installed.version) {
		jsh.shell.console("Already installed: hg " + installed.version);
		jsh.shell.exit(0);
	} else if (installed) {
		jsh.shell.console("Found version: " + installed.version + "; upgrading to " + distribution.hg);
	}

	jsh.shell.console("Getting " + distribution.distribution.url);
	var file = jsh.tools.install.get({
		url: distribution.distribution.url
	});

	if (/\.pkg$/.test(file.pathname.basename)) {
		jsh.shell.console("Install: " + file);
		jsh.shell.run({
			command: "open",
			arguments: [file]
		});
		jsh.shell.console("Please execute the graphical installer.");
		jsh.shell.exit(1);
	} else {
		throw new Error("Unimplemented: installation of file type that is not .pkg: " + file);
	}
} else {
	throw new Error("Unimplemented: installation of Mercurial for non-OS X system.");
}
