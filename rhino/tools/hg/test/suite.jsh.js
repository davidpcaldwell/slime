//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

(
	function() {
		var parameters = jsh.script.getopts({
			options: {
				view: "console",
				part: String
			}
		});

		var page = new jsh.unit.html.Part({
			name: "module",
			pathname: jsh.script.file.parent.parent.getRelativePath("api.html"),
			environment: {}
			//	TODO	reload converts suite to scenario, which has no parts, so this breaks the search-into-part behavior
			//,reload: true
		});

		var path;

		if (parameters.options.part) {
			var ids = parameters.options.part.split("/");
			path = page.getPath(ids);
			path.unshift("module");
		}

		var suite = new jsh.unit.Suite({
			parts: {
				module: page
			}
		});

		jsh.unit.interface.create(suite, {
			view: parameters.options.view,
			path: path
		});
	}
)();
