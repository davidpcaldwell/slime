//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the rhino/shell SLIME module.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010-2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var scope = $loader.file("shell.js");
$exports.run = scope.run;
$exports.environment = (function() {
	//	TODO	Document $context.$environment
	var jenv = ($context.$environment) ? $context.$environment : Packages.inonit.script.runtime.shell.Environment.create();
	var rv;
	if (jenv) {
		rv = {};
		var i = jenv.keySet().iterator();
		while(i.hasNext()) {
			var name = String( i.next() );
			var value = String( jenv.get(name) );
			rv[name] = value;
		}
	} else {
		//	This version of JDK does not support getenv
	}
	return rv;
})();

//	TODO	Document $context.$properties
var $properties = ($context.$properties) ? $context.$properties : Packages.java.lang.System.getProperties();
$exports.properties = $context.api.java.Properties.adapt($properties);
$api.experimental($exports,"properties");