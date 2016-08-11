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

var client = ($context.client) ? $context.client : new $context.api.http.Client();

var addDefaults = function(p) {
	if (!p.on) p.on = {};
	if (!p.on.console) p.on.console = function(){};
}

var algorithms = {
	gzip: new function() {
		var tar = $context.api.shell.PATH.getCommand("tar");
		
		this.getDestinationPath = function(basename) {
			var TGZ = /(.*)\.tgz$/;
			var TARGZ = /(.*)\.tar\.gz$/;
			if (TGZ.test(basename)) return TGZ.exec(basename)[1];
			if (TARGZ.test(basename)) return TARGZ.exec(basename)[1];
			//	TODO	list directory and take only option if there is only one and it is a directory?
			throw new Error("Cannot determine destination path for " + basename);			
		};
		
		if (tar) {
			this.extract = function(file,to) {
				$context.api.shell.run({
					command: $context.api.shell.PATH.getCommand("tar"),
					arguments: ["xf", file.pathname],
					directory: to
				});			
			}
		}
	},
	zip: new function() {
		this.getDestinationPath = function(basename) {
			var ZIP = /(.*)\.zip$/;
			if (ZIP.test(basename)) return ZIP.exec(basename)[1];
			//	TODO	list directory and take only option if there is only one and it is a directory?
			throw new Error("Cannot determine destination path for " + basename);						
		};
		
		this.extract = function(file,to) {
			$context.api.file.unzip({
				zip: file,
				to: to
			});
		}
	}
};

var installLocalArchive = function(p,algorithm) {
	var untardir = $context.api.shell.TMPDIR.createTemporary({ directory: true });
	p.on.console("Extracting " + p.file + " to " + untardir);
	algorithm.extract(p.file,untardir);
	var unzippedDestination = (function() {
		if (p.getDestinationPath) {
			return p.getDestinationPath(p.file);
		}
		var path = algorithm.getDestinationPath(p.file.pathname.basename);
		if (path) return path;
		//	TODO	list directory and take only option if there is only one and it is a directory?
		throw new Error("Cannot determine destination path for " + p.file);
	})();
	p.on.console("Assuming destination directory created was " + unzippedDestination);
	var unzippedTo = untardir.getSubdirectory(unzippedDestination);
	p.on.console("Directory is: " + unzippedTo);
	unzippedTo.move(p.to, {
		overwrite: false,
		recursive: true
	});
	return p.to.directory;
};

var get = function(p) {
	if (!p.file) {
		if (p.url) {
			var basename = p.url.split("/").slice(-1)[0];
			var pathname = $context.downloads.getRelativePath(basename);
			if (!pathname.file) {
				//	TODO	we could check to make sure this URL is http
				p.on.console("Downloading from " + p.url + " to: " + $context.downloads);
				var response = client.request({
					url: p.url
				});
				pathname.write(response.body.stream, { append: false });
				p.on.console("Wrote to: " + $context.downloads);
			} else {
				p.on.console("Found " + pathname.file + "; using cached version.");
			}
			p.file = pathname.file;
		}
	}
	return p;
};

var install = function(p,algorithm) {
	addDefaults(p);
	get(p);
	return installLocalArchive(p,algorithm);
};

if (algorithms.gzip.extract) {
	$exports.gzip = function(p) {
		install(p,algorithms.gzip);
	};
}

$exports.zip = function(p) {
	install(p,algorithms.zip);
};

$exports.get = function(p) {
	addDefaults(p);
	get(p);
	return p.file;
}

var api = $loader.file("api.js", {
	api: {
		http: $context.api.http,
		shell: $context.api.shell
	},
	downloads: $context.downloads
});

api.file = $context.api.file;

var apache = $loader.file("apache.js", {
	client: client,
	api: api,
	downloads: $context.downloads
});

$exports.apache = apache;
