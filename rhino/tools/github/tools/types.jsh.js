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
		jsh.project.openapi.generate({
			specification: {
				url: "https://raw.githubusercontent.com/github/rest-api-description/main/descriptions/api.github.com/api.github.com.json"
			},
			config: jsh.shell.jsh.src.getFile("rhino/tools/github/tools/dtsgen.json"),
			destination: jsh.shell.jsh.src.getRelativePath("rhino/tools/github/tools/github-rest.d.ts")
		})
	}
//@ts-ignore
)($api,jsh);
