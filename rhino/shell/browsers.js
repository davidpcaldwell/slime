var Chrome = function(b) {
	this.toString = function() {
		return "Google Chrome: " + b.program;
	}
	
	this.User = function(u) {
		this.open = function(m) {
			$context.run({
				command: b.program,
				arguments: [
					"--user-data-dir=" + u.directory,
					m.uri
				],
				on: {
					start: function(p) {
						if (m.on && m.on.start) {
							m.on.start.call(m,p);
						}
					}
				}
			});
		}
	};
}

if ($context.os.name == "Mac OS X") {
	if ($context.api.file.Pathname("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome").file) {
		$exports.chrome = new Chrome({
			program: $context.api.file.Pathname("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome").file
		});
	}
}