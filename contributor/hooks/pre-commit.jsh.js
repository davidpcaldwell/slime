var repository = new jsh.tools.git.Repository({ directory: jsh.script.file.parent.parent.parent });
var configuration = repository.config({
	arguments: ["--list"]
});

var getConfiguration = function() {
	return repository.config({
		arguments: ["--list"]
	});
};

var requireConfigurationValue = function(name) {
	if (!getConfiguration()[name]) {
		jsh.shell.console("Missing " + name + "; aborting commit and obtaining value from UI.");
		var value = jsh.ui.askpass.gui({
			prompt: "Enter Git configuration value for " + name,
			nomask: true
		});
		repository.config({
			arguments: [name, value]
		});
		jsh.shell.exit(1);
	}
}

requireConfigurationValue("user.name");
requireConfigurationValue("user.email");
var status = repository.status();
var untracked = (status.paths) ? $api.Object.properties(status.paths).filter(function(property) {
	return property.value == "??"
}).map(function(property) { return property.name; }) : [];
if (untracked.length) {
	jsh.shell.console("Untracked files are present; aborting:");
	jsh.shell.console(untracked.join("\n"));
	jsh.shell.exit(1);
}

var code = jsh.loader.module(jsh.script.file.parent.parent.getRelativePath("code/module.js"));
var failed = false;
code.files.trailingWhitespace({
	base: jsh.script.file.parent.parent.parent,
	isText: function(entry) {
		if (/\.def$/.test(entry.path)) {
			return true;
		}
		if (entry.path == ".hgsub") return true;
		if (entry.path == ".hgsubstate") return false;
		if (entry.path == ".hgignore") return false;
		if (entry.path == ".gitignore") return false;
		if (entry.path == "contributor/hooks/pre-commit") return true;
		if (entry.path == ".classpath") return false;
		if (entry.path == ".project") return false;
		if (entry.path == "contribute") return true;
		return code.files.isText(entry.node);
	},
	on: {
		unknownFileType: function(entry) {
			throw new Error("Unknown file type; cannot determine whether text: " + entry.node);
		},
		change: function(p) {
			jsh.shell.console("Changed " + p.path + " at line " + p.line.number);
		},
		changed: function(entry) {
			jsh.shell.console("Modified: " + entry.node);
			failed = true;
		},
		unchanged: function(entry) {
			//jsh.shell.echo("No change: " + entry.node);
		}
	}
});
if (failed) {
	jsh.shell.console("Failing because trailing whitespace was modified.");
	jsh.shell.exit(1);
}

//	Runs test suite
var timestamp = jsh.time.When.now();
var logs = jsh.script.file.parent.parent.parent.getRelativePath("local/contribute/logs").createDirectory({
	recursive: true,
	exists: function(dir) { return false; }
}).getRelativePath(timestamp.local().format("yyyy.mm.dd.HR.mi.sc")).createDirectory();
var stdio = {
	output: logs.getRelativePath("stdout.txt").write(jsh.io.Streams.text),
	error: logs.getRelativePath("stderr.txt").write(jsh.io.Streams.text)
};
jsh.shell.console("Running tests with output to " + logs + " ...");
var TEST_GIT_ISSUE = false;
var invocation = {
	shell: jsh.script.file.parent.parent.parent,
	script: jsh.script.file.parent.parent.parent.getFile("contributor/suite.jsh.js"),
	arguments: [
		"-issue138"
	],
	stdio: {
		output: {
			line: function(line) {
				stdio.output.write(line + "\n");
			}
		},
		error: {
			line: function(line) {
				stdio.error.write(line + "\n");
			}
		}
	},
	evaluate: function(result) {
		if (result.status != 0) {
			jsh.shell.console("Failing because tests failed.");
			jsh.shell.console("Output directory: " + logs);
			jsh.shell.exit(1);
		} else {
			jsh.shell.console("Tests passed.");
		}
	}
};
if (TEST_GIT_ISSUE) {
	invocation.script = jsh.script.file.parent.parent.parent.getFile("contributor/jrunscript.jsh.js");
	invocation.arguments = ["-part", "jrunscript/tools/git"]
}
jsh.shell.jsh(invocation);

if (jsh.shell.environment.SLIME_GIT_HOOK_FAIL) {
	jsh.shell.console("Failing due to present of environment variable SLIME_GIT_HOOK_FAIL.");
	jsh.shell.exit(1);
}
