//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the SLIME Java GUI module.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2015 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

window.addEventListener("click", function(e) {
	console.log("clicked something; location = " + document.location.href);
	if (e.target.tagName.toLowerCase() == "a" && (true || e.target.getAttribute("webview")) ) {
		console.log("Clicked link: " + e.target.href);
		window.jsh.message.navigate(e.target.href);
	}
});

window.addEventListener("keydown", function(e) {
	if (e.keyIdentifier == "U+0052" && e.metaKey) {
		window.location.reload();
	}
	if (e.keyIdentifier == "Left" && e.metaKey) {
		window.history.back();
	}
	if (e.keyIdentifier == "Right" && e.metaKey) {
		window.history.forward();
	}
	if (false) {
		console.log("Platform: " + navigator.platform);
		for (var x in e) {
			console.log("keydown " + x + ": " + e[x]);
		}
	}
});
