//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

package inonit.jsh.test;

public class Echo {
	public static void main(String[] args) throws java.io.IOException {
		int b;
		while( (b = System.in.read()) != -1) {
			System.out.write((int)b);
		}
		System.out.flush();
	}
}
