import { Id } from './types';

export type Pipeline = {
    id: Id;
};

export interface PipelinesInterface {
    create(name: string): Promise<Id>;
    delete(id: Id): Promise<Id>;
    fetch(params: { id?: Id; name?: string }): Promise<Pipeline>;
    edit(params: any): Promise<Pipeline>;
}
