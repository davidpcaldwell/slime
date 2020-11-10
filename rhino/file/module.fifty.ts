(
	function(
		jsh: jsh,
		tests: slime.fifty.test.tests,
		verify: slime.fifty.test.verify
	) {
		var now = new jsh.time.When({ unix: 1599862384355 });

		tests.filetime = function() {
			var directory = jsh.shell.TMPDIR.createTemporary({ directory: true }).pathname.directory;
			directory.getRelativePath("file").write("foo");
			var file = directory.getFile("file");

			file.modified = jsh.time.When.codec.Date.encode(now);
			verify(file).modified.evaluate(function(p) { return p.getTime(); }).is( Math.floor(now.unix / 1000) * 1000 );
		}

		tests.filetime.testbed = function() {
			var directory = jsh.shell.TMPDIR.createTemporary({ directory: true }).pathname.directory;
			directory.getRelativePath("file").write("foo");
			var file = directory.getFile("file");

			var nio = file.pathname.java.adapt().toPath();
			jsh.shell.console(nio);
			Packages.java.nio.file.Files.setLastModifiedTime(nio, Packages.java.nio.file.attribute.FileTime.fromMillis(now.unix));
			var _modified = Packages.java.nio.file.Files.getLastModifiedTime(nio);
			jsh.shell.console(_modified.toMillis());
		}

		tests.suite = function() {
			tests.filetime();
		}
	}
//@ts-ignore
)(global.jsh,tests,verify);
