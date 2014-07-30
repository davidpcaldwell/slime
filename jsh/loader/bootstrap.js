//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2014 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

new (function() {
	this.getLoaderCode = function(path) {
		return $jsh.getStreams().readString($jsh.getInstallation().getPlatformLoader(path).getReader());
	};

	this.getCoffeeScript = function() {
		var _library = $jsh.getInstallation().getLibrary("coffee-script.js");
		if (!_library) return null;
		return $jsh.getStreams().readString(_library.getReader());
	}
});