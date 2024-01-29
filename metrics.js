//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.$api.Global } $api
	 * @param { slime.loader.Export<slime.tools.code.metrics.Settings> } $export
	 */
	function($api,jsh,$export) {
		var excludes = {
			descend: function(directory) {
				var basename = jsh.file.Location.basename(directory);
				if (basename == ".git") return false;
				if (basename == "local") return false;
				//	TODO	SLIME-specfic use of bin
				if (basename == "bin") return false;
				return true;
			},
			isSource: function(file) {
				//	TODO	SLIME-specfic use of jsh.project.code
				return $api.fp.Maybe.from.some(jsh.project.code.files.isText({
					path: void(0),
					file: file
				}));
			}
		};

		var settings = function() {
			return {
				excludes: excludes,
				isGenerated: function(file) {
					if (file.path == "rhino/tools/docker/tools/docker-api.d.ts") return true;
					if (file.path == "rhino/tools/github/tools/github-rest.d.ts") return true;
					return false;
				}
			}
		}

		$export(settings());
	}
//@ts-ignore
)($api,jsh,$export);
