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

var $host = (function() {
	//	Try to port inonit.script.rhino.Loader.Bootstrap
	var $loader = eval(String($jsh.getLoaderCode()));

	var rv = $rhino.script("rhino/rhino.js", $loader.getLoaderCode("rhino/rhino.js"), { $loader: $loader, $rhino: $rhino }, null);

	rv.exit = function(status) {
		return $rhino.exit(status);
	};

	rv.jsh = function(configuration,invocation) {
		return $rhino.jsh(configuration,invocation);
	};

	return rv;
})();