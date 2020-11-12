import { Id } from './types';

export type FileMeta = {
    name: string;
    path: string;
    size: number;
    type: string;
};

export type DataSource = {
    id?: Id;
    name: string;
    files: FileMeta[];
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
    updateVersion(params: {
        name?: string;
        id?: Id;
        versionDescription: string;
    }): Promise<DataSource>;
    uploadFiles(params: {
        name?: string;
        id?: Id;
        filesAdded?: FileMeta[];
        filesDropped?: string[];
    }): Promise<DataSource>;
}
