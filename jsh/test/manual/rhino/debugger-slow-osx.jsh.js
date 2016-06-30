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
