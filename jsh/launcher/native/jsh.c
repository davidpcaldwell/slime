/*
LICENSE
This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.

The Original Code is the jsh JavaScript/Java shell.

The Initial Developer of the Original Code is David P. Caldwell <david@davidpcaldwell.com>.
Portions created by the Initial Developer are Copyright (C) 2012-2013 the Initial Developer. All Rights Reserved.

Contributor(s):
END LICENSE
*/
/*
	Locating jsh

	On UNIX, there is no foolproof, platform-independent way to retrieve the executable path. argv[0], on FreeBSD, just contains the
	command name if the command was in the path.

	See http://stackoverflow.com/questions/933850/how-to-find-the-location-of-the-executable-in-c.

	We implement a reasonable heuristic below for Linux.

	On Windows, there is apparently a system call GetModuleFileName that can be used for the purpose of resolving argv[0].
*/
/*
	Locating Java on Cygwin

	On Windows, implementation-wise, we might have difficulty under Cygwin, where the JSH_JAVA_HOME variable is in Cygwin form.
	And there might be problems making the launcher a Cygwin executable (Cygwin might need to be in the PATH, and it might mess up
	the JNI, though it might not; that might be just calls running in the other direction).

	On Windows, we could perhaps dynamically load Cygwin at runtime, or link to it at build time, to give us access to cygpath for
	resolving the JSH_JAVA_HOME or JAVA_HOME environment variables.
*/

#include <stdio.h>
#include <string.h>

void debug(char* mask, ...);

#ifdef WIN32
const char SLASH = '\\';
#include "shlwapi.h"
const int PATH_MAX = MAX_PATH;

char* dirname(char *path) {
	PathRemoveFileSpec(path);
	return path;
}

char* realpath(char *path, char *other) {
	strcpy(other,path);
	return other;
}

int programAbsolutePath(char *path, char *absolute, int size) {
	/*	On Windows, at least using gcc/mingw, we don't need an absolute path to find jsh; we seem to receive absolute path.	*/
	strcpy(absolute,path);
	return 0;
}
#endif

#if defined __unix__ || defined __APPLE__
#include <stdlib.h>
#include <stdarg.h>

const char SLASH = '/';

void strip_trailing_slash(char *path) {
	if (path[strlen(path)-1] == SLASH) {
		path[strlen(path)-1] = '\0';
	}
}

int javaLaunch(char *JAVA_HOME, int argc, char **argv) {
	debug("JAVA_HOME = %s\n", JAVA_HOME);
	char **args = malloc( (sizeof(char*) * (argc+2) ) );
	int i;
	for (i=0; i<argc; i++) {
		args[i+1] = argv[i];
	}
	args[argc+1] = NULL;
	if (JAVA_HOME != NULL) {
		strip_trailing_slash(JAVA_HOME);
		/*	Rather than doing this manipulation, would it be better to use execvP with JAVA_HOME/bin as PATH? */
		int length = strlen(JAVA_HOME) + strlen("/bin/jrunscript");
		char* path = malloc( sizeof(char) * length );
		sprintf(path,"%s/bin/jrunscript",JAVA_HOME);
		debug("jrunscript path: %s\n", path);
		args[0] = path;
//		execv()
	} else {
		args[0] = "jrunscript";
//		execvp("java",argv);
	}
	for (i=0; i<argc+2; i++) {
		debug("argument %d is %s\n", i, args[i]);
	}
	if (JAVA_HOME != NULL) {
		execv(args[0],args);
	} else {
		execvp(args[0],args);
	}
	return 0;
}

#if defined __APPLE__
#include <libproc.h>
#include <libgen.h>
#include <unistd.h>

#define JSH_PATHNAME_BUFFER_SIZE PROC_PIDPATHINFO_MAXSIZE*sizeof(char)
int programAbsolutePath(char *argsv0, char *rv, int size) {
    int status = proc_pidpath(getpid(), rv, size);
	debug("rv = %s\n", rv);
	debug("status = %d\n", status);
	return (status < 0) ? status : 0;
}

