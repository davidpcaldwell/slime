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

	window.addEventListener("load", function() {
		document.getElementById("hello").innerHTML = "blah!";
		document.getElementById("jsh-s").innerHTML = "trying";
		var response = window.jsh.message.synchronous({ hello: "world" });
		document.getElementById("jsh-s").innerHTML = "returned";
		document.getElementById("jsh-s").innerHTML = "served=" + response.served + " json=" + JSON.stringify(response);
	});

	window.jsh.message.handler(function(message) {
		var line = function(p) {
			var rv = document.createElement("div");
			if (p.text) {
				var text = document.createTextNode(p.text);
				rv.appendChild(text);
			}
			return rv;
		}

		document.getElementById("scenario").appendChild(line({ text: "message: " + Object.keys(message) }));

		document.getElementById("scenario").appendChild(line({ text: "message: " + message.type + " detail=" + Object.keys(message.detail) }));
		try {
			if (message.type == "scenario") {
				if (true && true) {
				}
//				if (message.type == "scenario" && typeof(message.detail) != "undefined") {
//
//				}
			}
		} catch (e) {
			document.getElementById("scenario").appendChild(line({ text: e.type + " " + e.message }));
		}
//		if (message.type == "scenario" && message.detail.start) {
//			var div = document.createElement("div");
//			div.appendChild(line({ text: "Running: " + message.detail.start.name }));
//			if (!current) {
//				current = document.getElementById("scenario");
//			}
//			current.appendChild(div);
//			current = div;
//		} else if (message.type == "scenario" && message.detail.end) {
//
//		}
	});
})();