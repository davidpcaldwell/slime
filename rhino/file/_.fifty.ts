//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

/**
 * Provides access to filesystems.
 *
 * ## World-oriented implementation
 *
 * The {@link slime.jrunscript.file.Exports | Location} and {@link slime.jrunscript.file.Exports | filesystems} properties exported
 * by the module provide a world-oriented interface to filesystems, beginning with the `filesystems.os` property, which provides a
 * {@link slime.jrunscript.file.world.Filesystem} implementation which provides a world-oriented API for accessing the host
 * filesystem.
 *
 * ## Creating filesystems for testing purposes
 *
 * The {@link slime.jrunscript.file.Exports.world | world.filesystems.mock()} method provides the ability to create
 * mock filesystems for testing APIs that use the filesystem.
 *
 * For a more full-featured filesystem mocking framework that can be used in Fifty tests, the `mock.fixtures.ts` script can be
 * loaded using a {@link slime.jrunscript.file.internal.mock.Context | Context}, and it will provide a
 * {@link slime.jrunscript.file.mock.Fixtures | Fixtures} object that supports the more convenient creation of mock
 * filesystems.
 */
namespace slime.jrunscript.file {

}
