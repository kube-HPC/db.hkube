export type Id = string;

export type Config = {
    MongoDB?: {
        host: string;
        port: number;
        userName: string;
        userPassword: string;
        ssl: boolean;
    };
};

export type Provider = 'MongoDB';
