//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

(
	//	Dependency test
	function(
		Packages: slime.jrunscript.Packages,
		fifty: slime.fifty.test.Kit
	) {
		var jsh = fifty.global.jsh;

		fifty.tests.zipRootEntries = function() {
			var file = Packages.java.io.File.createTempFile("slime-code-loader-", ".zip");
			try {
				var zip = new Packages.java.util.zip.ZipOutputStream(new Packages.java.io.FileOutputStream(file));
				try {
					["module-info.class", "root.txt", "nested/child.txt"].forEach(function(name) {
						zip.putNextEntry(new Packages.java.util.zip.ZipEntry(name));
						zip.write(new Packages.java.lang.String(name).getBytes("UTF-8"));
						zip.closeEntry();
					});
				} finally {
					zip.close();
				}
				var loader = Packages.inonit.script.engine.Code.Loader.zip(file);
				fifty.verify(String(Array.prototype.slice.call(loader.getEnumerator().list("")).sort().join(",")))
					.is("module-info.class,nested/,root.txt");
				fifty.verify(String(Array.prototype.slice.call(loader.getEnumerator().list("nested")).join(","))).is("child.txt");
				fifty.verify(String(loader.getFile("root.txt").getSourceName()).indexOf("root.txt") != -1).is(true);
			} finally {
				file.delete();
			}
		}

		fifty.tests.suite = function() {
			fifty.run(fifty.tests.zipRootEntries);
			var github = Packages.inonit.script.engine.Code.Loader.github(
				new Packages.java.net.URL(
					"https://github.com/davidpcaldwell/slime/archive/refs/heads/master.zip"
				),
				"slime-master/"
			);

			jsh.shell.console("github = " + github);
			var enumerator = github.getEnumerator();
			jsh.shell.console("enumerator = " + enumerator);
			var top = enumerator.list(null);
			jsh.shell.console(top);
			jsh.shell.console(top.length);
			jsh.shell.console("Top level:");
			for (var i=0; i<top.length; i++) {
				jsh.shell.console(top[i]);
			}
			var js = enumerator.list("js/");
			jsh.shell.console("js:");
			for (var i=0; i<js.length; i++) {
				jsh.shell.console(js[i]);
			}
			var jshBash = github.getFile("jsh.bash");
			jsh.shell.console("jsh.bash = " + jshBash);
		}
	}
//@ts-ignore
)(Packages,fifty);
