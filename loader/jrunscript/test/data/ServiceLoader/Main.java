//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

import java.util.*;

public class Main {
	public static void main(String[] args) {
		ServiceLoader<Runnable> runnableLoader = ServiceLoader.load(Runnable.class);
		for (Runnable r : runnableLoader) {
			System.out.println(r.getClass().getName());
		}
	}
}
