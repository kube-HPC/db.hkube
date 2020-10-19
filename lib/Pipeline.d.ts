import { Id } from './types';

export type Pipeline = {
    id?: Id;
    name: string;
};

export interface PipelinesInterface {
    create(name: string): Promise<Id>;
    delete(id: Id): Promise<Id>;
    fetch(params: { id?: Id; name?: string }): Promise<Pipeline>;
    fetchAll(): Promise<Pipeline[]>;
    edit(params: any): Promise<Pipeline>;
}
