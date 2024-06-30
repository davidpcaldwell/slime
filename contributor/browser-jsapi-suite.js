//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

(
	function() {
		// TODO: rename to api.suite.js to tie more explicitly to api.html?

		if (parameters.form) {
			for (var i=0; i<parameters.form.controls.length; i++) {
				if (parameters.form.controls[i].name == "migrate") {
					working = false;
				}
			}
		}

		var getSlimePart = function(definition) {
			return getPartDescriptor({
				definition: "../" + definition
			});
		};

		var add = function(id,part) {
			suite.part(id, part);
		};

		add("loader/browser/client.js", getSlimePart("loader/browser/client.api.html"));
		add("js/object/", getSlimePart("js/object/api.html"));
		add("js/document/", getSlimePart("js/document/api.html"));
		// TODO: does js/promise have any real tests?
		add("js/promise/", getSlimePart("js/promise/api.html"));

		add("loader/api/old/unit.js", getSlimePart("loader/api/old/unit.api.html"));
		add("loader/api/", getSlimePart("loader/api/api.html"));
		add("loader/api/test/data/1/", getSlimePart("loader/api/test/data/1/api.html"));
		add("loader/browser/test/", getSlimePart("loader/api/old/browser/api.html"));
		add("$jsapi.loader.fifty", getSlimePart("tools/fifty/test/data/api.html"));
	}
)();
