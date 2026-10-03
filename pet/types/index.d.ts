export type PetSpecies = 'cat' | 'dog' | 'otter'

declare module 'claude-code' {
  interface PluginState {
    pet: {
      // Which pet is shown.
      species: PetSpecies
      // An activity ('yarn') or a transition between two ('sit>yarn').
      scene: string
      isHidden: boolean
      // How the pet shares a crowded band: drop to its own line ('wrap') or
      // keep its spot and cut the other mods' content short ('shrink').
      layout: 'wrap' | 'shrink'
    }
  }
}
