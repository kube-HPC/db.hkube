import { MongoClientOptions } from 'mongodb';
export type Id = string;

export type MongoConfig = {
    host: string;
    port: number;
} & MongoClientOptions;

export type Config = {
    MongoDB?: MongoConfig;
};

export type Provider = 'MongoDB';
