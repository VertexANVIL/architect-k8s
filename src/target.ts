import { Component, Result, Target, TargetParams, TargetResolveParams } from '@akim/architect/src';
import * as api from 'kubernetes-models';
import wcmatch from 'wildcard-match';
import { FluxCDController, FluxCDMode } from './apply/flux';
import { KubePreludeComponent } from './component';
import { CrdsComponent } from './components';
import { ClusterFact, ClusterSpec } from './fact';
import { Helm } from './helm';
import { Kustomize } from './kustomize';
import { Resource } from './resource';
import { GVK, TypeRegistry } from './types';
import { isValidator } from './utils';
import { KubeWriter } from './writer';
import { ManifestLoader } from './yaml/load';

export interface KubeCRDRequirement {
  exports: GVK[];
  requirements: GVK[];
};

export type KubeCRDRequirements = Record<string, KubeCRDRequirement>;

export interface KubeTargetParams extends TargetParams {
  modes: {
    flux?: FluxCDMode;
  };
};

export interface KubeTargetResolveParams extends TargetResolveParams {};

/**
 * Version of {Target} that provides build constructs for a specific Kubernetes cluster.
 */
export class KubeTarget extends Target {
  declare public readonly params: KubeTargetParams;

  public types: TypeRegistry;
  public loader: ManifestLoader;

  public helm: Helm;
  public kustomize: Kustomize;

  public flux: FluxCDController;

  private readonly markedCRDGVKs: GVK[] = [];
  private readonly markedCRDGroups: string[] = [];

  constructor(spec: Partial<ClusterSpec>, params: KubeTargetParams = {
    modes: {},
  }) {
    super(params);

    // register our cluster fact
    this.facts.register(ClusterFact, new ClusterFact(spec));

    this.types = new TypeRegistry();
    this.loader = new ManifestLoader(this);

    this.helm = new Helm(this);
    this.kustomize = new Kustomize(this);

    this.flux = new FluxCDController(this);

    this.enable(KubePreludeComponent);
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
    this.components.request(CrdsComponent)!.props.$set({ enable: true });
  };

  /**
   * Installs the CRD specified by the GVK, or just marks it as installed.
   * @param gvk The GVK to install the CRD by
   * @param mark Just mark the CRD as present in the cluster, and don't install it
   */
  public enableCRD(gvk: GVK, mark: boolean = false) {
    if (mark === true) {
      this.markedCRDGVKs.push(gvk);
    } else {
      this.component(CrdsComponent).enableGVK(gvk);
    };
  };

  /**
   * Installs the CRDs specified by the group, or just marks them as installed.
   * @param group The group(s) of CRDs to install from the shared repository
   * @param subgroups Whether to add a wildcard rule to match subgroups
   * @param mark Just mark the CRDs as present in the cluster, and don't install them
   */
  public enableCRDGroup(group: string, subgroups: boolean = true, mark: boolean = false) {
    if (mark === true) {
      this.markedCRDGroups.push(group);
    } else {
      this.component(CrdsComponent).enableGroup(group);
    };

    if (subgroups) this.enableCRDGroup(`*.${group}`, false, mark);
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

    this.prelude.push(namespace);
    return namespace;
  };

  private validateCRDRequirements(requirements: KubeCRDRequirements) {
    // build a list of all unique GVKs in the cluster
    const allGVKs: GVK[] = [];
    Object.values(requirements).forEach(v => {
      v.exports.forEach(gvk => {
        if (allGVKs.findIndex(g => g.compare(gvk)) > -1) return;
        allGVKs.push(gvk);
      });
    });

    // validate all exports and requirements
    Object.entries(requirements).forEach(([k, v]) => {
      // validate export uniqueness
      Object.entries(requirements).forEach(([k2, v2]) => {
        if (k === k2) return;
        const both = v.exports.filter(r => v2.exports.findIndex(g => r.compare(g)) > -1);
        if (both.length <= 0) return;

        throw Error(`both components ${k} and ${k2} export CRDs for resources ${both.join(', ')}`);
      });

      // validate requirement validity
      const missing = v.requirements.filter(r => {
        if (r.isAPIModel()) return false;
        if (this.markedCRDGroups.some(g => wcmatch(g)(r.group!))) return false;
        if (this.markedCRDGVKs.some(g => g.compare(r))) return false;

        return allGVKs.findIndex(g => g.compare(r)) <= -1;
      });

      if (missing.length > 0) {
        throw Error(`component ${k} is attempting to use resources missing from cluster ${this.cluster.name}: ${missing.join(', ')}`);
      };
    });
  };

  /**
   * Extracts and returns the GVKs each component exports (by virtue of declaring CRDs)
   * plus the GVKs declared as resources by each component, in order to establish dependencies
   */
  private buildCRDRequirements(result: Result): KubeCRDRequirements {
    function transformCRDs(resources: Resource[]): GVK[] {
      const gvks: GVK[] = [];
      resources.forEach(r => {
        if (r.kind !== 'CustomResourceDefinition') return;
        const crd = r as api.apiextensionsK8sIo.v1.CustomResourceDefinition;
        gvks.push(...GVK.fromCRD(crd));
      });

      return gvks;
    };

    const obj = Object.fromEntries(Object.entries(result.components).map(([k, v]): [string, KubeCRDRequirement] => {
      const resources = v.result as Resource[] ?? [];
      const requirement: KubeCRDRequirement = {
        exports: transformCRDs(resources),
        requirements: GVK.uniqueGVKs(resources),
      };

      return [k, requirement];
    }));

    return obj;
  };

  private processDependencies(result: Result) {
    // check to see what CRDs each component exports
    // validate objects - no two components can export the same GVK
    const crds = this.buildCRDRequirements(result);
    this.validateCRDRequirements(crds);

    // append interdependencies
    Object.entries(crds).forEach(([k, v]) => {
      // find the components that export the CRDs that this one needs
      const dependencies: Component[] = v.requirements.reduce((prev, cur) => {
        let name: string | undefined = undefined;
        for (const [k2, v2] of Object.entries(crds)) {
          const found = v2.exports.filter(e => cur.compare(e));
          if (found.length <= 0) {
            continue;
          } else {
            name = k2;
            break;
          };
        };

        if (name === undefined) return prev;
        const component = result.components[name].component;
        if (prev.indexOf(component) !== -1) return prev;

        return prev.concat(component);
      }, [] as Component[]);

      const component = result.components[k];
      dependencies.forEach(d => {
        // no self-dependencies
        if (d.uuid === component.component.uuid) return;
        if (component.dependencies.indexOf(d) !== -1) return;
        component.dependencies.push(d);
      });
    });
  };

  public async resolve(params: KubeTargetResolveParams = {}): Promise<Result> {
    const result = await super.resolve(params) as Result;

    // process dependencies - introspect for hidden component-component dependencies involving CRDs
    this.processDependencies(result);

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
    result.writer = new KubeWriter(this);

    return result;
  };

  public get cluster(): ClusterSpec {
    return this.fact(ClusterFact).instance;
  };

  private get prelude(): KubePreludeComponent {
    return this.component(KubePreludeComponent);
  };
};
