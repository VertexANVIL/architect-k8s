import { CapabilityMatcher, Component, ComponentArgs, ComponentMatcher, IComponentMatcher, Target } from '@akim/architect/src';
import _ from 'lodash';
import { CNICapability, DNSCapability } from './capabilities';

import { ClusterFact, ClusterSpec } from './fact';
import { Helm, HelmChartOpts } from './helm';
import { Kustomize, KustomizeOpts } from './kustomize';
import { Resource } from './resource';
import { KubeTarget } from './target';
import { defaultNamespace, fixupResource, normaliseResources } from './utils';

export interface KubeComponentArgs extends ComponentArgs {};
export interface KubeComponentGenericResources {
  result?: Resource[];
};

export abstract class KubeComponent<
  TResult extends object = KubeComponentGenericResources,
  TArgs extends KubeComponentArgs = KubeComponentArgs,
  TParent extends Component = any
> extends Component<TResult, TArgs, TParent> {
  declare protected readonly target: KubeTarget;

  /**
   * Whether to enable adding standard requirements such as CNI and DNS
   */
  protected standardRequirements = true;

  constructor(target: Target, props: TArgs = {} as TArgs, name?: string, parent?: TParent) {
    super(target, props, name, parent);
  };

  /**
   * Returns the default set of requirements.
   */
  public get requirements(): IComponentMatcher[] {
    const def: IComponentMatcher[] = this.standardRequirements ? [
      new CapabilityMatcher(CNICapability),
      new CapabilityMatcher(DNSCapability),
    ] : [];

    return def.concat([
      new ComponentMatcher(KubePreludeComponent),
    ]);
  };

  /**
   * Returns the default namespace for all resources within this Component.
   * If not set, this will default to the "default" namespace.
   */
  public get namespace(): string {
    return 'default';
  };

  public async build(result?: TResult): Promise<TResult> {
    result = await super.build(result);

    // properly namespace resources, because postBuild doesn't run for children individually
    const resources = normaliseResources(result);
    resources.forEach(r => defaultNamespace(r, this.namespace));

    return result;
  };

  public postBuild(data: any) {
    // run post-build resource fixup at the top level
    let resources = normaliseResources(data);
    resources = resources.map(obj => {
      obj = fixupResource(obj);
      return obj;
    });

    return super.postBuild(resources);
  };

  protected get cluster(): ClusterSpec {
    return this.target.fact(ClusterFact).instance;
  };

  // helper accessors for extension fields
  protected get helm(): Helm {
    return this.target.helm;
  };

  protected get kustomize(): Kustomize {
    return this.target.kustomize;
  };

  /**
   * Wrapper for Helm.template that inserts our default namespace and configuration
   */
  protected async helmTemplate(chart: string, values: any, config: HelmChartOpts, filter?: (v: Resource) => boolean): Promise<Resource[]> {
    config = _.merge({
      namespace: this.namespace,
      kubeVersion: this.cluster.version,
      includeCRDs: true,
      noHooks: true,
      skipTests: true,
    } as Partial<HelmChartOpts>, config);

    let result = await this.helm.template(chart, values, config);
    if (filter !== undefined) result = result.filter(filter);

    return result;
  };

  /**
   * Wrapper for Kustomize.build
   */
  protected async kustomizeBuild(dir: string, config: KustomizeOpts = {}): Promise<Resource[]> {
    return this.kustomize.build(dir, config);
  };
};

export class KubeResourceComponentOptions {
  resources: Resource[] = [];
};

@Reflect.metadata('name', 'prelude')
@Reflect.metadata('uuid', '526f5de2-73b3-40f9-a88d-6eac3bb014b8')
export class KubePreludeComponent extends KubeComponent {
  private readonly resources: Resource[] = [];

  public async build(resources: KubeComponentGenericResources = {}) {
    resources.result = this.resources;
    return super.build(resources);
  };

  public push(...items: Resource[]) {
    this.resources.push(...items);
  };

  public get requirements(): IComponentMatcher[] {
    return [];
  };
};
