//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

/* eslint-env es2017 */
const jsdocx = require("jsdoc-x");

const main = async function(args) {
	console.error("Hello!");

	const inputFilename = args[0];
	const outputFilename = args[1];

	console.error("input =  " + inputFilename);
	console.error("output = " + outputFilename);

	const docs = await jsdocx.parse(inputFilename);
	console.log(docs);
}

main(process.argv.slice(2));
