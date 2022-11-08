import 'reflect-metadata';
import { Target } from '@akim/architect/src';
import * as api from 'kubernetes-models';

import { ClusterFact, ClusterSpec } from './cluster';
import { Helm } from './helm';
import { Resource } from './resource';
import { TypeRegistry } from './types/registry';
import { ManifestLoader } from './yaml/load';
import { CrdsComponent } from './components/crds';

/**
 * Architect extension for Kubernetes.
 * Ensure this is registered against the Target before creating components.
 */
@Reflect.metadata('uuid', '049c04ed-1fee-4e50-b43b-4ef45488274f')
export class KubeExtension {
  /* tslint:disable:no-unused-variable */
  public readonly target: Target;
  public readonly fact: ClusterFact;

  public types: TypeRegistry;
  public loader: ManifestLoader;

  public helm: Helm;

  constructor(target: Target, fact: ClusterFact) {
    this.target = target;
    this.fact = fact;

    // automatically registers the fact and ourselves against the target
    this.target.facts.register(ClusterFact, fact);
    this.target.extensions.register(KubeExtension, this);

    this.types = new TypeRegistry();
    this.loader = new ManifestLoader(this);

    this.helm = new Helm(this);
    this.createDefaultResources();

    // register the CRD module
    this.registerCRDs('@akim/architect-k8s-crds');
  };

  private createDefaultResources() {
    this.createNamespace(this.cluster.ns?.features!);
    this.createNamespace(this.cluster.ns?.operators!);
    this.createNamespace(this.cluster.ns?.services!);
  };

  private registerCRDs(module: string) {
    this.types.appendCRDModule(module);

    const component = new CrdsComponent(this.target, module);
    this.target.components.register(CrdsComponent, component);
  };

  /**
   * Creates a new namespace and returns it
   */
  public createNamespace(name: string): api.v1.Namespace {
    const namespace = new api.v1.Namespace({
      metadata: {
        name: name,
      },
    });

    this.target.append(namespace);
    return namespace;
  };

  /**
   * Extension of Target.resolve() which validates Kubernetes resources
   */
  public async resolve(): Promise<Resource[]> {
    return await this.target.resolve() as Resource[];
  };

  public get cluster(): ClusterSpec {
    return this.fact.instance;
  };
};
