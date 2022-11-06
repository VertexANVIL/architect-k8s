export class GVK {
  public static fromResource(apiVersion: string, kind: string): GVK {
    const split = apiVersion.split('/');
    const group = split.length <= 1 ? undefined : split[0];
    const version = split.length <= 1 ? split[0] : split[1];

    return new GVK(version, kind, group);
  };

  group?: string;
  version: string;
  kind: string;

  constructor(version: string, kind: string, group?: string) {
    this.group = group;
    this.version = version;
    this.kind = kind;
  };
};
