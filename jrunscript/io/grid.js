//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

//@ts-check
(
	/**
	 *
	 * @param { slime.jrunscript.Packages } Packages
	 * @param { slime.$api.Global } $api
	 * @param { slime.jrunscript.io.internal.grid.Context } $context
	 * @param { slime.loader.Export<slime.jrunscript.io.grid.Exports> } $export
	 */
	function(Packages,$api,$context,$export) {
		var $exports = {
			/** @type { slime.jrunscript.io.grid.excel.Exports } */
			excel: void(0)
		};

		if ($context.getClass("org.apache.poi.hssf.usermodel.HSSFWorkbook")) {
			$exports.excel = new function() {
				/** @type { slime.jrunscript.io.grid.excel.Exports["toJavascriptDate"] } */
				this.toJavascriptDate = function(num) {
					var _calendar = Packages.org.apache.poi.ss.usermodel.DateUtil.getJavaCalendar(num);
					var _date = _calendar.getTime();
					return new Date(_date.getTime());
				}

				var Cell = function(_cell) {
					var getCellType = function(_cell) {
						return String(_cell.getCellTypeEnum().toString());
					}

					this.toString = function() {
						return String(_cell);
					}

					var getStringValue = function() {
						var _string = _cell.getStringCellValue();
						if (_string === null) return null;
						return String(_string);
					};

					var getNumericValue = function() {
						return _cell.getNumericCellValue();
					}

					this.getStringValue = $api.deprecate(getStringValue);

					this.getValue = function() {
						var type = getCellType(_cell);
						if (type == "STRING") {
							return getStringValue();
						} else if (type == "NUMERIC") {
							return getNumericValue();
						} else {
							throw new Error("Type: " + type);
						}
					}
				};

				var Row = function(_row) {
					this.toString = function() {
						return "(Row)";
					};

					this.getCells = function() {
						var rv = [];
						for (var i=0; i<_row.getLastCellNum(); i++) {
							var _cell = _row.getCell(i);
							rv.push( (_cell) ? new Cell(_cell) : null );
						}
						return rv;
					}
				};

				/** @type { (_sheet: any) => slime.jrunscript.io.grid.excel.Sheet } */
				var Sheet = function(_sheet) {
					var rv = {
						toString: function() {
							return "name = " + _sheet.getSheetName() + " _sheet = " + _sheet;
						},
						name: void(0),
						getRows: function() {
							var rv = [];
							for (var i=0; i<=_sheet.getLastRowNum(); i++) {
								var _row = _sheet.getRow(i);
								rv.push( (_row) ? new Row(_row) : null );
							}
							return rv;
						}
					};
					Object.defineProperty(rv, "name", {
						get: function() {
							return String(_sheet.getSheetName());
						},
						enumerable: true
					});
					return rv;
				}

				var Workbook = function(_workbook) {
					return {
						toString: function() {
							return "_workbook = " + _workbook;
						},
						sheets: (
							function() {
								var rv = {
									count: void(0),
									list: function() {
										var rv = [];
										for (var i=0; i<this.count; i++) {
											rv[i] = Sheet(_workbook.getSheetAt(i));
										}
										return rv;
									}
								};
								Object.defineProperty(rv, "count", {
									get: function() {
										return _workbook.getNumberOfSheets();
									},
									enumerable: true
								});
								return rv;
							}
						)()
					}
				};

				var format = {};

				/** @type { slime.jrunscript.io.grid.excel.Format } */
				format.xls = function(p) {
					return new Packages.org.apache.poi.hssf.usermodel.HSSFWorkbook(
						p.resource.read($context.Streams.binary).java.adapt()
					);
				}

				/** @type { slime.jrunscript.io.grid.excel.Format } */
				format.xlsx = function(p) {
					return new Packages.org.apache.poi.xssf.usermodel.XSSFWorkbook(p.resource.read($context.Streams.binary).java.adapt());
				};

				this.format = format;

				/**
				 * @type { slime.jrunscript.io.grid.excel.Exports["Workbook"] }
				 */
				var WorkbookConstructor = function(p) {
					if (!p.format) {
						if (/\.xls$/.test(p.resource.name)) {
							p.format = format.xls;
						} else if (/\.xlsx$/.test(p.resource.name)) {
							p.format = format.xlsx;
						}
					}
					return Workbook(p.format(p));
				}

				this.Workbook = WorkbookConstructor;
			}
		}

		$export($exports);
	}
//@ts-ignore
)(Packages,$api,$context,$export);
