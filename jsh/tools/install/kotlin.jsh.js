var URL = "https://github.com/JetBrains/kotlin/releases/download/v1.3.31/kotlin-compiler-1.3.31.zip";

var existing = jsh.shell.jsh.lib.getSubdirectory("kotlin");
if (existing) existing.remove();

jsh.tools.install.install({
    url: URL,
    to: jsh.shell.jsh.lib.getRelativePath("kotlin"),
    getDestinationPath: function(file) {
        return "kotlinc";
    }
});

var client = new jsh.http.Client();

var TMP = jsh.shell.TMPDIR.createTemporary({ directory: true });
TMP.getRelativePath("META-INF/services/javax.script.ScriptEngineFactory").write(
    "org.jetbrains.kotlin.script.jsr223.KotlinJsr223JvmLocalScriptEngineFactory",
    { append: false, recursive: true }
);
jsh.io.archive.zip.encode({
    //  below call not easily deduced from documentation
    stream: jsh.shell.jsh.lib.getRelativePath("kotlin/lib/jsr223.jar").write(jsh.io.Streams.binary),
    //  below property not easily deduced from documentation
    entries: TMP.list({
        type: TMP.list.RESOURCE,
        filter: function(node) {
            return !node.directory;
        },
        descendants: function(directory) {
            return true;
        }
    })
})

jsh.shell.jsh.lib.getRelativePath("kotlin/lib/kotlin-script-util.jar").write(client.request({
    url: "http://central.maven.org/maven2/org/jetbrains/kotlin/kotlin-script-util/1.3.31/kotlin-script-util-1.3.31.jar"
}).body.stream, { append: false });
// jsh.shell.jsh.lib.getRelativePath("kotlin/lib/kotlin-scripting-jvm-host.jar").write(new jsh.http.Client().request({
//     url: "http://central.maven.org/maven2/org/jetbrains/kotlin/kotlin-scripting-jvm-host/1.3.31/kotlin-scripting-jvm-host-1.3.31.jar"
// }).body.stream, { append: false });
