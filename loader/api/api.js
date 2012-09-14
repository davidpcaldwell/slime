//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the SLIME loader infrastructure.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

window.onload = function() {
	//	TODO	Perhaps verify div class="object" <li>s have div class="name"
	//	TODO	verify the "has properties" after div class="object"

	var getElements = function(filter) {
		var rv = [];
		var all = document.getElementsByTagName("*");
		for (var i=0; i<all.length; i++) {
			if (filter(all[i])) {
				rv.push(all[i]);
			}
		}
		return rv;
	}

	var fixFunctionDivs = function(className,heading) {
		var matchingDivs = getElements(function(e) {
			return e.tagName.toLowerCase() == "div" && e.className.indexOf(className) != -1;
		});
		for (var i=0; i<matchingDivs.length; i++) {
			var children = matchingDivs[i].childNodes;
			var first = null;
			for (var j=0; j<children.length; j++) {
				if (!first && children[j].nodeType == 1) {
					first = children[j];
					//	element
				}
			}
			if (first
				&& (first.tagName.toLowerCase() == "div")
				&& first.className == "label" && first.innerHTML == heading
			) {
				//	ok
			} else {
				var it = document.createElement("div");
				it.className = "label error";
				it.innerHTML = heading;
				matchingDivs[i].insertBefore(it, children[0]);
			}
		}

	}

	fixFunctionDivs("arguments", "Arguments");
	fixFunctionDivs("returns", "Returns");
	fixFunctionDivs("instances", "Instances");
}