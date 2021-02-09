import { SnapshotsCollection } from './Snapshots.d';
import { PipelinesInterface } from './Pipeline';
import { DataSourcesCollection } from './DataSource';
import { AlgorithmsInterface } from './Algorithm';
import Jobs from './MongoDB/Jobs';
import Experiments from './MongoDB/Experiments';
import TensorBoards from './MongoDB/TensorBoards';
export interface ProviderInterface {
    init(): Promise<void>;
    close(force?: boolean): Promise<void>;
    isConnected: boolean;
    dataSources: DataSourcesCollection;
    snapshots: SnapshotsCollection;
    pipelines: PipelinesInterface;
    algorithms: AlgorithmsInterface;
    jobs: Jobs;
    experiments: Experiments;
    tensorboards: TensorBoards;
    readme: Collection<any>;
    webhooks: Collection<any>;
}
