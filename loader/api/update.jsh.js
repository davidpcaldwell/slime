//	TODO	remove licenses from files
//	TODO	check whether contents of comment in <style> need to be escaped

var parameters = jsh.script.getopts({
	options: {
		base: jsh.shell.PWD.pathname
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
	jsh.shell.echo("api = " + api);
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
	
	var readFile = 
	
	var style = indexMatching.call(head.children,isStyle);
	
	if (style == -1) {
		style = head.children.length;
		head.children.push(void(0));
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
				text: jsh.script.file.parent.getFile("api.css").read(String)
			})
		]
	});
	
	var script = indexMatching.call(head.children,isScript);
	
	if (script == -1) {
		script = head.children.length;
		head.children.push(void(0));
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
			new jsh.document.Text({
				text: jsh.script.file.parent.getFile("api.js").read(String)
			})
		]		
	})
	jsh.shell.echo(document);
});
