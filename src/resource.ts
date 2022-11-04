import { IObjectMeta } from "@kubernetes-models/apimachinery/apis/meta/v1/ObjectMeta";

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
  [key: string]: unknown;
};
