import { join } from 'path';
import { DataSource } from 'typeorm';

export const databaseProviders = [
	{
		provide: 'DATA_SOURCE',
		useFactory: async () => {
			const dataSource = new DataSource({
				type: 'postgres',
				synchronize: true,
				host: process.env.DATABASE_HOST,
				username: process.env.DATABASE_USER,
				database: process.env.DATABASE_NAME,
				password: process.env.DATABASE_PASSWORD,
				port: parseInt(process.env.DATABASE_PORT, 10),
				entities: [join(__dirname, '..', 'controllers', '**', '*.entity{.ts,.js}')],
			});

			return dataSource.initialize();
		},
	},
];
