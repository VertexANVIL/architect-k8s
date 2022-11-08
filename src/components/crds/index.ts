import 'ts-node';
import 'reflect-metadata';
import path from 'path';
import { notEmpty, Target } from '@akim/architect/src';
import { importPath } from '@kosko/require';
import * as fg from 'fast-glob';
import * as api from 'kubernetes-models';
// eslint-disable-next-line no-duplicate-imports
import { REGISTER_INSTANCE } from 'ts-node';
import { KubeComponent } from '../../component';
import { Resource } from '../../resource';


@Reflect.metadata('uuid', 'bdd8311b-bd6e-4e49-ad8f-eb2b943883dc')
export class CrdsComponent extends KubeComponent {
  private readonly module: string;

  constructor(target: Target, module: string) {
    super(target);
    this.module = module;
  };

  public async build(): Promise<Resource[]> {
    let mod: any;
    if (process[REGISTER_INSTANCE]) {
      mod = await importPath(`${this.module}/src/index.ts`);
    } else {
      mod = await importPath(`${this.module}/lib/index.js`);
    };

    if (!mod || !mod.dir) {
      throw Error('Failed to load the CRD module!');
    };

    const dir = path.resolve(path.join(mod.dir, '../crds'));
    const files = await fg.default([`${dir}/**/*.yaml`], {});
    const crds: (api.apiextensionsK8sIo.v1.CustomResourceDefinition | null)[] = await Promise.all(files.map(
      async (file): Promise<api.apiextensionsK8sIo.v1.CustomResourceDefinition | null> => {
        const resources = await this.extension.loader.loadFile(file);
        if (resources.length <= 0) return null;

        // this will always be a CRD as our loadFile method loads the model
        return resources[0] as api.apiextensionsK8sIo.v1.CustomResourceDefinition;
      },
    ));

    return crds.filter(notEmpty);
  };
};
