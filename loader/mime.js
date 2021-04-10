//@ts-check
(
	/**
	 *
	 * @param { slime.$api.Global } $api
	 * @param { (value: slime.runtime.internal.mime ) => void } $export
	 */
	function($api,$export) {
		/**
		 *
		 * @param { string } string
		 */
		var mimeTypeIs = function(string) {
			/**
			 *
			 * @param { slime.mime.Type } type
			 */
			function rv(type) {
				return string == type.media + "/" + type.subtype;
			}
			return rv;
		};

		var is = mimeTypeIs;

		/**
		 *
		 * @param { slime.mime.Type } mimeType
		 */
		var toDeclaration = function(mimeType) {
			var rv = mimeType.media + "/" + mimeType.subtype;
			for (var x in mimeType.parameters) {
				rv += "; " + x + "=\"" + mimeType.parameters[x] + "\"";
			}
			return rv;
		};

		var Type = Object.assign(
			/**
			 * @param {string} media
			 * @param {string} subtype
			 * @param { { [x: string]: string } } parameters
			 */
			function(media,subtype,parameters) {
				$api.Function.argument.isString({ index: 0, name: "media" }).apply(this,arguments);
				$api.Function.argument.isString({ index: 1, name: "subtype" }).apply(this,arguments);
				(function() {
					if (typeof(arguments[2]) != "object" && typeof(arguments[2]) != "undefined") {
						throw new TypeError("arguments[2] (parameters) must be undefined or object");
					}
				}).apply(this,arguments);

				/**
				 * @type { slime.mime.Object }
				 */
				var rv = {
					media: void(0),
					subtype: void(0),
					parameters: void(0),
					is: void(0)
				};

				/** @property { string } media  */
				Object.defineProperty(rv, "media", {
					enumerable: true,
					value: media
				});

				Object.defineProperty(rv, "subtype", {
					enumerable: true,
					value: subtype
				});

				Object.defineProperty(rv, "parameters", {
					enumerable: true,
					value: (parameters) ? parameters : {}
				});

				Object.defineProperty(rv, "toString", {
					value: function() {
						return toDeclaration(this);
					}
				});

				rv.is = $api.deprecate(function(string) {
					return is(string)(this);
				});

				return rv;
			},
			{
				parse: function(string) {
					if (string === null) return null;
					//	First parse RFC 822 header; see RFC 822 section 3.2 http://tools.ietf.org/html/rfc822#section-3.2
					var collapser = /^(.*)(?:\r\n| |\t){2,}(.*)/;
					while(collapser.test(string)) {
						var match = collapser.exec(string);
						string = match[1] + " " + match[2];
					}
					var slash = string.indexOf("/");
					var media = string.substring(0,slash);
					string = string.substring(slash+1);
					var semicolon = string.indexOf(";");
					var subtype;
					var parameters;
					if (semicolon == -1) {
						subtype = string;
						string = "";
						parameters = {};
					} else {
						subtype = string.substring(0,semicolon);
						string = string.substring(semicolon);
						parameters = {};
						var more = true;
						while(more) {
							//	First, get rid of the semicolon
							if (string.substring(0,1) != ";") {
								throw new Error();
							} else {
								string = string.substring(1);
							}
							//	Then, get rid of whitespace
							var wsmatcher = /^\s+(.*)/;
							if (wsmatcher.test(string)) {
								string = wsmatcher.exec(string)[1];
							}
							var nvmatch = /(.*?)\=(.*)/.exec(string);
							var name = nvmatch[1];
							var rest = nvmatch[2];
							var value = "";
							if (rest.substring(0,1) == "\"") {
								rest = rest.substring(1);
								while(rest.substring(0,1) != "\"") {
									value += rest.substring(0,1);
									rest = rest.substring(1);
								}
								string = rest.substring(1);
							} else {
								while(rest.length > 0 && rest.substring(0,1) != ";") {
									value += rest.substring(0,1);
									rest = rest.substring(1);
								}
								string = rest;
							}
							parameters[name] = value;
							more = (string.length > 0);
						}
						var codes = [];
						for (var i=0; i<string.length; i++) {
							codes.push(string.charCodeAt(i));
						}
						//	loop
					}
					var rv = Type(media,subtype,parameters);
					return rv;
				},
				fromName: function(path) {
					if (/\.js$/.test(path)) return Type.parse("application/javascript");
					if (/\.css$/.test(path)) return Type.parse("text/css");
					if (/\.ts$/.test(path)) return Type.parse("application/x.typescript");
					if (/\.csv$/.test(path)) return Type.parse("text/csv");
					if (/\.coffee$/.test(path)) return Type.parse("application/vnd.coffeescript");
				},
				toDeclaration: toDeclaration
			}
		);

		$export({
			Type: Type,
			mimeTypeIs: mimeTypeIs
		});
	}
//@ts-ignore
)($api,$export);
