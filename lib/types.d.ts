import { MongoClientOptions } from 'mongodb';
export type Id = string;

export type MongoConfig = {
    host: string;
    port: number;
    dbName: string;
} & MongoClientOptions;

export type Config = {
    MongoDB?: MongoConfig;
};

export type ProviderName = 'MongoDB';
