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

//	See https://www.mercurial-scm.org/downloads
var distributions = {
	osx: [
		{
			version: "10.5",
			distribution: {
				url: "https://www.mercurial-scm.org/mac/binaries/Mercurial-2.0.2-py2.5-macosx10.5.zip"
			}
		},
		{
			version: "10.6",
			distribution: {
				url: "https://www.mercurial-scm.org/mac/binaries/Mercurial-3.2.4-py2.6-macosx10.6.zip"
			}
		},
		{
			version: "10.7",
			distribution: {
				url: "https://www.mercurial-scm.org/mac/binaries/Mercurial-3.2.1-py2.7-macosx10.7.zip"
			}
		},
		{
			version: "10.8",
			distribution: {
				url: "https://www.mercurial-scm.org/mac/binaries/Mercurial-3.3.3-py2.7-macosx10.8.zip"
			}
		},
		{
			version: "10.9",
			distribution: {
				url: "https://www.mercurial-scm.org/mac/binaries/Mercurial-3.4.2-py2.7-macosx10.9.zip",
				installer: "mercurial-3.4.2+20150701-py2.7-macosx10.9.mpkg"
			}
		},
		{
			version: "10.10",
			distribution: {
				url: "https://www.mercurial-scm.org/mac/binaries/Mercurial-3.9.1-macosx10.10.pkg"
			}
		},
		{
			version: "10.11",
			distribution: {
				url: "https://www.mercurial-scm.org/mac/binaries/Mercurial-4.0.1-macosx10.11.pkg"
			}
		}
	].map(function(o) {
		o.minor = Number(o.version.split(".")[1])
		o.hg = /^(?:.*)Mercurial\-([\d\.]+)-.*/.exec(o.distribution.url)[1];
		return o;
	})
};

var VersionError = new $context.api.Error.Type("Mercurial version error");

$exports.distribution = {
	osx: function(o) {
		var getDistribution = function(minorVersion) {
			if (minorVersion < distributions.osx[0].minor) {
				throw new VersionError("OS X distribution too old; upgrade to at least " + distributions.osx[0].version);
			}
			if (minorVersion > distributions.osx[distributions.osx.length-1].minor) {
				return distributions.osx[distributions.osx.length-1];
			}
			for (var i=0; i<distributions.osx.length; i++) {
				if (minorVersion == distributions.osx[i].minor) {
					return distributions.osx[i];
				}
			}
		}

		var tokenized = o.os.split(".");
		if (Number(tokenized[0]) != 10) throw new VersionError("Unsupported.");
		var minorVersion = Number(tokenized[1]);
		return getDistribution(minorVersion);
	}
};

$exports.installed = function() {
	var command = $context.api.shell.PATH.getCommand("hg");
	if (command) {
		var output = $context.api.shell.run({
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
};

var GUI = $context.api.Error.Type("Please execute the graphical installer.");
$exports.install = $context.api.Events.Function(function(p,events) {
	var api = {
		shell: (p && p.mock && p.mock.shell) ? p.mock.shell : $context.api.shell,
		install: (p && p.mock && p.mock.install) ? p.mock.install : $context.api.install
	};
	var console = function(message) {
		events.fire("console", message);
	}
	var installed = (p && p.mock && typeof(p.mock.installed) != "undefined") ? p.mock.installed : $exports.installed();
	if (api.shell.os.name == "Mac OS X") {
		console("Detected OS X " + api.shell.os.version);

		var distribution = $exports.distribution.osx({ os: api.shell.os.version });

		if (installed && distribution.hg == installed.version) {
			console("Already installed: hg " + installed.version);
			return;
		} else if (installed) {
			console("Found version: " + installed.version + "; upgrading to " + distribution.hg);
		}

		console("Getting " + distribution.distribution.url);
		var file = api.install.get({
			url: distribution.distribution.url
		});

		if (/\.pkg$/.test(file.pathname.basename)) {
			console("Install: " + file);
			api.shell.run({
				command: "open",
				arguments: [file]
			});
			//	TODO	probably this will not look pretty, should catch this error
			throw new GUI("Please execute the graphical installer.");
		} else {
			throw new Error("Unimplemented: installation of file type that is not .pkg: " + file);
		}
	} else {
		if (installed) {
			jsh.shell.console("hg installed: version " + installed.version);
		} else if (jsh.shell.PATH.getCommand("apt")) {
			//	TODO	should actually detect GUI rather than assuming
			var HAS_GUI = true;
			if (HAS_GUI) {
				var password = jsh.java.tools.askpass.gui({
					prompt: "Enter password for sudo:"
				});
				jsh.shell.run({
					command: "sudo",
					arguments: ["-S", "apt", "install", "mercurial"],
					stdio: {
						input: password + "\n"
					}
				});
			} else {
				throw new Error("Unsupported: Mercurial installation without GUI to input password");
				//	TODO	options for sudo password
				//			*	force user to do sudo ls beforehand to cache credentials
				//			*	figure out way to use -S flag to route password typed from console to sudo
				jsh.shell.run({
					command: "sudo",
					arguments: ["-k", "apt", "install", "mercurial"],
					stdio: {
						input: jsh.shell.stdio.input
					}
				});
			}
		} else {
			throw new Error("Unsupported: Mercurial install on non-OS X, non-apt system.");
		}
	}
});
$exports.install.GUI = GUI;
