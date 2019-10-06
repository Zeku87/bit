import { loadConsumer } from '../../../consumer';
import { loadScope, Scope } from '../../../scope';
import { ConsumerNotFound } from '../../../consumer/exceptions';
import logger from '../../../logger/logger';
import SpecsResults from '../../../consumer/specs-results';

export default function testInScope({
  id,
  save,
  verbose, // gets called during CI, verbose is always true
  scopePath,
  directory,
  keep
}: {
  id: string;
  save?: boolean | null | undefined;
  verbose?: boolean | null | undefined;
  scopePath: string;
  directory?: string;
  keep?: boolean;
}): Promise<SpecsResults | null | undefined> {
  logger.debugAndAddBreadCrumb('testInScope', 'id: {id}, scopePath: {scopePath}', { id, scopePath });
  async function loadFromScope(initialError: Error | null | undefined) {
    const getScope = async () => {
      try {
        const scope = await loadScope(scopePath || process.cwd());
        return scope;
      } catch (err) {
        throw new Error(initialError || err);
      }
    };
    const scope: Scope = await getScope();
    const bitId = await scope.getParsedId(id);
    return scope.runComponentSpecs({
      bitId,
      save,
      verbose,
      isolated: true,
      directory,
      keep
    });
  }

  function loadFromConsumer() {
    return loadConsumer().then(consumer => {
      const bitId = consumer.getParsedId(id);
      return consumer.scope.runComponentSpecs({
        consumer,
        bitId,
        save,
        verbose,
        isolated: true
      });
    });
  }

  // @ts-ignore AUTO-ADDED-AFTER-MIGRATION-PLEASE-FIX!
  if (scopePath) return loadFromScope();

  return loadFromConsumer().catch(err => {
    if (!(err instanceof ConsumerNotFound)) throw err;
    return loadFromScope(err);
  });
}