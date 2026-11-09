import {
  render as testingLibraryRender,
  type RenderOptions,
} from '@testing-library/react'
import type { ReactElement } from 'react'

import { AppDataProvider } from '#/features/dashboard/context/AppDataContext'

function render(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return testingLibraryRender(ui, {
    wrapper: AppDataProvider,
    ...options,
  })
}

export * from '@testing-library/react'
export { render }
