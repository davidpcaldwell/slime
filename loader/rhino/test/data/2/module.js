//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
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
var script = $loader.file("js/script.js", {
	echo: $context.echo
});
$exports.multiply = script.multiply;