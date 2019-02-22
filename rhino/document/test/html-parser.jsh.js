var paraameters = jsh.script.getopts({
    options: {}
});

var document = new jsh.document.Document.Html({ string: jsh.script.file.parent.getFile("parser.html").read(String) });
jsh.shell.echo(JSON.stringify({
    xhtml: document.toString(),
    parser: jsh.document.Document.Html.parser
}));
if (jsh.document.Document.Html.parser == "javafx") {
    Packages.javafx.application.Platform.exit();
}