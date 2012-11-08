var jsdom = jsh.script.loader.file("jsdom.js");

var BASE = jsh.script.getRelativePath("../..").directory;

var pages = {};
pages.jsh = {};
XML.ignoreWhitespace = false;
XML.prettyPrinting = false;
pages.jsh.unit = BASE.getFile("jsh/unit/api.html").read(XML);
var document = jsdom.Document.E4X(pages.jsh.unit);
var xhtml = "http://www.w3.org/1999/xhtml";
var root = document.get(function(node) {
	return node.name && node.name.local == "html";
})[0];
var head = root.get(function(node) {
	return node.name && node.name.local == "head";	
})[0];
var body = root.get(function(node) {
	return node.name && node.name.local == "body";	
})[0];
debugger;
var css = head.get(function(node) {
	return node.name && node.name.local == "link" && /api\.css$/.test(node.getAttribute("href"));
})[0];
if (css) {
	head.remove(css);
}
var top = "../../loader/api/";
head.append(new jsdom.Element({
	name: {
		namespace: xhtml,
		local: "link"
	},
	attributes: [
		{ local: "rel", value: "stylesheet" },
		{ local: "type", value: "text/css" },
		{ local: "href", value: top + "api.css" }
	]
}));
debugger;

var verify = function(b) {
	if (!b) {
		throw new Error("Assertion failed.");
	}
};

var link = head.get(function(node) {
	return node.name && node.name.local == "link";
})[0];
verify(typeof(link) != "undefined");
verify(link.name.local == "link");
verify(link.getAttribute("rel") == "stylesheet");
root.toString();
head.toString();
body.insert(new jsdom.Element({
	name: {
		namespace: xhtml,
		local: "a"
	},
	attributes: [
		{ local: "href", value: top + "index.html" }
	],
	children: [
		new jsdom.Text("Documentation Home")
	]
}), { index: 0 });
var inserted = body.get()[0];
verify(typeof(inserted) != "undefined");
verify(inserted.name.local == "a");
verify(inserted.get()[0].toString() == "Documentation Home");
var jsapiDiv = body.get({
	//	TODO	probably need to be able to return STOP or something from filter to stop searching below a certain element
	//	TODO	may want to look into xpath
	recursive: true,
	filter: function(node) {
		if (!node.name) return false;
		var elements = node.get(function(child) {
			return Boolean(child.name);
		});
		if (elements[0] && elements[0].name.local == "h1") {
			if (elements[0].get()[0] && elements[0].get()[0].toString() == "jsapi.jsh.js") {
				return true;
			} else {
				return false;
			}
		} else {
			return false;
		}
	}
})[0];
var before = body.toString();
verify(before == body.toString());
if (jsapiDiv) {
	body.remove({
		recursive: true,
		node: jsapiDiv
	});
	verify(before != body.toString());
}
debugger;
