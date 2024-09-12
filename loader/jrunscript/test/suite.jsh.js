//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

(
	function() {
		var parameters = jsh.script.getopts({
			options: {
				part: String,
				view: "console"
			}
		});

		var SRC = jsh.script.file.parent.parent.parent.parent;

		var suite = new jsh.unit.html.Suite();
		suite.add("slime", new jsh.unit.html.Part({
			pathname: SRC.getRelativePath("loader/api.html")
		}));

		/**
		 *
		 * @param { { file: slime.jrunscript.file.File }} p
		 */
		var FiftyPart = function(p) {
			return jsh.unit.fifty.Part({
				shell: SRC,
				script: SRC.getFile("tools/fifty/test.jsh.js"),
				file: p.file
			});
		};

		suite.add("jrunscript/java", FiftyPart({
			file: SRC.getFile("loader/jrunscript/java.fifty.ts")
		}));

		jsh.unit.html.cli({
			suite: suite,
			part: parameters.options.part,
			view: parameters.options.view
		});
	}
)();
