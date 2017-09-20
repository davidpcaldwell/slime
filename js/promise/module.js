var SlimePromise = function Wrap(p) {		
	var delegate = (p.delegate) ? p.delegate : void(0);

	var wrap = function(v) {
		if (typeof(v) == "object" && v instanceof $context.Promise) {
			return new Wrap({ delegate: v, target: p.target });
		}
		return v;
	};

	var getDelegate = function() {
		if (!delegate) delegate = new $context.Promise(p.promise);
		return delegate;
	}

	this.toString = function() {
		return p.toString();
	}

	this.target = function(target) {
		p.target = target;
	}

	this.then = function(resolved,rejected) {
		var asynchrony = $context.asynchrony();
		if (asynchrony) asynchrony.started(this);
		var end = (function() {
			if (asynchrony) asynchrony.finished(this);
		}).bind(this);
		var args = [];
		args.push(function() {
			var rv = resolved.apply(p.target,arguments);
			end();
			return rv;
		});
		if (rejected) args.push(function() {
			var rv = rejected.apply(p.target,arguments);
			end();
			return rv;
		});
		var delegate = getDelegate();
		var toWrap = delegate.then.apply(delegate,args);
		return wrap(toWrap);
	};

	this.catch = function(rejected) {
		return getDelegate().catch(function() {
			var rv = rejected.apply(p.target,arguments);
			end();
			return rv;
		});
	};
};

$exports.Promise = SlimePromise;
