var KOTLIN = jsh.shell.jsh.lib.getSubdirectory("kotlin/lib");

jsh.loader.java.add(KOTLIN.getRelativePath("kotlin-compiler.jar"));

jsh.loader.java.add(KOTLIN.getRelativePath("kotlin-script-runtime.jar"));
jsh.loader.java.add(KOTLIN.getRelativePath("kotlin-stdlib.jar"));
jsh.loader.java.add(KOTLIN.getRelativePath("kotline-script-util.jar"));

jsh.loader.java.add(KOTLIN.getRelativePath("kotlin-scripting-common.jar"));
jsh.loader.java.add(KOTLIN.getRelativePath("kotlin-scripting-jvm.jar"));
jsh.loader.java.add(KOTLIN.getRelativePath("kotlin-scripting-jvm-host.jar"));

jsh.loader.java.add(KOTLIN.getRelativePath("kotline-scripting-compiler.jar"));

var host = new Packages.kotlin.script.experimental.jvmhost.BasicJvmScriptingHost();

var main = jsh.script.file.parent.getFile("kotlin.kt").pathname.java.adapt();
jsh.shell.console(main);

var ScriptCompilationConfiguration = Packages.kotlin.script.experimental.api.ScriptCompilationConfiguration;

var configuration = new Packages.kotlin.script.experimental.api.ScriptCompilationConfiguration(
	new Packages.java.util.ArrayList(),
	new JavaAdapter(
		Packages.kotlin.jvm.functions.Function1,
		new function() {
			this.invoke = function(argument) {
				jsh.shell.console("argument = " + argument);
				return argument;
			}
		}
	)
);

var value = host.eval(
	new Packages.kotlin.script.experimental.host.FileScriptSource(main, null), configuration, null
);

jsh.shell.console("Value: " + value);
