//	LICENSE
//	This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not
//	distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
//	END LICENSE

declare namespace slime.external.docker.engine.definitions {
    /**
     * Address represents an IPv4 or IPv6 IP address.
     */
    export interface Address {
        /**
         * IP address.
         */
        Addr?: string;
        /**
         * Mask length of the IP address.
         */
        PrefixLen?: number;
    }
    /**
     * example:
     * {
     *   "username": "hannibal",
     *   "password": "xxxx",
     *   "serveraddress": "https://index.docker.io/v1/"
     * }
     */
    export interface AuthConfig {
        username?: string;
        password?: string;
        email?: string;
        serveraddress?: string;
    }
    /**
     * BuildCache contains information about a build cache record.
     *
     */
    export interface BuildCache {
        /**
         * Unique ID of the build cache record.
         *
         * example:
         * ndlpt0hhvkqcdfkputsk4cq9c
         */
        ID?: string;
        /**
         * ID of the parent build cache record.
         *
         * > **Deprecated**: This field is deprecated, and omitted if empty.
         *
         * example:
         *
         */
        Parent?: string;
        /**
         * List of parent build cache record IDs.
         *
         * example:
         * [
         *   "hw53o5aio51xtltp5xjp8v7fx"
         * ]
         */
        Parents?: string[];
        /**
         * Cache record type.
         *
         * example:
         * regular
         */
        Type?: "internal" | "frontend" | "source.local" | "source.git.checkout" | "exec.cachemount" | "regular";
        /**
         * Description of the build-step that produced the build cache.
         *
         * example:
         * mount / from exec /bin/sh -c echo 'Binary::apt::APT::Keep-Downloaded-Packages "true";' > /etc/apt/apt.conf.d/keep-cache
         */
        Description?: string;
        /**
         * Indicates if the build cache is in use.
         *
         * example:
         * false
         */
        InUse?: boolean;
        /**
         * Indicates if the build cache is shared.
         *
         * example:
         * true
         */
        Shared?: boolean;
        /**
         * Amount of disk space used by the build cache (in bytes).
         *
         * example:
         * 51
         */
        Size?: number;
        /**
         * Date and time at which the build cache was created in
         * [RFC 3339](https://www.ietf.org/rfc/rfc3339.txt) format with nano-seconds.
         *
         * example:
         * 2016-08-18T10:44:24.496525531Z
         */
        CreatedAt?: string; // dateTime
        /**
         * Date and time at which the build cache was last used in
         * [RFC 3339](https://www.ietf.org/rfc/rfc3339.txt) format with nano-seconds.
         *
         * example:
         * 2017-08-09T07:09:37.632105588Z
         */
        LastUsedAt?: string; // dateTime
        /**
         * example:
         * 26
         */
        UsageCount?: number;
    }
    export interface BuildInfo {
        id?: string;
        stream?: string;
        error?: string;
        errorDetail?: ErrorDetail;
        status?: string;
        progress?: string;
        progressDetail?: ProgressDetail;
        aux?: /**
         * Image ID or Digest
         * example:
         * {
         *   "ID": "sha256:85f05633ddc1c50679be2b16a0479ab6f7637f8884e0cfe0f4d20e1ebb3d6e7c"
         * }
         */
        ImageID;
    }
    /**
     * Kind of change
     *
     * Can be one of:
     *
     * - `0`: Modified ("C")
     * - `1`: Added ("A")
     * - `2`: Deleted ("D")
     *
     */
    export type ChangeType = 0 | 1 | 2; // uint8
    /**
     * ClusterInfo represents information about the swarm as is returned by the
     * "/info" endpoint. Join-tokens are not included.
     *
     */
    export interface ClusterInfo {
        /**
         * The ID of the swarm.
         * example:
         * abajmipo7b4xz5ip2nrla6b11
         */
        ID?: string;
        Version?: /**
         * The version number of the object such as node, service, etc. This is needed
         * to avoid conflicting writes. The client must send the version number along
         * with the modified specification when updating these objects.
         *
         * This approach ensures safe concurrency and determinism in that the change
         * on the object may not be applied if the version number has changed from the
         * last read. In other words, if two update requests specify the same base
         * version, only one of the requests can succeed. As a result, two separate
         * update requests that happen at the same time will not unintentionally
         * overwrite each other.
         *
         */
        ObjectVersion;
        /**
         * Date and time at which the swarm was initialised in
         * [RFC 3339](https://www.ietf.org/rfc/rfc3339.txt) format with nano-seconds.
         *
         * example:
         * 2016-08-18T10:44:24.496525531Z
         */
        CreatedAt?: string; // dateTime
        /**
         * Date and time at which the swarm was last updated in
         * [RFC 3339](https://www.ietf.org/rfc/rfc3339.txt) format with nano-seconds.
         *
         * example:
         * 2017-08-09T07:09:37.632105588Z
         */
        UpdatedAt?: string; // dateTime
        Spec?: /* User modifiable swarm configuration. */ SwarmSpec;
        TLSInfo?: /**
         * Information about the issuer of leaf TLS certificates and the trusted root
         * CA certificate.
         *
         * example:
         * {
         *   "TrustRoot": "-----BEGIN CERTIFICATE-----\nMIIBajCCARCgAwIBAgIUbYqrLSOSQHoxD8CwG6Bi2PJi9c8wCgYIKoZIzj0EAwIw\nEzERMA8GA1UEAxMIc3dhcm0tY2EwHhcNMTcwNDI0MjE0MzAwWhcNMzcwNDE5MjE0\nMzAwWjATMREwDwYDVQQDEwhzd2FybS1jYTBZMBMGByqGSM49AgEGCCqGSM49AwEH\nA0IABJk/VyMPYdaqDXJb/VXh5n/1Yuv7iNrxV3Qb3l06XD46seovcDWs3IZNV1lf\n3Skyr0ofcchipoiHkXBODojJydSjQjBAMA4GA1UdDwEB/wQEAwIBBjAPBgNVHRMB\nAf8EBTADAQH/MB0GA1UdDgQWBBRUXxuRcnFjDfR/RIAUQab8ZV/n4jAKBggqhkjO\nPQQDAgNIADBFAiAy+JTe6Uc3KyLCMiqGl2GyWGQqQDEcO3/YG36x7om65AIhAJvz\npxv6zFeVEkAEEkqIYi0omA9+CjanB/6Bz4n1uw8H\n-----END CERTIFICATE-----\n",
         *   "CertIssuerSubject": "MBMxETAPBgNVBAMTCHN3YXJtLWNh",
         *   "CertIssuerPublicKey": "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEmT9XIw9h1qoNclv9VeHmf/Vi6/uI2vFXdBveXTpcPjqx6i9wNazchk1XWV/dKTKvSh9xyGKmiIeRcE4OiMnJ1A=="
         * }
         */
        TLSInfo;
        /**
         * Whether there is currently a root CA rotation in progress for the swarm
         *
         * example:
         * false
         */
        RootRotationInProgress?: boolean;
        /**
         * DataPathPort specifies the data path port number for data traffic.
         * Acceptable port range is 1024 to 49151.
         * If no port is set or is set to 0, the default port (4789) is used.
         *
         * example:
         * 4789
         */
        DataPathPort?: number; // uint32
        /**
         * Default Address Pool specifies default subnet pools for global scope
         * networks.
         *
         */
        DefaultAddrPool?: string /* CIDR */[];
        /**
         * SubnetSize specifies the subnet size of the networks created from the
         * default subnet pool.
         *
         * example:
         * 24
         */
        SubnetSize?: number; // uint32
    }
    /**
     * Options and information specific to, and only present on, Swarm CSI
     * cluster volumes.
     *
     */
    export interface ClusterVolume {
        /**
         * The Swarm ID of this volume. Because cluster volumes are Swarm
         * objects, they have an ID, unlike non-cluster volumes. This ID can
         * be used to refer to the Volume instead of the name.
         *
         */
        ID?: string;
        Version?: /**
         * The version number of the object such as node, service, etc. This is needed
         * to avoid conflicting writes. The client must send the version number along
         * with the modified specification when updating these objects.
         *
         * This approach ensures safe concurrency and determinism in that the change
         * on the object may not be applied if the version number has changed from the
         * last read. In other words, if two update requests specify the same base
         * version, only one of the requests can succeed. As a result, two separate
         * update requests that happen at the same time will not unintentionally
         * overwrite each other.
         *
         */
        ObjectVersion;
        CreatedAt?: string; // dateTime
        UpdatedAt?: string; // dateTime
        Spec?: /**
         * Cluster-specific options used to create the volume.
         *
         */
        ClusterVolumeSpec;
        /**
         * Information about the global status of the volume.
         *
         */
        Info?: {
            /**
             * The capacity of the volume in bytes. A value of 0 indicates that
             * the capacity is unknown.
             *
             */
            CapacityBytes?: number; // int64
            /**
             * A map of strings to strings returned from the storage plugin when
             * the volume is created.
             *
             */
            VolumeContext?: {
                [name: string]: string;
            };
            /**
             * The ID of the volume as returned by the CSI storage plugin. This
             * is distinct from the volume's ID as provided by Docker. This ID
             * is never used by the user when communicating with Docker to refer
             * to this volume. If the ID is blank, then the Volume has not been
             * successfully created in the plugin yet.
             *
             */
            VolumeID?: string;
            /**
             * The topology this volume is actually accessible from.
             *
             */
            AccessibleTopology?: /**
             * A map of topological domains to topological segments. For in depth
             * details, see documentation for the Topology object in the CSI
             * specification.
             *
             */
            Topology[];
        };
        /**
         * The status of the volume as it pertains to its publishing and use on
         * specific nodes
         *
         */
        PublishStatus?: {
            /**
             * The ID of the Swarm node the volume is published on.
             *
             */
            NodeID?: string;
            /**
             * The published state of the volume.
             * * `pending-publish` The volume should be published to this node, but the call to the controller plugin to do so has not yet been successfully completed.
             * * `published` The volume is published successfully to the node.
             * * `pending-node-unpublish` The volume should be unpublished from the node, and the manager is awaiting confirmation from the worker that it has done so.
             * * `pending-controller-unpublish` The volume is successfully unpublished from the node, but has not yet been successfully unpublished on the controller.
             *
             */
            State?: "pending-publish" | "published" | "pending-node-unpublish" | "pending-controller-unpublish";
            /**
             * A map of strings to strings returned by the CSI controller
             * plugin when a volume is published.
             *
             */
            PublishContext?: {
                [name: string]: string;
            };
        }[];
    }
    /**
     * Cluster-specific options used to create the volume.
     *
     */
    export interface ClusterVolumeSpec {
        /**
         * Group defines the volume group of this volume. Volumes belonging to
         * the same group can be referred to by group name when creating
         * Services.  Referring to a volume by group instructs Swarm to treat
         * volumes in that group interchangeably for the purpose of scheduling.
         * Volumes with an empty string for a group technically all belong to
         * the same, emptystring group.
         *
         */
        Group?: string;
        /**
         * Defines how the volume is used by tasks.
         *
         */
        AccessMode?: {
            /**
             * The set of nodes this volume can be used on at one time.
             * - `single` The volume may only be scheduled to one node at a time.
             * - `multi` the volume may be scheduled to any supported number of nodes at a time.
             *
             */
            Scope?: "single" | "multi";
            /**
             * The number and way that different tasks can use this volume
             * at one time.
             * - `none` The volume may only be used by one task at a time.
             * - `readonly` The volume may be used by any number of tasks, but they all must mount the volume as readonly
             * - `onewriter` The volume may be used by any number of tasks, but only one may mount it as read/write.
             * - `all` The volume may have any number of readers and writers.
             *
             */
            Sharing?: "none" | "readonly" | "onewriter" | "all";
            /**
             * Options for using this volume as a Mount-type volume.
             *
             *     Either MountVolume or BlockVolume, but not both, must be
             *     present.
             *   properties:
             *     FsType:
             *       type: "string"
             *       description: |
             *         Specifies the filesystem type for the mount volume.
             *         Optional.
             *     MountFlags:
             *       type: "array"
             *       description: |
             *         Flags to pass when mounting the volume. Optional.
             *       items:
             *         type: "string"
             * BlockVolume:
             *   type: "object"
             *   description: |
             *     Options for using this volume as a Block-type volume.
             *     Intentionally empty.
             *
             */
            MountVolume?: {
                [key: string]: any;
            };
            /**
             * Swarm Secrets that are passed to the CSI storage plugin when
             * operating on this volume.
             *
             */
            Secrets?: {
                /**
                 * Key is the name of the key of the key-value pair passed to
                 * the plugin.
                 *
                 */
                Key?: string;
                /**
                 * Secret is the swarm Secret object from which to read data.
                 * This can be a Secret name or ID. The Secret data is
                 * retrieved by swarm and used as the value of the key-value
                 * pair passed to the plugin.
                 *
                 */
                Secret?: string;
            }[];
            /**
             * Requirements for the accessible topology of the volume. These
             * fields are optional. For an in-depth description of what these
             * fields mean, see the CSI specification.
             *
             */
            AccessibilityRequirements?: {
                /**
                 * A list of required topologies, at least one of which the
                 * volume must be accessible from.
                 *
                 */
                Requisite?: /**
                 * A map of topological domains to topological segments. For in depth
                 * details, see documentation for the Topology object in the CSI
                 * specification.
                 *
                 */
                Topology[];
                /**
                 * A list of topologies that the volume should attempt to be
                 * provisioned in.
                 *
                 */
                Preferred?: /**
                 * A map of topological domains to topological segments. For in depth
                 * details, see documentation for the Topology object in the CSI
                 * specification.
                 *
                 */
                Topology[];
            };
            /**
             * The desired capacity that the volume should be created with. If
             * empty, the plugin will decide the capacity.
             *
             */
            CapacityRange?: {
                /**
                 * The volume must be at least this big. The value of 0
                 * indicates an unspecified minimum
                 *
                 */
                RequiredBytes?: number; // int64
                /**
                 * The volume must not be bigger than this. The value of 0
                 * indicates an unspecified maximum.
                 *
                 */
                LimitBytes?: number; // int64
            };
            /**
             * The availability of the volume for use in tasks.
             * - `active` The volume is fully available for scheduling on the cluster
             * - `pause` No new workloads should use the volume, but existing workloads are not stopped.
             * - `drain` All workloads using this volume should be stopped and rescheduled, and no new ones should be started.
             *
             */
            Availability?: "active" | "pause" | "drain";
        };
    }
    /**
     * Commit holds the Git-commit (SHA1) that a binary was built from, as
     * reported in the version-string of external tools, such as `containerd`,
     * or `runC`.
     *
     */
    export interface Commit {
        /**
         * Actual commit ID of external tool.
         * example:
         * cfb82a876ecc11b5ca0977d1733adbe58599088a
         */
        ID?: string;
        /**
         * Commit ID of external tool expected by dockerd as set at build time.
         *
         * example:
         * 2d41c047c83e09a6d61d464906feb2a2f3c52aa4
         */
        Expected?: string;
    }
    export interface Config {
        ID?: string;
        Version?: /**
         * The version number of the object such as node, service, etc. This is needed
         * to avoid conflicting writes. The client must send the version number along
         * with the modified specification when updating these objects.
         *
         * This approach ensures safe concurrency and determinism in that the change
         * on the object may not be applied if the version number has changed from the
         * last read. In other words, if two update requests specify the same base
         * version, only one of the requests can succeed. As a result, two separate
         * update requests that happen at the same time will not unintentionally
         * overwrite each other.
         *
         */
        ObjectVersion;
        CreatedAt?: string; // dateTime
        UpdatedAt?: string; // dateTime
        Spec?: ConfigSpec;
    }
    /**
     * The config-only network source to provide the configuration for
     * this network.
     *
     */
    export interface ConfigReference {
        /**
         * The name of the config-only network that provides the network's
         * configuration. The specified network must be an existing config-only
         * network. Only network names are allowed, not network IDs.
         *
         * example:
         * config_only_network_01
         */
        Network?: string;
    }
    export interface ConfigSpec {
        /**
         * User-defined name of the config.
         */
        Name?: string;
        /**
         * User-defined key/value metadata.
         */
        Labels?: {
            [name: string]: string;
        };
        /**
         * Base64-url-safe-encoded ([RFC 4648](https://tools.ietf.org/html/rfc4648#section-5))
         * config data.
         *
         */
        Data?: string;
        /**
         * Templating driver, if applicable
         *
         * Templating controls whether and how to evaluate the config payload as
         * a template. If no driver is set, no templating is used.
         *
         */
        Templating?: /* Driver represents a driver (network, logging, secrets). */ Driver;
    }
    /**
     * Configuration for a container that is portable between hosts.
     *
     * When used as `ContainerConfig` field in an image, `ContainerConfig` is an
     * optional field containing the configuration of the container that was last
     * committed when creating the image.
     *
     * Previous versions of Docker builder used this field to store build cache,
     * and it is not in active use anymore.
     *
     */
    export interface ContainerConfig {
        /**
         * The hostname to use for the container, as a valid RFC 1123 hostname.
         *
         * example:
         * 439f4e91bd1d
         */
        Hostname?: string;
        /**
         * The domain name to use for the container.
         *
         */
        Domainname?: string;
        /**
         * The user that commands are run as inside the container.
         */
        User?: string;
        /**
         * Whether to attach to `stdin`.
         */
        AttachStdin?: boolean;
        /**
         * Whether to attach to `stdout`.
         */
        AttachStdout?: boolean;
        /**
         * Whether to attach to `stderr`.
         */
        AttachStderr?: boolean;
        /**
         * An object mapping ports to an empty object in the form:
         *
         * `{"<port>/<tcp|udp|sctp>": {}}`
         *
         * example:
         * {
         *   "80/tcp": {},
         *   "443/tcp": {}
         * }
         */
        ExposedPorts?: {
            [name: string]: "[object Object]";
        };
        /**
         * Attach standard streams to a TTY, including `stdin` if it is not closed.
         *
         */
        Tty?: boolean;
        /**
         * Open `stdin`
         */
        OpenStdin?: boolean;
        /**
         * Close `stdin` after one attached client disconnects
         */
        StdinOnce?: boolean;
        /**
         * A list of environment variables to set inside the container in the
         * form `["VAR=value", ...]`. A variable without `=` is removed from the
         * environment, rather than to have an empty value.
         *
         * example:
         * [
         *   "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
         * ]
         */
        Env?: string[];
        /**
         * Command to run specified as a string or an array of strings.
         *
         * example:
         * [
         *   "/bin/sh"
         * ]
         */
        Cmd?: string[];
        Healthcheck?: /* A test to perform to check that the container is healthy. */ HealthConfig;
        /**
         * Command is already escaped (Windows only)
         * example:
         * false
         */
        ArgsEscaped?: boolean;
        /**
         * The name (or reference) of the image to use when creating the container,
         * or which was used when the container was created.
         *
         * example:
         * example-image:1.0
         */
        Image?: string;
        /**
         * An object mapping mount point paths inside the container to empty
         * objects.
         *
         */
        Volumes?: {
            [name: string]: "[object Object]";
        };
        /**
         * The working directory for commands to run in.
         * example:
         * /public/
         */
        WorkingDir?: string;
        /**
         * The entry point for the container as a string or an array of strings.
         *
         * If the array consists of exactly one empty string (`[""]`) then the
         * entry point is reset to system default (i.e., the entry point used by
         * docker when there is no `ENTRYPOINT` instruction in the `Dockerfile`).
         *
         * example:
         * []
         */
        Entrypoint?: string[];
        /**
         * Disable networking for the container.
         */
        NetworkDisabled?: boolean;
        /**
         * MAC address of the container.
         */
        MacAddress?: string;
        /**
         * `ONBUILD` metadata that were defined in the image's `Dockerfile`.
         *
         * example:
         * []
         */
        OnBuild?: string[];
        /**
         * User-defined key/value metadata.
         * example:
         * {
         *   "com.example.some-label": "some-value",
         *   "com.example.some-other-label": "some-other-value"
         * }
         */
        Labels?: {
            [name: string]: string;
        };
        /**
         * Signal to stop a container as a string or unsigned integer.
         *
         * example:
         * SIGTERM
         */
        StopSignal?: string;
        /**
         * Timeout to stop a container in seconds.
         */
        StopTimeout?: number;
        /**
         * Shell for when `RUN`, `CMD`, and `ENTRYPOINT` uses a shell.
         *
         * example:
         * [
         *   "/bin/sh",
         *   "-c"
         * ]
         */
        Shell?: string[];
    }
    /**
     * ContainerCreateResponse
     * OK response to ContainerCreate operation
     */
    export interface ContainerCreateResponse {
        /**
         * The ID of the created container
         * example:
         * ede54ee1afda366ab42f824e8a5ffd195155d853ceaec74a927f249ea270c743
         */
        Id: string;
        /**
         * Warnings encountered when creating the container
         * example:
         * []
         */
        Warnings: string[];
    }
    /**
     * ContainerState stores container's running state. It's part of ContainerJSONBase
     * and will be returned by the "inspect" command.
     *
     */
    export interface ContainerState {
        /**
         * String representation of the container state. Can be one of "created",
         * "running", "paused", "restarting", "removing", "exited", or "dead".
         *
         * example:
         * running
         */
        Status?: "created" | "running" | "paused" | "restarting" | "removing" | "exited" | "dead";
        /**
         * Whether this container is running.
         *
         * Note that a running container can be _paused_. The `Running` and `Paused`
         * booleans are not mutually exclusive:
         *
         * When pausing a container (on Linux), the freezer cgroup is used to suspend
         * all processes in the container. Freezing the process requires the process to
         * be running. As a result, paused containers are both `Running` _and_ `Paused`.
         *
         * Use the `Status` field instead to determine if a container's state is "running".
         *
         * example:
         * true
         */
        Running?: boolean;
        /**
         * Whether this container is paused.
         * example:
         * false
         */
        Paused?: boolean;
        /**
         * Whether this container is restarting.
         * example:
         * false
         */
        Restarting?: boolean;
        /**
         * Whether a process within this container has been killed because it ran
         * out of memory since the container was last started.
         *
         * example:
         * false
         */
        OOMKilled?: boolean;
        /**
         * example:
         * false
         */
        Dead?: boolean;
        /**
         * The process ID of this container
         * example:
         * 1234
         */
        Pid?: number;
        /**
         * The last exit code of this container
         * example:
         * 0
         */
        ExitCode?: number;
        Error?: string;
        /**
         * The time when this container was last started.
         * example:
         * 2020-01-06T09:06:59.461876391Z
         */
        StartedAt?: string;
        /**
         * The time when this container last exited.
         * example:
         * 2020-01-06T09:07:59.461876391Z
         */
        FinishedAt?: string;
        Health?: /**
         * Health stores information about the container's healthcheck results.
         *
         */
        Health;
    }
    export interface ContainerSummary {
        /**
         * The ID of this container
         */
        Id?: string;
        /**
         * The names that this container has been given
         */
        Names?: string[];
        /**
         * The name of the image used when creating this container
         */
        Image?: string;
        /**
         * The ID of the image that this container was created from
         */
        ImageID?: string;
        /**
         * Command to run when starting the container
         */
        Command?: string;
        /**
         * When the container was created
         */
        Created?: number; // int64
        /**
         * The ports exposed by this container
         */
        Ports?: /**
         * An open port on a container
         * example:
         * {
         *   "PrivatePort": 8080,
         *   "PublicPort": 80,
         *   "Type": "tcp"
         * }
         */
        Port[];
        /**
         * The size of files that have been created or changed by this container
         */
        SizeRw?: number; // int64
        /**
         * The total size of all the files in this container
         */
        SizeRootFs?: number; // int64
        /**
         * User-defined key/value metadata.
         */
        Labels?: {
            [name: string]: string;
        };
        /**
         * The state of this container (e.g. `Exited`)
         */
        State?: string;
        /**
         * Additional human-readable status of this container (e.g. `Exit 0`)
         */
        Status?: string;
        HostConfig?: {
            NetworkMode?: string;
        };
        /**
         * A summary of the container's network settings
         */
        NetworkSettings?: {
            Networks?: {
                [name: string]: /* Configuration for a network endpoint. */ EndpointSettings;
            };
        };
        Mounts?: /**
         * MountPoint represents a mount point configuration inside the container.
         * This is used for reporting the mountpoints in use by a container.
         *
         */
        MountPoint[];
    }
    /**
     * container waiting error, if any
     */
    export interface ContainerWaitExitError {
        /**
         * Details of an error
         */
        Message?: string;
    }
    /**
     * ContainerWaitResponse
     * OK response to ContainerWait operation
     */
    export interface ContainerWaitResponse {
        /**
         * Exit code of the container
         */
        StatusCode: number; // int64
        Error?: /* container waiting error, if any */ ContainerWaitExitError;
    }
    export interface CreateImageInfo {
        id?: string;
        error?: string;
        errorDetail?: ErrorDetail;
        status?: string;
        progress?: string;
        progressDetail?: ProgressDetail;
    }
    /**
     * A device mapping between the host and container
     * example:
     * {
     *   "PathOnHost": "/dev/deviceName",
     *   "PathInContainer": "/dev/deviceName",
     *   "CgroupPermissions": "mrw"
     * }
     */
    export interface DeviceMapping {
        PathOnHost?: string;
        PathInContainer?: string;
        CgroupPermissions?: string;
    }
    /**
     * A request for devices to be sent to device drivers
     */
    export interface DeviceRequest {
        /**
         * example:
         * nvidia
         */
        Driver?: string;
        /**
         * example:
         * -1
         */
        Count?: number;
        /**
         * example:
         * [
         *   "0",
         *   "1",
         *   "GPU-fef8089b-4820-abfc-e83e-94318197576e"
         * ]
         */
        DeviceIDs?: string[];
        /**
         * A list of capabilities; an OR list of AND lists of capabilities.
         *
         * example:
         * [
         *   [
         *     "gpu",
         *     "nvidia",
         *     "compute"
         *   ]
         * ]
         */
        Capabilities?: string[][];
        /**
         * Driver-specific options, specified as a key/value pairs. These options
         * are passed directly to the driver.
         *
         */
        Options?: {
            [name: string]: string;
        };
    }
    /**
     * DistributionInspectResponse
     * Describes the result obtained from contacting the registry to retrieve
     * image metadata.
     *
     */
    export interface DistributionInspect {
        Descriptor: /**
         * A descriptor struct containing digest, media type, and size, as defined in
         * the [OCI Content Descriptors Specification](https://github.com/opencontainers/image-spec/blob/v1.0.1/descriptor.md).
         *
         */
        OCIDescriptor;
        /**
         * An array containing all platforms supported by the image.
         *
         */
        Platforms: /**
         * Describes the platform which the image in the manifest runs on, as defined
         * in the [OCI Image Index Specification](https://github.com/opencontainers/image-spec/blob/v1.0.1/image-index.md).
         *
         */
        OCIPlatform[];
    }
    /**
     * Driver represents a driver (network, logging, secrets).
     */
    export interface Driver {
        /**
         * Name of the driver.
         * example:
         * some-driver
         */
        Name: string;
        /**
         * Key/value map of driver-specific options.
         * example:
         * {
         *   "OptionA": "value for driver-specific option A",
         *   "OptionB": "value for driver-specific option B"
         * }
         */
        Options?: {
            [name: string]: string;
        };
    }
    /**
     * EndpointIPAMConfig represents an endpoint's IPAM configuration.
     *
     */
    export interface EndpointIPAMConfig {
        /**
         * example:
         * 172.20.30.33
         */
        IPv4Address?: string;
        /**
         * example:
         * 2001:db8:abcd::3033
         */
        IPv6Address?: string;
        /**
         * example:
         * [
         *   "169.254.34.68",
         *   "fe80::3468"
         * ]
         */
        LinkLocalIPs?: string[];
    }
    export interface EndpointPortConfig {
        Name?: string;
        Protocol?: "tcp" | "udp" | "sctp";
        /**
         * The port inside the container.
         */
        TargetPort?: number;
        /**
         * The port on the swarm hosts.
         */
        PublishedPort?: number;
        /**
         * The mode in which port is published.
         *
         * <p><br /></p>
         *
         * - "ingress" makes the target port accessible on every node,
         *   regardless of whether there is a task for the service running on
         *   that node or not.
         * - "host" bypasses the routing mesh and publish the port directly on
         *   the swarm node where that service is running.
         *
         * example:
         * ingress
         */
        PublishMode?: "ingress" | "host";
    }
    /**
     * Configuration for a network endpoint.
     */
    export interface EndpointSettings {
        IPAMConfig?: /**
         * EndpointIPAMConfig represents an endpoint's IPAM configuration.
         *
         */
        EndpointIPAMConfig;
        /**
         * example:
         * [
         *   "container_1",
         *   "container_2"
         * ]
         */
        Links?: string[];
        /**
         * example:
         * [
         *   "server_x",
         *   "server_y"
         * ]
         */
        Aliases?: string[];
        /**
         * Unique ID of the network.
         *
         * example:
         * 08754567f1f40222263eab4102e1c733ae697e8e354aa9cd6e18d7402835292a
         */
        NetworkID?: string;
        /**
         * Unique ID for the service endpoint in a Sandbox.
         *
         * example:
         * b88f5b905aabf2893f3cbc4ee42d1ea7980bbc0a92e2c8922b1e1795298afb0b
         */
        EndpointID?: string;
        /**
         * Gateway address for this network.
         *
         * example:
         * 172.17.0.1
         */
        Gateway?: string;
        /**
         * IPv4 address.
         *
         * example:
         * 172.17.0.4
         */
        IPAddress?: string;
        /**
         * Mask length of the IPv4 address.
         *
         * example:
         * 16
         */
        IPPrefixLen?: number;
        /**
         * IPv6 gateway address.
         *
         * example:
         * 2001:db8:2::100
         */
        IPv6Gateway?: string;
        /**
         * Global IPv6 address.
         *
         * example:
         * 2001:db8::5689
         */
        GlobalIPv6Address?: string;
        /**
         * Mask length of the global IPv6 address.
         *
         * example:
         * 64
         */
        GlobalIPv6PrefixLen?: number; // int64
        /**
         * MAC address for the endpoint on this network.
         *
         * example:
         * 02:42:ac:11:00:04
         */
        MacAddress?: string;
        /**
         * DriverOpts is a mapping of driver options and values. These options
         * are passed directly to the driver and are driver specific.
         *
         * example:
         * {
         *   "com.example.some-label": "some-value",
         *   "com.example.some-other-label": "some-other-value"
         * }
         */
        DriverOpts?: {
            [name: string]: string;
        };
    }
    /**
     * Properties that can be configured to access and load balance a service.
     */
    export interface EndpointSpec {
        /**
         * The mode of resolution to use for internal load balancing between tasks.
         *
         */
        Mode?: "vip" | "dnsrr";
        /**
         * List of exposed ports that this service is accessible on from the
         * outside. Ports can only be provided if `vip` resolution mode is used.
         *
         */
        Ports?: EndpointPortConfig[];
    }
    /**
     * EngineDescription provides information about an engine.
     */
    export interface EngineDescription {
        /**
         * example:
         * 17.06.0
         */
        EngineVersion?: string;
        /**
         * example:
         * {
         *   "foo": "bar"
         * }
         */
        Labels?: {
            [name: string]: string;
        };
        /**
         * example:
         * [
         *   {
         *     "Type": "Log",
         *     "Name": "awslogs"
         *   },
         *   {
         *     "Type": "Log",
         *     "Name": "fluentd"
         *   },
         *   {
         *     "Type": "Log",
         *     "Name": "gcplogs"
         *   },
         *   {
         *     "Type": "Log",
         *     "Name": "gelf"
         *   },
         *   {
         *     "Type": "Log",
         *     "Name": "journald"
         *   },
         *   {
         *     "Type": "Log",
         *     "Name": "json-file"
         *   },
         *   {
         *     "Type": "Log",
         *     "Name": "splunk"
         *   },
         *   {
         *     "Type": "Log",
         *     "Name": "syslog"
         *   },
         *   {
         *     "Type": "Network",
         *     "Name": "bridge"
         *   },
         *   {
         *     "Type": "Network",
         *     "Name": "host"
         *   },
         *   {
         *     "Type": "Network",
         *     "Name": "ipvlan"
         *   },
         *   {
         *     "Type": "Network",
         *     "Name": "macvlan"
         *   },
         *   {
         *     "Type": "Network",
         *     "Name": "null"
         *   },
         *   {
         *     "Type": "Network",
         *     "Name": "overlay"
         *   },
         *   {
         *     "Type": "Volume",
         *     "Name": "local"
         *   },
         *   {
         *     "Type": "Volume",
         *     "Name": "localhost:5000/vieux/sshfs:latest"
         *   },
         *   {
         *     "Type": "Volume",
         *     "Name": "vieux/sshfs:latest"
         *   }
         * ]
         */
        Plugins?: {
            Type?: string;
            Name?: string;
        }[];
    }
    export interface ErrorDetail {
        code?: number;
        message?: string;
    }
    /**
     * Represents an error.
     * example:
     * {
     *   "message": "Something went wrong."
     * }
     */
    export interface ErrorResponse {
        /**
         * The error message.
         */
        message: string;
    }
    /**
     * Actor describes something that generates events, like a container, network,
     * or a volume.
     *
     */
    export interface EventActor {
        /**
         * The ID of the object emitting the event
         * example:
         * ede54ee1afda366ab42f824e8a5ffd195155d853ceaec74a927f249ea270c743
         */
        ID?: string;
        /**
         * Various key/value attributes of the object, depending on its type.
         *
         * example:
         * {
         *   "com.example.some-label": "some-label-value",
         *   "image": "alpine:latest",
         *   "name": "my-container"
         * }
         */
        Attributes?: {
            [name: string]: string;
        };
    }
    /**
     * SystemEventsResponse
     * EventMessage represents the information an event contains.
     *
     */
    export interface EventMessage {
        /**
         * The type of object emitting the event
         * example:
         * container
         */
        Type?: "builder" | "config" | "container" | "daemon" | "image" | "network" | "node" | "plugin" | "secret" | "service" | "volume";
        /**
         * The type of event
         * example:
         * create
         */
        Action?: string;
        Actor?: /**
         * Actor describes something that generates events, like a container, network,
         * or a volume.
         *
         */
        EventActor;
        /**
         * Scope of the event. Engine events are `local` scope. Cluster (Swarm)
         * events are `swarm` scope.
         *
         */
        scope?: "local" | "swarm";
        /**
         * Timestamp of event
         * example:
         * 1629574695
         */
        time?: number; // int64
        /**
         * Timestamp of event, with nanosecond accuracy
         * example:
         * 1629574695515050000
         */
        timeNano?: number; // int64
    }
    /**
     * Change in the container's filesystem.
     *
     */
    export interface FilesystemChange {
        /**
         * Path to file or directory that has changed.
         *
         */
        Path: string;
        Kind: /**
         * Kind of change
         *
         * Can be one of:
         *
         * - `0`: Modified ("C")
         * - `1`: Added ("A")
         * - `2`: Deleted ("D")
         *
         */
        ChangeType /* uint8 */;
    }
    /**
     * User-defined resources can be either Integer resources (e.g, `SSD=3`) or
     * String resources (e.g, `GPU=UUID1`).
     *
     * example:
     * [
     *   {
     *     "DiscreteResourceSpec": {
     *       "Kind": "SSD",
     *       "Value": 3
     *     }
     *   },
     *   {
     *     "NamedResourceSpec": {
     *       "Kind": "GPU",
     *       "Value": "UUID1"
     *     }
     *   },
     *   {
     *     "NamedResourceSpec": {
     *       "Kind": "GPU",
     *       "Value": "UUID2"
     *     }
     *   }
     * ]
     */
    export type GenericResources = {
        NamedResourceSpec?: {
            Kind?: string;
            Value?: string;
        };
        DiscreteResourceSpec?: {
            Kind?: string;
            Value?: number; // int64
        };
    }[];
    /**
     * Information about the storage driver used to store the container's and
     * image's filesystem.
     *
     */
    export interface GraphDriverData {
        /**
         * Name of the storage driver.
         * example:
         * overlay2
         */
        Name: string;
        /**
         * Low-level storage metadata, provided as key/value pairs.
         *
         * This information is driver-specific, and depends on the storage-driver
         * in use, and should be used for informational purposes only.
         *
         * example:
         * {
         *   "MergedDir": "/var/lib/docker/overlay2/ef749362d13333e65fc95c572eb525abbe0052e16e086cb64bc3b98ae9aa6d74/merged",
         *   "UpperDir": "/var/lib/docker/overlay2/ef749362d13333e65fc95c572eb525abbe0052e16e086cb64bc3b98ae9aa6d74/diff",
         *   "WorkDir": "/var/lib/docker/overlay2/ef749362d13333e65fc95c572eb525abbe0052e16e086cb64bc3b98ae9aa6d74/work"
         * }
         */
        Data: {
            [name: string]: string;
        };
    }
    /**
     * Health stores information about the container's healthcheck results.
     *
     */
    export interface Health {
        /**
         * Status is one of `none`, `starting`, `healthy` or `unhealthy`
         *
         * - "none"      Indicates there is no healthcheck
         * - "starting"  Starting indicates that the container is not yet ready
         * - "healthy"   Healthy indicates that the container is running correctly
         * - "unhealthy" Unhealthy indicates that the container has a problem
         *
         * example:
         * healthy
         */
        Status?: "none" | "starting" | "healthy" | "unhealthy";
        /**
         * FailingStreak is the number of consecutive failures
         * example:
         * 0
         */
        FailingStreak?: number;
        /**
         * Log contains the last few results (oldest first)
         *
         */
        Log?: /**
         * HealthcheckResult stores information about a single run of a healthcheck probe
         *
         */
        HealthcheckResult[];
    }
    /**
     * A test to perform to check that the container is healthy.
     */
    export interface HealthConfig {
        /**
         * The test to perform. Possible values are:
         *
         * - `[]` inherit healthcheck from image or parent image
         * - `["NONE"]` disable healthcheck
         * - `["CMD", args...]` exec arguments directly
         * - `["CMD-SHELL", command]` run command with system's default shell
         *
         */
        Test?: string[];
        /**
         * The time to wait between checks in nanoseconds. It should be 0 or at
         * least 1000000 (1 ms). 0 means inherit.
         *
         */
        Interval?: number; // int64
        /**
         * The time to wait before considering the check to have hung. It should
         * be 0 or at least 1000000 (1 ms). 0 means inherit.
         *
         */
        Timeout?: number; // int64
        /**
         * The number of consecutive failures needed to consider a container as
         * unhealthy. 0 means inherit.
         *
         */
        Retries?: number;
        /**
         * Start period for the container to initialize before starting
         * health-retries countdown in nanoseconds. It should be 0 or at least
         * 1000000 (1 ms). 0 means inherit.
         *
         */
        StartPeriod?: number; // int64
    }
    /**
     * HealthcheckResult stores information about a single run of a healthcheck probe
     *
     */
    export interface HealthcheckResult {
        /**
         * Date and time at which this check started in
         * [RFC 3339](https://www.ietf.org/rfc/rfc3339.txt) format with nano-seconds.
         *
         * example:
         * 2020-01-04T10:44:24.496525531Z
         */
        Start?: string; // date-time
        /**
         * Date and time at which this check ended in
         * [RFC 3339](https://www.ietf.org/rfc/rfc3339.txt) format with nano-seconds.
         *
         * example:
         * 2020-01-04T10:45:21.364524523Z
         */
        End?: string; // dateTime
        /**
         * ExitCode meanings:
         *
         * - `0` healthy
         * - `1` unhealthy
         * - `2` reserved (considered unhealthy)
         * - other values: error running probe
         *
         * example:
         * 0
         */
        ExitCode?: number;
        /**
         * Output from last check
         */
        Output?: string;
    }
    /**
     * Container configuration that depends on the host we are running on
     */
    export interface HostConfig {
        /**
         * An integer value representing this container's relative CPU weight
         * versus other containers.
         *
         */
        CpuShares?: number;
        /**
         * Memory limit in bytes.
         */
        Memory?: number; // int64
        /**
         * Path to `cgroups` under which the container's `cgroup` is created. If
         * the path is not absolute, the path is considered to be relative to the
         * `cgroups` path of the init process. Cgroups are created if they do not
         * already exist.
         *
         */
        CgroupParent?: string;
        /**
         * Block IO weight (relative weight).
         */
        BlkioWeight?: number;
        /**
         * Block IO weight (relative device weight) in the form:
         *
         * ```
         * [{"Path": "device_path", "Weight": weight}]
         * ```
         *
         */
        BlkioWeightDevice?: {
            Path?: string;
            Weight?: number;
        }[];
        /**
         * Limit read rate (bytes per second) from a device, in the form:
         *
         * ```
         * [{"Path": "device_path", "Rate": rate}]
         * ```
         *
         */
        BlkioDeviceReadBps?: ThrottleDevice[];
        /**
         * Limit write rate (bytes per second) to a device, in the form:
         *
         * ```
         * [{"Path": "device_path", "Rate": rate}]
         * ```
         *
         */
        BlkioDeviceWriteBps?: ThrottleDevice[];
        /**
         * Limit read rate (IO per second) from a device, in the form:
         *
         * ```
         * [{"Path": "device_path", "Rate": rate}]
         * ```
         *
         */
        BlkioDeviceReadIOps?: ThrottleDevice[];
        /**
         * Limit write rate (IO per second) to a device, in the form:
         *
         * ```
         * [{"Path": "device_path", "Rate": rate}]
         * ```
         *
         */
        BlkioDeviceWriteIOps?: ThrottleDevice[];
        /**
         * The length of a CPU period in microseconds.
         */
        CpuPeriod?: number; // int64
        /**
         * Microseconds of CPU time that the container can get in a CPU period.
         *
         */
        CpuQuota?: number; // int64
        /**
         * The length of a CPU real-time period in microseconds. Set to 0 to
         * allocate no time allocated to real-time tasks.
         *
         */
        CpuRealtimePeriod?: number; // int64
        /**
         * The length of a CPU real-time runtime in microseconds. Set to 0 to
         * allocate no time allocated to real-time tasks.
         *
         */
        CpuRealtimeRuntime?: number; // int64
        /**
         * CPUs in which to allow execution (e.g., `0-3`, `0,1`).
         *
         * example:
         * 0-3
         */
        CpusetCpus?: string;
        /**
         * Memory nodes (MEMs) in which to allow execution (0-3, 0,1). Only
         * effective on NUMA systems.
         *
         */
        CpusetMems?: string;
        /**
         * A list of devices to add to the container.
         */
        Devices?: /**
         * A device mapping between the host and container
         * example:
         * {
         *   "PathOnHost": "/dev/deviceName",
         *   "PathInContainer": "/dev/deviceName",
         *   "CgroupPermissions": "mrw"
         * }
         */
        DeviceMapping[];
        /**
         * a list of cgroup rules to apply to the container
         */
        DeviceCgroupRules?: string[];
        /**
         * A list of requests for devices to be sent to device drivers.
         *
         */
        DeviceRequests?: /* A request for devices to be sent to device drivers */ DeviceRequest[];
        /**
         * Hard limit for kernel TCP buffer memory (in bytes). Depending on the
         * OCI runtime in use, this option may be ignored. It is no longer supported
         * by the default (runc) runtime.
         *
         * This field is omitted when empty.
         *
         */
        KernelMemoryTCP?: number; // int64
        /**
         * Memory soft limit in bytes.
         */
        MemoryReservation?: number; // int64
        /**
         * Total memory limit (memory + swap). Set as `-1` to enable unlimited
         * swap.
         *
         */
        MemorySwap?: number; // int64
        /**
         * Tune a container's memory swappiness behavior. Accepts an integer
         * between 0 and 100.
         *
         */
        MemorySwappiness?: number; // int64
        /**
         * CPU quota in units of 10<sup>-9</sup> CPUs.
         */
        NanoCpus?: number; // int64
        /**
         * Disable OOM Killer for the container.
         */
        OomKillDisable?: boolean;
        /**
         * Run an init inside the container that forwards signals and reaps
         * processes. This field is omitted if empty, and the default (as
         * configured on the daemon) is used.
         *
         */
        Init?: boolean;
        /**
         * Tune a container's PIDs limit. Set `0` or `-1` for unlimited, or `null`
         * to not change.
         *
         */
        PidsLimit?: number; // int64
        /**
         * A list of resource limits to set in the container. For example:
         *
         * ```
         * {"Name": "nofile", "Soft": 1024, "Hard": 2048}
         * ```
         *
         */
        Ulimits?: {
            /**
             * Name of ulimit
             */
            Name?: string;
            /**
             * Soft limit
             */
            Soft?: number;
            /**
             * Hard limit
             */
            Hard?: number;
        }[];
        /**
         * The number of usable CPUs (Windows only).
         *
         * On Windows Server containers, the processor resource controls are
         * mutually exclusive. The order of precedence is `CPUCount` first, then
         * `CPUShares`, and `CPUPercent` last.
         *
         */
        CpuCount?: number; // int64
        /**
         * The usable percentage of the available CPUs (Windows only).
         *
         * On Windows Server containers, the processor resource controls are
         * mutually exclusive. The order of precedence is `CPUCount` first, then
         * `CPUShares`, and `CPUPercent` last.
         *
         */
        CpuPercent?: number; // int64
        /**
         * Maximum IOps for the container system drive (Windows only)
         */
        IOMaximumIOps?: number; // int64
        /**
         * Maximum IO in bytes per second for the container system drive
         * (Windows only).
         *
         */
        IOMaximumBandwidth?: number; // int64
        /**
         * A list of volume bindings for this container. Each volume binding
         * is a string in one of these forms:
         *
         * - `host-src:container-dest[:options]` to bind-mount a host path
         *   into the container. Both `host-src`, and `container-dest` must
         *   be an _absolute_ path.
         * - `volume-name:container-dest[:options]` to bind-mount a volume
         *   managed by a volume driver into the container. `container-dest`
         *   must be an _absolute_ path.
         *
         * `options` is an optional, comma-delimited list of:
         *
         * - `nocopy` disables automatic copying of data from the container
         *   path to the volume. The `nocopy` flag only applies to named volumes.
         * - `[ro|rw]` mounts a volume read-only or read-write, respectively.
         *   If omitted or set to `rw`, volumes are mounted read-write.
         * - `[z|Z]` applies SELinux labels to allow or deny multiple containers
         *   to read and write to the same volume.
         *     - `z`: a _shared_ content label is applied to the content. This
         *       label indicates that multiple containers can share the volume
         *       content, for both reading and writing.
         *     - `Z`: a _private unshared_ label is applied to the content.
         *       This label indicates that only the current container can use
         *       a private volume. Labeling systems such as SELinux require
         *       proper labels to be placed on volume content that is mounted
         *       into a container. Without a label, the security system can
         *       prevent a container's processes from using the content. By
         *       default, the labels set by the host operating system are not
         *       modified.
         * - `[[r]shared|[r]slave|[r]private]` specifies mount
         *   [propagation behavior](https://www.kernel.org/doc/Documentation/filesystems/sharedsubtree.txt).
         *   This only applies to bind-mounted volumes, not internal volumes
         *   or named volumes. Mount propagation requires the source mount
         *   point (the location where the source directory is mounted in the
         *   host operating system) to have the correct propagation properties.
         *   For shared volumes, the source mount point must be set to `shared`.
         *   For slave volumes, the mount must be set to either `shared` or
         *   `slave`.
         *
         */
        Binds?: string[];
        /**
         * Path to a file where the container ID is written
         */
        ContainerIDFile?: string;
        /**
         * The logging configuration for this container
         */
        LogConfig?: {
            Type?: "json-file" | "syslog" | "journald" | "gelf" | "fluentd" | "awslogs" | "splunk" | "etwlogs" | "none";
            Config?: {
                [name: string]: string;
            };
        };
        /**
         * Network mode to use for this container. Supported standard values
         * are: `bridge`, `host`, `none`, and `container:<name|id>`. Any
         * other value is taken as a custom network's name to which this
         * container should connect to.
         *
         */
        NetworkMode?: string;
        PortBindings?: /**
         * PortMap describes the mapping of container ports to host ports, using the
         * container's port-number and protocol as key in the format `<port>/<protocol>`,
         * for example, `80/udp`.
         *
         * If a container's port is mapped for multiple protocols, separate entries
         * are added to the mapping table.
         *
         * example:
         * {
         *   "443/tcp": [
         *     {
         *       "HostIp": "127.0.0.1",
         *       "HostPort": "4443"
         *     }
         *   ],
         *   "80/tcp": [
         *     {
         *       "HostIp": "0.0.0.0",
         *       "HostPort": "80"
         *     },
         *     {
         *       "HostIp": "0.0.0.0",
         *       "HostPort": "8080"
         *     }
         *   ],
         *   "80/udp": [
         *     {
         *       "HostIp": "0.0.0.0",
         *       "HostPort": "80"
         *     }
         *   ],
         *   "53/udp": [
         *     {
         *       "HostIp": "0.0.0.0",
         *       "HostPort": "53"
         *     }
         *   ],
         *   "2377/tcp": null
         * }
         */
        PortMap;
        RestartPolicy?: /**
         * The behavior to apply when the container exits. The default is not to
         * restart.
         *
         * An ever increasing delay (double the previous delay, starting at 100ms) is
         * added before each restart to prevent flooding the server.
         *
         */
        RestartPolicy;
        /**
         * Automatically remove the container when the container's process
         * exits. This has no effect if `RestartPolicy` is set.
         *
         */
        AutoRemove?: boolean;
        /**
         * Driver that this container uses to mount volumes.
         */
        VolumeDriver?: string;
        /**
         * A list of volumes to inherit from another container, specified in
         * the form `<container name>[:<ro|rw>]`.
         *
         */
        VolumesFrom?: string[];
        /**
         * Specification for mounts to be added to the container.
         *
         */
        Mounts?: Mount[];
        /**
         * Initial console size, as an `[height, width]` array.
         *
         */
        ConsoleSize?: [
            number,
            number
        ];
        /**
         * Arbitrary non-identifying metadata attached to container and
         * provided to the runtime when the container is started.
         *
         */
        Annotations?: {
            [name: string]: string;
        };
        /**
         * A list of kernel capabilities to add to the container. Conflicts
         * with option 'Capabilities'.
         *
         */
        CapAdd?: string[];
        /**
         * A list of kernel capabilities to drop from the container. Conflicts
         * with option 'Capabilities'.
         *
         */
        CapDrop?: string[];
        /**
         * cgroup namespace mode for the container. Possible values are:
         *
         * - `"private"`: the container runs in its own private cgroup namespace
         * - `"host"`: use the host system's cgroup namespace
         *
         * If not specified, the daemon default is used, which can either be `"private"`
         * or `"host"`, depending on daemon version, kernel support and configuration.
         *
         */
        CgroupnsMode?: "private" | "host";
        /**
         * A list of DNS servers for the container to use.
         */
        Dns?: string[];
        /**
         * A list of DNS options.
         */
        DnsOptions?: string[];
        /**
         * A list of DNS search domains.
         */
        DnsSearch?: string[];
        /**
         * A list of hostnames/IP mappings to add to the container's `/etc/hosts`
         * file. Specified in the form `["hostname:IP"]`.
         *
         */
        ExtraHosts?: string[];
        /**
         * A list of additional groups that the container process will run as.
         *
         */
        GroupAdd?: string[];
        /**
         * IPC sharing mode for the container. Possible values are:
         *
         * - `"none"`: own private IPC namespace, with /dev/shm not mounted
         * - `"private"`: own private IPC namespace
         * - `"shareable"`: own private IPC namespace, with a possibility to share it with other containers
         * - `"container:<name|id>"`: join another (shareable) container's IPC namespace
         * - `"host"`: use the host system's IPC namespace
         *
         * If not specified, daemon default is used, which can either be `"private"`
         * or `"shareable"`, depending on daemon version and configuration.
         *
         */
        IpcMode?: string;
        /**
         * Cgroup to use for the container.
         */
        Cgroup?: string;
        /**
         * A list of links for the container in the form `container_name:alias`.
         *
         */
        Links?: string[];
        /**
         * An integer value containing the score given to the container in
         * order to tune OOM killer preferences.
         *
         * example:
         * 500
         */
        OomScoreAdj?: number;
        /**
         * Set the PID (Process) Namespace mode for the container. It can be
         * either:
         *
         * - `"container:<name|id>"`: joins another container's PID namespace
         * - `"host"`: use the host's PID namespace inside the container
         *
         */
        PidMode?: string;
        /**
         * Gives the container full access to the host.
         */
        Privileged?: boolean;
        /**
         * Allocates an ephemeral host port for all of a container's
         * exposed ports.
         *
         * Ports are de-allocated when the container stops and allocated when
         * the container starts. The allocated port might be changed when
         * restarting the container.
         *
         * The port is selected from the ephemeral port range that depends on
         * the kernel. For example, on Linux the range is defined by
         * `/proc/sys/net/ipv4/ip_local_port_range`.
         *
         */
        PublishAllPorts?: boolean;
        /**
         * Mount the container's root filesystem as read only.
         */
        ReadonlyRootfs?: boolean;
        /**
         * A list of string values to customize labels for MLS systems, such
         * as SELinux.
         *
         */
        SecurityOpt?: string[];
        /**
         * Storage driver options for this container, in the form `{"size": "120G"}`.
         *
         */
        StorageOpt?: {
            [name: string]: string;
        };
        /**
         * A map of container directories which should be replaced by tmpfs
         * mounts, and their corresponding mount options. For example:
         *
         * ```
         * { "/run": "rw,noexec,nosuid,size=65536k" }
         * ```
         *
         */
        Tmpfs?: {
            [name: string]: string;
        };
        /**
         * UTS namespace to use for the container.
         */
        UTSMode?: string;
        /**
         * Sets the usernamespace mode for the container when usernamespace
         * remapping option is enabled.
         *
         */
        UsernsMode?: string;
        /**
         * Size of `/dev/shm` in bytes. If omitted, the system uses 64MB.
         *
         */
        ShmSize?: number; // int64
        /**
         * A list of kernel parameters (sysctls) to set in the container.
         * For example:
         *
         * ```
         * {"net.ipv4.ip_forward": "1"}
         * ```
         *
         */
        Sysctls?: {
            [name: string]: string;
        };
        /**
         * Runtime to use with this container.
         */
        Runtime?: string;
        /**
         * Isolation technology of the container. (Windows only)
         *
         */
        Isolation?: "default" | "process" | "hyperv";
        /**
         * The list of paths to be masked inside the container (this overrides
         * the default set of paths).
         *
         */
        MaskedPaths?: string[];
        /**
         * The list of paths to be set as read-only inside the container
         * (this overrides the default set of paths).
         *
         */
        ReadonlyPaths?: string[];
    }
    export interface IPAM {
        /**
         * Name of the IPAM driver to use.
         * example:
         * default
         */
        Driver?: string;
        /**
         * List of IPAM configuration options, specified as a map:
         *
         * ```
         * {"Subnet": <CIDR>, "IPRange": <CIDR>, "Gateway": <IP address>, "AuxAddress": <device_name:IP address>}
         * ```
         *
         */
        Config?: IPAMConfig[];
        /**
         * Driver-specific options, specified as a map.
         * example:
         * {
         *   "foo": "bar"
         * }
         */
        Options?: {
            [name: string]: string;
        };
    }
    export interface IPAMConfig {
        /**
         * example:
         * 172.20.0.0/16
         */
        Subnet?: string;
        /**
         * example:
         * 172.20.10.0/24
         */
        IPRange?: string;
        /**
         * example:
         * 172.20.10.11
         */
        Gateway?: string;
        AuxiliaryAddresses?: {
            [name: string]: string;
        };
    }
    /**
     * Response to an API call that returns just an Id
     */
    export interface IdResponse {
        /**
         * The id of the newly created object.
         */
        Id: string;
    }
    /**
     * Configuration of the image. These fields are used as defaults
     * when starting a container from the image.
     *
     * example:
     * {
     *   "Hostname": "",
     *   "Domainname": "",
     *   "User": "web:web",
     *   "AttachStdin": false,
     *   "AttachStdout": false,
     *   "AttachStderr": false,
     *   "ExposedPorts": {
     *     "80/tcp": {},
     *     "443/tcp": {}
     *   },
     *   "Tty": false,
     *   "OpenStdin": false,
     *   "StdinOnce": false,
     *   "Env": [
     *     "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
     *   ],
     *   "Cmd": [
     *     "/bin/sh"
     *   ],
     *   "Healthcheck": {
     *     "Test": [
     *       "string"
     *     ],
     *     "Interval": 0,
     *     "Timeout": 0,
     *     "Retries": 0,
     *     "StartPeriod": 0,
     *     "StartInterval": 0
     *   },
     *   "ArgsEscaped": true,
     *   "Image": "",
     *   "Volumes": {
     *     "/app/data": {},
     *     "/app/config": {}
     *   },
     *   "WorkingDir": "/public/",
     *   "Entrypoint": [],
     *   "OnBuild": [],
     *   "Labels": {
     *     "com.example.some-label": "some-value",
     *     "com.example.some-other-label": "some-other-value"
     *   },
     *   "StopSignal": "SIGTERM",
     *   "Shell": [
     *     "/bin/sh",
     *     "-c"
     *   ]
     * }
     */
    export interface ImageConfig {
        /**
         * The hostname to use for the container, as a valid RFC 1123 hostname.
         *
         * <p><br /></p>
         *
         * > **Note**: this field is always empty and must not be used.
         *
         * example:
         *
         */
        Hostname?: string;
        /**
         * The domain name to use for the container.
         *
         * <p><br /></p>
         *
         * > **Note**: this field is always empty and must not be used.
         *
         * example:
         *
         */
        Domainname?: string;
        /**
         * The user that commands are run as inside the container.
         * example:
         * web:web
         */
        User?: string;
        /**
         * Whether to attach to `stdin`.
         *
         * <p><br /></p>
         *
         * > **Note**: this field is always false and must not be used.
         *
         * example:
         * false
         */
        AttachStdin?: boolean;
        /**
         * Whether to attach to `stdout`.
         *
         * <p><br /></p>
         *
         * > **Note**: this field is always false and must not be used.
         *
         * example:
         * false
         */
        AttachStdout?: boolean;
        /**
         * Whether to attach to `stderr`.
         *
         * <p><br /></p>
         *
         * > **Note**: this field is always false and must not be used.
         *
         * example:
         * false
         */
        AttachStderr?: boolean;
        /**
         * An object mapping ports to an empty object in the form:
         *
         * `{"<port>/<tcp|udp|sctp>": {}}`
         *
         * example:
         * {
         *   "80/tcp": {},
         *   "443/tcp": {}
         * }
         */
        ExposedPorts?: {
            [name: string]: "[object Object]";
        };
        /**
         * Attach standard streams to a TTY, including `stdin` if it is not closed.
         *
         * <p><br /></p>
         *
         * > **Note**: this field is always false and must not be used.
         *
         * example:
         * false
         */
        Tty?: boolean;
        /**
         * Open `stdin`
         *
         * <p><br /></p>
         *
         * > **Note**: this field is always false and must not be used.
         *
         * example:
         * false
         */
        OpenStdin?: boolean;
        /**
         * Close `stdin` after one attached client disconnects.
         *
         * <p><br /></p>
         *
         * > **Note**: this field is always false and must not be used.
         *
         * example:
         * false
         */
        StdinOnce?: boolean;
        /**
         * A list of environment variables to set inside the container in the
         * form `["VAR=value", ...]`. A variable without `=` is removed from the
         * environment, rather than to have an empty value.
         *
         * example:
         * [
         *   "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
         * ]
         */
        Env?: string[];
        /**
         * Command to run specified as a string or an array of strings.
         *
         * example:
         * [
         *   "/bin/sh"
         * ]
         */
        Cmd?: string[];
        Healthcheck?: /* A test to perform to check that the container is healthy. */ HealthConfig;
        /**
         * Command is already escaped (Windows only)
         * example:
         * false
         */
        ArgsEscaped?: boolean;
        /**
         * The name (or reference) of the image to use when creating the container,
         * or which was used when the container was created.
         *
         * <p><br /></p>
         *
         * > **Note**: this field is always empty and must not be used.
         *
         * example:
         *
         */
        Image?: string;
        /**
         * An object mapping mount point paths inside the container to empty
         * objects.
         *
         * example:
         * {
         *   "/app/data": {},
         *   "/app/config": {}
         * }
         */
        Volumes?: {
            [name: string]: "[object Object]";
        };
        /**
         * The working directory for commands to run in.
         * example:
         * /public/
         */
        WorkingDir?: string;
        /**
         * The entry point for the container as a string or an array of strings.
         *
         * If the array consists of exactly one empty string (`[""]`) then the
         * entry point is reset to system default (i.e., the entry point used by
         * docker when there is no `ENTRYPOINT` instruction in the `Dockerfile`).
         *
         * example:
         * []
         */
        Entrypoint?: string[];
        /**
         * Disable networking for the container.
         *
         * <p><br /></p>
         *
         * > **Note**: this field is always omitted and must not be used.
         *
         * example:
         * false
         */
        NetworkDisabled?: boolean;
        /**
         * MAC address of the container.
         *
         * <p><br /></p>
         *
         * > **Note**: this field is always omitted and must not be used.
         *
         * example:
         *
         */
        MacAddress?: string;
        /**
         * `ONBUILD` metadata that were defined in the image's `Dockerfile`.
         *
         * example:
         * []
         */
        OnBuild?: string[];
        /**
         * User-defined key/value metadata.
         * example:
         * {
         *   "com.example.some-label": "some-value",
         *   "com.example.some-other-label": "some-other-value"
         * }
         */
        Labels?: {
            [name: string]: string;
        };
        /**
         * Signal to stop a container as a string or unsigned integer.
         *
         * example:
         * SIGTERM
         */
        StopSignal?: string;
        /**
         * Timeout to stop a container in seconds.
         *
         * <p><br /></p>
         *
         * > **Note**: this field is always omitted and must not be used.
         *
         */
        StopTimeout?: number;
        /**
         * Shell for when `RUN`, `CMD`, and `ENTRYPOINT` uses a shell.
         *
         * example:
         * [
         *   "/bin/sh",
         *   "-c"
         * ]
         */
        Shell?: string[];
    }
    export interface ImageDeleteResponseItem {
        /**
         * The image ID of an image that was untagged
         */
        Untagged?: string;
        /**
         * The image ID of an image that was deleted
         */
        Deleted?: string;
    }
    /**
     * Image ID or Digest
     * example:
     * {
     *   "ID": "sha256:85f05633ddc1c50679be2b16a0479ab6f7637f8884e0cfe0f4d20e1ebb3d6e7c"
     * }
     */
    export interface ImageID {
        ID?: string;
    }
    /**
     * Information about an image in the local image cache.
     *
     */
    export interface ImageInspect {
        /**
         * ID is the content-addressable ID of an image.
         *
         * This identifier is a content-addressable digest calculated from the
         * image's configuration (which includes the digests of layers used by
         * the image).
         *
         * Note that this digest differs from the `RepoDigests` below, which
         * holds digests of image manifests that reference the image.
         *
         * example:
         * sha256:ec3f0931a6e6b6855d76b2d7b0be30e81860baccd891b2e243280bf1cd8ad710
         */
        Id?: string;
        /**
         * List of image names/tags in the local image cache that reference this
         * image.
         *
         * Multiple image tags can refer to the same image, and this list may be
         * empty if no tags reference the image, in which case the image is
         * "untagged", in which case it can still be referenced by its ID.
         *
         * example:
         * [
         *   "example:1.0",
         *   "example:latest",
         *   "example:stable",
         *   "internal.registry.example.com:5000/example:1.0"
         * ]
         */
        RepoTags?: string[];
        /**
         * List of content-addressable digests of locally available image manifests
         * that the image is referenced from. Multiple manifests can refer to the
         * same image.
         *
         * These digests are usually only available if the image was either pulled
         * from a registry, or if the image was pushed to a registry, which is when
         * the manifest is generated and its digest calculated.
         *
         * example:
         * [
         *   "example@sha256:afcc7f1ac1b49db317a7196c902e61c6c3c4607d63599ee1a82d702d249a0ccb",
         *   "internal.registry.example.com:5000/example@sha256:b69959407d21e8a062e0416bf13405bb2b71ed7a84dde4158ebafacfa06f5578"
         * ]
         */
        RepoDigests?: string[];
        /**
         * ID of the parent image.
         *
         * Depending on how the image was created, this field may be empty and
         * is only set for images that were built/created locally. This field
         * is empty if the image was pulled from an image registry.
         *
         * example:
         *
         */
        Parent?: string;
        /**
         * Optional message that was set when committing or importing the image.
         *
         * example:
         *
         */
        Comment?: string;
        /**
         * Date and time at which the image was created, formatted in
         * [RFC 3339](https://www.ietf.org/rfc/rfc3339.txt) format with nano-seconds.
         *
         * example:
         * 2022-02-04T21:20:12.497794809Z
         */
        Created?: string;
        /**
         * The ID of the container that was used to create the image.
         *
         * Depending on how the image was created, this field may be empty.
         *
         * example:
         * 65974bc86f1770ae4bff79f651ebdbce166ae9aada632ee3fa9af3a264911735
         */
        Container?: string;
        ContainerConfig?: /**
         * Configuration for a container that is portable between hosts.
         *
         * When used as `ContainerConfig` field in an image, `ContainerConfig` is an
         * optional field containing the configuration of the container that was last
         * committed when creating the image.
         *
         * Previous versions of Docker builder used this field to store build cache,
         * and it is not in active use anymore.
         *
         */
        ContainerConfig;
        /**
         * The version of Docker that was used to build the image.
         *
         * Depending on how the image was created, this field may be empty.
         *
         * example:
         * 20.10.7
         */
        DockerVersion?: string;
        /**
         * Name of the author that was specified when committing the image, or as
         * specified through MAINTAINER (deprecated) in the Dockerfile.
         *
         * example:
         *
         */
        Author?: string;
        Config?: /**
         * Configuration of the image. These fields are used as defaults
         * when starting a container from the image.
         *
         * example:
         * {
         *   "Hostname": "",
         *   "Domainname": "",
         *   "User": "web:web",
         *   "AttachStdin": false,
         *   "AttachStdout": false,
         *   "AttachStderr": false,
         *   "ExposedPorts": {
         *     "80/tcp": {},
         *     "443/tcp": {}
         *   },
         *   "Tty": false,
         *   "OpenStdin": false,
         *   "StdinOnce": false,
         *   "Env": [
         *     "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
         *   ],
         *   "Cmd": [
         *     "/bin/sh"
         *   ],
         *   "Healthcheck": {
         *     "Test": [
         *       "string"
         *     ],
         *     "Interval": 0,
         *     "Timeout": 0,
         *     "Retries": 0,
         *     "StartPeriod": 0,
         *     "StartInterval": 0
         *   },
         *   "ArgsEscaped": true,
         *   "Image": "",
         *   "Volumes": {
         *     "/app/data": {},
         *     "/app/config": {}
         *   },
         *   "WorkingDir": "/public/",
         *   "Entrypoint": [],
         *   "OnBuild": [],
         *   "Labels": {
         *     "com.example.some-label": "some-value",
         *     "com.example.some-other-label": "some-other-value"
         *   },
         *   "StopSignal": "SIGTERM",
         *   "Shell": [
         *     "/bin/sh",
         *     "-c"
         *   ]
         * }
         */
        ImageConfig;
        /**
         * Hardware CPU architecture that the image runs on.
         *
         * example:
         * arm
         */
        Architecture?: string;
        /**
         * CPU architecture variant (presently ARM-only).
         *
         * example:
         * v7
         */
        Variant?: string;
        /**
         * Operating System the image is built to run on.
         *
         * example:
         * linux
         */
        Os?: string;
        /**
         * Operating System version the image is built to run on (especially
         * for Windows).
         *
         * example:
         *
         */
        OsVersion?: string;
        /**
         * Total size of the image including all layers it is composed of.
         *
         * example:
         * 1239828
         */
        Size?: number; // int64
        /**
         * Total size of the image including all layers it is composed of.
         *
         * In versions of Docker before v1.10, this field was calculated from
         * the image itself and all of its parent images. Images are now stored
         * self-contained, and no longer use a parent-chain, making this field
         * an equivalent of the Size field.
         *
         * > **Deprecated**: this field is kept for backward compatibility, but
         * > will be removed in API v1.44.
         *
         * example:
         * 1239828
         */
        VirtualSize?: number; // int64
        GraphDriver?: /**
         * Information about the storage driver used to store the container's and
         * image's filesystem.
         *
         */
        GraphDriverData;
        /**
         * Information about the image's RootFS, including the layer IDs.
         *
         */
        RootFS?: {
            /**
             * example:
             * layers
             */
            Type: string;
            /**
             * example:
             * [
             *   "sha256:1834950e52ce4d5a88a1bbd131c537f4d0e56d10ff0dd69e66be3b7dfa9df7e6",
             *   "sha256:5f70bf18a086007016e948b04aed3b82103a36bea41755b6cddfaf10ace3c6ef"
             * ]
             */
            Layers?: string[];
        };
        /**
         * Additional metadata of the image in the local cache. This information
         * is local to the daemon, and not part of the image itself.
         *
         */
        Metadata?: {
            /**
             * Date and time at which the image was last tagged in
             * [RFC 3339](https://www.ietf.org/rfc/rfc3339.txt) format with nano-seconds.
             *
             * This information is only available if the image was tagged locally,
             * and omitted otherwise.
             *
             * example:
             * 2022-02-28T14:40:02.623929178Z
             */
            LastTagTime?: string; // dateTime
        };
    }
    export interface ImageSummary {
        /**
         * ID is the content-addressable ID of an image.
         *
         * This identifier is a content-addressable digest calculated from the
         * image's configuration (which includes the digests of layers used by
         * the image).
         *
         * Note that this digest differs from the `RepoDigests` below, which
         * holds digests of image manifests that reference the image.
         *
         * example:
         * sha256:ec3f0931a6e6b6855d76b2d7b0be30e81860baccd891b2e243280bf1cd8ad710
         */
        Id: string;
        /**
         * ID of the parent image.
         *
         * Depending on how the image was created, this field may be empty and
         * is only set for images that were built/created locally. This field
         * is empty if the image was pulled from an image registry.
         *
         * example:
         *
         */
        ParentId: string;
        /**
         * List of image names/tags in the local image cache that reference this
         * image.
         *
         * Multiple image tags can refer to the same image, and this list may be
         * empty if no tags reference the image, in which case the image is
         * "untagged", in which case it can still be referenced by its ID.
         *
         * example:
         * [
         *   "example:1.0",
         *   "example:latest",
         *   "example:stable",
         *   "internal.registry.example.com:5000/example:1.0"
         * ]
         */
        RepoTags: string[];
        /**
         * List of content-addressable digests of locally available image manifests
         * that the image is referenced from. Multiple manifests can refer to the
         * same image.
         *
         * These digests are usually only available if the image was either pulled
         * from a registry, or if the image was pushed to a registry, which is when
         * the manifest is generated and its digest calculated.
         *
         * example:
         * [
         *   "example@sha256:afcc7f1ac1b49db317a7196c902e61c6c3c4607d63599ee1a82d702d249a0ccb",
         *   "internal.registry.example.com:5000/example@sha256:b69959407d21e8a062e0416bf13405bb2b71ed7a84dde4158ebafacfa06f5578"
         * ]
         */
        RepoDigests: string[];
        /**
         * Date and time at which the image was created as a Unix timestamp
         * (number of seconds since EPOCH).
         *
         * example:
         * 1644009612
         */
        Created: number;
        /**
         * Total size of the image including all layers it is composed of.
         *
         * example:
         * 172064416
         */
        Size: number; // int64
        /**
         * Total size of image layers that are shared between this image and other
         * images.
         *
         * This size is not calculated by default. `-1` indicates that the value
         * has not been set / calculated.
         *
         * example:
         * 1239828
         */
        SharedSize: number; // int64
        /**
         * Total size of the image including all layers it is composed of.
         *
         * In versions of Docker before v1.10, this field was calculated from
         * the image itself and all of its parent images. Images are now stored
         * self-contained, and no longer use a parent-chain, making this field
         * an equivalent of the Size field.
         *
         * Deprecated: this field is kept for backward compatibility, and will be removed in API v1.44.
         * example:
         * 172064416
         */
        VirtualSize?: number; // int64
        /**
         * User-defined key/value metadata.
         * example:
         * {
         *   "com.example.some-label": "some-value",
         *   "com.example.some-other-label": "some-other-value"
         * }
         */
        Labels: {
            [name: string]: string;
        };
        /**
         * Number of containers using this image. Includes both stopped and running
         * containers.
         *
         * This size is not calculated by default, and depends on which API endpoint
         * is used. `-1` indicates that the value has not been set / calculated.
         *
         * example:
         * 2
         */
        Containers: number;
    }
    /**
     * IndexInfo contains information about a registry.
     */
    export interface IndexInfo {
        /**
         * Name of the registry, such as "docker.io".
         *
         * example:
         * docker.io
         */
        Name?: string;
        /**
         * List of mirrors, expressed as URIs.
         *
         * example:
         * [
         *   "https://hub-mirror.corp.example.com:5000/",
         *   "https://registry-2.docker.io/",
         *   "https://registry-3.docker.io/"
         * ]
         */
        Mirrors?: string[];
        /**
         * Indicates if the registry is part of the list of insecure
         * registries.
         *
         * If `false`, the registry is insecure. Insecure registries accept
         * un-encrypted (HTTP) and/or untrusted (HTTPS with certificates from
         * unknown CAs) communication.
         *
         * > **Warning**: Insecure registries can be useful when running a local
         * > registry. However, because its use creates security vulnerabilities
         * > it should ONLY be enabled for testing purposes. For increased
         * > security, users should add their CA to their system's list of
         * > trusted CAs instead of enabling this option.
         *
         * example:
         * true
         */
        Secure?: boolean;
        /**
         * Indicates whether this is an official registry (i.e., Docker Hub / docker.io)
         *
         * example:
         * true
         */
        Official?: boolean;
    }
    /**
     * JoinTokens contains the tokens workers and managers need to join the swarm.
     *
     */
    export interface JoinTokens {
        /**
         * The token workers can use to join the swarm.
         *
         * example:
         * SWMTKN-1-3pu6hszjas19xyp7ghgosyx9k8atbfcr8p2is99znpy26u2lkl-1awxwuwd3z9j1z3puu7rcgdbx
         */
        Worker?: string;
        /**
         * The token managers can use to join the swarm.
         *
         * example:
         * SWMTKN-1-3pu6hszjas19xyp7ghgosyx9k8atbfcr8p2is99znpy26u2lkl-7p73s1dx5in4tatdymyhg9hu2
         */
        Manager?: string;
    }
    /**
     * An object describing a limit on resources which can be requested by a task.
     *
     */
    export interface Limit {
        /**
         * example:
         * 4000000000
         */
        NanoCPUs?: number; // int64
        /**
         * example:
         * 8272408576
         */
        MemoryBytes?: number; // int64
        /**
         * Limits the maximum number of PIDs in the container. Set `0` for unlimited.
         *
         * example:
         * 100
         */
        Pids?: number; // int64
    }
    /**
     * Current local status of this node.
     * example:
     * active
     */
    export type LocalNodeState = "" | "inactive" | "pending" | "active" | "error" | "locked";
    /**
     * ManagerStatus represents the status of a manager.
     *
     * It provides the current status of a node's manager component, if the node
     * is a manager.
     *
     */
    export interface ManagerStatus {
        /**
         * example:
         * true
         */
        Leader?: boolean;
        Reachability?: /**
         * Reachability represents the reachability of a node.
         * example:
         * reachable
         */
        Reachability;
        /**
         * The IP address and port at which the manager is reachable.
         *
         * example:
         * 10.0.0.46:2377
         */
        Addr?: string;
    }
    export interface Mount {
        /**
         * Container path.
         */
        Target?: string;
        /**
         * Mount source (e.g. a volume name, a host path).
         */
        Source?: string;
        /**
         * The mount type. Available types:
         *
         * - `bind` Mounts a file or directory from the host into the container. Must exist prior to creating the container.
         * - `volume` Creates a volume with the given name and options (or uses a pre-existing volume with the same name and options). These are **not** removed when the container is removed.
         * - `tmpfs` Create a tmpfs with the given options. The mount source cannot be specified for tmpfs.
         * - `npipe` Mounts a named pipe from the host into the container. Must exist prior to creating the container.
         * - `cluster` a Swarm cluster volume
         *
         */
        Type?: "bind" | "volume" | "tmpfs" | "npipe" | "cluster";
        /**
         * Whether the mount should be read-only.
         */
        ReadOnly?: boolean;
        /**
         * The consistency requirement for the mount: `default`, `consistent`, `cached`, or `delegated`.
         */
        Consistency?: string;
        /**
         * Optional configuration for the `bind` type.
         */
        BindOptions?: {
            /**
             * A propagation mode with the value `[r]private`, `[r]shared`, or `[r]slave`.
             */
            Propagation?: "private" | "rprivate" | "shared" | "rshared" | "slave" | "rslave";
            /**
             * Disable recursive bind mount.
             */
            NonRecursive?: boolean;
            /**
             * Create mount point on host if missing
             */
            CreateMountpoint?: boolean;
        };
        /**
         * Optional configuration for the `volume` type.
         */
        VolumeOptions?: {
            /**
             * Populate volume with data from the target.
             */
            NoCopy?: boolean;
            /**
             * User-defined key/value metadata.
             */
            Labels?: {
                [name: string]: string;
            };
            /**
             * Map of driver specific options
             */
            DriverConfig?: {
                /**
                 * Name of the driver to use to create the volume.
                 */
                Name?: string;
                /**
                 * key/value map of driver specific options.
                 */
                Options?: {
                    [name: string]: string;
                };
            };
        };
        /**
         * Optional configuration for the `tmpfs` type.
         */
        TmpfsOptions?: {
            /**
             * The size for the tmpfs mount in bytes.
             */
            SizeBytes?: number; // int64
            /**
             * The permission mode for the tmpfs mount in an integer.
             */
            Mode?: number;
        };
    }
    /**
     * MountPoint represents a mount point configuration inside the container.
     * This is used for reporting the mountpoints in use by a container.
     *
     */
    export interface MountPoint {
        /**
         * The mount type:
         *
         * - `bind` a mount of a file or directory from the host into the container.
         * - `volume` a docker volume with the given `Name`.
         * - `tmpfs` a `tmpfs`.
         * - `npipe` a named pipe from the host into the container.
         * - `cluster` a Swarm cluster volume
         *
         * example:
         * volume
         */
        Type?: "bind" | "volume" | "tmpfs" | "npipe" | "cluster";
        /**
         * Name is the name reference to the underlying data defined by `Source`
         * e.g., the volume name.
         *
         * example:
         * myvolume
         */
        Name?: string;
        /**
         * Source location of the mount.
         *
         * For volumes, this contains the storage location of the volume (within
         * `/var/lib/docker/volumes/`). For bind-mounts, and `npipe`, this contains
         * the source (host) part of the bind-mount. For `tmpfs` mount points, this
         * field is empty.
         *
         * example:
         * /var/lib/docker/volumes/myvolume/_data
         */
        Source?: string;
        /**
         * Destination is the path relative to the container root (`/`) where
         * the `Source` is mounted inside the container.
         *
         * example:
         * /usr/share/nginx/html/
         */
        Destination?: string;
        /**
         * Driver is the volume driver used to create the volume (if it is a volume).
         *
         * example:
         * local
         */
        Driver?: string;
        /**
         * Mode is a comma separated list of options supplied by the user when
         * creating the bind/volume mount.
         *
         * The default is platform-specific (`"z"` on Linux, empty on Windows).
         *
         * example:
         * z
         */
        Mode?: string;
        /**
         * Whether the mount is mounted writable (read-write).
         *
         * example:
         * true
         */
        RW?: boolean;
        /**
         * Propagation describes how mounts are propagated from the host into the
         * mount point, and vice-versa. Refer to the [Linux kernel documentation](https://www.kernel.org/doc/Documentation/filesystems/sharedsubtree.txt)
         * for details. This field is not used on Windows.
         *
         * example:
         *
         */
        Propagation?: string;
    }
    export interface Network {
        /**
         * Name of the network.
         *
         * example:
         * my_network
         */
        Name?: string;
        /**
         * ID that uniquely identifies a network on a single machine.
         *
         * example:
         * 7d86d31b1478e7cca9ebed7e73aa0fdeec46c5ca29497431d3007d2d9e15ed99
         */
        Id?: string;
        /**
         * Date and time at which the network was created in
         * [RFC 3339](https://www.ietf.org/rfc/rfc3339.txt) format with nano-seconds.
         *
         * example:
         * 2016-10-19T04:33:30.360899459Z
         */
        Created?: string; // dateTime
        /**
         * The level at which the network exists (e.g. `swarm` for cluster-wide
         * or `local` for machine level)
         *
         * example:
         * local
         */
        Scope?: string;
        /**
         * The name of the driver used to create the network (e.g. `bridge`,
         * `overlay`).
         *
         * example:
         * overlay
         */
        Driver?: string;
        /**
         * Whether the network was created with IPv6 enabled.
         *
         * example:
         * false
         */
        EnableIPv6?: boolean;
        IPAM?: IPAM;
        /**
         * Whether the network is created to only allow internal networking
         * connectivity.
         *
         * example:
         * false
         */
        Internal?: boolean;
        /**
         * Whether a global / swarm scope network is manually attachable by regular
         * containers from workers in swarm mode.
         *
         * example:
         * false
         */
        Attachable?: boolean;
        /**
         * Whether the network is providing the routing-mesh for the swarm cluster.
         *
         * example:
         * false
         */
        Ingress?: boolean;
        ConfigFrom?: /**
         * The config-only network source to provide the configuration for
         * this network.
         *
         */
        ConfigReference;
        /**
         * Whether the network is a config-only network. Config-only networks are
         * placeholder networks for network configurations to be used by other
         * networks. Config-only networks cannot be used directly to run containers
         * or services.
         *
         */
        ConfigOnly?: boolean;
        /**
         * Contains endpoints attached to the network.
         *
         * example:
         * {
         *   "19a4d5d687db25203351ed79d478946f861258f018fe384f229f2efa4b23513c": {
         *     "Name": "test",
         *     "EndpointID": "628cadb8bcb92de107b2a1e516cbffe463e321f548feb37697cce00ad694f21a",
         *     "MacAddress": "02:42:ac:13:00:02",
         *     "IPv4Address": "172.19.0.2/16",
         *     "IPv6Address": ""
         *   }
         * }
         */
        Containers?: {
            [name: string]: NetworkContainer;
        };
        /**
         * Network-specific options uses when creating the network.
         *
         * example:
         * {
         *   "com.docker.network.bridge.default_bridge": "true",
         *   "com.docker.network.bridge.enable_icc": "true",
         *   "com.docker.network.bridge.enable_ip_masquerade": "true",
         *   "com.docker.network.bridge.host_binding_ipv4": "0.0.0.0",
         *   "com.docker.network.bridge.name": "docker0",
         *   "com.docker.network.driver.mtu": "1500"
         * }
         */
        Options?: {
            [name: string]: string;
        };
        /**
         * User-defined key/value metadata.
         * example:
         * {
         *   "com.example.some-label": "some-value",
         *   "com.example.some-other-label": "some-other-value"
         * }
         */
        Labels?: {
            [name: string]: string;
        };
        /**
         * List of peer nodes for an overlay network. This field is only present
         * for overlay networks, and omitted for other network types.
         *
         */
        Peers?: /**
         * PeerInfo represents one peer of an overlay network.
         *
         */
        PeerInfo[];
    }
    /**
     * Specifies how a service should be attached to a particular network.
     *
     */
    export interface NetworkAttachmentConfig {
        /**
         * The target network for attachment. Must be a network name or ID.
         *
         */
        Target?: string;
        /**
         * Discoverable alternate names for the service on this network.
         *
         */
        Aliases?: string[];
        /**
         * Driver attachment options for the network target.
         *
         */
        DriverOpts?: {
            [name: string]: string;
        };
    }
    export interface NetworkContainer {
        /**
         * example:
         * container_1
         */
        Name?: string;
        /**
         * example:
         * 628cadb8bcb92de107b2a1e516cbffe463e321f548feb37697cce00ad694f21a
         */
        EndpointID?: string;
        /**
         * example:
         * 02:42:ac:13:00:02
         */
        MacAddress?: string;
        /**
         * example:
         * 172.19.0.2/16
         */
        IPv4Address?: string;
        /**
         * example:
         *
         */
        IPv6Address?: string;
    }
    /**
     * NetworkSettings exposes the network settings in the API
     */
    export interface NetworkSettings {
        /**
         * Name of the network's bridge (for example, `docker0`).
         * example:
         * docker0
         */
        Bridge?: string;
        /**
         * SandboxID uniquely represents a container's network stack.
         * example:
         * 9d12daf2c33f5959c8bf90aa513e4f65b561738661003029ec84830cd503a0c3
         */
        SandboxID?: string;
        /**
         * Indicates if hairpin NAT should be enabled on the virtual interface.
         *
         * example:
         * false
         */
        HairpinMode?: boolean;
        /**
         * IPv6 unicast address using the link-local prefix.
         * example:
         * fe80::42:acff:fe11:1
         */
        LinkLocalIPv6Address?: string;
        /**
         * Prefix length of the IPv6 unicast address.
         * example:
         * 64
         */
        LinkLocalIPv6PrefixLen?: number;
        Ports?: /**
         * PortMap describes the mapping of container ports to host ports, using the
         * container's port-number and protocol as key in the format `<port>/<protocol>`,
         * for example, `80/udp`.
         *
         * If a container's port is mapped for multiple protocols, separate entries
         * are added to the mapping table.
         *
         * example:
         * {
         *   "443/tcp": [
         *     {
         *       "HostIp": "127.0.0.1",
         *       "HostPort": "4443"
         *     }
         *   ],
         *   "80/tcp": [
         *     {
         *       "HostIp": "0.0.0.0",
         *       "HostPort": "80"
         *     },
         *     {
         *       "HostIp": "0.0.0.0",
         *       "HostPort": "8080"
         *     }
         *   ],
         *   "80/udp": [
         *     {
         *       "HostIp": "0.0.0.0",
         *       "HostPort": "80"
         *     }
         *   ],
         *   "53/udp": [
         *     {
         *       "HostIp": "0.0.0.0",
         *       "HostPort": "53"
         *     }
         *   ],
         *   "2377/tcp": null
         * }
         */
        PortMap;
        /**
         * SandboxKey identifies the sandbox
         * example:
         * /var/run/docker/netns/8ab54b426c38
         */
        SandboxKey?: string;
        /**
         *
         */
        SecondaryIPAddresses?: /* Address represents an IPv4 or IPv6 IP address. */ Address[];
        /**
         *
         */
        SecondaryIPv6Addresses?: /* Address represents an IPv4 or IPv6 IP address. */ Address[];
        /**
         * EndpointID uniquely represents a service endpoint in a Sandbox.
         *
         * <p><br /></p>
         *
         * > **Deprecated**: This field is only propagated when attached to the
         * > default "bridge" network. Use the information from the "bridge"
         * > network inside the `Networks` map instead, which contains the same
         * > information. This field was deprecated in Docker 1.9 and is scheduled
         * > to be removed in Docker 17.12.0
         *
         * example:
         * b88f5b905aabf2893f3cbc4ee42d1ea7980bbc0a92e2c8922b1e1795298afb0b
         */
        EndpointID?: string;
        /**
         * Gateway address for the default "bridge" network.
         *
         * <p><br /></p>
         *
         * > **Deprecated**: This field is only propagated when attached to the
         * > default "bridge" network. Use the information from the "bridge"
         * > network inside the `Networks` map instead, which contains the same
         * > information. This field was deprecated in Docker 1.9 and is scheduled
         * > to be removed in Docker 17.12.0
         *
         * example:
         * 172.17.0.1
         */
        Gateway?: string;
        /**
         * Global IPv6 address for the default "bridge" network.
         *
         * <p><br /></p>
         *
         * > **Deprecated**: This field is only propagated when attached to the
         * > default "bridge" network. Use the information from the "bridge"
         * > network inside the `Networks` map instead, which contains the same
         * > information. This field was deprecated in Docker 1.9 and is scheduled
         * > to be removed in Docker 17.12.0
         *
         * example:
         * 2001:db8::5689
         */
        GlobalIPv6Address?: string;
        /**
         * Mask length of the global IPv6 address.
         *
         * <p><br /></p>
         *
         * > **Deprecated**: This field is only propagated when attached to the
         * > default "bridge" network. Use the information from the "bridge"
         * > network inside the `Networks` map instead, which contains the same
         * > information. This field was deprecated in Docker 1.9 and is scheduled
         * > to be removed in Docker 17.12.0
         *
         * example:
         * 64
         */
        GlobalIPv6PrefixLen?: number;
        /**
         * IPv4 address for the default "bridge" network.
         *
         * <p><br /></p>
         *
         * > **Deprecated**: This field is only propagated when attached to the
         * > default "bridge" network. Use the information from the "bridge"
         * > network inside the `Networks` map instead, which contains the same
         * > information. This field was deprecated in Docker 1.9 and is scheduled
         * > to be removed in Docker 17.12.0
         *
         * example:
         * 172.17.0.4
         */
        IPAddress?: string;
        /**
         * Mask length of the IPv4 address.
         *
         * <p><br /></p>
         *
         * > **Deprecated**: This field is only propagated when attached to the
         * > default "bridge" network. Use the information from the "bridge"
         * > network inside the `Networks` map instead, which contains the same
         * > information. This field was deprecated in Docker 1.9 and is scheduled
         * > to be removed in Docker 17.12.0
         *
         * example:
         * 16
         */
        IPPrefixLen?: number;
        /**
         * IPv6 gateway address for this network.
         *
         * <p><br /></p>
         *
         * > **Deprecated**: This field is only propagated when attached to the
         * > default "bridge" network. Use the information from the "bridge"
         * > network inside the `Networks` map instead, which contains the same
         * > information. This field was deprecated in Docker 1.9 and is scheduled
         * > to be removed in Docker 17.12.0
         *
         * example:
         * 2001:db8:2::100
         */
        IPv6Gateway?: string;
        /**
         * MAC address for the container on the default "bridge" network.
         *
         * <p><br /></p>
         *
         * > **Deprecated**: This field is only propagated when attached to the
         * > default "bridge" network. Use the information from the "bridge"
         * > network inside the `Networks` map instead, which contains the same
         * > information. This field was deprecated in Docker 1.9 and is scheduled
         * > to be removed in Docker 17.12.0
         *
         * example:
         * 02:42:ac:11:00:04
         */
        MacAddress?: string;
        /**
         * Information about all networks that the container is connected to.
         *
         */
        Networks?: {
            [name: string]: /* Configuration for a network endpoint. */ EndpointSettings;
        };
    }
    /**
     * NetworkingConfig represents the container's networking configuration for
     * each of its interfaces.
     * It is used for the networking configs specified in the `docker create`
     * and `docker network connect` commands.
     *
     * example:
     * {
     *   "EndpointsConfig": {
     *     "isolated_nw": {
     *       "IPAMConfig": {
     *         "IPv4Address": "172.20.30.33",
     *         "IPv6Address": "2001:db8:abcd::3033",
     *         "LinkLocalIPs": [
     *           "169.254.34.68",
     *           "fe80::3468"
     *         ]
     *       },
     *       "Links": [
     *         "container_1",
     *         "container_2"
     *       ],
     *       "Aliases": [
     *         "server_x",
     *         "server_y"
     *       ]
     *     }
     *   }
     * }
     */
    export interface NetworkingConfig {
        /**
         * A mapping of network name to endpoint configuration for that network.
         *
         */
        EndpointsConfig?: {
            [name: string]: /* Configuration for a network endpoint. */ EndpointSettings;
        };
    }
    export interface Node {
        /**
         * example:
         * 24ifsmvkjbyhk
         */
        ID?: string;
        Version?: /**
         * The version number of the object such as node, service, etc. This is needed
         * to avoid conflicting writes. The client must send the version number along
         * with the modified specification when updating these objects.
         *
         * This approach ensures safe concurrency and determinism in that the change
         * on the object may not be applied if the version number has changed from the
         * last read. In other words, if two update requests specify the same base
         * version, only one of the requests can succeed. As a result, two separate
         * update requests that happen at the same time will not unintentionally
         * overwrite each other.
         *
         */
        ObjectVersion;
        /**
         * Date and time at which the node was added to the swarm in
         * [RFC 3339](https://www.ietf.org/rfc/rfc3339.txt) format with nano-seconds.
         *
         * example:
         * 2016-08-18T10:44:24.496525531Z
         */
        CreatedAt?: string; // dateTime
        /**
         * Date and time at which the node was last updated in
         * [RFC 3339](https://www.ietf.org/rfc/rfc3339.txt) format with nano-seconds.
         *
         * example:
         * 2017-08-09T07:09:37.632105588Z
         */
        UpdatedAt?: string; // dateTime
        Spec?: /**
         * example:
         * {
         *   "Availability": "active",
         *   "Name": "node-name",
         *   "Role": "manager",
         *   "Labels": {
         *     "foo": "bar"
         *   }
         * }
         */
        NodeSpec;
        Description?: /**
         * NodeDescription encapsulates the properties of the Node as reported by the
         * agent.
         *
         */
        NodeDescription;
        Status?: /**
         * NodeStatus represents the status of a node.
         *
         * It provides the current status of the node, as seen by the manager.
         *
         */
        NodeStatus;
        ManagerStatus?: /**
         * ManagerStatus represents the status of a manager.
         *
         * It provides the current status of a node's manager component, if the node
         * is a manager.
         *
         */
        ManagerStatus;
    }
    /**
     * NodeDescription encapsulates the properties of the Node as reported by the
     * agent.
     *
     */
    export interface NodeDescription {
        /**
         * example:
         * bf3067039e47
         */
        Hostname?: string;
        Platform?: /**
         * Platform represents the platform (Arch/OS).
         *
         */
        Platform;
        Resources?: /**
         * An object describing the resources which can be advertised by a node and
         * requested by a task.
         *
         */
        ResourceObject;
        Engine?: /* EngineDescription provides information about an engine. */ EngineDescription;
        TLSInfo?: /**
         * Information about the issuer of leaf TLS certificates and the trusted root
         * CA certificate.
         *
         * example:
         * {
         *   "TrustRoot": "-----BEGIN CERTIFICATE-----\nMIIBajCCARCgAwIBAgIUbYqrLSOSQHoxD8CwG6Bi2PJi9c8wCgYIKoZIzj0EAwIw\nEzERMA8GA1UEAxMIc3dhcm0tY2EwHhcNMTcwNDI0MjE0MzAwWhcNMzcwNDE5MjE0\nMzAwWjATMREwDwYDVQQDEwhzd2FybS1jYTBZMBMGByqGSM49AgEGCCqGSM49AwEH\nA0IABJk/VyMPYdaqDXJb/VXh5n/1Yuv7iNrxV3Qb3l06XD46seovcDWs3IZNV1lf\n3Skyr0ofcchipoiHkXBODojJydSjQjBAMA4GA1UdDwEB/wQEAwIBBjAPBgNVHRMB\nAf8EBTADAQH/MB0GA1UdDgQWBBRUXxuRcnFjDfR/RIAUQab8ZV/n4jAKBggqhkjO\nPQQDAgNIADBFAiAy+JTe6Uc3KyLCMiqGl2GyWGQqQDEcO3/YG36x7om65AIhAJvz\npxv6zFeVEkAEEkqIYi0omA9+CjanB/6Bz4n1uw8H\n-----END CERTIFICATE-----\n",
         *   "CertIssuerSubject": "MBMxETAPBgNVBAMTCHN3YXJtLWNh",
         *   "CertIssuerPublicKey": "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEmT9XIw9h1qoNclv9VeHmf/Vi6/uI2vFXdBveXTpcPjqx6i9wNazchk1XWV/dKTKvSh9xyGKmiIeRcE4OiMnJ1A=="
         * }
         */
        TLSInfo;
    }
    /**
     * example:
     * {
     *   "Availability": "active",
     *   "Name": "node-name",
     *   "Role": "manager",
     *   "Labels": {
     *     "foo": "bar"
     *   }
     * }
     */
    export interface NodeSpec {
        /**
         * Name for the node.
         * example:
         * my-node
         */
        Name?: string;
        /**
         * User-defined key/value metadata.
         */
        Labels?: {
            [name: string]: string;
        };
        /**
         * Role of the node.
         * example:
         * manager
         */
        Role?: "worker" | "manager";
        /**
         * Availability of the node.
         * example:
         * active
         */
        Availability?: "active" | "pause" | "drain";
    }
    /**
     * NodeState represents the state of a node.
     * example:
     * ready
     */
    export type NodeState = "unknown" | "down" | "ready" | "disconnected";
    /**
     * NodeStatus represents the status of a node.
     *
     * It provides the current status of the node, as seen by the manager.
     *
     */
    export interface NodeStatus {
        State?: /**
         * NodeState represents the state of a node.
         * example:
         * ready
         */
        NodeState;
        /**
         * example:
         *
         */
        Message?: string;
        /**
         * IP address of the node.
         * example:
         * 172.17.0.2
         */
        Addr?: string;
    }
    /**
     * A descriptor struct containing digest, media type, and size, as defined in
     * the [OCI Content Descriptors Specification](https://github.com/opencontainers/image-spec/blob/v1.0.1/descriptor.md).
     *
     */
    export interface OCIDescriptor {
        /**
         * The media type of the object this schema refers to.
         *
         * example:
         * application/vnd.docker.distribution.manifest.v2+json
         */
        mediaType?: string;
        /**
         * The digest of the targeted content.
         *
         * example:
         * sha256:c0537ff6a5218ef531ece93d4984efc99bbf3f7497c0a7726c88e2bb7584dc96
         */
        digest?: string;
        /**
         * The size in bytes of the blob.
         *
         * example:
         * 3987495
         */
        size?: number; // int64
    }
    /**
     * Describes the platform which the image in the manifest runs on, as defined
     * in the [OCI Image Index Specification](https://github.com/opencontainers/image-spec/blob/v1.0.1/image-index.md).
     *
     */
    export interface OCIPlatform {
        /**
         * The CPU architecture, for example `amd64` or `ppc64`.
         *
         * example:
         * arm
         */
        architecture?: string;
        /**
         * The operating system, for example `linux` or `windows`.
         *
         * example:
         * windows
         */
        os?: string;
        /**
         * Optional field specifying the operating system version, for example on
         * Windows `10.0.19041.1165`.
         *
         * example:
         * 10.0.19041.1165
         */
        "os.version"?: string;
        /**
         * Optional field specifying an array of strings, each listing a required
         * OS feature (for example on Windows `win32k`).
         *
         * example:
         * [
         *   "win32k"
         * ]
         */
        "os.features"?: string[];
        /**
         * Optional field specifying a variant of the CPU, for example `v7` to
         * specify ARMv7 when architecture is `arm`.
         *
         * example:
         * v7
         */
        variant?: string;
    }
    /**
     * The version number of the object such as node, service, etc. This is needed
     * to avoid conflicting writes. The client must send the version number along
     * with the modified specification when updating these objects.
     *
     * This approach ensures safe concurrency and determinism in that the change
     * on the object may not be applied if the version number has changed from the
     * last read. In other words, if two update requests specify the same base
     * version, only one of the requests can succeed. As a result, two separate
     * update requests that happen at the same time will not unintentionally
     * overwrite each other.
     *
     */
    export interface ObjectVersion {
        /**
         * example:
         * 373531
         */
        Index?: number; // uint64
    }
    /**
     * PeerInfo represents one peer of an overlay network.
     *
     */
    export interface PeerInfo {
        /**
         * ID of the peer-node in the Swarm cluster.
         * example:
         * 6869d7c1732b
         */
        Name?: string;
        /**
         * IP-address of the peer-node in the Swarm cluster.
         * example:
         * 10.133.77.91
         */
        IP?: string;
    }
    /**
     * Represents a peer-node in the swarm
     */
    export interface PeerNode {
        /**
         * Unique identifier of for this node in the swarm.
         */
        NodeID?: string;
        /**
         * IP address and ports at which this node can be reached.
         *
         */
        Addr?: string;
    }
    /**
     * Platform represents the platform (Arch/OS).
     *
     */
    export interface Platform {
        /**
         * Architecture represents the hardware architecture (for example,
         * `x86_64`).
         *
         * example:
         * x86_64
         */
        Architecture?: string;
        /**
         * OS represents the Operating System (for example, `linux` or `windows`).
         *
         * example:
         * linux
         */
        OS?: string;
    }
    /**
     * A plugin for the Engine API
     */
    export interface Plugin {
        /**
         * example:
         * 5724e2c8652da337ab2eedd19fc6fc0ec908e4bd907c7421bf6a8dfc70c4c078
         */
        Id?: string;
        /**
         * example:
         * tiborvass/sample-volume-plugin
         */
        Name: string;
        /**
         * True if the plugin is running. False if the plugin is not running, only installed.
         * example:
         * true
         */
        Enabled: boolean;
        /**
         * Settings that can be modified by users.
         */
        Settings: {
            Mounts: PluginMount[];
            /**
             * example:
             * [
             *   "DEBUG=0"
             * ]
             */
            Env: string[];
            Args: string[];
            Devices: PluginDevice[];
        };
        /**
         * plugin remote reference used to push/pull the plugin
         * example:
         * localhost:5000/tiborvass/sample-volume-plugin:latest
         */
        PluginReference?: string;
        /**
         * The config of a plugin.
         */
        Config: {
            /**
             * Docker Version used to create the plugin
             * example:
             * 17.06.0-ce
             */
            DockerVersion?: string;
            /**
             * example:
             * A sample volume plugin for Docker
             */
            Description: string;
            /**
             * example:
             * https://docs.docker.com/engine/extend/plugins/
             */
            Documentation: string;
            /**
             * The interface between Docker and the plugin
             */
            Interface: {
                /**
                 * example:
                 * [
                 *   "docker.volumedriver/1.0"
                 * ]
                 */
                Types: PluginInterfaceType[];
                /**
                 * example:
                 * plugins.sock
                 */
                Socket: string;
                /**
                 * Protocol to use for clients connecting to the plugin.
                 * example:
                 * some.protocol/v1.0
                 */
                ProtocolScheme?: "" | "moby.plugins.http/v1";
            };
            /**
             * example:
             * [
             *   "/usr/bin/sample-volume-plugin",
             *   "/data"
             * ]
             */
            Entrypoint: string[];
            /**
             * example:
             * /bin/
             */
            WorkDir: string;
            User?: {
                /**
                 * example:
                 * 1000
                 */
                UID?: number; // uint32
                /**
                 * example:
                 * 1000
                 */
                GID?: number; // uint32
            };
            Network: {
                /**
                 * example:
                 * host
                 */
                Type: string;
            };
            Linux: {
                /**
                 * example:
                 * [
                 *   "CAP_SYS_ADMIN",
                 *   "CAP_SYSLOG"
                 * ]
                 */
                Capabilities: string[];
                /**
                 * example:
                 * false
                 */
                AllowAllDevices: boolean;
                Devices: PluginDevice[];
            };
            /**
             * example:
             * /mnt/volumes
             */
            PropagatedMount: string;
            /**
             * example:
             * false
             */
            IpcHost: boolean;
            /**
             * example:
             * false
             */
            PidHost: boolean;
            Mounts: PluginMount[];
            /**
             * example:
             * [
             *   {
             *     "Name": "DEBUG",
             *     "Description": "If set, prints debug messages",
             *     "Settable": null,
             *     "Value": "0"
             *   }
             * ]
             */
            Env: PluginEnv[];
            Args: {
                /**
                 * example:
                 * args
                 */
                Name: string;
                /**
                 * example:
                 * command line arguments
                 */
                Description: string;
                Settable: string[];
                Value: string[];
            };
            rootfs?: {
                /**
                 * example:
                 * layers
                 */
                type?: string;
                /**
                 * example:
                 * [
                 *   "sha256:675532206fbf3030b8458f88d6e26d4eb1577688a25efec97154c94e8b6b4887",
                 *   "sha256:e216a057b1cb1efc11f8a268f37ef62083e70b1b38323ba252e25ac88904a7e8"
                 * ]
                 */
                diff_ids?: string[];
            };
        };
    }
    export interface PluginDevice {
        Name: string;
        Description: string;
        Settable: string[];
        /**
         * example:
         * /dev/fuse
         */
        Path: string;
    }
    export interface PluginEnv {
        Name: string;
        Description: string;
        Settable: string[];
        Value: string;
    }
    export interface PluginInterfaceType {
        Prefix: string;
        Capability: string;
        Version: string;
    }
    export interface PluginMount {
        /**
         * example:
         * some-mount
         */
        Name: string;
        /**
         * example:
         * This is a mount that's used by the plugin.
         */
        Description: string;
        Settable: string[];
        /**
         * example:
         * /var/lib/docker/plugins/
         */
        Source: string;
        /**
         * example:
         * /mnt/state
         */
        Destination: string;
        /**
         * example:
         * bind
         */
        Type: string;
        /**
         * example:
         * [
         *   "rbind",
         *   "rw"
         * ]
         */
        Options: string[];
    }
    /**
     * Describes a permission the user has to accept upon installing
     * the plugin.
     *
     */
    export interface PluginPrivilege {
        /**
         * example:
         * network
         */
        Name?: string;
        Description?: string;
        /**
         * example:
         * [
         *   "host"
         * ]
         */
        Value?: string[];
    }
    /**
     * Available plugins per type.
     *
     * <p><br /></p>
     *
     * > **Note**: Only unmanaged (V1) plugins are included in this list.
     * > V1 plugins are "lazily" loaded, and are not returned in this list
     * > if there is no resource using the plugin.
     *
     */
    export interface PluginsInfo {
        /**
         * Names of available volume-drivers, and network-driver plugins.
         * example:
         * [
         *   "local"
         * ]
         */
        Volume?: string[];
        /**
         * Names of available network-drivers, and network-driver plugins.
         * example:
         * [
         *   "bridge",
         *   "host",
         *   "ipvlan",
         *   "macvlan",
         *   "null",
         *   "overlay"
         * ]
         */
        Network?: string[];
        /**
         * Names of available authorization plugins.
         * example:
         * [
         *   "img-authz-plugin",
         *   "hbm"
         * ]
         */
        Authorization?: string[];
        /**
         * Names of available logging-drivers, and logging-driver plugins.
         * example:
         * [
         *   "awslogs",
         *   "fluentd",
         *   "gcplogs",
         *   "gelf",
         *   "journald",
         *   "json-file",
         *   "splunk",
         *   "syslog"
         * ]
         */
        Log?: string[];
    }
    /**
     * An open port on a container
     * example:
     * {
     *   "PrivatePort": 8080,
     *   "PublicPort": 80,
     *   "Type": "tcp"
     * }
     */
    export interface Port {
        /**
         * Host IP address that the container's port is mapped to
         */
        IP?: string; // ip-address
        /**
         * Port on the container
         */
        PrivatePort: number; // uint16
        /**
         * Port exposed on the host
         */
        PublicPort?: number; // uint16
        Type: "tcp" | "udp" | "sctp";
    }
    /**
     * PortBinding represents a binding between a host IP address and a host
     * port.
     *
     */
    export interface PortBinding {
        /**
         * Host IP address that the container's port is mapped to.
         * example:
         * 127.0.0.1
         */
        HostIp?: string;
        /**
         * Host port number that the container's port is mapped to.
         * example:
         * 4443
         */
        HostPort?: string;
    }
    /**
     * PortMap describes the mapping of container ports to host ports, using the
     * container's port-number and protocol as key in the format `<port>/<protocol>`,
     * for example, `80/udp`.
     *
     * If a container's port is mapped for multiple protocols, separate entries
     * are added to the mapping table.
     *
     * example:
     * {
     *   "443/tcp": [
     *     {
     *       "HostIp": "127.0.0.1",
     *       "HostPort": "4443"
     *     }
     *   ],
     *   "80/tcp": [
     *     {
     *       "HostIp": "0.0.0.0",
     *       "HostPort": "80"
     *     },
     *     {
     *       "HostIp": "0.0.0.0",
     *       "HostPort": "8080"
     *     }
     *   ],
     *   "80/udp": [
     *     {
     *       "HostIp": "0.0.0.0",
     *       "HostPort": "80"
     *     }
     *   ],
     *   "53/udp": [
     *     {
     *       "HostIp": "0.0.0.0",
     *       "HostPort": "53"
     *     }
     *   ],
     *   "2377/tcp": null
     * }
     */
    export interface PortMap {
        [name: string]: /**
         * PortBinding represents a binding between a host IP address and a host
         * port.
         *
         */
        PortBinding[];
    }
    export interface ProcessConfig {
        privileged?: boolean;
        user?: string;
        tty?: boolean;
        entrypoint?: string;
        arguments?: string[];
    }
    export interface ProgressDetail {
        current?: number;
        total?: number;
    }
    export interface PushImageInfo {
        error?: string;
        status?: string;
        progress?: string;
        progressDetail?: ProgressDetail;
    }
    /**
     * Reachability represents the reachability of a node.
     * example:
     * reachable
     */
    export type Reachability = "unknown" | "unreachable" | "reachable";
    /**
     * RegistryServiceConfig stores daemon registry services configuration.
     *
     */
    export interface RegistryServiceConfig {
        /**
         * List of IP ranges to which nondistributable artifacts can be pushed,
         * using the CIDR syntax [RFC 4632](https://tools.ietf.org/html/4632).
         *
         * Some images (for example, Windows base images) contain artifacts
         * whose distribution is restricted by license. When these images are
         * pushed to a registry, restricted artifacts are not included.
         *
         * This configuration override this behavior, and enables the daemon to
         * push nondistributable artifacts to all registries whose resolved IP
         * address is within the subnet described by the CIDR syntax.
         *
         * This option is useful when pushing images containing
         * nondistributable artifacts to a registry on an air-gapped network so
         * hosts on that network can pull the images without connecting to
         * another server.
         *
         * > **Warning**: Nondistributable artifacts typically have restrictions
         * > on how and where they can be distributed and shared. Only use this
         * > feature to push artifacts to private registries and ensure that you
         * > are in compliance with any terms that cover redistributing
         * > nondistributable artifacts.
         *
         * example:
         * [
         *   "::1/128",
         *   "127.0.0.0/8"
         * ]
         */
        AllowNondistributableArtifactsCIDRs?: string[];
        /**
         * List of registry hostnames to which nondistributable artifacts can be
         * pushed, using the format `<hostname>[:<port>]` or `<IP address>[:<port>]`.
         *
         * Some images (for example, Windows base images) contain artifacts
         * whose distribution is restricted by license. When these images are
         * pushed to a registry, restricted artifacts are not included.
         *
         * This configuration override this behavior for the specified
         * registries.
         *
         * This option is useful when pushing images containing
         * nondistributable artifacts to a registry on an air-gapped network so
         * hosts on that network can pull the images without connecting to
         * another server.
         *
         * > **Warning**: Nondistributable artifacts typically have restrictions
         * > on how and where they can be distributed and shared. Only use this
         * > feature to push artifacts to private registries and ensure that you
         * > are in compliance with any terms that cover redistributing
         * > nondistributable artifacts.
         *
         * example:
         * [
         *   "registry.internal.corp.example.com:3000",
         *   "[2001:db8:a0b:12f0::1]:443"
         * ]
         */
        AllowNondistributableArtifactsHostnames?: string[];
        /**
         * List of IP ranges of insecure registries, using the CIDR syntax
         * ([RFC 4632](https://tools.ietf.org/html/4632)). Insecure registries
         * accept un-encrypted (HTTP) and/or untrusted (HTTPS with certificates
         * from unknown CAs) communication.
         *
         * By default, local registries (`127.0.0.0/8`) are configured as
         * insecure. All other registries are secure. Communicating with an
         * insecure registry is not possible if the daemon assumes that registry
         * is secure.
         *
         * This configuration override this behavior, insecure communication with
         * registries whose resolved IP address is within the subnet described by
         * the CIDR syntax.
         *
         * Registries can also be marked insecure by hostname. Those registries
         * are listed under `IndexConfigs` and have their `Secure` field set to
         * `false`.
         *
         * > **Warning**: Using this option can be useful when running a local
         * > registry, but introduces security vulnerabilities. This option
         * > should therefore ONLY be used for testing purposes. For increased
         * > security, users should add their CA to their system's list of trusted
         * > CAs instead of enabling this option.
         *
         * example:
         * [
         *   "::1/128",
         *   "127.0.0.0/8"
         * ]
         */
        InsecureRegistryCIDRs?: string[];
        /**
         * example:
         * {
         *   "127.0.0.1:5000": {
         *     "Name": "127.0.0.1:5000",
         *     "Mirrors": [],
         *     "Secure": false,
         *     "Official": false
         *   },
         *   "[2001:db8:a0b:12f0::1]:80": {
         *     "Name": "[2001:db8:a0b:12f0::1]:80",
         *     "Mirrors": [],
         *     "Secure": false,
         *     "Official": false
         *   },
         *   "docker.io": {
         *     "Name": "docker.io",
         *     "Mirrors": [
         *       "https://hub-mirror.corp.example.com:5000/"
         *     ],
         *     "Secure": true,
         *     "Official": true
         *   },
         *   "registry.internal.corp.example.com:3000": {
         *     "Name": "registry.internal.corp.example.com:3000",
         *     "Mirrors": [],
         *     "Secure": false,
         *     "Official": false
         *   }
         * }
         */
        IndexConfigs?: {
            [name: string]: /* IndexInfo contains information about a registry. */ IndexInfo;
        };
        /**
         * List of registry URLs that act as a mirror for the official
         * (`docker.io`) registry.
         *
         * example:
         * [
         *   "https://hub-mirror.corp.example.com:5000/",
         *   "https://[2001:db8:a0b:12f0::1]/"
         * ]
         */
        Mirrors?: string[];
    }
    /**
     * An object describing the resources which can be advertised by a node and
     * requested by a task.
     *
     */
    export interface ResourceObject {
        /**
         * example:
         * 4000000000
         */
        NanoCPUs?: number; // int64
        /**
         * example:
         * 8272408576
         */
        MemoryBytes?: number; // int64
        GenericResources?: /**
         * User-defined resources can be either Integer resources (e.g, `SSD=3`) or
         * String resources (e.g, `GPU=UUID1`).
         *
         * example:
         * [
         *   {
         *     "DiscreteResourceSpec": {
         *       "Kind": "SSD",
         *       "Value": 3
         *     }
         *   },
         *   {
         *     "NamedResourceSpec": {
         *       "Kind": "GPU",
         *       "Value": "UUID1"
         *     }
         *   },
         *   {
         *     "NamedResourceSpec": {
         *       "Kind": "GPU",
         *       "Value": "UUID2"
         *     }
         *   }
         * ]
         */
        GenericResources;
    }
    /**
     * A container's resources (cgroups config, ulimits, etc)
     */
    export interface Resources {
        /**
         * An integer value representing this container's relative CPU weight
         * versus other containers.
         *
         */
        CpuShares?: number;
        /**
         * Memory limit in bytes.
         */
        Memory?: number; // int64
        /**
         * Path to `cgroups` under which the container's `cgroup` is created. If
         * the path is not absolute, the path is considered to be relative to the
         * `cgroups` path of the init process. Cgroups are created if they do not
         * already exist.
         *
         */
        CgroupParent?: string;
        /**
         * Block IO weight (relative weight).
         */
        BlkioWeight?: number;
        /**
         * Block IO weight (relative device weight) in the form:
         *
         * ```
         * [{"Path": "device_path", "Weight": weight}]
         * ```
         *
         */
        BlkioWeightDevice?: {
            Path?: string;
            Weight?: number;
        }[];
        /**
         * Limit read rate (bytes per second) from a device, in the form:
         *
         * ```
         * [{"Path": "device_path", "Rate": rate}]
         * ```
         *
         */
        BlkioDeviceReadBps?: ThrottleDevice[];
        /**
         * Limit write rate (bytes per second) to a device, in the form:
         *
         * ```
         * [{"Path": "device_path", "Rate": rate}]
         * ```
         *
         */
        BlkioDeviceWriteBps?: ThrottleDevice[];
        /**
         * Limit read rate (IO per second) from a device, in the form:
         *
         * ```
         * [{"Path": "device_path", "Rate": rate}]
         * ```
         *
         */
        BlkioDeviceReadIOps?: ThrottleDevice[];
        /**
         * Limit write rate (IO per second) to a device, in the form:
         *
         * ```
         * [{"Path": "device_path", "Rate": rate}]
         * ```
         *
         */
        BlkioDeviceWriteIOps?: ThrottleDevice[];
        /**
         * The length of a CPU period in microseconds.
         */
        CpuPeriod?: number; // int64
        /**
         * Microseconds of CPU time that the container can get in a CPU period.
         *
         */
        CpuQuota?: number; // int64
        /**
         * The length of a CPU real-time period in microseconds. Set to 0 to
         * allocate no time allocated to real-time tasks.
         *
         */
        CpuRealtimePeriod?: number; // int64
        /**
         * The length of a CPU real-time runtime in microseconds. Set to 0 to
         * allocate no time allocated to real-time tasks.
         *
         */
        CpuRealtimeRuntime?: number; // int64
        /**
         * CPUs in which to allow execution (e.g., `0-3`, `0,1`).
         *
         * example:
         * 0-3
         */
        CpusetCpus?: string;
        /**
         * Memory nodes (MEMs) in which to allow execution (0-3, 0,1). Only
         * effective on NUMA systems.
         *
         */
        CpusetMems?: string;
        /**
         * A list of devices to add to the container.
         */
        Devices?: /**
         * A device mapping between the host and container
         * example:
         * {
         *   "PathOnHost": "/dev/deviceName",
         *   "PathInContainer": "/dev/deviceName",
         *   "CgroupPermissions": "mrw"
         * }
         */
        DeviceMapping[];
        /**
         * a list of cgroup rules to apply to the container
         */
        DeviceCgroupRules?: string[];
        /**
         * A list of requests for devices to be sent to device drivers.
         *
         */
        DeviceRequests?: /* A request for devices to be sent to device drivers */ DeviceRequest[];
        /**
         * Hard limit for kernel TCP buffer memory (in bytes). Depending on the
         * OCI runtime in use, this option may be ignored. It is no longer supported
         * by the default (runc) runtime.
         *
         * This field is omitted when empty.
         *
         */
        KernelMemoryTCP?: number; // int64
        /**
         * Memory soft limit in bytes.
         */
        MemoryReservation?: number; // int64
        /**
         * Total memory limit (memory + swap). Set as `-1` to enable unlimited
         * swap.
         *
         */
        MemorySwap?: number; // int64
        /**
         * Tune a container's memory swappiness behavior. Accepts an integer
         * between 0 and 100.
         *
         */
        MemorySwappiness?: number; // int64
        /**
         * CPU quota in units of 10<sup>-9</sup> CPUs.
         */
        NanoCpus?: number; // int64
        /**
         * Disable OOM Killer for the container.
         */
        OomKillDisable?: boolean;
        /**
         * Run an init inside the container that forwards signals and reaps
         * processes. This field is omitted if empty, and the default (as
         * configured on the daemon) is used.
         *
         */
        Init?: boolean;
        /**
         * Tune a container's PIDs limit. Set `0` or `-1` for unlimited, or `null`
         * to not change.
         *
         */
        PidsLimit?: number; // int64
        /**
         * A list of resource limits to set in the container. For example:
         *
         * ```
         * {"Name": "nofile", "Soft": 1024, "Hard": 2048}
         * ```
         *
         */
        Ulimits?: {
            /**
             * Name of ulimit
             */
            Name?: string;
            /**
             * Soft limit
             */
            Soft?: number;
            /**
             * Hard limit
             */
            Hard?: number;
        }[];
        /**
         * The number of usable CPUs (Windows only).
         *
         * On Windows Server containers, the processor resource controls are
         * mutually exclusive. The order of precedence is `CPUCount` first, then
         * `CPUShares`, and `CPUPercent` last.
         *
         */
        CpuCount?: number; // int64
        /**
         * The usable percentage of the available CPUs (Windows only).
         *
         * On Windows Server containers, the processor resource controls are
         * mutually exclusive. The order of precedence is `CPUCount` first, then
         * `CPUShares`, and `CPUPercent` last.
         *
         */
        CpuPercent?: number; // int64
        /**
         * Maximum IOps for the container system drive (Windows only)
         */
        IOMaximumIOps?: number; // int64
        /**
         * Maximum IO in bytes per second for the container system drive
         * (Windows only).
         *
         */
        IOMaximumBandwidth?: number; // int64
    }
    /**
     * The behavior to apply when the container exits. The default is not to
     * restart.
     *
     * An ever increasing delay (double the previous delay, starting at 100ms) is
     * added before each restart to prevent flooding the server.
     *
     */
    export interface RestartPolicy {
        /**
         * - Empty string means not to restart
         * - `no` Do not automatically restart
         * - `always` Always restart
         * - `unless-stopped` Restart always except when the user has manually stopped the container
         * - `on-failure` Restart only when the container exit code is non-zero
         *
         */
        Name?: "" | "no" | "always" | "unless-stopped" | "on-failure";
        /**
         * If `on-failure` is used, the number of times to retry before giving up.
         *
         */
        MaximumRetryCount?: number;
    }
    /**
     * Runtime describes an [OCI compliant](https://github.com/opencontainers/runtime-spec)
     * runtime.
     *
     * The runtime is invoked by the daemon via the `containerd` daemon. OCI
     * runtimes act as an interface to the Linux kernel namespaces, cgroups,
     * and SELinux.
     *
     */
    export interface Runtime {
        /**
         * Name and, optional, path, of the OCI executable binary.
         *
         * If the path is omitted, the daemon searches the host's `$PATH` for the
         * binary and uses the first result.
         *
         * example:
         * /usr/local/bin/my-oci-runtime
         */
        path?: string;
        /**
         * List of command-line arguments to pass to the runtime when invoked.
         *
         * example:
         * [
         *   "--debug",
         *   "--systemd-cgroup=false"
         * ]
         */
        runtimeArgs?: string[];
    }
    export interface Secret {
        /**
         * example:
         * blt1owaxmitz71s9v5zh81zun
         */
        ID?: string;
        Version?: /**
         * The version number of the object such as node, service, etc. This is needed
         * to avoid conflicting writes. The client must send the version number along
         * with the modified specification when updating these objects.
         *
         * This approach ensures safe concurrency and determinism in that the change
         * on the object may not be applied if the version number has changed from the
         * last read. In other words, if two update requests specify the same base
         * version, only one of the requests can succeed. As a result, two separate
         * update requests that happen at the same time will not unintentionally
         * overwrite each other.
         *
         */
        ObjectVersion;
        /**
         * example:
         * 2017-07-20T13:55:28.678958722Z
         */
        CreatedAt?: string; // dateTime
        /**
         * example:
         * 2017-07-20T13:55:28.678958722Z
         */
        UpdatedAt?: string; // dateTime
        Spec?: SecretSpec;
    }
    export interface SecretSpec {
        /**
         * User-defined name of the secret.
         */
        Name?: string;
        /**
         * User-defined key/value metadata.
         * example:
         * {
         *   "com.example.some-label": "some-value",
         *   "com.example.some-other-label": "some-other-value"
         * }
         */
        Labels?: {
            [name: string]: string;
        };
        /**
         * Base64-url-safe-encoded ([RFC 4648](https://tools.ietf.org/html/rfc4648#section-5))
         * data to store as secret.
         *
         * This field is only used to _create_ a secret, and is not returned by
         * other endpoints.
         *
         * example:
         *
         */
        Data?: string;
        /**
         * Name of the secrets driver used to fetch the secret's value from an
         * external secret store.
         *
         */
        Driver?: /* Driver represents a driver (network, logging, secrets). */ Driver;
        /**
         * Templating driver, if applicable
         *
         * Templating controls whether and how to evaluate the config payload as
         * a template. If no driver is set, no templating is used.
         *
         */
        Templating?: /* Driver represents a driver (network, logging, secrets). */ Driver;
    }
    /**
     * example:
     * {
     *   "ID": "9mnpnzenvg8p8tdbtq4wvbkcz",
     *   "Version": {
     *     "Index": 19
     *   },
     *   "CreatedAt": "2016-06-07T21:05:51.880065305Z",
     *   "UpdatedAt": "2016-06-07T21:07:29.962229872Z",
     *   "Spec": {
     *     "Name": "hopeful_cori",
     *     "TaskTemplate": {
     *       "ContainerSpec": {
     *         "Image": "redis"
     *       },
     *       "Resources": {
     *         "Limits": {},
     *         "Reservations": {}
     *       },
     *       "RestartPolicy": {
     *         "Condition": "any",
     *         "MaxAttempts": 0
     *       },
     *       "Placement": {},
     *       "ForceUpdate": 0
     *     },
     *     "Mode": {
     *       "Replicated": {
     *         "Replicas": 1
     *       }
     *     },
     *     "UpdateConfig": {
     *       "Parallelism": 1,
     *       "Delay": 1000000000,
     *       "FailureAction": "pause",
     *       "Monitor": 15000000000,
     *       "MaxFailureRatio": 0.15
     *     },
     *     "RollbackConfig": {
     *       "Parallelism": 1,
     *       "Delay": 1000000000,
     *       "FailureAction": "pause",
     *       "Monitor": 15000000000,
     *       "MaxFailureRatio": 0.15
     *     },
     *     "EndpointSpec": {
     *       "Mode": "vip",
     *       "Ports": [
     *         {
     *           "Protocol": "tcp",
     *           "TargetPort": 6379,
     *           "PublishedPort": 30001
     *         }
     *       ]
     *     }
     *   },
     *   "Endpoint": {
     *     "Spec": {
     *       "Mode": "vip",
     *       "Ports": [
     *         {
     *           "Protocol": "tcp",
     *           "TargetPort": 6379,
     *           "PublishedPort": 30001
     *         }
     *       ]
     *     },
     *     "Ports": [
     *       {
     *         "Protocol": "tcp",
     *         "TargetPort": 6379,
     *         "PublishedPort": 30001
     *       }
     *     ],
     *     "VirtualIPs": [
     *       {
     *         "NetworkID": "4qvuz4ko70xaltuqbt8956gd1",
     *         "Addr": "10.255.0.2/16"
     *       },
     *       {
     *         "NetworkID": "4qvuz4ko70xaltuqbt8956gd1",
     *         "Addr": "10.255.0.3/16"
     *       }
     *     ]
     *   }
     * }
     */
    export interface Service {
        ID?: string;
        Version?: /**
         * The version number of the object such as node, service, etc. This is needed
         * to avoid conflicting writes. The client must send the version number along
         * with the modified specification when updating these objects.
         *
         * This approach ensures safe concurrency and determinism in that the change
         * on the object may not be applied if the version number has changed from the
         * last read. In other words, if two update requests specify the same base
         * version, only one of the requests can succeed. As a result, two separate
         * update requests that happen at the same time will not unintentionally
         * overwrite each other.
         *
         */
        ObjectVersion;
        CreatedAt?: string; // dateTime
        UpdatedAt?: string; // dateTime
        Spec?: /* User modifiable configuration for a service. */ ServiceSpec;
        Endpoint?: {
            Spec?: /* Properties that can be configured to access and load balance a service. */ EndpointSpec;
            Ports?: EndpointPortConfig[];
            VirtualIPs?: {
                NetworkID?: string;
                Addr?: string;
            }[];
        };
        /**
         * The status of a service update.
         */
        UpdateStatus?: {
            State?: "updating" | "paused" | "completed";
            StartedAt?: string; // dateTime
            CompletedAt?: string; // dateTime
            Message?: string;
        };
        /**
         * The status of the service's tasks. Provided only when requested as
         * part of a ServiceList operation.
         *
         */
        ServiceStatus?: {
            /**
             * The number of tasks for the service currently in the Running state.
             *
             * example:
             * 7
             */
            RunningTasks?: number; // uint64
            /**
             * The number of tasks for the service desired to be running.
             * For replicated services, this is the replica count from the
             * service spec. For global services, this is computed by taking
             * count of all tasks for the service with a Desired State other
             * than Shutdown.
             *
             * example:
             * 10
             */
            DesiredTasks?: number; // uint64
            /**
             * The number of tasks for a job that are in the Completed state.
             * This field must be cross-referenced with the service type, as the
             * value of 0 may mean the service is not in a job mode, or it may
             * mean the job-mode service has no tasks yet Completed.
             *
             */
            CompletedTasks?: number; // uint64
        };
        /**
         * The status of the service when it is in one of ReplicatedJob or
         * GlobalJob modes. Absent on Replicated and Global mode services. The
         * JobIteration is an ObjectVersion, but unlike the Service's version,
         * does not need to be sent with an update request.
         *
         */
        JobStatus?: {
            /**
             * JobIteration is a value increased each time a Job is executed,
             * successfully or otherwise. "Executed", in this case, means the
             * job as a whole has been started, not that an individual Task has
             * been launched. A job is "Executed" when its ServiceSpec is
             * updated. JobIteration can be used to disambiguate Tasks belonging
             * to different executions of a job.  Though JobIteration will
             * increase with each subsequent execution, it may not necessarily
             * increase by 1, and so JobIteration should not be used to
             *
             */
            JobIteration?: /**
             * The version number of the object such as node, service, etc. This is needed
             * to avoid conflicting writes. The client must send the version number along
             * with the modified specification when updating these objects.
             *
             * This approach ensures safe concurrency and determinism in that the change
             * on the object may not be applied if the version number has changed from the
             * last read. In other words, if two update requests specify the same base
             * version, only one of the requests can succeed. As a result, two separate
             * update requests that happen at the same time will not unintentionally
             * overwrite each other.
             *
             */
            ObjectVersion;
            /**
             * The last time, as observed by the server, that this job was
             * started.
             *
             */
            LastExecution?: string; // dateTime
        };
    }
    /**
     * User modifiable configuration for a service.
     */
    export interface ServiceSpec {
        /**
         * Name of the service.
         */
        Name?: string;
        /**
         * User-defined key/value metadata.
         */
        Labels?: {
            [name: string]: string;
        };
        TaskTemplate?: /* User modifiable task configuration. */ TaskSpec;
        /**
         * Scheduling mode for the service.
         */
        Mode?: {
            Replicated?: {
                Replicas?: number; // int64
            };
            Global?: {
                [key: string]: any;
            };
            /**
             * The mode used for services with a finite number of tasks that run
             * to a completed state.
             *
             */
            ReplicatedJob?: {
                /**
                 * The maximum number of replicas to run simultaneously.
                 *
                 */
                MaxConcurrent?: number; // int64
                /**
                 * The total number of replicas desired to reach the Completed
                 * state. If unset, will default to the value of `MaxConcurrent`
                 *
                 */
                TotalCompletions?: number; // int64
            };
            /**
             * The mode used for services which run a task to the completed state
             * on each valid node.
             *
             */
            GlobalJob?: {
                [key: string]: any;
            };
        };
        /**
         * Specification for the update strategy of the service.
         */
        UpdateConfig?: {
            /**
             * Maximum number of tasks to be updated in one iteration (0 means
             * unlimited parallelism).
             *
             */
            Parallelism?: number; // int64
            /**
             * Amount of time between updates, in nanoseconds.
             */
            Delay?: number; // int64
            /**
             * Action to take if an updated task fails to run, or stops running
             * during the update.
             *
             */
            FailureAction?: "continue" | "pause" | "rollback";
            /**
             * Amount of time to monitor each updated task for failures, in
             * nanoseconds.
             *
             */
            Monitor?: number; // int64
            /**
             * The fraction of tasks that may fail during an update before the
             * failure action is invoked, specified as a floating point number
             * between 0 and 1.
             *
             */
            MaxFailureRatio?: number;
            /**
             * The order of operations when rolling out an updated task. Either
             * the old task is shut down before the new task is started, or the
             * new task is started before the old task is shut down.
             *
             */
            Order?: "stop-first" | "start-first";
        };
        /**
         * Specification for the rollback strategy of the service.
         */
        RollbackConfig?: {
            /**
             * Maximum number of tasks to be rolled back in one iteration (0 means
             * unlimited parallelism).
             *
             */
            Parallelism?: number; // int64
            /**
             * Amount of time between rollback iterations, in nanoseconds.
             *
             */
            Delay?: number; // int64
            /**
             * Action to take if an rolled back task fails to run, or stops
             * running during the rollback.
             *
             */
            FailureAction?: "continue" | "pause";
            /**
             * Amount of time to monitor each rolled back task for failures, in
             * nanoseconds.
             *
             */
            Monitor?: number; // int64
            /**
             * The fraction of tasks that may fail during a rollback before the
             * failure action is invoked, specified as a floating point number
             * between 0 and 1.
             *
             */
            MaxFailureRatio?: number;
            /**
             * The order of operations when rolling back a task. Either the old
             * task is shut down before the new task is started, or the new task
             * is started before the old task is shut down.
             *
             */
            Order?: "stop-first" | "start-first";
        };
        /**
         * Specifies which networks the service should attach to.
         */
        Networks?: /**
         * Specifies how a service should be attached to a particular network.
         *
         */
        NetworkAttachmentConfig[];
        EndpointSpec?: /* Properties that can be configured to access and load balance a service. */ EndpointSpec;
    }
    /**
     * example:
     * {
     *   "Warning": "unable to pin image doesnotexist:latest to digest: image library/doesnotexist:latest not found"
     * }
     */
    export interface ServiceUpdateResponse {
        /**
         * Optional warning messages
         */
        Warnings?: string[];
    }
    /**
     * ClusterInfo represents information about the swarm as is returned by the
     * "/info" endpoint. Join-tokens are not included.
     *
     */
    export interface Swarm {
        /**
         * The ID of the swarm.
         * example:
         * abajmipo7b4xz5ip2nrla6b11
         */
        ID?: string;
        Version?: /**
         * The version number of the object such as node, service, etc. This is needed
         * to avoid conflicting writes. The client must send the version number along
         * with the modified specification when updating these objects.
         *
         * This approach ensures safe concurrency and determinism in that the change
         * on the object may not be applied if the version number has changed from the
         * last read. In other words, if two update requests specify the same base
         * version, only one of the requests can succeed. As a result, two separate
         * update requests that happen at the same time will not unintentionally
         * overwrite each other.
         *
         */
        ObjectVersion;
        /**
         * Date and time at which the swarm was initialised in
         * [RFC 3339](https://www.ietf.org/rfc/rfc3339.txt) format with nano-seconds.
         *
         * example:
         * 2016-08-18T10:44:24.496525531Z
         */
        CreatedAt?: string; // dateTime
        /**
         * Date and time at which the swarm was last updated in
         * [RFC 3339](https://www.ietf.org/rfc/rfc3339.txt) format with nano-seconds.
         *
         * example:
         * 2017-08-09T07:09:37.632105588Z
         */
        UpdatedAt?: string; // dateTime
        Spec?: /* User modifiable swarm configuration. */ SwarmSpec;
        TLSInfo?: /**
         * Information about the issuer of leaf TLS certificates and the trusted root
         * CA certificate.
         *
         * example:
         * {
         *   "TrustRoot": "-----BEGIN CERTIFICATE-----\nMIIBajCCARCgAwIBAgIUbYqrLSOSQHoxD8CwG6Bi2PJi9c8wCgYIKoZIzj0EAwIw\nEzERMA8GA1UEAxMIc3dhcm0tY2EwHhcNMTcwNDI0MjE0MzAwWhcNMzcwNDE5MjE0\nMzAwWjATMREwDwYDVQQDEwhzd2FybS1jYTBZMBMGByqGSM49AgEGCCqGSM49AwEH\nA0IABJk/VyMPYdaqDXJb/VXh5n/1Yuv7iNrxV3Qb3l06XD46seovcDWs3IZNV1lf\n3Skyr0ofcchipoiHkXBODojJydSjQjBAMA4GA1UdDwEB/wQEAwIBBjAPBgNVHRMB\nAf8EBTADAQH/MB0GA1UdDgQWBBRUXxuRcnFjDfR/RIAUQab8ZV/n4jAKBggqhkjO\nPQQDAgNIADBFAiAy+JTe6Uc3KyLCMiqGl2GyWGQqQDEcO3/YG36x7om65AIhAJvz\npxv6zFeVEkAEEkqIYi0omA9+CjanB/6Bz4n1uw8H\n-----END CERTIFICATE-----\n",
         *   "CertIssuerSubject": "MBMxETAPBgNVBAMTCHN3YXJtLWNh",
         *   "CertIssuerPublicKey": "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEmT9XIw9h1qoNclv9VeHmf/Vi6/uI2vFXdBveXTpcPjqx6i9wNazchk1XWV/dKTKvSh9xyGKmiIeRcE4OiMnJ1A=="
         * }
         */
        TLSInfo;
        /**
         * Whether there is currently a root CA rotation in progress for the swarm
         *
         * example:
         * false
         */
        RootRotationInProgress?: boolean;
        /**
         * DataPathPort specifies the data path port number for data traffic.
         * Acceptable port range is 1024 to 49151.
         * If no port is set or is set to 0, the default port (4789) is used.
         *
         * example:
         * 4789
         */
        DataPathPort?: number; // uint32
        /**
         * Default Address Pool specifies default subnet pools for global scope
         * networks.
         *
         */
        DefaultAddrPool?: string /* CIDR */[];
        /**
         * SubnetSize specifies the subnet size of the networks created from the
         * default subnet pool.
         *
         * example:
         * 24
         */
        SubnetSize?: number; // uint32
        JoinTokens?: /**
         * JoinTokens contains the tokens workers and managers need to join the swarm.
         *
         */
        JoinTokens;
    }
    /**
     * Represents generic information about swarm.
     *
     */
    export interface SwarmInfo {
        /**
         * Unique identifier of for this node in the swarm.
         * example:
         * k67qz4598weg5unwwffg6z1m1
         */
        NodeID?: string;
        /**
         * IP address at which this node can be reached by other nodes in the
         * swarm.
         *
         * example:
         * 10.0.0.46
         */
        NodeAddr?: string;
        LocalNodeState?: /**
         * Current local status of this node.
         * example:
         * active
         */
        LocalNodeState;
        /**
         * example:
         * true
         */
        ControlAvailable?: boolean;
        Error?: string;
        /**
         * List of ID's and addresses of other managers in the swarm.
         *
         * example:
         * [
         *   {
         *     "NodeID": "71izy0goik036k48jg985xnds",
         *     "Addr": "10.0.0.158:2377"
         *   },
         *   {
         *     "NodeID": "79y6h1o4gv8n120drcprv5nmc",
         *     "Addr": "10.0.0.159:2377"
         *   },
         *   {
         *     "NodeID": "k67qz4598weg5unwwffg6z1m1",
         *     "Addr": "10.0.0.46:2377"
         *   }
         * ]
         */
        RemoteManagers?: /* Represents a peer-node in the swarm */ PeerNode[];
        /**
         * Total number of nodes in the swarm.
         * example:
         * 4
         */
        Nodes?: number;
        /**
         * Total number of managers in the swarm.
         * example:
         * 3
         */
        Managers?: number;
        Cluster?: /**
         * ClusterInfo represents information about the swarm as is returned by the
         * "/info" endpoint. Join-tokens are not included.
         *
         */
        ClusterInfo;
    }
    /**
     * User modifiable swarm configuration.
     */
    export interface SwarmSpec {
        /**
         * Name of the swarm.
         * example:
         * default
         */
        Name?: string;
        /**
         * User-defined key/value metadata.
         * example:
         * {
         *   "com.example.corp.type": "production",
         *   "com.example.corp.department": "engineering"
         * }
         */
        Labels?: {
            [name: string]: string;
        };
        /**
         * Orchestration configuration.
         */
        Orchestration?: {
            /**
             * The number of historic tasks to keep per instance or node. If
             * negative, never remove completed or failed tasks.
             *
             * example:
             * 10
             */
            TaskHistoryRetentionLimit?: number; // int64
        };
        /**
         * Raft configuration.
         */
        Raft?: {
            /**
             * The number of log entries between snapshots.
             * example:
             * 10000
             */
            SnapshotInterval?: number; // uint64
            /**
             * The number of snapshots to keep beyond the current snapshot.
             *
             */
            KeepOldSnapshots?: number; // uint64
            /**
             * The number of log entries to keep around to sync up slow followers
             * after a snapshot is created.
             *
             * example:
             * 500
             */
            LogEntriesForSlowFollowers?: number; // uint64
            /**
             * The number of ticks that a follower will wait for a message from
             * the leader before becoming a candidate and starting an election.
             * `ElectionTick` must be greater than `HeartbeatTick`.
             *
             * A tick currently defaults to one second, so these translate
             * directly to seconds currently, but this is NOT guaranteed.
             *
             * example:
             * 3
             */
            ElectionTick?: number;
            /**
             * The number of ticks between heartbeats. Every HeartbeatTick ticks,
             * the leader will send a heartbeat to the followers.
             *
             * A tick currently defaults to one second, so these translate
             * directly to seconds currently, but this is NOT guaranteed.
             *
             * example:
             * 1
             */
            HeartbeatTick?: number;
        };
        /**
         * Dispatcher configuration.
         */
        Dispatcher?: {
            /**
             * The delay for an agent to send a heartbeat to the dispatcher.
             *
             * example:
             * 5000000000
             */
            HeartbeatPeriod?: number; // int64
        };
        /**
         * CA configuration.
         */
        CAConfig?: {
            /**
             * The duration node certificates are issued for.
             * example:
             * 7776000000000000
             */
            NodeCertExpiry?: number; // int64
            /**
             * Configuration for forwarding signing requests to an external
             * certificate authority.
             *
             */
            ExternalCAs?: {
                /**
                 * Protocol for communication with the external CA (currently
                 * only `cfssl` is supported).
                 *
                 */
                Protocol?: "cfssl";
                /**
                 * URL where certificate signing requests should be sent.
                 *
                 */
                URL?: string;
                /**
                 * An object with key/value pairs that are interpreted as
                 * protocol-specific options for the external CA driver.
                 *
                 */
                Options?: {
                    [name: string]: string;
                };
                /**
                 * The root CA certificate (in PEM format) this external CA uses
                 * to issue TLS certificates (assumed to be to the current swarm
                 * root CA certificate if not provided).
                 *
                 */
                CACert?: string;
            }[];
            /**
             * The desired signing CA certificate for all swarm node TLS leaf
             * certificates, in PEM format.
             *
             */
            SigningCACert?: string;
            /**
             * The desired signing CA key for all swarm node TLS leaf certificates,
             * in PEM format.
             *
             */
            SigningCAKey?: string;
            /**
             * An integer whose purpose is to force swarm to generate a new
             * signing CA certificate and key, if none have been specified in
             * `SigningCACert` and `SigningCAKey`
             *
             */
            ForceRotate?: number; // uint64
        };
        /**
         * Parameters related to encryption-at-rest.
         */
        EncryptionConfig?: {
            /**
             * If set, generate a key and use it to lock data stored on the
             * managers.
             *
             * example:
             * false
             */
            AutoLockManagers?: boolean;
        };
        /**
         * Defaults for creating tasks in this cluster.
         */
        TaskDefaults?: {
            /**
             * The log driver to use for tasks created in the orchestrator if
             * unspecified by a service.
             *
             * Updating this value only affects new tasks. Existing tasks continue
             * to use their previously configured log driver until recreated.
             *
             */
            LogDriver?: {
                /**
                 * The log driver to use as a default for new tasks.
                 *
                 * example:
                 * json-file
                 */
                Name?: string;
                /**
                 * Driver-specific options for the selected log driver, specified
                 * as key/value pairs.
                 *
                 * example:
                 * {
                 *   "max-file": "10",
                 *   "max-size": "100m"
                 * }
                 */
                Options?: {
                    [name: string]: string;
                };
            };
        };
    }
    export interface SystemInfo {
        /**
         * Unique identifier of the daemon.
         *
         * <p><br /></p>
         *
         * > **Note**: The format of the ID itself is not part of the API, and
         * > should not be considered stable.
         *
         * example:
         * 7TRN:IPZB:QYBB:VPBQ:UMPP:KARE:6ZNR:XE6T:7EWV:PKF4:ZOJD:TPYS
         */
        ID?: string;
        /**
         * Total number of containers on the host.
         * example:
         * 14
         */
        Containers?: number;
        /**
         * Number of containers with status `"running"`.
         *
         * example:
         * 3
         */
        ContainersRunning?: number;
        /**
         * Number of containers with status `"paused"`.
         *
         * example:
         * 1
         */
        ContainersPaused?: number;
        /**
         * Number of containers with status `"stopped"`.
         *
         * example:
         * 10
         */
        ContainersStopped?: number;
        /**
         * Total number of images on the host.
         *
         * Both _tagged_ and _untagged_ (dangling) images are counted.
         *
         * example:
         * 508
         */
        Images?: number;
        /**
         * Name of the storage driver in use.
         * example:
         * overlay2
         */
        Driver?: string;
        /**
         * Information specific to the storage driver, provided as
         * "label" / "value" pairs.
         *
         * This information is provided by the storage driver, and formatted
         * in a way consistent with the output of `docker info` on the command
         * line.
         *
         * <p><br /></p>
         *
         * > **Note**: The information returned in this field, including the
         * > formatting of values and labels, should not be considered stable,
         * > and may change without notice.
         *
         * example:
         * [
         *   [
         *     "Backing Filesystem",
         *     "extfs"
         *   ],
         *   [
         *     "Supports d_type",
         *     "true"
         *   ],
         *   [
         *     "Native Overlay Diff",
         *     "true"
         *   ]
         * ]
         */
        DriverStatus?: string[][];
        /**
         * Root directory of persistent Docker state.
         *
         * Defaults to `/var/lib/docker` on Linux, and `C:\ProgramData\docker`
         * on Windows.
         *
         * example:
         * /var/lib/docker
         */
        DockerRootDir?: string;
        Plugins?: /**
         * Available plugins per type.
         *
         * <p><br /></p>
         *
         * > **Note**: Only unmanaged (V1) plugins are included in this list.
         * > V1 plugins are "lazily" loaded, and are not returned in this list
         * > if there is no resource using the plugin.
         *
         */
        PluginsInfo;
        /**
         * Indicates if the host has memory limit support enabled.
         * example:
         * true
         */
        MemoryLimit?: boolean;
        /**
         * Indicates if the host has memory swap limit support enabled.
         * example:
         * true
         */
        SwapLimit?: boolean;
        /**
         * Indicates if the host has kernel memory TCP limit support enabled. This
         * field is omitted if not supported.
         *
         * Kernel memory TCP limits are not supported when using cgroups v2, which
         * does not support the corresponding `memory.kmem.tcp.limit_in_bytes` cgroup.
         *
         * example:
         * true
         */
        KernelMemoryTCP?: boolean;
        /**
         * Indicates if CPU CFS(Completely Fair Scheduler) period is supported by
         * the host.
         *
         * example:
         * true
         */
        CpuCfsPeriod?: boolean;
        /**
         * Indicates if CPU CFS(Completely Fair Scheduler) quota is supported by
         * the host.
         *
         * example:
         * true
         */
        CpuCfsQuota?: boolean;
        /**
         * Indicates if CPU Shares limiting is supported by the host.
         *
         * example:
         * true
         */
        CPUShares?: boolean;
        /**
         * Indicates if CPUsets (cpuset.cpus, cpuset.mems) are supported by the host.
         *
         * See [cpuset(7)](https://www.kernel.org/doc/Documentation/cgroup-v1/cpusets.txt)
         *
         * example:
         * true
         */
        CPUSet?: boolean;
        /**
         * Indicates if the host kernel has PID limit support enabled.
         * example:
         * true
         */
        PidsLimit?: boolean;
        /**
         * Indicates if OOM killer disable is supported on the host.
         */
        OomKillDisable?: boolean;
        /**
         * Indicates IPv4 forwarding is enabled.
         * example:
         * true
         */
        IPv4Forwarding?: boolean;
        /**
         * Indicates if `bridge-nf-call-iptables` is available on the host.
         * example:
         * true
         */
        BridgeNfIptables?: boolean;
        /**
         * Indicates if `bridge-nf-call-ip6tables` is available on the host.
         * example:
         * true
         */
        BridgeNfIp6tables?: boolean;
        /**
         * Indicates if the daemon is running in debug-mode / with debug-level
         * logging enabled.
         *
         * example:
         * true
         */
        Debug?: boolean;
        /**
         * The total number of file Descriptors in use by the daemon process.
         *
         * This information is only returned if debug-mode is enabled.
         *
         * example:
         * 64
         */
        NFd?: number;
        /**
         * The  number of goroutines that currently exist.
         *
         * This information is only returned if debug-mode is enabled.
         *
         * example:
         * 174
         */
        NGoroutines?: number;
        /**
         * Current system-time in [RFC 3339](https://www.ietf.org/rfc/rfc3339.txt)
         * format with nano-seconds.
         *
         * example:
         * 2017-08-08T20:28:29.06202363Z
         */
        SystemTime?: string;
        /**
         * The logging driver to use as a default for new containers.
         *
         */
        LoggingDriver?: string;
        /**
         * The driver to use for managing cgroups.
         *
         * example:
         * cgroupfs
         */
        CgroupDriver?: "cgroupfs" | "systemd" | "none";
        /**
         * The version of the cgroup.
         *
         * example:
         * 1
         */
        CgroupVersion?: "1" | "2";
        /**
         * Number of event listeners subscribed.
         * example:
         * 30
         */
        NEventsListener?: number;
        /**
         * Kernel version of the host.
         *
         * On Linux, this information obtained from `uname`. On Windows this
         * information is queried from the <kbd>HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\</kbd>
         * registry value, for example _"10.0 14393 (14393.1198.amd64fre.rs1_release_sec.170427-1353)"_.
         *
         * example:
         * 4.9.38-moby
         */
        KernelVersion?: string;
        /**
         * Name of the host's operating system, for example: "Ubuntu 16.04.2 LTS"
         * or "Windows Server 2016 Datacenter"
         *
         * example:
         * Alpine Linux v3.5
         */
        OperatingSystem?: string;
        /**
         * Version of the host's operating system
         *
         * <p><br /></p>
         *
         * > **Note**: The information returned in this field, including its
         * > very existence, and the formatting of values, should not be considered
         * > stable, and may change without notice.
         *
         * example:
         * 16.04
         */
        OSVersion?: string;
        /**
         * Generic type of the operating system of the host, as returned by the
         * Go runtime (`GOOS`).
         *
         * Currently returned values are "linux" and "windows". A full list of
         * possible values can be found in the [Go documentation](https://go.dev/doc/install/source#environment).
         *
         * example:
         * linux
         */
        OSType?: string;
        /**
         * Hardware architecture of the host, as returned by the Go runtime
         * (`GOARCH`).
         *
         * A full list of possible values can be found in the [Go documentation](https://go.dev/doc/install/source#environment).
         *
         * example:
         * x86_64
         */
        Architecture?: string;
        /**
         * The number of logical CPUs usable by the daemon.
         *
         * The number of available CPUs is checked by querying the operating
         * system when the daemon starts. Changes to operating system CPU
         * allocation after the daemon is started are not reflected.
         *
         * example:
         * 4
         */
        NCPU?: number;
        /**
         * Total amount of physical memory available on the host, in bytes.
         *
         * example:
         * 2095882240
         */
        MemTotal?: number; // int64
        /**
         * Address / URL of the index server that is used for image search,
         * and as a default for user authentication for Docker Hub and Docker Cloud.
         *
         * example:
         * https://index.docker.io/v1/
         */
        IndexServerAddress?: string;
        RegistryConfig?: /**
         * RegistryServiceConfig stores daemon registry services configuration.
         *
         */
        RegistryServiceConfig;
        GenericResources?: /**
         * User-defined resources can be either Integer resources (e.g, `SSD=3`) or
         * String resources (e.g, `GPU=UUID1`).
         *
         * example:
         * [
         *   {
         *     "DiscreteResourceSpec": {
         *       "Kind": "SSD",
         *       "Value": 3
         *     }
         *   },
         *   {
         *     "NamedResourceSpec": {
         *       "Kind": "GPU",
         *       "Value": "UUID1"
         *     }
         *   },
         *   {
         *     "NamedResourceSpec": {
         *       "Kind": "GPU",
         *       "Value": "UUID2"
         *     }
         *   }
         * ]
         */
        GenericResources;
        /**
         * HTTP-proxy configured for the daemon. This value is obtained from the
         * [`HTTP_PROXY`](https://www.gnu.org/software/wget/manual/html_node/Proxies.html) environment variable.
         * Credentials ([user info component](https://tools.ietf.org/html/rfc3986#section-3.2.1)) in the proxy URL
         * are masked in the API response.
         *
         * Containers do not automatically inherit this configuration.
         *
         * example:
         * http://xxxxx:xxxxx@proxy.corp.example.com:8080
         */
        HttpProxy?: string;
        /**
         * HTTPS-proxy configured for the daemon. This value is obtained from the
         * [`HTTPS_PROXY`](https://www.gnu.org/software/wget/manual/html_node/Proxies.html) environment variable.
         * Credentials ([user info component](https://tools.ietf.org/html/rfc3986#section-3.2.1)) in the proxy URL
         * are masked in the API response.
         *
         * Containers do not automatically inherit this configuration.
         *
         * example:
         * https://xxxxx:xxxxx@proxy.corp.example.com:4443
         */
        HttpsProxy?: string;
        /**
         * Comma-separated list of domain extensions for which no proxy should be
         * used. This value is obtained from the [`NO_PROXY`](https://www.gnu.org/software/wget/manual/html_node/Proxies.html)
         * environment variable.
         *
         * Containers do not automatically inherit this configuration.
         *
         * example:
         * *.local, 169.254/16
         */
        NoProxy?: string;
        /**
         * Hostname of the host.
         * example:
         * node5.corp.example.com
         */
        Name?: string;
        /**
         * User-defined labels (key/value metadata) as set on the daemon.
         *
         * <p><br /></p>
         *
         * > **Note**: When part of a Swarm, nodes can both have _daemon_ labels,
         * > set through the daemon configuration, and _node_ labels, set from a
         * > manager node in the Swarm. Node labels are not included in this
         * > field. Node labels can be retrieved using the `/nodes/(id)` endpoint
         * > on a manager node in the Swarm.
         *
         * example:
         * [
         *   "storage=ssd",
         *   "production"
         * ]
         */
        Labels?: string[];
        /**
         * Indicates if experimental features are enabled on the daemon.
         *
         * example:
         * true
         */
        ExperimentalBuild?: boolean;
        /**
         * Version string of the daemon.
         *
         * example:
         * 24.0.2
         */
        ServerVersion?: string;
        /**
         * List of [OCI compliant](https://github.com/opencontainers/runtime-spec)
         * runtimes configured on the daemon. Keys hold the "name" used to
         * reference the runtime.
         *
         * The Docker daemon relies on an OCI compliant runtime (invoked via the
         * `containerd` daemon) as its interface to the Linux kernel namespaces,
         * cgroups, and SELinux.
         *
         * The default runtime is `runc`, and automatically configured. Additional
         * runtimes can be configured by the user and will be listed here.
         *
         * example:
         * {
         *   "runc": {
         *     "path": "runc"
         *   },
         *   "runc-master": {
         *     "path": "/go/bin/runc"
         *   },
         *   "custom": {
         *     "path": "/usr/local/bin/my-oci-runtime",
         *     "runtimeArgs": [
         *       "--debug",
         *       "--systemd-cgroup=false"
         *     ]
         *   }
         * }
         */
        Runtimes?: {
            [name: string]: /**
             * Runtime describes an [OCI compliant](https://github.com/opencontainers/runtime-spec)
             * runtime.
             *
             * The runtime is invoked by the daemon via the `containerd` daemon. OCI
             * runtimes act as an interface to the Linux kernel namespaces, cgroups,
             * and SELinux.
             *
             */
            Runtime;
        };
        /**
         * Name of the default OCI runtime that is used when starting containers.
         *
         * The default can be overridden per-container at create time.
         *
         * example:
         * runc
         */
        DefaultRuntime?: string;
        Swarm?: /**
         * Represents generic information about swarm.
         *
         */
        SwarmInfo;
        /**
         * Indicates if live restore is enabled.
         *
         * If enabled, containers are kept running when the daemon is shutdown
         * or upon daemon start if running containers are detected.
         *
         * example:
         * false
         */
        LiveRestoreEnabled?: boolean;
        /**
         * Represents the isolation technology to use as a default for containers.
         * The supported values are platform-specific.
         *
         * If no isolation value is specified on daemon start, on Windows client,
         * the default is `hyperv`, and on Windows server, the default is `process`.
         *
         * This option is currently not used on other platforms.
         *
         */
        Isolation?: "default" | "hyperv" | "process";
        /**
         * Name and, optional, path of the `docker-init` binary.
         *
         * If the path is omitted, the daemon searches the host's `$PATH` for the
         * binary and uses the first result.
         *
         * example:
         * docker-init
         */
        InitBinary?: string;
        ContainerdCommit?: /**
         * Commit holds the Git-commit (SHA1) that a binary was built from, as
         * reported in the version-string of external tools, such as `containerd`,
         * or `runC`.
         *
         */
        Commit;
        RuncCommit?: /**
         * Commit holds the Git-commit (SHA1) that a binary was built from, as
         * reported in the version-string of external tools, such as `containerd`,
         * or `runC`.
         *
         */
        Commit;
        InitCommit?: /**
         * Commit holds the Git-commit (SHA1) that a binary was built from, as
         * reported in the version-string of external tools, such as `containerd`,
         * or `runC`.
         *
         */
        Commit;
        /**
         * List of security features that are enabled on the daemon, such as
         * apparmor, seccomp, SELinux, user-namespaces (userns), rootless and
         * no-new-privileges.
         *
         * Additional configuration options for each security feature may
         * be present, and are included as a comma-separated list of key/value
         * pairs.
         *
         * example:
         * [
         *   "name=apparmor",
         *   "name=seccomp,profile=default",
         *   "name=selinux",
         *   "name=userns",
         *   "name=rootless"
         * ]
         */
        SecurityOptions?: string[];
        /**
         * Reports a summary of the product license on the daemon.
         *
         * If a commercial license has been applied to the daemon, information
         * such as number of nodes, and expiration are included.
         *
         * example:
         * Community Engine
         */
        ProductLicense?: string;
        /**
         * List of custom default address pools for local networks, which can be
         * specified in the daemon.json file or dockerd option.
         *
         * Example: a Base "10.10.0.0/16" with Size 24 will define the set of 256
         * 10.10.[0-255].0/24 address pools.
         *
         */
        DefaultAddressPools?: {
            /**
             * The network address in CIDR format
             * example:
             * 10.10.0.0/16
             */
            Base?: string;
            /**
             * The network pool size
             * example:
             * 24
             */
            Size?: number;
        }[];
        /**
         * List of warnings / informational messages about missing features, or
         * issues related to the daemon configuration.
         *
         * These messages can be printed by the client as information to the user.
         *
         * example:
         * [
         *   "WARNING: No memory limit support",
         *   "WARNING: bridge-nf-call-iptables is disabled",
         *   "WARNING: bridge-nf-call-ip6tables is disabled"
         * ]
         */
        Warnings?: string[];
    }
    /**
     * Response of Engine API: GET "/version"
     *
     */
    export interface SystemVersion {
        Platform?: {
            Name: string;
        };
        /**
         * Information about system components
         *
         */
        Components?: {
            /**
             * Name of the component
             *
             * example:
             * Engine
             */
            Name: string;
            /**
             * Version of the component
             *
             * example:
             * 19.03.12
             */
            Version: string;
            /**
             * Key/value pairs of strings with additional information about the
             * component. These values are intended for informational purposes
             * only, and their content is not defined, and not part of the API
             * specification.
             *
             * These messages can be printed by the client as information to the user.
             *
             */
            Details?: {
                [key: string]: any;
            };
        }[];
        /**
         * The version of the daemon
         * example:
         * 19.03.12
         */
        Version?: string;
        /**
         * The default (and highest) API version that is supported by the daemon
         *
         * example:
         * 1.40
         */
        ApiVersion?: string;
        /**
         * The minimum API version that is supported by the daemon
         *
         * example:
         * 1.12
         */
        MinAPIVersion?: string;
        /**
         * The Git commit of the source code that was used to build the daemon
         *
         * example:
         * 48a66213fe
         */
        GitCommit?: string;
        /**
         * The version Go used to compile the daemon, and the version of the Go
         * runtime in use.
         *
         * example:
         * go1.13.14
         */
        GoVersion?: string;
        /**
         * The operating system that the daemon is running on ("linux" or "windows")
         *
         * example:
         * linux
         */
        Os?: string;
        /**
         * The architecture that the daemon is running on
         *
         * example:
         * amd64
         */
        Arch?: string;
        /**
         * The kernel version (`uname -r`) that the daemon is running on.
         *
         * This field is omitted when empty.
         *
         * example:
         * 4.19.76-linuxkit
         */
        KernelVersion?: string;
        /**
         * Indicates if the daemon is started with experimental features enabled.
         *
         * This field is omitted when empty / false.
         *
         * example:
         * true
         */
        Experimental?: boolean;
        /**
         * The date and time that the daemon was compiled.
         *
         * example:
         * 2020-06-22T15:49:27.000000000+00:00
         */
        BuildTime?: string;
    }
    /**
     * Information about the issuer of leaf TLS certificates and the trusted root
     * CA certificate.
     *
     * example:
     * {
     *   "TrustRoot": "-----BEGIN CERTIFICATE-----\nMIIBajCCARCgAwIBAgIUbYqrLSOSQHoxD8CwG6Bi2PJi9c8wCgYIKoZIzj0EAwIw\nEzERMA8GA1UEAxMIc3dhcm0tY2EwHhcNMTcwNDI0MjE0MzAwWhcNMzcwNDE5MjE0\nMzAwWjATMREwDwYDVQQDEwhzd2FybS1jYTBZMBMGByqGSM49AgEGCCqGSM49AwEH\nA0IABJk/VyMPYdaqDXJb/VXh5n/1Yuv7iNrxV3Qb3l06XD46seovcDWs3IZNV1lf\n3Skyr0ofcchipoiHkXBODojJydSjQjBAMA4GA1UdDwEB/wQEAwIBBjAPBgNVHRMB\nAf8EBTADAQH/MB0GA1UdDgQWBBRUXxuRcnFjDfR/RIAUQab8ZV/n4jAKBggqhkjO\nPQQDAgNIADBFAiAy+JTe6Uc3KyLCMiqGl2GyWGQqQDEcO3/YG36x7om65AIhAJvz\npxv6zFeVEkAEEkqIYi0omA9+CjanB/6Bz4n1uw8H\n-----END CERTIFICATE-----\n",
     *   "CertIssuerSubject": "MBMxETAPBgNVBAMTCHN3YXJtLWNh",
     *   "CertIssuerPublicKey": "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEmT9XIw9h1qoNclv9VeHmf/Vi6/uI2vFXdBveXTpcPjqx6i9wNazchk1XWV/dKTKvSh9xyGKmiIeRcE4OiMnJ1A=="
     * }
     */
    export interface TLSInfo {
        /**
         * The root CA certificate(s) that are used to validate leaf TLS
         * certificates.
         *
         */
        TrustRoot?: string;
        /**
         * The base64-url-safe-encoded raw subject bytes of the issuer.
         */
        CertIssuerSubject?: string;
        /**
         * The base64-url-safe-encoded raw public key bytes of the issuer.
         *
         */
        CertIssuerPublicKey?: string;
    }
    /**
     * example:
     * {
     *   "ID": "0kzzo1i0y4jz6027t0k7aezc7",
     *   "Version": {
     *     "Index": 71
     *   },
     *   "CreatedAt": "2016-06-07T21:07:31.171892745Z",
     *   "UpdatedAt": "2016-06-07T21:07:31.376370513Z",
     *   "Spec": {
     *     "ContainerSpec": {
     *       "Image": "redis"
     *     },
     *     "Resources": {
     *       "Limits": {},
     *       "Reservations": {}
     *     },
     *     "RestartPolicy": {
     *       "Condition": "any",
     *       "MaxAttempts": 0
     *     },
     *     "Placement": {}
     *   },
     *   "ServiceID": "9mnpnzenvg8p8tdbtq4wvbkcz",
     *   "Slot": 1,
     *   "NodeID": "60gvrl6tm78dmak4yl7srz94v",
     *   "Status": {
     *     "Timestamp": "2016-06-07T21:07:31.290032978Z",
     *     "State": "running",
     *     "Message": "started",
     *     "ContainerStatus": {
     *       "ContainerID": "e5d62702a1b48d01c3e02ca1e0212a250801fa8d67caca0b6f35919ebc12f035",
     *       "PID": 677
     *     }
     *   },
     *   "DesiredState": "running",
     *   "NetworksAttachments": [
     *     {
     *       "Network": {
     *         "ID": "4qvuz4ko70xaltuqbt8956gd1",
     *         "Version": {
     *           "Index": 18
     *         },
     *         "CreatedAt": "2016-06-07T20:31:11.912919752Z",
     *         "UpdatedAt": "2016-06-07T21:07:29.955277358Z",
     *         "Spec": {
     *           "Name": "ingress",
     *           "Labels": {
     *             "com.docker.swarm.internal": "true"
     *           },
     *           "DriverConfiguration": {},
     *           "IPAMOptions": {
     *             "Driver": {},
     *             "Configs": [
     *               {
     *                 "Subnet": "10.255.0.0/16",
     *                 "Gateway": "10.255.0.1"
     *               }
     *             ]
     *           }
     *         },
     *         "DriverState": {
     *           "Name": "overlay",
     *           "Options": {
     *             "com.docker.network.driver.overlay.vxlanid_list": "256"
     *           }
     *         },
     *         "IPAMOptions": {
     *           "Driver": {
     *             "Name": "default"
     *           },
     *           "Configs": [
     *             {
     *               "Subnet": "10.255.0.0/16",
     *               "Gateway": "10.255.0.1"
     *             }
     *           ]
     *         }
     *       },
     *       "Addresses": [
     *         "10.255.0.10/16"
     *       ]
     *     }
     *   ],
     *   "AssignedGenericResources": [
     *     {
     *       "DiscreteResourceSpec": {
     *         "Kind": "SSD",
     *         "Value": 3
     *       }
     *     },
     *     {
     *       "NamedResourceSpec": {
     *         "Kind": "GPU",
     *         "Value": "UUID1"
     *       }
     *     },
     *     {
     *       "NamedResourceSpec": {
     *         "Kind": "GPU",
     *         "Value": "UUID2"
     *       }
     *     }
     *   ]
     * }
     */
    export interface Task {
        /**
         * The ID of the task.
         */
        ID?: string;
        Version?: /**
         * The version number of the object such as node, service, etc. This is needed
         * to avoid conflicting writes. The client must send the version number along
         * with the modified specification when updating these objects.
         *
         * This approach ensures safe concurrency and determinism in that the change
         * on the object may not be applied if the version number has changed from the
         * last read. In other words, if two update requests specify the same base
         * version, only one of the requests can succeed. As a result, two separate
         * update requests that happen at the same time will not unintentionally
         * overwrite each other.
         *
         */
        ObjectVersion;
        CreatedAt?: string; // dateTime
        UpdatedAt?: string; // dateTime
        /**
         * Name of the task.
         */
        Name?: string;
        /**
         * User-defined key/value metadata.
         */
        Labels?: {
            [name: string]: string;
        };
        Spec?: /* User modifiable task configuration. */ TaskSpec;
        /**
         * The ID of the service this task is part of.
         */
        ServiceID?: string;
        Slot?: number;
        /**
         * The ID of the node that this task is on.
         */
        NodeID?: string;
        AssignedGenericResources?: /**
         * User-defined resources can be either Integer resources (e.g, `SSD=3`) or
         * String resources (e.g, `GPU=UUID1`).
         *
         * example:
         * [
         *   {
         *     "DiscreteResourceSpec": {
         *       "Kind": "SSD",
         *       "Value": 3
         *     }
         *   },
         *   {
         *     "NamedResourceSpec": {
         *       "Kind": "GPU",
         *       "Value": "UUID1"
         *     }
         *   },
         *   {
         *     "NamedResourceSpec": {
         *       "Kind": "GPU",
         *       "Value": "UUID2"
         *     }
         *   }
         * ]
         */
        GenericResources;
        Status?: {
            Timestamp?: string; // dateTime
            State?: TaskState;
            Message?: string;
            Err?: string;
            ContainerStatus?: {
                ContainerID?: string;
                PID?: number;
                ExitCode?: number;
            };
        };
        DesiredState?: TaskState;
        /**
         * If the Service this Task belongs to is a job-mode service, contains
         * the JobIteration of the Service this Task was created for. Absent if
         * the Task was created for a Replicated or Global Service.
         *
         */
        JobIteration?: /**
         * The version number of the object such as node, service, etc. This is needed
         * to avoid conflicting writes. The client must send the version number along
         * with the modified specification when updating these objects.
         *
         * This approach ensures safe concurrency and determinism in that the change
         * on the object may not be applied if the version number has changed from the
         * last read. In other words, if two update requests specify the same base
         * version, only one of the requests can succeed. As a result, two separate
         * update requests that happen at the same time will not unintentionally
         * overwrite each other.
         *
         */
        ObjectVersion;
    }
    /**
     * User modifiable task configuration.
     */
    export interface TaskSpec {
        /**
         * Plugin spec for the service.  *(Experimental release only.)*
         *
         * <p><br /></p>
         *
         * > **Note**: ContainerSpec, NetworkAttachmentSpec, and PluginSpec are
         * > mutually exclusive. PluginSpec is only used when the Runtime field
         * > is set to `plugin`. NetworkAttachmentSpec is used when the Runtime
         * > field is set to `attachment`.
         *
         */
        PluginSpec?: {
            /**
             * The name or 'alias' to use for the plugin.
             */
            Name?: string;
            /**
             * The plugin image reference to use.
             */
            Remote?: string;
            /**
             * Disable the plugin once scheduled.
             */
            Disabled?: boolean;
            PluginPrivilege?: /**
             * Describes a permission the user has to accept upon installing
             * the plugin.
             *
             */
            PluginPrivilege[];
        };
        /**
         * Container spec for the service.
         *
         * <p><br /></p>
         *
         * > **Note**: ContainerSpec, NetworkAttachmentSpec, and PluginSpec are
         * > mutually exclusive. PluginSpec is only used when the Runtime field
         * > is set to `plugin`. NetworkAttachmentSpec is used when the Runtime
         * > field is set to `attachment`.
         *
         */
        ContainerSpec?: {
            /**
             * The image name to use for the container
             */
            Image?: string;
            /**
             * User-defined key/value data.
             */
            Labels?: {
                [name: string]: string;
            };
            /**
             * The command to be run in the image.
             */
            Command?: string[];
            /**
             * Arguments to the command.
             */
            Args?: string[];
            /**
             * The hostname to use for the container, as a valid
             * [RFC 1123](https://tools.ietf.org/html/rfc1123) hostname.
             *
             */
            Hostname?: string;
            /**
             * A list of environment variables in the form `VAR=value`.
             *
             */
            Env?: string[];
            /**
             * The working directory for commands to run in.
             */
            Dir?: string;
            /**
             * The user inside the container.
             */
            User?: string;
            /**
             * A list of additional groups that the container process will run as.
             *
             */
            Groups?: string[];
            /**
             * Security options for the container
             */
            Privileges?: {
                /**
                 * CredentialSpec for managed service account (Windows only)
                 */
                CredentialSpec?: {
                    /**
                     * Load credential spec from a Swarm Config with the given ID.
                     * The specified config must also be present in the Configs
                     * field with the Runtime property set.
                     *
                     * <p><br /></p>
                     *
                     *
                     * > **Note**: `CredentialSpec.File`, `CredentialSpec.Registry`,
                     * > and `CredentialSpec.Config` are mutually exclusive.
                     *
                     * example:
                     * 0bt9dmxjvjiqermk6xrop3ekq
                     */
                    Config?: string;
                    /**
                     * Load credential spec from this file. The file is read by
                     * the daemon, and must be present in the `CredentialSpecs`
                     * subdirectory in the docker data directory, which defaults
                     * to `C:\ProgramData\Docker\` on Windows.
                     *
                     * For example, specifying `spec.json` loads
                     * `C:\ProgramData\Docker\CredentialSpecs\spec.json`.
                     *
                     * <p><br /></p>
                     *
                     * > **Note**: `CredentialSpec.File`, `CredentialSpec.Registry`,
                     * > and `CredentialSpec.Config` are mutually exclusive.
                     *
                     * example:
                     * spec.json
                     */
                    File?: string;
                    /**
                     * Load credential spec from this value in the Windows
                     * registry. The specified registry value must be located in:
                     *
                     * `HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Virtualization\Containers\CredentialSpecs`
                     *
                     * <p><br /></p>
                     *
                     *
                     * > **Note**: `CredentialSpec.File`, `CredentialSpec.Registry`,
                     * > and `CredentialSpec.Config` are mutually exclusive.
                     *
                     */
                    Registry?: string;
                };
                /**
                 * SELinux labels of the container
                 */
                SELinuxContext?: {
                    /**
                     * Disable SELinux
                     */
                    Disable?: boolean;
                    /**
                     * SELinux user label
                     */
                    User?: string;
                    /**
                     * SELinux role label
                     */
                    Role?: string;
                    /**
                     * SELinux type label
                     */
                    Type?: string;
                    /**
                     * SELinux level label
                     */
                    Level?: string;
                };
            };
            /**
             * Whether a pseudo-TTY should be allocated.
             */
            TTY?: boolean;
            /**
             * Open `stdin`
             */
            OpenStdin?: boolean;
            /**
             * Mount the container's root filesystem as read only.
             */
            ReadOnly?: boolean;
            /**
             * Specification for mounts to be added to containers created as part
             * of the service.
             *
             */
            Mounts?: Mount[];
            /**
             * Signal to stop the container.
             */
            StopSignal?: string;
            /**
             * Amount of time to wait for the container to terminate before
             * forcefully killing it.
             *
             */
            StopGracePeriod?: number; // int64
            HealthCheck?: /* A test to perform to check that the container is healthy. */ HealthConfig;
            /**
             * A list of hostname/IP mappings to add to the container's `hosts`
             * file. The format of extra hosts is specified in the
             * [hosts(5)](http://man7.org/linux/man-pages/man5/hosts.5.html)
             * man page:
             *
             *     IP_address canonical_hostname [aliases...]
             *
             */
            Hosts?: string[];
            /**
             * Specification for DNS related configurations in resolver configuration
             * file (`resolv.conf`).
             *
             */
            DNSConfig?: {
                /**
                 * The IP addresses of the name servers.
                 */
                Nameservers?: string[];
                /**
                 * A search list for host-name lookup.
                 */
                Search?: string[];
                /**
                 * A list of internal resolver variables to be modified (e.g.,
                 * `debug`, `ndots:3`, etc.).
                 *
                 */
                Options?: string[];
            };
            /**
             * Secrets contains references to zero or more secrets that will be
             * exposed to the service.
             *
             */
            Secrets?: {
                /**
                 * File represents a specific target that is backed by a file.
                 *
                 */
                File?: {
                    /**
                     * Name represents the final filename in the filesystem.
                     *
                     */
                    Name?: string;
                    /**
                     * UID represents the file UID.
                     */
                    UID?: string;
                    /**
                     * GID represents the file GID.
                     */
                    GID?: string;
                    /**
                     * Mode represents the FileMode of the file.
                     */
                    Mode?: number; // uint32
                };
                /**
                 * SecretID represents the ID of the specific secret that we're
                 * referencing.
                 *
                 */
                SecretID?: string;
                /**
                 * SecretName is the name of the secret that this references,
                 * but this is just provided for lookup/display purposes. The
                 * secret in the reference will be identified by its ID.
                 *
                 */
                SecretName?: string;
            }[];
            /**
             * Configs contains references to zero or more configs that will be
             * exposed to the service.
             *
             */
            Configs?: {
                /**
                 * File represents a specific target that is backed by a file.
                 *
                 * <p><br /><p>
                 *
                 * > **Note**: `Configs.File` and `Configs.Runtime` are mutually exclusive
                 *
                 */
                File?: {
                    /**
                     * Name represents the final filename in the filesystem.
                     *
                     */
                    Name?: string;
                    /**
                     * UID represents the file UID.
                     */
                    UID?: string;
                    /**
                     * GID represents the file GID.
                     */
                    GID?: string;
                    /**
                     * Mode represents the FileMode of the file.
                     */
                    Mode?: number; // uint32
                };
                /**
                 * Runtime represents a target that is not mounted into the
                 * container but is used by the task
                 *
                 * <p><br /><p>
                 *
                 * > **Note**: `Configs.File` and `Configs.Runtime` are mutually
                 * > exclusive
                 *
                 */
                Runtime?: {
                    [key: string]: any;
                };
                /**
                 * ConfigID represents the ID of the specific config that we're
                 * referencing.
                 *
                 */
                ConfigID?: string;
                /**
                 * ConfigName is the name of the config that this references,
                 * but this is just provided for lookup/display purposes. The
                 * config in the reference will be identified by its ID.
                 *
                 */
                ConfigName?: string;
            }[];
            /**
             * Isolation technology of the containers running the service.
             * (Windows only)
             *
             */
            Isolation?: "default" | "process" | "hyperv";
            /**
             * Run an init inside the container that forwards signals and reaps
             * processes. This field is omitted if empty, and the default (as
             * configured on the daemon) is used.
             *
             */
            Init?: boolean;
            /**
             * Set kernel namedspaced parameters (sysctls) in the container.
             * The Sysctls option on services accepts the same sysctls as the
             * are supported on containers. Note that while the same sysctls are
             * supported, no guarantees or checks are made about their
             * suitability for a clustered environment, and it's up to the user
             * to determine whether a given sysctl will work properly in a
             * Service.
             *
             */
            Sysctls?: {
                [name: string]: string;
            };
            /**
             * A list of kernel capabilities to add to the default set
             * for the container.
             *
             * example:
             * [
             *   "CAP_NET_RAW",
             *   "CAP_SYS_ADMIN",
             *   "CAP_SYS_CHROOT",
             *   "CAP_SYSLOG"
             * ]
             */
            CapabilityAdd?: string[];
            /**
             * A list of kernel capabilities to drop from the default set
             * for the container.
             *
             * example:
             * [
             *   "CAP_NET_RAW"
             * ]
             */
            CapabilityDrop?: string[];
            /**
             * A list of resource limits to set in the container. For example: `{"Name": "nofile", "Soft": 1024, "Hard": 2048}`"
             *
             */
            Ulimits?: {
                /**
                 * Name of ulimit
                 */
                Name?: string;
                /**
                 * Soft limit
                 */
                Soft?: number;
                /**
                 * Hard limit
                 */
                Hard?: number;
            }[];
        };
        /**
         * Read-only spec type for non-swarm containers attached to swarm overlay
         * networks.
         *
         * <p><br /></p>
         *
         * > **Note**: ContainerSpec, NetworkAttachmentSpec, and PluginSpec are
         * > mutually exclusive. PluginSpec is only used when the Runtime field
         * > is set to `plugin`. NetworkAttachmentSpec is used when the Runtime
         * > field is set to `attachment`.
         *
         */
        NetworkAttachmentSpec?: {
            /**
             * ID of the container represented by this task
             */
            ContainerID?: string;
        };
        /**
         * Resource requirements which apply to each individual container created
         * as part of the service.
         *
         */
        Resources?: {
            /**
             * Define resources limits.
             */
            Limits?: /**
             * An object describing a limit on resources which can be requested by a task.
             *
             */
            Limit;
            /**
             * Define resources reservation.
             */
            Reservations?: /**
             * An object describing the resources which can be advertised by a node and
             * requested by a task.
             *
             */
            ResourceObject;
        };
        /**
         * Specification for the restart policy which applies to containers
         * created as part of this service.
         *
         */
        RestartPolicy?: {
            /**
             * Condition for restart.
             */
            Condition?: "none" | "on-failure" | "any";
            /**
             * Delay between restart attempts.
             */
            Delay?: number; // int64
            /**
             * Maximum attempts to restart a given container before giving up
             * (default value is 0, which is ignored).
             *
             */
            MaxAttempts?: number; // int64
            /**
             * Windows is the time window used to evaluate the restart policy
             * (default value is 0, which is unbounded).
             *
             */
            Window?: number; // int64
        };
        Placement?: {
            /**
             * An array of constraint expressions to limit the set of nodes where
             * a task can be scheduled. Constraint expressions can either use a
             * _match_ (`==`) or _exclude_ (`!=`) rule. Multiple constraints find
             * nodes that satisfy every expression (AND match). Constraints can
             * match node or Docker Engine labels as follows:
             *
             * node attribute       | matches                        | example
             * ---------------------|--------------------------------|-----------------------------------------------
             * `node.id`            | Node ID                        | `node.id==2ivku8v2gvtg4`
             * `node.hostname`      | Node hostname                  | `node.hostname!=node-2`
             * `node.role`          | Node role (`manager`/`worker`) | `node.role==manager`
             * `node.platform.os`   | Node operating system          | `node.platform.os==windows`
             * `node.platform.arch` | Node architecture              | `node.platform.arch==x86_64`
             * `node.labels`        | User-defined node labels       | `node.labels.security==high`
             * `engine.labels`      | Docker Engine's labels         | `engine.labels.operatingsystem==ubuntu-14.04`
             *
             * `engine.labels` apply to Docker Engine labels like operating system,
             * drivers, etc. Swarm administrators add `node.labels` for operational
             * purposes by using the [`node update endpoint`](#operation/NodeUpdate).
             *
             * example:
             * [
             *   "node.hostname!=node3.corp.example.com",
             *   "node.role!=manager",
             *   "node.labels.type==production",
             *   "node.platform.os==linux",
             *   "node.platform.arch==x86_64"
             * ]
             */
            Constraints?: string[];
            /**
             * Preferences provide a way to make the scheduler aware of factors
             * such as topology. They are provided in order from highest to
             * lowest precedence.
             *
             * example:
             * [
             *   {
             *     "Spread": {
             *       "SpreadDescriptor": "node.labels.datacenter"
             *     }
             *   },
             *   {
             *     "Spread": {
             *       "SpreadDescriptor": "node.labels.rack"
             *     }
             *   }
             * ]
             */
            Preferences?: {
                Spread?: {
                    /**
                     * label descriptor, such as `engine.labels.az`.
                     *
                     */
                    SpreadDescriptor?: string;
                };
            }[];
            /**
             * Maximum number of replicas for per node (default value is 0, which
             * is unlimited)
             *
             */
            MaxReplicas?: number; // int64
            /**
             * Platforms stores all the platforms that the service's image can
             * run on. This field is used in the platform filter for scheduling.
             * If empty, then the platform filter is off, meaning there are no
             * scheduling restrictions.
             *
             */
            Platforms?: /**
             * Platform represents the platform (Arch/OS).
             *
             */
            Platform[];
        };
        /**
         * A counter that triggers an update even if no relevant parameters have
         * been changed.
         *
         */
        ForceUpdate?: number;
        /**
         * Runtime is the type of runtime specified for the task executor.
         *
         */
        Runtime?: string;
        /**
         * Specifies which networks the service should attach to.
         */
        Networks?: /**
         * Specifies how a service should be attached to a particular network.
         *
         */
        NetworkAttachmentConfig[];
        /**
         * Specifies the log driver to use for tasks created from this spec. If
         * not present, the default one for the swarm will be used, finally
         * falling back to the engine default if not specified.
         *
         */
        LogDriver?: {
            Name?: string;
            Options?: {
                [name: string]: string;
            };
        };
    }
    export type TaskState = "new" | "allocated" | "pending" | "assigned" | "accepted" | "preparing" | "ready" | "starting" | "running" | "complete" | "shutdown" | "failed" | "rejected" | "remove" | "orphaned";
    export interface ThrottleDevice {
        /**
         * Device path
         */
        Path?: string;
        /**
         * Rate
         */
        Rate?: number; // int64
    }
    /**
     * A map of topological domains to topological segments. For in depth
     * details, see documentation for the Topology object in the CSI
     * specification.
     *
     */
    export interface Topology {
        [name: string]: string;
    }
    export interface Volume {
        /**
         * Name of the volume.
         * example:
         * tardis
         */
        Name: string;
        /**
         * Name of the volume driver used by the volume.
         * example:
         * custom
         */
        Driver: string;
        /**
         * Mount path of the volume on the host.
         * example:
         * /var/lib/docker/volumes/tardis
         */
        Mountpoint: string;
        /**
         * Date/Time the volume was created.
         * example:
         * 2016-06-07T20:31:11.853781916Z
         */
        CreatedAt?: string; // dateTime
        /**
         * Low-level details about the volume, provided by the volume driver.
         * Details are returned as a map with key/value pairs:
         * `{"key":"value","key2":"value2"}`.
         *
         * The `Status` field is optional, and is omitted if the volume driver
         * does not support this feature.
         *
         * example:
         * {
         *   "hello": "world"
         * }
         */
        Status?: {
            [name: string]: {
                [key: string]: any;
            };
        };
        /**
         * User-defined key/value metadata.
         * example:
         * {
         *   "com.example.some-label": "some-value",
         *   "com.example.some-other-label": "some-other-value"
         * }
         */
        Labels: {
            [name: string]: string;
        };
        /**
         * The level at which the volume exists. Either `global` for cluster-wide,
         * or `local` for machine level.
         *
         * example:
         * local
         */
        Scope: "local" | "global";
        ClusterVolume?: /**
         * Options and information specific to, and only present on, Swarm CSI
         * cluster volumes.
         *
         */
        ClusterVolume;
        /**
         * The driver specific options used when creating the volume.
         *
         * example:
         * {
         *   "device": "tmpfs",
         *   "o": "size=100m,uid=1000",
         *   "type": "tmpfs"
         * }
         */
        Options: {
            [name: string]: string;
        };
        /**
         * Usage details about the volume. This information is used by the
         * `GET /system/df` endpoint, and omitted in other endpoints.
         *
         */
        UsageData?: {
            /**
             * Amount of disk space used by the volume (in bytes). This information
             * is only available for volumes created with the `"local"` volume
             * driver. For volumes created with other volume drivers, this field
             * is set to `-1` ("not available")
             *
             */
            Size: number; // int64
            /**
             * The number of containers referencing this volume. This field
             * is set to `-1` if the reference-count is not available.
             *
             */
            RefCount: number; // int64
        };
    }
    /**
     * VolumeConfig
     * Volume configuration
     */
    export interface VolumeCreateOptions {
        /**
         * The new volume's name. If not specified, Docker generates a name.
         *
         * example:
         * tardis
         */
        Name?: string;
        /**
         * Name of the volume driver to use.
         * example:
         * custom
         */
        Driver?: string;
        /**
         * A mapping of driver options and values. These options are
         * passed directly to the driver and are driver specific.
         *
         * example:
         * {
         *   "device": "tmpfs",
         *   "o": "size=100m,uid=1000",
         *   "type": "tmpfs"
         * }
         */
        DriverOpts?: {
            [name: string]: string;
        };
        /**
         * User-defined key/value metadata.
         * example:
         * {
         *   "com.example.some-label": "some-value",
         *   "com.example.some-other-label": "some-other-value"
         * }
         */
        Labels?: {
            [name: string]: string;
        };
        ClusterVolumeSpec?: /**
         * Cluster-specific options used to create the volume.
         *
         */
        ClusterVolumeSpec;
    }
    /**
     * VolumeListResponse
     * Volume list response
     */
    export interface VolumeListResponse {
        /**
         * List of volumes
         */
        Volumes?: Volume[];
        /**
         * Warnings that occurred when fetching the list of volumes.
         *
         * example:
         * []
         */
        Warnings?: string[];
    }
}
declare namespace slime.external.docker.engine.paths {
    namespace BuildPrune {
        namespace Parameters {
            /**
             * Remove all types of build cache
             */
            export type All = boolean;
            /**
             * A JSON encoded value of the filters (a `map[string][]string`) to
             * process on the list of build cache objects.
             *
             * Available filters:
             *
             * - `until=<timestamp>` remove cache older than `<timestamp>`. The `<timestamp>` can be Unix timestamps, date formatted timestamps, or Go duration strings (e.g. `10m`, `1h30m`) computed relative to the daemon's local time.
             * - `id=<id>`
             * - `parent=<id>`
             * - `type=<string>`
             * - `description=<string>`
             * - `inuse`
             * - `shared`
             * - `private`
             *
             */
            export type Filters = string;
            /**
             * Amount of disk space in bytes to keep for cache
             */
            export type KeepStorage = number; // int64
        }
        export interface QueryParameters {
            "keep-storage"?: /* Amount of disk space in bytes to keep for cache */ Parameters.KeepStorage /* int64 */;
            all?: /* Remove all types of build cache */ Parameters.All;
            filters?: /**
             * A JSON encoded value of the filters (a `map[string][]string`) to
             * process on the list of build cache objects.
             *
             * Available filters:
             *
             * - `until=<timestamp>` remove cache older than `<timestamp>`. The `<timestamp>` can be Unix timestamps, date formatted timestamps, or Go duration strings (e.g. `10m`, `1h30m`) computed relative to the daemon's local time.
             * - `id=<id>`
             * - `parent=<id>`
             * - `type=<string>`
             * - `description=<string>`
             * - `inuse`
             * - `shared`
             * - `private`
             *
             */
            Parameters.Filters;
        }
        namespace Responses {
            /**
             * BuildPruneResponse
             */
            export interface $200 {
                CachesDeleted?: string[];
                /**
                 * Disk space reclaimed in bytes
                 */
                SpaceReclaimed?: number; // int64
            }
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace ConfigCreate {
        export interface BodyParameters {
            body?: /**
             * example:
             * {
             *   "Name": "server.conf",
             *   "Labels": {
             *     "foo": "bar"
             *   },
             *   "Data": "VEhJUyBJUyBOT1QgQSBSRUFMIENFUlRJRklDQVRFCg=="
             * }
             */
            Parameters.Body;
        }
        namespace Parameters {
            /**
             * example:
             * {
             *   "Name": "server.conf",
             *   "Labels": {
             *     "foo": "bar"
             *   },
             *   "Data": "VEhJUyBJUyBOT1QgQSBSRUFMIENFUlRJRklDQVRFCg=="
             * }
             */
            export interface Body {
                /**
                 * User-defined name of the config.
                 */
                Name?: string;
                /**
                 * User-defined key/value metadata.
                 */
                Labels?: {
                    [name: string]: string;
                };
                /**
                 * Base64-url-safe-encoded ([RFC 4648](https://tools.ietf.org/html/rfc4648#section-5))
                 * config data.
                 *
                 */
                Data?: string;
                Templating?: /* Driver represents a driver (network, logging, secrets). */ slime.external.docker.engine.definitions.Driver;
            }
        }
        namespace Responses {
            export type $201 = /* Response to an API call that returns just an Id */ slime.external.docker.engine.definitions.IdResponse;
            export type $409 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $503 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace ConfigDelete {
        namespace Parameters {
            /**
             * ID of the config
             */
            export type Id = string;
        }
        export interface PathParameters {
            id: /* ID of the config */ Parameters.Id;
        }
        namespace Responses {
            export type $404 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $503 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace ConfigInspect {
        namespace Parameters {
            /**
             * ID of the config
             */
            export type Id = string;
        }
        export interface PathParameters {
            id: /* ID of the config */ Parameters.Id;
        }
        namespace Responses {
            export type $200 = slime.external.docker.engine.definitions.Config;
            export type $404 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $503 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace ConfigList {
        namespace Parameters {
            /**
             * A JSON encoded value of the filters (a `map[string][]string`) to
             * process on the configs list.
             *
             * Available filters:
             *
             * - `id=<config id>`
             * - `label=<key> or label=<key>=value`
             * - `name=<config name>`
             * - `names=<config name>`
             *
             */
            export type Filters = string;
        }
        export interface QueryParameters {
            filters?: /**
             * A JSON encoded value of the filters (a `map[string][]string`) to
             * process on the configs list.
             *
             * Available filters:
             *
             * - `id=<config id>`
             * - `label=<key> or label=<key>=value`
             * - `name=<config name>`
             * - `names=<config name>`
             *
             */
            Parameters.Filters;
        }
        namespace Responses {
            /**
             * example:
             * [
             *   {
             *     "ID": "ktnbjxoalbkvbvedmg1urrz8h",
             *     "Version": {
             *       "Index": 11
             *     },
             *     "CreatedAt": "2016-11-05T01:20:17.327670065Z",
             *     "UpdatedAt": "2016-11-05T01:20:17.327670065Z",
             *     "Spec": {
             *       "Name": "server.conf"
             *     }
             *   }
             * ]
             */
            export type $200 = slime.external.docker.engine.definitions.Config[];
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $503 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace ConfigUpdate {
        export interface BodyParameters {
            body?: Parameters.Body;
        }
        namespace Parameters {
            export type Body = slime.external.docker.engine.definitions.ConfigSpec;
            /**
             * The ID or name of the config
             */
            export type Id = string;
            /**
             * The version number of the config object being updated. This is
             * required to avoid conflicting writes.
             *
             */
            export type Version = number; // int64
        }
        export interface PathParameters {
            id: /* The ID or name of the config */ Parameters.Id;
        }
        export interface QueryParameters {
            version: /**
             * The version number of the config object being updated. This is
             * required to avoid conflicting writes.
             *
             */
            Parameters.Version /* int64 */;
        }
        namespace Responses {
            export type $400 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $404 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $503 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace ContainerArchive {
        namespace Parameters {
            /**
             * ID or name of the container
             */
            export type Id = string;
            /**
             * Resource in the container’s filesystem to archive.
             */
            export type Path = string;
        }
        export interface PathParameters {
            id: /* ID or name of the container */ Parameters.Id;
        }
        export interface QueryParameters {
            path: /* Resource in the container’s filesystem to archive. */ Parameters.Path;
        }
        namespace Responses {
            export type $400 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $404 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace ContainerArchiveInfo {
        namespace Parameters {
            /**
             * ID or name of the container
             */
            export type Id = string;
            /**
             * Resource in the container’s filesystem to archive.
             */
            export type Path = string;
        }
        export interface PathParameters {
            id: /* ID or name of the container */ Parameters.Id;
        }
        export interface QueryParameters {
            path: /* Resource in the container’s filesystem to archive. */ Parameters.Path;
        }
        namespace Responses {
            export type $400 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $404 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace ContainerAttach {
        namespace Parameters {
            /**
             * Override the key sequence for detaching a container.Format is a single
             * character `[a-Z]` or `ctrl-<value>` where `<value>` is one of: `a-z`,
             * `@`, `^`, `[`, `,` or `_`.
             *
             */
            export type DetachKeys = string;
            /**
             * ID or name of the container
             */
            export type Id = string;
            /**
             * Replay previous logs from the container.
             *
             * This is useful for attaching to a container that has started and you
             * want to output everything since the container started.
             *
             * If `stream` is also enabled, once all the previous output has been
             * returned, it will seamlessly transition into streaming current
             * output.
             *
             */
            export type Logs = boolean;
            /**
             * Attach to `stderr`
             */
            export type Stderr = boolean;
            /**
             * Attach to `stdin`
             */
            export type Stdin = boolean;
            /**
             * Attach to `stdout`
             */
            export type Stdout = boolean;
            /**
             * Stream attached streams from the time the request was made onwards.
             *
             */
            export type Stream = boolean;
        }
        export interface PathParameters {
            id: /* ID or name of the container */ Parameters.Id;
        }
        export interface QueryParameters {
            detachKeys?: /**
             * Override the key sequence for detaching a container.Format is a single
             * character `[a-Z]` or `ctrl-<value>` where `<value>` is one of: `a-z`,
             * `@`, `^`, `[`, `,` or `_`.
             *
             */
            Parameters.DetachKeys;
            logs?: /**
             * Replay previous logs from the container.
             *
             * This is useful for attaching to a container that has started and you
             * want to output everything since the container started.
             *
             * If `stream` is also enabled, once all the previous output has been
             * returned, it will seamlessly transition into streaming current
             * output.
             *
             */
            Parameters.Logs;
            stream?: /**
             * Stream attached streams from the time the request was made onwards.
             *
             */
            Parameters.Stream;
            stdin?: /* Attach to `stdin` */ Parameters.Stdin;
            stdout?: /* Attach to `stdout` */ Parameters.Stdout;
            stderr?: /* Attach to `stderr` */ Parameters.Stderr;
        }
        namespace Responses {
            export type $400 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $404 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace ContainerAttachWebsocket {
        namespace Parameters {
            /**
             * Override the key sequence for detaching a container.Format is a single
             * character `[a-Z]` or `ctrl-<value>` where `<value>` is one of: `a-z`,
             * `@`, `^`, `[`, `,`, or `_`.
             *
             */
            export type DetachKeys = string;
            /**
             * ID or name of the container
             */
            export type Id = string;
            /**
             * Return logs
             */
            export type Logs = boolean;
            /**
             * Attach to `stderr`
             */
            export type Stderr = boolean;
            /**
             * Attach to `stdin`
             */
            export type Stdin = boolean;
            /**
             * Attach to `stdout`
             */
            export type Stdout = boolean;
            /**
             * Return stream
             */
            export type Stream = boolean;
        }
        export interface PathParameters {
            id: /* ID or name of the container */ Parameters.Id;
        }
        export interface QueryParameters {
            detachKeys?: /**
             * Override the key sequence for detaching a container.Format is a single
             * character `[a-Z]` or `ctrl-<value>` where `<value>` is one of: `a-z`,
             * `@`, `^`, `[`, `,`, or `_`.
             *
             */
            Parameters.DetachKeys;
            logs?: /* Return logs */ Parameters.Logs;
            stream?: /* Return stream */ Parameters.Stream;
            stdin?: /* Attach to `stdin` */ Parameters.Stdin;
            stdout?: /* Attach to `stdout` */ Parameters.Stdout;
            stderr?: /* Attach to `stderr` */ Parameters.Stderr;
        }
        namespace Responses {
            export type $400 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $404 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace ContainerChanges {
        namespace Parameters {
            /**
             * ID or name of the container
             */
            export type Id = string;
        }
        export interface PathParameters {
            id: /* ID or name of the container */ Parameters.Id;
        }
        namespace Responses {
            export type $200 = /**
             * Change in the container's filesystem.
             *
             */
            slime.external.docker.engine.definitions.FilesystemChange[];
            export type $404 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace ContainerCreate {
        export interface BodyParameters {
            body: /**
             * Configuration for a container that is portable between hosts.
             *
             * When used as `ContainerConfig` field in an image, `ContainerConfig` is an
             * optional field containing the configuration of the container that was last
             * committed when creating the image.
             *
             * Previous versions of Docker builder used this field to store build cache,
             * and it is not in active use anymore.
             *
             * example:
             * {
             *   "Hostname": "",
             *   "Domainname": "",
             *   "User": "",
             *   "AttachStdin": false,
             *   "AttachStdout": true,
             *   "AttachStderr": true,
             *   "Tty": false,
             *   "OpenStdin": false,
             *   "StdinOnce": false,
             *   "Env": [
             *     "FOO=bar",
             *     "BAZ=quux"
             *   ],
             *   "Cmd": [
             *     "date"
             *   ],
             *   "Entrypoint": "",
             *   "Image": "ubuntu",
             *   "Labels": {
             *     "com.example.vendor": "Acme",
             *     "com.example.license": "GPL",
             *     "com.example.version": "1.0"
             *   },
             *   "Volumes": {
             *     "/volumes/data": {}
             *   },
             *   "WorkingDir": "",
             *   "NetworkDisabled": false,
             *   "MacAddress": "12:34:56:78:9a:bc",
             *   "ExposedPorts": {
             *     "22/tcp": {}
             *   },
             *   "StopSignal": "SIGTERM",
             *   "StopTimeout": 10,
             *   "HostConfig": {
             *     "Binds": [
             *       "/tmp:/tmp"
             *     ],
             *     "Links": [
             *       "redis3:redis"
             *     ],
             *     "Memory": 0,
             *     "MemorySwap": 0,
             *     "MemoryReservation": 0,
             *     "NanoCpus": 500000,
             *     "CpuPercent": 80,
             *     "CpuShares": 512,
             *     "CpuPeriod": 100000,
             *     "CpuRealtimePeriod": 1000000,
             *     "CpuRealtimeRuntime": 10000,
             *     "CpuQuota": 50000,
             *     "CpusetCpus": "0,1",
             *     "CpusetMems": "0,1",
             *     "MaximumIOps": 0,
             *     "MaximumIOBps": 0,
             *     "BlkioWeight": 300,
             *     "BlkioWeightDevice": [
             *       {}
             *     ],
             *     "BlkioDeviceReadBps": [
             *       {}
             *     ],
             *     "BlkioDeviceReadIOps": [
             *       {}
             *     ],
             *     "BlkioDeviceWriteBps": [
             *       {}
             *     ],
             *     "BlkioDeviceWriteIOps": [
             *       {}
             *     ],
             *     "DeviceRequests": [
             *       {
             *         "Driver": "nvidia",
             *         "Count": -1,
             *         "DeviceIDs\"": [
             *           "0",
             *           "1",
             *           "GPU-fef8089b-4820-abfc-e83e-94318197576e"
             *         ],
             *         "Capabilities": [
             *           [
             *             "gpu",
             *             "nvidia",
             *             "compute"
             *           ]
             *         ],
             *         "Options": {
             *           "property1": "string",
             *           "property2": "string"
             *         }
             *       }
             *     ],
             *     "MemorySwappiness": 60,
             *     "OomKillDisable": false,
             *     "OomScoreAdj": 500,
             *     "PidMode": "",
             *     "PidsLimit": 0,
             *     "PortBindings": {
             *       "22/tcp": [
             *         {
             *           "HostPort": "11022"
             *         }
             *       ]
             *     },
             *     "PublishAllPorts": false,
             *     "Privileged": false,
             *     "ReadonlyRootfs": false,
             *     "Dns": [
             *       "8.8.8.8"
             *     ],
             *     "DnsOptions": [
             *       ""
             *     ],
             *     "DnsSearch": [
             *       ""
             *     ],
             *     "VolumesFrom": [
             *       "parent",
             *       "other:ro"
             *     ],
             *     "CapAdd": [
             *       "NET_ADMIN"
             *     ],
             *     "CapDrop": [
             *       "MKNOD"
             *     ],
             *     "GroupAdd": [
             *       "newgroup"
             *     ],
             *     "RestartPolicy": {
             *       "Name": "",
             *       "MaximumRetryCount": 0
             *     },
             *     "AutoRemove": true,
             *     "NetworkMode": "bridge",
             *     "Devices": [],
             *     "Ulimits": [
             *       {}
             *     ],
             *     "LogConfig": {
             *       "Type": "json-file",
             *       "Config": {}
             *     },
             *     "SecurityOpt": [],
             *     "StorageOpt": {},
             *     "CgroupParent": "",
             *     "VolumeDriver": "",
             *     "ShmSize": 67108864
             *   },
             *   "NetworkingConfig": {
             *     "EndpointsConfig": {
             *       "isolated_nw": {
             *         "IPAMConfig": {
             *           "IPv4Address": "172.20.30.33",
             *           "IPv6Address": "2001:db8:abcd::3033",
             *           "LinkLocalIPs": [
             *             "169.254.34.68",
             *             "fe80::3468"
             *           ]
             *         },
             *         "Links": [
             *           "container_1",
             *           "container_2"
             *         ],
             *         "Aliases": [
             *           "server_x",
             *           "server_y"
             *         ]
             *       }
             *     }
             *   }
             * }
             */
            Parameters.Body;
        }
        namespace Parameters {
            /**
             * Configuration for a container that is portable between hosts.
             *
             * When used as `ContainerConfig` field in an image, `ContainerConfig` is an
             * optional field containing the configuration of the container that was last
             * committed when creating the image.
             *
             * Previous versions of Docker builder used this field to store build cache,
             * and it is not in active use anymore.
             *
             * example:
             * {
             *   "Hostname": "",
             *   "Domainname": "",
             *   "User": "",
             *   "AttachStdin": false,
             *   "AttachStdout": true,
             *   "AttachStderr": true,
             *   "Tty": false,
             *   "OpenStdin": false,
             *   "StdinOnce": false,
             *   "Env": [
             *     "FOO=bar",
             *     "BAZ=quux"
             *   ],
             *   "Cmd": [
             *     "date"
             *   ],
             *   "Entrypoint": "",
             *   "Image": "ubuntu",
             *   "Labels": {
             *     "com.example.vendor": "Acme",
             *     "com.example.license": "GPL",
             *     "com.example.version": "1.0"
             *   },
             *   "Volumes": {
             *     "/volumes/data": {}
             *   },
             *   "WorkingDir": "",
             *   "NetworkDisabled": false,
             *   "MacAddress": "12:34:56:78:9a:bc",
             *   "ExposedPorts": {
             *     "22/tcp": {}
             *   },
             *   "StopSignal": "SIGTERM",
             *   "StopTimeout": 10,
             *   "HostConfig": {
             *     "Binds": [
             *       "/tmp:/tmp"
             *     ],
             *     "Links": [
             *       "redis3:redis"
             *     ],
             *     "Memory": 0,
             *     "MemorySwap": 0,
             *     "MemoryReservation": 0,
             *     "NanoCpus": 500000,
             *     "CpuPercent": 80,
             *     "CpuShares": 512,
             *     "CpuPeriod": 100000,
             *     "CpuRealtimePeriod": 1000000,
             *     "CpuRealtimeRuntime": 10000,
             *     "CpuQuota": 50000,
             *     "CpusetCpus": "0,1",
             *     "CpusetMems": "0,1",
             *     "MaximumIOps": 0,
             *     "MaximumIOBps": 0,
             *     "BlkioWeight": 300,
             *     "BlkioWeightDevice": [
             *       {}
             *     ],
             *     "BlkioDeviceReadBps": [
             *       {}
             *     ],
             *     "BlkioDeviceReadIOps": [
             *       {}
             *     ],
             *     "BlkioDeviceWriteBps": [
             *       {}
             *     ],
             *     "BlkioDeviceWriteIOps": [
             *       {}
             *     ],
             *     "DeviceRequests": [
             *       {
             *         "Driver": "nvidia",
             *         "Count": -1,
             *         "DeviceIDs\"": [
             *           "0",
             *           "1",
             *           "GPU-fef8089b-4820-abfc-e83e-94318197576e"
             *         ],
             *         "Capabilities": [
             *           [
             *             "gpu",
             *             "nvidia",
             *             "compute"
             *           ]
             *         ],
             *         "Options": {
             *           "property1": "string",
             *           "property2": "string"
             *         }
             *       }
             *     ],
             *     "MemorySwappiness": 60,
             *     "OomKillDisable": false,
             *     "OomScoreAdj": 500,
             *     "PidMode": "",
             *     "PidsLimit": 0,
             *     "PortBindings": {
             *       "22/tcp": [
             *         {
             *           "HostPort": "11022"
             *         }
             *       ]
             *     },
             *     "PublishAllPorts": false,
             *     "Privileged": false,
             *     "ReadonlyRootfs": false,
             *     "Dns": [
             *       "8.8.8.8"
             *     ],
             *     "DnsOptions": [
             *       ""
             *     ],
             *     "DnsSearch": [
             *       ""
             *     ],
             *     "VolumesFrom": [
             *       "parent",
             *       "other:ro"
             *     ],
             *     "CapAdd": [
             *       "NET_ADMIN"
             *     ],
             *     "CapDrop": [
             *       "MKNOD"
             *     ],
             *     "GroupAdd": [
             *       "newgroup"
             *     ],
             *     "RestartPolicy": {
             *       "Name": "",
             *       "MaximumRetryCount": 0
             *     },
             *     "AutoRemove": true,
             *     "NetworkMode": "bridge",
             *     "Devices": [],
             *     "Ulimits": [
             *       {}
             *     ],
             *     "LogConfig": {
             *       "Type": "json-file",
             *       "Config": {}
             *     },
             *     "SecurityOpt": [],
             *     "StorageOpt": {},
             *     "CgroupParent": "",
             *     "VolumeDriver": "",
             *     "ShmSize": 67108864
             *   },
             *   "NetworkingConfig": {
             *     "EndpointsConfig": {
             *       "isolated_nw": {
             *         "IPAMConfig": {
             *           "IPv4Address": "172.20.30.33",
             *           "IPv6Address": "2001:db8:abcd::3033",
             *           "LinkLocalIPs": [
             *             "169.254.34.68",
             *             "fe80::3468"
             *           ]
             *         },
             *         "Links": [
             *           "container_1",
             *           "container_2"
             *         ],
             *         "Aliases": [
             *           "server_x",
             *           "server_y"
             *         ]
             *       }
             *     }
             *   }
             * }
             */
            export interface Body {
                /**
                 * The hostname to use for the container, as a valid RFC 1123 hostname.
                 *
                 * example:
                 * 439f4e91bd1d
                 */
                Hostname?: string;
                /**
                 * The domain name to use for the container.
                 *
                 */
                Domainname?: string;
                /**
                 * The user that commands are run as inside the container.
                 */
                User?: string;
                /**
                 * Whether to attach to `stdin`.
                 */
                AttachStdin?: boolean;
                /**
                 * Whether to attach to `stdout`.
                 */
                AttachStdout?: boolean;
                /**
                 * Whether to attach to `stderr`.
                 */
                AttachStderr?: boolean;
                /**
                 * An object mapping ports to an empty object in the form:
                 *
                 * `{"<port>/<tcp|udp|sctp>": {}}`
                 *
                 * example:
                 * {
                 *   "80/tcp": {},
                 *   "443/tcp": {}
                 * }
                 */
                ExposedPorts?: {
                    [name: string]: "[object Object]";
                };
                /**
                 * Attach standard streams to a TTY, including `stdin` if it is not closed.
                 *
                 */
                Tty?: boolean;
                /**
                 * Open `stdin`
                 */
                OpenStdin?: boolean;
                /**
                 * Close `stdin` after one attached client disconnects
                 */
                StdinOnce?: boolean;
                /**
                 * A list of environment variables to set inside the container in the
                 * form `["VAR=value", ...]`. A variable without `=` is removed from the
                 * environment, rather than to have an empty value.
                 *
                 * example:
                 * [
                 *   "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
                 * ]
                 */
                Env?: string[];
                /**
                 * Command to run specified as a string or an array of strings.
                 *
                 * example:
                 * [
                 *   "/bin/sh"
                 * ]
                 */
                Cmd?: string[];
                Healthcheck?: /* A test to perform to check that the container is healthy. */ slime.external.docker.engine.definitions.HealthConfig;
                /**
                 * Command is already escaped (Windows only)
                 * example:
                 * false
                 */
                ArgsEscaped?: boolean;
                /**
                 * The name (or reference) of the image to use when creating the container,
                 * or which was used when the container was created.
                 *
                 * example:
                 * example-image:1.0
                 */
                Image?: string;
                /**
                 * An object mapping mount point paths inside the container to empty
                 * objects.
                 *
                 */
                Volumes?: {
                    [name: string]: "[object Object]";
                };
                /**
                 * The working directory for commands to run in.
                 * example:
                 * /public/
                 */
                WorkingDir?: string;
                /**
                 * The entry point for the container as a string or an array of strings.
                 *
                 * If the array consists of exactly one empty string (`[""]`) then the
                 * entry point is reset to system default (i.e., the entry point used by
                 * docker when there is no `ENTRYPOINT` instruction in the `Dockerfile`).
                 *
                 * example:
                 * []
                 */
                Entrypoint?: string[];
                /**
                 * Disable networking for the container.
                 */
                NetworkDisabled?: boolean;
                /**
                 * MAC address of the container.
                 */
                MacAddress?: string;
                /**
                 * `ONBUILD` metadata that were defined in the image's `Dockerfile`.
                 *
                 * example:
                 * []
                 */
                OnBuild?: string[];
                /**
                 * User-defined key/value metadata.
                 * example:
                 * {
                 *   "com.example.some-label": "some-value",
                 *   "com.example.some-other-label": "some-other-value"
                 * }
                 */
                Labels?: {
                    [name: string]: string;
                };
                /**
                 * Signal to stop a container as a string or unsigned integer.
                 *
                 * example:
                 * SIGTERM
                 */
                StopSignal?: string;
                /**
                 * Timeout to stop a container in seconds.
                 */
                StopTimeout?: number;
                /**
                 * Shell for when `RUN`, `CMD`, and `ENTRYPOINT` uses a shell.
                 *
                 * example:
                 * [
                 *   "/bin/sh",
                 *   "-c"
                 * ]
                 */
                Shell?: string[];
                HostConfig?: /* Container configuration that depends on the host we are running on */ slime.external.docker.engine.definitions.HostConfig;
                NetworkingConfig?: /**
                 * NetworkingConfig represents the container's networking configuration for
                 * each of its interfaces.
                 * It is used for the networking configs specified in the `docker create`
                 * and `docker network connect` commands.
                 *
                 * example:
                 * {
                 *   "EndpointsConfig": {
                 *     "isolated_nw": {
                 *       "IPAMConfig": {
                 *         "IPv4Address": "172.20.30.33",
                 *         "IPv6Address": "2001:db8:abcd::3033",
                 *         "LinkLocalIPs": [
                 *           "169.254.34.68",
                 *           "fe80::3468"
                 *         ]
                 *       },
                 *       "Links": [
                 *         "container_1",
                 *         "container_2"
                 *       ],
                 *       "Aliases": [
                 *         "server_x",
                 *         "server_y"
                 *       ]
                 *     }
                 *   }
                 * }
                 */
                slime.external.docker.engine.definitions.NetworkingConfig;
            }
            /**
             * Assign the specified name to the container. Must match
             * `/?[a-zA-Z0-9][a-zA-Z0-9_.-]+`.
             *
             */
            export type Name = string; // ^/?[a-zA-Z0-9][a-zA-Z0-9_.-]+$
            /**
             * Platform in the format `os[/arch[/variant]]` used for image lookup.
             *
             * When specified, the daemon checks if the requested image is present
             * in the local image cache with the given OS and Architecture, and
             * otherwise returns a `404` status.
             *
             * If the option is not set, the host's native OS and Architecture are
             * used to look up the image in the image cache. However, if no platform
             * is passed and the given image does exist in the local image cache,
             * but its OS or architecture does not match, the container is created
             * with the available image, and a warning is added to the `Warnings`
             * field in the response, for example;
             *
             *     WARNING: The requested image's platform (linux/arm64/v8) does not
             *              match the detected host platform (linux/amd64) and no
             *              specific platform was requested
             *
             */
            export type Platform = string;
        }
        export interface QueryParameters {
            name?: /**
             * Assign the specified name to the container. Must match
             * `/?[a-zA-Z0-9][a-zA-Z0-9_.-]+`.
             *
             */
            Parameters.Name /* ^/?[a-zA-Z0-9][a-zA-Z0-9_.-]+$ */;
            platform?: /**
             * Platform in the format `os[/arch[/variant]]` used for image lookup.
             *
             * When specified, the daemon checks if the requested image is present
             * in the local image cache with the given OS and Architecture, and
             * otherwise returns a `404` status.
             *
             * If the option is not set, the host's native OS and Architecture are
             * used to look up the image in the image cache. However, if no platform
             * is passed and the given image does exist in the local image cache,
             * but its OS or architecture does not match, the container is created
             * with the available image, and a warning is added to the `Warnings`
             * field in the response, for example;
             *
             *     WARNING: The requested image's platform (linux/arm64/v8) does not
             *              match the detected host platform (linux/amd64) and no
             *              specific platform was requested
             *
             */
            Parameters.Platform;
        }
        namespace Responses {
            export type $201 = /**
             * ContainerCreateResponse
             * OK response to ContainerCreate operation
             */
            slime.external.docker.engine.definitions.ContainerCreateResponse;
            export type $400 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $404 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $409 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace ContainerDelete {
        namespace Parameters {
            /**
             * If the container is running, kill it before removing it.
             */
            export type Force = boolean;
            /**
             * ID or name of the container
             */
            export type Id = string;
            /**
             * Remove the specified link associated with the container.
             */
            export type Link = boolean;
            /**
             * Remove anonymous volumes associated with the container.
             */
            export type V = boolean;
        }
        export interface PathParameters {
            id: /* ID or name of the container */ Parameters.Id;
        }
        export interface QueryParameters {
            v?: /* Remove anonymous volumes associated with the container. */ Parameters.V;
            force?: /* If the container is running, kill it before removing it. */ Parameters.Force;
            link?: /* Remove the specified link associated with the container. */ Parameters.Link;
        }
        namespace Responses {
            export type $400 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $404 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $409 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace ContainerExec {
        export interface BodyParameters {
            execConfig: /**
             * ExecConfig
             * example:
             * {
             *   "AttachStdin": false,
             *   "AttachStdout": true,
             *   "AttachStderr": true,
             *   "DetachKeys": "ctrl-p,ctrl-q",
             *   "Tty": false,
             *   "Cmd": [
             *     "date"
             *   ],
             *   "Env": [
             *     "FOO=bar",
             *     "BAZ=quux"
             *   ]
             * }
             */
            Parameters.ExecConfig;
        }
        namespace Parameters {
            /**
             * ExecConfig
             * example:
             * {
             *   "AttachStdin": false,
             *   "AttachStdout": true,
             *   "AttachStderr": true,
             *   "DetachKeys": "ctrl-p,ctrl-q",
             *   "Tty": false,
             *   "Cmd": [
             *     "date"
             *   ],
             *   "Env": [
             *     "FOO=bar",
             *     "BAZ=quux"
             *   ]
             * }
             */
            export interface ExecConfig {
                /**
                 * Attach to `stdin` of the exec command.
                 */
                AttachStdin?: boolean;
                /**
                 * Attach to `stdout` of the exec command.
                 */
                AttachStdout?: boolean;
                /**
                 * Attach to `stderr` of the exec command.
                 */
                AttachStderr?: boolean;
                /**
                 * Initial console size, as an `[height, width]` array.
                 */
                ConsoleSize?: [
                    number,
                    number
                ];
                /**
                 * Override the key sequence for detaching a container. Format is
                 * a single character `[a-Z]` or `ctrl-<value>` where `<value>`
                 * is one of: `a-z`, `@`, `^`, `[`, `,` or `_`.
                 *
                 */
                DetachKeys?: string;
                /**
                 * Allocate a pseudo-TTY.
                 */
                Tty?: boolean;
                /**
                 * A list of environment variables in the form `["VAR=value", ...]`.
                 *
                 */
                Env?: string[];
                /**
                 * Command to run, as a string or array of strings.
                 */
                Cmd?: string[];
                /**
                 * Runs the exec process with extended privileges.
                 */
                Privileged?: boolean;
                /**
                 * The user, and optionally, group to run the exec process inside
                 * the container. Format is one of: `user`, `user:group`, `uid`,
                 * or `uid:gid`.
                 *
                 */
                User?: string;
                /**
                 * The working directory for the exec process inside the container.
                 *
                 */
                WorkingDir?: string;
            }
            /**
             * ID or name of container
             */
            export type Id = string;
        }
        export interface PathParameters {
            id: /* ID or name of container */ Parameters.Id;
        }
        namespace Responses {
            export type $201 = /* Response to an API call that returns just an Id */ slime.external.docker.engine.definitions.IdResponse;
            export type $404 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $409 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace ContainerExport {
        namespace Parameters {
            /**
             * ID or name of the container
             */
            export type Id = string;
        }
        export interface PathParameters {
            id: /* ID or name of the container */ Parameters.Id;
        }
        namespace Responses {
            export type $404 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace ContainerInspect {
        namespace Parameters {
            /**
             * ID or name of the container
             */
            export type Id = string;
            /**
             * Return the size of container as fields `SizeRw` and `SizeRootFs`
             */
            export type Size = boolean;
        }
        export interface PathParameters {
            id: /* ID or name of the container */ Parameters.Id;
        }
        export interface QueryParameters {
            size?: /* Return the size of container as fields `SizeRw` and `SizeRootFs` */ Parameters.Size;
        }
        namespace Responses {
            /**
             * ContainerInspectResponse
             */
            export interface $200 {
                /**
                 * The ID of the container
                 */
                Id?: string;
                /**
                 * The time the container was created
                 */
                Created?: string;
                /**
                 * The path to the command being run
                 */
                Path?: string;
                /**
                 * The arguments to the command being run
                 */
                Args?: string[];
                State?: /**
                 * ContainerState stores container's running state. It's part of ContainerJSONBase
                 * and will be returned by the "inspect" command.
                 *
                 */
                slime.external.docker.engine.definitions.ContainerState;
                /**
                 * The container's image ID
                 */
                Image?: string;
                ResolvConfPath?: string;
                HostnamePath?: string;
                HostsPath?: string;
                LogPath?: string;
                Name?: string;
                RestartCount?: number;
                Driver?: string;
                Platform?: string;
                MountLabel?: string;
                ProcessLabel?: string;
                AppArmorProfile?: string;
                /**
                 * IDs of exec instances that are running in the container.
                 */
                ExecIDs?: string[];
                HostConfig?: /* Container configuration that depends on the host we are running on */ slime.external.docker.engine.definitions.HostConfig;
                GraphDriver?: /**
                 * Information about the storage driver used to store the container's and
                 * image's filesystem.
                 *
                 */
                slime.external.docker.engine.definitions.GraphDriverData;
                /**
                 * The size of files that have been created or changed by this
                 * container.
                 *
                 */
                SizeRw?: number; // int64
                /**
                 * The total size of all the files in this container.
                 */
                SizeRootFs?: number; // int64
                Mounts?: /**
                 * MountPoint represents a mount point configuration inside the container.
                 * This is used for reporting the mountpoints in use by a container.
                 *
                 */
                slime.external.docker.engine.definitions.MountPoint[];
                Config?: /**
                 * Configuration for a container that is portable between hosts.
                 *
                 * When used as `ContainerConfig` field in an image, `ContainerConfig` is an
                 * optional field containing the configuration of the container that was last
                 * committed when creating the image.
                 *
                 * Previous versions of Docker builder used this field to store build cache,
                 * and it is not in active use anymore.
                 *
                 */
                slime.external.docker.engine.definitions.ContainerConfig;
                NetworkSettings?: /* NetworkSettings exposes the network settings in the API */ slime.external.docker.engine.definitions.NetworkSettings;
            }
            export type $404 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace ContainerKill {
        namespace Parameters {
            /**
             * ID or name of the container
             */
            export type Id = string;
            /**
             * Signal to send to the container as an integer or string (e.g. `SIGINT`).
             *
             */
            export type Signal = string;
        }
        export interface PathParameters {
            id: /* ID or name of the container */ Parameters.Id;
        }
        export interface QueryParameters {
            signal?: /**
             * Signal to send to the container as an integer or string (e.g. `SIGINT`).
             *
             */
            Parameters.Signal;
        }
        namespace Responses {
            export type $404 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $409 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace ContainerList {
        namespace Parameters {
            /**
             * Return all containers. By default, only running containers are shown.
             *
             */
            export type All = boolean;
            /**
             * Filters to process on the container list, encoded as JSON (a
             * `map[string][]string`). For example, `{"status": ["paused"]}` will
             * only return paused containers.
             *
             * Available filters:
             *
             * - `ancestor`=(`<image-name>[:<tag>]`, `<image id>`, or `<image@digest>`)
             * - `before`=(`<container id>` or `<container name>`)
             * - `expose`=(`<port>[/<proto>]`|`<startport-endport>/[<proto>]`)
             * - `exited=<int>` containers with exit code of `<int>`
             * - `health`=(`starting`|`healthy`|`unhealthy`|`none`)
             * - `id=<ID>` a container's ID
             * - `isolation=`(`default`|`process`|`hyperv`) (Windows daemon only)
             * - `is-task=`(`true`|`false`)
             * - `label=key` or `label="key=value"` of a container label
             * - `name=<name>` a container's name
             * - `network`=(`<network id>` or `<network name>`)
             * - `publish`=(`<port>[/<proto>]`|`<startport-endport>/[<proto>]`)
             * - `since`=(`<container id>` or `<container name>`)
             * - `status=`(`created`|`restarting`|`running`|`removing`|`paused`|`exited`|`dead`)
             * - `volume`=(`<volume name>` or `<mount point destination>`)
             *
             */
            export type Filters = string;
            /**
             * Return this number of most recently created containers, including
             * non-running ones.
             *
             */
            export type Limit = number;
            /**
             * Return the size of container as fields `SizeRw` and `SizeRootFs`.
             *
             */
            export type Size = boolean;
        }
        export interface QueryParameters {
            all?: /**
             * Return all containers. By default, only running containers are shown.
             *
             */
            Parameters.All;
            limit?: /**
             * Return this number of most recently created containers, including
             * non-running ones.
             *
             */
            Parameters.Limit;
            size?: /**
             * Return the size of container as fields `SizeRw` and `SizeRootFs`.
             *
             */
            Parameters.Size;
            filters?: /**
             * Filters to process on the container list, encoded as JSON (a
             * `map[string][]string`). For example, `{"status": ["paused"]}` will
             * only return paused containers.
             *
             * Available filters:
             *
             * - `ancestor`=(`<image-name>[:<tag>]`, `<image id>`, or `<image@digest>`)
             * - `before`=(`<container id>` or `<container name>`)
             * - `expose`=(`<port>[/<proto>]`|`<startport-endport>/[<proto>]`)
             * - `exited=<int>` containers with exit code of `<int>`
             * - `health`=(`starting`|`healthy`|`unhealthy`|`none`)
             * - `id=<ID>` a container's ID
             * - `isolation=`(`default`|`process`|`hyperv`) (Windows daemon only)
             * - `is-task=`(`true`|`false`)
             * - `label=key` or `label="key=value"` of a container label
             * - `name=<name>` a container's name
             * - `network`=(`<network id>` or `<network name>`)
             * - `publish`=(`<port>[/<proto>]`|`<startport-endport>/[<proto>]`)
             * - `since`=(`<container id>` or `<container name>`)
             * - `status=`(`created`|`restarting`|`running`|`removing`|`paused`|`exited`|`dead`)
             * - `volume`=(`<volume name>` or `<mount point destination>`)
             *
             */
            Parameters.Filters;
        }
        namespace Responses {
            export type $200 = slime.external.docker.engine.definitions.ContainerSummary[];
            export type $400 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace ContainerLogs {
        namespace Parameters {
            /**
             * Keep connection after returning logs.
             */
            export type Follow = boolean;
            /**
             * ID or name of the container
             */
            export type Id = string;
            /**
             * Only return logs since this time, as a UNIX timestamp
             */
            export type Since = number;
            /**
             * Return logs from `stderr`
             */
            export type Stderr = boolean;
            /**
             * Return logs from `stdout`
             */
            export type Stdout = boolean;
            /**
             * Only return this number of log lines from the end of the logs.
             * Specify as an integer or `all` to output all log lines.
             *
             */
            export type Tail = string;
            /**
             * Add timestamps to every log line
             */
            export type Timestamps = boolean;
            /**
             * Only return logs before this time, as a UNIX timestamp
             */
            export type Until = number;
        }
        export interface PathParameters {
            id: /* ID or name of the container */ Parameters.Id;
        }
        export interface QueryParameters {
            follow?: /* Keep connection after returning logs. */ Parameters.Follow;
            stdout?: /* Return logs from `stdout` */ Parameters.Stdout;
            stderr?: /* Return logs from `stderr` */ Parameters.Stderr;
            since?: /* Only return logs since this time, as a UNIX timestamp */ Parameters.Since;
            until?: /* Only return logs before this time, as a UNIX timestamp */ Parameters.Until;
            timestamps?: /* Add timestamps to every log line */ Parameters.Timestamps;
            tail?: /**
             * Only return this number of log lines from the end of the logs.
             * Specify as an integer or `all` to output all log lines.
             *
             */
            Parameters.Tail;
        }
        namespace Responses {
            export type $200 = string; // binary
            export type $404 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace ContainerPause {
        namespace Parameters {
            /**
             * ID or name of the container
             */
            export type Id = string;
        }
        export interface PathParameters {
            id: /* ID or name of the container */ Parameters.Id;
        }
        namespace Responses {
            export type $404 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace ContainerPrune {
        namespace Parameters {
            /**
             * Filters to process on the prune list, encoded as JSON (a `map[string][]string`).
             *
             * Available filters:
             * - `until=<timestamp>` Prune containers created before this timestamp. The `<timestamp>` can be Unix timestamps, date formatted timestamps, or Go duration strings (e.g. `10m`, `1h30m`) computed relative to the daemon machine’s time.
             * - `label` (`label=<key>`, `label=<key>=<value>`, `label!=<key>`, or `label!=<key>=<value>`) Prune containers with (or without, in case `label!=...` is used) the specified labels.
             *
             */
            export type Filters = string;
        }
        export interface QueryParameters {
            filters?: /**
             * Filters to process on the prune list, encoded as JSON (a `map[string][]string`).
             *
             * Available filters:
             * - `until=<timestamp>` Prune containers created before this timestamp. The `<timestamp>` can be Unix timestamps, date formatted timestamps, or Go duration strings (e.g. `10m`, `1h30m`) computed relative to the daemon machine’s time.
             * - `label` (`label=<key>`, `label=<key>=<value>`, `label!=<key>`, or `label!=<key>=<value>`) Prune containers with (or without, in case `label!=...` is used) the specified labels.
             *
             */
            Parameters.Filters;
        }
        namespace Responses {
            /**
             * ContainerPruneResponse
             */
            export interface $200 {
                /**
                 * Container IDs that were deleted
                 */
                ContainersDeleted?: string[];
                /**
                 * Disk space reclaimed in bytes
                 */
                SpaceReclaimed?: number; // int64
            }
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace ContainerRename {
        namespace Parameters {
            /**
             * ID or name of the container
             */
            export type Id = string;
            /**
             * New name for the container
             */
            export type Name = string;
        }
        export interface PathParameters {
            id: /* ID or name of the container */ Parameters.Id;
        }
        export interface QueryParameters {
            name: /* New name for the container */ Parameters.Name;
        }
        namespace Responses {
            export type $404 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $409 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace ContainerResize {
        namespace Parameters {
            /**
             * Height of the TTY session in characters
             */
            export type H = number;
            /**
             * ID or name of the container
             */
            export type Id = string;
            /**
             * Width of the TTY session in characters
             */
            export type W = number;
        }
        export interface PathParameters {
            id: /* ID or name of the container */ Parameters.Id;
        }
        export interface QueryParameters {
            h: /* Height of the TTY session in characters */ Parameters.H;
            w: /* Width of the TTY session in characters */ Parameters.W;
        }
        namespace Responses {
            export type $404 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace ContainerRestart {
        namespace Parameters {
            /**
             * ID or name of the container
             */
            export type Id = string;
            /**
             * Signal to send to the container as an integer or string (e.g. `SIGINT`).
             *
             */
            export type Signal = string;
            /**
             * Number of seconds to wait before killing the container
             */
            export type T = number;
        }
        export interface PathParameters {
            id: /* ID or name of the container */ Parameters.Id;
        }
        export interface QueryParameters {
            signal?: /**
             * Signal to send to the container as an integer or string (e.g. `SIGINT`).
             *
             */
            Parameters.Signal;
            t?: /* Number of seconds to wait before killing the container */ Parameters.T;
        }
        namespace Responses {
            export type $404 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace ContainerStart {
        namespace Parameters {
            /**
             * Override the key sequence for detaching a container. Format is a
             * single character `[a-Z]` or `ctrl-<value>` where `<value>` is one
             * of: `a-z`, `@`, `^`, `[`, `,` or `_`.
             *
             */
            export type DetachKeys = string;
            /**
             * ID or name of the container
             */
            export type Id = string;
        }
        export interface PathParameters {
            id: /* ID or name of the container */ Parameters.Id;
        }
        export interface QueryParameters {
            detachKeys?: /**
             * Override the key sequence for detaching a container. Format is a
             * single character `[a-Z]` or `ctrl-<value>` where `<value>` is one
             * of: `a-z`, `@`, `^`, `[`, `,` or `_`.
             *
             */
            Parameters.DetachKeys;
        }
        namespace Responses {
            export type $404 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace ContainerStats {
        namespace Parameters {
            /**
             * ID or name of the container
             */
            export type Id = string;
            /**
             * Only get a single stat instead of waiting for 2 cycles. Must be used
             * with `stream=false`.
             *
             */
            export type OneShot = boolean;
            /**
             * Stream the output. If false, the stats will be output once and then
             * it will disconnect.
             *
             */
            export type Stream = boolean;
        }
        export interface PathParameters {
            id: /* ID or name of the container */ Parameters.Id;
        }
        export interface QueryParameters {
            stream?: /**
             * Stream the output. If false, the stats will be output once and then
             * it will disconnect.
             *
             */
            Parameters.Stream;
            "one-shot"?: /**
             * Only get a single stat instead of waiting for 2 cycles. Must be used
             * with `stream=false`.
             *
             */
            Parameters.OneShot;
        }
        namespace Responses {
            export interface $200 {
            }
            export type $404 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace ContainerStop {
        namespace Parameters {
            /**
             * ID or name of the container
             */
            export type Id = string;
            /**
             * Signal to send to the container as an integer or string (e.g. `SIGINT`).
             *
             */
            export type Signal = string;
            /**
             * Number of seconds to wait before killing the container
             */
            export type T = number;
        }
        export interface PathParameters {
            id: /* ID or name of the container */ Parameters.Id;
        }
        export interface QueryParameters {
            signal?: /**
             * Signal to send to the container as an integer or string (e.g. `SIGINT`).
             *
             */
            Parameters.Signal;
            t?: /* Number of seconds to wait before killing the container */ Parameters.T;
        }
        namespace Responses {
            export type $404 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace ContainerTop {
        namespace Parameters {
            /**
             * ID or name of the container
             */
            export type Id = string;
            /**
             * The arguments to pass to `ps`. For example, `aux`
             */
            export type PsArgs = string;
        }
        export interface PathParameters {
            id: /* ID or name of the container */ Parameters.Id;
        }
        export interface QueryParameters {
            ps_args?: /* The arguments to pass to `ps`. For example, `aux` */ Parameters.PsArgs;
        }
        namespace Responses {
            /**
             * ContainerTopResponse
             * OK response to ContainerTop operation
             */
            export interface $200 {
                /**
                 * The ps column titles
                 */
                Titles?: string[];
                /**
                 * Each process running in the container, where each is process
                 * is an array of values corresponding to the titles.
                 *
                 */
                Processes?: string[][];
            }
            export type $404 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace ContainerUnpause {
        namespace Parameters {
            /**
             * ID or name of the container
             */
            export type Id = string;
        }
        export interface PathParameters {
            id: /* ID or name of the container */ Parameters.Id;
        }
        namespace Responses {
            export type $404 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace ContainerUpdate {
        export interface BodyParameters {
            update: /**
             * A container's resources (cgroups config, ulimits, etc)
             * example:
             * {
             *   "BlkioWeight": 300,
             *   "CpuShares": 512,
             *   "CpuPeriod": 100000,
             *   "CpuQuota": 50000,
             *   "CpuRealtimePeriod": 1000000,
             *   "CpuRealtimeRuntime": 10000,
             *   "CpusetCpus": "0,1",
             *   "CpusetMems": "0",
             *   "Memory": 314572800,
             *   "MemorySwap": 514288000,
             *   "MemoryReservation": 209715200,
             *   "RestartPolicy": {
             *     "MaximumRetryCount": 4,
             *     "Name": "on-failure"
             *   }
             * }
             */
            Parameters.Update;
        }
        namespace Parameters {
            /**
             * ID or name of the container
             */
            export type Id = string;
            /**
             * A container's resources (cgroups config, ulimits, etc)
             * example:
             * {
             *   "BlkioWeight": 300,
             *   "CpuShares": 512,
             *   "CpuPeriod": 100000,
             *   "CpuQuota": 50000,
             *   "CpuRealtimePeriod": 1000000,
             *   "CpuRealtimeRuntime": 10000,
             *   "CpusetCpus": "0,1",
             *   "CpusetMems": "0",
             *   "Memory": 314572800,
             *   "MemorySwap": 514288000,
             *   "MemoryReservation": 209715200,
             *   "RestartPolicy": {
             *     "MaximumRetryCount": 4,
             *     "Name": "on-failure"
             *   }
             * }
             */
            export interface Update {
                /**
                 * An integer value representing this container's relative CPU weight
                 * versus other containers.
                 *
                 */
                CpuShares?: number;
                /**
                 * Memory limit in bytes.
                 */
                Memory?: number; // int64
                /**
                 * Path to `cgroups` under which the container's `cgroup` is created. If
                 * the path is not absolute, the path is considered to be relative to the
                 * `cgroups` path of the init process. Cgroups are created if they do not
                 * already exist.
                 *
                 */
                CgroupParent?: string;
                /**
                 * Block IO weight (relative weight).
                 */
                BlkioWeight?: number;
                /**
                 * Block IO weight (relative device weight) in the form:
                 *
                 * ```
                 * [{"Path": "device_path", "Weight": weight}]
                 * ```
                 *
                 */
                BlkioWeightDevice?: {
                    Path?: string;
                    Weight?: number;
                }[];
                /**
                 * Limit read rate (bytes per second) from a device, in the form:
                 *
                 * ```
                 * [{"Path": "device_path", "Rate": rate}]
                 * ```
                 *
                 */
                BlkioDeviceReadBps?: slime.external.docker.engine.definitions.ThrottleDevice[];
                /**
                 * Limit write rate (bytes per second) to a device, in the form:
                 *
                 * ```
                 * [{"Path": "device_path", "Rate": rate}]
                 * ```
                 *
                 */
                BlkioDeviceWriteBps?: slime.external.docker.engine.definitions.ThrottleDevice[];
                /**
                 * Limit read rate (IO per second) from a device, in the form:
                 *
                 * ```
                 * [{"Path": "device_path", "Rate": rate}]
                 * ```
                 *
                 */
                BlkioDeviceReadIOps?: slime.external.docker.engine.definitions.ThrottleDevice[];
                /**
                 * Limit write rate (IO per second) to a device, in the form:
                 *
                 * ```
                 * [{"Path": "device_path", "Rate": rate}]
                 * ```
                 *
                 */
                BlkioDeviceWriteIOps?: slime.external.docker.engine.definitions.ThrottleDevice[];
                /**
                 * The length of a CPU period in microseconds.
                 */
                CpuPeriod?: number; // int64
                /**
                 * Microseconds of CPU time that the container can get in a CPU period.
                 *
                 */
                CpuQuota?: number; // int64
                /**
                 * The length of a CPU real-time period in microseconds. Set to 0 to
                 * allocate no time allocated to real-time tasks.
                 *
                 */
                CpuRealtimePeriod?: number; // int64
                /**
                 * The length of a CPU real-time runtime in microseconds. Set to 0 to
                 * allocate no time allocated to real-time tasks.
                 *
                 */
                CpuRealtimeRuntime?: number; // int64
                /**
                 * CPUs in which to allow execution (e.g., `0-3`, `0,1`).
                 *
                 * example:
                 * 0-3
                 */
                CpusetCpus?: string;
                /**
                 * Memory nodes (MEMs) in which to allow execution (0-3, 0,1). Only
                 * effective on NUMA systems.
                 *
                 */
                CpusetMems?: string;
                /**
                 * A list of devices to add to the container.
                 */
                Devices?: /**
                 * A device mapping between the host and container
                 * example:
                 * {
                 *   "PathOnHost": "/dev/deviceName",
                 *   "PathInContainer": "/dev/deviceName",
                 *   "CgroupPermissions": "mrw"
                 * }
                 */
                slime.external.docker.engine.definitions.DeviceMapping[];
                /**
                 * a list of cgroup rules to apply to the container
                 */
                DeviceCgroupRules?: string[];
                /**
                 * A list of requests for devices to be sent to device drivers.
                 *
                 */
                DeviceRequests?: /* A request for devices to be sent to device drivers */ slime.external.docker.engine.definitions.DeviceRequest[];
                /**
                 * Hard limit for kernel TCP buffer memory (in bytes). Depending on the
                 * OCI runtime in use, this option may be ignored. It is no longer supported
                 * by the default (runc) runtime.
                 *
                 * This field is omitted when empty.
                 *
                 */
                KernelMemoryTCP?: number; // int64
                /**
                 * Memory soft limit in bytes.
                 */
                MemoryReservation?: number; // int64
                /**
                 * Total memory limit (memory + swap). Set as `-1` to enable unlimited
                 * swap.
                 *
                 */
                MemorySwap?: number; // int64
                /**
                 * Tune a container's memory swappiness behavior. Accepts an integer
                 * between 0 and 100.
                 *
                 */
                MemorySwappiness?: number; // int64
                /**
                 * CPU quota in units of 10<sup>-9</sup> CPUs.
                 */
                NanoCpus?: number; // int64
                /**
                 * Disable OOM Killer for the container.
                 */
                OomKillDisable?: boolean;
                /**
                 * Run an init inside the container that forwards signals and reaps
                 * processes. This field is omitted if empty, and the default (as
                 * configured on the daemon) is used.
                 *
                 */
                Init?: boolean;
                /**
                 * Tune a container's PIDs limit. Set `0` or `-1` for unlimited, or `null`
                 * to not change.
                 *
                 */
                PidsLimit?: number; // int64
                /**
                 * A list of resource limits to set in the container. For example:
                 *
                 * ```
                 * {"Name": "nofile", "Soft": 1024, "Hard": 2048}
                 * ```
                 *
                 */
                Ulimits?: {
                    /**
                     * Name of ulimit
                     */
                    Name?: string;
                    /**
                     * Soft limit
                     */
                    Soft?: number;
                    /**
                     * Hard limit
                     */
                    Hard?: number;
                }[];
                /**
                 * The number of usable CPUs (Windows only).
                 *
                 * On Windows Server containers, the processor resource controls are
                 * mutually exclusive. The order of precedence is `CPUCount` first, then
                 * `CPUShares`, and `CPUPercent` last.
                 *
                 */
                CpuCount?: number; // int64
                /**
                 * The usable percentage of the available CPUs (Windows only).
                 *
                 * On Windows Server containers, the processor resource controls are
                 * mutually exclusive. The order of precedence is `CPUCount` first, then
                 * `CPUShares`, and `CPUPercent` last.
                 *
                 */
                CpuPercent?: number; // int64
                /**
                 * Maximum IOps for the container system drive (Windows only)
                 */
                IOMaximumIOps?: number; // int64
                /**
                 * Maximum IO in bytes per second for the container system drive
                 * (Windows only).
                 *
                 */
                IOMaximumBandwidth?: number; // int64
                RestartPolicy?: /**
                 * The behavior to apply when the container exits. The default is not to
                 * restart.
                 *
                 * An ever increasing delay (double the previous delay, starting at 100ms) is
                 * added before each restart to prevent flooding the server.
                 *
                 */
                slime.external.docker.engine.definitions.RestartPolicy;
            }
        }
        export interface PathParameters {
            id: /* ID or name of the container */ Parameters.Id;
        }
        namespace Responses {
            /**
             * ContainerUpdateResponse
             * OK response to ContainerUpdate operation
             */
            export interface $200 {
                Warnings?: string[];
            }
            export type $404 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace ContainerWait {
        namespace Parameters {
            /**
             * Wait until a container state reaches the given condition.
             *
             * Defaults to `not-running` if omitted or empty.
             *
             */
            export type Condition = "not-running" | "next-exit" | "removed";
            /**
             * ID or name of the container
             */
            export type Id = string;
        }
        export interface PathParameters {
            id: /* ID or name of the container */ Parameters.Id;
        }
        export interface QueryParameters {
            condition?: /**
             * Wait until a container state reaches the given condition.
             *
             * Defaults to `not-running` if omitted or empty.
             *
             */
            Parameters.Condition;
        }
        namespace Responses {
            export type $200 = /**
             * ContainerWaitResponse
             * OK response to ContainerWait operation
             */
            slime.external.docker.engine.definitions.ContainerWaitResponse;
            export type $400 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $404 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace DistributionInspect {
        namespace Parameters {
            /**
             * Image name or id
             */
            export type Name = string;
        }
        export interface PathParameters {
            name: /* Image name or id */ Parameters.Name;
        }
        namespace Responses {
            export type $200 = /**
             * DistributionInspectResponse
             * Describes the result obtained from contacting the registry to retrieve
             * image metadata.
             *
             */
            slime.external.docker.engine.definitions.DistributionInspect;
            export type $401 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace ExecInspect {
        namespace Parameters {
            /**
             * Exec instance ID
             */
            export type Id = string;
        }
        export interface PathParameters {
            id: /* Exec instance ID */ Parameters.Id;
        }
        namespace Responses {
            /**
             * ExecInspectResponse
             */
            export interface $200 {
                CanRemove?: boolean;
                DetachKeys?: string;
                ID?: string;
                Running?: boolean;
                ExitCode?: number;
                ProcessConfig?: slime.external.docker.engine.definitions.ProcessConfig;
                OpenStdin?: boolean;
                OpenStderr?: boolean;
                OpenStdout?: boolean;
                ContainerID?: string;
                /**
                 * The system process ID for the exec process.
                 */
                Pid?: number;
            }
            export type $404 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace ExecResize {
        namespace Parameters {
            /**
             * Height of the TTY session in characters
             */
            export type H = number;
            /**
             * Exec instance ID
             */
            export type Id = string;
            /**
             * Width of the TTY session in characters
             */
            export type W = number;
        }
        export interface PathParameters {
            id: /* Exec instance ID */ Parameters.Id;
        }
        export interface QueryParameters {
            h: /* Height of the TTY session in characters */ Parameters.H;
            w: /* Width of the TTY session in characters */ Parameters.W;
        }
        namespace Responses {
            export type $400 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $404 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace ExecStart {
        export interface BodyParameters {
            execStartConfig?: /**
             * ExecStartConfig
             * example:
             * {
             *   "Detach": false,
             *   "Tty": true,
             *   "ConsoleSize": [
             *     80,
             *     64
             *   ]
             * }
             */
            Parameters.ExecStartConfig;
        }
        namespace Parameters {
            /**
             * ExecStartConfig
             * example:
             * {
             *   "Detach": false,
             *   "Tty": true,
             *   "ConsoleSize": [
             *     80,
             *     64
             *   ]
             * }
             */
            export interface ExecStartConfig {
                /**
                 * Detach from the command.
                 */
                Detach?: boolean;
                /**
                 * Allocate a pseudo-TTY.
                 */
                Tty?: boolean;
                /**
                 * Initial console size, as an `[height, width]` array.
                 */
                ConsoleSize?: [
                    number,
                    number
                ];
            }
            /**
             * Exec instance ID
             */
            export type Id = string;
        }
        export interface PathParameters {
            id: /* Exec instance ID */ Parameters.Id;
        }
        namespace Responses {
            export type $404 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $409 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace GetPluginPrivileges {
        namespace Parameters {
            /**
             * The name of the plugin. The `:latest` tag is optional, and is the
             * default if omitted.
             *
             */
            export type Remote = string;
        }
        export interface QueryParameters {
            remote: /**
             * The name of the plugin. The `:latest` tag is optional, and is the
             * default if omitted.
             *
             */
            Parameters.Remote;
        }
        namespace Responses {
            /**
             * example:
             * [
             *   {
             *     "Name": "network",
             *     "Description": "",
             *     "Value": [
             *       "host"
             *     ]
             *   },
             *   {
             *     "Name": "mount",
             *     "Description": "",
             *     "Value": [
             *       "/data"
             *     ]
             *   },
             *   {
             *     "Name": "device",
             *     "Description": "",
             *     "Value": [
             *       "/dev/cpu_dma_latency"
             *     ]
             *   }
             * ]
             */
            export type $200 = /**
             * Describes a permission the user has to accept upon installing
             * the plugin.
             *
             */
            slime.external.docker.engine.definitions.PluginPrivilege[];
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace ImageBuild {
        export interface BodyParameters {
            inputStream?: Parameters.InputStream /* binary */;
        }
        export interface HeaderParameters {
            "Content-type"?: Parameters.ContentType;
            "X-Registry-Config"?: /**
             * This is a base64-encoded JSON object with auth configurations for multiple registries that a build may refer to.
             *
             * The key is a registry URL, and the value is an auth configuration object, [as described in the authentication section](#section/Authentication). For example:
             *
             * ```
             * {
             *   "docker.example.com": {
             *     "username": "janedoe",
             *     "password": "hunter2"
             *   },
             *   "https://index.docker.io/v1/": {
             *     "username": "mobydock",
             *     "password": "conta1n3rize14"
             *   }
             * }
             * ```
             *
             * Only the registry domain name (and port if not the default 443) are required. However, for legacy reasons, the Docker Hub registry must be specified with both a `https://` prefix and a `/v1/` suffix even though Docker will prefer to use the v2 registry API.
             *
             */
            Parameters.XRegistryConfig;
        }
        namespace Parameters {
            /**
             * JSON map of string pairs for build-time variables. Users pass these values at build-time. Docker uses the buildargs as the environment context for commands run via the `Dockerfile` RUN instruction, or for variable expansion in other `Dockerfile` instructions. This is not meant for passing secret values.
             *
             * For example, the build arg `FOO=bar` would become `{"FOO":"bar"}` in JSON. This would result in the query parameter `buildargs={"FOO":"bar"}`. Note that `{"FOO":"bar"}` should be URI component encoded.
             *
             * [Read more about the buildargs instruction.](https://docs.docker.com/engine/reference/builder/#arg)
             *
             */
            export type Buildargs = string;
            /**
             * JSON array of images used for build cache resolution.
             */
            export type Cachefrom = string;
            export type ContentType = "application/x-tar";
            /**
             * The length of a CPU period in microseconds.
             */
            export type Cpuperiod = number;
            /**
             * Microseconds of CPU time that the container can get in a CPU period.
             */
            export type Cpuquota = number;
            /**
             * CPUs in which to allow execution (e.g., `0-3`, `0,1`).
             */
            export type Cpusetcpus = string;
            /**
             * CPU shares (relative weight).
             */
            export type Cpushares = number;
            /**
             * Path within the build context to the `Dockerfile`. This is ignored if `remote` is specified and points to an external `Dockerfile`.
             */
            export type Dockerfile = string;
            /**
             * Extra hosts to add to /etc/hosts
             */
            export type Extrahosts = string;
            /**
             * Always remove intermediate containers, even upon failure.
             */
            export type Forcerm = boolean;
            export type InputStream = string; // binary
            /**
             * Arbitrary key/value labels to set on the image, as a JSON map of string pairs.
             */
            export type Labels = string;
            /**
             * Set memory limit for build.
             */
            export type Memory = number;
            /**
             * Total memory (memory + swap). Set as `-1` to disable swap.
             */
            export type Memswap = number;
            /**
             * Sets the networking mode for the run commands during build. Supported
             * standard values are: `bridge`, `host`, `none`, and `container:<name|id>`.
             * Any other value is taken as a custom network's name or ID to which this
             * container should connect to.
             *
             */
            export type Networkmode = string;
            /**
             * Do not use the cache when building the image.
             */
            export type Nocache = boolean;
            /**
             * BuildKit output configuration
             */
            export type Outputs = string;
            /**
             * Platform in the format os[/arch[/variant]]
             */
            export type Platform = string;
            /**
             * Attempt to pull the image even if an older image exists locally.
             */
            export type Pull = string;
            /**
             * Suppress verbose build output.
             */
            export type Q = boolean;
            /**
             * A Git repository URI or HTTP/HTTPS context URI. If the URI points to a single text file, the file’s contents are placed into a file called `Dockerfile` and the image is built from that file. If the URI points to a tarball, the file is downloaded by the daemon and the contents therein used as the context for the build. If the URI points to a tarball and the `dockerfile` parameter is also specified, there must be a file with the corresponding path inside the tarball.
             */
            export type Remote = string;
            /**
             * Remove intermediate containers after a successful build.
             */
            export type Rm = boolean;
            /**
             * Size of `/dev/shm` in bytes. The size must be greater than 0. If omitted the system uses 64MB.
             */
            export type Shmsize = number;
            /**
             * Squash the resulting images layers into a single layer. *(Experimental release only.)*
             */
            export type Squash = boolean;
            /**
             * A name and optional tag to apply to the image in the `name:tag` format. If you omit the tag the default `latest` value is assumed. You can provide several `t` parameters.
             */
            export type T = string;
            /**
             * Target build stage
             */
            export type Target = string;
            /**
             * Version of the builder backend to use.
             *
             * - `1` is the first generation classic (deprecated) builder in the Docker daemon (default)
             * - `2` is [BuildKit](https://github.com/moby/buildkit)
             *
             */
            export type Version = "1" | "2";
            /**
             * This is a base64-encoded JSON object with auth configurations for multiple registries that a build may refer to.
             *
             * The key is a registry URL, and the value is an auth configuration object, [as described in the authentication section](#section/Authentication). For example:
             *
             * ```
             * {
             *   "docker.example.com": {
             *     "username": "janedoe",
             *     "password": "hunter2"
             *   },
             *   "https://index.docker.io/v1/": {
             *     "username": "mobydock",
             *     "password": "conta1n3rize14"
             *   }
             * }
             * ```
             *
             * Only the registry domain name (and port if not the default 443) are required. However, for legacy reasons, the Docker Hub registry must be specified with both a `https://` prefix and a `/v1/` suffix even though Docker will prefer to use the v2 registry API.
             *
             */
            export type XRegistryConfig = string;
        }
        export interface QueryParameters {
            dockerfile?: /* Path within the build context to the `Dockerfile`. This is ignored if `remote` is specified and points to an external `Dockerfile`. */ Parameters.Dockerfile;
            t?: /* A name and optional tag to apply to the image in the `name:tag` format. If you omit the tag the default `latest` value is assumed. You can provide several `t` parameters. */ Parameters.T;
            extrahosts?: /* Extra hosts to add to /etc/hosts */ Parameters.Extrahosts;
            remote?: /* A Git repository URI or HTTP/HTTPS context URI. If the URI points to a single text file, the file’s contents are placed into a file called `Dockerfile` and the image is built from that file. If the URI points to a tarball, the file is downloaded by the daemon and the contents therein used as the context for the build. If the URI points to a tarball and the `dockerfile` parameter is also specified, there must be a file with the corresponding path inside the tarball. */ Parameters.Remote;
            q?: /* Suppress verbose build output. */ Parameters.Q;
            nocache?: /* Do not use the cache when building the image. */ Parameters.Nocache;
            cachefrom?: /* JSON array of images used for build cache resolution. */ Parameters.Cachefrom;
            pull?: /* Attempt to pull the image even if an older image exists locally. */ Parameters.Pull;
            rm?: /* Remove intermediate containers after a successful build. */ Parameters.Rm;
            forcerm?: /* Always remove intermediate containers, even upon failure. */ Parameters.Forcerm;
            memory?: /* Set memory limit for build. */ Parameters.Memory;
            memswap?: /* Total memory (memory + swap). Set as `-1` to disable swap. */ Parameters.Memswap;
            cpushares?: /* CPU shares (relative weight). */ Parameters.Cpushares;
            cpusetcpus?: /* CPUs in which to allow execution (e.g., `0-3`, `0,1`). */ Parameters.Cpusetcpus;
            cpuperiod?: /* The length of a CPU period in microseconds. */ Parameters.Cpuperiod;
            cpuquota?: /* Microseconds of CPU time that the container can get in a CPU period. */ Parameters.Cpuquota;
            buildargs?: /**
             * JSON map of string pairs for build-time variables. Users pass these values at build-time. Docker uses the buildargs as the environment context for commands run via the `Dockerfile` RUN instruction, or for variable expansion in other `Dockerfile` instructions. This is not meant for passing secret values.
             *
             * For example, the build arg `FOO=bar` would become `{"FOO":"bar"}` in JSON. This would result in the query parameter `buildargs={"FOO":"bar"}`. Note that `{"FOO":"bar"}` should be URI component encoded.
             *
             * [Read more about the buildargs instruction.](https://docs.docker.com/engine/reference/builder/#arg)
             *
             */
            Parameters.Buildargs;
            shmsize?: /* Size of `/dev/shm` in bytes. The size must be greater than 0. If omitted the system uses 64MB. */ Parameters.Shmsize;
            squash?: /* Squash the resulting images layers into a single layer. *(Experimental release only.)* */ Parameters.Squash;
            labels?: /* Arbitrary key/value labels to set on the image, as a JSON map of string pairs. */ Parameters.Labels;
            networkmode?: /**
             * Sets the networking mode for the run commands during build. Supported
             * standard values are: `bridge`, `host`, `none`, and `container:<name|id>`.
             * Any other value is taken as a custom network's name or ID to which this
             * container should connect to.
             *
             */
            Parameters.Networkmode;
            platform?: /* Platform in the format os[/arch[/variant]] */ Parameters.Platform;
            target?: /* Target build stage */ Parameters.Target;
            outputs?: /* BuildKit output configuration */ Parameters.Outputs;
            version?: /**
             * Version of the builder backend to use.
             *
             * - `1` is the first generation classic (deprecated) builder in the Docker daemon (default)
             * - `2` is [BuildKit](https://github.com/moby/buildkit)
             *
             */
            Parameters.Version;
        }
        namespace Responses {
            export type $400 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace ImageCommit {
        export interface BodyParameters {
            containerConfig?: Parameters.ContainerConfig;
        }
        namespace Parameters {
            /**
             * Author of the image (e.g., `John Hannibal Smith <hannibal@a-team.com>`)
             */
            export type Author = string;
            /**
             * `Dockerfile` instructions to apply while committing
             */
            export type Changes = string;
            /**
             * Commit message
             */
            export type Comment = string;
            /**
             * The ID or name of the container to commit
             */
            export type Container = string;
            export type ContainerConfig = /**
             * Configuration for a container that is portable between hosts.
             *
             * When used as `ContainerConfig` field in an image, `ContainerConfig` is an
             * optional field containing the configuration of the container that was last
             * committed when creating the image.
             *
             * Previous versions of Docker builder used this field to store build cache,
             * and it is not in active use anymore.
             *
             */
            slime.external.docker.engine.definitions.ContainerConfig;
            /**
             * Whether to pause the container before committing
             */
            export type Pause = boolean;
            /**
             * Repository name for the created image
             */
            export type Repo = string;
            /**
             * Tag name for the create image
             */
            export type Tag = string;
        }
        export interface QueryParameters {
            container?: /* The ID or name of the container to commit */ Parameters.Container;
            repo?: /* Repository name for the created image */ Parameters.Repo;
            tag?: /* Tag name for the create image */ Parameters.Tag;
            comment?: /* Commit message */ Parameters.Comment;
            author?: /* Author of the image (e.g., `John Hannibal Smith <hannibal@a-team.com>`) */ Parameters.Author;
            pause?: /* Whether to pause the container before committing */ Parameters.Pause;
            changes?: /* `Dockerfile` instructions to apply while committing */ Parameters.Changes;
        }
        namespace Responses {
            export type $201 = /* Response to an API call that returns just an Id */ slime.external.docker.engine.definitions.IdResponse;
            export type $404 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace ImageCreate {
        export interface BodyParameters {
            inputImage?: Parameters.InputImage;
        }
        export interface HeaderParameters {
            "X-Registry-Auth"?: /**
             * A base64url-encoded auth configuration.
             *
             * Refer to the [authentication section](#section/Authentication) for
             * details.
             *
             */
            Parameters.XRegistryAuth;
        }
        namespace Parameters {
            /**
             * Apply `Dockerfile` instructions to the image that is created,
             * for example: `changes=ENV DEBUG=true`.
             * Note that `ENV DEBUG=true` should be URI component encoded.
             *
             * Supported `Dockerfile` instructions:
             * `CMD`|`ENTRYPOINT`|`ENV`|`EXPOSE`|`ONBUILD`|`USER`|`VOLUME`|`WORKDIR`
             *
             */
            export type Changes = string[];
            /**
             * Name of the image to pull. The name may include a tag or digest. This parameter may only be used when pulling an image. The pull is cancelled if the HTTP connection is closed.
             */
            export type FromImage = string;
            /**
             * Source to import. The value may be a URL from which the image can be retrieved or `-` to read the image from the request body. This parameter may only be used when importing an image.
             */
            export type FromSrc = string;
            export type InputImage = string;
            /**
             * Set commit message for imported image.
             */
            export type Message = string;
            /**
             * Platform in the format os[/arch[/variant]].
             *
             * When used in combination with the `fromImage` option, the daemon checks
             * if the given image is present in the local image cache with the given
             * OS and Architecture, and otherwise attempts to pull the image. If the
             * option is not set, the host's native OS and Architecture are used.
             * If the given image does not exist in the local image cache, the daemon
             * attempts to pull the image with the host's native OS and Architecture.
             * If the given image does exists in the local image cache, but its OS or
             * architecture does not match, a warning is produced.
             *
             * When used with the `fromSrc` option to import an image from an archive,
             * this option sets the platform information for the imported image. If
             * the option is not set, the host's native OS and Architecture are used
             * for the imported image.
             *
             */
            export type Platform = string;
            /**
             * Repository name given to an image when it is imported. The repo may include a tag. This parameter may only be used when importing an image.
             */
            export type Repo = string;
            /**
             * Tag or digest. If empty when pulling an image, this causes all tags for the given image to be pulled.
             */
            export type Tag = string;
            /**
             * A base64url-encoded auth configuration.
             *
             * Refer to the [authentication section](#section/Authentication) for
             * details.
             *
             */
            export type XRegistryAuth = string;
        }
        export interface QueryParameters {
            fromImage?: /* Name of the image to pull. The name may include a tag or digest. This parameter may only be used when pulling an image. The pull is cancelled if the HTTP connection is closed. */ Parameters.FromImage;
            fromSrc?: /* Source to import. The value may be a URL from which the image can be retrieved or `-` to read the image from the request body. This parameter may only be used when importing an image. */ Parameters.FromSrc;
            repo?: /* Repository name given to an image when it is imported. The repo may include a tag. This parameter may only be used when importing an image. */ Parameters.Repo;
            tag?: /* Tag or digest. If empty when pulling an image, this causes all tags for the given image to be pulled. */ Parameters.Tag;
            message?: /* Set commit message for imported image. */ Parameters.Message;
            changes?: /**
             * Apply `Dockerfile` instructions to the image that is created,
             * for example: `changes=ENV DEBUG=true`.
             * Note that `ENV DEBUG=true` should be URI component encoded.
             *
             * Supported `Dockerfile` instructions:
             * `CMD`|`ENTRYPOINT`|`ENV`|`EXPOSE`|`ONBUILD`|`USER`|`VOLUME`|`WORKDIR`
             *
             */
            Parameters.Changes;
            platform?: /**
             * Platform in the format os[/arch[/variant]].
             *
             * When used in combination with the `fromImage` option, the daemon checks
             * if the given image is present in the local image cache with the given
             * OS and Architecture, and otherwise attempts to pull the image. If the
             * option is not set, the host's native OS and Architecture are used.
             * If the given image does not exist in the local image cache, the daemon
             * attempts to pull the image with the host's native OS and Architecture.
             * If the given image does exists in the local image cache, but its OS or
             * architecture does not match, a warning is produced.
             *
             * When used with the `fromSrc` option to import an image from an archive,
             * this option sets the platform information for the imported image. If
             * the option is not set, the host's native OS and Architecture are used
             * for the imported image.
             *
             */
            Parameters.Platform;
        }
        namespace Responses {
            export type $404 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace ImageDelete {
        namespace Parameters {
            /**
             * Remove the image even if it is being used by stopped containers or has other tags
             */
            export type Force = boolean;
            /**
             * Image name or ID
             */
            export type Name = string;
            /**
             * Do not delete untagged parent images
             */
            export type Noprune = boolean;
        }
        export interface PathParameters {
            name: /* Image name or ID */ Parameters.Name;
        }
        export interface QueryParameters {
            force?: /* Remove the image even if it is being used by stopped containers or has other tags */ Parameters.Force;
            noprune?: /* Do not delete untagged parent images */ Parameters.Noprune;
        }
        namespace Responses {
            export type $200 = slime.external.docker.engine.definitions.ImageDeleteResponseItem[];
            export type $404 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $409 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace ImageGet {
        namespace Parameters {
            /**
             * Image name or ID
             */
            export type Name = string;
        }
        export interface PathParameters {
            name: /* Image name or ID */ Parameters.Name;
        }
        namespace Responses {
            export type $200 = string; // binary
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace ImageGetAll {
        namespace Parameters {
            /**
             * Image names to filter by
             */
            export type Names = string[];
        }
        export interface QueryParameters {
            names?: /* Image names to filter by */ Parameters.Names;
        }
        namespace Responses {
            export type $200 = string; // binary
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace ImageHistory {
        namespace Parameters {
            /**
             * Image name or ID
             */
            export type Name = string;
        }
        export interface PathParameters {
            name: /* Image name or ID */ Parameters.Name;
        }
        namespace Responses {
            export type $200 = {
                Id: string;
                Created: number; // int64
                CreatedBy: string;
                Tags: string[];
                Size: number; // int64
                Comment: string;
            }[];
            export type $404 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace ImageInspect {
        namespace Parameters {
            /**
             * Image name or id
             */
            export type Name = string;
        }
        export interface PathParameters {
            name: /* Image name or id */ Parameters.Name;
        }
        namespace Responses {
            export type $200 = /**
             * Information about an image in the local image cache.
             *
             */
            slime.external.docker.engine.definitions.ImageInspect;
            export type $404 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace ImageList {
        namespace Parameters {
            /**
             * Show all images. Only images from a final layer (no children) are shown by default.
             */
            export type All = boolean;
            /**
             * Show digest information as a `RepoDigests` field on each image.
             */
            export type Digests = boolean;
            /**
             * A JSON encoded value of the filters (a `map[string][]string`) to
             * process on the images list.
             *
             * Available filters:
             *
             * - `before`=(`<image-name>[:<tag>]`,  `<image id>` or `<image@digest>`)
             * - `dangling=true`
             * - `label=key` or `label="key=value"` of an image label
             * - `reference`=(`<image-name>[:<tag>]`)
             * - `since`=(`<image-name>[:<tag>]`,  `<image id>` or `<image@digest>`)
             *
             */
            export type Filters = string;
            /**
             * Compute and show shared size as a `SharedSize` field on each image.
             */
            export type SharedSize = boolean;
        }
        export interface QueryParameters {
            all?: /* Show all images. Only images from a final layer (no children) are shown by default. */ Parameters.All;
            filters?: /**
             * A JSON encoded value of the filters (a `map[string][]string`) to
             * process on the images list.
             *
             * Available filters:
             *
             * - `before`=(`<image-name>[:<tag>]`,  `<image id>` or `<image@digest>`)
             * - `dangling=true`
             * - `label=key` or `label="key=value"` of an image label
             * - `reference`=(`<image-name>[:<tag>]`)
             * - `since`=(`<image-name>[:<tag>]`,  `<image id>` or `<image@digest>`)
             *
             */
            Parameters.Filters;
            "shared-size"?: /* Compute and show shared size as a `SharedSize` field on each image. */ Parameters.SharedSize;
            digests?: /* Show digest information as a `RepoDigests` field on each image. */ Parameters.Digests;
        }
        namespace Responses {
            export type $200 = slime.external.docker.engine.definitions.ImageSummary[];
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace ImageLoad {
        export interface BodyParameters {
            imagesTarball?: Parameters.ImagesTarball /* binary */;
        }
        namespace Parameters {
            export type ImagesTarball = string; // binary
            /**
             * Suppress progress details during load.
             */
            export type Quiet = boolean;
        }
        export interface QueryParameters {
            quiet?: /* Suppress progress details during load. */ Parameters.Quiet;
        }
        namespace Responses {
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace ImagePrune {
        namespace Parameters {
            /**
             * Filters to process on the prune list, encoded as JSON (a `map[string][]string`). Available filters:
             *
             * - `dangling=<boolean>` When set to `true` (or `1`), prune only
             *    unused *and* untagged images. When set to `false`
             *    (or `0`), all unused images are pruned.
             * - `until=<string>` Prune images created before this timestamp. The `<timestamp>` can be Unix timestamps, date formatted timestamps, or Go duration strings (e.g. `10m`, `1h30m`) computed relative to the daemon machine’s time.
             * - `label` (`label=<key>`, `label=<key>=<value>`, `label!=<key>`, or `label!=<key>=<value>`) Prune images with (or without, in case `label!=...` is used) the specified labels.
             *
             */
            export type Filters = string;
        }
        export interface QueryParameters {
            filters?: /**
             * Filters to process on the prune list, encoded as JSON (a `map[string][]string`). Available filters:
             *
             * - `dangling=<boolean>` When set to `true` (or `1`), prune only
             *    unused *and* untagged images. When set to `false`
             *    (or `0`), all unused images are pruned.
             * - `until=<string>` Prune images created before this timestamp. The `<timestamp>` can be Unix timestamps, date formatted timestamps, or Go duration strings (e.g. `10m`, `1h30m`) computed relative to the daemon machine’s time.
             * - `label` (`label=<key>`, `label=<key>=<value>`, `label!=<key>`, or `label!=<key>=<value>`) Prune images with (or without, in case `label!=...` is used) the specified labels.
             *
             */
            Parameters.Filters;
        }
        namespace Responses {
            /**
             * ImagePruneResponse
             */
            export interface $200 {
                /**
                 * Images that were deleted
                 */
                ImagesDeleted?: slime.external.docker.engine.definitions.ImageDeleteResponseItem[];
                /**
                 * Disk space reclaimed in bytes
                 */
                SpaceReclaimed?: number; // int64
            }
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace ImagePush {
        export interface HeaderParameters {
            "X-Registry-Auth": /**
             * A base64url-encoded auth configuration.
             *
             * Refer to the [authentication section](#section/Authentication) for
             * details.
             *
             */
            Parameters.XRegistryAuth;
        }
        namespace Parameters {
            /**
             * Name of the image to push. For example, `registry.example.com/myimage`.
             * The image must be present in the local image store with the same name.
             *
             * The name should be provided without tag; if a tag is provided, it
             * is ignored. For example, `registry.example.com/myimage:latest` is
             * considered equivalent to `registry.example.com/myimage`.
             *
             * Use the `tag` parameter to specify the tag to push.
             *
             */
            export type Name = string;
            /**
             * Tag of the image to push. For example, `latest`. If no tag is provided,
             * all tags of the given image that are present in the local image store
             * are pushed.
             *
             */
            export type Tag = string;
            /**
             * A base64url-encoded auth configuration.
             *
             * Refer to the [authentication section](#section/Authentication) for
             * details.
             *
             */
            export type XRegistryAuth = string;
        }
        export interface PathParameters {
            name: /**
             * Name of the image to push. For example, `registry.example.com/myimage`.
             * The image must be present in the local image store with the same name.
             *
             * The name should be provided without tag; if a tag is provided, it
             * is ignored. For example, `registry.example.com/myimage:latest` is
             * considered equivalent to `registry.example.com/myimage`.
             *
             * Use the `tag` parameter to specify the tag to push.
             *
             */
            Parameters.Name;
        }
        export interface QueryParameters {
            tag?: /**
             * Tag of the image to push. For example, `latest`. If no tag is provided,
             * all tags of the given image that are present in the local image store
             * are pushed.
             *
             */
            Parameters.Tag;
        }
        namespace Responses {
            export type $404 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace ImageSearch {
        namespace Parameters {
            /**
             * A JSON encoded value of the filters (a `map[string][]string`) to process on the images list. Available filters:
             *
             * - `is-automated=(true|false)`
             * - `is-official=(true|false)`
             * - `stars=<number>` Matches images that has at least 'number' stars.
             *
             */
            export type Filters = string;
            /**
             * Maximum number of results to return
             */
            export type Limit = number;
            /**
             * Term to search
             */
            export type Term = string;
        }
        export interface QueryParameters {
            term: /* Term to search */ Parameters.Term;
            limit?: /* Maximum number of results to return */ Parameters.Limit;
            filters?: /**
             * A JSON encoded value of the filters (a `map[string][]string`) to process on the images list. Available filters:
             *
             * - `is-automated=(true|false)`
             * - `is-official=(true|false)`
             * - `stars=<number>` Matches images that has at least 'number' stars.
             *
             */
            Parameters.Filters;
        }
        namespace Responses {
            export type $200 = {
                description?: string;
                is_official?: boolean;
                is_automated?: boolean;
                name?: string;
                star_count?: number;
            }[];
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace ImageTag {
        namespace Parameters {
            /**
             * Image name or ID to tag.
             */
            export type Name = string;
            /**
             * The repository to tag in. For example, `someuser/someimage`.
             */
            export type Repo = string;
            /**
             * The name of the new tag.
             */
            export type Tag = string;
        }
        export interface PathParameters {
            name: /* Image name or ID to tag. */ Parameters.Name;
        }
        export interface QueryParameters {
            repo?: /* The repository to tag in. For example, `someuser/someimage`. */ Parameters.Repo;
            tag?: /* The name of the new tag. */ Parameters.Tag;
        }
        namespace Responses {
            export type $400 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $404 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $409 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace NetworkConnect {
        export interface BodyParameters {
            container: /**
             * NetworkConnectRequest
             * example:
             * {
             *   "Container": "3613f73ba0e4",
             *   "EndpointConfig": {
             *     "IPAMConfig": {
             *       "IPv4Address": "172.24.56.89",
             *       "IPv6Address": "2001:db8::5689"
             *     }
             *   }
             * }
             */
            Parameters.Container;
        }
        namespace Parameters {
            /**
             * NetworkConnectRequest
             * example:
             * {
             *   "Container": "3613f73ba0e4",
             *   "EndpointConfig": {
             *     "IPAMConfig": {
             *       "IPv4Address": "172.24.56.89",
             *       "IPv6Address": "2001:db8::5689"
             *     }
             *   }
             * }
             */
            export interface Container {
                /**
                 * The ID or name of the container to connect to the network.
                 */
                Container?: string;
                EndpointConfig?: /* Configuration for a network endpoint. */ slime.external.docker.engine.definitions.EndpointSettings;
            }
            /**
             * Network ID or name
             */
            export type Id = string;
        }
        export interface PathParameters {
            id: /* Network ID or name */ Parameters.Id;
        }
        namespace Responses {
            export type $403 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $404 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace NetworkCreate {
        export interface BodyParameters {
            networkConfig: /* NetworkCreateRequest */ Parameters.NetworkConfig;
        }
        namespace Parameters {
            /**
             * NetworkCreateRequest
             */
            export interface NetworkConfig {
                /**
                 * The network's name.
                 * example:
                 * my_network
                 */
                Name: string;
                /**
                 * Check for networks with duplicate names. Since Network is
                 * primarily keyed based on a random ID and not on the name, and
                 * network name is strictly a user-friendly alias to the network
                 * which is uniquely identified using ID, there is no guaranteed
                 * way to check for duplicates. CheckDuplicate is there to provide
                 * a best effort checking of any networks which has the same name
                 * but it is not guaranteed to catch all name collisions.
                 *
                 * example:
                 * true
                 */
                CheckDuplicate?: boolean;
                /**
                 * Name of the network driver plugin to use.
                 * example:
                 * bridge
                 */
                Driver?: string;
                /**
                 * The level at which the network exists (e.g. `swarm` for cluster-wide
                 * or `local` for machine level).
                 *
                 */
                Scope?: string;
                /**
                 * Restrict external access to the network.
                 */
                Internal?: boolean;
                /**
                 * Globally scoped network is manually attachable by regular
                 * containers from workers in swarm mode.
                 *
                 * example:
                 * true
                 */
                Attachable?: boolean;
                /**
                 * Ingress network is the network which provides the routing-mesh
                 * in swarm mode.
                 *
                 * example:
                 * false
                 */
                Ingress?: boolean;
                /**
                 * Creates a config-only network. Config-only networks are placeholder
                 * networks for network configurations to be used by other networks.
                 * Config-only networks cannot be used directly to run containers
                 * or services.
                 *
                 * example:
                 * false
                 */
                ConfigOnly?: boolean;
                /**
                 * Specifies the source which will provide the configuration for
                 * this network. The specified network must be an existing
                 * config-only network; see ConfigOnly.
                 *
                 */
                ConfigFrom?: /**
                 * The config-only network source to provide the configuration for
                 * this network.
                 *
                 */
                slime.external.docker.engine.definitions.ConfigReference;
                /**
                 * Optional custom IP scheme for the network.
                 */
                IPAM?: slime.external.docker.engine.definitions.IPAM;
                /**
                 * Enable IPv6 on the network.
                 * example:
                 * true
                 */
                EnableIPv6?: boolean;
                /**
                 * Network specific options to be used by the drivers.
                 * example:
                 * {
                 *   "com.docker.network.bridge.default_bridge": "true",
                 *   "com.docker.network.bridge.enable_icc": "true",
                 *   "com.docker.network.bridge.enable_ip_masquerade": "true",
                 *   "com.docker.network.bridge.host_binding_ipv4": "0.0.0.0",
                 *   "com.docker.network.bridge.name": "docker0",
                 *   "com.docker.network.driver.mtu": "1500"
                 * }
                 */
                Options?: {
                    [name: string]: string;
                };
                /**
                 * User-defined key/value metadata.
                 * example:
                 * {
                 *   "com.example.some-label": "some-value",
                 *   "com.example.some-other-label": "some-other-value"
                 * }
                 */
                Labels?: {
                    [name: string]: string;
                };
            }
        }
        namespace Responses {
            /**
             * NetworkCreateResponse
             * example:
             * {
             *   "Id": "22be93d5babb089c5aab8dbc369042fad48ff791584ca2da2100db837a1c7c30",
             *   "Warning": ""
             * }
             */
            export interface $201 {
                /**
                 * The ID of the created network.
                 */
                Id?: string;
                Warning?: string;
            }
            export type $400 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $403 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $404 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace NetworkDelete {
        namespace Parameters {
            /**
             * Network ID or name
             */
            export type Id = string;
        }
        export interface PathParameters {
            id: /* Network ID or name */ Parameters.Id;
        }
        namespace Responses {
            export type $403 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $404 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace NetworkDisconnect {
        export interface BodyParameters {
            container: /* NetworkDisconnectRequest */ Parameters.Container;
        }
        namespace Parameters {
            /**
             * NetworkDisconnectRequest
             */
            export interface Container {
                /**
                 * The ID or name of the container to disconnect from the network.
                 *
                 */
                Container?: string;
                /**
                 * Force the container to disconnect from the network.
                 *
                 */
                Force?: boolean;
            }
            /**
             * Network ID or name
             */
            export type Id = string;
        }
        export interface PathParameters {
            id: /* Network ID or name */ Parameters.Id;
        }
        namespace Responses {
            export type $403 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $404 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace NetworkInspect {
        namespace Parameters {
            /**
             * Network ID or name
             */
            export type Id = string;
            /**
             * Filter the network by scope (swarm, global, or local)
             */
            export type Scope = string;
            /**
             * Detailed inspect output for troubleshooting
             */
            export type Verbose = boolean;
        }
        export interface PathParameters {
            id: /* Network ID or name */ Parameters.Id;
        }
        export interface QueryParameters {
            verbose?: /* Detailed inspect output for troubleshooting */ Parameters.Verbose;
            scope?: /* Filter the network by scope (swarm, global, or local) */ Parameters.Scope;
        }
        namespace Responses {
            export type $200 = slime.external.docker.engine.definitions.Network;
            export type $404 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace NetworkList {
        namespace Parameters {
            /**
             * JSON encoded value of the filters (a `map[string][]string`) to process
             * on the networks list.
             *
             * Available filters:
             *
             * - `dangling=<boolean>` When set to `true` (or `1`), returns all
             *    networks that are not in use by a container. When set to `false`
             *    (or `0`), only networks that are in use by one or more
             *    containers are returned.
             * - `driver=<driver-name>` Matches a network's driver.
             * - `id=<network-id>` Matches all or part of a network ID.
             * - `label=<key>` or `label=<key>=<value>` of a network label.
             * - `name=<network-name>` Matches all or part of a network name.
             * - `scope=["swarm"|"global"|"local"]` Filters networks by scope (`swarm`, `global`, or `local`).
             * - `type=["custom"|"builtin"]` Filters networks by type. The `custom` keyword returns all user-defined networks.
             *
             */
            export type Filters = string;
        }
        export interface QueryParameters {
            filters?: /**
             * JSON encoded value of the filters (a `map[string][]string`) to process
             * on the networks list.
             *
             * Available filters:
             *
             * - `dangling=<boolean>` When set to `true` (or `1`), returns all
             *    networks that are not in use by a container. When set to `false`
             *    (or `0`), only networks that are in use by one or more
             *    containers are returned.
             * - `driver=<driver-name>` Matches a network's driver.
             * - `id=<network-id>` Matches all or part of a network ID.
             * - `label=<key>` or `label=<key>=<value>` of a network label.
             * - `name=<network-name>` Matches all or part of a network name.
             * - `scope=["swarm"|"global"|"local"]` Filters networks by scope (`swarm`, `global`, or `local`).
             * - `type=["custom"|"builtin"]` Filters networks by type. The `custom` keyword returns all user-defined networks.
             *
             */
            Parameters.Filters;
        }
        namespace Responses {
            export type $200 = slime.external.docker.engine.definitions.Network[];
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace NetworkPrune {
        namespace Parameters {
            /**
             * Filters to process on the prune list, encoded as JSON (a `map[string][]string`).
             *
             * Available filters:
             * - `until=<timestamp>` Prune networks created before this timestamp. The `<timestamp>` can be Unix timestamps, date formatted timestamps, or Go duration strings (e.g. `10m`, `1h30m`) computed relative to the daemon machine’s time.
             * - `label` (`label=<key>`, `label=<key>=<value>`, `label!=<key>`, or `label!=<key>=<value>`) Prune networks with (or without, in case `label!=...` is used) the specified labels.
             *
             */
            export type Filters = string;
        }
        export interface QueryParameters {
            filters?: /**
             * Filters to process on the prune list, encoded as JSON (a `map[string][]string`).
             *
             * Available filters:
             * - `until=<timestamp>` Prune networks created before this timestamp. The `<timestamp>` can be Unix timestamps, date formatted timestamps, or Go duration strings (e.g. `10m`, `1h30m`) computed relative to the daemon machine’s time.
             * - `label` (`label=<key>`, `label=<key>=<value>`, `label!=<key>`, or `label!=<key>=<value>`) Prune networks with (or without, in case `label!=...` is used) the specified labels.
             *
             */
            Parameters.Filters;
        }
        namespace Responses {
            /**
             * NetworkPruneResponse
             */
            export interface $200 {
                /**
                 * Networks that were deleted
                 */
                NetworksDeleted?: string[];
            }
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace NodeDelete {
        namespace Parameters {
            /**
             * Force remove a node from the swarm
             */
            export type Force = boolean;
            /**
             * The ID or name of the node
             */
            export type Id = string;
        }
        export interface PathParameters {
            id: /* The ID or name of the node */ Parameters.Id;
        }
        export interface QueryParameters {
            force?: /* Force remove a node from the swarm */ Parameters.Force;
        }
        namespace Responses {
            export type $404 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $503 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace NodeInspect {
        namespace Parameters {
            /**
             * The ID or name of the node
             */
            export type Id = string;
        }
        export interface PathParameters {
            id: /* The ID or name of the node */ Parameters.Id;
        }
        namespace Responses {
            export type $200 = slime.external.docker.engine.definitions.Node;
            export type $404 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $503 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace NodeList {
        namespace Parameters {
            /**
             * Filters to process on the nodes list, encoded as JSON (a `map[string][]string`).
             *
             * Available filters:
             * - `id=<node id>`
             * - `label=<engine label>`
             * - `membership=`(`accepted`|`pending`)`
             * - `name=<node name>`
             * - `node.label=<node label>`
             * - `role=`(`manager`|`worker`)`
             *
             */
            export type Filters = string;
        }
        export interface QueryParameters {
            filters?: /**
             * Filters to process on the nodes list, encoded as JSON (a `map[string][]string`).
             *
             * Available filters:
             * - `id=<node id>`
             * - `label=<engine label>`
             * - `membership=`(`accepted`|`pending`)`
             * - `name=<node name>`
             * - `node.label=<node label>`
             * - `role=`(`manager`|`worker`)`
             *
             */
            Parameters.Filters;
        }
        namespace Responses {
            export type $200 = slime.external.docker.engine.definitions.Node[];
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $503 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace NodeUpdate {
        export interface BodyParameters {
            body?: Parameters.Body;
        }
        namespace Parameters {
            export type Body = /**
             * example:
             * {
             *   "Availability": "active",
             *   "Name": "node-name",
             *   "Role": "manager",
             *   "Labels": {
             *     "foo": "bar"
             *   }
             * }
             */
            slime.external.docker.engine.definitions.NodeSpec;
            /**
             * The ID of the node
             */
            export type Id = string;
            /**
             * The version number of the node object being updated. This is required
             * to avoid conflicting writes.
             *
             */
            export type Version = number; // int64
        }
        export interface PathParameters {
            id: /* The ID of the node */ Parameters.Id;
        }
        export interface QueryParameters {
            version: /**
             * The version number of the node object being updated. This is required
             * to avoid conflicting writes.
             *
             */
            Parameters.Version /* int64 */;
        }
        namespace Responses {
            export type $400 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $404 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $503 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace PluginCreate {
        export interface BodyParameters {
            tarContext?: Parameters.TarContext /* binary */;
        }
        namespace Parameters {
            /**
             * The name of the plugin. The `:latest` tag is optional, and is the
             * default if omitted.
             *
             */
            export type Name = string;
            export type TarContext = string; // binary
        }
        export interface QueryParameters {
            name: /**
             * The name of the plugin. The `:latest` tag is optional, and is the
             * default if omitted.
             *
             */
            Parameters.Name;
        }
        namespace Responses {
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace PluginDelete {
        namespace Parameters {
            /**
             * Disable the plugin before removing. This may result in issues if the
             * plugin is in use by a container.
             *
             */
            export type Force = boolean;
            /**
             * The name of the plugin. The `:latest` tag is optional, and is the
             * default if omitted.
             *
             */
            export type Name = string;
        }
        export interface PathParameters {
            name: /**
             * The name of the plugin. The `:latest` tag is optional, and is the
             * default if omitted.
             *
             */
            Parameters.Name;
        }
        export interface QueryParameters {
            force?: /**
             * Disable the plugin before removing. This may result in issues if the
             * plugin is in use by a container.
             *
             */
            Parameters.Force;
        }
        namespace Responses {
            export type $200 = /* A plugin for the Engine API */ slime.external.docker.engine.definitions.Plugin;
            export type $404 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace PluginDisable {
        namespace Parameters {
            /**
             * Force disable a plugin even if still in use.
             *
             */
            export type Force = boolean;
            /**
             * The name of the plugin. The `:latest` tag is optional, and is the
             * default if omitted.
             *
             */
            export type Name = string;
        }
        export interface PathParameters {
            name: /**
             * The name of the plugin. The `:latest` tag is optional, and is the
             * default if omitted.
             *
             */
            Parameters.Name;
        }
        export interface QueryParameters {
            force?: /**
             * Force disable a plugin even if still in use.
             *
             */
            Parameters.Force;
        }
        namespace Responses {
            export type $404 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace PluginEnable {
        namespace Parameters {
            /**
             * The name of the plugin. The `:latest` tag is optional, and is the
             * default if omitted.
             *
             */
            export type Name = string;
            /**
             * Set the HTTP client timeout (in seconds)
             */
            export type Timeout = number;
        }
        export interface PathParameters {
            name: /**
             * The name of the plugin. The `:latest` tag is optional, and is the
             * default if omitted.
             *
             */
            Parameters.Name;
        }
        export interface QueryParameters {
            timeout?: /* Set the HTTP client timeout (in seconds) */ Parameters.Timeout;
        }
        namespace Responses {
            export type $404 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace PluginInspect {
        namespace Parameters {
            /**
             * The name of the plugin. The `:latest` tag is optional, and is the
             * default if omitted.
             *
             */
            export type Name = string;
        }
        export interface PathParameters {
            name: /**
             * The name of the plugin. The `:latest` tag is optional, and is the
             * default if omitted.
             *
             */
            Parameters.Name;
        }
        namespace Responses {
            export type $200 = /* A plugin for the Engine API */ slime.external.docker.engine.definitions.Plugin;
            export type $404 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace PluginList {
        namespace Parameters {
            /**
             * A JSON encoded value of the filters (a `map[string][]string`) to
             * process on the plugin list.
             *
             * Available filters:
             *
             * - `capability=<capability name>`
             * - `enable=<true>|<false>`
             *
             */
            export type Filters = string;
        }
        export interface QueryParameters {
            filters?: /**
             * A JSON encoded value of the filters (a `map[string][]string`) to
             * process on the plugin list.
             *
             * Available filters:
             *
             * - `capability=<capability name>`
             * - `enable=<true>|<false>`
             *
             */
            Parameters.Filters;
        }
        namespace Responses {
            export type $200 = /* A plugin for the Engine API */ slime.external.docker.engine.definitions.Plugin[];
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace PluginPull {
        export interface BodyParameters {
            body?: /**
             * example:
             * [
             *   {
             *     "Name": "network",
             *     "Description": "",
             *     "Value": [
             *       "host"
             *     ]
             *   },
             *   {
             *     "Name": "mount",
             *     "Description": "",
             *     "Value": [
             *       "/data"
             *     ]
             *   },
             *   {
             *     "Name": "device",
             *     "Description": "",
             *     "Value": [
             *       "/dev/cpu_dma_latency"
             *     ]
             *   }
             * ]
             */
            Parameters.Body;
        }
        export interface HeaderParameters {
            "X-Registry-Auth"?: /**
             * A base64url-encoded auth configuration to use when pulling a plugin
             * from a registry.
             *
             * Refer to the [authentication section](#section/Authentication) for
             * details.
             *
             */
            Parameters.XRegistryAuth;
        }
        namespace Parameters {
            /**
             * example:
             * [
             *   {
             *     "Name": "network",
             *     "Description": "",
             *     "Value": [
             *       "host"
             *     ]
             *   },
             *   {
             *     "Name": "mount",
             *     "Description": "",
             *     "Value": [
             *       "/data"
             *     ]
             *   },
             *   {
             *     "Name": "device",
             *     "Description": "",
             *     "Value": [
             *       "/dev/cpu_dma_latency"
             *     ]
             *   }
             * ]
             */
            export type Body = /**
             * Describes a permission the user has to accept upon installing
             * the plugin.
             *
             */
            slime.external.docker.engine.definitions.PluginPrivilege[];
            /**
             * Local name for the pulled plugin.
             *
             * The `:latest` tag is optional, and is used as the default if omitted.
             *
             */
            export type Name = string;
            /**
             * Remote reference for plugin to install.
             *
             * The `:latest` tag is optional, and is used as the default if omitted.
             *
             */
            export type Remote = string;
            /**
             * A base64url-encoded auth configuration to use when pulling a plugin
             * from a registry.
             *
             * Refer to the [authentication section](#section/Authentication) for
             * details.
             *
             */
            export type XRegistryAuth = string;
        }
        export interface QueryParameters {
            remote: /**
             * Remote reference for plugin to install.
             *
             * The `:latest` tag is optional, and is used as the default if omitted.
             *
             */
            Parameters.Remote;
            name?: /**
             * Local name for the pulled plugin.
             *
             * The `:latest` tag is optional, and is used as the default if omitted.
             *
             */
            Parameters.Name;
        }
        namespace Responses {
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace PluginPush {
        namespace Parameters {
            /**
             * The name of the plugin. The `:latest` tag is optional, and is the
             * default if omitted.
             *
             */
            export type Name = string;
        }
        export interface PathParameters {
            name: /**
             * The name of the plugin. The `:latest` tag is optional, and is the
             * default if omitted.
             *
             */
            Parameters.Name;
        }
        namespace Responses {
            export type $404 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace PluginSet {
        export interface BodyParameters {
            body?: /**
             * example:
             * [
             *   "DEBUG=1"
             * ]
             */
            Parameters.Body;
        }
        namespace Parameters {
            /**
             * example:
             * [
             *   "DEBUG=1"
             * ]
             */
            export type Body = string[];
            /**
             * The name of the plugin. The `:latest` tag is optional, and is the
             * default if omitted.
             *
             */
            export type Name = string;
        }
        export interface PathParameters {
            name: /**
             * The name of the plugin. The `:latest` tag is optional, and is the
             * default if omitted.
             *
             */
            Parameters.Name;
        }
        namespace Responses {
            export type $404 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace PluginUpgrade {
        export interface BodyParameters {
            body?: /**
             * example:
             * [
             *   {
             *     "Name": "network",
             *     "Description": "",
             *     "Value": [
             *       "host"
             *     ]
             *   },
             *   {
             *     "Name": "mount",
             *     "Description": "",
             *     "Value": [
             *       "/data"
             *     ]
             *   },
             *   {
             *     "Name": "device",
             *     "Description": "",
             *     "Value": [
             *       "/dev/cpu_dma_latency"
             *     ]
             *   }
             * ]
             */
            Parameters.Body;
        }
        export interface HeaderParameters {
            "X-Registry-Auth"?: /**
             * A base64url-encoded auth configuration to use when pulling a plugin
             * from a registry.
             *
             * Refer to the [authentication section](#section/Authentication) for
             * details.
             *
             */
            Parameters.XRegistryAuth;
        }
        namespace Parameters {
            /**
             * example:
             * [
             *   {
             *     "Name": "network",
             *     "Description": "",
             *     "Value": [
             *       "host"
             *     ]
             *   },
             *   {
             *     "Name": "mount",
             *     "Description": "",
             *     "Value": [
             *       "/data"
             *     ]
             *   },
             *   {
             *     "Name": "device",
             *     "Description": "",
             *     "Value": [
             *       "/dev/cpu_dma_latency"
             *     ]
             *   }
             * ]
             */
            export type Body = /**
             * Describes a permission the user has to accept upon installing
             * the plugin.
             *
             */
            slime.external.docker.engine.definitions.PluginPrivilege[];
            /**
             * The name of the plugin. The `:latest` tag is optional, and is the
             * default if omitted.
             *
             */
            export type Name = string;
            /**
             * Remote reference to upgrade to.
             *
             * The `:latest` tag is optional, and is used as the default if omitted.
             *
             */
            export type Remote = string;
            /**
             * A base64url-encoded auth configuration to use when pulling a plugin
             * from a registry.
             *
             * Refer to the [authentication section](#section/Authentication) for
             * details.
             *
             */
            export type XRegistryAuth = string;
        }
        export interface PathParameters {
            name: /**
             * The name of the plugin. The `:latest` tag is optional, and is the
             * default if omitted.
             *
             */
            Parameters.Name;
        }
        export interface QueryParameters {
            remote: /**
             * Remote reference to upgrade to.
             *
             * The `:latest` tag is optional, and is used as the default if omitted.
             *
             */
            Parameters.Remote;
        }
        namespace Responses {
            export type $404 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace PutContainerArchive {
        export interface BodyParameters {
            inputStream: Parameters.InputStream /* binary */;
        }
        namespace Parameters {
            /**
             * If `1`, `true`, then it will copy UID/GID maps to the dest file or
             * dir
             *
             */
            export type CopyUIDGID = string;
            /**
             * ID or name of the container
             */
            export type Id = string;
            export type InputStream = string; // binary
            /**
             * If `1`, `true`, or `True` then it will be an error if unpacking the
             * given content would cause an existing directory to be replaced with
             * a non-directory and vice versa.
             *
             */
            export type NoOverwriteDirNonDir = string;
            /**
             * Path to a directory in the container to extract the archive’s contents into.
             */
            export type Path = string;
        }
        export interface PathParameters {
            id: /* ID or name of the container */ Parameters.Id;
        }
        export interface QueryParameters {
            path: /* Path to a directory in the container to extract the archive’s contents into.  */ Parameters.Path;
            noOverwriteDirNonDir?: /**
             * If `1`, `true`, or `True` then it will be an error if unpacking the
             * given content would cause an existing directory to be replaced with
             * a non-directory and vice versa.
             *
             */
            Parameters.NoOverwriteDirNonDir;
            copyUIDGID?: /**
             * If `1`, `true`, then it will copy UID/GID maps to the dest file or
             * dir
             *
             */
            Parameters.CopyUIDGID;
        }
        namespace Responses {
            export type $400 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $403 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $404 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace SecretCreate {
        export interface BodyParameters {
            body?: /**
             * example:
             * {
             *   "Name": "app-key.crt",
             *   "Labels": {
             *     "foo": "bar"
             *   },
             *   "Data": "VEhJUyBJUyBOT1QgQSBSRUFMIENFUlRJRklDQVRFCg==",
             *   "Driver": {
             *     "Name": "secret-bucket",
             *     "Options": {
             *       "OptionA": "value for driver option A",
             *       "OptionB": "value for driver option B"
             *     }
             *   }
             * }
             */
            Parameters.Body;
        }
        namespace Parameters {
            /**
             * example:
             * {
             *   "Name": "app-key.crt",
             *   "Labels": {
             *     "foo": "bar"
             *   },
             *   "Data": "VEhJUyBJUyBOT1QgQSBSRUFMIENFUlRJRklDQVRFCg==",
             *   "Driver": {
             *     "Name": "secret-bucket",
             *     "Options": {
             *       "OptionA": "value for driver option A",
             *       "OptionB": "value for driver option B"
             *     }
             *   }
             * }
             */
            export interface Body {
                /**
                 * User-defined name of the secret.
                 */
                Name?: string;
                /**
                 * User-defined key/value metadata.
                 * example:
                 * {
                 *   "com.example.some-label": "some-value",
                 *   "com.example.some-other-label": "some-other-value"
                 * }
                 */
                Labels?: {
                    [name: string]: string;
                };
                /**
                 * Base64-url-safe-encoded ([RFC 4648](https://tools.ietf.org/html/rfc4648#section-5))
                 * data to store as secret.
                 *
                 * This field is only used to _create_ a secret, and is not returned by
                 * other endpoints.
                 *
                 * example:
                 *
                 */
                Data?: string;
                Driver?: /* Driver represents a driver (network, logging, secrets). */ slime.external.docker.engine.definitions.Driver;
                Templating?: /* Driver represents a driver (network, logging, secrets). */ slime.external.docker.engine.definitions.Driver;
            }
        }
        namespace Responses {
            export type $201 = /* Response to an API call that returns just an Id */ slime.external.docker.engine.definitions.IdResponse;
            export type $409 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $503 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace SecretDelete {
        namespace Parameters {
            /**
             * ID of the secret
             */
            export type Id = string;
        }
        export interface PathParameters {
            id: /* ID of the secret */ Parameters.Id;
        }
        namespace Responses {
            export type $404 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $503 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace SecretInspect {
        namespace Parameters {
            /**
             * ID of the secret
             */
            export type Id = string;
        }
        export interface PathParameters {
            id: /* ID of the secret */ Parameters.Id;
        }
        namespace Responses {
            export type $200 = slime.external.docker.engine.definitions.Secret;
            export type $404 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $503 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace SecretList {
        namespace Parameters {
            /**
             * A JSON encoded value of the filters (a `map[string][]string`) to
             * process on the secrets list.
             *
             * Available filters:
             *
             * - `id=<secret id>`
             * - `label=<key> or label=<key>=value`
             * - `name=<secret name>`
             * - `names=<secret name>`
             *
             */
            export type Filters = string;
        }
        export interface QueryParameters {
            filters?: /**
             * A JSON encoded value of the filters (a `map[string][]string`) to
             * process on the secrets list.
             *
             * Available filters:
             *
             * - `id=<secret id>`
             * - `label=<key> or label=<key>=value`
             * - `name=<secret name>`
             * - `names=<secret name>`
             *
             */
            Parameters.Filters;
        }
        namespace Responses {
            /**
             * example:
             * [
             *   {
             *     "ID": "blt1owaxmitz71s9v5zh81zun",
             *     "Version": {
             *       "Index": 85
             *     },
             *     "CreatedAt": "2017-07-20T13:55:28.678958722Z",
             *     "UpdatedAt": "2017-07-20T13:55:28.678958722Z",
             *     "Spec": {
             *       "Name": "mysql-passwd",
             *       "Labels": {
             *         "some.label": "some.value"
             *       },
             *       "Driver": {
             *         "Name": "secret-bucket",
             *         "Options": {
             *           "OptionA": "value for driver option A",
             *           "OptionB": "value for driver option B"
             *         }
             *       }
             *     }
             *   },
             *   {
             *     "ID": "ktnbjxoalbkvbvedmg1urrz8h",
             *     "Version": {
             *       "Index": 11
             *     },
             *     "CreatedAt": "2016-11-05T01:20:17.327670065Z",
             *     "UpdatedAt": "2016-11-05T01:20:17.327670065Z",
             *     "Spec": {
             *       "Name": "app-dev.crt",
             *       "Labels": {
             *         "foo": "bar"
             *       }
             *     }
             *   }
             * ]
             */
            export type $200 = slime.external.docker.engine.definitions.Secret[];
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $503 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace SecretUpdate {
        export interface BodyParameters {
            body?: Parameters.Body;
        }
        namespace Parameters {
            export type Body = slime.external.docker.engine.definitions.SecretSpec;
            /**
             * The ID or name of the secret
             */
            export type Id = string;
            /**
             * The version number of the secret object being updated. This is
             * required to avoid conflicting writes.
             *
             */
            export type Version = number; // int64
        }
        export interface PathParameters {
            id: /* The ID or name of the secret */ Parameters.Id;
        }
        export interface QueryParameters {
            version: /**
             * The version number of the secret object being updated. This is
             * required to avoid conflicting writes.
             *
             */
            Parameters.Version /* int64 */;
        }
        namespace Responses {
            export type $400 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $404 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $503 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace ServiceCreate {
        export interface BodyParameters {
            body: /**
             * User modifiable configuration for a service.
             * example:
             * {
             *   "Name": "web",
             *   "TaskTemplate": {
             *     "ContainerSpec": {
             *       "Image": "nginx:alpine",
             *       "Mounts": [
             *         {
             *           "ReadOnly": true,
             *           "Source": "web-data",
             *           "Target": "/usr/share/nginx/html",
             *           "Type": "volume",
             *           "VolumeOptions": {
             *             "DriverConfig": {},
             *             "Labels": {
             *               "com.example.something": "something-value"
             *             }
             *           }
             *         }
             *       ],
             *       "Hosts": [
             *         "10.10.10.10 host1",
             *         "ABCD:EF01:2345:6789:ABCD:EF01:2345:6789 host2"
             *       ],
             *       "User": "33",
             *       "DNSConfig": {
             *         "Nameservers": [
             *           "8.8.8.8"
             *         ],
             *         "Search": [
             *           "example.org"
             *         ],
             *         "Options": [
             *           "timeout:3"
             *         ]
             *       },
             *       "Secrets": [
             *         {
             *           "File": {
             *             "Name": "www.example.org.key",
             *             "UID": "33",
             *             "GID": "33",
             *             "Mode": 384
             *           },
             *           "SecretID": "fpjqlhnwb19zds35k8wn80lq9",
             *           "SecretName": "example_org_domain_key"
             *         }
             *       ]
             *     },
             *     "LogDriver": {
             *       "Name": "json-file",
             *       "Options": {
             *         "max-file": "3",
             *         "max-size": "10M"
             *       }
             *     },
             *     "Placement": {},
             *     "Resources": {
             *       "Limits": {
             *         "MemoryBytes": 104857600
             *       },
             *       "Reservations": {}
             *     },
             *     "RestartPolicy": {
             *       "Condition": "on-failure",
             *       "Delay": 10000000000,
             *       "MaxAttempts": 10
             *     }
             *   },
             *   "Mode": {
             *     "Replicated": {
             *       "Replicas": 4
             *     }
             *   },
             *   "UpdateConfig": {
             *     "Parallelism": 2,
             *     "Delay": 1000000000,
             *     "FailureAction": "pause",
             *     "Monitor": 15000000000,
             *     "MaxFailureRatio": 0.15
             *   },
             *   "RollbackConfig": {
             *     "Parallelism": 1,
             *     "Delay": 1000000000,
             *     "FailureAction": "pause",
             *     "Monitor": 15000000000,
             *     "MaxFailureRatio": 0.15
             *   },
             *   "EndpointSpec": {
             *     "Ports": [
             *       {
             *         "Protocol": "tcp",
             *         "PublishedPort": 8080,
             *         "TargetPort": 80
             *       }
             *     ]
             *   },
             *   "Labels": {
             *     "foo": "bar"
             *   }
             * }
             */
            Parameters.Body;
        }
        export interface HeaderParameters {
            "X-Registry-Auth"?: /**
             * A base64url-encoded auth configuration for pulling from private
             * registries.
             *
             * Refer to the [authentication section](#section/Authentication) for
             * details.
             *
             */
            Parameters.XRegistryAuth;
        }
        namespace Parameters {
            /**
             * User modifiable configuration for a service.
             * example:
             * {
             *   "Name": "web",
             *   "TaskTemplate": {
             *     "ContainerSpec": {
             *       "Image": "nginx:alpine",
             *       "Mounts": [
             *         {
             *           "ReadOnly": true,
             *           "Source": "web-data",
             *           "Target": "/usr/share/nginx/html",
             *           "Type": "volume",
             *           "VolumeOptions": {
             *             "DriverConfig": {},
             *             "Labels": {
             *               "com.example.something": "something-value"
             *             }
             *           }
             *         }
             *       ],
             *       "Hosts": [
             *         "10.10.10.10 host1",
             *         "ABCD:EF01:2345:6789:ABCD:EF01:2345:6789 host2"
             *       ],
             *       "User": "33",
             *       "DNSConfig": {
             *         "Nameservers": [
             *           "8.8.8.8"
             *         ],
             *         "Search": [
             *           "example.org"
             *         ],
             *         "Options": [
             *           "timeout:3"
             *         ]
             *       },
             *       "Secrets": [
             *         {
             *           "File": {
             *             "Name": "www.example.org.key",
             *             "UID": "33",
             *             "GID": "33",
             *             "Mode": 384
             *           },
             *           "SecretID": "fpjqlhnwb19zds35k8wn80lq9",
             *           "SecretName": "example_org_domain_key"
             *         }
             *       ]
             *     },
             *     "LogDriver": {
             *       "Name": "json-file",
             *       "Options": {
             *         "max-file": "3",
             *         "max-size": "10M"
             *       }
             *     },
             *     "Placement": {},
             *     "Resources": {
             *       "Limits": {
             *         "MemoryBytes": 104857600
             *       },
             *       "Reservations": {}
             *     },
             *     "RestartPolicy": {
             *       "Condition": "on-failure",
             *       "Delay": 10000000000,
             *       "MaxAttempts": 10
             *     }
             *   },
             *   "Mode": {
             *     "Replicated": {
             *       "Replicas": 4
             *     }
             *   },
             *   "UpdateConfig": {
             *     "Parallelism": 2,
             *     "Delay": 1000000000,
             *     "FailureAction": "pause",
             *     "Monitor": 15000000000,
             *     "MaxFailureRatio": 0.15
             *   },
             *   "RollbackConfig": {
             *     "Parallelism": 1,
             *     "Delay": 1000000000,
             *     "FailureAction": "pause",
             *     "Monitor": 15000000000,
             *     "MaxFailureRatio": 0.15
             *   },
             *   "EndpointSpec": {
             *     "Ports": [
             *       {
             *         "Protocol": "tcp",
             *         "PublishedPort": 8080,
             *         "TargetPort": 80
             *       }
             *     ]
             *   },
             *   "Labels": {
             *     "foo": "bar"
             *   }
             * }
             */
            export interface Body {
                /**
                 * Name of the service.
                 */
                Name?: string;
                /**
                 * User-defined key/value metadata.
                 */
                Labels?: {
                    [name: string]: string;
                };
                TaskTemplate?: /* User modifiable task configuration. */ slime.external.docker.engine.definitions.TaskSpec;
                /**
                 * Scheduling mode for the service.
                 */
                Mode?: {
                    Replicated?: {
                        Replicas?: number; // int64
                    };
                    Global?: {
                        [key: string]: any;
                    };
                    /**
                     * The mode used for services with a finite number of tasks that run
                     * to a completed state.
                     *
                     */
                    ReplicatedJob?: {
                        /**
                         * The maximum number of replicas to run simultaneously.
                         *
                         */
                        MaxConcurrent?: number; // int64
                        /**
                         * The total number of replicas desired to reach the Completed
                         * state. If unset, will default to the value of `MaxConcurrent`
                         *
                         */
                        TotalCompletions?: number; // int64
                    };
                    /**
                     * The mode used for services which run a task to the completed state
                     * on each valid node.
                     *
                     */
                    GlobalJob?: {
                        [key: string]: any;
                    };
                };
                /**
                 * Specification for the update strategy of the service.
                 */
                UpdateConfig?: {
                    /**
                     * Maximum number of tasks to be updated in one iteration (0 means
                     * unlimited parallelism).
                     *
                     */
                    Parallelism?: number; // int64
                    /**
                     * Amount of time between updates, in nanoseconds.
                     */
                    Delay?: number; // int64
                    /**
                     * Action to take if an updated task fails to run, or stops running
                     * during the update.
                     *
                     */
                    FailureAction?: "continue" | "pause" | "rollback";
                    /**
                     * Amount of time to monitor each updated task for failures, in
                     * nanoseconds.
                     *
                     */
                    Monitor?: number; // int64
                    /**
                     * The fraction of tasks that may fail during an update before the
                     * failure action is invoked, specified as a floating point number
                     * between 0 and 1.
                     *
                     */
                    MaxFailureRatio?: number;
                    /**
                     * The order of operations when rolling out an updated task. Either
                     * the old task is shut down before the new task is started, or the
                     * new task is started before the old task is shut down.
                     *
                     */
                    Order?: "stop-first" | "start-first";
                };
                /**
                 * Specification for the rollback strategy of the service.
                 */
                RollbackConfig?: {
                    /**
                     * Maximum number of tasks to be rolled back in one iteration (0 means
                     * unlimited parallelism).
                     *
                     */
                    Parallelism?: number; // int64
                    /**
                     * Amount of time between rollback iterations, in nanoseconds.
                     *
                     */
                    Delay?: number; // int64
                    /**
                     * Action to take if an rolled back task fails to run, or stops
                     * running during the rollback.
                     *
                     */
                    FailureAction?: "continue" | "pause";
                    /**
                     * Amount of time to monitor each rolled back task for failures, in
                     * nanoseconds.
                     *
                     */
                    Monitor?: number; // int64
                    /**
                     * The fraction of tasks that may fail during a rollback before the
                     * failure action is invoked, specified as a floating point number
                     * between 0 and 1.
                     *
                     */
                    MaxFailureRatio?: number;
                    /**
                     * The order of operations when rolling back a task. Either the old
                     * task is shut down before the new task is started, or the new task
                     * is started before the old task is shut down.
                     *
                     */
                    Order?: "stop-first" | "start-first";
                };
                /**
                 * Specifies which networks the service should attach to.
                 */
                Networks?: /**
                 * Specifies how a service should be attached to a particular network.
                 *
                 */
                slime.external.docker.engine.definitions.NetworkAttachmentConfig[];
                EndpointSpec?: /* Properties that can be configured to access and load balance a service. */ slime.external.docker.engine.definitions.EndpointSpec;
            }
            /**
             * A base64url-encoded auth configuration for pulling from private
             * registries.
             *
             * Refer to the [authentication section](#section/Authentication) for
             * details.
             *
             */
            export type XRegistryAuth = string;
        }
        namespace Responses {
            /**
             * ServiceCreateResponse
             * example:
             * {
             *   "ID": "ak7w3gjqoa3kuz8xcpnyy0pvl",
             *   "Warning": "unable to pin image doesnotexist:latest to digest: image library/doesnotexist:latest not found"
             * }
             */
            export interface $201 {
                /**
                 * The ID of the created service.
                 */
                ID?: string;
                /**
                 * Optional warning message
                 */
                Warning?: string;
            }
            export type $400 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $403 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $409 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $503 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace ServiceDelete {
        namespace Parameters {
            /**
             * ID or name of service.
             */
            export type Id = string;
        }
        export interface PathParameters {
            id: /* ID or name of service. */ Parameters.Id;
        }
        namespace Responses {
            export type $404 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $503 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace ServiceInspect {
        namespace Parameters {
            /**
             * ID or name of service.
             */
            export type Id = string;
            /**
             * Fill empty fields with default values.
             */
            export type InsertDefaults = boolean;
        }
        export interface PathParameters {
            id: /* ID or name of service. */ Parameters.Id;
        }
        export interface QueryParameters {
            insertDefaults?: /* Fill empty fields with default values. */ Parameters.InsertDefaults;
        }
        namespace Responses {
            export type $200 = /**
             * example:
             * {
             *   "ID": "9mnpnzenvg8p8tdbtq4wvbkcz",
             *   "Version": {
             *     "Index": 19
             *   },
             *   "CreatedAt": "2016-06-07T21:05:51.880065305Z",
             *   "UpdatedAt": "2016-06-07T21:07:29.962229872Z",
             *   "Spec": {
             *     "Name": "hopeful_cori",
             *     "TaskTemplate": {
             *       "ContainerSpec": {
             *         "Image": "redis"
             *       },
             *       "Resources": {
             *         "Limits": {},
             *         "Reservations": {}
             *       },
             *       "RestartPolicy": {
             *         "Condition": "any",
             *         "MaxAttempts": 0
             *       },
             *       "Placement": {},
             *       "ForceUpdate": 0
             *     },
             *     "Mode": {
             *       "Replicated": {
             *         "Replicas": 1
             *       }
             *     },
             *     "UpdateConfig": {
             *       "Parallelism": 1,
             *       "Delay": 1000000000,
             *       "FailureAction": "pause",
             *       "Monitor": 15000000000,
             *       "MaxFailureRatio": 0.15
             *     },
             *     "RollbackConfig": {
             *       "Parallelism": 1,
             *       "Delay": 1000000000,
             *       "FailureAction": "pause",
             *       "Monitor": 15000000000,
             *       "MaxFailureRatio": 0.15
             *     },
             *     "EndpointSpec": {
             *       "Mode": "vip",
             *       "Ports": [
             *         {
             *           "Protocol": "tcp",
             *           "TargetPort": 6379,
             *           "PublishedPort": 30001
             *         }
             *       ]
             *     }
             *   },
             *   "Endpoint": {
             *     "Spec": {
             *       "Mode": "vip",
             *       "Ports": [
             *         {
             *           "Protocol": "tcp",
             *           "TargetPort": 6379,
             *           "PublishedPort": 30001
             *         }
             *       ]
             *     },
             *     "Ports": [
             *       {
             *         "Protocol": "tcp",
             *         "TargetPort": 6379,
             *         "PublishedPort": 30001
             *       }
             *     ],
             *     "VirtualIPs": [
             *       {
             *         "NetworkID": "4qvuz4ko70xaltuqbt8956gd1",
             *         "Addr": "10.255.0.2/16"
             *       },
             *       {
             *         "NetworkID": "4qvuz4ko70xaltuqbt8956gd1",
             *         "Addr": "10.255.0.3/16"
             *       }
             *     ]
             *   }
             * }
             */
            slime.external.docker.engine.definitions.Service;
            export type $404 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $503 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace ServiceList {
        namespace Parameters {
            /**
             * A JSON encoded value of the filters (a `map[string][]string`) to
             * process on the services list.
             *
             * Available filters:
             *
             * - `id=<service id>`
             * - `label=<service label>`
             * - `mode=["replicated"|"global"]`
             * - `name=<service name>`
             *
             */
            export type Filters = string;
            /**
             * Include service status, with count of running and desired tasks.
             *
             */
            export type Status = boolean;
        }
        export interface QueryParameters {
            filters?: /**
             * A JSON encoded value of the filters (a `map[string][]string`) to
             * process on the services list.
             *
             * Available filters:
             *
             * - `id=<service id>`
             * - `label=<service label>`
             * - `mode=["replicated"|"global"]`
             * - `name=<service name>`
             *
             */
            Parameters.Filters;
            status?: /**
             * Include service status, with count of running and desired tasks.
             *
             */
            Parameters.Status;
        }
        namespace Responses {
            export type $200 = /**
             * example:
             * {
             *   "ID": "9mnpnzenvg8p8tdbtq4wvbkcz",
             *   "Version": {
             *     "Index": 19
             *   },
             *   "CreatedAt": "2016-06-07T21:05:51.880065305Z",
             *   "UpdatedAt": "2016-06-07T21:07:29.962229872Z",
             *   "Spec": {
             *     "Name": "hopeful_cori",
             *     "TaskTemplate": {
             *       "ContainerSpec": {
             *         "Image": "redis"
             *       },
             *       "Resources": {
             *         "Limits": {},
             *         "Reservations": {}
             *       },
             *       "RestartPolicy": {
             *         "Condition": "any",
             *         "MaxAttempts": 0
             *       },
             *       "Placement": {},
             *       "ForceUpdate": 0
             *     },
             *     "Mode": {
             *       "Replicated": {
             *         "Replicas": 1
             *       }
             *     },
             *     "UpdateConfig": {
             *       "Parallelism": 1,
             *       "Delay": 1000000000,
             *       "FailureAction": "pause",
             *       "Monitor": 15000000000,
             *       "MaxFailureRatio": 0.15
             *     },
             *     "RollbackConfig": {
             *       "Parallelism": 1,
             *       "Delay": 1000000000,
             *       "FailureAction": "pause",
             *       "Monitor": 15000000000,
             *       "MaxFailureRatio": 0.15
             *     },
             *     "EndpointSpec": {
             *       "Mode": "vip",
             *       "Ports": [
             *         {
             *           "Protocol": "tcp",
             *           "TargetPort": 6379,
             *           "PublishedPort": 30001
             *         }
             *       ]
             *     }
             *   },
             *   "Endpoint": {
             *     "Spec": {
             *       "Mode": "vip",
             *       "Ports": [
             *         {
             *           "Protocol": "tcp",
             *           "TargetPort": 6379,
             *           "PublishedPort": 30001
             *         }
             *       ]
             *     },
             *     "Ports": [
             *       {
             *         "Protocol": "tcp",
             *         "TargetPort": 6379,
             *         "PublishedPort": 30001
             *       }
             *     ],
             *     "VirtualIPs": [
             *       {
             *         "NetworkID": "4qvuz4ko70xaltuqbt8956gd1",
             *         "Addr": "10.255.0.2/16"
             *       },
             *       {
             *         "NetworkID": "4qvuz4ko70xaltuqbt8956gd1",
             *         "Addr": "10.255.0.3/16"
             *       }
             *     ]
             *   }
             * }
             */
            slime.external.docker.engine.definitions.Service[];
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $503 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace ServiceLogs {
        namespace Parameters {
            /**
             * Show service context and extra details provided to logs.
             */
            export type Details = boolean;
            /**
             * Keep connection after returning logs.
             */
            export type Follow = boolean;
            /**
             * ID or name of the service
             */
            export type Id = string;
            /**
             * Only return logs since this time, as a UNIX timestamp
             */
            export type Since = number;
            /**
             * Return logs from `stderr`
             */
            export type Stderr = boolean;
            /**
             * Return logs from `stdout`
             */
            export type Stdout = boolean;
            /**
             * Only return this number of log lines from the end of the logs.
             * Specify as an integer or `all` to output all log lines.
             *
             */
            export type Tail = string;
            /**
             * Add timestamps to every log line
             */
            export type Timestamps = boolean;
        }
        export interface PathParameters {
            id: /* ID or name of the service */ Parameters.Id;
        }
        export interface QueryParameters {
            details?: /* Show service context and extra details provided to logs. */ Parameters.Details;
            follow?: /* Keep connection after returning logs. */ Parameters.Follow;
            stdout?: /* Return logs from `stdout` */ Parameters.Stdout;
            stderr?: /* Return logs from `stderr` */ Parameters.Stderr;
            since?: /* Only return logs since this time, as a UNIX timestamp */ Parameters.Since;
            timestamps?: /* Add timestamps to every log line */ Parameters.Timestamps;
            tail?: /**
             * Only return this number of log lines from the end of the logs.
             * Specify as an integer or `all` to output all log lines.
             *
             */
            Parameters.Tail;
        }
        namespace Responses {
            export type $200 = string; // binary
            export type $404 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $503 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace ServiceUpdate {
        export interface BodyParameters {
            body: /**
             * User modifiable configuration for a service.
             * example:
             * {
             *   "Name": "top",
             *   "TaskTemplate": {
             *     "ContainerSpec": {
             *       "Image": "busybox",
             *       "Args": [
             *         "top"
             *       ]
             *     },
             *     "Resources": {
             *       "Limits": {},
             *       "Reservations": {}
             *     },
             *     "RestartPolicy": {
             *       "Condition": "any",
             *       "MaxAttempts": 0
             *     },
             *     "Placement": {},
             *     "ForceUpdate": 0
             *   },
             *   "Mode": {
             *     "Replicated": {
             *       "Replicas": 1
             *     }
             *   },
             *   "UpdateConfig": {
             *     "Parallelism": 2,
             *     "Delay": 1000000000,
             *     "FailureAction": "pause",
             *     "Monitor": 15000000000,
             *     "MaxFailureRatio": 0.15
             *   },
             *   "RollbackConfig": {
             *     "Parallelism": 1,
             *     "Delay": 1000000000,
             *     "FailureAction": "pause",
             *     "Monitor": 15000000000,
             *     "MaxFailureRatio": 0.15
             *   },
             *   "EndpointSpec": {
             *     "Mode": "vip"
             *   }
             * }
             */
            Parameters.Body;
        }
        export interface HeaderParameters {
            "X-Registry-Auth"?: /**
             * A base64url-encoded auth configuration for pulling from private
             * registries.
             *
             * Refer to the [authentication section](#section/Authentication) for
             * details.
             *
             */
            Parameters.XRegistryAuth;
        }
        namespace Parameters {
            /**
             * User modifiable configuration for a service.
             * example:
             * {
             *   "Name": "top",
             *   "TaskTemplate": {
             *     "ContainerSpec": {
             *       "Image": "busybox",
             *       "Args": [
             *         "top"
             *       ]
             *     },
             *     "Resources": {
             *       "Limits": {},
             *       "Reservations": {}
             *     },
             *     "RestartPolicy": {
             *       "Condition": "any",
             *       "MaxAttempts": 0
             *     },
             *     "Placement": {},
             *     "ForceUpdate": 0
             *   },
             *   "Mode": {
             *     "Replicated": {
             *       "Replicas": 1
             *     }
             *   },
             *   "UpdateConfig": {
             *     "Parallelism": 2,
             *     "Delay": 1000000000,
             *     "FailureAction": "pause",
             *     "Monitor": 15000000000,
             *     "MaxFailureRatio": 0.15
             *   },
             *   "RollbackConfig": {
             *     "Parallelism": 1,
             *     "Delay": 1000000000,
             *     "FailureAction": "pause",
             *     "Monitor": 15000000000,
             *     "MaxFailureRatio": 0.15
             *   },
             *   "EndpointSpec": {
             *     "Mode": "vip"
             *   }
             * }
             */
            export interface Body {
                /**
                 * Name of the service.
                 */
                Name?: string;
                /**
                 * User-defined key/value metadata.
                 */
                Labels?: {
                    [name: string]: string;
                };
                TaskTemplate?: /* User modifiable task configuration. */ slime.external.docker.engine.definitions.TaskSpec;
                /**
                 * Scheduling mode for the service.
                 */
                Mode?: {
                    Replicated?: {
                        Replicas?: number; // int64
                    };
                    Global?: {
                        [key: string]: any;
                    };
                    /**
                     * The mode used for services with a finite number of tasks that run
                     * to a completed state.
                     *
                     */
                    ReplicatedJob?: {
                        /**
                         * The maximum number of replicas to run simultaneously.
                         *
                         */
                        MaxConcurrent?: number; // int64
                        /**
                         * The total number of replicas desired to reach the Completed
                         * state. If unset, will default to the value of `MaxConcurrent`
                         *
                         */
                        TotalCompletions?: number; // int64
                    };
                    /**
                     * The mode used for services which run a task to the completed state
                     * on each valid node.
                     *
                     */
                    GlobalJob?: {
                        [key: string]: any;
                    };
                };
                /**
                 * Specification for the update strategy of the service.
                 */
                UpdateConfig?: {
                    /**
                     * Maximum number of tasks to be updated in one iteration (0 means
                     * unlimited parallelism).
                     *
                     */
                    Parallelism?: number; // int64
                    /**
                     * Amount of time between updates, in nanoseconds.
                     */
                    Delay?: number; // int64
                    /**
                     * Action to take if an updated task fails to run, or stops running
                     * during the update.
                     *
                     */
                    FailureAction?: "continue" | "pause" | "rollback";
                    /**
                     * Amount of time to monitor each updated task for failures, in
                     * nanoseconds.
                     *
                     */
                    Monitor?: number; // int64
                    /**
                     * The fraction of tasks that may fail during an update before the
                     * failure action is invoked, specified as a floating point number
                     * between 0 and 1.
                     *
                     */
                    MaxFailureRatio?: number;
                    /**
                     * The order of operations when rolling out an updated task. Either
                     * the old task is shut down before the new task is started, or the
                     * new task is started before the old task is shut down.
                     *
                     */
                    Order?: "stop-first" | "start-first";
                };
                /**
                 * Specification for the rollback strategy of the service.
                 */
                RollbackConfig?: {
                    /**
                     * Maximum number of tasks to be rolled back in one iteration (0 means
                     * unlimited parallelism).
                     *
                     */
                    Parallelism?: number; // int64
                    /**
                     * Amount of time between rollback iterations, in nanoseconds.
                     *
                     */
                    Delay?: number; // int64
                    /**
                     * Action to take if an rolled back task fails to run, or stops
                     * running during the rollback.
                     *
                     */
                    FailureAction?: "continue" | "pause";
                    /**
                     * Amount of time to monitor each rolled back task for failures, in
                     * nanoseconds.
                     *
                     */
                    Monitor?: number; // int64
                    /**
                     * The fraction of tasks that may fail during a rollback before the
                     * failure action is invoked, specified as a floating point number
                     * between 0 and 1.
                     *
                     */
                    MaxFailureRatio?: number;
                    /**
                     * The order of operations when rolling back a task. Either the old
                     * task is shut down before the new task is started, or the new task
                     * is started before the old task is shut down.
                     *
                     */
                    Order?: "stop-first" | "start-first";
                };
                /**
                 * Specifies which networks the service should attach to.
                 */
                Networks?: /**
                 * Specifies how a service should be attached to a particular network.
                 *
                 */
                slime.external.docker.engine.definitions.NetworkAttachmentConfig[];
                EndpointSpec?: /* Properties that can be configured to access and load balance a service. */ slime.external.docker.engine.definitions.EndpointSpec;
            }
            /**
             * ID or name of service.
             */
            export type Id = string;
            /**
             * If the `X-Registry-Auth` header is not specified, this parameter
             * indicates where to find registry authorization credentials.
             *
             */
            export type RegistryAuthFrom = "spec" | "previous-spec";
            /**
             * Set to this parameter to `previous` to cause a server-side rollback
             * to the previous service spec. The supplied spec will be ignored in
             * this case.
             *
             */
            export type Rollback = string;
            /**
             * The version number of the service object being updated. This is
             * required to avoid conflicting writes.
             * This version number should be the value as currently set on the
             * service *before* the update. You can find the current version by
             * calling `GET /services/{id}`
             *
             */
            export type Version = number;
            /**
             * A base64url-encoded auth configuration for pulling from private
             * registries.
             *
             * Refer to the [authentication section](#section/Authentication) for
             * details.
             *
             */
            export type XRegistryAuth = string;
        }
        export interface PathParameters {
            id: /* ID or name of service. */ Parameters.Id;
        }
        export interface QueryParameters {
            version: /**
             * The version number of the service object being updated. This is
             * required to avoid conflicting writes.
             * This version number should be the value as currently set on the
             * service *before* the update. You can find the current version by
             * calling `GET /services/{id}`
             *
             */
            Parameters.Version;
            registryAuthFrom?: /**
             * If the `X-Registry-Auth` header is not specified, this parameter
             * indicates where to find registry authorization credentials.
             *
             */
            Parameters.RegistryAuthFrom;
            rollback?: /**
             * Set to this parameter to `previous` to cause a server-side rollback
             * to the previous service spec. The supplied spec will be ignored in
             * this case.
             *
             */
            Parameters.Rollback;
        }
        namespace Responses {
            export type $200 = /**
             * example:
             * {
             *   "Warning": "unable to pin image doesnotexist:latest to digest: image library/doesnotexist:latest not found"
             * }
             */
            slime.external.docker.engine.definitions.ServiceUpdateResponse;
            export type $400 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $404 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $503 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace Session {
        namespace Responses {
            export type $400 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace SwarmInit {
        export interface BodyParameters {
            body: /**
             * SwarmInitRequest
             * example:
             * {
             *   "ListenAddr": "0.0.0.0:2377",
             *   "AdvertiseAddr": "192.168.1.1:2377",
             *   "DataPathPort": 4789,
             *   "DefaultAddrPool": [
             *     "10.10.0.0/8",
             *     "20.20.0.0/8"
             *   ],
             *   "SubnetSize": 24,
             *   "ForceNewCluster": false,
             *   "Spec": {
             *     "Orchestration": {},
             *     "Raft": {},
             *     "Dispatcher": {},
             *     "CAConfig": {},
             *     "EncryptionConfig": {
             *       "AutoLockManagers": false
             *     }
             *   }
             * }
             */
            Parameters.Body;
        }
        namespace Parameters {
            /**
             * SwarmInitRequest
             * example:
             * {
             *   "ListenAddr": "0.0.0.0:2377",
             *   "AdvertiseAddr": "192.168.1.1:2377",
             *   "DataPathPort": 4789,
             *   "DefaultAddrPool": [
             *     "10.10.0.0/8",
             *     "20.20.0.0/8"
             *   ],
             *   "SubnetSize": 24,
             *   "ForceNewCluster": false,
             *   "Spec": {
             *     "Orchestration": {},
             *     "Raft": {},
             *     "Dispatcher": {},
             *     "CAConfig": {},
             *     "EncryptionConfig": {
             *       "AutoLockManagers": false
             *     }
             *   }
             * }
             */
            export interface Body {
                /**
                 * Listen address used for inter-manager communication, as well
                 * as determining the networking interface used for the VXLAN
                 * Tunnel Endpoint (VTEP). This can either be an address/port
                 * combination in the form `192.168.1.1:4567`, or an interface
                 * followed by a port number, like `eth0:4567`. If the port number
                 * is omitted, the default swarm listening port is used.
                 *
                 */
                ListenAddr?: string;
                /**
                 * Externally reachable address advertised to other nodes. This
                 * can either be an address/port combination in the form
                 * `192.168.1.1:4567`, or an interface followed by a port number,
                 * like `eth0:4567`. If the port number is omitted, the port
                 * number from the listen address is used. If `AdvertiseAddr` is
                 * not specified, it will be automatically detected when possible.
                 *
                 */
                AdvertiseAddr?: string;
                /**
                 * Address or interface to use for data path traffic (format:
                 * `<ip|interface>`), for example,  `192.168.1.1`, or an interface,
                 * like `eth0`. If `DataPathAddr` is unspecified, the same address
                 * as `AdvertiseAddr` is used.
                 *
                 * The `DataPathAddr` specifies the address that global scope
                 * network drivers will publish towards other  nodes in order to
                 * reach the containers running on this node. Using this parameter
                 * it is possible to separate the container data traffic from the
                 * management traffic of the cluster.
                 *
                 */
                DataPathAddr?: string;
                /**
                 * DataPathPort specifies the data path port number for data traffic.
                 * Acceptable port range is 1024 to 49151.
                 * if no port is set or is set to 0, default port 4789 will be used.
                 *
                 */
                DataPathPort?: number; // uint32
                /**
                 * Default Address Pool specifies default subnet pools for global
                 * scope networks.
                 *
                 */
                DefaultAddrPool?: string[];
                /**
                 * Force creation of a new swarm.
                 */
                ForceNewCluster?: boolean;
                /**
                 * SubnetSize specifies the subnet size of the networks created
                 * from the default subnet pool.
                 *
                 */
                SubnetSize?: number; // uint32
                Spec?: /* User modifiable swarm configuration. */ slime.external.docker.engine.definitions.SwarmSpec;
            }
        }
        namespace Responses {
            /**
             * The node ID
             * example:
             * 7v2t30z9blmxuhnyo6s4cpenp
             */
            export type $200 = string;
            export type $400 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $503 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace SwarmInspect {
        namespace Responses {
            export type $200 = /**
             * ClusterInfo represents information about the swarm as is returned by the
             * "/info" endpoint. Join-tokens are not included.
             *
             */
            slime.external.docker.engine.definitions.Swarm;
            export type $404 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $503 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace SwarmJoin {
        export interface BodyParameters {
            body: /**
             * SwarmJoinRequest
             * example:
             * {
             *   "ListenAddr": "0.0.0.0:2377",
             *   "AdvertiseAddr": "192.168.1.1:2377",
             *   "RemoteAddrs": [
             *     "node1:2377"
             *   ],
             *   "JoinToken": "SWMTKN-1-3pu6hszjas19xyp7ghgosyx9k8atbfcr8p2is99znpy26u2lkl-7p73s1dx5in4tatdymyhg9hu2"
             * }
             */
            Parameters.Body;
        }
        namespace Parameters {
            /**
             * SwarmJoinRequest
             * example:
             * {
             *   "ListenAddr": "0.0.0.0:2377",
             *   "AdvertiseAddr": "192.168.1.1:2377",
             *   "RemoteAddrs": [
             *     "node1:2377"
             *   ],
             *   "JoinToken": "SWMTKN-1-3pu6hszjas19xyp7ghgosyx9k8atbfcr8p2is99znpy26u2lkl-7p73s1dx5in4tatdymyhg9hu2"
             * }
             */
            export interface Body {
                /**
                 * Listen address used for inter-manager communication if the node
                 * gets promoted to manager, as well as determining the networking
                 * interface used for the VXLAN Tunnel Endpoint (VTEP).
                 *
                 */
                ListenAddr?: string;
                /**
                 * Externally reachable address advertised to other nodes. This
                 * can either be an address/port combination in the form
                 * `192.168.1.1:4567`, or an interface followed by a port number,
                 * like `eth0:4567`. If the port number is omitted, the port
                 * number from the listen address is used. If `AdvertiseAddr` is
                 * not specified, it will be automatically detected when possible.
                 *
                 */
                AdvertiseAddr?: string;
                /**
                 * Address or interface to use for data path traffic (format:
                 * `<ip|interface>`), for example,  `192.168.1.1`, or an interface,
                 * like `eth0`. If `DataPathAddr` is unspecified, the same address
                 * as `AdvertiseAddr` is used.
                 *
                 * The `DataPathAddr` specifies the address that global scope
                 * network drivers will publish towards other nodes in order to
                 * reach the containers running on this node. Using this parameter
                 * it is possible to separate the container data traffic from the
                 * management traffic of the cluster.
                 *
                 */
                DataPathAddr?: string;
                /**
                 * Addresses of manager nodes already participating in the swarm.
                 *
                 */
                RemoteAddrs?: string[];
                /**
                 * Secret token for joining this swarm.
                 */
                JoinToken?: string;
            }
        }
        namespace Responses {
            export type $400 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $503 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace SwarmLeave {
        namespace Parameters {
            /**
             * Force leave swarm, even if this is the last manager or that it will
             * break the cluster.
             *
             */
            export type Force = boolean;
        }
        export interface QueryParameters {
            force?: /**
             * Force leave swarm, even if this is the last manager or that it will
             * break the cluster.
             *
             */
            Parameters.Force;
        }
        namespace Responses {
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $503 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace SwarmUnlock {
        export interface BodyParameters {
            body: /**
             * SwarmUnlockRequest
             * example:
             * {
             *   "UnlockKey": "SWMKEY-1-7c37Cc8654o6p38HnroywCi19pllOnGtbdZEgtKxZu8"
             * }
             */
            Parameters.Body;
        }
        namespace Parameters {
            /**
             * SwarmUnlockRequest
             * example:
             * {
             *   "UnlockKey": "SWMKEY-1-7c37Cc8654o6p38HnroywCi19pllOnGtbdZEgtKxZu8"
             * }
             */
            export interface Body {
                /**
                 * The swarm's unlock key.
                 */
                UnlockKey?: string;
            }
        }
        namespace Responses {
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $503 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace SwarmUnlockkey {
        namespace Responses {
            /**
             * UnlockKeyResponse
             * example:
             * {
             *   "UnlockKey": "SWMKEY-1-7c37Cc8654o6p38HnroywCi19pllOnGtbdZEgtKxZu8"
             * }
             */
            export interface $200 {
                /**
                 * The swarm's unlock key.
                 */
                UnlockKey?: string;
            }
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $503 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace SwarmUpdate {
        export interface BodyParameters {
            body: Parameters.Body;
        }
        namespace Parameters {
            export type Body = /* User modifiable swarm configuration. */ slime.external.docker.engine.definitions.SwarmSpec;
            /**
             * Rotate the manager join token.
             */
            export type RotateManagerToken = boolean;
            /**
             * Rotate the manager unlock key.
             */
            export type RotateManagerUnlockKey = boolean;
            /**
             * Rotate the worker join token.
             */
            export type RotateWorkerToken = boolean;
            /**
             * The version number of the swarm object being updated. This is
             * required to avoid conflicting writes.
             *
             */
            export type Version = number; // int64
        }
        export interface QueryParameters {
            version: /**
             * The version number of the swarm object being updated. This is
             * required to avoid conflicting writes.
             *
             */
            Parameters.Version /* int64 */;
            rotateWorkerToken?: /* Rotate the worker join token. */ Parameters.RotateWorkerToken;
            rotateManagerToken?: /* Rotate the manager join token. */ Parameters.RotateManagerToken;
            rotateManagerUnlockKey?: /* Rotate the manager unlock key. */ Parameters.RotateManagerUnlockKey;
        }
        namespace Responses {
            export type $400 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $503 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace SystemAuth {
        export interface BodyParameters {
            authConfig?: Parameters.AuthConfig;
        }
        namespace Parameters {
            export type AuthConfig = /**
             * example:
             * {
             *   "username": "hannibal",
             *   "password": "xxxx",
             *   "serveraddress": "https://index.docker.io/v1/"
             * }
             */
            slime.external.docker.engine.definitions.AuthConfig;
        }
        namespace Responses {
            /**
             * SystemAuthResponse
             */
            export interface $200 {
                /**
                 * The status of the authentication
                 */
                Status: string;
                /**
                 * An opaque token used to authenticate a user after a successful login
                 */
                IdentityToken?: string;
            }
            export type $401 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace SystemDataUsage {
        namespace Parameters {
            /**
             * Object types, for which to compute and return data.
             *
             */
            export type Type = ("container" | "image" | "volume" | "build-cache")[];
        }
        export interface QueryParameters {
            type?: /**
             * Object types, for which to compute and return data.
             *
             */
            Parameters.Type;
        }
        namespace Responses {
            /**
             * SystemDataUsageResponse
             * example:
             * {
             *   "LayersSize": 1092588,
             *   "Images": [
             *     {
             *       "Id": "sha256:2b8fd9751c4c0f5dd266fcae00707e67a2545ef34f9a29354585f93dac906749",
             *       "ParentId": "",
             *       "RepoTags": [
             *         "busybox:latest"
             *       ],
             *       "RepoDigests": [
             *         "busybox@sha256:a59906e33509d14c036c8678d687bd4eec81ed7c4b8ce907b888c607f6a1e0e6"
             *       ],
             *       "Created": 1466724217,
             *       "Size": 1092588,
             *       "SharedSize": 0,
             *       "VirtualSize": 1092588,
             *       "Labels": {},
             *       "Containers": 1
             *     }
             *   ],
             *   "Containers": [
             *     {
             *       "Id": "e575172ed11dc01bfce087fb27bee502db149e1a0fad7c296ad300bbff178148",
             *       "Names": [
             *         "/top"
             *       ],
             *       "Image": "busybox",
             *       "ImageID": "sha256:2b8fd9751c4c0f5dd266fcae00707e67a2545ef34f9a29354585f93dac906749",
             *       "Command": "top",
             *       "Created": 1472592424,
             *       "Ports": [],
             *       "SizeRootFs": 1092588,
             *       "Labels": {},
             *       "State": "exited",
             *       "Status": "Exited (0) 56 minutes ago",
             *       "HostConfig": {
             *         "NetworkMode": "default"
             *       },
             *       "NetworkSettings": {
             *         "Networks": {
             *           "bridge": {
             *             "IPAMConfig": null,
             *             "Links": null,
             *             "Aliases": null,
             *             "NetworkID": "d687bc59335f0e5c9ee8193e5612e8aee000c8c62ea170cfb99c098f95899d92",
             *             "EndpointID": "8ed5115aeaad9abb174f68dcf135b49f11daf597678315231a32ca28441dec6a",
             *             "Gateway": "172.18.0.1",
             *             "IPAddress": "172.18.0.2",
             *             "IPPrefixLen": 16,
             *             "IPv6Gateway": "",
             *             "GlobalIPv6Address": "",
             *             "GlobalIPv6PrefixLen": 0,
             *             "MacAddress": "02:42:ac:12:00:02"
             *           }
             *         }
             *       },
             *       "Mounts": []
             *     }
             *   ],
             *   "Volumes": [
             *     {
             *       "Name": "my-volume",
             *       "Driver": "local",
             *       "Mountpoint": "/var/lib/docker/volumes/my-volume/_data",
             *       "Labels": null,
             *       "Scope": "local",
             *       "Options": null,
             *       "UsageData": {
             *         "Size": 10920104,
             *         "RefCount": 2
             *       }
             *     }
             *   ],
             *   "BuildCache": [
             *     {
             *       "ID": "hw53o5aio51xtltp5xjp8v7fx",
             *       "Parents": [],
             *       "Type": "regular",
             *       "Description": "pulled from docker.io/library/debian@sha256:234cb88d3020898631af0ccbbcca9a66ae7306ecd30c9720690858c1b007d2a0",
             *       "InUse": false,
             *       "Shared": true,
             *       "Size": 0,
             *       "CreatedAt": "2021-06-28T13:31:01.474619385Z",
             *       "LastUsedAt": "2021-07-07T22:02:32.738075951Z",
             *       "UsageCount": 26
             *     },
             *     {
             *       "ID": "ndlpt0hhvkqcdfkputsk4cq9c",
             *       "Parents": [
             *         "ndlpt0hhvkqcdfkputsk4cq9c"
             *       ],
             *       "Type": "regular",
             *       "Description": "mount / from exec /bin/sh -c echo 'Binary::apt::APT::Keep-Downloaded-Packages \"true\";' > /etc/apt/apt.conf.d/keep-cache",
             *       "InUse": false,
             *       "Shared": true,
             *       "Size": 51,
             *       "CreatedAt": "2021-06-28T13:31:03.002625487Z",
             *       "LastUsedAt": "2021-07-07T22:02:32.773909517Z",
             *       "UsageCount": 26
             *     }
             *   ]
             * }
             */
            export interface $200 {
                LayersSize?: number; // int64
                Images?: slime.external.docker.engine.definitions.ImageSummary[];
                Containers?: slime.external.docker.engine.definitions.ContainerSummary[];
                Volumes?: slime.external.docker.engine.definitions.Volume[];
                BuildCache?: /**
                 * BuildCache contains information about a build cache record.
                 *
                 */
                slime.external.docker.engine.definitions.BuildCache[];
            }
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace SystemEvents {
        namespace Parameters {
            /**
             * A JSON encoded value of filters (a `map[string][]string`) to process on the event list. Available filters:
             *
             * - `config=<string>` config name or ID
             * - `container=<string>` container name or ID
             * - `daemon=<string>` daemon name or ID
             * - `event=<string>` event type
             * - `image=<string>` image name or ID
             * - `label=<string>` image or container label
             * - `network=<string>` network name or ID
             * - `node=<string>` node ID
             * - `plugin`=<string> plugin name or ID
             * - `scope`=<string> local or swarm
             * - `secret=<string>` secret name or ID
             * - `service=<string>` service name or ID
             * - `type=<string>` object to filter by, one of `container`, `image`, `volume`, `network`, `daemon`, `plugin`, `node`, `service`, `secret` or `config`
             * - `volume=<string>` volume name
             *
             */
            export type Filters = string;
            /**
             * Show events created since this timestamp then stream new events.
             */
            export type Since = string;
            /**
             * Show events created until this timestamp then stop streaming.
             */
            export type Until = string;
        }
        export interface QueryParameters {
            since?: /* Show events created since this timestamp then stream new events. */ Parameters.Since;
            until?: /* Show events created until this timestamp then stop streaming. */ Parameters.Until;
            filters?: /**
             * A JSON encoded value of filters (a `map[string][]string`) to process on the event list. Available filters:
             *
             * - `config=<string>` config name or ID
             * - `container=<string>` container name or ID
             * - `daemon=<string>` daemon name or ID
             * - `event=<string>` event type
             * - `image=<string>` image name or ID
             * - `label=<string>` image or container label
             * - `network=<string>` network name or ID
             * - `node=<string>` node ID
             * - `plugin`=<string> plugin name or ID
             * - `scope`=<string> local or swarm
             * - `secret=<string>` secret name or ID
             * - `service=<string>` service name or ID
             * - `type=<string>` object to filter by, one of `container`, `image`, `volume`, `network`, `daemon`, `plugin`, `node`, `service`, `secret` or `config`
             * - `volume=<string>` volume name
             *
             */
            Parameters.Filters;
        }
        namespace Responses {
            export type $200 = /**
             * SystemEventsResponse
             * EventMessage represents the information an event contains.
             *
             */
            slime.external.docker.engine.definitions.EventMessage;
            export type $400 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace SystemInfo {
        namespace Responses {
            export type $200 = slime.external.docker.engine.definitions.SystemInfo;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace SystemPing {
        namespace Responses {
            /**
             * example:
             * OK
             */
            export type $200 = string;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace SystemPingHead {
        namespace Responses {
            /**
             * example:
             * (empty)
             */
            export type $200 = string;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace SystemVersion {
        namespace Responses {
            export type $200 = /**
             * Response of Engine API: GET "/version"
             *
             */
            slime.external.docker.engine.definitions.SystemVersion;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace TaskInspect {
        namespace Parameters {
            /**
             * ID of the task
             */
            export type Id = string;
        }
        export interface PathParameters {
            id: /* ID of the task */ Parameters.Id;
        }
        namespace Responses {
            export type $200 = /**
             * example:
             * {
             *   "ID": "0kzzo1i0y4jz6027t0k7aezc7",
             *   "Version": {
             *     "Index": 71
             *   },
             *   "CreatedAt": "2016-06-07T21:07:31.171892745Z",
             *   "UpdatedAt": "2016-06-07T21:07:31.376370513Z",
             *   "Spec": {
             *     "ContainerSpec": {
             *       "Image": "redis"
             *     },
             *     "Resources": {
             *       "Limits": {},
             *       "Reservations": {}
             *     },
             *     "RestartPolicy": {
             *       "Condition": "any",
             *       "MaxAttempts": 0
             *     },
             *     "Placement": {}
             *   },
             *   "ServiceID": "9mnpnzenvg8p8tdbtq4wvbkcz",
             *   "Slot": 1,
             *   "NodeID": "60gvrl6tm78dmak4yl7srz94v",
             *   "Status": {
             *     "Timestamp": "2016-06-07T21:07:31.290032978Z",
             *     "State": "running",
             *     "Message": "started",
             *     "ContainerStatus": {
             *       "ContainerID": "e5d62702a1b48d01c3e02ca1e0212a250801fa8d67caca0b6f35919ebc12f035",
             *       "PID": 677
             *     }
             *   },
             *   "DesiredState": "running",
             *   "NetworksAttachments": [
             *     {
             *       "Network": {
             *         "ID": "4qvuz4ko70xaltuqbt8956gd1",
             *         "Version": {
             *           "Index": 18
             *         },
             *         "CreatedAt": "2016-06-07T20:31:11.912919752Z",
             *         "UpdatedAt": "2016-06-07T21:07:29.955277358Z",
             *         "Spec": {
             *           "Name": "ingress",
             *           "Labels": {
             *             "com.docker.swarm.internal": "true"
             *           },
             *           "DriverConfiguration": {},
             *           "IPAMOptions": {
             *             "Driver": {},
             *             "Configs": [
             *               {
             *                 "Subnet": "10.255.0.0/16",
             *                 "Gateway": "10.255.0.1"
             *               }
             *             ]
             *           }
             *         },
             *         "DriverState": {
             *           "Name": "overlay",
             *           "Options": {
             *             "com.docker.network.driver.overlay.vxlanid_list": "256"
             *           }
             *         },
             *         "IPAMOptions": {
             *           "Driver": {
             *             "Name": "default"
             *           },
             *           "Configs": [
             *             {
             *               "Subnet": "10.255.0.0/16",
             *               "Gateway": "10.255.0.1"
             *             }
             *           ]
             *         }
             *       },
             *       "Addresses": [
             *         "10.255.0.10/16"
             *       ]
             *     }
             *   ],
             *   "AssignedGenericResources": [
             *     {
             *       "DiscreteResourceSpec": {
             *         "Kind": "SSD",
             *         "Value": 3
             *       }
             *     },
             *     {
             *       "NamedResourceSpec": {
             *         "Kind": "GPU",
             *         "Value": "UUID1"
             *       }
             *     },
             *     {
             *       "NamedResourceSpec": {
             *         "Kind": "GPU",
             *         "Value": "UUID2"
             *       }
             *     }
             *   ]
             * }
             */
            slime.external.docker.engine.definitions.Task;
            export type $404 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $503 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace TaskList {
        namespace Parameters {
            /**
             * A JSON encoded value of the filters (a `map[string][]string`) to
             * process on the tasks list.
             *
             * Available filters:
             *
             * - `desired-state=(running | shutdown | accepted)`
             * - `id=<task id>`
             * - `label=key` or `label="key=value"`
             * - `name=<task name>`
             * - `node=<node id or name>`
             * - `service=<service name>`
             *
             */
            export type Filters = string;
        }
        export interface QueryParameters {
            filters?: /**
             * A JSON encoded value of the filters (a `map[string][]string`) to
             * process on the tasks list.
             *
             * Available filters:
             *
             * - `desired-state=(running | shutdown | accepted)`
             * - `id=<task id>`
             * - `label=key` or `label="key=value"`
             * - `name=<task name>`
             * - `node=<node id or name>`
             * - `service=<service name>`
             *
             */
            Parameters.Filters;
        }
        namespace Responses {
            /**
             * example:
             * [
             *   {
             *     "ID": "0kzzo1i0y4jz6027t0k7aezc7",
             *     "Version": {
             *       "Index": 71
             *     },
             *     "CreatedAt": "2016-06-07T21:07:31.171892745Z",
             *     "UpdatedAt": "2016-06-07T21:07:31.376370513Z",
             *     "Spec": {
             *       "ContainerSpec": {
             *         "Image": "redis"
             *       },
             *       "Resources": {
             *         "Limits": {},
             *         "Reservations": {}
             *       },
             *       "RestartPolicy": {
             *         "Condition": "any",
             *         "MaxAttempts": 0
             *       },
             *       "Placement": {}
             *     },
             *     "ServiceID": "9mnpnzenvg8p8tdbtq4wvbkcz",
             *     "Slot": 1,
             *     "NodeID": "60gvrl6tm78dmak4yl7srz94v",
             *     "Status": {
             *       "Timestamp": "2016-06-07T21:07:31.290032978Z",
             *       "State": "running",
             *       "Message": "started",
             *       "ContainerStatus": {
             *         "ContainerID": "e5d62702a1b48d01c3e02ca1e0212a250801fa8d67caca0b6f35919ebc12f035",
             *         "PID": 677
             *       }
             *     },
             *     "DesiredState": "running",
             *     "NetworksAttachments": [
             *       {
             *         "Network": {
             *           "ID": "4qvuz4ko70xaltuqbt8956gd1",
             *           "Version": {
             *             "Index": 18
             *           },
             *           "CreatedAt": "2016-06-07T20:31:11.912919752Z",
             *           "UpdatedAt": "2016-06-07T21:07:29.955277358Z",
             *           "Spec": {
             *             "Name": "ingress",
             *             "Labels": {
             *               "com.docker.swarm.internal": "true"
             *             },
             *             "DriverConfiguration": {},
             *             "IPAMOptions": {
             *               "Driver": {},
             *               "Configs": [
             *                 {
             *                   "Subnet": "10.255.0.0/16",
             *                   "Gateway": "10.255.0.1"
             *                 }
             *               ]
             *             }
             *           },
             *           "DriverState": {
             *             "Name": "overlay",
             *             "Options": {
             *               "com.docker.network.driver.overlay.vxlanid_list": "256"
             *             }
             *           },
             *           "IPAMOptions": {
             *             "Driver": {
             *               "Name": "default"
             *             },
             *             "Configs": [
             *               {
             *                 "Subnet": "10.255.0.0/16",
             *                 "Gateway": "10.255.0.1"
             *               }
             *             ]
             *           }
             *         },
             *         "Addresses": [
             *           "10.255.0.10/16"
             *         ]
             *       }
             *     ]
             *   },
             *   {
             *     "ID": "1yljwbmlr8er2waf8orvqpwms",
             *     "Version": {
             *       "Index": 30
             *     },
             *     "CreatedAt": "2016-06-07T21:07:30.019104782Z",
             *     "UpdatedAt": "2016-06-07T21:07:30.231958098Z",
             *     "Name": "hopeful_cori",
             *     "Spec": {
             *       "ContainerSpec": {
             *         "Image": "redis"
             *       },
             *       "Resources": {
             *         "Limits": {},
             *         "Reservations": {}
             *       },
             *       "RestartPolicy": {
             *         "Condition": "any",
             *         "MaxAttempts": 0
             *       },
             *       "Placement": {}
             *     },
             *     "ServiceID": "9mnpnzenvg8p8tdbtq4wvbkcz",
             *     "Slot": 1,
             *     "NodeID": "60gvrl6tm78dmak4yl7srz94v",
             *     "Status": {
             *       "Timestamp": "2016-06-07T21:07:30.202183143Z",
             *       "State": "shutdown",
             *       "Message": "shutdown",
             *       "ContainerStatus": {
             *         "ContainerID": "1cf8d63d18e79668b0004a4be4c6ee58cddfad2dae29506d8781581d0688a213"
             *       }
             *     },
             *     "DesiredState": "shutdown",
             *     "NetworksAttachments": [
             *       {
             *         "Network": {
             *           "ID": "4qvuz4ko70xaltuqbt8956gd1",
             *           "Version": {
             *             "Index": 18
             *           },
             *           "CreatedAt": "2016-06-07T20:31:11.912919752Z",
             *           "UpdatedAt": "2016-06-07T21:07:29.955277358Z",
             *           "Spec": {
             *             "Name": "ingress",
             *             "Labels": {
             *               "com.docker.swarm.internal": "true"
             *             },
             *             "DriverConfiguration": {},
             *             "IPAMOptions": {
             *               "Driver": {},
             *               "Configs": [
             *                 {
             *                   "Subnet": "10.255.0.0/16",
             *                   "Gateway": "10.255.0.1"
             *                 }
             *               ]
             *             }
             *           },
             *           "DriverState": {
             *             "Name": "overlay",
             *             "Options": {
             *               "com.docker.network.driver.overlay.vxlanid_list": "256"
             *             }
             *           },
             *           "IPAMOptions": {
             *             "Driver": {
             *               "Name": "default"
             *             },
             *             "Configs": [
             *               {
             *                 "Subnet": "10.255.0.0/16",
             *                 "Gateway": "10.255.0.1"
             *               }
             *             ]
             *           }
             *         },
             *         "Addresses": [
             *           "10.255.0.5/16"
             *         ]
             *       }
             *     ]
             *   }
             * ]
             */
            export type $200 = /**
             * example:
             * {
             *   "ID": "0kzzo1i0y4jz6027t0k7aezc7",
             *   "Version": {
             *     "Index": 71
             *   },
             *   "CreatedAt": "2016-06-07T21:07:31.171892745Z",
             *   "UpdatedAt": "2016-06-07T21:07:31.376370513Z",
             *   "Spec": {
             *     "ContainerSpec": {
             *       "Image": "redis"
             *     },
             *     "Resources": {
             *       "Limits": {},
             *       "Reservations": {}
             *     },
             *     "RestartPolicy": {
             *       "Condition": "any",
             *       "MaxAttempts": 0
             *     },
             *     "Placement": {}
             *   },
             *   "ServiceID": "9mnpnzenvg8p8tdbtq4wvbkcz",
             *   "Slot": 1,
             *   "NodeID": "60gvrl6tm78dmak4yl7srz94v",
             *   "Status": {
             *     "Timestamp": "2016-06-07T21:07:31.290032978Z",
             *     "State": "running",
             *     "Message": "started",
             *     "ContainerStatus": {
             *       "ContainerID": "e5d62702a1b48d01c3e02ca1e0212a250801fa8d67caca0b6f35919ebc12f035",
             *       "PID": 677
             *     }
             *   },
             *   "DesiredState": "running",
             *   "NetworksAttachments": [
             *     {
             *       "Network": {
             *         "ID": "4qvuz4ko70xaltuqbt8956gd1",
             *         "Version": {
             *           "Index": 18
             *         },
             *         "CreatedAt": "2016-06-07T20:31:11.912919752Z",
             *         "UpdatedAt": "2016-06-07T21:07:29.955277358Z",
             *         "Spec": {
             *           "Name": "ingress",
             *           "Labels": {
             *             "com.docker.swarm.internal": "true"
             *           },
             *           "DriverConfiguration": {},
             *           "IPAMOptions": {
             *             "Driver": {},
             *             "Configs": [
             *               {
             *                 "Subnet": "10.255.0.0/16",
             *                 "Gateway": "10.255.0.1"
             *               }
             *             ]
             *           }
             *         },
             *         "DriverState": {
             *           "Name": "overlay",
             *           "Options": {
             *             "com.docker.network.driver.overlay.vxlanid_list": "256"
             *           }
             *         },
             *         "IPAMOptions": {
             *           "Driver": {
             *             "Name": "default"
             *           },
             *           "Configs": [
             *             {
             *               "Subnet": "10.255.0.0/16",
             *               "Gateway": "10.255.0.1"
             *             }
             *           ]
             *         }
             *       },
             *       "Addresses": [
             *         "10.255.0.10/16"
             *       ]
             *     }
             *   ],
             *   "AssignedGenericResources": [
             *     {
             *       "DiscreteResourceSpec": {
             *         "Kind": "SSD",
             *         "Value": 3
             *       }
             *     },
             *     {
             *       "NamedResourceSpec": {
             *         "Kind": "GPU",
             *         "Value": "UUID1"
             *       }
             *     },
             *     {
             *       "NamedResourceSpec": {
             *         "Kind": "GPU",
             *         "Value": "UUID2"
             *       }
             *     }
             *   ]
             * }
             */
            slime.external.docker.engine.definitions.Task[];
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $503 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace TaskLogs {
        namespace Parameters {
            /**
             * Show task context and extra details provided to logs.
             */
            export type Details = boolean;
            /**
             * Keep connection after returning logs.
             */
            export type Follow = boolean;
            /**
             * ID of the task
             */
            export type Id = string;
            /**
             * Only return logs since this time, as a UNIX timestamp
             */
            export type Since = number;
            /**
             * Return logs from `stderr`
             */
            export type Stderr = boolean;
            /**
             * Return logs from `stdout`
             */
            export type Stdout = boolean;
            /**
             * Only return this number of log lines from the end of the logs.
             * Specify as an integer or `all` to output all log lines.
             *
             */
            export type Tail = string;
            /**
             * Add timestamps to every log line
             */
            export type Timestamps = boolean;
        }
        export interface PathParameters {
            id: /* ID of the task */ Parameters.Id;
        }
        export interface QueryParameters {
            details?: /* Show task context and extra details provided to logs. */ Parameters.Details;
            follow?: /* Keep connection after returning logs. */ Parameters.Follow;
            stdout?: /* Return logs from `stdout` */ Parameters.Stdout;
            stderr?: /* Return logs from `stderr` */ Parameters.Stderr;
            since?: /* Only return logs since this time, as a UNIX timestamp */ Parameters.Since;
            timestamps?: /* Add timestamps to every log line */ Parameters.Timestamps;
            tail?: /**
             * Only return this number of log lines from the end of the logs.
             * Specify as an integer or `all` to output all log lines.
             *
             */
            Parameters.Tail;
        }
        namespace Responses {
            export type $200 = string; // binary
            export type $404 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $503 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace VolumeCreate {
        export interface BodyParameters {
            volumeConfig: Parameters.VolumeConfig;
        }
        namespace Parameters {
            export type VolumeConfig = /**
             * VolumeConfig
             * Volume configuration
             */
            slime.external.docker.engine.definitions.VolumeCreateOptions;
        }
        namespace Responses {
            export type $201 = slime.external.docker.engine.definitions.Volume;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace VolumeDelete {
        namespace Parameters {
            /**
             * Force the removal of the volume
             */
            export type Force = boolean;
            /**
             * Volume name or ID
             */
            export type Name = string;
        }
        export interface PathParameters {
            name: /* Volume name or ID */ Parameters.Name;
        }
        export interface QueryParameters {
            force?: /* Force the removal of the volume */ Parameters.Force;
        }
        namespace Responses {
            export type $404 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $409 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace VolumeInspect {
        namespace Parameters {
            /**
             * Volume name or ID
             */
            export type Name = string;
        }
        export interface PathParameters {
            name: /* Volume name or ID */ Parameters.Name;
        }
        namespace Responses {
            export type $200 = slime.external.docker.engine.definitions.Volume;
            export type $404 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace VolumeList {
        namespace Parameters {
            /**
             * JSON encoded value of the filters (a `map[string][]string`) to
             * process on the volumes list. Available filters:
             *
             * - `dangling=<boolean>` When set to `true` (or `1`), returns all
             *    volumes that are not in use by a container. When set to `false`
             *    (or `0`), only volumes that are in use by one or more
             *    containers are returned.
             * - `driver=<volume-driver-name>` Matches volumes based on their driver.
             * - `label=<key>` or `label=<key>:<value>` Matches volumes based on
             *    the presence of a `label` alone or a `label` and a value.
             * - `name=<volume-name>` Matches all or part of a volume name.
             *
             */
            export type Filters = string; // json
        }
        export interface QueryParameters {
            filters?: /**
             * JSON encoded value of the filters (a `map[string][]string`) to
             * process on the volumes list. Available filters:
             *
             * - `dangling=<boolean>` When set to `true` (or `1`), returns all
             *    volumes that are not in use by a container. When set to `false`
             *    (or `0`), only volumes that are in use by one or more
             *    containers are returned.
             * - `driver=<volume-driver-name>` Matches volumes based on their driver.
             * - `label=<key>` or `label=<key>:<value>` Matches volumes based on
             *    the presence of a `label` alone or a `label` and a value.
             * - `name=<volume-name>` Matches all or part of a volume name.
             *
             */
            Parameters.Filters /* json */;
        }
        namespace Responses {
            export type $200 = /**
             * VolumeListResponse
             * Volume list response
             */
            slime.external.docker.engine.definitions.VolumeListResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace VolumePrune {
        namespace Parameters {
            /**
             * Filters to process on the prune list, encoded as JSON (a `map[string][]string`).
             *
             * Available filters:
             * - `label` (`label=<key>`, `label=<key>=<value>`, `label!=<key>`, or `label!=<key>=<value>`) Prune volumes with (or without, in case `label!=...` is used) the specified labels.
             * - `all` (`all=true`) - Consider all (local) volumes for pruning and not just anonymous volumes.
             *
             */
            export type Filters = string;
        }
        export interface QueryParameters {
            filters?: /**
             * Filters to process on the prune list, encoded as JSON (a `map[string][]string`).
             *
             * Available filters:
             * - `label` (`label=<key>`, `label=<key>=<value>`, `label!=<key>`, or `label!=<key>=<value>`) Prune volumes with (or without, in case `label!=...` is used) the specified labels.
             * - `all` (`all=true`) - Consider all (local) volumes for pruning and not just anonymous volumes.
             *
             */
            Parameters.Filters;
        }
        namespace Responses {
            /**
             * VolumePruneResponse
             */
            export interface $200 {
                /**
                 * Volumes that were deleted
                 */
                VolumesDeleted?: string[];
                /**
                 * Disk space reclaimed in bytes
                 */
                SpaceReclaimed?: number; // int64
            }
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
    namespace VolumeUpdate {
        export interface BodyParameters {
            body?: /* Volume configuration */ Parameters.Body;
        }
        namespace Parameters {
            /**
             * Volume configuration
             */
            export interface Body {
                Spec?: /**
                 * Cluster-specific options used to create the volume.
                 *
                 */
                slime.external.docker.engine.definitions.ClusterVolumeSpec;
            }
            /**
             * The name or ID of the volume
             */
            export type Name = string;
            /**
             * The version number of the volume being updated. This is required to
             * avoid conflicting writes. Found in the volume's `ClusterVolume`
             * field.
             *
             */
            export type Version = number; // int64
        }
        export interface PathParameters {
            name: /* The name or ID of the volume */ Parameters.Name;
        }
        export interface QueryParameters {
            version: /**
             * The version number of the volume being updated. This is required to
             * avoid conflicting writes. Found in the volume's `ClusterVolume`
             * field.
             *
             */
            Parameters.Version /* int64 */;
        }
        namespace Responses {
            export type $400 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $404 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $500 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
            export type $503 = /**
             * Represents an error.
             * example:
             * {
             *   "message": "Something went wrong."
             * }
             */
            slime.external.docker.engine.definitions.ErrorResponse;
        }
    }
}
