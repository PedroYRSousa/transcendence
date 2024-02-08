import { User } from 'src/controllers/users/entities/user.entity';
import { Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Score } from './score.entity';

@Entity()
export class Game {
	@PrimaryGeneratedColumn()
	id: number;

	@ManyToOne(() => User, { nullable: false })
	@JoinTable()
	player1: User;

	@ManyToOne(() => User, { nullable: false })
	@JoinTable()
	player2: User;

	@ManyToOne(() => User, { nullable: true })
	winner: User;

	@OneToMany(() => Score, (score) => score.game)
	@JoinTable()
	scores: Score[];

	@Column({ nullable: false, type: 'integer' })
	timeOfGame: number;

	@Column({ nullable: false, type: 'boolean' })
	woGame: boolean;

	@Column({ nullable: false, type: 'boolean' })
	cancelledGame: boolean;

	@Column({ nullable: false, type: 'boolean' })
	matchmakingGame: boolean;

	@Column({ nullable: false, type: 'boolean' })
	alternativeGame: boolean;

	@Column({ type: 'timestamp without time zone', default: new Date().toLocaleString() })
	createTimeStamp?: Date;

	@Column({ type: 'timestamp without time zone', default: new Date().toLocaleString() })
	updateTimeStamp?: Date;
}
