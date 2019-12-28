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

// TODO: Find any remaining uses of this and eliminate them
$exports.$api = {
	Events: {
		Function: function(f,defaultOn) {
			var Listeners = function(p) {
				var source = {};
				var events = $api.Events({ source: source });

				this.add = function() {
					for (var x in p.on) {
						source.listeners.add(x,p.on[x]);
					}
				};

				this.remove = function() {
					for (var x in p.on) {
						source.listeners.remove(x,p.on[x]);
					}
				};

				this.events = events;
			};

			return function(p,on) {
				var listeners = new Listeners({
					on: $api.Function.evaluator(
						function() { return on; },
						function() { return defaultOn; },
						function() { return {}; }
					)()
				});
				listeners.add();
				try {
					return f(p,listeners.events);
				} finally {
					listeners.remove();
				}
			}
		}
	}
};

var client = ($context.client) ? $context.client : new $context.api.http.Client();

var algorithms = {
	gzip: new function() {
		var tar = $context.api.shell.PATH.getCommand("tar");

		this.getDestinationPath = function(basename) {
			var TGZ = /(.*)\.tgz$/;
			var TARGZ = /(.*)\.tar\.gz$/;
			var TARXZ = /(.*)\.tar\.xz$/;
			if (TGZ.test(basename)) return TGZ.exec(basename)[1];
			if (TARGZ.test(basename)) return TARGZ.exec(basename)[1];
			if (TARXZ.test(basename)) return TARXZ.exec(basename)[1];
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
			if ($context.api.shell.PATH.getCommand("unzip")) {
				jsh.shell.run({
					command: "unzip",
					arguments: [file],
					directory: to
				});
			} else {
				$context.api.file.unzip({
					zip: file,
					to: to
				});
			}
		}
	}
};

/**
 * @param { { url: any, file: slime.jrunscript.file.File, format: any, to: slime.jrunscript.file.Pathname, replace: boolean } } p
 * @param {*} events 
 * @returns { slime.jrunscript.file.Directory }
 */
var installLocalArchive = function(p,events) {
	if (!p.format) {
		var basename = (p.url) ? p.url.toString().split("/").slice(-1)[0] : p.file.pathname.basename;
		if (/\.tar\.xz$/.test(basename) && $exports.format.gzip) p.format = $exports.format.gzip;
		if (/\.tar\.gz$/.test(basename) && $exports.format.gzip) p.format = $exports.format.gzip;
		if (/\.tgz$/.test(basename) && $exports.format.gzip) p.format = $exports.format.gzip;
		if (/\.zip$/.test(basename)) p.format = $exports.format.zip;
		if (/\.jar$/.test(basename)) p.format = $exports.format.zip;
	}
	if (!p.format) throw new TypeError("Required: 'format' property.");
	var algorithm = p.format;
	var untardir = $context.api.shell.TMPDIR.createTemporary({ directory: true });
	events.fire("console", "Extracting " + p.file + " to " + untardir);
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
	events.fire("console", "Assuming destination directory created was " + unzippedDestination);
	var unzippedTo = untardir.getSubdirectory(unzippedDestination);
	if (!unzippedTo) throw new TypeError("Expected directory " + unzippedDestination + " not found in " + untardir);
	events.fire("console", "Directory is: " + unzippedTo);
	unzippedTo.move(p.to, {
		overwrite: p.replace,
		recursive: true
	});
	return p.to.directory;
};

var get = function(p,events) {
	//	TODO	If typeof(p.file) is undefined, probably should try to use user downloads directory with p.name if present as default value
	if (!p.file) {
		if (p.url) {
			//	Apache supplies name so that url property, which is getter that hits Apache mirror list, is not invoked
			var find = (typeof(p.url) == "function") ? $api.Function.memoized(p.url) : function() { return p.url; };
			if (!p.name) p.name = find().split("/").slice(-1)[0];
			var pathname = $context.downloads.getRelativePath(p.name);
			if (!pathname.file) {
				//	TODO	we could check to make sure this URL is http
				//	Only access url property once because in Apache case it is actually a getter that can return different values
				events.fire("console", "Downloading from " + find() + " to: " + $context.downloads);
				var response = client.request({
					url: find()
				});
				pathname.write(response.body.stream, { append: false });
				events.fire("console", "Wrote to: " + $context.downloads);
			} else {
				events.fire("console", "Found " + pathname.file + "; using cached version.");
			}
			p.file = pathname.file;
		}
	}
	return p;
};

var install = function(p,events) {
	get(p,events);
	return installLocalArchive(p,events);
};

$exports.get = $api.Events.Function(function(p,events) {
	get(p,events);
	return p.file;
});

$exports.format = {
	zip: algorithms.zip
};

if (algorithms.gzip.extract) {
	$exports.format.gzip = algorithms.gzip;
}

$exports.install = $api.Events.Function(function(p,events) {
	return install(p,events);
});

if (algorithms.gzip.extract) {
	$exports.gzip = $api.deprecate(function(p,on) {
		p.format = algorithms.gzip;
		$exports.install(p,on);
	});
}

$exports.zip = $api.deprecate(function(p,on) {
	p.format = algorithms.zip;
	$exports.install(p,on);
});

var apache = $loader.file("apache.js", {
	client: client,
	get: $exports.get,
	downloads: $context.downloads
});

$exports.apache = apache;
