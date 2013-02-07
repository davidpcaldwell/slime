//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	The Original Code is the SLIME operating system interface.
//
//	The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
//	Portions created by the Initial Developer are Copyright (C) 2010-2013 the Initial Developer. All Rights Reserved.
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

	public Command.Result execute(String path, String[] arguments) {
		return Command.create(Command.Configuration.create(path, arguments)).getResult();
	}

	//	Used by jsh launcher
	public int execute(Command.Context context, Command.Configuration configuration) throws IOException {
		return Command.create(configuration).getExitStatus(context);
	}

	public Subprocess start(Command.Context context, Command.Configuration configuration) throws IOException {
		return Command.create(configuration).start(context);
	}

	public Runnable run(final Command.Context context, final Command.Configuration configuration, final Command.Listener listener) {
		return new Runnable() {
			public void run() {
				Command.create(configuration).execute(context, listener);
			}
		};
	}
}