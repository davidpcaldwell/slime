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

jsh.shell.jsh.lib.getRelativePath("kotlin/lib/kotlin-scripting-jvm-host.jar").write(new jsh.http.Client().request({
    url: "http://central.maven.org/maven2/org/jetbrains/kotlin/kotlin-scripting-jvm-host/1.3.31/kotlin-scripting-jvm-host-1.3.31.jar"
}).body.stream, { append: false });
