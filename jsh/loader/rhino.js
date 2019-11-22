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

$jsh.setRuntime((function() {
	var rv = $rhino.script(
		"jrunscript/rhino.js", 
		$jsh.getLoader().getLoaderCode("jrunscript/rhino.js"), 
		{ $loader: $jsh.getLoader(), $rhino: $rhino }, 
		null
	);

	rv.exit = function(status) {
		return $rhino.exit(status);
	};

	rv.jsh = function(configuration,invocation) {
		return $rhino.jsh(configuration,invocation);
	};

	return rv;
})());