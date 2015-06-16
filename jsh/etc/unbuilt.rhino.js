//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2012-2013 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

$api.script.resolve("api.jrunscript.js").load();

if ($api.arguments[0] == "build") {
	$api.arguments.splice(0,1);
	$api.script.resolve("build.rhino.js").load();
//	load(slime.src.getFile("jsh/etc/build.rhino.js"));
} else if ($api.arguments[0] == "launch") {
	$api.arguments.splice(0,1);
	$api.script.resolve("../../jsh/launcher/rhino/jsh.jrunscript.js").load();
} else if ($api.arguments[0] == "jdwp" || $api.arguments[0] == "xjdwp") {
	if ($api.arguments[0] == "jdwp") {
		Packages.java.lang.System.setProperty("jsh.debug.jdwp", new Packages.java.lang.String($api.arguments[1]))
	}
	$api.arguments.splice(0,2);
	load(slime.src.getFile("jsh/launcher/rhino/jsh.jrunscript.js"));
} else if (arguments[0] == "develop") {
	//	TODO	convert to new $api structure
	arguments.splice(0,1,String(slime.src.getFile("jsh/etc/develop.jsh.js")));
	load(slime.src.getFile("jsh/launcher/rhino/jsh.jrunscript.js"));
} else if ($api.arguments[0] == "verify") {
	var verifyArgs = $api.arguments.slice(1);
	var buildArgs = [];
	$api.arguments.splice(0,$api.arguments.length);
	for (var i=0; i<verifyArgs.length; i++) {
		if (verifyArgs[i] == "-native") {
			buildArgs.push("-native");
			verifyArgs.splice(i,1);
			i--;
		} else {
		}
	}
	var JSH_HOME = $api.io.tmpdir({ prefix: "jsh-verify.", suffix: ".tmp" });
	JSH_HOME.mkdirs();
	$api.arguments.push(JSH_HOME);
	$api.arguments.push.apply($api.arguments,buildArgs);
	Packages.java.lang.System.setProperty("jsh.build.notest","true");
	Packages.java.lang.System.setProperty("jsh.build.nodoc","true");
	//	TODO	set jsh.build.rhino to a java.io.File if it is needed here so that build builds it
	$api.arguments.push("-install","coffeescript","-install","tomcat")
	$api.script.resolve("../../jsh/etc/build.rhino.js").load();
	var command = [];
	command.push(String($api.java.launcher),"-jar",String(new File(JSH_HOME,"jsh.jar")));
	command.push(String($api.slime.src.getFile("jsh/test/verify.jsh.js")),"-slime",$api.slime.src.toString());
	command = command.concat(verifyArgs);
	if (Packages.java.lang.System.getProperty("jsh.build.tomcat.home")) {
		command.push("-tomcat",String(new Packages.java.io.File(Packages.java.lang.System.getProperty("jsh.build.tomcat.home"))));
	}
	Packages.java.lang.System.err.println("Verifying with command: " + command.join(" "));
	var status = $api.engine.runCommand.apply(this,command);
	if (status) {
		throw new Error("Verification failed with status: " + status);
	}
} else if (arguments[0] == "test") {
	//	TODO	convert to new $api structure
	arguments.splice(0,1);
	//	create temporary file
	var JSH_HOME = Packages.java.io.File.createTempFile("jsh-unbuilt.", ".tmp");
	JSH_HOME.mkdirs();
	arguments.push(JSH_HOME.getCanonicalPath());
	Packages.java.lang.System.setProperty("jsh.build.nounit", "true");
	load(slime.src.getFile("jsh/etc/build.rhino.js"));
} else {
	Packages.java.lang.System.err.println("Usage:");
	Packages.java.lang.System.err.println("unbuilt.rhino.js build <arguments>");
	Packages.java.lang.System.err.println("unbuilt.rhino.js launch <arguments>");
	Packages.java.lang.System.exit(1);
}
