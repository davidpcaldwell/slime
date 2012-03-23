//	LICENSE
//	The contents of this file are subject to the Mozilla Public License Version 1.1 (the "License"); you may not use
//	this file except in compliance with the License. You may obtain a copy of the License at http://www.mozilla.org/MPL/
//
//	Software distributed under the License is distributed on an "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either
//	express or implied. See the License for the specific language governing rights and limitations under the License.
//
//	The Original Code is the SLIME loader for rhino.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

//	context: object which represents external namespaces somehow
//	scope: object which is intended to hold whatever this object is returning
//	load: method which can load resources associated with this module by name
//
//	configuration? listener?
//
Packages.java.lang.System.err.println("Loading script.js ...");
var script = $loader.script("js/script.js", {
	echo: $context.echo
});
$exports.multiply = script.multiply;