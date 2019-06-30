//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the js/promise SLIME module.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2018 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var SlimePromise = function Targeter(p) {
	if (!p) p = {};

	if (typeof(p) == "function") {
		p = { executor: p };
	}

	var executor = (function(p) {
		if (p.executor) return p.executor;
		if (p.promise) return $api.deprecate(function() {
			return p.promise;
		})();
	})(p);

	var delegate = (p.delegate) ? p.delegate : void(0);

	if (!delegate && !executor) throw new TypeError("Required: either 'delegate' promise or 'executor' function");

	var isPromise = (function() {
		//	TODO	this is a bit of a mess; the customization provided by browser/test/initialize.js means that it is not easy
		//			to keep track via instanceof of types. Would need to do some more serious investigation to clean that up
		//			(to make all promises instanceof $context.Promise), or maybe loosen rules to then-able?
		var global = (function() { return this; })();
		return function(v) {
			if (typeof(v) != "object" || v === null) return false;
			if (v instanceof $context.Promise) return true;
			if (v instanceof global.Promise) return true;
			return false;
		}
	})();

	var wrap = function(v) {
		if (isPromise(v)) {
			return new Targeter({ delegate: v, target: p.target });
		} else {
			var lineForBreakpoint = 1;
		}
		return v;
	};

	var getDelegate = function() {
		if (!delegate) delegate = new $context.Promise(executor);
		return delegate;
	}

	this.toString = function() {
		return p.toString();
	}

	this.target = function(target) {
		p.target = target;
	};

	this.bind = function(target) {
		return new Targeter({ delegate: getDelegate(), target: target });
	};

	this.then = function(resolved,rejected) {
		var args = [];
		if (arguments.length > 0) args.push(function() {
			return resolved.apply(p.target,arguments);
		});
		if (arguments.length > 1) args.push(function() {
			return rejected.apply(p.target,arguments);
		});
		var delegate = getDelegate();
		var toWrap = delegate.then.apply(delegate,args);
		return wrap(toWrap);
	};

	this.catch = function(rejected) {
		return getDelegate().catch(function() {
			return rejected.apply(p.target,arguments);
		});
	};
};

$exports.Promise = SlimePromise;

var Controllable = function(evaluator) {
	var resolveIt;
	var rejectIt;

	this.toString = function() {
		return "Controllable Promise: " + promise;
	};

	var promise = new $context.Promise(function(resolve,reject) {
		resolveIt = resolve;
		rejectIt = reject;
	});

	this.then = function() {
		return promise.then.apply(promise,arguments);
	}

	this.resolve = function(value) {
		if (arguments.length == 0 && evaluator) {
			value = evaluator();
		}
		window.console.log("Resolving " + this + " to " + value);
		resolveIt(value);
	}

	this.reject = function(error) {
		rejectIt(error);
	}
};

$exports.Controlled = Controllable;
