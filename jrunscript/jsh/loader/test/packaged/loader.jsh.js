//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

(
	function() {
		var file = function(path) {
			if (jsh.script.loader.get(path)) return jsh.script.loader.file(path);
			return null;
		};

		var module = function(path) {
			//	TODO	good enough for now, but if more test cases are added would need to add complexity
			if (jsh.script.loader.get(path + "module.js")) return jsh.script.loader.module(path);
			return null;
		}

		jsh.shell.echo(JSON.stringify({
			file: file("file.js"),
			//	TODO	would there be a way to make jsh.script.loader.module("module") work? It would be intuitive
			module: module("module/"),
			path: {
				file: file("path/file.js"),
				module: module("path/module/")
			}
		}));
	}
)();
