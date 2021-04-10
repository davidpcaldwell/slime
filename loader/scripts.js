//@ts-check
(
	/**
	 *
	 * @param { slime.$api.Global } $api
	 * @param { any } mime
	 * @param { any } mimeTypeIs
	 * @param { any } $slime
	 * @param { any } $platform
	 * @param { any } $$platform
	 * @param { any } createFileScope
	 * @param { any } $export
	 */
	function($api,mime,mimeTypeIs,$slime,$platform,$$platform,createFileScope,$export) {
		/** @type { slime.runtime.$slime.CoffeeScript } */
		var $coffee = (function() {
			//	TODO	rename to getCoffeescript to make consistent with camel case.
			if (!$slime.getCoffeeScript) return null;
			var coffeeScript = $slime.getCoffeeScript();
			if (!coffeeScript) return null;
			if (coffeeScript.code) {
				var target = {};
				$$platform.execute({ name: "coffee-script.js", js: String(coffeeScript.code) }, {}, target);
				return target.CoffeeScript;
			} else if (coffeeScript.object) {
				return coffeeScript.object;
			}
		})();

		var methods = {};

		/**
		 * @param { slime.Resource } object
		 * @param { any } scope
		 */
		methods.run = function run(object,scope) {
			if (!object || typeof(object) != "object") {
				throw new TypeError("'object' must be an object, not " + object);
			}
			if (typeof(object.read) != "function") throw new Error("Not resource.");
			/** @type { slime.Resource & { js: { name: string, code: string } } } */
			var resource = Object.assign(object, { js: void(0) });
			var type = (resource.type) ? mime.Type(resource.type.media, resource.type.subtype, resource.type.parameters) : mime.Type.parse("application/javascript");
			var string = (function() {
				if (resource.read) {
					var rv = resource.read(String);
					if (typeof(rv) == "string") return rv;
				}
			})();
			if (typeof(string) != "string") {
				throw new TypeError("Resource: " + resource.name + " is not convertible to string, so cannot be executed.");
			}

			var typeIs = function(string) {
				return type && mimeTypeIs(string)(type);
			}

			if ($slime.typescript && typeIs("application/x.typescript")) {
				resource.js = {
					name: resource.name,
					code: $slime.typescript.compile(string)
				};
			} else if (typeIs("application/vnd.coffeescript")) {
				resource.js = {
					name: resource.name,
					code: $coffee.compile(string)
				};
			} else if (typeIs("application/javascript") || typeIs("application/x-javascript")) {
				resource.js = {
					name: resource.name,
					code: string
				}
			}
			if (!resource.js) {
				throw new TypeError("Resource " + resource.name + " is not JavaScript; type = " + type);
			}
			var target = this;
			var global = (function() { return this; })();
			//	TODO	why is this present?
			if (scope === global) {
				scope = {};
			}
			if (scope === void(0)) {
				scope = {};
			}
			scope.$platform = $platform;
			scope.$api = $api;
			$$platform.execute(
				{
					name: resource.js.name,
					js: resource.js.code
				},
				scope,
				target
			);
		}

		/**
		 * @param { slime.Resource & { js: { name: string, js: string } } } code
		 * @param { any } $context
		 */
		methods.file = function(code,$context) {
			var inner = createFileScope($context);
			methods.run.call(this,code,inner);
			return inner.$exports;
		};

		/**
		 * @param { slime.Resource & { js: { name: string, js: string } } } code
		 * @param { any } scope
		 */
		methods.value = function value(code,scope) {
			var rv;
			if (!scope) scope = {};
			scope.$set = function(v) {
				rv = v;
			};
			methods.run.call(this,code,scope);
			return rv;
		}

		$export(methods);
	}
//@ts-ignore
)($api,mime,mimeTypeIs,$slime,$platform,$$platform,createFileScope,$export);
