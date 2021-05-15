//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//	Allows the conditional execution of webview.window.js; that file will execute if running in the WebView environment
if (!window.jsh) {
	window.status = "window.jsh";
	window.status = "";
}
