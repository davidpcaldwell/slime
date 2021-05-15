//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

(
	function() {
		$exports.handle = function() {
			return httpd.http.Response.text(
				Boolean(httpd.js && httpd.java)
				&& typeof(httpd.js.Object) == "object"
				&& typeof(httpd.io.java.adapt) == "function"
				&& typeof(httpd.Handler) == "function"
			);
		}
	}
)();
