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

$exports.install = function() {
	var installed = $exports.installed();
	if ($context.api.shell.os.name == "Mac OS X") {
		$context.api.shell.console("Detected OS X " + $context.api.shell.os.version);

		var distribution = $exports.distribution.osx({ os: $context.api.shell.os.version });

		if (installed && distribution.hg == installed.version) {
			$context.api.shell.console("Already installed: hg " + installed.version);
			$context.api.shell.exit(0);
		} else if (installed) {
			$context.api.shell.console("Found version: " + installed.version + "; upgrading to " + distribution.hg);
		}

		$context.api.shell.console("Getting " + distribution.distribution.url);
		var file = $context.api.install.get({
			url: distribution.distribution.url
		});

		if (/\.pkg$/.test(file.pathname.basename)) {
			$context.api.shell.console("Install: " + file);
			$context.api.shell.run({
				command: "open",
				arguments: [file]
			});
			$context.api.shell.console("Please execute the graphical installer.");
			$context.api.shell.exit(1);
		} else {
			throw new Error("Unimplemented: installation of file type that is not .pkg: " + file);
		}
	} else {
		throw new Error("Unimplemented: installation of Mercurial for non-OS X system.");
	}
}
