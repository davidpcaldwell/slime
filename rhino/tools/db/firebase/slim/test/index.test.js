inonit.slim.initialize(function() {
	var NewTest = function(o) {
		var page = new function() {
			var delegate = inonit.slim.getDocument();
			
			var wrapComponent = function(rv) {
				rv.getComponent = (function(underlying) {
					return function(path) {
						return wrapComponent(underlying.apply(this,arguments));
					};
				})(rv.getComponent);
				var tag = (rv.element) ? rv.element.tagName.toLowerCase() : null;
				var type = (rv.getSlimAttribute) ? rv.getSlimAttribute("class") : null;
				rv.unit = true;
				if (tag == "select" && type == "Array") {
					rv.choose = function(string) {
						var getCaption = function(option) {
							return option.innerHTML;
						};
						
						var now = (function() {
							var options = this.element.selectedOptions;
							if (options.length == 0) return null;
							if (options.length > 1) throw new TypeError("Multi-select");
							return getCaption(options[0]);
						}).call(this);
						
						if (now == string) {
							//	do nothing
						} else {
							//	find option with given caption
							var desired = inonit.js.Array(this.list()).one(function() {
								return this.element.innerHTML == string;
							});
							desired.element.selected = true;
							unit.fire.change(rv);
						}
					};
				}
				if (type == "Array") {
					rv.list = (function(underlying) {
						return function() {
							var was = underlying.apply(this,arguments);
							return was.map(wrapComponent);
						};
					})(rv.list);
				}
				return rv;
			}
			
			this.getComponent = function(string) {
				return wrapComponent(delegate.getComponent(string));
			}
		};
		
		return new function() {
			this.edits = function() {
				if (o.setup) o.setup();
			};
			
			var dummy = {};
			
			this.event = function() {
				if (o.run) {
					unit.background.started(dummy);
					o.run(page);
					unit.background.finished(dummy);
				}
			};
			
			this.wait = Boolean(o.run);
			
			this.tests = function(verify) {
				if (o.check) o.check(verify);
				if (o.undo) o.undo();
			}
		}
	};
	
	var database;
	var object;
	var data;
	
	unit.test(new NewTest({
		run: function(page) {
			database = page.getComponent("session").database;
			database.root()().write.POST(null)();
		}
	}));
	
	unit.test(new NewTest({
		run: function() {
			object = database.root()().write.POST({ foo: "bar" })();
		},
		check: function(verify) {
			verify(object,"root").foo().is("bar");
		}
	}));
	
	unit.test(new NewTest({
		run: function() {
			object.foo = "baz";
			object.PUT();
			data = database.root()().read.GET();
		},
		check: function(verify) {
			verify(data,"root").foo().is("baz");
		}
	}));
});