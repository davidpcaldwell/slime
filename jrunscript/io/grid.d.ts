namespace slime.jrunscript.io.grid.excel {
	type Format = (p: { resource: slime.Resource }) => Packages.org.apache.poi.POIDocument

	interface Cell {
		getValue(): string | number
		/** @deprecated */
		getStringValue: () => string
	}

	interface Row {
		getCells: () => Cell[]
	}

	interface Sheet {
		name: string
		getRows: () => Row[]
	}

	interface Workbook {
		sheets: {
			count: number,
			list: () => Sheet[]
		}
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
		toJavascriptDate: (num: number) => Date
	}

	function testSpreadsheet(module, workbook: Workbook) {
		verify(workbook).sheets.is.type("object");

		verify(workbook).sheets.count.is(1);
		var sheet = workbook.sheets.list()[0];
		verify(sheet).getRows().length.is(2);
		var first = sheet.getRows()[0];
		verify(first).getCells()[0].getStringValue().is("First Name");
		var second = sheet.getRows()[1];
		verify(second).getCells().length.is(4);
		verify(second).getCells()[0].getValue().is("Lin-Manuel");
		verify(second).getCells()[1].getValue().is("Miranda");
		verify(second).getCells()[2].getValue().is(40);
		var dob = second.getCells()[3].getValue();
		var date = module.excel.toJavascriptDate(dob);
		var time = jsh.time.When(date).local();
		var day = time.day;
		verify(day).format("yyyy Mmm dd").is("1980 Jan 16");
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
				//	Test data created:
				//	1.xlsx is slime-1 document in OneDrive
				//	1.xls created via https://www.zamzar.com/convert/xlsx-to-xls/
				var workbook: Workbook = new module.excel.Workbook({ resource: getFile("1.xlsx") });
				testSpreadsheet(module, workbook);

				var old: Workbook = new module.excel.Workbook({ resource: getFile("1.xls") });
				testSpreadsheet(module, old);
			})();
		} else {
			verify("POI not installed").is("POI not installed");
		}
	}
}