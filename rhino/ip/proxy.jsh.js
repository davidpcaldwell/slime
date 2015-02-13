//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the rhino/ip SLIME module.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2015 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var parameters = jsh.script.getopts({
	options: {
		local: Number,
		host: String,
		port: Number
	}
});

var module = jsh.script.loader.module("module.js");
var local = (parameters.options.local) ? parameters.options.local : module.getEphemeralPort().number;
var _ss = new Packages.java.net.ServerSocket(local);
jsh.shell.echo("Listening locally on " + local);

var _spool = function(_in,_out) {
	var b;
	while( (b = _in.read()) != -1 ) {
		_out.write(b);
		_out.flush();
	}
	_out.close();
	_in.close();
}

while(true) {
	var _s = _ss.accept();
	jsh.shell.echo("Accepted connection " + _s);
	var _destination = new Packages.java.net.Socket(parameters.options.host, parameters.options.port);
	jsh.shell.echo("Created proxying connection " + _destination);

	var connect = function(_destination,_s) {
		jsh.java.Thread.start({
			call: function() {
				jsh.shell.echo("Starting spool to destination");
				_spool(_s.getInputStream(), _destination.getOutputStream());
//				jsh.io.java.adapt(_destination.getOutputStream()).write(jsh.io.java.adapt(_s.getInputStream()), { append: false });
			}
		});
		jsh.java.Thread.start({
			call: function() {
				jsh.shell.echo("Starting spool from destination");
				_spool(_destination.getInputStream(), _s.getOutputStream());
//				jsh.io.java.adapt(_s.getOutputStream()).write(jsh.io.java.adapt(_destination.getInputStream()), { append: false });
			}
		});
	}

	connect(_destination,_s);
}