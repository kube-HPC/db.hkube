import { SnapshotsCollection } from './Snapshots.d';
import { PipelinesInterface } from './Pipeline';
import { DataSourcesCollection } from './DataSource';
import { AlgorithmsInterface } from './Algorithm';

export interface ProviderInterface {
    init(): Promise<void>;
    close(force?: boolean): Promise<void>;
    isConnected: boolean;
    dataSources: DataSourcesCollection;
    snapshots: SnapshotsCollection;
    pipelines: PipelinesInterface;
    algorithms: AlgorithmsInterface;
    jobs: AlgorithmsInterface;
    experiments: AlgorithmsInterface;
    tensorboards: AlgorithmsInterface;
    readme: AlgorithmsInterface;
    webhooks: AlgorithmsInterface;
}
