import { ObjectFile, typescript } from 'projen';

function addPropsToTsconfig(file: ObjectFile) {
  file.addOverride('ts-node', { swc: true });
  file.addOverride('compilerOptions.lib', ['ES2022']);
  file.addOverride('compilerOptions.target', 'ES2022');
  file.addOverride('compilerOptions.useDefineForClassFields', false);
};

export function addSharedOptions(project: typescript.TypeScriptProject, app: boolean) {
  project.addGitIgnore('build');

  project.addDeps(
    '@swc/core',
    '@swc/helpers',
    '@arctarus/architect@~0.0.0',
    '@arctarus/architect-k8s@~0.0.0',
    '@arctarus/architect-k8s-crds@~0.0.0',
  );

  project.addDevDeps(
    'crlf',
    'typescript-cp',
    '@types/node',
    '@types/lodash',
  );

  if (app) {
    project.addDeps(
      'kubernetes-models',
      'lodash',
      'reflect-metadata',
      'semver',
      '@kubernetes-models/crd-generate@4.0.3',
      '@kubernetes-models/openapi-generate@0.1.0',
    );

    project.setScript('postInstall', 'patch-package');
  } else {
    project.addPeerDeps(
      'kubernetes-models@4.1.0',
      'lodash',
      'reflect-metadata',
      'patch-package',
      'semver',
      '@arctarus/architect@~0.0.0',
      '@arctarus/architect-k8s@~0.0.0',
      '@arctarus/architect-k8s-crds@~0.0.0',
    );
  };

  // see https://www.darraghoriordan.com/2021/05/18/env-node-r-no-such-file-or-directory
  project.setScript('prepare', 'npx crlf --set=LF node_modules/.bin/tscp');
  project.compileTask.exec('tscp');
  project.watchTask.reset('tsc --build -w & tscp -w');

  project.vscode?.settings.addSetting('files.exclude', {
    '.github': true,
    '.projen': true,
    'lib': true,
    'node_modules': true,
    '.eslintrc.json': true,
    '.mergify.yml': true,
    '.npmignore': true,
    '.gitattributes': true,
    '.gitignore': true,
    'package.json': true,
    'tsconfig.dev.json': true,
    'tsconfig.json': true,
    'yarn.lock': true,
  });

  const tsconfig = project.tryFindObjectFile('tsconfig.json');
  if (tsconfig) addPropsToTsconfig(tsconfig);

  const tsconfigDev = project.tryFindObjectFile('tsconfig.dev.json');
  if (tsconfigDev) addPropsToTsconfig(tsconfigDev);
};
