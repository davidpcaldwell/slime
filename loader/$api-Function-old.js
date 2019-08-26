$exports.Function = $context.deprecate(function() {
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
});

$exports.Function.preprocessing = $context.deprecate(function(f,preprocessor) {
    return function() {
        var overrides = preprocessor.apply(this,arguments);
        if (overrides && overrides.return) return overrides.return;
        var target = this;
        var args = arguments;
        if (overrides && overrides.target) target = overrides.target;
        if (overrides && overrides.arguments) args = overrides.arguments;
        return f.apply(target,args);
    }
});

$exports.Function.postprocessing = $context.deprecate(function(f,postprocessor) {
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
});

$exports.Function.value = {
    UNDEFINED: {
        toString: function() {
            return "Function.UNDEFINED";
        }
    }
};
$context.deprecate($exports.Function, "value");

$exports.Function.postprocessing.UNDEFINED = $exports.Function.value.UNDEFINED;
$context.deprecate($exports.Function.postprocessing, "UNDEFINED");

$exports.Function.mutating = $context.deprecate(function(v) {
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
});

$exports.Function.Basic = $context.deprecate(function(f) {
    return function() {
        try {
            this.setReturn(f.apply(this.target,this.arguments));
        } catch (e) {
            this.setThrow(e);
        }
    };
});

$exports.Function.Revise = $context.deprecate(function(f) {
    return function() {
        this.setReturn(f.call({
            target: this.target,
            arguments: this.arguments,
            throwing: this.result.throwing,
            returning: this.result.returning
        },this.result.returning));
    };
});

$exports.Function.Prepare = $context.deprecate(function(f) {
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
});

$exports.Function.singleton = $context.deprecate(function(f) {
    var memo;

    return function() {
        if (!memo) {
            memo = {
                result: f()
            }
        }
        return memo.result;
    };
});

$exports.Function.set = $context.deprecate(function(o) {
    return function() {
        for (var x in o) {
            this[x] = o[x];
        }
    };
});
