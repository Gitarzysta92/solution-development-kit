import { Result } from '@sdk/kernel/standard';
import { IIdentityNode } from '@sdk/kernel/ontology/identity';

export interface IIdentityNodeRepository {
  createIfNotExists(node: IIdentityNode): Promise<Result<boolean, Error>>;
  deleteById(id: string): Promise<Result<boolean, Error>>;
}
