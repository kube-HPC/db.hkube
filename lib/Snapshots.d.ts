import { DataSource } from './DataSource.d';
import { Id } from './MongoDB/types';
import Collection from './MongoDB/Collection';

type Snapshot = {
    id?: Id;
    name: string;
    query: string;
    dataSource: { id: string; name: string };
};

export type ResolvedSnapshot = {
    id: Id;
    name: string;
    query: string;
    dataSource: DataSource;
};

export interface SnapshotsCollection extends Collection<Snapshot>, SnapshotOverrides {
    create(params: Snapshot): Promise<Snapshot>;
    fetchDataSource(params: {
        snapshotName: string;
        dataSourceName: string;
    }): Promise<ResolvedSnapshot>;
}
