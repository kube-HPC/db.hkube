import { PipelinesInterface } from './Pipeline.d';
import { DataSourcesInterface } from './DataSource.d';
import { AlgorithmsInterface } from './MongoDB/Algorithms';

export interface DBInterface {
    init(): Promise<void>;
    close(force?: boolean): Promise<void>;
    isConnected: boolean;
    dataSources: DataSourcesInterface;
    pipelines: PipelinesInterface;
    algorithms: AlgorithmsInterface;
}
