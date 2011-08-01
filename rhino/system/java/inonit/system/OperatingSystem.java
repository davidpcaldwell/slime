//	LICENSE
//	The contents of this file are subject to the Mozilla Public License Version 1.1 (the "License"); you may not use
//	this file except in compliance with the License. You may obtain a copy of the License at http://www.mozilla.org/MPL/
//	
//	Software distributed under the License is distributed on an "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either
//	express or implied. See the License for the specific language governing rights and limitations under the License.
//	
//	The Original Code is the SLIME operating system interface.
//	
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010 the Initial Developer. All Rights Reserved.
//	
//	Contributor(s):
//	END LICENSE

package inonit.system;

import java.io.*;

public class OperatingSystem {
	private static OperatingSystem singleton = new OperatingSystem();
	
	public static OperatingSystem get() {
		return singleton;
	}
	
	public String getCommandOutput(String path, String[] arguments) throws IOException {
		return Command.getCommandOutput(path, arguments);
	}

	//	TODO	eliminate; return Result object
	public boolean shellCommand(String path, String[] arguments) throws IOException {
		return Command.execute(path, arguments).isSuccess();
	}
	
	public Command.Result execute(String path, String[] arguments) {
		return Command.execute(path, arguments);
	}

	public Subprocess start(Command.Configuration configuration, Command.Context context) throws IOException {
		return Command.create(configuration).start(context);
	}
	
	public Runnable run(final Command.Context context, final Command.Configuration configuration, final Command.Listener listener) 
	{
		return new Runnable() {
			public void run() {
				Command.create(configuration).execute(context, listener);
			}
		};
	}
}
