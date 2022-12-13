export class KubeHelpers {
  public static defaultIPFamilyPolicy(families: string[]): string {
    if ('IPv4' in families && 'IPv6' in families) {
      return 'PreferDualStack';
    } else {
      return 'SingleStack';
    };
  };
};
