/*---------------------------------------------------------
 * Copyright (C) Hkube. All rights reserved.
 * AUTO-GENERATED CODE, DO NOT EDIT
 *--------------------------------------------------------*/

export interface Algorithm {
    /** Key value environment variables for algorithm */
    algorithmEnv?: { [key: string]: any };
    /** Image name as in the docker registry */
    algorithmImage?: string;
    /** Custom docker image to be used as base to the newly built algorithm image */
    baseImage?: string;
    /** Algorithm cpu */
    cpu?: number;
    /** The extension name that will be attached to a file when downloading algorithm result */
    downloadFileExt?: string;
    entryPoint?: string;
    env?: Env;
    gitRepository?: GitRepository;
    /** Algorithm gpu */
    gpu?: number;
    /** Algorithm memory */
    mem?: string;
    /** How many live algorithm instances will always run */
    minHotWorkers?: number;
    /** A list of volumes to mount into the algorithm */
    mounts?: Mount[];
    /** Unique identifier representing a specific algorithm */
    name: string;
    /** Key value labels for nodes constraint */
    nodeSelector?: { [key: string]: string };
    options?: Options;
    /** The amount of algorithms required to be scheduled first in a case of cluster pressure */
    quotaGuarantee?: number;
    /**
     * Reserved memory for HKube's operations such as in-memory cache, higher value means faster
     * data retrieval and less algorithm memory, lower value means slower data retrieval and more
     * algorithm memory
     */
    reservedMemory?: string;
    /** Type of algorithm code resource */
    type?: Type;
    /** Hkube's auto increment semantic versioning */
    version?: string;
    /** Key value environment variables for worker */
    workerEnv?: { [key: string]: any };
}

export enum Env {
    Java = 'java',
    Nodejs = 'nodejs',
    Python = 'python',
}

export interface GitRepository {
    /** The branch name you wish to create a build from */
    branchName?: string;
    /** Commit details */
    commit?: Commit;
    gitKind?: GitKind;
    /** A specific tag which will trigger the build */
    tag?: string;
    /**
     * A token which allows hkube's build system to access private repositories more information
     * https://help.github.com/en/articles/creating-a-personal-access-token-for-the-command-line
     */
    token?: string;
    /** A url for the git repository */
    url: string;
}

/** Commit details */
export interface Commit {
    /** Commit id */
    id: string;
    /** Commit message */
    message?: string;
    /** Commit time */
    timestamp?: string;
}

export enum GitKind {
    Github = 'github',
    Gitlab = 'gitlab',
}

export interface Mount {
    /** The mount path in the algorithm container */
    path: string;
    /** Name of an existing kubernetes pvc (persistent volume claim) */
    pvcName: string;
}

export interface Options {
    /** Debug algorithm locally */
    debug?: boolean;
    /** Runs algorithm with mounted sources to allow rapid development cycles */
    devMode?: boolean;
    /** Should algorithm support XGL context creation (mount X socket) */
    opengl?: boolean;
    /** Pending algorithm */
    pending?: boolean;
}

/** Type of algorithm code resource */
export enum Type {
    Code = 'Code',
    Git = 'Git',
    Image = 'Image',
}

export interface AlgorithmsInterface {
    create(algorithm: Algorithm): Promise<Algorithm>;
    delete(props: { name?: string }): Promise<string>;
    fetch(params: { name?: string }): Promise<Algorithm>;
    fetchAll(): Promise<Algorithm[]>;
}
