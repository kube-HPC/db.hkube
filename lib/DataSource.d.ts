import { Id } from './types';

export type DataSource = {
    id: Id;
};

export interface DataSourcesInterface {
    create(name: string): Promise<Id>;
    delete(id: Id): Promise<Id>;
    fetch(params: { id?: Id; name?: string }): Promise<DataSource>;
    edit(params: any): Promise<DataSource>;
}
