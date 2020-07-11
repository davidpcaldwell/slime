namespace slime.jrunscript.io.grid.excel {
	type Format = (p: { resource: slime.Resource }) => Packages.org.apache.poi.POIDocument

	interface Workbook {
	}

	interface Exports {
		format: {
			xls: Format
			xlsx: Format
		}
		Workbook: {
			(p: { resource: slime.Resource , format?: Format }): Workbook
			new (p: { resource: slime.Resource, format?: Format }): Workbook
		}
	}

	tests.suite = function() {
		var module = $loader.file("grid.js", {
			Streams: $context.Streams,
			getClass: function(name) {
				return $context.api.java.getClass(name);
			}
		});
		if (module.excel) {
			verify(module).excel.evaluate.property("Workbook").is.type("function");
			verify(module).excel.evaluate.property("format").is.type("object");

			var getFile = function(name) {
				return $loader.getRelativePath("test/grid/" + name).file;
			};

			(function() {
				var workbook = new module.excel.Workbook({ resource: getFile("1.xlsx") });
				verify(workbook).is.type("object");
				verify(workbook).sheets.is.type("object");
				jsh.shell.console(workbook.sheets.count);
				verify(workbook).sheets.count.is(1);
			})();
		} else {
			verify("POI not installed").is("POI not installed");
		}
	}
}