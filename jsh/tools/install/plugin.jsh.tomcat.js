var getLatestVersion = function() {
	try {
		var downloadRawHtml = new jsh.http.Client().request({
			url: "http://tomcat.apache.org/download-70.cgi",
			evaluate: function(result) {
				return result.body.stream.character().asString()
			}
		});
		var matcher = /\<h3 id=\"(7\..*)\"\>/;
		var match = matcher.exec(downloadRawHtml);
		var version = match[1];
		jsh.shell.console("Latest Tomcat version from tomcat.apache.org is " + version);
		return version;
	} catch (e) {
		jsh.shell.console("Could not get latest Tomcat 7 version from tomcat.apache.org (offline?) ...");
		//	TODO	probably should implement some sort of jsh.shell.user.downloads
		if (jsh.shell.user.downloads) {
			jsh.shell.console("Checking downloads at " + jsh.shell.user.downloads + " ...");
			var downloads = jsh.shell.user.downloads;
			var pattern = arguments.callee.pattern;
			var local = downloads.list().filter(function(node) {
				return !node.directory && pattern.test(node.pathname.basename);
			});
			if (local.length) {
				var getVersion = function(node) {
					var name = node.pathname.basename;
					var match = pattern.exec(name);
					return Number(match[1])*10000 + Number(match[2])*100 + Number(match[3]);
				};

				var getVersionString = function(node) {
					var match = pattern.exec(node.pathname.basename);
					return match[1] + "." + match[2] + "." + match[3]
				}

				local.forEach(function(node) {
					jsh.shell.console("Found version " + getVersionString(node));
				})

				local.sort(function(a,b) {
					return getVersion(b) - getVersion(a);
				});

				jsh.shell.console("Latest version is " + getVersionString(local[0]));
				return getVersionString(local[0]);
			}
		}
	}
}
getLatestVersion.pattern = /^apache-tomcat-(\d+)\.(\d+)\.(\d+)\.zip$/;

$exports.install = function(p) {
	if (!p) p = {};
	if (!p.to) {
		p.to = jsh.shell.jsh.lib.getRelativePath("tomcat");
	}

	if (p.to.directory && !p.replace) {
		jsh.shell.console("Tomcat already installed at " + p.to.directory);
		return;
	}

	if (!p.local) {
		var mirror;
		if (!p.version) {
			//	Check tomcat.apache.org; if unreachable, use latest version in downloads directory
			p.version = getLatestVersion();
			if (!p.version) {
				throw new Error("Could not determine latest Tomcat 7 version; not installing.");
			}
		} else {
			jsh.shell.console("Installing specified version " + p.version);
			mirror = "https://archive.apache.org/dist/";
		}

		var zip = jsh.tools.install.apache.find({
			mirror: mirror,
			path: "tomcat/tomcat-7/v" + p.version + "/bin/apache-tomcat-" + p.version + ".zip"
		});
		p.local = zip.pathname;
	} else {
		if (!p.version) {
			if (!p.local.file) {
				throw new Error("Not found: " + p.local);
			}
			var match = getLatestVersion.pattern.exec(p.local.basename);
			if (match) {
				p.version = match[1] + "." + match[2] + "." + match[3];
				jsh.shell.console("Installing version " + p.version + " determined from local filename.");
			} else {
				throw new Error("Unable to determine version from filename: " + p.local);
			}
		}
	}
	var to = jsh.shell.TMPDIR.createTemporary({ directory: true });
	jsh.shell.console("Unzipping to: " + to);
	jsh.file.unzip({
		zip: p.local.file,
		to: to
	});
	jsh.shell.console("Installing Tomcat at " + p.to);
	to.getSubdirectory("apache-tomcat-" + p.version).move(p.to, { overwrite: true });	
}