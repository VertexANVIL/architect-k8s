import 'ts-node';
import 'reflect-metadata';
import * as fs from 'node:fs/promises';
import path from 'path';
import { notEmpty, Target } from '@arctarus/architect/src';
import * as fg from 'fast-glob';
import * as api from 'kubernetes-models';
// eslint-disable-next-line no-duplicate-imports
import { REGISTER_INSTANCE } from 'ts-node';
import wcmatch from 'wildcard-match';
import { KubeComponent, KubeComponentGenericResources } from '../../component';
import { GVK } from '../../types';


@Reflect.metadata('name', 'crds')
@Reflect.metadata('uuid', 'bdd8311b-bd6e-4e49-ad8f-eb2b943883dc')
export class CrdsComponent extends KubeComponent {
  private readonly module: string;

  private readonly enabledGroups: string[] = [];
  private readonly enabledGVKs: GVK[] = [];

  constructor(target: Target, module: string) {
    super(target);
    this.module = module;
    this.standardRequirements = false;
  };

  public async build(resources: KubeComponentGenericResources = {}) {
    let mod: any;
    if (process[REGISTER_INSTANCE]) {
      mod = await import(`${this.module}/src/index.ts`);
    } else {
      mod = await import(`${this.module}/lib/index.js`);
    };

    if (!mod || !mod.dir) {
      throw Error('Failed to load the CRD module!');
    };

    const dir = path.resolve(path.join(mod.dir, '../crds'));
    const crds: api.apiextensionsK8sIo.v1.CustomResourceDefinition[] = [];

    const groups = await fs.readdir(dir);
    for (const group of groups) {
      const files = await fg.default([`${dir}/${group}/*.yaml`], {});
      const result: (api.apiextensionsK8sIo.v1.CustomResourceDefinition | null)[] = await Promise.all(files.map(
        async (file): Promise<api.apiextensionsK8sIo.v1.CustomResourceDefinition | null> => {
          const fileResources = await this.target.loader.loadFile(file);
          if (fileResources.length <= 0) return null;

          // this will always be a CRD as our loadFile method loads the model
          const fileResource = fileResources[0] as api.apiextensionsK8sIo.v1.CustomResourceDefinition;

          // check to see if this is enabled, do wildcard matching
          if (this.enabledGroups.some(g => wcmatch(g)(fileResource.spec.group))) return fileResource;

          const gvk = GVK.fromCRD(fileResource);
          if (gvk.some(g => this.enabledGVKs.findIndex(g2 => g2.compare(g)) > -1)) return fileResource;

          // no matches found, this CRD is not enabled
          return null;
        },
      ));

      crds.push(...result.filter(notEmpty));
    };

    resources.result = crds;
    return super.build(resources);
  };

  public enableGroup(group: string) {
    if (this.enabledGroups.includes(group)) return;
    this.enabledGroups.push(group);
  };

  public enableGVK(gvk: GVK) {
    if (this.enabledGVKs.findIndex(g => g.compare(gvk)) > -1) return;
    this.enabledGVKs.push(gvk);
  };
};
