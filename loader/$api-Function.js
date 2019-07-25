$exports.Function = function() {
    var UNDEFINED = {};

    var Result = function() {
        this.resolve = function() {
            if (this.error) {
                throw this.throwing;
            } else {
                if (this.returning === UNDEFINED) return void(0);
                return this.returning;
            }
        };
    };

    var Situation = function() {
        var result = new Result();

        this.target = arguments[0];
        this.arguments = arguments[1];

        this.setReturn = function(v) {
            result.error = false;
            result.returning = v;
        };

        this.setThrow = function(v) {
            result.error = true;
            result.throwing = v;
        };

        this.result = result;

        this.resolve = function() {
            return result.resolve();
        };
    };

    var components = [];

    if (arguments.length != 1) {
        throw new TypeError("$api.Function expected 1 argument.");
    } else {
        components.push(new $exports.Function.Basic(arguments[0]));
    }

    var rv = function() {
        var situation = new Situation(this,Array.prototype.slice.call(arguments));
        components.forEach(function(component) {
            component.call(situation);
        });
        return situation.resolve();
    };

    rv.prepare = function() {
        for (var i=0; i<arguments.length; i++) {
            components.splice(i,0,new $exports.Function.Prepare(arguments[i]));
        }
        return this;
    }

    rv.revise = function() {
        for (var i=0; i<arguments.length; i++) {
            components.push(new $exports.Function.Revise(arguments[i]));
        }
        return this;
    }

    return rv;
};
$exports.Function.memoized = function(f) {
    var returns;
    var global = (function() { return this; });

    return function() {
        if (arguments.length > 0) throw new TypeError("Memoized functions may not have arguments.");
        //	Ignore 'this'
        if (!returns) {
            returns = { value: f() };
        }
        return returns.value;
    };
};
$exports.Function.value = {
    UNDEFINED: {
        toString: function() {
            return "Function.UNDEFINED";
        }
    }
};
$exports.Function.pipe = function() {
    var items = Array.prototype.slice.call(arguments);
    return function(v) {
        var rv = v;
        for (var i=0; i<items.length; i++) {
            rv = items[i].call(this,rv);
        }
        return rv;
    }
};
$exports.Function.preprocessing = function(f,preprocessor) {
    return function() {
        var overrides = preprocessor.apply(this,arguments);
        if (overrides && overrides.return) return overrides.return;
        var target = this;
        var args = arguments;
        if (overrides && overrides.target) target = overrides.target;
        if (overrides && overrides.arguments) args = overrides.arguments;
        return f.apply(target,args);
    }
};
$exports.Function.postprocessing = function(f,postprocessor) {
    //	TODO	may want to think through whether to give postprocessor the ability to handle exceptions
    var UNDEFINED = $exports.Function.value.UNDEFINED;
    var rv = function() {
        var returned = f.apply(this,arguments);
        var rv = postprocessor({
            target: this,
            arguments: Array.prototype.slice.call(arguments),
            returned: returned
        });
        if (typeof(rv) != "undefined") {
            returned = (rv == UNDEFINED) ? void(0) : rv;
        }
        return returned;
    };
    for (var x in f) {
        //  TODO    check to see what these properties are
        rv[x] = f[x];
    }
    //  TODO    consider altering rv.toString()
    return rv;
};
$exports.Function.postprocessing.UNDEFINED = $exports.Function.value.UNDEFINED;
$context.deprecate($exports.Function.postprocessing, "UNDEFINED");
$exports.Function.mutating = function(v) {
    var implementation;
    if (typeof(v) == "function") {
        var mutator = v;
        implementation = $exports.Function.postprocessing(mutator, function(result) {
            if (result.returned === $exports.Function.value.UNDEFINED) return result.returned;
            if (typeof(result.returned) == "undefined") return result.arguments[0];
        });
    } else if (typeof(v) == "object" && v) {
        implementation = function() {
            return v;
        };
    } else if (typeof(v) == "undefined") {
        implementation = function(v) { return v; };
    }
    return $exports.Function.preprocessing(
        implementation,
        function() {
            if (arguments.length != 1) throw new TypeError("mutating() must be invoked with one argument representing the value to mutate.");
        }
    )
};
$exports.Function.Basic = function(f) {
    return function() {
        try {
            this.setReturn(f.apply(this.target,this.arguments));
        } catch (e) {
            this.setThrow(e);
        }
    };
};
$exports.Function.Revise = function(f) {
    return function() {
        this.setReturn(f.call({
            target: this.target,
            arguments: this.arguments,
            throwing: this.result.throwing,
            returning: this.result.returning
        },this.result.returning));
    };
};
$exports.Function.Prepare = function(f) {
    return function() {
        var situation = this;
        f.apply({
            setThis: function(v) {
                situation.target = v;
            },
            setArguments: function(v) {
                situation.arguments = Array.prototype.slice.call(v);
            }
        },situation.arguments);
    }
};
$exports.Function.returning = function(v) {
    return function() {
        return v;
    };
};
$exports.Function.set = function(o) {
    return function() {
        for (var x in o) {
            this[x] = o[x];
        }
    };
};

