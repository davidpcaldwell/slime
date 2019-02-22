var parameters = jsh.script.getopts({
    options: {
        format: String
    }
});

var html = new jsh.document.Document({
    file: jsh.script.file.parent.parent.getFile("api.html")
});

var getElement = function(id) {
    var rv = html.identify(
        jsh.document.filter({ attribute: "id", value: id })
    );
    if (rv.children.filter(jsh.document.filter({ elements: "ul" })).length == 1) {
        rv = rv.identify({
            filter: jsh.document.filter({ elements: "ul"}),
            descendants: function(node) { return false; }
        });
    }
    return rv;
}

// var body = html.identify(
//     jsh.document.filter({ attribute: "id", value: "template.body" })
// );

var snippets = {
    value: "liv",
    object: "lio",
    function: "lif",
    constructor: "lic",
    type: "divt",
    supports: "spas"
};

var namespaces = {};
namespaces[jsh.document.namespace.XHTML] = "";

var toHtml = function(element) {
    return element.children.map(function(child) {
        return child.serialize({
            namespaces: namespaces
        });
    }).join("");
};

//  TODO    strip leading shared whitespace

if (parameters.options.format == "vscode") {
    var out = {};
    for (var x in snippets) {
        var element = toHtml(getElement("template." + x));
        var lines = element.split("\n");

        if (lines[0]) {
            if (lines[0])
            throw new Error(JSON.stringify(lines));
        } else {
            lines = lines.slice(1);
        }

        if (lines[lines.length-1].replace(/\t/g, "")) {
            throw new Error(JSON.stringify(lines[lines.length-1]));
        } else {
            lines = lines.slice(0,lines.length-1);
        }

        var indentParser = /^(\s*).*$/;
        var indentMatch = indentParser.exec(lines[0])[1];
        for (var i=0; i<lines.length; i++) {
            var indent = lines[i].substring(0,indentMatch.length);
            if (indent == indentMatch) {
                lines[i] = lines[i].substring(indentMatch.length);
            } else {
                throw new Error("Does not start with " + JSON.stringify(indentMatch) + ": " + lines[i]);
            }
        }

        out["api.html " + x] = {
            prefix: snippets[x],
            body: lines,
            //  TODO    improve description
            description: "api.html " + x
        };
    }
    jsh.shell.echo(JSON.stringify(out, void(0), "    "));
} else {
    var out = {};
    for (var x in snippets) {
        out[x] = toHtml(getElement("template." + x));
    }
    jsh.shell.echo(JSON.stringify(out, void(0), "    "));
}

// jsh.shell.console("body = " + body.children.map(function(child) {
//     return child.serialize({
//         namespaces: namespaces
//     });
// }).join(""));
