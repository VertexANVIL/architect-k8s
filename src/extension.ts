import 'reflect-metadata';
import { Target } from '@akim/architect/src';

import { Helm } from './helm';
import { TypeRegistry } from './types/registry';
import { ManifestLoader } from './yaml/load';

/**
 * Architect extension for Kubernetes
 */
@Reflect.metadata('uuid', '049c04ed-1fee-4e50-b43b-4ef45488274f')
export class KubeExtension {
  /* tslint:disable:no-unused-variable */
  public readonly target: Target;

  public types: TypeRegistry;
  public loader: ManifestLoader;

  public helm: Helm;

  constructor(target: Target) {
    this.target = target;

    this.types = new TypeRegistry();
    this.loader = new ManifestLoader(this);

    this.helm = new Helm(this);
  };
};
