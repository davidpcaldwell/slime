if ($context.getClass("org.apache.poi.hssf.usermodel.HSSFWorkbook")) {
	$exports.excel = new function() {
		var Workbook = function(_workbook) {
			Packages.java.lang.System.err.println("_workbook = " + _workbook);
			this.sheets = {};

			Object.defineProperty(this.sheets, "count", {
				get: function() {
					return _workbook.getNumberOfSheets();
				},
				enumerable: true
			});
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
