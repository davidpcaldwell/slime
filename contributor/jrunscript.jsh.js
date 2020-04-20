//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2015 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var parameters = jsh.script.getopts({
	options: {
		//	undocumented; used by suite.jsh.js
		"shell:built": jsh.file.Pathname,

		noselfping: false,
		executable: false,

		unit: String,
		view: "console",

		// TODO: does this work? Is it necessary?
		"chrome:profile": jsh.file.Pathname
	}
});

var project = jsh.script.loader.file("suite.js");
var environment = new project.Environment({
	src: jsh.script.file.parent.parent,
	home: parameters.options["shell:built"],
	noselfping: parameters.options.noselfping,
	executable: parameters.options.executable
});
var suite = new jsh.unit.html.Suite();

var SRC = jsh.script.file.parent.parent;

suite.add("internal/slime", new jsh.unit.part.Html({
		//	Functionality used internally or accessed through loader/jrunscript (although untested by loader/jrunscript)
	pathname: SRC.getRelativePath("loader/api.html")
}));
suite.add("internal/mime", new jsh.unit.part.Html({
	pathname: SRC.getRelativePath("loader/mime.api.html")
}));
suite.add("internal/jrunscript", new jsh.unit.part.Html({
	//	Test cases of loader implementation
	pathname: SRC.getRelativePath("loader/jrunscript/api.html")
}));
suite.add("internal/other", new jsh.unit.part.Html({
	//	Test cases involving the HTML test runner itself
	pathname: SRC.getRelativePath("loader/api/test/data/1/api.html")
	//	TODO	loader/jrunscript/java has some tests
	//	TODO	loader/jrunscript/test/data/2/ has some tests but they require some classes in classpath
}));

suite.add("$api", new jsh.unit.part.Html({
	pathname: SRC.getRelativePath("loader/$api.api.html")
}));

suite.add("js/web", new jsh.unit.part.Html({
	pathname: SRC.getRelativePath("js/web/api.html")
}));

suite.add("js/object/other", new jsh.unit.part.Html({
	pathname: SRC.getRelativePath("js/object/api.html")
}));
suite.add("js/object/Error", new jsh.unit.part.Html({
	pathname: SRC.getRelativePath("js/object/Error.api.html")
}));

suite.add("js/document", new jsh.unit.part.Html({
	pathname: SRC.getRelativePath("js/document/api.html")
}));

suite.add("js/time", new jsh.unit.part.Html({
	pathname: SRC.getRelativePath("js/time/api.html")
}));

suite.add("jrunscript/java/host", new jsh.unit.part.Html({
	pathname: SRC.getRelativePath("jrunscript/host/api.html"),
	// TODO: why is supplying the module this way necessary?
	environment: Object.assign({}, environment, { module: jsh.java })
}));

suite.add("jrunscript/io/main", new jsh.unit.part.Html({
	pathname: SRC.getRelativePath("jrunscript/io/api.html")
}));

suite.add("jrunscript/io/mime", new jsh.unit.part.Html({
	pathname: SRC.getRelativePath("jrunscript/io/mime.api.html")
}));

suite.add("jrunscript/io/grid", new jsh.unit.part.Html({
	pathname: SRC.getRelativePath("jrunscript/io/grid.api.html")
}));

suite.add("jrunscript/file/main", new jsh.unit.part.Html({
	pathname: SRC.getRelativePath("rhino/file/api.html")
}));

suite.add("jrunscript/file/Searchpath", new jsh.unit.part.Html({
	pathname: SRC.getRelativePath("rhino/file/api.Searchpath.html")
}));

suite.add("jrunscript/ip", new jsh.unit.part.Html({
	pathname: SRC.getRelativePath("rhino/ip/api.html"),
	environment: { noselfping: parameters.options.noselfping }
}));

suite.add("jrunscript/http", new jsh.unit.part.Html({
	pathname: SRC.getRelativePath("rhino/http/client/api.html")
}));

