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
				url: "https://docs.docker.com/reference/api/engine/version/v1.43.yaml"
			},
			config: jsh.script.file.parent.getFile("dtsgen.json"),
			destination: jsh.script.file.parent.getRelativePath("docker-api.d.ts")
		})
	}
//@ts-ignore
)($api,jsh);
