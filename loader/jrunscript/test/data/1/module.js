//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

if ($platform.java && $platform.java.getClass("slime.Data")) {
	$exports.data = String(new Packages.slime.Data().getData());
} else if ($context.java && $context.java.getClass("slime.Data")) {
	//	TODO	$platform.java does not work properly inside a jsh.shell.jsh subshell; the Packages variable does not work
	//			correctly. So in jsh integration tests that execute this module inside a subshell, we provide a context object
	//			that allows loading the class so that this test passes.
	var jclass = $context.java.getClass("slime.Data");
	$exports.data = String(jclass.newInstance().getData());
} else {
	$exports.data = "No Java";
}