suite.add("jrunscript/document/module", new jsh.unit.part.Html({
	pathname: SRC.getRelativePath("rhino/document/api.html")
}));
suite.add("jrunscript/document/jsh", new jsh.unit.part.Html({
	pathname: SRC.getRelativePath("rhino/document/plugin.jsh.api.html"),
	environment: environment
}));

suite.add("jrunscript/shell/main", new jsh.unit.part.Html({
	pathname: SRC.getRelativePath("rhino/shell/api.html"),
	environment: { noselfping: parameters.options.noselfping }
}));
suite.add("jrunscript/shell/browser", new jsh.unit.part.Html({
	pathname: SRC.getRelativePath("rhino/shell/browser/api.html")
}));

suite.add("jrunscript/java/tools/api", new jsh.unit.part.Html({
	pathname: SRC.getRelativePath("rhino/tools/api.html")
}));
suite.add("jrunscript/java/tools/jsh", new jsh.unit.part.Html({
	pathname: SRC.getRelativePath("rhino/tools/plugin.jsh.api.html")
}));
// TODO: does this require hg be installed?
suite.add("jrunscript/tools/hg", new jsh.unit.part.Html({
	pathname: SRC.getRelativePath("rhino/tools/hg/api.html")
}));
// TODO: does this require git be installed?
suite.add("jrunscript/tools/git", new jsh.unit.part.Html({
	pathname: SRC.getRelativePath("rhino/tools/git/api.html")
}));

suite.add("jsh/loader", new jsh.unit.part.Html({
	pathname: SRC.getRelativePath("jsh/loader/internal.api.html"),
	environment: environment
}));

suite.add("jsh/jsh.tools.install", new jsh.unit.part.Html({
	pathname: SRC.getRelativePath("jsh/tools/install/plugin.jsh.api.html")
}));

suite.add("jsh/jsh.loader", new jsh.unit.part.Html({
	pathname: SRC.getRelativePath("jsh/loader/loader.api.html"),
	environment: environment
}));

suite.add("jsh/jsh.shell", new jsh.unit.part.Html({
	pathname: SRC.getRelativePath("rhino/shell/plugin.jsh.api.html"),
	// TODO: do we actually need environment here?
	// TODO: do we actually need noselfping here?
	environment: Object.assign({}, environment, { noselfping: parameters.options.noselfping })
}));

suite.add("jsh/jsh.script", new jsh.unit.part.Html({
	pathname: SRC.getRelativePath("jsh/script/plugin.jsh.api.html"),
	environment: environment
}));

suite.add("jsh/jsh.tools", new jsh.unit.part.Html({
	pathname: SRC.getRelativePath("rhino/tools/plugin.jsh.jsh.tools.api.html")
}));

suite.add("jsh-tools", new jsh.unit.part.Html({
	pathname: SRC.getRelativePath("jsh/tools/internal.api.html"),
	environment: environment
}));

suite.add("jsh.shell.jsh", new jsh.unit.Suite.Fork({
	// TODO: moved this from integration tests and reproduced current test without much thought; could be that we should not be
	// using the built shell, or should be using more shells
	run: jsh.shell.jsh,
	shell: (environment.jsh.built) ? environment.jsh.built.home : environment.jsh.unbuilt.src,
	script: SRC.getFile("rhino/shell/test/jsh.shell.jsh.suite.jsh.js"),
	arguments: ["-view","stdio"]
}));

