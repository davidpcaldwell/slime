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

jsh.tools.install.hg.install();
