//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the jsh JavaScript/Java shell.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2016 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

window.addEventListener('load', function() {
    //	TODO	CORS
    document.domain = document.domain;

    var xhr = new XMLHttpRequest();
    xhr.open("GET","../../../../$reload",false);
    xhr.send();

    var xhr = new XMLHttpRequest();
    xhr.open("GET","../../../../",false);
    xhr.send();
    var settings = JSON.parse(xhr.responseText);

    var whitespace = inonit.loader.loader.value("whitespace.js");

	var editable = typeof(document.createElement("span").contentEditable) != "undefined";

    var selection = (function() {
        var state = new function() {
            var current;

            this.is = function(element) {
            	return current && current.element == element;
            }

            this.select = function(element) {
				if (current) current.deselect();
				current = new function() {
					this.element = element;

					var was = element.style.backgroundColor;
					element.style.backgroundColor = "#c0c0ff";

					this.deselect = function() {
						element.style.backgroundColor = was;
					}
				};
				var status = document.getElementById("status");
				var node = element;
				//	TODO	the below heuristic may not be foolproof for all documents
				while(node.tagName != "HTML") {
					var child = document.createElement("span");
					child.className = "path";
					child.innerHTML = node.tagName;
					status.insertBefore(child,status.children[0]);
					node = node.parentNode;
				}
            };
        };
        return state;
    })();

    var inline = function(callback) {
		var contentEditable = this.contentEditable;

        var listener = function(target,callback) {
        	return function(e) {
				if (e.key == "Enter") {
					this.removeEventListener("keydown", arguments.callee);
					if (this.contentEditable == "true") {
						//  TODO    should restore to previous value, not false
						this.contentEditable = contentEditable;
					} else if (!editable) {
						target.innerHTML = this.value;
						target.inonit = null;
					} else {
						throw new Error();
					}
					if (callback) callback();
				}
        	};
        };

        this.addEventListener("click", function(e) {
			if (editable) {
				if (this.contentEditable == "true") return;
				this.contentEditable = "true";
				this.addEventListener("keydown", listener(this,callback));
			} else {
				if (this.inonit && this.inonit.inline) return;
				var html = this.innerHTML;
				this.innerHTML = "";
				var input = document.createElement("input");
				input.value = html;
				this.appendChild(input);
				input.addEventListener("keydown", listener);
				this.inonit = { inline: true };
			}
        });
    };

    document.getElementById("target").addEventListener("load", function(e) {
    	//	Set up HEAD here by iterating through nodes of content document <head>
    	var head = this.contentDocument.getElementsByTagName("head")[0];
    	var tbody = document.getElementById("head").getElementsByTagName("tbody")[0];

    	var handleRow = function(handler) {
    		return function(child) {
				var tr = document.createElement("tr");
				var label = document.createElement("td");
				var editor = document.createElement("td");
				handler(child,label,editor);
				tr.appendChild(label);
				tr.appendChild(editor);
				tbody.appendChild(tr);
    		}
    	};

		var formEditable = function(p) {
			var parent = p.parent;
			var elements = p.elements;

			var defaults = {
				show: {
					display: window.getComputedStyle(elements.show).display
				},
				edit: {
					display: window.getComputedStyle(elements.edit).display
				}
			};

			var show = {
				entered: function() {
					elements.show.style.display = defaults.show.display;
					elements.edit.style.display = "none";
				}
			};

			var edit = {
				entered: function() {
					elements.show.style.display = "none";
					elements.edit.style.display = defaults.edit.display;
					elements.edit.focus();
				}
			}
			var state;

			var update = function(to) {
				state = to;
				state.entered();
			}

			update(show);

			elements.show.addEventListener("click", function(e) {
				update(edit);
			});

			elements.edit.addEventListener("keypress", function(e) {
				if (e.key == "Enter" && e.ctrlKey) {
					e.preventDefault();
					e.stopPropagation();
					p.update.call(elements);
					update(show);
				}
			});

			elements.edit.addEventListener("keydown", function(e) {
				if (e.key == "Escape") {
					e.stopPropagation();
					p.reset.call(elements);
					update(show);
				}
			});

			parent.appendChild(elements.show);
			parent.appendChild(elements.edit);
		}

		var stringInputElements = function(value) {
			return {
				show: (function() {
					var rv = document.createElement("span");
					rv.appendChild(document.createTextNode(value));
					return rv;
				})(),
				edit: (function() {
					var rv = document.createElement("input");
					rv.style.width = "100%";
					rv.value = value;
					return rv;
				})()
			}
		};

		var handleTitle = handleRow(function(child,label,editor) {
			label.innerHTML = "title";
			formEditable({
				parent: editor,
				elements: stringInputElements(child.innerHTML),
				update: function() {
					child.innerHTML = this.edit.value;
					this.show.innerHTML = "";
					this.show.appendChild(document.createTextNode(child.innerHTML));
					document.getElementById("title").innerHTML = this.edit.value;
					document.getElementById("target").contentDocument.title = this.edit.value;
				},
				reset: function() {
					this.edit.value = child.innerHTML;
				}
			});
// 			var span = document.createElement("span");
// 			span.innerHTML = child.innerHTML;
// 			editor.appendChild(span);
// 			inline.call(span,function() {
// 				document.getElementById("title").innerHTML = span.innerHTML;
// 				var title = .getElementsByTagName("title")[0];
// 				title.innerHTML = span.innerHTML;
// 			});
		});

		var handleLink = handleRow(function(child,label,editor) {
			label.innerHTML = "link " + "(" + child.rel + ")";
			formEditable({
				parent: editor,
				elements: stringInputElements(child.href),
				update: function() {
					child.href = this.edit.value;
					this.show.innerHTML = "";
					this.show.appendChild(document.createTextNode(child.href));
				},
				reset: function() {
					this.edit.value = child.href;
				}
			});
		});

		var indentedEditor = function(child,editor,context) {
			var toEditor = function(data) {
				var content = whitespace.content(data);
				return content.lines.join("\n");
			};

			var endIndent = (function(child) {
				var tokens = context.get().split("\n");
				if (tokens.length == 1) {
					return whitespace.after(context.get());
				} else {
					return whitespace.before(tokens[tokens.length-1]);
				}
			})(child);

			var fromEditor = function(data,value) {
				var content = whitespace.content(data);
				var lines = value.split("\n");
				var rv = [];
				rv.push.apply(rv,content.before);
				rv.push.apply(rv,lines.map(function(line) {
					return content.indent + line;
				}));
				rv[rv.length-1] += endIndent;
				rv.push.apply(rv,content.after);
				return rv.join("\n");
			};

			var CommentData = function(parent,target) {
				var startIndent = (function(child) {
					var previous = child.previousSibling;
					if (!previous) return "";
					if (previous.nodeName != "#text") return "";
					var tokens = previous.data.split("\n");
					if (tokens.length == 1) return whitespace.before(previous.data);
					return tokens[tokens.length-1];
				})(child);

				var multiline = function(data) {
					return data.split("\n").filter(function(line) {
						return !whitespace.is(line);
					}).length > 1;
				};

				var TAB_WIDTH = 4;

				//	TODO	may want to reverse this thinking: use standard editor width (132?) and reduce by
				//			the width of the indent?
				var maxWidth = function(content) {
					var indent = 0;
// 					for (var i=0; i<content.indent.length; i++) {
// 						if (content.indent.substring(i,i+1) == "\t") {
// 							indent += TAB_WIDTH;
// 						} else {
// 							indent++;
// 						}
// 					};
					var rv = 0;
					content.lines.forEach(function(line) {
						if ((indent + line.length) > rv) {
							rv = indent + line.length;
						}
					});
					return rv;
				}

				var commentSpan = document.createElement("span");
				//	TODO	may want to figure out a way to display these with whitespace, in case the
				//			comment itself is formatted
				//	commentSpan.style.fontFamily = "monospace";
				//	commentSpan.style.whiteSpace = "pre";
				//	commentSpan.style.tabSize = 4;
				commentSpan.appendChild(document.createTextNode(context.span));
				var commentInput = document.createElement("textarea");
				var content = whitespace.content(context.get());
				var width = maxWidth(content);
				commentInput.cols = (width > 80) ? width : 80;
				commentInput.rows = (content.lines.length > 1) ? content.lines.length : 1;
				commentInput.style.fontFamily = "monospace";
				commentInput.style.tabSize = TAB_WIDTH;
				commentInput.value = toEditor(context.get());

				var elements = {
					show: commentSpan,
					edit: commentInput
				};

				formEditable({
					parent: parent,
					elements: elements,
					update: function() {
						var data = fromEditor(context.get(),this.edit.value);
						context.update.call(this,data);
					},
					reset: function() {
						var data = toEditor(context.get());
						context.reset.call(this,data);
					}
				});
			};

			CommentData(editor,child);
		}

		var handleScript = handleRow(function(child,label,editor) {
			var type = (child.src) ? "external" : "inline";
			label.innerHTML = "script (" + type + ")";
			if (type == "external") {
				formEditable({
					parent: editor,
					elements: stringInputElements(child.src),
					update: function() {
						child.src = this.edit.value;
						this.show.innerHTML = "";
						this.show.appendChild(document.createTextNode(child.src));
					},
					reset: function() {
						this.edit.value = child.src;
					}
				});
			} else {
				indentedEditor(child,editor,{
					span: "[code]",
					get: function() {
						return child.innerHTML;
					},
					update: function(data) {
						child.innerHTML = data;
					},
					reset: function(data) {
						this.edit.value = data;
					}
				});
			}
		})

		var handleElement = handleRow(function(child,label,editor) {
			label.innerHTML = child.tagName;
			editor.appendChild(document.createTextNode(child.outerHTML));
		});

		var handleComment = handleRow(function(child,label,editor) {
			label.innerHTML = "(comment)";
			indentedEditor(child,editor,{
				span: child.data,
				get: function() {
					return child.data;
				},
				update: function(data) {
					this.show.innerHTML = data;
					child.data = data;
				},
				reset: function(data) {
					this.edit.value = data;
				}
			});
		});

		var handleOther = handleRow(function(child,label,editor) {
			debugger;
			label.innerHTML = child.nodeType;
			editor.appendChild(document.createTextNode("(unknown)"));
		});

    	for (var i=0; i<head.childNodes.length; i++) {
    		var child = head.childNodes[i];
			var handler = function(child) {
			};
			var isOnlyWhitespace = /^\s+$/;
    		if (child.nodeType === 1) {
				if (child.tagName == "TITLE") {
					handler = handleTitle;
				} else if (child.tagName == "LINK") {
					handler = handleLink;
				} else if (child.tagName == "SCRIPT") {
					handler = handleScript;
				} else {
					handler = handleElement;
				}
    		} else if (child.nodeType === 3) {
    			if (!isOnlyWhitespace.test(child.data)) {
					debugger;
    			} else {
    				//	we ignore whitespace text nodes
    			}
    		} else if (child.nodeType == 8) {
    			handler = handleComment;
    		} else {
    			handler = handleOther;
    		}
    		handler(child);
    	}

        var content = document.getElementById("target").contentDocument;

		document.getElementById("title").innerHTML = content.title;

        this.contentDocument.addEventListener("click", function(e) {
			if (!selection.is(e.target)) {
				selection.select(e.target);
			}
        });

		var base = inonit.loader.base.split("/").slice(0,-3).join("/") + "/";

		if (settings.debug) {
			var loader = new inonit.loader.Loader(base);
			loader.run("slime/jsh/unit/specify/index.html.test.js", {
				$loader: new loader.Child("slime/")
			});
		}
    });

    document.getElementById("target").src = window.location + "../../../../../../filesystem/" + settings.api.substring(1);
});
