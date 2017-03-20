//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the SLIME loader infrastructure.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2016 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

//	TODO	remove licenses from files
//	TODO	check whether contents of comment in <style> need to be escaped

var parameters = jsh.script.getopts({
	options: {
		base: jsh.shell.PWD.pathname,
		list: false,
		preview: false
	}
});

var apis = parameters.options.base.directory.list({
	filter: function(node) {
		if (node.directory) return false;
		if (/api\.html$/.test(node.pathname.basename)) return true;
		return false;
	},
	descendants: function(dir) {
		return true;
	}
}).forEach(function(api) {
	jsh.shell.console("api = " + api);
	var document = new jsh.document.Document({
		string: api.read(String)
	});
	var head = document.identify( jsh.document.filter({ elements: "head" }) );

	var isStyle = function(node) {
		if (node.element && node.element.attributes.get("id") == "slime-api.css") {
			return true;
		} else if (node.element && node.element.type.name == "link" && /api\.css$/.test(node.element.attributes.get("href"))) {
			return true;
		}
	};

	var isScript = function(node) {
		if (node.element && node.element.attributes.get("id") == "slime-api.js") {
			return true;
		} else if (node.element && node.element.type.name == "script" && /api\.js$/.test(node.element.attributes.get("src"))) {
			return true;
		}
	}

	var indexMatching = function(f) {
		for (var i=0; i<this.length; i++) {
			if (f(this[i])) return i;
		}
		return -1;
	};

	var readFile = function(path) {
		var string = jsh.script.file.parent.parent.getFile(path).read(String);
		//	filter out license
		var lines = string.split("\n");
		if (path == "api.js") {
			var begin = lines.indexOf("//\tLICENSE");
			var end = lines.indexOf("//\tEND LICENSE");
			lines.splice(begin,end-begin+1);
		} else if (path == "api.css") {
			var begin = lines.indexOf("LICENSE")-1;
			var end = lines.indexOf("END LICENSE")+1;
			lines.splice(begin,end-begin+1,"");
		}
		string = lines.join("\n");
		return string;
	}

	var style = indexMatching.call(head.children,isStyle);

	if (style == -1) {
		style = head.children.length;
		head.children.push(void(0));
		head.children.push(jsh.document.Text({ data: "\n" }));
	}

	//	TODO	if document namespace is xhtml, should give these elements namespace also

	head.children[style] = new jsh.document.Element({
		type: {
			name: "style"
		},
		attributes: [
			{ name: "id", value: "slime-api.css" },
			{ name: "type", value: "text/css" }
		],
		children: [
			new jsh.document.Text({
				text: readFile("api.css")
			})
		]
	});

	var script = indexMatching.call(head.children,isScript);

	if (script == -1) {
		script = head.children.length;
		head.children.push(void(0));
		head.children.push(jsh.document.Text({ data: "\n" }));
	}

	head.children[script] = new jsh.document.Element({
		type: {
			name: "script"
		},
		attributes: [
			{ name: "id", value: "slime-api.js" },
			{ name: "type", value: "application/javascript" }
		],
		children: [
			new jsh.document.Text({ text: "//" }),
			new jsh.document.Cdata({
				cdata: readFile("api.js") + "//"
			})
		]
	});

	if (parameters.options.list) {
		jsh.shell.console(api.pathname);
	} else if (parameters.options.preview) {
		jsh.shell.console(api.pathname);
		jsh.shell.console(document);
		jsh.shell.console("");
	} else {
		api.pathname.write(document.toString(), { append: false });
	}
});
