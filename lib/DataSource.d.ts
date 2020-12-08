import { Id } from './types';

export type FileMeta = {
    id: string;
    name: string;
    /** The file's location in the repository */
    path: string;
    /** Size in bytes */
    size: number;
    /** Mime type */
    type: string;
    /** An extra text content the user can upload per file */
    description?: string;
    uploadedAt: number;
};

export type DataSource = {
    id?: Id;
    /** A hash generated by git for each version */
    versionId: string;
    name: string;
    files: FileMeta[];
    /** A commit message for the description */
    versionDescription: string;
};

export type DataSourceMeta = {
    _id: string;
    name: string;
    versionDescription: string;
    filesCount: number;
    avgFileSize: string;
    totalSize: number;
    fileTypes: string[];
};

export type DataSourceWithMeta = DataSource & DataSourceMeta;

export interface DataSourcesInterface {
    create(props: { name: string }): Promise<DataSource>;
    delete(
        props: { name?: string; id?: string },
        options?: { allowNotFound?: boolean }
    ): Promise<Id | null>;
    fetch(params: {
        id?: Id;
        name?: string;
        version?: string;
    }): Promise<DataSource>;
    fetchAll(): Promise<DataSourceMeta[]>;
    fetchMany(params: { ids?: Id[]; names?: string[] }): Promise<DataSource[]>;
    createVersion(params: {
        name?: string;
        id?: Id;
        versionDescription: string;
    }): Promise<DataSource>;
    uploadFiles(params: {
        name?: string;
        id?: Id;
        versionId: string;
        files: { droppedIds?: string[]; mapping?: FileMeta[] };
    }): Promise<DataSource>;
}
