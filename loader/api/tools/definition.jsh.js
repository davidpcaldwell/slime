//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

(
	function() {
		var parameters = jsh.script.getopts({
			options: {
				//	Path to which to emit the file
				to: jsh.file.Pathname
			}
		});

		if (!parameters.options.to) {
			jsh.shell.console("Usage: " + jsh.script.file + " -to <destination-file>");
			jsh.shell.exit(1);
		}

		var templateXml = (function() {
			var slime = jsh.script.file.parent.parent.parent.parent;
			var template = slime.getFile("loader/api/old/api.template.html").read(String);

			(function() {
				var slimepath = "__SLIME__";
				//	TODO	maybe should log message if directory is created
				parameters.options.to.parent.createDirectory({
					exists: function(dir) {
						return false;
					},
					recursive: true
				});
				var to = {
					slime: jsh.file.navigate({
						from: parameters.options.to,
						to: slime
					})
				};

				//	TODO	to.slime.relative has trailing slash

				while(template.indexOf(slimepath) != -1) {
					template = template.replace(slimepath, to.slime.relative);
				}
			})();

			return template;
		})();

		var document = new jsh.document.Document({
			string: templateXml
		});

		(function removeLicense() {
			document.children.splice(0,1);
		})();

		parameters.options.to.write(document.toString(), { append: false });
	}
)();