suite.add("testing/constructs", new jsh.unit.part.Html({
	pathname: SRC.getRelativePath("loader/api/unit.api.html")
}));
suite.add("testing/html", new jsh.unit.part.Html({
	pathname: SRC.getRelativePath("loader/api/api.html")
}));
suite.add("testing/jsh.unit/definition", new jsh.unit.part.Html({
	pathname: SRC.getRelativePath("jsh/unit/plugin.jsh.api.html")
}));
if (false) suite.add("testing/jsh.unit/bitbucket", new jsh.unit.Suite.Fork({
	run: jsh.shell.jsh,
	shell: (environment.jsh.built) ? environment.jsh.built.homne : environment.jsh.unbuilt.src,
	script: SRC.getFile("jsh/unit/test/bitbucket.jsh.js"),
	arguments: ["-view", "stdio"]
}));
suite.add("testing/integration", new function() {
	var src = SRC;
	this.parts = {
		htmlReload: {
			execute: function(scope,verify) {
				var result = jsh.shell.jsh({
					shell: src,
					script: src.getFile("jsh/unit/test/fail.jsh.js"),
					evaluate: function(result) {
						return result;
					}
				});
				verify(result).status.is(1);
			}
		},
		// htmlReload: new ScriptPart({
		// 	shell: src,
		// 	script: src.getFile("jsh/unit/test/fail.jsh.js"),
		// 	check: function(verify) {
		// 		verify(this).status.is(1);
		// 	}
		// }),
		suiteWithScenario: new jsh.unit.Suite.Fork({
			run: jsh.shell.jsh,
			shell: src,
			script: src.getFile("jsh/unit/test/suite.jsh.js"),
			arguments: [
				"-view", "stdio"
			]
		}),
		nakedScenario: new jsh.unit.Suite.Fork({
			run: jsh.shell.jsh,
			shell: src,
			script: src.getFile("jsh/unit/test/scenario.jsh.js"),
			arguments: [
				"-view", "stdio"
			]
		}),
	}
});

var requireTomcat = function() {
	if (!environment.jsh.built.home.getSubdirectory("lib/tomcat")) {
		jsh.shell.jsh({
			shell: environment.jsh.built.home,
			script: environment.jsh.src.getFile("jsh/tools/install/tomcat.jsh.js")
		})
	}
}

suite.add("servlet/api", new jsh.unit.part.Html({
	pathname: SRC.getRelativePath("rhino/http/servlet/api.html")
}));

suite.add("jsh/jsh.httpd", new jsh.unit.part.Html({
	pathname: SRC.getRelativePath("rhino/http/servlet/plugin.jsh.api.html")
}));

suite.add("jsh/jsh.ui", new jsh.unit.part.Html({
	pathname: SRC.getRelativePath("rhino/ui/plugin.jsh.api.html")
}));

// TODO: requires Tomvcat, right?
// TODO: move to rhino/http/servlet, creating internal.api.html?
var servletPart = new function() {
	// TODO: enable
	var COFFEESCRIPT = false;

	this.initialize = function() {
		environment.jsh.built.requireTomcat();
	};

	this.parts = {};

	this.parts.suite = {
		execute: function(scope,verify) {
			var result = jsh.shell.jsh({
				shell: environment.jsh.built.home,
				script: environment.jsh.src.getFile("jsh/test/jsh.httpd/httpd.jsh.js")
			});
			verify(result).status.is(0);
		}
	};

	if (COFFEESCRIPT) {
		this.parts.coffee = {
			execute: function(scope,verify) {
				var result = jsh.shell.jsh({
					shell: environment.jsh.built.home,
					script: environment.jsh.src.getFile("jsh/test/jsh.httpd/httpd.jsh.js"),
					arguments: ["-suite", "coffee"]
				});
				verify(result).status.is(0);
			}
		}
	}
};
suite.add("servlet/suite", servletPart);

if (false) suite.add("provision", new jsh.unit.part.Html({
	pathname: SRC.getRelativePath("jsh/tools/provision/api.html")
}));


jsh.unit.interface.create(suite.build(), new function() {
	// TODO: is this redundant? Value of "chrome" should just work, right? Or is it because we want to specify instance?
	if (parameters.options.view == "chrome") {
		this.chrome = {
			profile: parameters.options["chrome:profile"]
		};
	} else {
		this.view = parameters.options.view;
	}
	if (parameters.options.unit) {
		var tokens = parameters.options.unit.split(":");
		this.path = suite.getPath({
			part: tokens[0],
			element: tokens[1]
		});
	}
});
