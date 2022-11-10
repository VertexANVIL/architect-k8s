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
export type ResourceTree = any[] | Record<string, any>;

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
