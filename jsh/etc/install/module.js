var file = $loader.file("api.js", $context);

var addDefaults = function(p) {
	if (!p.on) p.on = {};
	if (!p.on.console) p.on.console = function(){};
}

var installLocalGzip = function(p) {
	var untardir = $context.api.shell.TMPDIR.createTemporary({ directory: true });
	p.on.console("Extracting " + p.file + " to " + untardir);
	$context.api.shell.run({
		command: $context.api.shell.PATH.getCommand("tar"),
		arguments: ["xf", p.file.pathname],
		directory: untardir
	});
	var unzippedDestination = (function() {
		var basename = p.file.pathname.basename;
		if (p.getDestinationPath) {
			return p.getDestinationPath(p.file);
		}
		var TGZ = /(.*)\.tgz$/;
		var TARGZ = /(.*)\.tar\.gz$/;
		if (TGZ.test(basename)) return TGZ.exec(basename)[1];
		if (TARGZ.test(basename)) return TARGZ.exec(basename)[1];
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

$exports.gzip = function(p) {
	addDefaults(p);
	if (!p.file) {
		if (p.url) {
			var basename = p.url.split("/").slice(-1)[0];
			var pathname = $context.downloads.getRelativePath(basename);
			if (!pathname.file) {
				//	TODO	we could check to make sure this URL is http
				p.on.console("Downloading from " + p.url + " to: " + $context.downloads);
				var response = new $context.api.http.Client().request({
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
	return installLocalGzip(p);
};
