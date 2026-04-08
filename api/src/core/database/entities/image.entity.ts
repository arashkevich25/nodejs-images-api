import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('images')
export class Image extends BaseEntity {
  @Column()
  title: string;

  @Column()
  url: string;

  @Column('int')
  width: number;

  @Column('int')
  height: number;
}