#endif

#if defined __unix__ || defined __linux__
#include <limits.h>
#include <libgen.h>

#define JSH_PATHNAME_BUFFER_SIZE PATH_MAX*sizeof(char)

int programAbsolutePath(char *argsv0, char *rv, int size) {
	int status;
	status = readlink("/proc/self/exe", rv, size);
	if (status > 0) {
		return 0;
	}
	/*	Below code untested in current build process but was tested in earlier versions.	*/
	if (argsv0[0] == '/') {
		strcpy(rv,argsv0);
		return 0;
	}
	/*	Could insert better algorithm that attempts to resolve relative paths. Skeletal code below.	*/
	if (0 && index(argsv0[0], '/') != NULL) {
		char *getcwdbuffer = malloc(JSH_PATHNAME_BUFFER_SIZE);
		strcpy(rv,getcwd(getcwdbuffer,JSH_PATHNAME_BUFFER_SIZE));
		strcat(rv,argsv0);
		return 0;
	}
	/*	Could insert better algorithm that attempts to search PATH. */
	return 1;
}
#endif

#endif

void debug(char* mask, ...) {
	va_list args;
	va_start(args, mask);
	if (getenv("JSH_LAUNCHER_DEBUG") != NULL || getenv("JSH_LAUNCHER_CONSOLE_DEBUG") != NULL) {
		vprintf(mask, args);
	}
    va_end(args);
}

int main(int argc, char **argv) {
	debug("JSH_JAVA_HOME = %s\n", getenv("JSH_JAVA_HOME"));

	/*	Get the parent directory of this launcher. */
	debug("argv[0] = %s\n", argv[0]);
	char *absolutejshpath = malloc(JSH_PATHNAME_BUFFER_SIZE);
	if (programAbsolutePath(argv[0],absolutejshpath,JSH_PATHNAME_BUFFER_SIZE)) {
		fprintf(stderr, "Could not locate jsh installation directory.\n");
		fprintf(stderr, "Try invoking the jsh launcher using its absolute path; was invoked as\n%s.\n", argv[0]);
		exit(1);
	}
	debug("absolutejshpath = %s\n", absolutejshpath);
	char *realjshpath = malloc(JSH_PATHNAME_BUFFER_SIZE);
	realpath(absolutejshpath,realjshpath);
	debug("realjshpath = %s\n", realjshpath);
	char *jsh_home = malloc(JSH_PATHNAME_BUFFER_SIZE);
	jsh_home = dirname(realjshpath);
	debug("jsh_home = %s\n", jsh_home);

	/*	Append jsh.jar to the path of the parent directory of this launcher. */
	char* js = malloc(JSH_PATHNAME_BUFFER_SIZE);
	char path[8];
	sprintf(path, "/jsh.js");
	path[0] = SLASH;
	sprintf(js, "%s%s", jsh_home, path);

	char** javaArguments = malloc(sizeof(char*) * (argc));
//	javaArguments[0] = "-jar";
//	javaArguments[1] = jar;
	javaArguments[0] = js;
	int i;
	for (i=1; i<argc; i++) {
		javaArguments[i] = argv[i];
		debug("jrunscriptArguments[%d] = %s\n", i+1, argv[i]);
	}
	javaArguments[argc] = NULL;

	debug("js = %s\n", js);
	char *JAVA_HOME = NULL;
	if (getenv("JSH_JAVA_HOME") != NULL) {
		JAVA_HOME = getenv("JSH_JAVA_HOME");
	}
	if (getenv("JAVA_HOME") != NULL) {
		JAVA_HOME = getenv("JAVA_HOME");
	}
	javaLaunch(JAVA_HOME,argc+1,javaArguments);
	/*
	JNIEnv* env = create_vm(jar);
	invoke_class(env, argc, argv);
	 */
}