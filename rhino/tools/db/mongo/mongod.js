//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the SLIME JDK interface.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2015 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

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
	var started = false;
	var lock = new jsh.java.Thread.Monitor();

	jsh.java.Thread.start({
		call: function() {
			jsh.shell.run({
				command: $context.install.getFile("bin/mongod"),
				arguments: options,
				stdio: {
					output: {
						line: function(s) {
							jsh.shell.console("[mongo:stdout] " + s);
							if (/\[initandlisten\] waiting for connections/.test(s)) {
								new lock.Waiter({
									until: function() {
										return true;
									},
									then: function() {
										started = true;
									}
								})();
							}
						}
					},
					error: {
						line: function(s) {
							jsh.shell.console("[mongo:stderr] " + s);
						}
					}
				},
				on: {
					start: function(process) {
						daemon = process;
					}
				}
			});
		}
	});

	new lock.Waiter({
		until: function() {
			return started;
		},
		then: function() {
		}
	})();

	this.stop = function() {
		daemon.kill();
	}
}