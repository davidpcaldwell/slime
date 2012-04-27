//	LICENSE
//	The contents of this file are subject to the Mozilla Public License Version 1.1 (the "License"); you may not use
//	this file except in compliance with the License. You may obtain a copy of the License at http://www.mozilla.org/MPL/
//
//	Software distributed under the License is distributed on an "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either
//	express or implied. See the License for the specific language governing rights and limitations under the License.
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