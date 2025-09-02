// import { create } from 'zustand'
// import { persist } from 'zustand/middleware'

// const useGameSettingsStore = create(
//   persist(
//     (set) => ({
//       randomOrder: true,
//       includePerfect: true,

//       setRandomOrder: (value) => set({ randomOrder: value }),
//       setIncludePerfect: (value) => set({ includePerfect: value }),
//     }),
//     {
//       name: 'game-settings', // chave no localStorage
//     }
//   )
// )

// export default useGameSettingsStore

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useGameSettingsStore = create(
  persist(
    (set) => ({
      randomOrder: true,
      includePerfect: true,
      limit: 0,

      setRandomOrder: (value) => set({ randomOrder: value }),
      setIncludePerfect: (value) => set({ includePerfect: value }),
      setLimit: (value) => set({ limit: value }),
    }),
    {
      name: 'game-settings', // chave no localStorage
    }
  )
)

export default useGameSettingsStore