$exports.Function.conditional = function(test,yes,no) {
    return function() {
        var condition = test.apply(this,arguments);
        return (condition) ? yes.apply(this,arguments) : no.apply(this,arguments);
    };
}

$exports.Function.argument = {};
$exports.Function.argument.check = function(p) {
    if (p.type) {
        var reference = (p.name) ? "arguments[" + p.index + "] (" + p.name + ")" : "arguments[" + p.index + "]";
        return function() {
            if (typeof(arguments[p.index]) == "undefined" && !p.undefined) throw new TypeError(reference + " must be a string, not undefined.");
            if (arguments[p.index] === null && !p["null"]) throw new TypeError(reference + " must be a string, not null.");
            if (typeof(arguments[p.index]) != p.type) throw new TypeError(reference + " must be type " + "\"" + p.type + "\"" + ", not " + typeof(arguments[p.index]));
        }
    }
};
$exports.Function.argument.isString = function(p) {
    var reference = (p.name) ? "arguments[" + p.index + "] (" + p.name + ")" : "arguments[" + p.index + "]";
    return function() {
        if (typeof(arguments[p.index]) == "undefined" && !p.undefined) throw new TypeError(reference + " must be a string, not undefined.");
        if (arguments[p.index] === null && !p["null"]) throw new TypeError(reference + " must be a string, not null.");
        if (typeof(arguments[p.index]) != "string") throw new TypeError(reference + " must be a string, not " + typeof(arguments[p.index]));
    };
};

$exports.Function.evaluator = function() {
    //	Provides an ordered cache implementation
    var components = arguments;
    return function() {
        var rv;
        var invocation = {
            target: this,
            arguments: Array.prototype.slice.call(arguments)
        };
        for (var i=0; i<components.length; i++) {
            if (typeof(components[i]) == "function") {
                rv = components[i].apply(this,arguments);
            } else if (typeof(components[i]) == "object") {
                rv = components[i].get(invocation);
            }
            if (typeof(rv) != "undefined") {
                for (var j=i; j>=0; j--) {
                    if (typeof(components[j]) == "object") {
                        components[j].set(invocation,rv);
                    }
                }
                return rv;
            }
        }
        return rv;
    };
};

$exports.Function.series = function() {
    var functions = arguments;
    return function() {
        for (var i=0; i<functions.length; i++) {
            var rv = functions[i].apply(this,arguments);
            if (typeof(rv) != "undefined") return rv;
        }
    };
};

$exports.Function.singleton = function(f) {
    var memo;

    return function() {
        if (!memo) {
            memo = {
                result: f()
            }
        }
        return memo.result;
    };
};

//	var UNDEFINED = {};
//
//	$exports.Function = function(p) {
//		var toArray = function(p) {
//			if (p && p.sort) {
//				return p;
//			} else if (p && p.call) {
//				return [p];
//			} else {
//				return [];
//			}
//		};
//
//		var runDecorators = function(declared,situation) {
//			var array = toArray(declared);
//			for (var i=0; i<array.length; i++) {
//				try {
//					var rv = array[i].call(situation);
//					if (typeof(rv) != "undefined") {
//						return { error: false, returning: rv };
//					}
//				} catch (e) {
//					return { error: true, throwing: e };
//				}
//			}
//		};
//
//		var resolve = function() {
//			if (this.error) {
//				throw this.throwing;
//			} else {
//				if (this.returning === UNDEFINED) return void(0);
//				return this.returning;
//			}
//		};
//
//		return function() {
//			var result = new function() {
//				this.resolve = resolve;
//			};
//
//			var situation = new (function() {
//				this.target = arguments[0];
//				this.arguments = arguments[1];
//
//				this.setReturn = function(v) {
//					result.error = false;
//					result.returning = v;
//				};
//
//				this.setThrow = function(v) {
//					result.error = true;
//					result.throwing = v;
//				};
//			})(this,Array.prototype.slice.call(arguments));
//
//			var decoratorResult = runDecorators(p.before,situation);
//			if (decoratorResult) return resolve.call(decoratorResult);
//			try {
//				situation.setReturn(p.call.apply(situation.target,situation.arguments));
//			} catch (e) {
//				situation.setThrow(e);
//			}
//			decoratorResult = runDecorators(p.after,situation);
//			if (decoratorResult) return resolve.call(decoratorResult);
//			return result.resolve();
//		};
//	};
//	$exports.Function.UNDEFINED = function() {
//		return UNDEFINED;
//	};
//	$exports.Function.argument = {};
//	$exports.Function.argument.isString = function(p) {
//		var reference = (p.name) ? "arguments[" + p.index + "] (" + p.name + ")" : "arguments[" + p.index + "]";
//		return function() {
//			if (typeof(this.arguments[p.index]) == "undefined" && !p.undefined) throw new TypeError(reference + " must be a string, not undefined.");
//			if (this.arguments[p.index] === null && !p["null"]) throw new TypeError(reference + " must be a string, not null.");
//			if (typeof(this.arguments[p.index]) != "string") throw new TypeError(reference + " must be a string, not " + typeof(this.arguments[p.index]));
//		};
//	};
