import { PipelinesInterface } from './Pipeline';
import { DataSourcesInterface } from './DataSource';
import { AlgorithmsInterface } from './algorithms/Algorithm';

export interface ProviderInterface {
    init(): Promise<void>;
    close(force?: boolean): Promise<void>;
    isConnected: boolean;
    dataSources: DataSourcesInterface;
    pipelines: PipelinesInterface;
    algorithms: AlgorithmsInterface;
}
