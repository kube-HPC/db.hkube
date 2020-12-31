import { Id } from './MongoDB/types';
import Collection from './MongoDB/Collection';

type Snapshot = {
    id?: Id;
    name: string;
    query: string;
    dataSource: { id: string; name: string };
};

export interface SnapshotsCollection extends Collection<Snapshot>, SnapshotOverrides {
    create(params: Snapshot): Promise<Snapshot>;
}
