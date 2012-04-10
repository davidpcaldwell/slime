var File = Packages.java.io.File;
var JSH_HOME = new File(env.JSH_HOME);
var BASE = new File(env.BASE);
var LAUNCHER_COMMAND = [
	String(new File(JAVA_HOME,"bin/java").getCanonicalPath()),
	"-jar",String(new File(JSH_HOME,"jsh.jar").getCanonicalPath())
];
console("LAUNCHER_COMMAND = " + LAUNCHER_COMMAND);
var compileOptions = ["-g", "-nowarn"];
