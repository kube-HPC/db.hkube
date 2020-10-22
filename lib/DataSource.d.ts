import { Id } from './types';

export type DataSource = {
    id?: Id;
    name: string;
};

export interface DataSourcesInterface {
    init(): void;
    create(name: string): Promise<DataSource>;
    delete(id: Id): Promise<Id>;
    fetch(params: { id?: Id; name?: string }): Promise<DataSource>;
    fetchAll(): Promise<DataSource[]>;
}
