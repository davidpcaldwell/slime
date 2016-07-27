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

    var react = function(f) {
        return function() {
            var iframe = document.getElementById("target");
            var content = iframe.contentDocument;
            f(iframe,content);
        };
    }

    var title = react(function(iframe,content) {
        document.getElementById("title").innerHTML = content.title;
    });

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

		var handleTitle = handleRow(function(child,label,editor) {
			label.innerHTML = "title";
			var span = document.createElement("span");
			span.innerHTML = child.innerHTML;
			editor.appendChild(span);
			inline.call(span,function() {
				document.getElementById("title").innerHTML = span.innerHTML;
				var title = document.getElementById("target").contentDocument.getElementsByTagName("title")[0];
				title.innerHTML = span.innerHTML;
			});
		});

		var handleElement = handleRow(function(child,label,editor) {
			label.innerHTML = child.tagName;
			editor.appendChild(document.createTextNode(child.outerHTML));			
		});

		var handleComment = handleRow(function(child,label,editor) {
			label.innerHTML = "(comment)";

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

				var endIndent = (function(child) {
					var tokens = child.data.split("\n");
					if (tokens.length == 1) {
						return whitespace.after(child.data);
					} else {
						return whitespace.before(tokens[tokens.length-1]);
					}
				})(child);

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

				var toEditor = function(data) {
					var content = whitespace.content(data);
					return content.lines.join("\n");
				};

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

				var commentSpan = document.createElement("span");
				//	TODO	may want to figure out a way to display these with whitespace, in case the
				//			comment itself is formatted
				//	commentSpan.style.fontFamily = "monospace";
				//	commentSpan.style.whiteSpace = "pre";
				//	commentSpan.style.tabSize = 4;
				commentSpan.appendChild(document.createTextNode(child.data));
				var commentInput = document.createElement("textarea");
				var content = whitespace.content(child.data);
				var width = maxWidth(content);
				commentInput.cols = (width > 80) ? width : 80;
				commentInput.rows = (content.lines.length > 1) ? content.lines.length : 1;
				commentInput.style.fontFamily = "monospace";
				commentInput.style.tabSize = TAB_WIDTH;
				commentInput.value = toEditor(child.data);

				var defaults = {
					span: {
						display: window.getComputedStyle(commentSpan).display
					},
					input: {
						display: window.getComputedStyle(commentInput).display
					}
				};

				var show = {
					entered: function() {
						commentSpan.style.display = defaults.span.display;
						commentInput.style.display = "none";
					}
				};

				var edit = {
					entered: function() {
						commentSpan.style.display = "none";
						commentInput.style.display = defaults.input.display;
						commentInput.focus();
					}
				}
				var state;

				var update = function(to) {
					state = to;
					state.entered();
				}

				update(show);

				commentSpan.addEventListener("click", function(e) {
					update(edit);
				});

				commentInput.addEventListener("keypress", function(e) {
					if (e.key == "Enter" && e.ctrlKey) {
						e.preventDefault();
						e.stopPropagation();
						var data = fromEditor(child.data,this.value);
						commentSpan.innerHTML = data;
						child.data = data;
						update(show);
					}
				});

				parent.appendChild(commentSpan);
				parent.appendChild(commentInput);				
			};

			CommentData(editor,child);
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
        title();

        var content = document.getElementById("target").contentDocument;

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
