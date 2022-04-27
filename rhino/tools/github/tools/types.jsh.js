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
		var configuration = jsh.project.openapi.initialize();

		var config = jsh.shell.TMPDIR.createTemporary({ suffix: ".json" });
		var src = configuration.src.getRelativePath("rhino/tools/github/tools/dtsgen.json").file.read(String);
		src = src.split("\n").slice(6).join("\n");
		config.pathname.write(src, { append: false });
		configuration.node.run({
			command: "dtsgen",
			arguments: $api.Array.build(function(rv) {
				rv.push("--url", "https://raw.githubusercontent.com/github/rest-api-description/main/descriptions/api.github.com/api.github.com.json");
				rv.push("--config", config);
				rv.push("--out", configuration.src.getRelativePath("rhino/tools/github/tools/github-rest.d.ts"));
			})
		});
	}
//@ts-ignore
)($api,jsh);
