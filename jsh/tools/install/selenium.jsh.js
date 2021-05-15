//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

(
	function() {
		var parameters = jsh.script.getopts({
			options: {
				url: "http://selenium-release.storage.googleapis.com/2.43/selenium-java-2.43.1.zip"
			}
		});

		var api = jsh.script.loader.file("api.js");

		var download = api.download({
			url: parameters.options.url
		});

		var TMP = jsh.shell.TMPDIR.createTemporary({ directory: true });

		jsh.file.unzip({
			zip: download.read(jsh.io.Streams.binary),
			to: TMP
		});
		jsh.shell.echo("Unzipped Selenium to " + TMP);

		var destination = jsh.shell.jsh.home.getRelativePath("plugins/selenium")
		jsh.shell.echo("Installing to " + destination);
		TMP.list()[0].move(destination, { recursive: true });
	}
)();
