import { IObjectMeta } from '@kubernetes-models/apimachinery/apis/meta/v1/ObjectMeta';

/**
 * Represents the full API kind of a Kubernetes API resource
 */
export interface ResourceKind {
  apiVersion: string;
  kind: string;
};

/**
 * Represents a full Kubernetes API object
 */
export interface Resource extends ResourceKind {
  metadata?: IObjectMeta;
  spec?: any;
};

/**
 * Resource with unknown optional keys
 */
export interface UnkResource extends Resource {
  [key: string]: unknown;
};

/**
 * Represents the constructor of a resource
 */
export type ResourceConstructor = new (data: Resource) => Resource;

/**
 * Represents a recursive set or map of resources
 */
export type ResourceTree = Resource | Resource[] | Record<string, Resource>;

/**
 * Returns whether this anonymous value is a resource
 */
export function isResource(value: Record<string, unknown>): value is UnkResource {
  return (
    typeof value.apiVersion === 'string' &&
        !!value.apiVersion &&
        typeof value.kind === 'string' &&
        !!value.kind
  );
};

/**
 * Returns the cluster-unique resource identifier of the specified resource
 */
export function resourceId(data: Resource): string {
  const builder: string[] = [];
  const components = [data.apiVersion, data.kind, data.metadata?.namespace, data.metadata?.name!];
  components.forEach(c => {
    if (c === undefined || c === null) return;
    builder.push(c.toLowerCase().replace('/', '_'));
  });

  return builder.join('.');
};
