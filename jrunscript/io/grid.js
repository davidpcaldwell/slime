if ($context.getClass("org.apache.poi.hssf.usermodel.HSSFWorkbook")) {
	$exports.excel = new function() {
		var Cell = function(_cell) {
			this.toString = function() {
				return String(_cell);
			}

			this.getStringValue = function() {
				var _string = _cell.getStringCellValue();
				if (_string === null) return null;
				return String(_string);
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

		var Sheet = function(_sheet) {
			this.toString = function() {
				return "name = " + _sheet.getSheetName() + " _sheet = " + _sheet;
			};

			Object.defineProperty(this, "name", {
				get: function() {
					return String(_sheet.getSheetName());
				},
				enumerable: true
			});

			this.getRows = function() {
				var rv = [];
				for (var i=0; i<_sheet.getLastRowNum(); i++) {
					var _row = _sheet.getRow(i);
					rv.push( (_row) ? new Row(_row) : null );
				}
				return rv;
			}
		}

		var Workbook = function(_workbook) {
			this.toString = function() {
				return "_workbook = " + _workbook;
			};

			this.sheets = {};

			Object.defineProperty(this.sheets, "count", {
				get: function() {
					return _workbook.getNumberOfSheets();
				},
				enumerable: true
			});

			this.sheets.list = function() {
				var rv = [];
				for (var i=0; i<this.count; i++) {
					rv[i] = new Sheet(_workbook.getSheetAt(i));
				}
				return rv;
			}
		}

		var format = {};

		format.xls = function(p) {
			return new Packages.org.apache.poi.hssf.usermodel.HSSFWorkbook(
				p.resource.read($context.Streams.binary).java.adapt()
			);
		}

		format.xlsx = function(p) {
			return new Packages.org.apache.poi.xssf.usermodel.XSSFWorkbook(p.resource.read($context.Streams.binary).java.adapt());
		};

		this.format = format;

		this.Workbook = function(p) {
			if (!p.format) {
				if (/\.xls$/.test(p.resource.name)) {
					p.format = format.xls;
				} else if (/\.xlsx$/.test(p.resource.name)) {
					p.format = format.xlsx;
				}
			}
			return new Workbook(p.format(p));
		}
	}
}
