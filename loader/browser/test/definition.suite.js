//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

(
	function() {
		var form = $api.Object({ properties: parameters.form.controls });
		var part = getPartDescriptor({
			definition: form.definition,
			environment: {
				parameters: parameters
			}
		});
		suite.part("definition", part);
		if (form.part) {
			var path = part.getPath(form.part.split("/"));
			if (path === null) {
				throw new Error("Could not find part " + form.part + " in page");
			}
			setPath(["definition"].concat(path));
		}
	}
)();
