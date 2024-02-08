import { Content } from 'src/controllers/content/entities/content.entity';
import { Entity, Column, ManyToMany, JoinTable, OneToMany } from 'typeorm';

@Entity()
export class User {
	@Column({ nullable: false, primary: true, type: 'integer' })
	id?: number;

	@Column({ nullable: false, type: 'varchar', length: 255, unique: true })
	email: string;

	@Column({ type: 'varchar', nullable: true })
	image: string | null;

	@Column({ nullable: false, type: 'varchar', length: 255 })
	displayName: string;

	@Column({ type: 'varchar', nullable: true, default: null })
	secret: string | null;

	@Column({ type: 'boolean', default: false })
	twoFactor: boolean;

	@ManyToMany(() => User, (user) => user._friends)
	@JoinTable()
	friends: User[];
	@ManyToMany(() => User, (user) => user.friends, { cascade: true })
	_friends: User[];

	@ManyToMany(() => User, (user) => user._blocks)
	@JoinTable()
	blocks: User[];
	@ManyToMany(() => User, (user) => user.blocks, { cascade: true })
	_blocks: User[];

	@OneToMany(() => Content, (content) => content.author, { cascade: true })
	contents: Content[];

	@Column({ type: 'integer', default: 0 })
	scoreGeral: number;

	@Column({ type: 'timestamp without time zone', default: new Date().toLocaleString() })
	createTimeStamp?: Date;

	@Column({ type: 'timestamp without time zone', default: new Date().toLocaleString() })
	updateTimeStamp?: Date;
}
