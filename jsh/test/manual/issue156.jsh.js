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
