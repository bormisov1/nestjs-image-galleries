import { FindOptionsWhere } from 'typeorm';

export type EntityCondition<T> = FindOptionsWhere<T>;
export type FindOptions<T> = {
  where: EntityCondition<T>[] | EntityCondition<T>;
};
