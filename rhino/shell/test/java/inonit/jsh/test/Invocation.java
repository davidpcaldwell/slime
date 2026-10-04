//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

package inonit.jsh.test;

public class Invocation {
	public static void main(String[] args) throws Exception {
		if ("arguments".equals(args[0])) {
			for (int i = 1; i < args.length; i++) {
				System.out.print(args[i].length() + ":" + args[i] + "\n");
			}
		} else if ("context".equals(args[0])) {
			System.out.print(System.getenv("SLIME_INVOCATION_TEST") + "\n");
			System.out.print(new java.io.File(".").getCanonicalPath());
		} else if ("streams".equals(args[0])) {
			java.io.ByteArrayOutputStream input = new java.io.ByteArrayOutputStream();
			int value;
			while ((value = System.in.read()) != -1) input.write(value);
			String text = new String(input.toByteArray(), "UTF-8");
			System.out.print("stdout:" + text);
			System.err.print("stderr:" + text);
		} else if ("exit".equals(args[0])) {
			System.exit(Integer.parseInt(args[1]));
		}
	}
}
