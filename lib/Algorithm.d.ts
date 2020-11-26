import { Id } from './types';

export type Algorithm = {
    id?: Id;
    name: string;
    // impossible to list all available fields and also to maintain it...
};

export interface AlgorithmsInterface {
    create(name: string): Promise<Algorithm>;
    delete(props: { id?: Id; name?: string }): Promise<string>;
    fetch(params: { id?: Id; name?: string }): Promise<Algorithm>;
    fetchAll(): Promise<Algorithm[]>;
}
