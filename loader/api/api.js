//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the SLIME loader infrastructure.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010-2013 the Initial Developer. All Rights Reserved.
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
	
	fixScriptElements = function() {
		var matchingScriptElements = getElements(function(e) {
			return e.tagName.toLowerCase() == "script" && e.type == "application/x.jsapi#tests";
		});
		matchingScriptElements.forEach(function(element) {
			console.log(element);
			var lines = element.innerHTML.split("\n");
			var prefix;
			var matcher = /^(\s+)(\S+)/;
			for (var i=0; i<lines.length; i++) {
				var match = matcher.exec(lines[i]);
				if (match) {
					console.log("match = ", JSON.stringify(match[1]), JSON.stringify(match[2]));
					if (typeof(prefix) == "undefined") {
						prefix = match[1];
					} else if (match[1].length > prefix.length) {
						if (match[1].substring(0,prefix.length) == prefix) {
							//	do nothing
						} else {
							prefix = "";
						}
					} else {
						if (prefix.substring(0,match[1].length) == match[1]) {
							prefix = match[1];
						}
					}
				} else {
					console.log("no match: ", JSON.stringify(lines[i]));
				}
			}
			var fixed = lines.map(function(line) {
				if (line.substring(0,prefix.length) == prefix) {
					return line.substring(prefix.length);
				} else {
					return line;
				}
			});
			element.innerHTML = fixed.join("\n");
			console.log(JSON.stringify(element.innerHTML));
		});
	};
	
	fixScriptElements();
}