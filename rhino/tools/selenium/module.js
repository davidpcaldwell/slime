//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//
//	The Original Code is the SLIME JDK interface.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2014 the Initial Developer. All Rights Reserved.
//
//	Contributor(s):
//	END LICENSE

var _selenium = Packages.org.openqa.selenium;
var _ui = Packages.org.openqa.selenium.support.ui;

var getExceptionClassName = function(e) {
	if (e.javaException) {
		return String(e.javaException.getClass().getName());
	} else if (e.getClass) {
		return e.getClass().getName();
	}
}

var SearchContext = function(_driver,_parent) {
	var target;
	if (!_parent) {
		_parent = _driver;
		target = this;
	} else {
		target = this;
	}
	var Wait = function(p) {
		var _peer = new _ui.WebDriverWait(_driver, p.timeout);

		this.until = function(f) {
			var _condition = new JavaAdapter(
				_ui.ExpectedCondition,
				new function() {
					this.apply = function(_driver) {
						var rv = f.call(target);
						return Packages.java.lang.Boolean.valueOf(Boolean(rv));
					};

					this.toString = function() {
						return f.toString();
					}
				}
			);
			_peer.until(_condition);
		}
	};

	var byAdapt = function(p) {
		if (p.name) {
			return Packages.org.openqa.selenium.By.name(p.name);
		} else if (p.id) {
			return Packages.org.openqa.selenium.By.id(p.id);
		} else if (p.class) {
			return Packages.org.openqa.selenium.By.className(p.class);
		} else if (p.linkText) {
			return Packages.org.openqa.selenium.By.linkText(p.linkText);
		} else if (p.selector) {
			return Packages.org.openqa.selenium.By.cssSelector(p.selector);
		} else {
			//	TODO	JavaScript filter that uses selector * and then passes all to filter?
			throw new TypeError();
		}
	};

	var findElement = function(_by) {
		try {
			return _parent.findElement(_by);
		} catch (e) {
			if (getExceptionClassName(e) == "org.openqa.selenium.NoSuchElementException") {
				return null;
			} else {
				jsh.shell.echo("Another exception: " + e);
				jsh.shell.echo("Another exception: " + Object.keys(e));
				jsh.shell.echo("Another exception: " + getExceptionClassName(e));
			}
			throw e;
		}
	}

	this.findElement = function(p) {
		var _by = byAdapt(p);
		if (p.wait) {
			var wait = new Wait(p.wait);
			wait.until(function() {
				try {
					if (p.wait.log) {
						p.wait.log("Checking in " + _parent + " for element " + JSON.stringify(p));
					}
					var rv = findElement(_by);
					if (p.wait.log) {
						p.wait.log("Returning element " + rv);
					}
					if (rv && p.condition) {
						var result = p.condition.call(new WebElement(_driver, rv));
						if (!result) rv = null;
					}
					return rv;
				} catch (e) {
					if (p.wait.log) {
						p.wait.log("Exception in findElement on target " + this + " for element " + JSON.stringify(p) + ": " + getExceptionClassName(e));
					}
					throw e;
				}
			});
		}
		if (p.wait && p.wait.log) {
			p.wait.log("Wait is over.");
		}
		var _element = findElement(_by);
		if (p.wait && p.wait.log) p.wait.log("_element = " + _element);
		if (!_element) return null;
		return new WebElement(_driver, _element);
	};

	this.findElements = function(p) {
		if (p.wait) {
			//	TODO	this should be thought through
			var wait = new Wait(p.wait);
			wait.until(function() {
				try {
					var arg = {};
					for (var x in p) {
						if (x != "wait") arg[x] = p[x];
					}
					return this.findElements(arg).length;
				} catch (e) {
					//	TODO	encapsulate the below into Rhino/Nashorn differential
					if (e.javaException && String(e.javaException.getClass().getName()) == "org.openqa.selenium.NoSuchElementException") {
						return false;
					} else if (e.getClass && e.getClass().getName() == "org.openqa.selenium.NoSuchElementException") {
						return false;
					}
					throw e;
				}
			});
		}
		var _by = byAdapt(p);
		var _elements = _driver.findElements(_by);
		var rv = [];
		for (var i=0; i<_elements.size(); i++) {
			rv.push(new WebElement(_driver, _elements.get(i)));
		}
		return rv;
	};

	this.Wait = Wait;
}

var WebElement = function(_driver,_peer) {
	if (!_peer) throw new TypeError("_peer is required");

	this.toString = function() {
		return "WebElement: " + String(_peer.toString());
	}

	this.sendKeys = function(string) {
		_peer.sendKeys(string);
	};

	this.click = function() {
		try {
			_peer.click();
		} catch (e) {
			if (getExceptionClassName(e) == "org.openqa.selenium.StaleElementReferenceException") {
				throw new Error("Element is stale: " + _peer.toString());
			}
			throw e;
		}
	};

	var text = String(_peer.getText());

	Object.defineProperty(this, "text", {
		get: function() {
			try {
				return text;
			} catch (e) {
				if (getExceptionClassName(e) == "org.openqa.selenium.StaleElementReferenceException") {
					throw new Error("Element is stale: " + _peer.toString());
				}
				throw e;
			}
		}
	});

	this.isVisible = function() {
		return _peer.isDisplayed();
	}

	this.javascript = function(f) {
		var script = ""
			+	"var target = arguments[0];\n"
			+	"var args = Array.prototype.slice.call(arguments,1);\n"
			+	"(\n"
			+	f.toString()
			+	").apply(target,args)"
		;
		_driver.executeScript(
			script,
			_peer
		);
	};

	SearchContext.call(this,_driver,_peer);

	this.wait = {};
	this.wait.untilVisible = (function(Wait) {
		return function(p) {
			new Wait(p).until(function() {
				jsh.shell.echo("Checking visibility for " + this + " text=" + this.text);
				return this.isVisible();
			});
		};
	})(this.Wait);
//	this.wait.untilVisible = function(p) {
//		new Wait(p).until(function() {
//			return this.isVisible();
//		});
//	}
}

var WebDriver = function(_driver) {
	this.toString = function() {
		return "WebDriver: " + _driver;
	}

	this.javascript = function(f) {
		//	TODO	support mapping argument types
		//	TODO	support mapping return type
		_driver.executeScript("(" + f.toString() + ")()");
	}

	this.get = function(url) {
		_driver.get(url);
	};

	this.close = function() {
		_driver.close();
	}

	SearchContext.call(this,_driver);
}

$exports.Firefox = function() {
	var _driver = new Packages.org.openqa.selenium.firefox.FirefoxDriver();
	WebDriver.call(this,_driver);
};