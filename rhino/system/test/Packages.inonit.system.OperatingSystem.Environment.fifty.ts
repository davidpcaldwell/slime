(
	function(
		Packages: any,
		JavaAdapter: any,
		fifty: slime.fifty.test.kit
	) {
		fifty.tests.suite = function() {
			var toMap = function(values) {
				return $api.Function.result(
					values,
					$api.Function.Object.entries,
					function(entries) {
						return entries.reduce(function(rv,entry) {
							rv.put(entry[0],entry[1]);
							return rv;
						}, new Packages.java.util.HashMap())
					}
				)
			};

			var CaseSensitive = function(values) {
				var map = toMap(values);
				return {
					getMap: function() {
						return map;
					},
					getValue: function(name) {
						return (values[name]) ? values.name : null;
					}
				}
			};

			var CaseInsensitive = function(values) {
				var map = toMap(values);
				return {
					getMap: function() {
						return map;
					},
					getValue: function(name) {
						for (var x in values) {
							if (x.toUpperCase() == name.toUpperCase()) return values[x];
						}
						return null;
					}
				}
			};

			var detectedAsCaseSensitive = function(environment): { booleanValue(): boolean } {
				return jsh.java.invoke({
					method: {
						class: Packages.inonit.system.OperatingSystem.Environment,
						name: "detectedAsCaseSensitive",
						parameterTypes: [ Packages.inonit.system.OperatingSystem.Environment ]
					},
					arguments: [
						new JavaAdapter(
							Packages.inonit.system.OperatingSystem.Environment,
							environment
						)
					]
				});
			};

			fifty.verify(detectedAsCaseSensitive(CaseSensitive({ foo: "bar" }))).booleanValue().is(true);
			fifty.verify(detectedAsCaseSensitive(CaseSensitive({ foo: "bar", FOO: "BAR" }))).is(null);
			fifty.verify(detectedAsCaseSensitive(CaseInsensitive({ foo: "bar" }))).booleanValue().is(false);
			fifty.verify(detectedAsCaseSensitive(CaseSensitive({ FOO: "BAR" }))).is(null);

			var create = function(p) {
				return jsh.java.invoke({
					method: {
						class: Packages.inonit.system.OperatingSystem.Environment,
						name: "create",
						parameterTypes: [
							Packages.java.util.Map,
							Packages.java.lang.Boolean.TYPE
						]
					},
					arguments: [
						toMap(p.values),
						p.caseSensitive
					]
				})
			};

			var toJsString = function(v) {
				return (v === null) ? null : String(v);
			}

			var caseSensitive = create({
				values: { foo: "bar" },
				caseSensitive: true
			});

			fifty.verify( toJsString(caseSensitive.getValue("foo")) ).is("bar");
			fifty.verify( toJsString(caseSensitive.getValue("FOO")) ).is(null);

			var caseInsensitive = create({
				values: { foo: "bar" },
				caseSensitive: false
			});

			fifty.verify( toJsString(caseInsensitive.getValue("foo")) ).is("bar");
			fifty.verify( toJsString(caseInsensitive.getValue("FOO")) ).is("bar");
		}
	}
//@ts-ignore
)(Packages,JavaAdapter,fifty);
