//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

var writeTo = function(stream,message,times) {
	for (var i=0; i<times; i++) {
		for (var j=0; j<message.length; j++) {
			stream.write(message.substring(j,j+1));
		}
		stream.write("\n");
	}
};

var fork = function(f) {
	if (jsh.java.Thread.start) {
		jsh.java.Thread.start({
			call: f
		});
	} else {
		new jsh.java.Thread(f).start();
	}
}

fork(function() {
	writeTo(jsh.shell.stdout,"outoutout",100);
});
fork(function() {
	writeTo(jsh.shell.stderr,"errerrerr",100);
});
jsh.shell.echo("Reached end of script.");