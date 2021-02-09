import { FileMeta } from './DataSource';
import { DataSource, DataSourceWithCredentials } from './DataSource.d';
import { Id } from './MongoDB/types';
import Collection from './MongoDB/Collection';

type Snapshot = {
    id?: Id;
    name: string;
    query: string;
    filteredFilesList?: FileMeta[];
    droppedFiles?: FileMeta[];
    dataSource: { id: string; name: string };
};

export type ResolvedSnapshot = Snapshot & {
    id: Id;
    dataSource: DataSource;
};

export type ResolvedSnapshotWithCredentials = Snapshot & {
    dataSource: DataSourceWithCredentials;
};

export interface SnapshotsCollection extends Collection<Snapshot> {
    create(params: Snapshot, setting: { applyId?: boolean }): Promise<Snapshot>;
    fetchDataSource(params: {
        snapshotName: string;
        dataSourceName: string;
    }): Promise<ResolvedSnapshot>;
    fetchDataSourceWithCredentials(params: {
        snapshotName: string;
        dataSourceName: string;
    }): Promise<ResolvedSnapshotWithCredentials>;
    updateFilesList(props: {
        id: string;
        filesList: FileMeta[];
        droppedFiles: FileMeta[];
    }): Promise<boolean>;
}
