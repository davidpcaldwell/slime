var parameters = jsh.script.getopts({
    options: {
        format: String
    }
});

var html = new jsh.document.Document({
    file: jsh.script.file.parent.parent.getFile("api.html")
});

var body = html.identify(
    jsh.document.filter({ attribute: "id", value: "template.body" })
);

jsh.shell.console("body = " + body.children.map(function(child) {
    var namespaces = {};
    namespaces[jsh.document.namespace.XHTML] = "";
    return child.serialize({
        namespaces: namespaces
    });
}).join(""));
