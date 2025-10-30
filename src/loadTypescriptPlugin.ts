let tsPluginPromise: Promise<any> | null = null

export async function loadTypescriptPlugin() {
  if (!tsPluginPromise) {
    tsPluginPromise = import('@babel/plugin-transform-typescript').then(
      (module) => module.default ?? module
    )
  }

  return tsPluginPromise
}
