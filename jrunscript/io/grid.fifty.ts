//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

namespace slime.jrunscript.native.org.apache.poi {
	export interface POIDocument {
	}
}

namespace slime.jrunscript.io.grid.excel {
	export interface Context {
		getClass: slime.jrunscript.host.Exports["getClass"]
		Streams: slime.jrunscript.io.Exports["Streams"]
	}

	export type Format = (p: { resource: slime.Resource }) => slime.jrunscript.native.org.apache.poi.POIDocument

	interface Cell {
		getValue(): string | number
		/** @deprecated */
		getStringValue: () => string
	}

	interface Row {
		getCells: () => Cell[]
	}

	export interface Sheet {
		name: string
		getRows: () => Row[]
	}

	export interface Workbook {
		sheets: {
			count: number,
			list: () => Sheet[]
		}
	}

	export interface Exports {
		format: {
			xls: Format
			xlsx: Format
		}
		Workbook: {
			(p: { resource: slime.Resource, format?: Format }): Workbook
		}
		toJavascriptDate: (num: number) => Date
	}

	(
		function(
			fifty: slime.fifty.test.Kit
		) {
			const { verify } = fifty;
			const { jsh } = fifty.global;

			const subject = (
				function() {
					var script: Script = fifty.$loader.script("grid.js");
					return script({
						getClass: function(name) {
							return jsh.java.getClass(name);
						},
						Streams: jsh.unit.$slime.io.Streams
					});
				}
			)();

			var module = { excel: subject };

			function testSpreadsheet(module, workbook: Workbook) {
				verify(workbook).sheets.is.type("object");

				verify(workbook).sheets.count.is(1);
				var sheet = workbook.sheets.list()[0];
				verify(sheet).getRows().length.is(2);
				var first = sheet.getRows()[0];
				verify(first).getCells()[0].getStringValue().is("First Name");
				var second = sheet.getRows()[1];
				verify(second).getCells().length.is(4);
				verify(second).getCells()[0].getValue().is.type("string");
				verify(second).getCells()[0].getValue().evaluate(String).is("Lin-Manuel");
				verify(second).getCells()[1].getValue().is.type("string");
				verify(second).getCells()[1].getValue().evaluate(String).is("Miranda");
				verify(second).getCells()[2].getValue().is.type("number");
				verify(second).getCells()[2].getValue().evaluate(Number).is(40);
				var dob = second.getCells()[3].getValue();
				var date = module.excel.toJavascriptDate(dob);
				var time = new jsh.time.When({ unix: date.getTime() }).local();
				var day = time.day;
				verify(day).format("yyyy Mmm dd").is("1980 Jan 16");
			}

			fifty.tests.suite = function() {
				if (module.excel) {
					verify(module).excel.evaluate.property("Workbook").is.type("function");
					verify(module).excel.evaluate.property("format").is.type("object");

					var getFile = function(name) {
						var location = fifty.jsh.file.relative("test/grid");
						var loader = new jsh.file.Loader({
							directory: jsh.file.Pathname(location.pathname).directory
						});
						return loader.get(name);
					};

					(function() {
						//	Test data created:
						//	1.xlsx is slime-1 document in OneDrive
						//	1.xls created via https://www.zamzar.com/convert/xlsx-to-xls/
						var workbook: Workbook = module.excel.Workbook({ resource: getFile("1.xlsx") });
						testSpreadsheet(module, workbook);

						var old: Workbook = module.excel.Workbook({ resource: getFile("1.xls") });
						testSpreadsheet(module, old);
					})();
				} else {
					verify("POI not installed").is("POI not installed");
				}
			}
		}
	//@ts-ignore
	)(fifty);

	export type Script = slime.loader.Script<Context,Exports>
}
