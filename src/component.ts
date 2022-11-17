import { CapabilityMatcher, Component, Target } from '@akim/architect/src';
import { IComponentMatcher } from '@akim/architect/src/component';
import _ from 'lodash';
import { CNICapability, DNSCapability } from './capabilities';

import { ClusterFact, ClusterSpec } from './cluster';
import { KubeExtension } from './extension';
import { Helm, HelmChartOpts } from './helm';
import { Kustomize, KustomizeOpts } from './kustomize';
import { Resource, ResourceTree } from './resource';
import { defaultNamespace, fixupResource, normaliseResources } from './utils';

export abstract class KubeComponent<TArgs extends object = any> extends Component<TArgs> {
  constructor(target: Target, name?: string, props?: TArgs) {
    super(target, name, props);

    if (!this.extension) {
      throw Error('The Kubernetes extension must be registered against the current Target before components may be created.');
    };

    if (!this.cluster) {
      throw Error('The Kubernetes cluster fact does not seem to be registered. Please ensure the extension has been initialised correctly.');
    };
  };

  /**
   * Returns the default set of requirements.
   */
  public get requirements(): IComponentMatcher[] {
    return [
      new CapabilityMatcher(CNICapability),
      new CapabilityMatcher(DNSCapability),
    ];
  };

  /**
   * Returns the default namespace for all resources within this Component.
   * If not set, this will default to the "default" namespace.
   */
  public get namespace(): string {
    return 'default';
  }

  public abstract build(): Promise<ResourceTree>

  public postBuild(data: ResourceTree) {
    let resources = normaliseResources(data);

    // apply the default namespace to all our objects
    resources = resources.map(obj => {
      obj = defaultNamespace(obj, this.namespace);
      obj = fixupResource(obj);
      return obj;
    });

    return super.postBuild(resources);
  }

  protected get cluster(): ClusterSpec {
    return this.target.fact(ClusterFact).instance;
  };

  protected get extension(): KubeExtension {
    return this.target.extension(KubeExtension);
  };

  // helper accessors for extension fields
  protected get helm(): Helm {
    return this.extension.helm;
  };

  protected get kustomize(): Kustomize {
    return this.extension.kustomize;
  };

  /**
   * Wrapper for Helm.template that inserts our default namespace and configuration
   */
  protected async helmTemplate(chart: string, values: any, config: HelmChartOpts): Promise<Resource[]> {
    config = _.merge({
      namespace: this.namespace,
      kubeVersion: this.cluster.version,
      skipTests: true,
    }, config);

    return this.helm.template(chart, values, config);
  };

  /**
   * Wrapper for Kustomize.build
   */
  protected async kustomizeBuild(dir: string, config: KustomizeOpts = {}): Promise<Resource[]> {
    return this.kustomize.build(dir, config);
  };
};
