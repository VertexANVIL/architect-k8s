import { importPath } from '@kosko/require';
import { Resource, ResourceKind } from '../resource';

/**
 * @public
 */
export interface ResourceModule {
    readonly path: string;
    readonly export: string;
}

export type ResourceConstructor = new (data: Resource) => Resource;
let moduleMap: Record<string, Record<string, ResourceModule>> = {};

function getGroup(apiVersion: string): string {
    const arr = apiVersion.split("/");
    return arr.length === 1 ? "" : arr[0];
}

/**
 * @public
 */
 export function setResourceModule(
    res: ResourceKind,
    mod: ResourceModule
): void {
    const { apiVersion, kind } = res;
  
    if (!moduleMap[apiVersion]) {
      moduleMap[apiVersion] = {};
    }
  
    moduleMap[apiVersion][kind] = mod;
}

async function getKubernetesModels(
    res: ResourceKind
): Promise<ResourceModule | undefined> {
    const { apiVersion, kind } = res;
    const group = getGroup(apiVersion);
  
    if (group && group.includes(".") && !group.endsWith(".k8s.io")) {
        return;
    }
  
    try {
        const path = `kubernetes-models/${apiVersion}/${kind}`;
        const mod = await importPath(path);
        const ctor = mod[kind];
    
        if (ctor) {
            const mod: ResourceModule = { path, export: kind };
            setResourceModule(res, mod);
            return mod;
        }
    } catch {
        return;
    }

    return;
}

/**
 * @public
 */
export async function getResourceModule(
    res: ResourceKind
): Promise<ResourceModule | undefined> {
    return (
        moduleMap[res.apiVersion]?.[res.kind] ?? (await getKubernetesModels(res))
    );
}

/**
 * @public
 */
export function resetResourceModules(): void {
    moduleMap = {};
    //logger.log(LogLevel.Debug, "Reset resource modules");
}

export async function getResourceConstructor(
    value: ResourceKind
): Promise<ResourceConstructor | undefined> {
    const mod = await getResourceModule(value);
    if (!mod) {
        // logger.log(LogLevel.Debug, "No resource modules", {
        //     data: res
        //   });
        return;
    };

    try {
        const result = await importPath(mod.path);
        return result[mod.export];
    } catch {
        // logger.log(LogLevel.Debug, "Failed to import the resource module", {
        //     data: mod
        // });
        return;
    };
};
