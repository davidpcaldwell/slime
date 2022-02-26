//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 * @param { slime.$api.Global } $api
	 * @param { slime.jsh.Global } jsh
	 */
	function($api,jsh) {
		jsh.shell.tools.node.require();
		jsh.shell.tools.node["modules"].require({ name: "dtsgenerator", version: "3.12.1" });
		jsh.shell.tools.node["modules"].require({ name: "tslib", version: "2.3.0" });
		jsh.shell.tools.node["modules"].require({ name: "@dtsgenerator/replace-namespace", version: "1.5.0" });

		var node = jsh.shell.tools.node;

		var SLIME = jsh.script.file.parent.parent.parent.parent.parent;

		/**
		 *
		 * @param { any } node
		 * @returns { node is slime.jrunscript.node.Installation }
		 */
		function isInstallation(node) {
			return true;
		}

		if (isInstallation(node)) {
			var config = jsh.shell.TMPDIR.createTemporary({ suffix: ".json" });
			var src = SLIME.getRelativePath("rhino/tools/github/tools/dtsgen.json").file.read(String);
			src = src.split("\n").slice(6).join("\n");
			config.pathname.write(src, { append: false });
			node.run({
				command: "dtsgen",
				arguments: $api.Array.build(function(rv) {
					rv.push("--url", "https://raw.githubusercontent.com/github/rest-api-description/main/descriptions/api.github.com/api.github.com.json");
					rv.push("--config", config);
					rv.push("--out", SLIME.getRelativePath("rhino/tools/github/tools/github-rest.d.ts"));
				})
			});
		} else {
			throw new Error("Unreachable.");
		}
	}
//@ts-ignore
)($api,jsh);
