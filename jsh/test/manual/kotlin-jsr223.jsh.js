var KOTLIN = jsh.shell.jsh.lib.getSubdirectory("kotlin/lib");

var libraries = [
    "kotlin-compiler.jar",
    "kotlin-scripting-jvm.jar",
    "kotlin-scripting-compiler.jar",
    "kotlin-scripting-impl.jar",
    "kotlin-script-util.jar",
    "kotlin-script-runtime.jar",
    "jsr223.jar"
];
var searchpath = jsh.file.Searchpath(libraries.map(function(name) {
    return jsh.shell.jsh.lib.getSubdirectory("kotlin/lib").getRelativePath(name);
}));

Packages.java.lang.System.setProperty("kotlin.script.classpath", searchpath.toString());

libraries.forEach(function(library) {
    jsh.loader.java.add(KOTLIN.getRelativePath(library));
});

//  TODO    figure out what status of ServiceLoader is in application class loader
//  TODO    see if we can get JSR223 working; jsr223.jar above should give appropriate scaffolding but does not work
var auto = new Packages.javax.script.ScriptEngineManager().getEngineByName("kts");
jsh.shell.console("engine kts = " + auto);
var _factories = new Packages.javax.script.ScriptEngineManager().getEngineFactories();
for (var i=0; i<_factories.size(); i++) {
    jsh.shell.console("Factory: " + _factories.get(i));
}

var factory = new Packages.org.jetbrains.kotlin.script.jsr223.KotlinJsr223JvmLocalScriptEngineFactory();

var kotlinc = factory.getScriptEngine();
kotlinc.put("message", "foo");
var result = kotlinc.eval(jsh.script.file.parent.getFile("kotlin.kts").read(String));
jsh.shell.console("result = " + result);

//  TODO    why does kotlin.io not work?
