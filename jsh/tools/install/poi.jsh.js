// TODO: Add this to jsh.shell.tools since it is integrated with jsh.io
var parameters = jsh.script.getopts({
	options: {
		version: "3.17",
		replace: false
	}
});

var destination = jsh.shell.jsh.lib.getRelativePath("poi");

if (destination.directory && !parameters.options.replace) {
	jsh.shell.console("Already installed.");
	jsh.shell.exit(0);
} else if (destination.directory && parameters.options.replace) {
	jsh.shell.console("Found installation; removing.");
	destination.directory.remove();
}

var VERSIONS = {
	"3.15": {
		url: "https://archive.apache.org/dist/poi/release/bin/poi-bin-3.15-20160924.tar.gz"
	},
	"3.17": {
		url: "https://archive.apache.org/dist/poi/release/bin/poi-bin-3.17-20170915.tar.gz"
	},
	"4.0.0": {
		url: "https://archive.apache.org/dist/poi/release/bin/poi-bin-4.0.0-20180907.tar.gz"
	}
};

for (var x in VERSIONS) {
	VERSIONS[x].version = x;
}

var VERSION = VERSIONS[parameters.options.version];

jsh.tools.install.install({ 
	url: VERSION.url,
	to: jsh.shell.jsh.lib.getRelativePath("poi"),
	getDestinationPath: function(file) {
		return "poi-" + VERSION.version;
	}
}, {
	console: function(e) {
		jsh.shell.console(e.detail);
	}
});
