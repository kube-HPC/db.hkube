import { Id } from './types';

export type Algorithm = {
    id?: Id;
    name: string;
};

export interface AlgorithmsInterface {
    create(name: string): Promise<Id>;
    delete(Id: Id): Promise<Id>;
    fetch(params: { id?: Id; name?: string }): Promise<Algorithm>;
    fetchAll(): Promise<Algorithm[]>;
}
