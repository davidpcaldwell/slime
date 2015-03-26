jsh.loader.plugins(jsh.script.file.parent.pathname);

var MONGO = jsh.file.Pathname("/mindtap/mongo").directory;

var mongod = jsh.script.loader.file("mongod.js", {
	install: MONGO
});

var _socket = new Packages.java.net.ServerSocket(0);
var port = _socket.getLocalPort();
_socket.close();
jsh.shell.echo("port = " + port);
var TMP = jsh.shell.TMPDIR.createTemporary({ directory: true });
var mongod = new mongod.Server({
	port: port,
	dbpath: TMP
});
jsh.shell.echo("Waiting 15s...");
try {
	Packages.java.lang.Thread.sleep(15000);
} catch (e) {
	jsh.shell.echo("Caught: " + e);
}
jsh.shell.echo("Killing mongod ...");
mongod.stop();
jsh.shell.echo("Killed.");
debugger;
