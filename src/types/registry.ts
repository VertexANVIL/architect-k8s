import 'ts-node';
// eslint-disable-next-line no-duplicate-imports
import { REGISTER_INSTANCE } from 'ts-node';
import { ResourceConstructor } from '../resource';
import { GVK } from './gvk';

function gvkToPath(gvk: GVK): string {
  let path: string = '';
  if (gvk.group) {
    path += `${gvk.group}/`;
  };

  path += `${gvk.version}/${gvk.kind}`;
  return path;
};

async function tryImport(path: string): Promise<any> {
  try {
    return await import(path);
  } catch {
    return;
  };
};

/**
 * Responsible for registering type definitions for the Kubernetes API and CRDs
 */
export class TypeRegistry {
  private ctorCache: Record<string, ResourceConstructor | null> = {};
  private apiModulePath: string = 'kubernetes-models';
  private crdModulePaths: string[] = [];

  /**
   * Sets the path for Kubernetes API models.
   */
  public setAPIModule(module: string) {
    this.apiModulePath = module;
  };

  /**
   * Appends a module dir to the CRD search path.
   */
  public appendCRDModule(dir: string) {
    this.crdModulePaths.push(dir);
  };

  /**
   * Gets the constructor for a model GVK
   */
  public async getConstructor(gvk: GVK): Promise<ResourceConstructor | null> {
    const path = gvkToPath(gvk);
    const ctor = this.ctorCache[path] ?? this.getAndCacheModule(gvk);
    if (!ctor) return null;

    return ctor;
  };

  private async getAndCacheModule(
    gvk: GVK,
  ): Promise<ResourceConstructor | null> {
    const gvkPath = gvkToPath(gvk);

    // find a matching constructor
    let mod: any;
    let path: string | null = null;

    if (!gvk.isAPIModel()) {
      // CRD, try everything till we find a match
      for (const crdPath of this.crdModulePaths) {
        let tryPath: string;

        // if we're loading via ts-node ensure we append the right dir and extension
        if (process[REGISTER_INSTANCE]) {
          tryPath = `${crdPath}/src/${gvkPath}.ts`;
        } else {
          tryPath = `${crdPath}/lib/${gvkPath}.js`;
        };

        mod = await tryImport(tryPath);
        if (mod) {
          path = tryPath;
        };
      };
    } else {
      // API model, use the API types
      path = `${this.apiModulePath}/${gvkPath}`;
      mod = await tryImport(path);
    };

    // cache failure as well as success
    if (!mod || !mod[gvk.kind] || !path) {
      this.ctorCache[gvkPath] = null;
      return null;
    };

    const ctor = mod[gvk.kind];
    this.ctorCache[gvkPath] = ctor;
    return ctor;
  };
};
