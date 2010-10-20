//	LICENSE
//	The contents of this file are subject to the Mozilla Public License Version 1.1 (the "License"); you may not use
//	this file except in compliance with the License. You may obtain a copy of the License at http://www.mozilla.org/MPL/
//	
//	Software distributed under the License is distributed on an "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either
//	express or implied. See the License for the specific language governing rights and limitations under the License.
//	
//	The Original Code is the rhino/shell SLIME module.
//	
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010 the Initial Developer. All Rights Reserved.
//	
//	Contributor(s):
//	END LICENSE

var scope = $loader.script("shell.js");
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
