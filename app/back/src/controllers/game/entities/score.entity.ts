import { User } from 'src/controllers/users/entities/user.entity';
import { Column, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Game } from './game.entity';

@Entity()
export class Score {
	@PrimaryGeneratedColumn()
	id: number;

	@ManyToOne(() => User, { nullable: false })
	player: User;

	@ManyToOne(() => Game, { nullable: false, onDelete: 'CASCADE' })
	game: Game;

	@Column({ type: 'integer', nullable: false })
	value: number;

	@Column({ type: 'timestamp without time zone', default: new Date().toLocaleString() })
	createTimeStamp?: Date;

	@Column({ type: 'timestamp without time zone', default: new Date().toLocaleString() })
	updateTimeStamp?: Date;
}
