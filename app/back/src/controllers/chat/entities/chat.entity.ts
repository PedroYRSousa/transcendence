import { Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { User } from 'src/controllers/users/entities/user.entity';
import { Content } from 'src/controllers/content/entities/content.entity';

@Entity()
export class Chat {
	public static readonly SALTS_ROUNDS = 10;

	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: 'text', nullable: false, unique: true })
	name: string;

	@Column({ type: 'boolean', default: true })
	public: boolean;

	@Column({ type: 'boolean', default: false })
	protected: boolean;

	@Column({ type: 'text', select: false, nullable: true })
	password: string | null;

	@Column({ type: 'text', select: false, nullable: true })
	salt: string | null;

	@Column({ type: 'integer', nullable: true })
	owner: number;

	@ManyToMany(() => User, { cascade: true })
	@JoinTable()
	members: User[];

	@OneToMany(() => Content, (content) => content.chat)
	@JoinTable()
	contents: Content[];

	@Column({ type: 'boolean', default: false })
	isDM: boolean;

	@Column({ array: true, type: 'integer', default: [] })
	admins: number[];

	@Column({ array: true, type: 'integer', default: [] })
	mutes: number[];

	@Column({ array: true, type: 'integer', default: [] })
	kicks: number[];

	@Column({ type: 'timestamp without time zone', default: new Date().toLocaleString() })
	createTimeStamp?: Date;

	@Column({ type: 'timestamp without time zone', default: new Date().toLocaleString() })
	updateTimeStamp?: Date;
}
