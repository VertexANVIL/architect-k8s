import { Result } from '@akim/architect/src';
import { Target, TargetResolveParams } from '@akim/architect/src/target';
import * as api from 'kubernetes-models';
import { KubeResourceComponent } from './component';
import { CrdsComponent } from './components';
import { ClusterFact, ClusterSpec } from './fact';
import { Helm } from './helm';
import { Kustomize } from './kustomize';
import { TypeRegistry } from './types';
import { isValidator } from './utils';
import { KubeWriter } from './writer';
import { ManifestLoader } from './yaml/load';

export interface KubeTargetResolveParams extends TargetResolveParams {};

/**
 * Version of {Target} that provides build constructs for a specific Kubernetes cluster.
 */
export class KubeTarget extends Target {
  public types: TypeRegistry;
  public loader: ManifestLoader;

  public helm: Helm;
  public kustomize: Kustomize;

  constructor(spec: ClusterSpec) {
    super();

    // register our cluster fact
    this.facts.register(ClusterFact, new ClusterFact(spec));

    this.types = new TypeRegistry();
    this.loader = new ManifestLoader(this);

    this.helm = new Helm(this);
    this.kustomize = new Kustomize(this);

    this.components.register(KubeResourceComponent);
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

    const component = new CrdsComponent(this, module);
    this.components.register(CrdsComponent, component);
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

    this.resources.push(namespace);
    return namespace;
  };

  public async resolve(params: KubeTargetResolveParams = {}): Promise<Result> {
    const result = await super.resolve(params) as Result;

    if (params.validate !== false) {
      for (const item of result.all) {
        if (!isValidator(item)) continue;

        try {
          await item.validate();
        } catch (e) {
          console.log(e);
        };
      };
    };

    // set the writer so we can output YAML
    result.writer = new KubeWriter();

    return result;
  };

  public get cluster(): ClusterSpec {
    return this.fact(ClusterFact).instance;
  };

  private get resources(): KubeResourceComponent {
    return this.component(KubeResourceComponent);
  };
};
