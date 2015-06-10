//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2014 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

//	http://mxr.mozilla.org/mozilla-central/source/browser/components/privatebrowsing/src/nsPrivateBrowsingService.js

var mpl = $context.getLicense("mpl");

$exports.mpl = {};

var Expression = function(specification) {
	if (specification.pathname) {
		specification = specification.read(String);
//		specification = specification.substring(1,specification.length-1);
	}

	this.parser = (function() {
		var pattern = specification.replace(/\./g, "\\.");
		pattern = pattern.replace(/\(/g, "\\(");
		pattern = pattern.replace(/\)/g, "\\)");
		pattern = pattern.replace(/\n/g, "\n");
		pattern = pattern.replace(/\//g, "\\/");
		var index = 1;
		while(pattern.indexOf(index) != -1) {
			pattern = pattern.replace("$"+index, "(.*)");
			index++;
		}
		return new RegExp(pattern);
	})();

	this.create = function() {
		var rv = specification;
		for (var i=0; i<arguments.length; i++) {
			rv = rv.replace("$" + String(i+1), arguments[i]);
		}
		return rv;
	}
}

$exports.mpl["1.1"] = new function() {
	this.introduction = new Expression($context.getLicense("mpl11"));

	this.original = new Expression("The Original Code is $1.");

	this.initial = new Expression("The Initial Developer of the Original Code is $1.");

	this.copyright = new Expression("Portions created by the Initial Developer are Copyright (C) $1 the Initial Developer. All Rights Reserved.");

	this.contributors = new Expression("Contributor(s):");

	this.contributor = new Expression("\t$1 <$2>");
};

$exports.mpl["2.0"] = new function() {
	var delegate = $exports.mpl["1.1"];

	for (var x in delegate) {
		this[x] = delegate[x];
	}

	this.introduction = new Expression($context.getLicense("mpl20"));
}

$exports.languages = new function() {
	var createLicenseLines = function(template,p) {
		var insert = [];
		insert = insert.concat(template.introduction.create().split("\n"));
		insert.push("");
		insert = insert.concat(template.original.create(p.original).split("\n"));
		insert.push("");
		insert = insert.concat(template.initial.create(p.copyright.initial).split("\n"));
		insert = insert.concat(template.copyright.create(p.copyright.year).split("\n"));
		insert.push("");
		insert = insert.concat(template.contributors.create().split("\n"));
		if (p.contributors) {
			p.contributors.forEach( function(contributor) {
				insert = insert.concat(template.contributor.create(contributor.name, contributor.email).split("\n"));
			});
		}
		return insert;
	}

	var parseLicense = function(template,lines) {
		var rv = {
			introduction: [],
			contributors: []
		};
		lines.forEach( function(line) {
			var original = template.original.parser.exec(line);
			if (original) {
				rv.original = original[1];
			} else if (!rv.original && line != "LICENSE") {
				rv.introduction.push(line);
			}
			var initial = template.initial.parser.exec(line);
			if (initial) {
				rv.copyright = {
					initial: initial[1]
				}
			}
			var copyright = template.copyright.parser.exec(line);
			if (copyright) {
				rv.copyright.year = copyright[1];
			}
			var contributor = template.contributor.parser.exec(line);
			if (contributor) {
				rv.contributor = {
					name: contributor[1],
					email: contributor[2]
				}
			}
		});
		return rv;
	}

	var BeginEnd = function(start,end) {
		var getBlock = function(lines) {
			var block = [];
			var index = 2;
			while(lines[index] != "END LICENSE") {
				block.push(lines[index++]);
			}
			index++;
			if (lines[index++] != end) {
				throw "Error: not end comment" + lines[index++];
			}
			while(/^\s*$/.test(lines[index])) {
				block.push(lines[index++]);
			}
			return block;
		}

		this.getLicense = function(lines,template) {
			if (lines[0] == start && lines[1] == "LICENSE") {
				return parseLicense(template,getBlock(lines));
			} else {
				return null;
			}
		}

		this.remove = function(lines) {
			var block = getBlock(lines);
			lines.splice(0,block.length+4);
		}

		this.insert = function(template,p,lines) {
			var insert = createLicenseLines(template,p);
			insert.splice(0,0,start,"LICENSE");
			insert.push("END LICENSE");
			insert.push(end);
			for (var i=0; i<insert.length; i++) {
				lines.splice(i,0,insert[i]);
			}
		}
	}

	var Line = function(prefix) {
		var getBlock = function(lines) {
			var block = [];
			block.push(lines[0].substring(prefix.length+1));
			var index = 1;
			while((lines[index] == prefix) || (lines[index].substring(0,prefix.length+1) == (prefix+"\t"))) {
				block.push(lines[index++].substring(prefix.length+1));
			}
			if (block[block.length-1] != ("END LICENSE")) {
				throw new Error("Expected END LICENSE to end license; got " + block[block.length-1] + " in ");
			}
			while(/^\s*$/.test(lines[index])) {
				block.push(lines[index++]);
			}
			return block;
		}

		this.getLicense = function(lines,template) {
			if (lines[0] == (prefix+"\t"+"LICENSE")) {
				var block = getBlock(lines);
				return parseLicense(template,block);
			} else {
				return null;
			}
		}

		this.remove = function(lines) {
			var block = getBlock(lines);
			lines.splice(0,block.length);
		}

		this.insert = function(template,p,lines) {
			var insert = createLicenseLines(template,p);
			insert.splice(0,0,"LICENSE");
			insert.push("END LICENSE");
			insert = insert.map( function(line) {
				if (line.length > 0) {
					return prefix + "\t" + line;
				} else {
					return prefix;
				}
			});
			insert.push("");
			for (var i=0; i<insert.length; i++) {
				lines.splice(i,0,insert[i]);
			}
		}
	}

	//	all languages that allow '//' and '/* */'
	var cplusplus = new Line("//");

	this.html = new BeginEnd("<!--","-->");
	this.xml = new BeginEnd("<!--","-->");
	this.js = cplusplus;
	this.coffee = new BeginEnd("###","###");
	this.bash = new Line("#");
	this.properties = new Line("#");
	this.java = cplusplus;
	this.jsh = cplusplus;
	this.css = new BeginEnd("/*","*/");
	this.cpp = cplusplus;
	this.c = new BeginEnd("/*","*/");
	this.def = new Line(";");
	this.hgrc = new Line("#");
}

$exports.SourceFile = function(lines,format,template) {
	this.__defineGetter__("license", function() {
		return format.getLicense(lines,template);
	});

	this.__defineSetter__("license", function(p) {
		var now = format.getLicense(lines,template);
		if (!now) {
			//	insert
			format.insert(template,p,lines);
		} else {
			//	TODO update
			format.remove(lines);
			format.insert(template,p,lines);
		}
	});

	this.toString = function() {
		return lines.join("\n");
	}
}
//	TODO	check to see whether line endings are correct
//	TODO	develop formats for license:
//			.MF (line?): #
