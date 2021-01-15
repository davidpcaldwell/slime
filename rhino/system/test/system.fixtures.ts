(
	function(Packages: Packages, jsh: jsh, $export: (value: Packages.inonit.system.test.Fixtures) => void) {
		$export({
			OperatingSystem: {
				Environment: {
					create: function(p: { values: object, caseSensitive: boolean }): Packages.inonit.system.OperatingSystem.Environment {
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
								jsh.java.Map({ object: p.values }),
								p.caseSensitive
							]
						})
					}
				}
			}
		});
	}
//@ts-ignore
)(Packages, jsh, $export);
