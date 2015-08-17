//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2015 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

(function() {
	var current;

	window.jsh.message.handler(function(message) {
		var colorCode = function(rv,success) {
			rv.className = [rv.className,(success) ? "success" : "failure"].join(" ");
//			if (typeof(success) != "undefined") {
//				if (success) {
//					rv.style.backgroundColor = "#80ff80";
//				} else {
//					rv.style.backgroundColor = "#ff0000";
//				}
//			};
		}

		var line = function(p) {
			var rv = document.createElement("div");
			if (p.text) {
				var text = document.createTextNode(p.text);
				rv.appendChild(text);
			}
			if (p.className) {
				rv.className = p.className;
			}
			if (typeof(p.success) != "undefined") {
				colorCode(rv,p.success);
			}
			return rv;
		}

		if (message.type == "scenario" && message.detail.start) {
			var div = document.createElement("div");
			div.className = "scenario";
			div.appendChild(line({ text: "Running: " + message.detail.start.name }));
			if (!current) {
				current = document.getElementById("scenario");
			}
			current.appendChild(div);
			current = div;
		} else if (message.type == "scenario" && message.detail.end) {
			var result = (message.detail.success) ? "Passed" : "Failed";
			current.appendChild(line({ text: result + ": " + message.detail.end.name }));
			colorCode(current,message.detail.success);
			current = current.parentNode;
		} else if (message.type == "test") {
			var result = (message.detail.success) ? "Passed" : "Failed";
			if (message.detail.error) {
				result = "Error";
				if (message.detail.error.stack) {
					message.detail.message += " " + message.detail.error.stack;
				}
			}
			current.appendChild(line({ text: result + ": " + message.detail.message, success: message.detail.success, className: "test" }));
		}
	});
})();