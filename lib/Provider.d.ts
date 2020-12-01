import { PipelinesInterface } from './Pipeline';
import { DataSourcesInterface } from './DataSource';
import { AlgorithmsInterface } from './Algorithm';

export interface ProviderInterface {
    init(): Promise<void>;
    close(force?: boolean): Promise<void>;
    isConnected: boolean;
    dataSources: DataSourcesInterface;
    pipelines: PipelinesInterface;
    algorithms: AlgorithmsInterface;
    jobs: AlgorithmsInterface;
    experiments: AlgorithmsInterface;
    tensorboards: AlgorithmsInterface;
    readme: AlgorithmsInterface;
    webhooks: AlgorithmsInterface;
}
