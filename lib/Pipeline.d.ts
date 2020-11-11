import { Id } from './types';

export type Pipeline = {
    id?: Id;
    name: string;
};

export interface PipelinesInterface {
    create(props: { name: string }): Promise<Pipeline>;
    delete(props: { name?: string; id?: Id }): Promise<string>;
    fetch(params: { id?: Id; name?: string }): Promise<Pipeline>;
    fetchAll(): Promise<Pipeline[]>;
}
