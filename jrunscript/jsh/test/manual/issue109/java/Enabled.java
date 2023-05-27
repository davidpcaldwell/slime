//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

public class Enabled {
	public static void hoHum() throws InterruptedException {
		System.out.println("Ho, hum!");
		for (int i=0; i<100; i++) {
			Thread.sleep(10);
		}
		System.out.println("Ho, hum!");
	}
}
