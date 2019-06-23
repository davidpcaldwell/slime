var parser = jsh.loader.module(jsh.script.file.parent.parent.parent.parent.getRelativePath("loader/document/module.js"), {
	$slime: jsh.unit.$slime
});
var html = parser.load({
	loader: jsh.script.loader,
	path: "data/1/api.html"
});
jsh.shell.console(html);

var adapted = new (function(html) {
	this.top = html.document.element;
})(html);

var tests = new jsh.unit.html.ApiHtmlTests(html, "Suite loaded using new HTML parser");
