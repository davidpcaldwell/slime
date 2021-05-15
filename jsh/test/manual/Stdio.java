//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

import java.io.*;

public class Stdio {
	public static void main(String[] args) throws IOException {
		System.err.print("Does this appear in the parent error stream? ");

		BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
		System.out.println(reader.readLine());
	}
}