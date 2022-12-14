import * as fs from 'node:fs/promises';
import path from 'node:path';
import { Result, Writer } from '@arctarus/architect/lib';
import * as yaml from 'js-yaml';
import { Resource, resourceId } from './resource';
import { KubeTarget } from './target';

export class KubeWriter implements Writer {
  private readonly target: KubeTarget;

  constructor(target: KubeTarget) {
    this.target = target;
  };

  private async writeFlat(result: Result, dir: string) {
    await Promise.all(Object.entries(result.components).map(async ([k, v]) => {
      const rd = path.join(dir, k);
      await fs.rm(rd, { recursive: true, force: true });
      await fs.mkdir(rd, { recursive: true });

      const resources = v.result as Resource[] ?? [];
      if (resources.length <= 0) return;

      await Promise.all(resources.map(async r => {
        const name = `${resourceId(r)}.yaml`;
        const resource = yaml.dump(r);

        await fs.writeFile(path.join(rd, name), resource);
      }));
    }));
  };

  private async writeFluxCD(result: Result, dir: string) {
    // write all the components
    await this.writeFlat(result, path.join(dir, 'components'));

    // write the cluster dir
    const clusterDir = path.join(dir, 'cluster');
    await fs.mkdir(clusterDir);

    // write kustomization objects
    await Promise.all(Object.values(result.components).map(async (v) => {
      const resource = this.target.flux.componentObject(v, this.target.params.modes.flux!);
      await fs.writeFile(path.join(clusterDir, `${resourceId(resource)}.yaml`), yaml.dump(resource));
    }));
  };

  public async write(result: Result, dir: string) {
    if (this.target.params.modes?.flux) {
      await this.writeFluxCD(result, dir);
    } else {
      await this.writeFlat(result, dir);
    };
  };
};
