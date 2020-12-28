import { PipelinesInterface } from './Pipeline';
import { DataSourcesCollection } from './DataSource';
import { AlgorithmsInterface } from './Algorithm';

export interface ProviderInterface {
    init(): Promise<void>;
    close(force?: boolean): Promise<void>;
    isConnected: boolean;
    dataSources: DataSourcesCollection;
    pipelines: PipelinesInterface;
    algorithms: AlgorithmsInterface;
    jobs: AlgorithmsInterface;
    experiments: AlgorithmsInterface;
    tensorboards: AlgorithmsInterface;
    readme: AlgorithmsInterface;
    webhooks: AlgorithmsInterface;
}
