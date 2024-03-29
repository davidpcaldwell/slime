//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

(
	function() {
		var parameters = jsh.script.getopts({
			options: {
				install: jsh.file.Pathname,
				driver: jsh.file.Pathname,
				view: "console"
			}
		});

		if (!parameters.options.install) {
			jsh.shell.console("Required: -install <directory> indicating directory in which Mongo is installed.");
			jsh.shell.exit(1);
		}

		if (parameters.options.driver) jsh.loader.plugins(parameters.options.driver);
		var shouldBeAvailable = jsh.loader.java.getClass("com.mongodb.ServerAddress");
		if (!shouldBeAvailable) {
			jsh.shell.console("Required: -driver <jar> indicating location of Mongo Java driver.");
			jsh.shell.exit(1);
		}

		var environment = {
			mongo: {
				install: parameters.options.install.toString()
			}
		};

		var suite = new jsh.unit.Suite({
			parts: {
				api: new jsh.unit.html.Part({
					name: "api",
					pathname: jsh.script.file.parent.getRelativePath("api.html"),
					environment: environment
				})
			}
		});

		jsh.unit.interface.create(suite, { view: parameters.options.view });
	}
)();
