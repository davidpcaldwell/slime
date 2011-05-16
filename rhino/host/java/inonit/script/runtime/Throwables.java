//	LICENSE
//	The contents of this file are subject to the Mozilla Public License Version 1.1 (the "License"); you may not use
//	this file except in compliance with the License. You may obtain a copy of the License at http://www.mozilla.org/MPL/
//	
//	Software distributed under the License is distributed on an "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either
//	express or implied. See the License for the specific language governing rights and limitations under the License.
//	
//	The Original Code is the rhino/host SLIME module.
//	
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010 the Initial Developer. All Rights Reserved.
//	
//	Contributor(s):
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