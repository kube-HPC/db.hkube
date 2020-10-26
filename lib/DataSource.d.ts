import { Id } from './types';

export type DataSource = {
    id?: Id;
    name: string;
};

export interface DataSourcesInterface {
    init(): void;
    create(name: string): Promise<DataSource>;
    delete(id: Id, options?: { allowNotFound?: boolean }): Promise<Id | null>;
    fetch(params: { id?: Id; name?: string }): Promise<DataSource>;
    fetchAll(): Promise<DataSource[]>;
}
