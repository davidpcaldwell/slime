//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//	http://mxr.mozilla.org/mozilla-central/source/browser/components/privatebrowsing/src/nsPrivateBrowsingService.js

//@ts-check
(
	/**
	 *
	 * @param { slime.$api.Global } $api
	 * @param { slime.project.license.Context } $context
	 * @param { slime.loader.Export<slime.project.license.Exports> } $export
	 */
	function($api,$context,$export) {
		/** @type { slime.project.license.Exports } */
		var $exports = {};

		/**
		 *
		 * @param { string } specification
		 */
		var Expression = function(specification) {
			return {
				parser: (function() {
					var pattern = specification.replace(/\./g, "\\.");
					pattern = pattern.replace(/\(/g, "\\(");
					pattern = pattern.replace(/\)/g, "\\)");
					pattern = pattern.replace(/\n/g, "\n");
					pattern = pattern.replace(/\//g, "\\/");
					var index = 1;
					while(pattern.indexOf(String(index)) != -1) {
						pattern = pattern.replace("$"+index, "(.*)");
						index++;
					}
					return new RegExp(pattern);
				})(),
				create: function() {
					var rv = specification;
					for (var i=0; i<arguments.length; i++) {
						rv = rv.replace("$" + String(i+1), arguments[i]);
					}
					return rv;
				}
			};
		};

		var mpl1 = $context.getLicense("mpl");

		$exports.mpl = {
			"1.1": new function() {
				this.introduction = Expression($context.getLicense("mpl11"));

				this.original = Expression("The Original Code is $1.");

				this.initial = Expression("The Initial Developer of the Original Code is $1.");

				this.copyright = Expression("Portions created by the Initial Developer are Copyright (C) $1 the Initial Developer. All Rights Reserved.");

				this.contributors = Expression("Contributor(s):");

				this.contributor = Expression("\t$1 <$2>");
			},
			"2.0": new function() {
				this.introduction = Expression($context.getLicense("mpl20"));
			}
		};

		$exports.languages = new function() {
			var createLicenseLines = function(template,p) {
				var insert = [];
				insert = insert.concat(template.introduction.create().split("\n"));
				if (template.original) {
					insert.push("");
					insert = insert.concat(template.original.create(p.original).split("\n"));
				}
				if (template.initial) {
					insert.push("");
					insert = insert.concat(template.initial.create(p.copyright.initial).split("\n"));
				}
				if (template.copyright) {
					insert = insert.concat(template.copyright.create(p.copyright.year).split("\n"));
					insert.push("");
				}
				if (template.contributors) {
					insert = insert.concat(template.contributors.create().split("\n"));
					if (p.contributors) {
						p.contributors.forEach( function(contributor) {
							insert = insert.concat(template.contributor.create(contributor.name, contributor.email).split("\n"));
						});
					}
				}
				return insert;
			}

			var parseLicense = function(template,lines) {
				var rv = {
					introduction: [],
					contributors: []
				};
				lines.forEach( function(line) {
					if (template.original) {
						var original = template.original.parser.exec(line);
						if (original) {
							rv.original = original[1];
						} else if (!rv.original && line != "LICENSE") {
							rv.introduction.push(line);
						}
					}

					if (template.initial) {
						var initial = template.initial.parser.exec(line);
						if (initial) {
							rv.copyright = {
								initial: initial[1]
							}
						}
					}

					if (template.copyright) {
						var copyright = template.copyright.parser.exec(line);
						if (copyright) {
							rv.copyright.year = copyright[1];
						}
					}

					if (template.contributor) {
						var contributor = template.contributor.parser.exec(line);
						if (contributor) {
							rv.contributor = {
								name: contributor[1],
								email: contributor[2]
							}
						}
					}
				});
				return rv;
			}

			var getInsertLineIndex = function(lines) {
				//	TODO	currently there is an empty file at rhino/tools/db/jdbc/api.js, and it is actually loaded on jsh startup,
				//			so need to handle empty files
				if (lines.length == 0) return 0;
				if (lines[0].substring(0,2) == "#!") return 1;
				if (lines[0].substring(0,5) == "<?xml") return 1;
				return 0;
			}

			/**
			 *
			 * @param { string } start
			 * @param { string } end
			 */
			var BeginEnd = function(start,end) {
				/**
				 *
				 * @param { string[] } lines
				 * @returns { string[] }
				 */
				var getBlock = function(lines) {
					var block = [];
					var index = 2;
					while(lines[index] != "END LICENSE") {
						block.push(lines[index++]);
					}
					index++;
					if (lines[index++] != end) {
						throw new Error("Not end comment" + lines[index]);
					}
					while(/^\s*$/.test(lines[index])) {
						block.push(lines[index++]);
					}
					return block;
				}

				return {
					getLicense: function(lines,template) {
						var startIndex = getInsertLineIndex(lines);
						if (lines[startIndex] == start && lines[startIndex+1] == "LICENSE") {
							return parseLicense(template,getBlock(lines.slice(startIndex)));
						} else {
							return null;
						}
					},
					remove: function(lines) {
						var startIndex = getInsertLineIndex(lines);
						var block = getBlock(lines.slice(startIndex));
						lines.splice(startIndex,block.length+4);
					},
					insert: function(template,p,lines) {
						var insert = createLicenseLines(template,p);
						insert.splice(0,0,start,"LICENSE");
						insert.push("END LICENSE");
						insert.push(end);
						var offset = getInsertLineIndex(lines);
						for (var i=0; i<insert.length; i++) {
							lines.splice(i+offset,0,insert[i]);
						}
					}
				}
			}

			var Line = function(prefix,suffix) {
				if (!suffix) suffix = "";

				var getBlock = function(lines) {
					var block = [];
					block.push(lines[0].substring(prefix.length+1,lines[0].length-suffix.length));
					var index = 1;
					while((lines[index] == prefix+suffix) || (lines[index].substring(0,prefix.length+1) == (prefix+"\t"))) {
						block.push(lines[index].substring(prefix.length+1,lines[index].length-suffix.length));
						index++;
					}
					if (block[block.length-1] != ("END LICENSE")) {
						throw new Error("Expected END LICENSE to end license; got " + block[block.length-1] + " in ");
					}
					while(/^\s*$/.test(lines[index])) {
						block.push(lines[index++]);
					}
					return block;
				}

				var getLicenseStart = function(lines) {
					var start = (prefix+"\t"+"LICENSE"+suffix);
					if (lines[0] == start) return 0;
					if (lines[1] == start) return 1;
					return null;
				}

				this.getLicense = function(lines,template) {
					var start = getLicenseStart(lines);
					if (start !== null) {
						var block = getBlock(lines.slice(start));
						return parseLicense(template,block);
					} else {
						return null;
					}
				}

				this.remove = function(lines) {
					var start = getLicenseStart(lines);
					if (start !== null) {
						var block = getBlock(lines.slice(start));
						lines.splice(start,block.length);
					}
				}

				this.insert = function(template,p,lines) {
					var insert = createLicenseLines(template,p);
					insert.splice(0,0,"LICENSE");
					insert.push("END LICENSE");
					insert = insert.map( function(line) {
						if (line.length > 0) {
							return prefix + "\t" + line + suffix;
						} else {
							return prefix + suffix;
						}
					});
					insert.push("");
					var offset = getInsertLineIndex(lines);
					for (var i=0; i<insert.length; i++) {
						lines.splice(i+offset,0,insert[i]);
					}
				}
			};

			var Markdown = function() {
				var delegate = new Line("[comment]: # (");
				this.getLicense = function(lines,template) {

				}
			}

			//	all languages that allow '//' and '/* */'
			var cplusplus = new Line("//");

			this.html = BeginEnd("<!--","-->");
			this.xml = BeginEnd("<!--","-->");
			//	One source suggests triple-dash: http://stackoverflow.com/questions/4823468/comments-in-markdown
			this.md = new Line("[comment]: # (",")");
			this.js = cplusplus;
			this.ts = cplusplus;
			this.pac = cplusplus;
			this.coffee = BeginEnd("###","###");
			this.properties = new Line("#");
			this.prefs = new Line("#");
			this.java = cplusplus;
			this.scala = cplusplus;
			this.jsh = cplusplus;
			this.css = BeginEnd("/*","*/");
			this.cpp = cplusplus;
			this.c = BeginEnd("/*","*/");
			this.def = new Line(";");
			this.hgrc = new Line("#");
			this.dockerignore = new Line("#");
			this.Dockerfile = new Line("#");
			this.gradle = cplusplus;
			this.py = new Line("#");
			this.bashrc = new Line("#");
			this.rc = new Line("#");
			this.kts = cplusplus;
			this.yaml = new Line("#");
			this.yml = new Line("#");

			this.bash = new Line("#");
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

		$export($exports);
	}
//@ts-ignore
)($api,$context,$export);
