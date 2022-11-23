import * as fs from 'node:fs/promises';
import path from 'node:path';
import { Result, Writer } from '@akim/architect/src';
import * as yaml from 'js-yaml';
import { Resource, resourceId } from './resource';

export class KubeWriter implements Writer {
  public async write(result: Result, dir: string) {
    // one folder per component
    await Promise.all(Object.entries(result.components).map(async ([k, v]) => {
      const rd = path.join(dir, k);
      await fs.rm(rd, { recursive: true, force: true });
      await fs.mkdir(rd, { recursive: true });

      const resources = v.result as Resource[];
      await Promise.all(resources.map(async r => {
        const name = `${resourceId(r)}.yaml`;
        const resource = yaml.dump(r);

        await fs.writeFile(path.join(rd, name), resource);
      }));
    }));

    // write the rest of the resources
  };
};
