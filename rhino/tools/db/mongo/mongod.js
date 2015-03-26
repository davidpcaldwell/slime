if (!$context.install) {
	throw new TypeError("Required: $context.install pointing to Mongo installation directory.");
}

//	Reference:
//	http://docs.mongodb.org/manual/reference/program/mongod/
//	
//	TODO	depends on jsh
//	
//	$context
//		install: installation directory

//	TODO	would be nice to search PATH for installation directory by looking for program called "mongod"
//	TODO	would be really nice to detect ready state somehow
$exports.Server = function(p) {
	var options = [];
	if (p && typeof(p.port) != "undefined") {
		options.push("-port", String(p.port));
	}
	if (p && typeof(p.dbpath) != "undefined") {
		options.push("-dbpath", p.dbpath.pathname.toString());
	}
	var daemon;
	
	jsh.java.Thread.start({
		call: function() {
			jsh.shell.shell({
				command: $context.install.getFile("bin/mongod"),
				arguments: options,
				on: {
					start: function(process) {
						daemon = process;
					}
				}
			});		
		}
	});
	
	this.stop = function() {
		daemon.kill();
	}
}
