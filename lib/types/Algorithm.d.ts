import { Id } from './types';

export type Algorithm = {
    /** Unique identifier representing a specific algorithm */
    name: string;
    env?: 'nodejs' | 'python' | 'java';
    /** Image name as in the docker registry */
    algorithmImage?: string;
    /** Algorithm cpu */
    cpu?: number;
    /** Algorithm gpu */
    gpu?: number;
    /** Algorithm memory */
    mem?: string;
    /**
     * Reserved memory for HKube's operations such as in-memory cache, higher value means faster
     * data retrieval and less algorithm memory, lower value means slower data retrieval and more
     * algorithm memory
     */
    reservedMemory?: string;
    options?: {
        /** Debug algorithm locally */
        debug?: boolean;
        /** Runs algorithm with mounted sources to allow rapid development cycles */
        devMode?: boolean;
        /** Pending algorithm */
        pending?: boolean;
        /** Should algorithm support XGL context creation (mount X socket) */
        opengl?: boolean;
    };
    /** Hkube's auto increment semantic versioning */
    version?: string;
    /** A list of volumes to mount into the algorithm */
    mounts?: {
        /** Name of an existing kubernetes pvc (persistent volume claim) */
        pvcName: string;
        /** The mount path in the algorithm container */
        path: string;
    }[];
    gitRepository?: {
        /** A url for the git repository */
        url: string;
        /** Commit details */
        commit?: {
            /** Commit id */
            id: string;
            /** Commit time */
            timestamp?: string;
            /** Commit message */
            message?: string;
        };
        /** The branch name you wish to create a build from */
        branchName?: string;
        /** A specific tag which will trigger the build */
        tag?: string;
        /**
         * A token which allows hkube's build system to access private repositories more information
         * https://help.github.com/en/articles/creating-a-personal-access-token-for-the-command-line
         */
        token?: string;
        gitKind?: 'github' | 'gitlab';
    };
    entryPoint?: string;
    /** Custom docker image to be used as base to the newly built algorithm image */
    baseImage?: string;
    /** How many live algorithm instances will always run */
    minHotWorkers?: number;
    /** The amount of algorithms required to be scheduled first in a case of cluster pressure */
    quotaGuarantee?: number;
    /** Key value environment variables for algorithm */
    algorithmEnv?: { [key: string]: any };
    /** Key value environment variables for worker */
    workerEnv?: { [key: string]: any };
    /** Key value labels for nodes constraint */
    nodeSelector?: { [key: string]: string };
    /** Type of algorithm code resource */
    type?: 'Git' | 'Code' | 'Image';
    /** The extension name that will be attached to a file when downloading algorithm result */
    downloadFileExt?: string;
};

export interface AlgorithmsInterface {
    create(algorithm: Algorithm): Promise<Algorithm>;
    delete(props: { name?: string }): Promise<string>;
    fetch(params: { name?: string }): Promise<Algorithm>;
    fetchAll(): Promise<Algorithm[]>;
}
