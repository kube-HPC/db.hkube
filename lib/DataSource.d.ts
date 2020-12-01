import { Id } from './MongoDB/types';

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

export interface DataSourcesInterface {
    create(props: { name: string }): Promise<DataSource>;
    delete(
        props: { name?: string; id?: string },
        options?: { allowNotFound?: boolean }
    ): Promise<Id | null>;
    fetch(params: { id?: Id; name?: string; version?: string }): Promise<DataSource>;
    fetchAll(): Promise<DataSource[]>;
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
