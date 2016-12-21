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

if (jsh.shell.os.name == "Mac OS X") {
	jsh.shell.console("Running OS X version " + jsh.shell.os.version);
	
	var getDistribution = function(minorVersion) {
		if (minorVersion < distributions.osx[0].minor) {
			jsh.shell.console("This OS X distribution is too old; upgrade to at least " + distributions.osx[0].version);
			jsh.shell.exit(1);
		}
		if (minorVersion > distributions.osx[distributions.osx.length-1].minor) {
			jsh.shell.console("Version too high.");
			jsh.shell.exit(1);
		}
	}
	
	var minorVersion = Number(jsh.shell.os.version.split(".")[1]);
	var distribution = getDistribution(minorVersion);
}

jsh.shell.console(JSON.stringify(installed));
