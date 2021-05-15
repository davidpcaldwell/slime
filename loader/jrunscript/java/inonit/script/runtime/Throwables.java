//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

package inonit.script.runtime;

public class Throwables {
	private static class Exception extends java.lang.RuntimeException {
		Exception(String message) {
			super(message);
		}
	}

	private static class Failure extends java.lang.RuntimeException {
		Failure(String message) {
			super(message);
		}
	}

	public void fail(String message) {
		throw new Failure(message);
	}

	public void throwException(String message) {
		throw new Exception(message);
	}
}