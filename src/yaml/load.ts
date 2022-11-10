import fs from 'node:fs/promises';
import { isRecord } from '@akim/architect/src';
import stringify from 'fast-safe-stringify';
import { loadAll } from 'js-yaml';

import { KubeExtension } from '../extension';
import { isResource, Resource } from '../resource';
import { GVK } from '../types';

//export interface ManifestLoadOptions {};

export class ManifestLoader {
  private readonly exn: KubeExtension;

  constructor(exn: KubeExtension) {
    this.exn = exn;
  };

  public async loadString(
    content: string,
    // options: ManifestLoadOptions = {}
  ): Promise<Resource[]> {
    const input = loadAll(content).filter(x => x != null);
    const resources: Resource[] = [];

    for (const object of input) {
      if (!isRecord(object)) {
        throw new Error(`The value is not an object: ${stringify(object)}`);
      };

      if (!isResource(object)) {
        throw new Error(`The value is not a Kubernetes API resource (apiVersion and kind required): ${stringify(object)}`);
      };

      const gvk = GVK.fromResource(object.apiVersion, object.kind);
      const Constructor = await this.exn.types.getConstructor(gvk);
      const resource = Constructor ? new Constructor(object) : object;
      if (!resource) continue;

      resources.push(resource);
    };

    return resources;
  };

  /**
     * Loads a YAML manifest from the specified path.
     *
     * @param path Path to the manifest file to load.
     * @public
     */
  public async loadFile(path: string) {
    const content = await fs.readFile(path, 'utf-8');
    //logger.log(LogLevel.Debug, `File loaded from: ${path}`);

    return this.loadString(content);
  };
};
