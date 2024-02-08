import { Column, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User } from 'src/controllers/users/entities/user.entity';
import { Chat } from 'src/controllers/chat/entities/chat.entity';

@Entity()
export class Content {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: 'varchar', length: 255, nullable: false })
	text: string;

	@ManyToOne(() => Chat, (chat) => chat.contents, { nullable: false, onDelete: 'CASCADE'})
	chat: Chat;

	@ManyToOne(() => User, (user) => user.contents, { nullable: false, onDelete: 'CASCADE' })
	author: User;

	@Column({ type: 'timestamp without time zone', default: new Date().toLocaleString() })
	createTimeStamp?: Date;

	@Column({ type: 'timestamp without time zone', default: new Date().toLocaleString() })
	updateTimeStamp?: Date;
}
