import { apiextensionsK8sIo } from 'kubernetes-models';
import { Resource } from '../resource';

/**
 * Represents a group-value-kind unique resource type identifier
 */
export class GVK {
  /**
   * Parses a GVK from a resource model
   */
  public static fromResource(resource: Resource): GVK {
    return GVK.fromAK(resource.apiVersion, resource.kind);
  };

  /**
   * Parses a GVK from a resource apiVersion and kind
   */
  public static fromAK(apiVersion: string, kind: string): GVK {
    const split = apiVersion.split('/');
    const group = split.length <= 1 ? undefined : split[0];
    const version = split.length <= 1 ? split[0] : split[1];

    return new GVK(version, kind, group);
  };

  /**
   * Returns all possible GVKs present by the versions of a CRD
   */
  public static fromCRD(crd: apiextensionsK8sIo.v1.CustomResourceDefinition): GVK[] {
    return crd.spec.versions.map(v => {
      return new GVK(v.name, crd.spec.names.kind, crd.spec.group);
    });
  };

  /**
   * Returns the unique GVKs present in the specified resource array
   */
  public static uniqueGVKs(resources: Resource[]): GVK[] {
    const results: GVK[] = [];
    resources.forEach(r => {
      const gvk = GVK.fromResource(r);
      if (results.findIndex(g => g.compare(gvk)) > -1) return;
      results.push(gvk);
    });

    return results;
  };

  group?: string;
  version: string;
  kind: string;

  constructor(version: string, kind: string, group?: string) {
    this.group = group;
    this.version = version;
    this.kind = kind;
  };

  /**
   * Compares this GVK to another
   */
  public compare(operand: GVK): boolean {
    return this.group === operand.group && this.version === operand.version && this.kind === operand.kind;
  };

  /**
   * Returns whether this GVK is a built-in Kubernetes type
   */
  public isAPIModel(): boolean {
    // TODO: handle exceptions to this rule, like snapshot.storage.k8s.io
    return this.group === undefined || !this.group.includes('.') || this.group.endsWith('.k8s.io');
  };

  public toString(): string {
    let builder = `${this.version}/${this.kind}`;
    if (this.group !== undefined) builder = `${this.group}_` + builder;
    return builder;
  };
};
