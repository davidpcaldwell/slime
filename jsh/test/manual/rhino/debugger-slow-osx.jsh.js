//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2016 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

//	env
//	JSH_JVM_OPTIONS="-agentpath:/Users/dcaldwell/.inonit/tool/lib/netbeans.app/Contents/distribution/profiler/lib/deployed/jdk16/mac/libprofilerinterface.jnilib=/Users/dcaldwell/.inonit/tool/lib/netbeans.app/Contents/distribution/profiler/lib,5140"
//	JSH_DEBUG_SCRIPT=rhino
//	jrunscript
//	rhino/jrunscript/api.js jsh jsh/etc/unit.jsh.js -unit jsh.file
var parameters = jsh.script.getopts({
	options: {
		netbeans: jsh.file.Pathname,
		workaround: false
	}
});

var base = jsh.script.file.parent.parent.parent.parent.parent;

var nb = parameters.options.netbeans;

var properties = {};
if (parameters.options.workaround) {
	properties["swing.defaultlaf"] = "javax.swing.plaf.nimbus.NimbusLookAndFeel";
}

jsh.shell.jsh({
	environment: jsh.js.Object.set({}, jsh.shell.environment, {
		JSH_JVM_OPTIONS: (parameters.options.netbeans) ? "-agentpath:"
			+ nb + "/profiler/lib/deployed/jdk16/mac/libprofilerinterface.jnilib="
			+ nb + "/profiler/lib,5140"
		: null,
		JSH_DEBUG_SCRIPT: "rhino"
	}),
	properties: properties,
	script: base.getFile("jsh/etc/unit.jsh.js"),
	arguments: ["-unit", "jsh.file"]
});
